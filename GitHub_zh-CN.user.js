// ==UserScript==
// @name         GitHub 网站国际化之中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.7.8
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
        }
    };

    // ========== 配置项 ==========
    const CONFIG = {
        // 当前脚本版本号（用于统一管理）
        version: '1.7.8',
        // 翻译延迟时间（毫秒）
        debounceDelay: 200,
        // 路由变化后翻译延迟时间（毫秒）
        routeChangeDelay: 400,
        // 是否启用调试日志
        debugMode: false,
        // 更新检测配置
        updateCheck: {
            // 是否启用自动更新检测
            enabled: true,
            // 更新检测间隔（小时）
            intervalHours: 24,
            // GitHub 原始脚本 URL
            scriptUrl: 'https://github.com/sutchan/GitHub_i18n/raw/main/GitHub_zh-CN.userjs',
            // 是否启用自动版本号更新
            autoUpdateVersion: true
        },
        // 性能优化配置
        performance: {
            // 是否启用深度DOM监听
            enableDeepObserver: false,
            // 是否启用部分匹配翻译
            enablePartialMatch: false,
            // 单次加载的最大字典大小
            maxDictSize: 2000,
            // 是否使用翻译缓存
            enableTranslationCache: true,
            // 是否启用翻译词典优化
            enableDictOptimization: true,
            // 是否启用正则表达式优化
            enableRegexOptimization: true,
            // 翻译缓存最大大小
            maxCacheSize: 1000,
            // 正则表达式缓存大小限制
            regexCacheSize: 500,
            // 节流间隔
            throttleInterval: 200
        },
        // 选择器常量
        selectors: {
            // 关键区域选择器
            keyAreas: ['#header', '.application-main', '.js-repo-nav', '#repository-details-container'],
            // 翻译目标选择器
            translationTargets: [
                '#header',                          // 顶部导航栏
                '.Header-item--full',               // 中央菜单
                '.HeaderMenu',                      // 个人下拉菜单容器
                '.UnderlineNav',                    // 仓库页标签导航
                '.dropdown-menu',                   // 传统下拉菜单
                '.SelectMenu',                      // GitHub现代下拉菜单
                '.Popover-menu',                    // 弹出菜单
                '.menu',                            // 通用菜单类
                '.ActionList',                      // 操作列表菜单
                '.BorderGrid',                      // 设置页面网格
                '.Box',                             // 设置项容器
                '.menu-item',                       // 菜单项
                '.js-selected-navigation-item',     // 选中项
                '.Layout',                          // 通用布局容器
                '.application-main',                // 主内容区（保守使用）
                '.js-menu-container',               // JavaScript生成的菜单容器
                '.js-repo-nav',                     // 仓库导航栏
                '.repository-details-container'     // 仓库详情容器
            ],
            // 弹出菜单选择器
            popupMenus: [
                '[aria-label="Menu"]',            // 带标签的菜单
                '[role="menu"]',                 // 具有menu角色的元素
                '.ReactModal__Content',            // React模态框
                '.Overlay-backdrop',               // 覆盖层
                '[data-component-type="dropdown"]' // 数据组件类型标记的下拉菜单
            ]
        },
        // 页面路径模式
        pagePatterns: {
            search: /\/search/,
            repository: /\/[^/]+\/[^/]+/,
            issues: /\/[^/]+\/[^/]+\/issues/,
            pullRequests: /\/[^/]+\/[^/]+\/pull/,
            settings: /\/settings/,
            dashboard: /^\/$|\/(explore|notifications|stars|gists|codespaces|projects|organizations|dashboard)$/
        }
    };

    // ========== 翻译词典模块 ==========
    /**
     * 翻译词典模块
     * 功能：按页面类型组织翻译词典，支持按需加载
     */
    const translationModule = {
        // 核心功能翻译
        core: {
            // 基础UI元素
            'Dashboard': '仪表板',
            'Profile': '个人资料',
            'Projects': '项目',
            'Settings': '设置',
            'Sign out': '退出登录',
            'Learn Git and GitHub without any code': '无需编写代码即可学习 Git 和 GitHub',
            'Create a new repository': '创建新仓库',
            'Import a repository': '导入仓库',
            'New gist': '新建代码片段',
            'New organization': '新建组织',
            'New project': '新建项目',
            'Your repositories': '你的仓库',
            'Your stars': '你的标星',
            'Explore': '探索',
            'Help': '帮助',
            'Search GitHub': '搜索 GitHub',
            'Notifications': '通知',
            'View all notifications': '查看所有通知',
            'Create repository': '创建仓库',
            'Issues': '问题',
            'Pull requests': '拉取请求',
            'Actions': '操作',
            'Wiki': '维基',
            'Security': '安全',
            'Insights': '洞察',
            'Code': '代码'
        },
    
        // 其他页面模块（暂时为空，等待重新抓取）
        dashboard: {
            'Overview': '概览',
            'Repositories': '仓库',
            'Activity': '活动',
            'Contributions': '贡献',
            'Popular repositories': '热门仓库',
            'Recent activity': '最近活动',
            'Starred repositories': '已标星仓库',
            'Your profile': '你的个人资料',
            'Your organizations': '你的组织'
    },
    notifications: {
        'All notifications': '所有通知',
        'Unread': '未读',
        'Participating': '参与',
        'Mentioned': '被提及',
        'Pull requests': '拉取请求',
        'Issues': '问题',
        'Commits': '提交',
        'Mark all as read': '全部标记为已读',
        'Save': '保存',
        'Mute': '静音'
    },
    codespaces: {
        'Start coding in seconds with Codespaces': '待翻译：Start coding in seconds with Codespaces',
        'How does Codespaces work?': '待翻译：How does Codespaces work?',
        'How do I use Codespaces?': '待翻译：How do I use Codespaces?',
        'Is Codespaces available for individual developers?': '待翻译：Is Codespaces available for individual developers?',
        'Is Codespaces available for teams and companies?': '待翻译：Is Codespaces available for teams and companies?',
        'How much does Codespaces cost?': '待翻译：How much does Codespaces cost?',
        'Can I self-host Codespaces?': '待翻译：Can I self-host Codespaces?',
        'How do I access Codespaces with LinkedIn Learning?': '待翻译：How do I access Codespaces with LinkedIn Learning?',
        'How do I enable Codespaces on GitHub?': '待翻译：How do I enable Codespaces on GitHub?',
        'Is Codespaces available for students?': '待翻译：Is Codespaces available for students?',
        'Is Codespaces available for open source maintainers?': '待翻译：Is Codespaces available for open source maintainers?',
        'There are a number of entry points to spin up a Codespaces environment, including:': '待翻译：There are a number of entry points to spin up a Codespaces environment, including:',
        'Codespaces cannot be self-hosted.': '待翻译：Codespaces cannot be self-hosted.',
        'enable Codespaces in an organization in our docs': '待翻译：enable Codespaces in an organization in our docs',
        'Codespaces': '待翻译：Codespaces'
    },
    search: {
        'Search GitHub': '搜索 GitHub',
        'Advanced search': '高级搜索',
        'No results found': '未找到结果',
        'Clear': '清除',
        'Filters': '筛选器',
        'Sort': '排序',
        'Type': '类型',
        'Language': '语言',
        'More options': '更多选项',
        'Code': '代码',
        'Commits': '提交',
        'Issues': '问题',
        'Pull requests': '拉取请求',
        'Users': '用户',
        'Repositories': '仓库'
},
    
    // 按需创建最终翻译词典（使用Map替代对象字面量以提高性能）
    createTranslationMap() {
        // 根据当前页面选择需要加载的词典模块
        const currentPath = utils.getCurrentPath();
        const selectedModules = ['core'];
        if (CONFIG.pagePatterns.search.test(currentPath)) {
            selectedModules.push('search');
        } else if (CONFIG.pagePatterns.dashboard.test(currentPath)) {
            selectedModules.push('dashboard');
            selectedModules.push('notifications');
        } else if (currentPath.includes('/notifications')) {
            selectedModules.push('notifications');
        } else if (currentPath.includes('/codespaces')) {
            selectedModules.push('codespaces');
        }
        // 创建合并后的翻译Map
        const translationMap = new Map();
        selectedModules.forEach(moduleName => {
            const moduleDict = this[moduleName];
            if (moduleDict) {
                for (const [key, value] of Object.entries(moduleDict)) {
                    translationMap.set(key, value);
                }
            }
        });
        // 对于不在特定页面模块的其他页面，加载常用的通用翻译
        if (selectedModules.length === 1) { // 只加载了core模块
            // 可以添加一些额外的常用翻译项
            if (CONFIG.pagePatterns.repository.test(currentPath)) {
                // 仓库页面的一些通用翻译
                translationMap.set('Code', '代码');
                translationMap.set('Issues', '问题');
                translationMap.set('Pull requests', '拉取请求');
                translationMap.set('Actions', '操作');
                translationMap.set('Projects', '项目');
                translationMap.set('Wiki', '维基');
                translationMap.set('Security', '安全');
                translationMap.set('Insights', '洞察');
                translationMap.set('Settings', '设置');
            }
        }
        return translationMap;
    },
    
    // 获取合并后的翻译词典
    getTranslationDict() {
        // 缓存翻译词典，避免重复创建
        if (!this.cachedDict) {
            this.cachedDict = this.createTranslationMap();
        }
        return this.cachedDict;
    },
    
    // 重置缓存（用于路由变化时重新加载词典）
    resetCache() {
        this.cachedDict = null;
        }
};

// 初始化翻译词典（按需加载）（按需加载）
const TRANSLATION_DICT = translationModule.getTranslationDict();

/**
 * 启动翻译脚本
 * 功能：实现页面翻译的核心逻辑，包括DOM元素查找和文本替换
 */
function startScript() {
    /**
     * 翻译指定的DOM元素
     * @param {HTMLElement} element - 要翻译的DOM元素
     */
    function translateElement(element) {
        if (!element || !element.childNodes || !TRANSLATION_DICT.size) return;
        
        // 遍历子节点进行翻译
        Array.from(element.childNodes).forEach(node => {
            // 只处理文本节点
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
                let originalText = node.nodeValue;
                let translatedText = originalText;
                
                // 尝试使用翻译词典进行替换
                TRANSLATION_DICT.forEach((translation, original) => {
                    const regex = new RegExp(utils.escapeRegExp(original), 'gi');
                    if (regex.test(translatedText)) {
                        translatedText = translatedText.replace(regex, match => {
                            // 保持原始大小写（简单实现）
                            if (match === match.toUpperCase()) {
                                return translation.toUpperCase();
                            } else if (match.charAt(0) === match.charAt(0).toUpperCase()) {
                                return translation.charAt(0).toUpperCase() + translation.slice(1);
                            }
                            return translation;
                        });
                    }
                });
                
                // 如果文本被翻译了，更新节点值
                if (translatedText !== originalText) {
                    node.nodeValue = translatedText;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // 递归处理子元素，但跳过一些不需要翻译的元素
                const tagName = node.tagName.toLowerCase();
                if (!['script', 'style', 'code', 'pre', 'textarea'].includes(tagName)) {
                    translateElement(node);
                }
            }
        });
    }
    
    /**
     * 翻译整个页面
     */
    function translatePage() {
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 开始翻译页面...');
        }
        
        // 遍历关键区域进行翻译
        CONFIG.selectors.keyAreas.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => translateElement(element));
        });
        
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 页面翻译完成');
        }
    }
    
    /**
     * 设置路由变化监听
     * GitHub 使用 PJAX 实现无刷新导航，需要监听路由变化
     */
    function setupRouteChangeObserver() {
        // 监听 popstate 事件
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                translationModule.resetCache();
                translatePage();
            }, CONFIG.routeChangeDelay);
        });
        
        // 监听 DOM 变化，处理动态加载的内容
        if (CONFIG.performance.enableDeepObserver) {
            const observer = new MutationObserver(utils.throttle((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                translateElement(node);
                            }
                        });
                    }
                });
            }, CONFIG.performance.throttleInterval));
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    /**
     * 初始化脚本
     */
    function init() {
        try {
            // 执行初始翻译
            translatePage();
            
            // 设置路由变化监听
            setupRouteChangeObserver();
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 脚本 v${CONFIG.version} 初始化成功`);
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 脚本初始化失败:', error);
        }
    }
    
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // 如果DOM已经加载完成，直接初始化
        init();
    }
}

    // 🕒 启动脚本
    startScript();

})();