# GitHub i18n 插件 API 文档

## 📖 文档概述

本文档详细描述GitHub中文翻译插件(GitHub_i18n)的应用程序接口，遵循OpenAPI规范，提供结构化的接口定义，帮助开发者理解、集成和扩展插件功能。

## 文档版本信息

- **文档版本**: 1.8.172
- **发布日期**: 2024-06-02
- **作者**: Sut
- **适用插件版本**: v1.8.172+

## 文档结构

本文档按照以下结构组织：
1. 文档概述 - 文档基本信息和结构说明
2. 核心API模块 - 按功能模块分类的API接口详细说明
3. 数据模型 - 数据结构和类型定义
4. 错误处理 - 错误码和异常处理机制
5. 集成示例 - 常见使用场景的代码示例
6. API使用最佳实践 - 性能优化和使用建议

## 🔧 核心API模块

## translationCore

翻译核心模块，提供基础的翻译功能和字典管理。

## # 1. 初始化翻译词典

* *API路径**: `/translation/init-dictionary`
* *方法**: `INIT`
* *功能描述**: 初始化翻译词典，加载翻译资源。

* *请求参数**:
- 无

* *返回值**:
- `Promise<boolean>`: 初始化是否成功

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4001 | 词典加载失败 | 检查网络连接和资源文件完整性 |
| 4002 | 词典格式错误 | 验证词典JSON格式是否正确 |

* *使用示例**:

```javascript

// 初始化翻译词典
try {
  const result = await translationCore.initDictionary();
  if (result) {
    console.log('翻译词典初始化成功');
  }
} catch (error) {
  console.error('初始化失败:', error.message);
}

```

## # 2. 获取文本翻译

* *API路径**: `/translation/text`
* *方法**: `GET`
* *功能描述**: 获取指定文本的翻译结果。

* *请求参数**:
- `text` (`string`, 必需): 要翻译的原始文本

* *返回值**:
|- `string | null`: 翻译后的文本，如果没有找到翻译则返回null|

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4003 | 输入参数为空 | 确保提供有效的文本参数 |

* *使用示例**:

```javascript

// 获取文本翻译
const originalText = 'Pull requests';

const translated = translationCore.getTranslatedText(originalText);

if (translated) {
  console.log(`原文: ${originalText}, 译文: ${translated}`);
} else {
  console.log(`未找到 ${originalText} 的翻译`);
}

```

## # 3. 翻译DOM元素

* *API路径**: `/translation/element`
* *方法**: `POST`
* *功能描述**: 翻译指定DOM元素及其子元素的文本内容。

* *请求参数**:
- `element` (`HTMLElement`, 必需): 要翻译的DOM元素

* *返回值**:
- `boolean`: 翻译是否成功

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4004 | 无效的DOM元素 | 确保提供有效的HTMLElement对象 |
| 4005 | 元素已被翻译 | 可以使用refreshTranslation方法重新翻译 |

* *使用示例**:

```javascript

// 翻译DOM元素
const headerElement = document.querySelector('header');

if (headerElement) {
  const success = translationCore.translateElement(headerElement);
  if (success) {
    console.log('元素翻译成功');
  } else {
    console.log('元素翻译失败');
  }
}

```

## # 4. 检测页面模式

* *API路径**: `/translation/page-mode`
* *方法**: `GET`
* *功能描述**: 检测当前页面的类型和模式。

* *请求参数**:
- 无

* *返回值**:
- `string`: 页面模式标识，如 'repository', 'issues', 'pullRequests', 'code', 'global' 等

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4006 | 无法识别页面模式 | 检查当前URL是否属于GitHub域名 |

* *使用示例**:

```javascript

// 检测当前页面模式
const currentMode = translationCore.detectPageMode();

console.log(`当前页面模式: ${currentMode}`);

```

## # 5. 设置页面模式

* *API路径**: `/translation/page-mode`
* *方法**: `POST`
* *功能描述**: 手动设置当前页面模式。

* *请求参数**:
- `mode` (`string`, 必需): 页面模式标识

* *返回值**:
- `boolean`: 设置是否成功

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4007 | 无效的页面模式 | 提供有效的页面模式标识 |

* *使用示例**:

```javascript

// 设置页面模式为自定义模式
const success = translationCore.setPageMode('custom');

if (success) {
  console.log('页面模式设置成功');
}

```

## # 6. 清除翻译缓存

* *API路径**: `/translation/cache`
* *方法**: `DELETE`
* *功能描述**: 清除翻译缓存，重新开始翻译。

* *请求参数**:
- 无

* *返回值**:
- `void`

* *使用示例**:

```javascript

// 清除翻译缓存
translationCore.clearTranslationCache();

console.log('翻译缓存已清除');

```

## pageMonitor

页面监控模块，负责监听DOM变化并触发翻译，确保动态加载的内容也能被正确翻译。

## # 1. 初始化DOM监视器

* *API路径**: `/monitor/observer`
* *方法**: `INIT`
* *功能描述**: 初始化DOM变化监视器，配置监听选项。

* *请求参数**:
- `options` (`MutationObserverInit`, 可选): 观察器配置选项，默认为 `{ childList: true, subtree: true, characterData: true }`

* *返回值**:
- `boolean`: 初始化是否成功

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4011 | 浏览器不支持MutationObserver | 升级到现代浏览器或使用兼容方案 |
| 4012 | 配置参数无效 | 检查options参数格式是否正确 |

* *使用示例**:

```javascript

// 初始化DOM监视器
const options = {
  childList: true,
  subtree: true,
  characterData: true
};

const success = pageMonitor.initObserver(options);

if (success) {
  console.log('DOM监视器初始化成功');
}

```

## # 2. 开始页面监控

* *API路径**: `/monitor/start`
* *方法**: `POST`
* *功能描述**: 开始监控页面DOM变化，触发自动翻译。

* *请求参数**:
- 无

* *返回值**:
- `void`

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4013 | 监视器未初始化 | 先调用initObserver方法初始化 |

* *使用示例**:

```javascript

// 开始页面监控
pageMonitor.startMonitoring();

console.log('页面监控已启动');

```

## # 3. 停止页面监控

* *API路径**: `/monitor/stop`
* *方法**: `POST`
* *功能描述**: 停止监控页面DOM变化。

* *请求参数**:
- 无

* *返回值**:
- `void`

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4014 | 监视器未运行 | 监视器可能未初始化或已停止 |

* *使用示例**:

```javascript

// 停止页面监控
pageMonitor.stopMonitoring();

console.log('页面监控已停止');

```

## # 4. 重启页面监控

* *API路径**: `/monitor/restart`
* *方法**: `POST`
* *功能描述**: 重启页面监控，停止并重新开始监听。

* *请求参数**:
- 无

* *返回值**:
- `void`

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4015 | 监视器未初始化 | 先调用initObserver方法初始化 |

* *使用示例**:

```javascript

// 重启页面监控
pageMonitor.restartMonitoring();

console.log('页面监控已重启');

```

## # 5. 获取监控状态

* *API路径**: `/monitor/status`
* *方法**: `GET`
* *功能描述**: 获取当前页面监控的状态信息。

* *请求参数**:
- 无

* *返回值**:
- `{ initialized: boolean, running: boolean, observedElements: number }`: 监控状态信息
  - `initialized`: 是否已初始化
  - `running`: 是否正在运行
  - `observedElements`: 已观察的元素数量

* *使用示例**:

```javascript

// 获取监控状态
const status = pageMonitor.getMonitoringStatus();

console.log('监控状态:', status);

```

## versionChecker

版本检查模块，负责检查和管理插件更新，确保用户使用最新版本。

## # 1. 检查更新

* *API路径**: `/version/check`
* *方法**: `GET`
* *功能描述**: 检查是否有新版本可用。

* *请求参数**:
- 无

* *返回值**:
|- `Promise<Object | null>`: 新版本信息对象或null|
  - 如果有新版本，返回包含版本信息的对象 `{ version: string, releaseDate: string, changes: string[], downloadUrl: string }`
  - 如果没有新版本或检查失败，返回null

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4021 | 网络请求失败 | 检查网络连接 |
| 4022 | 版本信息解析错误 | 稍后重试或手动检查更新 |

* *使用示例**:

```javascript

// 检查更新
try {
  const updateInfo = await versionChecker.checkForUpdates();
  if (updateInfo) {
    console.log(`发现新版本: ${updateInfo.version}`);
    console.log(`发布日期: ${updateInfo.releaseDate}`);
    console.log('更新内容:');
    updateInfo.changes.forEach(change => console.log(`- ${change}`));
  } else {
    console.log('当前已是最新版本');
  }
} catch (error) {
  console.error('检查更新失败:', error.message);
}

```

## # 2. 更新版本

* *API路径**: `/version/update`
* *方法**: `POST`
* *功能描述**: 更新插件到最新版本。

* *请求参数**:
- 无

* *返回值**:
- `Promise<boolean>`: 更新是否成功

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4023 | 更新失败 | 检查网络连接并重试 |
| 4024 | 无新版本可用 | 先调用checkForUpdates确认 |
| 4025 | 用户脚本管理器不支持自动更新 | 手动更新插件 |

* *使用示例**:

```javascript

// 更新版本
try {
  const success = await versionChecker.updateVersion();
  if (success) {
    console.log('插件已更新到最新版本，请刷新页面');
  } else {
    console.log('更新失败，请重试');
  }
} catch (error) {
  console.error('更新过程出错:', error.message);
}

```

## # 3. 获取当前版本

* *API路径**: `/version/current`
* *方法**: `GET`
* *功能描述**: 获取当前插件版本号。

* *请求参数**:
- 无

* *返回值**:
- `string`: 当前版本号，格式为语义化版本号 (MAJOR.MINOR.PATCH)

* *使用示例**:

```javascript

// 获取当前版本
const currentVersion = versionChecker.getCurrentVersion();

console.log(`当前插件版本: v${currentVersion}`);

```

## # 4. 设置更新检查间隔

* *API路径**: `/version/check-interval`
* *方法**: `PUT`
* *功能描述**: 设置自动检查更新的时间间隔。

* *请求参数**:
- `interval` (`number`, 必需): 检查间隔时间（毫秒），最小为1小时，最大为7天

* *返回值**:
- `boolean`: 设置是否成功

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4026 | 无效的时间间隔 | 提供1小时到7天之间的时间间隔 |

* *使用示例**:

```javascript

// 设置每天检查一次更新
const oneDay = 24 * 60 * 60 * 1000;

const success = versionChecker.setUpdateCheckInterval(oneDay);

if (success) {
  console.log('更新检查间隔设置成功');
}

```

## utils

工具函数模块，提供各种辅助功能，用于提升插件性能和增强功能实现。

## # 1. 防抖函数

* *API路径**: `/utils/debounce`
* *方法**: `UTIL`
* *功能描述**: 创建防抖函数，限制函数在指定时间内只能执行一次。

* *请求参数**:
- `func` (`Function`, 必需): 要执行的函数
- `wait` (`number`, 必需): 等待时间（毫秒），建议值：100-1000

* *返回值**:
- `Function`: 防抖处理后的函数

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4031 | 无效的函数参数 | 确保func是一个有效的函数 |
| 4032 | 无效的等待时间 | 确保wait是正整数 |

* *使用示例**:

```javascript

// 创建防抖翻译函数
const debouncedTranslate = utils.debounce((element) => {
  translationCore.translateElement(element);
}, 200);

// 添加事件监听器
window.addEventListener('resize', () => {
  const container = document.querySelector('.content');
  if (container) {
    debouncedTranslate(container);
  }
});

```

## # 2. 节流函数

* *API路径**: `/utils/throttle`
* *方法**: `UTIL`
* *功能描述**: 创建节流函数，限制函数在指定时间内最多执行一次。

* *请求参数**:
- `func` (`Function`, 必需): 要执行的函数
- `limit` (`number`, 必需): 时间限制（毫秒），建议值：500-2000

* *返回值**:
- `Function`: 节流处理后的函数

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4033 | 无效的函数参数 | 确保func是一个有效的函数 |
| 4034 | 无效的时间限制 | 确保limit是正整数 |

* *使用示例**:

```javascript

// 创建节流处理函数
const throttledProcess = utils.throttle((event) => {
  const scrollPosition = event.target.scrollTop;
  console.log(`滚动位置: ${scrollPosition}`);
  // 处理滚动事件
}, 1000);

// 添加滚动事件监听
const scrollContainer = document.querySelector('.scroll-container');

if (scrollContainer) {
  scrollContainer.addEventListener('scroll', throttledProcess);
}

```

## # 3. 检查元素可见性

* *API路径**: `/utils/element-visible`
* *方法**: `GET`
* *功能描述**: 检查DOM元素是否在视口中可见。

* *请求参数**:
- `element` (`HTMLElement`, 必需): 要检查的DOM元素

* *返回值**:
- `boolean`: 元素是否在视口中可见

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4035 | 无效的DOM元素 | 确保提供有效的HTMLElement对象 |

* *使用示例**:

```javascript

// 懒加载翻译
function lazyTranslate() {
  const elements = document.querySelectorAll('.github-element:not(.translated)');
  elements.forEach(element => {
    if (utils.isElementVisible(element)) {
      translationCore.translateElement(element);
      element.classList.add('translated');
    }
  });
}

// 监听滚动事件
window.addEventListener('scroll', utils.throttle(lazyTranslate, 300));

```

## # 4. 检查文本节点

* *API路径**: `/utils/text-node`
* *方法**: `GET`
* *功能描述**: 检查节点是否为文本节点。

* *请求参数**:
- `node` (`Node`, 必需): 要检查的节点

* *返回值**:
- `boolean`: 是否为文本节点

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4036 | 无效的节点参数 | 确保提供有效的Node对象 |

* *使用示例**:

```javascript

// 递归处理DOM树中的文本节点
function processTextNodes(element) {
  const childNodes = element.childNodes;
  
  childNodes.forEach(node => {
    if (utils.isTextNode(node) && node.textContent.trim() !== '') {
      // 处理文本节点
      const translated = translationCore.getTranslatedText(node.textContent);
      if (translated) {
        node.textContent = translated;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 递归处理子元素
      processTextNodes(node);
    }
  });
}

```

## # 5. 判断元素是否应该翻译

* *API路径**: `/utils/should-translate`
* *方法**: `GET`
* *功能描述**: 判断DOM元素是否应该被翻译。

* *请求参数**:
- `element` (`HTMLElement`, 必需): 要检查的元素

* *返回值**:
- `boolean`: 是否应该翻译该元素

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4037 | 无效的DOM元素 | 确保提供有效的HTMLElement对象 |

* *使用示例**:

```javascript

// 自定义翻译逻辑
function customTranslate(element) {
  // 检查元素是否应该翻译
  if (utils.shouldTranslateElement(element)) {
    // 应用特殊处理
|    if (element.tagName === 'CODE' || element.classList.contains('code')) {|
      // 代码块特殊处理
      const codeParts = element.textContent.split(/(\w+)/);
      let translatedText = '';
      
      codeParts.forEach(part => {
        if (/^\w+$/.test(part)) {
          // 尝试翻译标识符
          const translated = translationCore.getTranslatedText(part);
|          translatedText += translated || part;|
        } else {
          // 保留非标识符部分
          translatedText += part;
        }
      });
      
      element.textContent = translatedText;
    } else {
      // 使用默认翻译
      translationCore.translateElement(element);
    }
    
    return true;
  }
  
  return false;
}

```

## # 6. 格式化版本号比较

* *API路径**: `/utils/compare-versions`
* *方法**: `UTIL`
* *功能描述**: 比较两个语义化版本号的大小。

* *请求参数**:
- `version1` (`string`, 必需): 第一个版本号
- `version2` (`string`, 必需): 第二个版本号

* *返回值**:
- `number`: 比较结果
  - `1`: version1 > version2
  - `0`: version1 = version2
  - `-1`: version1 < version2

* *错误码**:
| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| 4038 | 无效的版本号格式 | 确保版本号符合语义化版本规范 |

* *使用示例**:

```javascript

// 版本比较示例
const currentVersion = '1.8.172';

const latestVersion = '1.8.172';

const comparisonResult = utils.compareVersions(currentVersion, latestVersion);

if (comparisonResult < 0) {
  console.log('有新版本可用');
  // 提示用户更新
} else if (comparisonResult === 0) {
  console.log('当前已是最新版本');
} else {
  console.log('当前版本较新');
}

```

## 📊 数据结构

## 1. CONFIG 全局配置对象

* *对象路径**: `/config`
* *类型**: `Object`
* *描述**: 全局配置对象，定义插件的行为和选项。

* *属性定义**:
| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `version` | `string` | 是 | `'1.8.172'` | 插件版本号 |
| `updateCheck` | `boolean` | 否 | `true` | 是否检查更新 |
| `versionCheckInterval` | `number` | 否 | `86400000` | 版本检查间隔（毫秒），默认24小时 |
| `enableTranslation` | `boolean` | 否 | `true` | 是否启用翻译功能 |
| `translateCode` | `boolean` | 否 | `false` | 是否翻译代码块内容 |
| `debounceDelay` | `number` | 否 | `200` | 防抖延迟时间（毫秒） |
| `enableCache` | `boolean` | 否 | `true` | 是否启用翻译缓存 |

* *使用示例**:

```javascript

// 修改配置
GitHub_i18n.config.updateCheck = true;

GitHub_i18n.config.versionCheckInterval = 86400000; // 24小时

GitHub_i18n.config.enableTranslation = true;

GitHub_i18n.config.translateCode = false;

```

## 2. TranslationItem 翻译项接口

* *对象路径**: `/translation-item`
* *类型**: `Interface`
* *描述**: 翻译项的数据结构定义。

* *属性定义**:
| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `original` | `string` | 是 | - | 原始文本 |
| `translation` | `string` | 是 | - | 翻译后的文本 |
| `context` | `string` | 否 | `''` | 上下文信息，用于提高翻译质量 |
| `category` | `string` | 否 | `''` | 分类信息 |
| `priority` | `number` | 否 | `0` | 优先级，数值越高优先级越高 |

* *使用示例**:

```javascript

// 创建翻译项
const translationItem = {
  original: 'Pull request',
  translation: '拉取请求',
  context: 'GitHub 界面术语',
  category: 'UI',
  priority: 10
};

// 添加到翻译词典
GitHub_i18n.addTranslation(translationItem);

```

## 3. PageMode 页面模式接口

* *对象路径**: `/page-mode`
* *类型**: `Interface`
* *描述**: 页面模式的数据结构定义。

* *属性定义**:
| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `id` | `string` | 是 | - | 模式ID，如 'repository', 'issues' 等 |
| `enabled` | `boolean` | 否 | `true` | 是否启用该模式 |
| `priority` | `number` | 否 | `0` | 匹配优先级 |
| `selectors` | `string[]` | 否 | `[]` | 特定的CSS选择器 |
| `options` | `object` | 否 | `{}` | 模式特定选项 |

* *预定义的页面模式**:

| 模式ID | 描述 |
|--------|------|
| `repository` | 代码仓库页面 |
| `issues` | 议题页面 |
| `pullRequests` | 拉取请求页面 |
| `code` | 代码查看页面 |
| `global` | 全局通用模式 |

* *使用示例**:

```javascript

// 自定义页面模式
const customPageMode = {
  id: 'project-board',
  enabled: true,
  priority: 10,
  selectors: ['.project-board'],
  options: {
    translateCardTitles: true,
    preserveLabels: true
  }
};

// 注册自定义页面模式
GitHub_i18n.registerPageMode(customPageMode);

```

## 4. ErrorResponse 错误响应结构

* *对象路径**: `/error-response`
* *类型**: `Interface`
* *描述**: API错误响应的数据结构。

* *属性定义**:
| 属性名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `code` | `number` | 是 | 错误码 |
| `message` | `string` | 是 | 错误描述信息 |
| `details` | `object` | 否 | 详细错误信息 |
| `timestamp` | `number` | 否 | 错误发生时间戳 |
| `path` | `string` | 否 | 出错的API路径 |

* *使用示例**:

```javascript

// 错误处理示例
try {
  await translationCore.translateElement(element);
} catch (error) {
  console.error(`错误 ${error.code}: ${error.message}`);
  if (error.details) {
    console.error('错误详情:', error.details);
  }
}

## 🛠️ 集成示例

## 1. 基本集成

* *描述**: 将GitHub i18n插件集成到用户脚本或浏览器扩展中的基本方法。

* *前置条件**:
- 浏览器中已安装脚本管理器（如Tampermonkey、Violentmonkey等）
- 访问GitHub网站的权限

* *集成代码**:

```javascript

// ==UserScript==
// @name         GitHub 中文翻译插件
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.8.172
// @description  将 GitHub 界面翻译成中文
// @author       Sut
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 加载插件
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n/dist/github_i18n.js';
    document.head.appendChild(script);

    // 初始化插件
    script.onload = function() {
        try {
            // 配置插件
            GitHub_i18n.config.updateCheck = true;
            GitHub_i18n.config.versionCheckInterval = 86400000; // 24小时
            GitHub_i18n.config.enableTranslation = true;
            GitHub_i18n.config.translateCode = false;
            
            // 注册自定义翻译
            GitHub_i18n.addTranslation({
                original: 'Custom Term',
                translation: '自定义术语',
                context: 'UI 术语',
                category: 'Custom',
                priority: 5
            });
            
            // 开始翻译
            GitHub_i18n.start();
            console.log('GitHub 中文翻译插件初始化成功');
        } catch (error) {
            console.error('GitHub 中文翻译插件初始化失败:', error);
        }
    };
    
    // 错误处理
    script.onerror = function(error) {
        console.error('GitHub 中文翻译插件加载失败:', error);
    };
})();

```javascript

## 2. 高级集成

* *描述**: 提供更详细的配置和错误处理的高级集成方案。

* *集成代码**:

```javascript

// ==UserScript==
// @name         GitHub 中文翻译插件 - 高级版
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.8.172
// @description  GitHub 界面中文翻译，支持高级配置和错误处理
// @author       Sut
// @match        https://github.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // 配置参数
    const config = {
        pluginUrl: 'https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n/dist/github_i18n.js',
        fallbackPluginUrl: 'https://unpkg.com/github-i18n/dist/github_i18n.js',
        retryAttempts: 3,
        retryDelay: 1000
    };

    // 加载插件
    async function loadPlugin() {
        for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = attempt === 1 ? config.pluginUrl : config.fallbackPluginUrl;
                    script.onload = resolve;
                    script.onerror = () => reject(new Error(`插件加载失败（尝试 ${attempt}/${config.retryAttempts}）`));
                    document.head.appendChild(script);
                });
                
                console.log('插件加载成功');
                return true;
            } catch (error) {
                console.warn(error.message);
                if (attempt < config.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
                }
            }
        }
        return false;
    }

    // 初始化插件
    async function initPlugin() {
        const pluginLoaded = await loadPlugin();
        if (!pluginLoaded) {
            console.error('插件加载失败，已达到最大重试次数');
            return;
        }

        // 检查全局对象是否可用
        if (typeof GitHub_i18n === 'undefined') {
            console.error('GitHub_i18n 未定义');
            return;
        }

        try {
            // 从存储中获取用户配置
            const userConfig = {
                updateCheck: GM_getValue('updateCheck', true),
                enableTranslation: GM_getValue('enableTranslation', true),
                translateCode: GM_getValue('translateCode', false),
                lastUpdated: GM_getValue('lastUpdated', null)
            };

            // 合并配置
            GitHub_i18n.config = {
                ...GitHub_i18n.config,
                ...userConfig,
                versionCheckInterval: 86400000, // 24小时
                debounceDelay: 150,
                enableCache: true
            };

            // 注册自定义页面模式
            GitHub_i18n.registerPageMode({
                id: 'custom-workflow',
                enabled: true,
                priority: 20,
                selectors: ['.workflow-runs', '.job-list'],
                options: {
                    translateStepNames: true,
                    preserveStatusLabels: false
                }
            });

            // 注册事件监听器
            GitHub_i18n.on('translationComplete', (data) => {
                console.log(`翻译完成，翻译了 ${data.translatedCount} 个元素`);
            });

            GitHub_i18n.on('updateAvailable', (data) => {
                console.log(`新版本可用: ${data.version}`);
                // 显示更新通知
                showUpdateNotification(data);
            });

            // 启动翻译
            GitHub_i18n.start();

            // 保存初始化时间
            GM_setValue('lastUpdated', Date.now());
            console.log('GitHub 中文翻译插件高级版初始化成功');
        } catch (error) {
            console.error('GitHub 中文翻译插件初始化失败:', error);
            // 上报错误（可选）
            reportError(error);
        }
    }

    // 显示更新通知
    function showUpdateNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'github-i18n-update-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #24292e;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        notification.innerHTML = `
            <span>新版本可用: ${data.version}</span>
            <button id="update-now">立即更新</button>
            <button id="ignore-update">忽略</button>
        `;
        
        document.body.appendChild(notification);
        
        document.getElementById('update-now').onclick = () => {
            location.reload();
        };
        
        document.getElementById('ignore-update').onclick = () => {
            notification.remove();
            GM_setValue('ignoredVersion', data.version);
        };
    }

    // 错误上报
    function reportError(error) {
        // 这里可以实现错误上报逻辑
        console.log('错误已记录:', error.message);
    }

    // 开始初始化
    initPlugin();
})();

```javascript

## 3. 自定义翻译逻辑

* *描述**: 扩展默认的翻译逻辑，添加自定义翻译处理。

* *使用场景**:
- 添加特定领域的专业术语翻译
- 覆盖默认翻译结果
- 实现动态翻译逻辑

* *代码示例**:

```javascript

// 自定义翻译处理函数
function customTranslate(text) {
    // 自定义翻译词典
    const customTranslations = {
        'Custom Button': '自定义按钮',
        'Advanced Settings': '高级设置',
        'Workflow': '工作流',
        'Action': '动作',
        'Secret': '密钥',
        'Artifact': '构件'
    };
    
    // 尝试从自定义词典中获取翻译
    if (customTranslations[text]) {
        return customTranslations[text];
    }
    
    // 正则表达式匹配和替换
    const patterns = [
        { regex: /^Issue #(\d+)$/, replacement: '议题 #$1' },
        { regex: /^PR #(\d+)$/, replacement: '拉取请求 #$1' },
        { regex: /^Commit ([a-f0-9]{7})$/, replacement: '提交 $1' }
    ];
    
    for (const pattern of patterns) {
        if (pattern.regex.test(text)) {
            return text.replace(pattern.regex, pattern.replacement);
        }
    }
    
    // 回退到默认翻译
    return GitHub_i18n.getDefaultTranslation(text);
}

// 注册自定义翻译处理函数
GitHub_i18n.registerCustomTranslator(customTranslate);

// 条件翻译示例
function conditionalTranslate(element, text) {
    // 根据元素类型或上下文进行不同的翻译
|    if (element.tagName === 'CODE' || element.classList.contains('language-')) {|
        // 代码块保留英文
        return text;
    }
    
|    if (element.classList.contains('user-name') || element.classList.contains('repo-name')) {|
        // 用户名和仓库名保留英文
        return text;
    }
    
    // 其他情况使用标准翻译
    return GitHub_i18n.getDefaultTranslation(text);
}

// 注册条件翻译处理函数
GitHub_i18n.registerConditionalTranslator(conditionalTranslate);

```javascript

## 4. 按需翻译示例

* *描述**: 实现按需翻译的机制，只翻译用户指定的内容。

* *使用场景**:
- 减少不必要的翻译处理
- 实现用户控制的翻译范围
- 优化性能，只翻译视口内的内容

* *代码示例**:

```javascript

// 按需翻译函数
function translateOnDemand(selector, options = {}) {
    const {
        delay = 0,
        debounce = 100,
        once = false,
        onlyVisible = true
    } = options;
    
    // 查找匹配元素
    const elements = document.querySelectorAll(selector);
    
    if (elements.length === 0) {
        console.warn(`未找到匹配 "${selector}" 的元素`);
        return;
    }
    
    // 使用防抖优化性能
    const debouncedTranslate = GitHub_i18n.utils.debounce(() => {
        elements.forEach(element => {
            // 检查元素是否可见
            if (onlyVisible && !GitHub_i18n.utils.isElementVisible(element)) {
                return;
            }
            
            // 检查元素是否应该被翻译
            if (GitHub_i18n.utils.shouldTranslateElement(element)) {
                // 执行翻译
                try {
                    GitHub_i18n.translationCore.translateElement(element);
                    if (once) {
                        element.dataset.translated = 'true';
                    }
                } catch (error) {
                    console.error('翻译元素时出错:', error);
                }
            }
        });
    }, debounce);
    
    // 添加延迟
    setTimeout(debouncedTranslate, delay);
    
    // 返回控制对象
    return {
        refresh: () => debouncedTranslate(),
        cancel: () => debouncedTranslate.cancel && debouncedTranslate.cancel()
    };
}

// 使用示例
const issueTranslator = translateOnDemand('.issue-title, .issue-body', {
    delay: 500,
    debounce: 200,
    once: false,
    onlyVisible: true
});

// 监听用户交互，触发翻译
issueList.addEventListener('click', () => {
    // 刷新翻译
    issueTranslator.refresh();
});

// 监听滚动事件，翻译视口内的新内容
window.addEventListener('scroll', GitHub_i18n.utils.throttle(() => {
    translateOnDemand('.issue-comment:not([data-translated])', {
        onlyVisible: true
    });
}, 300));

```javascript

## 5. 插件事件监听

* *描述**: 监听插件的各种事件，实现自定义逻辑。

* *支持的事件类型**:
- `init`: 插件初始化完成时触发
- `translationStart`: 开始翻译时触发
- `translationComplete`: 翻译完成时触发
- `updateAvailable`: 有新版本可用时触发
- `updateError`: 更新检查失败时触发
- `configChange`: 配置变更时触发
- `error`: 插件发生错误时触发

* *代码示例**:

```javascript

// 监听插件初始化事件
GitHub_i18n.on('init', (data) => {
    console.log('插件初始化完成:', data);
    // 初始化自定义UI
    initCustomUI();
});

// 监听翻译完成事件
GitHub_i18n.on('translationComplete', (data) => {
    console.log(`翻译完成，处理了 ${data.elementsCount} 个元素，成功 ${data.translatedCount} 个`);
    // 更新翻译状态UI
    updateTranslationStatus(data);
});

// 监听更新事件
GitHub_i18n.on('updateAvailable', (data) => {
    console.log(`发现新版本 ${data.version}`);
    // 显示更新通知
    showUpdateNotification(data.version, data.changelog);
});

// 监听错误事件
GitHub_i18n.on('error', (error) => {
    console.error('插件错误:', error);
    // 记录错误并显示用户友好的错误信息
    logError(error);
    showErrorMessage(error.message);
});

// 监听配置变更事件
GitHub_i18n.on('configChange', (changes) => {
    console.log('配置已更新:', changes);
    // 应用配置变更
    applyConfigChanges(changes);
});

// 移除事件监听器
function cleanup() {
    GitHub_i18n.off('init', initCustomUI);
    GitHub_i18n.off('translationComplete', updateTranslationStatus);
}

// 自定义UI初始化
function initCustomUI() {
    // 这里实现自定义UI初始化逻辑
}

// 显示错误信息
function showErrorMessage(message) {
    const errorBanner = document.createElement('div');
    errorBanner.className = 'github-i18n-error';
    errorBanner.textContent = `翻译插件错误: ${message}`;
    errorBanner.style.cssText = `
        background: #dc3545;
        color: white;
        padding: 8px 12px;
        margin: 10px 0;
        border-radius: 4px;
        font-size: 14px;
    `;
    
    // 添加到页面顶部
    document.body.prepend(errorBanner);
    
    // 3秒后自动移除
    setTimeout(() => {
        errorBanner.remove();
    }, 3000);
}

## 🚨 API使用注意事项

## 1. 性能优化指南

* *描述**: 为确保插件在不同环境下都能高效运行，请注意以下性能优化建议。

* *最佳实践**:
- **避免频繁调用**: 不要在短时间内对同一内容重复调用翻译API
- **使用防抖和节流**: 对频繁触发的操作（如滚动、输入事件）应用防抖(debounce)或节流(throttle)机制
- **选择性翻译**: 只翻译可见区域或用户关注的内容，避免翻译整个页面
- **批量处理**: 对于多个需要翻译的元素，使用批量处理而不是单独调用
- **缓存利用**: 确保启用缓存功能，减少重复翻译操作

* *示例代码 - 优化的翻译调用**:

```javascript

// 应用防抖优化的翻译函数
const debouncedTranslate = GitHub_i18n.utils.debounce((element) => {
    if (element && element.isConnected) {
        GitHub_i18n.translationCore.translateElement(element);
    }
}, 200);

// 监听DOM变化
const observer = new MutationObserver((mutations) => {
    // 收集所有需要翻译的元素
    const elementsToTranslate = [];
    
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    elementsToTranslate.push(node);
                }
            });
        }
    });
    
    // 批量处理
    if (elementsToTranslate.length > 0) {
        // 对于少量元素，直接翻译
        if (elementsToTranslate.length < 10) {
            elementsToTranslate.forEach(debouncedTranslate);
        } else {
            // 对于大量元素，分批处理
            const batches = [];
            for (let i = 0; i < elementsToTranslate.length; i += 10) {
                batches.push(elementsToTranslate.slice(i, i + 10));
            }
            
            batches.forEach((batch, index) => {
                setTimeout(() => {
                    batch.forEach(debouncedTranslate);
                }, index * 100);
            });
        }
    }
});

```

## 2. 错误处理与容错机制

* *描述**: 健壮的错误处理机制可以确保即使在API调用失败的情况下，应用程序也能继续正常运行。

* *推荐做法**:
- **全面的异常捕获**: 使用try-catch块包装所有API调用
- **合理的回退策略**: 定义清晰的错误回退机制
- **错误日志记录**: 记录详细的错误信息便于调试
- **用户友好提示**: 对关键错误提供适当的用户反馈
- **自动恢复机制**: 实现定期重试或恢复逻辑

* *示例代码 - 健壮的错误处理**:

```javascript

// 安全的翻译函数包装器
async function safeTranslate(element, options = {}) {
    const {
        retryCount = 2,
        retryDelay = 500,
        fallbackToOriginal = true
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
            // 检查元素是否仍然有效
|            if (!element || !element.isConnected) {|
                console.warn('翻译目标元素已不存在或已断开连接');
                return false;
            }
            
            // 执行翻译
            const result = await GitHub_i18n.translationCore.translateElement(element);
            return result;
        } catch (error) {
            lastError = error;
            
            // 记录错误
            console.error(`翻译失败（尝试 ${attempt + 1}/${retryCount + 1}）:`, error);
            
            // 如果不是最后一次尝试，则延迟重试
            if (attempt < retryCount) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            
            // 最后一次尝试失败
            console.error('翻译最终失败，已达到最大重试次数');
            
            // 回退策略
            if (fallbackToOriginal) {
                // 确保元素内容不会丢失
                console.warn('应用回退策略，保持原始内容');
            }
            
            // 上报错误（可选）
            reportError(error, {
                elementType: element.tagName,
                elementClasses: Array.from(element.classList),
                attemptCount: retryCount + 1
            });
            
            return false;
        }
    }
    
    return false;
}

// 错误上报函数
function reportError(error, context = {}) {
    // 这里可以实现错误上报逻辑
    console.log('API错误上报:', {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        context
    });
}

```

## 3. 版本兼容性管理

* *描述**: 为确保API调用与插件版本兼容，应采取以下兼容性管理策略。

* *关键点**:
- **版本检查**: 在调用API前检查插件版本
- **向后兼容**: 优先使用向后兼容的API方法
- **版本锁定**: 考虑在关键应用中锁定插件版本
- **更新监控**: 使用版本检查API监控更新
- **迁移计划**: 制定API变更的平滑迁移计划

* *示例代码 - 版本兼容性检查**:

```javascript

// 版本兼容性检查
function checkApiCompatibility() {
    // 获取当前插件版本
    const currentVersion = GitHub_i18n.versionChecker.getCurrentVersion();
    
    // 解析版本号
    const versionParts = currentVersion.split('.').map(Number);
    
    // 检查主要功能兼容性
    const compatibility = {
        basicTranslation: true,  // 基础翻译功能
        advancedFeatures: versionParts[0] >= 1 && versionParts[1] >= 5,  // 高级功能需要1.8.172+
        customModes: versionParts[0] >= 1 && versionParts[1] >= 6,  // 自定义模式需要1.8.172+
        eventSystem: versionParts[0] >= 1 && versionParts[1] >= 7  // 事件系统需要1.8.172+
    };
    
    return {
        version: currentVersion,
        compatibility,
        isCompatible: versionParts[0] >= 1
    };
}

// 使用兼容性检查的安全API调用
function safeApiCall(apiFunction, ...args) {
    const { version, compatibility, isCompatible } = checkApiCompatibility();
    
    if (!isCompatible) {
        console.error(`当前插件版本 ${version} 不兼容，请升级到 1.8.172 或更高版本`);
        return { success: false, error: '版本不兼容' };
    }
    
    try {
        const result = apiFunction(...args);
        return { success: true, result };
    } catch (error) {
        console.error('API调用失败:', error);
        return { success: false, error: error.message };
    }
}

```

## 4. 安全性最佳实践

* *描述**: 为防止潜在的安全风险，特别是XSS攻击，使用API时应遵循以下安全实践。

* *安全要点**:
- **DOM操作安全**: 避免使用`innerHTML`，优先使用`textContent`或`createTextNode`
- **输入验证**: 对用户提供的输入进行严格验证和净化
- **内容安全策略**: 尊重和支持页面的CSP设置
- **数据安全**: 确保敏感数据不会被意外翻译或泄露
- **隔离执行**: 考虑使用沙箱模式执行不可信的翻译逻辑

* *示例代码 - 安全的翻译实现**:

```javascript

// 安全的翻译函数
function secureTranslate(element) {
    // 检查元素类型
    if (!(element instanceof HTMLElement)) {
        throw new Error('翻译目标必须是有效的DOM元素');
    }
    
    // 安全检查 - 避免翻译敏感元素
    const sensitiveElements = ['input', 'textarea', 'script', 'style', 'iframe'];
    if (sensitiveElements.includes(element.tagName.toLowerCase())) {
        console.warn(`跳过敏感元素的翻译: ${element.tagName}`);
        return false;
    }
    
    // 安全检查 - 避免翻译包含敏感类的元素
    const sensitiveClasses = ['private', 'secret', 'token', 'key', 'password'];
    const hasSensitiveClass = sensitiveClasses.some(cls => 
        element.classList.contains(cls)
    );
    
    if (hasSensitiveClass) {
        console.warn('跳过可能包含敏感信息的元素');
        return false;
    }
    
    // 安全翻译 - 处理子元素
    const childNodes = Array.from(element.childNodes);
    
    for (const node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            try {
                // 安全地获取翻译
                const translatedText = GitHub_i18n.translationCore.getTranslatedText(
                    node.textContent
                );
                
                // 安全地设置翻译文本，避免innerHTML
                if (translatedText && translatedText !== node.textContent) {
                    node.textContent = translatedText;
                }
            } catch (error) {
                console.error('翻译文本节点时出错:', error);
                // 出错时保持原始内容
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // 递归处理子元素
            secureTranslate(node);
        }
    }
    
    return true;
}

// 防止XSS的内容净化
function sanitizeContent(content) {
    // 基本HTML实体编码
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML;
}

```

## 5. 内存管理

* *描述**: 良好的内存管理对于长时间运行的应用至关重要，可以避免内存泄漏和性能下降。

* *管理策略**:
- **及时清理**: 移除不再使用的事件监听器
- **避免循环引用**: 防止DOM对象和JavaScript对象之间的循环引用
- **限制缓存大小**: 适当配置缓存大小，避免无限增长
- **定期清理**: 实现定期清理策略，特别是在SPA应用中

* *示例代码 - 内存管理**:

```javascript

// 资源管理类
class ResourceManager {
    constructor() {
        this.observers = [];
        this.eventListeners = [];
        this.intervals = [];
        this.timeouts = [];
    }
    
    // 添加资源引用
    addObserver(observer) {
        this.observers.push(observer);
        return observer;
    }
    
    addEventListener(target, event, handler, options) {
        target.addEventListener(event, handler, options);
        this.eventListeners.push({ target, event, handler, options });
        return handler;
    }
    
    setInterval(callback, delay, ...args) {
        const id = setInterval(callback, delay, ...args);
        this.intervals.push(id);
        return id;
    }
    
    setTimeout(callback, delay, ...args) {
        const id = setTimeout(callback, delay, ...args);
        this.timeouts.push(id);
        return id;
    }
    
    // 清理所有资源
    dispose() {
        // 断开所有观察器
        this.observers.forEach(observer => {
            try {
                if (observer.disconnect) {
                    observer.disconnect();
                }
            } catch (error) {
                console.error('断开观察器失败:', error);
            }
        });
        this.observers = [];
        
        // 移除所有事件监听器
        this.eventListeners.forEach(({ target, event, handler, options }) => {
            try {
                target.removeEventListener(event, handler, options);
            } catch (error) {
                console.error('移除事件监听器失败:', error);
            }
        });
        this.eventListeners = [];
        
        // 清除所有定时器
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
        
        // 清除所有延时器
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
        
        console.log('资源已清理');
    }
}

// 使用示例
const resourceManager = new ResourceManager();

// 注册翻译相关资源
function setupTranslation() {
    // 创建并注册观察器
    const observer = new MutationObserver(handleDomChanges);
    resourceManager.addObserver(observer);
    
    // 注册事件监听器
    resourceManager.addEventListener(window, 'scroll', handleScroll, { passive: true });
    
    // 设置定期任务
    resourceManager.setInterval(() => {
        // 定期清理翻译缓存
        GitHub_i18n.translationCore.clearTranslationCache();
    }, 3600000); // 每小时清理一次
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    resourceManager.dispose();
});

```

## 🔄 版本信息

## 版本历史

| 版本 | 发布日期 | 主要变更 |
|------|----------|----------|
| 1.8.172 | 2023-01-01 | 初始版本，基础翻译功能 |
| 1.8.172 | 2023-02-15 | 添加新的翻译词典，支持更多GitHub页面元素 |
| 1.8.172 | 2023-03-20 | 优化页面监控性能，减少资源占用 |
| 1.8.172 | 2023-04-10 | 修复已知问题，改进翻译质量，增加技术术语库 |
| 1.8.172 | 2023-05-05 | 增强版本检查功能，支持自动更新通知 |
| 1.8.172 | 2023-06-20 | 添加新的页面模式支持，优化工作流页面翻译 |
| 1.8.172 | 2023-07-30 | 优化缓存策略，提升重复访问时的加载速度 |
| 1.8.172 | 2023-09-10 | 改进错误处理机制，增强稳定性 |
| 1.8.172 | 2023-10-25 | 支持自定义翻译逻辑，增加API扩展性 |
| 1.8.172 | 2023-12-15 | 修复稳定性问题，优化性能，增强安全性 |

## API版本兼容性矩阵

| API模块 | 最低支持版本 | 向后兼容版本 | 推荐使用版本 |
|---------|------------|------------|------------|
| translationCore | 1.8.172 | 1.x.x | 1.8.172+ |
| pageMonitor | 1.8.172 | 1.x.x | 1.8.172+ |
| versionChecker | 1.8.172 | 1.x.x | 1.8.172+ |
| utils | 1.8.172 | 1.x.x | 1.8.172+ |
| 事件系统 | 1.8.172 | 1.x.x | 1.8.172+ |
| 自定义模式 | 1.8.172 | 1.x.x | 1.8.172+ |

## 更新策略

GitHub i18n插件遵循语义化版本规范（SemVer），版本格式为 MAJOR.MINOR.PATCH：

- **MAJOR (主版本号)**: 不兼容的API变更，可能需要更新集成代码
- **MINOR (次版本号)**: 向下兼容的新功能，不会破坏现有集成
- **PATCH (补丁版本号)**: 向下兼容的问题修复，建议及时更新

推荐更新策略：
1. 补丁版本：自动更新
2. 次版本：测试后更新
3. 主版本：全面测试并按迁移指南更新

## 废弃API通知

| API方法 | 废弃版本 | 移除版本 | 替代方案 |
|---------|---------|---------|--------|
| `initDictionary()` | 1.8.172 | 1.8.172 | 使用自动初始化或`GitHub_i18n.init()` |
| `translateElement(element)` | 1.8.172 | 1.8.172 | 使用`GitHub_i18n.translate(element)` |
| `detectPageMode()` | 1.8.172 | 1.8.172 | 使用`GitHub_i18n.getCurrentPageMode()` |

- --

## 版本信息

{% include "_fragments/版本信息.md" %}
