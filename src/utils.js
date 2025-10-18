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