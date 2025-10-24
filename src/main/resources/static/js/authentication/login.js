// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
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

function validatePassword(password) {
    return password.length >= 6;
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

passwordInput.addEventListener('input', function() {
    const password = this.value;

    if (password === '') {
        clearError('password');
        return;
    }

    if (validatePassword(password)) {
        showSuccess('password');
    } else {
        showError('password', 'Пароль должен содержать минимум 6 символов');
    }
});

// Password toggle functionality
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.classList.remove('fa-eye');
        passwordIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordIcon.classList.remove('fa-eye-slash');
        passwordIcon.classList.add('fa-eye');
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

// Login function
async function loginUser(email, password) {
    const loginData = {
        email: email,
        password: password
    };

    return await makeRequest(`${API_BASE_URL}/auth/login`, 'POST', loginData);
}

// Form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous errors
    clearError('email');
    clearError('password');

    // Validate form
    let isValid = true;

    if (!email) {
        showError('email', 'Введите email адрес');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('email', 'Введите корректный email адрес');
        isValid = false;
    }

    if (!password) {
        showError('password', 'Введите пароль');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('password', 'Пароль должен содержать минимум 6 символов');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Set loading state
    setLoadingState(true);

    try {
        // Make API call
        const authResponse = await loginUser(email, password);

        if (authResponse && authResponse.token && authResponse.user) {
            // Store authentication data
            storeAuthData(authResponse);

            showNotification('Успешный вход в систему!', 'success');

            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            throw new Error('Неверный ответ от сервера');
        }

    } catch (error) {
        console.error('Login error:', error);

        // Более конкретные сообщения об ошибках
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            showNotification('Неверный email или пароль', 'error');
        } else if (error.message.includes('Network Error')) {
            showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
        } else if (error.message.includes('400')) {
            showNotification('Ошибка в данных запроса', 'error');
        } else {
            showNotification(error.message || 'Ошибка входа. Попробуйте еще раз.', 'error');
        }

        setLoadingState(false);
    }
});

// Social login handlers
document.querySelector('.social-google')?.addEventListener('click', function() {
    showNotification('Функция входа через Google будет добавлена позже', 'info');
});

document.querySelector('.social-facebook')?.addEventListener('click', function() {
    showNotification('Функция входа через Facebook будет добавлена позже', 'info');
});

// Forgot password handler
document.querySelector('.forgot-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    showNotification('Функция восстановления пароля будет добавлена позже', 'info');
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
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();

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
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Функция для отладки (можно удалить после тестирования)
async function debugLogin() {
    console.log('Testing login API...');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'password'
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
window.debugLogin = debugLogin;