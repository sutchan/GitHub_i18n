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