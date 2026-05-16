/**
 * ErrorHandler 测试
 * @file __tests__/errorHandler.test.js
 */

describe('ErrorHandler', () => {
  describe('模块导出', () => {
    it('should export ErrorHandler class', async () => {
      const { ErrorHandler } = await import('../src/errorHandler.js');
      expect(ErrorHandler).toBeDefined();
      expect(typeof ErrorHandler).toBe('object');
    });

    it('should have error types defined', async () => {
      const { ErrorHandler } = await import('../src/errorHandler.js');
      expect(ErrorHandler.ERROR_TYPES).toBeDefined();
      expect(ErrorHandler.ERROR_TYPES.TRANSLATION).toBe('translation');
      expect(ErrorHandler.ERROR_TYPES.DOM_OPERATION).toBe('dom_operation');
    });

    it('should have init method', async () => {
      const { ErrorHandler } = await import('../src/errorHandler.js');
      expect(typeof ErrorHandler.init).toBe('function');
    });

    it('should have handleError method', async () => {
      const { ErrorHandler } = await import('../src/errorHandler.js');
      expect(typeof ErrorHandler.handleError).toBe('function');
    });
  });
});
