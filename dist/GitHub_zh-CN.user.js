/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version 1.8.61
// @description  将 GitHub 界面翻译成中文
// @author       Sut
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @match        https://*.githubusercontent.com/*
// @exclude      https://github.com/login*
// @exclude      https://github.com/signup*
// @icon         https://github.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @resource     CSS https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n@master/style.min.css
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @run-at       document-start
// @license      MIT
// @updateURL    https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// @downloadURL  https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// ==/UserScript==

// 导入配置
// 导入工具函数
// 导入版本检查器
// 导入翻译核心
// 导入词典模块
// 导入页面监控
// 导入开发工具
// 导入主初始化函数
// 导出所有公开模块
export {
  CONFIG,
  utils,
  versionChecker,
  translationCore,
  translationModule,
  pageMonitor,
  stringExtractor,
  AutoStringUpdater,
  DictionaryProcessor,
  loadTools,
  init,
  startScript
};

// 启动脚本
startScript();


/**
 * GitHub 中文翻译配置文件
 * 包含脚本所有可配置项
 */

// 导入版本常量（从单一版本源）
// 定义GM_info以避免未定义错误
const GM_info = typeof window !== 'undefined' && window.GM_info || {};

/**
 * 从用户脚本头部注释中提取版本号
 * @returns {string} 版本号
 */
function getVersionFromComment() {
    try {
        // 作为用户脚本，我们可以直接从当前执行环境中提取版本信息
        const versionMatch = GM_info?.script?.version;
        if (versionMatch) {
            return versionMatch;
        }
        
        // 如果GM_info不可用，返回配置中的版本号
        return VERSION;
    } catch (e) {
        // 出错时返回配置中的版本号
        return VERSION;
    }
}

/**
 * 配置对象，包含所有可配置项
 */
export const CONFIG = {
    "version": VERSION,
    "debounceDelay": 500,
    "routeChangeDelay": 500,
    "debugMode": false,
    "updateCheck": {
        "enabled": true,
        "intervalHours": 24,
        "scriptUrl": "https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js",
        "autoUpdateVersion": true
    },
    "externalTranslation": {
        "enabled": false,
        "minLength": 20,
        "maxLength": 500,
        "timeout": 3000,
        "requestInterval": 500,
        "cacheSize": 500
    },
    "performance": {
        "enableDeepObserver": true,
        "enablePartialMatch": false,
        "maxDictSize": 2000,
        "enableTranslationCache": true,
        "batchSize": 50,
        "batchDelay": 0,
        "logTiming": false,
        "cacheExpiration": 3600000, // 缓存过期时间（毫秒）
        "minTextLengthToTranslate": 3, // 最小翻译文本长度
        "minTranslateInterval": 500, // 最小翻译间隔（毫秒）
        "observeAttributes": true, // 是否观察属性变化
        "importantAttributes": ["title", "alt", "aria-label", "placeholder", "data-hovercard-url", "data-hovercard-type"] // 重要的属性列表
    },
    "selectors": {
        "primary": [
            "h1, h2, h3, h4, h5, h6",
            "p, span, a, button",
            "label, strong, em",
            "li, td, th",
            ".btn, .button",
            ".link, .text",
            ".nav-item, .menu-item"
        ],
        "popupMenus": [
            ".dropdown-menu",
            ".menu-dropdown",
            ".context-menu",
            ".notification-popover"
        ]
    },
    "pagePatterns": {
        "search": /\/search/,
        "repository": /\/[\w-]+\/[\w-]+/,
        "issues": /\/[\w-]+\/[\w-]+\/issues/,
        "pullRequests": /\/[\w-]+\/[\w-]+\/pull/,
        "settings": /\/settings/,
        "dashboard": /^\/$/,            
        "explore": /\/explore/,
        "codespaces": /\/codespaces/
    }
};



/**
 * 工具函数模块
 * 包含各种通用的辅助函数
 */

/**
 * 工具函数集合
 */
export const utils = {
    /**
     * 节流函数，用于限制高频操作的执行频率
     * 支持返回Promise
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间（毫秒）
     * @param {Object} options - 配置选项
     * @param {boolean} options.leading - 是否在开始时执行（默认true）
     * @param {boolean} options.trailing - 是否在结束后执行（默认true）
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit, options = {}) {
        const { leading = true, trailing = true } = options;
        let inThrottle, lastArgs, lastThis, result, timerId;
        
        const later = (context, args) => {
            inThrottle = false;
            if (trailing && lastArgs) {
                result = func.apply(context, args);
                lastArgs = lastThis = null;
            }
        };
        
        return function() {
            const args = arguments;
            const context = this;
            
            if (!inThrottle) {
                if (leading) {
                    result = func.apply(context, args);
                }
                inThrottle = true;
                timerId = setTimeout(() => later(context, args), limit);
            } else if (trailing) {
                lastArgs = args;
                lastThis = context;
                
                // 确保只有一个定时器
                clearTimeout(timerId);
                timerId = setTimeout(() => later(lastThis, lastArgs), limit);
            }
            
            return result;
        };
    },
    
    /**
     * 防抖函数，延迟执行函数直到停止触发一段时间
     * 支持返回Promise
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @param {Object} options - 配置选项
     * @param {boolean} options.leading - 是否在开始时执行一次（默认false）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay, options = {}) {
        const { leading = false } = options;
        let timeout, result;
        
        const later = (context, args) => {
            result = func.apply(context, args);
        };
        
        return function() {
            const args = arguments;
            const context = this;
            const isLeadingCall = !timeout && leading;
            
            clearTimeout(timeout);
            timeout = setTimeout(() => later(context, args), delay);
            
            if (isLeadingCall) {
                result = func.apply(context, args);
            }
            
            return result;
        };
    },
    
    /**
     * 延迟函数，返回Promise的setTimeout
     * @param {number} ms - 延迟时间（毫秒）
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 转义正则表达式中的特殊字符
     * @param {string} string - 要转义的字符串
     * @returns {string} 转义后的字符串
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    
    /**
     * 安全地解析JSON字符串
     * @param {string} jsonString - JSON字符串
     * @param {*} defaultValue - 解析失败时的默认值
     * @returns {*} 解析结果或默认值
     */
    safeJSONParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.warn('[GitHub 中文翻译] JSON解析失败:', error);
            return defaultValue;
        }
    },
    
    /**
     * 安全地序列化对象为JSON字符串
     * @param {*} obj - 要序列化的对象
     * @param {string} defaultValue - 序列化失败时的默认值
     * @returns {string} JSON字符串或默认值
     */
    safeJSONStringify(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            console.warn('[GitHub 中文翻译] JSON序列化失败:', error);
            return defaultValue;
        }
    },
    
    /**
     * 获取当前页面路径
     * @returns {string} 当前页面的路径
     */
    getCurrentPath() {
        return window.location.pathname;
    },
    
    /**
     * 获取完整的当前页面URL（包含查询参数）
     * @returns {string} 完整的URL
     */
    getCurrentUrl() {
        return window.location.href;
    },
    
    /**
     * 判断当前页面是否匹配某个路径模式
     * @param {RegExp} pattern - 路径模式
     * @returns {boolean} 是否匹配
     */
    isCurrentPathMatch(pattern) {
        return pattern.test(this.getCurrentPath());
    },
    
    /**
     * 从URL获取查询参数
     * @param {string} name - 参数名
     * @param {string} url - URL字符串，默认使用当前页面URL
     * @returns {string|null} 参数值或null
     */
    getQueryParam(name, url = window.location.href) {
        const match = RegExp(`[?&]${name}=([^&]*)`).exec(url);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    },
    
    /**
     * 获取URL中的所有查询参数
     * @param {string} url - URL字符串，默认使用当前页面URL
     * @returns {Object} 查询参数对象
     */
    getAllQueryParams(url = window.location.href) {
        const params = {};
        const searchParams = new URL(url).searchParams;
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },
    
    /**
     * 收集DOM树中的所有文本节点内容
     * @param {HTMLElement} element - 要收集文本的起始元素
     * @param {Set<string>} resultSet - 用于存储结果的Set集合
     * @param {Object} options - 配置选项
     * @param {number} options.maxLength - 最大文本长度（默认200）
     * @param {string[]} options.skipTags - 跳过的标签名数组
     */
    collectTextNodes(element, resultSet, options = {}) {
        if (!element || !resultSet || typeof resultSet.add !== 'function') return;
        
        const {
            maxLength = 200,
            skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'noscript', 'template']
        } = options;
        
        try {
            // 检查是否需要跳过此元素
            if (element.tagName && skipTags.includes(element.tagName.toLowerCase())) {
                return;
            }
            
            // 检查元素是否有隐藏类或样式
            if (element.classList && element.classList.contains('sr-only')) {
                return;
            }
            
            // 遍历所有子节点
            const childNodes = Array.from(element.childNodes || []);
            for (const node of childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue ? node.nodeValue.trim() : '';
                    // 只收集符合条件的文本
                    if (text && 
                        text.length > 0 && 
                        text.length < maxLength && 
                        !/^\d+$/.test(text) &&
                        !/^[\s\p{P}\p{S}]+$/u.test(text)) {
                        resultSet.add(text);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // 递归收集子元素的文本
                    this.collectTextNodes(node, resultSet, options);
                }
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 收集文本节点时出错:', error);
        }
    },
    
    /**
     * 安全地访问对象属性，避免嵌套属性访问出错
     * @param {Object} obj - 目标对象
     * @param {string|string[]} path - 属性路径，如'a.b.c'或['a','b','c']
     * @param {*} defaultValue - 获取失败时的默认值
     * @returns {*} 属性值或默认值
     */
    getNestedProperty(obj, path, defaultValue = null) {
        try {
            const pathArray = Array.isArray(path) ? path : path.split('.');
            let result = obj;
            
            for (const key of pathArray) {
                if (result === null || result === undefined) {
                    return defaultValue;
                }
                result = result[key];
            }
            
            return result === undefined ? defaultValue : result;
        } catch (error) {
            return defaultValue;
        }
    },
    
    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
        try {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (obj instanceof Object) {
                const clonedObj = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        clonedObj[key] = this.deepClone(obj[key]);
                    }
                }
                return clonedObj;
            }
        } catch (error) {
            console.warn('[GitHub 中文翻译] 深拷贝失败:', error);
            return obj;
        }
    },
    
    /**
     * 安全地执行函数，捕获可能的异常
     * @param {Function} fn - 要执行的函数
     * @param {*} defaultValue - 执行失败时的默认返回值
     * @param {Object} context - 函数执行上下文
     * @param {...*} args - 函数参数
     * @returns {*} 函数返回值或默认值
     */
    safeExecute(fn, defaultValue = null, context = null, ...args) {
        try {
            if (typeof fn === 'function') {
                return fn.apply(context, args);
            }
            return defaultValue;
        } catch (error) {
            console.error('[GitHub 中文翻译] 安全执行函数失败:', error);
            return defaultValue;
        }
    }
};

/**
 * 版本更新检查模块
 * 负责检查和处理脚本更新
 */
/**
 * 版本检查器对象
 */
export const versionChecker = {
    /**
     * 检查版本更新
     * 支持重试机制和更详细的错误处理
     * @returns {Promise<boolean>} 检查完成的Promise，resolve为是否发现更新
     */
    async checkForUpdates() {
        // 检查是否启用了更新检查
        if (!CONFIG.updateCheck.enabled) {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 已禁用更新检查');
            }
            return false;
        }
        
        // 检查是否达到检查间隔
        const lastCheck = localStorage.getItem('githubZhLastUpdateCheck');
        const now = Date.now();
        const intervalMs = (CONFIG.updateCheck.intervalHours || 24) * 60 * 60 * 1000;
        
        if (lastCheck && now - parseInt(lastCheck) < intervalMs) {
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 未达到更新检查间隔，跳过检查 (上次检查: ${new Date(parseInt(lastCheck)).toLocaleString()})`);
            }
            return false;
        }
        
        try {
            // 记录本次检查时间
            localStorage.setItem('githubZhLastUpdateCheck', now.toString());
            
            // 使用带重试的获取方法
            const scriptContent = await this.fetchWithRetry(CONFIG.updateCheck.scriptUrl);
            
            // 提取远程版本号 - 支持多种格式
            const remoteVersion = this.extractVersion(scriptContent);
            
            if (!remoteVersion) {
                throw new Error('无法从远程脚本提取有效的版本号');
            }
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 当前版本: ${CONFIG.version}, 远程版本: ${remoteVersion}`);
            }
            
            // 比较版本号
            if (this.isNewerVersion(remoteVersion, CONFIG.version)) {
                // 显示更新通知
                this.showUpdateNotification(remoteVersion);
                
                // 如果启用了自动更新版本号
                if (CONFIG.updateCheck.autoUpdateVersion) {
                    this.updateVersionInStorage(remoteVersion);
                }
                
                // 记录版本历史
                this.recordVersionHistory(remoteVersion);
                
                return true;
            }
            
            return false;
        } catch (error) {
            const errorMsg = `[GitHub 中文翻译] 检查更新时发生错误: ${error.message || error}`;
            if (CONFIG.debugMode) {
                console.error(errorMsg, error);
            }
            
            // 记录错误日志
            try {
                localStorage.setItem('githubZhUpdateError', JSON.stringify({
                    message: error.message,
                    timestamp: now
                }));
            } catch (e) {
                // 忽略存储错误
            }
            
            return false;
        }
    },
    
    /**
     * 带重试机制的网络请求
     * @param {string} url - 请求URL
     * @param {number} maxRetries - 最大重试次数
     * @param {number} retryDelay - 重试间隔（毫秒）
     * @returns {Promise<string>} 响应文本
     */
    async fetchWithRetry(url, maxRetries = 2, retryDelay = 1000) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (CONFIG.debugMode && attempt > 0) {
                    console.log(`[GitHub 中文翻译] 重试更新检查 (${attempt}/${maxRetries})...`);
                }
                
                // 自定义超时控制
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Accept': 'text/javascript, text/plain, */*'
                    },
                    signal: controller.signal,
                    credentials: 'omit' // 不发送凭证信息
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态码: ${response.status}`);
                }
                
                return await response.text();
            } catch (error) {
                lastError = error;
                
                // 如果是最后一次尝试，则抛出错误
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 等待后重试
                await utils.delay(retryDelay * Math.pow(2, attempt)); // 指数退避策略
            }
        }
        
        throw lastError;
    },
    
    /**
     * 从脚本内容中提取版本号
     * 支持多种版本号格式
     * @param {string} content - 脚本内容
     * @returns {string|null} 提取的版本号或null
     */
    extractVersion(content) {
        // 尝试多种版本号格式
        const patterns = [
            // UserScript格式
            /\/\*\s*@version\s+(\d+\.\d+\.\d+)\s*\*\//i,
            // JavaScript注释格式
            /\/\/\s*version\s*:\s*(\d+\.\d+\.\d+)/i,
            // 变量赋值格式
            /version\s*=\s*['"](\d+\.\d+\.\d+)['"]/i,
            // 对象属性格式
            /version:\s*['"](\d+\.\d+\.\d+)['"]/i
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    },

    /**
     * 比较版本号，判断是否有新版本
     * @param {string} newVersion - 新版本号
     * @param {string} currentVersion - 当前版本号
     * @returns {boolean} 是否有新版本
     */
    isNewerVersion(newVersion, currentVersion) {
        // 将版本号转换为数组进行比较
        const newParts = newVersion.split('.').map(Number);
        const currentParts = currentVersion.split('.').map(Number);
        
        // 比较每个部分
        for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
            const newPart = newParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            
            if (newPart > currentPart) {
                return true;
            } else if (newPart < currentPart) {
                return false;
            }
        }
        
        // 版本号相同
        return false;
    },

    /**
     * 显示更新通知
     * 使用安全的DOM操作而不是innerHTML
     * @param {string} newVersion - 新版本号
     */
    showUpdateNotification(newVersion) {
        const notificationKey = 'githubZhUpdateNotificationDismissed';
        const notificationVersionKey = 'githubZhLastNotifiedVersion';
        
        // 获取最后通知的版本
        const lastNotifiedVersion = localStorage.getItem(notificationVersionKey);
        
        // 如果用户已经关闭过通知，或者已经通知过相同版本，则不显示
        if (localStorage.getItem(notificationKey) === 'dismissed' || 
            lastNotifiedVersion === newVersion) {
            if (CONFIG.debugMode && lastNotifiedVersion === newVersion) {
                console.log(`[GitHub 中文翻译] 已经通知过版本 ${newVersion} 的更新`);
            }
            return;
        }
        
        try {
            // 创建通知元素 - 安全的DOM操作
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md transform transition-all duration-300 translate-y-0 opacity-100';
            
            // 生成唯一的ID
            const notificationId = `github-zh-update-${Date.now()}`;
            notification.id = notificationId;
            
            // 创建flex容器
            const flexContainer = document.createElement('div');
            flexContainer.className = 'flex items-start';
            notification.appendChild(flexContainer);
            
            // 创建图标容器
            const iconContainer = document.createElement('div');
            iconContainer.className = 'flex-shrink-0 bg-blue-100 rounded-full p-2';
            flexContainer.appendChild(iconContainer);
            
            // 创建SVG图标
            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgIcon.setAttribute('class', 'h-6 w-6 text-blue-600');
            svgIcon.setAttribute('fill', 'none');
            svgIcon.setAttribute('viewBox', '0 0 24 24');
            svgIcon.setAttribute('stroke', 'currentColor');
            iconContainer.appendChild(svgIcon);
            
            // 创建SVG路径
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('stroke-linecap', 'round');
            pathElement.setAttribute('stroke-linejoin', 'round');
            pathElement.setAttribute('stroke-width', '2');
            pathElement.setAttribute('d', 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
            svgIcon.appendChild(pathElement);
            
            // 创建内容容器
            const contentContainer = document.createElement('div');
            contentContainer.className = 'ml-3 flex-1';
            flexContainer.appendChild(contentContainer);
            
            // 创建标题
            const titleElement = document.createElement('p');
            titleElement.className = 'text-sm font-medium text-blue-800';
            titleElement.textContent = 'GitHub 中文翻译脚本更新';
            contentContainer.appendChild(titleElement);
            
            // 创建消息文本 - 安全地设置文本内容
            const messageElement = document.createElement('p');
            messageElement.className = 'text-sm text-blue-700 mt-1';
            messageElement.textContent = `发现新版本 ${newVersion}，建议更新以获得更好的翻译体验。`;
            contentContainer.appendChild(messageElement);
            
            // 创建按钮容器
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'mt-3 flex space-x-2';
            contentContainer.appendChild(buttonsContainer);
            
            // 创建更新按钮 - 安全地设置URL
            const updateButton = document.createElement('a');
            updateButton.id = `${notificationId}-update-btn`;
            updateButton.href = CONFIG.updateCheck.scriptUrl || '#';
            updateButton.target = '_blank';
            updateButton.rel = 'noopener noreferrer';
            updateButton.className = 'inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors';
            updateButton.textContent = '立即更新';
            buttonsContainer.appendChild(updateButton);
            
            // 创建稍后按钮
            const laterButton = document.createElement('button');
            laterButton.id = `${notificationId}-later-btn`;
            laterButton.className = 'inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-transparent hover:bg-blue-50 transition-colors';
            laterButton.textContent = '稍后';
            laterButton.addEventListener('click', () => {
                this.hideNotification(notification, false);
            });
            buttonsContainer.appendChild(laterButton);
            
            // 创建不再提醒按钮
            const dismissButton = document.createElement('button');
            dismissButton.id = `${notificationId}-dismiss-btn`;
            dismissButton.className = 'inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors';
            dismissButton.textContent = '不再提醒';
            dismissButton.addEventListener('click', () => {
                this.hideNotification(notification, true);
            });
            buttonsContainer.appendChild(dismissButton);
            
            // 添加到DOM
            if (document.body) {
                document.body.appendChild(notification);
                
                // 记录本次通知的版本
                localStorage.setItem(notificationVersionKey, newVersion);
                
                // 自动隐藏（可选）
                if (CONFIG.updateCheck.autoHideNotification !== false) {
                    setTimeout(() => {
                        this.hideNotification(notification, false);
                    }, 20000); // 20秒后自动隐藏
                }
                
                if (CONFIG.debugMode) {
                    console.log(`[GitHub 中文翻译] 显示更新通知: 版本 ${newVersion}`);
                }
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 创建更新通知失败:', error);
        }
    },
    
    /**
     * 隐藏通知元素（带动画效果）
     * @param {HTMLElement} notification - 通知元素
     * @param {boolean} permanently - 是否永久隐藏
     */
    hideNotification(notification, permanently = false) {
        try {
            // 添加动画效果
            notification.style.transform = 'translateY(20px)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
            
            // 如果是永久隐藏，记录到localStorage
            if (permanently) {
                localStorage.setItem('githubZhUpdateNotificationDismissed', 'dismissed');
                if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 更新通知已永久隐藏');
                }
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 隐藏通知失败:', error);
        }
    },
    
    /**
     * 记录版本历史
     * @param {string} version - 版本号
     */
    recordVersionHistory(version) {
        try {
            const historyKey = 'githubZhVersionHistory';
            let history = utils.safeJSONParse(localStorage.getItem(historyKey), []);
            
            // 确保是数组
            if (!Array.isArray(history)) {
                history = [];
            }
            
            // 添加新版本记录
            history.push({
                version,
                detectedAt: Date.now()
            });
            
            // 限制历史记录数量
            if (history.length > 10) {
                history = history.slice(-10);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (error) {
            // 忽略存储错误
        }
    },
    
    /**
     * 更新本地存储中的版本号
     * @param {string} newVersion - 新版本号
     */
    updateVersionInStorage(newVersion) {
        try {
            const cacheData = {
                version: newVersion,
                cachedAt: Date.now(),
                currentVersion: CONFIG.version
            };
            
            localStorage.setItem('githubZhCachedVersion', utils.safeJSONStringify(cacheData));
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 已缓存新版本号: ${newVersion} (缓存时间: ${new Date().toLocaleString()})`);
            }
            
            return true;
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 更新缓存版本号时出错:', error);
            }
            return false;
        }
    },
    
    /**
     * 获取缓存的版本信息
     * @returns {Object|null} 缓存的版本数据
     */
    getCachedVersion() {
        try {
            const cachedData = utils.safeJSONParse(localStorage.getItem('githubZhCachedVersion'));
            return cachedData;
        } catch (error) {
            return null;
        }
    },
    
    /**
     * 清除更新通知的忽略状态
     * 允许再次显示更新通知
     */
    clearNotificationDismissal() {
        try {
            localStorage.removeItem('githubZhUpdateNotificationDismissed');
            localStorage.removeItem('githubZhLastNotifiedVersion');
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 已清除更新通知忽略状态');
            }
            
            return true;
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 清除通知忽略状态失败:', error);
            }
            return false;
        }
    }
};

/**
 * 翻译词典合并模块
 * 整合所有页面的翻译词典
 */
/**
 * 翻译词典对象，包含所有需要翻译的字符串
 */
export const translationModule = {
    "common": commonDictionary,
    "codespaces": codespacesDictionary,
    "explore": exploreDictionary
    // 可以根据需要添加更多页面的词典
};

/**
 * 合并所有词典为一个完整的词典对象
 * @returns {Object} 合并后的词典
 */
export function mergeAllDictionaries() {
    const merged = {};
    for (const module in translationModule) {
        Object.assign(merged, translationModule[module]);
    }
    return merged;
}

/**
 * Codespaces 页面翻译词典
 */

export const codespacesDictionary = {
    "Skip to content": "待翻译: Skip to content",
    "You signed in with another tab or window. Reload to refresh your session.": "待翻译: You signed in with another tab or window. Reload to refresh your session.",
    "Reload": "待翻译: Reload",
    "You signed out in another tab or window. Reload to refresh your session.": "待翻译: You signed out in another tab or window. Reload to refresh your session.",
    "Dismiss alert": "待翻译: Dismiss alert",
    "Uh oh!\n\n              There was an error while loading. Please reload this page.": "待翻译: Uh oh!\n\n              There was an error while loading. Please reload this page.",
    "Uh oh!": "待翻译: Uh oh!",
    "There was an error while loading. Please reload this page.": "待翻译: There was an error while loading. Please reload this page.",
    "Please reload this page": "待翻译: Please reload this page",
    "Sign in with a passkey": "待翻译: Sign in with a passkey",
    "Terms": "待翻译: Terms",
    "Privacy": "待翻译: Privacy",
    "Docs": "待翻译: Docs",
    "Manage cookies": "待翻译: Manage cookies",
    "Do not share my personal information": "待翻译: Do not share my personal information",
    "You can't perform that action at this time.": "待翻译: You can't perform that action at this time."
};

/**
 * Explore 页面翻译词典
 */

export const exploreDictionary = {
    "Navigation Menu": "待翻译: Navigation Menu",
    "Toggle navigation": "待翻译: Toggle navigation",
    "Sign in\n          \n              \n    \n        \n    \n\nAppearance settings": "待翻译: Sign in\n          \n              \n    \n        \n    \n\nAppearance settings",
    "Sign in": "待翻译: Sign in",
    "Appearance settings": "待翻译: Appearance settings",
    "New": "待翻译: New",
    "Actions\n\n        \n\n        Automate any workflow": "待翻译: Actions\n\n        \n\n        Automate any workflow",
    "Actions": "待翻译: Actions",
    "Codespaces\n\n        \n\n        Instant dev environments": "待翻译: Codespaces\n\n        \n\n        Instant dev environments",
    "Issues\n\n        \n\n        Plan and track work": "待翻译: Issues\n\n        \n\n        Plan and track work",
    "Issues": "待翻译: Issues",
    "Code Review\n\n        \n\n        Manage code changes": "待翻译: Code Review\n\n        \n\n        Manage code changes",
    "Code Review": "待翻译: Code Review",
    "Discussions\n\n        \n\n        Collaborate outside of code": "待翻译: Discussions\n\n        \n\n        Collaborate outside of code",
    "Code Search\n\n        \n\n        Find more, search less": "待翻译: Code Search\n\n        \n\n        Find more, search less",
    "Code Search": "待翻译: Code Search",
    "Explore": "待翻译: Explore",
    "Blog": "待翻译: Blog",
    "MCP Registry": "待翻译: MCP Registry",
    "View all features": "待翻译: View all features",
    "By company size": "待翻译: By company size",
    "Small and medium teams": "待翻译: Small and medium teams",
    "By use case": "待翻译: By use case",
    "App Modernization": "待翻译: App Modernization",
    "DevOps": "待翻译: DevOps",
    "CI/CD": "待翻译: CI/CD",
    "View all use cases": "待翻译: View all use cases",
    "By industry": "待翻译: By industry",
    "Financial services": "待翻译: Financial services",
    "View all industries": "待翻译: View all industries",
    "View all solutions": "待翻译: View all solutions",
    "Topics": "待翻译: Topics",
    "AI": "待翻译: AI",
    "Software Development": "待翻译: Software Development",
    "View all": "待翻译: View all",
    "Learning Pathways": "待翻译: Learning Pathways",
    "Events & Webinars": "待翻译: Events & Webinars",
    "Ebooks & Whitepapers": "待翻译: Ebooks & Whitepapers",
    "Customer Stories": "待翻译: Customer Stories",
    "Executive Insights": "待翻译: Executive Insights",
    "Open Source": "待翻译: Open Source",
    "The ReadME Project": "待翻译: The ReadME Project",
    "Enterprise platform\n\n        \n\n        AI-powered developer platform": "待翻译: Enterprise platform\n\n        \n\n        AI-powered developer platform",
    "Enterprise platform": "待翻译: Enterprise platform",
    "Available add-ons": "待翻译: Available add-ons",
    "Copilot for business\n\n        \n\n        Enterprise-grade AI features": "待翻译: Copilot for business\n\n        \n\n        Enterprise-grade AI features",
    "Copilot for business": "待翻译: Copilot for business",
    "Premium Support\n\n        \n\n        Enterprise-grade 24/7 support": "待翻译: Premium Support\n\n        \n\n        Enterprise-grade 24/7 support",
    "Premium Support": "待翻译: Premium Support",
    "Pricing": "待翻译: Pricing",
    "Search or jump to...": "待翻译: Search or jump to...",
    "Search": "待翻译: Search",
    "Clear": "待翻译: Clear",
    "Search syntax tips": "待翻译: Search syntax tips",
    "Provide feedback": "待翻译: Provide feedback",
    "We read every piece of feedback, and take your input very seriously.": "待翻译: We read every piece of feedback, and take your input very seriously.",
    "Cancel\n\n              Submit feedback": "待翻译: Cancel\n\n              Submit feedback",
    "Cancel": "待翻译: Cancel",
    "Submit feedback": "待翻译: Submit feedback",
    "Saved searches\n      \n        Use saved searches to filter your results more quickly": "待翻译: Saved searches\n      \n        Use saved searches to filter your results more quickly",
    "Saved searches": "待翻译: Saved searches",
    "Use saved searches to filter your results more quickly": "待翻译: Use saved searches to filter your results more quickly",
    "Name": "待翻译: Name",
    "Query": "待翻译: Query",
    "To see all available qualifiers, see our documentation.": "待翻译: To see all available qualifiers, see our documentation.",
    "Cancel\n\n              Create saved search": "待翻译: Cancel\n\n              Create saved search",
    "Create saved search": "待翻译: Create saved search",
    "Sign up": "待翻译: Sign up",
    "Resetting focus": "待翻译: Resetting focus",
    "Events": "待翻译: Events",
    "Collections\n    Curated lists and insight into burgeoning industries, topics, and communities.": "待翻译: Collections\n    Curated lists and insight into burgeoning industries, topics, and communities.",
    "Curated lists and insight into burgeoning industries, topics, and communities.": "待翻译: Curated lists and insight into burgeoning industries, topics, and communities.",
    "Pixel Art Tools": "待翻译: Pixel Art Tools",
    "Learn to Code\n    Resources to help people learn to code": "待翻译: Learn to Code\n    Resources to help people learn to code",
    "Learn to Code": "待翻译: Learn to Code",
    "Resources to help people learn to code": "待翻译: Resources to help people learn to code",
    "#\n    Game Engines\n    Frameworks for building games across multiple platforms.": "待翻译: #\n    Game Engines\n    Frameworks for building games across multiple platforms.",
    "Game Engines": "待翻译: Game Engines",
    "Frameworks for building games across multiple platforms.": "待翻译: Frameworks for building games across multiple platforms.",
    "How to choose (and contribute to) your first open source project": "待翻译: How to choose (and contribute to) your first open source project",
    "Clean code linters": "待翻译: Clean code linters",
    "Open journalism": "待翻译: Open journalism",
    "Design essentials": "待翻译: Design essentials",
    "#\n    \n\n    \n      Music\n      Drop the code bass with these musically themed repositories.": "待翻译: #\n    \n\n    \n      Music\n      Drop the code bass with these musically themed repositories.",
    "Music\n      Drop the code bass with these musically themed repositories.": "待翻译: Music\n      Drop the code bass with these musically themed repositories.",
    "Music": "待翻译: Music",
    "Government apps": "待翻译: Government apps",
    "DevOps tools": "待翻译: DevOps tools",
    "Front-end JavaScript frameworks": "待翻译: Front-end JavaScript frameworks",
    "Hacking Minecraft": "待翻译: Hacking Minecraft",
    "JavaScript Game Engines": "待翻译: JavaScript Game Engines",
    "Learn to Code\n      Resources to help people learn to code": "待翻译: Learn to Code\n      Resources to help people learn to code",
    "Getting started with machine learning": "待翻译: Getting started with machine learning",
    "Made in Africa": "待翻译: Made in Africa",
    "Net neutrality\n      Software, research, and organizations protecting the free and open internet.": "待翻译: Net neutrality\n      Software, research, and organizations protecting the free and open internet.",
    "Net neutrality": "待翻译: Net neutrality",
    "Open data": "待翻译: Open data",
    "Open source organizations\n      A showcase of organizations showcasing their open source projects.": "待翻译: Open source organizations\n      A showcase of organizations showcasing their open source projects.",
    "Open source organizations": "待翻译: Open source organizations",
    "Software productivity tools": "待翻译: Software productivity tools",
    "Load more…": "待翻译: Load more…",
    "Footer": "待翻译: Footer",
    "Footer navigation": "待翻译: Footer navigation",
    "Status": "待翻译: Status",
    "Contact": "待翻译: Contact",
    "The Download": "待翻译: The Download",
    "Get the latest developer and open source news": "待翻译: Get the latest developer and open source news",
    "Trending repository": "待翻译: Trending repository",
    "juspay          /\n          hyperswitch": "待翻译: juspay          /\n          hyperswitch",
    "juspay": "待翻译: juspay",
    "Star\n          35.6k": "待翻译: Star\n          35.6k",
    "Star": "待翻译: Star",
    "35.6k": "待翻译: 35.6k",
    "Code": "待翻译: Code",
    "Pull requests": "待翻译: Pull requests",
    "An open source payments switch written in Rust to make payments fast, reliable and affordable": "待翻译: An open source payments switch written in Rust to make payments fast, reliable and affordable",
    "rust": "待翻译: rust",
    "redis": "待翻译: redis",
    "open-source": "待翻译: open-source",
    "finance": "待翻译: finance",
    "sdk": "待翻译: sdk",
    "high-performance": "待翻译: high-performance",
    "beginner-friendly": "待翻译: beginner-friendly",
    "works-with-react": "待翻译: works-with-react",
    "Updated\n            Oct 4, 2025": "待翻译: Updated\n            Oct 4, 2025"
};

/**
 * 翻译核心模块
 * 负责页面内容的实际翻译工作
 */
/**
 * 翻译核心对象
 */
export const translationCore = {
    /**
     * 合并后的完整词典
     * @type {Object}
     */
    dictionary: {},
    
    /**
     * 翻译缓存，用于存储已翻译过的文本
     * @type {Map<string, string>}
     */
    translationCache: new Map(),
    
    /**
     * 性能监控数据
     */
    performanceData: {
        translateStartTime: 0,
        elementsProcessed: 0,
        textsTranslated: 0,
        cacheHits: 0,
        cacheMisses: 0
    },
    
    /**
     * 初始化词典
     */
    initDictionary() {
        if (CONFIG.debugMode) {
            console.time('[GitHub 中文翻译] 词典初始化');
        }
        
        this.dictionary = mergeAllDictionaries();
        
        if (CONFIG.debugMode) {
            console.timeEnd('[GitHub 中文翻译] 词典初始化');
            console.log(`[GitHub 中文翻译] 词典条目数量: ${Object.keys(this.dictionary).length}`);
        }
    },
    
    /**
     * 执行翻译
     * 支持翻译整个页面或指定的元素区域
     * @param {HTMLElement[]} [targetElements] - 可选的目标元素数组，只翻译这些元素
     * @returns {Promise<void>} 翻译完成的Promise
     */
    translate(targetElements = null) {
        // 确保词典已初始化
        if (!this.dictionary || Object.keys(this.dictionary).length === 0) {
            this.initDictionary();
        }
        
        // 重置性能统计数据
        this.resetPerformanceData();
        this.performanceData.translateStartTime = Date.now();
        
        return new Promise((resolve, reject) => {
            try {
                let elements;
                
                if (Array.isArray(targetElements)) {
                    // 如果提供了目标元素，只翻译这些元素
                    elements = targetElements.filter(el => el && el instanceof HTMLElement);
                    if (CONFIG.debugMode) {
                        console.log(`[GitHub 中文翻译] 翻译特定区域，目标元素数量: ${elements.length}`);
                    }
                } else {
                    // 否则翻译整个页面
                    elements = this.getElementsToTranslate();
                    if (CONFIG.debugMode) {
                        console.log(`[GitHub 中文翻译] 翻译整个页面，目标元素数量: ${elements.length}`);
                    }
                }
                
                // 检查是否有元素需要翻译
                if (!elements || elements.length === 0) {
                    if (CONFIG.debugMode) {
                        console.log('[GitHub 中文翻译] 没有找到需要翻译的元素');
                    }
                    this.logPerformanceData();
                    resolve();
                    return;
                }
                
                // 批量处理元素，避免长时间运行导致UI阻塞
                this.processElementsInBatches(elements)
                    .then(() => {
                        // 记录性能数据
                        this.logPerformanceData();
                        resolve();
                    })
                    .catch((batchError) => {
                        if (CONFIG.debugMode) {
                            console.error('[GitHub 中文翻译] 批处理过程中出错:', batchError);
                        }
                        
                        // 错误恢复机制：尝试继续执行基本翻译
                            try {
                                if (CONFIG.debugMode) {
                                    console.log('[GitHub 中文翻译] 尝试错误恢复，执行最小化翻译');
                                }
                                this.translateCriticalElementsOnly()
                                    .then(() => {
                                        this.logPerformanceData();
                                        resolve(); // 即使有错误，也尽量完成基本翻译
                                    })
                                    .catch((recoverError) => {
                                        if (CONFIG.debugMode) {
                                            console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
                                        }
                                        this.logPerformanceData();
                                        reject(recoverError);
                                    });
                            } catch (recoverError) {
                                if (CONFIG.debugMode) {
                                    console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
                                }
                                this.logPerformanceData();
                                reject(recoverError);
                            }
                    });
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.error('[GitHub 中文翻译] 翻译过程中出错:', error);
                }
                
                // 错误恢复机制：尝试继续执行基本翻译
                try {
                    if (CONFIG.debugMode) {
                        console.log('[GitHub 中文翻译] 尝试错误恢复，执行最小化翻译');
                    }
                    this.translateCriticalElementsOnly()
                        .then(() => {
                            this.logPerformanceData();
                            resolve(); // 即使有错误，也尽量完成基本翻译
                        })
                        .catch((recoverError) => {
                            if (CONFIG.debugMode) {
                                console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
                            }
                            this.logPerformanceData();
                            reject(recoverError);
                        });
                } catch (recoverError) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
                    }
                    this.logPerformanceData();
                    reject(recoverError);
                }
            }
        });
    },
    
    /**
     * 重置性能统计数据
     */
    resetPerformanceData() {
        this.performanceData = {
            translateStartTime: 0,
            elementsProcessed: 0,
            textsTranslated: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    },
    
    /**
     * 记录性能数据
     */
    logPerformanceData() {
        if (CONFIG.debugMode && CONFIG.performance.logTiming) {
            const duration = Date.now() - this.performanceData.translateStartTime;
            console.log(`[GitHub 中文翻译] 翻译完成 - 耗时: ${duration}ms, 处理元素: ${this.performanceData.elementsProcessed}, ` +
                      `翻译文本: ${this.performanceData.textsTranslated}, 缓存命中: ${this.performanceData.cacheHits}, ` +
                      `缓存未命中: ${this.performanceData.cacheMisses}`);
        }
    },
    
    /**
     * 分批处理元素
     * 避免单次处理过多元素导致UI阻塞
     * @param {HTMLElement[]} elements - 要处理的元素数组
     * @returns {Promise<void>} 处理完成的Promise
     */
    processElementsInBatches(elements) {
        const batchSize = CONFIG.performance.batchSize || 50; // 每批处理的元素数量
        const delay = CONFIG.performance.batchDelay || 0; // 批处理之间的延迟
        
        // 如果元素数组为空或无效，直接返回
        if (!elements || !Array.isArray(elements) || elements.length === 0) {
            return Promise.resolve();
        }
        
        // 过滤掉无效元素
        const validElements = elements.filter(element => element instanceof HTMLElement);
        
        // 如果元素数量较少，直接处理
        if (validElements.length <= batchSize) {
            validElements.forEach(element => {
                try {
                    this.translateElement(element);
                } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 翻译元素时出错:', error, element);
                    }
                }
            });
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            // 分批处理
            const processBatch = (startIndex) => {
                try {
                    const endIndex = Math.min(startIndex + batchSize, validElements.length);
                    const batch = validElements.slice(startIndex, endIndex);
                    
                    // 批量处理当前批次
                    batch.forEach(element => {
                        try {
                            this.translateElement(element);
                        } catch (error) {
                            if (CONFIG.debugMode) {
                                console.error('[GitHub 中文翻译] 翻译元素时出错:', error, element);
                            }
                        }
                    });
                    
                    // 性能日志记录
                    if (CONFIG.performance.logTiming && (endIndex % (batchSize * 5) === 0 || endIndex === validElements.length)) {
                        const progress = Math.round((endIndex / validElements.length) * 100);
                        console.log(`[GitHub 中文翻译] 翻译进度: ${progress}%, 已处理: ${endIndex}/${validElements.length} 元素`);
                    }
                    
                    if (endIndex < validElements.length) {
                        // 继续处理下一批
                        if (delay > 0) {
                            setTimeout(() => processBatch(endIndex), delay);
                        } else {
                            // 使用requestAnimationFrame确保UI线程不被阻塞
                            requestAnimationFrame(() => processBatch(endIndex));
                        }
                    } else {
                        // 所有批次处理完成
                        resolve();
                    }
                } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 批处理时出错:', error);
                    }
                    resolve(); // 即使出错也要完成Promise
                }
            };
            
            // 开始处理第一批
            processBatch(0);
        });
    },
    
    /**
     * 仅翻译关键元素
     * 用于错误恢复时的最小化翻译
     * @returns {Promise<void>} 翻译完成的Promise
     */
    translateCriticalElementsOnly() {
        return new Promise((resolve) => {
            const criticalSelectors = [
                '.Header',
                '.repository-content',
                '.js-repo-pjax-container',
                'main'
            ];
            
            const criticalElements = [];
            let processedElements = 0;
            let failedElements = 0;
            
            // 安全地获取关键元素
            criticalSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    if (elements && elements.length > 0) {
                        Array.from(elements).forEach(el => {
                            if (el && el instanceof HTMLElement) {
                                criticalElements.push(el);
                            }
                        });
                        
                        if (CONFIG.debugMode) {
                            console.log(`[GitHub 中文翻译] 找到关键元素: ${selector}, 数量: ${elements.length}`);
                        }
                    }
                } catch (err) {
                    if (CONFIG.debugMode) {
                        console.warn(`[GitHub 中文翻译] 查询选择器失败: ${selector}`, err);
                    }
                    // 继续处理其他选择器
                }
            });
            
            // 如果没有找到任何关键元素，直接返回
            if (criticalElements.length === 0) {
                if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 没有找到关键元素需要翻译');
                }
                resolve();
                return;
            }
            
            // 处理所有关键元素
            criticalElements.forEach(element => {
                try {
                    this.translateElement(element);
                    processedElements++;
                } catch (err) {
                    failedElements++;
                    if (CONFIG.debugMode) {
                        console.warn('[GitHub 中文翻译] 关键元素翻译失败:', err, element);
                    }
                }
            });
            
            // 记录统计信息
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 关键元素翻译完成 - 总数量: ${criticalElements.length}, 成功: ${processedElements}, 失败: ${failedElements}`);
            }
            
            resolve();
        });
    },
    
    /**
     * 获取需要翻译的元素
     * 性能优化：使用查询优化和缓存策略
     * @returns {HTMLElement[]} 需要翻译的元素数组
     */
    getElementsToTranslate() {
        // 使用Set避免重复添加元素，提高性能
        const uniqueElements = new Set();
        
        // 合并所有选择器
        const allSelectors = [...CONFIG.selectors.primary, ...CONFIG.selectors.popupMenus];
        
        // 优化：一次性查询所有选择器（如果数量合适）
        if (allSelectors.length <= 10) { // 避免选择器过长
            const combinedSelector = allSelectors.join(', ');
            try {
                const allElements = document.querySelectorAll(combinedSelector);
                Array.from(allElements).forEach(element => {
                    if (this.shouldTranslateElement(element)) {
                        uniqueElements.add(element);
                    }
                });
                if (CONFIG.debugMode && CONFIG.performance.logTiming) {
                    console.log(`[GitHub 中文翻译] 合并查询选择器: ${combinedSelector}, 结果数量: ${allElements.length}`);
                }
                return Array.from(uniqueElements);
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.warn('[GitHub 中文翻译] 合并选择器查询失败，回退到逐个查询:', error);
                }
                // 合并查询失败，回退到逐个查询
            }
        }
        
        // 逐个查询选择器
        allSelectors.forEach(selector => {
            try {
                const matchedElements = document.querySelectorAll(selector);
                Array.from(matchedElements).forEach(element => {
                    // 过滤不应该翻译的元素
                    if (this.shouldTranslateElement(element)) {
                        uniqueElements.add(element);
                    }
                });
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.warn(`[GitHub 中文翻译] 选择器 "${selector}" 解析失败:`, error);
                }
            }
        });
        
        // 过滤无效元素
        return Array.from(uniqueElements).filter(element => element instanceof HTMLElement);
    },
    
    /**
     * 判断元素是否应该被翻译
     * 优化版：增加更多过滤条件和快速路径
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} 是否应该翻译
     */
    shouldTranslateElement(element) {
        // 快速路径：无效元素检查
        if (!element || !(element instanceof HTMLElement)) {
            return false;
        }
        
        // 快速路径：检查是否已翻译
        if (element.hasAttribute('data-github-zh-translated')) {
            return false;
        }
        
        // 快速路径：检查是否有内容
        if (!element.textContent.trim()) {
            return false;
        }
        
        // 避免翻译特定类型的元素
        const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'img', 'svg', 'canvas', 'video', 'audio'];
        const tagName = element.tagName.toLowerCase();
        if (skipTags.includes(tagName)) {
            return false;
        }
        
        // 避免翻译具有特定属性的元素
        if (element.hasAttribute('data-no-translate') || 
            element.hasAttribute('translate') && element.getAttribute('translate') === 'no' ||
            element.hasAttribute('aria-hidden') ||
            element.hasAttribute('hidden')) {
            return false;
        }
        
        // 检查类名 - 优化：使用正则表达式提高匹配效率
        const className = element.className;
        if (className) {
            // 编译正则表达式并缓存（但在这个函数范围内无法缓存）
            const skipClassPatterns = [
                /language-\w+/,
                /highlight/,
                /token/,
                /no-translate/,
                /octicon/,
                /emoji/,
                /avatar/,
                /timestamp/,
                /numeral/,
                /filename/,
                /hash/,
                /sha/,
                /shortsha/,
                /hex-color/,
                /code/,
                /gist/,
                /language-/,
                /markdown-/, 
                /monaco-editor/,
                /syntax-/,
                /highlight-/,
                /clipboard/,
                /progress-/, 
                /count/,
                /size/,
                /time/,
                /date/,
                /sortable/,
                /label/,
                /badge/,
                /url/,
                /email/,
                /key/,
                /token/,
                /user-name/,
                /repo-name/
            ];
            
            if (skipClassPatterns.some(pattern => pattern.test(className))) {
                return false;
            }
        }
        
        // 检查ID - 通常技术/数据相关ID不翻译
        const id = element.id;
        if (id) {
            const skipIdPatterns = [
                /\d+/,
                /-\d+/,
                /_\d+/,
                /sha-/, 
                /hash-/, 
                /commit-/, 
                /issue-/, 
                /pull-/, 
                /pr-/, 
                /repo-/, 
                /user-/, 
                /file-/, 
                /blob-/, 
                /tree-/, 
                /branch-/, 
                /tag-/, 
                /release-/, 
                /gist-/, 
                /discussion-/, 
                /comment-/, 
                /review-/, 
                /workflow-/, 
                /action-/, 
                /job-/, 
                /step-/, 
                /runner-/, 
                /package-/, 
                /registry-/, 
                /marketplace-/, 
                /organization-/, 
                /team-/, 
                /project-/, 
                /milestone-/, 
                /label-/, 
                /assignee-/, 
                /reporter-/, 
                /reviewer-/, 
                /author-/, 
                /committer-/, 
                /contributor-/, 
                /sponsor-/, 
                /funding-/, 
                /donation-/, 
                /payment-/, 
                /billing-/, 
                /plan-/, 
                /subscription-/, 
                /license-/, 
                /secret-/, 
                /key-/, 
                /token-/, 
                /password-/, 
                /credential-/, 
                /certificate-/, 
                /ssh-/, 
                /git-/, 
                /clone-/, 
                /push-/, 
                /pull-/, 
                /fetch-/, 
                /merge-/, 
                /rebase-/, 
                /cherry-pick-/, 
                /reset-/, 
                /revert-/, 
                /tag-/, 
                /branch-/, 
                /commit-/, 
                /diff-/, 
                /patch-/, 
                /stash-/, 
                /ref-/, 
                /head-/, 
                /remote-/, 
                /upstream-/, 
                /origin-/, 
                /local-/, 
                /tracking-/, 
                /merge-base-/, 
                /conflict-/, 
                /resolve-/, 
                /status-/, 
                /log-/, 
                /blame-/, 
                /bisect-/, 
                /grep-/, 
                /find-/, 
                /filter-/, 
                /archive-/, 
                /submodule-/, 
                /worktree-/, 
                /lfs-/, 
                /graphql-/, 
                /rest-/, 
                /api-/, 
                /webhook-/, 
                /event-/, 
                /payload-/, 
                /callback-/, 
                /redirect-/, 
                /oauth-/, 
                /sso-/, 
                /ldap-/, 
                /saml-/, 
                /2fa-/, 
                /mfa-/, 
                /security-/, 
                /vulnerability-/, 
                /cve-/, 
                /dependency-/, 
                /alert-/, 
                /secret-scanning-/, 
                /code-scanning-/, 
                /codeql-/, 
                /actions-/, 
                /workflow-/, 
                /job-/, 
                /step-/, 
                /runner-/, 
                /artifact-/, 
                /cache-/, 
                /environment-/, 
                /deployment-/, 
                /app-/, 
                /oauth-app-/, 
                /github-app-/, 
                /integration-/, 
                /webhook-/, 
                /marketplace-/, 
                /listing-/, 
                /subscription-/, 
                /billing-/, 
                /plan-/, 
                /usage-/, 
                /limits-/, 
                /quota-/, 
                /traffic-/, 
                /analytics-/, 
                /insights-/, 
                /search-/, 
                /explore-/, 
                /trending-/, 
                /stars-/, 
                /forks-/, 
                /watchers-/, 
                /contributors-/, 
                /activity-/, 
                /events-/, 
                /notifications-/, 
                /feeds-/, 
                /dashboard-/, 
                /profile-/, 
                /settings-/, 
                /preferences-/, 
                /billing-/, 
                /organization-/, 
                /team-/, 
                /project-/, 
                /milestone-/, 
                /label-/, 
                /assignee-/, 
                /reporter-/, 
                /reviewer-/, 
                /author-/, 
                /committer-/, 
                /contributor-/, 
                /sponsor-/, 
                /funding-/, 
                /donation-/, 
                /payment-/,
                /\b\w+[0-9]\w*\b/ // 包含数字的单词
            ];
            
            if (skipIdPatterns.some(pattern => pattern.test(id))) {
                return false;
            }
        }
        
        // 检查元素是否隐藏
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.display === 'none' || 
            computedStyle.visibility === 'hidden' || 
            computedStyle.opacity === '0' ||
            computedStyle.position === 'absolute' && computedStyle.left === '-9999px') {
            return false;
        }
        
        // 检查内容是否全是数字或代码相关字符
        const textContent = element.textContent.trim();
        if (textContent.length === 0) {
            return false;
        }
        
        // 检查是否全是数字和特殊符号
        if (/^[0-9.,\s\-\+\(\)\[\]\{\}\/\*\^\$\#\@\!\~\`\|\:\;"'\?\>]+\$/i.test(textContent)) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 翻译单个元素
     * 性能优化：使用更高效的DOM遍历和翻译策略
     * @param {HTMLElement} element - 要翻译的元素
     * @returns {boolean} 是否成功翻译了元素
     */
    translateElement(element) {
        // 快速检查：避免无效元素
        if (!element || !(element instanceof HTMLElement)) {
            return false;
        }
        
        // 性能优化：检查是否已翻译，避免重复翻译
        if (element.hasAttribute('data-github-zh-translated')) {
            return false;
        }
        
        // 增加性能计数
        this.performanceData.elementsProcessed++;
        
        // 检查是否应该翻译该元素
        if (!this.shouldTranslateElement(element)) {
            // 即使不翻译，也标记为已检查，避免重复检查
            element.setAttribute('data-github-zh-translated', 'checked');
            return false;
        }
        
        // 优化：使用文档片段批量处理，减少DOM操作
        const fragment = document.createDocumentFragment();
        let hasTranslation = false;
        
        // 获取子节点的快照，避免在遍历过程中修改DOM导致的问题
        const childNodes = Array.from(element.childNodes);
        const textNodesToProcess = [];
        
        // 先收集所有文本节点
        for (const node of childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const trimmedText = node.nodeValue.trim();
                if (trimmedText && trimmedText.length >= CONFIG.performance.minTextLengthToTranslate) {
                    textNodesToProcess.push(node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // 对于子元素，使用递归处理
                // 但先移除，稍后再添加到片段中
                element.removeChild(node);
                fragment.appendChild(node);
                
                // 递归翻译子元素
                const childTranslated = this.translateElement(node);
                hasTranslation = hasTranslation || childTranslated;
            }
        }
        
        // 处理所有文本节点
        textNodesToProcess.forEach(node => {
            // 保存原始节点位置的引用
            const nextSibling = node.nextSibling;
            const parentNode = node.parentNode;
            
            // 移除原始节点
            parentNode.removeChild(node);
            
            const originalText = node.nodeValue;
            const translatedText = this.getTranslatedText(originalText);
            
            // 如果有翻译结果且与原文不同，创建翻译后的文本节点
            if (translatedText && translatedText !== originalText) {
                // 创建新的文本节点
                const translatedNode = document.createTextNode(translatedText);
                fragment.appendChild(translatedNode);
                
                hasTranslation = true;
                this.performanceData.textsTranslated++;
            } else {
                // 没有翻译，保留原始节点
                fragment.appendChild(node);
            }
        });
        
        // 将处理后的片段重新添加到原始位置
        if (fragment.hasChildNodes()) {
            if (element.firstChild) {
                element.insertBefore(fragment, element.firstChild);
            } else {
                element.appendChild(fragment);
            }
        }
        
        // 标记为已翻译
        if (hasTranslation) {
            element.setAttribute('data-github-zh-translated', 'true');
        } else {
            // 标记为已检查但未翻译，避免重复检查
            element.setAttribute('data-github-zh-translated', 'checked');
        }
        
        return hasTranslation;
    },
    
    /**
     * 获取文本的翻译结果
     * 优化版：改进缓存策略、添加更智能的文本处理
     * @param {string} text - 原始文本
     * @returns {string|null} 翻译后的文本，如果没有找到翻译则返回null
     */
    getTranslatedText(text) {
        // 边界条件快速检查
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return text;
        }
        
        // 去除文本中的多余空白字符
        const normalizedText = text.trim();
        
        // 快速路径：非常短的文本通常不需要翻译
        if (normalizedText.length < CONFIG.performance.minTextLengthToTranslate) {
            return null;
        }
        
        // 检查缓存 - 使用Map的O(1)查找
        if (CONFIG.performance.enableTranslationCache && this.translationCache.has(normalizedText)) {
            this.performanceData.cacheHits++;
            return this.translationCache.get(normalizedText);
        }
        
        // 记录缓存未命中
        this.performanceData.cacheMisses++;
        
        // 尝试不同的规范化形式进行匹配
        let result = null;
        
        // 1. 尝试精确匹配（已经规范化的文本）
        if (this.dictionary[normalizedText]) {
            const translation = this.dictionary[normalizedText];
            // 避免返回标记为待翻译的文本
            if (!translation.startsWith('待翻译: ')) {
                result = translation;
            }
        }
        
        // 2. 尝试不区分大小写的匹配（仅当文本长度小于某个阈值）
        if (result === null && normalizedText.length <= 100) { // 避免对过长文本进行大小写转换
            const lowerCaseText = normalizedText.toLowerCase();
            const upperCaseText = normalizedText.toUpperCase();
            
            if (this.dictionary[lowerCaseText]) {
                const translation = this.dictionary[lowerCaseText];
                if (!translation.startsWith('待翻译: ')) {
                    result = translation;
                }
            } else if (this.dictionary[upperCaseText]) {
                const translation = this.dictionary[upperCaseText];
                if (!translation.startsWith('待翻译: ')) {
                    result = translation;
                }
            }
        }
        
        // 3. 如果启用了部分匹配且尚未找到结果
        if (result === null && CONFIG.performance.enablePartialMatch) {
            result = this.performPartialTranslation(normalizedText);
        }
        
        // 更新缓存 - 优化：根据文本长度选择是否缓存
        if (CONFIG.performance.enableTranslationCache && 
            normalizedText.length <= CONFIG.performance.maxCachedTextLength) {
            // 智能缓存管理
            if (this.translationCache.size >= CONFIG.performance.maxDictSize) {
                this.cleanCache();
            }
            
            // 只缓存翻译结果不为null的文本
            if (result !== null) {
                this.translationCache.set(normalizedText, result);
            }
        }
        
        return result;
    },
    
    /**
     * 执行部分翻译匹配
     * 优化版：使用智能匹配算法和优先级排序
     * @param {string} text - 要翻译的文本
     * @returns {string|null} - 翻译后的文本
     */
    performPartialTranslation(text) {
        // 性能优化：预先计算长度，避免重复计算
        const textLen = text.length;
        
        // 快速路径：非常短的文本不进行部分匹配
        if (textLen < 5) {
            return null;
        }
        
        // 收集所有匹配项
        const matches = [];
        
        // 优化：仅考虑长度合适的字典键，避免不必要的匹配
        const minKeyLength = Math.min(4, Math.floor(textLen / 2)); // 最小键长度至少为4或文本长度的一半
        
        // 筛选可能匹配的键
        for (const [key, value] of Object.entries(this.dictionary)) {
            // 快速检查
            if (key.length < minKeyLength || 
                key.length > textLen || 
                value.startsWith('待翻译: ') ||
                // 避免对纯数字或特殊字符的匹配
                /^[0-9.,\s\-\+\(\)\[\]\{\}\/\*\^\$\#\@\!\~\`\|\:\;"'\?\>]+$/i.test(key)) {
                continue;
            }
            
            // 使用更高效的匹配算法
            // 先检查是否包含，再使用正则确认是完整单词
            if (text.includes(key)) {
                // 尝试将key视为一个完整的单词进行匹配
                // 使用单词边界的正则表达式
                const wordRegex = new RegExp(`\\b${utils.escapeRegExp(key)}\\b`, 'gi');
                const wordMatches = text.match(wordRegex);
                
                if (wordMatches && wordMatches.length > 0) {
                    // 记录匹配项，按匹配长度排序
                    matches.push({
                        key,
                        value,
                        length: key.length,
                        matches: wordMatches.length,
                        regex: wordRegex
                    });
                } else {
                    // 如果不是完整单词，也记录匹配项
                    matches.push({
                        key,
                        value,
                        length: key.length,
                        matches: 1,
                        regex: new RegExp(utils.escapeRegExp(key), 'g')
                    });
                }
            }
        }
        
        // 如果没有匹配项，返回null
        if (matches.length === 0) {
            return null;
        }
        
        // 按匹配优先级排序
        // 1. 长度（更长的匹配优先）
        // 2. 匹配次数（匹配次数多的优先）
        matches.sort((a, b) => {
            if (b.length !== a.length) {
                return b.length - a.length;
            }
            return b.matches - a.matches;
        });
        
        // 执行替换
        let result = text;
        let hasReplaced = false;
        
        // 为了避免替换影响后续匹配，最多只替换前N个匹配项
        const maxReplacements = Math.min(5, matches.length);
        
        for (let i = 0; i < maxReplacements; i++) {
            const match = matches[i];
            const newResult = result.replace(match.regex, match.value);
            
            if (newResult !== result) {
                result = newResult;
                hasReplaced = true;
            }
        }
        
        // 返回替换后的文本或null
        return hasReplaced ? result : null;
    },
    
    /**
     * 清理翻译缓存
     * 性能优化：智能缓存清理策略
     */
    cleanCache() {
        try {
            // 验证缓存是否存在和有效
            if (!this.translationCache || !(this.translationCache instanceof Map)) {
                if (CONFIG.debugMode) {
                    console.warn('[GitHub 中文翻译] 缓存对象不存在或无效');
                }
                return;
            }
            
            const currentSize = this.translationCache.size;
            const maxSize = CONFIG.performance.maxDictSize || 1000;
            
            // 检查是否需要清理
            if (currentSize <= maxSize) {
                // 缓存尚未达到需要清理的程度
                return;
            }
            
            // 目标大小设为最大值的75%，为新条目预留空间
            const targetSize = Math.floor(maxSize * 0.75);
            
            // 获取缓存条目并进行智能排序
            const cacheEntries = Array.from(this.translationCache.entries());
            
            // 1. 先移除null值的缓存项
            const nonNullEntries = cacheEntries.filter(([key, value]) => {
                return value !== null && typeof value === 'string';
            });
            
            // 2. 智能排序策略：
            //    - 短键优先（更可能重复出现）
            //    - 非空值优先
            //    - 忽略过长的键（不太可能重复使用）
            nonNullEntries.sort(([keyA, valueA], [keyB, valueB]) => {
                // 优先保留较短的键
                if (keyA.length !== keyB.length) {
                    return keyA.length - keyB.length;
                }
                
                // 其次考虑翻译后的长度（较长的翻译可能更有价值）
                const valueALength = valueA ? valueA.length : 0;
                const valueBLength = valueB ? valueB.length : 0;
                return valueBLength - valueALength;
            });
            
            // 3. 保留最重要的条目
            const entriesToKeep = nonNullEntries.slice(0, targetSize);
            
            // 4. 重建缓存
            const oldSize = this.translationCache.size;
            this.translationCache.clear();
            
            // 5. 添加需要保留的条目
            entriesToKeep.forEach(([key, value]) => {
                if (value !== null && typeof value === 'string') {
                    this.translationCache.set(key, value);
                }
            });
            
            if (CONFIG.debugMode) {
                const removedCount = oldSize - this.translationCache.size;
                console.log(`[GitHub 中文翻译] 缓存已清理，从${oldSize}项减少到${this.translationCache.size}项，移除了${removedCount}项`);
            }
            
            // 更新性能数据
            this.performanceData.cacheCleaned = (this.performanceData.cacheCleaned || 0) + 1;
            
        } catch (error) {
            // 如果清理过程出错，使用更安全的回退策略
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 缓存清理过程出错，使用回退策略:', error);
            }
            
            try {
                // 更安全的回退策略：删除30%的条目，优先删除较长的键
                const maxSize = CONFIG.performance.maxDictSize || 1000;
                const entriesToRemove = Math.max(10, Math.floor(this.translationCache.size * 0.3));
                
                // 转换为数组并按键长度降序排序（优先删除长键）
                const cacheEntries = Array.from(this.translationCache.entries());
                cacheEntries.sort(([keyA], [keyB]) => keyB.length - keyA.length);
                
                // 删除前N个最长的键
                for (let i = 0; i < entriesToRemove && i < cacheEntries.length; i++) {
                    this.translationCache.delete(cacheEntries[i][0]);
                }
                
            } catch (fallbackError) {
                // 最后手段：如果所有清理方法都失败，直接清空缓存
                if (CONFIG.debugMode) {
                    console.error('[GitHub 中文翻译] 回退策略也失败，清空整个缓存:', fallbackError);
                }
                this.translationCache.clear();
            }
        }
    },
    
    /**
     * 清除翻译缓存
     */
    clearCache() {
        this.translationCache.clear();
        
        // 重置已翻译标记
        const translatedElements = document.querySelectorAll('[data-github-zh-translated]');
        translatedElements.forEach(element => {
            element.removeAttribute('data-github-zh-translated');
        });
        
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 翻译缓存已清除，已移除所有翻译标记');
        }
    },
    
    /**
     * 预热词典缓存
     * 预加载常用词典条目到缓存中
     */
    warmUpCache() {
        if (!CONFIG.performance.enableTranslationCache) {
            return;
        }
        
        try {
            // 收集常用词汇（这里简单处理，实际项目可能有更复杂的选择逻辑）
            const commonKeys = Object.keys(this.dictionary)
                .filter(key => !this.dictionary[key].startsWith('待翻译: ') && key.length <= 50)
                .slice(0, 100); // 预加载前100个常用词条
            
            commonKeys.forEach(key => {
                const value = this.dictionary[key];
                this.translationCache.set(key, value);
            });
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 缓存预热完成，已预加载${commonKeys.length}个常用词条`);
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 缓存预热失败:', error);
        }
    },
    
    /**
     * 更新词典
     * 支持动态更新词典内容
     * @param {Object} newDictionary - 新的词典条目
     */
    updateDictionary(newDictionary) {
        try {
            // 合并新词典
            Object.assign(this.dictionary, newDictionary);
            
            // 清除缓存，因为词典已更新
            this.clearCache();
            
            // 重新预热缓存
            this.warmUpCache();
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 词典已更新，新增/修改${Object.keys(newDictionary).length}个条目`);
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 更新词典失败:', error);
        }
    }
};

/**
 * 页面监控模块
 * 监控页面变化并触发重新翻译
 */
/**
 * 页面监控对象
 */
export const pageMonitor = {
    /**
     * 观察器实例
     * @type {MutationObserver|null}
     */
    observer: null,
    
    /**
     * 最后翻译的路径
     * @type {string}
     */
    lastPath: '',
    
    /**
     * 最后翻译的时间戳
     * @type {number}
     */
    lastTranslateTimestamp: 0,
    
    /**
     * 初始化监控
     */
    init() {
        try {
            // 设置路径变化监听
            this.setupPathListener();
            
            // 设置DOM变化监听
            this.setupDomObserver();
            
            // 页面监控已初始化
        } catch (error) {
            console.error('[GitHub 中文翻译] 页面监控初始化失败:', error);
        }
    },
    
    /**
     * 设置路径变化监听
     * 用于监听GitHub的SPA路由变化
     */
    setupPathListener() {
        // 保存当前路径
        this.lastPath = window.location.pathname + window.location.search;
        
        // 监听popstate事件
        window.addEventListener('popstate', utils.debounce(() => {
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath !== this.lastPath) {
                this.handlePathChange();
            }
        }, CONFIG.routeChangeDelay));
        
        // 监听pushState和replaceState方法
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            pageMonitor.handlePathChange();
        };
        
        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            pageMonitor.handlePathChange();
        };
    },
    
    /**
     * 处理路径变化
     */
    handlePathChange() {
        try {
            const currentPath = window.location.pathname + window.location.search;
            this.lastPath = currentPath;
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 页面路径变化: ${currentPath}`);
            }
            
            // 延迟执行翻译，等待页面内容加载完成
            setTimeout(() => {
                this.translateWithThrottle();
            }, CONFIG.routeChangeDelay);
        } catch (error) {
            console.error('[GitHub 中文翻译] 路径变化处理失败:', error);
        }
    },
    
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断
     */
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断，支持Promise链式调用
     * @returns {Promise<void>} 翻译完成的Promise
     */
    async translateWithThrottle() {
        const now = Date.now();
        const minInterval = CONFIG.performance.minTranslateInterval || 500; // 最小翻译间隔，默认500ms
        
        // 检查是否需要节流
        if (now - this.lastTranslateTimestamp >= minInterval) {
            this.lastTranslateTimestamp = now;
            
            try {
                // 获取当前页面关键区域
                const keyAreas = this.identifyKeyTranslationAreas();
                
                // 记录性能数据
                if (CONFIG.debugMode && CONFIG.performance.logTiming) {
                    console.time('[GitHub 中文翻译] 翻译耗时');
                }
                
                let translationPromise;
                // 根据关键区域决定翻译范围
                if (keyAreas.length > 0) {
                    translationPromise = translationCore.translate(keyAreas);
                    if (CONFIG.debugMode) {
                        console.log(`[GitHub 中文翻译] 翻译关键区域: ${keyAreas.map(area => area.tagName + (area.id ? '#' + area.id : '')).join(', ')}`);
                    }
                } else {
                    translationPromise = translationCore.translate();
                    if (CONFIG.debugMode) {
                        console.log('[GitHub 中文翻译] 翻译整个页面');
                    }
                }
                
                // 等待翻译完成并处理错误
                await translationPromise;
                
                // 记录完成时间
                if (CONFIG.debugMode && CONFIG.performance.logTiming) {
                    console.timeEnd('[GitHub 中文翻译] 翻译耗时');
                }
            } catch (error) {
                console.error('[GitHub 中文翻译] 翻译过程中出错:', error);
                // 即使出错也尝试最小化翻译
                try {
                    await translationCore.translateCriticalElementsOnly();
                } catch (recoverError) {
                    console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
                }
            }
        } else if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译请求被节流，距离上次翻译${now - this.lastTranslateTimestamp}ms`);
        }
    },
    
    /**
     * 识别当前页面的关键翻译区域
     * 性能优化：只翻译需要的区域而不是整个页面
     * @returns {HTMLElement[]} 关键翻译区域元素数组
     */
    identifyKeyTranslationAreas() {
        const keySelectors = [];
        const path = window.location.pathname;
        
        // 根据页面类型选择关键区域
        if (/\/pull\/\d+/.test(path) || /\/issues\/\d+/.test(path)) {
            // PR或Issue页面
            keySelectors.push('.js-discussion');
        } else if (/\/blob\//.test(path)) {
            // 文件查看页面
            keySelectors.push('.blob-wrapper');
        } else if (/\/commit\//.test(path)) {
            // 提交详情页面
            keySelectors.push('.commit-meta', '.commit-files');
        } else if (/\/notifications/.test(path)) {
            // 通知页面
            keySelectors.push('.notifications-list');
        } else {
            // 其他页面，使用通用关键区域
            keySelectors.push('.repository-content', '.profile-timeline');
        }
        
        // 获取并过滤存在的元素
        const elements = [];
        for (const selector of keySelectors) {
            const element = document.querySelector(selector);
            if (element) {
                elements.push(element);
            }
        }
        
        return elements;
    },
    
    /**
     * 设置DOM变化监听
     * 性能优化：使用更精确的观察范围和优化的配置
     */
    setupDomObserver() {
        try {
            // 选择最优的观察根节点 - 性能优化：减少观察范围
            const rootNode = this.selectOptimalRootNode();
            
            // 根据页面类型调整观察器配置
            const observerConfig = this.getOptimizedObserverConfig();
            
            // 使用命名函数以便调试和维护
            const handleMutations = (mutations) => {
                try {
                    // 智能判断是否需要翻译
                    if (this.shouldTriggerTranslation(mutations)) {
                        this.translateWithThrottle();
                    }
                } catch (error) {
                    console.error('[GitHub 中文翻译] 处理DOM变化时出错:', error);
                }
            };
            
            this.observer = new MutationObserver(utils.debounce(handleMutations, CONFIG.debounceDelay));
            
            // 开始观察最优根节点
            if (rootNode) {
                this.observer.observe(rootNode, observerConfig);
                if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] DOM观察器已启动，观察范围:', rootNode.tagName + (rootNode.id ? '#' + rootNode.id : ''));
                }
            } else {
                console.error('[GitHub 中文翻译] 无法找到合适的观察节点，回退到body');
                // 尝试延迟启动
                setTimeout(() => this.setupDomObserver(), 500);
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 设置DOM观察器失败:', error);
            // 降级方案
            this.setupFallbackMonitoring();
        }
    },
    
    /**
     * 选择最优的观察根节点
     * @returns {HTMLElement} 最优的观察根节点
     */
    selectOptimalRootNode() {
        // GitHub特有的内容容器选择器优先级
        const contentSelectors = [
            '#js-repo-pjax-container', // 仓库页面
            '#js-checkout-js-pjax-container', // 结账页面
            '.application-main', // 主要内容区域
            '.js-notifications-list-container', // 通知页面
            '.js-profile-timeline', // 个人时间线
            'main', // HTML5 main元素
            '.container' // 通用容器
        ];
        
        // 尝试找到最合适的根节点
        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 0) {
                return element;
            }
        }
        
        // 回退到body
        return document.body;
    },
    
    /**
     * 获取优化的观察器配置
     * @returns {Object} 优化后的观察器配置
     */
    getOptimizedObserverConfig() {
        // 基础配置
        const config = {
            childList: true,
            subtree: CONFIG.performance.enableDeepObserver,
            characterData: true,
            attributes: CONFIG.performance.observeAttributes
        };
        
        // 根据页面复杂度调整配置
        if (this.isComplexPage()) {
            // 复杂页面减少深度观察以提高性能
            config.subtree = false;
        }
        
        return config;
    },
    
    /**
     * 判断是否为复杂页面
     * @returns {boolean} 是否为复杂页面
     */
    isComplexPage() {
        const complexPaths = [
            /\/pull\/\d+/,
            /\/issues\/\d+/,
            /\/blob\//,
            /\/commit\//,
            /\/compare\//
        ];
        
        return complexPaths.some(pattern => pattern.test(window.location.pathname));
    },
    
    /**
     * 智能判断是否需要触发翻译
     * 比简单的变化检测更高效
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @returns {boolean} 是否需要触发翻译
     */
    shouldTriggerTranslation(mutations) {
        // 快速路径：少量变化直接检查
        if (mutations.length < 5) {
            return this.detectImportantChanges(mutations);
        }
        
        // 大量变化时的优化检测
        let contentChanges = 0;
        let importantChanges = 0;
        const totalChanges = Math.min(mutations.length, 100); // 限制检查数量
        const importantAttributes = CONFIG.performance.importantAttributes || [];
        
        // 只检查前N个变化，避免处理过多变化
        for (let i = 0; i < totalChanges; i++) {
            const mutation = mutations[i];
            
            // 快速检查：跳过属性变化（除非明确配置）
            if (mutation.type === 'attributes') {
                if (!CONFIG.performance.observeAttributes || !importantAttributes.includes(mutation.attributeName)) {
                    continue;
                }
                importantChanges++;
                if (importantChanges > 3) {
                    return true; // 重要属性变化达到阈值
                }
            }
            
            // 检查是否为内容相关变化
            if (this.isContentRelatedMutation(mutation)) {
                contentChanges++;
                
                // 如果内容变化超过阈值，立即返回true
                if (contentChanges > 5) {
                    return true;
                }
            }
        }
        
        // 增加重要变化的权重
        const weightedChanges = contentChanges + (importantChanges * 2);
        
        // 根据加权变化比例决定
        return weightedChanges / totalChanges > 0.35; // 稍微提高阈值以减少不必要的翻译
    },
    
    /**
     * 判断是否为内容相关的DOM变化
     * @param {MutationRecord} mutation - 变更记录
     * @returns {boolean} 是否为内容相关变化
     */
    isContentRelatedMutation(mutation) {
        // 字符数据变化（文本内容）
        if (mutation.type === 'characterData' && 
            mutation.target.nodeValue && 
            mutation.target.nodeValue.trim().length > 0) {
            return true;
        }
        
        // 子节点变化
        if (mutation.type === 'childList') {
            // 检查添加的节点
            for (const node of mutation.addedNodes) {
                // 跳过不可见或不需要翻译的节点
                if (this.isTranslatableNode(node)) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * 判断节点是否需要翻译
     * @param {Node} node - 要检查的节点
     * @returns {boolean} 是否需要翻译
     */
    isTranslatableNode(node) {
        // 跳过脚本、样式等
        if (node.nodeType === Node.SCRIPT_NODE || 
            node.nodeType === Node.STYLE_NODE || 
            node.nodeType === Node.COMMENT_NODE) {
            return false;
        }
        
        // 文本节点且有内容
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.trim().length > 5; // 只有足够长的文本才翻译
        }
        
        // 元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            // 跳过已翻译的元素
            if (node.hasAttribute('data-github-zh-translated')) {
                return false;
            }
            
            // 跳过隐藏元素
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
            }
            
            // 检查是否为内容容器
            const contentTags = [
                'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'li', 'a', 'button', 'label', 'div', 'td', 'th',
                'pre', 'code', 'blockquote'
            ];
            
            const tagName = node.tagName.toLowerCase();
            const hasContent = node.textContent.trim().length > 0;
            
            // 常见内容容器且有内容，或者包含内容子节点
            return (contentTags.includes(tagName) && hasContent) || 
                   (node.children.length > 0 && this.hasTranslatableChildren(node));
        }
        
        return false;
    },
    
    /**
     * 检查元素是否包含可翻译的子元素
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} 是否包含可翻译的子元素
     */
    hasTranslatableChildren(element) {
        // 快速检查：只查看前10个子元素
        const children = Array.from(element.children).slice(0, 10);
        return children.some(child => {
            const tagName = child.tagName.toLowerCase();
            return ['p', 'span', 'a', 'button', 'label'].includes(tagName) && 
                   child.textContent.trim().length > 0;
        });
    },
    
    /**
     * 设置降级监控方案
     * 当MutationObserver失败时使用
     */
    setupFallbackMonitoring() {
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 使用降级监控方案');
        }
        
        // 定时检查页面变化
        setInterval(() => {
            // 只在页面可见时执行
            if (document.visibilityState === 'visible') {
                this.translateWithThrottle();
            }
        }, 30000); // 30秒检查一次
    },
    
    /**
     * 检测重要的DOM变化
     * 只在有实际内容变化时触发翻译
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @returns {boolean} 是否有需要触发翻译的重要变化
     */
    detectImportantChanges(mutations) {
        // 检查是否有实际内容变化
        return mutations.some(mutation => {
            // 检查子节点变化
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 过滤出可见的元素节点
                const hasVisibleElements = Array.from(mutation.addedNodes).some(node => {
                    // 忽略脚本、样式、注释等不可见元素
                    if (node.nodeType !== 1) return false; // 不是元素节点
                    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return false;
                    
                    // 更精确的文本内容检查，排除纯空白或非常短的内容
                    const trimmedText = node.textContent.trim();
                    if (trimmedText.length > 0) {
                        // 只有文本长度超过最小翻译长度才认为重要
                        return trimmedText.length >= (CONFIG.performance.minTextLengthToTranslate || 3);
                    }
                    
                    // 检查是否有可能包含文本的子元素
                    return this.hasTranslatableChildren(node);
                });
                return hasVisibleElements;
            }
            
            // 检查字符数据变化
            if (mutation.type === 'characterData' && 
                mutation.target.nodeValue) {
                const trimmedText = mutation.target.nodeValue.trim();
                // 只有文本长度超过最小翻译长度才认为重要
                return trimmedText.length >= (CONFIG.performance.minTextLengthToTranslate || 3);
            }
            
            // 检查重要属性变化
            const importantAttributes = CONFIG.performance.importantAttributes || [];
            if (mutation.type === 'attributes' && 
                importantAttributes.includes(mutation.attributeName)) {
                return true;
            }
            
            return false;
        });
    },
    
    /**
     * 停止监控
     */
    stop() {
        try {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
                
                // DOM观察器已断开连接
            }
            
            // 重置状态
            this.lastPath = '';
            this.lastTranslateTimestamp = 0;
            
            // 页面监控已停止
        } catch (error) {
            console.error('[GitHub 中文翻译] 停止监控时出错:', error);
        }
    },
    
    /**
     * 重新开始监控
     */
    restart() {
        try {
            this.stop();
            this.init();
        } catch (error) {
            console.error('[GitHub 中文翻译] 重新开始监控失败:', error);
        }
    },
    
    /**
     * 手动触发翻译
     * 提供外部调用接口
     */
    triggerTranslation() {
        this.translateWithThrottle();
    }
};

/**
 * 开发工具模块
 * 包含字符串提取、自动更新和词典处理等开发工具
 */
// 删除未使用的CONFIG导入
/**
 * 字符串提取器对象
 */
export const stringExtractor = {
    /**
     * 收集页面上的字符串
     * @param {boolean} showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 收集到的字符串集合
     */
    collectStrings(showInConsole = true) {
        const strings = new Set();
        utils.collectTextNodes(document.body, strings);
        
        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 收集到 ${strings.size} 个字符串`);
            console.log('收集到的字符串:', strings);
        }
        
        return strings;
    },
    
    /**
     * 查找未翻译的字符串
     * @param {boolean} showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 未翻译的字符串集合
     */
    findUntranslatedStrings(showInConsole = true) {
        const allStrings = this.collectStrings(false);
        const untranslated = new Set();
        
        // 合并所有词典
        const mergedDictionary = {};
        for (const module in translationModule) {
            Object.assign(mergedDictionary, translationModule[module]);
        }
        
        // 检查每个字符串是否已翻译
        allStrings.forEach(string => {
            if (!mergedDictionary[string] || mergedDictionary[string].startsWith('待翻译: ')) {
                untranslated.add(string);
            }
        });
        
        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 找到 ${untranslated.size} 个未翻译的字符串`);
            console.log('未翻译的字符串:', untranslated);
        }
        
        return untranslated;
    }
};

/**
 * 自动字符串更新器类
 */
export class AutoStringUpdater {
    constructor() {
        this.processedCount = 0;
    }
    
    /**
     * 查找需要添加的字符串
     * @returns {Set<string>} 需要添加的字符串集合
     */
    findStringsToAdd() {
        const untranslated = stringExtractor.findUntranslatedStrings(false);
        return new Set(Array.from(untranslated).filter(str => !str.startsWith('待翻译: ')));
    }
    
    /**
     * 生成更新报告
     * @returns {Object} 更新报告对象
     */
    generateUpdateReport() {
        const stringsToAdd = this.findStringsToAdd();
        return {
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href,
            pageTitle: document.title,
            stringsToAdd: Array.from(stringsToAdd),
            totalNew: stringsToAdd.size
        };
    }
    
    /**
     * 在控制台显示报告
     */
    showReportInConsole() {
        const report = this.generateUpdateReport();
        console.log('[GitHub 中文翻译] 字符串更新报告');
        console.log(`📄 页面: ${report.pageTitle}`);
        console.log(`✅ 找到 ${report.totalNew} 个新字符串`);
    }
}

/**
 * 词典处理器类
 */
export class DictionaryProcessor {
    constructor() {
        this.processedCount = 0;
    }
    
    /**
     * 合并词典
     * @returns {Object} 合并后的词典
     */
    mergeDictionaries() {
        const merged = {};
        for (const module in translationModule) {
            Object.assign(merged, translationModule[module]);
        }
        return merged;
    }
    
    /**
     * 验证词典
     * @returns {Object} 词典验证结果
     */
    validateDictionary() {
        const dictionary = this.mergeDictionaries();
        const total = Object.keys(dictionary).length;
        const untranslated = Array.from(stringExtractor.findUntranslatedStrings(false)).length;
        return {
            totalEntries: total,
            translatedEntries: total - untranslated,
            completionRate: total > 0 ? ((total - untranslated) / total * 100).toFixed(2) : '0.00'
        };
    }
    
    /**
     * 在控制台显示统计信息
     */
    showStatisticsInConsole() {
        const stats = this.validateDictionary();
        console.log('[GitHub 中文翻译] 词典统计');
        console.log(`📊 总条目数: ${stats.totalEntries}`);
        console.log(`✅ 已翻译条目: ${stats.translatedEntries}`);
        console.log(`📈 完成率: ${stats.completionRate}%`);
    }
}

/**
 * 加载工具类
 * @returns {Object} 包含工具类的对象
 */
export function loadTools() {
    return { 
        stringExtractor, 
        AutoStringUpdater, 
        DictionaryProcessor 
    };
}

/**
 * GitHub 中文翻译主入口文件
 * 整合所有模块并初始化脚本
 */
/**
 * 初始化脚本
 */
async function init() {
    try {
        // 检查更新
        if (CONFIG.updateCheck.enabled) {
            versionChecker.checkForUpdates().catch(() => {
                // 静默失败，不影响用户体验
            });
        }
        
        // 初始化翻译核心功能
        translationCore.translate();
        
        // 初始化页面监控
        pageMonitor.init();
    } catch (error) {
        console.error('[GitHub 中文翻译] 脚本初始化失败:', error);
    }
}

/**
 * 启动脚本
 */
function startScript() {
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await init();
        });
    } else {
        // 如果DOM已经加载完成，直接初始化
        init();
    }
}

// 导出函数供其他模块使用
// 🕒 启动脚本
startScript();