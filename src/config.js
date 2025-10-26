/**
 * GitHub 中文翻译配置文件
 * 包含脚本所有可配置项
 */

// 导入版本常量（从单一版本源）
import { VERSION } from './version.js';

// 定义GM_info以避免未定义错误
const GM_info = typeof window !== 'undefined' && window.GM_info || {};

/**
 * 从用户脚本头部注释中提取版本号
 * @returns {string} 版本号
 */
function getVersionFromComment() {
    try {
        // 作为用户脚本，我们可以直接从当前执行环境中提取版本信息
        const versionMatch = GM_info?.script?.version;
        if (versionMatch) {
            return versionMatch;
        }
        
        // 如果GM_info不可用，返回配置中的版本号
        return VERSION;
    } catch (e) {
        // 出错时返回配置中的版本号
        return VERSION;
    }
}

/**
 * 配置对象，包含所有可配置项
 */
export const CONFIG = {
    "version": VERSION,
    "debounceDelay": 500,
    "routeChangeDelay": 500,
    "debugMode": false,
    "updateCheck": {
        "enabled": true,
        "intervalHours": 24,
        "scriptUrl": "https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js",
        "autoUpdateVersion": true
    },
    "externalTranslation": {
        "enabled": false,
        "minLength": 20,
        "maxLength": 500,
        "timeout": 3000,
        "requestInterval": 500,
        "cacheSize": 500
    },
    "performance": {
        "enableDeepObserver": true,
        "enablePartialMatch": false,
        "maxDictSize": 2000,
        "enableTranslationCache": true
    },
    "selectors": {
        "primary": [
            "h1, h2, h3, h4, h5, h6",
            "p, span, a, button",
            "label, strong, em",
            "li, td, th",
            ".btn, .button",
            ".link, .text",
            ".nav-item, .menu-item"
        ],
        "popupMenus": [
            ".dropdown-menu",
            ".menu-dropdown",
            ".context-menu",
            ".notification-popover"
        ]
    },
    "pagePatterns": {
        "search": /\/search/,
        "repository": /\/[\w-]+\/[\w-]+/,
        "issues": /\/[\w-]+\/[\w-]+\/issues/,
        "pullRequests": /\/[\w-]+\/[\w-]+\/pull/,
        "settings": /\/settings/,
        "dashboard": /^\/$/,            
        "explore": /\/explore/,
        "codespaces": /\/codespaces/
    }
};

export { getVersionFromComment };