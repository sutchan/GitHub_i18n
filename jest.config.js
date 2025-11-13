/**
 * Jest 配置文件
 * 配置Jest以支持ES模块语法
 */

module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  testEnvironment: 'jest-environment-jsdom'
};
