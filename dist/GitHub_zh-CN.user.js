/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version 1.8.26
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
        return CONFIG.version;
    } catch (e) {
        // 出错时返回配置中的版本号
        return CONFIG.version;
    }
}

/**
 * 配置对象，包含所有可配置项
 */
export const CONFIG = {
    "version": "1.8.26",
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
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * 防抖函数，延迟执行函数直到停止触发一段时间
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay) {
        let timeout;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
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
     * 获取当前页面路径
     * @returns {string} 当前页面的路径
     */
    getCurrentPath() {
        return window.location.pathname;
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
     * 收集DOM树中的所有文本节点内容
     * @param {HTMLElement} element - 要收集文本的起始元素
     * @param {Set<string>} resultSet - 用于存储结果的Set集合
     */
    collectTextNodes(element, resultSet) {
        if (!element || !resultSet) return;
        
        const skipElements = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select'];
        
        // 检查是否需要跳过此元素
        if (element.tagName && skipElements.includes(element.tagName.toLowerCase())) {
            return;
        }
        
        // 遍历所有子节点
        const childNodes = Array.from(element.childNodes);
        for (const node of childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue.trim();
                // 只收集非空字符串，且过滤掉纯数字和过长的字符串
                if (text && text.length > 0 && 
                    text.length < 200 && 
                    !/^\d+$/.test(text) &&
                    !/^[\s\p{P}\p{S}]+$/u.test(text)) {
                    resultSet.add(text);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                this.collectTextNodes(node, resultSet);
            }
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
     * @returns {Promise<void>} 检查完成的Promise
     */
    async checkForUpdates() {
        // 检查是否启用了更新检查
        if (!CONFIG.updateCheck.enabled) return;
        
        // 检查是否达到检查间隔
        const lastCheck = localStorage.getItem('githubZhLastUpdateCheck');
        const now = Date.now();
        const intervalMs = CONFIG.updateCheck.intervalHours * 60 * 60 * 1000;
        
        if (lastCheck && now - parseInt(lastCheck) < intervalMs) {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 未达到更新检查间隔，跳过检查');
            }
            return;
        }
        
        try {
            // 记录本次检查时间
            localStorage.setItem('githubZhLastUpdateCheck', now.toString());
            
            // 获取远程脚本内容
            const response = await fetch(CONFIG.updateCheck.scriptUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                },
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            
            const scriptContent = await response.text();
            
            // 提取远程版本号
            const remoteVersionMatch = scriptContent.match(/\/\*\s*@version\s+(\d+\.\d+\.\d+)\s*\*\//i);
            if (!remoteVersionMatch) {
                throw new Error('无法从远程脚本提取版本号');
            }
            
            const remoteVersion = remoteVersionMatch[1];
            
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
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 检查更新时发生错误:', error);
            }
        }
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
     * @param {string} newVersion - 新版本号
     */
    showUpdateNotification(newVersion) {
        const notificationKey = 'githubZhUpdateNotificationDismissed';
        
        // 检查用户是否已经关闭过通知
        if (localStorage.getItem(notificationKey) === 'dismissed') {
            return;
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md';
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0 bg-blue-100 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-blue-800">GitHub 中文翻译脚本更新</p>
                    <p class="text-sm text-blue-700 mt-1">发现新版本 ${newVersion}，建议更新以获得更好的翻译体验。</p>
                    <div class="mt-3 flex space-x-2">
                        <a href="${CONFIG.updateCheck.scriptUrl}" target="_blank" rel="noopener noreferrer"
                            class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                            立即更新
                        </a>
                        <button onclick="this.closest('.fixed').remove(); localStorage.setItem('${notificationKey}', 'dismissed');"
                            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-transparent hover:bg-blue-50 transition-colors">
                            稍后
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
    },
    
    /**
     * 更新本地存储中的版本号
     * @param {string} newVersion - 新版本号
     */
    updateVersionInStorage(newVersion) {
        try {
            localStorage.setItem('githubZhCachedVersion', newVersion);
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 已缓存新版本号: ${newVersion}`);
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 更新缓存版本号时出错:', error);
            }
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
                console.log('[GitHub 中文翻译] 翻译完成');
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
        const elements = [];
        
        // 获取主选择器匹配的元素
        CONFIG.selectors.primary.forEach(selector => {
            const matchedElements = document.querySelectorAll(selector);
            matchedElements.forEach(element => {
                // 避免重复添加
                if (!elements.includes(element)) {
                    elements.push(element);
                }
            });
        });
        
        // 获取弹出菜单元素
        CONFIG.selectors.popupMenus.forEach(selector => {
            const matchedElements = document.querySelectorAll(selector);
            matchedElements.forEach(element => {
                if (!elements.includes(element)) {
                    elements.push(element);
                }
            });
        });
        
        return elements;
    },
    
    /**
     * 翻译单个元素
     * @param {HTMLElement} element - 要翻译的元素
     */
    translateElement(element) {
        // 避免翻译特定类型的元素
        const skipElements = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select'];
        if (skipElements.includes(element.tagName.toLowerCase())) {
            return;
        }
        
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
        
        // 直接查找精确匹配
        if (this.dictionary[normalizedText]) {
            const translation = this.dictionary[normalizedText];
            // 避免返回标记为待翻译的文本
            if (!translation.startsWith('待翻译: ')) {
                return translation;
            }
        }
        
        // 如果启用了部分匹配
        if (CONFIG.performance.enablePartialMatch) {
            for (const [key, value] of Object.entries(this.dictionary)) {
                if (normalizedText.includes(key) && !value.startsWith('待翻译: ')) {
                    return normalizedText.replace(new RegExp(key, 'g'), value);
                }
            }
        }
        
        return null;
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
     * 初始化监控
     */
    init() {
        // 设置路径变化监听
        this.setupPathListener();
        
        // 设置DOM变化监听
        this.setupDomObserver();
        
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 页面监控已初始化');
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
        const currentPath = window.location.pathname + window.location.search;
        this.lastPath = currentPath;
        
        if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 页面路径变化: ${currentPath}`);
        }
        
        // 延迟执行翻译，等待页面内容加载完成
        setTimeout(() => {
            translationCore.translate();
        }, CONFIG.routeChangeDelay);
    },
    
    /**
     * 设置DOM变化监听
     */
    setupDomObserver() {
        const observerConfig = {
            childList: true,
            subtree: CONFIG.performance.enableDeepObserver,
            characterData: true
        };
        
        this.observer = new MutationObserver(utils.debounce((mutations) => {
            // 检查是否有实际内容变化
            const hasContentChange = mutations.some(mutation => {
                // 检查子节点变化
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    return true;
                }
                // 检查字符数据变化
                if (mutation.type === 'characterData' && mutation.target.nodeValue) {
                    return true;
                }
                return false;
            });
            
            if (hasContentChange) {
                translationCore.translate();
            }
        }, CONFIG.debounceDelay));
        
        // 开始观察文档
        this.observer.observe(document.body, observerConfig);
    },
    
    /**
     * 停止监控
     */
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 页面监控已停止');
        }
    },
    
    /**
     * 重新开始监控
     */
    restart() {
        this.stop();
        this.init();
    }
};

/**
 * 开发工具模块
 * 包含字符串提取、自动更新和词典处理等开发工具
 */
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
            await versionChecker.checkForUpdates();
        }
        
        // 初始化翻译核心功能
        if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 开始初始化翻译核心...`);
        }
        
        // 执行初始翻译
        translationCore.translate();
        
        // 初始化页面监控
        pageMonitor.init();
        
        // 在调试模式下，提供工具到全局作用域
        if (CONFIG.debugMode) {
            // 加载工具类
            const { AutoStringUpdater, DictionaryProcessor } = loadTools();
            
            // 初始化并挂载工具
            window.GitHubTranslationHelper = stringExtractor;
            window.AutoStringUpdater = new AutoStringUpdater();
            window.DictionaryProcessor = new DictionaryProcessor();
            
            console.log(`[GitHub 中文翻译] 脚本 v${CONFIG.version} 初始化成功`);
            console.log('[GitHub 中文翻译] 开发工具已加载到全局作用域:');
            console.log('  - 字符串提取工具: window.GitHubTranslationHelper');
            console.log('  - 自动更新工具: window.AutoStringUpdater');
            console.log('  - 词典处理工具: window.DictionaryProcessor');
            console.log('\n使用示例:');
            console.log('  // 收集页面字符串');
            console.log('  GitHubTranslationHelper.collectStrings(true)');
            console.log('  // 查看更新报告');
            console.log('  AutoStringUpdater.showReportInConsole()');
            console.log('  // 查看词典统计');
            console.log('  DictionaryProcessor.showStatisticsInConsole()');
        }
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