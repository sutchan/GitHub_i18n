/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version 1.8.83
// @description  将 GitHub 界面翻译成中文
// @author       Sut
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @match        https://*.githubusercontent.com/*
// @exclude      https://github.com/login*
// @exclude      https://github.com/signup*
// @icon         https://github.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @resource     CSS https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n@master/style.min.css
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @run-at       document-start
// @license      MIT
// @updateURL    https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// @downloadURL  https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// ==/UserScript==

// 导入配置
import { CONFIG } from './config.js';

// 导入工具函数
import { utils } from './utils.js';

// 导入版本检查器
import { versionChecker } from './versionChecker.js';

// 导入翻译核心
import { translationCore } from './translationCore.js';

// 导入词典模块
import { translationModule } from './dictionaries/index.js';

// 导入页面监控
import { pageMonitor } from './pageMonitor.js';

// 导入开发工具
import { stringExtractor, AutoStringUpdater, DictionaryProcessor, loadTools } from './tools.js';

// 导入主初始化函数
import { init, startScript } from './main.js';

// 导出所有公开模块
export {
  CONFIG,
  utils,
  versionChecker,
  translationCore,
  translationModule,
  pageMonitor,
  stringExtractor,
  AutoStringUpdater,
  DictionaryProcessor,
  loadTools,
  init,
  startScript
};

// 启动脚本
startScript();
