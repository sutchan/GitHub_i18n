/**
 * 国际化支持框架
 * 为GitHub翻译插件提供多语言支持的基础框架
 */

/**
 * 国际化管理器
 */
class I18nManager {
    constructor() {
        this.currentLocale = 'zh-CN'; // 默认中文
        this.fallbackLocale = 'en-US'; // 回退语言
        this.translations = new Map(); // 存储所有翻译
        this.loadedLocales = new Set(); // 已加载的语言
        this.observers = []; // 语言变更观察者
    }

    /**
     * 初始化国际化管理器
     * @param {string} defaultLocale - 默认语言
     * @param {string} fallbackLocale - 回退语言
     */
    init(defaultLocale = 'zh-CN', fallbackLocale = 'en-US') {
        this.currentLocale = defaultLocale;
        this.fallbackLocale = fallbackLocale;
        
        // 尝试从本地存储获取用户语言偏好
        if (typeof localStorage !== 'undefined') {
            const savedLocale = localStorage.getItem('github-i18n-locale');
            if (savedLocale) {
                this.currentLocale = savedLocale;
            } else {
                // 尝试从浏览器语言设置获取
                const browserLocale = navigator.language || navigator.userLanguage;
                if (browserLocale) {
                    this.currentLocale = browserLocale;
                }
            }
        }
        
        console.log(`国际化管理器已初始化，当前语言: ${this.currentLocale}`);
    }

    /**
     * 加载翻译文件
     * @param {string} locale - 语言代码
     * @param {Object} translations - 翻译对象
     */
    loadTranslations(locale, translations) {
        if (!translations || typeof translations !== 'object') {
            console.error(`无效的翻译数据: ${locale}`);
            return false;
        }
        
        this.translations.set(locale, translations);
        this.loadedLocales.add(locale);
        
        console.log(`已加载翻译: ${locale}`);
        return true;
    }

    /**
     * 异步加载翻译文件
     * @param {string} locale - 语言代码
     * @param {string} url - 翻译文件URL
     * @returns {Promise<boolean>} 加载是否成功
     */
    async loadTranslationsAsync(locale, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const translations = await response.json();
            return this.loadTranslations(locale, translations);
        } catch (error) {
            console.error(`加载翻译失败 ${locale}:`, error);
            return false;
        }
    }

    /**
     * 获取翻译文本
     * @param {string} key - 翻译键
     * @param {Object} params - 参数对象
     * @param {string} locale - 指定语言（可选）
     * @returns {string} 翻译文本
     */
    t(key, params = {}, locale = null) {
        const targetLocale = locale || this.currentLocale;
        
        // 尝试获取指定语言的翻译
        let translation = this.getTranslationByKey(key, targetLocale);
        
        // 如果没有找到，尝试回退语言
        if (!translation && targetLocale !== this.fallbackLocale) {
            translation = this.getTranslationByKey(key, this.fallbackLocale);
        }
        
        // 如果仍然没有找到，返回键名
        if (!translation) {
            console.warn(`未找到翻译: ${key} (${targetLocale})`);
            return key;
        }
        
        // 处理参数替换
        return this.interpolate(translation, params);
    }

    /**
     * 根据键获取翻译
     * @param {string} key - 翻译键
     * @param {string} locale - 语言代码
     * @returns {string|null} 翻译文本
     */
    getTranslationByKey(key, locale) {
        const translations = this.translations.get(locale);
        if (!translations) return null;
        
        // 支持嵌套键，如 "menu.file.open"
        const keys = key.split('.');
        let result = translations;
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return null;
            }
        }
        
        return typeof result === 'string' ? result : null;
    }

    /**
     * 插值处理
     * @param {string} template - 模板字符串
     * @param {Object} params - 参数对象
     * @returns {string} 处理后的字符串
     */
    interpolate(template, params) {
        if (!template || typeof template !== 'string') return template;
        if (!params || typeof params !== 'object') return template;
        
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * 设置当前语言
     * @param {string} locale - 语言代码
     * @returns {boolean} 设置是否成功
     */
    setLocale(locale) {
        if (!this.loadedLocales.has(locale)) {
            console.warn(`语言未加载: ${locale}`);
            return false;
        }
        
        const oldLocale = this.currentLocale;
        this.currentLocale = locale;
        
        // 保存到本地存储
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('github-i18n-locale', locale);
        }
        
        // 通知观察者
        this.notifyObservers(locale, oldLocale);
        
        console.log(`语言已更改: ${oldLocale} -> ${locale}`);
        return true;
    }

    /**
     * 获取当前语言
     * @returns {string} 当前语言代码
     */
    getCurrentLocale() {
        return this.currentLocale;
    }

    /**
     * 获取已加载的语言列表
     * @returns {Array<string>} 语言代码列表
     */
    getLoadedLocales() {
        return Array.from(this.loadedLocales);
    }

    /**
     * 添加语言变更观察者
     * @param {Function} observer - 观察者函数
     */
    addObserver(observer) {
        if (typeof observer === 'function') {
            this.observers.push(observer);
        }
    }

    /**
     * 移除语言变更观察者
     * @param {Function} observer - 观察者函数
     */
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index !== -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * 通知所有观察者
     * @param {string} newLocale - 新语言
     * @param {string} oldLocale - 旧语言
     */
    notifyObservers(newLocale, oldLocale) {
        this.observers.forEach(observer => {
            try {
                observer(newLocale, oldLocale);
            } catch (error) {
                console.error('观察者执行错误:', error);
            }
        });
    }

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @param {Object} options - 格式化选项
     * @param {string} locale - 语言代码（可选）
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date, options = {}, locale = null) {
        const targetLocale = locale || this.currentLocale;
        
        // 默认选项
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            return new Intl.DateTimeFormat(targetLocale, formatOptions).format(date);
        } catch (error) {
            console.error('日期格式化错误:', error);
            return date.toLocaleDateString();
        }
    }

    /**
     * 格式化数字
     * @param {number} number - 数字
     * @param {Object} options - 格式化选项
     * @param {string} locale - 语言代码（可选）
     * @returns {string} 格式化后的数字字符串
     */
    formatNumber(number, options = {}, locale = null) {
        const targetLocale = locale || this.currentLocale;
        
        try {
            return new Intl.NumberFormat(targetLocale, options).format(number);
        } catch (error) {
            console.error('数字格式化错误:', error);
            return number.toString();
        }
    }

    /**
     * 格式化相对时间
     * @param {Date} date - 日期对象
     * @param {string} locale - 语言代码（可选）
     * @returns {string} 相对时间字符串
     */
    formatRelativeTime(date, locale = null) {
        const targetLocale = locale || this.currentLocale;
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        // 定义时间单位
        const units = [
            { max: 60, unit: 'second' },
            { max: 3600, unit: 'minute' },
            { max: 86400, unit: 'hour' },
            { max: 2592000, unit: 'day' },
            { max: 31536000, unit: 'month' },
            { max: Infinity, unit: 'year' }
        ];
        
        for (const { max, unit } of units) {
            if (diffInSeconds < max) {
                const value = Math.floor(diffInSeconds / (max / 60));
                try {
                    return new Intl.RelativeTimeFormat(targetLocale).format(-value, unit);
                } catch (error) {
                    console.error('相对时间格式化错误:', error);
                    break;
                }
            }
        }
        
        return date.toLocaleDateString();
    }
}

// 创建全局国际化管理器实例
const i18nManager = new I18nManager();

/**
 * 翻译函数快捷方式
 * @param {string} key - 翻译键
 * @param {Object} params - 参数对象
 * @returns {string} 翻译文本
 */
function t(key, params = {}) {
    return i18nManager.t(key, params);
}

/**
 * 初始化国际化支持
 * @param {string} defaultLocale - 默认语言
 * @param {string} fallbackLocale - 回退语言
 * @returns {Promise<boolean>} 初始化是否成功
 */
async function initI18n(defaultLocale = 'zh-CN', fallbackLocale = 'en-US') {
    i18nManager.init(defaultLocale, fallbackLocale);
    
    // 加载中文翻译
    await loadLocaleTranslations('zh-CN');
    
    // 加载英文翻译
    await loadLocaleTranslations('en-US');
    
    // 如果当前语言不是中文或英文，尝试加载对应翻译
    if (i18nManager.getCurrentLocale() !== 'zh-CN' && 
        i18nManager.getCurrentLocale() !== 'en-US') {
        await loadLocaleTranslations(i18nManager.getCurrentLocale());
    }
    
    return true;
}

/**
 * 加载指定语言的翻译
 * @param {string} locale - 语言代码
 * @returns {Promise<boolean>} 加载是否成功
 */
async function loadLocaleTranslations(locale) {
    // 在实际应用中，这里应该从服务器或本地文件加载翻译
    // 这里提供一些示例翻译
    
    const translations = {};
    
    if (locale === 'zh-CN') {
        // 中文翻译
        Object.assign(translations, {
            // 通用翻译
            'common.loading': '加载中...',
            'common.error': '错误',
            'common.success': '成功',
            'common.cancel': '取消',
            'common.confirm': '确认',
            'common.save': '保存',
            'common.delete': '删除',
            'common.edit': '编辑',
            'common.close': '关闭',
            
            // GitHub 界面翻译
            'github.pull_request': '拉取请求',
            'github.issues': '问题',
            'github.code': '代码',
            'github.actions': '操作',
            'github.projects': '项目',
            'github.security': '安全',
            'github.insights': '洞察',
            'github.settings': '设置',
            
            // 设置界面
            'settings.title': '设置',
            'settings.language': '语言',
            'settings.theme': '主题',
            'settings.save_success': '设置已保存',
            'settings.save_error': '保存设置失败',
            
            // 时间格式
            'time.now': '刚刚',
            'time.minutes_ago': '{{count}} 分钟前',
            'time.hours_ago': '{{count}} 小时前',
            'time.days_ago': '{{count}} 天前',
            'time.weeks_ago': '{{count}} 周前',
            'time.months_ago': '{{count}} 个月前',
            'time.years_ago': '{{count}} 年前'
        });
    } else if (locale === 'en-US') {
        // 英文翻译（作为回退语言）
        Object.assign(translations, {
            // 通用翻译
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.cancel': 'Cancel',
            'common.confirm': 'Confirm',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.close': 'Close',
            
            // GitHub 界面翻译
            'github.pull_request': 'Pull Request',
            'github.issues': 'Issues',
            'github.code': 'Code',
            'github.actions': 'Actions',
            'github.projects': 'Projects',
            'github.security': 'Security',
            'github.insights': 'Insights',
            'github.settings': 'Settings',
            
            // 设置界面
            'settings.title': 'Settings',
            'settings.language': 'Language',
            'settings.theme': 'Theme',
            'settings.save_success': 'Settings saved',
            'settings.save_error': 'Failed to save settings',
            
            // 时间格式
            'time.now': 'now',
            'time.minutes_ago': '{{count}} minutes ago',
            'time.hours_ago': '{{count}} hours ago',
            'time.days_ago': '{{count}} days ago',
            'time.weeks_ago': '{{count}} weeks ago',
            'time.months_ago': '{{count}} months ago',
            'time.years_ago': '{{count}} years ago'
        });
    }
    
    return i18nManager.loadTranslations(locale, translations);
}

/**
 * 切换语言
 * @param {string} locale - 语言代码
 * @returns {Promise<boolean>} 切换是否成功
 */
async function switchLanguage(locale) {
    // 如果语言未加载，尝试加载
    if (!i18nManager.getLoadedLocales().includes(locale)) {
        const success = await loadLocaleTranslations(locale);
        if (!success) {
            console.error(`无法加载语言: ${locale}`);
            return false;
        }
    }
    
    return i18nManager.setLocale(locale);
}

// 导出国际化管理器和相关函数
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 环境
    module.exports = {
        I18nManager,
        i18nManager,
        t,
        initI18n,
        loadLocaleTranslations,
        switchLanguage
    };
} else if (typeof window !== 'undefined') {
    // 浏览器环境
    window.I18nManager = I18nManager;
    window.i18nManager = i18nManager;
    window.t = t;
    window.initI18n = initI18n;
    window.loadLocaleTranslations = loadLocaleTranslations;
    window.switchLanguage = switchLanguage;
}