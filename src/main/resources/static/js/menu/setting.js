// Settings Management JavaScript

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');

// User data
let currentUser = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
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
            wallet: 15000,
            avatar: '👤'
        };
        updateUserInterface();
    }
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
        navAuth.innerHTML = `
            <div class="user-profile">
                <div class="user-info">
                    <div class="user-avatar">${user.avatar || '👤'}</div>
                    <div class="user-details">
                        <div class="user-name">${user.name || user.firstName + ' ' + user.lastName || 'Пользователь'}</div>
                        <div class="user-wallet">
                            <i class="fas fa-wallet"></i>
                            <span>${user.wallet ? user.wallet.toLocaleString() + '₽' : '0₽'}</span>
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
                        <a href="/setting" class="dropdown-item">
                            <i class="fas fa-cog"></i>
                            Настройки
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-item" onclick="logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            Выйти
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
            localStorage.setItem('language', this.value);
            showNotification('Язык интерфейса изменен', 'success');
        });
    }

    // Notification settings
    const notificationToggles = document.querySelectorAll('.settings-options .switch input[type="checkbox"]');
    notificationToggles.forEach((toggle, index) => {
        const settingKey = `notification_${index}`;
        const savedValue = localStorage.getItem(settingKey);
        if (savedValue !== null) {
            toggle.checked = savedValue === 'true';
        }
        
        toggle.addEventListener('change', function() {
            localStorage.setItem(settingKey, this.checked);
            const settingName = this.closest('.setting-item').querySelector('h3').textContent;
            showNotification(`${settingName} ${this.checked ? 'включено' : 'отключено'}`, 'info');
        });
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

// Logout function
function logout() {
    showNotification('Вы вышли из системы', 'info');
    
    // Clear user data
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    
    // Redirect to home page
    window.location.href = '../home.html';
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
    
    // Update settings toggle
    const themeToggleSetting = document.getElementById('themeToggleSetting');
    if (themeToggleSetting) {
        themeToggleSetting.checked = newTheme === 'dark';
    }
    
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

