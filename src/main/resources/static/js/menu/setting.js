// Settings Management JavaScript

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');

const API_BASE_URL = '/api';

// User data
let currentUser = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // 💡 Инициализируем UI/настройки перед попыткой загрузки данных
    initializeSettings();
    loadUserData();
    setupEventListeners();
    initializeTheme();
});

// Initialize settings page
function initializeSettings() {
    // Set up mobile navigation
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Set up settings controls
    setupSettingsControls();
}

// Load user data from localStorage/backend
function loadUserData() {
    // 1. Попытка загрузить данные из localStorage (для быстрого отображения)
    const userDataJson = localStorage.getItem('user_data');

    if (userDataJson) {
        try {
            currentUser = JSON.parse(userDataJson);
            updateUserInterface();
        } catch (error) {
            console.error('Error parsing user data from storage:', error);
        }
    }

    // 2. Всегда пытаемся загрузить актуальные данные с бэкенда
    loadUserDataFromBackend();

    // 💡 УДАЛЕНО: Создание демо-пользователя, если нет данных.
    // На странице настроек пользователь должен быть аутентифицирован.
}

// 💡 ИЗМЕНЕНО: Load user data from backend API (используем Cookie)
async function loadUserDataFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            // 💡 ГЛАВНОЕ ИЗМЕНЕНИЕ: включаем Cookie
            credentials: 'include'
        });

        if (response.status === 401) {
            // Если Cookie невалиден/отсутствует, перенаправляем
            removeAuthData();
            showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
            return;
        }

        if (response.ok) {
            const userData = await response.json();
            currentUser = transformUserData(userData);

            // Сохраняем актуальные данные в localStorage
            const userBasicData = {
                name: currentUser.name,
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                wallet: currentUser.wallet,
                avatar: currentUser.avatar,
            };
            localStorage.setItem('user_data', JSON.stringify(userBasicData));

            updateUserInterface();
        } else {
            console.error('Backend returned non-OK status:', response.status);
            showNotification('Ошибка загрузки данных профиля.', 'error');
        }
    } catch (error) {
        console.error('Failed to load user data from backend:', error);
        showNotification('Ошибка сети. Не удалось загрузить данные профиля.', 'error');
    }
}

// Transform backend user data to frontend format
function transformUserData(apiData) {
    return {
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

// ⚠️ УДАЛЕНО: getAuthToken() больше не нужен.

// 💡 НОВАЯ ФУНКЦИЯ: Очистка локальных данных
function removeAuthData() {
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user_data');
    // Удаляем устаревшие ключи токена на всякий случай
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
}

// Update user interface with current user data
function updateUserInterface() {
    if (!currentUser) return;

    // Update navigation
    updateNavigationForLoggedInUser(currentUser);
}

// Update navigation for logged in user
function updateNavigationForLoggedInUser(user) {
    const navAuth = document.querySelector('.nav-auth');
    if (navAuth) {
        // ... (HTML structure for user profile and dropdown remains the same) ...
        navAuth.innerHTML = `
            <div class="user-profile">
                <div class="user-info">
                    <div class="user-avatar">${user.avatar || '👤'}</div>
                    <div class="user-details">
                        <div class="user-name">${user.name || user.firstName + ' ' + user.lastName || 'Пользователь'}</div>
                        <div class="user-wallet">
                            <i class="fas fa-wallet"></i>
                            <span id="walletAmount">${formatCurrency(user.wallet || 0)}</span>
                        </div>
                    </div>
                </div>
                <div class="user-menu">
                    <button class="btn-auth btn-user" onclick="toggleUserMenu()">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-header">
                            <div class="user-avatar-small">${user.avatar || '👤'}</div>
                            <div>
                                <div class="user-name-small">${user.name || user.firstName + ' ' + user.lastName || 'Пользователь'}</div>
                                <div class="user-email-small">${user.email || ''}</div>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="/profile" class="dropdown-item">
                            <i class="fas fa-user"></i>
                            Мой профиль
                        </a>
                        <a href="/booking" class="dropdown-item">
                            <i class="fas fa-calendar"></i>
                            Мои бронирования
                        </a>
                        <a href="/wallet" class="dropdown-item">
                            <i class="fas fa-wallet"></i>
                            Кошелек
                        </a>
                        <a href="/setting" class="dropdown-item active">
                            <i class="fas fa-cog"></i>
                            Настройки
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-item" onclick="logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            Выйти
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Format currency based on selected currency
function formatCurrency(amount) {
    const currency = localStorage.getItem('currency') || 'BYN';
    const currencies = {
        'BYN': 'Br',
        'USD': '$',
        'EUR': '€',
        'RUB': '₽'
    };

    const symbol = currencies[currency] || 'Br';
    return `${amount.toLocaleString()}${symbol}`;
}

// Setup settings controls
function setupSettingsControls() {
    // Theme toggle
    const themeToggleSetting = document.getElementById('themeToggleSetting');
    if (themeToggleSetting) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeToggleSetting.checked = currentTheme === 'dark';

        themeToggleSetting.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            setTheme(newTheme);
            showNotification(`Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`, 'success');
        });
    }

    // Language setting
    const languageSetting = document.getElementById('languageSetting');
    if (languageSetting) {
        const savedLanguage = localStorage.getItem('language') || 'ru';
        languageSetting.value = savedLanguage;

        languageSetting.addEventListener('change', function() {
            const language = this.value;
            localStorage.setItem('language', language);
            applyLanguageSettings(language);
            showNotification('Язык интерфейса изменен', 'success');
        });
    }

    // Currency setting - ADDED NEW CURRENCY SETTING
    const currencySetting = document.getElementById('currencySetting');
    if (currencySetting) {
        const savedCurrency = localStorage.getItem('currency') || 'BYN';
        currencySetting.value = savedCurrency;

        currencySetting.addEventListener('change', function() {
            const currency = this.value;
            localStorage.setItem('currency', currency);
            applyCurrencySettings(currency);
            showNotification(`Валюта изменена на ${getCurrencyName(currency)}`, 'success');
        });
    }
}

// Apply language settings
function applyLanguageSettings(language) {
    console.log('Language changed to:', language);
}

// Apply currency settings
function applyCurrencySettings(currency) {
    // Update wallet display
    const walletAmount = document.getElementById('walletAmount');
    if (walletAmount && currentUser) {
        walletAmount.textContent = formatCurrency(currentUser.wallet || 0);
    }

    updateAllCurrencyDisplays();
}

// Get currency name for display
function getCurrencyName(currencyCode) {
    const currencyNames = {
        'BYN': 'Белорусский рубль',
        'USD': 'Доллар США',
        'EUR': 'Евро',
        'RUB': 'Российский рубль'
    };
    return currencyNames[currencyCode] || currencyCode;
}

// Update all currency displays on the page
function updateAllCurrencyDisplays() {
    if (currentUser) {
        const walletElements = document.querySelectorAll('.user-wallet span, #walletAmount');
        walletElements.forEach(element => {
            element.textContent = formatCurrency(currentUser.wallet || 0);
        });
    }
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

// 💡 ИЗМЕНЕНО: Logout function (нужен API вызов для очистки Cookie на сервере)
async function logout() {
    try {
        // 💡 Отправляем запрос на сервер, чтобы очистить HTTP-only Cookie
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include' // Чтобы отправить Cookie
        });

        showNotification('Вы вышли из системы', 'info');
        removeAuthData(); // Очищаем локальные данные

    } catch (error) {
        console.error('Logout failed but proceeding with client clear:', error);
        // В случае сбоя сети, все равно очищаем клиент и перенаправляем
        showNotification('Ошибка выхода из системы. Очистка клиента...', 'error');
        removeAuthData();
    }

    // Redirect to home page
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// Header scroll effect
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (!header) return;

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
function initializeTheme() {
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

    // Update settings toggle
    const themeToggleSetting = document.getElementById('themeToggleSetting');
    if (themeToggleSetting) {
        themeToggleSetting.checked = theme === 'dark';
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
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });

    // Header scroll effect
    window.addEventListener('scroll', handleHeaderScroll);
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

// Add notification styles (for animation)
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