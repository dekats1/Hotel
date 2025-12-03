// ==============================================
// CONFIGURATION AND INITIALIZATION
// ==============================================

const API_BASE_URL = '/api/rooms';
const API_BASE_AUTH = '/api/auth';
const ENDPOINTS = {
    getAllRooms: '/getAllRooms',
    availableRooms: '/available',
    roomById: (id) => `/${id}`
};

let allRooms = [];
let filteredRooms = [];
let currentTheme = localStorage.getItem('theme') || 'light';
let currentUser = null;

let selectedCheckIn = null;
let selectedCheckOut = null;

// Exchange rate (1 USD = 3.3 BYN)
const EXCHANGE_RATE = {
    BYN_TO_USD: 3.3,
    USD_TO_BYN: 1 / 3.3
};

document.addEventListener('DOMContentLoaded', async () => {
    initializeThemeToggle();

    if (window.i18n && window.i18n.initI18n) {
        await window.i18n.initI18n();
    }

    bindFilters();
    checkAuthStatus();
    await loadUserProfile();
    initializeDatePickers();
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

window.addEventListener('languageChanged', function() {
    updateNavigation();
    renderRooms();
});

// Listen for currency changes
window.addEventListener('storage', function(e) {
    if (e.key === 'currency' && currentUser) {
        updateNavigation();
    }
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
// DATE PICKER INITIALIZATION
// ==============================================

function initializeDatePickers() {
    const checkInFilter = document.getElementById('checkInFilter');
    const checkOutFilter = document.getElementById('checkOutFilter');

    if (!checkInFilter || !checkOutFilter) return;

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    checkInFilter.min = today;
    checkOutFilter.min = tomorrow;

    const savedCheckIn = sessionStorage.getItem('searchCheckIn');
    const savedCheckOut = sessionStorage.getItem('searchCheckOut');

    if (savedCheckIn) {
        checkInFilter.value = savedCheckIn;
        selectedCheckIn = savedCheckIn;
    }

    if (savedCheckOut) {
        checkOutFilter.value = savedCheckOut;
        selectedCheckOut = savedCheckOut;
    }

    checkInFilter.addEventListener('change', () => {
        selectedCheckIn = checkInFilter.value;

        if (selectedCheckIn) {
            const nextDay = new Date(selectedCheckIn);
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutFilter.min = nextDay.toISOString().split('T')[0];

            if (checkOutFilter.value && new Date(checkOutFilter.value) <= new Date(selectedCheckIn)) {
                checkOutFilter.value = nextDay.toISOString().split('T')[0];
                selectedCheckOut = checkOutFilter.value;
            }

            sessionStorage.setItem('searchCheckIn', selectedCheckIn);
        }

        applyFilters();
    });

    checkOutFilter.addEventListener('change', () => {
        selectedCheckOut = checkOutFilter.value;

        if (selectedCheckOut) {
            sessionStorage.setItem('searchCheckOut', selectedCheckOut);
        }

        applyFilters();
    });
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

async function loadUserProfile() {
    const userData = getUserData();
    if (userData) {
        currentUser = userData;
    }

    try {
        const response = await fetch('/api/users/profile', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = {
                id: data.id,
                name: `${data.firstName || ''} ${data.lastName || ''}`,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                wallet: data.balance ? Number(data.balance) : 0,
                avatar: data.avatarUrl || '👤'
            };

            const userBasicData = {
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                wallet: currentUser.wallet,
                avatar: currentUser.avatar
            };
            localStorage.setItem('user_data', JSON.stringify(userBasicData));
        } else if (response.status === 401) {
            // User is not authenticated, clear current user
            currentUser = null;
            localStorage.removeItem('user_data');
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
        // If error, keep current user data from localStorage if exists
        if (!currentUser) {
            currentUser = userData;
        }
    } finally {
        // Always update navigation after attempting to load profile
        updateNavigation();
    }
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
        const checkIn = document.getElementById('checkInFilter')?.value || selectedCheckIn;
        const checkOut = document.getElementById('checkOutFilter')?.value || selectedCheckOut;
        const type = document.getElementById('typeFilter')?.value;
        const guests = document.getElementById('capacityFilter')?.value;

        let data;

        if (checkIn && checkOut) {
            const params = new URLSearchParams();
            params.append('checkIn', checkIn);
            params.append('checkOut', checkOut);
            if (type) params.append('type', type);
            if (guests) params.append('guests', guests);

            console.log('Loading available rooms with params:', params.toString());
            data = await apiCall(`${ENDPOINTS.availableRooms}?${params.toString()}`);
        } else {
            console.log('Loading all rooms (no dates selected)');
            data = await apiCall(ENDPOINTS.getAllRooms);
        }

        console.log('Loaded rooms:', data?.length || 0);

        allRooms = Array.isArray(data) ? data.filter(r => r && r.isActive !== false) : [];
        filteredRooms = allRooms.slice();
        applyClientSideFilters();
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

    ['searchQuery', 'priceMin', 'priceMax', 'sortBy', 'fWifi', 'fTv', 'fMinibar', 'fBalcony', 'fSea']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', debounce(applyClientSideFilters, 50));
            if (el && el.tagName === 'INPUT' && el.type === 'text') {
                el.addEventListener('input', debounce(applyClientSideFilters, 150));
            }
        });

    ['typeFilter', 'capacityFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', debounce(applyFilters, 50));
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

    document.getElementById('checkInFilter').value = '';
    document.getElementById('checkOutFilter').value = '';
    selectedCheckIn = null;
    selectedCheckOut = null;
    sessionStorage.removeItem('searchCheckIn');
    sessionStorage.removeItem('searchCheckOut');
}

// Универсальная функция для работы с translations (Array или Map)
function getTranslation(room, lang = 'RU') {
    if (!room || !room.translations) {
        console.warn('No translations found for room:', room);
        return null;
    }

    // Если translations это массив (новый формат)
    if (Array.isArray(room.translations)) {
        const translation = room.translations.find(t => t.language === lang);
        if (translation) {
            return translation;
        }
        // Fallback: сначала EN, потом первый доступный
        return room.translations.find(t => t.language === 'EN') ||
            room.translations.find(t => t.language === 'RU') ||
            room.translations[0] ||
            null;
    }

    // Если translations это объект/Map (старый формат, для совместимости)
    if (typeof room.translations === 'object' && !Array.isArray(room.translations)) {
        return room.translations[lang] ||
            room.translations['EN'] ||
            room.translations['RU'] ||
            null;
    }

    return null;
}

function getRoomName(room) {
    // Получаем текущий язык из i18n (ru/en -> RU/EN)
    const currentLang = (window.i18n?.getLanguage() || 'ru').toUpperCase();

    const trans = getTranslation(room, currentLang);

    if (trans && trans.name) {
        return trans.name;
    }

    // Fallback на русский или английский
    const transRU = getTranslation(room, 'RU');
    const transEN = getTranslation(room, 'EN');
    return transRU?.name || transEN?.name || `Номер ${room.roomNumber || ''}`;
}

function getRoomDescription(room) {
    const currentLang = (window.i18n?.getLanguage() || 'ru').toUpperCase();
    const trans = getTranslation(room, currentLang);

    if (trans && trans.description) {
        return trans.description;
    }

    const transRU = getTranslation(room, 'RU');
    const transEN = getTranslation(room, 'EN');
    return transRU?.description || transEN?.description || '';
}


async function applyFilters() {
    await loadRooms();
}

function applyClientSideFilters() {
    const search = (document.getElementById('searchQuery').value || '').toLowerCase();
    const pMin = parseFloat(document.getElementById('priceMin').value);
    const pMax = parseFloat(document.getElementById('priceMax').value);
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
            return name.includes(search) || roomNumber.includes(search) || typeText.includes(search);
        });
    }

    if (!Number.isNaN(pMin)) list = list.filter(r => (toNum(r.basePrice)) >= pMin);
    if (!Number.isNaN(pMax)) list = list.filter(r => (toNum(r.basePrice)) <= pMax);

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

    const checkIn = document.getElementById('checkInFilter')?.value;
    const checkOut = document.getElementById('checkOutFilter')?.value;
    const datesSelected = checkIn && checkOut;

    const availableText = window.i18n?.t('catalog.available') || 'Доступно';
    const foundText = window.i18n?.t('catalog.found') || 'Найдено';
    count.textContent = datesSelected
        ? `${availableText}: ${filteredRooms.length}`
        : `${foundText}: ${filteredRooms.length}`;

    if (filteredRooms.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        const emptyText = datesSelected
            ? (window.i18n?.t('catalog.noRoomsForDates') || 'На выбранные даты нет доступных номеров. Попробуйте изменить даты или параметры поиска.')
            : (window.i18n?.t('catalog.tryFilters') || 'Номера не найдены. Попробуйте изменить параметры поиска.');
        empty.querySelector('p').textContent = emptyText;
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
        const capacity = r.capacity ? `${r.capacity} ${window.i18n?.t('catalog.guestsShort') || 'гост.'}` : '';
        const noPhotoText = window.i18n?.t('catalog.noPhoto') || 'Нет фото';
        const perNightText = window.i18n?.t('catalog.perNight') || 'BYN/ночь';
        const availableText = window.i18n?.t('catalog.available') || 'Доступен';
        const bookText = window.i18n?.t('catalog.book') || 'Бронировать';
        const detailsText = window.i18n?.t('catalog.details') || 'Подробнее';

        return `
        <article class="room-card">
            <div class="room-media">
                ${imgUrl ? `<img alt="${escapeHtml(name)}" src="${imgUrl}">` : `<div class="no-image">${noPhotoText}</div>`}
                <div class="badge-price">${price} ${perNightText}</div>
                ${datesSelected ? `<div class="badge-available">${availableText}</div>` : ''}
            </div>
            <div class="room-body">
                <div class="room-title">
                    <h3>${escapeHtml(name)}</h3>
                    <span class="room-type">${escapeHtml(typeText)}</span>
                </div>
                <div class="room-sub">${[area, capacity].filter(Boolean).join(' • ')}</div>
                <div class="room-features">
                    ${r.hasWifi !== false ? `<span><i class="fas fa-wifi"></i> ${window.i18n?.t('catalog.wifi') || 'Wi‑Fi'}</span>` : ''}
                    ${r.hasTv !== false ? `<span><i class="fas fa-tv"></i> ${window.i18n?.t('catalog.tv') || 'ТВ'}</span>` : ''}
                    ${r.hasMinibar ? `<span><i class="fas fa-wine-glass"></i> ${window.i18n?.t('catalog.minibar') || 'Минибар'}</span>` : ''}
                    ${r.hasBalcony ? `<span><i class="fas fa-door-open"></i> ${window.i18n?.t('catalog.balcony') || 'Балкон'}</span>` : ''}
                    ${r.hasSeaView ? `<span><i class="fas fa-water"></i> ${window.i18n?.t('catalog.seaView') || 'Вид на море'}</span>` : ''}
                </div>
                <div class="room-actions">
                    <button class="btn btn-secondary" onclick="goToBooking('${r.id}')"><i class="fas fa-calendar-check"></i> ${bookText}</button>
                    <button class="btn btn-primary" onclick="openRoomDetails('${r.id}')"><i class="fas fa-eye"></i> ${detailsText}</button>
                </div>
            </div>
        </article>`;
    }).join('');
}

function getRoomTypeText(type) {
    if (window.i18n) {
        return window.i18n.t(`roomTypes.${type}`) || type || '';
    }
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

    const checkIn = urlParams.get('checkIn');
    const checkOut = urlParams.get('checkOut');
    const guests = urlParams.get('guests');
    const roomType = urlParams.get('type');

    if (checkIn) {
        const checkInInput = document.getElementById('checkInFilter');
        if (checkInInput) checkInInput.value = checkIn;
        selectedCheckIn = checkIn;
        sessionStorage.setItem('searchCheckIn', checkIn);
    }

    if (checkOut) {
        const checkOutInput = document.getElementById('checkOutFilter');
        if (checkOutInput) checkOutInput.value = checkOut;
        selectedCheckOut = checkOut;
        sessionStorage.setItem('searchCheckOut', checkOut);
    }

    if (roomType) {
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) typeFilter.value = roomType;
    }

    if (guests) {
        const capacityFilter = document.getElementById('capacityFilter');
        if (capacityFilter) {
            capacityFilter.value = parseInt(guests) >= 5 ? '5' : guests;
        }
        sessionStorage.setItem('searchGuests', guests);
    }
}

// ==============================================
// Room Detail Functions
// ==============================================

function goToBooking(roomId) {
    closeRoomModal();
    openBookingModal(roomId);
}

async function openRoomDetails(roomId) {
    showLoading(true);
    try {
        const room = allRooms.find(r => r.id === roomId);
        if (!room) throw new Error(window.i18n?.t('errors.roomNotFound') || 'Комната не найдена');

        fillRoomModal(room);
        document.getElementById('roomModal').classList.add('show');
    } catch (e) {
        console.error('Error opening room details:', e);
        notify((window.i18n?.t('errors.roomDetailsError') || 'Не удалось открыть детали комнаты') + ': ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

function closeRoomModal() {
    const modal = document.getElementById('roomModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function fillRoomModal(room) {
    const currentLang = (window.i18n?.getLanguage() || 'ru').toUpperCase();

    const name = getRoomName(room);
    const desc = getRoomDescription(room);

    document.getElementById('modalTitle').textContent = window.i18n?.t('catalog.roomInfo') || 'Информация о номере';
    document.getElementById('roomName').textContent = name;
    document.getElementById('roomDescription').textContent = desc;
    document.getElementById('roomCapacity').textContent = room.capacity ?? '';
    document.getElementById('roomArea').textContent = room.areaSqm ?? '';

    const priceLabel = document.getElementById('galleryPrice');
    const perNightText = window.i18n?.t('catalog.perNight') || 'BYN/ночь';
    priceLabel.textContent = `${formatMoney(room.basePrice)} ${perNightText}`;

    displayRoomRating(room);

    const ul = document.getElementById('roomAmenities');
    const items = [];
    if (room.hasWifi !== false) items.push(`<li><i class="fas fa-wifi"></i> ${window.i18n?.t('catalog.wifi') || 'Wi‑Fi'}</li>`);
    if (room.hasTv !== false) items.push(`<li><i class="fas fa-tv"></i> ${window.i18n?.t('catalog.tv') || 'ТВ'}</li>`);
    if (room.hasMinibar) items.push(`<li><i class="fas fa-wine-glass"></i> ${window.i18n?.t('catalog.minibar') || 'Минибар'}</li>`);
    if (room.hasBalcony) items.push(`<li><i class="fas fa-door-open"></i> ${window.i18n?.t('catalog.balcony') || 'Балкон'}</li>`);
    if (room.hasSeaView) items.push(`<li><i class="fas fa-water"></i> ${window.i18n?.t('catalog.seaView') || 'Вид на море'}</li>`);
    ul.innerHTML = items.join('');

    const photos = (room.photos || []).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const main = photos.find(p => p.isPrimary) || photos[0] || null;
    const mainImg = document.getElementById('galleryMain');
    mainImg.src = main ? (main.url || main.thumbnailUrl) : '';

    const thumbs = document.getElementById('galleryThumbs');
    thumbs.innerHTML = photos.map((p, idx) =>
        `<img data-idx="${idx}" class="${p === main ? 'active' : ''}" src="${p.thumbnailUrl || p.url}" alt="Фото">`
    ).join('');

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


function displayRoomRating(room) {
    const ratingContainer = document.getElementById('roomRating');
    if (!ratingContainer) return;

    const rating = room.averageRating || room.stars || 0;
    const reviewCount = room.reviewCount || 0;

    if (rating > 0) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }

        const reviewText = reviewCount === 1
            ? (window.i18n?.t('catalog.review') || 'отзыв')
            : reviewCount < 5
                ? (window.i18n?.t('catalog.reviews2') || 'отзыва')
                : (window.i18n?.t('catalog.reviews') || 'отзывов');
        ratingContainer.innerHTML = `
            <div class="rating-stars">${starsHtml}</div>
            <div class="rating-value">${rating.toFixed(1)}</div>
            <div class="rating-count">(${reviewCount} ${reviewText})</div>
        `;
    } else {
        ratingContainer.innerHTML = `
            <div class="rating-stars">
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
            </div>
            <div class="rating-count">${window.i18n?.t('catalog.noReviews') || 'Пока нет отзывов'}</div>
        `;
    }
}

// ==============================================
// BOOKING MODAL
// ==============================================

function openBookingModal(roomId) {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) {
        notify(window.i18n?.t('errors.roomNotFound') || 'Комната не найдена', 'error');
        return;
    }

    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.dataset.roomId = roomId;
    modal.dataset.pricePerNight = room.basePrice;

    const name = getRoomName(room);
    document.getElementById('bookingRoomName').textContent = name;
    
    // Set initial currency from localStorage or default to BYN
    const savedCurrency = localStorage.getItem('currency') || 'BYN';
    const currencies = {
        'BYN': 'Br',
        'USD': '$',
    };
    const symbol = currencies[savedCurrency] || 'Br';
    const convertedPrice = convertCurrency(room.basePrice, 'BYN', savedCurrency);
    document.getElementById('bookingRoomPrice').textContent = `${formatMoney(convertedPrice)} ${symbol}/ночь`;

    const savedCheckIn = selectedCheckIn || sessionStorage.getItem('searchCheckIn');
    const savedCheckOut = selectedCheckOut || sessionStorage.getItem('searchCheckOut');
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

    document.getElementById('currency').value = savedCurrency;
    document.getElementById('specialRequests').value = '';

    calculateTotalPrice();
    
    // Add listener for currency change
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.removeEventListener('change', calculateTotalPrice);
        currencySelect.addEventListener('change', calculateTotalPrice);
    }
    
    modal.classList.add('show');
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('show');
}

function calculateTotalPrice() {
    const modal = document.getElementById('bookingModal');
    const pricePerNight = parseFloat(modal.dataset.pricePerNight || 0);

    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;
    const currencySelect = document.getElementById('currency');
    const selectedCurrency = currencySelect ? currencySelect.value : 'BYN';

    if (!checkInDate || !checkOutDate) {
        document.getElementById('totalNights').textContent = '0';
        document.getElementById('totalPrice').textContent = formatCurrency(0, selectedCurrency);
        return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.max(0, Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const totalPrice = nights * pricePerNight;

    document.getElementById('totalNights').textContent = nights;
    document.getElementById('totalPrice').textContent = formatCurrency(totalPrice, selectedCurrency);
    
    // Update price per night display
    const bookingRoomPrice = document.getElementById('bookingRoomPrice');
    if (bookingRoomPrice) {
        const currencies = {
            'BYN': 'Br',
            'USD': '$',
        };
        const symbol = currencies[selectedCurrency] || 'Br';
        const convertedPrice = convertCurrency(pricePerNight, 'BYN', selectedCurrency);
        const perNightText = window.i18n?.t('catalog.perNight') || 'BYN/ночь';
        bookingRoomPrice.textContent = `${formatMoney(convertedPrice)} ${symbol}/ночь`;
    }
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

    if (!checkInDate || !checkOutDate) {
        notify(window.i18n?.t('errors.selectDates') || 'Выберите даты заезда и выезда', 'warning');
        return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
        notify(window.i18n?.t('errors.checkoutAfterCheckin') || 'Дата выезда должна быть позже даты заезда', 'warning');
        return;
    }

    if (!guestsCount || guestsCount < 1) {
        notify(window.i18n?.t('errors.specifyGuests') || 'Укажите количество гостей', 'warning');
        return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * pricePerNight;

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
        const response = await fetch('/api/booking/addBooking', {
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

            if (response.status === 409) {
                notify(errorData.message || (window.i18n?.t('errors.roomAlreadyBooked') || 'Номер уже забронирован на выбранные даты'), 'error');
                closeBookingModal();
                await applyFilters();
                return;
            }

            throw new Error(errorData.message || `${window.i18n?.t('errors.error') || 'Ошибка'}: ${response.status}`);
        }

        const result = await response.json();
        console.log('Booking created:', result);

        notify(window.i18n?.t('catalog.bookingSuccess') || 'Бронирование успешно создано!', 'success');
        closeBookingModal();

        setTimeout(() => {
            console.log('Redirecting to mybookings...');
            window.location.href = '/booking';
        }, 1500);

    } catch (error) {
        console.error('=== BOOKING ERROR ===');
        console.error('Error:', error.message);

        if (error.message.includes('401') || error.message.includes('403')) {
            notify(window.i18n?.t('errors.loginRequired') || 'Для бронирования необходимо войти в систему', 'warning');
        } else if (error.message.includes('Недостаточно средств') || error.message.includes('Insufficient funds')) {
            notify(window.i18n?.t('errors.insufficientFunds') || 'Недостаточно средств на балансе. Пополните кошелек.', 'error');
        } else if (!error.message.includes('уже забронирован') && !error.message.includes('already booked')) {
            notify((window.i18n?.t('errors.bookingError') || 'Ошибка при создании бронирования') + ': ' + error.message, 'error');
        }
    } finally {
        console.log('=== SUBMIT BOOKING FINISHED ===');
        showLoading(false);
    }
}

function setupBookingModalListeners() {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        bookingModal.addEventListener('click', (e) => {
            if (e.target === bookingModal) closeBookingModal();
        });
    }

    const roomModal = document.getElementById('roomModal');
    if (roomModal) {
        roomModal.addEventListener('click', (e) => {
            if (e.target === roomModal) closeRoomModal();
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
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include',
        ...options,
    };

    const response = await fetch(url, config);
    if (response.status === 401) {
        removeUserData();
        updateNavigation();
    }
    return response;
}

function checkAuthStatus() {
    const userData = getUserData();
    // Don't update navigation here - it will be updated after loadUserProfile()
    return !!userData;
}

function updateNavigation() {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;

    const userData = currentUser || getUserData();

    if (userData) {
        const walletAmount = formatCurrency(userData.wallet || 0);
        navAuth.innerHTML = `
            <div class="user-profile">
                <div class="user-info">
                    <div class="user-avatar" id="userAvatar">${userData.firstName?.charAt(0) || '👤'}</div>
                    <div class="user-details">
                        <div class="user-name" id="userName">${userData.firstName || ''} ${userData.lastName || ''}</div>
                        <div class="user-wallet">
                            <i class="fas fa-wallet"></i>
                            <span id="userWallet">${walletAmount}</span>
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
                        <a href="/profile" class="dropdown-item" data-i18n-ignore>
                            <i class="fas fa-user"></i>
                            <span data-i18n="common.profile">Мой профиль</span>
                        </a>
                        <a href="/booking" class="dropdown-item" data-i18n-ignore>
                            <i class="fas fa-calendar"></i>
                            <span data-i18n="common.bookings">Мои бронирования</span>
                        </a>
                        <a href="/wallet" class="dropdown-item" data-i18n-ignore>
                            <i class="fas fa-wallet"></i>
                            <span data-i18n="common.wallet">Кошелек</span>
                        </a>
                        <a href="/setting" class="dropdown-item" data-i18n-ignore>
                            <i class="fas fa-cog"></i>
                            <span data-i18n="common.settings">Настройки</span>
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-item" onclick="logout()" data-i18n-ignore>
                            <i class="fas fa-sign-out-alt"></i>
                            <span data-i18n="common.logout">Выйти</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="/login" class="btn-auth btn-login" data-i18n-ignore>
                <i class="fas fa-sign-in-alt"></i>
                <span data-i18n="common.login">Войти</span>
            </a>
            <a href="/register" class="btn-auth btn-register" data-i18n-ignore>
                <i class="fas fa-user-plus"></i>
                <span data-i18n="common.register">Регистрация</span>
            </a>
        `;
    }

    if (window.i18n && window.i18n.applyTranslations) {
        setTimeout(() => {
            window.i18n.applyTranslations();
        }, 50);
    }
}

async function logout() {
    try {
        await apiClient(`${API_BASE_AUTH}/logout`, { method: 'POST' });
        removeUserData();
        updateNavigation();
        notify(window.i18n?.t('auth.logoutSuccess') || 'Вы успешно вышли из системы', 'success');
        setTimeout(() => { window.location.href = '/'; }, 300);
    } catch (error) {
        removeUserData();
        updateNavigation();
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

window.toggleTheme = toggleTheme;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.submitBooking = submitBooking;
window.goToBooking = goToBooking;
window.openRoomDetails = openRoomDetails;
window.closeRoomModal = closeRoomModal;
window.closeBookingModal = closeBookingModal;

console.log('Catalog Room script loaded successfully');
