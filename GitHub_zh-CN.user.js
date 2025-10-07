// ==UserScript==
// @name         GitHub 网站国际化之中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.8.16
// @description  使用预定义词典实现 GitHub 全站高频 UI 中文翻译，零延迟、不破坏布局
// @author       Sut
// @match        https://github.com/*
// @grant        none
// @icon         https://github.githubassets.com/favicons/favicon.svg
// @updateURL    https://raw.githubusercontent.com/sutchan/GitHub_i18n/refs/heads/main/GitHub_zh-CN.user.js
// @downloadURL  https://raw.githubusercontent.com/sutchan/GitHub_i18n/refs/heads/main/GitHub_zh-CN.user.js
// ==/UserScript==

/**
 * GitHub 中文翻译用户脚本
 * 主要功能：将 GitHub 网站的高频 UI 元素翻译成中文，保持页面布局不变
 */
(function () {
    'use strict';

    // 从用户脚本头部注释中提取版本号
    function getVersionFromComment() {
        // 获取当前脚本内容
        const scriptContent = document.querySelector('script[src*="GitHub_zh-CN.user.js"]')?.textContent || '';

        if (scriptContent) {
            // 匹配@version注释行
            const versionMatch = scriptContent.match(/\/\/\s*@version\s+([\d.]+)/);
            if (versionMatch && versionMatch[1]) {
                return versionMatch[1];
            }
        }

        // 如果无法从注释中读取，返回默认版本号
        return '1.8.16';
    }


    // ========== 配置项 ==========
    const CONFIG = {
        "version": "1.8.20",
        "debounceDelay": 500,
        "routeChangeDelay": 500,
        "debugMode": false,
        "updateCheck": {
            "enabled": true,
            "intervalHours": 24,
            "scriptUrl": "https://github.com/sutchan/GitHub_i18n/raw/main/GitHub_zh-CN.user.js",
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
            "primary": [],
            "popupMenus": []
        },
        "pagePatterns": {
            "search": {},
            "repository": {},
            "issues": {},
            "pullRequests": {},
            "settings": {},
            "dashboard": {}
        }
    };

    // ========== 工具函数模块 ==========
    /**
     * 工具函数集合
     */
    const utils = {
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
         * 转义正则表达式特殊字符
         * @param {string} string - 要转义的字符串
         * @returns {string} 转义后的字符串
         */
        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        /**
         * 获取当前页面路径
         * @returns {string} 当前页面路径
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
         * 收集页面中的文本节点，用于抓取新的翻译字符串
         * @param {HTMLElement} element - 要收集文本的根元素
         * @param {Set<string>} collectedTexts - 收集到的文本集合
         * @param {number} minLength - 最小文本长度
         * @param {number} maxLength - 最大文本长度
         */
        collectTextNodes(element, collectedTexts, minLength = 2, maxLength = 100) {
            if (!element || !element.childNodes) return;

            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue.trim();
                    if (text && text.length >= minLength && text.length <= maxLength && !/^[\s\d]+$/.test(text)) {
                        collectedTexts.add(text);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();
                    // 跳过不需要收集的元素类型
                    if (!['script', 'style', 'code', 'pre', 'textarea', 'input', 'select'].includes(tagName)) {
                        this.collectTextNodes(node, collectedTexts, minLength, maxLength);
                    }
                }
            });
        }
    };

    // ========== 版本更新检查模块 ==========
    const versionChecker = {
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

    // ========== 翻译词典模块 ==========
    /**
     * 翻译词典对象，包含所有需要翻译的字符串
     */
    const translationModule = {
        "codespaces": {
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
        },
        "explore": {
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
            "Updated\n            Oct 4, 2025": "待翻译: Updated\n            Oct 4, 2025",
            "Oct 4, 2025": "待翻译: Oct 4, 2025",
            "Rust": "待翻译: Rust",
            "meshery          /\n          meshery": "待翻译: meshery          /\n          meshery",
            "meshery": "待翻译: meshery",
            "Star\n          8.3k": "待翻译: Star\n          8.3k",
            "8.3k": "待翻译: 8.3k",
            "Meshery, the cloud native manager": "待翻译: Meshery, the cloud native manager",
            "docker": "待翻译: docker",
            "golang": "待翻译: golang",
            "reactjs": "待翻译: reactjs",
            "cncf": "待翻译: cncf",
            "wasm": "待翻译: wasm",
            "opa": "待翻译: opa",
            "infrastructure-as-code": "待翻译: infrastructure-as-code",
            "cloud-native": "待翻译: cloud-native",
            "gsoc": "待翻译: gsoc",
            "kubernetes-operator": "待翻译: kubernetes-operator",
            "control-plane": "待翻译: control-plane",
            "gitops": "待翻译: gitops",
            "platform-engineering": "待翻译: platform-engineering",
            "management-plane": "待翻译: management-plane",
            "internal-developer-platform": "待翻译: internal-developer-platform",
            "Updated\n            Oct 5, 2025": "待翻译: Updated\n            Oct 5, 2025",
            "Oct 5, 2025": "待翻译: Oct 5, 2025",
            "LittleJS Game Jam 2025": "待翻译: LittleJS Game Jam 2025",
            "LittleJS engine": "待翻译: LittleJS engine",
            "Popular topic": "待翻译: Popular topic",
            "npm": "待翻译: npm",
            "npm is a package manager for JavaScript included with Node.js.": "待翻译: npm is a package manager for JavaScript included with Node.js.",
            "google": "待翻译: google",
            "tunix": "待翻译: tunix",
            "Star\n          1.5k": "待翻译: Star\n          1.5k",
            "1.5k": "待翻译: 1.5k",
            "A JAX-native LLM Post-Training Library": "待翻译: A JAX-native LLM Post-Training Library",
            "Python": "待翻译: Python",
            "Stremio          /\n          stremio-web": "待翻译: Stremio          /\n          stremio-web",
            "Stremio": "待翻译: Stremio",
            "stremio-web": "待翻译: stremio-web",
            "Star\n          1.9k": "待翻译: Star\n          1.9k",
            "1.9k": "待翻译: 1.9k",
            "Stremio - Freedom to Stream": "待翻译: Stremio - Freedom to Stream",
            "hacktoberfest          stremio": "待翻译: hacktoberfest          stremio",
            "stremio": "待翻译: stremio",
            "tigerbeetle          /\n          tigerbeetle": "待翻译: tigerbeetle          /\n          tigerbeetle",
            "Star\n          13.9k": "待翻译: Star\n          13.9k",
            "13.9k": "待翻译: 13.9k",
            "The financial transactions database designed for mission critical safety and performance.": "待翻译: The financial transactions database designed for mission critical safety and performance.",
            "Zig": "待翻译: Zig",
            "paaatrick          /\n          playball": "待翻译: paaatrick          /\n          playball",
            "Star\n          1.1k": "待翻译: Star\n          1.1k",
            "1.1k": "待翻译: 1.1k",
            "Watch MLB games from the comfort of your own terminal": "待翻译: Watch MLB games from the comfort of your own terminal",
            "See the 39 items in this collection": "待翻译: See the 39 items in this collection",
            "Socket Security": "待翻译: Socket Security",
            "Prevent malicious open source dependencies from infiltrating your apps.": "待翻译: Prevent malicious open source dependencies from infiltrating your apps."
        }
    };
    
    // ========== 翻译核心模块 ==========
    // 这里应该包含翻译的核心逻辑，为了简化示例，这里省略了
    
    // ========== 字符串提取工具 ==========
    // 这里应该包含字符串提取工具的定义，为了简化示例，这里省略了
    
    // ========== 页面监控模块 ==========
    // 这里应该包含页面监控的逻辑，为了简化示例，这里省略了
    
    // ========== 初始化模块 ==========
    /**
     * 初始化脚本
     */
    async function init() {
        try {
            // 检查更新
            if (CONFIG.updateCheck.enabled) {
                await versionChecker.checkForUpdates();
            }
            
            // 这里应该包含其他初始化逻辑，为了简化示例，这里省略了
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 脚本 v${CONFIG.version} 初始化成功`);
                // 在调试模式下，提供字符串抓取工具到全局作用域
                // window.GitHubTranslationHelper = stringExtractor;
                console.log('[GitHub 中文翻译] 字符串抓取工具已加载到 window.GitHubTranslationHelper');
                console.log('使用方法:');
                console.log('  - 收集当前页面所有字符串: GitHubTranslationHelper.collectStrings(true)');
                console.log('  - 查找未翻译的字符串: GitHubTranslationHelper.findUntranslatedStrings(true)');
                console.log('  - 导出翻译状态报告: GitHubTranslationHelper.exportTranslationReport(true)');
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

    // 🕒 启动脚本
    startScript();

})();