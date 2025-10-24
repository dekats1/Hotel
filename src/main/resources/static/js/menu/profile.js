// Profile Management JavaScript

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');
const avatarInput = document.getElementById('avatarInput');
const passwordModal = document.getElementById('passwordModal');
const passwordForm = document.getElementById('passwordForm');

// User data
let currentUser = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeProfile();
    loadUserData();
    setupEventListeners();
    initTheme();
});

// Initialize profile page
function initializeProfile() {
    // Set up mobile navigation
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Set up form submissions
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalFormSubmit);
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordFormSubmit);
    }

    // Set up password strength indicator
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }

    // Set up notification toggles
    setupNotificationToggles();
}

// Load user data from localStorage
function loadUserData() {
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');

    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserInterface();
    } else {
        // Create demo user if no data exists
        currentUser = {
            name: 'Иван Иванов',
            firstName: 'Иван',
            lastName: 'Иванов',
            email: 'ivan.ivanov@example.com',
            phone: '+7 (999) 123-45-67',
            birthDate: '1990-05-15',
            gender: 'male',
            address: 'г. Москва, ул. Примерная, д. 123, кв. 45',
            wallet: 15000,
            avatar: '👤',
            stats: {
                bookings: 15,
                rating: 4.9,
                yearsWithUs: 2
            }
        };
        updateUserInterface();
    }
}

// Update user interface with current user data
function updateUserInterface() {
    if (!currentUser) return;

    // Update profile header
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const userName = document.getElementById('userName');
    const userWallet = document.getElementById('userWallet');
    const userAvatar = document.getElementById('userAvatar');
    const userNameSmall = document.getElementById('userNameSmall');
    const userEmailSmall = document.getElementById('userEmailSmall');
    const userAvatarSmall = document.getElementById('userAvatarSmall');

    if (profileName) profileName.textContent = currentUser.name;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (userName) userName.textContent = currentUser.name;
    if (userWallet) userWallet.textContent = currentUser.wallet ? currentUser.wallet.toLocaleString() + '₽' : '0₽';
    if (userNameSmall) userNameSmall.textContent = currentUser.name;
    if (userEmailSmall) userEmailSmall.textContent = currentUser.email;

    // Update avatars
    if (profileAvatar) {
        const avatarPlaceholder = profileAvatar.querySelector('.avatar-placeholder');
        if (avatarPlaceholder) {
            if (currentUser.avatar && currentUser.avatar.startsWith('data:')) {
                avatarPlaceholder.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                avatarPlaceholder.innerHTML = `<i class="fas fa-user"></i>`;
            }
        }
    }

    if (userAvatar) {
        if (currentUser.avatar && currentUser.avatar.startsWith('data:')) {
            userAvatar.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            userAvatar.textContent = currentUser.avatar || '👤';
        }
    }

    if (userAvatarSmall) {
        if (currentUser.avatar && currentUser.avatar.startsWith('data:')) {
            userAvatarSmall.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            userAvatarSmall.textContent = currentUser.avatar || '👤';
        }
    }

    // Update stats
    if (currentUser.stats) {
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = currentUser.stats.bookings || 0;
            statNumbers[1].textContent = currentUser.stats.rating || 0;
            statNumbers[2].textContent = currentUser.stats.yearsWithUs || 0;
        }
    }

    // Update form fields
    updateFormFields();
}

// Update form fields with user data
function updateFormFields() {
    if (!currentUser) return;

    const fields = {
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        birthDate: currentUser.birthDate || '',
        gender: currentUser.gender || 'male',
        address: currentUser.address || ''
    };

    Object.keys(fields).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.value = fields[fieldName];
        }
    });
}


// Mobile navigation toggle
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

// Close mobile menu
function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

// Toggle user menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

// Edit personal information
function editPersonalInfo() {
    const form = document.getElementById('personalForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    const editBtn = document.querySelector('.card-header .btn-primary');
    const formActions = form.querySelector('.form-actions');

    // Enable all inputs
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.disabled = false;
    });

    // Show form actions
    if (formActions) {
        formActions.style.display = 'flex';
    }

    // Change button text
    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
        editBtn.onclick = () => form.dispatchEvent(new Event('submit'));
    }
}

// Cancel edit
function cancelEdit() {
    const form = document.getElementById('personalForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    const editBtn = document.querySelector('.card-header .btn-primary');
    const formActions = form.querySelector('.form-actions');

    // Restore original values
    updateFormFields();

    // Disable all inputs
    inputs.forEach(input => {
        input.setAttribute('readonly', 'readonly');
        if (input.tagName === 'SELECT') {
            input.disabled = true;
        }
    });

    // Hide form actions
    if (formActions) {
        formActions.style.display = 'none';
    }

    // Restore button
    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Редактировать';
        editBtn.onclick = editPersonalInfo;
    }
}

// Handle personal form submission
function handlePersonalFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const updatedData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        birthDate: formData.get('birthDate'),
        gender: formData.get('gender'),
        address: formData.get('address')
    };

    // Validate required fields
    if (!updatedData.firstName || !updatedData.lastName || !updatedData.email) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }

    // Validate email
    if (!isValidEmail(updatedData.email)) {
        showNotification('Пожалуйста, введите корректный email', 'error');
        return;
    }

    // Update user data
    Object.assign(currentUser, updatedData);
    currentUser.name = `${updatedData.firstName} ${updatedData.lastName}`;

    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(currentUser));

    // Update interface
    updateUserInterface();

    // Show success message
    showNotification('Профиль успешно обновлен!', 'success');

    // Cancel edit mode
    cancelEdit();
}

// Change profile photo
function changeProfilePhoto() {
    if (avatarInput) {
        avatarInput.click();
    }
}

// Handle avatar change
function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Пожалуйста, выберите изображение', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Размер файла не должен превышать 5MB', 'error');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = function (e) {
            const profileAvatar = document.getElementById('profileAvatar');
            const avatarPlaceholder = profileAvatar.querySelector('.avatar-placeholder');

            if (avatarPlaceholder) {
                avatarPlaceholder.innerHTML = `<img src="${e.target.result}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
            }

            // Update user data
            currentUser.avatar = e.target.result;
            localStorage.setItem('userData', JSON.stringify(currentUser));
            updateUserInterface();

            showNotification('Фото профиля успешно обновлено!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Change cover photo
function changeCoverPhoto() {
    showNotification('Функция изменения обложки будет добавлена позже', 'info');
}

// Change password
function changePassword() {
    if (passwordModal) {
        passwordModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Close password modal
function closePasswordModal() {
    if (passwordModal) {
        passwordModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        passwordForm.reset();
        updatePasswordStrength();
    }
}

// Handle password form submission
function handlePasswordFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    // Simulate password change
    showNotification('Пароль успешно изменен!', 'success');
    closePasswordModal();
}

// Update password strength indicator
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

// Setup 2FA
function setup2FA() {
    showNotification('Функция двухфакторной аутентификации будет добавлена позже', 'info');
}

// View login history
function viewLoginHistory() {
    showNotification('История входов будет доступна в следующей версии', 'info');
}

// Setup notification toggles
function setupNotificationToggles() {
    const toggles = document.querySelectorAll('.switch input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function () {
            const category = this.closest('.notification-category').querySelector('h4').textContent;
            const setting = this.closest('.notification-item').querySelector('span').textContent;
            const isEnabled = this.checked;

            showNotification(`${setting} ${isEnabled ? 'включено' : 'отключено'}`, 'info');
        });
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    // Add to document
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Logout function
function logout() {
    showNotification('Вы вышли из системы', 'info');

    // Clear user data
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');

    // Redirect to home page
    window.location.href = '/';
}

// Header scroll effect
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (window.scrollY > 100) {
        if (currentTheme === 'dark') {
            header.style.background = 'rgba(15, 23, 42, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    } else {
        if (currentTheme === 'dark') {
            header.style.background = 'rgba(15, 23, 42, 0.95)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
        header.style.boxShadow = 'none';
    }
}

// Theme management
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

    // Update header background immediately
    handleHeaderScroll();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Add animation to theme button
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.style.transform = 'scale(0.8)';
        setTimeout(() => {
            themeBtn.style.transform = 'scale(1)';
        }, 150);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });

    // Header scroll effect
    window.addEventListener('scroll', handleHeaderScroll);

    // Close modal when clicking outside
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            closePasswordModal();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closePasswordModal();
        }
    });
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

