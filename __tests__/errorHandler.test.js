/**
 * 错误处理模块测试
 * @file __tests__/errorHandler.test.js
 */

import { ErrorHandler } from '../src/errorHandler.js';
import { CONFIG } from '../src/config.js';

describe('ErrorHandler 错误处理模块测试', () => {
  beforeEach(() => {
    ErrorHandler.init();
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
    CONFIG.debugMode = false;
  });

  describe('ERROR_TYPES 常量', () => {
    it('应该定义所有错误类型', () => {
      expect(ErrorHandler.ERROR_TYPES.TRANSLATION).toBe('translation');
      expect(ErrorHandler.ERROR_TYPES.DOM_OPERATION).toBe('dom_operation');
      expect(ErrorHandler.ERROR_TYPES.DICTIONARY).toBe('dictionary');
      expect(ErrorHandler.ERROR_TYPES.NETWORK).toBe('network');
      expect(ErrorHandler.ERROR_TYPES.PERFORMANCE).toBe('performance');
      expect(ErrorHandler.ERROR_TYPES.OTHER).toBe('other');
    });

    it('应该包含所有必需的错误类型', () => {
      const requiredTypes = ['TRANSLATION', 'DOM_OPERATION', 'DICTIONARY', 'NETWORK', 'PERFORMANCE', 'OTHER'];
      requiredTypes.forEach(type => {
        expect(ErrorHandler.ERROR_TYPES).toHaveProperty(type);
      });
    });
  });

  describe('init', () => {
    it('应该初始化错误计数', () => {
      ErrorHandler.errorCounts.set('translation', 10);
      ErrorHandler.init();
      expect(ErrorHandler.errorCounts.get('translation')).toBe(0);
    });

    it('应该为所有错误类型初始化计数器', () => {
      ErrorHandler.init();
      Object.values(ErrorHandler.ERROR_TYPES).forEach(type => {
        expect(ErrorHandler.errorCounts.get(type)).toBe(0);
      });
    });
  });

  describe('handleError', () => {
    it('应该增加错误计数', () => {
      const error = new Error('Test error');
      ErrorHandler.handleError('测试上下文', error, ErrorHandler.ERROR_TYPES.TRANSLATION);

      expect(ErrorHandler.errorCounts.get('translation')).toBe(1);
    });

    it('应该记录错误日志', () => {
      const error = new Error('Test error');
      ErrorHandler.handleError('测试上下文', error, ErrorHandler.ERROR_TYPES.TRANSLATION);

      expect(console.error).toHaveBeenCalled();
    });

    it('应该处理带有恢复函数的错误', () => {
      const error = new Error('Test error');
      const recoveryFn = jest.fn();

      ErrorHandler.handleError('测试上下文', error, ErrorHandler.ERROR_TYPES.TRANSLATION, {
        recoveryFn,
        maxRetries: 1,
      });

      expect(recoveryFn).toHaveBeenCalled();
    });

    it('应该处理不带选项的错误', () => {
      const error = new Error('Test error');
      expect(() => {
        ErrorHandler.handleError('测试上下文', error, ErrorHandler.ERROR_TYPES.OTHER);
      }).not.toThrow();
    });

    it('应该正确处理不同错误类型', () => {
      const error = new Error('Test error');

      Object.values(ErrorHandler.ERROR_TYPES).forEach(type => {
        ErrorHandler.handleError('测试上下文', error, type);
        expect(ErrorHandler.errorCounts.get(type)).toBeGreaterThanOrEqual(1);
      });
    });

    it('应该处理带有详细选项的错误', () => {
      const error = new Error('Test error');
      ErrorHandler.handleError('测试上下文', error, ErrorHandler.ERROR_TYPES.TRANSLATION, {
        retryable: true,
        recoveryFn: jest.fn(),
        maxRetries: 3,
      });
      expect(ErrorHandler.errorCounts.get('translation')).toBe(1);
    });
  });

  describe('logError', () => {
    it('应该记录错误消息', () => {
      CONFIG.debugMode = false;
      const error = new Error('Test error message');
      ErrorHandler.logError('测试操作', error, 'translation');

      expect(console.error).toHaveBeenCalled();
    });

    it('调试模式下应该记录完整错误信息', () => {
      CONFIG.debugMode = true;
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      ErrorHandler.logError('测试操作', error, 'translation');

      expect(console.error).toHaveBeenCalled();
    });

    it('应该包含上下文信息', () => {
      const error = new Error('Test error');
      ErrorHandler.logError('词典初始化', error, 'dictionary');

      const errorCall = console.error.mock.calls[0][0];
      expect(errorCall).toContain('词典初始化');
      expect(errorCall).toContain('dictionary');
    });

    it('应该包含错误类型信息', () => {
      const error = new Error('Test error');
      ErrorHandler.logError('测试操作', error, 'network');

      const errorCall = console.error.mock.calls[0][0];
      expect(errorCall).toContain('network');
    });
  });

  describe('attemptRecovery', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      CONFIG.debugMode = true;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该执行恢复函数', () => {
      const recoveryFn = jest.fn();

      ErrorHandler.attemptRecovery('测试恢复', recoveryFn, 1);

      expect(recoveryFn).toHaveBeenCalled();
    });

    it('恢复失败时应该重试', () => {
      const recoveryFn = jest.fn()
        .mockImplementationOnce(() => {
          throw new Error('First attempt failed');
        });

      ErrorHandler.attemptRecovery('测试恢复', recoveryFn, 2);

      expect(recoveryFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(200);
    });

    it('达到最大重试次数后应该停止', () => {
      const recoveryFn = jest.fn().mockImplementation(() => {
        throw new Error('Always fails');
      });

      ErrorHandler.attemptRecovery('测试恢复', recoveryFn, 2);

      expect(recoveryFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(200);
      expect(recoveryFn).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(400);
      expect(recoveryFn).toHaveBeenCalledTimes(2);
    });

    it('恢复成功时应该记录成功日志', () => {
      const recoveryFn = jest.fn();

      ErrorHandler.attemptRecovery('测试恢复', recoveryFn, 1);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('恢复操作成功')
      );
    });

    it('恢复失败时应该记录失败日志', () => {
      const recoveryFn = jest.fn().mockImplementation(() => {
        throw new Error('Failed');
      });

      ErrorHandler.attemptRecovery('测试恢复', recoveryFn, 1);

      const errorCall = console.error.mock.calls[0][0];
      expect(errorCall).toContain('恢复操作失败');
    });
  });

  describe('checkErrorThreshold', () => {
    beforeEach(() => {
      CONFIG.performance = {
        maxTranslationErrorCount: 10,
        maxDomErrorCount: 20,
        maxDictionaryErrorCount: 5,
        maxNetworkErrorCount: 3,
        maxPerformanceErrorCount: 15,
        maxOtherErrorCount: 25,
      };
      CONFIG.debugMode = true;
    });

    it('应该检查翻译错误阈值', () => {
      ErrorHandler.errorCounts.set('translation', 10);
      ErrorHandler.checkErrorThreshold('translation', 10);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('超过阈值')
      );
    });

    it('应该检查 DOM 操作错误阈值', () => {
      ErrorHandler.errorCounts.set('dom_operation', 20);
      ErrorHandler.checkErrorThreshold('dom_operation', 20);

      expect(console.warn).toHaveBeenCalled();
    });

    it('应该检查词典错误阈值', () => {
      ErrorHandler.errorCounts.set('dictionary', 5);
      ErrorHandler.checkErrorThreshold('dictionary', 5);

      expect(console.warn).toHaveBeenCalled();
    });

    it('应该检查网络错误阈值', () => {
      ErrorHandler.errorCounts.set('network', 3);
      ErrorHandler.checkErrorThreshold('network', 3);

      expect(console.warn).toHaveBeenCalled();
    });

    it('未达到阈值时不应该触发溢出处理', () => {
      ErrorHandler.errorCounts.set('translation', 5);
      ErrorHandler.checkErrorThreshold('translation', 5);

      expect(console.warn).not.toHaveBeenCalled();
    });

    it('应该使用默认阈值当配置缺失时', () => {
      CONFIG.performance = {};
      ErrorHandler.errorCounts.set('translation', 20);
      ErrorHandler.checkErrorThreshold('translation', 20);

      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('handleErrorOverflow', () => {
    beforeEach(() => {
      CONFIG.performance = {
        enableFullTranslation: true,
        batchDelay: 0,
        networkRequestInterval: 1000,
      };
      global.window = {
        GitHub_i18n: {
          translationCore: {
            initDictionary: jest.fn(),
          },
        },
      };
    });

    afterEach(() => {
      delete global.window;
    });

    it('翻译错误溢出时应该禁用完整翻译', () => {
      CONFIG.performance.enableFullTranslation = true;

      ErrorHandler.handleErrorOverflow('translation', 10, 10);

      expect(CONFIG.performance.enableFullTranslation).toBe(false);
    });

    it('DOM 操作错误溢出时应该增加批处理延迟', () => {
      CONFIG.performance.batchDelay = 0;

      ErrorHandler.handleErrorOverflow('dom_operation', 20, 20);

      expect(CONFIG.performance.batchDelay).toBeGreaterThanOrEqual(50);
    });

    it('词典错误溢出时应该重新初始化词典', () => {
      ErrorHandler.handleErrorOverflow('dictionary', 5, 5);

      expect(global.window.GitHub_i18n.translationCore.initDictionary).toHaveBeenCalled();
    });

    it('网络错误溢出时应该增加请求间隔', () => {
      CONFIG.performance.networkRequestInterval = 1000;

      ErrorHandler.handleErrorOverflow('network', 3, 3);

      expect(CONFIG.performance.networkRequestInterval).toBeGreaterThanOrEqual(5000);
    });

    it('其他错误溢出时应该增加批处理延迟', () => {
      CONFIG.performance.batchDelay = 0;

      ErrorHandler.handleErrorOverflow('other', 25, 25);

      expect(CONFIG.performance.batchDelay).toBeGreaterThanOrEqual(100);
    });

    it('溢出处理后应该重置错误计数', () => {
      ErrorHandler.errorCounts.set('translation', 10);

      ErrorHandler.handleErrorOverflow('translation', 10, 10);

      expect(ErrorHandler.errorCounts.get('translation')).toBe(0);
    });

    it('调试模式下应该记录警告', () => {
      CONFIG.debugMode = true;

      ErrorHandler.handleErrorOverflow('translation', 10, 10);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('超过阈值')
      );
    });
  });

  describe('getErrorStats', () => {
    it('应该返回所有错误类型的统计', () => {
      ErrorHandler.errorCounts.set('translation', 5);
      ErrorHandler.errorCounts.set('network', 3);

      const stats = ErrorHandler.getErrorStats();

      expect(stats.translation).toBe(5);
      expect(stats.network).toBe(3);
    });

    it('应该返回所有错误类型的计数', () => {
      const stats = ErrorHandler.getErrorStats();

      Object.values(ErrorHandler.ERROR_TYPES).forEach(type => {
        expect(stats).toHaveProperty(type);
        expect(typeof stats[type]).toBe('number');
      });
    });

    it('新初始化的统计应该全为零', () => {
      ErrorHandler.init();
      const stats = ErrorHandler.getErrorStats();

      Object.values(stats).forEach(count => {
        expect(count).toBe(0);
      });
    });
  });

  describe('resetErrorCounts', () => {
    it('应该重置特定错误类型的计数', () => {
      ErrorHandler.errorCounts.set('translation', 10);
      ErrorHandler.errorCounts.set('network', 5);

      ErrorHandler.resetErrorCounts('translation');

      expect(ErrorHandler.errorCounts.get('translation')).toBe(0);
      expect(ErrorHandler.errorCounts.get('network')).toBe(5);
    });

    it('不带参数时应该重置所有计数', () => {
      ErrorHandler.errorCounts.set('translation', 10);
      ErrorHandler.errorCounts.set('network', 5);
      ErrorHandler.errorCounts.set('dom_operation', 3);

      ErrorHandler.resetErrorCounts();

      expect(ErrorHandler.errorCounts.get('translation')).toBe(0);
      expect(ErrorHandler.errorCounts.get('network')).toBe(0);
      expect(ErrorHandler.errorCounts.get('dom_operation')).toBe(0);
    });
  });

  describe('集成测试', () => {
    it('应该正确处理多个连续错误', () => {
      const error = new Error('Test error');

      for (let i = 0; i < 3; i++) {
        ErrorHandler.handleError('测试操作', error, ErrorHandler.ERROR_TYPES.TRANSLATION);
      }

      expect(ErrorHandler.errorCounts.get('translation')).toBe(3);
    });

    it('错误阈值触发后应该重置计数', () => {
      CONFIG.performance = {
        maxTranslationErrorCount: 2,
      };

      const error = new Error('Test error');

      ErrorHandler.handleError('测试1', error, ErrorHandler.ERROR_TYPES.TRANSLATION);
      ErrorHandler.handleError('测试2', error, ErrorHandler.ERROR_TYPES.TRANSLATION);

      expect(ErrorHandler.errorCounts.get('translation')).toBe(0);
    });

    it('应该处理不同类型的混合错误', () => {
      const error = new Error('Test error');

      ErrorHandler.handleError('翻译错误', error, ErrorHandler.ERROR_TYPES.TRANSLATION);
      ErrorHandler.handleError('DOM 错误', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION);
      ErrorHandler.handleError('词典错误', error, ErrorHandler.ERROR_TYPES.DICTIONARY);

      expect(ErrorHandler.errorCounts.get('translation')).toBe(1);
      expect(ErrorHandler.errorCounts.get('dom_operation')).toBe(1);
      expect(ErrorHandler.errorCounts.get('dictionary')).toBe(1);
    });
  });
});
