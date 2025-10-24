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
                    // 非重要变化，跳过翻译
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