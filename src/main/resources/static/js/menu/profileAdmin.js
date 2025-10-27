// Admin Panel JavaScript

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');

// API Configuration
const API_BASE_URL = '/api/admin';

// Global State
let currentUser = null;
let currentSection = 'dashboard';
let users = [];
let rooms = [];
let reviews = [];
let bookings = [];
let currentEditId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    loadUserData();
    setupEventListeners();
    initializeTheme();
    loadDashboardData();
});

// Initialize admin panel
function initializeAdmin() {
    // Mobile navigation
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Sidebar navigation
    const sidebarItems = document.querySelectorAll('.nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Search and filter inputs
    setupSearchAndFilters();
}

// Setup search and filter functionality
function setupSearchAndFilters() {
    // User search and filters
    const userSearch = document.getElementById('userSearch');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');

    if (userSearch) {
        userSearch.addEventListener('input', () => filterUsers());
    }
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', () => filterUsers());
    }
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', () => filterUsers());
    }

    // Room search and filters
    const roomSearch = document.getElementById('roomSearch');
    const roomTypeFilter = document.getElementById('roomTypeFilter');
    const roomStatusFilter = document.getElementById('roomStatusFilter');

    if (roomSearch) {
        roomSearch.addEventListener('input', () => filterRooms());
    }
    if (roomTypeFilter) {
        roomTypeFilter.addEventListener('change', () => filterRooms());
    }
    if (roomStatusFilter) {
        roomStatusFilter.addEventListener('change', () => filterRooms());
    }

    // Review search and filters
    const reviewSearch = document.getElementById('reviewSearch');
    const reviewRatingFilter = document.getElementById('reviewRatingFilter');
    const reviewStatusFilter = document.getElementById('reviewStatusFilter');

    if (reviewSearch) {
        reviewSearch.addEventListener('input', () => filterReviews());
    }
    if (reviewRatingFilter) {
        reviewRatingFilter.addEventListener('change', () => filterReviews());
    }
    if (reviewStatusFilter) {
        reviewStatusFilter.addEventListener('change', () => filterReviews());
    }

    // Booking search and filters
    const bookingSearch = document.getElementById('bookingSearch');
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const bookingDateFilter = document.getElementById('bookingDateFilter');

    if (bookingSearch) {
        bookingSearch.addEventListener('input', () => filterBookings());
    }
    if (bookingStatusFilter) {
        bookingStatusFilter.addEventListener('change', () => filterBookings());
    }
    if (bookingDateFilter) {
        bookingDateFilter.addEventListener('change', () => filterBookings());
    }
}

// API Call function
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (response.status === 401) {
        showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        throw new Error('Требуется авторизация');
    }

    if (response.status === 403) {
        showNotification('Доступ запрещен', 'error');
        throw new Error('Доступ запрещен');
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorText = `Ошибка: ${response.status}`;

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

// Load user data
async function loadUserData() {
    try {
        const data = await apiCall('/profile');
        currentUser = transformUserData(data);
        updateUserInterface();
    } catch (error) {
        console.error('Failed to load user data:', error);
        if (!error.message.includes('Требуется авторизация')) {
            showNotification('Ошибка загрузки данных профиля: ' + error.message, 'error');
        }
    }
}

function transformUserData(apiData) {
    return {
        id: apiData.id,
        name: `${apiData.firstName} ${apiData.lastName}`,
        firstName: apiData.firstName,
        lastName: apiData.lastName,
        email: apiData.email,
        role: apiData.role || 'ADMIN',
        avatar: apiData.avatarUrl || '👤'
    };
}

// Update user interface
function updateUserInterface() {
    if (!currentUser) return;

    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmailSmall');
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarSmall = document.getElementById('userAvatarSmall');

    if (userName) userName.textContent = currentUser.name;
    if (userEmail) userEmail.textContent = currentUser.email;
    
    if (userAvatar) {
        userAvatar.innerHTML = currentUser.avatar.startsWith('data:') 
            ? `<img src="${currentUser.avatar}" alt="Avatar">` 
            : '<i class="fas fa-user"></i>';
    }
    
    if (userAvatarSmall) {
        userAvatarSmall.innerHTML = currentUser.avatar.startsWith('data:') 
            ? `<img src="${currentUser.avatar}" alt="Avatar">` 
            : '<i class="fas fa-user"></i>';
    }
}

// Switch between sections
function switchSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update active content section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    currentSection = section;

    // Load section data
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsers();
            break;
        case 'rooms':
            loadRooms();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'bookings':
            loadBookings();
            break;
    }
}

// ==================== DASHBOARD ====================

async function loadDashboardData() {
    showLoading(true);
    try {
        const [usersData, roomsData, bookingsData, reviewsData] = await Promise.all([
            apiCall('/users'),
            apiCall('/rooms'),
            apiCall('/bookings'),
            apiCall('/reviews')
        ]);

        users = usersData || [];
        rooms = roomsData || [];
        bookings = bookingsData || [];
        reviews = reviewsData || [];

        updateDashboardStats();
        updateRecentBookings();
        updateRoomStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Ошибка загрузки данных панели управления', 'error');
    } finally {
        showLoading(false);
    }
}

function updateDashboardStats() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalRooms').textContent = rooms.length;
    document.getElementById('totalBookings').textContent = bookings.length;
    
    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
        : '0.0';
    document.getElementById('averageRating').textContent = averageRating;
}

function updateRecentBookings() {
    const recentBookings = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const container = document.getElementById('recentBookings');
    if (!container) return;

    if (recentBookings.length === 0) {
        container.innerHTML = '<p>Нет недавних бронирований</p>';
        return;
    }

    container.innerHTML = recentBookings.map(booking => `
        <div class="recent-item">
            <div class="recent-item-info">
                <h4>Бронирование #${booking.id}</h4>
                <p>${booking.user?.firstName} ${booking.user?.lastName} - ${booking.room?.roomNumber}</p>
            </div>
            <div class="recent-item-status">
                <span class="status-badge ${booking.status.toLowerCase()}">${getStatusText(booking.status)}</span>
            </div>
        </div>
    `).join('');
}

function updateRoomStats() {
    const roomStats = {
        total: rooms.length,
        available: rooms.filter(room => room.status === 'AVAILABLE').length,
        occupied: rooms.filter(room => room.status === 'OCCUPIED').length,
        maintenance: rooms.filter(room => room.status === 'MAINTENANCE').length
    };

    const container = document.getElementById('roomStats');
    if (!container) return;

    container.innerHTML = `
        <div class="room-stat">
            <h4>${roomStats.total}</h4>
            <p>Всего номеров</p>
        </div>
        <div class="room-stat">
            <h4>${roomStats.available}</h4>
            <p>Доступно</p>
        </div>
        <div class="room-stat">
            <h4>${roomStats.occupied}</h4>
            <p>Занято</p>
        </div>
        <div class="room-stat">
            <h4>${roomStats.maintenance}</h4>
            <p>На ремонте</p>
        </div>
    `;
}

// ==================== USERS MANAGEMENT ====================

async function loadUsers() {
    showLoading(true);
    try {
        const data = await apiCall('/users');
        users = data || [];
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Ошибка загрузки пользователей', 'error');
    } finally {
        showLoading(false);
    }
}

function displayUsers(usersToShow) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (usersToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Нет пользователей</td></tr>';
        return;
    }

    tbody.innerHTML = usersToShow.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td><span class="status-badge ${user.role.toLowerCase()}">${user.role}</span></td>
            <td><span class="status-badge ${user.status?.toLowerCase() || 'active'}">${user.status || 'ACTIVE'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                        Редактировать
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                        Удалить
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const roleFilter = document.getElementById('userRoleFilter').value;
    const statusFilter = document.getElementById('userStatusFilter').value;

    let filteredUsers = users;

    if (search) {
        filteredUsers = filteredUsers.filter(user => 
            user.firstName.toLowerCase().includes(search) ||
            user.lastName.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search)
        );
    }

    if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }

    if (statusFilter) {
        filteredUsers = filteredUsers.filter(user => (user.status || 'ACTIVE') === statusFilter);
    }

    displayUsers(filteredUsers);
}

// User Modal Functions
function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');

    if (userId) {
        const user = users.find(u => u.id === userId);
        if (user) {
            title.textContent = 'Редактировать пользователя';
            fillUserForm(user);
            currentEditId = userId;
        }
    } else {
        title.textContent = 'Добавить пользователя';
        form.reset();
        currentEditId = null;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    currentEditId = null;
}

function fillUserForm(user) {
    document.getElementById('userFirstName').value = user.firstName || '';
    document.getElementById('userLastName').value = user.lastName || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role || 'USER';
    document.getElementById('userStatus').value = user.status || 'ACTIVE';
    document.getElementById('userPassword').required = !user.id;
}

async function editUser(userId) {
    openUserModal(userId);
}

async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }

    showLoading(true);
    try {
        await apiCall(`/users/${userId}`, { method: 'DELETE' });
        showNotification('Пользователь успешно удален', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Ошибка удаления пользователя: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// User Form Submission
document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        status: formData.get('status'),
        password: formData.get('password')
    };

    showLoading(true);
    try {
        if (currentEditId) {
            // Update existing user
            await apiCall(`/users/${currentEditId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            showNotification('Пользователь успешно обновлен', 'success');
        } else {
            // Create new user
            await apiCall('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            showNotification('Пользователь успешно создан', 'success');
        }
        
        closeUserModal();
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Ошибка сохранения пользователя: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// ==================== ROOMS MANAGEMENT ====================

async function loadRooms() {
    showLoading(true);
    try {
        const data = await apiCall('/rooms');
        rooms = data || [];
        displayRooms(rooms);
    } catch (error) {
        console.error('Error loading rooms:', error);
        showNotification('Ошибка загрузки номеров', 'error');
    } finally {
        showLoading(false);
    }
}

function displayRooms(roomsToShow) {
    const tbody = document.getElementById('roomsTableBody');
    if (!tbody) return;

    if (roomsToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Нет номеров</td></tr>';
        return;
    }

    tbody.innerHTML = roomsToShow.map(room => `
        <tr>
            <td>${room.id}</td>
            <td>${room.roomNumber}</td>
            <td>${getRoomTypeText(room.type)}</td>
            <td>${room.pricePerNight?.toLocaleString()}₽</td>
            <td><span class="status-badge ${room.status.toLowerCase()}">${getRoomStatusText(room.status)}</span></td>
            <td>${room.capacity}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editRoom(${room.id})">
                        <i class="fas fa-edit"></i>
                        Редактировать
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteRoom(${room.id})">
                        <i class="fas fa-trash"></i>
                        Удалить
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterRooms() {
    const search = document.getElementById('roomSearch').value.toLowerCase();
    const typeFilter = document.getElementById('roomTypeFilter').value;
    const statusFilter = document.getElementById('roomStatusFilter').value;

    let filteredRooms = rooms;

    if (search) {
        filteredRooms = filteredRooms.filter(room => 
            room.roomNumber.toLowerCase().includes(search) ||
            room.description?.toLowerCase().includes(search)
        );
    }

    if (typeFilter) {
        filteredRooms = filteredRooms.filter(room => room.type === typeFilter);
    }

    if (statusFilter) {
        filteredRooms = filteredRooms.filter(room => room.status === statusFilter);
    }

    displayRooms(filteredRooms);
}

// Room Modal Functions
function openRoomModal(roomId = null) {
    const modal = document.getElementById('roomModal');
    const form = document.getElementById('roomForm');
    const title = document.getElementById('roomModalTitle');

    if (roomId) {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            title.textContent = 'Редактировать номер';
            fillRoomForm(room);
            currentEditId = roomId;
        }
    } else {
        title.textContent = 'Добавить номер';
        form.reset();
        currentEditId = null;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeRoomModal() {
    const modal = document.getElementById('roomModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    currentEditId = null;
}

function fillRoomForm(room) {
    document.getElementById('roomNumber').value = room.roomNumber || '';
    document.getElementById('roomType').value = room.type || 'STANDARD';
    document.getElementById('roomCapacity').value = room.capacity || 1;
    document.getElementById('roomPrice').value = room.pricePerNight || 0;
    document.getElementById('roomStatus').value = room.status || 'AVAILABLE';
    document.getElementById('roomDescription').value = room.description || '';
    document.getElementById('roomAmenities').value = room.amenities?.join(', ') || '';
}

async function editRoom(roomId) {
    openRoomModal(roomId);
}

async function deleteRoom(roomId) {
    if (!confirm('Вы уверены, что хотите удалить этот номер?')) {
        return;
    }

    showLoading(true);
    try {
        await apiCall(`/rooms/${roomId}`, { method: 'DELETE' });
        showNotification('Номер успешно удален', 'success');
        loadRooms();
    } catch (error) {
        console.error('Error deleting room:', error);
        showNotification('Ошибка удаления номера: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Room Form Submission
document.getElementById('roomForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const roomData = {
        roomNumber: formData.get('roomNumber'),
        type: formData.get('type'),
        capacity: parseInt(formData.get('capacity')),
        pricePerNight: parseFloat(formData.get('pricePerNight')),
        status: formData.get('status'),
        description: formData.get('description'),
        amenities: formData.get('amenities').split(',').map(a => a.trim()).filter(a => a)
    };

    showLoading(true);
    try {
        if (currentEditId) {
            // Update existing room
            await apiCall(`/rooms/${currentEditId}`, {
                method: 'PUT',
                body: JSON.stringify(roomData)
            });
            showNotification('Номер успешно обновлен', 'success');
        } else {
            // Create new room
            await apiCall('/rooms', {
                method: 'POST',
                body: JSON.stringify(roomData)
            });
            showNotification('Номер успешно создан', 'success');
        }
        
        closeRoomModal();
        loadRooms();
    } catch (error) {
        console.error('Error saving room:', error);
        showNotification('Ошибка сохранения номера: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// ==================== REVIEWS MANAGEMENT ====================

async function loadReviews() {
    showLoading(true);
    try {
        const data = await apiCall('/reviews');
        reviews = data || [];
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        showNotification('Ошибка загрузки отзывов', 'error');
    } finally {
        showLoading(false);
    }
}

function displayReviews(reviewsToShow) {
    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;

    if (reviewsToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Нет отзывов</td></tr>';
        return;
    }

    tbody.innerHTML = reviewsToShow.map(review => `
        <tr>
            <td>${review.id}</td>
            <td>${review.user?.firstName} ${review.user?.lastName}</td>
            <td>${review.room?.roomNumber}</td>
            <td>
                <div class="review-rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
            </td>
            <td>${review.comment?.substring(0, 50)}${review.comment?.length > 50 ? '...' : ''}</td>
            <td><span class="status-badge ${review.status?.toLowerCase() || 'pending'}">${getReviewStatusText(review.status)}</span></td>
            <td>${formatDate(review.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewReview(${review.id})">
                        <i class="fas fa-eye"></i>
                        Просмотр
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteReview(${review.id})">
                        <i class="fas fa-trash"></i>
                        Удалить
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterReviews() {
    const search = document.getElementById('reviewSearch').value.toLowerCase();
    const ratingFilter = document.getElementById('reviewRatingFilter').value;
    const statusFilter = document.getElementById('reviewStatusFilter').value;

    let filteredReviews = reviews;

    if (search) {
        filteredReviews = filteredReviews.filter(review => 
            review.user?.firstName?.toLowerCase().includes(search) ||
            review.user?.lastName?.toLowerCase().includes(search) ||
            review.comment?.toLowerCase().includes(search)
        );
    }

    if (ratingFilter) {
        filteredReviews = filteredReviews.filter(review => review.rating == ratingFilter);
    }

    if (statusFilter) {
        filteredReviews = filteredReviews.filter(review => (review.status || 'PENDING') === statusFilter);
    }

    displayReviews(filteredReviews);
}

let currentReviewId = null;

function viewReview(reviewId) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    currentReviewId = reviewId;
    const modal = document.getElementById('reviewModal');
    const details = document.getElementById('reviewDetails');

    details.innerHTML = `
        <div class="review-details">
            <div class="review-header">
                <div class="review-user">${review.user?.firstName} ${review.user?.lastName}</div>
                <div class="review-rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
            </div>
            <div class="review-comment">${review.comment}</div>
            <div class="review-meta">
                <span>Номер: ${review.room?.roomNumber}</span>
                <span>${formatDate(review.createdAt)}</span>
            </div>
        </div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    currentReviewId = null;
}

async function approveReview() {
    if (!currentReviewId) return;

    showLoading(true);
    try {
        await apiCall(`/reviews/${currentReviewId}/approve`, { method: 'POST' });
        showNotification('Отзыв одобрен', 'success');
        closeReviewModal();
        loadReviews();
    } catch (error) {
        console.error('Error approving review:', error);
        showNotification('Ошибка одобрения отзыва: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function rejectReview() {
    if (!currentReviewId) return;

    showLoading(true);
    try {
        await apiCall(`/reviews/${currentReviewId}/reject`, { method: 'POST' });
        showNotification('Отзыв отклонен', 'success');
        closeReviewModal();
        loadReviews();
    } catch (error) {
        console.error('Error rejecting review:', error);
        showNotification('Ошибка отклонения отзыва: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
        return;
    }

    showLoading(true);
    try {
        await apiCall(`/reviews/${reviewId}`, { method: 'DELETE' });
        showNotification('Отзыв успешно удален', 'success');
        loadReviews();
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Ошибка удаления отзыва: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== BOOKINGS MANAGEMENT ====================

async function loadBookings() {
    showLoading(true);
    try {
        const data = await apiCall('/bookings');
        bookings = data || [];
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Ошибка загрузки бронирований', 'error');
    } finally {
        showLoading(false);
    }
}

function displayBookings(bookingsToShow) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    if (bookingsToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Нет бронирований</td></tr>';
        return;
    }

    tbody.innerHTML = bookingsToShow.map(booking => `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.user?.firstName} ${booking.user?.lastName}</td>
            <td>${booking.room?.roomNumber}</td>
            <td>${formatDate(booking.checkInDate)}</td>
            <td>${formatDate(booking.checkOutDate)}</td>
            <td>${booking.totalPrice?.toLocaleString()}₽</td>
            <td><span class="status-badge ${booking.status.toLowerCase()}">${getBookingStatusText(booking.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewBooking(${booking.id})">
                        <i class="fas fa-eye"></i>
                        Просмотр
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterBookings() {
    const search = document.getElementById('bookingSearch').value.toLowerCase();
    const statusFilter = document.getElementById('bookingStatusFilter').value;
    const dateFilter = document.getElementById('bookingDateFilter').value;

    let filteredBookings = bookings;

    if (search) {
        filteredBookings = filteredBookings.filter(booking => 
            booking.user?.firstName?.toLowerCase().includes(search) ||
            booking.user?.lastName?.toLowerCase().includes(search) ||
            booking.room?.roomNumber?.toLowerCase().includes(search)
        );
    }

    if (statusFilter) {
        filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
    }

    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredBookings = filteredBookings.filter(booking => {
            const checkInDate = new Date(booking.checkInDate);
            return checkInDate.toDateString() === filterDate.toDateString();
        });
    }

    displayBookings(filteredBookings);
}

let currentBookingId = null;

function viewBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    currentBookingId = bookingId;
    const modal = document.getElementById('bookingModal');
    const details = document.getElementById('bookingDetails');

    details.innerHTML = `
        <div class="booking-details">
            <div class="booking-header">
                <div class="booking-id">Бронирование #${booking.id}</div>
                <span class="status-badge ${booking.status.toLowerCase()}">${getBookingStatusText(booking.status)}</span>
            </div>
            <div class="booking-info">
                <div class="booking-info-item">
                    <div class="booking-info-label">Пользователь</div>
                    <div class="booking-info-value">${booking.user?.firstName} ${booking.user?.lastName}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Номер</div>
                    <div class="booking-info-value">${booking.room?.roomNumber}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Заезд</div>
                    <div class="booking-info-value">${formatDate(booking.checkInDate)}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Выезд</div>
                    <div class="booking-info-value">${formatDate(booking.checkOutDate)}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Гостей</div>
                    <div class="booking-info-value">${booking.guests}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Сумма</div>
                    <div class="booking-info-value">${booking.totalPrice?.toLocaleString()}₽</div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    currentBookingId = null;
}

async function confirmBooking() {
    if (!currentBookingId) return;

    showLoading(true);
    try {
        await apiCall(`/bookings/${currentBookingId}/confirm`, { method: 'POST' });
        showNotification('Бронирование подтверждено', 'success');
        closeBookingModal();
        loadBookings();
    } catch (error) {
        console.error('Error confirming booking:', error);
        showNotification('Ошибка подтверждения бронирования: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function checkInBooking() {
    if (!currentBookingId) return;

    showLoading(true);
    try {
        await apiCall(`/bookings/${currentBookingId}/checkin`, { method: 'POST' });
        showNotification('Гость заселен', 'success');
        closeBookingModal();
        loadBookings();
    } catch (error) {
        console.error('Error checking in booking:', error);
        showNotification('Ошибка заселения: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function checkOutBooking() {
    if (!currentBookingId) return;

    showLoading(true);
    try {
        await apiCall(`/bookings/${currentBookingId}/checkout`, { method: 'POST' });
        showNotification('Гость выселен', 'success');
        closeBookingModal();
        loadBookings();
    } catch (error) {
        console.error('Error checking out booking:', error);
        showNotification('Ошибка выселения: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function cancelBooking() {
    if (!currentBookingId) return;

    if (!confirm('Вы уверены, что хотите отменить это бронирование?')) {
        return;
    }

    showLoading(true);
    try {
        await apiCall(`/bookings/${currentBookingId}/cancel`, { method: 'POST' });
        showNotification('Бронирование отменено', 'success');
        closeBookingModal();
        loadBookings();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('Ошибка отмены бронирования: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== UTILITY FUNCTIONS ====================

function getStatusText(status) {
    const statusTexts = {
        'PENDING': 'Ожидает',
        'CONFIRMED': 'Подтверждено',
        'CHECKED_IN': 'Заселен',
        'CHECKED_OUT': 'Выселен',
        'CANCELLED': 'Отменено',
        'ACTIVE': 'Активный',
        'INACTIVE': 'Неактивный',
        'AVAILABLE': 'Доступен',
        'OCCUPIED': 'Занят',
        'MAINTENANCE': 'На ремонте',
        'APPROVED': 'Одобрен',
        'REJECTED': 'Отклонен'
    };
    return statusTexts[status] || status;
}

function getRoomTypeText(type) {
    const typeTexts = {
        'STANDARD': 'Стандарт',
        'DELUXE': 'Делюкс',
        'SUITE': 'Люкс'
    };
    return typeTexts[type] || type;
}

function getRoomStatusText(status) {
    const statusTexts = {
        'AVAILABLE': 'Доступен',
        'OCCUPIED': 'Занят',
        'MAINTENANCE': 'На ремонте'
    };
    return statusTexts[status] || status;
}

function getReviewStatusText(status) {
    const statusTexts = {
        'PENDING': 'На модерации',
        'APPROVED': 'Одобрен',
        'REJECTED': 'Отклонен'
    };
    return statusTexts[status] || 'На модерации';
}

function getBookingStatusText(status) {
    const statusTexts = {
        'PENDING': 'Ожидает',
        'CONFIRMED': 'Подтверждено',
        'CHECKED_IN': 'Заселен',
        'CHECKED_OUT': 'Выселен',
        'CANCELLED': 'Отменено'
    };
    return statusTexts[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('show', show);
    }
}

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

// Mobile navigation
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

// User menu
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
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user_data');
    
    // Redirect to home page
    window.location.href = '/home';
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
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Event listeners
function setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });

    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeUserModal();
            closeRoomModal();
            closeReviewModal();
            closeBookingModal();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeUserModal();
            closeRoomModal();
            closeReviewModal();
            closeBookingModal();
        }
    });
}

// Initialize theme
initTheme();
