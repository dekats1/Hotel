// ==============================================
// PROFILE.JS - Управление профилем пользователя
// ==============================================

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');
const avatarInput = document.getElementById('avatarInput');
const passwordModal = document.getElementById('passwordModal');
const passwordForm = document.getElementById('passwordForm');

const API_BASE_URL = '/api';
const USER_DATA_KEY = 'user_data';

let currentUser = null;

// ==============================================
// STORAGE FUNCTIONS
// ==============================================

function getUserDataFromStorage() {
    try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data from storage:', error);
        return null;
    }
}

function saveUserDataToStorage(userData) {
    try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data to storage:', error);
    }
}

function updateUserDataInStorage(updatedData) {
    try {
        const currentData = getUserDataFromStorage();
        const newData = { ...currentData, ...updatedData };
        saveUserDataToStorage(newData);
        return newData;
    } catch (error) {
        console.error('Error updating user data in storage:', error);
        return null;
    }
}

function removeAuthData() {
    localStorage.removeItem(USER_DATA_KEY);
}

// ==============================================
// API FUNCTIONS
// ==============================================

async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include', // ✅ ВАЖНО: включаем Cookie
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    if (response.status === 401) {
        removeAuthData();
        showNotification('Сессия истекла или требуется авторизация', 'error');
        setTimeout(() => {
            //window.location.href = '/login';
        }, 1000);
        throw new Error('Требуется авторизация');
    }

    if (response.status === 403) {
        showNotification('Доступ запрещен', 'error');
        throw new Error('Доступ запрещен');
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorText = `Ошибка: ${response.status}`;

        if (contentType && contentType.includes('application/json')) {
            try {
                const errorData = await response.json();
                errorText = errorData.message || errorText;
            } catch (e) {
                errorText = await response.text() || errorText;
            }
        } else {
            errorText = await response.text() || errorText;
        }

        throw new Error(errorText);
    }

    if (response.status === 204) {
        return null;
    }

    return await response.json();
}

async function loadUserData() {

    currentUser = getUserDataFromStorage();
    if (currentUser) {
        updateUserInterface();
    }

    try {
        // Загружаем свежие данные с сервера
        const data = await apiCall('/users/profile');
        currentUser = transformUserData(data);

        // Обновляем localStorage
        const userBasicData = {
            id: currentUser.id,
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: data.role || 'USER'
        };
        saveUserDataToStorage(userBasicData);

        updateUserInterface();

    } catch (error) {
        console.error('Failed to load user data:', error);

        // Если ошибка 401 - перенаправляем на логин
        if (error.message.includes('Требуется авторизация')) {
            console.warn('Authentication required, redirecting to login...');
            removeAuthData();
            //window.location.href = '/login';
        } else {
            showNotification('Ошибка загрузки данных профиля: ' + error.message, 'error');
        }
    }
}

function transformUserData(apiData) {
    return {
        id: apiData.id,
        name: `${apiData.firstName} ${apiData.lastName}`,
        firstName: apiData.firstName,
        lastName: apiData.lastName,
        middleName: apiData.middleName || '',
        email: apiData.email,
        phone: apiData.phone,
        birthDate: apiData.birthDate,
        gender: apiData.gender?.toLowerCase() || 'male',
        wallet: apiData.balance ? Number(apiData.balance) : 0,
        avatar: apiData.avatarUrl || '👤',
        stats: {
            bookings: apiData.totalBookings || 0,
            rating: apiData.averageRating || 4.9,
            yearsWithUs: apiData.membershipYears || 1
        }
    };
}

async function updateProfileOnBackend(profileData) {
    const requestData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        middleName: profileData.middleName,
        email: profileData.email,
        phone: profileData.phone,
        birthDate: profileData.birthDate,
        gender: profileData.gender.toUpperCase()
    };

    const data = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(requestData)
    });

    return transformUserData(data);
}

async function changePasswordOnBackend(passwordData) {
    await apiCall('/users/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData)
    });
}

// ==============================================
// INITIALIZE
// ==============================================

function initializeProfile() {
    // Mobile navigation
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Form submissions
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalFormSubmit);
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordFormSubmit);
    }

    // Password strength indicator
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }

    // Notification toggles
    setupNotificationToggles();
}

// ==============================================
// NAVIGATION
// ==============================================

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

// ==============================================
// PROFILE EDITING
// ==============================================

function editPersonalInfo() {
    const form = document.getElementById('personalForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    const editBtn = document.querySelector('.card-header .btn-primary');
    const formActions = form.querySelector('.form-actions');

    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.disabled = false;
    });

    if (formActions) {
        formActions.style.display = 'flex';
    }

    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
        editBtn.onclick = () => form.dispatchEvent(new Event('submit'));
    }
}

function cancelEdit() {
    const form = document.getElementById('personalForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    const editBtn = document.querySelector('.card-header .btn-primary');
    const formActions = form.querySelector('.form-actions');

    updateFormFields();

    inputs.forEach(input => {
        input.setAttribute('readonly', 'readonly');
        if (input.tagName === 'SELECT') {
            input.disabled = true;
        }
    });

    if (formActions) {
        formActions.style.display = 'none';
    }

    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Редактировать';
        editBtn.onclick = editPersonalInfo;
    }
}

async function handlePersonalFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const updatedData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        middleName: formData.get('middleName') || '',
        email: formData.get('email'),
        phone: formData.get('phone'),
        birthDate: formData.get('birthDate'),
        gender: formData.get('gender')
    };

    if (!updatedData.firstName || !updatedData.lastName || !updatedData.email) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }

    if (!isValidEmail(updatedData.email)) {
        showNotification('Пожалуйста, введите корректный email', 'error');
        return;
    }

    try {
        const updatedUser = await updateProfileOnBackend(updatedData);
        Object.assign(currentUser, updatedUser);

        const updatedBasicData = {
            firstName: updatedData.firstName,
            lastName: updatedData.lastName,
            email: updatedData.email
        };
        updateUserDataInStorage(updatedBasicData);

        updateUserInterface();
        showNotification('Профиль успешно обновлен!', 'success');
        cancelEdit();
    } catch (error) {
        showNotification('Ошибка обновления профиля: ' + error.message, 'error');
    }
}

// ==============================================
// AVATAR MANAGEMENT
// ==============================================

function changeProfilePhoto() {
    if (avatarInput) {
        avatarInput.click();
    }
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('Пожалуйста, выберите изображение', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Размер файла не должен превышать 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const profileAvatar = document.getElementById('profileAvatar');
        const avatarPlaceholder = profileAvatar?.querySelector('.avatar-placeholder');

        if (avatarPlaceholder) {
            avatarPlaceholder.innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
        }

        currentUser.avatar = e.target.result;

        const userData = getUserDataFromStorage();
        if (userData) {
            userData.avatar = e.target.result;
            saveUserDataToStorage(userData);
        }

        updateUserInterface();
        showNotification('Фото профиля успешно обновлено!', 'success');
    };
    reader.readAsDataURL(file);
}

// ==============================================
// PASSWORD MANAGEMENT
// ==============================================

function changePassword() {
    if (passwordModal) {
        passwordModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closePasswordModal() {
    if (passwordModal) {
        passwordModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        passwordForm.reset();
        updatePasswordStrength();
    }
}

async function handlePasswordFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const passwordData = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword')
    };

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    if (passwordData.newPassword.length < 6) {
        showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    try {
        await changePasswordOnBackend(passwordData);
        showNotification('Пароль успешно изменен!', 'success');
        closePasswordModal();
    } catch (error) {
        showNotification('Ошибка смены пароля: ' + error.message, 'error');
    }
}

function updatePasswordStrength() {
    const passwordInput = document.getElementById('newPassword');
    const strengthIndicator = document.getElementById('passwordStrength');

    if (!passwordInput || !strengthIndicator) return;

    const password = passwordInput.value;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    strengthIndicator.className = 'password-strength';

    if (password.length === 0) {
        strengthIndicator.style.width = '0%';
    } else if (strength <= 2) {
        strengthIndicator.classList.add('weak');
        strengthIndicator.style.width = '33%';
    } else if (strength <= 3) {
        strengthIndicator.classList.add('medium');
        strengthIndicator.style.width = '66%';
    } else {
        strengthIndicator.classList.add('strong');
        strengthIndicator.style.width = '100%';
    }
}

// ==============================================
// ADDITIONAL FEATURES
// ==============================================

function setup2FA() {
    showNotification('Функция двухфакторной аутентификации будет добавлена позже', 'info');
}

function viewLoginHistory() {
    showNotification('История входов будет доступна в следующей версии', 'info');
}

function setupNotificationToggles() {
    const toggles = document.querySelectorAll('.switch input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function () {
            const setting = this.closest('.notification-item').querySelector('span').textContent;
            const isEnabled = this.checked;
            showNotification(`${setting} ${isEnabled ? 'включено' : 'отключено'}`, 'info');
        });
    });
}

// ==============================================
// UPDATE UI
// ==============================================

function updateUserInterface() {
    if (!currentUser) return;

    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const userName = document.getElementById('userName');
    const userWallet = document.getElementById('userWallet');
    const userAvatar = document.getElementById('userAvatar');

    if (profileName) profileName.textContent = currentUser.name;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (userName) userName.textContent = currentUser.name;
    if (userWallet) userWallet.textContent = currentUser.wallet ? currentUser.wallet.toLocaleString() + '₽' : '0₽';

    const updateAvatar = (element) => {
        if (!element) return;
        if (currentUser.avatar && currentUser.avatar.startsWith('data:')) {
            element.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar">`;
        } else {
            element.innerHTML = '<i class="fas fa-user"></i>';
        }
    };

    if (profileAvatar) {
        const avatarPlaceholder = profileAvatar.querySelector('.avatar-placeholder');
        updateAvatar(avatarPlaceholder);
    }
    updateAvatar(userAvatar);

    if (currentUser.stats) {
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = currentUser.stats.bookings || 0;
            statNumbers[1].textContent = currentUser.stats.rating || 0;
            statNumbers[2].textContent = currentUser.stats.yearsWithUs || 0;
        }
    }

    updateFormFields();
}

function updateFormFields() {
    if (!currentUser) return;

    const fields = {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone,
        birthDate: currentUser.birthDate,
        gender: currentUser.gender
    };

    Object.keys(fields).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.value = fields[fieldName] || '';
        }
    });
}

// ==============================================
// UTILITIES
// ==============================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    notification.querySelector('.notification-close').onclick = () => notification.remove();

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '400px'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeAuthData();
        window.location.href = '/login';
    }
}

// ==============================================
// THEME MANAGEMENT
// ==============================================

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ==============================================
// EVENT LISTENERS
// ==============================================

function setupEventListeners() {
    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            closePasswordModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closePasswordModal();
        }
    });
}


function checkAuthOnPageLoad() {
    const userData = getUserDataFromStorage();

    // Если нет данных пользователя в localStorage
    if (!userData || !userData.email) {
        console.warn('No user data found, redirecting to login...');
        removeAuthData();
        window.location.href = '/login';
        return false;
    }

    console.log('User data found:', userData);
    return true;
}

// ==============================================
// INITIALIZE ON DOM LOAD
// ==============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Profile page loaded');

    // ✅ ВАЖНО: Проверяем авторизацию ДО загрузки данных
    if (!checkAuthOnPageLoad()) {
        return; // Останавливаем инициализацию, если не авторизован
    }

    initializeProfile();
    loadUserData();
    setupEventListeners();
    initTheme();

    console.log('✅ Profile initialized successfully');
});

console.log('Profile script initialized successfully');
