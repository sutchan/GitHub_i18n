/**
 * 翻译核心模块
 * 负责页面内容的实际翻译工作
 */
import { CONFIG } from './config.js';
import { mergeAllDictionaries } from './dictionaries/index.js';
import { utils } from './utils.js';

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
   * 性能监控数据
   */
  performanceData: {
    translateStartTime: 0,
    elementsProcessed: 0,
    textsTranslated: 0,
    cacheHits: 0,
    cacheMisses: 0
  },

  /**
   * 当前页面模式
   * @type {string}
   */
  currentPageMode: null,

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
   * 初始化词典
   */
  initDictionary() {
    if (CONFIG.debugMode) {
      console.time('[GitHub 中文翻译] 词典初始化');
    }

    this.dictionary = mergeAllDictionaries();

    if (CONFIG.debugMode) {
      console.timeEnd('[GitHub 中文翻译] 词典初始化');
      console.log(`[GitHub 中文翻译] 词典条目数量: ${Object.keys(this.dictionary).length}`);
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
            // 记录性能数据
            this.logPerformanceData();
            resolve();
          })
          .catch((batchError) => {
            if (CONFIG.debugMode) {
              console.error('[GitHub 中文翻译] 批处理过程中出错:', batchError);
            }

            // 错误恢复机制：尝试继续执行基本翻译
            try {
              if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 尝试错误恢复，执行最小化翻译');
              }
              this.translateCriticalElementsOnly()
                .then(() => {
                  this.logPerformanceData();
                  resolve(); // 即使有错误，也尽量完成基本翻译
                })
                .catch((recoverError) => {
                  if (CONFIG.debugMode) {
                    console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
                  }
                  this.logPerformanceData();
                  reject(recoverError);
                });
            } catch (recoverError) {
              if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
              }
              this.logPerformanceData();
              reject(recoverError);
            }
          });
      } catch (error) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 翻译过程中出错:', error);
        }

        // 错误恢复机制：尝试继续执行基本翻译
        try {
          if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 尝试错误恢复，执行最小化翻译');
          }
          this.translateCriticalElementsOnly()
            .then(() => {
              this.logPerformanceData();
              resolve(); // 即使有错误，也尽量完成基本翻译
            })
            .catch((recoverError) => {
              if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
              }
              this.logPerformanceData();
              reject(recoverError);
            });
        } catch (recoverError) {
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 错误恢复失败:', recoverError);
          }
          this.logPerformanceData();
          reject(recoverError);
        }
      }
    });
  },

  /**
   * 重置性能统计数据
   */
  resetPerformanceData() {
    this.performanceData = {
      translateStartTime: 0,
      elementsProcessed: 0,
      textsTranslated: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  },

  /**
   * 记录性能数据
   */
  logPerformanceData() {
    if (CONFIG.debugMode && CONFIG.performance.logTiming) {
      const duration = Date.now() - this.performanceData.translateStartTime;
      console.log(`[GitHub 中文翻译] 翻译完成 - 耗时: ${duration}ms, 处理元素: ${this.performanceData.elementsProcessed}, ` +
        `翻译文本: ${this.performanceData.textsTranslated}, 缓存命中: ${this.performanceData.cacheHits}, ` +
        `缓存未命中: ${this.performanceData.cacheMisses}`);
    }
  },

  /**
   * 分批处理元素
   * 避免单次处理过多元素导致UI阻塞
   * @param {HTMLElement[]} elements - 要处理的元素数组
   * @returns {Promise<void>} 处理完成的Promise
   */
  processElementsInBatches(elements) {
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
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 翻译元素时出错:', error, element);
          }
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
              if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 翻译元素时出错:', error, element);
              }
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
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 批处理时出错:', error);
          }
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
          if (CONFIG.debugMode) {
            console.warn(`[GitHub 中文翻译] 查询选择器失败: ${selector}`, err);
          }
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
          if (CONFIG.debugMode) {
            console.warn('[GitHub 中文翻译] 关键元素翻译失败:', err, element);
          }
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
    if (/^[0-9.,\s\-\+\(\)\[\]\{\}\/\*\^\$\#\@\!\~\`\|\:\;"'\?\>]+\$/i.test(textContent)) {
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

    // 性能优化：检查是否已翻译，避免重复翻译
    if (element.hasAttribute('data-github-zh-translated')) {
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
      const nextSibling = node.nextSibling;
      const parentNode = node.parentNode;

      // 移除原始节点
      parentNode.removeChild(node);

      const originalText = node.nodeValue;
      const translatedText = this.getTranslatedText(originalText);

      // 如果有翻译结果且与原文不同，创建翻译后的文本节点
      if (translatedText && typeof translatedText === 'string' && translatedText !== originalText) {
        try {
          // 确保翻译文本是有效的字符串，去除可能导致问题的字符
          const safeTranslatedText = String(translatedText).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
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
      element.setAttribute('data-github-zh-translated', 'true');
    } else {
      // 标记为已检查但未翻译，避免重复检查
      element.setAttribute('data-github-zh-translated', 'checked');
    }

    return hasTranslation;
  },

  /**
   * 获取文本的翻译结果
   * 优化版：改进缓存策略、添加更智能的文本处理
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
    if (CONFIG.performance.enableTranslationCache && this.translationCache.has(normalizedText)) {
      this.performanceData.cacheHits++;
      return this.translationCache.get(normalizedText);
    }

    // 记录缓存未命中
    this.performanceData.cacheMisses++;

    // 尝试不同的规范化形式进行匹配
    let result = null;

    // 1. 尝试精确匹配（已经规范化的文本）
    if (this.dictionary[normalizedText]) {
      const translation = this.dictionary[normalizedText];
      // 避免返回标记为待翻译的文本
      if (!translation.startsWith('待翻译: ')) {
        result = translation;
      }
    }

    // 2. 尝试不区分大小写的匹配（仅当文本长度小于某个阈值）
    if (result === null && normalizedText.length <= 100) { // 避免对过长文本进行大小写转换
      const lowerCaseText = normalizedText.toLowerCase();
      const upperCaseText = normalizedText.toUpperCase();

      if (this.dictionary[lowerCaseText]) {
        const translation = this.dictionary[lowerCaseText];
        if (!translation.startsWith('待翻译: ')) {
          result = translation;
        }
      } else if (this.dictionary[upperCaseText]) {
        const translation = this.dictionary[upperCaseText];
        if (!translation.startsWith('待翻译: ')) {
          result = translation;
        }
      }
    }

    // 3. 如果启用了部分匹配且尚未找到结果
    const modeConfig = this.getCurrentPageModeConfig();
    const enablePartialMatch = modeConfig.enablePartialMatch !== undefined ?
      modeConfig.enablePartialMatch : CONFIG.performance.enablePartialMatch;

    if (result === null && enablePartialMatch) {
      result = this.performPartialTranslation(normalizedText);
    }

    // 更新缓存 - 优化：根据文本长度选择是否缓存
    if (CONFIG.performance.enableTranslationCache &&
      normalizedText.length <= CONFIG.performance.maxCachedTextLength) {
      // 智能缓存管理
      if (this.translationCache.size >= CONFIG.performance.maxDictSize) {
        this.cleanCache();
      }

      // 只缓存翻译结果不为null的文本
      if (result !== null) {
        this.translationCache.set(normalizedText, result);
      }
    }

    return result;
  },

  /**
   * 执行部分翻译匹配
   * 优化版：使用智能匹配算法和优先级排序
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

    // 筛选可能匹配的键
    for (const [key, value] of Object.entries(this.dictionary)) {
      // 快速检查
      if (key.length < minKeyLength ||
        key.length > textLen ||
        value.startsWith('待翻译: ') ||
        // 避免对纯数字或特殊字符的匹配
        /^[0-9.,\s\-\+\(\)\[\]\{\}\/\*\^\$\#\@\!\~\`\|\:\;"'\?\>]+$/i.test(key)) {
        continue;
      }

      // 使用更高效的匹配算法
      // 先检查是否包含，再使用正则确认是完整单词
      if (text.includes(key)) {
        // 尝试将key视为一个完整的单词进行匹配
        // 使用单词边界的正则表达式
        const wordRegex = new RegExp(`\\b${utils.escapeRegExp(key)}\\b`, 'gi');
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
          matches.push({
            key,
            value,
            length: key.length,
            matches: 1,
            regex: new RegExp(utils.escapeRegExp(key), 'g')
          });
        }
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
   * 清理翻译缓存
   * 性能优化：智能缓存清理策略
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

      const currentSize = this.translationCache.size;
      const maxSize = CONFIG.performance.maxDictSize || 1000;

      // 检查是否需要清理
      if (currentSize <= maxSize) {
        // 缓存尚未达到需要清理的程度
        return;
      }

      // 目标大小设为最大值的75%，为新条目预留空间
      const targetSize = Math.floor(maxSize * 0.75);

      // 获取缓存条目并进行智能排序
      const cacheEntries = Array.from(this.translationCache.entries());

      // 1. 先移除null值的缓存项
      const nonNullEntries = cacheEntries.filter(([key, value]) => {
        return value !== null && typeof value === 'string';
      });

      // 2. 智能排序策略：
      //    - 短键优先（更可能重复出现）
      //    - 非空值优先
      //    - 忽略过长的键（不太可能重复使用）
      nonNullEntries.sort(([keyA, valueA], [keyB, valueB]) => {
        // 优先保留较短的键
        if (keyA.length !== keyB.length) {
          return keyA.length - keyB.length;
        }

        // 其次考虑翻译后的长度（较长的翻译可能更有价值）
        const valueALength = valueA ? valueA.length : 0;
        const valueBLength = valueB ? valueB.length : 0;
        return valueBLength - valueALength;
      });

      // 3. 保留最重要的条目
      const entriesToKeep = nonNullEntries.slice(0, targetSize);

      // 4. 重建缓存
      const oldSize = this.translationCache.size;
      this.translationCache.clear();

      // 5. 添加需要保留的条目
      entriesToKeep.forEach(([key, value]) => {
        if (value !== null && typeof value === 'string') {
          this.translationCache.set(key, value);
        }
      });

      if (CONFIG.debugMode) {
        const removedCount = oldSize - this.translationCache.size;
        console.log(`[GitHub 中文翻译] 缓存已清理，从${oldSize}项减少到${this.translationCache.size}项，移除了${removedCount}项`);
      }

      // 更新性能数据
      this.performanceData.cacheCleaned = (this.performanceData.cacheCleaned || 0) + 1;

    } catch (error) {
      // 如果清理过程出错，使用更安全的回退策略
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 缓存清理过程出错，使用回退策略:', error);
      }

      try {
        // 更安全的回退策略：删除30%的条目，优先删除较长的键
        const maxSize = CONFIG.performance.maxDictSize || 1000;
        const entriesToRemove = Math.max(10, Math.floor(this.translationCache.size * 0.3));

        // 转换为数组并按键长度降序排序（优先删除长键）
        const cacheEntries = Array.from(this.translationCache.entries());
        cacheEntries.sort(([keyA], [keyB]) => keyB.length - keyA.length);

        // 删除前N个最长的键
        for (let i = 0; i < entriesToRemove && i < cacheEntries.length; i++) {
          this.translationCache.delete(cacheEntries[i][0]);
        }

      } catch (fallbackError) {
        // 最后手段：如果所有清理方法都失败，直接清空缓存
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 回退策略也失败，清空整个缓存:', fallbackError);
        }
        this.translationCache.clear();
      }
    }
  },

  /**
   * 清除翻译缓存
   */
  clearCache() {
    this.translationCache.clear();

    // 重置已翻译标记
    const translatedElements = document.querySelectorAll('[data-github-zh-translated]');
    translatedElements.forEach(element => {
      element.removeAttribute('data-github-zh-translated');
    });

    if (CONFIG.debugMode) {
      console.log('[GitHub 中文翻译] 翻译缓存已清除，已移除所有翻译标记');
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
        this.translationCache.set(key, value);
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
