// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const searchForm = document.getElementById('searchForm');
const contactForm = document.getElementById('contactForm');

const USER_KEY = 'user_data';

function getUserData() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

function setUserData(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

function removeAuthData() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('auth_token');
}

async function apiClient(url, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include',
        ...options,
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            removeAuthData();
            updateNavigation();
            showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
            throw new Error('Unauthorized');
        }

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
            } else if (hasContent) {
                try {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                } catch (textError) {
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

async function checkAuthStatus() {
    const userData = getUserData();

    if (!userData) {
        try {

            const profileData = await apiClient('/api/users/profile', { method: 'GET' });

            setUserData(profileData);
            updateNavigation();
            return true;
        } catch (error) {
            updateNavigation();
            return false;
        }
    }

    updateNavigation();

    return true;
}

function updateNavigation() {
    const navAuth = document.querySelector('.nav-auth');
    const userData = getUserData();

    if (userData) {
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


async function login(email, password) {
    try {
        const response = await apiClient('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });



        if (response && response.user) {
            setUserData(response.user);
            updateNavigation();
            showNotification('Успешный вход!', 'success');
            return true;
        } else {

            showNotification('Неверный ответ сервера после входа.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);

        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            showNotification('Неверный email или пароль', 'error');
        } else if (error.message.includes('Network Error')) {
            showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
        } else {
            showNotification(`Ошибка входа: ${error.message}`, 'error');
        }
        return false;
    }
}

async function register(userData) {
    try {
        if (userData.password !== userData.confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return false;
        }

        const response = await apiClient('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response && response.user) {
            setUserData(response.user);
            updateNavigation();
            showNotification('Регистрация успешна! Добро пожаловать!', 'success');
            return true;
        } else {
            showNotification('Ошибка регистрации. Неверный ответ сервера.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);

        if (error.message.includes('Bad Request') || error.message.includes('400')) {
            showNotification('Пользователь с таким email или телефоном уже существует', 'error');
        } else if (error.message.includes('Network Error')) {
            showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
        } else {
            showNotification(`Ошибка регистрации: ${error.message}`, 'error');
        }
        return false;
    }
}

async function logout() {
    try {
        await apiClient('/api/auth/logout', {
            method: 'POST',
        });

        removeAuthData();
        updateNavigation();
        showNotification('Вы успешно вышли из системы', 'success');
    } catch (error) {
        console.error('Logout failed but proceeding with client clear:', error);
        showNotification('Ошибка выхода из системы. Очистка клиента...', 'error');
        removeAuthData();
        updateNavigation();
    }

    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function handleDropdownClick(e) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && !e.target.closest('.user-menu')) {
        dropdown.classList.remove('show');
    }
}

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

if (navToggle) {
    navToggle.addEventListener('click', toggleMobileMenu);
}

navLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});


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

function handleSearchForm(e) {
    e.preventDefault();

    const formData = new FormData(searchForm);
    const searchData = {
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        guests: formData.get('guests'),
        roomType: formData.get('room-type')
    };

    if (new Date(searchData.checkin) >= new Date(searchData.checkout)) {
        showNotification('Дата выезда должна быть позже даты заезда', 'error');
        return;
    }

    if (new Date(searchData.checkin) < new Date().setHours(0, 0, 0, 0)) {
        showNotification('Дата заезда не может быть в прошлом', 'error');
        return;
    }

    const submitBtn = searchForm.querySelector('.btn-search');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Поиск...';
    submitBtn.disabled = true;

    setTimeout(() => {
        showNotification('Поиск номеров выполнен! Результаты будут показаны в следующем разделе.', 'success');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        scrollToRooms();
    }, 2000);
}

function handleContactForm(e) {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };

    if (!contactData.name || !contactData.email || !contactData.message) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }

    if (!isValidEmail(contactData.email)) {
        showNotification('Пожалуйста, введите корректный email', 'error');
        return;
    }

    const submitBtn = contactForm.querySelector('.btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Отправка...';
    submitBtn.disabled = true;

    setTimeout(() => {
        showNotification('Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
        contactForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

    const animateElements = document.querySelectorAll('.feature-card, .room-card, .contact-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

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

function updateCheckoutMinDate() {
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');

    if (checkinInput && checkoutInput) {
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            checkinDate.setDate(checkinDate.getDate() + 1);
            checkoutInput.min = checkinDate.toISOString().split('T')[0];
            if (checkoutInput.value && new Date(checkoutInput.value) <= new Date(this.value)) {
                checkoutInput.value = '';
            }
        });
    }
}

function initializeDateInputs() {
    setMinDate();
    updateCheckoutMinDate();
}

function handleParallax() {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
}

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

async function init() {
    initTheme();

    await checkAuthStatus();

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

    document.addEventListener('click', handleDropdownClick);

    initializeDateInputs();
    setupScrollAnimations();

    handleHeaderScroll();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

document.addEventListener('DOMContentLoaded', function() {
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
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


function redirectToCatalog() {
    const checkIn = document.getElementById('checkIn')?.value;
    const checkOut = document.getElementById('checkOut')?.value;
    const guests = document.getElementById('guests')?.value || '2';
    const roomType = document.getElementById('roomType')?.value || '';

    const params = new URLSearchParams();

    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests);
    if (roomType) params.append('type', roomType);

    const url = `/catalog?${params.toString()}`;
    console.log('Redirecting to catalog:', url);
    window.location.href = url;
}

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            redirectToCatalog();
        });
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            redirectToCatalog();
        });
    }
});



window.toggleTheme = toggleTheme;
window.scrollToSearch = scrollToSearch;
window.scrollToRooms = scrollToRooms;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.login = login;
window.register = register;
