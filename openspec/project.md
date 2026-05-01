# 项目规范 (project.md)

## 项目概述
GitHub 中文本地化解决方案，包含用户脚本及自动化工具。

## 目录结构
- `src/`: 用户脚本源码
  - `trie.js`: Trie树数据结构
  - `cacheManager.js`: 缓存管理器
- `dist/`: 构建产物
- `test/`: 测试文件
- `openspec/`: 项目规范与报告
- `openspec/docs/`: 项目文档库
- `.trae/`: Trae IDE 相关配置
- `build.js`: 构建脚本入口文件
- `build/`: 构建输出目录

## 项目信息
- **项目名称**: GitHub 中文翻译插件 (GitHub_i18n)
- **项目 URL**: https://github.com/sutchan/GitHub_i18n
- **主语言**: JavaScript
- **目标平台**: 浏览器（作为用户脚本运行）
- **开发环境**: Node.js
- **默认署名**: Sut
- **当前版本**: 1.9.5

## 最新更新 (2026-05-01)
- **构建脚本修复**: 修复了对 export default 和 export { ... } 语法的处理，正确移除了所有ES6模块导出语句
- **版本号统一**: 将 virtualDom.js 版本号从 1.9.4 更新为 1.9.5，所有文件版本号一致
- **代码重构**: 将 translationCore.js 拆分为 trie.js 和 cacheManager.js，改善代码组织
- **翻译内容优化**: 清理了 common.js 中的冗余翻译条目
- **文档更新**: 更新了 openspec/project.md 目录结构描述

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


