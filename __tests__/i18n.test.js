/**
 * I18nManager 测试
 * @file __tests__/i18n.test.js
 */

describe('I18nManager', () => {
  describe('模块导出', () => {
    it('should export I18nManager', async () => {
      const { I18nManager } = await import('../src/i18n.js');
      expect(I18nManager).toBeDefined();
    });

    it('should export i18nManager', async () => {
      const { i18nManager } = await import('../src/i18n.js');
      expect(i18nManager).toBeDefined();
    });

    it('should export translation function', async () => {
      const { t } = await import('../src/i18n.js');
      expect(typeof t).toBe('function');
    });
  });
});
