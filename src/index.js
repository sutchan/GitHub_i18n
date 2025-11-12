/** GitHub 中文翻译入口文件 */

// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.8.159
// @description  将 GitHub 界面翻译成中文
// @author       Sut
// @match        https://github.com/*
// @match        https://gist.github.com/*
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

// 导入所需模块
import { CONFIG } from './config.js';
import { utils } from './utils.js';
import { versionChecker } from './versionChecker.js';
import { translationCore } from './translationCore.js';
import { translationModule } from './dictionaries/index.js';
import { pageMonitor } from './pageMonitor.js';
import { stringExtractor, AutoStringUpdater, DictionaryProcessor, loadTools } from './tools.js';
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
