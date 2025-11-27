/**
 * 翻译核心模块
 * @file translationCore.js
 * @version 1.8.172
 * @date 2025-06-17
 * @author Sut
 * @description 负责页面内容的实际翻译工作
 */
import { CONFIG } from './config.js';
import { mergeAllDictionaries } from './dictionaries/index.js';
import { utils } from './utils.js';
import virtualDomManager from './virtualDom.js';
import { ErrorHandler } from './errorHandler.js';

/**
 * Trie树数据结构，用于高效的字符串匹配
 * 优化部分匹配算法的性能
 */
class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.value = null;
        this.length = 0;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
        this.size = 0;
    }

    /**
     * 向Trie树中插入一个单词及其翻译
     * @param {string} word - 要插入的单词
     * @param {string} value - 翻译结果
     */
    insert(word, value) {
        if (!word || typeof word !== 'string' || word.length === 0) {
            return;
        }

        let node = this.root;
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }
        node.isEndOfWord = true;
        node.value = value;
        node.length = word.length;
        this.size++;
    }

    /**
     * 在Trie树中查找所有匹配的单词
     * @param {string} text - 要查找的文本
     * @returns {Array} 匹配结果数组
     */
    findAllMatches(text) {
        if (!text || typeof text !== 'string' || text.length === 0) {
            return [];
        }

        const matches = [];
        const textLen = text.length;

        for (let i = 0; i < textLen; i++) {
            let node = this.root;
            let currentWord = '';

            for (let j = i; j < textLen; j++) {
                const char = text[j];
                if (!node.children.has(char)) {
                    break;
                }

                node = node.children.get(char);
                currentWord += char;

                if (node.isEndOfWord) {
                    matches.push({
                        key: currentWord,
                        value: node.value,
                        start: i,
                        end: j,
                        length: node.length
                    });
                }
            }
        }

        return matches;
    }

    /**
     * 清空Trie树
     */
    clear() {
        this.root = new TrieNode();
        this.size = 0;
    }

    /**
     * 获取Trie树的大小
     * @returns {number} Trie树中的单词数量
     */
    getSize() {
        return this.size;
    }
}

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
   * 翻译缓存项结构
   * @typedef {Object} CacheItem
   * @property {string} value - 缓存的值
   * @property {number} timestamp - 最后访问时间戳
   * @property {number} accessCount - 访问次数
   */

  /**
   * 翻译缓存，用于存储已翻译过的文本
   * @type {Map<string, CacheItem>}
   */
  translationCache: new Map(),

  /**
   * DOM元素缓存，用于存储元素的翻译状态
   * 使用WeakMap可以避免内存泄漏
   * @type {WeakMap<Element, boolean>}
   */
  elementCache: new WeakMap(),

  /**
   * 词典哈希表，用于快速查找
   * @type {Map<string, string>}
   */
  dictionaryHash: new Map(),

  /**
   * Trie树数据结构，用于高效的部分匹配
   * @type {Trie}
   */
  dictionaryTrie: new Trie(),

  /**
   * 正则表达式缓存，避免重复创建
   * @type {Map}
   */
  regexCache: new Map(),

  /**
   * 缓存统计信息
   */
  cacheStats: {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  },

  /**
   * 性能监控数据
   */
  performanceData: {
    translateStartTime: 0,
    elementsProcessed: 0,
    textsTranslated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheEvictions: 0,
    cacheCleanups: 0
  },

  /**
   * 当前页面模式
   * @type {string}
   */
  currentPageMode: null,

  /**
   * 页面卸载状态标记
   * @type {boolean}
   */
  isPageUnloading: false,

  /**
   * 缓存清理定时器ID
   * @type {number|null}
   */
  cacheCleanupTimer: null,

  /**
   * 页面模式配置，定义不同页面模式的特定翻译策略
   */
  pageModeConfig: {
    default: {
      batchSize: CONFIG.performance.batchSize,
      enablePartialMatch: CONFIG.performance.enablePartialMatch
    },
    search: {
      batchSize: 100, // 搜索页面可能有更多元素
      enablePartialMatch: false // 搜索页面更注重精确匹配
    },
    repository: {
      batchSize: 50,
      enablePartialMatch: false
    },
    issues: {
      batchSize: 75,
      enablePartialMatch: true // 问题描述可能包含需要部分匹配的文本
    },
    pullRequests: {
      batchSize: 75,
      enablePartialMatch: true // PR描述和评论可能需要部分匹配
    },
    explore: {
      batchSize: 100,
      enablePartialMatch: false
    },
    notifications: {
      batchSize: 60,
      enablePartialMatch: true // 通知内容可能需要部分匹配
    },
    marketplace: {
      batchSize: 80,
      enablePartialMatch: true // 插件描述可能需要部分匹配
    },
    codespaces: {
      batchSize: 50,
      enablePartialMatch: false
    },
    wiki: {
      batchSize: 120,
      enablePartialMatch: true // Wiki页面内容可能需要部分匹配
    },
    actions: {
      batchSize: 60,
      enablePartialMatch: false
    }
  },

  /**
   * 初始化翻译核心
   */
  init() {
    try {
      // 初始化词典
      this.initDictionary();
      
      // 设置页面卸载处理
      this.setupPageUnloadHandler();
      
      // 启动缓存清理定时器
      this.startCacheCleanupTimer();
      
      // 预热缓存
      this.warmUpCache();
      
      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 翻译核心初始化完成');
      }
    } catch (error) {
      ErrorHandler.handleError('翻译核心初始化', error, ErrorHandler.ERROR_TYPES.INITIALIZATION);
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
    
    // 保存事件监听器引用，以便后续清理
    this.unloadHandler = unloadHandler;
  },

  /**
   * 启动缓存清理定时器
   */
  startCacheCleanupTimer() {
    // 清除现有定时器
    this.stopCacheCleanupTimer();
    
    // 设置新的定时器，每2分钟清理一次缓存
    this.cacheCleanupTimer = setInterval(() => {
      // 如果页面正在卸载，停止清理
      if (this.isPageUnloading) {
        this.stopCacheCleanupTimer();
        return;
      }
      
      this.cleanCache();
    }, 120000); // 2分钟
  },

  /**
   * 停止缓存清理定时器
   */
  stopCacheCleanupTimer() {
    if (this.cacheCleanupTimer) {
      clearInterval(this.cacheCleanupTimer);
      this.cacheCleanupTimer = null;
    }
  },

  /**
   * 清理资源
   */
  cleanup() {
    try {
      // 停止缓存清理定时器
      this.stopCacheCleanupTimer();
      
      // 移除页面卸载事件监听器
      if (this.unloadHandler) {
        window.removeEventListener('beforeunload', this.unloadHandler);
        window.removeEventListener('unload', this.unloadHandler);
        window.removeEventListener('pagehide', this.unloadHandler);
        this.unloadHandler = null;
      }
      
      // 清理所有缓存
      this.clearCache();
      
      // 清理正则表达式缓存
      this.regexCache.clear();
      
      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 翻译核心资源清理完成');
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 翻译核心资源清理失败:', error);
      }
    }
  },
  initDictionary() {
    try {
      if (CONFIG.debugMode) {
        console.time('[GitHub 中文翻译] 词典初始化');
      }

      this.dictionary = mergeAllDictionaries();
      
      // 初始化词典哈希表和Trie树，提高查找效率
      this.dictionaryHash.clear();
      this.dictionaryTrie.clear();
      this.regexCache.clear();
      
      Object.keys(this.dictionary).forEach(key => {
        // 只添加非待翻译的有效条目
        if (!this.dictionary[key].startsWith('待翻译: ')) {
          this.dictionaryHash.set(key, this.dictionary[key]);
          // 同时添加小写和大写版本，优化大小写不敏感匹配
          if (key.length <= 100) {
            this.dictionaryHash.set(key.toLowerCase(), this.dictionary[key]);
            this.dictionaryHash.set(key.toUpperCase(), this.dictionary[key]);
          }
          
          // 添加到Trie树中，用于高效的部分匹配
          this.dictionaryTrie.insert(key);
        }
      });

      if (CONFIG.debugMode) {
        console.timeEnd('[GitHub 中文翻译] 词典初始化');
        console.log(`[GitHub 中文翻译] 词典条目数量: ${Object.keys(this.dictionary).length}`);
        console.log(`[GitHub 中文翻译] 哈希表条目数量: ${this.dictionaryHash.size}`);
        console.log(`[GitHub 中文翻译] Trie树条目数量: ${this.dictionaryTrie.getSize()}`);
      }
    } catch (error) {
      ErrorHandler.handleError('词典初始化', error, ErrorHandler.ERROR_TYPES.DICTIONARY);
      // 提供一个空的默认词典作为回退
      this.dictionary = {};
      this.dictionaryHash.clear();
      this.dictionaryTrie.clear();
      this.regexCache.clear();
    }
  },

  /**
   * 检测当前页面模式
   * @returns {string} 当前页面模式
   */
  detectPageMode() {
    try {
      const currentPath = window.location.pathname;

      // 优先检测精确匹配的特殊页面
      for (const [mode, pattern] of Object.entries(CONFIG.pagePatterns)) {
        if (pattern && pattern instanceof RegExp && pattern.test(currentPath)) {
          // 特殊处理仓库页面的匹配优先级
          if (mode === 'repository') {
            // 确保不是其他更具体的仓库子页面
            const isSubPage = ['issues', 'pullRequests', 'projects', 'wiki', 'actions', 'packages', 'security', 'insights']
              .some(subMode => CONFIG.pagePatterns[subMode]?.test(currentPath));
            if (!isSubPage) {
              this.currentPageMode = mode;
              return mode;
            }
          } else {
            this.currentPageMode = mode;
            return mode;
          }
        }
      }

      // 默认模式
      this.currentPageMode = 'default';
      return 'default';
    } catch (error) {
      if (CONFIG.debugMode) {
        console.warn('[GitHub 中文翻译] 检测页面模式失败:', error);
      }
      this.currentPageMode = 'default';
      return 'default';
    }
  },

  /**
   * 获取当前页面模式的配置
   * @returns {Object} 页面模式配置
   */
  getCurrentPageModeConfig() {
    const mode = this.currentPageMode || this.detectPageMode();
    return this.pageModeConfig[mode] || this.pageModeConfig.default;
  },

  /**
   * 执行翻译
   * 支持翻译整个页面或指定的元素区域
   * @param {HTMLElement[]} [targetElements] - 可选的目标元素数组，只翻译这些元素
   * @returns {Promise<void>} 翻译完成的Promise
   */
  translate(targetElements = null) {
    // 确保词典已初始化
    if (!this.dictionary || Object.keys(this.dictionary).length === 0) {
      this.initDictionary();
    }

    // 检测当前页面模式
    const pageMode = this.detectPageMode();
    const modeConfig = this.getCurrentPageModeConfig();

    if (CONFIG.debugMode) {
      console.log(`[GitHub 中文翻译] 当前页面模式: ${pageMode}`, modeConfig);
    }

    // 重置性能统计数据
    this.resetPerformanceData();
    this.performanceData.translateStartTime = Date.now();

    return new Promise((resolve, reject) => {
      try {
        let elements;

        if (Array.isArray(targetElements)) {
          // 如果提供了目标元素，只翻译这些元素
          elements = targetElements.filter(el => el && el instanceof HTMLElement);
          if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译特定区域，目标元素数量: ${elements.length}`);
          }
        } else {
          // 否则翻译整个页面
          elements = this.getElementsToTranslate();
          if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译整个页面，目标元素数量: ${elements.length}`);
          }
        }

        // 检查是否有元素需要翻译
        if (!elements || elements.length === 0) {
          if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 没有找到需要翻译的元素');
          }
          this.logPerformanceData();
          resolve();
          return;
        }

        // 批量处理元素，避免长时间运行导致UI阻塞
        this.processElementsInBatches(elements)
          .then(() => {
            // 记录翻译结束时间
            this.performanceData.translateEndTime = Date.now();
            // 记录性能数据
            this.logPerformanceData();
            resolve();
          })
          .catch((batchError) => {
            // 使用ErrorHandler处理批处理错误
            ErrorHandler.handleError('批处理过程', batchError, ErrorHandler.ERROR_TYPES.TRANSLATION, {
              retryable: true,
              recoveryFn: () => {
                // 错误恢复机制：尝试继续执行基本翻译
                this.translateCriticalElementsOnly()
                  .then(() => {
                    // 记录翻译结束时间
                    this.performanceData.translateEndTime = Date.now();
                    this.logPerformanceData();
                    resolve(); // 即使有错误，也尽量完成基本翻译
                  })
                  .catch((recoverError) => {
                    ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION);
                    // 记录翻译结束时间
                    this.performanceData.translateEndTime = Date.now();
                    this.logPerformanceData();
                    reject(recoverError);
                  });
              },
              maxRetries: 2
            });
          });
      } catch (error) {
        // 使用ErrorHandler处理翻译过程中的错误
        ErrorHandler.handleError('翻译过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION, {
          retryable: true,
          recoveryFn: () => {
            // 错误恢复机制：尝试继续执行基本翻译
            this.translateCriticalElementsOnly()
              .then(() => {
                this.logPerformanceData();
                resolve(); // 即使有错误，也尽量完成基本翻译
              })
              .catch((recoverError) => {
                ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION);
                this.logPerformanceData();
                reject(recoverError);
              });
          },
          maxRetries: 2
        });
      }
    });
  },

  /**
   * 重置性能统计数据
   */
  /**
   * 重置性能数据
   */
  resetPerformanceData() {
    this.performanceData = {
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
    };
  },

  /**
   * 记录性能数据
   */
  logPerformanceData() {
    if (CONFIG.debugMode && CONFIG.performance.logTiming) {
      const duration = Date.now() - this.performanceData.translateStartTime;
      console.log(`[GitHub 中文翻译] 性能数据 - 总耗时: ${duration}ms`);
      console.log(`  元素处理: ${this.performanceData.elementsProcessed}`);
      console.log(`  文本翻译: ${this.performanceData.textsTranslated}`);
      console.log(`  缓存命中: ${this.performanceData.cacheHits}`);
      console.log(`  缓存未命中: ${this.performanceData.cacheMisses}`);
      console.log(`  缓存驱逐: ${this.performanceData.cacheEvictions}`);
      console.log(`  缓存清理: ${this.performanceData.cacheCleanups}`);
      console.log(`  DOM操作: ${this.performanceData.domOperations} (${this.performanceData.domOperationTime}ms)`);
      console.log(`  网络请求: ${this.performanceData.networkRequests} (${this.performanceData.networkRequestTime}ms)`);
      console.log(`  字典查询: ${this.performanceData.dictionaryLookups}`);
      console.log(`  部分匹配: ${this.performanceData.partialMatches}`);
      console.log(`  批处理次数: ${this.performanceData.batchProcessings}`);
      console.log(`  错误次数: ${this.performanceData.errorCount}`);
    }
  },

  /**
   * 记录单个性能事件
   * @param {string} eventType - 事件类型
   * @param {object} data - 事件数据
   */
  recordPerformanceEvent(eventType, data = {}) {
    switch (eventType) {
      case 'dom-operation':
        this.performanceData.domOperations++;
        this.performanceData.domOperationTime += data.duration || 0;
        break;
      case 'network-request':
        this.performanceData.networkRequests++;
        this.performanceData.networkRequestTime += data.duration || 0;
        break;
      case 'dictionary-lookup':
        this.performanceData.dictionaryLookups++;
        break;
      case 'partial-match':
        this.performanceData.partialMatches++;
        break;
      case 'batch-processing':
        this.performanceData.batchProcessings++;
        break;
      case 'error':
        this.performanceData.errorCount++;
        break;
      default:
        break;
    }
  },

  /**
   * 获取当前性能统计数据
   * @returns {object} - 性能统计数据
   */
  getPerformanceStats() {
    const stats = { ...this.performanceData };
    if (stats.translateStartTime > 0) {
      stats.totalDuration = stats.translateEndTime > 0 
        ? stats.translateEndTime - stats.translateStartTime 
        : Date.now() - stats.translateStartTime;
    } else {
      stats.totalDuration = 0;
    }
    
    // 计算缓存命中率
    const totalCacheRequests = stats.cacheHits + stats.cacheMisses;
    stats.cacheHitRate = totalCacheRequests > 0 
      ? (stats.cacheHits / totalCacheRequests * 100).toFixed(2) + '%' 
      : '0%';
    
    // 计算平均DOM操作时间
    stats.avgDomOperationTime = stats.domOperations > 0 
      ? (stats.domOperationTime / stats.domOperations).toFixed(2) + 'ms' 
      : '0ms';
    
    // 计算平均网络请求时间
    stats.avgNetworkRequestTime = stats.networkRequests > 0 
      ? (stats.networkRequestTime / stats.networkRequests).toFixed(2) + 'ms' 
      : '0ms';
    
    return stats;
  },

  /**
   * 导出性能数据
   * @returns {string} - JSON格式的性能数据
   */
  exportPerformanceData() {
    const data = {
      timestamp: new Date().toISOString(),
      pageMode: this.currentPageMode,
      stats: this.getPerformanceStats(),
      userAgent: navigator.userAgent,
      browserLanguage: navigator.language
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * 分批处理元素
   * 避免单次处理过多元素导致UI阻塞
   * @param {HTMLElement[]} elements - 要处理的元素数组
   * @returns {Promise<void>} 处理完成的Promise
   */
  processElementsInBatches(elements) {
    // 使用虚拟DOM优化：只处理需要更新的元素
    elements = virtualDomManager.processElements(elements);
    const modeConfig = this.getCurrentPageModeConfig();
    const batchSize = modeConfig.batchSize || CONFIG.performance.batchSize || 50; // 每批处理的元素数量
    const delay = CONFIG.performance.batchDelay || 0; // 批处理之间的延迟

    // 如果元素数组为空或无效，直接返回
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return Promise.resolve();
    }

    // 过滤掉无效元素
    const validElements = elements.filter(element => element instanceof HTMLElement);

    // 如果元素数量较少，直接处理
    if (validElements.length <= batchSize) {
      validElements.forEach(element => {
        try {
          this.translateElement(element);
        } catch (error) {
          ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
        }
      });
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // 分批处理
      const processBatch = (startIndex) => {
        try {
          const endIndex = Math.min(startIndex + batchSize, validElements.length);
          const batch = validElements.slice(startIndex, endIndex);

          // 批量处理当前批次
          batch.forEach(element => {
            try {
              this.translateElement(element);
            } catch (error) {
              ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
            }
          });

          // 性能日志记录
          if (CONFIG.performance.logTiming && (endIndex % (batchSize * 5) === 0 || endIndex === validElements.length)) {
            const progress = Math.round((endIndex / validElements.length) * 100);
            console.log(`[GitHub 中文翻译] 翻译进度: ${progress}%, 已处理: ${endIndex}/${validElements.length} 元素`);
          }

          if (endIndex < validElements.length) {
            // 继续处理下一批
            if (delay > 0) {
              setTimeout(() => processBatch(endIndex), delay);
            } else {
              // 使用requestAnimationFrame确保UI线程不被阻塞
              requestAnimationFrame(() => processBatch(endIndex));
            }
          } else {
            // 所有批次处理完成
            resolve();
          }
        } catch (error) {
          ErrorHandler.handleError('批处理过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION);
          resolve(); // 即使出错也要完成Promise
        }
      };

      // 开始处理第一批
      processBatch(0);
    });
  },

  /**
   * 仅翻译关键元素
   * 用于错误恢复时的最小化翻译
   * @returns {Promise<void>} 翻译完成的Promise
   */
  translateCriticalElementsOnly() {
    return new Promise((resolve) => {
      const criticalSelectors = [
        '.Header',
        '.repository-content',
        '.js-repo-pjax-container',
        'main'
      ];

      const criticalElements = [];
      let processedElements = 0;
      let failedElements = 0;

      // 安全地获取关键元素
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
          // 继续处理其他选择器
        }
      });

      // 如果没有找到任何关键元素，直接返回
      if (criticalElements.length === 0) {
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 没有找到关键元素需要翻译');
        }
        resolve();
        return;
      }

      // 处理所有关键元素
      criticalElements.forEach(element => {
        try {
          this.translateElement(element);
          processedElements++;
        } catch (err) {
          failedElements++;
          ErrorHandler.handleError('关键元素翻译', err, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
        }
      });

      // 记录统计信息
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 关键元素翻译完成 - 总数量: ${criticalElements.length}, 成功: ${processedElements}, 失败: ${failedElements}`);
      }

      resolve();
    });
  },

  /**
   * 获取需要翻译的元素
   * 性能优化：使用查询优化和缓存策略
   * @returns {HTMLElement[]} 需要翻译的元素数组
   */
  getElementsToTranslate() {
    // 使用Set避免重复添加元素，提高性能
    const uniqueElements = new Set();

    // 合并所有选择器
    const allSelectors = [...CONFIG.selectors.primary, ...CONFIG.selectors.popupMenus];

    // 优化：一次性查询所有选择器（如果数量合适）
    if (allSelectors.length <= 10) { // 避免选择器过长
      const combinedSelector = allSelectors.join(', ');
      try {
        const allElements = document.querySelectorAll(combinedSelector);
        Array.from(allElements).forEach(element => {
          if (this.shouldTranslateElement(element)) {
            uniqueElements.add(element);
          }
        });
        if (CONFIG.debugMode && CONFIG.performance.logTiming) {
          console.log(`[GitHub 中文翻译] 合并查询选择器: ${combinedSelector}, 结果数量: ${allElements.length}`);
        }
        return Array.from(uniqueElements);
      } catch (error) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 合并选择器查询失败，回退到逐个查询:', error);
        }
        // 合并查询失败，回退到逐个查询
      }
    }

    // 逐个查询选择器
    allSelectors.forEach(selector => {
      try {
        const matchedElements = document.querySelectorAll(selector);
        Array.from(matchedElements).forEach(element => {
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

    // 过滤无效元素
    return Array.from(uniqueElements).filter(element => element instanceof HTMLElement);
  },

  /**
   * 判断元素是否应该被翻译
   * 优化版：增加更多过滤条件和快速路径
   * @param {HTMLElement} element - 要检查的元素
   * @returns {boolean} 是否应该翻译
   */
  shouldTranslateElement(element) {
    // 快速路径：无效元素检查
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    // 快速路径：检查是否已翻译
    if (element.hasAttribute('data-github-zh-translated')) {
      return false;
    }

    // 快速路径：检查是否有内容
    if (!element.textContent.trim()) {
      return false;
    }

    // 避免翻译特定类型的元素
    const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'img', 'svg', 'canvas', 'video', 'audio'];
    const tagName = element.tagName.toLowerCase();
    if (skipTags.includes(tagName)) {
      return false;
    }

    // 避免翻译具有特定属性的元素
    if (element.hasAttribute('data-no-translate') ||
      element.hasAttribute('translate') && element.getAttribute('translate') === 'no' ||
      element.hasAttribute('aria-hidden') ||
      element.hasAttribute('hidden')) {
      return false;
    }

    // 检查类名 - 优化：使用正则表达式提高匹配效率
    const className = element.className;
    if (className) {
      // 编译正则表达式并缓存（但在这个函数范围内无法缓存）
      const skipClassPatterns = [
        /language-\w+/,
        /highlight/,
        /token/,
        /no-translate/,
        /octicon/,
        /emoji/,
        /avatar/,
        /timestamp/,
        /numeral/,
        /filename/,
        /hash/,
        /sha/,
        /shortsha/,
        /hex-color/,
        /code/,
        /gist/,
        /language-/,
        /markdown-/,
        /monaco-editor/,
        /syntax-/,
        /highlight-/,
        /clipboard/,
        /progress-/,
        /count/,
        /size/,
        /time/,
        /date/,
        /sortable/,
        /label/,
        /badge/,
        /url/,
        /email/,
        /key/,
        /token/,
        /user-name/,
        /repo-name/
      ];

      if (skipClassPatterns.some(pattern => pattern.test(className))) {
        return false;
      }
    }

    // 检查ID - 通常技术/数据相关ID不翻译
    const id = element.id;
    if (id) {
      const skipIdPatterns = [
        /\d+/,
        /-\d+/,
        /_\d+/,
        /sha-/,
        /hash-/,
        /commit-/,
        /issue-/,
        /pull-/,
        /pr-/,
        /repo-/,
        /user-/,
        /file-/,
        /blob-/,
        /tree-/,
        /branch-/,
        /tag-/,
        /release-/,
        /gist-/,
        /discussion-/,
        /comment-/,
        /review-/,
        /workflow-/,
        /action-/,
        /job-/,
        /step-/,
        /runner-/,
        /package-/,
        /registry-/,
        /marketplace-/,
        /organization-/,
        /team-/,
        /project-/,
        /milestone-/,
        /label-/,
        /assignee-/,
        /reporter-/,
        /reviewer-/,
        /author-/,
        /committer-/,
        /contributor-/,
        /sponsor-/,
        /funding-/,
        /donation-/,
        /payment-/,
        /billing-/,
        /plan-/,
        /subscription-/,
        /license-/,
        /secret-/,
        /key-/,
        /token-/,
        /password-/,
        /credential-/,
        /certificate-/,
        /ssh-/,
        /git-/,
        /clone-/,
        /push-/,
        /pull-/,
        /fetch-/,
        /merge-/,
        /rebase-/,
        /cherry-pick-/,
        /reset-/,
        /revert-/,
        /tag-/,
        /branch-/,
        /commit-/,
        /diff-/,
        /patch-/,
        /stash-/,
        /ref-/,
        /head-/,
        /remote-/,
        /upstream-/,
        /origin-/,
        /local-/,
        /tracking-/,
        /merge-base-/,
        /conflict-/,
        /resolve-/,
        /status-/,
        /log-/,
        /blame-/,
        /bisect-/,
        /grep-/,
        /find-/,
        /filter-/,
        /archive-/,
        /submodule-/,
        /worktree-/,
        /lfs-/,
        /graphql-/,
        /rest-/,
        /api-/,
        /webhook-/,
        /event-/,
        /payload-/,
        /callback-/,
        /redirect-/,
        /oauth-/,
        /sso-/,
        /ldap-/,
        /saml-/,
        /2fa-/,
        /mfa-/,
        /security-/,
        /vulnerability-/,
        /cve-/,
        /dependency-/,
        /alert-/,
        /secret-scanning-/,
        /code-scanning-/,
        /codeql-/,
        /actions-/,
        /workflow-/,
        /job-/,
        /step-/,
        /runner-/,
        /artifact-/,
        /cache-/,
        /environment-/,
        /deployment-/,
        /app-/,
        /oauth-app-/,
        /github-app-/,
        /integration-/,
        /webhook-/,
        /marketplace-/,
        /listing-/,
        /subscription-/,
        /billing-/,
        /plan-/,
        /usage-/,
        /limits-/,
        /quota-/,
        /traffic-/,
        /analytics-/,
        /insights-/,
        /search-/,
        /explore-/,
        /trending-/,
        /stars-/,
        /forks-/,
        /watchers-/,
        /contributors-/,
        /activity-/,
        /events-/,
        /notifications-/,
        /feeds-/,
        /dashboard-/,
        /profile-/,
        /settings-/,
        /preferences-/,
        /billing-/,
        /organization-/,
        /team-/,
        /project-/,
        /milestone-/,
        /label-/,
        /assignee-/,
        /reporter-/,
        /reviewer-/,
        /author-/,
        /committer-/,
        /contributor-/,
        /sponsor-/,
        /funding-/,
        /donation-/,
        /payment-/,
        /\b\w+[0-9]\w*\b/ // 包含数字的单词
      ];

      if (skipIdPatterns.some(pattern => pattern.test(id))) {
        return false;
      }
    }

    // 检查元素是否隐藏
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0' ||
      computedStyle.position === 'absolute' && computedStyle.left === '-9999px') {
      return false;
    }

    // 检查内容是否全是数字或代码相关字符
    const textContent = element.textContent.trim();
    if (textContent.length === 0) {
      return false;
    }

    // 检查是否全是数字和特殊符号
    if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(textContent)) {
      return false;
    }

    return true;
  },

  /**
 * 翻译单个元素
 * 性能优化：使用更高效的DOM遍历和翻译策略
 * @param {HTMLElement} element - 要翻译的元素
 * @returns {boolean} 是否成功翻译了元素
 */
translateElement(element) {
    // 快速检查：避免无效元素
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }
    
    // 使用虚拟DOM检查是否需要翻译
    if (!virtualDomManager.shouldTranslate(element)) {
      return false;
    }

    // 性能优化：检查元素缓存，避免重复翻译
    if (this.elementCache.has(element)) {
      return false;
    }
    
    // 性能优化：检查是否已翻译，避免重复翻译
    if (element.hasAttribute('data-github-zh-translated')) {
      // 将已标记的元素添加到缓存
      this.elementCache.set(element, true);
      return false;
    }

    // 增加性能计数
    this.performanceData.elementsProcessed++;

    // 检查是否应该翻译该元素
    if (!this.shouldTranslateElement(element)) {
      // 即使不翻译，也标记为已检查，避免重复检查
      element.setAttribute('data-github-zh-translated', 'checked');
      return false;
    }

    // 优化：使用文档片段批量处理，减少DOM操作
    const fragment = document.createDocumentFragment();
    let hasTranslation = false;

    // 获取子节点的快照，避免在遍历过程中修改DOM导致的问题
    const childNodes = Array.from(element.childNodes);
    const textNodesToProcess = [];

    // 先收集所有文本节点
    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmedText = node.nodeValue.trim();
        if (trimmedText && trimmedText.length >= CONFIG.performance.minTextLengthToTranslate) {
          textNodesToProcess.push(node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          // 对于子元素，使用递归处理
          // 但先移除，稍后再添加到片段中
          element.removeChild(node);
          fragment.appendChild(node);

          // 递归翻译子元素
          const childTranslated = this.translateElement(node);
          hasTranslation = hasTranslation || childTranslated;
        } catch (e) {
          // 安全处理：如果处理子元素失败，尝试将其添加回原始位置
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 处理子元素失败:', e, '元素:', node);
          }
          try {
            // 尝试将节点添加回原始位置
            if (!node.parentNode) {
              element.appendChild(node);
            }
          } catch (addBackError) {
            // 如果添加回原始位置也失败，至少记录错误
            if (CONFIG.debugMode) {
              console.error('[GitHub 中文翻译] 将子元素添加回原始位置失败:', addBackError);
            }
          }
        }
      }
    }

    // 处理所有文本节点
    textNodesToProcess.forEach(node => {
      // 保存原始节点位置的引用
      const parentNode = node.parentNode;

      // 移除原始节点
      parentNode.removeChild(node);

      const originalText = node.nodeValue;
      const translatedText = this.getTranslatedText(originalText);

      // 如果有翻译结果且与原文不同，创建翻译后的文本节点
      if (translatedText && typeof translatedText === 'string' && translatedText !== originalText) {
        try {
          // 确保翻译文本是有效的字符串，去除可能导致问题的字符
          const controlChars = [
            '\u0000', '\u0001', '\u0002', '\u0003', '\u0004', '\u0005', '\u0006', '\u0007',
            '\u0008', '\u000B', '\u000C', '\u000E', '\u000F', '\u0010', '\u0011', '\u0012',
            '\u0013', '\u0014', '\u0015', '\u0016', '\u0017', '\u0018', '\u0019', '\u001A',
            '\u001B', '\u001C', '\u001D', '\u001E', '\u001F', '\u007F'
          ];
          let safeTranslatedText = String(translatedText);
          controlChars.forEach(char => {
            safeTranslatedText = safeTranslatedText.split(char).join('');
          });
          // 创建新的文本节点
          const translatedNode = document.createTextNode(safeTranslatedText);
          fragment.appendChild(translatedNode);

          hasTranslation = true;
          this.performanceData.textsTranslated++;
        } catch (e) {
          // 安全处理：如果创建节点失败，保留原始文本
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 创建翻译节点失败:', e, '翻译文本:', translatedText);
          }
          fragment.appendChild(node);
        }
      } else {
        // 没有翻译，保留原始节点
        fragment.appendChild(node);
      }
    });

    // 将处理后的片段重新添加到原始位置
    try {
      // 额外检查fragment的有效性
      if (fragment && fragment.hasChildNodes()) {
        if (element.firstChild) {
          element.insertBefore(fragment, element.firstChild);
        } else {
          element.appendChild(fragment);
        }
      }
    } catch (appendError) {
      // 安全处理：如果添加片段失败，至少记录错误
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 添加文档片段失败:', appendError, '元素:', element);
      }
    }

    // 标记为已翻译
    if (hasTranslation) {
      virtualDomManager.markElementAsTranslated(element);
    } else {
      // 标记为已检查但未翻译，避免重复检查
      element.setAttribute('data-github-zh-translated', 'checked');
    }
    
    // 将元素添加到缓存，避免重复翻译
    this.elementCache.set(element, true);

    return hasTranslation;
  },

  /**
   * 安全过滤函数，防止XSS攻击
   * @param {string} text - 要过滤的文本
   * @returns {string} 过滤后的安全文本
   */
  sanitizeText(text) {
    // 移除所有HTML标签
    let sanitizedText = text.replace(/<[^>]*>/g, '');
    
    // 移除所有JavaScript事件处理程序
    sanitizedText = sanitizedText.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // 移除所有JavaScript URL
    sanitizedText = sanitizedText.replace(/javascript:/gi, '');
    
    // 移除所有数据URL
    sanitizedText = sanitizedText.replace(/data:/gi, '');
    
    // 移除所有CSS表达式
    sanitizedText = sanitizedText.replace(/expression\([^)]*\)/gi, '');
    
    // 移除所有VBScript
    sanitizedText = sanitizedText.replace(/vbscript:/gi, '');
    
    // 移除所有可能的恶意字符组合
    sanitizedText = sanitizedText.replace(/<\s*script/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*iframe/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*object/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*embed/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*link/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*style/gi, '');
    
    return sanitizedText;
  },

  /**
   * 获取文本的翻译结果
   * 优化版：改进缓存策略、添加更智能的文本处理和XSS防护
   * @param {string} text - 原始文本
   * @returns {string|null} 翻译后的文本，如果没有找到翻译则返回null
   */
  getTranslatedText(text) {
    // 边界条件快速检查
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text;
    }

    // 去除文本中的多余空白字符
    const normalizedText = text.trim();

    // 快速路径：非常短的文本通常不需要翻译
    if (normalizedText.length < CONFIG.performance.minTextLengthToTranslate) {
      return null;
    }

    // 检查缓存 - 使用Map的O(1)查找
    if (CONFIG.performance.enableTranslationCache) {
      const cachedResult = this.getFromCache(normalizedText);
      if (cachedResult !== null) {
        return cachedResult;
      }
    }

    // 记录缓存未命中
    this.performanceData.cacheMisses++;

    // 尝试不同的规范化形式进行匹配
    let result = null;

    // 1. 尝试使用哈希表进行快速查找（已经规范化的文本）
    result = this.dictionaryHash.get(normalizedText);

    // 2. 如果哈希表没有匹配，且文本长度适合，尝试大小写转换（作为回退）
    if (result === undefined && normalizedText.length <= 100) {
      const lowerCaseText = normalizedText.toLowerCase();
      const upperCaseText = normalizedText.toUpperCase();
      
      result = this.dictionaryHash.get(lowerCaseText) || this.dictionaryHash.get(upperCaseText);
    }

    // 3. 如果启用了部分匹配且尚未找到结果
    const modeConfig = this.getCurrentPageModeConfig();
    const enablePartialMatch = modeConfig.enablePartialMatch !== undefined ?
      modeConfig.enablePartialMatch : CONFIG.performance.enablePartialMatch;

    if (result === null && enablePartialMatch) {
      result = this.performPartialTranslation(normalizedText);
    }

    // 安全过滤：防止XSS攻击
    if (result !== null) {
      result = this.sanitizeText(result);
    }

    // 更新缓存 - 优化：根据文本长度选择是否缓存
    if (CONFIG.performance.enableTranslationCache &&
      normalizedText.length <= CONFIG.performance.maxCachedTextLength) {
      // 只缓存翻译结果不为null的文本
      if (result !== null) {
        this.setToCache(normalizedText, result);
      }
    }

    return result;
  },

  /**
   * 执行部分翻译匹配
   * 优化版：使用Trie树进行高效匹配，减少不必要的字典遍历
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译后的文本
   */
  performPartialTranslation(text) {
    // 性能优化：预先计算长度，避免重复计算
    const textLen = text.length;

    // 快速路径：非常短的文本不进行部分匹配
    if (textLen < 5) {
      return null;
    }

    // 收集所有匹配项
    const matches = [];

    // 优化：仅考虑长度合适的字典键，避免不必要的匹配
    const minKeyLength = Math.min(4, Math.floor(textLen / 2)); // 最小键长度至少为4或文本长度的一半

    // 使用Trie树查找所有可能的匹配项，避免遍历整个字典
    const potentialKeys = this.dictionaryTrie.findAllMatches(text, minKeyLength);

    // 处理找到的潜在匹配项
    for (const key of potentialKeys) {
      if (!this.dictionary.hasOwnProperty(key) || 
          this.dictionary[key].startsWith('待翻译: ')) {
        continue;
      }

      const value = this.dictionary[key];
      
      // 避免对纯数字或特殊字符的匹配
      if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(key)) {
        continue;
      }

      // 尝试将key视为一个完整的单词进行匹配
      // 使用单词边界的正则表达式
      const wordRegexKey = `word_${key}`;
      let wordRegex;
      
      // 检查正则表达式缓存
      if (this.regexCache.has(wordRegexKey)) {
        wordRegex = this.regexCache.get(wordRegexKey);
      } else {
        // 使用安全的正则表达式创建方法防止ReDoS攻击
        wordRegex = utils.safeRegExp('\\b' + utils.escapeRegExp(key) + '\\b', 'gi');
        if (wordRegex) {
          this.regexCache.set(wordRegexKey, wordRegex);
        } else {
          continue; // 如果正则表达式不安全，跳过此键
        }
      }
      
      const wordMatches = text.match(wordRegex);

      if (wordMatches && wordMatches.length > 0) {
        // 记录匹配项，按匹配长度排序
        matches.push({
          key,
          value,
          length: key.length,
          matches: wordMatches.length,
          regex: wordRegex
        });
      } else {
        // 如果不是完整单词，也记录匹配项
        const nonWordRegexKey = `nonword_${key}`;
        let nonWordRegex;
        
        // 检查正则表达式缓存
        if (this.regexCache.has(nonWordRegexKey)) {
          nonWordRegex = this.regexCache.get(nonWordRegexKey);
        } else {
          // 使用安全的正则表达式创建方法防止ReDoS攻击
          nonWordRegex = utils.safeRegExp(utils.escapeRegExp(key), 'g');
          if (nonWordRegex) {
            this.regexCache.set(nonWordRegexKey, nonWordRegex);
          } else {
            continue; // 如果正则表达式不安全，跳过此键
          }
        }
        
        matches.push({
          key,
          value,
          length: key.length,
          matches: 1,
          regex: nonWordRegex
        });
      }
    }

    // 如果没有匹配项，返回null
    if (matches.length === 0) {
      return null;
    }

    // 按匹配优先级排序
    // 1. 长度（更长的匹配优先）
    // 2. 匹配次数（匹配次数多的优先）
    matches.sort((a, b) => {
      if (b.length !== a.length) {
        return b.length - a.length;
      }
      return b.matches - a.matches;
    });

    // 执行替换
    let result = text;
    let hasReplaced = false;

    // 为了避免替换影响后续匹配，最多只替换前N个匹配项
    const maxReplacements = Math.min(5, matches.length);

    for (let i = 0; i < maxReplacements; i++) {
      const match = matches[i];
      const newResult = result.replace(match.regex, match.value);

      if (newResult !== result) {
        result = newResult;
        hasReplaced = true;
      }
    }

    // 返回替换后的文本或null
    return hasReplaced ? result : null;
  },

  /**
   * 实现LRU缓存策略的辅助方法：获取缓存项
   * @param {string} key - 缓存键
   * @returns {string|null} 缓存的值，如果不存在返回null
   */
  getFromCache(key) {
    const cacheItem = this.translationCache.get(key);
    
    if (cacheItem && cacheItem.value) {
      // 更新访问时间和访问次数
      cacheItem.timestamp = Date.now();
      cacheItem.accessCount = (cacheItem.accessCount || 0) + 1;
      
      // 更新缓存统计
      this.cacheStats.hits++;
      this.performanceData.cacheHits++;
      
      return cacheItem.value;
    }
    
    // 缓存未命中
    this.cacheStats.misses++;
    this.performanceData.cacheMisses++;
    return null;
  },

  /**
   * 实现LRU缓存策略的辅助方法：设置缓存项
   * @param {string} key - 缓存键
   * @param {string} value - 缓存值
   */
  setToCache(key, value) {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) {
      return;
    }
    
    // 检查缓存大小是否超过限制
    this.checkCacheSizeLimit();
    
    // 创建或更新缓存项
    this.translationCache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    });
    
    // 更新缓存大小统计
    this.cacheStats.size = this.translationCache.size;
  },

  /**
   * 检查并维护缓存大小限制
   * 实现真正的LRU（最近最少使用）缓存淘汰策略
   */
  checkCacheSizeLimit() {
    const maxSize = CONFIG.performance.maxDictSize || 1000;
    
    if (this.translationCache.size >= maxSize) {
      // 需要执行LRU清理
      this.performLRUCacheEviction(maxSize);
    }
  },

  /**
   * 执行LRU缓存淘汰
   * @param {number} maxSize - 最大缓存大小
   */
  performLRUCacheEviction(maxSize) {
    try {
      // 目标大小设为最大值的80%，为新条目预留空间
      const targetSize = Math.floor(maxSize * 0.8);
      
      // 获取缓存条目并按LRU策略排序
      const cacheEntries = Array.from(this.translationCache.entries());
      
      // LRU排序策略：
      // 1. 优先保留最近访问的条目（时间戳降序）
      // 2. 对于相同时间戳，保留访问次数多的条目
      cacheEntries.sort(([, itemA], [, itemB]) => {
        // 主要按时间戳排序（最近访问的优先）
        if (itemB.timestamp !== itemA.timestamp) {
          return itemB.timestamp - itemA.timestamp;
        }
        // 次要按访问次数排序（访问次数多的优先）
        return (itemB.accessCount || 0) - (itemA.accessCount || 0);
      });
      
      // 保留最重要的条目
      const entriesToKeep = cacheEntries.slice(0, targetSize);
      const evictedCount = cacheEntries.length - entriesToKeep.length;
      
      // 重建缓存
      this.translationCache.clear();
      entriesToKeep.forEach(([key, item]) => {
        this.translationCache.set(key, item);
      });
      
      // 更新统计信息
      this.cacheStats.evictions += evictedCount;
      this.cacheStats.size = this.translationCache.size;
      this.performanceData.cacheEvictions += evictedCount;
      
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] LRU缓存淘汰完成，移除了${evictedCount}项，当前缓存大小：${this.translationCache.size}`);
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] LRU缓存淘汰失败:', error);
      }
      
      // 回退策略：如果LRU失败，清空部分缓存
      try {
        const evictCount = Math.max(50, Math.floor(this.translationCache.size * 0.2));
        const oldestEntries = Array.from(this.translationCache.entries())
          .sort(([, itemA], [, itemB]) => itemA.timestamp - itemB.timestamp)
          .slice(0, evictCount);
          
        oldestEntries.forEach(([key]) => {
          this.translationCache.delete(key);
        });
        
        this.cacheStats.evictions += evictCount;
        this.cacheStats.size = this.translationCache.size;
        this.performanceData.cacheEvictions += evictCount;
      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 缓存回退策略失败:', fallbackError);
        }
      }
    }
  },

  /**
   * 清理翻译缓存
   * 使用LRU策略进行智能缓存管理
   */
  cleanCache() {
    try {
      // 验证缓存是否存在和有效
      if (!this.translationCache || !(this.translationCache instanceof Map)) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 缓存对象不存在或无效');
        }
        return;
      }

      // 执行LRU缓存淘汰
      this.checkCacheSizeLimit();
      
      // 更新性能数据
      this.performanceData.cacheCleanups = (this.performanceData.cacheCleanups || 0) + 1;
      
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存清理完成，当前大小：${this.translationCache.size}，总命中：${this.cacheStats.hits}，总未命中：${this.cacheStats.misses}`);
      }

    } catch (error) {
      // 如果清理过程出错，使用更安全的回退策略
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 缓存清理过程出错，使用回退策略:', error);
      }

      try {
        // 最后手段：如果所有清理方法都失败，清空缓存
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 执行缓存重置作为最后手段');
        }
        this.translationCache.clear();
        this.cacheStats.size = 0;
        
      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 缓存重置失败:', fallbackError);
        }
      }
    }
  },

  /**
   * 清除翻译缓存
   * 彻底清理所有缓存和内存引用，防止内存泄漏
   */
  clearCache() {
    try {
      // 清除虚拟DOM缓存
      if (virtualDomManager && typeof virtualDomManager.clear === 'function') {
        virtualDomManager.clear();
      }
      
      // 清除翻译缓存
      if (this.translationCache) {
        this.translationCache.clear();
      }
      
      // 清除元素缓存
      if (this.elementCache) {
        this.elementCache = new WeakMap();
      }
      
      // 清除节点检查缓存
      if (this.nodeCheckCache) {
        this.nodeCheckCache = new WeakMap();
      }
      
      // 清除页面模式缓存
      if (this.pageModeCache) {
        this.pageModeCache.clear();
      }
      
      // 清除文本变化阈值缓存
      if (this.textThresholdCache) {
        this.textThresholdCache.clear();
      }
      
      // 清除重要元素缓存
      if (this.importantElementsCache) {
        this.importantElementsCache.clear();
      }
      
      // 重置缓存统计
      this.cacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0
      };
      
      // 重置性能数据
      this.resetPerformanceData();

      // 重置已翻译标记
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

      // 清理其他可能的缓存引用
      this.lastProcessedElements = [];
      this.batchProcessQueue = [];
      this.pendingTranslations = new Set();

      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 翻译缓存已彻底清除，所有内存引用已清理');
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 清除缓存时出错:', error);
      }
      
      // 出错时尝试基本清理
      try {
        if (this.translationCache) this.translationCache.clear();
        if (this.elementCache) this.elementCache = new WeakMap();
        this.cacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 基本缓存清理也失败:', fallbackError);
        }
      }
    }
  },

  /**
   * 预热词典缓存
   * 预加载常用词典条目到缓存中
   */
  warmUpCache() {
    if (!CONFIG.performance.enableTranslationCache) {
      return;
    }

    try {
      // 收集常用词汇（这里简单处理，实际项目可能有更复杂的选择逻辑）
      const commonKeys = Object.keys(this.dictionary)
        .filter(key => !this.dictionary[key].startsWith('待翻译: ') && key.length <= 50)
        .slice(0, 100); // 预加载前100个常用词条

      commonKeys.forEach(key => {
        const value = this.dictionary[key];
        this.setToCache(key, value);
      });

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存预热完成，已预加载${commonKeys.length}个常用词条`);
      }
    } catch (error) {
      console.error('[GitHub 中文翻译] 缓存预热失败:', error);
    }
  },

  /**
   * 更新词典
   * 支持动态更新词典内容
   * @param {Object} newDictionary - 新的词典条目
   */
  updateDictionary(newDictionary) {
    try {
      // 合并新词典
      Object.assign(this.dictionary, newDictionary);

      // 清除缓存，因为词典已更新
      this.clearCache();

      // 重新预热缓存
      this.warmUpCache();

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 词典已更新，新增/修改${Object.keys(newDictionary).length}个条目`);
      }
    } catch (error) {
      console.error('[GitHub 中文翻译] 更新词典失败:', error);
    }
  }
};
