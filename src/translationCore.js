/**
 * 翻译核心模块
 * 负责页面内容的实际翻译工作
 */
import { CONFIG } from './config.js';
import { mergeAllDictionaries } from './dictionaries/index.js';

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
     * 翻译缓存，用于存储已翻译过的文本
     * @type {Map<string, string>}
     */
    translationCache: new Map(),
    
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
                console.log('[GitHub 中文翻译] 翻译完成，已翻译元素数量:', elements.length);
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
        // 使用Set避免重复添加元素，提高性能
        const uniqueElements = new Set();
        
        // 获取主选择器匹配的元素
        CONFIG.selectors.primary.forEach(selector => {
            try {
                const matchedElements = document.querySelectorAll(selector);
                matchedElements.forEach(element => {
                    // 过滤不应该翻译的元素
                    if (this.shouldTranslateElement(element)) {
                        uniqueElements.add(element);
                    }
                });
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.warn(`[GitHub 中文翻译] 选择器 "${selector}" 解析失败:`, error);
                }
            }
        });
        
        // 获取弹出菜单元素
        CONFIG.selectors.popupMenus.forEach(selector => {
            try {
                const matchedElements = document.querySelectorAll(selector);
                matchedElements.forEach(element => {
                    // 过滤不应该翻译的元素
                    if (this.shouldTranslateElement(element)) {
                        uniqueElements.add(element);
                    }
                });
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.warn(`[GitHub 中文翻译] 选择器 "${selector}" 解析失败:`, error);
                }
            }
        });
        
        return Array.from(uniqueElements);
    },
    
    /**
     * 判断元素是否应该被翻译
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} 是否应该翻译
     */
    shouldTranslateElement(element) {
        // 避免翻译特定类型的元素
        const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select'];
        if (skipTags.includes(element.tagName.toLowerCase())) {
            return false;
        }
        
        // 避免翻译具有特定属性的元素
        if (element.hasAttribute('data-no-translate') || 
            element.hasAttribute('translate') && element.getAttribute('translate') === 'no') {
            return false;
        }
        
        // 避免翻译具有特定类名的元素
        const skipClasses = ['language-', 'highlight', 'token', 'no-translate'];
        const classList = element.className;
        if (classList && skipClasses.some(cls => classList.includes(cls))) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 翻译单个元素
     * @param {HTMLElement} element - 要翻译的元素
     */
    translateElement(element) {
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
        
        // 检查缓存
        if (CONFIG.performance.enableTranslationCache && this.translationCache.has(normalizedText)) {
            return this.translationCache.get(normalizedText);
        }
        
        // 直接查找精确匹配
        let result = null;
        if (this.dictionary[normalizedText]) {
            const translation = this.dictionary[normalizedText];
            // 避免返回标记为待翻译的文本
            if (!translation.startsWith('待翻译: ')) {
                result = translation;
            }
        }
        
        // 如果启用了部分匹配且尚未找到结果
        if (result === null && CONFIG.performance.enablePartialMatch) {
            for (const [key, value] of Object.entries(this.dictionary)) {
                // 只对较长的键进行部分匹配，避免意外替换
                if (key.length > 3 && normalizedText.includes(key) && !value.startsWith('待翻译: ')) {
                    result = normalizedText.replace(new RegExp(key, 'g'), value);
                    // 只返回第一个匹配的结果，避免多次替换导致的问题
                    break;
                }
            }
        }
        
        // 更新缓存
        if (CONFIG.performance.enableTranslationCache) {
            // 限制缓存大小
            if (this.translationCache.size >= CONFIG.performance.maxDictSize) {
                // 删除最旧的缓存项（Map保持插入顺序）
                const firstKey = this.translationCache.keys().next().value;
                this.translationCache.delete(firstKey);
            }
            this.translationCache.set(normalizedText, result);
        }
        
        return result;
    },
    
    /**
     * 清除翻译缓存
     */
    clearCache() {
        this.translationCache.clear();
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 翻译缓存已清除');
        }
    }
};