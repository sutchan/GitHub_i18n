/**
 * 错误处理模块
 * 负责统一管理所有错误处理和恢复机制
 */

import { CONFIG } from './config.js';

export const ErrorHandler = {
  // 错误计数器
  errorCounts: new Map(),
  
  // 错误类型定义
  ERROR_TYPES: {
    TRANSLATION: 'translation',
    DOM_OPERATION: 'dom_operation',
    DICTIONARY: 'dictionary',
    NETWORK: 'network',
    PERFORMANCE: 'performance',
    OTHER: 'other'
  },

  /**
   * 初始化错误处理器
   */
  init() {
    this.errorCounts.clear();
    // 初始化所有错误类型的计数器
    Object.values(this.ERROR_TYPES).forEach(type => {
      this.errorCounts.set(type, 0);
    });
  },

  /**
   * 处理错误
   * @param {string} context - 错误发生的上下文
   * @param {Error} error - 错误对象
   * @param {string} type - 错误类型
   * @param {Object} [options] - 错误处理选项
   * @param {boolean} [options.retryable] - 是否可重试
   * @param {Function} [options.recoveryFn] - 恢复函数
   * @param {number} [options.maxRetries] - 最大重试次数
   */
  handleError(context, error, type = this.ERROR_TYPES.OTHER, options = {}) {
    // 更新错误计数
    const currentCount = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, currentCount + 1);

    // 记录错误日志
    this.logError(context, error, type);

    // 检查是否需要进行恢复
    if (options.recoveryFn && typeof options.recoveryFn === 'function') {
      this.attemptRecovery(context, options.recoveryFn, options.maxRetries || 1);
    }

    // 检查是否需要采取紧急措施
    this.checkErrorThreshold(type, currentCount + 1);
  },

  /**
   * 记录错误日志
   * @param {string} context - 错误发生的上下文
   * @param {Error} error - 错误对象
   * @param {string} type - 错误类型
   */
  logError(context, error, type) {
    const errorMessage = `[GitHub 中文翻译] ${context}时出错 (${type}): ${error.message}`;
    
    if (CONFIG.debugMode) {
      console.error(errorMessage, error);
      
      // 在调试模式下，提供更详细的错误信息
      if (error.stack) {
        console.error('[GitHub 中文翻译] 错误堆栈:', error.stack);
      }
    } else {
      console.error(errorMessage);
    }
  },

  /**
   * 尝试恢复操作
   * @param {string} context - 恢复操作的上下文
   * @param {Function} recoveryFn - 恢复函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} [currentAttempt=0] - 当前尝试次数
   */
  attemptRecovery(context, recoveryFn, maxRetries, currentAttempt = 0) {
    try {
      recoveryFn();
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] ${context} - 恢复操作成功 (尝试: ${currentAttempt + 1})`);
      }
    } catch (recoveryError) {
      const attempt = currentAttempt + 1;
      if (CONFIG.debugMode) {
        console.error(`[GitHub 中文翻译] ${context} - 恢复操作失败 (尝试: ${attempt}/${maxRetries}):`, recoveryError);
      }

      if (attempt < maxRetries) {
        // 指数退避重试
        const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms...
        setTimeout(() => {
          this.attemptRecovery(context, recoveryFn, maxRetries, attempt);
        }, delay);
      }
    }
  },

  /**
   * 检查错误阈值
   * @param {string} type - 错误类型
   * @param {number} count - 当前错误计数
   */
  checkErrorThreshold(type, count) {
    const thresholds = {
      [this.ERROR_TYPES.TRANSLATION]: CONFIG.performance?.maxTranslationErrorCount || 10,
      [this.ERROR_TYPES.DOM_OPERATION]: CONFIG.performance?.maxDomErrorCount || 20,
      [this.ERROR_TYPES.DICTIONARY]: CONFIG.performance?.maxDictionaryErrorCount || 5,
      [this.ERROR_TYPES.NETWORK]: CONFIG.performance?.maxNetworkErrorCount || 3,
      [this.ERROR_TYPES.PERFORMANCE]: CONFIG.performance?.maxPerformanceErrorCount || 15,
      [this.ERROR_TYPES.OTHER]: CONFIG.performance?.maxOtherErrorCount || 25
    };

    const threshold = thresholds[type] || 20;
    
    if (count >= threshold) {
      this.handleErrorOverflow(type, count, threshold);
    }
  },

  /**
   * 处理错误溢出
   * @param {string} type - 错误类型
   * @param {number} count - 当前错误计数
   * @param {number} threshold - 阈值
   */
  handleErrorOverflow(type, count, threshold) {
    if (CONFIG.debugMode) {
      console.warn(`[GitHub 中文翻译] ${type} 错误超过阈值 (${count}/${threshold})，采取紧急措施`);
    }

    // 根据错误类型采取不同的紧急措施
    switch (type) {
      case this.ERROR_TYPES.TRANSLATION:
        // 切换到最小化翻译模式
        CONFIG.performance.enableFullTranslation = false;
        break;
      case this.ERROR_TYPES.DOM_OPERATION:
        // 减少DOM操作频率
        CONFIG.performance.batchDelay = Math.max(CONFIG.performance.batchDelay || 0, 50);
        break;
      case this.ERROR_TYPES.DICTIONARY:
        // 重新初始化词典
        if (typeof window.GitHub_i18n !== 'undefined' && window.GitHub_i18n.translationCore) {
          window.GitHub_i18n.translationCore.initDictionary();
        }
        break;
      case this.ERROR_TYPES.NETWORK:
        // 增加网络请求间隔
        CONFIG.performance.networkRequestInterval = Math.max(CONFIG.performance.networkRequestInterval || 1000, 5000);
        break;
      default:
        // 通用紧急措施：减少处理频率
        CONFIG.performance.batchDelay = Math.max(CONFIG.performance.batchDelay || 0, 100);
        break;
    }

    // 重置错误计数
    this.errorCounts.set(type, 0);
  },

  /**
   * 获取错误统计信息
   * @returns {Object} 错误统计对象
   */
  getErrorStats() {
    const stats = {};
    this.errorCounts.forEach((count, type) => {
      stats[type] = count;
    });
    return stats;
  },

  /**
   * 重置错误计数
   * @param {string} [type] - 可选的错误类型，不提供则重置所有
   */
  resetErrorCounts(type) {
    if (type) {
      this.errorCounts.set(type, 0);
    } else {
      this.init();
    }
  }
};

// 初始化错误处理器
ErrorHandler.init();