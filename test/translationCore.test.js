/**
 * translationCore.js 单元测试
 * 测试翻译核心功能和性能监控
 */

// 模拟浏览器环境
if (typeof window === 'undefined') {
    global.window = {};
    global.navigator = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
        language: 'zh-CN'
    };
}

// 模拟CONFIG对象
const CONFIG = {
    performance: {
        batchSize: 30,
        enablePartialMatch: true,
        enableTranslationCache: true,
        enableVirtualDom: true
    }
};

// 模拟utils
const utils = {
    escapeRegExp: (str) => str.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'),
    safeJSONParse: (json, defaultValue = null) => {
        try {
            return JSON.parse(json);
        } catch (e) {
            return defaultValue;
        }
    },
    safeRegExp: (pattern, flags = '') => {
        try {
            return new RegExp(pattern, flags);
        } catch (e) {
            return null;
        }
    }
};

// 模拟其他依赖
const versionChecker = { checkForUpdates: jest.fn() };
const pageMonitor = { init: jest.fn() };
const configUI = { init: jest.fn() };

// 模拟模块导入
jest.mock('../src/config.js', () => ({ CONFIG }));
jest.mock('../src/utils.js', () => ({ utils }));
jest.mock('../src/versionChecker.js', () => ({ versionChecker }));
jest.mock('../src/pageMonitor.js', () => ({ pageMonitor }));
jest.mock('../src/configUI.js', () => ({ configUI }));

// 导入被测试模块
const TranslationCore = require('../src/translationCore.js').TranslationCore;

describe('TranslationCore Performance Monitoring', () => {
    let translationCore;

    beforeEach(() => {
        // 创建新的实例
        translationCore = new TranslationCore();
        // 重置性能数据
        translationCore.resetPerformanceData();
    });

    describe('resetPerformanceData', () => {
        test('should initialize performance data to default values', () => {
            // 设置一些数据
            translationCore.performanceData.elementsProcessed = 10;
            translationCore.performanceData.textsTranslated = 5;
            translationCore.performanceData.cacheHits = 3;
            translationCore.performanceData.cacheMisses = 2;
            
            // 重置数据
            translationCore.resetPerformanceData();
            
            // 验证数据被重置
            expect(translationCore.performanceData.translateStartTime).toBe(0);
            expect(translationCore.performanceData.elementsProcessed).toBe(0);
            expect(translationCore.performanceData.textsTranslated).toBe(0);
            expect(translationCore.performanceData.cacheHits).toBe(0);
            expect(translationCore.performanceData.cacheMisses).toBe(0);
            expect(translationCore.performanceData.cacheEvictions).toBe(0);
            expect(translationCore.performanceData.cacheCleanups).toBe(0);
            expect(translationCore.performanceData.domOperations).toBe(0);
            expect(translationCore.performanceData.domOperationTime).toBe(0);
            expect(translationCore.performanceData.networkRequests).toBe(0);
            expect(translationCore.performanceData.networkRequestTime).toBe(0);
            expect(translationCore.performanceData.dictionaryLookups).toBe(0);
            expect(translationCore.performanceData.partialMatches).toBe(0);
            expect(translationCore.performanceData.batchProcessings).toBe(0);
            expect(translationCore.performanceData.errorCount).toBe(0);
        });
    });

    describe('recordPerformanceEvent', () => {
        test('should record DOM operation events', () => {
            translationCore.recordPerformanceEvent('dom-operation', { duration: 10 });
            translationCore.recordPerformanceEvent('dom-operation', { duration: 20 });
            
            expect(translationCore.performanceData.domOperations).toBe(2);
            expect(translationCore.performanceData.domOperationTime).toBe(30);
        });

        test('should record network request events', () => {
            translationCore.recordPerformanceEvent('network-request', { duration: 100 });
            translationCore.recordPerformanceEvent('network-request', { duration: 200 });
            
            expect(translationCore.performanceData.networkRequests).toBe(2);
            expect(translationCore.performanceData.networkRequestTime).toBe(300);
        });

        test('should record dictionary lookup events', () => {
            translationCore.recordPerformanceEvent('dictionary-lookup');
            translationCore.recordPerformanceEvent('dictionary-lookup');
            
            expect(translationCore.performanceData.dictionaryLookups).toBe(2);
        });

        test('should record partial match events', () => {
            translationCore.recordPerformanceEvent('partial-match');
            
            expect(translationCore.performanceData.partialMatches).toBe(1);
        });

        test('should record batch processing events', () => {
            translationCore.recordPerformanceEvent('batch-processing');
            translationCore.recordPerformanceEvent('batch-processing');
            translationCore.recordPerformanceEvent('batch-processing');
            
            expect(translationCore.performanceData.batchProcessings).toBe(3);
        });

        test('should record error events', () => {
            translationCore.recordPerformanceEvent('error');
            
            expect(translationCore.performanceData.errorCount).toBe(1);
        });

        test('should ignore unknown event types', () => {
            translationCore.recordPerformanceEvent('unknown-event');
            
            // 验证没有性能数据被更新
            expect(translationCore.performanceData.elementsProcessed).toBe(0);
            expect(translationCore.performanceData.textsTranslated).toBe(0);
        });
    });

    describe('getPerformanceStats', () => {
        test('should calculate cache hit rate correctly', () => {
            translationCore.performanceData.cacheHits = 8;
            translationCore.performanceData.cacheMisses = 2;
            
            const stats = translationCore.getPerformanceStats();
            
            expect(stats.cacheHitRate).toBe('80.00%');
        });

        test('should return 0% cache hit rate when no cache requests', () => {
            const stats = translationCore.getPerformanceStats();
            
            expect(stats.cacheHitRate).toBe('0%');
        });

        test('should calculate total duration correctly', () => {
            const startTime = Date.now() - 1000;
            translationCore.performanceData.translateStartTime = startTime;
            translationCore.performanceData.translateEndTime = startTime + 500;
            
            const stats = translationCore.getPerformanceStats();
            
            expect(stats.totalDuration).toBe(500);
        });

        test('should calculate average DOM operation time correctly', () => {
            translationCore.performanceData.domOperations = 2;
            translationCore.performanceData.domOperationTime = 30;
            
            const stats = translationCore.getPerformanceStats();
            
            expect(stats.avgDomOperationTime).toBe('15.00ms');
        });

        test('should calculate average network request time correctly', () => {
            translationCore.performanceData.networkRequests = 2;
            translationCore.performanceData.networkRequestTime = 300;
            
            const stats = translationCore.getPerformanceStats();
            
            expect(stats.avgNetworkRequestTime).toBe('150.00ms');
        });
    });

    describe('exportPerformanceData', () => {
        test('should export performance data in correct format', () => {
            translationCore.performanceData.translateStartTime = Date.now() - 1000;
            translationCore.performanceData.translateEndTime = Date.now();
            translationCore.performanceData.elementsProcessed = 5;
            translationCore.performanceData.textsTranslated = 3;
            translationCore.performanceData.cacheHits = 2;
            translationCore.performanceData.cacheMisses = 1;
            translationCore.currentPageMode = 'repository';
            
            const exported = translationCore.exportPerformanceData();
            const data = JSON.parse(exported);
            
            expect(data).toHaveProperty('timestamp');
            expect(data.pageMode).toBe('repository');
            expect(data).toHaveProperty('stats');
            expect(data.stats.elementsProcessed).toBe(5);
            expect(data.stats.textsTranslated).toBe(3);
            expect(data).toHaveProperty('userAgent');
            expect(data).toHaveProperty('browserLanguage');
        });
    });
});
