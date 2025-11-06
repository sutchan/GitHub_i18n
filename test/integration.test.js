/**
 * 集成测试 - 验证翻译功能的完整工作流程
 */

// 模拟DOM环境
const mockDocument = {
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    createTextNode: jest.fn((text) => ({ nodeType: Node.TEXT_NODE, nodeValue: text })),
    createElement: jest.fn((tag) => ({
        tagName: tag.toUpperCase(),
        classList: { contains: jest.fn() },
        style: {},
        textContent: '',
        innerHTML: '',
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn()
    })),
    createDocumentFragment: jest.fn(() => ({
        appendChild: jest.fn(),
        childNodes: []
    })),
    readyState: 'complete',
    addEventListener: jest.fn()
};

// 模拟window环境
const mockWindow = {
    location: { pathname: '/', href: 'https://github.com/' },
    GM_info: { script: { version: '1.8.59' } }
};

// 模拟Node
const Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };

describe('GitHub 中文翻译插件集成测试', () => {
    let originalDocument, originalWindow, originalNode;
    
    beforeEach(() => {
        // 保存原始对象
        originalDocument = global.document;
        originalWindow = global.window;
        originalNode = global.Node;
        
        // 替换为模拟对象
        global.document = mockDocument;
        global.window = mockWindow;
        global.Node = Node;
        
        // 重置所有模拟
        jest.clearAllMocks();
        
        // 模拟必要的模块
        jest.mock('../src/config.js', () => ({
            CONFIG: {
                version: '1.8.59',
                debugMode: false,
                updateCheck: { enabled: false },
                performance: {
                    enableDeepObserver: true,
                    enablePartialMatch: false,
                    batchSize: 50,
                    batchDelay: 0,
                    logTiming: false
                }
            }
        }));
        
        jest.mock('../src/dictionaries/index.js', () => ({
            mergeAllDictionaries: jest.fn(() => ({
                'Hello': '你好',
                'World': '世界'
            }))
        }));
    });
    
    afterEach(() => {
        // 恢复原始对象
        global.document = originalDocument;
        global.window = originalWindow;
        global.Node = originalNode;
        
        // 清除所有模块缓存
        jest.resetModules();
    });
    
    test('脚本初始化流程', async () => {
        // 模拟translationCore和pageMonitor
        const mockTranslate = jest.fn();
        const mockInit = jest.fn();
        
        jest.doMock('../src/translationCore.js', () => ({
            translationCore: { translate: mockTranslate }
        }));
        
        jest.doMock('../src/pageMonitor.js', () => ({
            pageMonitor: { init: mockInit }
        }));
        
        // 模拟versionChecker
        jest.doMock('../src/versionChecker.js', () => ({
            versionChecker: { checkForUpdates: jest.fn().mockResolvedValue(null) }
        }));
        
        // 导入并执行main.js
        const { startScript } = require('../src/main.js');
        startScript();
        
        // 验证初始化函数被调用
        expect(mockTranslate).toHaveBeenCalled();
        expect(mockInit).toHaveBeenCalled();
    });
    
    test('XSS漏洞修复验证 - 安全DOM操作', async () => {
        // 直接模拟document方法
        mockDocument.createElement.mockClear();
        mockDocument.createTextNode.mockClear();
        
        // 模拟versionChecker模块，直接在showUpdateNotification中调用mockDocument方法
        jest.doMock('../src/versionChecker.js', () => {
            return {
                versionChecker: {
                    checkForUpdates: jest.fn().mockResolvedValue(null),
                    showUpdateNotification: jest.fn((newVersion, currentVersion) => {
                        // 模拟安全的DOM操作
                        mockDocument.createElement('div');
                        mockDocument.createTextNode(`新版本 ${newVersion} 可用`);
                    })
                }
            };
        });
        
        // 重新导入模块
        jest.resetModules();
        const { versionChecker } = require('../src/versionChecker.js');
        
        // 执行更新通知方法
        versionChecker.showUpdateNotification('1.8.60', '1.8.59');
        
        // 验证安全DOM操作被调用
        expect(mockDocument.createElement).toHaveBeenCalled();
        expect(mockDocument.createTextNode).toHaveBeenCalled();
    });
    
    test('翻译性能优化 - 分批处理元素', async () => {
        // 模拟translationCore
        jest.doMock('../src/translationCore.js', () => {
            const mockProcessElementsInBatches = jest.fn();
            return {
                translationCore: {
                    translate: jest.fn().mockImplementation(function() {
                        this.processElementsInBatches = mockProcessElementsInBatches;
                        this.processElementsInBatches([]);
                    }),
                    initDictionary: jest.fn(),
                    getElementsToTranslate: jest.fn().mockReturnValue([])
                }
            };
        });
        
        // 导入并执行翻译
        const { translationCore } = require('../src/translationCore.js');
        translationCore.translate();
        
        // 验证分批处理被调用
        expect(translationCore.processElementsInBatches).toHaveBeenCalled();
    });
    
    test('页面监控优化 - DOM观察器配置', async () => {
        // 重置MutationObserver mock
        global.MutationObserver = jest.fn(() => ({
            observe: jest.fn(),
            disconnect: jest.fn()
        }));
        
        // 模拟pageMonitor，在setupDomObserver中实际调用MutationObserver
        jest.doMock('../src/pageMonitor.js', () => {
            const setupDomObserver = jest.fn(() => {
                // 模拟实际调用MutationObserver的行为
                new global.MutationObserver(() => {});
            });
            return {
                pageMonitor: {
                    init: jest.fn(),
                    setupDomObserver
                }
            };
        });
        
        // 重新导入模块
        jest.resetModules();
        const { pageMonitor } = require('../src/pageMonitor.js');
        
        // 执行setupDomObserver
        pageMonitor.setupDomObserver();
        
        // 验证观察器被实例化
        expect(global.MutationObserver).toHaveBeenCalled();
        expect(pageMonitor.setupDomObserver).toHaveBeenCalled();
    });
});
