// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const searchForm = document.getElementById('searchForm');
const contactForm = document.getElementById('contactForm');

// JWT Token management
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Получить JWT токен из localStorage
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

// HTTP клиент с JWT авторизацией
async function apiClient(url, options = {}) {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Добавляем токен в заголовки если есть
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            // Токен невалидный - разлогиниваем
            removeToken();
            updateNavigation();
            showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
            throw new Error('Unauthorized');
        }

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

// Проверка авторизации на сервере
async function checkAuthStatus() {
    const token = getToken();
    const userData = getUserData();

    if (!token || !userData) {
        updateNavigation();
        return false;
    }

    try {
        // В вашем случае нет отдельного endpoint для проверки auth,
        // поэтому просто проверяем валидность токена через любой защищенный endpoint
        // или используем сохраненные данные
        updateNavigation();
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        removeToken();
        updateNavigation();
        return false;
    }
}

// Функция для обновления навигации
function updateNavigation() {
    const navAuth = document.querySelector('.nav-auth');
    const userData = getUserData();

    if (userData && getToken()) {
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

// Функция входа
async function login(email, password) {
    try {
        const response = await apiClient('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response && response.token && response.user) {
            setToken(response.token);
            setUserData(response.user);
            updateNavigation();
            showNotification('Успешный вход!', 'success');
            return true;
        } else {
            showNotification('Неверный email или пароль', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);

        // Более конкретные сообщения об ошибках
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            showNotification('Неверный email или пароль', 'error');
        } else if (error.message.includes('Network Error')) {
            showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
        } else {
            showNotification('Ошибка входа. Попробуйте еще раз.', 'error');
        }
        return false;
    }
}

// Функция регистрации
async function register(userData) {
    try {
        // Проверка совпадения паролей на клиенте
        if (userData.password !== userData.confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return false;
        }

        const response = await apiClient('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response && response.token && response.user) {
            setToken(response.token);
            setUserData(response.user);
            updateNavigation();
            showNotification('Регистрация успешна! Добро пожаловать!', 'success');
            return true;
        } else {
            showNotification('Ошибка регистрации', 'error');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);

        // Более конкретные сообщения об ошибках
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
            showNotification('Пользователь с таким email или телефоном уже существует', 'error');
        } else if (error.message.includes('Network Error')) {
            showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
        } else {
            showNotification('Ошибка регистрации. Попробуйте еще раз.', 'error');
        }
        return false;
    }
}

// Функция выхода
function logout() {
    removeToken();
    updateNavigation();
    showNotification('Вы успешно вышли из системы', 'success');

    // Закрываем меню если оно открыто
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
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

        // If it's an external link (not starting with #), allow normal navigation
        if (!targetId.startsWith('#')) {
            return; // Allow normal link behavior
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

// Scroll to search section
function scrollToSearch() {
    const searchSection = document.querySelector('.search-section');
    if (searchSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = searchSection.offsetTop - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Scroll to rooms section
function scrollToRooms() {
    const roomsSection = document.querySelector('.rooms-preview');
    if (roomsSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = roomsSection.offsetTop - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
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

// Search form handling
function handleSearchForm(e) {
    e.preventDefault();

    const formData = new FormData(searchForm);
    const searchData = {
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        guests: formData.get('guests'),
        roomType: formData.get('room-type')
    };

    // Validate dates
    if (new Date(searchData.checkin) >= new Date(searchData.checkout)) {
        showNotification('Дата выезда должна быть позже даты заезда', 'error');
        return;
    }

    if (new Date(searchData.checkin) < new Date().setHours(0, 0, 0, 0)) {
        showNotification('Дата заезда не может быть в прошлом', 'error');
        return;
    }

    // Show loading state
    const submitBtn = searchForm.querySelector('.btn-search');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Поиск...';
    submitBtn.disabled = true;

    // Simulate search process
    setTimeout(() => {
        showNotification('Поиск номеров выполнен! Результаты будут показаны в следующем разделе.', 'success');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Scroll to rooms section
        scrollToRooms();
    }, 2000);
}

// Contact form handling
function handleContactForm(e) {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };

    // Basic validation
    if (!contactData.name || !contactData.email || !contactData.message) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }

    if (!isValidEmail(contactData.email)) {
        showNotification('Пожалуйста, введите корректный email', 'error');
        return;
    }

    // Show loading state
    const submitBtn = contactForm.querySelector('.btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Отправка...';
    submitBtn.disabled = true;

    // Simulate form submission
    setTimeout(() => {
        showNotification('Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
        contactForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

// Intersection Observer for animations
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

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .room-card, .contact-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Set minimum date for check-in to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');

    if (checkinInput) {
        checkinInput.min = today;
    }

    if (checkoutInput) {
        checkoutInput.min = today;
    }
}

// Update checkout minimum date when checkin changes
function updateCheckoutMinDate() {
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');

    if (checkinInput && checkoutInput) {
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            checkinDate.setDate(checkinDate.getDate() + 1);
            checkoutInput.min = checkinDate.toISOString().split('T')[0];

            // If checkout is before new minimum, clear it
            if (checkoutInput.value && new Date(checkoutInput.value) <= new Date(this.value)) {
                checkoutInput.value = '';
            }
        });
    }
}

// Initialize date inputs
function initializeDateInputs() {
    setMinDate();
    updateCheckoutMinDate();
}

// Parallax effect for hero section
function handleParallax() {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
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

    // Add animation to theme button
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.style.transform = 'scale(0.8)';
        setTimeout(() => {
            themeBtn.style.transform = 'scale(1)';
        }, 150);
    }
}

// Функция для проверки ответа сервера (дебаг)
async function debugApiResponse(url, options = {}) {
    try {
        const response = await fetch(url, options);
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

// Временная функция для тестирования API (удалить после отладки)
async function testAuthApi() {
    console.log('Testing auth API...');

    try {
        const result = await debugApiResponse('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'password' })
        });
        console.log('API test result:', result);
    } catch (error) {
        console.error('API test failed:', error);
    }
}

// Демо-функция для тестирования (удалить после реализации бэкенда)
function simulateSuccessfulRegistration() {
    const mockUser = {
        id: "1",
        firstName: "Иван",
        lastName: "Иванов",
        email: "ivan@example.com",
        role: "USER"
    };

    const mockToken = "mock_jwt_token_12345";

    setToken(mockToken);
    setUserData(mockUser);
    updateNavigation();
    showNotification('Демо-регистрация завершена! Добро пожаловать!', 'success');
}

// Initialize all functionality
async function init() {
    // Initialize theme
    initTheme();

    // Check user authentication state and update navigation
    await checkAuthStatus();

    // Set up event listeners
    window.addEventListener('scroll', () => {
        handleHeaderScroll();
        updateActiveNavLink();
        handleParallax();
    });

    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchForm);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Add dropdown click handlers
    document.addEventListener('click', handleDropdownClick);

    // Initialize other features
    initializeDateInputs();
    setupScrollAnimations();

    // Set initial header state
    handleHeaderScroll();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to room cards
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation
    const rippleStyles = document.createElement('style');
    rippleStyles.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyles);
});

// Глобальные функции для доступа из HTML
window.toggleTheme = toggleTheme;
window.scrollToSearch = scrollToSearch;
window.scrollToRooms = scrollToRooms;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.login = login;
window.register = register;
window.testAuthApi = testAuthApi;
window.simulateSuccessfulRegistration = simulateSuccessfulRegistration;
window.debugApiResponse = debugApiResponse;