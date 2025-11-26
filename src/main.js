/**
 * GitHub 中文翻译主入口文件
 * @file main.js
 * @version 1.8.172
 * @date 2025-06-17
 * @author Sut
 * @description 整合所有模块并初始化脚本
 */

// 导入核心模块
import { CONFIG } from './config.js';
import { versionChecker } from './versionChecker.js';
import { translationCore } from './translationCore.js';
import { pageMonitor } from './pageMonitor.js';
import { configUI } from './configUI.js';

/**
 * 清理资源
 * 在页面卸载时调用，防止内存泄漏
 */
function cleanup() {
    try {
        // 停止页面监控
        if (pageMonitor && typeof pageMonitor.stop === 'function') {
            pageMonitor.stop();
        }
        
        // 清理翻译缓存
        if (translationCore && typeof translationCore.clearCache === 'function') {
            translationCore.clearCache();
        }
        
        // 清理配置界面
        if (configUI && typeof configUI.cleanup === 'function') {
            configUI.cleanup();
        }
        
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 资源清理完成');
        }
    } catch (error) {
        if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 资源清理失败:', error);
        }
    }
}

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
        translationCore.init();
        translationCore.translate();
        
        // 初始化页面监控
        pageMonitor.init();
        
        // 初始化配置界面
        configUI.init();
        
        // 添加页面卸载事件监听器
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('unload', cleanup);
        
        // 添加页面隐藏事件监听器（当用户切换标签页时）
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // 页面隐藏时可以清理一些缓存
                if (translationCore && typeof translationCore.cleanCache === 'function') {
                    translationCore.cleanCache();
                }
            }
        });
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
export { init, startScript, cleanup };

// 将核心模块暴露到全局作用域，便于调试和配置界面使用
if (typeof window !== 'undefined') {
    window.translationCore = translationCore;
    window.configUI = configUI;
}

// 🕒 启动脚本
startScript();