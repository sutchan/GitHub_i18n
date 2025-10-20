# GitHub 中文本地化解决方案

> 🌐 一套完整的 GitHub 中文本地化解决方案，包含轻量、安全、高性能的油猴（Tampermonkey）翻译脚本和强大的自动化字符串更新工具。

[![GitHub license](https://img.shields.io/github/license/sutchan/GitHub_i18n?color=blue)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/sutchan/GitHub_i18n?display_name=tag&color=green)](https://github.com/sutchan/GitHub_i18n/releases)
[![Userscript](https://img.shields.io/badge/Install-Tampermonkey-green?logo=tampermonkey)](https://github.com/sutchan/GitHub_i18n/raw/main/GitHub_zh-CN.user.js)

---

## 📋 项目概述

本项目包含两个核心组件：

1. **GitHub_zh-CN.user.js** - 用户脚本，为 GitHub 全站高频 UI 提供精准中文翻译，**不破坏任何布局**
2. **utils** - 自动化字符串更新工具，从 GitHub 页面抓取新字符串并更新翻译词典

---

## ✨ 特性亮点

### 用户脚本特性
- ✅ **全站覆盖**：支持仓库、仪表盘、设置、组织、通知、Codespaces、Issues、PR 等所有页面  
- 🧱 **布局安全**：仅替换文本节点，**绝不修改 DOM 结构**，彻底避免菜单错位、按钮堆叠、垂直排列等问题  
- ⚡ **零延迟加载**：无网络请求，本地词典即时生效，页面秒级翻译  
- 🔁 **动态兼容**：完美支持 GitHub 的 SPA 路由、AJAX 内容、下拉菜单和懒加载区域  
- 📚 **完整词典**：内置大量高频术语，覆盖导航、操作、设置、安全、账单等核心场景  
- 🔄 **自动更新**：安装后可自动检测并提示新版本（需 Tampermonkey 支持）
- 🚀 **性能优化**：采用缓存策略、模块化设计和按需加载，确保流畅的用户体验
- 🎯 **精准匹配**：智能的正则表达式处理和安全转义，避免翻译错误
- 🔍 **未翻译字符串检测**：内置 `stringExtractor` 模块，可检测和导出未翻译的字符串

### 自动化工具特性
- 🤖 **自动抓取**：从多个 GitHub 核心页面自动抓取文本字符串
- 🔢 **智能分类**：根据页面类型将字符串智能分类到相应模块
- ⚙️ **自动更新**：自动更新翻译词典，避免重复添加已存在的字符串
- 💾 **自动备份**：自动备份原始文件，确保安全
- 🔄 **版本管理**：自动升级版本号
- 🛡️ **稳定可靠**：支持请求重试和超时处理，提高稳定性
- 🐛 **调试支持**：支持调试模式，保存抓取结果供分析
- 📊 **统计分析**：提供详细的抓取、添加、跳过和错误统计
- 🎛️ **友好界面**：提供 Web 操作界面，支持配置管理、页面管理和实时日志查看

---

## 🚀 用户脚本安装方法

### 前提条件
- 已安装 [Tampermonkey](https://www.tampermonkey.net/)（支持 Chrome / Edge / Firefox / Safari）

### 一键安装
点击下方链接，Tampermonkey 将自动提示安装脚本：

👉 [**安装最新版脚本**](https://github.com/sutchan/GitHub_i18n/raw/main/GitHub_zh-CN.user.js)

> 💡 安装后刷新任意 GitHub 页面（如 `https://github.com`），即可看到中文界面。

---

## 🛠️ 自动化工具使用指南

### 安装依赖

```bash
cd utils
npm install
```

### 启动方法

#### 方法一：通过 HTML 界面操作（推荐）

1. 进入 utils 目录
   ```bash
   cd utils
   ```
2. 安装依赖（首次使用）
   ```bash
   npm install
   ```
3. 启动服务器
   ```bash
   npm run server
   ```
4. 打开浏览器，访问 http://localhost:3000
5. 在界面中配置参数并点击 "开始抓取" 按钮

#### 方法二：命令行方式

```bash
cd utils
node auto_string_updater.js
# 或使用 npm 脚本
npm start
```

### 工具功能

- **配置管理**：设置用户脚本路径、备份目录、字符串过滤规则等
- **页面管理**：添加、编辑、删除要抓取的 GitHub 页面
- **实时日志**：查看抓取过程的实时日志输出
- **统计数据**：查看抓取的字符串数量、新增字符串数量等统计信息
- **备份功能**：自动保存原始文件的备份

---

## 📖 翻译支持范围（部分示例）

| 类别 | 英文原文 | 中文翻译 |
|------|--------|--------|
| 导航栏 | `Pull requests`, `Issues`, `Actions` | 拉取请求、问题、操作 |
| 仓库页 | `Commits`, `Branches`, `Releases` | 提交、分支、发布 |
| 设置页 | `SSH and GPG keys`, `Personal access tokens` | SSH 和 GPG 密钥、个人访问令牌 |
| 通知中心 | `Unread`, `Mark all as read` | 未读、全部标记为已读 |
| Codespaces | `Start`, `Stop`, `Port forwarding` | 启动、停止、端口转发 |
| 通用操作 | `Save changes`, `Delete`, `Cancel` | 保存更改、删除、取消 |
| 搜索功能 | `In this repository`, `Wrap around` | 在当前仓库中、循环搜索 |

> 📝 完整词典请查看脚本源码中的 `TRANSLATION_DICT`。

---

## 🛠️ 核心技术实现

### 用户脚本技术

#### 模块化设计
- 采用模块化结构，按页面功能（core、dashboard、notifications、codespaces、search、repository 等）组织翻译词典
- 实现 `createTranslationMap` 和 `getTranslationDict` 方法，根据当前页面路径智能加载所需的翻译模块

#### 翻译实现
- 核心翻译函数 `translateElement` 精确替换文本节点，避免修改 DOM 结构
- `setupRouteChangeObserver` 监听页面路由变化，实现 SPA 应用的动态翻译
- `stringExtractor` 模块提供未翻译字符串检测和导出功能

### 自动化工具技术

#### 高效抓取与处理
- `processPagesInBatches` 实现批量并行处理，提高大规模页面处理效率
- `filterString` 智能过滤不需要翻译的内容（代码片段、数字数据等）
- `updateTranslationDictionary` 自动更新词典，添加新字符串并标记为"待翻译"

#### 健壮的错误处理
- 多层级的错误捕获和日志记录
- HTTP 请求重试、超时处理和错误恢复策略
- 详细的统计数据跟踪和错误报告

---

## ❓ 常见问题

### Q：为什么有些文字没翻译？
A：本脚本仅翻译**高频 UI 文本**，不翻译用户内容（如 Issue 标题、代码、README、评论等），以避免误翻。

### Q：菜单变成竖排 / 布局错乱了？
A：本脚本已专门修复此问题。若仍出现，请确保：
- 使用的是最新版脚本
- 未同时启用其他 GitHub 翻译插件（冲突可能导致异常）

### Q：自动化工具如何添加新的抓取页面？
A：在 Web 界面中点击 "添加页面" 按钮，输入页面 URL、选择器和模块信息即可。

### Q：如何处理工具抓取的"待翻译"字符串？
A：工具会在翻译词典中添加新字符串并标记为"待翻译: [原字符串]"，需要手动进行翻译。

---

## 🛠️ 开发与贡献

欢迎提交 Issue 或 PR！  
- 如发现**漏翻**或**误翻**，请在 [问题](https://github.com/sutchan/GitHub_i18n/issues) 中反馈  
- 如需**新增术语**，可直接修改 `TRANSLATION_DICT` 并提交 PR
- 自动化工具的改进和优化建议也欢迎提出

> 📌 脚本文件：[`GitHub_zh-CN.user.js`](GitHub_zh-CN.user.js)
> 🛠️ 工具目录：[`utils/`](utils/)

---

## 📜 许可证

本项目基于 [GNU General Public License v2.0](LICENSE) 开源，确保软件的自由共享与修改。

---

Made with ❤️ by [Sut](https://github.com/sutchan)  
如果你觉得有用，欢迎 ⭐ Star 支持！
