# 项目规范 (project.md)

## 项目概述
GitHub 中文本地化解决方案，包含用户脚本及自动化工具。

## 目录结构
```
/workspace/
├── src/                          # 用户脚本源码
│   ├── dictionaries/            # 翻译词典模块
│   │   ├── index.js             # 词典合并模块
│   │   ├── common.js            # 通用词典
│   │   ├── codespaces.js        # Codespaces 词典
│   │   └── explore.js           # Explore 词典
│   ├── pageMonitor/             # 页面监控模块
│   │   ├── index.js             # 监控主模块
│   │   ├── cacheManager.js      # 监控缓存管理
│   │   ├── domObserver.js        # DOM观察器
│   │   ├── pageAnalyzer.js       # 页面分析器
│   │   ├── pathListener.js       # 路径监听器
│   │   └── translationTrigger.js # 翻译触发器
│   ├── translationCore/         # 翻译核心模块
│   │   ├── index.js             # 核心主模块
│   │   ├── dictionaryManager.js  # 词典管理器
│   │   ├── elementSelector.js    # 元素选择器
│   │   ├── elementTranslator.js  # 元素翻译器
│   │   ├── pageModeDetector.js   # 页面模式检测
│   │   ├── partialTranslator.js  # 部分翻译器
│   │   └── performanceMonitor.js # 性能监控
│   ├── cacheManager.js           # 缓存管理器
│   ├── config.js                 # 配置文件
│   ├── configUI.js               # 配置界面
│   ├── errorHandler.js           # 错误处理器
│   ├── i18n.js                   # 国际化框架
│   ├── main.js                   # 主入口文件
│   ├── pageMonitor.js            # 页面监控（兼容层）
│   ├── tools.js                  # 开发工具
│   ├── translationCore.js        # 翻译核心（兼容层）
│   ├── trie.js                   # Trie字典树
│   ├── utils.js                  # 工具函数
│   ├── version.js                # 版本信息
│   ├── versionChecker.js         # 版本检查
│   └── virtualDom.js             # 虚拟DOM
├── utils/                        # 自动化工具
│   ├── api/                      # API目录
│   ├── dist/                     # 工具构建产物
│   ├── package.json              # 工具依赖
│   ├── auto_string_updater.js    # 自动字符串更新器
│   ├── cleanup.js                # 清理工具
│   ├── dictionary_processor.js    # 词典处理器
│   ├── string_collector.js       # 字符串收集器
│   └── utils.js                  # 工具函数
├── build/                        # 用户脚本构建产物
├── api/                          # API配置文件
│   └── translations.json         # 翻译词条配置
├── openspec/                     # 项目规范与报告
│   ├── config.yaml               # 项目配置
│   └── project.md                # 项目规范文档
├── build.js                      # 构建脚本
├── index.html                    # 自动化工具Web界面
└── README.md                     # 项目说明文档
```

## 项目信息
- **项目名称**: GitHub 中文翻译插件 (GitHub_i18n)
- **项目 URL**: https://github.com/sutchan/GitHub_i18n
- **主语言**: JavaScript
- **目标平台**: 浏览器（作为用户脚本运行）
- **开发环境**: Node.js
- **默认署名**: Sut
- **当前版本**: 1.9.14

## 最新更新 (2026-05-16)
- **代码审查与修复**: 完成全面代码审查，修复 ESLint 错误和警告
- **测试完善**: 所有 97 个测试用例通过，确保代码质量
- **项目规范检查**: 检查并验证所有代码符合项目规范
- **国际化文件完整性**: 验证翻译词典覆盖完整
- **文档同步**: 更新 openspec/project.md 和 README.md 文档
- **依赖管理**: 修复 npm 依赖问题，确保构建环境稳定

## 开发工具与脚本
- `npm run lint`: 运行 ESLint 代码规范检查
- `npm run lint:fix`: 自动修复 ESLint 可修复问题
- `npm run format`: 运行 Prettier 代码格式化
- `npm run test`: 运行 Jest 单元测试
- `npm run build`: 构建用户脚本
- `npm run validate`: 验证构建产物

## 代码质量保障
- ESLint 配置: 严格的代码规范检查
- Prettier: 自动代码格式化
- Jest: 完整的单元测试覆盖 (7 个测试套件, 97 个测试)
- Husky + lint-staged: Git 提交前自动检查

## 编码规范
- 编码: UTF-8
- 行尾: CRLF
- 语言: 中文
- 命名: 语义化提交与分支命名
- 使用 ES6+ 语法
- 添加函数级注释，说明功能、参数和返回值

## 版本管理
- 遵循 SemVer (语义化版本规范)
- 版本格式: MAJOR.MINOR.PATCH
- 每次构建默认升级 patch 版本
- 所有代码文件同步更新版本号

## 核心模块说明

### 翻译核心模块 (translationCore)
- **elementSelector.js**: 选择需要翻译的DOM元素
- **elementTranslator.js**: 实际翻译DOM元素的模块
- **partialTranslator.js**: 使用Trie树进行部分匹配翻译
- **dictionaryManager.js**: 管理翻译词典的加载和查询
- **pageModeDetector.js**: 检测当前页面的模式
- **performanceMonitor.js**: 监控翻译性能数据

### 页面监控模块 (pageMonitor)
- **domObserver.js**: 观察DOM变化并触发翻译
- **pathListener.js**: 监听URL路径变化
- **translationTrigger.js**: 管理翻译触发和节流
- **pageAnalyzer.js**: 分析页面类型和关键区域
- **cacheManager.js**: 管理页面监控中的缓存

### 国际化支持 (i18n)
- 提供多语言支持框架
- 支持语言切换观察者模式
- 包含日期/数字/相对时间格式化
- 支持翻译参数插值

## 性能优化特性
- Trie树数据结构高效字符串匹配
- LRU缓存策略减少重复翻译
- 智能节流机制避免过度翻译
- 虚拟DOM优化减少DOM操作
- 批量处理优化大数据量场景
