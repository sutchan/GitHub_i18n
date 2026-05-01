/**
 * 元素翻译模块
 * @file translationCore/elementTranslator.js
 * @version 1.9.8
 * @date 2026-05-01
 * @author Sut
 * @description 实际翻译DOM元素的模块
 */
import { CONFIG } from '../config.js';
import virtualDomManager from '../virtualDom.js';
import { ErrorHandler } from '../errorHandler.js';
import { dictionaryManager } from './dictionaryManager.js';
import { elementSelector } from './elementSelector.js';

export const elementTranslator = {
  performanceData: {
    translateStartTime: 0,
    translateEndTime: 0,
    elementsProcessed: 0,
    textsTranslated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheEvictions: 0,
    cacheCleanups: 0,
    domOperations: 0,
    domOperationTime: 0,
    networkRequests: 0,
    networkRequestTime: 0,
    dictionaryLookups: 0,
    partialMatches: 0,
    batchProcessings: 0,
    errorCount: 0,
    totalMemory: 0
  },

  translateElement(element) {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    if (!elementSelector.shouldTranslate(element)) {
      return false;
    }

    if (elementSelector.elementCache.has(element)) {
      return false;
    }

    if (element.hasAttribute('data-github-zh-translated')) {
      elementSelector.elementCache.set(element, true);
      return false;
    }

    this.performanceData.elementsProcessed++;

    if (!elementSelector.shouldTranslateElement(element)) {
      element.setAttribute('data-github-zh-translated', 'checked');
      return false;
    }

    const fragment = document.createDocumentFragment();
    let hasTranslation = false;

    const childNodes = Array.from(element.childNodes);
    const textNodesToProcess = [];

    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmedText = node.nodeValue.trim();
        if (trimmedText && trimmedText.length >= CONFIG.performance?.minTextLengthToTranslate) {
          textNodesToProcess.push(node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          element.removeChild(node);
          fragment.appendChild(node);
          const childTranslated = this.translateElement(node);
          hasTranslation = hasTranslation || childTranslated;
        } catch (e) {
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 处理子元素失败:', e, '元素:', node);
          }
          try {
            if (!node.parentNode) {
              element.appendChild(node);
            }
          } catch (addBackError) {
            if (CONFIG.debugMode) {
              console.error('[GitHub 中文翻译] 将子元素添加回原始位置失败:', addBackError);
            }
          }
        }
      }
    }

    textNodesToProcess.forEach(node => {
      const parentNode = node.parentNode;
      parentNode.removeChild(node);

      const originalText = node.nodeValue;
      const translatedText = dictionaryManager.getTranslatedText(originalText);

      if (translatedText && typeof translatedText === 'string' && translatedText !== originalText) {
        try {
          const safeTranslatedText = String(translatedText).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          const translatedNode = document.createTextNode(safeTranslatedText);
          fragment.appendChild(translatedNode);

          hasTranslation = true;
          this.performanceData.textsTranslated++;
        } catch (e) {
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 创建翻译节点失败:', e, '翻译文本:', translatedText);
          }
          fragment.appendChild(node);
        }
      } else {
        fragment.appendChild(node);
      }
    });

    try {
      if (fragment && fragment.hasChildNodes()) {
        if (element.firstChild) {
          element.insertBefore(fragment, element.firstChild);
        } else {
          element.appendChild(fragment);
        }
      }
    } catch (appendError) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 添加文档片段失败:', appendError, '元素:', element);
      }
    }

    if (hasTranslation) {
      virtualDomManager.markElementAsTranslated(element);
    } else {
      element.setAttribute('data-github-zh-translated', 'checked');
    }

    elementSelector.elementCache.set(element, true);

    return hasTranslation;
  },

  async translateCriticalElementsOnly() {
    const criticalSelectors = [
      '.Header',
      '.repository-content',
      '.js-repo-pjax-container',
      'main'
    ];

    const criticalElements = [];
    let processedElements = 0;
    let failedElements = 0;

    criticalSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          Array.from(elements).forEach(el => {
            if (el && el instanceof HTMLElement) {
              criticalElements.push(el);
            }
          });

          if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 找到关键元素: ${selector}, 数量: ${elements.length}`);
          }
        }
      } catch (err) {
        ErrorHandler.handleError('查询选择器', err, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
      }
    });

    if (criticalElements.length === 0) {
      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 没有找到关键元素需要翻译');
      }
      return;
    }

    criticalElements.forEach(element => {
      try {
        this.translateElement(element);
        processedElements++;
      } catch (err) {
        failedElements++;
        ErrorHandler.handleError('关键元素翻译', err, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
      }
    });

    if (CONFIG.debugMode) {
      console.log(`[GitHub 中文翻译] 关键元素翻译完成 - 总数量: ${criticalElements.length}, 成功: ${processedElements}, 失败: ${failedElements}`);
    }
  }
};
