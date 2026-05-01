/**
 * 翻译核心主模块
 * @file translationCore/index.js
 * @version 1.9.7
 * @date 2026-05-01
 * @author Sut
 * @description 翻译核心主入口，整合所有子模块
 */
import { CONFIG } from '../config.js';
import { ErrorHandler } from '../errorHandler.js';
import virtualDomManager from '../virtualDom.js';
import { dictionaryManager } from './dictionaryManager.js';
import { pageModeDetector } from './pageModeDetector.js';
import { elementSelector } from './elementSelector.js';
import { elementTranslator } from './elementTranslator.js';
import { partialTranslator } from './partialTranslator.js';
import { performanceMonitor } from './performanceMonitor.js';

export const translationCore = {
  isPageUnloading: false,
  cacheCleanupTimer: null,
  unloadHandler: null,

  init() {
    try {
      dictionaryManager.init();
      this.setupPageUnloadHandler();
      this.startCacheCleanupTimer();
      this.warmUpCache();

      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 翻译核心初始化完成');
      }
    } catch (error) {
      ErrorHandler.handleError('翻译核心初始化', error, ErrorHandler.ERROR_TYPES.INITIALIZATION);
    }
  },

  setupPageUnloadHandler() {
    const unloadHandler = () => {
      this.isPageUnloading = true;
      this.cleanup();
    };

    window.addEventListener('beforeunload', unloadHandler);
    window.addEventListener('unload', unloadHandler);
    window.addEventListener('pagehide', unloadHandler);

    this.unloadHandler = unloadHandler;
  },

  startCacheCleanupTimer() {
    this.stopCacheCleanupTimer();
    this.cacheCleanupTimer = setInterval(() => {
      if (this.isPageUnloading) {
        this.stopCacheCleanupTimer();
        return;
      }
      this.cleanCache();
    }, 120000);
  },

  stopCacheCleanupTimer() {
    if (this.cacheCleanupTimer) {
      clearInterval(this.cacheCleanupTimer);
      this.cacheCleanupTimer = null;
    }
  },

  cleanup() {
    try {
      this.stopCacheCleanupTimer();

      if (this.unloadHandler) {
        window.removeEventListener('beforeunload', this.unloadHandler);
        window.removeEventListener('unload', this.unloadHandler);
        window.removeEventListener('pagehide', this.unloadHandler);
        this.unloadHandler = null;
      }

      this.clearCache();

      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 翻译核心资源清理完成');
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 翻译核心资源清理失败:', error);
      }
    }
  },

  detectPageMode() {
    return pageModeDetector.detectPageMode();
  },

  getCurrentPageModeConfig() {
    return pageModeDetector.getCurrentPageModeConfig();
  },

  async translate(targetElements = null) {
    if (!dictionaryManager.dictionary || Object.keys(dictionaryManager.dictionary).length === 0) {
      dictionaryManager.init();
    }

    const pageMode = this.detectPageMode();
    const modeConfig = this.getCurrentPageModeConfig();

    if (CONFIG.debugMode) {
      console.log(`[GitHub 中文翻译] 当前页面模式: ${pageMode}`, modeConfig);
    }

    performanceMonitor.resetPerformanceData();
    elementTranslator.performanceData.translateStartTime = Date.now();

    return new Promise((resolve, reject) => {
      try {
        let elements;

        if (Array.isArray(targetElements)) {
          elements = targetElements.filter(el => el && el instanceof HTMLElement);
          if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译特定区域，目标元素数量: ${elements.length}`);
          }
        } else {
          elements = elementSelector.getElementsToTranslate();
          if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译整个页面，目标元素数量: ${elements.length}`);
          }
        }

        if (!elements || elements.length === 0) {
          if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 没有找到需要翻译的元素');
          }
          performanceMonitor.logPerformanceData();
          resolve();
          return;
        }

        this.processElementsInBatches(elements)
          .then(() => {
            elementTranslator.performanceData.translateEndTime = Date.now();
            performanceMonitor.logPerformanceData();
            resolve();
          })
          .catch((batchError) => {
            ErrorHandler.handleError('批处理过程', batchError, ErrorHandler.ERROR_TYPES.TRANSLATION, {
              retryable: true,
              recoveryFn: () => {
                this.translateCriticalElementsOnly()
                  .then(() => {
                    elementTranslator.performanceData.translateEndTime = Date.now();
                    performanceMonitor.logPerformanceData();
                    resolve();
                  })
                  .catch((recoverError) => {
                    ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION);
                    elementTranslator.performanceData.translateEndTime = Date.now();
                    performanceMonitor.logPerformanceData();
                    reject(recoverError);
                  });
              },
              maxRetries: 2
            });
          });
      } catch (error) {
        ErrorHandler.handleError('翻译过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION, {
          retryable: true,
          recoveryFn: () => {
            this.translateCriticalElementsOnly()
              .then(() => {
                performanceMonitor.logPerformanceData();
                resolve();
              })
              .catch((recoverError) => {
                ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION);
                performanceMonitor.logPerformanceData();
                reject(recoverError);
              });
          },
          maxRetries: 2
        });
      }
    });
  },

  async processElementsInBatches(elements) {
    elements = virtualDomManager.processElements(elements);
    const modeConfig = this.getCurrentPageModeConfig();
    const batchSize = modeConfig.batchSize || CONFIG.performance?.batchSize || 50;
    const delay = CONFIG.performance?.batchDelay || 0;

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return Promise.resolve();
    }

    const validElements = elements.filter(element => element instanceof HTMLElement);

    if (validElements.length <= batchSize) {
      validElements.forEach(element => {
        try {
          elementTranslator.translateElement(element);
        } catch (error) {
          ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
        }
      });
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const processBatch = (startIndex) => {
        try {
          const endIndex = Math.min(startIndex + batchSize, validElements.length);
          const batch = validElements.slice(startIndex, endIndex);

          batch.forEach(element => {
            try {
              elementTranslator.translateElement(element);
            } catch (error) {
              ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
            }
          });

          if (CONFIG.performance?.logTiming && (endIndex % (batchSize * 5) === 0 || endIndex === validElements.length)) {
            const progress = Math.round((endIndex / validElements.length) * 100);
            console.log(`[GitHub 中文翻译] 翻译进度: ${progress}%, 已处理: ${endIndex}/${validElements.length} 元素`);
          }

          if (endIndex < validElements.length) {
            if (delay > 0) {
              setTimeout(() => processBatch(endIndex), delay);
            } else {
              requestAnimationFrame(() => processBatch(endIndex));
            }
          } else {
            resolve();
          }
        } catch (error) {
          ErrorHandler.handleError('批处理过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION);
          resolve();
        }
      };

      processBatch(0);
    });
  },

  async translateCriticalElementsOnly() {
    return elementTranslator.translateCriticalElementsOnly();
  },

  cleanCache() {
    try {
      if (!dictionaryManager.cacheManager.translationCache || !(dictionaryManager.cacheManager.translationCache instanceof Map)) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 缓存对象不存在或无效');
        }
        return;
      }

      dictionaryManager.cacheManager.cleanCache();
      elementTranslator.performanceData.cacheCleanups = (elementTranslator.performanceData.cacheCleanups || 0) + 1;

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存清理完成，当前大小: ${dictionaryManager.cacheManager.translationCache.size}`);
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 缓存清理过程出错，使用回退策略:', error);
      }

      try {
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 执行缓存重置作为最后手段');
        }
        dictionaryManager.cacheManager.translationCache.clear();
        dictionaryManager.cacheManager.cacheStats.size = 0;
      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 缓存重置失败:', fallbackError);
        }
      }
    }
  },

  clearCache() {
    try {
      if (virtualDomManager && typeof virtualDomManager.clear === 'function') {
        virtualDomManager.clear();
      }

      if (dictionaryManager.cacheManager) {
        dictionaryManager.cacheManager.clearCache();
      }

      if (elementSelector.elementCache) {
        elementSelector.elementCache = new WeakMap();
      }

      performanceMonitor.resetPerformanceData();

      try {
        const translatedElements = document.querySelectorAll('[data-github-zh-translated]');
        translatedElements.forEach(element => {
          element.removeAttribute('data-github-zh-translated');
        });
      } catch (domError) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 清除翻译标记时出错:', domError);
        }
      }

      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 翻译缓存已彻底清除');
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 清除缓存时出错:', error);
      }

      try {
        if (dictionaryManager.cacheManager) dictionaryManager.cacheManager.clearCache();
        if (elementSelector.elementCache) elementSelector.elementCache = new WeakMap();
        dictionaryManager.cacheManager.cacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 基本缓存清理也失败:', fallbackError);
        }
      }
    }
  },

  warmUpCache() {
    if (!CONFIG.performance?.enableTranslationCache) {
      return;
    }

    try {
      const commonKeys = Object.keys(dictionaryManager.dictionary)
        .filter(key => !dictionaryManager.dictionary[key].startsWith('待翻译: ') && key.length <= 50)
        .slice(0, 100);

      commonKeys.forEach(key => {
        const value = dictionaryManager.dictionary[key];
        dictionaryManager.cacheManager.setToCache(key, value, this.isPageUnloading);
      });

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存预热完成，已预加载${commonKeys.length}个常用词条`);
      }
    } catch (error) {
      console.error('[GitHub 中文翻译] 缓存预热失败:', error);
    }
  },

  updateDictionary(newDictionary) {
    dictionaryManager.updateDictionary(newDictionary);
  },

  // 暴露性能监控方法
  resetPerformanceData: () => performanceMonitor.resetPerformanceData(),
  logPerformanceData: () => performanceMonitor.logPerformanceData(),
  recordPerformanceEvent: (eventType, data) => performanceMonitor.recordPerformanceEvent(eventType, data),
  getPerformanceStats: () => performanceMonitor.getPerformanceStats(),
  exportPerformanceData: () => performanceMonitor.exportPerformanceData()
};
