// ==============================================
// LOGIN.JS - Авторизация с HttpOnly JWT Cookie
// ==============================================

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const submitBtn = document.querySelector('.auth-btn-primary');

// API Base URL
const API_BASE_URL = '/api';

// LocalStorage ключ для данных пользователя (БЕЗ ТОКЕНА)
const USER_DATA_KEY = 'user_data';

// ==============================================
// STORAGE FUNCTIONS (БЕЗ ТОКЕНА)
// ==============================================

/**
 * Сохранить данные пользователя в localStorage
 * JWT токен находится в HttpOnly Cookie и недоступен из JS
 */
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
        // Добавьте другие нечувствительные данные при необходимости
    };

    try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        console.log('User data stored successfully');
    } catch (error) {
        console.error('Error storing user data:', error);
    }
}

/**
 * Получить данные пользователя из localStorage
 */
function getUserData() {
    try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

/**
 * Удалить данные пользователя из localStorage
 * JWT Cookie удаляется через /api/auth/logout
 */
function removeAuthData() {
    try {
        localStorage.removeItem(USER_DATA_KEY);
        console.log('User data removed from storage');
    } catch (error) {
        console.error('Error removing user data:', error);
    }
}

// ==============================================
// API FUNCTIONS
// ==============================================

/**
 * Авторизация пользователя
 * JWT токен автоматически устанавливается в HttpOnly Cookie бэкендом
 */
async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // ✅ ВАЖНО: отправляем и получаем cookies
            body: JSON.stringify(credentials)
        });

        // Обработка ошибок
        if (!response.ok) {
            let errorMessage = 'Ошибка авторизации';

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Если не JSON, пытаемся получить текст
                errorMessage = await response.text() || errorMessage;
            }

            throw new Error(errorMessage);
        }

        // Получаем данные пользователя
        const data = await response.json();
        console.log('Login successful:', data);

        // ✅ JWT токен уже установлен в HttpOnly Cookie бэкендом
        // Сохраняем только user_data в localStorage
        storeAuthData(data);

        return data;

    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Регистрация нового пользователя
 */
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // ✅ ВАЖНО: получаем cookies
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            let errorMessage = 'Ошибка регистрации';

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

        // ✅ JWT токен уже установлен в HttpOnly Cookie
        storeAuthData(data);

        return data;

    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

/**
 * Выход из системы
 * Удаляет JWT Cookie на бэкенде
 */
async function logoutUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include' // ✅ Отправляем Cookie для удаления
        });

        if (!response.ok) {
            console.warn('Logout request failed, but continuing...');
        }

        console.log('Logout successful');

    } catch (error) {
        console.error('Logout error:', error);
        // Продолжаем выход даже при ошибке
    } finally {
        // Удаляем локальные данные
        removeAuthData();

        // Перенаправляем на страницу входа
        window.location.href = '/login';
    }
}

// ==============================================
// UI FUNCTIONS
// ==============================================

/**
 * Показать уведомление
 */
function showNotification(message, type = 'info') {
    // Удалить существующие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Создать элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Определить иконку
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

    // Стили уведомления
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

    // Добавить в DOM
    document.body.appendChild(notification);

    // Автоматически удалить через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

/**
 * Показать/скрыть загрузку на кнопке
 */
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Войти';
    }
}

/**
 * Валидация email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Валидация формы
 */
function validateLoginForm(email, password) {
    if (!email || !password) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return false;
    }

    if (!isValidEmail(email)) {
        showNotification('Пожалуйста, введите корректный email', 'error');
        return false;
    }

    if (password.length < 6) {
        showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return false;
    }

    return true;
}

/**
 * Перенаправление после успешного входа
 */
function redirectAfterLogin(userData) {
    // Проверяем роль пользователя
    const role = userData.user?.role || userData.role;

    // Перенаправление в зависимости от роли
    if (role === 'ADMIN') {
        window.location.href = '/admin';
    } else {
        window.location.href = '/';
    }
}

// ==============================================
// EVENT HANDLERS
// ==============================================

/**
 * Обработчик отправки формы логина
 */
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Получить данные формы
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Валидация
        if (!validateLoginForm(email, password)) {
            return;
        }

        const credentials = { email, password };

        // Показать загрузку
        setButtonLoading(submitBtn, true);

        try {
            // Отправить запрос на авторизацию
            const authData = await loginUser(credentials);

            // Показать успешное уведомление
            showNotification('Вход выполнен успешно!', 'success');

            // Подождать немного для показа уведомления
            setTimeout(() => {
                redirectAfterLogin(authData);
            }, 1000);

        } catch (error) {
            // Показать ошибку
            showNotification(error.message, 'error');
            setButtonLoading(submitBtn, false);
        }
    });
}

// ==============================================
// PASSWORD VISIBILITY TOGGLE
// ==============================================

const passwordToggle = document.querySelector('.password-toggle');
if (passwordToggle) {
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;

        const icon = this.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    });
}

// ==============================================
// REMEMBER ME FUNCTIONALITY
// ==============================================

// Загрузить сохраненный email при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
});

// Сохранить email при выборе "Запомнить меня"
if (rememberCheckbox) {
    rememberCheckbox.addEventListener('change', function() {
        if (this.checked && emailInput.value) {
            localStorage.setItem('remembered_email', emailInput.value.trim());
        } else {
            localStorage.removeItem('remembered_email');
        }
    });
}

// ==============================================
// REDIRECT IF ALREADY LOGGED IN
// ==============================================

/**
 * Проверить, авторизован ли пользователь
 * (только по наличию данных в localStorage)
 */
function checkIfLoggedIn() {
    const userData = getUserData();

    if (userData) {
        console.log('User already logged in, redirecting...');

        // Перенаправление в зависимости от роли
        if (userData.role === 'ADMIN') {
            window.location.href = '/profileAdmin';
        } else {
            window.location.href = '/';
        }
    }
}

// Проверить при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Если мы на странице логина, проверим авторизацию
    if (window.location.pathname === '/login') {
        checkIfLoggedIn();
    }
});

// ==============================================
// CSS ANIMATIONS FOR NOTIFICATIONS
// ==============================================

// Добавить стили анимаций, если их еще нет
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

// ==============================================
// EXPORT FUNCTIONS (если используете модули)
// ==============================================

// Если используете ES6 модули, можете экспортировать функции:
// export { loginUser, registerUser, logoutUser, getUserData, showNotification };

console.log('Login script initialized successfully');
