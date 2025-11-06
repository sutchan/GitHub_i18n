/**
 * 页面监控模块
 * 监控页面变化并触发重新翻译
 */
import { CONFIG } from './config.js';
import { utils } from './utils.js';
import { translationCore } from './translationCore.js';

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