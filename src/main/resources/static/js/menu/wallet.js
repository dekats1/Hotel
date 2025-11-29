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

// Exchange rate (1 USD = 3.3 BYN)
const EXCHANGE_RATE = {
    BYN_TO_USD: 3.3,
    USD_TO_BYN: 1 / 3.3
};

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
        showNotification(window.i18n?.t('errors.sessionExpired') || 'Сессия истекла. Пожалуйста, войдите снова.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
        throw new Error(window.i18n?.t('errors.authRequired') || 'Требуется авторизация');
    }

    if (response.status === 403) {
        showNotification(window.i18n?.t('errors.accessDenied') || 'Доступ запрещен', 'error');
        throw new Error(window.i18n?.t('errors.accessDenied') || 'Доступ запрещен');
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

async function loadWalletBalance() {
    try {
        const data = await apiCall('/wallet/balance');
        return data.balance;
    } catch (error) {
        console.error('Failed to load wallet balance:', error);
        showNotification((window.i18n?.t('errors.balanceLoadError') || 'Ошибка загрузки баланса') + ': ' + error.message, 'error');
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
        if (!error.message.includes('Требуется авторизация') && !error.message.includes('Authorization')) {
            showNotification((window.i18n?.t('errors.profileLoadError') || 'Ошибка загрузки профиля') + ': ' + error.message, 'error');
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
        showNotification((window.i18n?.t('errors.transactionsLoadError') || 'Ошибка загрузки транзакций') + ': ' + error.message, 'error');
    }
}

async function depositFunds(depositRequest) {
    try {
        const data = await apiCall('/wallet/deposit', {
            method: 'POST',
            body: JSON.stringify(depositRequest)
        });

        showNotification((window.i18n?.t('wallet.depositSuccess') || 'Пополнение на') + ` ${formatMoney(depositRequest.amount)} ${window.i18n?.t('wallet.completed') || 'выполнено успешно!'}`, 'success');

        // Обновляем баланс и транзакции
        await loadUserProfile();
        await loadTransactions();

        return data;
    } catch (error) {
        console.error('Failed to deposit funds:', error);
        showNotification((window.i18n?.t('errors.depositError') || 'Ошибка пополнения') + ': ' + error.message, 'error');
        throw error;
    }
}

async function withdrawFunds(withdrawRequest) {
    try {
        const data = await apiCall('/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify(withdrawRequest)
        });

        showNotification((window.i18n?.t('wallet.withdrawSuccess') || 'Вывод') + ` ${formatMoney(withdrawRequest.amount)} ${window.i18n?.t('wallet.completed') || 'выполнен успешно!'}`, 'success');

        // Обновляем баланс и транзакции
        await loadUserProfile();
        await loadTransactions();

        return data;
    } catch (error) {
        console.error('Failed to withdraw funds:', error);
        showNotification((window.i18n?.t('errors.withdrawError') || 'Ошибка вывода средств') + ': ' + error.message, 'error');
        throw error;
    }
}

// Listen for language changes
window.addEventListener('languageChanged', function() {
    if (typeof updateNavigation === 'function') {
        updateNavigation();
    }
    // Re-display transactions with new translations
    if (typeof displayTransactions === 'function' && typeof transactions !== 'undefined') {
        displayTransactions(transactions);
    }
    if (typeof displayHistoryTransactions === 'function') {
        displayHistoryTransactions();
    }
    // Re-apply translations to all elements
    if (window.i18n && window.i18n.applyTranslations) {
        window.i18n.applyTranslations();
    }
});

document.addEventListener('DOMContentLoaded', function() {

    checkAuthOnPageLoad();
    initializeWallet();
    loadUserProfile();
    loadTransactions();
    setupEventListeners();
    initializeTheme();

    // Listen for currency changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'currency' && currentUser) {
            updateWalletBalances();
            updateMonthlyStats();
            displayTransactions(transactions);
        }
    });

    window.addEventListener('languageChanged', function() {
        if (typeof updateNavigation === 'function') {
            updateNavigation();
        }
        // Re-display transactions with new translations
        if (typeof displayTransactions === 'function' && typeof transactions !== 'undefined') {
            displayTransactions(transactions);
        }
        if (typeof displayHistoryTransactions === 'function') {
            displayHistoryTransactions();
        }
        if (typeof updatePaymentOptions === 'function') {
            updatePaymentOptions();
        }
        if (window.i18n && window.i18n.applyTranslations) {
            window.i18n.applyTranslations();
        }
    });

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
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Setup components
    setupAmountButtons();
    setupPaymentOptions();
    setupCardValidation();
}

function updateUserInterface() {
    if (!currentUser) return;

    updateNavigationForLoggedInUser(currentUser);
    updateWalletBalances();
    updateMonthlyStats();
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

function updateWalletBalances() {
    if (!currentUser) return;

    const mainBalance = document.getElementById('mainBalance');
    const userWallet = document.getElementById('userWallet');
    const availableBalance = document.getElementById('availableBalance');
    const navWalletAmount = document.getElementById('navWalletAmount');

    const balanceText = formatCurrency(currentUser.wallet);

    if (mainBalance) mainBalance.textContent = balanceText;
    if (userWallet) userWallet.textContent = balanceText;
    if (availableBalance) availableBalance.textContent = balanceText;
    if (navWalletAmount) navWalletAmount.textContent = balanceText;
}

function updateMonthlyStats() {
    const monthlySpent = calculateMonthlySpent();
    const monthlySpentElement = document.getElementById('monthlySpent');
    if (monthlySpentElement) {
        monthlySpentElement.textContent = '-' + formatCurrency(monthlySpent);
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
                        <div class="user-name" id="userName">${user.name || (window.i18n?.t('common.user') || 'Пользователь')}</div>
                        <div class="user-wallet">
                            <i class="fas fa-wallet"></i>
                            <span id="navWalletAmount">${formatCurrency(user.wallet)}</span>
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
                            <div class="user-name-small">${user.name || (window.i18n?.t('common.user') || 'Пользователь')}</div>
                            <div class="user-email-small">${user.email || ''}</div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="/profile" class="dropdown-item">
                        <i class="fas fa-user"></i>
                        ${window.i18n?.t('common.profile') || 'Мой профиль'}
                    </a>
                    <a href="/booking" class="dropdown-item">
                        <i class="fas fa-calendar"></i>
                        ${window.i18n?.t('common.bookings') || 'Мои бронирования'}
                    </a>
                    <a href="/wallet" class="dropdown-item active">
                        <i class="fas fa-wallet"></i>
                        ${window.i18n?.t('common.wallet') || 'Кошелек'}
                    </a>
                    <a href="/setting" class="dropdown-item">
                        <i class="fas fa-cog"></i>
                        ${window.i18n?.t('common.settings') || 'Настройки'}
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-item" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        ${window.i18n?.t('common.logout') || 'Выйти'}
                    </a>
                </div>
            </div>
        </div>
    `;
}

function displayTransactions(transactionsToShow) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;

    if (transactionsToShow.length === 0) {
        transactionsList.innerHTML = `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-title">${window.i18n?.t('wallet.noTransactions') || 'Нет транзакций'}</div>
                    <div class="transaction-description">${window.i18n?.t('wallet.noTransactionsDesc') || 'Транзакции появятся здесь после операций с кошельком'}</div>
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
                        <div class="transaction-description">${transaction.description || ''}</div>
                        <div class="transaction-status">
                            <span class="badge badge-${transaction.status.toLowerCase()}">${getStatusText(transaction.status)}</span>
                        </div>
                    </div>
                    <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : '-'}${formatCurrency(transaction.amount)}
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
    if (window.i18n && window.i18n.t) {
        try {
            const titles = {
                DEPOSIT: window.i18n.t('wallet.deposit'),
                WITHDRAWAL: window.i18n.t('wallet.withdrawal'),
                PAYMENT: window.i18n.t('wallet.payment'),
                REFUND: window.i18n.t('wallet.refund')
            };
            const result = titles[type] || window.i18n.t('wallet.transaction');
            // If translation returns the key itself (translation not found), use fallback
            if (!result || result === 'wallet.deposit' || result === 'wallet.withdrawal' || 
                result === 'wallet.payment' || result === 'wallet.refund' || result === 'wallet.transaction' ||
                (result.startsWith && result.startsWith('wallet.'))) {
                return getFallbackTitle(type);
            }
            return result;
        } catch (e) {
            console.warn('Error getting transaction title translation:', e);
            return getFallbackTitle(type);
        }
    }
    return getFallbackTitle(type);
}

function getFallbackTitle(type) {
    const titles = {
        DEPOSIT: 'Deposit',
        WITHDRAWAL: 'Withdrawal',
        PAYMENT: 'Booking payment',
        REFUND: 'Refund'
    };
    return titles[type] || 'Transaction';
}

function getStatusText(status) {
    if (window.i18n && window.i18n.t) {
        const statuses = {
            PENDING: window.i18n.t('wallet.statusPending') || 'Pending',
            COMPLETED: window.i18n.t('wallet.statusCompleted') || 'Completed',
            FAILED: window.i18n.t('wallet.statusFailed') || 'Failed',
            CANCELLED: window.i18n.t('wallet.statusCancelled') || 'Cancelled'
        };
        return statuses[status] || status;
    }
    // Fallback to English
    const statuses = {
        PENDING: 'Pending',
        COMPLETED: 'Completed',
        FAILED: 'Failed',
        CANCELLED: 'Cancelled'
    };
    return statuses[status] || status;
}

function filterTransactions(filter) {
    const filterTabs = document.querySelectorAll('.filter-tab');

    let filteredTransactions = [...transactions];

    if (filter === 'income') {
        filteredTransactions = transactions.filter(t => t.type === 'DEPOSIT' || t.type === 'REFUND');
    } else if (filter === 'expense') {
        filteredTransactions = transactions.filter(t => t.type === 'PAYMENT' || t.type === 'WITHDRAWAL');
    }

    // Update active tab
    filterTabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-filter="${filter}"]`);
    if (activeTab) activeTab.classList.add('active');

    displayTransactions(filteredTransactions);
}

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

        // Очистить ошибки валидации
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.classList.remove('input-error', 'input-success');
        }
        const errorMessage = document.getElementById('cardError');
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
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

function applyHistoryFilters() {
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    const typeFilter = document.getElementById('typeFilter')?.value;

    let filteredTransactions = [...transactions];

    // Фильтр по дате начала
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredTransactions = filteredTransactions.filter(t => {
            const transactionDate = new Date(t.createdAt);
            return transactionDate >= fromDate;
        });
    }

    // Фильтр по дате окончания
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Конец дня
        filteredTransactions = filteredTransactions.filter(t => {
            const transactionDate = new Date(t.createdAt);
            return transactionDate <= toDate;
        });
    }

    // Фильтр по типу
    if (typeFilter === 'income') {
        filteredTransactions = filteredTransactions.filter(t => t.type === 'DEPOSIT' || t.type === 'REFUND');
    } else if (typeFilter === 'expense') {
        filteredTransactions = filteredTransactions.filter(t => t.type === 'PAYMENT' || t.type === 'WITHDRAWAL');
    }

    // Отобразить отфильтрованные транзакции в модальном окне
    const historyList = document.getElementById('historyList');
    if (historyList) {
        if (filteredTransactions.length === 0) {
            historyList.innerHTML = `
                <div class="transaction-item">
                    <div class="transaction-details">
                        <div class="transaction-title">${window.i18n?.t('wallet.noTransactions') || 'Нет транзакций'}</div>
                        <div class="transaction-description">${window.i18n?.t('wallet.noTransactionsFiltered') || 'По заданным фильтрам транзакции не найдены'}</div>
                    </div>
                </div>
            `;
        } else {
            historyList.innerHTML = filteredTransactions
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
                                <div class="transaction-description">${transaction.description || ''}</div>
                                <div class="transaction-status">
                                    <span class="badge badge-${transaction.status.toLowerCase()}">${getStatusText(transaction.status)}</span>
                                </div>
                            </div>
                            <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                                ${isPositive ? '+' : '-'}${formatCurrency(transaction.amount)}
                            </div>
                            <div class="transaction-date">
                                ${formatDate(transaction.createdAt)}
                            </div>
                        </div>
                    `;
                }).join('');
        }
    }
}

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
        showNotification(window.i18n?.t('wallet.minDepositAmount') || 'Минимальная сумма пополнения: 100BYN', 'error');
        return;
    }

    if (!selectedPayment) {
        showNotification(window.i18n?.t('wallet.selectPaymentMethod') || 'Выберите способ оплаты', 'error');
        return;
    }

    const paymentMethod = selectedPayment.getAttribute('data-option').toUpperCase();

    const depositRequest = {
        amount: amount,
        currency: 'BYN',
        paymentMethod: paymentMethod,
        description: `${window.i18n?.t('wallet.deposit') || 'Deposit'} via ${selectedPayment.querySelector('h4')?.textContent}`
    };

    try {
        await depositFunds(depositRequest);
        closeTopUpModal();
    } catch (error) {
    }
}

async function handleWithdrawForm(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('withdrawAmount'));
    const cardNumber = formData.get('cardNumber');

    if (!amount || amount < 10) {
        showNotification((window.i18n?.t('errors.minWithdrawAmount') || 'Минимальная сумма вывода: 10BYN'), 'error');
        return;
    }

    if (!cardNumber || !validateCardNumber(cardNumber)) {
        showNotification((window.i18n?.t('errors.invalidCardNumber') || 'Укажите корректный номер карты'), 'error');
        return;
    }

    const withdrawRequest = {
        amount: amount,
        currency: 'BYN',
        withdrawalMethod: 'BANK_CARD',
        withdrawalDetails: cardNumber,
        description: window.i18n?.t('wallet.withdrawDescription') || 'Withdrawal to card'
    };

    try {
        await withdrawFunds(withdrawRequest);
        closeWithdrawModal();
    } catch (error) {
    }
}

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
    updatePaymentOptions();

    window.addEventListener('languageChanged', updatePaymentOptions);
}

function updatePaymentOptions() {
    const paymentOptions = document.getElementById('paymentOptions');
    if (!paymentOptions) return;
    const options = [
        {
            id: 'card',
            name: window.i18n?.t('wallet.paymentMethodCard') || 'Bank Card',
            description: window.i18n?.t('wallet.cardHint') || 'Visa, Mastercard, MIR',
            icon: 'fas fa-credit-card'
        },
        {
            id: 'bank',
            name: window.i18n?.t('wallet.paymentMethodBank') || 'Bank Transfer',
            description: window.i18n?.t('wallet.bankDescription') || 'Bank transfer',
            icon: 'fas fa-university'
        },
        {
            id: 'wallet',
            name: window.i18n?.t('wallet.paymentMethodWallet') || 'E-Wallet',
            description: window.i18n?.t('wallet.walletDescription') || 'E-wallet services',
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
// ВАЛИДАЦИЯ НОМЕРА КАРТЫ
// ==============================================

function setupCardValidation() {
    const cardNumberInput = document.getElementById('cardNumber');
    if (!cardNumberInput) return;

    // Форматирование ввода (добавление пробелов)
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;

        // Валидация в реальном времени
        validateCardNumberInput(e.target);
    });

    // Разрешить только цифры и пробелы
    cardNumberInput.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.which);
        if (!/[\d\s]/.test(char)) {
            e.preventDefault();
        }
    });
}

function validateCardNumberInput(input) {
    const cardNumber = input.value.replace(/\s/g, '');
    const errorMessage = document.getElementById('cardError');

    if (cardNumber.length === 0) {
        input.classList.remove('input-error', 'input-success');
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
        return;
    }

    if (validateCardNumber(cardNumber)) {
        input.classList.remove('input-error');
        input.classList.add('input-success');
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
    } else {
        input.classList.remove('input-success');
        input.classList.add('input-error');
        if (errorMessage) {
            errorMessage.textContent = window.i18n?.t('errors.invalidCardNumber') || 'Invalid card number';
            errorMessage.style.display = 'block';
        }
    }
}

function validateCardNumber(cardNumber) {
    // Удаляем все пробелы
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // Проверка длины (13-19 цифр для большинства карт)
    if (!/^\d{13,19}$/.test(cleanNumber)) {
        return false;
    }

    // Алгоритм Луна (Luhn algorithm)
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

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

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        showNotification(window.i18n?.t('errors.loggedOut') || 'You have logged out', 'info');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeAuthData();
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

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

function setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });

    window.addEventListener('scroll', handleHeaderScroll);

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeTopUpModal();
            closeWithdrawModal();
            closeHistoryModal();
        }
    });

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
        
        .input-error {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }
        
        .input-success {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
        }
        
        .error-message {
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            display: none;
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
