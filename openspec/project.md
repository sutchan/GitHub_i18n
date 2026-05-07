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
- **当前版本**: 1.9.11

## 最新更新 (2026-05-07)
- **代码审查**: 完成全面代码审查，修复选择器语法问题
- **版本同步**: 所有文件版本号统一更新至 1.9.11
- **文档更新**: 同步更新 openspec/project.md 目录结构描述
- **性能优化**: 页面监控模块智能节流和翻译范围判断增强
- **国际化完善**: 国际化框架支持多语言切换和观察者模式

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
