const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const submitBtn = document.querySelector('.auth-btn-primary');

const API_BASE_URL = 'http://localhost:8080/api';
const USER_KEY = 'user_data';

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

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function updateInputState(inputId, state, message = '') {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');

    input.classList.remove('error', 'success');
    errorElement.classList.remove('show');

    if (state === 'success') {
        input.classList.add('success');
    } else if (state === 'error') {
        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

emailInput.addEventListener('input', function() {
    const email = this.value.trim();

    if (email === '') {
        updateInputState('email', 'neutral');
        return;
    }

    if (validateEmail(email)) {
        updateInputState('email', 'success');
    } else {
        updateInputState('email', 'error', 'Введите корректный email адрес');
    }
});

passwordInput.addEventListener('input', function() {
    const password = this.value;

    if (password === '') {
        updateInputState('password', 'neutral');
        return;
    }

    if (validatePassword(password)) {
        updateInputState('password', 'success');
    } else {
        updateInputState('password', 'error', 'Пароль должен содержать минимум 6 символов');
    }
});

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordIcon.classList.replace('fa-eye-slash', 'fa-eye');
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
                        } catch (textError) {}
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

async function loginUser(email, password) {
    const loginData = {
        email: email,
        password: password
    };

    return await makeRequest(`${API_BASE_URL}/auth/login`, 'POST', loginData);
}

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    updateInputState('email', 'neutral');
    updateInputState('password', 'neutral');

    let isValid = true;

    if (!email) {
        updateInputState('email', 'error', 'Введите email адрес');
        isValid = false;
    } else if (!validateEmail(email)) {
        updateInputState('email', 'error', 'Введите корректный email адрес');
        isValid = false;
    }

    if (!password) {
        updateInputState('password', 'error', 'Введите пароль');
        isValid = false;
    } else if (!validatePassword(password)) {
        updateInputState('password', 'error', 'Пароль должен содержать минимум 6 символов');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    setLoadingState(true);

    try {
        const authResponse = await loginUser(email, password);

        if (authResponse && authResponse.user) {
            storeAuthData(authResponse);

            showNotification('Успешный вход в систему!', 'success');

            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            throw new Error('Неверный ответ от сервера');
        }

    } catch (error) {
        console.error('Login error:', error);

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

document.querySelector('.social-google')?.addEventListener('click', function() {
    showNotification('Функция входа через Google будет добавлена позже', 'info');
});

document.querySelector('.social-facebook')?.addEventListener('click', function() {
    showNotification('Функция входа через Facebook будет добавлена позже', 'info');
});

document.querySelector('.forgot-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    showNotification('Функция восстановления пароля будет добавлена позже', 'info');
});

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

document.addEventListener('DOMContentLoaded', function() {
    initTheme();

    const userData = getUserData();

    if (userData) {
        showNotification('Вы уже входили в систему. Если Cookie валиден, вы будете аутентифицированы.', 'info');
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
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});

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

window.debugLogin = debugLogin;