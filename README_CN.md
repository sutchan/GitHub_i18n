# GitHub 中文翻译

## 项目简介

这是一个将 GitHub 界面翻译成中文的浏览器用户脚本。本项目支持完全不依赖 Node.js 环境进行构建和开发。

## 快速开始

### 无需 Node.js 的构建方法

本项目提供了一个纯浏览器端的构建工具，完全不需要 Node.js 环境：

1. 使用浏览器打开 `build-tool.html` 文件
2. 点击「开始构建」按钮
3. 构建完成后，点击「下载合并后的用户脚本」按钮获取生成的用户脚本文件

### 使用浏览器控制台构建

如果你更喜欢使用 JavaScript 脚本，可以在浏览器控制台中执行：

1. 打开 `merge-script.js` 文件，复制所有内容
2. 在浏览器控制台中粘贴并执行
3. 执行 `mergeAllFiles()` 函数开始构建

## 安装用户脚本

1. 确保你的浏览器已安装 Tampermonkey 或 Greasemonkey 等用户脚本管理器
2. 打开下载的 `GitHub_zh-CN.user.js` 文件
3. 按照脚本管理器的提示完成安装

## 开发指南

### 文件结构

```
src/               # 源代码目录
  ├── index.js     # UserScript 元数据和入口
  ├── config.js    # 配置文件
  ├── utils.js     # 工具函数
  ├── main.js      # 主逻辑
  ├── dictionaries/ # 翻译字典
  └── ...          # 其他模块

build-tool.html    # 浏览器端构建工具
merge-script.js    # 合并脚本
```

### 添加翻译

1. 修改 `src/dictionaries/` 目录下的对应字典文件
2. 使用构建工具重新生成用户脚本

### 移除 Node.js 依赖

如果需要完全移除项目中的 Node.js 依赖，可以删除以下文件：

- `package.json`
- `package-lock.json`
- `build.js`
- `.eslintrc.js`

## 版本更新

如果需要更新版本号，请手动编辑 `src/index.js` 文件中的版本号。

## 许可证

本项目使用 MIT 许可证。

## 作者

Sut