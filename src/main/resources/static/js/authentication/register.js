// ==============================================
// CONFIGURATION AND DOM
// ==============================================

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

const API_BASE_URL = 'http://localhost:8080/api';
const USER_KEY = 'user_data';

// ==============================================
// STORAGE FUNCTIONS
// ==============================================

function removeAuthData() {
    localStorage.removeItem(USER_KEY);
}

function getUserData() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

function setUserData(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

function storeAuthData(authResponse) {
    if (authResponse && authResponse.user) {
        setUserData(authResponse.user);
    }
}

// ==============================================
// VALIDATION UTILS
// ==============================================

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
    minDate.setFullYear(today.getFullYear() - 120);
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 14);

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

// ==============================================
// REAL-TIME VALIDATION LISTENERS
// ==============================================

firstNameInput.addEventListener('input', function() {
    const name = this.value.trim();

    if (name === '') {
        clearError('firstName');
        return;
    }

    if (validateName(name)) {
        showSuccess('firstName');
    } else {
        showError('firstName', window.i18n?.t('validation.firstNameMinLength') || 'Имя должно содержать минимум 2 символа');
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
        showError('lastName', window.i18n?.t('validation.lastNameMinLength') || 'Фамилия должна содержать минимум 2 символа');
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
        showError('birthDate', window.i18n?.t('validation.ageRange') || 'Возраст должен быть от 14 до 120 лет');
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
        showError('email', window.i18n?.t('errors.invalidEmail') || 'Введите корректный email адрес');
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
        showError('phone', window.i18n?.t('validation.phoneInvalid') || 'Введите корректный номер телефона');
    }
});

passwordInput.addEventListener('input', function() {
    const password = this.value;

    if (password === '') {
        clearError('password');
        updatePasswordStrength('', window.i18n?.t('auth.passwordStrength') || 'Введите пароль');
        return;
    }

    if (validatePassword(password)) {
        showSuccess('password');
    } else {
        showError('password', window.i18n?.t('validation.passwordMinLength') || 'Пароль должен содержать минимум 6 символов');
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
        showError('confirmPassword', window.i18n?.t('errors.passwordsDoNotMatch') || 'Пароли не совпадают');
    }
});

// ==============================================
// UI FUNCTIONS
// ==============================================

function updatePasswordStrength(password, customText = null) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    if (!password) {
        strengthFill.className = 'strength-fill';
        strengthText.textContent = customText || (window.i18n?.t('auth.passwordStrength') || 'Введите пароль');
        strengthText.className = 'strength-text';
        return;
    }

    const strength = getPasswordStrength(password);

    strengthFill.className = `strength-fill ${strength}`;
    strengthText.className = `strength-text ${strength}`;

    const strengthTexts = {
        weak: window.i18n?.t('auth.passwordWeak') || 'Слабый пароль',
        fair: window.i18n?.t('auth.passwordFair') || 'Средний пароль',
        good: window.i18n?.t('auth.passwordGood') || 'Хороший пароль',
        strong: window.i18n?.t('auth.passwordStrong') || 'Надежный пароль'
    };

    strengthText.textContent = strengthTexts[strength];
}

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

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

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

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ==============================================
// API FUNCTIONS
// ==============================================

async function makeRequest(url, method, data) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        const contentType = response.headers.get('content-type');
        const hasJson = contentType && contentType.includes('application/json');
        const hasContent = response.status !== 204;

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;

            if (hasJson && hasContent) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    if (hasContent) {
                        try {
                            const text = await response.text();
                            errorMessage = text || errorMessage;
                        } catch (textError) {
                        }
                    }
                }
            }

            throw new Error(errorMessage);
        }

        if (hasJson && hasContent) {
            return await response.json();
        } else if (hasContent) {
            return await response.text();
        } else {
            return null;
        }
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

async function registerUser(userData) {
    return await makeRequest(`${API_BASE_URL}/auth/register`, 'POST', userData);
}

function setMaxBirthDate() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
    birthDateInput.max = maxDate.toISOString().split('T')[0];

    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    birthDateInput.min = minDate.toISOString().split('T')[0];
}

// ==============================================
// EVENT HANDLERS
// ==============================================

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

    clearError('firstName');
    clearError('lastName');
    clearError('birthDate');
    clearError('gender');
    clearError('email');
    clearError('phone');
    clearError('password');
    clearError('confirmPassword');
    clearError('terms');

    let isValid = true;

    if (!firstName) {
        showError('firstName', window.i18n?.t('validation.firstNameRequired') || 'Введите имя');
        isValid = false;
    } else if (!validateName(firstName)) {
        showError('firstName', window.i18n?.t('validation.firstNameMinLength') || 'Имя должно содержать минимум 2 символа');
        isValid = false;
    }

    if (!lastName) {
        showError('lastName', window.i18n?.t('validation.lastNameRequired') || 'Введите фамилию');
        isValid = false;
    } else if (!validateName(lastName)) {
        showError('lastName', window.i18n?.t('validation.lastNameMinLength') || 'Фамилия должна содержать минимум 2 символа');
        isValid = false;
    }

    if (!birthDate) {
        showError('birthDate', window.i18n?.t('validation.birthDateRequired') || 'Введите дату рождения');
        isValid = false;
    } else if (!validateBirthDate(birthDate)) {
        showError('birthDate', window.i18n?.t('validation.ageRange') || 'Возраст должен быть от 14 до 120 лет');
        isValid = false;
    }

    if (!gender) {
        showError('gender', window.i18n?.t('validation.genderRequired') || 'Выберите пол');
        isValid = false;
    }

    if (!email) {
        showError('email', window.i18n?.t('validation.emailRequired') || 'Введите email адрес');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('email', window.i18n?.t('errors.invalidEmail') || 'Введите корректный email адрес');
        isValid = false;
    }

    if (!phone) {
        showError('phone', window.i18n?.t('validation.phoneRequired') || 'Введите номер телефона');
        isValid = false;
    } else if (!validatePhone(phone)) {
        showError('phone', window.i18n?.t('validation.phoneInvalid') || 'Введите корректный номер телефона');
        isValid = false;
    }

    if (!password) {
        showError('password', window.i18n?.t('validation.passwordRequired') || 'Введите пароль');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('password', window.i18n?.t('validation.passwordMinLength') || 'Пароль должен содержать минимум 6 символов');
        isValid = false;
    }

    if (!confirmPassword) {
        showError('confirmPassword', window.i18n?.t('validation.confirmPasswordRequired') || 'Подтвердите пароль');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPassword', window.i18n?.t('errors.passwordsDoNotMatch') || 'Пароли не совпадают');
        isValid = false;
    }

    if (!terms) {
        showError('terms', window.i18n?.t('validation.termsRequired') || 'Необходимо согласиться с условиями использования');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    setLoadingState(true);

    try {
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

        const authResponse = await registerUser(registerData);

        if (authResponse && authResponse.user) {
            storeAuthData(authResponse);

            showNotification(window.i18n?.t('auth.registrationSuccess') || 'Регистрация успешно завершена! Добро пожаловать!', 'success');

            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            throw new Error(window.i18n?.t('errors.invalidServerResponse') || 'Неверный ответ от сервера');
        }

    } catch (error) {
        console.error('Registration error:', error);

        if (error.message.includes('400') || error.message.includes('Bad Request')) {
            showNotification(window.i18n?.t('errors.userExists') || 'Пользователь с таким email или телефоном уже существует', 'error');
        } else if (error.message.includes('Network Error')) {
            showNotification(window.i18n?.t('errors.networkError') || 'Ошибка сети. Проверьте подключение к интернету.', 'error');
        } else {
            showNotification(error.message || (window.i18n?.t('errors.registrationError') || 'Ошибка регистрации. Попробуйте еще раз.'), 'error');
        }

        setLoadingState(false);
    }
});

document.querySelector('.social-google')?.addEventListener('click', function() {
    showNotification(window.i18n?.t('auth.googleComingSoon') || 'Функция регистрации через Google будет добавлена позже', 'info');
});

document.querySelector('.social-facebook')?.addEventListener('click', function() {
    showNotification(window.i18n?.t('auth.facebookComingSoon') || 'Функция регистрации через Facebook будет добавлена позже', 'info');
});

document.querySelector('.terms-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    showNotification(window.i18n?.t('auth.termsComingSoon') || 'Страница с условиями использования будет добавлена позже', 'info');
});

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

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.style.transform = 'scale(0.8)';
        setTimeout(() => {
            themeBtn.style.transform = 'scale(1)';
        }, 150);
    }
}

// ==============================================
// INITIALIZATION AND MISC
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    setMaxBirthDate();

    const userData = getUserData();
    if (userData) {
        showNotification(window.i18n?.t('auth.alreadyLoggedIn') || 'Вы уже входили в систему. Если Cookie валиден, вы будете аутентифицированы.', 'info');
    }

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
            }),
            credentials: 'include'
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

window.debugRegister = debugRegister;