// 作者: Sut
// 此文件用于统一管理GitHub自动化字符串更新工具的版本信息

/**
 * 当前工具版本号
 * @type {string}
 * @description 这是项目的单一版本源，所有其他版本号引用都应从此处获取
 */
export const VERSION = '1.8.93';

/**
 * 版本历史记录
 * @type {Array<{version: string, date: string, changes: string[]}>}
 */
export const VERSION_HISTORY = [
  {
    version: '1.8.93',
    date: '2025-11-10',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.92',
    date: '2025-11-10',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.91',
    date: '2025-11-10',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.90',
    date: '2025-11-10',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.89',
    date: '2025-11-10',
    changes: ['自动版本更新']
  },
  {
    version: '1.8.88',
    date: '2025-11-10',
    changes: [
      '修复代码规范问题',
      '统一项目版本号管理',
      '优化.gitignore配置'
    ]
  },
  {
    version: '1.8.87',
    date: '2025-11-10',
    changes: [
      '增强页面监控性能',
      '优化翻译缓存机制',
      '修复已知兼容性问题'
    ]
  },
  {
    version: '1.8.86',
    date: '2025-11-10',
    changes: [
      '更新翻译词典',
      '添加新页面模式支持',
      '改进错误处理机制'
    ]
  },
  {
    version: '1.8.85',
    date: '2025-11-10',
    changes: [
      '优化DOM操作性能',
      '添加更详细的错误日志',
      '更新构建脚本功能'
    ]
  },
  {
    version: '1.8.84',
    date: '2025-11-10',
    changes: [
      '支持更多GitHub页面',
      '优化翻译效率',
      '修复界面布局问题'
    ]
  }
];
