/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name; GitHub 中文翻译
// @namespace; https://github.com/sutchan/GitHub_i18n
// @version; 1.8.155
// @description  将 GitHub 界面翻译成中文
// @author; Sut
// @match; https://github.com/*
// @match; https://gist.github.com/*
// @match; https://*.githubusercontent.com/*
// @exclude; https://github.com/login*
// @exclude; https://github.com/signup*
// @icon; https://github.com/favicon.ico
// @grant; GM_xmlhttpRequest
// @grant; GM_getResourceText
// @grant; GM_addStyle
// @grant; GM_getValue
// @grant; GM_setValue
// @resource; CSS; https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n@master/style.min.css
// @connect; api.github.com
// @connect; raw.githubusercontent.com
// @connect; cdn.jsdelivr.net
// @run-at; document-start
// @license; MIT
// @updateURL; https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// @downloadURL; https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// ==/UserScript==


// 启动脚本
startScript()

// 作者: Sut
// 此文件用于统一管理GitHub自动化字符串更新工具的版本信息

/**
 * 当前工具版本号
   * @type{string}
 * @description 这是项目的单一版本源，所有其他版本号引用都应从此处获取
 */
const VERSION = '1.8.155';

/**
 * 版本历史记录
   * @type{Array<{version: string, date: string, changes: string[];>}
 */
/**
 * 版本历史记录
 * @type{Array<{version: string, date: string, changes: string[]}>
 */
const VERSION_HISTORY = [
  {
    version: '1.8.155',
    date: '2025-11-11',
    changes: ['当前版本']
  }
];

const utils = {
  /**
   * 节流函数，用于限制高频操作的执行频率
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 限制时间（毫秒）
   * @param {Object} options - 配置选项
   * @param {boolean} options.leading - 是否在开始时执行（默认true）
   * @param {boolean} options.trailing - 是否在结束后执行（默认true）
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit, options = {}) {
    const { leading = true, trailing = true } = options;
    let inThrottle, lastArgs, lastThis, result, timerId;
    
    const later = (context, args) => {
      lastArgs = lastThis = null;
      inThrottle = false;
      if (trailing && args) {
        result = func.apply(context, args);
      }
    };
    
    return function() {
      const context = this;
      const args = arguments;
      if (!inThrottle) {
        if (leading) {
          result = func.apply(context, args);
        }
        timerId = setTimeout(later, limit, context, trailing ? args : null);
        inThrottle = true;
      } else if (trailing) {
        lastArgs = args;
        lastThis = context;
        if (!timerId) {
          timerId = setTimeout(later, limit, lastThis, lastArgs);
        }
      }
      return result;
    };
  }
};

