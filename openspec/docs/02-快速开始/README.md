# GitHub i18n 安装指南

## 目录

- [环境依赖清单](#环境依赖清单)
- [快速安装指南](#快速安装指南)
- [详细安装方法](#详细安装方法)
- [首次使用配置](#首次使用配置)
- [安装后验证](#安装后验证)
- [更新方法](#更新方法)
- [卸载方法](#卸载方法)
- [多环境部署方案](#多环境部署方案)
- [常见问题](#常见问题)
- [版本信息](#版本信息)

## 目录说明

此目录包含 GitHub 中文翻译插件的安装指南和配置说明，帮助用户顺利安装和使用本插件。

## 包含文件

- **01-浏览器要求.md**: 支持的浏览器和版本要求
- **02-用户脚本管理器安装.md**: 如何安装和配置用户脚本管理器
- **03-插件安装步骤.md**: 详细的插件安装过程
- **04-配置选项说明.md**: 插件配置选项的详细说明
- **05-常见安装问题.md**: 安装过程中可能遇到的问题及解决方法

## 环境依赖清单

## 必要依赖

- **浏览器要求**
  - Google Chrome (推荐版本: 90+)
  - Mozilla Firefox (推荐版本: 88+)
  - Microsoft Edge (基于 Chromium, 推荐版本: 90+)
  - Apple Safari (推荐版本: 14+)
  - 其他支持用户脚本的现代浏览器

- **用户脚本管理器**
  - Tampermonkey (强烈推荐，最新版本)
  - Violentmonkey (兼容，最新版本)
  - Greasemonkey (部分功能可能受限)

## 可选依赖

- **网络环境**
  - 稳定的互联网连接 (用于自动更新和获取最新词典)
  - 访问 GitHub 网站的权限

- **存储权限**
  - 浏览器 localStorage 访问权限 (用于存储翻译缓存和配置)

## 系统要求

- **Windows 系统**
  - Windows 10 或更高版本
  - 推荐 4GB 以上内存

- **macOS 系统**
  - macOS 11 Big Sur 或更高版本
  - 推荐 4GB 以上内存

- **Linux 系统**
  - 主流 Linux 发行版 (Ubuntu、Fedora 等)
  - 推荐 4GB 以上内存

## 快速安装指南

## 安装步骤

1. **安装用户脚本管理器**
   
   如果您尚未安装用户脚本管理器，请按照以下链接安装：
   
   - **Tampermonkey**（推荐）：
     - [Chrome 扩展商店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
     - [Firefox 附加组件商店](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
     - [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
     - [Safari 扩展商店](https://apps.apple.com/us/app/tampermonkey/id1482490089)
   
   - **Violentmonkey**（备选）：
     - [Chrome 扩展商店](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
     - [Firefox 附加组件商店](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
     - [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao)

2. **安装 GitHub i18n 脚本**

   访问以下链接安装：
   - [Greasy Fork](https://greasyfork.org/zh-CN/scripts/448954-github-%E4%B8%AD%E6%96%87%E7%BF%BB%E8%AF%91) - 推荐安装渠道
   - [GitHub 发布页](https://github.com/sutchan/GitHub_i18n/releases) - 最新版本
   - [直接安装链接](https://raw.githubusercontent.com/sutchan/GitHub_i18n/main/dist/GitHub_zh-CN.user.js)

3. **验证安装**

   安装完成后，访问任意 GitHub 页面，页面应自动显示中文内容。

## 安装方法详解

## 通过 Greasy Fork 安装（推荐）

1. 访问 [Greasy Fork 上的项目页面](https://greasyfork.org/zh-CN/scripts/448954-github-%E4%B8%AD%E6%96%87%E7%BF%BB%E8%AF%91)
2. 点击 "安装此脚本" 按钮
3. 在弹出的用户脚本管理器界面中确认安装
4. 安装完成后自动跳转到 GitHub 页面以验证安装效果

## 通过 GitHub 直接安装

1. 访问 [项目源码仓库](https://github.com/sutchan/GitHub_i18n)
2. 导航到 `dist` 目录
3. 找到并点击 `github_i18n.user.js` 文件
4. 在文件页面点击 "Raw" 按钮
5. 用户脚本管理器将自动识别并提示安装

## 手动安装

1. 下载 `github_i18n.user.js` 文件到本地
2. 打开用户脚本管理器的仪表盘
3. 点击 "添加新脚本"
4. 复制脚本内容到编辑器中
5. 保存脚本

## 首次使用配置

安装完成后，插件会自动启用，无需额外配置即可开始使用。如果您需要自定义翻译行为，可以：

1. 点击浏览器工具栏中的用户脚本管理器图标
2. 选择 "GitHub 中文翻译插件"
3. 点击 "配置" 选项
4. 在配置界面中调整翻译设置

## 安装后验证

## 基础验证

1. **页面加载检查**
   - 访问 [GitHub 主页](https://github.com)
   - 页面应自动加载并显示中文内容
   - 页面布局应保持与原英文版本一致

2. **关键区域验证**
   - **导航栏**：顶部导航栏应全部翻译为中文
   - **按钮元素**：页面上的按钮（如"Sign in" → "登录"）应正确翻译
   - **菜单选项**：下拉菜单选项应显示中文
   - **操作提示**：各类操作提示和状态信息应显示中文

## 功能验证

1. **导航验证**
   - 浏览不同类型的 GitHub 页面（仓库、Issues、Pull Requests 等）
   - 确认所有页面类型都能正确翻译

2. **交互验证**
   - 执行基本操作（打开 Issues、提交评论等）
   - 确认动态加载的内容也能被正确翻译

3. **特殊页面验证**
   - 访问 [GitHub Marketplace](https://github.com/marketplace)
   - 访问 [GitHub Actions](https://github.com/features/actions)
   - 访问 [GitHub Settings](https://github.com/settings/profile)
   - 访问 [GitHub Codespaces](https://github.com/codespaces)
   - 访问 [GitHub Copilot](https://github.com/features/copilot)
   - 确认这些特殊页面也能得到适当翻译

## 验证结果记录

| 验证项目 | 预期结果 | 实际结果 | 通过/失败 | 备注 |
|---------|---------|---------|----------|------|
| 主页加载 | 中文显示 | | | |
| 导航栏翻译 | 全部中文 | | | |
| 按钮翻译 | 全部中文 | | | |
| 菜单选项翻译 | 全部中文 | | | |
| 仓库页面翻译 | 中文显示 | | | |
| Issues页面翻译 | 中文显示 | | | |
| 动态内容翻译 | 中文显示 | | | |
| 特殊页面翻译 | 中文显示 | | | |

如发现任何翻译问题或布局异常，请参考[常见问题](#常见问题)部分进行故障排除，或在[GitHub Issues](https://github.com/sutchan/GitHub_i18n/issues)中提交反馈。

## 多环境部署方案

## 企业环境部署

在企业环境中部署 GitHub i18n 插件时，建议采取以下措施：

1. **用户脚本管理器分发**
   - 通过企业策略或 MDM 工具预安装 Tampermonkey
   - 配置用户脚本管理器的更新策略

2. **脚本安装部署**
   - 将脚本托管在企业内部服务器上
   - 创建企业内部安装说明文档
   - 配置适当的访问控制

3. **版本控制**
   - 选择稳定版本进行企业部署
   - 建立测试环境先行验证新版本
   - 制定版本更新计划

## 开发环境配置

对于开发人员，建议以下配置：

1. **安装开发版本**
   - 克隆 GitHub 仓库：`git clone https://github.com/sutchan/GitHub_i18n.git`
   - 按照开发文档设置本地开发环境

2. **调试模式**
   - 在用户脚本管理器中启用调试模式
   - 使用浏览器开发者工具监控脚本行为

3. **自定义配置**
   - 根据开发需求修改配置文件
   - 调整翻译策略和缓存机制

## 特殊网络环境处理

在网络受限环境中：

1. **离线安装**
   - 下载脚本文件到本地
   - 通过用户脚本管理器的导入功能安装

2. **本地词典管理**
   - 下载最新词典文件
   - 配置脚本使用本地词典

3. **禁用自动更新**
   - 修改脚本配置，禁用自动更新检查
   - 设置手动更新流程

## 跨浏览器兼容性方案

确保在不同浏览器环境中保持一致的用户体验：

| 浏览器 | 部署方案 | 注意事项 |
|-------|---------|--------|
| Chrome | 通过企业策略或批量部署脚本 | 更新频率较快，注意兼容性测试 |
| Firefox | 使用 GPO 或配置文件 | 扩展策略较严格，需提前配置 |
| Edge | 类似 Chrome，利用企业管理功能 | 与 Chrome 共享大部分配置 |
| Safari | 使用配置描述文件 | 配置选项有限，定期验证 |

## 更新方法

GitHub i18n 脚本支持自动更新和手动更新两种方式：

## 自动更新

如果您使用 Tampermonkey 或 Violentmonkey，脚本会自动检查更新并提示您安装。通常情况下，您无需手动操作。

自动更新配置：
- 默认检查频率：每 24 小时
- 更新通知方式：用户脚本管理器通知栏
- 更新来源：Greasy Fork 或 GitHub 发布页

## 手动更新

如果需要手动更新，您可以选择以下方法：

* *方法一：从 Greasy Fork 更新**
1. 访问 [Greasy Fork 页面](https://greasyfork.org/zh-CN/scripts/424985-github-%E4%B8%AD%E6%96%87%E7%BF%BB%E8%AF%91)
2. 点击 "安装此脚本" 按钮
3. 在用户脚本管理器中确认更新

* *方法二：通过用户脚本管理器更新**
1. 打开您的用户脚本管理器（如 Tampermonkey）
2. 找到 "GitHub 中文翻译" 脚本
3. 点击更新按钮或选择 "检查更新"

* *方法三：从 GitHub 安装**
1. 访问 [GitHub 发布页](https://github.com/sutchan/GitHub_i18n/releases)
2. 下载最新的脚本文件
3. 在用户脚本管理器中导入该文件

## 更新频率与策略

- **稳定版本**：每月更新一次，包含新的翻译内容和错误修复
- **补丁版本**：不定期发布，用于修复严重问题
- **企业环境建议**：每月检查一次更新，在测试环境验证后再部署到生产环境

## 更新后验证

更新脚本后，建议执行以下验证：
1. 清除浏览器缓存
2. 刷新 GitHub 页面
3. 检查关键区域翻译是否正确
4. 验证页面交互是否正常

## 卸载插件

如需卸载插件，请按照以下步骤操作：

1. 打开用户脚本管理器的仪表盘
2. 找到 "GitHub 中文翻译插件"
3. 点击 "删除" 或 "卸载" 按钮
4. 确认卸载

## 常见问题

## 安装后 GitHub 界面没有变化

- 请尝试刷新页面或清除浏览器缓存
- 确认用户脚本管理器已启用
- 检查脚本是否已在用户脚本管理器中启用
- 验证用户脚本管理器的权限设置是否正确

## 部分内容没有翻译

- 部分动态加载的内容可能需要额外时间翻译
- 某些特殊页面或功能可能尚未支持翻译
- 尝试刷新页面或清除翻译缓存

## 浏览器兼容性问题

- 确保您的浏览器版本符合要求
- 尝试切换到推荐的用户脚本管理器（如 Tampermonkey）
- 检查浏览器扩展是否与脚本冲突
- 对于 Edge 浏览器，确保使用基于 Chromium 的最新版本
- 对于 Safari，注意权限设置可能需要额外配置

## 翻译准确性问题

- 某些技术术语的翻译可能不够准确
- 部分上下文相关的文本可能翻译不完整
- 可以在 [GitHub Issues](https://github.com/sutchan/GitHub_i18n/issues) 中提交翻译改进建议

## 版本信息

{% include "_fragments/版本信息.md" %}
- **发布日期**: 2024-06-18
- **文档状态**: 活跃维护中

- --

* 如有安装问题，请参考 [常见问题](#常见问题) 部分或在 [GitHub Issues](https://github.com/sutchan/GitHub_i18n/issues) 中提交反馈。*