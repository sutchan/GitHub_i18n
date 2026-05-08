/**
 * 配置文件测试
 * @file __tests__/config.test.js
 */

import { CONFIG, getVersionFromComment } from '../src/config.js';

describe('CONFIG 配置模块测试', () => {
  describe('配置基础属性', () => {
    it('应该包含版本信息', () => {
      expect(CONFIG.version).toBeDefined();
      expect(typeof CONFIG.version).toBe('string');
    });

    it('应该包含延迟配置', () => {
      expect(CONFIG.debounceDelay).toBeDefined();
      expect(typeof CONFIG.debounceDelay).toBe('number');
      expect(CONFIG.debounceDelay).toBeGreaterThan(0);
    });

    it('应该包含调试模式配置', () => {
      expect(CONFIG.debugMode).toBeDefined();
      expect(typeof CONFIG.debugMode).toBe('boolean');
    });
  });

  describe('updateCheck 配置', () => {
    it('应该包含更新检查配置', () => {
      expect(CONFIG.updateCheck).toBeDefined();
    });

    it('应该包含更新检查启用状态', () => {
      expect(CONFIG.updateCheck.enabled).toBeDefined();
      expect(typeof CONFIG.updateCheck.enabled).toBe('boolean');
    });

    it('应该包含更新检查间隔', () => {
      expect(CONFIG.updateCheck.intervalHours).toBeDefined();
      expect(CONFIG.updateCheck.intervalHours).toBeGreaterThan(0);
    });

    it('应该包含脚本更新 URL', () => {
      expect(CONFIG.updateCheck.scriptUrl).toBeDefined();
      expect(CONFIG.updateCheck.scriptUrl).toContain('https://');
    });

    it('应该包含自动更新版本配置', () => {
      expect(CONFIG.updateCheck.autoUpdateVersion).toBeDefined();
      expect(typeof CONFIG.updateCheck.autoUpdateVersion).toBe('boolean');
    });
  });

  describe('externalTranslation 配置', () => {
    it('应该包含外部翻译配置', () => {
      expect(CONFIG.externalTranslation).toBeDefined();
    });

    it('应该包含外部翻译启用状态', () => {
      expect(CONFIG.externalTranslation.enabled).toBeDefined();
      expect(typeof CONFIG.externalTranslation.enabled).toBe('boolean');
    });

    it('应该包含翻译长度限制', () => {
      expect(CONFIG.externalTranslation.minLength).toBeDefined();
      expect(CONFIG.externalTranslation.maxLength).toBeDefined();
      expect(CONFIG.externalTranslation.minLength).toBeLessThan(CONFIG.externalTranslation.maxLength);
    });

    it('应该包含超时和请求间隔配置', () => {
      expect(CONFIG.externalTranslation.timeout).toBeDefined();
      expect(CONFIG.externalTranslation.requestInterval).toBeDefined();
      expect(CONFIG.externalTranslation.timeout).toBeGreaterThan(0);
      expect(CONFIG.externalTranslation.requestInterval).toBeGreaterThan(0);
    });

    it('应该包含缓存大小配置', () => {
      expect(CONFIG.externalTranslation.cacheSize).toBeDefined();
      expect(CONFIG.externalTranslation.cacheSize).toBeGreaterThan(0);
    });
  });

  describe('performance 配置', () => {
    it('应该包含性能配置', () => {
      expect(CONFIG.performance).toBeDefined();
    });

    it('应该包含批处理配置', () => {
      expect(CONFIG.performance.batchSize).toBeDefined();
      expect(typeof CONFIG.performance.batchSize).toBe('number');
      expect(CONFIG.performance.batchSize).toBeGreaterThan(0);
    });

    it('应该包含批处理延迟配置', () => {
      expect(CONFIG.performance.batchDelay).toBeDefined();
      expect(typeof CONFIG.performance.batchDelay).toBe('number');
      expect(CONFIG.performance.batchDelay).toBeGreaterThanOrEqual(0);
    });

    it('应该包含缓存配置', () => {
      expect(CONFIG.performance.enableTranslationCache).toBeDefined();
      expect(typeof CONFIG.performance.enableTranslationCache).toBe('boolean');
    });

    it('应该包含部分匹配配置', () => {
      expect(CONFIG.performance.enablePartialMatch).toBeDefined();
      expect(typeof CONFIG.performance.enablePartialMatch).toBe('boolean');
    });

    it('应该包含词典大小限制', () => {
      expect(CONFIG.performance.maxDictSize).toBeDefined();
      expect(CONFIG.performance.maxDictSize).toBeGreaterThan(0);
    });

    it('应该包含最小文本长度配置', () => {
      expect(CONFIG.performance.minTextLengthToTranslate).toBeDefined();
      expect(CONFIG.performance.minTextLengthToTranslate).toBeGreaterThan(0);
    });

    it('应该包含观察器配置', () => {
      expect(CONFIG.performance.observeAttributes).toBeDefined();
      expect(CONFIG.performance.observeSubtree).toBeDefined();
    });

    it('应该包含重要属性列表', () => {
      expect(CONFIG.performance.importantAttributes).toBeDefined();
      expect(Array.isArray(CONFIG.performance.importantAttributes)).toBe(true);
      expect(CONFIG.performance.importantAttributes.length).toBeGreaterThan(0);
    });

    it('应该包含重要元素选择器列表', () => {
      expect(CONFIG.performance.importantElements).toBeDefined();
      expect(Array.isArray(CONFIG.performance.importantElements)).toBe(true);
    });

    it('应该包含忽略元素列表', () => {
      expect(CONFIG.performance.ignoreElements).toBeDefined();
      expect(Array.isArray(CONFIG.performance.ignoreElements)).toBe(true);
    });

    it('应该包含突变阈值配置', () => {
      expect(CONFIG.performance.mutationThreshold).toBeDefined();
      expect(CONFIG.performance.mutationThreshold).toBeGreaterThan(0);
    });

    it('应该包含虚拟 DOM 配置', () => {
      expect(CONFIG.performance.enableVirtualDom).toBeDefined();
      expect(typeof CONFIG.performance.enableVirtualDom).toBe('boolean');
    });

    it('应该包含智能节流配置', () => {
      expect(CONFIG.performance.useSmartThrottling).toBeDefined();
      expect(typeof CONFIG.performance.useSmartThrottling).toBe('boolean');
    });

    it('应该包含错误计数限制配置', () => {
      expect(CONFIG.performance.maxTranslationErrorCount).toBeDefined();
      expect(CONFIG.performance.maxDomErrorCount).toBeDefined();
      expect(CONFIG.performance.maxDictionaryErrorCount).toBeDefined();
      expect(CONFIG.performance.maxNetworkErrorCount).toBeDefined();
    });
  });

  describe('selectors 配置', () => {
    it('应该包含选择器配置', () => {
      expect(CONFIG.selectors).toBeDefined();
    });

    it('应该包含主要选择器', () => {
      expect(CONFIG.selectors.primary).toBeDefined();
      expect(Array.isArray(CONFIG.selectors.primary)).toBe(true);
      expect(CONFIG.selectors.primary.length).toBeGreaterThan(0);
    });

    it('应该包含弹出菜单选择器', () => {
      expect(CONFIG.selectors.popupMenus).toBeDefined();
      expect(Array.isArray(CONFIG.selectors.popupMenus)).toBe(true);
    });
  });

  describe('pagePatterns 配置', () => {
    it('应该包含页面模式配置', () => {
      expect(CONFIG.pagePatterns).toBeDefined();
    });

    it('应该包含搜索页面模式', () => {
      expect(CONFIG.pagePatterns.search).toBeInstanceOf(RegExp);
    });

    it('应该包含仓库页面模式', () => {
      expect(CONFIG.pagePatterns.repository).toBeInstanceOf(RegExp);
    });

    it('应该包含 Issues 页面模式', () => {
      expect(CONFIG.pagePatterns.issues).toBeInstanceOf(RegExp);
    });

    it('应该包含拉取请求页面模式', () => {
      expect(CONFIG.pagePatterns.pullRequests).toBeInstanceOf(RegExp);
    });

    it('应该包含设置页面模式', () => {
      expect(CONFIG.pagePatterns.settings).toBeInstanceOf(RegExp);
    });

    it('应该包含仪表盘页面模式', () => {
      expect(CONFIG.pagePatterns.dashboard).toBeInstanceOf(RegExp);
    });

    it('应该包含探索页面模式', () => {
      expect(CONFIG.pagePatterns.explore).toBeInstanceOf(RegExp);
    });

    it('应该包含 Codespaces 页面模式', () => {
      expect(CONFIG.pagePatterns.codespaces).toBeInstanceOf(RegExp);
    });

    it('should match paths correctly', () => {
      expect(CONFIG.pagePatterns.search.test('/search')).toBe(true);
      expect(CONFIG.pagePatterns.search.test('/users')).toBe(false);
    });

    it('should match repository paths correctly', () => {
      expect(CONFIG.pagePatterns.repository.test('/user/repo')).toBe(true);
      expect(CONFIG.pagePatterns.repository.test('/search')).toBe(false);
    });

    it('should match issues paths correctly', () => {
      expect(CONFIG.pagePatterns.issues.test('/user/repo/issues')).toBe(true);
      expect(CONFIG.pagePatterns.issues.test('/user/repo/pull')).toBe(false);
    });

    it('should match pull requests paths correctly', () => {
      expect(CONFIG.pagePatterns.pullRequests.test('/user/repo/pull/123')).toBe(true);
      expect(CONFIG.pagePatterns.pullRequests.test('/user/repo/issues')).toBe(false);
    });
  });

  describe('getVersionFromComment', () => {
    it('应该返回版本字符串', () => {
      const version = getVersionFromComment();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('应该返回有效的语义化版本', () => {
      const version = getVersionFromComment();
      const semverRegex = /^\d+\.\d+\.\d+$/;
      expect(version).toMatch(semverRegex);
    });
  });

  describe('配置合并与默认值', () => {
    it('应该具有所有必需的配置属性', () => {
      const requiredProps = [
        'version',
        'debounceDelay',
        'routeChangeDelay',
        'debugMode',
        'updateCheck',
        'externalTranslation',
        'performance',
        'selectors',
        'pagePatterns',
      ];

      requiredProps.forEach(prop => {
        expect(CONFIG).toHaveProperty(prop);
      });
    });

    it('应该具有正确的默认调试模式', () => {
      expect(CONFIG.debugMode).toBe(false);
    });

    it('应该具有合理的延迟值', () => {
      expect(CONFIG.debounceDelay).toBeGreaterThanOrEqual(100);
      expect(CONFIG.debounceDelay).toBeLessThanOrEqual(2000);
      expect(CONFIG.routeChangeDelay).toBeGreaterThanOrEqual(100);
      expect(CONFIG.routeChangeDelay).toBeLessThanOrEqual(2000);
    });
  });

  describe('配置一致性', () => {
    it('所有数组属性应该为数组类型', () => {
      expect(Array.isArray(CONFIG.selectors.primary)).toBe(true);
      expect(Array.isArray(CONFIG.selectors.popupMenus)).toBe(true);
      expect(Array.isArray(CONFIG.performance.importantAttributes)).toBe(true);
      expect(Array.isArray(CONFIG.performance.importantElements)).toBe(true);
      expect(Array.isArray(CONFIG.performance.ignoreElements)).toBe(true);
    });

    it('所有布尔属性应该为布尔类型', () => {
      expect(typeof CONFIG.debugMode).toBe('boolean');
      expect(typeof CONFIG.updateCheck.enabled).toBe('boolean');
      expect(typeof CONFIG.externalTranslation.enabled).toBe('boolean');
      expect(typeof CONFIG.performance.enableTranslationCache).toBe('boolean');
      expect(typeof CONFIG.performance.enablePartialMatch).toBe('boolean');
    });

    it('所有数字属性应该为数字类型', () => {
      expect(typeof CONFIG.debounceDelay).toBe('number');
      expect(typeof CONFIG.performance.batchSize).toBe('number');
      expect(typeof CONFIG.performance.maxDictSize).toBe('number');
    });
  });
});
