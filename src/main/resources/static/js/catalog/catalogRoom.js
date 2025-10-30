// Catalog Rooms - Public listing with filters, sorting and details modal

const API_BASE_URL = '/api';
const ENDPOINTS = {
    rooms: '/rooms', // GET list of rooms for public catalog
    roomById: (id) => `/rooms/${id}` // GET single room with full details
};

let allRooms = [];
let filteredRooms = [];
let currentTheme = localStorage.getItem('theme') || 'light';

document.addEventListener('DOMContentLoaded', async () => {
    initializeThemeToggle();
    bindFilters();
    await loadRooms();
});

function initializeThemeToggle() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        const i = document.getElementById('themeIcon');
        if (i) i.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });
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
        // Try public endpoint first
        let data;
        try {
            data = await apiCall(ENDPOINTS.rooms);
        } catch (e) {
            // Fallback (if backend exposes only admin list for now and user is logged as admin)
            data = await apiCall('/admin' + ENDPOINTS.rooms);
        }
        allRooms = Array.isArray(data) ? data.filter(normalizeRoom) : [];
        filteredRooms = allRooms.slice();
        renderRooms();
    } catch (err) {
        notify(err.message, 'error');
    } finally {
        showLoading(false);
    }
}

function normalizeRoom(room) {
    // keep only rooms available to show
    return room && room.isActive !== false;
}

function bindFilters() {
    const form = document.getElementById('filtersForm');
    const reset = document.getElementById('btnReset');
    form.addEventListener('submit', (e) => { e.preventDefault(); applyFilters(); });
    reset.addEventListener('click', () => { resetFilters(); applyFilters(); });

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
        list = list.filter(r =>
            ((r.translations?.RU?.name || r.translations?.EN?.name || '').toLowerCase().includes(search)) ||
            ((r.roomNumber || '').toLowerCase().includes(search)) ||
            ((getRoomTypeText(r.type) || '').toLowerCase().includes(search))
        );
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
        case 'RATING_DESC': list.sort((a, b) => (toNum(b.rating) - toNum(a.rating))); break;
        default: break;
    }

    filteredRooms = list;
    renderRooms();
}

function renderRooms() {
    const grid = document.getElementById('roomsGrid');
    const count = document.getElementById('roomsCount');
    const empty = document.getElementById('emptyState');
    count.textContent = `Найдено: ${filteredRooms.length}`;

    if (filteredRooms.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    grid.innerHTML = filteredRooms.map(r => {
        const price = formatMoney(r.basePrice);
        const name = r.translations?.RU?.name || r.translations?.EN?.name || `Номер ${escapeHtml(r.roomNumber || '')}`;
        const mainPhoto = (r.photos || []).find(p => p.isPrimary) || (r.photos || [])[0];
        const imgUrl = mainPhoto ? (mainPhoto.thumbnailUrl || mainPhoto.url) : '';
        const typeText = getRoomTypeText(r.type);
        const area = r.areaSqm ? `${r.areaSqm} м²` : '';
        const capacity = r.capacity ? `${r.capacity} гост.` : '';
        return `
        <article class="room-card">
            <div class="room-media">
                ${imgUrl ? `<img alt="${escapeHtml(name)}" src="${imgUrl}">` : ''}
                <div class="badge-price">${price} ₽/ночь</div>
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

function goToBooking(roomId) {
    window.location.href = `/menu/booking.html?roomId=${encodeURIComponent(roomId)}`;
}

async function openRoomDetails(roomId) {
    showLoading(true);
    try {
        let data;
        try {
            data = await apiCall(ENDPOINTS.roomById(roomId));
        } catch {
            data = await apiCall('/admin' + ENDPOINTS.roomById(roomId));
        }
        fillRoomModal(data);
        document.getElementById('roomModal').classList.add('show');
    } catch (e) {
        notify(e.message, 'error');
    } finally {
        showLoading(false);
    }
}

function fillRoomModal(room) {
    const name = room.translations?.RU?.name || room.translations?.EN?.name || `Номер ${room.roomNumber || ''}`;
    const desc = room.translations?.RU?.description || room.translations?.EN?.description || '';
    document.getElementById('modalTitle').textContent = 'Информация о номере';
    document.getElementById('roomName').textContent = name;
    document.getElementById('roomDescription').textContent = desc;
    document.getElementById('roomCapacity').textContent = room.capacity ?? '';
    document.getElementById('roomArea').textContent = room.areaSqm ?? '';
    const priceLabel = document.getElementById('galleryPrice');
    priceLabel.textContent = `${formatMoney(room.basePrice)} ₽/ночь`;

    // amenities
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
    btnBook.onclick = () => goToBooking(room.id);
}

// utils
function getRoomTypeText(type) {
    const map = { STANDARD: 'Стандарт', DELUXE: 'Делюкс', SUITE: 'Люкс', APARTMENT: 'Апартаменты', PENTHOUSE: 'Пентхаус' };
    return map[type] || type || '';
}
function escapeHtml(s) {
    return String(s).replace(/[&<>"'`=\/]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#x60;', '=': '&#x3D;', '/': '&#x2F;' }[c]));
}
function toNum(v) { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isNaN(n) ? 0 : n; }
function formatMoney(v) { const n = toNum(v); return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function debounce(fn, t) { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn.apply(null, a), t); }; }

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function notify(message, type = 'info') {
    // simple lightweight notification (reuses style from admin if present)
    const exist = document.querySelectorAll('.notification');
    exist.forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.style.cssText = `position:fixed;top:20px;right:20px;background:${type==='success'?'#10b981':type==='error'?'#ef4444':type==='warning'?'#f59e0b':'#3b82f6'};color:#fff;padding:1rem 1.25rem;border-radius:12px;box-shadow:var(--shadow-lg);z-index:10000`;
    n.innerHTML = `<div class="notification-content"><i class="fas fa-info-circle"></i><span>${message}</span><button class="notification-close" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-times"></i></button></div>`;
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentElement) n.remove(); }, 4000);
}


