/**
 * GitHub 中文翻译主入口文件
 * 整合所有模块并初始化脚本
 */
import { CONFIG } from './config.js';
import { utils } from './utils.js';
import { versionChecker } from './versionChecker.js';
import { translationCore } from './translationCore.js';
import { pageMonitor } from './pageMonitor.js';
import { loadTools, stringExtractor } from './tools.js';

/**
 * 初始化脚本
 */
async function init() {
    try {
        // 检查更新
        if (CONFIG.updateCheck.enabled) {
            await versionChecker.checkForUpdates();
        }
        
        // 初始化翻译核心功能
        if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 开始初始化翻译核心...`);
        }
        
        // 执行初始翻译
        translationCore.translate();
        
        // 初始化页面监控
        pageMonitor.init();
        
        // 在调试模式下，提供工具到全局作用域
        if (CONFIG.debugMode) {
            // 加载工具类
            const { AutoStringUpdater, DictionaryProcessor } = loadTools();
            
            // 初始化并挂载工具
            window.GitHubTranslationHelper = stringExtractor;
            window.AutoStringUpdater = new AutoStringUpdater();
            window.DictionaryProcessor = new DictionaryProcessor();
            
            console.log(`[GitHub 中文翻译] 脚本 v${CONFIG.version} 初始化成功`);
            console.log('[GitHub 中文翻译] 开发工具已加载到全局作用域:');
            console.log('  - 字符串提取工具: window.GitHubTranslationHelper');
            console.log('  - 自动更新工具: window.AutoStringUpdater');
            console.log('  - 词典处理工具: window.DictionaryProcessor');
            console.log('\n使用示例:');
            console.log('  // 收集页面字符串');
            console.log('  GitHubTranslationHelper.collectStrings(true)');
            console.log('  // 查看更新报告');
            console.log('  AutoStringUpdater.showReportInConsole()');
            console.log('  // 查看词典统计');
            console.log('  DictionaryProcessor.showStatisticsInConsole()');
        }
    } catch (error) {
        console.error('[GitHub 中文翻译] 脚本初始化失败:', error);
    }
}

/**
 * 启动脚本
 */
function startScript() {
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await init();
        });
    } else {
        // 如果DOM已经加载完成，直接初始化
        init();
    }
}

// 导出函数供其他模块使用
export { init, startScript };

// 🕒 启动脚本
startScript();