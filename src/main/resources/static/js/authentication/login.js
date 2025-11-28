// ==============================================
// CONFIGURATION AND DOM
// ==============================================

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const submitBtn = document.querySelector('.auth-btn-primary');
const API_BASE_URL = '/api';
const USER_DATA_KEY = 'user_data';
const forgotModal = document.getElementById('forgotPasswordModal');
const forgotTrigger = document.getElementById('forgotPasswordTrigger');
const forgotCloseBtn = document.getElementById('forgotModalClose');
const forgotRequestForm = document.getElementById('forgotRequestForm');
const forgotResetForm = document.getElementById('forgotResetForm');
const forgotStatus = document.getElementById('forgotStatus');
const forgotEmailInput = document.getElementById('forgotEmail');
const resetEmailInput = document.getElementById('resetEmail');
const verificationCodeInput = document.getElementById('verificationCode');
const newPasswordModalInput = document.getElementById('newPassword');
const confirmNewPasswordModalInput = document.getElementById('confirmNewPassword');
const forgotBackBtn = document.getElementById('forgotBackBtn');
const forgotRequestBtn = document.getElementById('forgotRequestBtn');
const forgotResetBtn = document.getElementById('forgotResetBtn');

// ==============================================
// STORAGE FUNCTIONS
// ==============================================

function storeAuthData(authResponse) {
    if (!authResponse || !authResponse.user) {
        console.error('Invalid auth response:', authResponse);
        return;
    }

    const userData = {
        id: authResponse.user.id,
        email: authResponse.user.email,
        firstName: authResponse.user.firstName,
        lastName: authResponse.user.lastName,
        role: authResponse.user.role,
    };

    try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        console.log('User data stored successfully');
    } catch (error) {
        console.error('Error storing user data:', error);
    }
}

function getUserData() {
    try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

function removeAuthData() {
    try {
        localStorage.removeItem(USER_DATA_KEY);
        console.log('User data removed from storage');
    } catch (error) {
        console.error('Error removing user data:', error);
    }
}

// ==============================================
// THEME FUNCTIONS
// ==============================================

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

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ==============================================
// API FUNCTIONS
// ==============================================

async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            let errorMessage = window.i18n?.t('errors.loginError') || 'Ошибка авторизации';

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = await response.text() || errorMessage;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Login successful:', data);

        storeAuthData(data);

        return data;

    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function requestPasswordResetCode(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            let errorMessage = window.i18n?.t('errors.passwordResetError') || 'Не удалось отправить код подтверждения';

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = await response.text() || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        console.error('Forgot password error:', error);
        throw error;
    }
}

async function resetPasswordWithCode(payload) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMessage = window.i18n?.t('errors.passwordResetError') || 'Не удалось обновить пароль';

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = await response.text() || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            let errorMessage = window.i18n?.t('errors.registrationError') || 'Ошибка регистрации';

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = await response.text() || errorMessage;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Registration successful:', data);

        storeAuthData(data);

        return data;

    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function logoutUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) {
            console.warn('Logout request failed, but continuing...');
        }

        console.log('Logout successful');

    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeAuthData();

        window.location.href = '/login';
    }
}

// ==============================================
// UI FUNCTIONS
// ==============================================

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const iconMap = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    const icon = iconMap[type] || 'info-circle';

    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    const bgColors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: bgColors[type] || bgColors.info,
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '400px',
        minWidth: '300px'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        const loadingText = window.i18n?.t('common.loading') || 'Вход...';
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || (window.i18n?.t('common.login') || 'Войти');
    }
}

function setModalButtonLoading(button, isLoading, textKey, fallbackText) {
    if (!button) {
        return;
    }

    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        const loadingText = window.i18n?.t(textKey) || fallbackText;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || fallbackText;
    }
}

function toggleForgotModal(show) {
    if (!forgotModal) {
        return;
    }

    if (show) {
        forgotModal.classList.add('open');
        forgotModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const rememberedEmail = emailInput?.value?.trim();
        if (rememberedEmail && forgotEmailInput) {
            forgotEmailInput.value = rememberedEmail;
        }
        updateForgotStatus(window.i18n?.t('auth.forgotStatusHint') || 'Введите email, который вы использовали при регистрации');
        setForgotStep('request');
        forgotEmailInput?.focus();
    } else {
        forgotModal.classList.remove('open');
        forgotModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        forgotRequestForm?.reset();
        forgotResetForm?.reset();
        resetEmailInput && (resetEmailInput.value = '');
    }
}

function setForgotStep(step) {
    if (!forgotRequestForm || !forgotResetForm) {
        return;
    }

    if (step === 'reset') {
        forgotRequestForm.classList.remove('active');
        forgotResetForm.classList.add('active');
        forgotResetForm.setAttribute('aria-hidden', 'false');
        forgotRequestForm.setAttribute('aria-hidden', 'true');
        verificationCodeInput?.focus();
    } else {
        forgotResetForm.classList.remove('active');
        forgotRequestForm.classList.add('active');
        forgotRequestForm.setAttribute('aria-hidden', 'false');
        forgotResetForm.setAttribute('aria-hidden', 'true');
        forgotEmailInput?.focus();
    }
}

function updateForgotStatus(message, type = 'info') {
    if (!forgotStatus) {
        return;
    }

    forgotStatus.textContent = message;
    forgotStatus.classList.remove('success', 'error');

    if (type === 'success') {
        forgotStatus.classList.add('success');
    } else if (type === 'error') {
        forgotStatus.classList.add('error');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateLoginForm(email, password) {
    if (!email || !password) {
        showNotification(window.i18n?.t('errors.fillAllFields') || 'Пожалуйста, заполните все поля', 'error');
        return false;
    }

    if (!isValidEmail(email)) {
        showNotification(window.i18n?.t('errors.invalidEmail') || 'Пожалуйста, введите корректный email', 'error');
        return false;
    }

    if (password.length < 6) {
        showNotification(window.i18n?.t('validation.passwordMinLength') || 'Пароль должен содержать минимум 6 символов', 'error');
        return false;
    }

    return true;
}

function redirectAfterLogin(userData) {
    const role = userData.user?.role || userData.role;

    if (role === 'ADMIN') {
        window.location.href = '/admin';
    } else {
        window.location.href = '/';
    }
}

// ==============================================
// EVENT HANDLERS
// ==============================================

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!validateLoginForm(email, password)) {
            return;
        }

        const credentials = { email, password };

        setButtonLoading(submitBtn, true);

        try {
            const authData = await loginUser(credentials);

            showNotification(window.i18n?.t('auth.loginSuccess') || 'Вход выполнен успешно!', 'success');

            setTimeout(() => {
                redirectAfterLogin(authData);
            }, 1000);

        } catch (error) {
            showNotification(error.message, 'error');
            setButtonLoading(submitBtn, false);
        }
    });
}

if (forgotTrigger) {
    forgotTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        toggleForgotModal(true);
    });
}

if (forgotCloseBtn) {
    forgotCloseBtn.addEventListener('click', () => toggleForgotModal(false));
}

if (forgotModal) {
    forgotModal.addEventListener('click', (event) => {
        if (event.target === forgotModal) {
            toggleForgotModal(false);
        }
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && forgotModal?.classList.contains('open')) {
        toggleForgotModal(false);
    }
});

if (forgotBackBtn) {
    forgotBackBtn.addEventListener('click', () => {
        setForgotStep('request');
        updateForgotStatus(window.i18n?.t('auth.forgotStatusHint') || 'Введите email, который вы использовали при регистрации');
    });
}

if (forgotRequestForm) {
    forgotRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = forgotEmailInput?.value.trim();
        if (!email || !isValidEmail(email)) {
            const invalidEmailMessage = window.i18n?.t('errors.invalidEmail') || 'Пожалуйста, введите корректный email';
            updateForgotStatus(invalidEmailMessage, 'error');
            showNotification(invalidEmailMessage, 'error');
            return;
        }

        setModalButtonLoading(
            forgotRequestBtn,
            true,
            'auth.sendingCode',
            window.i18n?.t('auth.sendingCode') || 'Отправляем...'
        );

        try {
            await requestPasswordResetCode(email);
            resetEmailInput && (resetEmailInput.value = email);

            const successMessage = `${window.i18n?.t('auth.resetCodeSentHint') || 'Код отправлен на адрес'} ${email}`;
            updateForgotStatus(successMessage, 'success');
            showNotification(window.i18n?.t('auth.resetCodeSent') || 'Код успешно отправлен', 'success');

            setForgotStep('reset');
        } catch (error) {
            updateForgotStatus(error.message, 'error');
            showNotification(error.message, 'error');
        } finally {
            setModalButtonLoading(
                forgotRequestBtn,
                false,
                'auth.sendResetCode',
                window.i18n?.t('auth.sendResetCode') || 'Отправить код'
            );
        }
    });
}

if (forgotResetForm) {
    forgotResetForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = resetEmailInput?.value.trim();
        const code = verificationCodeInput?.value.trim();
        const newPassword = newPasswordModalInput?.value || '';
        const confirmPassword = confirmNewPasswordModalInput?.value || '';

        if (!email) {
            updateForgotStatus(window.i18n?.t('auth.forgotStatusHint') || 'Введите email, который вы использовали при регистрации', 'error');
            setForgotStep('request');
            return;
        }

        if (!code) {
            const codeMessage = window.i18n?.t('validation.verificationCodeRequired') || 'Введите код подтверждения';
            updateForgotStatus(codeMessage, 'error');
            showNotification(codeMessage, 'error');
            return;
        }

        if (newPassword.length < 6) {
            const passwordMessage = window.i18n?.t('validation.passwordMinLength') || 'Пароль должен содержать минимум 6 символов';
            updateForgotStatus(passwordMessage, 'error');
            showNotification(passwordMessage, 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            const mismatchMessage = window.i18n?.t('errors.passwordsDoNotMatch') || 'Пароли не совпадают';
            updateForgotStatus(mismatchMessage, 'error');
            showNotification(mismatchMessage, 'error');
            return;
        }

        setModalButtonLoading(
            forgotResetBtn,
            true,
            'auth.resettingPassword',
            window.i18n?.t('auth.resettingPassword') || 'Обновляем...'
        );

        try {
            await resetPasswordWithCode({
                email,
                code,
                newPassword,
                confirmPassword
            });

            const successMessage = window.i18n?.t('auth.passwordResetSuccess') || 'Пароль успешно обновлен. Войдите с новым паролем.';
            updateForgotStatus(successMessage, 'success');
            showNotification(successMessage, 'success');

            if (emailInput) {
                emailInput.value = email;
            }

            setTimeout(() => {
                toggleForgotModal(false);
            }, 800);
        } catch (error) {
            updateForgotStatus(error.message, 'error');
            showNotification(error.message, 'error');
        } finally {
            setModalButtonLoading(
                forgotResetBtn,
                false,
                'auth.resetPasswordBtn',
                window.i18n?.t('auth.resetPasswordBtn') || 'Сменить пароль'
            );
        }
    });
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;

    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    const passwordToggle = document.querySelector('.password-toggle');
    const icon = passwordToggle?.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }
}

// Сделать функцию глобальной
window.togglePassword = togglePassword;




document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, залогинен ли пользователь
    if (window.location.pathname === '/login') {
        checkIfLoggedIn();
    }

    // Восстанавливаем сохраненный email
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
});


// ==============================================
// CSS ANIMATIONS FOR NOTIFICATIONS
// ==============================================

if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
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
            font-size: 1.1rem;
            opacity: 0.8;
            transition: opacity 0.2s;
        }

        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}


console.log('Login script initialized successfully');