/**
 * 翻译核心模块
 * @file translationCore.js
 * @version 1.9.6
 * @date 2026-05-01
 * @author Sut
 * @description 负责页面内容的实际翻译工作
 */
import { CONFIG } from './config.js';
import { mergeAllDictionaries } from './dictionaries/index.js';
import { utils } from './utils.js';
import virtualDomManager from './virtualDom.js';
import { ErrorHandler } from './errorHandler.js';
import { Trie } from './trie.js';
import { CacheManager } from './cacheManager.js';

export const translationCore = {
  dictionary: {},
  dictionaryHash: new Map(),
  dictionaryTrie: new Trie(),
  regexCache: new Map(),
  cacheManager: new CacheManager(CONFIG.performance.maxDictSize || 2000),
  elementCache: new WeakMap(),
  performanceData: {},
  currentPageMode: null,
  isPageUnloading: false,
  cacheCleanupTimer: null,
  unloadHandler: null,

  pageModeConfig: {
    default: {
      batchSize: CONFIG.performance.batchSize,
      enablePartialMatch: CONFIG.performance.enablePartialMatch
    },
    search: { batchSize: 100, enablePartialMatch: false },
    repository: { batchSize: 50, enablePartialMatch: false },
    issues: { batchSize: 75, enablePartialMatch: true },
    pullRequests: { batchSize: 75, enablePartialMatch: true },
    explore: { batchSize: 100, enablePartialMatch: false },
    notifications: { batchSize: 60, enablePartialMatch: true },
    marketplace: { batchSize: 80, enablePartialMatch: true },
    codespaces: { batchSize: 50, enablePartialMatch: false },
    wiki: { batchSize: 120, enablePartialMatch: true },
    actions: { batchSize: 60, enablePartialMatch: false }
  },

  init() {
    try {
      this.initDictionary();
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

  initDictionary() {
    try {
      if (CONFIG.debugMode) {
        console.time('[GitHub 中文翻译] 词典初始化');
      }

      this.dictionary = mergeAllDictionaries();

      this.dictionaryHash.clear();
      this.dictionaryTrie.clear();
      this.regexCache.clear();

      Object.keys(this.dictionary).forEach(key => {
        if (!this.dictionary[key].startsWith('待翻译: ')) {
          this.dictionaryHash.set(key, this.dictionary[key]);
          if (key.length <= 100) {
            this.dictionaryHash.set(key.toLowerCase(), this.dictionary[key]);
            this.dictionaryHash.set(key.toUpperCase(), this.dictionary[key]);
          }
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
      this.dictionary = {};
      this.dictionaryHash.clear();
      this.dictionaryTrie.clear();
      this.regexCache.clear();
    }
  },

  detectPageMode() {
    try {
      const currentPath = window.location.pathname;

      for (const [mode, pattern] of Object.entries(CONFIG.pagePatterns)) {
        if (pattern && pattern instanceof RegExp && pattern.test(currentPath)) {
          if (mode === 'repository') {
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

  getCurrentPageModeConfig() {
    const mode = this.currentPageMode || this.detectPageMode();
    return this.pageModeConfig[mode] || this.pageModeConfig.default;
  },

  translate(targetElements = null) {
    if (!this.dictionary || Object.keys(this.dictionary).length === 0) {
      this.initDictionary();
    }

    const pageMode = this.detectPageMode();
    const modeConfig = this.getCurrentPageModeConfig();

    if (CONFIG.debugMode) {
      console.log(`[GitHub 中文翻译] 当前页面模式: ${pageMode}`, modeConfig);
    }

    this.resetPerformanceData();
    this.performanceData.translateStartTime = Date.now();

    return new Promise((resolve, reject) => {
      try {
        let elements;

        if (Array.isArray(targetElements)) {
          elements = targetElements.filter(el => el && el instanceof HTMLElement);
          if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译特定区域，目标元素数量: ${elements.length}`);
          }
        } else {
          elements = this.getElementsToTranslate();
          if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译整个页面，目标元素数量: ${elements.length}`);
          }
        }

        if (!elements || elements.length === 0) {
          if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 没有找到需要翻译的元素');
          }
          this.logPerformanceData();
          resolve();
          return;
        }

        this.processElementsInBatches(elements)
          .then(() => {
            this.performanceData.translateEndTime = Date.now();
            this.logPerformanceData();
            resolve();
          })
          .catch((batchError) => {
            ErrorHandler.handleError('批处理过程', batchError, ErrorHandler.ERROR_TYPES.TRANSLATION, {
              retryable: true,
              recoveryFn: () => {
                this.translateCriticalElementsOnly()
                  .then(() => {
                    this.performanceData.translateEndTime = Date.now();
                    this.logPerformanceData();
                    resolve();
                  })
                  .catch((recoverError) => {
                    ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION);
                    this.performanceData.translateEndTime = Date.now();
                    this.logPerformanceData();
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
                this.logPerformanceData();
                resolve();
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

  logPerformanceData() {
    if (CONFIG.debugMode && CONFIG.performance.logTiming) {
      const duration = Date.now() - this.performanceData.translateStartTime;
      console.log(`[GitHub 中文翻译] 性能数据 - 总耗时: ${duration}ms`);
      console.log(`  元素处理: ${this.performanceData.elementsProcessed}`);
      console.log(`  文本翻译: ${this.performanceData.textsTranslated}`);
      console.log(`  缓存命中: ${this.performanceData.cacheHits}`);
      console.log(`  缓存未命中: ${this.performanceData.cacheMisses}`);
    }
  },

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
    }
  },

  getPerformanceStats() {
    const stats = { ...this.performanceData };
    if (stats.translateStartTime > 0) {
      stats.totalDuration = stats.translateEndTime > 0
        ? stats.translateEndTime - stats.translateStartTime
        : Date.now() - stats.translateStartTime;
    } else {
      stats.totalDuration = 0;
    }

    const totalCacheRequests = stats.cacheHits + stats.cacheMisses;
    stats.cacheHitRate = totalCacheRequests > 0
      ? (stats.cacheHits / totalCacheRequests * 100).toFixed(2) + '%'
      : '0%';

    stats.avgDomOperationTime = stats.domOperations > 0
      ? (stats.domOperationTime / stats.domOperations).toFixed(2) + 'ms'
      : '0ms';

    return stats;
  },

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

  processElementsInBatches(elements) {
    elements = virtualDomManager.processElements(elements);
    const modeConfig = this.getCurrentPageModeConfig();
    const batchSize = modeConfig.batchSize || CONFIG.performance.batchSize || 50;
    const delay = CONFIG.performance.batchDelay || 0;

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return Promise.resolve();
    }

    const validElements = elements.filter(element => element instanceof HTMLElement);

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
      const processBatch = (startIndex) => {
        try {
          const endIndex = Math.min(startIndex + batchSize, validElements.length);
          const batch = validElements.slice(startIndex, endIndex);

          batch.forEach(element => {
            try {
              this.translateElement(element);
            } catch (error) {
              ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
            }
          });

          if (CONFIG.performance.logTiming && (endIndex % (batchSize * 5) === 0 || endIndex === validElements.length)) {
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
        resolve();
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

      resolve();
    });
  },

  getElementsToTranslate() {
    const uniqueElements = new Set();
    const allSelectors = [...CONFIG.selectors.primary, ...CONFIG.selectors.popupMenus];

    if (allSelectors.length <= 10) {
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
      }
    }

    allSelectors.forEach(selector => {
      try {
        const matchedElements = document.querySelectorAll(selector);
        Array.from(matchedElements).forEach(element => {
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

    return Array.from(uniqueElements).filter(element => element instanceof HTMLElement);
  },

  shouldTranslateElement(element) {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    if (element.hasAttribute('data-github-zh-translated')) {
      return false;
    }

    if (!element.textContent.trim()) {
      return false;
    }

    const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'img', 'svg', 'canvas', 'video', 'audio'];
    const tagName = element.tagName.toLowerCase();
    if (skipTags.includes(tagName)) {
      return false;
    }

    if (element.hasAttribute('data-no-translate') ||
      element.hasAttribute('translate') && element.getAttribute('translate') === 'no' ||
      element.hasAttribute('aria-hidden') ||
      element.hasAttribute('hidden')) {
      return false;
    }

    const className = element.className;
    if (className) {
      const skipClassPatterns = [
        /language-\w+/, /highlight/, /token/, /no-translate/, /octicon/, /emoji/,
        /avatar/, /timestamp/, /numeral/, /filename/, /hash/, /sha/, /shortsha/,
        /hex-color/, /code/, /gist/, /language-/, /markdown-/, /monaco-editor/,
        /syntax-/, /highlight-/, /clipboard/, /progress-/, /count/, /size/,
        /time/, /date/, /sortable/, /label/, /badge/, /url/, /email/, /key/,
        /token/, /user-name/, /repo-name/
      ];

      if (skipClassPatterns.some(pattern => pattern.test(className))) {
        return false;
      }
    }

    const id = element.id;
    if (id) {
      const skipIdPatterns = [
        /\d+/, /-\d+/, /_\d+/, /sha-/, /hash-/, /commit-/, /issue-/, /pull-/,
        /pr-/, /repo-/, /user-/, /file-/, /blob-/, /tree-/, /branch-/, /tag-/,
        /release-/, /gist-/, /discussion-/, /comment-/, /review-/, /workflow-/,
        /action-/, /job-/, /step-/, /runner-/, /package-/, /registry-/,
        /marketplace-/, /organization-/, /team-/, /project-/, /milestone-/,
        /assignee-/, /reporter-/, /reviewer-/, /author-/, /committer-/,
        /contributor-/, /sponsor-/, /funding-/, /donation-/, /payment-/,
        /billing-/, /plan-/, /subscription-/, /license-/, /secret-/,
        /key-/, /token-/, /password-/, /credential-/, /certificate-/,
        /ssh-/, /git-/, /clone-/, /push-/, /pull-/, /fetch-/, /merge-/,
        /rebase-/, /cherry-pick-/, /reset-/, /revert-/, /tag-/, /branch-/,
        /commit-/, /diff-/, /patch-/, /stash-/, /ref-/, /head-/, /remote-/,
        /upstream-/, /origin-/, /local-/, /tracking-/, /merge-base-/,
        /conflict-/, /resolve-/, /status-/, /log-/, /blame-/, /bisect-/,
        /grep-/, /find-/, /filter-/, /archive-/, /submodule-/, /worktree-/,
        /lfs-/, /graphql-/, /rest-/, /api-/, /webhook-/, /event-/,
        /payload-/, /callback-/, /redirect-/, /oauth-/, /sso-/, /ldap-/,
        /saml-/, /2fa-/, /mfa-/, /security-/, /vulnerability-/, /cve-/,
        /dependency-/, /alert-/, /secret-scanning-/, /code-scanning-/,
        /codeql-/, /actions-/, /workflow-/, /job-/, /step-/, /runner-/,
        /artifact-/, /cache-/, /environment-/, /deployment-/, /app-/,
        /oauth-app-/, /github-app-/, /integration-/, /webhook-/,
        /marketplace-/, /listing-/, /subscription-/, /billing-/,
        /plan-/, /usage-/, /limits-/, /quota-/, /traffic-/,
        /analytics-/, /insights-/, /search-/, /explore-/, /trending-/,
        /stars-/, /forks-/, /watchers-/, /contributors-/, /activity-/,
        /events-/, /notifications-/, /feeds-/, /dashboard-/, /profile-/,
        /settings-/, /preferences-/, /billing-/, /organization-/,
        /team-/, /project-/, /milestone-/, /label-/, /assignee-/,
        /reporter-/, /reviewer-/, /author-/, /committer-/,
        /contributor-/, /sponsor-/, /funding-/, /donation-/, /payment-/,
        /\b\w+[0-9]\w*\b/
      ];

      if (skipIdPatterns.some(pattern => pattern.test(id))) {
        return false;
      }
    }

    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0' ||
      computedStyle.position === 'absolute' && computedStyle.left === '-9999px') {
      return false;
    }

    const textContent = element.textContent.trim();
    if (textContent.length === 0) {
      return false;
    }

    if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(textContent)) {
      return false;
    }

    return true;
  },

  translateElement(element) {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    if (!virtualDomManager.shouldTranslate(element)) {
      return false;
    }

    if (this.elementCache.has(element)) {
      return false;
    }

    if (element.hasAttribute('data-github-zh-translated')) {
      this.elementCache.set(element, true);
      return false;
    }

    this.performanceData.elementsProcessed++;

    if (!this.shouldTranslateElement(element)) {
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
        if (trimmedText && trimmedText.length >= CONFIG.performance.minTextLengthToTranslate) {
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
      const translatedText = this.getTranslatedText(originalText);

      if (translatedText && typeof translatedText === 'string' && translatedText !== originalText) {
        try {
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

    this.elementCache.set(element, true);

    return hasTranslation;
  },

  sanitizeText(text) {
    let sanitizedText = text.replace(/<[^>]*>/g, '');
    sanitizedText = sanitizedText.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitizedText = sanitizedText.replace(/javascript:/gi, '');
    sanitizedText = sanitizedText.replace(/data:/gi, '');
    sanitizedText = sanitizedText.replace(/expression\([^)]*\)/gi, '');
    sanitizedText = sanitizedText.replace(/vbscript:/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*script/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*iframe/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*object/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*embed/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*link/gi, '');
    sanitizedText = sanitizedText.replace(/<\s*style/gi, '');

    return sanitizedText;
  },

  getTranslatedText(text) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text;
    }

    const normalizedText = text.trim();

    if (normalizedText.length < CONFIG.performance.minTextLengthToTranslate) {
      return null;
    }

    if (CONFIG.performance.enableTranslationCache) {
      const cachedResult = this.cacheManager.getFromCache(normalizedText);
      if (cachedResult !== null) {
        this.performanceData.cacheHits++;
        return cachedResult;
      }
    }

    this.performanceData.cacheMisses++;

    let result = null;
    result = this.dictionaryHash.get(normalizedText);

    if (result === undefined && normalizedText.length <= 100) {
      const lowerCaseText = normalizedText.toLowerCase();
      const upperCaseText = normalizedText.toUpperCase();
      result = this.dictionaryHash.get(lowerCaseText) || this.dictionaryHash.get(upperCaseText);
    }

    const modeConfig = this.getCurrentPageModeConfig();
    const enablePartialMatch = modeConfig.enablePartialMatch !== undefined
      ? modeConfig.enablePartialMatch : CONFIG.performance.enablePartialMatch;

    if (result === null && enablePartialMatch) {
      result = this.performPartialTranslation(normalizedText);
    }

    if (result !== null) {
      result = this.sanitizeText(result);
    }

    if (CONFIG.performance.enableTranslationCache &&
      normalizedText.length <= CONFIG.performance.maxCachedTextLength) {
      if (result !== null) {
        this.cacheManager.setToCache(normalizedText, result, this.isPageUnloading);
      }
    }

    return result;
  },

  performPartialTranslation(text) {
    const textLen = text.length;

    if (textLen < 5) {
      return null;
    }

    const matches = [];
    const minKeyLength = Math.min(4, Math.floor(textLen / 2));
    const potentialMatches = this.dictionaryTrie.findAllMatches(text, minKeyLength);

    for (const match of potentialMatches) {
      const key = match.key;
      if (!this.dictionary.hasOwnProperty(key) ||
        this.dictionary[key].startsWith('待翻译: ')) {
        continue;
      }

      const value = this.dictionary[key];

      if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(key)) {
        continue;
      }

      const wordRegexKey = `word_${key}`;
      let wordRegex;

      if (this.regexCache.has(wordRegexKey)) {
        wordRegex = this.regexCache.get(wordRegexKey);
      } else {
        wordRegex = utils.safeRegExp('\\b' + utils.escapeRegExp(key) + '\\b', 'gi');
        if (wordRegex) {
          this.regexCache.set(wordRegexKey, wordRegex);
        } else {
          continue;
        }
      }

      const wordMatches = text.match(wordRegex);

      if (wordMatches && wordMatches.length > 0) {
        matches.push({
          key,
          value,
          length: key.length,
          matches: wordMatches.length,
          regex: wordRegex
        });
      } else {
        const nonWordRegexKey = `nonword_${key}`;
        let nonWordRegex;

        if (this.regexCache.has(nonWordRegexKey)) {
          nonWordRegex = this.regexCache.get(nonWordRegexKey);
        } else {
          nonWordRegex = utils.safeRegExp(utils.escapeRegExp(key), 'g');
          if (nonWordRegex) {
            this.regexCache.set(nonWordRegexKey, nonWordRegex);
          } else {
            continue;
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

    if (matches.length === 0) {
      return null;
    }

    matches.sort((a, b) => {
      if (b.length !== a.length) {
        return b.length - a.length;
      }
      return b.matches - a.matches;
    });

    let result = text;
    let hasReplaced = false;

    const maxReplacements = Math.min(5, matches.length);

    for (let i = 0; i < maxReplacements; i++) {
      const match = matches[i];
      const newResult = result.replace(match.regex, match.value);

      if (newResult !== result) {
        result = newResult;
        hasReplaced = true;
      }
    }

    return hasReplaced ? result : null;
  },

  cleanCache() {
    try {
      if (!this.cacheManager.translationCache || !(this.cacheManager.translationCache instanceof Map)) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 缓存对象不存在或无效');
        }
        return;
      }

      this.cacheManager.cleanCache();
      this.performanceData.cacheCleanups = (this.performanceData.cacheCleanups || 0) + 1;

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存清理完成，当前大小：${this.cacheManager.translationCache.size}`);
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 缓存清理过程出错，使用回退策略:', error);
      }

      try {
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 执行缓存重置作为最后手段');
        }
        this.cacheManager.translationCache.clear();
        this.cacheManager.cacheStats.size = 0;
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

      if (this.cacheManager) {
        this.cacheManager.clearCache();
      }

      if (this.elementCache) {
        this.elementCache = new WeakMap();
      }

      if (this.nodeCheckCache) {
        this.nodeCheckCache = new WeakMap();
      }

      if (this.pageModeCache) {
        this.pageModeCache.clear();
      }

      if (this.textThresholdCache) {
        this.textThresholdCache.clear();
      }

      if (this.importantElementsCache) {
        this.importantElementsCache.clear();
      }

      this.resetPerformanceData();

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

      this.lastProcessedElements = [];
      this.batchProcessQueue = [];
      this.pendingTranslations = new Set();

      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 翻译缓存已彻底清除');
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 清除缓存时出错:', error);
      }

      try {
        if (this.cacheManager) this.cacheManager.clearCache();
        if (this.elementCache) this.elementCache = new WeakMap();
        this.cacheManager.cacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 基本缓存清理也失败:', fallbackError);
        }
      }
    }
  },

  warmUpCache() {
    if (!CONFIG.performance.enableTranslationCache) {
      return;
    }

    try {
      const commonKeys = Object.keys(this.dictionary)
        .filter(key => !this.dictionary[key].startsWith('待翻译: ') && key.length <= 50)
        .slice(0, 100);

      commonKeys.forEach(key => {
        const value = this.dictionary[key];
        this.cacheManager.setToCache(key, value, this.isPageUnloading);
      });

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存预热完成，已预加载${commonKeys.length}个常用词条`);
      }
    } catch (error) {
      console.error('[GitHub 中文翻译] 缓存预热失败:', error);
    }
  },

  updateDictionary(newDictionary) {
    try {
      Object.assign(this.dictionary, newDictionary);
      this.clearCache();
      this.warmUpCache();

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 词典已更新，新增/修改${Object.keys(newDictionary).length}个条目`);
      }
    } catch (error) {
      console.error('[GitHub 中文翻译] 更新词典失败:', error);
    }
  }
};
