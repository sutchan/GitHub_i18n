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