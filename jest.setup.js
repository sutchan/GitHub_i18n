/**
 * Jest 测试环境设置
 * @file jest.setup.js
 * @description 测试前的全局设置
 */

// 模拟用户脚本环境全局变量
global.GM_info = {
  script: {
    name: 'GitHub 中文翻译',
    version: '1.9.12',
  },
};

global.GM_xmlhttpRequest = jest.fn();
global.GM_setValue = jest.fn();
global.GM_getValue = jest.fn();
global.unsafeWindow = global;
global.GM_addStyle = jest.fn();
global.GM_registerMenuCommand = jest.fn();

// 模拟 DOM 环境
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://github.com/',
    pathname: '/',
    hostname: 'github.com',
  },
  writable: true,
});

// 模拟 MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
};

// 模拟 console 方法，避免测试输出过多
global.console = {
  ...console,
  // 保留 error 和 warn，但忽略 log
  log: jest.fn(),
  debug: jest.fn(),
};
