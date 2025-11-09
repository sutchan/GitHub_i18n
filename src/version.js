// 作者: Sut\n// 此文件用于统一管理GitHub自动化字符串更新工具的版本信息\n\n/**\n * 当前工具版本号\n * @type {string}\n * @description 这是项目的单一版本源，所有其他版本号引用都应从此处获取\n */\nexport const VERSION = '1.8.65';\n\n/**\n * 版本历史记录\n * @type {Array<{version: string, date: string, changes: string[]}>}\n */\nexport const VERSION_HISTORY = [
  {
    version: '1.8.65',
    date: '2025-11-09',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.64',
    date: '2025-11-09',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.63',
    date: '2025-11-09',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.62',
    date: '2025-11-08',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.61',
    date: '2025-11-06',
    changes: ['自动版本更新']
  },
  {\n    version: '1.8.60',\n    date: '2024-01-15',\n    changes: ['修复XSS安全漏洞', '优化翻译性能和DOM操作', '改进缓存管理策略', '增强错误处理机制']\n  },\n  {\n    version: '1.8.59',\n    date: '2025-10-24',\n    changes: ['优化版本号管理系统', '统一版本号源']\n  },\n  {\n    version: '1.8.37',\n    date: '2023-12-18',\n    changes: ['修复utils/app.js文件中的语法错误']\n  },\n  {\n    version: '1.8.29',\n    date: '2023-12-17',\n    changes: [\n      '完成所有文件版本号同步',\n      '更新构建系统补丁版本',\n      '优化项目版本管理'\n    ]\n  },\n  {\n    version: '1.8.25',\n    date: '2023-12-18',\n    changes: [\n      '更新构建系统'\n    ]\n  },\n  {\n    version: '1.8.24',\n    date: '2023-12-17',\n    changes: [\n      '同步版本号'\n    ]\n  },\n  {\n    version: '1.8.21',\n    date: '2023-12-17',\n    changes: [\n      '实现版本自动更新检查功能',\n      '修复代码语法错误',\n      '完善翻译选择器配置',\n      '清理重复代码'\n    ]\n  },\n  {\n    version: '1.8.16',\n    date: '2023-12-17',\n    changes: [\n      '清理项目冗余文件'\n    ]\n  },\n  {\n    version: '1.8.15',\n    date: '2023-12-16',\n    changes: [\n      '修复服务器进程终止时的空指针错误'\n    ]\n  },\n  {\n    version: '1.8.14',\n    date: '2023-12-16',\n    changes: [\n      '增强GitHub页面配置功能，添加重复页面地址检查'\n    ]\n  },\n  {\n    version: '1.8.13',\n    date: '2023-12-15',\n    changes: [\n      '合并开始抓取和停止按钮为单个可切换状态的按钮',\n      '优化按钮状态切换逻辑'\n    ]\n  },\n  {\n    version: '1.8.12',\n    date: '2023-12-14',\n    changes: [\n      '添加工具状态重置功能',\n      '修复工具卡住问题'\n    ]\n  }\n];\n\n/**\n * 获取格式化的版本信息\n * @returns {string} 格式化的版本字符串\n */\nfunction getFormattedVersion() {\n  return `GitHub自动化字符串更新工具 v${VERSION}`;\n}\n\n// 导出格式化版本函数\nexport { getFormattedVersion };\n