// ==============================================
// SETTING.JS - Управление настройками пользователя
// ==============================================

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');

const API_BASE_URL = '/api';
const USER_DATA_KEY = 'user_data';

let currentUser = null;

// Exchange rate (1 USD = 3.3 BYN)
const EXCHANGE_RATE = {
    BYN_TO_USD: 3.3,
    USD_TO_BYN: 1 / 3.3
};

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

function removeAuthData() {
    localStorage.removeItem(USER_DATA_KEY);
}

// ==============================================
// API FUNCTIONS
// ==============================================

async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    if (response.status === 401) {
        removeAuthData();
        showNotification(window.i18n?.t('errors.sessionExpired') || 'Сессия истекла. Пожалуйста, войдите снова.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
        throw new Error(window.i18n?.t('errors.authRequired') || 'Требуется авторизация');
    }

    if (response.status === 403) {
        showNotification(window.i18n?.t('errors.accessDenied') || 'Доступ запрещен', 'error');
        throw new Error(window.i18n?.t('errors.accessDenied') || 'Доступ запрещен');
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorText = `${window.i18n?.t('errors.error') || 'Ошибка'}: ${response.status}`;

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
        const data = await apiCall('/users/profile');
        currentUser = transformUserData(data);

        const userBasicData = {
            id: currentUser.id,
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: data.role || 'USER',
            wallet: currentUser.wallet,
            avatar: currentUser.avatar
        };
        saveUserDataToStorage(userBasicData);

        updateUserInterface();
    } catch (error) {
        console.error('Failed to load user data:', error);
        if (!error.message.includes('Требуется авторизация') && !error.message.includes('Authorization Required')) {
            showNotification((window.i18n?.t('errors.profileLoadError') || 'Ошибка загрузки данных профиля') + ': ' + error.message, 'error');
        }
    }
}

// ==============================================
// UPDATE UI
// ==============================================

function updateUserInterface() {
    if (!currentUser) return;

    // Update navigation for logged in user
    updateNavigationForLoggedInUser(currentUser);

    // Update user info in settings if needed
    updateUserInfoInSettings();
}

function updateNavigationForLoggedInUser(user) {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;

    navAuth.innerHTML = `
        <div class="user-profile">
            <div class="user-info">
                <div class="user-avatar" id="userAvatar">${user.avatar || '👤'}</div>
                <div class="user-details">
                    <div class="user-name" id="userName">${user.name || (window.i18n?.t('common.user') || 'Пользователь')}</div>
                    <div class="user-wallet">
                        <i class="fas fa-wallet"></i>
                        <span id="navWalletAmount">${formatCurrency(user.wallet || 0)}</span>
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
                            <div class="user-name-small">${user.name || (window.i18n?.t('common.user') || 'Пользователь')}</div>
                            <div class="user-email-small">${user.email || ''}</div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="/profile" class="dropdown-item">
                        <i class="fas fa-user"></i>
                        ${window.i18n?.t('common.profile') || 'Мой профиль'}
                    </a>
                    <a href="/booking" class="dropdown-item">
                        <i class="fas fa-calendar"></i>
                        ${window.i18n?.t('common.bookings') || 'Мои бронирования'}
                    </a>
                    <a href="/wallet" class="dropdown-item">
                        <i class="fas fa-wallet"></i>
                        ${window.i18n?.t('common.wallet') || 'Кошелек'}
                    </a>
                    <a href="/setting" class="dropdown-item active">
                        <i class="fas fa-cog"></i>
                        ${window.i18n?.t('common.settings') || 'Настройки'}
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-item" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        ${window.i18n?.t('common.logout') || 'Выйти'}
                    </a>
                </div>
            </div>
        </div>
    `;
}

function updateUserInfoInSettings() {
    if (!currentUser) return;

    // Update user stats if they exist on the settings page
    const statsElements = {
        'userBookingsCount': currentUser.stats?.bookings || 0,
        'userRating': currentUser.stats?.rating || 4.9,
        'userYearsWithUs': currentUser.stats?.yearsWithUs || 1
    };

    Object.entries(statsElements).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    });

    // Update currency displays
    updateAllCurrencyDisplays();
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

async function saveUserSettings(settings) {
    try {
        await apiCall('/users/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });

        showNotification(window.i18n?.t('settings.settingsSaved') || 'Настройки успешно сохранены', 'success');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showNotification((window.i18n?.t('settings.settingsError') || 'Ошибка сохранения настроек') + ': ' + error.message, 'error');
    }
}

// ==============================================
// INITIALIZE
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Settings page loaded');

    checkAuthOnPageLoad();
    initializeSettings();
    loadUserData();
    setupEventListeners();
    initializeTheme();

    console.log('✅ Settings initialized successfully');
});

function checkAuthOnPageLoad() {
    const userData = getUserDataFromStorage();

    if (!userData || !userData.email) {
        console.warn('No user data found, redirecting to login...');
        removeAuthData();
        window.location.href = '/login';
        return false;
    }

    return true;
}

function initializeSettings() {
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    setupSettingsControls();
}

// ==============================================
// SETTINGS CONTROLS
// ==============================================

function setupSettingsControls() {
    const themeToggleSetting = document.getElementById('themeToggleSetting');
    if (themeToggleSetting) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeToggleSetting.checked = currentTheme === 'dark';

        themeToggleSetting.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            setTheme(newTheme);
            const themeText = newTheme === 'dark' 
                ? (window.i18n?.t('settings.dark') || 'темную')
                : (window.i18n?.t('settings.light') || 'светлую');
            showNotification(`${window.i18n?.t('settings.themeChanged') || 'Тема изменена на'} ${themeText}`, 'success');
        });
    }

    const languageSetting = document.getElementById('languageSetting');
    if (languageSetting) {
        const savedLanguage = localStorage.getItem('language') || 'ru';
        languageSetting.value = savedLanguage;

        languageSetting.addEventListener('change', async function() {
            const language = this.value;
            localStorage.setItem('language', language);

            await saveUserSettings({ language });

            showNotification(window.i18n?.t('settings.languageChanged') || 'Язык интерфейса изменен', 'success');
            // Reload translations after language change
            if (window.i18n) {
                await window.i18n.setLanguage(language);
            }
        });
    }

    const currencySetting = document.getElementById('currencySetting');
    if (currencySetting) {
        const savedCurrency = localStorage.getItem('currency') || 'BYN';
        currencySetting.value = savedCurrency;

        currencySetting.addEventListener('change', async function() {
            const currency = this.value;
            localStorage.setItem('currency', currency);

            await saveUserSettings({ currency });

            applyCurrencySettings(currency);
            const currencyName = getCurrencyName(currency);
            showNotification(`${window.i18n?.t('settings.currencyChanged') || 'Валюта изменена на'} ${currencyName}`, 'success');
            
            // Trigger storage event to update other pages
            window.dispatchEvent(new Event('storage'));
        });
    }

    setupNotificationToggles();
}

function setupNotificationToggles() {
    const toggles = document.querySelectorAll('.notification-toggle');

    toggles.forEach(toggle => {
        const settingName = toggle.dataset.setting;
        const savedValue = localStorage.getItem(settingName);

        if (savedValue !== null) {
            toggle.checked = savedValue === 'true';
        }

        toggle.addEventListener('change', async function() {
            const isEnabled = this.checked;
            localStorage.setItem(settingName, isEnabled.toString());

            const settingLabel = this.closest('.settings-item')?.querySelector('label')?.textContent || 'Настройка';
            const statusText = isEnabled 
                ? (window.i18n?.t('settings.settingEnabled') || 'включена')
                : (window.i18n?.t('settings.settingDisabled') || 'отключена');
            showNotification(`${settingLabel} ${statusText}`, 'info');

            const settings = {};
            settings[settingName] = isEnabled;
            await saveUserSettings(settings);
        });
    });
}

// ==============================================
// CURRENCY & LANGUAGE
// ==============================================

function applyCurrencySettings(currency) {
    if (currentUser) {
        updateAllCurrencyDisplays();
        updateNavigationForLoggedInUser(currentUser);
    }
}

function getCurrencyName(currencyCode) {
    if (window.i18n) {
        return window.i18n.t(`currencies.${currencyCode}`) || currencyCode;
    }
    const currencyNames = {
        'BYN': 'Белорусский рубль',
        'USD': 'Доллар США',
    };
    return currencyNames[currencyCode] || currencyCode;
}

// Currency conversion functions
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    const amountNum = Number(amount) || 0;
    
    if (fromCurrency === 'BYN' && toCurrency === 'USD') {
        return amountNum / EXCHANGE_RATE.BYN_TO_USD;
    } else if (fromCurrency === 'USD' && toCurrency === 'BYN') {
        return amountNum * EXCHANGE_RATE.BYN_TO_USD;
    }
    
    return amountNum;
}

function formatCurrency(amount, currency = null) {
    const selectedCurrency = currency || localStorage.getItem('currency') || 'BYN';
    const amountNum = Number(amount) || 0;
    
    // Convert from BYN to selected currency
    const convertedAmount = convertCurrency(amountNum, 'BYN', selectedCurrency);
    
    const currencies = {
        'BYN': 'Br',
        'USD': '$',
    };
    
    const symbol = currencies[selectedCurrency] || 'Br';
    return `${convertedAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${symbol}`;
}

function updateAllCurrencyDisplays() {
    if (!currentUser) return;

    const walletElements = document.querySelectorAll('.user-wallet span, #walletAmount');
    walletElements.forEach(element => {
        element.textContent = formatCurrency(currentUser.wallet || 0);
    });
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

// ==============================================
// UPDATE UI
// ==============================================





// ==============================================
// LOGOUT
// ==============================================

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        showNotification(window.i18n?.t('errors.loggedOut') || 'Вы вышли из системы', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification(window.i18n?.t('errors.logoutError') || 'Ошибка выхода из системы', 'error');
    } finally {
        removeAuthData();
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

// ==============================================
// THEME MANAGEMENT
// ==============================================

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

    const themeToggleSetting = document.getElementById('themeToggleSetting');
    if (themeToggleSetting) {
        themeToggleSetting.checked = theme === 'dark';
    }

    handleHeaderScroll();
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
// HEADER SCROLL EFFECT
// ==============================================

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

// ==============================================
// EVENT LISTENERS
// ==============================================

function setupEventListeners() {
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });

    window.addEventListener('scroll', handleHeaderScroll);
}

// ==============================================
// NOTIFICATION SYSTEM
// ==============================================

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
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

if (!document.querySelector('#notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
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
            font-size: 1.1rem;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        
        .notification-close:hover {
            opacity: 1;
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
}

console.log('Settings script initialized successfully');