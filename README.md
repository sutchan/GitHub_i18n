# GitHub 中文本地化解决方案

> 🌐 为 GitHub 全站 UI 提供精准中文翻译 + 自动化字符串更新工具

[![GitHub license](https://img.shields.io/github/license/sutchan/GitHub_i18n?color=blue)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/sutchan/GitHub_i18n?display_name=tag&color=green)](https://github.com/sutchan/GitHub_i18n/releases)
[![Userscript](https://img.shields.io/badge/Install-Tampermonkey-green?logo=tampermonkey)](https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js)

## 项目组件

| 组件                     | 说明                                   |
| ------------------------ | -------------------------------------- |
| **GitHub_zh-CN.user.js** | 油猴用户脚本，翻译 GitHub 高频 UI 文本 |
| **utils/**               | 自动化工具，抓取并更新翻译词典         |

## 特性

### 用户脚本

- ✅ 全站覆盖：仓库、仪表盘、设置、通知、Codespaces 等
- ✅ 布局安全：仅替换文本节点，绝不修改 DOM
- ✅ 零延迟：本地词典即时生效，无网络请求
- ✅ 动态兼容：支持 SPA 路由、AJAX、下拉菜单、懒加载
- ✅ 自动更新：Tampermonkey 自动检测新版本
- ✅ 性能监控：内置监控面板，实时显示翻译性能

### 自动化工具

- 🤖 自动抓取 GitHub 页面文本字符串
- 🔢 智能分类到相应翻译模块
- 💾 自动备份原始文件
- 🎛️ Web 界面操作（配置管理、实时日志、统计）

## 安装

### 用户脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 点击 [安装脚本](https://github.com/sutchan/GitHub_i18n/raw/refs/heads/main/build/GitHub_i18n.user.js)
3. 刷新 GitHub 页面即可看到中文界面

### 自动化工具

```bash
cd utils
npm install
npm run server   # Web 界面（推荐）
# 或
npm start        # 命令行模式
```

访问 http://localhost:3000 即可使用 Web 界面。

## 常见问题

**Q：有些文字没翻译？**
A：仅翻译高频 UI 文本，不翻译用户内容（标题、代码、评论等）。

**Q：布局错乱？**
A：确保使用最新版，且未同时启用其他翻译插件。

**Q：如何添加新的抓取页面？**
A：在 Web 界面点击"添加页面"，输入 URL 和模块信息即可。

## 开发与贡献

欢迎提交 Issue 和 PR！

- 漏翻/误翻反馈：[问题反馈](https://github.com/sutchan/GitHub_i18n/issues)
- 新增术语：直接修改 `TRANSLATION_DICT` 提交 PR

## 许可证

[GNU General Public License v2.0](LICENSE)

---

Made with ❤️ by [Sut](https://github.com/sutchan)
