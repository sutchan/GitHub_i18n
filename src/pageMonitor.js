/**
 * 页面监控模块
 * @file pageMonitor.js
 * @version 1.8.172
 * @date 2025-06-17
 * @author Sut
 * @description 负责监听GitHub页面的变化，检测DOM更新并触发翻译
 */
import { CONFIG } from './config.js';
import { translationCore } from './translationCore.js';
import { utils } from './utils.js';
import virtualDomManager from './virtualDom.js';

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
     * 存储事件监听器引用，用于清理
     * @type {Array<{target: EventTarget, type: string, handler: Function}>}
     */
    eventListeners: [],
    
    /**
     * 存储定时检查的interval ID
     * @type {number}
     */
    fallbackIntervalId: null,
    
    /**
     * 页面卸载标记
     * @type {boolean}
     */
    isPageUnloading: false,
    
    /**
     * 节点检查缓存，用于性能优化
     * @type {Map<Node, boolean>}
     */
    nodeCheckCache: new Map(),
    
    /**
     * 缓存清理间隔（毫秒）
     * @type {number}
     */
    cacheCleanupInterval: 30000, // 30秒清理一次
    
    /**
     * 上次缓存清理时间
     * @type {number}
     */
    lastCacheCleanupTime: Date.now(),
    
    /**
     * 缓存清理定时器ID
     * @type {number}
     */
    cacheCleanupTimerId: null,
    
    /**
     * 初始化监控
     */
    init() {
        try {
            // 设置页面卸载监听，确保资源清理
            this.setupPageUnloadHandler();
            
            // 设置路径变化监听
            this.setupPathListener();
            
            // 设置DOM变化监听
            this.setupDomObserver();
            
            // 启动缓存清理定时器
            this.startCacheCleanupTimer();
            
            // 页面监控已初始化
        } catch (error) {
            console.error('[GitHub 中文翻译] 页面监控初始化失败:', error);
        }
    },
    
    /**
     * 设置页面卸载处理器
     */
    setupPageUnloadHandler() {
        // 监听页面卸载事件
        const unloadHandler = () => {
            this.isPageUnloading = true;
            this.cleanup();
        };
        
        // 监听多种卸载事件以确保兼容性
        window.addEventListener('beforeunload', unloadHandler);
        window.addEventListener('unload', unloadHandler);
        window.addEventListener('pagehide', unloadHandler);
        
        // 存储监听器引用以便清理
        this.eventListeners.push(
            { target: window, type: 'beforeunload', handler: unloadHandler },
            { target: window, type: 'unload', handler: unloadHandler },
            { target: window, type: 'pagehide', handler: unloadHandler }
        );
    },
    
    /**
     * 启动缓存清理定时器
     */
    startCacheCleanupTimer() {
        // 清理现有定时器
        this.stopCacheCleanupTimer();
        
        // 设置新的定时器
        this.cacheCleanupTimerId = setInterval(() => {
            if (!this.isPageUnloading) {
                this.cleanupNodeCheckCache();
            }
        }, this.cacheCleanupInterval);
    },
    
    /**
     * 停止缓存清理定时器
     */
    stopCacheCleanupTimer() {
        if (this.cacheCleanupTimerId) {
            clearInterval(this.cacheCleanupTimerId);
            this.cacheCleanupTimerId = null;
        }
    },
    
    /**
     * 清理节点检查缓存
     */
    cleanupNodeCheckCache() {
        try {
            // 如果缓存大小超过限制，清理最旧的条目
            const maxCacheSize = 1000;
            if (this.nodeCheckCache.size > maxCacheSize) {
                // 删除最旧的条目，保留最新的70%
                const entriesToRemove = Math.floor(this.nodeCheckCache.size * 0.3);
                const keysToRemove = Array.from(this.nodeCheckCache.keys()).slice(0, entriesToRemove);
                
                keysToRemove.forEach(key => {
                    this.nodeCheckCache.delete(key);
                });
                
                if (CONFIG.debugMode) {
                    console.log(`[GitHub 中文翻译] 清理了${keysToRemove.length}个节点检查缓存条目`);
                }
            }
            
            this.lastCacheCleanupTime = Date.now();
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 清理节点检查缓存失败:', error);
            }
        }
    },
    
    /**
     * 完全清理所有资源
     */
    cleanup() {
        try {
            // 停止监控
            this.stop();
            
            // 清理节点检查缓存
            this.nodeCheckCache.clear();
            
            // 停止缓存清理定时器
            this.stopCacheCleanupTimer();
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面监控资源已完全清理');
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 清理页面监控资源失败:', error);
            }
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
        const popstateHandler = utils.debounce(() => {
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath !== this.lastPath) {
                this.handlePathChange();
            }
        }, CONFIG.routeChangeDelay);
        
        window.addEventListener('popstate', popstateHandler);
        this.eventListeners.push({ target: window, type: 'popstate', handler: popstateHandler });
        
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
        try {
            const now = Date.now();
            // 从配置中读取性能参数，确保有默认值
            const minInterval = CONFIG.performance?.minTranslateInterval || 500; // 最小翻译间隔，默认500ms
            // 批处理大小配置，通过函数参数传入
            const useSmartThrottling = CONFIG.performance?.useSmartThrottling !== false; // 智能节流开关
            
            // 智能节流逻辑
            if (useSmartThrottling) {
                // 根据页面复杂度调整节流阈值
                const complexityFactor = this.isComplexPage() ? 2 : 1;
                const adjustedInterval = minInterval * complexityFactor;
                
                // 检查是否需要节流
                if (now - this.lastTranslateTimestamp >= adjustedInterval) {
                    return this.delayedTranslate(0); // 立即翻译
                }
                
                // 如果短时间内多次触发，设置一个延迟翻译
                if (!this.scheduledTranslate) {
                    this.scheduledTranslate = setTimeout(() => {
                        this.scheduledTranslate = null;
                        this.delayedTranslate(0);
                    }, minInterval);
                }
                
                return; // 节流生效，退出当前调用
            }
            
            // 普通节流逻辑
            if (now - this.lastTranslateTimestamp >= minInterval) {
                return this.delayedTranslate(0);
            } else if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 翻译请求被节流，距离上次翻译${now - this.lastTranslateTimestamp}ms`);
            }
        } catch (error) {
            this.handleError('translateWithThrottle', error);
        }
    },
    
    /**
     * 延迟执行翻译
     * @param {number} delay - 延迟毫秒数
     */
    async delayedTranslate() {
        try {
            // 确保性能配置正确应用
            const performanceConfig = {
                batchSize: CONFIG.performance?.batchSize || 100,
                usePartialMatch: CONFIG.performance?.usePartialMatch || false,
                enableTranslationCache: CONFIG.performance?.enableTranslationCache || true
            };
            
            // 记录执行时间
            this.lastTranslateTimestamp = Date.now();
            
            // 获取当前页面关键区域
            const keyAreas = this.identifyKeyTranslationAreas();
            
            // 记录性能数据
            if (CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.time('[GitHub 中文翻译] 翻译耗时');
            }
            
            // 根据关键区域和性能配置决定翻译方式
            if (keyAreas.length > 0) {
                // 对关键区域进行批处理翻译
                await this.processElementsInBatches(keyAreas, performanceConfig.batchSize);
                if (CONFIG.debugMode) {
                    console.log(`[GitHub 中文翻译] 已翻译关键区域: ${keyAreas.length} 个`);
                }
            } else {
                // 翻译整个页面
                await translationCore.translate(null, performanceConfig);
                if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 已翻译整个页面');
                }
            }
            
            // 记录完成时间
            if (CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.timeEnd('[GitHub 中文翻译] 翻译耗时');
            }
        } catch (error) {
            return this.handleTranslationError(error);
        }
    },
    
    /**
     * 批处理元素翻译
     * @param {HTMLElement[]} elements - 要翻译的元素数组
     * @param {number} batchSize - 每批处理的元素数量
     */
    async processElementsInBatches(elements, batchSize) {
        const performanceConfig = {
            batchSize: batchSize,
            usePartialMatch: CONFIG.performance?.usePartialMatch || false,
            enableTranslationCache: CONFIG.performance?.enableTranslationCache || true
        };
        
        // 分批处理元素
        for (let i = 0; i < elements.length; i += batchSize) {
            const batch = elements.slice(i, i + batchSize);
            await translationCore.translate(batch, performanceConfig);
        }
    },
    
    /**
     * 处理翻译错误
     * @param {Error} error - 错误对象
     */
    async handleTranslationError(error) {
        this.handleError('翻译过程', error);
        
        // 即使出错也尝试最小化翻译
        if (CONFIG.performance?.enableErrorRecovery !== false) {
            try {
                await translationCore.translateCriticalElementsOnly();
                if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 已尝试最小化翻译恢复');
                }
            } catch (recoverError) {
                this.handleError('错误恢复', recoverError);
            }
        }
    },
    
    /**
     * 统一错误处理
     * @param {string} operation - 操作名称
     * @param {Error} error - 错误对象
     */
    handleError(operation, error) {
        const errorMessage = `[GitHub 中文翻译] ${operation}时出错: ${error.message}`;
        if (CONFIG.debugMode) {
            console.error(errorMessage, error);
        } else {
            console.error(errorMessage);
        }
        
        // 记录错误次数
        this.errorCount = (this.errorCount || 0) + 1;
        
        // 如果错误过多，考虑重启监控
        if (this.errorCount > (CONFIG.performance?.maxErrorCount || 5)) {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 错误次数过多，尝试重启监控');
            }
            setTimeout(() => this.restart(), 1000);
            this.errorCount = 0;
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
            keySelectors.push('.js-discussion', '.issue-details', '.js-issue-title', '.js-issue-labels');
        } else if (/\/blob\//.test(path)) {
            // 文件查看页面
            keySelectors.push('.blob-wrapper', '.file-header', '.file-info');
        } else if (/\/commit\//.test(path)) {
            // 提交详情页面
            keySelectors.push('.commit-meta', '.commit-files', '.commit-body', '.commit-desc');
        } else if (/\/notifications/.test(path)) {
            // 通知页面
            keySelectors.push('.notifications-list', '.notification-shelf');
        } else if (/\/actions/.test(path)) {
            // Actions页面
            keySelectors.push('.workflow-run-list', '.workflow-jobs', '.workflow-run-header');
        } else if (/\/settings/.test(path)) {
            // 设置页面
            keySelectors.push('.settings-content', '.js-settings-content');
        } else if (/\/projects/.test(path)) {
            // Projects页面
            keySelectors.push('.project-layout', '.project-columns');
        } else if (/\/wiki/.test(path)) {
            // Wiki页面
            keySelectors.push('.wiki-wrapper', '.markdown-body');
        } else if (/\/search/.test(path)) {
            // 搜索结果页面
            keySelectors.push('.codesearch-results', '.search-title');
        } else if (/\/orgs\//.test(path) || /\/users\//.test(path)) {
            // 组织或用户页面
            keySelectors.push('.org-profile, .profile-timeline', '.user-profile-sticky-header', '.user-profile-main');
        } else if (/\/repos\/\w+\/\w+/.test(path)) {
            // 仓库主页面
            keySelectors.push('.repository-content', '.repository-meta-content', '.readme');
        } else {
            // 其他页面，使用通用关键区域
            keySelectors.push('.repository-content', '.profile-timeline', '.application-main', 'main');
        }
        
        // 获取并过滤存在的元素
        const elements = [];
        for (const selector of keySelectors) {
            const element = document.querySelector(selector);
            if (element) {
                elements.push(element);
            }
        }
        
        // 如果没有找到关键区域，尝试使用更通用的选择器
        if (elements.length === 0) {
            const genericSelectors = [
                '#js-pjax-container', '.application-main', 'main', 'body'
            ];
            
            for (const selector of genericSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    elements.push(element);
                    break;
                }
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
            // 先断开之前可能存在的observer
            if (this.observer) {
                try {
                    this.observer.disconnect();
                    this.observer = null;
                } catch (error) {
                    if (CONFIG.debugMode) {
                        console.warn('[GitHub 中文翻译] 断开现有observer失败:', error);
                    }
                }
            }
            
            // 检测当前页面模式
            const pageMode = this.detectPageMode();
            
            // 选择最优的观察根节点 - 性能优化：减少观察范围
            const rootNode = this.selectOptimalRootNode(pageMode);
            
            // 根据页面类型调整观察器配置
            const observerConfig = this.getOptimizedObserverConfig(pageMode);
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 当前页面模式:', pageMode);
            }
            
            // 使用命名函数以便调试和维护
            const handleMutations = (mutations) => {
                try {
                    // 检测页面模式
                    const pageMode = this.detectPageMode();
                    // 智能判断是否需要翻译
                    if (this.shouldTriggerTranslation(mutations, pageMode)) {
                        this.translateWithThrottle();
                    }
                } catch (error) {
                    console.error('[GitHub 中文翻译] 处理DOM变化时出错:', error);
                }
            };
            
            this.observer = new MutationObserver(utils.debounce(handleMutations, CONFIG.debounceDelay));
            
            // 开始观察最优根节点
            if (rootNode) {
                try {
                    this.observer.observe(rootNode, observerConfig);
                    if (CONFIG.debugMode) {
                        console.log('[GitHub 中文翻译] DOM观察器已启动，观察范围:', rootNode.tagName + (rootNode.id ? '#' + rootNode.id : ''));
                    }
                } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 启动DOM观察者失败:', error);
                    }
                    // 降级方案
                    this.setupFallbackMonitoring();
                }
            } else {
                console.error('[GitHub 中文翻译] 无法找到合适的观察节点，回退到body');
                // 如果body还不存在，等待DOMContentLoaded
                const domLoadedHandler = () => {
                    try {
                        this.setupDomObserver(); // 重新尝试设置DOM观察器
                    } catch (error) {
                        if (CONFIG.debugMode) {
                            console.error('[GitHub 中文翻译] DOMContentLoaded后启动观察者失败:', error);
                        }
                    }
                    // 移除一次性监听器
                    document.removeEventListener('DOMContentLoaded', domLoadedHandler);
                    // 从事件监听器数组中移除
                    this.eventListeners = this.eventListeners.filter(l => !(l.target === document && l.type === 'DOMContentLoaded'));
                };
                
                document.addEventListener('DOMContentLoaded', domLoadedHandler);
                this.eventListeners.push({ target: document, type: 'DOMContentLoaded', handler: domLoadedHandler });
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 设置DOM观察器失败:', error);
            // 降级方案
            this.setupFallbackMonitoring();
        }
    },
    
    /**
     * 选择最佳的DOM观察根节点
     * 减少观察的DOM范围，提高性能
     * @param {string} pageMode - 页面模式
     * @returns {HTMLElement} 最佳观察根节点
     */
    selectOptimalRootNode(pageMode) {
        // 如果没有提供页面模式，则自动检测
        const effectivePageMode = pageMode || this.detectPageMode();
        // 根据页面模式定制候选选择器优先级
        let candidateSelectors;
        // 基于页面模式的候选选择器列表
        switch (effectivePageMode) {
            case 'search':
                candidateSelectors = [
                    '.codesearch-results', // 搜索结果容器
                    '#js-pjax-container',   // 通用PJAX容器
                    'main',                 // 主内容
                    'body'                  // 降级方案
                ];
                break;
            
            case 'issues':
            case 'pullRequests':
                candidateSelectors = [
                    '.js-discussion',       // 讨论区容器
                    '.issue-details',       // 问题详情容器
                    '#js-issue-title',      // 问题标题
                    '#js-pjax-container',   // 通用PJAX容器
                    'main',                 // 主内容
                    'body'                  // 降级方案
                ];
                break;
            
            case 'repository':
                candidateSelectors = [
                    '#js-repo-pjax-container', // 仓库页面主容器
                    '.repository-content',     // 仓库内容区域
                    '.application-main',       // 应用主容器
                    'body'                     // 降级方案
                ];
                break;
                
            case 'notifications':
                candidateSelectors = [
                    '.notifications-list',    // 通知列表
                    '.notification-shelf',    // 通知顶栏
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
                
            case 'wiki':
                candidateSelectors = [
                    '.wiki-wrapper',         // Wiki内容包装器
                    '.markdown-body',        // Markdown内容
                    '#js-pjax-container',    // 通用PJAX容器
                    'main',                  // 主内容
                    'body'                   // 降级方案
                ];
                break;
                
            case 'actions':
                candidateSelectors = [
                    '.workflow-run-list',     // 工作流运行列表
                    '.workflow-jobs',         // 工作流任务列表
                    '.workflow-run-header',   // 工作流运行头部
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
            
            case 'projects':
                candidateSelectors = [
                    '.project-layout',        // 项目布局容器
                    '.project-columns',       // 项目列容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
            
            case 'packages':
                candidateSelectors = [
                    '.packages-list',         // 包列表容器
                    '.package-details',       // 包详情容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
            
            case 'security':
                candidateSelectors = [
                    '.security-overview',     // 安全概览容器
                    '.vulnerability-list',    // 漏洞列表
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
            
            case 'insights':
                candidateSelectors = [
                    '.insights-container',    // 洞察容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
            
            case 'settings':
                candidateSelectors = [
                    '.settings-content',      // 设置内容
                    '.js-settings-content',   // JS设置内容
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
            
            case 'profile':
            case 'organizations':
                candidateSelectors = [
                    '.profile-timeline',      // 个人资料时间线
                    '.org-profile',           // 组织资料
                    '.user-profile-main',     // 用户资料主内容
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ];
                break;
                
            default:
                // 默认选择器优先级
                candidateSelectors = [
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    '.application-main',      // 应用主容器
                    'body'                    // 降级方案
                ];
        }
        
        for (const selector of candidateSelectors) {
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
     * 根据页面模式和复杂度动态调整观察选项
     * @param {string} pageMode - 页面模式
     * @returns {Object} 优化的MutationObserver配置
     */
    getOptimizedObserverConfig(pageMode) {
        // 如果没有提供页面模式，则自动检测
        pageMode = pageMode || this.detectPageMode();
        
        // 基础配置
        const baseConfig = {
            childList: true  // 始终监听子节点变化
        };
        
        // 根据配置决定是否监听字符数据变化
        if (!CONFIG.performance.ignoreCharacterDataMutations) {
            baseConfig.characterData = true;
        }
        
        // 根据页面模式调整subtree观察选项
        const complexPages = ['wiki', 'issues', 'pullRequests', 'markdown'];
        const simplePages = ['search', 'codespaces', 'marketplace'];
        
        // 复杂页面可能需要更深入的观察，但要平衡性能
        if (complexPages.includes(pageMode)) {
            baseConfig.subtree = CONFIG.performance.observeSubtree;
        } else if (simplePages.includes(pageMode)) {
            // 简单页面可以减少观察深度，提高性能
            baseConfig.subtree = false;
        } else {
            // 默认配置
            baseConfig.subtree = CONFIG.performance.observeSubtree;
        }
        
        // 根据配置决定是否观察属性变化
        if (CONFIG.performance.observeAttributes && !CONFIG.performance.ignoreAttributeMutations) {
            baseConfig.attributes = true;
            baseConfig.attributeFilter = CONFIG.performance.importantAttributes;
        }
        
        return baseConfig;
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
     * 检测当前页面模式
     * 复用translationCore中的页面模式检测逻辑
     * @returns {string} 当前页面模式
     */
    detectPageMode() {
        return translationCore.detectPageMode();
    },
    
    /**
     * 根据页面模式获取快速路径阈值
     * @param {string} pageMode - 页面模式
     * @returns {number} 快速路径阈值
     */
    getQuickPathThresholdByPageMode(pageMode) {
        const thresholds = {
            'search': 5,
            'issues': 4,
            'pullRequests': 4,
            'wiki': 6,
            'actions': 5,
            'codespaces': 3
        };
        return thresholds[pageMode] || 3;
    },
    
    /**
     * 获取页面模式特定的阈值
     * @param {string} pageMode - 页面模式
     * @returns {number} 页面模式特定的阈值
     */
    getModeSpecificThreshold(pageMode) {
        const thresholds = {
            'issues': 0.35,
            'pullRequests': 0.35,
            'wiki': 0.4,
            'search': 0.3,
            'codespaces': 0.25
        };
        return thresholds[pageMode];
    },
    
    /**
     * 根据页面模式获取最小文本长度
     * @param {string} pageMode - 页面模式
     * @returns {number} 最小文本长度
     */
    getMinTextLengthByPageMode(pageMode) {
        const lengths = {
            'issues': 4,
            'pullRequests': 4,
            'wiki': 5,
            'search': 3
        };
        return lengths[pageMode] || CONFIG.performance.minTextLengthToTranslate || 3;
    },
    
    /**
     * 根据页面模式判断是否应该跳过元素
     * @param {HTMLElement} element - 元素
     * @param {string} pageMode - 页面模式
     * @returns {boolean} 是否应该跳过
     */
    shouldSkipElementByPageMode(element, pageMode) {
        if (!element || !pageMode) return false;
        
        // 通用跳过规则
        if (element.tagName === 'CODE' || element.tagName === 'SCRIPT' || 
            element.tagName === 'STYLE' || element.classList.contains('blob-code')) {
            return true;
        }
        
        // 特定页面模式的元素跳过规则
        switch (pageMode) {
            case 'codespaces':
                return element.classList.contains('terminal') || 
                       element.classList.contains('command-input') ||
                       element.dataset.terminal;
            case 'wiki':
                // wiki页面中的代码块
                return element.classList.contains('codehilite') || 
                       element.classList.contains('highlight') ||
                       element.closest('.highlight');
            case 'issues':
            case 'pullRequests':
                // 跳过代码块和diff
                return element.classList.contains('blob-code') ||
                       element.classList.contains('diff-line');
            case 'search':
                // 搜索页面特定跳过规则
                if (element.classList.contains('search-match')) {
                    return false; // 搜索匹配结果不要跳过
                }
                return element.classList.contains('text-small') ||
                       element.classList.contains('link-gray');
            default:
                return false;
        }
    },
    
    /**
     * 智能判断是否需要触发翻译
     * 比简单的变化检测更高效
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @param {string} pageMode - 当前页面模式
     * @returns {boolean} 是否需要触发翻译
     */
    shouldTriggerTranslation(mutations, pageMode) {
        // 如果没有提供页面模式，则自动检测
        pageMode = pageMode || this.detectPageMode();
        try {
            // 空检查
            if (!mutations || mutations.length === 0) {
                return false;
            }
            
            // 获取性能配置
            const { 
                importantElements = [], 
                ignoreElements = [], 
                importantAttributes = ['id', 'class', 'href', 'title'],
                mutationThreshold = 30,
                contentChangeWeight = 1,
                importantChangeWeight = 2,
                translationTriggerRatio = 0.3,
                maxMutationProcessing = 50,
                minContentChangesToTrigger = 3,
                ignoreCharacterDataMutations = false,
                ignoreAttributeMutations = false
            } = CONFIG.performance;
            
            // 快速路径：少量变化直接检查，阈值根据页面模式调整
            const quickPathThreshold = this.getQuickPathThresholdByPageMode(pageMode);
            if (mutations.length <= quickPathThreshold) {
                return this.detectImportantChanges(mutations, pageMode);
            }
            
            // 大量变化时的优化检测
            let contentChanges = 0;
            let importantChanges = 0;
            // 限制检查数量，避免处理过多变化
            const maxCheckCount = Math.min(mutations.length, Math.max(mutationThreshold, maxMutationProcessing)); 
            
            // 缓存重要元素和忽略元素的匹配结果，避免重复计算
            const elementCheckCache = new WeakMap();
            
            // 分批处理变化，每批检查一定数量
            for (let i = 0; i < maxCheckCount; i++) {
                const mutation = mutations[i];
                
                // 根据配置忽略特定类型的变化
                if (ignoreCharacterDataMutations && mutation.type === 'characterData') {
                    continue;
                }
                if (ignoreAttributeMutations && mutation.type === 'attributes') {
                    continue;
                }
                
                // 跳过空目标或已缓存为忽略的元素
                if (mutation.target) {
                    // 从缓存获取忽略结果或计算并缓存
                    let isIgnored = elementCheckCache.get(mutation.target);
                    if (isIgnored === undefined) {
                        isIgnored = this.shouldIgnoreElement(mutation.target, ignoreElements, elementCheckCache, pageMode);
                        elementCheckCache.set(mutation.target, isIgnored);
                    }
                    
                    if (isIgnored) {
                        continue;
                    }
                    
                    // 检查是否为重要元素，结果也加入缓存
                    let isImportant = elementCheckCache.get(`important-${mutation.target}`);
                    if (isImportant === undefined && mutation.target.nodeType === Node.ELEMENT_NODE) {
                        isImportant = this.isImportantElement(mutation.target, importantElements, elementCheckCache, pageMode);
                        elementCheckCache.set(`important-${mutation.target}`, isImportant);
                    }
                    
                    // 重要元素变化直接触发翻译
                    if (isImportant) {
                        return true;
                    }
                }
                
                // 检查重要属性变化
                if (mutation.type === 'attributes') {
                    if (CONFIG.performance.observeAttributes && importantAttributes.includes(mutation.attributeName)) {
                        importantChanges++;
                        // 重要属性变化达到阈值直接触发
                        if (importantChanges >= 3) {
                            return true;
                        }
                    }
                    continue; // 属性变化检查完毕，继续下一个mutation
                }
                
                // 检查内容相关变化（字符数据或子节点变化）
                if (this.isContentRelatedMutation(mutation, pageMode)) {
                    contentChanges++;
                    
                    // 内容变化达到阈值直接触发
                    if (contentChanges >= Math.max(5, minContentChangesToTrigger)) {
                        return true;
                    }
                }
            }
            
            // 检查内容变化是否达到最小触发阈值
            if (contentChanges < minContentChangesToTrigger) {
                return false;
            }
            
            // 计算加权变化比例
            const weightedChanges = (contentChanges * contentChangeWeight) + (importantChanges * importantChangeWeight);
            const totalChangesChecked = maxCheckCount;
            
            // 根据页面模式获取特定阈值或使用默认阈值
            const threshold = this.getModeSpecificThreshold(pageMode) || translationTriggerRatio;
            
            // 根据加权变化比例决定是否触发翻译
            return weightedChanges / totalChangesChecked > threshold;
        } catch (error) {
            console.error('[GitHub 中文翻译] 判断翻译触发条件时出错:', error);
            return false;
        }
    },
    
    /**
     * 判断元素是否为重要元素
     * @param {HTMLElement} element - 要检查的元素
     * @param {string[]} importantElements - 重要元素选择器数组
     * @returns {boolean} 是否为重要元素
     */
    isImportantElement(element, importantElements, cache, pageMode) {
        try {
            // 检查是否应该基于页面模式跳过元素
            if (pageMode && this.shouldSkipElementByPageMode(element, pageMode)) {
                return false;
            }
            
            // 使用缓存
            if (cache && cache.has(element)) {
                return cache.get(element);
            }
            
            // 页面模式特定的重要元素检查
            let isImportant = false;
            
            // 基础重要元素检查
            isImportant = importantElements.some(selector => {
                try {
                    return element.matches(selector);
                } catch (e) {
                    return false; // 选择器无效时跳过
                }
            });
            
            // 页面模式特定的额外检查
            if (!isImportant && pageMode) {
                switch (pageMode) {
                    case 'issues':
                    case 'pullRequests':
                        isImportant = element.classList.contains('comment-body') || 
                                     element.classList.contains('timeline-comment-header');
                        break;
                    case 'wiki':
                        isImportant = element.classList.contains('markdown-body') || 
                                     element.tagName === 'H1' || 
                                     element.tagName === 'H2';
                        break;
                    case 'search':
                        isImportant = element.classList.contains('search-match') || 
                                     element.classList.contains('f4');
                        break;
                    case 'codespaces':
                        isImportant = element.classList.contains('codespace-status');
                        break;
                }
            }
            
            // 存储到缓存
            if (cache) {
                cache.set(element, isImportant);
            }
            
            return isImportant;
        } catch (error) {
            console.error('[GitHub 中文翻译] 判断重要元素时出错:', error);
            return false;
        }
    },
    
    /**
     * 判断是否应该忽略元素的变化
     * @param {Node} node - 要检查的节点
     * @param {string[]} ignoreElements - 忽略元素选择器数组
     * @returns {boolean} 是否应该忽略
     */
    shouldIgnoreElement(node, ignoreElements, cache, pageMode) {
        try {
            // 非元素节点不忽略
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return false;
            }
            
            const element = node;
            
            // 使用缓存
            if (cache && cache.has(node)) {
                return cache.get(node);
            }
            
            // 检查是否应该基于页面模式跳过元素
            if (pageMode && this.shouldSkipElementByPageMode(element, pageMode)) {
                if (cache) {
                    cache.set(node, true);
                }
                return true;
            }
            
            // 基础忽略元素检查
            let shouldIgnore = ignoreElements.some(selector => {
                try {
                    return element.matches(selector);
                } catch (e) {
                    return false; // 选择器无效时跳过
                }
            });
            
            // 页面模式特定的忽略规则
            if (!shouldIgnore && pageMode) {
                switch (pageMode) {
                    case 'codespaces':
                        shouldIgnore = element.classList.contains('terminal') || 
                                      element.tagName === 'PRE' || 
                                      element.classList.contains('command-input');
                        break;
                    case 'wiki':
                        // wiki页面中的代码块不忽略
                        if (element.tagName === 'PRE' && element.classList.contains('codehilite')) {
                            shouldIgnore = true;
                        }
                        break;
                    case 'search':
                        // 搜索页面中的代码片段不忽略
                        if (element.tagName === 'CODE' && !element.classList.contains('search-match')) {
                            shouldIgnore = true;
                        }
                        break;
                }
            }
            
            // 存储到缓存
            if (cache) {
                cache.set(node, shouldIgnore);
            }
            
            return shouldIgnore;
        } catch (error) {
            console.error('[GitHub 中文翻译] 判断忽略元素时出错:', error);
            return false;
        }
    },
    
    /**
     * 判断是否为内容相关的DOM变化
     * @param {MutationRecord} mutation - 变更记录
     * @returns {boolean} 是否为内容相关变化
     */
    isContentRelatedMutation(mutation, pageMode) {
        try {
            // 检查字符数据变化
            if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
                // 判断文本内容变化是否有意义
                const oldValue = mutation.oldValue || '';
                const newValue = mutation.target.textContent || '';
                
                // 忽略纯空白字符的变化
                if (oldValue.trim() === newValue.trim()) {
                    return false;
                }
                
                // 页面模式特定的文本变化阈值
                const { minLength, lengthDiffThreshold } = this.getTextChangeThreshold(pageMode);
                
                // 判断变化是否有实质内容
                const hasMeaningfulChange = oldValue !== newValue && 
                                           (newValue.length >= minLength || oldValue.length >= minLength || 
                                            Math.abs(newValue.length - oldValue.length) >= lengthDiffThreshold);
                
                return hasMeaningfulChange;
            }
            
            // 检查子节点变化
            if (mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                // 页面模式特定的子节点过滤逻辑
                return Array.from(mutation.addedNodes).some(node => {
                    // 忽略脚本、样式等非内容节点
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node;
                        // 基础过滤
                        if (element.tagName === 'SCRIPT' || 
                            element.tagName === 'STYLE' || 
                            element.tagName === 'META') {
                            return false;
                        }
                        
                        // 页面模式特定过滤
                        if (pageMode) {
                            switch (pageMode) {
                                case 'issues':
                                case 'pullRequests':
                                    // 对于Issues/PR页面，优先关注评论和描述
                                    return element.classList.contains('comment-body') || 
                                           element.classList.contains('timeline-comment') ||
                                           element.classList.contains('js-issue-title');
                                case 'wiki':
                                    // 对于wiki页面，关注内容和标题
                                    return element.classList.contains('markdown-body') || 
                                           /^H[1-6]$/.test(element.tagName);
                                case 'codespaces':
                                    // 对于codespaces页面，忽略终端输出
                                    if (element.classList.contains('terminal') || 
                                        element.classList.contains('command-input')) {
                                        return false;
                                    }
                                    break;
                                case 'search':
                                    // 搜索结果页面
                                    return element.classList.contains('search-result') || 
                                           element.classList.contains('search-match');
                            }
                        }
                        
                        // 默认接受其他元素
                        return true;
                    }
                    return node.nodeType === Node.TEXT_NODE;
                });
            }
            
            return false;
        } catch (error) {
            console.error('[GitHub 中文翻译] 判断内容相关变化时出错:', error);
            return false;
        }
    },
    
    /**
     * 判断节点是否需要翻译
     * @param {Node} node - 要检查的节点
     * @param {string} pageMode - 当前页面模式
     * @returns {boolean} 是否需要翻译
     */
    isTranslatableNode(node) {
        // 不再需要页面模式参数，简化函数逻辑
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
        const fallbackIntervalHandler = () => {
            // 只在页面可见时执行
            if (document.visibilityState === 'visible') {
                this.translateWithThrottle();
            }
        };
        
        const intervalId = setInterval(fallbackIntervalHandler, 30000); // 30秒检查一次
        
        // 保存interval ID以便后续清理
      this.fallbackIntervalId = intervalId;
      // 也保存到事件监听器数组中便于统一管理
      this.eventListeners.push({ target: window, type: 'interval', handler: null, intervalId: intervalId });
    },
    
    /**
     * 获取页面模式特定的文本变化阈值
     * @param {string} pageMode - 页面模式
     * @returns {Object} 阈值配置
     */
    getTextChangeThreshold(pageMode) {
        const defaultThresholds = { minLength: 5, lengthDiffThreshold: 3 };
        
        if (!pageMode) return defaultThresholds;
        
        switch (pageMode) {
            case 'codespaces':
                return { minLength: 8, lengthDiffThreshold: 5 }; // 代码空间更严格
            case 'wiki':
                return { minLength: 3, lengthDiffThreshold: 2 }; // wiki页面更宽松
            case 'issues':
            case 'pullRequests':
                return { minLength: 4, lengthDiffThreshold: 3 }; // 适中阈值
            case 'search':
                return { minLength: 5, lengthDiffThreshold: 4 }; // 搜索结果适中
            default:
                return defaultThresholds;
        }
    },
    
    /**
     * 检测重要的DOM变化
     * 只在有实际内容变化时触发翻译
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @param {string} pageMode - 页面模式
     * @returns {boolean} 是否有需要触发翻译的重要变化
     */
    detectImportantChanges(mutations, pageMode) {
        try {
            // 确保页面模式存在
            const currentPageMode = pageMode || this.detectPageMode();
            
            // 空检查
            if (!mutations || !Array.isArray(mutations)) {
                return false;
            }
            
            // 从配置中读取性能参数
            const { 
                // minTextLengthToTranslate = 3, // 从getMinTextLengthByPageMode获取
                importantAttributes = ['id', 'class', 'href', 'title', 'placeholder', 'alt'],
                importantElements = ['.btn', '.link', '.header', '.title', '.nav-item']
            } = CONFIG.performance;
            
            // 使用缓存避免重复检查相同的节点
            const nodeCheckCache = new WeakMap();
            
            // 快速检查：如果是少量变化，优先检查重要属性和字符数据变化
            if (mutations.length <= 2) {
                // 先检查简单的变化类型
                for (const mutation of mutations) {
                    // 字符数据变化检查
                    if (mutation.type === 'characterData' && mutation.target.nodeValue) {
                        const trimmedText = mutation.target.nodeValue.trim();
                        // 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode);
                        if (trimmedText.length >= textThreshold.minLength) {
                            return true;
                        }
                    }
                    // 重要属性变化检查
                    if (mutation.type === 'attributes' && 
                        importantAttributes.includes(mutation.attributeName)) {
                        return true;
                    }
                }
            }
            
            // 检查是否有实际内容变化
            return mutations.some(mutation => {
                // 子节点变化处理
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 过滤出可见的元素节点
                    return Array.from(mutation.addedNodes).some(node => {
                        // 检查缓存
                        let result = nodeCheckCache.get(node);
                        if (result !== undefined) {
                            return result;
                        }
                        
                        // 忽略不可翻译的节点类型
                        if (node.nodeType === Node.SCRIPT_NODE || 
                            node.nodeType === Node.STYLE_NODE || 
                            node.nodeType === Node.COMMENT_NODE ||
                            node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                            nodeCheckCache.set(node, false);
                            return false;
                        }
                        
                        // 文本节点检查
                        if (node.nodeType === Node.TEXT_NODE) {
                            const trimmedText = node.textContent.trim();
                            // 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode);
                        const isImportant = trimmedText.length >= textThreshold.minLength;
                            nodeCheckCache.set(node, isImportant);
                            return isImportant;
                        }
                        
                        // 元素节点检查
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node;
                            
                            // 跳过隐藏元素
                            const style = window.getComputedStyle(element);
                            if (style.display === 'none' || style.visibility === 'hidden') {
                                nodeCheckCache.set(node, false);
                                return false;
                            }
                            
                            // 根据页面模式跳过特定元素
                        if (this.shouldSkipElementByPageMode(element, currentPageMode)) {
                                nodeCheckCache.set(node, false);
                                return false;
                            }
                            
                            // 检查是否为重要元素
                        if (this.isImportantElement(element, importantElements, nodeCheckCache, currentPageMode)) {
                                nodeCheckCache.set(node, true);
                                return true;
                            }
                            
                            // 检查文本内容长度
                            const trimmedText = element.textContent.trim();
                            // 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode);
                            if (trimmedText.length >= textThreshold.minLength) {
                                nodeCheckCache.set(node, true);
                                return true;
                            }
                            
                            // 检查是否包含可翻译的子元素（限制深度以提高性能）
                            const hasTranslatableContent = this.hasTranslatableChildren(element);
                            nodeCheckCache.set(node, hasTranslatableContent);
                            return hasTranslatableContent;
                        }
                        
                        nodeCheckCache.set(node, false);
                        return false;
                    });
                }
                
                // 字符数据变化检查
                if (mutation.type === 'characterData' && mutation.target.nodeValue) {
                    const trimmedText = mutation.target.nodeValue.trim();
                    // 使用页面模式特定的文本长度阈值
                const textThreshold = this.getTextChangeThreshold(currentPageMode);
                    return trimmedText.length >= textThreshold.minLength;
                }
                
                // 重要属性变化检查
                if (mutation.type === 'attributes' && 
                    importantAttributes.includes(mutation.attributeName)) {
                    // 对于重要属性，直接认为需要翻译
                    return true;
                }
                
                return false;
            });
        } catch (error) {
            console.error('[GitHub 中文翻译] 检测重要变化时出错:', error);
            return false;
        }
    },
    
    /**
     * 停止监控
     */
    stop() {
        try {
            // 断开MutationObserver连接
            if (this.observer) {
                try {
                    this.observer.disconnect();
                    this.observer = null;
                } catch (obsError) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 断开MutationObserver失败:', obsError);
                    }
                }
            }
            
            // 清理所有事件监听器
            this.cleanupEventListeners();
            
            // 停止缓存清理定时器
            this.stopCacheCleanupTimer();
            
            // 清理所有缓存，防止内存泄漏
            this.clearAllCaches();
            
            // 重置状态
            this.lastPath = '';
            this.lastTranslateTimestamp = 0;
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面监控已停止并清理');
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 停止监控时出错:', error);
            }
        }
    },
    
    /**
     * 清理所有缓存
     */
    clearAllCaches() {
        try {
            // 清理节点检查缓存
            if (this.nodeCheckCache) {
                this.nodeCheckCache = new WeakMap();
            }
            
            // 清理元素缓存
            if (this.elementCache) {
                this.elementCache = new WeakMap();
            }
            
            // 清理页面模式缓存
            if (this.pageModeCache) {
                this.pageModeCache.clear();
            }
            
            // 清理文本变化阈值缓存
            if (this.textThresholdCache) {
                this.textThresholdCache.clear();
            }
            
            // 清理重要元素缓存
            if (this.importantElementsCache) {
                this.importantElementsCache.clear();
            }
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 所有缓存已清理');
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 清理缓存时出错:', error);
            }
        }
    },
    

    
    /**
     * 清理所有注册的事件监听器
     */
    cleanupEventListeners() {
      try {
        // 清理所有事件监听器
        this.eventListeners.forEach(listener => {
          try {
            if (listener.intervalId) {
              // 清理定时器
              clearInterval(listener.intervalId);
            } else if (listener.target && listener.type && listener.handler) {
              // 清理DOM事件监听器
              listener.target.removeEventListener(listener.type, listener.handler);
            }
          } catch (error) {
            if (CONFIG.debugMode) {
              console.warn(`[GitHub 中文翻译] 移除事件监听器(${listener.type})失败:`, error);
            }
          }
        });
        
        // 清空监听器列表
        this.eventListeners = [];
        this.fallbackIntervalId = null;
        
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 事件监听器已清理');
        }
      } catch (error) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 清理事件监听器失败:', error);
        }
      }
    },
    
    /**
     * 重新开始监控
     */
    restart() {
        try {
            this.stop();
            this.init();
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面监控已重启');
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 重新开始监控失败:', error);
            }
        }
    },
    
    /**
     * 手动触发翻译
     * 提供外部调用接口
     */
    triggerTranslation() {
        // 性能优化：如果启用了虚拟DOM，先检查是否有需要翻译的元素
        if (CONFIG.performance.enableVirtualDom) {
            // 如果页面没有明显变化，可以跳过翻译
            if (this.lastMutationTime && Date.now() - this.lastMutationTime < 500) {
                return;
            }
        }
        this.translateWithThrottle();
    }
};