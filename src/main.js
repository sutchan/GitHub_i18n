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
            versionChecker.checkForUpdates().catch(() => {
                // 静默失败，不影响用户体验
            });
        }
        
        // 初始化翻译核心功能
        translationCore.translate();
        
        // 初始化页面监控
        pageMonitor.init();
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