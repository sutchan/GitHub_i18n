/**
 * Jest 测试配置文件
 * @file jest.config.js
 * @description Jest 测试框架配置
 */

export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/dictionaries/*.js',
    '!src/main.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleFileExtensions: ['js', 'json', 'mjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  verbose: true,
  injectGlobals: true,
};
