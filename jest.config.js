/**
 * Jest 测试配置文件
 * @file jest.config.js
 * @description Jest 测试框架配置
 */

export default {
  // 测试环境
  testEnvironment: 'jsdom',

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],

  // 忽略测试的路径
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
  ],

  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/dictionaries/*.js',
    '!src/main.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // 模块转换
  transform: {},

  // 模块名称映射
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // 扩展名
  moduleFileExtensions: ['js', 'json'],

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 全局变量
  globals: {
    'jest-environment-jsdom': {
      resources: 'usable',
    },
  },

  // 模拟配置
  clearMocks: true,
  restoreMocks: true,

  // 超时设置
  testTimeout: 10000,

  // 详细输出
  verbose: true,
};
