// ==============================================
// WALLET.JS - Управление кошельком с интеграцией API
// ==============================================

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');

const API_BASE_URL = '/api';
const USER_DATA_KEY = 'user_data';

let currentUser = null;
let transactions = [];
let currentPage = 0;
const TRANSACTIONS_PER_PAGE = 20;

// ==============================================
// STORAGE FUNCTIONS
// ==============================================

function getUserDataFromStorage() {
    try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data from storage:', error);
        return null;
    }
}

function saveUserDataToStorage(userData) {
    try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data to storage:', error);
    }
}

function removeAuthData() {
    localStorage.removeItem(USER_DATA_KEY);
}

// ==============================================
// API FUNCTIONS
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
        removeAuthData();
        showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
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

// ==============================================
// WALLET API
// ==============================================

async function loadWalletBalance() {
    try {
        const data = await apiCall('/wallet/balance');
        return data.balance;
    } catch (error) {
        console.error('Failed to load wallet balance:', error);
        showNotification('Ошибка загрузки баланса: ' + error.message, 'error');
        return 0;
    }
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
        saveUserDataToStorage(userBasicData);

        updateUserInterface();
    } catch (error) {
        console.error('Failed to load user profile:', error);
        if (!error.message.includes('Требуется авторизация')) {
            showNotification('Ошибка загрузки профиля: ' + error.message, 'error');
        }
    }
}

async function loadTransactions(page = 0, size = TRANSACTIONS_PER_PAGE) {
    try {
        const data = await apiCall(`/wallet/transactions?page=${page}&size=${size}`);
        transactions = data;
        displayTransactions(transactions);
        currentPage = page;
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showNotification('Ошибка загрузки транзакций: ' + error.message, 'error');
    }
}

async function depositFunds(depositRequest) {
    try {
        const data = await apiCall('/wallet/deposit', {
            method: 'POST',
            body: JSON.stringify(depositRequest)
        });

        showNotification(`Пополнение на ${formatMoney(depositRequest.amount)} выполнено успешно!`, 'success');

        // Обновляем баланс и транзакции
        await loadUserProfile();
        await loadTransactions();

        return data;
    } catch (error) {
        console.error('Failed to deposit funds:', error);
        showNotification('Ошибка пополнения: ' + error.message, 'error');
        throw error;
    }
}

async function withdrawFunds(withdrawRequest) {
    try {
        const data = await apiCall('/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify(withdrawRequest)
        });

        showNotification(`Заявка на вывод ${formatMoney(withdrawRequest.amount)} отправлена!`, 'success');

        // Обновляем баланс и транзакции
        await loadUserProfile();
        await loadTransactions();

        return data;
    } catch (error) {
        console.error('Failed to withdraw funds:', error);
        showNotification('Ошибка вывода средств: ' + error.message, 'error');
        throw error;
    }
}

// ==============================================
// INITIALIZE
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Wallet page loaded');

    checkAuthOnPageLoad();
    initializeWallet();
    loadUserProfile();
    loadTransactions();
    setupEventListeners();
    initializeTheme();

    console.log('✅ Wallet initialized successfully');
});

function checkAuthOnPageLoad() {
    const userData = getUserDataFromStorage();

    if (!userData || !userData.email) {
        console.warn('No user data found, redirecting to login...');
        removeAuthData();
        window.location.href = '/login';
        return false;
    }

    return true;
}

function initializeWallet() {
    // Mobile navigation
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Setup components
    setupAmountButtons();
    setupPaymentOptions();
}

// ==============================================
// UI UPDATE FUNCTIONS
// ==============================================

function updateUserInterface() {
    if (!currentUser) return;

    updateNavigationForLoggedInUser(currentUser);
    updateWalletBalances();
    updateMonthlyStats();
}

function updateWalletBalances() {
    if (!currentUser) return;

    const mainBalance = document.getElementById('mainBalance');
    const userWallet = document.getElementById('userWallet');
    const availableBalance = document.getElementById('availableBalance');

    const balanceText = formatMoney(currentUser.wallet) + '₽';

    if (mainBalance) mainBalance.textContent = balanceText;
    if (userWallet) userWallet.textContent = balanceText;
    if (availableBalance) availableBalance.textContent = balanceText;
}

function updateMonthlyStats() {
    const monthlySpent = calculateMonthlySpent();
    const monthlySpentElement = document.getElementById('monthlySpent');
    if (monthlySpentElement) {
        monthlySpentElement.textContent = '-' + formatMoney(monthlySpent) + '₽';
    }
}

function calculateMonthlySpent() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
        .filter(transaction => {
            const transactionDate = new Date(transaction.createdAt);
            return transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear &&
                (transaction.type === 'PAYMENT' || transaction.type === 'WITHDRAWAL');
        })
        .reduce((total, transaction) => total + Number(transaction.amount), 0);
}

function updateNavigationForLoggedInUser(user) {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;

    navAuth.innerHTML = `
        <div class="user-profile">
            <div class="user-info">
                <div class="user-avatar" id="userAvatar">${user.avatar || '👤'}</div>
                <div class="user-details">
                    <div class="user-name" id="userName">${user.name || 'Пользователь'}</div>
                    <div class="user-wallet">
                        <i class="fas fa-wallet"></i>
                        <span id="navWalletAmount">${formatMoney(user.wallet)}₽</span>
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
                            <div class="user-name-small">${user.name || 'Пользователь'}</div>
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
                    <a href="/wallet" class="dropdown-item active">
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

// ==============================================
// TRANSACTION DISPLAY
// ==============================================

function displayTransactions(transactionsToShow) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;

    if (transactionsToShow.length === 0) {
        transactionsList.innerHTML = `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-title">Нет транзакций</div>
                    <div class="transaction-description">Транзакции появятся здесь после операций с кошельком</div>
                </div>
            </div>
        `;
        return;
    }

    transactionsList.innerHTML = transactionsToShow
        .map(transaction => {
            const icon = getTransactionIcon(transaction.type);
            const typeClass = getTransactionTypeClass(transaction.type);
            const isPositive = transaction.type === 'DEPOSIT' || transaction.type === 'REFUND';

            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${typeClass}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${getTransactionTitle(transaction.type)}</div>
                        <div class="transaction-description">${transaction.description || 'Без описания'}</div>
                        <div class="transaction-status">
                            <span class="badge badge-${transaction.status.toLowerCase()}">${getStatusText(transaction.status)}</span>
                        </div>
                    </div>
                    <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : '-'}${formatMoney(transaction.amount)}₽
                    </div>
                    <div class="transaction-date">
                        ${formatDate(transaction.createdAt)}
                    </div>
                </div>
            `;
        }).join('');
}

function getTransactionIcon(type) {
    const icons = {
        DEPOSIT: 'fas fa-plus',
        WITHDRAWAL: 'fas fa-minus',
        PAYMENT: 'fas fa-bed',
        REFUND: 'fas fa-undo'
    };
    return icons[type] || 'fas fa-exchange-alt';
}

function getTransactionTypeClass(type) {
    return (type === 'DEPOSIT' || type === 'REFUND') ? 'income' : 'expense';
}

function getTransactionTitle(type) {
    const titles = {
        DEPOSIT: 'Пополнение счета',
        WITHDRAWAL: 'Вывод средств',
        PAYMENT: 'Оплата бронирования',
        REFUND: 'Возврат средств'
    };
    return titles[type] || 'Транзакция';
}

function getStatusText(status) {
    const statuses = {
        PENDING: 'Ожидает',
        COMPLETED: 'Завершена',
        FAILED: 'Ошибка',
        CANCELLED: 'Отменена'
    };
    return statuses[status] || status;
}

// ==============================================
// FILTER FUNCTIONS
// ==============================================

function filterTransactions(filter) {
    const filterTabs = document.querySelectorAll('.filter-tab');

    let transactionsToShow = transactions;

    if (filter === 'income') {
        transactionsToShow = transactions.filter(t => t.type === 'DEPOSIT' || t.type === 'REFUND');
    } else if (filter === 'expense') {
        transactionsToShow = transactions.filter(t => t.type === 'PAYMENT' || t.type === 'WITHDRAWAL');
    }

    // Update active tab
    filterTabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-filter="${filter}"]`);
    if (activeTab) activeTab.classList.add('active');

    displayTransactions(transactionsToShow);
}

async function loadMoreTransactions() {
    currentPage++;
    await loadTransactions(currentPage);
}

// ==============================================
// MODAL FUNCTIONS
// ==============================================

function openTopUpModal() {
    const modal = document.getElementById('topUpModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeTopUpModal() {
    const modal = document.getElementById('topUpModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        resetTopUpForm();
    }
}

function resetTopUpForm() {
    const form = document.getElementById('topUpForm');
    if (form) {
        form.reset();
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    }
}

function openWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        const form = document.getElementById('withdrawForm');
        if (form) form.reset();
    }
}

function openHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        displayHistoryTransactions();
    }
}

function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function displayHistoryTransactions() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    displayTransactions(transactions);
}

// ==============================================
// FORM HANDLERS
// ==============================================

async function handleTopUpForm(e) {
    e.preventDefault();

    const selectedAmount = document.querySelector('.amount-btn.selected');
    const customAmount = document.getElementById('customAmount')?.value;
    const selectedPayment = document.querySelector('.payment-option.selected');

    let amount = 0;
    if (selectedAmount) {
        amount = parseInt(selectedAmount.getAttribute('data-amount'));
    } else if (customAmount) {
        amount = parseInt(customAmount);
    }

    if (amount < 100) {
        showNotification('Минимальная сумма пополнения: 100₽', 'error');
        return;
    }

    if (!selectedPayment) {
        showNotification('Выберите способ оплаты', 'error');
        return;
    }

    const paymentMethod = selectedPayment.getAttribute('data-option').toUpperCase();

    const depositRequest = {
        amount: amount,
        currency: 'BYN',
        paymentMethod: paymentMethod,
        description: `Пополнение через ${selectedPayment.querySelector('h4')?.textContent}`
    };

    try {
        await depositFunds(depositRequest);
        closeTopUpModal();
    } catch (error) {
        // Ошибка уже обработана в depositFunds
    }
}

async function handleWithdrawForm(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('withdrawAmount'));
    const withdrawMethod = formData.get('withdrawCard') || 'BANK_CARD';
    const withdrawDetails = formData.get('cardNumber') || formData.get('withdrawCard');

    if (!amount || amount < 10) {
        showNotification('Минимальная сумма вывода: 10₽', 'error');
        return;
    }

    if (!withdrawDetails) {
        showNotification('Укажите реквизиты для вывода', 'error');
        return;
    }

    const withdrawRequest = {
        amount: amount,
        currency: 'BYN',
        withdrawalMethod: withdrawMethod,
        withdrawalDetails: withdrawDetails,
        description: 'Вывод средств на карту'
    };

    try {
        await withdrawFunds(withdrawRequest);
        closeWithdrawModal();
    } catch (error) {
        // Ошибка уже обработана в withdrawFunds
    }
}

// ==============================================
// SETUP FUNCTIONS
// ==============================================

function setupAmountButtons() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');

    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');

            if (customAmountInput) {
                customAmountInput.value = '';
            }
        });
    });

    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            amountButtons.forEach(btn => btn.classList.remove('selected'));
        });
    }
}

function setupPaymentOptions() {
    const paymentOptions = document.getElementById('paymentOptions');
    if (!paymentOptions) return;

    const options = [
        {
            id: 'card',
            name: 'Банковская карта',
            description: 'Visa, Mastercard, МИР',
            icon: 'fas fa-credit-card'
        },
        {
            id: 'bank',
            name: 'Банковский перевод',
            description: 'Сбербанк, ВТБ, Альфа-Банк',
            icon: 'fas fa-university'
        },
        {
            id: 'wallet',
            name: 'Электронный кошелек',
            description: 'ЮMoney, QIWI, WebMoney',
            icon: 'fas fa-wallet'
        }
    ];

    paymentOptions.innerHTML = options.map(option => `
        <div class="payment-option" data-option="${option.id}">
            <div class="payment-option-icon">
                <i class="${option.icon}"></i>
            </div>
            <div class="payment-option-details">
                <h4>${option.name}</h4>
                <p>${option.description}</p>
            </div>
        </div>
    `).join('');

    const paymentOptionElements = document.querySelectorAll('.payment-option');
    paymentOptionElements.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptionElements.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// ==============================================
// NAVIGATION
// ==============================================

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// ==============================================
// LOGOUT
// ==============================================

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        showNotification('Вы вышли из системы', 'info');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeAuthData();
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

// ==============================================
// THEME MANAGEMENT
// ==============================================

function initializeTheme() {
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

// ==============================================
// HEADER SCROLL EFFECT
// ==============================================

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

// ==============================================
// EVENT LISTENERS
// ==============================================

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
            closeTopUpModal();
            closeWithdrawModal();
            closeHistoryModal();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTopUpModal();
            closeWithdrawModal();
            closeHistoryModal();
        }
    });

    // Form submissions
    const topUpForm = document.getElementById('topUpForm');
    if (topUpForm) {
        topUpForm.addEventListener('submit', handleTopUpForm);
    }

    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', handleWithdrawForm);
    }
}

// ==============================================
// UTILITIES
// ==============================================

function formatMoney(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==============================================
// NOTIFICATION SYSTEM
// ==============================================

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

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '400px'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add notification styles
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
        
        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-pending {
            background: #fbbf24;
            color: #78350f;
        }
        
        .badge-completed {
            background: #10b981;
            color: white;
        }
        
        .badge-failed {
            background: #ef4444;
            color: white;
        }
        
        .badge-cancelled {
            background: #6b7280;
            color: white;
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
}

console.log('Wallet script initialized successfully');
