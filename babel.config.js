/**
 * Babel 配置文件
 * 配置Babel以支持ES模块语法的转换
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ]
  ]
};
