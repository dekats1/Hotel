// ==============================================
// КОНСТАНТЫ И ОСНОВНЫЕ ПЕРЕМЕННЫЕ
// ==============================================

const API_BASE_URL = '/api';
const USER_DATA_KEY = 'user_data';

let currentUser = null;
let bookings = [];
let userReviews = [];
let currentFilter = 'all';

// ==============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С API
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
        localStorage.removeItem(USER_DATA_KEY);
        showNotification('Сессия истекла. Войдите снова.', 'error');
        setTimeout(() => window.location.href = '/login', 1000);
        throw new Error('Требуется авторизация');
    }

    if (!response.ok) {
        const errorText = await response.text();

        if (!errorText || errorText.trim() === '') {
            throw new Error(`Ошибка ${response.status}: Сервер не вернул описание ошибки`);
        }

        try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
                throw new Error(errorData.message);
            }
            throw new Error(JSON.stringify(errorData));
        } catch (parseError) {
            const shortText = errorText.length > 200
                ? errorText.substring(0, 200) + '...'
                : errorText;
            throw new Error(shortText);
        }
    }

    if (response.status === 204) return null;
    return await response.json();
}

async function loadUserProfile() {
    try {
        const data = await apiCall('/users/profile');
        currentUser = {
            id: data.id,
            name: `${data.firstName} ${data.lastName}`,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            wallet: Number(data.balance || 0),
            avatar: '👤'
        };

        localStorage.setItem(USER_DATA_KEY, JSON.stringify({
            id: data.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            wallet: currentUser.wallet
        }));

        updateUserInterface();
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

async function loadUserBookings() {
    try {
        bookings = await apiCall('/booking/myBookings');
        displayBookings(bookings);
        updateStatistics();
    } catch (error) {
        console.error('Ошибка загрузки бронирований:', error);
        showNotification('Ошибка загрузки бронирований: ' + error.message, 'error');
        bookings = [];
        displayBookings([]);
    }
}

async function loadUserReviews() {
    try {
        userReviews = await apiCall('/review/getUserReviews');
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        userReviews = [];
    }
}

async function cancelBooking(bookingId) {
    try {
        await apiCall(`/booking/${bookingId}/cancel`, { method: 'PUT' });
        showNotification('Бронирование отменено', 'success');
        await loadUserBookings();
        await loadUserProfile();
    } catch (error) {
        console.error('Ошибка отмены бронирования:', error);
        showNotification('Ошибка отмены: ' + error.message, 'error');
    }
}

async function submitReview(bookingId, rating, comment) {
    try {
        await apiCall('/review/createReview', {
            method: 'POST',
            body: JSON.stringify({
                bookingId: bookingId,
                rating: rating,
                comment: comment,
                cleanlinessRating: rating,
                comfortRating: rating,
                serviceRating: rating,
                valueRating: rating
            })
        });

        showNotification('Отзыв успешно отправлен!', 'success');
        closeReviewModal();

        await loadUserReviews();
        await loadUserBookings();
    } catch (error) {
        console.error('Ошибка отправки отзыва:', error);

        if (error.message.includes('уже оставлен отзыв') ||
            error.message.includes('уже существует')) {
            showNotification('Вы уже оставили отзыв на это бронирование', 'warning');
        } else if (error.message.includes('завершённое бронирование')) {
            showNotification('Отзыв можно оставить только на завершённое бронирование', 'warning');
        } else {
            showNotification('Ошибка при отправке отзыва: ' + error.message, 'error');
        }
    }
}


// ==============================================
// ИНИЦИАЛИЗАЦИЯ
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (!userData) {
        window.location.href = '/login';
        return;
    }

    initializeBooking();
    loadUserProfile();
    loadUserBookings();
    loadUserReviews();
    setupEventListeners();
    initializeTheme();
});

function initializeBooking() {
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('.nav-menu')?.classList.remove('active');
            document.querySelector('.nav-toggle')?.classList.remove('active');
        });
    });
}

// ==============================================
// УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ И БРОНИРОВАНИЯМИ
// ==============================================

function updateUserInterface() {
    if (!currentUser) return;

    const navAuth = document.querySelector('.nav-auth');
    if (navAuth) {
        navAuth.innerHTML = `
            <div class="user-profile">
                <div class="user-info">
                    <div class="user-avatar">${currentUser.avatar}</div>
                    <div class="user-details">
                        <div class="user-name">${currentUser.name}</div>
                        <div class="user-wallet">
                            <i class="fas fa-wallet"></i>
                            <span>${formatMoney(currentUser.wallet)}BYN</span>
                        </div>
                    </div>
                </div>
                <div class="user-menu">
                    <button class="btn-auth btn-user" onclick="toggleUserMenu()">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-header">
                            <div class="user-avatar-small">${currentUser.avatar}</div>
                            <div>
                                <div class="user-name-small">${currentUser.name}</div>
                                <div class="user-email-small">${currentUser.email}</div>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="/profile" class="dropdown-item"><i class="fas fa-user"></i> Профиль</a>
                        <a href="/booking" class="dropdown-item active"><i class="fas fa-calendar"></i> Бронирования</a>
                        <a href="/wallet" class="dropdown-item"><i class="fas fa-wallet"></i> Кошелек</a>
                        <a href="/setting" class="dropdown-item"><i class="fas fa-cog"></i> Настройки</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-item" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Выйти</a>
                    </div>
                </div>
            </div>
        `;
    }
}

function hasReviewForBooking(bookingId) {
    return userReviews.some(review => review.bookingId === bookingId);
}

function displayBookings(bookingsToShow) {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    if (bookingsToShow.length === 0) {
        bookingsList.innerHTML = '<div class="booking-card"><div class="booking-title-info"><h3>Нет бронирований</h3><p>У вас пока нет бронирований. <a href="/catalog">Забронировать номер</a></p></div></div>';
        return;
    }

    bookingsList.innerHTML = bookingsToShow
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(booking => {
            const status = getBookingStatus(booking);
            const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
            const canReview = status === 'completed' && !hasReviewForBooking(booking.id);

            return `
                <div class="booking-card ${status}">
                    <div class="booking-header-info">
                        <div class="booking-title-info">
                            <h3>Номер ${booking.roomNumber || booking.roomId}</h3>
                            <p>#${booking.id}</p>
                        </div>
                        <div class="booking-status ${status}">${getStatusText(status)}</div>
                    </div>
                    <div class="booking-details">
                        <div class="booking-detail"><i class="fas fa-calendar-check"></i> Заезд: <strong>${formatDate(booking.checkInDate)}</strong></div>
                        <div class="booking-detail"><i class="fas fa-calendar-times"></i> Выезд: <strong>${formatDate(booking.checkOutDate)}</strong></div>
                        <div class="booking-detail"><i class="fas fa-users"></i> Гостей: <strong>${booking.guestsCount}</strong></div>
                        <div class="booking-detail"><i class="fas fa-moon"></i> Ночей: <strong>${nights}</strong></div>
                        <div class="booking-detail"><i class="fas fa-ruble-sign"></i> Сумма: <strong>${formatMoney(booking.totalPrice)}BYN</strong></div>
                    </div>
                    <div class="booking-actions">
                        <button class="booking-action-btn" onclick="viewBookingDetails('${booking.id}')">
                            <i class="fas fa-eye"></i> Подробнее
                        </button>
                        ${status === 'upcoming' ? `
                            <button class="booking-action-btn" onclick="handleCancelBooking('${booking.id}')">
                                <i class="fas fa-times"></i> Отменить
                            </button>
                        ` : ''}
                        ${canReview ? `
                            <button class="booking-action-btn btn-review" onclick="openReviewModal('${booking.id}', '${booking.roomNumber || booking.roomId}')">
                                <i class="fas fa-star"></i> Оставить отзыв
                            </button>
                        ` : ''}
                        ${hasReviewForBooking(booking.id) ? `
                            <button class="booking-action-btn btn-reviewed" disabled>
                                <i class="fas fa-check-circle"></i> Отзыв оставлен
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
}

function getBookingStatus(booking) {
    if (booking.status === 'CANCELLED') return 'cancelled';

    const now = new Date();
    const checkOut = new Date(booking.checkOutDate);

    if (checkOut < now) return 'completed';

    const checkIn = new Date(booking.checkInDate);
    if (checkIn <= now && checkOut >= now) return 'current';

    return 'upcoming';
}

function getStatusText(status) {
    const texts = {
        upcoming: 'Предстоящее',
        current: 'Текущее',
        completed: 'Завершено',
        cancelled: 'Отменено'
    };
    return texts[status] || status;
}

function calculateNights(checkIn, checkOut) {
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function filterBookings(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-filter="${filter}"]`);
    if (activeTab) activeTab.classList.add('active');

    const filtered = filter === 'all' ? bookings : bookings.filter(b => getBookingStatus(b) === filter);
    displayBookings(filtered);
}

function updateStatistics() {
    const active = bookings.filter(b => getBookingStatus(b) !== 'cancelled');
    const totalNights = active.reduce((sum, b) => sum + calculateNights(b.checkInDate, b.checkOutDate), 0);
    const totalSpent = active.reduce((sum, b) => sum + Number(b.totalPrice), 0);

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('totalBookings', active.length);
    el('totalNights', totalNights);
    el('totalSpent', formatMoney(totalSpent) + 'BYN');

    if (userReviews.length > 0) {
        const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
        el('averageRating', avgRating.toFixed(1));
    } else {
        el('averageRating', '—');
    }
}


// ==============================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
// ==============================================

function viewBookingDetails(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const modal = document.getElementById('bookingDetailsModal');
    const content = document.getElementById('bookingDetailsContent');

    if (modal && content) {
        const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
        const status = getBookingStatus(booking);

        content.innerHTML = `
            <div class="booking-details-full">
                <div class="detail-section">
                    <h3>Информация о бронировании</h3>
                    <div class="detail-grid">
                        <div class="detail-item"><strong>ID:</strong> <span>#${booking.id}</span></div>
                        <div class="detail-item"><strong>Номер:</strong> <span>${booking.roomNumber || booking.roomId}</span></div>
                        <div class="detail-item"><strong>Заезд:</strong> <span>${formatDate(booking.checkInDate)}</span></div>
                        <div class="detail-item"><strong>Выезд:</strong> <span>${formatDate(booking.checkOutDate)}</span></div>
                        <div class="detail-item"><strong>Гостей:</strong> <span>${booking.guestsCount}</span></div>
                        <div class="detail-item"><strong>Ночей:</strong> <span>${nights}</span></div>
                        <div class="detail-item"><strong>Статус:</strong> <span class="booking-status ${status}">${getStatusText(status)}</span></div>
                        <div class="detail-item"><strong>Создано:</strong> <span>${formatDate(booking.createdAt)}</span></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h3>Стоимость</h3>
                    <div class="price-breakdown">
                        <div class="price-item"><span>Цена за ночь:</span><span>${formatMoney(booking.pricePerNight)}BYN</span></div>
                        <div class="price-item"><span>Количество ночей:</span><span>${nights}</span></div>
                        ${booking.specialRequests ? `<div class="price-item"><span>Пожелания:</span><span>${booking.specialRequests}</span></div>` : ''}
                        <div class="price-total"><strong>Итого:</strong><strong>${formatMoney(booking.totalPrice)}BYN</strong></div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeBookingDetailsModal() {
    const modal = document.getElementById('bookingDetailsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function openReviewModal(bookingId, roomNumber) {
    const modal = document.getElementById('reviewModal');
    if (!modal) {
        createReviewModal();
    }

    const reviewModal = document.getElementById('reviewModal');
    const reviewBookingId = document.getElementById('reviewBookingId');
    const reviewRoomNumber = document.getElementById('reviewRoomNumber');

    if (reviewBookingId) reviewBookingId.value = bookingId;
    if (reviewRoomNumber) reviewRoomNumber.textContent = roomNumber;

    const ratingContainer = document.getElementById('reviewRating');
    if (ratingContainer) {
        ratingContainer.setAttribute('data-rating', '0');
        ratingContainer.querySelectorAll('.fa-star').forEach(star => {
            star.classList.remove('active');
        });
    }

    const reviewComment = document.getElementById('reviewComment');
    if (reviewComment) {
        reviewComment.value = '';
        const counter = reviewComment.parentElement?.querySelector('.char-count');
        if (counter) counter.textContent = '0 / 500';
    }

    if (reviewModal) {
        reviewModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function createReviewModal() {
    const modalHTML = `
        <div class="modal" id="reviewModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Оставить отзыв</h2>
                    <button class="modal-close" onclick="closeReviewModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="reviewBookingId">
                    <div class="review-form">
                        <div class="form-group">
                            <label>Номер: <strong id="reviewRoomNumber"></strong></label>
                        </div>
                        <div class="form-group">
                            <label>Ваша оценка:</label>
                            <div class="star-rating" id="reviewRating" data-rating="0">
                                <i class="fas fa-star" data-value="1"></i>
                                <i class="fas fa-star" data-value="2"></i>
                                <i class="fas fa-star" data-value="3"></i>
                                <i class="fas fa-star" data-value="4"></i>
                                <i class="fas fa-star" data-value="5"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="reviewComment">Ваш отзыв:</label>
                            <textarea id="reviewComment" rows="5" placeholder="Поделитесь впечатлениями о вашем пребывании..." maxlength="500"></textarea>
                            <small class="char-count">0 / 500</small>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-secondary" onclick="closeReviewModal()">Отмена</button>
                            <button class="btn btn-primary" onclick="handleSubmitReview()">Отправить отзыв</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const ratingContainer = document.getElementById('reviewRating');
    if (ratingContainer) {
        ratingContainer.addEventListener('click', function(event) {
            if (event.target.matches('.fa-star')) {
                const star = event.target;
                const rating = parseInt(star.getAttribute('data-value'));

                this.setAttribute('data-rating', rating);

                this.querySelectorAll('.fa-star').forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            }
        });
    }

    const reviewComment = document.getElementById('reviewComment');
    if (reviewComment) {
        reviewComment.addEventListener('input', function() {
            const charCount = this.value.length;
            const counter = this.parentElement.querySelector('.char-count');
            if (counter) {
                counter.textContent = `${charCount} / 500`;
            }
        });
    }
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

async function handleSubmitReview() {
    const bookingId = document.getElementById('reviewBookingId')?.value;
    const rating = parseInt(document.getElementById('reviewRating')?.getAttribute('data-rating') || '0');
    const comment = document.getElementById('reviewComment')?.value.trim();

    if (!bookingId) {
        showNotification('Ошибка: ID бронирования не найден', 'error');
        return;
    }

    if (rating === 0) {
        showNotification('Пожалуйста, выберите оценку', 'warning');
        return;
    }

    if (!comment || comment.length < 10) {
        showNotification('Пожалуйста, напишите отзыв (минимум 10 символов)', 'warning');
        return;
    }

    await submitReview(bookingId, rating, comment);
}

async function handleCancelBooking(bookingId) {
    if (confirm('Отменить бронирование?')) {
        await cancelBooking(bookingId);
    }
}


// ==============================================
// ОБЩИЕ ФУНКЦИИ И УТИЛИТЫ
// ==============================================

function toggleUserMenu() {
    document.getElementById('userDropdown')?.classList.toggle('show');
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem(USER_DATA_KEY);
    window.location.href = '/login';
}

function setupEventListeners() {
    document.addEventListener('click', e => {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown')?.classList.remove('show');
        }
        if (e.target.classList.contains('modal')) {
            closeBookingDetailsModal();
            closeReviewModal();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeBookingDetailsModal();
            closeReviewModal();
        }
    });
}

function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-times"></i></button>
        </div>
    `;

    Object.assign(notification.style, {
        position: 'fixed', top: '20px', right: '20px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6',
        color: 'white', padding: '1rem 1.5rem', borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: '10000',
        animation: 'slideInRight 0.3s ease', maxWidth: '400px'
    });

    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Глобальный доступ к функциям для использования в HTML (onclick)
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.handleCancelBooking = handleCancelBooking;
window.viewBookingDetails = viewBookingDetails;
window.closeBookingDetailsModal = closeBookingDetailsModal;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.handleSubmitReview = handleSubmitReview;
window.filterBookings = filterBookings;
window.toggleTheme = toggleTheme;