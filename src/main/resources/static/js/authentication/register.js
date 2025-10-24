// DOM Elements
const registerForm = document.getElementById('registerForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const birthDateInput = document.getElementById('birthDate');
const genderInput = document.getElementById('gender');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('terms');
const newsletterCheckbox = document.getElementById('newsletter');
const submitBtn = document.querySelector('.auth-btn-primary');

// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// JWT Token management
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Получить JWT токен
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Сохранить JWT токен
function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

// Удалить JWT токен
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Получить данные пользователя
function getUserData() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

// Сохранить данные пользователя
function setUserData(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

// Store authentication data (упрощенная версия)
function storeAuthData(authResponse) {
    if (authResponse && authResponse.token && authResponse.user) {
        setToken(authResponse.token);
        setUserData(authResponse.user);
    }
}

// Form validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function validateName(name) {
    return name.trim().length >= 2;
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateBirthDate(date) {
    if (!date) return false;

    const birthDate = new Date(date);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120); // 120 years ago
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 14); // Must be at least 14 years old

    return birthDate >= minDate && birthDate <= maxDate;
}

function getPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'fair';
    if (strength <= 5) return 'good';
    return 'strong';
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');

    input.classList.add('error');
    input.classList.remove('success');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');

    input.classList.remove('error');
    input.classList.remove('success');
    errorElement.classList.remove('show');
}

function showSuccess(inputId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');

    input.classList.add('success');
    input.classList.remove('error');
    errorElement.classList.remove('show');
}

// Real-time validation
firstNameInput.addEventListener('input', function() {
    const name = this.value.trim();

    if (name === '') {
        clearError('firstName');
        return;
    }

    if (validateName(name)) {
        showSuccess('firstName');
    } else {
        showError('firstName', 'Имя должно содержать минимум 2 символа');
    }
});

lastNameInput.addEventListener('input', function() {
    const name = this.value.trim();

    if (name === '') {
        clearError('lastName');
        return;
    }

    if (validateName(name)) {
        showSuccess('lastName');
    } else {
        showError('lastName', 'Фамилия должна содержать минимум 2 символа');
    }
});

birthDateInput.addEventListener('change', function() {
    const date = this.value;

    if (date === '') {
        clearError('birthDate');
        return;
    }

    if (validateBirthDate(date)) {
        showSuccess('birthDate');
    } else {
        showError('birthDate', 'Возраст должен быть от 14 до 120 лет');
    }
});

genderInput.addEventListener('change', function() {
    const gender = this.value;

    if (gender === '') {
        clearError('gender');
    } else {
        showSuccess('gender');
    }
});

emailInput.addEventListener('input', function() {
    const email = this.value.trim();

    if (email === '') {
        clearError('email');
        return;
    }

    if (validateEmail(email)) {
        showSuccess('email');
    } else {
        showError('email', 'Введите корректный email адрес');
    }
});

phoneInput.addEventListener('input', function() {
    const phone = this.value;

    if (phone === '') {
        clearError('phone');
        return;
    }

    if (validatePhone(phone)) {
        showSuccess('phone');
    } else {
        showError('phone', 'Введите корректный номер телефона');
    }
});

passwordInput.addEventListener('input', function() {
    const password = this.value;

    if (password === '') {
        clearError('password');
        updatePasswordStrength('', 'Введите пароль');
        return;
    }

    if (validatePassword(password)) {
        showSuccess('password');
    } else {
        showError('password', 'Пароль должен содержать минимум 6 символов');
    }

    updatePasswordStrength(password);
});

confirmPasswordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (confirmPassword === '') {
        clearError('confirmPassword');
        return;
    }

    if (password === confirmPassword) {
        showSuccess('confirmPassword');
    } else {
        showError('confirmPassword', 'Пароли не совпадают');
    }
});

// Password strength indicator
function updatePasswordStrength(password, customText = null) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    if (!password) {
        strengthFill.className = 'strength-fill';
        strengthText.textContent = customText || 'Введите пароль';
        strengthText.className = 'strength-text';
        return;
    }

    const strength = getPasswordStrength(password);

    strengthFill.className = `strength-fill ${strength}`;
    strengthText.className = `strength-text ${strength}`;

    const strengthTexts = {
        weak: 'Слабый пароль',
        fair: 'Средний пароль',
        good: 'Хороший пароль',
        strong: 'Надежный пароль'
    };

    strengthText.textContent = strengthTexts[strength];
}

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'Icon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Loading state
function setLoadingState(isLoading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    if (isLoading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        btnText.style.opacity = '0';
        btnLoading.style.display = 'flex';
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        btnText.style.opacity = '1';
        btnLoading.style.display = 'none';
    }
}

// Show notification
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

// Исправленная API Request function
async function makeRequest(url, method, data) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        // Проверяем, есть ли контент для парсинга
        const contentType = response.headers.get('content-type');
        const hasJson = contentType && contentType.includes('application/json');
        const hasContent = response.status !== 204; // No Content

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;

            // Пытаемся получить сообщение об ошибке из ответа
            if (hasJson && hasContent) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Если не удалось распарсить JSON, используем текстовое сообщение
                    if (hasContent) {
                        try {
                            const text = await response.text();
                            errorMessage = text || errorMessage;
                        } catch (textError) {
                            // Игнорируем ошибку чтения текста
                        }
                    }
                }
            }

            throw new Error(errorMessage);
        }

        // Если ответ успешный и есть JSON контент - парсим его
        if (hasJson && hasContent) {
            return await response.json();
        } else if (hasContent) {
            // Если есть контент, но не JSON - возвращаем текст
            return await response.text();
        } else {
            // Если нет контента (например, 204 No Content) - возвращаем null
            return null;
        }
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Register function
async function registerUser(userData) {
    return await makeRequest(`${API_BASE_URL}/auth/register`, 'POST', userData);
}

// Set max date for birth date (14 years ago)
function setMaxBirthDate() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
    birthDateInput.max = maxDate.toISOString().split('T')[0];

    // Set min date (120 years ago)
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    birthDateInput.min = minDate.toISOString().split('T')[0];
}

// Form submission
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const birthDate = birthDateInput.value;
    const gender = genderInput.value;
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const terms = termsCheckbox.checked;
    const newsletter = newsletterCheckbox.checked;

    // Clear previous errors
    clearError('firstName');
    clearError('lastName');
    clearError('birthDate');
    clearError('gender');
    clearError('email');
    clearError('phone');
    clearError('password');
    clearError('confirmPassword');
    clearError('terms');

    // Validate form
    let isValid = true;

    if (!firstName) {
        showError('firstName', 'Введите имя');
        isValid = false;
    } else if (!validateName(firstName)) {
        showError('firstName', 'Имя должно содержать минимум 2 символа');
        isValid = false;
    }

    if (!lastName) {
        showError('lastName', 'Введите фамилию');
        isValid = false;
    } else if (!validateName(lastName)) {
        showError('lastName', 'Фамилия должна содержать минимум 2 символа');
        isValid = false;
    }

    if (!birthDate) {
        showError('birthDate', 'Введите дату рождения');
        isValid = false;
    } else if (!validateBirthDate(birthDate)) {
        showError('birthDate', 'Возраст должен быть от 14 до 120 лет');
        isValid = false;
    }

    if (!gender) {
        showError('gender', 'Выберите пол');
        isValid = false;
    }

    if (!email) {
        showError('email', 'Введите email адрес');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('email', 'Введите корректный email адрес');
        isValid = false;
    }

    if (!phone) {
        showError('phone', 'Введите номер телефона');
        isValid = false;
    } else if (!validatePhone(phone)) {
        showError('phone', 'Введите корректный номер телефона');
        isValid = false;
    }

    if (!password) {
        showError('password', 'Введите пароль');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('password', 'Пароль должен содержать минимум 6 символов');
        isValid = false;
    }

    if (!confirmPassword) {
        showError('confirmPassword', 'Подтвердите пароль');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPassword', 'Пароли не совпадают');
        isValid = false;
    }

    if (!terms) {
        showError('terms', 'Необходимо согласиться с условиями использования');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Set loading state
    setLoadingState(true);

    try {
        // Prepare registration data
        const registerData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            password: password,
            confirmPassword: confirmPassword,
            gender: gender,
            birthDate: birthDate
        };

        // Make API call
        const authResponse = await registerUser(registerData);

        if (authResponse && authResponse.token && authResponse.user) {
            // Store authentication data
            storeAuthData(authResponse);

            showNotification('Регистрация успешно завершена! Добро пожаловать!', 'success');

            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            throw new Error('Неверный ответ от сервера');
        }

    } catch (error) {
        console.error('Registration error:', error);

        // Более конкретные сообщения об ошибках
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
            showNotification('Пользователь с таким email или телефоном уже существует', 'error');
        } else if (error.message.includes('Network Error')) {
            showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
        } else {
            showNotification(error.message || 'Ошибка регистрации. Попробуйте еще раз.', 'error');
        }

        setLoadingState(false);
    }
});

// Social registration handlers
document.querySelector('.social-google')?.addEventListener('click', function() {
    showNotification('Функция регистрации через Google будет добавлена позже', 'info');
});

document.querySelector('.social-facebook')?.addEventListener('click', function() {
    showNotification('Функция регистрации через Facebook будет добавлена позже', 'info');
});

// Terms link handler
document.querySelector('.terms-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    showNotification('Страница с условиями использования будет добавлена позже', 'info');
});

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

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();

    // Set max birth date
    setMaxBirthDate();

    const token = getToken();
    const userData = getUserData();

    if (token && userData) {
        showNotification('Вы уже авторизованы. Перенаправляем на главную страницу...', 'info');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
});

// Add smooth animations
document.addEventListener('DOMContentLoaded', function() {
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.style.opacity = '0';
        authCard.style.transform = 'translateY(30px)';

        setTimeout(() => {
            authCard.style.transition = 'all 0.6s ease';
            authCard.style.opacity = '1';
            authCard.style.transform = 'translateY(0)';
        }, 100);
    }
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
        const inputs = Array.from(document.querySelectorAll('.form-input'));
        const currentIndex = inputs.indexOf(e.target);

        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        } else {
            registerForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Phone input formatting
phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');

    if (value.startsWith('8')) {
        value = '7' + value.slice(1);
    }

    if (value.startsWith('7')) {
        if (value.length >= 1) {
            value = '+7 (' + value.slice(1);
        }
        if (value.length >= 8) {
            value = value.slice(0, 7) + ') ' + value.slice(7);
        }
        if (value.length >= 14) {
            value = value.slice(0, 13) + '-' + value.slice(13);
        }
        if (value.length >= 17) {
            value = value.slice(0, 16) + '-' + value.slice(16);
        }
    }

    e.target.value = value;
});

// Функция для отладки (можно удалить после тестирования)
async function debugRegister() {
    console.log('Testing register API...');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName: 'Тест',
                lastName: 'Тестов',
                email: 'test@test.com',
                phone: '+79999999999',
                password: 'password123',
                confirmPassword: 'password123',
                gender: 'MALE',
                birthDate: '1990-01-01'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('Response text:', text);

        try {
            const json = JSON.parse(text);
            console.log('Response JSON:', json);
            return json;
        } catch (e) {
            console.log('Response is not JSON');
            return text;
        }
    } catch (error) {
        console.error('Debug request failed:', error);
        throw error;
    }
}

// Добавьте в глобальную область видимости для отладки
window.debugRegister = debugRegister;