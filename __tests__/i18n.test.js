/**
 * 国际化模块测试
 * @file __tests__/i18n.test.js
 */

import {
  I18nManager,
  i18nManager,
  t,
  initI18n,
  loadLocaleTranslations,
  switchLanguage,
} from '../src/i18n.js';

describe('I18nManager 国际化模块测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
  });

  afterEach(() => {
    delete global.localStorage;
  });

  describe('I18nManager 类', () => {
    it('应该创建一个实例', () => {
      const manager = new I18nManager();
      expect(manager).toBeInstanceOf(I18nManager);
    });

    it('应该具有默认语言 zh-CN', () => {
      const manager = new I18nManager();
      expect(manager.currentLocale).toBe('zh-CN');
    });

    it('应该具有回退语言 en-US', () => {
      const manager = new I18nManager();
      expect(manager.fallbackLocale).toBe('en-US');
    });

    it('应该初始化翻译映射', () => {
      const manager = new I18nManager();
      expect(manager.translations).toBeInstanceOf(Map);
    });

    it('应该初始化已加载语言集合', () => {
      const manager = new I18nManager();
      expect(manager.loadedLocales).toBeInstanceOf(Set);
    });

    it('应该初始化观察者数组', () => {
      const manager = new I18nManager();
      expect(Array.isArray(manager.observers)).toBe(true);
    });
  });

  describe('init', () => {
    it('应该初始化管理器', () => {
      const manager = new I18nManager();
      manager.init();

      expect(manager.currentLocale).toBeDefined();
    });

    it('应该设置默认语言', () => {
      const manager = new I18nManager();
      manager.init('en-US', 'de-DE');

      expect(manager.currentLocale).toBe('en-US');
      expect(manager.fallbackLocale).toBe('de-DE');
    });

    it('应该从本地存储恢复语言偏好', () => {
      global.localStorage.getItem.mockReturnValue('en-US');

      const manager = new I18nManager();
      manager.init();

      expect(manager.currentLocale).toBe('en-US');
    });

    it('应该处理无效的本地存储值', () => {
      global.localStorage.getItem.mockReturnValue(null);

      const manager = new I18nManager();
      manager.init();

      expect(manager.currentLocale).toBeDefined();
    });

    it('应该在没有本地存储时使用默认语言', () => {
      global.localStorage = undefined;

      const manager = new I18nManager();
      manager.init();

      expect(manager.currentLocale).toBeDefined();
    });
  });

  describe('loadTranslations', () => {
    it('应该加载翻译', () => {
      const manager = new I18nManager();
      const translations = { hello: '你好', world: '世界' };

      const result = manager.loadTranslations('zh-CN', translations);

      expect(result).toBe(true);
      expect(manager.translations.has('zh-CN')).toBe(true);
    });

    it('应该将语言添加到已加载集合', () => {
      const manager = new I18nManager();
      const translations = { key: 'value' };

      manager.loadTranslations('en-US', translations);

      expect(manager.loadedLocales.has('en-US')).toBe(true);
    });

    it('应该拒绝无效翻译数据', () => {
      const manager = new I18nManager();

      expect(manager.loadTranslations('zh-CN', null)).toBe(false);
      expect(manager.loadTranslations('zh-CN', 'invalid')).toBe(false);
    });

    it('应该覆盖已存在的翻译', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { hello: '你好' });
      manager.loadTranslations('zh-CN', { hello: '喂' });

      const translations = manager.translations.get('zh-CN');
      expect(translations.hello).toBe('喂');
    });
  });

  describe('loadTranslationsAsync', () => {
    it('应该异步加载翻译', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hello: '你好' }),
      });

      const manager = new I18nManager();
      const result = await manager.loadTranslationsAsync('zh-CN', '/translations/zh-CN.json');

      expect(result).toBe(true);
      expect(manager.translations.has('zh-CN')).toBe(true);
    });

    it('应该处理网络错误', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const manager = new I18nManager();
      const result = await manager.loadTranslationsAsync('zh-CN', '/invalid/path');

      expect(result).toBe(false);
    });

    it('应该处理 HTTP 错误', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const manager = new I18nManager();
      const result = await manager.loadTranslationsAsync('zh-CN', '/invalid/path');

      expect(result).toBe(false);
    });
  });

  describe('t (translate)', () => {
    beforeEach(() => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', {
        hello: '你好',
        'menu.file': '文件',
        'menu.file.open': '打开',
      });
      manager.loadTranslations('en-US', {
        hello: 'Hello',
        'menu.file': 'File',
      });
      manager.currentLocale = 'zh-CN';
    });

    it('应该返回翻译文本', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { hello: '你好' });
      manager.currentLocale = 'zh-CN';

      expect(manager.t('hello')).toBe('你好');
    });

    it('应该支持嵌套键', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { menu: { file: { open: '打开' } } });
      manager.currentLocale = 'zh-CN';

      expect(manager.t('menu.file.open')).toBe('打开');
    });

    it('应该回退到回退语言', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', {});
      manager.loadTranslations('en-US', { hello: 'Hello' });
      manager.currentLocale = 'zh-CN';

      expect(manager.t('hello')).toBe('Hello');
    });

    it('应该在没有翻译时返回键名', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', {});
      manager.currentLocale = 'zh-CN';

      expect(manager.t('missing.key')).toBe('missing.key');
    });

    it('应该处理参数替换', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { greeting: '你好, {{name}}!' });
      manager.currentLocale = 'zh-CN';

      expect(manager.t('greeting', { name: '世界' })).toBe('你好, 世界!');
    });

    it('应该处理缺少的参数', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { greeting: '你好, {{name}}!' });
      manager.currentLocale = 'zh-CN';

      expect(manager.t('greeting', {})).toBe('你好, {{name}}!');
    });

    it('应该支持指定语言翻译', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { hello: '你好' });
      manager.loadTranslations('en-US', { hello: 'Hello' });
      manager.currentLocale = 'en-US';

      expect(manager.t('hello', {}, 'zh-CN')).toBe('你好');
    });
  });

  describe('getTranslationByKey', () => {
    it('应该获取简单键的翻译', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { hello: '你好' });

      expect(manager.getTranslationByKey('hello', 'zh-CN')).toBe('你好');
    });

    it('应该获取嵌套键的翻译', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', {
        menu: {
          file: {
            open: '打开',
          },
        },
      });

      expect(manager.getTranslationByKey('menu.file.open', 'zh-CN')).toBe('打开');
    });

    it('应该对缺失的语言返回 null', () => {
      const manager = new I18nManager();

      expect(manager.getTranslationByKey('hello', 'zh-CN')).toBeNull();
    });

    it('应该对缺失的键返回 null', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { hello: '你好' });

      expect(manager.getTranslationByKey('missing', 'zh-CN')).toBeNull();
    });

    it('应该对非字符串翻译返回 null', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', { data: { nested: 'object' } });

      expect(manager.getTranslationByKey('data', 'zh-CN')).toBeNull();
    });
  });

  describe('interpolate', () => {
    it('应该替换模板中的占位符', () => {
      const manager = new I18nManager();
      const result = manager.interpolate('Hello, {{name}}!', { name: 'World' });

      expect(result).toBe('Hello, World!');
    });

    it('应该处理多个占位符', () => {
      const manager = new I18nManager();
      const result = manager.interpolate('{{greeting}}, {{name}}!', {
        greeting: 'Hello',
        name: 'World',
      });

      expect(result).toBe('Hello, World!');
    });

    it('应该保留未定义的占位符', () => {
      const manager = new I18nManager();
      const result = manager.interpolate('Hello, {{name}}!', {});

      expect(result).toBe('Hello, {{name}}!');
    });

    it('应该处理空模板', () => {
      const manager = new I18nManager();
      expect(manager.interpolate('', {})).toBe('');
    });

    it('应该处理空参数', () => {
      const manager = new I18nManager();
      expect(manager.interpolate('Hello', null)).toBe('Hello');
      expect(manager.interpolate('Hello', undefined)).toBe('Hello');
    });
  });

  describe('setLocale', () => {
    it('应该设置当前语言', () => {
      const manager = new I18nManager();
      manager.loadTranslations('en-US', {});

      manager.setLocale('en-US');

      expect(manager.currentLocale).toBe('en-US');
    });

    it('应该保存到本地存储', () => {
      const manager = new I18nManager();
      manager.loadTranslations('en-US', {});

      manager.setLocale('en-US');

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'github-i18n-locale',
        'en-US'
      );
    });

    it('应该拒绝未加载的语言', () => {
      const manager = new I18nManager();
      const result = manager.setLocale('fr-FR');

      expect(result).toBe(false);
    });

    it('应该通知观察者', () => {
      const manager = new I18nManager();
      manager.loadTranslations('en-US', {});
      const observer = jest.fn();

      manager.addObserver(observer);
      manager.setLocale('en-US');

      expect(observer).toHaveBeenCalledWith('en-US', 'zh-CN');
    });
  });

  describe('getCurrentLocale', () => {
    it('应该返回当前语言', () => {
      const manager = new I18nManager();
      manager.currentLocale = 'en-US';

      expect(manager.getCurrentLocale()).toBe('en-US');
    });
  });

  describe('getLoadedLocales', () => {
    it('应该返回已加载的语言列表', () => {
      const manager = new I18nManager();
      manager.loadTranslations('zh-CN', {});
      manager.loadTranslations('en-US', {});
      manager.loadTranslations('ja-JP', {});

      const locales = manager.getLoadedLocales();

      expect(locales).toContain('zh-CN');
      expect(locales).toContain('en-US');
      expect(locales).toContain('ja-JP');
      expect(locales.length).toBe(3);
    });
  });

  describe('观察者模式', () => {
    describe('addObserver', () => {
      it('应该添加观察者', () => {
        const manager = new I18nManager();
        const observer = jest.fn();

        manager.addObserver(observer);

        expect(manager.observers).toContain(observer);
      });

      it('应该忽略非函数观察者', () => {
        const manager = new I18nManager();

        manager.addObserver('not a function');

        expect(manager.observers.length).toBe(0);
      });
    });

    describe('removeObserver', () => {
      it('应该移除观察者', () => {
        const manager = new I18nManager();
        const observer = jest.fn();

        manager.addObserver(observer);
        manager.removeObserver(observer);

        expect(manager.observers).not.toContain(observer);
      });

      it('应该处理不存在的观察者', () => {
        const manager = new I18nManager();
        const observer = jest.fn();

        expect(() => manager.removeObserver(observer)).not.toThrow();
      });
    });

    describe('notifyObservers', () => {
      it('应该通知所有观察者', () => {
        const manager = new I18nManager();
        const observer1 = jest.fn();
        const observer2 = jest.fn();

        manager.addObserver(observer1);
        manager.addObserver(observer2);
        manager.notifyObservers('en-US', 'zh-CN');

        expect(observer1).toHaveBeenCalledWith('en-US', 'zh-CN');
        expect(observer2).toHaveBeenCalledWith('en-US', 'zh-CN');
      });

      it('应该处理观察者错误', () => {
        const manager = new I18nManager();
        const failingObserver = jest.fn().mockImplementation(() => {
          throw new Error('Observer error');
        });

        manager.addObserver(failingObserver);
        expect(() => manager.notifyObservers('en-US', 'zh-CN')).not.toThrow();
      });
    });
  });

  describe('formatDate', () => {
    it('应该格式化日期', () => {
      const manager = new I18nManager();
      const date = new Date('2024-01-15');

      const result = manager.formatDate(date);

      expect(typeof result).toBe('string');
    });

    it('应该支持自定义选项', () => {
      const manager = new I18nManager();
      const date = new Date('2024-01-15');

      const result = manager.formatDate(date, { year: 'numeric', month: 'long' });

      expect(typeof result).toBe('string');
    });

    it('应该支持指定语言', () => {
      const manager = new I18nManager();
      const date = new Date('2024-01-15');

      const result = manager.formatDate(date, {}, 'en-US');

      expect(typeof result).toBe('string');
    });
  });

  describe('formatNumber', () => {
    it('应该格式化数字', () => {
      const manager = new I18nManager();

      const result = manager.formatNumber(1234567);

      expect(typeof result).toBe('string');
    });

    it('应该支持自定义选项', () => {
      const manager = new I18nManager();

      const result = manager.formatNumber(1234.56, { minimumFractionDigits: 2 });

      expect(typeof result).toBe('string');
    });

    it('应该支持指定语言', () => {
      const manager = new I18nManager();

      const result = manager.formatNumber(1234.56, {}, 'de-DE');

      expect(typeof result).toBe('string');
    });
  });

  describe('formatRelativeTime', () => {
    it('应该格式化相对时间', () => {
      const manager = new I18nManager();
      const pastDate = new Date(Date.now() - 60000);

      const result = manager.formatRelativeTime(pastDate);

      expect(typeof result).toBe('string');
    });

    it('应该支持指定语言', () => {
      const manager = new I18nManager();
      const pastDate = new Date(Date.now() - 60000);

      const result = manager.formatRelativeTime(pastDate, 'en-US');

      expect(typeof result).toBe('string');
    });
  });
});

describe('模块级函数测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
  });

  afterEach(() => {
    delete global.localStorage;
  });

  describe('t 快捷函数', () => {
    it('应该返回翻译文本', () => {
      i18nManager.loadTranslations('zh-CN', { hello: '你好' });
      i18nManager.currentLocale = 'zh-CN';

      expect(t('hello')).toBe('你好');
    });

    it('应该支持参数', () => {
      i18nManager.loadTranslations('zh-CN', { greeting: '你好, {{name}}!' });
      i18nManager.currentLocale = 'zh-CN';

      expect(t('greeting', { name: '世界' })).toBe('你好, 世界!');
    });
  });

  describe('loadLocaleTranslations', () => {
    it('应该加载中文翻译', () => {
      const result = loadLocaleTranslations('zh-CN');

      expect(result).toBe(true);
    });

    it('应该加载英文翻译', () => {
      const result = loadLocaleTranslations('en-US');

      expect(result).toBe(true);
    });
  });

  describe('switchLanguage', () => {
    it('应该切换已加载的语言', async () => {
      await loadLocaleTranslations('ja-JP');
      const result = await switchLanguage('ja-JP');

      expect(result).toBe(true);
      expect(i18nManager.getCurrentLocale()).toBe('ja-JP');
    });

    it('应该加载未翻译的语言', async () => {
      const result = await switchLanguage('en-US');

      expect(result).toBe(true);
    });
  });

  describe('initI18n', () => {
    it('应该初始化国际化', async () => {
      global.navigator = { language: 'en-US' };

      await initI18n();

      expect(i18nManager.getLoadedLocales()).toContain('zh-CN');
      expect(i18nManager.getLoadedLocales()).toContain('en-US');
    });

    it('应该使用指定的默认语言', async () => {
      global.navigator = { language: 'en-US' };

      await initI18n('ja-JP', 'en-US');

      expect(i18nManager.getLoadedLocales()).toContain('ja-JP');
    });
  });
});

describe('全局 i18nManager 实例测试', () => {
  it('应该存在全局实例', () => {
    expect(i18nManager).toBeInstanceOf(I18nManager);
  });

  it('应该可以被重新初始化', () => {
    i18nManager.loadTranslations('test', { key: 'value' });
    i18nManager.init('test');

    expect(i18nManager.getLoadedLocales()).toContain('test');
  });
});
