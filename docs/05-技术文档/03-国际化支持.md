# 03-国际化支持

## 概述

本文档详细说明GitHub中文翻译插件的国际化支持框架设计与实现，包括多语言支持机制、语言切换功能、本地化存储和格式化功能。

## 国际化框架设计

## 核心架构

GitHub中文翻译插件的国际化框架基于观察者模式设计，实现了松耦合的多语言支持系统。核心组件包括：

1. **I18nManager类**: 国际化管理的核心类，负责翻译加载、语言切换和通知订阅
2. **翻译存储系统**: 基于Map和localStorage的翻译数据缓存机制
3. **格式化工具**: 提供日期、数字和相对时间的本地化格式化功能
4. **观察者模式**: 实现语言切换事件的发布订阅机制

## 技术实现

## # I18nManager类

I18nManager类是国际化框架的核心，提供以下主要功能：

```javascript

class I18nManager {
  constructor(options = {}) {
|    this.currentLanguage = options.defaultLanguage || 'zh-CN';|
|    this.fallbackLanguage = options.fallbackLanguage || 'en';|
    this.translations = new Map();
    this.observers = [];
|    this.storageKey = options.storageKey || 'github_i18n_lang';|
|    this.debug = options.debug || false;|
  }
  
  // 加载翻译数据
  async loadTranslations(language) {
    // 实现翻译数据的动态加载
  }
  
  // 获取翻译文本
  t(key, params = {}) {
    // 实现键值查找和参数插值
  }
  
  // 切换语言
  async setLanguage(language) {
    // 实现语言切换和通知观察者
  }
  
  // 订阅语言变化事件
  subscribe(callback) {
    // 实现观察者订阅机制
  }
}

```

## # 翻译数据结构

翻译数据采用嵌套对象结构，支持分层级的键值访问：

```javascript

const translations = {
  'zh-CN': {
    common: {
      buttons: {
        save: '保存',
        cancel: '取消',
        delete: '删除'
      }
    },
    pages: {
      profile: {
        title: '个人资料',
        edit: '编辑资料'
      }
    }
  }
};

```

## # 参数插值功能

支持在翻译文本中插入动态参数：

```javascript

// 翻译文本
const translation = '欢迎 {name}，您有 {count, number} 条新消息';

// 参数插值
t('welcome.message', { name: '张三', count: 5 });
// 输出: "欢迎 张三，您有 5 条新消息"

```

## 功能特性

## 1. 多语言支持

- 支持任意数量的语言包
- 自动回退机制，当目标语言缺少翻译时使用回退语言
- 动态语言包加载，减少初始加载时间
- 支持语言包的热更新

## 2. 语言切换

- 提供简单的API进行语言切换
- 自动保存用户的语言偏好到本地存储
- 语言切换后自动更新界面文本
- 支持语言切换事件的订阅和响应

## 3. 本地化存储

- 使用localStorage持久化用户语言偏好
- 支持翻译数据的本地缓存
- 提供缓存清理和更新机制

## 4. 格式化功能

## # 日期格式化

```javascript

// 格式化日期
formatDate(new Date(), 'zh-CN');
// 输出: "2024年6月17日"

formatDate(new Date(), 'en');
// 输出: "June 17, 2024"

```

## # 数字格式化

```javascript

// 格式化数字
formatNumber(1234567.89, 'zh-CN');
// 输出: "1,234,567.89"

formatNumber(1234567.89, 'en');
// 输出: "1,234,567.89"

```

## # 相对时间格式化

```javascript

// 格式化相对时间
formatRelativeTime(new Date(Date.now() - 3600000), 'zh-CN');
// 输出: "1小时前"

formatRelativeTime(new Date(Date.now() - 3600000), 'en');
// 输出: "1 hour ago"

```

## 使用方法

## 初始化

```javascript

// 创建国际化管理器实例
const i18n = new I18nManager({
  defaultLanguage: 'zh-CN',
  fallbackLanguage: 'en',
  storageKey: 'github_i18n_lang',
  debug: true
});

// 加载默认语言翻译
await i18n.loadTranslations(i18n.currentLanguage);

```

## 获取翻译

```javascript

// 简单键值访问
const title = i18n.t('pages.profile.title');

// 嵌套键值访问
const buttonText = i18n.t('common.buttons.save');

// 带参数插值
const welcomeMessage = i18n.t('welcome.message', { 
  name: '用户', 
  count: 5 
});

```

## 语言切换

```javascript

// 切换语言
await i18n.setLanguage('en');

// 订阅语言变化事件
const unsubscribe = i18n.subscribe((newLanguage) => {
  console.log(`语言已切换到: ${newLanguage}`);
  // 更新界面文本
  updateUIText();
});

// 取消订阅
unsubscribe();

```

## 格式化使用

```javascript

// 获取格式化工具
const { formatDate, formatNumber, formatRelativeTime } = i18n.getFormatters();

// 使用格式化功能
const formattedDate = formatDate(new Date(), 'zh-CN');

const formattedNumber = formatNumber(12345.67, 'zh-CN');

const relativeTime = formatRelativeTime(new Date(Date.now() - 86400000), 'zh-CN');

```

## 性能优化

## 1. 翻译缓存

- 使用Map数据结构缓存已加载的翻译数据
- 实现LRU缓存策略，限制内存使用
- 支持翻译数据的预加载和懒加载

## 2. 按需加载

- 根据当前页面路径动态加载相关翻译模块
- 实现翻译数据的分块加载，减少初始加载时间
- 支持翻译数据的增量更新

## 3. 内存管理

- 定期清理未使用的翻译数据
- 实现翻译数据的弱引用缓存
- 监控内存使用情况，防止内存泄漏

## 扩展性

## 1. 插件系统

```javascript

// 注册翻译插件
i18n.registerPlugin('customFormatter', {
  formatDate: (date, locale) => {
    // 自定义日期格式化逻辑
  },
  formatCurrency: (amount, locale) => {
    // 自定义货币格式化逻辑
  }
});

```

## 2. 自定义加载器

```javascript

// 注册自定义翻译加载器
i18n.registerLoader('remote', async (language) => {
  // 从远程服务器加载翻译数据
  const response = await fetch(`/api/translations/${language}`);
  return await response.json();
});

```

## 3. 中间件支持

```javascript

// 添加翻译中间件
i18n.use((translation, key, params) => {
  // 在翻译返回前进行处理
  if (key.startsWith('admin.')) {
    return `[ADMIN] ${translation}`;
  }
  return translation;
});

```

## 测试

国际化框架包含全面的单元测试，覆盖以下功能：

1. 翻译加载和缓存
2. 键值查找和参数插值
3. 语言切换和事件通知
4. 格式化功能
5. 错误处理和回退机制

运行测试：

```bash

npm test -- i18n.test.js

```

## 最佳实践

1. **翻译键命名**: 使用点分隔的层级结构，如`pages.profile.title`
2. **参数插值**: 使用有意义的参数名，如`{userName}`而非`{name}`
3. **回退语言**: 始终设置回退语言，确保所有文本都有翻译
4. **性能考虑**: 对大型翻译数据使用分块加载
5. **测试覆盖**: 确保所有翻译键都有对应的测试用例

## 未来计划

1. 支持复数形式和性别变化
2. 实现翻译数据的自动提取和更新
3. 添加翻译数据的版本管理和迁移
4. 支持RTL（从右到左）语言的布局
5. 集成在线翻译服务，实现翻译的实时更新

## 版本信息

{% include "_fragments/版本信息.md" %}
作者：Sut