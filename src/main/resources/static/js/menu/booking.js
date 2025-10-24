// Booking Management JavaScript

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');

// Booking data
let currentUser = null;
let bookings = [];
let currentFilter = 'all';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeBooking();
    loadUserData();
    loadBookings();
    setupEventListeners();
    initializeTheme();
    updateStatistics();
});

// Initialize booking page
function initializeBooking() {
    // Set up mobile navigation
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Set up room selection
    setupRoomSelection();
    
    // Set up form submission
    const newBookingForm = document.getElementById('newBookingForm');
    if (newBookingForm) {
        newBookingForm.addEventListener('submit', handleNewBookingForm);
    }

    // Set up date inputs
    setupDateInputs();
}

// Load user data from localStorage
function loadUserData() {
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserInterface();
    } else {

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
                    </div>
                </div>
            </div>
        `;
    }
}

// Load demo bookings
function loadBookings() {
    bookings = [
        {
            id: 1,
            roomType: 'suite',
            roomName: 'Люкс с видом на море',
            checkin: new Date('2024-02-15'),
            checkout: new Date('2024-02-18'),
            guests: 2,
            children: 0,
            totalNights: 3,
            pricePerNight: 8500,
            totalPrice: 25500,
            services: ['breakfast', 'spa'],
            status: 'upcoming',
            bookingDate: new Date('2024-01-20'),
            rating: null
        },
        {
            id: 2,
            roomType: 'deluxe',
            roomName: 'Делюкс с балконом',
            checkin: new Date('2024-01-10'),
            checkout: new Date('2024-01-12'),
            guests: 2,
            children: 1,
            totalNights: 2,
            pricePerNight: 5500,
            totalPrice: 11000,
            services: ['breakfast'],
            status: 'completed',
            bookingDate: new Date('2024-01-05'),
            rating: 5
        },
        {
            id: 3,
            roomType: 'standard',
            roomName: 'Стандарт',
            checkin: new Date('2024-01-25'),
            checkout: new Date('2024-01-27'),
            guests: 1,
            children: 0,
            totalNights: 2,
            pricePerNight: 3500,
            totalPrice: 7000,
            services: [],
            status: 'current',
            bookingDate: new Date('2024-01-20'),
            rating: null
        },
        {
            id: 4,
            roomType: 'deluxe',
            roomName: 'Делюкс с видом на сад',
            checkin: new Date('2023-12-20'),
            checkout: new Date('2023-12-22'),
            guests: 2,
            children: 0,
            totalNights: 2,
            pricePerNight: 5500,
            totalPrice: 11000,
            services: ['breakfast', 'airport'],
            status: 'cancelled',
            bookingDate: new Date('2023-12-15'),
            rating: null
        }
    ];

    displayBookings(bookings);
}

// Display bookings
function displayBookings(bookingsToShow) {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    if (bookingsToShow.length === 0) {
        bookingsList.innerHTML = `
            <div class="booking-card">
                <div class="booking-title-info">
                    <h3>Нет бронирований</h3>
                    <p>У вас пока нет бронирований в этой категории</p>
                </div>
            </div>
        `;
        return;
    }

    bookingsList.innerHTML = bookingsToShow
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        .map(booking => `
            <div class="booking-card ${booking.status}">
                <div class="booking-header-info">
                    <div class="booking-title-info">
                        <h3>${booking.roomName}</h3>
                        <p>Бронирование #${booking.id}</p>
                    </div>
                    <div class="booking-status ${booking.status}">
                        ${getStatusText(booking.status)}
                    </div>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <i class="fas fa-calendar-check"></i>
                        <span>Заезд: <strong>${formatDate(booking.checkin)}</strong></span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-calendar-times"></i>
                        <span>Выезд: <strong>${formatDate(booking.checkout)}</strong></span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-users"></i>
                        <span>Гостей: <strong>${booking.guests + booking.children}</strong></span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-moon"></i>
                        <span>Ночей: <strong>${booking.totalNights}</strong></span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-ruble-sign"></i>
                        <span>Сумма: <strong>${booking.totalPrice.toLocaleString()}₽</strong></span>
                    </div>
                    ${booking.rating ? `
                    <div class="booking-detail">
                        <i class="fas fa-star"></i>
                        <span>Оценка: <strong>${booking.rating}/5</strong></span>
                    </div>
                    ` : ''}
                </div>
                <div class="booking-actions">
                    <button class="booking-action-btn" onclick="viewBookingDetails(${booking.id})">
                        <i class="fas fa-eye"></i>
                        Подробнее
                    </button>
                    ${booking.status === 'upcoming' ? `
                    <button class="booking-action-btn" onclick="cancelBooking(${booking.id})">
                        <i class="fas fa-times"></i>
                        Отменить
                    </button>
                    ` : ''}
                    ${booking.status === 'completed' && !booking.rating ? `
                    <button class="booking-action-btn" onclick="rateBooking(${booking.id})">
                        <i class="fas fa-star"></i>
                        Оценить
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
}

// Get status text
function getStatusText(status) {
    const statusTexts = {
        upcoming: 'Предстоящее',
        current: 'Текущее',
        completed: 'Завершено',
        cancelled: 'Отменено'
    };
    return statusTexts[status] || status;
}

// Filter bookings
function filterBookings(filter) {
    currentFilter = filter;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

    let filteredBookings = bookings;
    
    if (filter !== 'all') {
        filteredBookings = bookings.filter(booking => booking.status === filter);
    }

    displayBookings(filteredBookings);
}

// Setup room selection
function setupRoomSelection() {
    const roomOptions = document.querySelectorAll('.room-option');
    roomOptions.forEach(option => {
        option.addEventListener('click', function() {
            roomOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// Setup date inputs
function setupDateInputs() {
    const checkinInput = document.getElementById('checkinDate');
    const checkoutInput = document.getElementById('checkoutDate');
    
    if (checkinInput && checkoutInput) {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        checkinInput.min = today;
        checkoutInput.min = today;

        // Update checkout minimum when checkin changes
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            checkinDate.setDate(checkinDate.getDate() + 1);
            checkoutInput.min = checkinDate.toISOString().split('T')[0];
            
            // Clear checkout if it's before new minimum
            if (checkoutInput.value && new Date(checkoutInput.value) <= new Date(this.value)) {
                checkoutInput.value = '';
            }
        });
    }
}

// Open new booking modal
function openNewBookingModal() {
    const modal = document.getElementById('newBookingModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        resetNewBookingForm();
    }
}

// Close new booking modal
function closeNewBookingModal() {
    const modal = document.getElementById('newBookingModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Reset new booking form
function resetNewBookingForm() {
    const form = document.getElementById('newBookingForm');
    if (form) {
        form.reset();
        document.querySelectorAll('.room-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        setupDateInputs();
    }
}

// Handle new booking form submission
function handleNewBookingForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const checkinDate = new Date(formData.get('checkinDate'));
    const checkoutDate = new Date(formData.get('checkoutDate'));
    const adults = parseInt(formData.get('adults'));
    const children = parseInt(formData.get('children'));
    const selectedRoom = document.querySelector('.room-option.selected');
    const selectedServices = Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);

    // Validate dates
    if (checkinDate >= checkoutDate) {
        showNotification('Дата выезда должна быть позже даты заезда', 'error');
        return;
    }

    if (checkinDate < new Date().setHours(0, 0, 0, 0)) {
        showNotification('Дата заезда не может быть в прошлом', 'error');
        return;
    }

    if (!selectedRoom) {
        showNotification('Выберите тип номера', 'error');
        return;
    }

    // Calculate total
    const roomType = selectedRoom.getAttribute('data-room');
    const roomPrices = {
        standard: 3500,
        deluxe: 5500,
        suite: 8500
    };
    
    const servicePrices = {
        breakfast: 500,
        spa: 1500,
        airport: 2000
    };

    const totalNights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const pricePerNight = roomPrices[roomType];
    const basePrice = pricePerNight * totalNights;
    const servicesPrice = selectedServices.reduce((total, service) => {
        return total + (servicePrices[service] * (service === 'airport' ? 1 : totalNights));
    }, 0);
    const totalPrice = basePrice + servicesPrice;

    // Check if user has enough money
    if (totalPrice > currentUser.wallet) {
        showNotification('Недостаточно средств на счете', 'error');
        return;
    }

    // Create new booking
    const newBooking = {
        id: Date.now(),
        roomType: roomType,
        roomName: getRoomName(roomType),
        checkin: checkinDate,
        checkout: checkoutDate,
        guests: adults,
        children: children,
        totalNights: totalNights,
        pricePerNight: pricePerNight,
        totalPrice: totalPrice,
        services: selectedServices,
        status: 'upcoming',
        bookingDate: new Date(),
        rating: null
    };

    // Add to bookings
    bookings.unshift(newBooking);
    
    // Update user wallet
    currentUser.wallet -= totalPrice;
    localStorage.setItem('userData', JSON.stringify(currentUser));
    updateUserInterface();

    // Display updated bookings
    displayBookings(bookings);
    updateStatistics();

    // Show success message
    showNotification(`Бронирование успешно создано! Сумма: ${totalPrice.toLocaleString()}₽`, 'success');
    
    closeNewBookingModal();
}

// Get room name
function getRoomName(roomType) {
    const roomNames = {
        standard: 'Стандарт',
        deluxe: 'Делюкс с балконом',
        suite: 'Люкс с видом на море'
    };
    return roomNames[roomType] || roomType;
}

// View booking details
function viewBookingDetails(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const modal = document.getElementById('bookingDetailsModal');
    const content = document.getElementById('bookingDetailsContent');
    
    if (modal && content) {
        content.innerHTML = `
            <div class="booking-details-full">
                <div class="detail-section">
                    <h3>Информация о бронировании</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>Номер бронирования:</strong>
                            <span>#${booking.id}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Тип номера:</strong>
                            <span>${booking.roomName}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Дата заезда:</strong>
                            <span>${formatDate(booking.checkin)}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Дата выезда:</strong>
                            <span>${formatDate(booking.checkout)}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Количество гостей:</strong>
                            <span>${booking.guests} взрослых${booking.children > 0 ? `, ${booking.children} детей` : ''}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Количество ночей:</strong>
                            <span>${booking.totalNights}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Статус:</strong>
                            <span class="booking-status ${booking.status}">${getStatusText(booking.status)}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Дата бронирования:</strong>
                            <span>${formatDate(booking.bookingDate)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Стоимость</h3>
                    <div class="price-breakdown">
                        <div class="price-item">
                            <span>Номер (${booking.totalNights} ночей × ${booking.pricePerNight.toLocaleString()}₽):</span>
                            <span>${(booking.pricePerNight * booking.totalNights).toLocaleString()}₽</span>
                        </div>
                        ${booking.services.length > 0 ? booking.services.map(service => {
                            const serviceNames = {
                                breakfast: 'Завтрак',
                                spa: 'СПА-процедуры',
                                airport: 'Трансфер из аэропорта'
                            };
                            const servicePrices = {
                                breakfast: 500,
                                spa: 1500,
                                airport: 2000
                            };
                            const servicePrice = servicePrices[service] * (service === 'airport' ? 1 : booking.totalNights);
                            return `
                                <div class="price-item">
                                    <span>${serviceNames[service]}:</span>
                                    <span>${servicePrice.toLocaleString()}₽</span>
                                </div>
                            `;
                        }).join('') : ''}
                        <div class="price-total">
                            <strong>Итого:</strong>
                            <strong>${booking.totalPrice.toLocaleString()}₽</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Close booking details modal
function closeBookingDetailsModal() {
    const modal = document.getElementById('bookingDetailsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Cancel booking
function cancelBooking(bookingId) {
    if (confirm('Вы уверены, что хотите отменить это бронирование?')) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            
            // Refund money
            currentUser.wallet += booking.totalPrice;
            localStorage.setItem('userData', JSON.stringify(currentUser));
            updateUserInterface();
            
            // Update display
            displayBookings(bookings);
            updateStatistics();
            
            showNotification('Бронирование отменено. Средства возвращены на счет.', 'success');
        }
    }
}

// Rate booking
function rateBooking(bookingId) {
    const rating = prompt('Оцените ваше пребывание от 1 до 5:');
    if (rating && rating >= 1 && rating <= 5) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.rating = parseInt(rating);
            displayBookings(bookings);
            updateStatistics();
            showNotification('Спасибо за оценку!', 'success');
        }
    }
}

// Update statistics
function updateStatistics() {
    const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;
    const totalNights = bookings.filter(b => b.status !== 'cancelled').reduce((total, b) => total + b.totalNights, 0);
    const totalSpent = bookings.filter(b => b.status !== 'cancelled').reduce((total, b) => total + b.totalPrice, 0);
    const ratings = bookings.filter(b => b.rating).map(b => b.rating);
    const averageRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1) : '0.0';

    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('totalNights').textContent = totalNights;
    document.getElementById('totalSpent').textContent = totalSpent.toLocaleString() + '₽';
    document.getElementById('averageRating').textContent = averageRating;
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
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

    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeNewBookingModal();
            closeBookingDetailsModal();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeNewBookingModal();
            closeBookingDetailsModal();
        }
    });
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
