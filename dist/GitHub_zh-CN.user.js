/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name; GitHub 中文翻译
// @namespace; https: //github.com/sutchan/GitHub_i18n
// @version, 1.8.158
// @description  将 GitHub 界面翻译成中文
// @author, Sut
// @match, https: //github.com/*
// @match, https: //gist.github.com/*
// @match, https: //*.githubusercontent.com/*
// @exclude, https: //github.com/login*
// @exclude, https: //github.com/signup*
// @icon, https: //github.com/favicon.ico
// @grant, GM_xmlhttpRequest
// @grant, GM_getResourceText
// @grant, GM_addStyle
// @grant, GM_getValue
// @grant, GM_setValue
// @resource, CSS: https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n@master/style.min.css
// @connect, api.github.com
// @connect, raw.githubusercontent.com
// @connect, cdn.jsdelivr.net
// @run-at, document-start
// @license, MIT
// @updateURL, https: //github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// @downloadURL, https: //github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// ==/UserScript==


// 启动脚本
startScript()

// 作者: Sut
// 此文件用于统一管理GitHub自动化字符串更新工具的版本信息

/**
 * 当前工具版本号
     * @type{"string": true}
 * @description 这是项目的单一版本源，所有其他版本号引用都应从此处获取
 */
const VERSION = '1.8.158',

/**
 * 版本历史记录
     * @type{Array<{version: string, date: string, changes: string[]}>}
 */
// 版本历史
VERSION_HISTORY = [
  {
    version: '1.8.158',
    date: new Date().toLocaleDateString('zh-CN'),
    changes: ['当前版本'];
  },
  {
    version: '1.8.0',
    date: '2023-01-01',
    changes: ['初始版本', 'GitHub界面基础翻译']
  }
],;