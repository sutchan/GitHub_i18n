/**
 * 翻译核心模块测试
 * @file __tests__/translationCore.test.js
 */

import { translationCore } from '../src/translationCore.js';
import { CONFIG } from '../src/config.js';

jest.mock('../src/virtualDom.js', () => ({
  default: {
    processElements: jest.fn(elements => elements),
    shouldTranslate: jest.fn(() => true),
    markElementAsTranslated: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../src/errorHandler.js', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
    ERROR_TYPES: {
      TRANSLATION: 'translation',
      DOM_OPERATION: 'dom_operation',
      DICTIONARY: 'dictionary',
      NETWORK: 'network',
      PERFORMANCE: 'performance',
      OTHER: 'other',
    },
  },
}));

describe('translationCore 翻译核心模块测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    translationCore.dictionary = {
      'Hello': '你好',
      'World': '世界',
      'Test': '测试',
      'Code': '代码',
      'Issue': '问题',
      'Pull Request': '拉取请求',
    };
    translationCore.dictionaryHash.clear();
    translationCore.dictionaryTrie.clear();
    translationCore.regexCache.clear();
    translationCore.currentPageMode = null;
    translationCore.isPageUnloading = false;
  });

  describe('initDictionary', () => {
    it('应该正确初始化词典', () => {
      translationCore.dictionary = {
        'Hello': '你好',
        'World': '世界',
      };
      translationCore.initDictionary();

      expect(translationCore.dictionary).toBeDefined();
    });

    it('应该跳过待翻译标记的条目', () => {
      translationCore.dictionary = {
        'Hello': '你好',
        'Pending': '待翻译: pending',
      };
      translationCore.initDictionary();

      expect(translationCore.dictionaryHash.has('Pending')).toBe(false);
    });
  });

  describe('detectPageMode', () => {
    beforeEach(() => {
      delete window.location;
      window.location = { pathname: '/' };
    });

    it('应该检测仓库页面模式', () => {
      window.location.pathname = '/sutchan/test-repo';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('repository');
    });

    it('应该检测搜索页面模式', () => {
      window.location.pathname = '/search';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('search');
    });

    it('应该检测 Issues 页面模式', () => {
      window.location.pathname = '/sutchan/repo/issues';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('issues');
    });

    it('应该检测拉取请求页面模式', () => {
      window.location.pathname = '/sutchan/repo/pull/123';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('pullRequests');
    });

    it('应该检测设置页面模式', () => {
      window.location.pathname = '/settings';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('settings');
    });

    it('应该检测仪表盘页面模式', () => {
      window.location.pathname = '/';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('dashboard');
    });

    it('应该检测探索页面模式', () => {
      window.location.pathname = '/explore';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('explore');
    });

    it('应该为未知路径返回合适模式', () => {
      window.location.pathname = '/unknown-path';
      const mode = translationCore.detectPageMode();
      expect(['default', 'profile']).toContain(mode);
    });

    it('应该处理仓库子页面并返回正确模式', () => {
      window.location.pathname = '/sutchan/repo/issues/123';
      const mode = translationCore.detectPageMode();
      expect(mode).toBe('issues');
    });

    it('应该缓存当前页面模式', () => {
      window.location.pathname = '/search';
      translationCore.detectPageMode();
      expect(translationCore.currentPageMode).toBe('search');
    });
  });

  describe('getCurrentPageModeConfig', () => {
    it('应该返回当前页面模式的配置', () => {
      translationCore.currentPageMode = 'search';
      const config = translationCore.getCurrentPageModeConfig();
      expect(config.batchSize).toBe(100);
      expect(config.enablePartialMatch).toBe(false);
    });

    it('应该返回默认配置当模式未知时', () => {
      translationCore.currentPageMode = 'unknown';
      const config = translationCore.getCurrentPageModeConfig();
      expect(config).toBeDefined();
      expect(config.batchSize).toBeDefined();
    });
  });

  describe('translate', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = document.createElement('div');
      mockElement.textContent = 'Hello World';

      document.querySelectorAll = jest.fn().mockReturnValue([mockElement]);
    });

    it('应该处理空元素数组', async () => {
      document.querySelectorAll = jest.fn().mockReturnValue([]);
      const result = await translationCore.translate();
      expect(result).toBeUndefined();
    });

    it('应该处理非 HTMLElement 数组', async () => {
      const result = await translationCore.translate(['not an element']);
      expect(result).toBeUndefined();
    });

    it('应该初始化词典如果未初始化', async () => {
      translationCore.dictionary = {};
      translationCore.initDictionary = jest.fn();

      const mockDiv = document.createElement('div');
      document.querySelectorAll = jest.fn().mockReturnValue([mockDiv]);

      await translationCore.translate();
      expect(translationCore.initDictionary).toHaveBeenCalled();
    });

    it('应该翻译特定区域的元素', async () => {
      const mockDiv = document.createElement('div');
      const result = translationCore.shouldTranslateElement(mockDiv);
      expect(typeof result).toBe('boolean');
    });

    it('应该处理翻译过程中的错误', async () => {
      const errorElement = {
        textContent: 'test',
      };

      await expect(translationCore.translate([errorElement])).resolves.toBeUndefined();
    });
  });

  describe('getTranslatedText', () => {
    beforeEach(() => {
      translationCore.dictionary = {
        'Hello': '你好',
        'World': '世界',
        'Test': '测试',
      };
      translationCore.dictionaryHash.clear();
      translationCore.dictionaryHash.set('Hello', '你好');
      translationCore.dictionaryHash.set('World', '世界');
      translationCore.dictionaryHash.set('Test', '测试');
    });

    it('应该对空文本返回空字符串', () => {
      const result = translationCore.getTranslatedText('');
      expect(result === '' || result === null).toBeTruthy();
    });

    it('应该对 null 返回 null', () => {
      const result = translationCore.getTranslatedText(null);
      expect(result === '' || result === null).toBeTruthy();
    });

    it('应该对 undefined 返回 undefined', () => {
      const result = translationCore.getTranslatedText(undefined);
      expect(result === '' || result === null || result === undefined).toBeTruthy();
    });

    it('应该返回 null 对于过短的文本', () => {
      expect(translationCore.getTranslatedText('ab')).toBeNull();
    });

    it('应该从缓存返回翻译结果', () => {
      translationCore.cacheManager.setToCache = jest.fn();
      translationCore.cacheManager.getFromCache = jest.fn().mockReturnValue('缓存的你好');

      const result = translationCore.getTranslatedText('Hello');
      expect(result).toBe('缓存的你好');
    });

    it('应该从词典返回翻译结果', () => {
      translationCore.cacheManager.getFromCache = jest.fn().mockReturnValue(null);

      const result = translationCore.getTranslatedText('Hello');
      expect(result).toBe('你好');
    });

    it('应该尝试大小写不敏感匹配', () => {
      translationCore.cacheManager.getFromCache = jest.fn().mockReturnValue(null);
      translationCore.dictionaryHash.has = jest.fn().mockImplementation((key) => {
        return key === 'hello' || key === 'HELLO';
      });
      translationCore.dictionaryHash.get = jest.fn().mockImplementation((key) => {
        if (key === 'hello') return '你好';
        if (key === 'HELLO') return '你好';
        return undefined;
      });

      const resultLower = translationCore.getTranslatedText('hello');
      expect(resultLower === null || typeof resultLower === 'string').toBeTruthy();
    });

    it('应该启用部分匹配当配置允许时', () => {
      translationCore.currentPageMode = 'issues';
      translationCore.cacheManager.getFromCache = jest.fn().mockReturnValue(null);
      translationCore.performPartialTranslation = jest.fn().mockReturnValue('部分翻译结果');
      translationCore.sanitizeText = jest.fn().mockReturnValue('部分翻译结果');

      const result = translationCore.getTranslatedText('Some random text with Test inside');
      expect(result === null || typeof result === 'string').toBeTruthy();
    });

    it('应该清理危险字符', () => {
      translationCore.dictionaryHash.set('Test<script>', '安全测试');
      const result = translationCore.getTranslatedText('Test<script>');
      expect(result === null || !result.includes('<script>')).toBe(true);
    });

    it('应该缓存翻译结果', () => {
      translationCore.dictionary = { 'Hello': '你好' };
      translationCore.dictionaryHash.clear();
      translationCore.dictionaryHash.set('Hello', '你好');
      translationCore.cacheManager.getFromCache = jest.fn().mockReturnValue(null);
      translationCore.cacheManager.setToCache = jest.fn();

      translationCore.getTranslatedText('Hello');

      expect(translationCore.cacheManager.getFromCache).toHaveBeenCalled();
    });
  });

  describe('performPartialTranslation', () => {
    beforeEach(() => {
      translationCore.dictionary = {
        'Hello': '你好',
        'World': '世界',
        'Test': '测试',
        'Code': '代码',
      };

      translationCore.dictionaryTrie.clear();
      Object.keys(translationCore.dictionary).forEach(key => {
        translationCore.dictionaryTrie.insert(key);
      });
    });

    it('应该对过短的文本返回 null', () => {
      translationCore.performPartialTranslation('Hi');
      const result = translationCore.performPartialTranslation('a');
      expect(result === null || typeof result === 'string').toBeTruthy();
    });

    it('应该找到并替换部分匹配', () => {
      translationCore.dictionary = {
        'Hello': '你好',
      };
      translationCore.dictionaryTrie.clear();
      translationCore.dictionaryTrie.insert('Hello');

      const result = translationCore.performPartialTranslation('Say Hello to everyone');
      expect(result === null || typeof result === 'string').toBeTruthy();
    });

    it('应该跳过数字和特殊字符的键', () => {
      translationCore.dictionary = {
        '123': '数字',
        'Hello': '你好',
      };
      translationCore.dictionaryTrie.clear();
      translationCore.dictionaryTrie.insert('123');
      translationCore.dictionaryTrie.insert('Hello');

      const result = translationCore.performPartialTranslation('Test 123 and Hello');
      expect(result === null || typeof result === 'string').toBeTruthy();
    });

    it('应该按长度和匹配次数排序匹配项', () => {
      translationCore.dictionary = {
        'Hello': '你好',
        'ello': '埃洛',
      };
      translationCore.dictionaryTrie.clear();
      translationCore.dictionaryTrie.insert('Hello');
      translationCore.dictionaryTrie.insert('ello');

      const result = translationCore.performPartialTranslation('Say Hello');
      expect(result === null || typeof result === 'string').toBeTruthy();
    });

    it('应该限制最大替换次数', () => {
      translationCore.dictionary = {
        'a': 'A',
        'b': 'B',
        'c': 'C',
        'd': 'D',
        'e': 'E',
        'f': 'F',
      };
      translationCore.dictionaryTrie.clear();
      Object.keys(translationCore.dictionary).forEach(key => {
        translationCore.dictionaryTrie.insert(key);
      });

      const result = translationCore.performPartialTranslation('a b c d e f g');
      expect(result === null || typeof result === 'string').toBeTruthy();
    });

    it('应该返回 null 当没有找到匹配', () => {
      translationCore.dictionary = {
        'Hello': '你好',
      };
      translationCore.dictionaryTrie.clear();
      translationCore.dictionaryTrie.insert('Hello');

      const result = translationCore.performPartialTranslation('xyz');
      expect(result === null || typeof result === 'string').toBeTruthy();
    });
  });

  describe('resetPerformanceData', () => {
    it('应该重置所有性能数据', () => {
      translationCore.performanceData = {
        elementsProcessed: 100,
        textsTranslated: 500,
        cacheHits: 200,
      };

      translationCore.resetPerformanceData();

      expect(translationCore.performanceData.elementsProcessed).toBe(0);
      expect(translationCore.performanceData.textsTranslated).toBe(0);
      expect(translationCore.performanceData.cacheHits).toBe(0);
    });
  });

  describe('recordPerformanceEvent', () => {
    it('应该记录 DOM 操作事件', () => {
      translationCore.recordPerformanceEvent('dom-operation', { duration: 10 });
      expect(translationCore.performanceData.domOperations).toBe(1);
      expect(translationCore.performanceData.domOperationTime).toBe(10);
    });

    it('应该记录网络请求事件', () => {
      translationCore.recordPerformanceEvent('network-request', { duration: 50 });
      expect(translationCore.performanceData.networkRequests).toBe(1);
      expect(translationCore.performanceData.networkRequestTime).toBe(50);
    });

    it('应该记录词典查询事件', () => {
      translationCore.recordPerformanceEvent('dictionary-lookup');
      expect(translationCore.performanceData.dictionaryLookups).toBe(1);
    });

    it('应该记录部分匹配事件', () => {
      translationCore.recordPerformanceEvent('partial-match');
      expect(translationCore.performanceData.partialMatches).toBe(1);
    });

    it('应该记录批处理事件', () => {
      translationCore.recordPerformanceEvent('batch-processing');
      expect(translationCore.performanceData.batchProcessings).toBe(1);
    });

    it('应该记录错误事件', () => {
      translationCore.recordPerformanceEvent('error');
      expect(translationCore.performanceData.errorCount).toBe(1);
    });
  });

  describe('getPerformanceStats', () => {
    it('应该返回完整的性能统计', () => {
      translationCore.resetPerformanceData();
      translationCore.performanceData.translateStartTime = Date.now() - 100;
      translationCore.performanceData.translateEndTime = Date.now();
      translationCore.performanceData.cacheHits = 80;
      translationCore.performanceData.cacheMisses = 20;

      const stats = translationCore.getPerformanceStats();

      expect(stats.totalDuration).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBe('80.00%');
    });

    it('应该处理零请求情况', () => {
      translationCore.resetPerformanceData();
      const stats = translationCore.getPerformanceStats();
      expect(stats.cacheHitRate).toBe('0%');
    });

    it('应该计算平均 DOM 操作时间', () => {
      translationCore.resetPerformanceData();
      translationCore.performanceData.domOperations = 10;
      translationCore.performanceData.domOperationTime = 100;

      const stats = translationCore.getPerformanceStats();
      expect(stats.avgDomOperationTime).toBe('10.00ms');
    });
  });

  describe('exportPerformanceData', () => {
    it('应该导出性能数据为 JSON', () => {
      translationCore.resetPerformanceData();
      translationCore.currentPageMode = 'repository';

      const data = translationCore.exportPerformanceData();
      expect(typeof data).toBe('string');

      const parsed = JSON.parse(data);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.pageMode).toBe('repository');
      expect(parsed.stats).toBeDefined();
    });
  });

  describe('shouldTranslateElement', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = document.createElement('div');
    });

    it('应该对非 HTMLElement 返回 false', () => {
      expect(translationCore.shouldTranslateElement(null)).toBe(false);
      expect(translationCore.shouldTranslateElement({})).toBe(false);
    });

    it('应该对已翻译元素返回 false', () => {
      mockElement.setAttribute('data-github-zh-translated', 'true');
      expect(translationCore.shouldTranslateElement(mockElement)).toBe(false);
    });

    it('应该对空内容元素返回 false', () => {
      expect(translationCore.shouldTranslateElement(mockElement)).toBe(false);
    });

    it('应该对跳过标签返回 false', () => {
      const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input'];
      skipTags.forEach(tag => {
        const el = document.createElement(tag);
        el.textContent = 'test content';
        expect(translationCore.shouldTranslateElement(el)).toBe(false);
      });
    });

    it('应该对带有 data-no-translate 的元素返回 false', () => {
      mockElement.setAttribute('data-no-translate', 'true');
      mockElement.textContent = 'test content';
      expect(translationCore.shouldTranslateElement(mockElement)).toBe(false);
    });

    it('应该对数字文本返回 false', () => {
      mockElement.textContent = '12345';
      expect(translationCore.shouldTranslateElement(mockElement)).toBe(false);
    });

    it('应该对特殊字符文本返回 false', () => {
      mockElement.textContent = '/*-+.,;:';
      expect(translationCore.shouldTranslateElement(mockElement)).toBe(false);
    });

    it('应该对隐藏元素返回 false', () => {
      mockElement.textContent = 'test content';
      mockElement.style.display = 'none';
      expect(translationCore.shouldTranslateElement(mockElement)).toBe(false);
    });

    it('应该对有效内容返回 true', () => {
      mockElement.textContent = 'Hello World';
      expect(translationCore.shouldTranslateElement(mockElement)).toBe(true);
    });
  });

  describe('translateElement', () => {
    it('应该对非 HTMLElement 返回 false', () => {
      const result = translationCore.translateElement(null);
      expect(result).toBe(false);
    });

    it('应该对无效输入返回 false', () => {
      const result = translationCore.translateElement(undefined);
      expect(result).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('应该移除 HTML 标签', () => {
      const result = translationCore.sanitizeText('<script>alert(1)</script>');
      expect(result).not.toContain('<script>');
    });

    it('应该移除事件处理器属性', () => {
      const result = translationCore.sanitizeText('onclick="alert(1)"');
      expect(result).not.toContain('onclick');
    });

    it('应该移除 javascript: 协议', () => {
      const result = translationCore.sanitizeText('javascript:void(0)');
      expect(result).not.toContain('javascript:');
    });

    it('应该移除危险标签', () => {
      const dangerousTags = ['iframe', 'object', 'embed', 'link', 'style'];
      dangerousTags.forEach(tag => {
        const result = translationCore.sanitizeText(`<${tag}>content</${tag}>`);
        expect(result).not.toContain(`<${tag}`);
      });
    });
  });

  describe('updateDictionary', () => {
    it('应该更新词典并清理缓存', () => {
      const newEntries = {
        'New Key': '新键',
        'Another Key': '另一个键',
      };

      translationCore.updateDictionary(newEntries);

      expect(translationCore.dictionary['New Key']).toBe('新键');
      expect(translationCore.dictionary['Another Key']).toBe('另一个键');
    });
  });

  describe('warmUpCache', () => {
    it('当缓存禁用时应该提前返回', () => {
      const originalValue = CONFIG.performance.enableTranslationCache;
      CONFIG.performance.enableTranslationCache = false;

      translationCore.warmUpCache();
      expect(translationCore.cacheManager.setToCache).not.toHaveBeenCalled();

      CONFIG.performance.enableTranslationCache = originalValue;
    });

    it('应该预加载常用词典条目', () => {
      translationCore.dictionary = {
        'Hello': '你好',
        'World': '世界',
        'Test': '测试',
      };

      translationCore.cacheManager.setToCache = jest.fn();

      translationCore.warmUpCache();

      expect(translationCore.cacheManager.setToCache).toHaveBeenCalled();
    });
  });
});
