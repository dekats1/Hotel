// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// ⚠️ Имя Cookie, используемое бэкендом (для логаута)
const JWT_COOKIE_NAME = 'auth_jwt';
// Ключ для данных пользователя в LocalStorage (не токен!)
const USER_KEY = 'user_data';

// API Base URL (предполагаем, что оно определено или 'http://localhost:8080/api' как в login.js)
const API_BASE_URL = 'http://localhost:8080/api';

// ----------------------------------------------------------------
// ❌ УДАЛЕНО: getToken(), setToken(), removeToken() для LocalStorage.
// ----------------------------------------------------------------

// Удалить данные пользователя из LocalStorage
function removeUserData() {
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

// HTTP клиент с Cookie
async function apiClient(url, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            // 💡 ВАЖНО: Cookie отправляются автоматически, но мы должны
            // явно запросить их отправку (credentials: 'include')
        },
        // 💡 ГЛАВНОЕ ИЗМЕНЕНИЕ: Включаем Cookie в запросы
        credentials: 'include',
        ...options,
    };

    // ❌ УДАЛЕНО: Добавление заголовка Authorization

    // Если POST/PUT/DELETE, возможно, нужно настроить защиту от CSRF,
    // но в данной реализации мы полагаемся на SameSite=Lax и HttpOnly.

    try {
        const response = await fetch(url, config);

        if (response.status === 401 || response.status === 403) {
            // При 401/403 (неавторизован/запрещено) удаляем локальные данные
            // и обновляем навигацию. Сервер уже удалил или проигнорировал Cookie.
            removeUserData();
            updateNavigation();
            showNotification('Сессия истекла или токен недействителен. Пожалуйста, войдите снова.', 'error');
            throw new Error('Unauthorized or Forbidden');
        }

        // Проверяем, есть ли контент для парсинга
        const contentType = response.headers.get('content-type');
        const hasJson = contentType && contentType.includes('application/json');
        const hasContent = response.status !== 204; // No Content

        if (!response.ok) {
            // Логика обработки ошибок (оставлена без изменений)
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
                            // Игнорируем
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
            return await response.text();
        } else {
            return null;
        }
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Проверка авторизации на клиенте (основана только на LocalStorage)
function checkAuthStatus() {
    const userData = getUserData();

    // Мы не можем проверить валидность JWT токена на клиенте, так как он HttpOnly.
    // Поэтому просто проверяем, есть ли сохраненные данные пользователя.
    // Если эти данные есть, мы предполагаем, что Cookie существует и действителен.
    // Если Cookie недействителен, первый же запрос к защищенному эндпоинту
    // вернет 401, и apiClient сработает, очистив локальные данные.
    const isAuthenticated = !!userData;

    updateNavigation(isAuthenticated, userData);
    return isAuthenticated;
}

// Функция для обновления навигации
function updateNavigation(isAuthenticated, userData) {
    const navAuth = document.querySelector('.nav-auth');
    userData = userData || getUserData(); // Используем переданные или локальные данные

    if (isAuthenticated && userData) {
        // Показываем профиль пользователя
        navAuth.innerHTML = `
            <div class="user-profile">
                <div class="user-info">
                    <div class="user-avatar">${userData.firstName?.charAt(0) || '👤'}</div>
                    <div class="user-details">
                        <div class="user-name">${userData.firstName} ${userData.lastName}</div>
                        <div class="user-email">${userData.email}</div>
                    </div>
                </div>
                <div class="user-menu">
                    <button class="btn-auth btn-user" onclick="toggleUserMenu()">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-header">
                            <div class="user-avatar-small">${userData.firstName?.charAt(0) || '👤'}</div>
                            <div>
                                <div class="user-name-small">${userData.firstName} ${userData.lastName}</div>
                                <div class="user-email-small">${userData.email}</div>
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
                    </div>
                </div>
            </div>
        `;
    } else {
        // Показываем кнопки входа/регистрации
        navAuth.innerHTML = `
            <a href="/login" class="btn-auth btn-login">
                <i class="fas fa-sign-in-alt"></i>
                Войти
            </a>
            <a href="/register" class="btn-auth btn-register">
                <i class="fas fa-user-plus"></i>
                Регистрация
            </a>
        `;
    }
}

// Функция входа (обновляем только логику сохранения данных)
async function login(email, password) {
    // Эта функция, скорее всего, определена в login.js, но на всякий случай, если
    // она используется здесь для другого сценария. В этом файле ее можно удалить.
}

// Функция регистрации (обновляем только логику сохранения данных)
async function register(userData) {
    // Аналогично, лучше оставить эту логику в register.js
}

// Функция выхода
async function logout() {
    try {
        // 1. Отправляем запрос на бэкенд для удаления HTTP-only Cookie
        await apiClient(`${API_BASE_URL}/auth/logout`, {
            method: 'POST'
            // credentials: 'include' уже установлен в apiClient
        });

        // 2. Удаляем локальные данные пользователя
        removeUserData();

        // 3. Обновляем UI
        updateNavigation(false);
        showNotification('Вы успешно вышли из системы', 'success');

        // 4. Закрываем меню и перенаправляем на главную
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
        setTimeout(() => {
            window.location.href = '/';
        }, 300);

    } catch (error) {
        console.error('Logout failed:', error);
        // Если логаут не удался на бэкенде, мы все равно удаляем данные на клиенте
        // чтобы предотвратить видимость аутентифицированного состояния.
        removeUserData();
        updateNavigation(false);
        showNotification('Произошла ошибка при выходе, но локальная сессия очищена.', 'error');
    }
}

// Функция переключения меню пользователя
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Закрытие меню при клике вне его
function handleDropdownClick(e) {
    const dropdown = document.getElementById('userDropdown');
    // Проверяем, что клик не был ни на выпадающем меню, ни на кнопке
    if (dropdown && !e.target.closest('.user-menu')) {
        dropdown.classList.remove('show');
    }
}

// Mobile Navigation Toggle
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

// Close mobile menu when clicking on a link
function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

// Event Listeners for Navigation
if (navToggle) {
    navToggle.addEventListener('click', toggleMobileMenu);
}

navLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// Smooth scrolling for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');

        if (!targetId.startsWith('#')) {
            return;
        }

        e.preventDefault();
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = targetSection.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

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

// Active navigation link on scroll
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Notification system (оставлена без изменений)
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

// Add notification styles (оставлена без изменений)
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

// Intersection Observer for animations (оставлена без изменений)
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.value-card, .team-member, .achievement-item, .certificate-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Counter animation for achievements (оставлена без изменений)
function animateCounters() {
    const counters = document.querySelectorAll('.achievement-number');

    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
        const increment = target / 100;
        let current = 0;

        const updateCounter = () => {
            if (current < target) {
                current += increment;
                const displayValue = Math.ceil(current);

                if (counter.textContent.includes('+')) {
                    counter.textContent = displayValue.toLocaleString() + '+';
                } else if (counter.textContent.includes('.')) {
                    counter.textContent = (displayValue / 10).toFixed(1);
                } else {
                    counter.textContent = displayValue.toLocaleString();
                }

                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = counter.textContent;
            }
        };

        updateCounter();
    });
}

// Parallax effect for hero section (оставлена без изменений)
function handleParallax() {
    const hero = document.querySelector('.about-hero');
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
}

// Theme management (оставлена без изменений)
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

// Initialize all functionality
async function init() {
    initTheme();

    // Check user authentication state and update navigation
    checkAuthStatus(); // 💡 Вызываем новую функцию

    window.addEventListener('scroll', () => {
        handleHeaderScroll();
        updateActiveNavLink();
        handleParallax();
    });

    document.addEventListener('click', handleDropdownClick);

    setupScrollAnimations();

    const achievementsSection = document.querySelector('.achievements-section');
    if (achievementsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(achievementsSection);
    }

    handleHeaderScroll();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add smooth animations on page load (оставлена без изменений)
document.addEventListener('DOMContentLoaded', function() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';

        setTimeout(() => {
            heroContent.style.transition = 'all 0.6s ease';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);
    }
});

// Глобальные функции для доступа из HTML
window.toggleTheme = toggleTheme;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
// 💡 Удалены window.login и window.register, предполагая, что они
// определены только на соответствующих страницах (login.js, register.js)
