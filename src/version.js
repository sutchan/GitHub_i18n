// 作者: Sut
// 此文件用于统一管理GitHub自动化字符串更新工具的版本信息

/**
 * 当前工具版本号
 * @type {string}
 */
const VERSION = '1.8.24';

/**
 * 版本历史记录
 * @type {Array<{version: string, date: string, changes: string[]}>}
 */
const VERSION_HISTORY = [
  {
    version: '1.8.21',
    date: new Date().toLocaleDateString('zh-CN'),
    changes: [
      '实现版本自动更新检查功能',
      '修复代码语法错误',
      '完善翻译选择器配置',
      '清理重复代码'
    ]
  },
  {
    version: '1.8.16',
    date: '2023-12-17',
    changes: [
      '清理项目冗余文件'
    ]
  },
  {
    version: '1.8.15',
    date: '2023-12-16',
    changes: [
      '修复服务器进程终止时的空指针错误'
    ]
  },
  {
    version: '1.8.14',
    date: '2023-12-16',
    changes: [
      '增强GitHub页面配置功能，添加重复页面地址检查'
    ]
  },
  {
    version: '1.8.13',
    date: '2023-12-15',
    changes: [
      '合并开始抓取和停止按钮为单个可切换状态的按钮',
      '优化按钮状态切换逻辑'
    ]
  },
  {
    version: '1.8.12',
    date: '2023-12-14',
    changes: [
      '添加工具状态重置功能',
      '修复工具卡住问题'
    ]
  }
];

/**
 * 获取格式化的版本信息
 * @returns {string} 格式化的版本字符串
 */
function getFormattedVersion() {
  return `GitHub自动化字符串更新工具 v${VERSION}`;
}

// CommonJS 导出
module.exports = {
  VERSION,
  VERSION_HISTORY,
  getFormattedVersion
};
