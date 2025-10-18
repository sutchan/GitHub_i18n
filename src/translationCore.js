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
                console.log('[GitHub 中文翻译] 翻译完成');
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
        const elements = [];
        
        // 获取主选择器匹配的元素
        CONFIG.selectors.primary.forEach(selector => {
            const matchedElements = document.querySelectorAll(selector);
            matchedElements.forEach(element => {
                // 避免重复添加
                if (!elements.includes(element)) {
                    elements.push(element);
                }
            });
        });
        
        // 获取弹出菜单元素
        CONFIG.selectors.popupMenus.forEach(selector => {
            const matchedElements = document.querySelectorAll(selector);
            matchedElements.forEach(element => {
                if (!elements.includes(element)) {
                    elements.push(element);
                }
            });
        });
        
        return elements;
    },
    
    /**
     * 翻译单个元素
     * @param {HTMLElement} element - 要翻译的元素
     */
    translateElement(element) {
        // 避免翻译特定类型的元素
        const skipElements = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select'];
        if (skipElements.includes(element.tagName.toLowerCase())) {
            return;
        }
        
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
        
        // 直接查找精确匹配
        if (this.dictionary[normalizedText]) {
            const translation = this.dictionary[normalizedText];
            // 避免返回标记为待翻译的文本
            if (!translation.startsWith('待翻译: ')) {
                return translation;
            }
        }
        
        // 如果启用了部分匹配
        if (CONFIG.performance.enablePartialMatch) {
            for (const [key, value] of Object.entries(this.dictionary)) {
                if (normalizedText.includes(key) && !value.startsWith('待翻译: ')) {
                    return normalizedText.replace(new RegExp(key, 'g'), value);
                }
            }
        }
        
        return null;
    }
};