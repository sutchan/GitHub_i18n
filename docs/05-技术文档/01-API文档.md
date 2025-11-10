# API文档

## 📖 概述

本文档详细介绍GitHub中文翻译插件(GitHub_i18n)的API接口，帮助开发者了解插件的核心功能和接口，便于扩展和集成。

## 🔧 核心API模块

### translationCore

翻译核心模块，提供基础的翻译功能和字典管理。

#### initDictionary()

初始化翻译词典。

**参数：**
- 无

**返回值：**
- `Promise<boolean>`: 初始化是否成功

**使用示例：**
```javascript
await translationCore.initDictionary();
console.log('翻译词典初始化完成');
```

#### getTranslatedText(text)

获取文本的翻译结果。

**参数：**
- `text` (`string`): 要翻译的原始文本

**返回值：**
- `string | null`: 翻译后的文本，如果没有找到翻译则返回null

**使用示例：**
```javascript
const translated = translationCore.getTranslatedText('Pull requests');
console.log(translated); // 输出: "拉取请求"
```

#### translateElement(element)

翻译DOM元素及其子元素的文本内容。

**参数：**
- `element` (`HTMLElement`): 要翻译的DOM元素

**返回值：**
- `boolean`: 翻译是否成功

**使用示例：**
```javascript
const headerElement = document.querySelector('header');
if (headerElement) {
  translationCore.translateElement(headerElement);
}
```

#### detectPageMode()

检测当前页面的类型和模式。

**参数：**
- 无

**返回值：**
- `string`: 页面模式标识，如 'repository', 'issues', 'pullRequests', 'code', 'global' 等

**使用示例：**
```javascript
const currentMode = translationCore.detectPageMode();
console.log(`当前页面模式: ${currentMode}`);
```

#### setPageMode(mode)

设置当前页面模式。

**参数：**
- `mode` (`string`): 页面模式标识

**返回值：**
- `boolean`: 设置是否成功

**使用示例：**
```javascript
translationCore.setPageMode('custom');
```

#### clearTranslationCache()

清除翻译缓存。

**参数：**
- 无

**返回值：**
- `void`

**使用示例：**
```javascript
translationCore.clearTranslationCache();
console.log('翻译缓存已清除');
```

### pageMonitor

页面监控模块，负责监听DOM变化并触发翻译。

#### initObserver()

初始化DOM变化监视器。

**参数：**
- `options` (`MutationObserverInit`, 可选): 观察器配置选项

**返回值：**
- `boolean`: 初始化是否成功

**使用示例：**
```javascript
pageMonitor.initObserver({
  childList: true,
  subtree: true,
  characterData: true
});
```

#### startMonitoring()

开始监控页面变化。

**参数：**
- 无

**返回值：**
- `void`

**使用示例：**
```javascript
pageMonitor.startMonitoring();
console.log('页面监控已启动');
```

#### stopMonitoring()

停止监控页面变化。

**参数：**
- 无

**返回值：**
- `void`

**使用示例：**
```javascript
pageMonitor.stopMonitoring();
console.log('页面监控已停止');
```

#### restartMonitoring()

重启页面监控。

**参数：**
- 无

**返回值：**
- `void`

**使用示例：**
```javascript
pageMonitor.restartMonitoring();
console.log('页面监控已重启');
```

### versionChecker

版本检查模块，负责检查和管理插件更新。

#### checkForUpdates()

检查是否有新版本。

**参数：**
- 无

**返回值：**
- `Promise<Object | null>`: 新版本信息对象或null

**使用示例：**
```javascript
const updateInfo = await versionChecker.checkForUpdates();
if (updateInfo) {
  console.log(`发现新版本: ${updateInfo.version}`);
}
```

#### updateVersion()

更新到最新版本。

**参数：**
- 无

**返回值：**
- `Promise<boolean>`: 更新是否成功

**使用示例：**
```javascript
const success = await versionChecker.updateVersion();
if (success) {
  console.log('插件已更新到最新版本');
}
```

#### getCurrentVersion()

获取当前插件版本。

**参数：**
- 无

**返回值：**
- `string`: 当前版本号

**使用示例：**
```javascript
const version = versionChecker.getCurrentVersion();
console.log(`当前版本: ${version}`);
```

### utils

工具函数模块，提供各种辅助功能。

#### debounce(func, wait)

防抖函数，限制函数在一定时间内只能执行一次。

**参数：**
- `func` (`Function`): 要执行的函数
- `wait` (`number`): 等待时间（毫秒）

**返回值：**
- `Function`: 防抖处理后的函数

**使用示例：**
```javascript
const debouncedTranslate = utils.debounce(translateElement, 200);
window.addEventListener('resize', debouncedTranslate);
```

#### throttle(func, limit)

节流函数，限制函数在一定时间内最多执行一次。

**参数：**
- `func` (`Function`): 要执行的函数
- `limit` (`number`): 时间限制（毫秒）

**返回值：**
- `Function`: 节流处理后的函数

**使用示例：**
```javascript
const throttledProcess = utils.throttle(processData, 1000);
scrollContainer.addEventListener('scroll', throttledProcess);
```

#### isElementVisible(element)

检查元素是否在视口中可见。

**参数：**
- `element` (`HTMLElement`): 要检查的DOM元素

**返回值：**
- `boolean`: 是否可见

**使用示例：**
```javascript
const targetElement = document.querySelector('#target');
if (utils.isElementVisible(targetElement)) {
  translateElement(targetElement);
}
```

#### isTextNode(node)

检查节点是否为文本节点。

**参数：**
- `node` (`Node`): 要检查的节点

**返回值：**
- `boolean`: 是否为文本节点

**使用示例：**
```javascript
if (utils.isTextNode(node)) {
  // 处理文本节点
}
```

#### shouldTranslateElement(element)

判断元素是否应该被翻译。

**参数：**
- `element` (`HTMLElement`): 要检查的元素

**返回值：**
- `boolean`: 是否应该翻译

**使用示例：**
```javascript
if (utils.shouldTranslateElement(element)) {
  translationCore.translateElement(element);
}
```

## 📊 数据结构

### CONFIG 对象

全局配置对象，包含插件的所有配置项。

```javascript
const CONFIG = {
  // 版本信息
  version: '1.8.88',
  // 更新设置
  updateCheck: true,
  versionCheckInterval: 24 * 60 * 60 * 1000,
  // 翻译设置
  enableTranslation: true,
  translateCode: false,
  // 性能优化
  debounceDelay: 200,
  enableCache: true,
  // 其他配置...
};
```

### TranslationItem 接口

翻译项的结构定义。

```javascript
interface TranslationItem {
  original: string;        // 原始文本
  translation: string;     // 翻译后的文本
  context?: string;        // 上下文信息
  category?: string;       // 分类
  priority?: number;       // 优先级
}
```

### PageMode 接口

页面模式的结构定义。

```javascript
interface PageMode {
  id: string;              // 模式ID
  enabled: boolean;        // 是否启用
  priority: number;        // 优先级
  selectors?: string[];    // 特定的选择器
  options?: object;        // 模式特定选项
}
```

## 🛠️ 集成示例

### 基本集成

```javascript
// 初始化插件
async function initializeGitHubI18n() {
  // 初始化翻译词典
  await translationCore.initDictionary();
  
  // 初始化页面监控
  pageMonitor.initObserver();
  pageMonitor.startMonitoring();
  
  // 翻译初始页面内容
  translationCore.translateElement(document.body);
  
  console.log('GitHub_i18n 初始化完成');
}

// 启动插件
initializeGitHubI18n();
```

### 自定义翻译逻辑

```javascript
// 自定义翻译处理器
function customTranslateHandler(text) {
  // 先尝试使用内置翻译
  let translated = translationCore.getTranslatedText(text);
  
  // 如果没有找到翻译，可以应用自定义逻辑
  if (!translated) {
    // 自定义翻译逻辑
    // ...
  }
  
  return translated;
}

// 替换默认的翻译处理
const originalGetTranslatedText = translationCore.getTranslatedText;
translationCore.getTranslatedText = function(text) {
  return customTranslateHandler(text) || originalGetTranslatedText(text);
};
```

## 🚨 API使用注意事项

1. **初始化顺序**：先初始化翻译词典，再启动页面监控
2. **性能考虑**：避免频繁调用翻译API，使用防抖和节流优化
3. **错误处理**：处理API可能返回的null或错误情况
4. **DOM操作**：翻译时注意保持页面结构和事件监听
5. **版本兼容性**：不同版本的API可能有变化，请查看更新日志

## 版本信息

版本：1.0.0 - 最后更新：2024-06-02
作者：Sut
状态：已发布
