let translations = {};
let currentLanguage = 'ru';
let isReady = false;
let observer = null;

async function loadTranslations(lang = 'ru') {
    try {
        const response = await fetch(`/src/${lang}/common.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${lang}`);
        }
        translations = await response.json();
        currentLanguage = lang;
        //console.log('Translations loaded:', lang);
        return translations;
    } catch (error) {
        console.error('Error loading translations:', error);
        if (lang !== 'ru') {
            return loadTranslations('ru');
        }
        return {};
    }
}

function t(key, params = {}) {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return key;
        }
    }

    if (typeof value !== 'string') {
        return key;
    }

    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), paramValue);
    }

    return result;
}

async function setLanguage(lang) {
    await loadTranslations(lang);
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('lang', lang);
    currentLanguage = lang;

    applyTranslations();

    const langText = document.getElementById('langText');
    if (langText) {
        langText.textContent = lang.toUpperCase();
    }

    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

    setTimeout(() => {
        applyTranslations();
        //console.log('Translations re-applied for static elements');
    }, 150);

    setTimeout(() => {
        applyTranslations();
       // console.log('Final translation pass completed');
    }, 300);
}



function getLanguage() {
    return currentLanguage;
}

function applyTranslations() {

    const elements = document.querySelectorAll('[data-i18n]');
    //console.log(` Found ${elements.length} elements with [data-i18n]`);

    elements.forEach((element, index) => {
        const key = element.getAttribute('data-i18n');
        if (!key) return;

        const translation = t(key);


        //console.log(`[${index + 1}] Key: "${key}" => Translation: "${translation}" (Element:`, element, ')');

        if (!translation || translation === key) {
            //console.warn(`Translation NOT found for key: ${key}`);
            return;
        }

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.type === 'submit' || element.type === 'button') {
                element.value = translation;
            } else if (!element.hasAttribute('data-i18n-placeholder')) {
                element.placeholder = translation;
            }
        } else if (element.hasAttribute('data-i18n-html')) {
            element.innerHTML = translation;
        } else {
            const hasI18nChildren = element.querySelector('[data-i18n]');
            if (!hasI18nChildren || element.children.length === 0) {
                const oldText = element.textContent;
                element.textContent = translation;
                //console.log(`  Updated: "${oldText}" -> "${translation}"`);
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (!key) return;
        const translation = t(key);
        if (translation && translation !== key) {
            element.placeholder = translation;
        }
    });

    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
        const translation = t(titleElement.getAttribute('data-i18n'));
        if (translation && translation !== titleElement.getAttribute('data-i18n')) {
            titleElement.textContent = translation;
        }
    }

    const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
    if (metaDesc) {
        const translation = t(metaDesc.getAttribute('data-i18n'));
        if (translation && translation !== metaDesc.getAttribute('data-i18n')) {
            metaDesc.setAttribute('content', translation);
        }
    }

    document.querySelectorAll('option[data-i18n]').forEach(option => {
        const key = option.getAttribute('data-i18n');
        if (!key) return;
        const translation = t(key);
        if (translation && translation !== key) {
            option.textContent = translation;
        }
    });

    //console.log('Translations applied');
}


function setupMutationObserver() {
    // Отключаем предыдущий наблюдатель, если есть
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
        let needsUpdate = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                            needsUpdate = true;
                            break;
                        }
                        if (node.querySelector && node.querySelector('[data-i18n]')) {
                            needsUpdate = true;
                            break;
                        }
                    }
                }
            }

            // Проверяем изменения атрибутов
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-i18n') {
                needsUpdate = true;
            }

            if (needsUpdate) break;
        }

        if (needsUpdate) {
            // Используем debounce чтобы не применять переводы слишком часто
            clearTimeout(applyTranslations.timeout);
            applyTranslations.timeout = setTimeout(() => {
                applyTranslations();
            }, 50);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-i18n', 'data-i18n-placeholder']
    });

    console.log('MutationObserver setup complete');
}

async function initI18n() {
    const savedLanguage = localStorage.getItem('language') || 'ru';
    await loadTranslations(savedLanguage);
    document.documentElement.setAttribute('lang', savedLanguage);
    applyTranslations();
    isReady = true;

    // Настраиваем наблюдатель
    setupMutationObserver();

    window.dispatchEvent(new Event('i18nReady'));
}

function createLanguageSwitcher() {
    const langSwitcher = document.createElement('div');
    langSwitcher.className = 'language-switcher';
    langSwitcher.innerHTML = `
        <button class="lang-btn" id="langToggle" title="Switch language">
            <i class="fas fa-globe"></i>
            <span id="langText">${currentLanguage.toUpperCase()}</span>
        </button>
    `;

    if (!document.getElementById('language-switcher-styles')) {
        const style = document.createElement('style');
        style.id = 'language-switcher-styles';
        style.textContent = `
            .language-switcher {
                position: relative;
                margin-left: 10px;
                display: flex;
                align-items: center;
                z-index: 1000;
            }
            .lang-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: var(--bg-secondary, #f3f4f6);
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary, #1f2937);
                transition: all 0.3s ease;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            .lang-btn:hover {
                background: var(--bg-hover, #e5e7eb);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            [data-theme="dark"] .lang-btn {
                background: var(--bg-secondary, #334155);
                border-color: var(--border-color, #475569);
                color: var(--text-primary, #e2e8f0);
            }
            [data-theme="dark"] .lang-btn:hover {
                background: var(--bg-hover, #475569);
            }
            @media (max-width: 768px) {
                .lang-btn { padding: 6px 12px; font-size: 12px; }
                .lang-btn span { display: none; }
            }
        `;
        document.head.appendChild(style);
    }

    return langSwitcher;
}

function toggleLanguage() {
    const currentLang = getLanguage();
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    switchLanguage(newLang);
}

async function switchLanguage(lang) {
    await setLanguage(lang);
    const langText = document.getElementById('langText');
    if (langText) {
        langText.textContent = lang.toUpperCase();
    }
}

function initLanguageSwitcher() {
    if (document.querySelector('.language-switcher')) return;

    const themeToggle = document.querySelector('.theme-toggle');
    const navAuth = document.querySelector('.nav-auth');
    const navContainer = document.querySelector('.nav-container');
    const switcher = createLanguageSwitcher();

    if (themeToggle && themeToggle.parentElement) {
        themeToggle.parentElement.insertBefore(switcher, themeToggle.nextSibling);
    } else if (navAuth && navAuth.parentElement) {
        navAuth.parentElement.insertBefore(switcher, navAuth);
    } else if (navContainer) {
        navContainer.appendChild(switcher);
    } else {
        switcher.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;';
        document.body.appendChild(switcher);
    }

    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }
}

// Экспортируем API
window.i18n = {
    t,
    setLanguage,
    getLanguage,
    loadTranslations,
    applyTranslations,
    initI18n,
    initLanguageSwitcher,
    switchLanguage,
    toggleLanguage,
    get isReady() { return isReady; }
};

window.switchLanguage = switchLanguage;
window.toggleLanguage = toggleLanguage;

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await initI18n();
        initLanguageSwitcher();
    });
} else {
    initI18n().then(() => initLanguageSwitcher());
}
