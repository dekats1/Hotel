// Admin Panel Management JavaScript

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
document.addEventListener('DOMContentLoaded', function () {
    initializeAdmin();
    loadUserData();
    setupEventListeners();
    initializeTheme();
    loadDashboardData();
});

document.getElementById('roomPhotos')?.addEventListener('change', function () {
    const files = Array.from(this.files || []);
    const preview = document.getElementById('photoPreview');
    if (!preview) return;

    // Показываем временные превью для выбранных файлов
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            const item = document.createElement('div');
            item.className = 'photo-preview-item temp';
            const img = document.createElement('img');
            img.src = reader.result;
            item.appendChild(img);
            preview.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
});


// Initialize admin panel
function initializeAdmin() {
    if (navToggle) navToggle.addEventListener('click', toggleMobileMenu);
    navLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    const sidebarItems = document.querySelectorAll('.nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });

    setupSearchAndFilters();
}

// Setup search and filter functionality
function setupSearchAndFilters() {
    // Users
    const userSearch = document.getElementById('userSearch');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    if (userSearch) userSearch.addEventListener('input', () => filterUsers());
    if (userRoleFilter) userRoleFilter.addEventListener('change', () => filterUsers());
    if (userStatusFilter) userStatusFilter.addEventListener('change', () => filterUsers());

    // Rooms
    const roomSearch = document.getElementById('roomSearch');
    const roomTypeFilter = document.getElementById('roomTypeFilter');
    const roomStatusFilter = document.getElementById('roomStatusFilter');
    if (roomSearch) roomSearch.addEventListener('input', () => filterRooms());
    if (roomTypeFilter) roomTypeFilter.addEventListener('change', () => filterRooms());
    if (roomStatusFilter) roomStatusFilter.addEventListener('change', () => filterRooms());

    // Reviews
    const reviewSearch = document.getElementById('reviewSearch');
    const reviewRatingFilter = document.getElementById('reviewRatingFilter');
    const reviewStatusFilter = document.getElementById('reviewStatusFilter');
    if (reviewSearch) reviewSearch.addEventListener('input', () => filterReviews());
    if (reviewRatingFilter) reviewRatingFilter.addEventListener('change', () => filterReviews());
    if (reviewStatusFilter) reviewStatusFilter.addEventListener('change', () => filterReviews());

    // Bookings
    const bookingSearch = document.getElementById('bookingSearch');
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const bookingDateFilter = document.getElementById('bookingDateFilter');
    if (bookingSearch) bookingSearch.addEventListener('input', () => filterBookings());
    if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', () => filterBookings());
    if (bookingDateFilter) bookingDateFilter.addEventListener('change', () => filterBookings());
}

// API Call function with Cookie authentication
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });

    if (response.status === 401) {
        showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
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
            } catch {
                errorText = await response.text() || errorText;
            }
        } else {
            errorText = await response.text() || errorText;
        }
        throw new Error(errorText);
    }
    if (response.status === 204) return null;
    return await response.json();
}

// Local storage helpers
function getUserDataFromStorage() {
    try { return JSON.parse(localStorage.getItem('user_data') || 'null'); }
    catch { return null; }
}
function saveUserDataToStorage(userData) {
    try { localStorage.setItem('user_data', JSON.stringify(userData)); }
    catch {}
}

// Load user data
async function loadUserData() {
    currentUser = getUserDataFromStorage();
    if (currentUser) updateUserInterface();
    try {
        const data = await apiCall('/users/profile');
        currentUser = transformUserData(data);
        const basic = { id: currentUser.id, email: currentUser.email, firstName: currentUser.firstName, lastName: currentUser.lastName, role: data.role || 'ADMIN' };
        saveUserDataToStorage(basic);
        updateUserInterface();
    } catch (error) {
        console.error('Failed to load user data:', error);
        if (!error.message.includes('Требуется авторизация')) showNotification('Ошибка загрузки данных профиля: ' + error.message, 'error');
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

// Update header UI
function updateUserInterface() {
    if (!currentUser) return;
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmailSmall');
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarSmall = document.getElementById('userAvatarSmall');
    if (userName) userName.textContent = currentUser.name;
    if (userEmail) userEmail.textContent = currentUser.email;
    if (userAvatar) userAvatar.innerHTML = '<i class="fas fa-user"></i>';
    if (userAvatarSmall) userAvatarSmall.innerHTML = '<i class="fas fa-user"></i>';
}

// Section switcher
function switchSection(section) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${section}"]`);
    if (nav) nav.classList.add('active');

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const content = document.getElementById(`${section}-section`);
    if (content) content.classList.add('active');

    currentSection = section;
    switch (section) {
        case 'dashboard': loadDashboardData(); break;
        case 'users': loadUsers(); break;
        case 'rooms': loadRooms(); break;
        case 'reviews': loadReviews(); break;
        case 'bookings': loadBookings(); break;
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
    setText('totalUsers', users.length);
    setText('totalRooms', rooms.length);
    setText('totalBookings', bookings.length);
    const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
    setText('averageRating', avg);
}

function updateRecentBookings() {
    const container = document.getElementById('recentBookings');
    if (!container) return;
    const recent = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    if (recent.length === 0) {
        container.innerHTML = '<div class="recent-item">Нет недавних бронирований</div>';
        return;
    }
    container.innerHTML = recent.map(b => `
    <div class="recent-item">
      <div class="recent-item-info">
        <h4>${escapeHtml(b.userEmail || '')} • Комната ${escapeHtml(b.roomNumber || '')}</h4>
        <p>${formatDate(b.checkInDate)} — ${formatDate(b.checkOutDate)}</p>
      </div>
      <div class="recent-item-status">
        <span class="status-badge ${getBookingStatusClass(b.status)}">${getBookingStatusText(b.status)}</span>
      </div>
    </div>
  `).join('');
}

function updateRoomStats() {
    const stats = {
        total: rooms.length,
        active: rooms.filter(r => r.isActive).length,
        inactive: rooms.filter(r => !r.isActive).length,
        standard: rooms.filter(r => r.type === 'STANDARD').length,
        deluxe: rooms.filter(r => r.type === 'DELUXE').length,
        suite: rooms.filter(r => r.type === 'SUITE').length,
        apartment: rooms.filter(r => r.type === 'APARTMENT').length,
        penthouse: rooms.filter(r => r.type === 'PENTHOUSE').length
    };
    const container = document.getElementById('roomStats');
    if (!container) return;
    container.innerHTML = `
    <div class="room-stat"><h4>${stats.total}</h4><p>Всего</p></div>
    <div class="room-stat"><h4>${stats.active}</h4><p>Активные</p></div>
    <div class="room-stat"><h4>${stats.inactive}</h4><p>Неактивные</p></div>
    <div class="room-stat"><h4>${stats.standard}</h4><p>Стандарт</p></div>
    <div class="room-stat"><h4>${stats.deluxe}</h4><p>Делюкс</p></div>
    <div class="room-stat"><h4>${stats.suite}</h4><p>Люкс</p></div>
    <div class="room-stat"><h4>${stats.apartment}</h4><p>Апартаменты</p></div>
    <div class="room-stat"><h4>${stats.penthouse}</h4><p>Пентхаус</p></div>
  `;
}

// ==================== USERS ====================
async function loadUsers() {
    showLoading(true);
    try {
        users = await apiCall('/users');
        displayUsers(users);
    } catch (e) {
        showNotification('Ошибка загрузки пользователей', 'error');
    } finally {
        showLoading(false);
    }
}

function displayUsers(list) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem">Нет данных</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${escapeHtml(`${u.firstName || ''} ${u.lastName || ''}`.trim())}</td>
      <td>${escapeHtml(u.email || '')}</td>
      <td>${escapeHtml(u.role || '')}</td>
      <td><span class="status-badge ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Активен' : 'Неактивен'}</span></td>
      <td>${formatDate(u.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-action btn-delete" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterUsers() {
    const search = (document.getElementById('userSearch').value || '').toLowerCase();
    const role = document.getElementById('userRoleFilter').value;
    const status = document.getElementById('userStatusFilter').value;

    let filtered = users || [];
    if (search) {
        filtered = filtered.filter(u =>
            (`${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(search)) ||
            (u.email || '').toLowerCase().includes(search)
        );
    }
    if (role) filtered = filtered.filter(u => (u.role || '') === role);
    if (status) {
        filtered = filtered.filter(u => status === 'ACTIVE' ? u.isActive === true : u.isActive === false);
    }
    displayUsers(filtered);
}

// ... (предыдущий код остается без изменений до секции USERS)

// ========== NOTIFICATIONS (КАК В LOGIN.JS) ==========

/**
 * Показать уведомление с автоматическим скрытием
 */
function showNotification(message, type = 'info') {
    // Удалить существующие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Создать элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Иконка в зависимости от типа
    const icon = type === 'success' ? 'check-circle' :
        type === 'error' ? 'exclamation-circle' :
            type === 'warning' ? 'exclamation-triangle' :
                'info-circle';

    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        min-width: 300px;
    `;

    // Добавить в документ
    document.body.appendChild(notification);

    // Автоматически удалить через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Добавить стили для анимаций уведомлений
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
        
        .required {
            color: #ef4444;
        }
        
        .form-hint {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
    `;
    document.head.appendChild(notificationStyles);
}

// ========== USERS (ОБНОВЛЕННАЯ ВЕРСИЯ) ==========

/**
 * Открыть модальное окно создания пользователя
 */
function openUserCreateModal() {
    const modal = document.getElementById('userCreateModal');
    const form = document.getElementById('userCreateForm');
    form.reset();
    modal.classList.add('show');

    form.onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(form);

        // Валидация пароля
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        const payload = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            role: formData.get('role'),
            birthDate: formData.get('birthDate'),
            gender: formData.get('gender'),
            password: password,
            confirmPassword: confirmPassword
        };

        showLoading(true);
        try {
            await apiCall('/users', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showNotification('Пользователь успешно создан', 'success');
            closeUserCreateModal();
            loadUsers();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            showLoading(false);
        }
    };
}

/**
 * Закрыть модальное окно создания
 */
function closeUserCreateModal() {
    document.getElementById('userCreateModal').classList.remove('show');
}

/**
 * Открыть модальное окно редактирования пользователя
 */
async function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userEditModal');
    const form = document.getElementById('userEditForm');
    form.reset();

    // Заполнить форму данными пользователя
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editFirstName').value = user.firstName || '';
    document.getElementById('editLastName').value = user.lastName || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editPhone').value = user.phone || '';
    document.getElementById('editRole').value = user.role || 'USER';
    document.getElementById('editBirthDate').value = user.birthDate ? user.birthDate.substring(0, 10) : '';
    document.getElementById('editGender').value = user.gender || 'OTHER';
    document.getElementById('editBalance').value = user.balance || '0.00';
    document.getElementById('editIsActive').checked = user.isActive !== false;
    document.getElementById('editEmailVerified').checked = user.emailVerified === true;
    document.getElementById('editLastLogin').value = user.lastLogin ? formatDate(user.lastLogin) : 'Никогда';

    modal.classList.add('show');

    form.onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(form);

        const payload = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            role: formData.get('role'),
            isActive: formData.get('isActive') === 'on',
            birthDate: formData.get('birthDate'),
            gender: formData.get('gender'),
            balance: parseFloat(formData.get('balance')) || 0,
            emailVerified: formData.get('emailVerified') === 'on'
        };

        showLoading(true);
        try {
            await apiCall(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showNotification('Данные пользователя успешно обновлены', 'success');
            closeUserEditModal();
            loadUsers();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            showLoading(false);
        }
    };
}

/**
 * Закрыть модальное окно редактирования
 */
function closeUserEditModal() {
    document.getElementById('userEditModal').classList.remove('show');
}

/**
 * Удалить пользователя
 */
async function deleteUser(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    showLoading(true);
    try {
        await apiCall(`/users/${id}`, { method: 'DELETE' });
        showNotification('Пользователь успешно удален', 'success');
        loadUsers();
    } catch (e) {
        showNotification(e.message, 'error');
    } finally {
        showLoading(false);
    }
}


// ==================== ROOMS ====================
async function loadRooms() {
    showLoading(true);
    try {
        rooms = await apiCall('/rooms');
        displayRooms(rooms);
    } catch (e) {
        showNotification('Ошибка загрузки номеров', 'error');
    } finally {
        showLoading(false);
    }
}

function displayRooms(roomsToShow) {
    const tbody = document.getElementById('roomsTableBody');
    if (!tbody) return;
    if (!roomsToShow || roomsToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem">Нет данных</td></tr>`;
        return;
    }
    tbody.innerHTML = roomsToShow.map(room => `
    <tr>
      <td>${room.id}</td>
      <td>${escapeHtml(room.roomNumber || '')}</td>
      <td>${getRoomTypeText(room.type)}</td>
      <td>${formatMoney(room.basePrice)}</td>
      <td><span class="status-badge ${room.isActive ? 'active' : 'inactive'}">${room.isActive ? 'Свободна' : 'Занята'}</span></td>
      <td>${room.capacity ?? ''}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="editRoom('${room.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-action btn-delete" onclick="deleteRoom('${room.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRooms() {
    const search = (document.getElementById('roomSearch').value || '').toLowerCase();
    const typeFilter = document.getElementById('roomTypeFilter').value;
    const statusFilter = document.getElementById('roomStatusFilter').value;

    let filtered = rooms || [];
    if (search) {
        filtered = filtered.filter(r =>
            (r.roomNumber || '').toLowerCase().includes(search) ||
            getRoomTypeText(r.type).toLowerCase().includes(search)
        );
    }
    if (typeFilter) filtered = filtered.filter(r => r.type === typeFilter);
    if (statusFilter) {
        filtered = filtered.filter(r => statusFilter === 'ACTIVE' ? r.isActive === true : r.isActive === false);
    }
    displayRooms(filtered);
}

function openRoomModal() {
    currentEditId = null;
    const modal = document.getElementById('roomModal');
    document.getElementById('roomModalTitle').textContent = 'Добавить номер';
    const form = document.getElementById('roomForm');
    form.reset();

    // defaults
    document.getElementById('roomHasWifi').checked = true;
    document.getElementById('roomHasTv').checked = true;
    document.getElementById('roomActive').checked = true;
    document.getElementById('photoPreview').innerHTML = '';

    modal.classList.add('show');

    form.onsubmit = onRoomFormSubmit;
}

function closeRoomModal() {
    document.getElementById('roomModal').classList.remove('show');
    currentEditId = null;
}

async function editRoom(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    currentEditId = roomId;
    const modal = document.getElementById('roomModal');
    document.getElementById('roomModalTitle').textContent = 'Редактировать номер';
    const form = document.getElementById('roomForm');
    form.reset();

    fillRoomForm(room);

    modal.classList.add('show');
    form.onsubmit = onRoomFormSubmit;
}

function fillRoomForm(room) {
    setValue('roomNumber', room.roomNumber || '');
    setValue('roomType', room.type || 'STANDARD');
    setValue('roomCapacity', room.capacity ?? 1);
    setValue('roomBasePrice', room.basePrice ?? 0);
    setValue('roomArea', room.areaSqm ?? '');
    setValue('roomFloor', room.floor ?? '');

    setChecked('roomHasWifi', room.hasWifi !== false);
    setChecked('roomHasTv', room.hasTv !== false);
    setChecked('roomHasMinibar', !!room.hasMinibar);
    setChecked('roomHasBalcony', !!room.hasBalcony);
    setChecked('roomHasSeaView', !!room.hasSeaView);
    setChecked('roomActive', room.isActive !== false);

    const tr = room.translations || {};
    const ru = tr.RU || {};
    const en = tr.EN || {};
    setValue('roomNameRu', ru.name || '');
    setValue('roomDescription', ru.description || '');
    setValue('roomNameEn', en.name || '');
    setValue('roomDescriptionEn', en.description || '');

    loadRoomPhotos(room.photos || []);
}

async function onRoomFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const payload = {
        roomNumber: formData.get('roomNumber'),
        type: formData.get('type'),
        capacity: formData.get('capacity') ? parseInt(formData.get('capacity'), 10) : null,
        basePrice: formData.get('basePrice') ? parseFloat(formData.get('basePrice')) : null,
        areaSqm: formData.get('areaSqm') ? parseFloat(formData.get('areaSqm')) : null,
        floor: formData.get('floor') !== '' ? parseInt(formData.get('floor'), 10) : null,
        hasWifi: formData.get('hasWifi') === 'on',
        hasTv: formData.get('hasTv') === 'on',
        hasMinibar: formData.get('hasMinibar') === 'on',
        hasBalcony: formData.get('hasBalcony') === 'on',
        hasSeaView: formData.get('hasSeaView') === 'on',
        isActive: formData.get('isActive') === 'on',
        translations: {}
    };

    const nameRu = formData.get('nameRu');
    const descRu = formData.get('descriptionRu');
    if (nameRu || descRu) payload.translations.RU = { name: nameRu || '', description: descRu || '' };

    const nameEn = formData.get('nameEn');
    const descEn = formData.get('descriptionEn');
    if (nameEn || descEn) payload.translations.EN = { name: nameEn || '', description: descEn || '' };

    const fileInput = document.getElementById('roomPhotos');
    const files = fileInput?.files || [];

    showLoading(true);
    try {
        let roomId = currentEditId;
        if (currentEditId) {
            await apiCall(`/rooms/${currentEditId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            const created = await apiCall('/rooms', { method: 'POST', body: JSON.stringify(payload) });
            roomId = created?.id;
            if (!roomId) throw new Error('Не получен ID созданного номера');
        }

        // Загружаем фото, если выбраны; важно — multipart, без Content-Type заголовка вручную
        if (files.length > 0 && roomId) {
            const fd = new FormData();
            for (const f of files) fd.append('files', f); // ИМЯ ПАРАМЕТРА ДОЛЖНО БЫТЬ "files"
            const resp = await fetch(`/api/admin/rooms/${roomId}/photos`, {
                method: 'POST',
                credentials: 'include',
                body: fd
            });
            if (!resp.ok) {
                const t = await resp.text();
                throw new Error(t || 'Ошибка загрузки фото');
            }
        }

        // Обновить список и превью
        await loadRooms();
        // Если редактировали — обновить локальные фото в форме
        if (currentEditId) {
            const updated = rooms.find(r => r.id === currentEditId);
            if (updated) loadRoomPhotos(updated.photos || []);
        }

        showNotification(currentEditId ? 'Номер обновлен' : 'Номер создан', 'success');

        // Сбрасываем input файлов вручную после успешной загрузки
        if (fileInput) fileInput.value = '';

        closeRoomModal();
    } catch (err) {
        console.error(err);
        showNotification(err.message, 'error');
    } finally {
        showLoading(false);
    }
}


function getRoomTypeText(type) {
    const map = {
        STANDARD: 'Стандарт',
        DELUXE: 'Делюкс',
        SUITE: 'Люкс',
        APARTMENT: 'Апартаменты',
        PENTHOUSE: 'Пентхаус'
    };
    return map[type] || type || '';
}

async function deleteRoom(id) {
    if (!confirm('Удалить номер?')) return;
    try {
        await apiCall(`/rooms/${id}`, { method: 'DELETE' });
        showNotification('Номер удален', 'success');
        loadRooms();
    } catch (e) {
        showNotification(e.message, 'error');
    }
}

function loadRoomPhotos(photos) {
    const preview = document.getElementById('photoPreview');
    if (!preview) return;
    preview.innerHTML = '';
    photos
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .forEach(photo => {
            const item = document.createElement('div');
            item.className = 'photo-preview-item';
            item.dataset.photoId = photo.id;

            const img = document.createElement('img');
            img.src = photo.thumbnailUrl || photo.url;
            img.alt = photo.altText || 'Room photo';

            const badge = document.createElement('span');
            badge.className = 'status-badge ' + (photo.isPrimary ? 'confirmed' : 'pending');
            badge.textContent = photo.isPrimary ? 'Основное' : 'Дополнительное';

            const makePrimary = document.createElement('button');
            makePrimary.className = 'btn-action btn-view';
            makePrimary.innerHTML = '<i class="fas fa-star"></i>';
            makePrimary.title = 'Сделать основным';
            makePrimary.onclick = () => setPrimaryRoomPhoto(photo.id);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-action btn-delete';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Удалить фото';
            removeBtn.onclick = () => removeRoomPhoto(photo.id);

            item.appendChild(img);
            item.appendChild(badge);
            item.appendChild(makePrimary);
            item.appendChild(removeBtn);
            preview.appendChild(item);
        });
}

async function uploadRoomPhotos(roomId, fileList) {
    const formData = new FormData();
    Array.from(fileList).forEach(f => formData.append('files', f));
    try {
        const resp = await fetch(`${API_BASE_URL}/rooms/${roomId}/photos`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        if (!resp.ok) throw new Error(await resp.text());
        showNotification('Фотографии загружены', 'success');
    } catch (e) {
        showNotification('Не удалось загрузить фото: ' + e.message, 'error');
    }
}

async function removeRoomPhoto(photoId) {
    if (!currentEditId) {
        showNotification('Сначала сохраните номер', 'warning');
        return;
    }
    if (!confirm('Удалить фото?')) return;
    try {
        await fetch(`${API_BASE_URL}/rooms/photos/${photoId}`, {
            method: 'DELETE',
            credentials: 'include'
        }).then(r => {
            if (!r.ok) throw new Error('Ошибка удаления фото');
        });
        showNotification('Фото удалено', 'success');
        const room = rooms.find(r => r.id === currentEditId);
        if (room) {
            room.photos = (room.photos || []).filter(p => p.id !== photoId);
            loadRoomPhotos(room.photos);
        }
    } catch (e) {
        showNotification(e.message, 'error');
    }
}

async function setPrimaryRoomPhoto(photoId) {
    if (!currentEditId) {
        showNotification('Сначала сохраните номер', 'warning');
        return;
    }
    try {
        await fetch(`${API_BASE_URL}/rooms/photos/${photoId}/primary`, {
            method: 'PUT',
            credentials: 'include'
        }).then(r => {
            if (!r.ok) throw new Error('Ошибка установки основного фото');
        });
        showNotification('Основное фото обновлено', 'success');
        const room = rooms.find(r => r.id === currentEditId);
        if (room && room.photos) {
            room.photos = room.photos.map(p => ({ ...p, isPrimary: p.id === photoId }));
            loadRoomPhotos(room.photos);
        }
    } catch (e) {
        showNotification(e.message, 'error');
    }
}

// ==================== REVIEWS ====================
async function loadReviews() {
    showLoading(true);
    try {
        reviews = await apiCall('/reviews');
        displayReviews(reviews);
    } catch (e) {
        showNotification('Ошибка загрузки отзывов', 'error');
    } finally {
        showLoading(false);
    }
}

function displayReviews(list) {
    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem">Нет данных</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${escapeHtml(r.userName || r.userId || '')}</td>
      <td>${escapeHtml(r.roomNumber || r.roomId || '')}</td>
      <td>${r.rating ?? ''}</td>
      <td>${escapeHtml(r.comment || '')}</td>
      <td><span class="status-badge ${r.isApproved ? 'approved' : 'pending'}">${r.isApproved ? 'Одобрен' : 'На модерации'}</span></td>
      <td>${formatDate(r.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-view" onclick="openReviewModal('${r.id}')"><i class="fas fa-eye"></i></button>
          <button class="btn-action btn-delete" onclick="deleteReview('${r.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterReviews() {
    const search = (document.getElementById('reviewSearch').value || '').toLowerCase();
    const rating = document.getElementById('reviewRatingFilter').value;
    const status = document.getElementById('reviewStatusFilter').value;

    let filtered = reviews || [];
    if (search) {
        filtered = filtered.filter(r =>
            (r.userName || '').toLowerCase().includes(search) ||
            (r.roomNumber || '').toLowerCase().includes(search) ||
            (r.comment || '').toLowerCase().includes(search)
        );
    }
    if (rating) filtered = filtered.filter(r => String(r.rating) === rating);
    if (status) {
        if (status === 'APPROVED') filtered = filtered.filter(r => r.isApproved === true);
        if (status === 'PENDING') filtered = filtered.filter(r => r.isApproved === false);
        if (status === 'REJECTED') filtered = filtered.filter(r => r.isApproved === false && r.isVisible === false);
    }
    displayReviews(filtered);
}

function openReviewModal(reviewId) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const modal = document.getElementById('reviewModal');
    const details = document.getElementById('reviewDetails');
    details.innerHTML = `
    <div class="detail-row"><strong>Пользователь:</strong> ${escapeHtml(review.userName || review.userId || '')}</div>
    <div class="detail-row"><strong>Номер:</strong> ${escapeHtml(review.roomNumber || review.roomId || '')}</div>
    <div class="detail-row"><strong>Оценка:</strong> ${review.rating ?? ''}</div>
    <div class="detail-row"><strong>Комментарий:</strong> ${escapeHtml(review.comment || '')}</div>
    <div class="detail-row"><strong>Статус:</strong> ${review.isApproved ? 'Одобрен' : 'На модерации'}</div>
    <div class="detail-row"><strong>Видимость:</strong> ${review.isVisible ? 'Виден' : 'Скрыт'}</div>
    <div class="detail-row"><strong>Дата:</strong> ${formatDate(review.createdAt)}</div>
  `;
    modal.dataset.reviewId = reviewId;
    modal.classList.add('show');
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.classList.remove('show');
    modal.dataset.reviewId = '';
}

async function approveReview() {
    const modal = document.getElementById('reviewModal');
    const id = modal.dataset.reviewId;
    if (!id) return;
    try {
        const updated = await apiCall(`/reviews/${id}/visibility?visible=true`, { method: 'PUT' });
        showNotification('Отзыв одобрен', 'success');
        closeReviewModal();
        loadReviews();
    } catch (e) {
        showNotification(e.message, 'error');
    }
}

async function rejectReview() {
    const modal = document.getElementById('reviewModal');
    const id = modal.dataset.reviewId;
    if (!id) return;
    try {
        const updated = await apiCall(`/reviews/${id}/visibility?visible=false`, { method: 'PUT' });
        showNotification('Отзыв скрыт', 'success');
        closeReviewModal();
        loadReviews();
    } catch (e) {
        showNotification(e.message, 'error');
    }
}

async function deleteReview(id) {
    if (!confirm('Удалить отзыв?')) return;
    try {
        await apiCall(`/reviews/${id}`, { method: 'DELETE' });
        showNotification('Отзыв удален', 'success');
        loadReviews();
    } catch (e) {
        showNotification(e.message, 'error');
    }
}

// ==================== BOOKINGS ====================
async function loadBookings() {
    showLoading(true);
    try {
        bookings = await apiCall('/bookings');
        displayBookings(bookings);
    } catch (e) {
        showNotification('Ошибка загрузки бронирований', 'error');
    } finally {
        showLoading(false);
    }
}

function displayBookings(list) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem">Нет данных</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${escapeHtml(b.userEmail || b.userId || '')}</td>
      <td>${escapeHtml(b.roomNumber || b.roomId || '')}</td>
      <td>${formatDate(b.checkInDate)}</td>
      <td>${formatDate(b.checkOutDate)}</td>
      <td>${formatMoney(b.totalPrice)}</td>
      <td><span class="status-badge ${getBookingStatusClass(b.status)}">${getBookingStatusText(b.status)}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-view" onclick="openBookingModal('${b.id}')"><i class="fas fa-eye"></i></button>
          <button class="btn-action btn-success" onclick="confirmBooking('${b.id}')"><i class="fas fa-check"></i></button>
          <button class="btn-action btn-warning" onclick="checkInBooking('${b.id}')"><i class="fas fa-sign-in-alt"></i></button>
          <button class="btn-action btn-info" onclick="checkOutBooking('${b.id}')"><i class="fas fa-sign-out-alt"></i></button>
          <button class="btn-action btn-danger" onclick="cancelBooking('${b.id}')"><i class="fas fa-times"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterBookings() {
    const search = (document.getElementById('bookingSearch').value || '').toLowerCase();
    const status = document.getElementById('bookingStatusFilter').value;
    const date = document.getElementById('bookingDateFilter').value;

    let filtered = bookings || [];
    if (search) {
        filtered = filtered.filter(b =>
            (b.userEmail || '').toLowerCase().includes(search) ||
            (b.roomNumber || '').toLowerCase().includes(search)
        );
    }
    if (status) filtered = filtered.filter(b => (b.status || '') === status);
    if (date) {
        const target = new Date(date);
        filtered = filtered.filter(b => {
            const d = b.bookingDate ? new Date(b.bookingDate) : null;
            return d && sameDate(d, target);
        });
    }
    displayBookings(filtered);
}

function openBookingModal(id) {
    const b = bookings.find(x => x.id === id);
    if (!b) return;
    const modal = document.getElementById('bookingModal');
    const details = document.getElementById('bookingDetails');
    details.innerHTML = `
    <div class="detail-row"><strong>Пользователь:</strong> ${escapeHtml(b.userEmail || b.userId || '')}</div>
    <div class="detail-row"><strong>Номер:</strong> ${escapeHtml(b.roomNumber || b.roomId || '')}</div>
    <div class="detail-row"><strong>Даты:</strong> ${formatDate(b.checkInDate)} — ${formatDate(b.checkOutDate)}</div>
    <div class="detail-row"><strong>Гостей:</strong> ${b.guestsCount ?? ''}</div>
    <div class="detail-row"><strong>Ночей:</strong> ${b.totalNights ?? ''}</div>
    <div class="detail-row"><strong>Цена/ночь:</strong> ${formatMoney(b.pricePerNight)}</div>
    <div class="detail-row"><strong>Итого:</strong> ${formatMoney(b.totalPrice)} ${escapeHtml(b.currency || '')}</div>
    <div class="detail-row"><strong>Статус:</strong> ${getBookingStatusText(b.status)}</div>
    <div class="detail-row"><strong>Запросы:</strong> ${escapeHtml(b.specialRequests || '—')}</div>
    <div class="detail-row"><strong>Создано:</strong> ${formatDate(b.createdAt)}</div>
    ${b.cancelledAt ? `<div class="detail-row"><strong>Отменено:</strong> ${formatDate(b.cancelledAt)}</div>` : ''}
    ${b.cancellationReason ? `<div class="detail-row"><strong>Причина отмены:</strong> ${escapeHtml(b.cancellationReason)}</div>` : ''}
  `;
    modal.dataset.bookingId = id;
    modal.classList.add('show');
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.remove('show');
    modal.dataset.bookingId = '';
}

async function confirmBooking(id = null) {
    const bookingId = id || document.getElementById('bookingModal').dataset.bookingId;
    if (!bookingId) return;
    await changeBookingStatus(bookingId, 'CONFIRMED', 'Бронирование подтверждено');
}
async function checkInBooking(id = null) {
    const bookingId = id || document.getElementById('bookingModal').dataset.bookingId;
    if (!bookingId) return;
    await changeBookingStatus(bookingId, 'CHECKED_IN', 'Гость заселен');
}
async function checkOutBooking(id = null) {
    const bookingId = id || document.getElementById('bookingModal').dataset.bookingId;
    if (!bookingId) return;
    await changeBookingStatus(bookingId, 'CHECKED_OUT', 'Гость выселен');
}
async function cancelBooking(id = null) {
    const bookingId = id || document.getElementById('bookingModal').dataset.bookingId;
    if (!bookingId) return;
    await changeBookingStatus(bookingId, 'CANCELLED', 'Бронирование отменено');
}

async function changeBookingStatus(bookingId, status, successMessage) {
    try {
        await apiCall(`/bookings/${bookingId}/status?status=${encodeURIComponent(status)}`, { method: 'PUT' });
        showNotification(successMessage, 'success');
        closeBookingModal();
        loadBookings();
    } catch (e) {
        showNotification(e.message, 'error');
    }
}

function getBookingStatusText(s) {
    const map = {
        PENDING: 'Ожидает',
        CONFIRMED: 'Подтверждено',
        CHECKED_IN: 'Заселен',
        CHECKED_OUT: 'Выселен',
        CANCELLED: 'Отменено'
    };
    return map[s] || s || '';
}
function getBookingStatusClass(s) {
    const map = {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        CHECKED_IN: 'info',
        CHECKED_OUT: 'secondary',
        CANCELLED: 'danger'
    };
    return map[s] || 'secondary';
}

// ==================== THEME & NAV ====================
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        updateThemeIcon();
    }
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon();
}
function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    if (icon) icon.className = current === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}
function toggleMobileMenu() {
    document.body.classList.toggle('menu-open');
}
function closeMobileMenu() {
    document.body.classList.remove('menu-open');
}
function toggleUserMenu() {
    if (userDropdown) userDropdown.classList.toggle('show');
}
function logout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        .finally(() => window.location.href = '/login');
}

// ==================== UTILITIES ====================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? '';
}
function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
}
function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = !!checked;
}
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function formatMoney(v) {
    if (v === null || v === undefined || v === '') return '';
    const num = typeof v === 'number' ? v : parseFloat(v);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function escapeHtml(s) {
    return String(s).replace(/[&<>"'`=\/]/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#x60;', '=': '&#x3D;', '/': '&#x2F;' })[c];
    });
}
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    overlay.style.display = show ? 'flex' : 'none';
}


function showNotification(message, type = 'info') {
    // Удалить существующие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Создать элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Иконка в зависимости от типа
    const icon = type === 'success' ? 'check-circle' :
        type === 'error' ? 'exclamation-circle' :
            type === 'warning' ? 'exclamation-triangle' :
                'info-circle';

    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        min-width: 300px;
    `;

    // Добавить в документ
    document.body.appendChild(notification);

    // Автоматически удалить через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Добавить стили для анимаций уведомлений
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
        
        .required {
            color: #ef4444;
        }
        
        .form-hint {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
    `;
    document.head.appendChild(notificationStyles);
}

