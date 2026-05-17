/**
 * GitHub 中文翻译主入口文件
 * @file main.js
 * @version 1.9.15
 * @date 2026-05-01
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

    // 移除页面卸载事件监听器
    window.removeEventListener('beforeunload', cleanup);
    window.removeEventListener('unload', cleanup);

    // 移除页面隐藏事件监听器
    if (window.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', window.visibilityChangeHandler);
      window.visibilityChangeHandler = null;
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
function init() {
  try {
    // 检查更新
    if (CONFIG.updateCheck.enabled) {
      versionChecker.checkForUpdates().catch(() => {
        // 静默失败，不影响用户体验
      });
    }

    // 初始化翻译核心功能
    if (typeof translationCore === 'undefined') {
      console.error('[GitHub 中文翻译] translationCore 未定义');
      return;
    }
    if (typeof translationCore.init !== 'function') {
      console.error('[GitHub 中文翻译] translationCore.init 不是函数');
      return;
    }
    translationCore.init();

    // 执行页面翻译
    if (typeof translationCore.translate === 'function') {
      translationCore.translate();
    } else {
      console.error('[GitHub 中文翻译] translationCore.translate 不是函数');
    }

    // 初始化页面监控
    if (typeof pageMonitor !== 'undefined' && typeof pageMonitor.init === 'function') {
      pageMonitor.init();
    }

    // 初始化配置界面
    if (typeof configUI !== 'undefined' && typeof configUI.init === 'function') {
      configUI.init();
    }

    // 添加页面卸载事件监听器
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);

    // 添加页面隐藏事件监听器（当用户切换标签页时）
    const visibilityChangeHandler = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时可以清理一些缓存
        if (translationCore && typeof translationCore.cleanCache === 'function') {
          translationCore.cleanCache();
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityChangeHandler);

    // 保存事件监听器引用，以便后续清理
    window.visibilityChangeHandler = visibilityChangeHandler;
  } catch (error) {
    console.error('[GitHub 中文翻译] 脚本初始化失败:', error);
  }
}

/**
 * 启动脚本
 */
function startScript() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        await init();
      } catch (error) {
        console.error('[GitHub 中文翻译] DOMContentLoaded 回调中初始化失败:', error);
      }
    });
  } else {
    try {
      init();
    } catch (error) {
      console.error('[GitHub 中文翻译] 直接初始化失败:', error);
    }
  }
}

// 导出函数供其他模块使用
export { init, startScript, cleanup };

// 将核心模块暴露到全局作用域，便于调试和配置界面使用
if (typeof window !== 'undefined') {
  window.translationCore = translationCore;
  window.configUI = configUI;
}

// 启动脚本
startScript();
