// Wallet Management JavaScript

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const userDropdown = document.getElementById('userDropdown');

// Wallet data
let currentUser = null;
let transactions = [];
let paymentMethods = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWallet();
    loadUserData();
    loadTransactions();
    loadPaymentMethods();
    setupEventListeners();
    initializeTheme();
});

// Initialize wallet page
function initializeWallet() {
    // Set up mobile navigation
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Set up amount buttons
    setupAmountButtons();
    
    // Set up payment options
    setupPaymentOptions();
}

// Load user data from localStorage
function loadUserData() {
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserInterface();
    } else {
        // Create demo user if no data exists
        currentUser = {
            name: 'Иван Иванов',
            firstName: 'Иван',
            lastName: 'Иванов',
            email: 'ivan.ivanov@example.com',
            wallet: 15000,
            bonus: 2500,
            avatar: '👤'
        };
        updateUserInterface();
    }
}

// Update user interface with current user data
function updateUserInterface() {
    if (!currentUser) return;

    // Update navigation
    updateNavigationForLoggedInUser(currentUser);

    // Update wallet balances
    const mainBalance = document.getElementById('mainBalance');
    const bonusBalance = document.getElementById('bonusBalance');
    const userWallet = document.getElementById('userWallet');
    const availableBalance = document.getElementById('availableBalance');

    if (mainBalance) mainBalance.textContent = currentUser.wallet ? currentUser.wallet.toLocaleString() + '₽' : '0₽';
    if (bonusBalance) bonusBalance.textContent = currentUser.bonus ? currentUser.bonus.toLocaleString() + '₽' : '0₽';
    if (userWallet) userWallet.textContent = currentUser.wallet ? currentUser.wallet.toLocaleString() + '₽' : '0₽';
    if (availableBalance) availableBalance.textContent = currentUser.wallet ? currentUser.wallet.toLocaleString() + '₽' : '0₽';

    // Calculate monthly spent
    const monthlySpent = calculateMonthlySpent();
    const monthlySpentElement = document.getElementById('monthlySpent');
    if (monthlySpentElement) {
        monthlySpentElement.textContent = '-' + monthlySpent.toLocaleString() + '₽';
    }
}

// Calculate monthly spent amount
function calculateMonthlySpent() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
        .filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear &&
                   transaction.type === 'expense';
        })
        .reduce((total, transaction) => total + transaction.amount, 0);
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

// Load demo transactions
function loadTransactions() {
    transactions = [
        {
            id: 1,
            type: 'expense',
            title: 'Бронирование номера',
            description: 'Отель "Райский уголок" - Люкс',
            amount: 8500,
            date: new Date('2024-01-15'),
            icon: 'fas fa-bed'
        },
        {
            id: 2,
            type: 'income',
            title: 'Пополнение счета',
            description: 'Перевод с карты **** 1234',
            amount: 10000,
            date: new Date('2024-01-14'),
            icon: 'fas fa-plus'
        },
        {
            id: 3,
            type: 'bonus',
            title: 'Бонус за отзыв',
            description: 'Начислен бонус за отзыв об отеле',
            amount: 500,
            date: new Date('2024-01-13'),
            icon: 'fas fa-gift'
        },
        {
            id: 4,
            type: 'expense',
            title: 'Дополнительные услуги',
            description: 'СПА-процедуры и массаж',
            amount: 2500,
            date: new Date('2024-01-12'),
            icon: 'fas fa-spa'
        },
        {
            id: 5,
            type: 'income',
            title: 'Возврат средств',
            description: 'Отмена бронирования',
            amount: 3500,
            date: new Date('2024-01-10'),
            icon: 'fas fa-undo'
        },
        {
            id: 6,
            type: 'bonus',
            title: 'Бонус за регистрацию',
            description: 'Добро пожаловать в нашу систему!',
            amount: 1000,
            date: new Date('2024-01-01'),
            icon: 'fas fa-star'
        }
    ];

    displayTransactions(transactions);
}

// Display transactions
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
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="${transaction.icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-description">${transaction.description}</div>
                </div>
                <div class="transaction-amount ${transaction.type === 'income' || transaction.type === 'bonus' ? 'positive' : 'negative'}">
                    ${transaction.type === 'income' || transaction.type === 'bonus' ? '+' : '-'}${transaction.amount.toLocaleString()}₽
                </div>
                <div class="transaction-date">
                    ${formatDate(transaction.date)}
                </div>
            </div>
        `).join('');
}

// Load demo payment methods
function loadPaymentMethods() {
    paymentMethods = [
        {
            id: 1,
            type: 'card',
            name: 'Visa **** 1234',
            description: 'Основная карта',
            icon: 'fas fa-credit-card',
            isDefault: true
        },
        {
            id: 2,
            type: 'card',
            name: 'Mastercard **** 5678',
            description: 'Резервная карта',
            icon: 'fas fa-credit-card',
            isDefault: false
        },
        {
            id: 3,
            type: 'bank',
            name: 'Сбербанк',
            description: 'Банковский перевод',
            icon: 'fas fa-university',
            isDefault: false
        }
    ];

    displayPaymentMethods();
}

// Display payment methods
function displayPaymentMethods() {
    const paymentCards = document.getElementById('paymentCards');
    if (!paymentCards) return;

    paymentCards.innerHTML = paymentMethods.map(method => `
        <div class="payment-card">
            <div class="payment-card-icon">
                <i class="${method.icon}"></i>
            </div>
            <div class="payment-card-details">
                <h4>${method.name}</h4>
                <p>${method.description}</p>
            </div>
            <div class="payment-card-actions">
                ${method.isDefault ? '<span class="badge">Основной</span>' : ''}
                <button class="btn btn-outline" onclick="removePaymentMethod(${method.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Setup amount buttons
function setupAmountButtons() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');

    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all buttons
            amountButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Clear custom amount input
            if (customAmountInput) {
                customAmountInput.value = '';
            }
        });
    });

    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            // Remove selected class from all buttons when custom amount is entered
            amountButtons.forEach(btn => btn.classList.remove('selected'));
        });
    }
}

// Setup payment options
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

    // Add click handlers
    const paymentOptionElements = document.querySelectorAll('.payment-option');
    paymentOptionElements.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptionElements.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// Filter transactions
function filterTransactions(filter) {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const transactionsToShow = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

    // Update active tab
    filterTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

    // Display filtered transactions
    displayTransactions(transactionsToShow);
}

// Load more transactions
function loadMoreTransactions() {
    showNotification('Загружено больше транзакций', 'info');
}

// Open top up modal
function openTopUpModal() {
    const modal = document.getElementById('topUpModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Close top up modal
function closeTopUpModal() {
    const modal = document.getElementById('topUpModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        resetTopUpForm();
    }
}

// Reset top up form
function resetTopUpForm() {
    const form = document.getElementById('topUpForm');
    if (form) {
        form.reset();
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    }
}

// Open withdraw modal
function openWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        updateWithdrawCardOptions();
    }
}

// Close withdraw modal
function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        document.getElementById('withdrawForm').reset();
    }
}

// Update withdraw card options
function updateWithdrawCardOptions() {
    const select = document.getElementById('withdrawCard');
    if (!select) return;

    select.innerHTML = '<option value="">Выберите карту</option>' +
        paymentMethods
            .filter(method => method.type === 'card')
            .map(method => `<option value="${method.id}">${method.name}</option>`)
            .join('');
}

// Open transfer modal
function openTransferModal() {
    const modal = document.getElementById('transferModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Close transfer modal
function closeTransferModal() {
    const modal = document.getElementById('transferModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        document.getElementById('transferForm').reset();
    }
}

// Open history modal
function openHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        displayHistoryTransactions();
    }
}

// Close history modal
function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Display history transactions
function displayHistoryTransactions() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    historyList.innerHTML = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="${transaction.icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-description">${transaction.description}</div>
                </div>
                <div class="transaction-amount ${transaction.type === 'income' || transaction.type === 'bonus' ? 'positive' : 'negative'}">
                    ${transaction.type === 'income' || transaction.type === 'bonus' ? '+' : '-'}${transaction.amount.toLocaleString()}₽
                </div>
                <div class="transaction-date">
                    ${formatDate(transaction.date)}
                </div>
            </div>
        `).join('');
}

// Apply history filters
function applyHistoryFilters() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const typeFilter = document.getElementById('typeFilter').value;

    let filteredTransactions = transactions;

    if (dateFrom) {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= new Date(dateFrom));
    }

    if (dateTo) {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= new Date(dateTo));
    }

    if (typeFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }

    displayHistoryTransactions(filteredTransactions);
}

// Add payment method
function addPaymentMethod() {
    showNotification('Функция добавления карты будет доступна в следующей версии', 'info');
}

// Remove payment method
function removePaymentMethod(methodId) {
    if (confirm('Вы уверены, что хотите удалить этот способ оплаты?')) {
        paymentMethods = paymentMethods.filter(method => method.id !== methodId);
        displayPaymentMethods();
        showNotification('Способ оплаты удален', 'success');
    }
}

// Handle top up form submission
function handleTopUpForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const selectedAmount = document.querySelector('.amount-btn.selected');
    const customAmount = document.getElementById('customAmount').value;
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

    // Simulate top up
    showNotification('Пополнение на ' + amount.toLocaleString() + '₽ успешно выполнено!', 'success');
    
    // Update balance
    currentUser.wallet += amount;
    localStorage.setItem('userData', JSON.stringify(currentUser));
    updateUserInterface();
    
    // Add transaction
    addTransaction('income', 'Пополнение счета', 'Пополнение через ' + selectedPayment.querySelector('h4').textContent, amount);
    
    closeTopUpModal();
}

// Handle withdraw form submission
function handleWithdrawForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const amount = parseInt(formData.get('withdrawAmount'));
    const cardId = formData.get('withdrawCard');
    const comment = formData.get('withdrawComment');

    if (amount > currentUser.wallet) {
        showNotification('Недостаточно средств на счете', 'error');
        return;
    }

    if (amount < 100) {
        showNotification('Минимальная сумма вывода: 100₽', 'error');
        return;
    }

    if (!cardId) {
        showNotification('Выберите карту для вывода', 'error');
        return;
    }

    // Simulate withdraw
    showNotification('Заявка на вывод ' + amount.toLocaleString() + '₽ отправлена!', 'success');
    
    // Update balance
    currentUser.wallet -= amount;
    localStorage.setItem('userData', JSON.stringify(currentUser));
    updateUserInterface();
    
    // Add transaction
    addTransaction('expense', 'Вывод средств', 'Вывод на карту', amount);
    
    closeWithdrawModal();
}

// Handle transfer form submission
function handleTransferForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('transferEmail');
    const amount = parseInt(formData.get('transferAmount'));
    const comment = formData.get('transferComment');

    if (amount > currentUser.wallet) {
        showNotification('Недостаточно средств на счете', 'error');
        return;
    }

    if (amount < 1) {
        showNotification('Минимальная сумма перевода: 1₽', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Введите корректный email', 'error');
        return;
    }

    // Simulate transfer
    showNotification('Перевод ' + amount.toLocaleString() + '₽ на ' + email + ' выполнен!', 'success');
    
    // Update balance
    currentUser.wallet -= amount;
    localStorage.setItem('userData', JSON.stringify(currentUser));
    updateUserInterface();
    
    // Add transaction
    addTransaction('expense', 'Перевод средств', 'Перевод пользователю ' + email, amount);
    
    closeTransferModal();
}

// Add transaction
function addTransaction(type, title, description, amount) {
    const newTransaction = {
        id: Date.now(),
        type: type,
        title: title,
        description: description,
        amount: amount,
        date: new Date(),
        icon: type === 'income' ? 'fas fa-plus' : type === 'bonus' ? 'fas fa-gift' : 'fas fa-minus'
    };

    transactions.unshift(newTransaction);
    displayTransactions(transactions);
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
            closeTopUpModal();
            closeWithdrawModal();
            closeTransferModal();
            closeHistoryModal();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTopUpModal();
            closeWithdrawModal();
            closeTransferModal();
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

    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', handleTransferForm);
    }
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

