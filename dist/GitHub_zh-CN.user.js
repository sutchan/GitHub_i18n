/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version 1.8.59
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
        "enableTranslationCache": true
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
     * 使用更安全的事件处理方式
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
            // 创建通知元素
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md transform transition-all duration-300 translate-y-0 opacity-100';
            
            // 生成唯一的ID
            const notificationId = `github-zh-update-${Date.now()}`;
            notification.id = notificationId;
            
            notification.innerHTML = `
                <div class="flex items-start">
                    <div class="flex-shrink-0 bg-blue-100 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium text-blue-800">GitHub 中文翻译脚本更新</p>
                        <p class="text-sm text-blue-700 mt-1">发现新版本 ${newVersion}，建议更新以获得更好的翻译体验。</p>
                        <div class="mt-3 flex space-x-2">
                            <a id="${notificationId}-update-btn" href="${CONFIG.updateCheck.scriptUrl || '#'}" target="_blank" rel="noopener noreferrer"
                                class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                                立即更新
                            </a>
                            <button id="${notificationId}-later-btn"
                                class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-transparent hover:bg-blue-50 transition-colors">
                                稍后
                            </button>
                            <button id="${notificationId}-dismiss-btn"
                                class="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                不再提醒
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到DOM
            if (document.body) {
                document.body.appendChild(notification);
                
                // 记录本次通知的版本
                localStorage.setItem(notificationVersionKey, newVersion);
                
                // 添加事件监听器
                document.getElementById(`${notificationId}-later-btn`).addEventListener('click', () => {
                    this.hideNotification(notification, false);
                });
                
                document.getElementById(`${notificationId}-dismiss-btn`).addEventListener('click', () => {
                    this.hideNotification(notification, true);
                });
                
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
     * 初始化词典
     */
    initDictionary() {
        this.dictionary = mergeAllDictionaries();
    },
    
    /**
     * 执行翻译
     * 遍历页面元素，替换匹配的文本
     */
    translate() {
        // 确保词典已初始化
        if (Object.keys(this.dictionary).length === 0) {
            this.initDictionary();
        }
        
        try {
            // 获取需要翻译的元素
            const elements = this.getElementsToTranslate();
            
            // 对每个元素进行翻译
            elements.forEach(element => {
                this.translateElement(element);
            });
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 翻译完成，已翻译元素数量:', elements.length);
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 翻译过程中出错:', error);
        }
    },
    
    /**
     * 获取需要翻译的元素
     * @returns {HTMLElement[]} 需要翻译的元素数组
     */
    getElementsToTranslate() {
        // 使用Set避免重复添加元素，提高性能
        const uniqueElements = new Set();
        
        // 获取主选择器匹配的元素
        CONFIG.selectors.primary.forEach(selector => {
            try {
                const matchedElements = document.querySelectorAll(selector);
                matchedElements.forEach(element => {
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
        
        // 获取弹出菜单元素
        CONFIG.selectors.popupMenus.forEach(selector => {
            try {
                const matchedElements = document.querySelectorAll(selector);
                matchedElements.forEach(element => {
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
        
        return Array.from(uniqueElements);
    },
    
    /**
     * 判断元素是否应该被翻译
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} 是否应该翻译
     */
    shouldTranslateElement(element) {
        // 避免翻译特定类型的元素
        const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select'];
        if (skipTags.includes(element.tagName.toLowerCase())) {
            return false;
        }
        
        // 避免翻译具有特定属性的元素
        if (element.hasAttribute('data-no-translate') || 
            element.hasAttribute('translate') && element.getAttribute('translate') === 'no') {
            return false;
        }
        
        // 避免翻译具有特定类名的元素
        const skipClasses = ['language-', 'highlight', 'token', 'no-translate'];
        const classList = element.className;
        if (classList && skipClasses.some(cls => classList.includes(cls))) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 翻译单个元素
     * @param {HTMLElement} element - 要翻译的元素
     */
    translateElement(element) {
        // 遍历元素的所有文本节点
        const childNodes = Array.from(element.childNodes);
        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
                const originalText = node.nodeValue;
                const translatedText = this.getTranslatedText(originalText);
                
                // 如果有翻译结果且与原文不同，则替换
                if (translatedText && translatedText !== originalText) {
                    node.nodeValue = translatedText;
                }
            }
        });
    },
    
    /**
     * 获取文本的翻译结果
     * @param {string} text - 原始文本
     * @returns {string|null} 翻译后的文本，如果没有找到翻译则返回null
     */
    getTranslatedText(text) {
        // 去除文本中的多余空白字符
        const normalizedText = text.trim();
        
        // 检查缓存
        if (CONFIG.performance.enableTranslationCache && this.translationCache.has(normalizedText)) {
            return this.translationCache.get(normalizedText);
        }
        
        // 直接查找精确匹配
        let result = null;
        if (this.dictionary[normalizedText]) {
            const translation = this.dictionary[normalizedText];
            // 避免返回标记为待翻译的文本
            if (!translation.startsWith('待翻译: ')) {
                result = translation;
            }
        }
        
        // 如果启用了部分匹配且尚未找到结果
        if (result === null && CONFIG.performance.enablePartialMatch) {
            for (const [key, value] of Object.entries(this.dictionary)) {
                // 只对较长的键进行部分匹配，避免意外替换
                if (key.length > 3 && normalizedText.includes(key) && !value.startsWith('待翻译: ')) {
                    result = normalizedText.replace(new RegExp(key, 'g'), value);
                    // 只返回第一个匹配的结果，避免多次替换导致的问题
                    break;
                }
            }
        }
        
        // 更新缓存
        if (CONFIG.performance.enableTranslationCache) {
            // 限制缓存大小
            if (this.translationCache.size >= CONFIG.performance.maxDictSize) {
                // 删除最旧的缓存项（Map保持插入顺序）
                const firstKey = this.translationCache.keys().next().value;
                this.translationCache.delete(firstKey);
            }
            this.translationCache.set(normalizedText, result);
        }
        
        return result;
    },
    
    /**
     * 清除翻译缓存
     */
    clearCache() {
        this.translationCache.clear();
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 翻译缓存已清除');
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
     * 防止短时间内频繁触发翻译
     */
    translateWithThrottle() {
        const now = Date.now();
        const minInterval = CONFIG.performance.minTranslateInterval || 500; // 最小翻译间隔，默认500ms
        
        if (now - this.lastTranslateTimestamp >= minInterval) {
            this.lastTranslateTimestamp = now;
            
            if (CONFIG.debugMode && CONFIG.performance.logTiming) {
                console.time('[GitHub 中文翻译] 翻译耗时');
                translationCore.translate().finally(() => {
                    console.timeEnd('[GitHub 中文翻译] 翻译耗时');
                });
            } else {
                translationCore.translate();
            }
        } else if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译请求被节流，距离上次翻译${now - this.lastTranslateTimestamp}ms`);
        }
    },
    
    /**
     * 设置DOM变化监听
     */
    setupDomObserver() {
        try {
            const observerConfig = {
                childList: true,
                subtree: CONFIG.performance.enableDeepObserver,
                characterData: true,
                attributes: CONFIG.performance.observeAttributes // 是否观察属性变化
            };
            
            this.observer = new MutationObserver(utils.debounce((mutations) => {
                try {
                    // 更精细的变化检测
                    const hasImportantChange = this.detectImportantChanges(mutations);
                    
                    if (hasImportantChange) {
                        this.translateWithThrottle();
                    } // 非重要变化，跳过翻译
                } catch (error) {
                    console.error('[GitHub 中文翻译] 处理DOM变化时出错:', error);
                }
            }, CONFIG.debounceDelay));
            
            // 开始观察文档
            if (document.body) {
                this.observer.observe(document.body, observerConfig);
                // DOM观察器已启动
            } else {
                console.error('[GitHub 中文翻译] document.body不存在，无法启动观察器');
                // 尝试延迟启动
                setTimeout(() => this.setupDomObserver(), 500);
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 设置DOM观察器失败:', error);
        }
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
                    
                    // 检查是否有文本内容或子元素
                    return node.textContent.trim().length > 0 || node.children.length > 0;
                });
                return hasVisibleElements;
            }
            
            // 检查字符数据变化
            if (mutation.type === 'characterData' && 
                mutation.target.nodeValue && 
                mutation.target.nodeValue.trim().length > 0) {
                return true;
            }
            
            // 检查重要属性变化
            if (mutation.type === 'attributes' && 
                CONFIG.performance.importantAttributes && 
                CONFIG.performance.importantAttributes.includes(mutation.attributeName)) {
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