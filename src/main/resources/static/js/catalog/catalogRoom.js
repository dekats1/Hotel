// ==============================================
// CONFIGURATION AND INITIALIZATION
// ==============================================

const API_BASE_URL = '/api/rooms';
const API_BASE_AUTH = '/api/auth';
const ENDPOINTS = {
    getAllRooms: '/getAllRooms',
    roomById: (id) => `/${id}`
};

let allRooms = [];
let filteredRooms = [];
let currentTheme = localStorage.getItem('theme') || 'light';

document.addEventListener('DOMContentLoaded', async () => {
    initializeThemeToggle();
    bindFilters();
    checkAuthStatus();
    applyUrlParams();
    await loadRooms();
    setupBookingModalListeners();

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('show');
        }
    });
});

function initializeThemeToggle() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ==============================================
// UTILS
// ==============================================

function escapeHtml(s) {
    return String(s).replace(/[&<>"'`=\/]/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
        "'": '&#39;', '`': '&#x60;', '=': '&#x3D;', '/': '&#x2F;'
    }[c]));
}

function toNum(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
}

function formatMoney(v) {
    const n = toNum(v);
    return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function debounce(fn, t) {
    let id;
    return (...a) => {
        clearTimeout(id);
        id = setTimeout(() => fn.apply(null, a), t);
    };
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function notify(message, type = 'info') {
    const exist = document.querySelectorAll('.notification');
    exist.forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.style.cssText = `position:fixed;top:20px;right:20px;background:${type==='success'?'#10b981':type==='error'?'#ef4444':type==='warning'?'#f59e0b':'#3b82f6'};color:#fff;padding:1rem 1.25rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);z-index:10000`;
    n.innerHTML = `<div class="notification-content"><i class="fas fa-info-circle"></i><span>${message}</span><button class="notification-close" onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#fff;cursor:pointer;margin-left:10px"><i class="fas fa-times"></i></button></div>`;
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentElement) n.remove(); }, 4000);
}

// ==============================================
// API & DATA LOADING
// ==============================================

async function apiCall(endpoint, options = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    if (!res.ok) {
        let msg = `Ошибка: ${res.status}`;
        try {
            const ct = res.headers.get('content-type') || '';
            msg = ct.includes('application/json') ? (await res.json()).message || msg : (await res.text() || msg);
        } catch {}
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

async function loadRooms() {
    showLoading(true);
    try {
        let data = await apiCall(ENDPOINTS.getAllRooms);
        console.log('Raw API response:', data);

        if (data && data.length > 0) {
            console.log('First room structure:', data[0]);
            console.log('Translations:', data[0].translations);
        }

        allRooms = Array.isArray(data) ? data.filter(r => r && r.isActive !== false) : [];
        filteredRooms = allRooms.slice();
        renderRooms();
    } catch (err) {
        console.error('Error loading rooms:', err);
        notify(err.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==============================================
// FILTERING & ROOM DISPLAY
// ==============================================

function bindFilters() {
    const form = document.getElementById('filtersForm');
    const reset = document.getElementById('btnReset');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); applyFilters(); });
    if (reset) reset.addEventListener('click', () => { resetFilters(); applyFilters(); });

    ['searchQuery', 'typeFilter', 'priceMin', 'priceMax', 'capacityFilter', 'sortBy', 'fWifi', 'fTv', 'fMinibar', 'fBalcony', 'fSea']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', debounce(applyFilters, 50));
            if (el && el.tagName === 'INPUT' && el.type === 'text') el.addEventListener('input', debounce(applyFilters, 150));
        });
}

function resetFilters() {
    document.getElementById('searchQuery').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('capacityFilter').value = '';
    document.getElementById('sortBy').value = 'POPULAR';
    document.getElementById('fWifi').checked = false;
    document.getElementById('fTv').checked = false;
    document.getElementById('fMinibar').checked = false;
    document.getElementById('fBalcony').checked = false;
    document.getElementById('fSea').checked = false;
}

function getTranslation(room, lang = 'RU') {
    if (!room || !room.translations || typeof room.translations !== 'object') {
        return null;
    }
    return room.translations[lang] || room.translations['EN'] || null;
}

function getRoomName(room) {
    const transRU = getTranslation(room, 'RU');
    const transEN = getTranslation(room, 'EN');
    return transRU?.name || transEN?.name || `Номер ${room.roomNumber || ''}`;
}

function applyFilters() {
    const search = (document.getElementById('searchQuery').value || '').toLowerCase();
    const type = document.getElementById('typeFilter').value;
    const pMin = parseFloat(document.getElementById('priceMin').value);
    const pMax = parseFloat(document.getElementById('priceMax').value);
    const capacity = document.getElementById('capacityFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    const need = {
        wifi: document.getElementById('fWifi').checked,
        tv: document.getElementById('fTv').checked,
        minibar: document.getElementById('fMinibar').checked,
        balcony: document.getElementById('fBalcony').checked,
        sea: document.getElementById('fSea').checked,
    };

    let list = allRooms.slice();

    if (search) {
        list = list.filter(r => {
            const name = getRoomName(r).toLowerCase();
            const roomNumber = (r.roomNumber || '').toLowerCase();
            const typeText = getRoomTypeText(r.type).toLowerCase();

            return name.includes(search) ||
                roomNumber.includes(search) ||
                typeText.includes(search);
        });
    }

    if (type) list = list.filter(r => r.type === type);
    if (!Number.isNaN(pMin)) list = list.filter(r => (toNum(r.basePrice)) >= pMin);
    if (!Number.isNaN(pMax)) list = list.filter(r => (toNum(r.basePrice)) <= pMax);
    if (capacity) {
        if (capacity === '5') list = list.filter(r => (r.capacity || 0) >= 5);
        else list = list.filter(r => String(r.capacity || '') === capacity);
    }

    if (need.wifi) list = list.filter(r => r.hasWifi !== false);
    if (need.tv) list = list.filter(r => r.hasTv !== false);
    if (need.minibar) list = list.filter(r => !!r.hasMinibar);
    if (need.balcony) list = list.filter(r => !!r.hasBalcony);
    if (need.sea) list = list.filter(r => !!r.hasSeaView);

    switch (sortBy) {
        case 'PRICE_ASC': list.sort((a, b) => toNum(a.basePrice) - toNum(b.basePrice)); break;
        case 'PRICE_DESC': list.sort((a, b) => toNum(b.basePrice) - toNum(a.basePrice)); break;
        case 'AREA_DESC': list.sort((a, b) => (toNum(b.areaSqm) - toNum(a.areaSqm))); break;
        case 'RATING_DESC': list.sort((a, b) => (toNum(b.averageRating) - toNum(a.averageRating))); break;
        default: break;
    }

    filteredRooms = list;
    renderRooms();
}

function renderRooms() {
    const grid = document.getElementById('roomsGrid');
    const count = document.getElementById('roomsCount');
    const empty = document.getElementById('emptyState');

    if (!grid || !count || !empty) return;

    count.textContent = `Найдено: ${filteredRooms.length}`;

    if (filteredRooms.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    grid.innerHTML = filteredRooms.map(r => {
        const price = formatMoney(r.basePrice);
        const name = getRoomName(r);
        const mainPhoto = (r.photos || []).find(p => p.isPrimary) || (r.photos || [])[0];
        const imgUrl = mainPhoto ? (mainPhoto.thumbnailUrl || mainPhoto.url) : '';
        const typeText = getRoomTypeText(r.type);
        const area = r.areaSqm ? `${r.areaSqm} м²` : '';
        const capacity = r.capacity ? `${r.capacity} гост.` : '';

        return `
        <article class="room-card">
            <div class="room-media">
                ${imgUrl ? `<img alt="${escapeHtml(name)}" src="${imgUrl}">` : '<div class="no-image">Нет фото</div>'}
                <div class="badge-price">${price} BYN/ночь</div>
            </div>
            <div class="room-body">
                <div class="room-title">
                    <h3>${escapeHtml(name)}</h3>
                    <span class="room-type">${escapeHtml(typeText)}</span>
                </div>
                <div class="room-sub">${[area, capacity].filter(Boolean).join(' • ')}</div>
                <div class="room-features">
                    ${r.hasWifi !== false ? '<span><i class="fas fa-wifi"></i> Wi‑Fi</span>' : ''}
                    ${r.hasTv !== false ? '<span><i class="fas fa-tv"></i> ТВ</span>' : ''}
                    ${r.hasMinibar ? '<span><i class="fas fa-wine-glass"></i> Минибар</span>' : ''}
                    ${r.hasBalcony ? '<span><i class="fas fa-door-open"></i> Балкон</span>' : ''}
                    ${r.hasSeaView ? '<span><i class="fas fa-water"></i> Вид на море</span>' : ''}
                </div>
                <div class="room-actions">
                    <button class="btn btn-secondary" onclick="goToBooking('${r.id}')"><i class="fas fa-calendar-check"></i> Бронировать</button>
                    <button class="btn btn-primary" onclick="openRoomDetails('${r.id}')"><i class="fas fa-eye"></i> Подробнее</button>
                </div>
            </div>
        </article>`;
    }).join('');
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

function applyUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    console.log('URL params:', Object.fromEntries(urlParams));

    const checkIn = urlParams.get('checkIn');
    const checkOut = urlParams.get('checkOut');
    const guests = urlParams.get('guests');
    const roomType = urlParams.get('type');

    if (roomType) {
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.value = roomType;
            console.log('Applied room type filter:', roomType);
        }
    }

    if (guests) {
        const capacityFilter = document.getElementById('capacityFilter');
        if (capacityFilter) {
            if (parseInt(guests) >= 5) {
                capacityFilter.value = '5';
            } else {
                capacityFilter.value = guests;
            }
            console.log('Applied capacity filter:', guests);
        }
    }

    if (checkIn) {
        sessionStorage.setItem('searchCheckIn', checkIn);
        console.log('Saved checkIn date:', checkIn);
    }

    if (checkOut) {
        sessionStorage.setItem('searchCheckOut', checkOut);
        console.log('Saved checkOut date:', checkOut);
    }

    if (guests) {
        sessionStorage.setItem('searchGuests', guests);
        console.log('Saved guests count:', guests);
    }

    if (roomType || guests) {
        setTimeout(() => {
            applyFilters();
        }, 100);
    }
}

// Room Detail Functions

function goToBooking(roomId) {
    openBookingModal(roomId);
}

async function openRoomDetails(roomId) {
    showLoading(true);
    try {
        const room = allRooms.find(r => r.id === roomId);

        if (!room) {
            throw new Error('Комната не найдена');
        }

        console.log('Room details:', room);
        fillRoomModal(room);
        document.getElementById('roomModal').classList.add('show');
    } catch (e) {
        console.error('Error opening room details:', e);
        notify('Не удалось открыть детали комнаты: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}


function fillRoomModal(room) {
    const transRU = getTranslation(room, 'RU');
    const transEN = getTranslation(room, 'EN');
    const name = transRU?.name || transEN?.name || `Номер ${room.roomNumber || ''}`;
    const desc = transRU?.description || transEN?.description || '';

    document.getElementById('modalTitle').textContent = 'Информация о номере';
    document.getElementById('roomName').textContent = name;
    document.getElementById('roomDescription').textContent = desc;
    document.getElementById('roomCapacity').textContent = room.capacity ?? '';
    document.getElementById('roomArea').textContent = room.areaSqm ?? '';
    const priceLabel = document.getElementById('galleryPrice');
    priceLabel.textContent = `${formatMoney(room.basePrice)} BYN/ночь`;

    const ul = document.getElementById('roomAmenities');
    const items = [];
    if (room.hasWifi !== false) items.push(`<li><i class="fas fa-wifi"></i> Wi‑Fi</li>`);
    if (room.hasTv !== false) items.push(`<li><i class="fas fa-tv"></i> ТВ</li>`);
    if (room.hasMinibar) items.push(`<li><i class="fas fa-wine-glass"></i> Минибар</li>`);
    if (room.hasBalcony) items.push(`<li><i class="fas fa-door-open"></i> Балкон</li>`);
    if (room.hasSeaView) items.push(`<li><i class="fas fa-water"></i> Вид на море</li>`);
    ul.innerHTML = items.join('');

    const photos = (room.photos || []).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const main = photos.find(p => p.isPrimary) || photos[0] || null;
    const mainImg = document.getElementById('galleryMain');
    mainImg.src = main ? (main.url || main.thumbnailUrl) : '';
    const thumbs = document.getElementById('galleryThumbs');
    thumbs.innerHTML = photos.map((p, idx) => `<img data-idx="${idx}" class="${p === main ? 'active' : ''}" src="${p.thumbnailUrl || p.url}" alt="Фото">`).join('');
    thumbs.querySelectorAll('img').forEach((img, idx) => {
        img.addEventListener('click', () => {
            mainImg.src = photos[idx].url || photos[idx].thumbnailUrl;
            thumbs.querySelectorAll('img').forEach(i => i.classList.remove('active'));
            img.classList.add('active');
        });
    });

    const btnBook = document.getElementById('btnBook');
    if (btnBook) btnBook.onclick = () => goToBooking(room.id);
}


// ==============================================
// BOOKING MODAL
// ==============================================

function openBookingModal(roomId) {
    const room = allRooms.find(r => r.id === roomId);

    if (!room) {
        notify('Комната не найдена', 'error');
        return;
    }

    const modal = document.getElementById('bookingModal');
    if (!modal) {
        console.error('Booking modal not found');
        return;
    }

    modal.dataset.roomId = roomId;
    modal.dataset.pricePerNight = room.basePrice;

    const name = getRoomName(room);
    document.getElementById('bookingRoomName').textContent = name;
    document.getElementById('bookingRoomPrice').textContent = `${formatMoney(room.basePrice)} BYN/ночь`;

    const savedCheckIn = sessionStorage.getItem('searchCheckIn');
    const savedCheckOut = sessionStorage.getItem('searchCheckOut');
    const savedGuests = sessionStorage.getItem('searchGuests');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    const guestsInput = document.getElementById('guestsCount');

    checkInInput.min = today;
    checkOutInput.min = tomorrow;

    checkInInput.value = savedCheckIn || today;
    checkOutInput.value = savedCheckOut || tomorrow;
    guestsInput.value = savedGuests || '1';

    document.getElementById('currency').value = 'EUR';
    document.getElementById('specialRequests').value = '';

    calculateTotalPrice();

    modal.classList.add('show');
}


function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function calculateTotalPrice() {
    const modal = document.getElementById('bookingModal');
    const pricePerNight = parseFloat(modal.dataset.pricePerNight || 0);

    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;

    if (!checkInDate || !checkOutDate) {
        document.getElementById('totalNights').textContent = '0';
        document.getElementById('totalPrice').textContent = '0 BYN';
        return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const nights = Math.max(0, Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const totalPrice = nights * pricePerNight;

    document.getElementById('totalNights').textContent = nights;
    document.getElementById('totalPrice').textContent = `${formatMoney(totalPrice)} BYN`;
}

async function submitBooking() {
    console.log('=== SUBMIT BOOKING STARTED ===');

    const modal = document.getElementById('bookingModal');
    const roomId = modal.dataset.roomId;
    const pricePerNight = parseFloat(modal.dataset.pricePerNight || 0);

    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;
    const guestsCount = parseInt(document.getElementById('guestsCount').value);
    const currency = document.getElementById('currency').value;
    const specialRequests = document.getElementById('specialRequests').value.trim();

    console.log('Form values:', { checkInDate, checkOutDate, guestsCount, currency });

    if (!checkInDate || !checkOutDate) {
        console.warn('Validation failed: dates missing');
        notify('Выберите даты заезда и выезда', 'warning');
        return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
        console.warn('Validation failed: checkout date invalid');
        notify('Дата выезда должна быть позже даты заезда', 'warning');
        return;
    }

    if (!guestsCount || guestsCount < 1) {
        console.warn('Validation failed: invalid guest count');
        notify('Укажите количество гостей', 'warning');
        return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * pricePerNight;

    console.log('Calculated:', { nights, totalPrice });

    const bookingRequest = {
        roomId: roomId,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        guestsCount: guestsCount,
        pricePerNight: pricePerNight,
        totalPrice: totalPrice,
        currency: currency,
        specialRequests: specialRequests || null
    };

    console.log('Booking request:', JSON.stringify(bookingRequest, null, 2));

    showLoading(true);

    try {
        const url = '/api/booking/addBooking';
        console.log('Sending POST to:', url);

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingRequest)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            let errorData;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                const text = await response.text();
                errorData = { message: text || `Ошибка ${response.status}` };
            }

            console.error('Error response:', errorData);
            throw new Error(errorData.message || `Ошибка: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Booking created:', result);

        notify('Бронирование успешно создано!', 'success');
        closeBookingModal();

        setTimeout(() => {
            console.log('Redirecting to mybookings...');
            window.location.href = '/booking';
        }, 1500);

    } catch (error) {
        console.error('=== BOOKING ERROR ===');
        console.error('Error:', error.message);

        if (error.message.includes('401') || error.message.includes('403')) {
            notify('Для бронирования необходимо войти в систему', 'warning');
            setTimeout(() => {
                // window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1500);
        } else {
            notify('Ошибка при создании бронирования: ' + error.message, 'error');
        }
    } finally {
        console.log('=== SUBMIT BOOKING FINISHED ===');
        showLoading(false);
    }
}

// Setup Listeners

function setupBookingModalListeners() {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        bookingModal.addEventListener('click', (e) => {
            if (e.target === bookingModal) {
                closeBookingModal();
            }
        });
    }

    const checkInDate = document.getElementById('checkInDate');
    const checkOutDate = document.getElementById('checkOutDate');

    if (checkInDate) {
        checkInDate.addEventListener('change', () => {
            const nextDay = new Date(checkInDate.value);
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutDate.min = nextDay.toISOString().split('T')[0];

            if (checkOutDate.value && new Date(checkOutDate.value) <= new Date(checkInDate.value)) {
                checkOutDate.value = nextDay.toISOString().split('T')[0];
            }

            calculateTotalPrice();
        });
    }

    if (checkOutDate) {
        checkOutDate.addEventListener('change', calculateTotalPrice);
    }
}

// ==============================================
// AUTH & NAVIGATION
// ==============================================

function getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

function removeUserData() {
    localStorage.removeItem('user_data');
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
            removeUserData();
            updateNavigation(false);
        }
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

function checkAuthStatus() {
    const userData = getUserData();
    const isAuthenticated = !!userData;
    updateNavigation(isAuthenticated, userData);
    return isAuthenticated;
}

function updateNavigation(isAuthenticated, userData) {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;

    userData = userData || getUserData();

    if (isAuthenticated && userData) {
        navAuth.innerHTML = `
            <div class="user-profile">
                <div class="user-info">
                    <div class="user-avatar" id="userAvatar">${userData.firstName?.charAt(0) || '👤'}</div>
                    <div class="user-details">
                        <div class="user-name" id="userName">${userData.firstName || ''} ${userData.lastName || ''}</div>
                        <div class="user-wallet">
                            <i class="fas fa-wallet"></i>
                            <span id="userWallet">${formatMoney(userData.wallet || 0)} BYN</span>
                        </div>
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
                                <div class="user-name-small">${userData.firstName || ''} ${userData.lastName || ''}</div>
                                <div class="user-email-small">${userData.email || ''}</div>
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

async function logout() {
    try {
        await apiClient(`${API_BASE_AUTH}/logout`, {
            method: 'POST'
        });
        removeUserData();
        updateNavigation(false);
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('show');
        setTimeout(() => {
            window.location.href = '/';
        }, 300);
    } catch (error) {
        console.error('Logout failed:', error);
        removeUserData();
        updateNavigation(false);
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

window.toggleTheme = toggleTheme;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.submitBooking = submitBooking;
window.goToBooking = goToBooking;
window.openRoomDetails = openRoomDetails;