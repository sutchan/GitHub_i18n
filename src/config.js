/**
 * GitHub 中文翻译配置文件
 * @file config.js
 * @version 1.8.172
 * @date 2025-06-17
 * @author Sut
 * @description 包含脚本所有可配置项
 */

// 导入版本常量（从单一版本源）
import { VERSION } from './version.js';

// 定义greasemonkeyInfo以避免未定义错误，使用空值合并运算符提高代码可读性
const greasemonkeyInfo = typeof window !== 'undefined' ? window.GM_info ?? {} : {};

/**
 * 从用户脚本头部注释中提取版本号
 * @returns {string} 版本号
 */
function getVersionFromComment() {
  try {
    // 作为用户脚本，我们可以直接从当前执行环境中提取版本信息
    const versionMatch = greasemonkeyInfo?.script?.version;
    if (versionMatch) {
      return versionMatch;
    }

    // 如果greasemonkeyInfo不可用，返回配置中的版本号
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
    "enableTranslationCache": true,
    "batchSize": 50,
    "batchDelay": 0,
    "logTiming": false,
    "cacheExpiration": 3600000, // 缓存过期时间（毫秒）
    "minTextLengthToTranslate": 3, // 最小翻译文本长度
    "minTranslateInterval": 500, // 最小翻译间隔（毫秒）
    "observeAttributes": true, // 是否观察属性变化
    "observeSubtree": true, // 是否观察子树变化
    "importantAttributes": ["title", "alt", "aria-label", "placeholder", "data-hovercard-url", "data-hovercard-type"], // 重要的属性列表
    "importantElements": [
      ".HeaderNavlink", ".js-selected-navigation-item", ".js-issue-title",
      ".js-commit-message", ".js-details-container", ".js-comment-body",
      ".js-activity-item", ".js-blob-content", ".js-repo-description",
      ".js-issue-row", ".js-pinned-issue-list-item", ".js-project-card-content",
      ".js-user-profile-bio", ".js-header-search-input", ".js-file-line",
      ".Header-link", ".TabNav-link", ".UnderlineNav-link", ".Label",
      ".btn-primary", ".btn-secondary", ".TimelineItem-body", ".Box-title",
      ".Subhead-heading", ".f4", ".f5", ".text-bold", ".text-semibold",
      ".avatar-user", ".contributor-avatar", ".commit-author", ".issue-author"
    ], // 重要内容元素
    "ignoreElements": [
      "script", "style", "link", "meta", "svg", "canvas",
      "pre", "code", "kbd", "samp", ".blob-code-inner", ".file-line",
      ".highlight", ".language-*", ".mermaid", ".mathjax",
      ".js-zeroclipboard-button", ".js-minimizable-content",
      ".reponav-dropdown", ".dropdown-caret", ".avatar", ".emoji",
      ".blob-code", ".blob-code-marker", ".blob-num", ".blob-num-hunk",
      ".diff-line", ".diff-addition", ".diff-deletion", ".diff-header",
      ".line-comment", ".inline-comment", ".commit-diff-title",
      ".copyable-area", ".copy-button", ".token", ".syntax--",
      ".octicon", ".github-icon", ".icon", ".spinner",
      ".timestamp", ".time-ago", ".relative-time", ".local-time",
      ".sha", ".shortsha", ".commit-sha", ".blob-sha",
      ".username", ".login", ".user-mention", ".team-mention",
      ".repo-name", ".repo-link", ".branch-name", ".tag-name",
      ".file-name", ".file-path", ".directory", ".folder",
      ".language-color", ".repo-language-color", ".color-block",
      ".progress-bar", ".meter", ".counter", ".number",
      ".size", ".bytes", ".count", ".stat", ".statistic",
      ".code-search-result-match", ".search-match", ".highlighted-text",
      ".notification-indicator", ".notification-badge", ".notification-count",
      ".unread-indicator", ".new-indicator", ".badge", ".label"
    ], // 忽略翻译的元素
    "mutationThreshold": 30, // 单次突变数量阈值
    "contentChangeWeight": 1, // 内容变化权重
    "importantChangeWeight": 2, // 重要变化权重
    "translationTriggerRatio": 0.3, // 触发翻译的变化比例
    "enableVirtualDom": true, // 是否启用虚拟DOM优化
    "virtualDomCleanupInterval": 60000, // 虚拟DOM清理间隔（毫秒）
    "virtualDomNodeTimeout": 3600000, // 虚拟DOM节点超时时间（毫秒）
    "useSmartThrottling": true, // 启用智能节流
    "ignoreCharacterDataMutations": false, // 是否忽略字符数据变化（用于性能优化）
    "ignoreAttributeMutations": false, // 是否忽略属性变化（用于性能优化）
    "minContentChangesToTrigger": 3, // 触发翻译的最小内容变化数
    "maxMutationProcessing": 50, // 单次处理的最大突变数
    "enableFullTranslation": true, // 是否启用完整翻译模式
    "networkRequestInterval": 1000, // 网络请求间隔（毫秒）
    "maxTranslationErrorCount": 10, // 最大翻译错误数
    "maxDomErrorCount": 20, // 最大DOM操作错误数
    "maxDictionaryErrorCount": 5, // 最大词典错误数
    "maxNetworkErrorCount": 3, // 最大网络错误数
    "maxPerformanceErrorCount": 15, // 最大性能错误数
    "maxOtherErrorCount": 25 // 最大其他错误数
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
    "codespaces": /\/codespaces/,
    "notifications": /\/notifications/,
    "profile": /\/[\w-]+$/,
    "organizations": /\/organizations/,
    "projects": /\/[\w-]+\/[\w-]+\/projects/,
    "wiki": /\/[\w-]+\/[\w-]+\/wiki/,
    "actions": /\/[\w-]+\/[\w-]+\/actions/,
    "packages": /\/[\w-]+\/[\w-]+\/packages/,
    "security": /\/[\w-]+\/[\w-]+\/security/,
    "insights": /\/[\w-]+\/[\w-]+\/insights/,
    "marketplace": /\/marketplace/,
    "topics": /\/topics/,
    "stars": /\/stars/,
    "trending": /\/trending/
  }
};

export { getVersionFromComment };
