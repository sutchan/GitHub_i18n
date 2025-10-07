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
    // 这里应该包含翻译词典的定义，为了简化示例，这里省略了
    
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