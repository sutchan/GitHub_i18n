/**
 * translationCore 测试
 * @file __tests__/translationCore.test.js
 */

describe('translationCore 翻译核心模块测试', () => {
  describe('模块导出', () => {
    it('should export translationCore', async () => {
      const { translationCore } = await import('../src/translationCore/index.js');
      expect(translationCore).toBeDefined();
    });
  });
});
