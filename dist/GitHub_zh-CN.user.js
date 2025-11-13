/** GitHub 中文翻译入口文件 */

// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.8.159
// @description  将 GitHub 界面翻译成中文
// @author       Sut
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @exclude      https://github.com/login*
// @exclude      https://github.com/signup*
// @icon         https://github.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @resource     CSS https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n@master/style.min.css
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @run-at       document-start
// @license      MIT
// @updateURL    https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// @downloadURL  https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// ==/UserScript==


// 启动脚本
startScript()

// 作者: Sut
// 此文件用于统一管理GitHub自动化字符串更新工具的版本信息

/**
 * 当前工具版本号
 * @type {string}
 * @description 这是项目的单一版本源，所有其他版本号引用都应从此处获取
 */
const VERSION = '1.8.164'

/**
 * 版本历史记录
 * @type {Array<{version: string, date: string, changes: string[]}>}
 */
const VERSION_HISTORY = [
  {
    version: '1.8.164',
    date: '2025-11-13',
    changes: ['当前版本']
  }
]

/**
 * 工具函数模块
 * 包含各种通用的辅助函数
 */

/**
 * 工具函数集合
 */

const utils = {
    // 节流函数
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
        };
    },

    // 防抖函数
    debounce: function(func, delay) {
        let timeout;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, delay);
        };
    },

    // 延迟函数
    delay: function(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    },

    // 简单的字符串转义
    escapeRegExp: function(string) {
        // 使用数组定义特殊字符，避免转义问题
        const specialChars = ['.', '+', '*', '?', '^', ') {
        const { leading = true, trailing = true } = options
let inThrottle, lastArgs, lastThis, result, timerId

        const later = (context, args) => {
            inThrottle = false
if (trailing && lastArgs) {
                result = func.apply(context, args)
lastArgs = lastThis = null
}
        }

        return function() {
            const args = arguments
const context = this

            if (!inThrottle) {
                if (leading) {
                    result = func.apply(context, args)
}
                inThrottle = true
timerId = setTimeout(() => later(context, args), limit)
} else if (trailing) {
                lastArgs = args
lastThis = context

                // 确保只有一个定时器
                clearTimeout(timerId)
timerId = setTimeout(() => later(lastThis, lastArgs), limit)
}
            
            return result
}
        },
    
    /**
     * 防抖函数，延迟执行函数直到停止触发一段时间
     * 支持返回Promise
     * @param func - 要防抖的函数
     * @param delay - 延迟时间（毫秒）
     * @param options - 配置选项
     * @param options.leading - 是否在开始时执行一次（默认false）
     * @returns 防抖后的函数
     */
    debounce(func, delay, options = {}) {
        const { leading = false } = options
let timeout, result

        const later = (context, args) => {
            result = func.apply(context, args)
}

        return function() {
            const args = arguments
const context = this
const isLeadingCall = !timeout && leading

            clearTimeout(timeout)
timeout = setTimeout(() => later(context, args), delay)

            if (isLeadingCall) {
                result = func.apply(context, args)
}
            
            return result
}
        },
    
    /**
     * 延迟函数，返回Promise的setTimeout
     * @param ms - 延迟时间（毫秒）
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
},

    /**
     * 转义正则表达式中的特殊字符
     * @param string - 要转义的字符串
     * @returns 转义后的字符串
     */
    escapeRegExp(string) {
        // 转义所有正则表达式特殊字符，包括/字符
        return string.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
},
    
    /**
     * 安全地解析JSON字符串
     * @param jsonString - JSON字符串
     * @param {*} defaultValue - 解析失败时的默认值
     * @returns {*} 解析结果或默认值
     */
    safeJSONParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString)
} catch (error) {
            console.warn('[GitHub 中文翻译] JSON解析失败:', error)
return defaultValue
}
        },

    /**
     * 检查正则表达式是否存在潜在的ReDoS风险
     * @param {string|RegExp} pattern - 正则表达式模式
     * @returns - 是否安全
     */
    isSafeRegex(pattern) {
        if (typeof pattern === 'string') {
            pattern = new RegExp(pattern)
}

        const source = pattern.source
let depth = 0
let hasNestedRepetition = false

        // 检查是否存在嵌套的重复量词（ReDoS的主要来源）
        for (let i = 0; i < source.length; i++) {
            const char = source[i]

            if (char === '(' && source[i - 1] !== '\\') {
                depth++
} else if (char === ')' && source[i - 1] !== '\\') {
                depth--
} else if (depth > 0 && /[*+?]/.test(char) && source[i - 1] !== '\\') {
                // 在分组内发现重复量词
                hasNestedRepetition = true
break
}
        }
        
        // 检查是否存在长时间运行的可能性
        const longPatternWarning = source.length > 100; // 过长的正则表达式
        const hasMultipleRepetitions = (source.match(/[*+?]/g) || []).length > 5; // 过多的重复量词
        
        return !hasNestedRepetition && !longPatternWarning && !hasMultipleRepetitions
},

    /**
     * 安全地创建正则表达式，防止ReDoS攻击
     * @param pattern - 正则表达式模式
     * @param flags - 正则表达式标志
     * @returns {RegExp|null} - 安全的正则表达式或null
     */
    safeRegExp(pattern, flags = '') {
        try {
            const regex = new RegExp(pattern, flags)
if (this.isSafeRegex(regex)) {
                return regex
}
            console.warn('[GitHub 中文翻译] 检测到可能存在ReDoS风险的正则表达式:', pattern)
return null
} catch (error) {
            console.warn('[GitHub 中文翻译] 创建正则表达式失败:', error)
return null
}
        },
    
    /**
     * 安全地序列化对象为JSON字符串
     * @param {*} obj - 要序列化的对象
     * @param defaultValue - 序列化失败时的默认值
     * @returns JSON字符串或默认值
     */
    safeJSONStringify(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj)
} catch (error) {
            console.warn('[GitHub 中文翻译] JSON序列化失败:', error)
return defaultValue
}
        },
    
    /**
     * 获取当前页面路径
     * @returns 当前页面的路径
     */
    getCurrentPath() {
        return window.location.pathname
},
    
    /**
     * 获取完整的当前页面URL（包含查询参数）
     * @returns 完整的URL
     */
    getCurrentUrl() {
        return window.location.href
},
    
    /**
     * 判断当前页面是否匹配某个路径模式
     * @param pattern - 路径模式
     * @returns 是否匹配
     */
    isCurrentPathMatch(pattern) {
        return pattern.test(this.getCurrentPath())
},
    
    /**
     * 从URL获取查询参数
     * @param name - 参数名
     * @param url - URL字符串，默认使用当前页面URL
     * @returns {string|null} 参数值或null
     */
    getQueryParam(name, url = window.location.href) {
        const match = RegExp(`[?&]$=([^&]*)`).exec(url)
return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
},
    
    /**
     * 获取URL中的所有查询参数
     * @param url - URL字符串，默认使用当前页面URL
     * @returns 查询参数对象
     */
    getAllQueryParams(url = window.location.href) {
        const params = {}
const searchParams = new URL(url || window.location.href).searchParams
for (const [key, value] of searchParams) {
            params[key] = value
}
        return params
},
    
    /**
     * 收集DOM树中的所有文本节点内容
     * @param element - 要收集文本的起始元素
     * @param {Set<string>} resultSet - 用于存储结果的Set集合
     * @param options - 配置选项
     * @param options.maxLength - 最大文本长度（默认200）
     * @param {string[]} options.skipTags - 跳过的标签名数组
     */
    collectTextNodes(element, resultSet, options = {}) {
        if (!element || !resultSet || typeof resultSet.add !== 'function') return

        const {
            maxLength = 200,
            skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'noscript', 'template']
        } = options

        try {
            // 检查是否需要跳过此元素
            if (element.tagName && skipTags.includes(element.tagName.toLowerCase())) {
                return
}
            
            // 检查元素是否有隐藏类或样式
            if (element.classList && element.classList.contains('sr-only')) {
                return
}
            
            // 遍历所有子节点
            const childNodes = Array.from(element.childNodes || [])
for (const node of childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue ? node.nodeValue.trim() : ''
// 只收集符合条件的文本
                    if (text && 
                        text.length > 0 && 
                        text.length < maxLength && 
                        !/^\d+$/.test(text) &&
                        // 使用基础字符类替代Unicode属性转义，避免构建过程中的解析问题
                        !/^[\s\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A1-\u00BF\u2000-\u206F\u3000-\u303F]+$/.test(text)) {
                        resultSet.add(text)
}
        } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // 递归收集子元素的文本
                    this.collectTextNodes(node, resultSet, options)
}
        }
        } catch (error) {
            console.error('[GitHub 中文翻译] 收集文本节点时出错:', error)
}
        },
    
    /**
     * 安全地访问对象属性，避免嵌套属性访问出错
     * @param obj - 目标对象
     * @param {string|string[]} path - 属性路径，如'a.b.c'或['a','b','c']
     * @param {*} defaultValue - 获取失败时的默认值
     * @returns {*} 属性值或默认值
     */
    getNestedProperty(obj, path, defaultValue = null) {
        try {
            const pathArray = Array.isArray(path) ? path : path.split('.')
let result = obj

            for (const key of pathArray) {
                if (result === null || result === undefined) {
                    return defaultValue
}
                result = result[key]
}
            
            return result === undefined ? defaultValue : result
} catch (error) {
            return defaultValue
}
        },
    
    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
        try {
            if (obj === null || typeof obj !== 'object') return obj
if (obj instanceof Date) return new Date(obj.getTime())
if (obj instanceof Array) return obj.map(item => this.deepClone(item))
if (obj instanceof Object) {
                const clonedObj = {}
for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        clonedObj[key] = this.deepClone(obj[key])
}
        }
                return clonedObj
}
        } catch (error) {
            console.warn('[GitHub 中文翻译] 深拷贝失败:', error)
return obj
}
        },
    
    /**
     * 安全地执行函数，捕获可能的异常
     * @param fn - 要执行的函数
     * @param {*} defaultValue - 执行失败时的默认返回值
     * @param context - 函数执行上下文
     * @param {...*} args - 函数参数
     * @returns {*} 函数返回值或默认值
     */
    safeExecute(fn, defaultValue = null, context = null, ...args) {
        try {
            if (typeof fn === 'function') {
                return fn.apply(context, args)
}
            return defaultValue
} catch (error) {
            console.error('[GitHub 中文翻译] 安全执行函数失败:', error)
return defaultValue
}
        }
}

/**
 * GitHub 中文翻译配置文件
 * 包含脚本所有可配置项
 */

// 导入版本常量（从单一版本源）
// 定义greasemonkeyInfo以避免未定义错误，使用空值合并运算符提高代码可读性
const greasemonkeyInfo = typeof window !== 'undefined' ? window.GM_info ?? {} : {}

/**
 * 从用户脚本头部注释中提取版本号
 * @returns 版本号
 */
function getVersionFromComment() {
  try {
    // 作为用户脚本，我们可以直接从当前执行环境中提取版本信息
    const versionMatch = greasemonkeyInfo?.script?.version
if (versionMatch) {
      return versionMatch
}

    // 如果greasemonkeyInfo不可用，返回配置中的版本号
    return VERSION
} catch (e) {
    // 出错时返回配置中的版本号
    return VERSION
}
        }

/**
 * 配置对象，包含所有可配置项
 */
const CONFIG = {
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
      ".js-user-profile-bio", ".js-header-search-input", ".js-file-line"
    ], // 重要内容元素
    "ignoreElements": [
      "script", "style", "link", "meta", "svg", "canvas",
      "pre", "code", "kbd", "samp", ".blob-code-inner", ".file-line",
      ".highlight", ".language-*", ".mermaid", ".mathjax",
      ".js-zeroclipboard-button", ".js-minimizable-content",
      ".reponav-dropdown", ".dropdown-caret", ".avatar", ".emoji"
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
        }

/**
 * 版本更新检查模块
 * 负责检查和处理脚本更新
 */
const = require('./config.js')
const = require('./utils.js')

/**
 * 版本检查器对象
 */
const versionChecker = {
  /**
   * 检查版本更新
   * 支持重试机制和更详细的错误处理
   * @returns {Promise<boolean>} 检查完成的Promise，resolve为是否发现更新
   */
  async checkForUpdates() {
    // 检查是否启用了更新检查
    if (!CONFIG.updateCheck.enabled) {
      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 已禁用更新检查')
}
      return false
}

    // 检查是否达到检查间隔
    const lastCheck = localStorage.getItem('githubZhLastUpdateCheck')
const now = Date.now()
const intervalMs = (CONFIG.updateCheck.intervalHours || 24) * 60 * 60 * 1000

    if (lastCheck && now - parseInt(lastCheck) < intervalMs) {
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 未达到更新检查间隔，跳过检查 (上次检查: ${new Date(parseInt(lastCheck)).toLocaleString()})`)
}
      return false
}

    try {
      // 记录本次检查时间
      localStorage.setItem('githubZhLastUpdateCheck', now.toString())

      // 使用带重试的获取方法
      const scriptContent = await this.fetchWithRetry(CONFIG.updateCheck.scriptUrl)

      // 提取远程版本号 - 支持多种格式
      const remoteVersion = this.extractVersion(scriptContent)

      if (!remoteVersion) {
        throw new Error('无法从远程脚本提取有效的版本号')
}

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 当前版本: ${CONFIG.version}, 远程版本: $`)
}

      // 比较版本号
      if (this.isNewerVersion(remoteVersion, CONFIG.version)) {
        // 显示更新通知
        this.showUpdateNotification(remoteVersion)

        // 如果启用了自动更新版本号
        if (CONFIG.updateCheck.autoUpdateVersion) {
          this.updateVersionInStorage(remoteVersion)
}

        // 记录版本历史
        this.recordVersionHistory(remoteVersion)

        return true
}

      return false
} catch (error) {
      const errorMsg = `[GitHub 中文翻译] 检查更新时发生错误: ${error.message || error}`
if (CONFIG.debugMode) {
        console.error(errorMsg, error)
}

      // 记录错误日志
      try {
        localStorage.setItem('githubZhUpdateError', JSON.stringify({
          message: error.message,
          timestamp: now
        }))
} catch (e) {
        // 忽略存储错误
      }

      return false
}
        },

  /**
   * 带重试机制的网络请求
   * @param url - 请求URL
   * @param maxRetries - 最大重试次数
   * @param retryDelay - 重试间隔（毫秒）
   * @returns {Promise<string>} 响应文本
   */
  async fetchWithRetry(url, maxRetries = 2, retryDelay = 1000) {
    let lastError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (CONFIG.debugMode && attempt > 0) {
          console.log(`[GitHub 中文翻译] 重试更新检查 ($/$)...`)
}

        // 自定义超时控制
        const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Accept': 'text/javascript, text/plain, */*'
          },
          signal: controller.signal,
          credentials: 'omit' // 不发送凭证信息
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP错误! 状态码: ${response.status}`)
}

        return await response.text()
} catch (error) {
        lastError = error

        // 如果是最后一次尝试，则抛出错误
        if (attempt === maxRetries) {
          throw error
}

        // 等待后重试
        await utils.delay(retryDelay * Math.pow(2, attempt)); // 指数退避策略
      }
        }

    throw lastError
},

  /**
   * 从脚本内容中提取版本号
   * 支持多种版本号格式
   * @param content - 脚本内容
   * @returns {string|null} 提取的版本号或null
   */
  extractVersion(content) {
    // 尝试多种版本号格式
    const patterns = [
      // UserScript格式
      /\/\*\s*@version\s+(\d+\.\d+\.\d+)\s*\*\//i,
      // JavaScript注释格式
      /\/\/\s*version\s*:\s*(\d+\.\d+\.\d+)/i,
      // 变量赋值格式
      /version\s*=\s*['"](\d+\.\d+\.\d+)['"]/i,
      // 对象属性格式
      /version:\s*['"](\d+\.\d+\.\d+)['"]/i
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
if (match && match[1]) {
                return match[1]
            }

    return null
},

  /**
   * 比较版本号，判断是否有新版本
   * @param newVersion - 新版本号
   * @param currentVersion - 当前版本号
   * @returns 是否有新版本
   */
  isNewerVersion(newVersion, currentVersion) {
    // 将版本号转换为数组进行比较
    const newParts = newVersion.split('.').map(Number)
const currentParts = currentVersion.split('.').map(Number)

    // 比较每个部分
    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0
const currentPart = currentParts[i] || 0

      if (newPart > currentPart) {
        return true
} else if (newPart < currentPart) {
        return false
}
        }

    // 版本号相同
    return false
},

  /**
   * 显示更新通知
   * 使用安全的DOM操作而不是innerHTML
   * @param newVersion - 新版本号
   */
  showUpdateNotification(newVersion) {
    const notificationKey = 'githubZhUpdateNotificationDismissed'
const notificationVersionKey = 'githubZhLastNotifiedVersion'

    // 获取最后通知的版本
    const lastNotifiedVersion = localStorage.getItem(notificationVersionKey)

    // 如果用户已经关闭过通知，或者已经通知过相同版本，则不显示
    if (localStorage.getItem(notificationKey) === 'dismissed' ||
      lastNotifiedVersion === newVersion) {
      if (CONFIG.debugMode && lastNotifiedVersion === newVersion) {
        console.log(`[GitHub 中文翻译] 已经通知过版本 ${newVersion}的更新`)
}
      return
}

    try {
      // 创建通知元素 - 安全的DOM操作
      const notification = document.createElement('div')
notification.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md transform transition-all duration-300 translate-y-0 opacity-100'

      // 生成唯一的ID
      const notificationId = `github-zh-update-${Date.now()}`
notification.id = notificationId

      // 创建flex容器
      const flexContainer = document.createElement('div')
flexContainer.className = 'flex items-start'
notification.appendChild(flexContainer)

      // 创建图标容器
      const iconContainer = document.createElement('div')
iconContainer.className = 'flex-shrink-0 bg-blue-100 rounded-full p-2'
flexContainer.appendChild(iconContainer)

      // 创建SVG图标
      const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svgIcon.setAttribute('class', 'h-6 w-6 text-blue-600')
svgIcon.setAttribute('fill', 'none')
svgIcon.setAttribute('viewBox', '0 0 24 24')
svgIcon.setAttribute('stroke', 'currentColor')
iconContainer.appendChild(svgIcon)

      // 创建SVG路径
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
pathElement.setAttribute('stroke-linecap', 'round')
pathElement.setAttribute('stroke-linejoin', 'round')
pathElement.setAttribute('stroke-width', '2')
pathElement.setAttribute('d', 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z')
svgIcon.appendChild(pathElement)

      // 创建内容容器
      const contentContainer = document.createElement('div')
contentContainer.className = 'ml-3 flex-1'
flexContainer.appendChild(contentContainer)

      // 创建标题
      const titleElement = document.createElement('p')
titleElement.className = 'text-sm font-medium text-blue-800'
titleElement.textContent = 'GitHub 中文翻译脚本更新'
contentContainer.appendChild(titleElement)

      // 创建消息文本 - 安全地设置文本内容
      const messageElement = document.createElement('p')
messageElement.className = 'text-sm text-blue-700 mt-1'
messageElement.textContent = `发现新版本 ${newVersion}，建议更新以获得更好的翻译体验。`
contentContainer.appendChild(messageElement)

      // 创建按钮容器
      const buttonsContainer = document.createElement('div')
buttonsContainer.className = 'mt-3 flex space-x-2'
contentContainer.appendChild(buttonsContainer)

      // 创建更新按钮 - 安全地设置URL
      const updateButton = document.createElement('a')
updateButton.id = `$-update-btn`
updateButton.href = CONFIG.updateCheck.scriptUrl || '#'
updateButton.target = '_blank'
updateButton.rel = 'noopener noreferrer'
updateButton.className = 'inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors'
updateButton.textContent = '立即更新'
buttonsContainer.appendChild(updateButton)

      // 创建稍后按钮
      const laterButton = document.createElement('button')
laterButton.id = `$-later-btn`
laterButton.className = 'inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-transparent hover:bg-blue-50 transition-colors'
laterButton.textContent = '稍后'
laterButton.addEventListener('click', () => {
        this.hideNotification(notification, false)
})
buttonsContainer.appendChild(laterButton)

      // 创建不再提醒按钮
      const dismissButton = document.createElement('button')
dismissButton.id = `$-dismiss-btn`
dismissButton.className = 'inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors'
dismissButton.textContent = '不再提醒'
dismissButton.addEventListener('click', () => {
        this.hideNotification(notification, true)
})
buttonsContainer.appendChild(dismissButton)

      // 添加到DOM
      if (document.body) {
        document.body.appendChild(notification)

        // 记录本次通知的版本
        localStorage.setItem(notificationVersionKey, newVersion)

        // 自动隐藏（可选）
        if (CONFIG.updateCheck.autoHideNotification !== false) {
          setTimeout(() => {
            this.hideNotification(notification, false)
}, 20000); // 20秒后自动隐藏
        }

        if (CONFIG.debugMode) {
          console.log(`[GitHub 中文翻译] 显示更新通知: 版本 ${newVersion}`)
}
        }
    } catch (error) {
      console.error('[GitHub 中文翻译] 创建更新通知失败:', error)
}
        },

  /**
   * 隐藏通知元素（带动画效果）
   * @param notification - 通知元素
   * @param permanently - 是否永久隐藏
   */
  hideNotification(notification, permanently = false) {
    try {
      // 添加动画效果
      notification.style.transform = 'translateY(20px)'
notification.style.opacity = '0'

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
}
        }, 300)

      // 如果是永久隐藏，记录到localStorage
      if (permanently) {
        localStorage.setItem('githubZhUpdateNotificationDismissed', 'dismissed')
if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 更新通知已永久隐藏')
}
        }
    } catch (error) {
      console.error('[GitHub 中文翻译] 隐藏通知失败:', error)
}
        },

  /**
   * 记录版本历史
   * @param version - 版本号
   */
  recordVersionHistory(version) {
    try {
      const historyKey = 'githubZhVersionHistory'
let history = utils.safeJSONParse(localStorage.getItem(historyKey), [])

      // 确保是数组
      if (!Array.isArray(history)) {
        history = []
}

      // 添加新版本记录
      history.push({
        version,
        detectedAt: Date.now()
      })

      // 限制历史记录数量
      if (history.length > 10) {
        history = history.slice(-10)
}

      localStorage.setItem(historyKey, JSON.stringify(history))
} catch (error) {
      // 忽略存储错误
    }
        },

  /**
   * 更新本地存储中的版本号
   * @param newVersion - 新版本号
   */
  updateVersionInStorage(newVersion) {
    try {
      const cacheData = {
        version: newVersion,
        cachedAt: Date.now(),
        currentVersion: CONFIG.version
      }

      localStorage.setItem('githubZhCachedVersion', utils.safeJSONStringify(cacheData))

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 已缓存新版本号: ${newVersion}(缓存时间: ${new Date().toLocaleString()})`)
}

      return true
} catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 更新缓存版本号时出错:', error)
}
      return false
}
        },

  /**
   * 获取缓存的版本信息
   * @returns {Object|null} 缓存的版本数据
   */
  getCachedVersion() {
    try {
      const cachedData = utils.safeJSONParse(localStorage.getItem('githubZhCachedVersion'))
return cachedData
} catch (error) {
      return null
}
        },

  /**
   * 清除更新通知的忽略状态
   * 允许再次显示更新通知
   */
  clearNotificationDismissal() {
    try {
      localStorage.removeItem('githubZhUpdateNotificationDismissed')
localStorage.removeItem('githubZhLastNotifiedVersion')

      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 已清除更新通知忽略状态')
}

      return true
} catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 清除通知忽略状态失败:', error)
}
      return false
}
        }
}

module.exports = 

/**
 * 翻译词典合并模块
 * 整合所有页面的翻译词典
 */
/**
 * 翻译词典对象，包含所有需要翻译的字符串
 */
const translationModule = {
    "common": commonDictionary,
    "codespaces": codespacesDictionary,
    "explore": exploreDictionary
    // 可以根据需要添加更多页面的词典
}

/**
 * 合并所有词典为一个完整的词典对象
 * @returns 合并后的词典
 */
function mergeAllDictionaries() {
    const merged = {}
for (const module in translationModule) {
        Object.assign(merged, translationModule[module])
}
    return merged
}

/**
 * 通用翻译词典
 * 包含所有页面共用的翻译字符串
 */
const commonDictionary = {
  "common": {
    "search": "搜索",
    "new": "新建",
    "actions": "操作",
    "settings": "设置",
    "help": "帮助",
    "sign_in": "登录",
    "sign_up": "注册"
  }
        }

/**
 * Codespaces 页面翻译词典
 */
const codespacesDictionary = {
    "Skip to content": "待翻译: Skip to content",
    "You signed in with another tab or window. Reload to refresh your session.": "待翻译: You signed in with another tab or window. Reload to refresh your session.",
    "Reload": "待翻译: Reload",
    "You signed out in another tab or window. Reload to refresh your session.": "待翻译: You signed out in another tab or window. Reload to refresh your session.",
    "Dismiss alert": "待翻译: Dismiss alert",
    "Uh oh!

              There was an error while loading. Please reload this page.": "待翻译: Uh oh!

              There was an error while loading. Please reload this page.",
    "Uh oh!": "待翻译: Uh oh!",
    "There was an error while loading. Please reload this page.": "待翻译: There was an error while loading. Please reload this page.",
    "Please reload this page": "待翻译: Please reload this page",
    "Sign in with a passkey": "待翻译: Sign in with a passkey",
    "Terms": "待翻译: Terms",
    "Privacy": "待翻译: Privacy",
    "Docs": "待翻译: Docs",
    "Manage cookies": "待翻译: Manage cookies",
    "Do not share my personal information": "待翻译: Do not share my personal information",
    "You can't perform that action at this time.": "待翻译: You can't perform that action at this time."
}

/**
 * Explore 页面翻译词典
 */
const exploreDictionary = {
  "Navigation Menu": "导航菜单",
  "Toggle navigation": "切换导航",
  "Sign in
          
              
    
        
    

Appearance settings": "登录
          
              
    
        
    

外观设置",
  "Sign in": "登录",
  "Appearance settings": "外观设置",
  "New": "新建",
  "Actions

        

        Automate any workflow": "Actions

        

        自动化任何工作流",
  "Actions": "Actions",
  "Codespaces

        

        Instant dev environments": "Codespaces

        

        即时开发环境",
  "Issues

        

        Plan and track work": "Issues

        

        计划和跟踪工作",
  "Issues": "问题",
  "Code Review

        

        Manage code changes": "代码审查

        

        管理代码变更",
  "Code Review": "代码审查",
  "Discussions

        

        Collaborate outside of code": "讨论

        

        代码外的协作",
  "Code Search

        

        Find more, search less": "代码搜索

        

        查找更多，搜索更少",
  "Code Search": "代码搜索",
  "Explore": "探索",
  "Blog": "博客",
  "MCP Registry": "MCP 注册表",
  "View all features": "查看全部功能",
  "By company size": "按公司规模",
  "Small and medium teams": "中小型团队",
  "By use case": "按使用场景",
  "App Modernization": "应用现代化",
  "DevOps": "开发运维",
  "CI/CD": "持续集成/持续部署",
  "View all use cases": "查看全部使用场景",
  "By industry": "按行业",
  "Financial services": "金融服务",
  "View all industries": "查看全部行业",
  "View all solutions": "查看全部解决方案",
  "Topics": "主题",
  "AI": "人工智能",
  "Software Development": "软件开发",
  "View all": "查看全部",
  "Learning Pathways": "学习路径",
  "Events & Webinars": "活动与网络研讨会",
  "Ebooks & Whitepapers": "电子书与白皮书",
  "Customer Stories": "客户案例",
  "Executive Insights": "高管见解",
  "Open Source": "开源",
  "The ReadME Project": "ReadME 项目",
  "Enterprise platform

        

        AI-powered developer platform": "企业平台

        

        人工智能驱动的开发者平台",
  "Enterprise platform": "企业平台",
  "Available add-ons": "可用附加组件",
  "Copilot for business

        

        Enterprise-grade AI features": "商业版 Copilot

        

        企业级人工智能功能",
  "Copilot for business": "商业版 Copilot",
  "Premium Support

        

        Enterprise-grade 24/7 support": "高级支持

        

        企业级 24/7 支持",
  "Premium Support": "高级支持",
  "Pricing": "价格",
  "Search or jump to...": "搜索或跳转到...",
  "Search": "搜索",
  "Clear": "清除",
  "Search syntax tips": "搜索语法提示",
  "Provide feedback": "提供反馈",
  "We read every piece of feedback, and take your input very seriously.": "我们会阅读每一条反馈，并非常重视您的意见。",
  "Cancel

              Submit feedback": "取消

              提交反馈",
  "Cancel": "取消",
  "Submit feedback": "提交反馈",
  "Saved searches
      
        Use saved searches to filter your results more quickly": "已保存的搜索
      
        使用已保存的搜索更快地筛选结果",
  "Saved searches": "已保存的搜索",
  "Use saved searches to filter your results more quickly": "使用已保存的搜索更快地筛选结果",
  "Name": "名称",
  "Query": "查询",
  "To see all available qualifiers, see our documentation.": "查看我们的文档了解所有可用的限定符。",
  "Cancel

              Create saved search": "取消

              创建已保存的搜索",
  "Create saved search": "创建已保存的搜索",
  "Sign up": "注册",
  "Resetting focus": "重置焦点",
  "Events": "活动",
  "Collections
    Curated lists and insight into burgeoning industries, topics, and communities.": "收藏集
    精选列表和对新兴行业、主题和社区的洞察。",
  "Curated lists and insight into burgeoning industries, topics, and communities.": "精选列表和对新兴行业、主题和社区的洞察。",
  "Pixel Art Tools": "像素艺术工具",
  "Learn to Code
    Resources to help people learn to code": "学习编程
    帮助人们学习编程的资源",
  "Learn to Code": "学习编程",
  "Resources to help people learn to code": "帮助人们学习编程的资源",
  "#
    Game Engines
    Frameworks for building games across multiple platforms.": "#
    游戏引擎
    用于跨平台构建游戏的框架。",
  "Game Engines": "游戏引擎",
  "Frameworks for building games across multiple platforms.": "用于跨平台构建游戏的框架。",
  "How to choose (and contribute to) your first open source project": "如何选择（并贡献于）您的第一个开源项目",
  "Clean code linters": "代码整洁检查工具",
  "Open journalism": "开放新闻业",
  "Design essentials": "设计基础",
  "#
    

    
      Music
      Drop the code bass with these musically themed repositories.": "#
    

    
      音乐
      用这些音乐主题的仓库释放代码节奏。",
  "Music
      Drop the code bass with these musically themed repositories.": "音乐
      用这些音乐主题的仓库释放代码节奏。",
  "Music": "音乐",
  "Government apps": "政府应用",
  "DevOps tools": "DevOps 工具",
  "Front-end JavaScript frameworks": "前端 JavaScript 框架",
  "Hacking Minecraft": "Minecraft 黑客技术",
  "JavaScript Game Engines": "JavaScript 游戏引擎",
  "Learn to Code
      Resources to help people learn to code": "学习编程
      帮助人们学习编程的资源",
  "Getting started with machine learning": "机器学习入门",
  "Made in Africa": "非洲制造",
  "Net neutrality
      Software, research, and organizations protecting the free and open internet.": "网络中立性
      保护自由开放互联网的软件、研究和组织。",
  "Net neutrality": "网络中立性",
  "Open data": "开放数据",
  "Open source organizations
      A showcase of organizations showcasing their open source projects.": "开源组织
      展示开源项目的组织展示。",
  "Open source organizations": "开源组织",
  "Software productivity tools": "软件生产力工具",
  "Load more…": "加载更多…",
  "Footer": "页脚",
  "Footer navigation": "页脚导航",
  "Status": "状态",
  "Contact": "联系",
  "The Download": "The Download",
  "Get the latest developer and open source news": "获取最新的开发者和开源新闻",
  "Trending repository": "热门仓库",
  "juspay          /
          hyperswitch": "juspay          /
          hyperswitch",
  "juspay": "juspay",
  "Star
          35.6k": "星标
          35.6k",
  "Star": "星标",
  "35.6k": "35.6k",
  "Code": "代码",
  "Pull requests": "拉取请求",
  "An open source payments switch written in Rust to make payments fast, reliable and affordable": "一个用 Rust 编写的开源支付交换机，使支付变得快速、可靠且经济实惠",
  "rust": "rust",
  "redis": "redis",
  "open-source": "开源",
  "finance": "金融",
  "sdk": "SDK",
  "high-performance": "高性能",
  "beginner-friendly": "对初学者友好",
  "works-with-react": "兼容 React",
  "Updated
            Oct 4, 2025": "更新于
            2025年10月4日"
}

/**
 * 翻译核心模块
 * 负责页面内容的实际翻译工作
 */
/**
 * Trie树数据结构，用于高效的字符串匹配
 * 优化部分匹配算法的性能
 */
class TrieNode {
    constructor() {
        this.children = new Map()
this.isEndOfWord = false
this.value = null
this.length = 0
}
        }

class Trie {
    constructor() {
        this.root = new TrieNode()
this.size = 0
}

    /**
     * 向Trie树中插入一个单词及其翻译
     * @param word - 要插入的单词
     * @param value - 翻译结果
     */
    insert(word, value) {
        if (!word || typeof word !== 'string' || word.length === 0) {
            return
}

        let node = this.root
for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode())
}
            node = node.children.get(char)
}
        node.isEndOfWord = true
node.value = value
node.length = word.length
this.size++
}

    /**
     * 在Trie树中查找所有匹配的单词
     * @param text - 要查找的文本
     * @returns 匹配结果数组
     */
    findAllMatches(text) {
        if (!text || typeof text !== 'string' || text.length === 0) {
            return []
}

        const matches = []
const textLen = text.length

        for (let i = 0; i < textLen; i++) {
            let node = this.root
let currentWord = ''

            for (let j = i; j < textLen; j++) {
                const char = text[j]
if (!node.children.has(char)) {
                    break
}

                node = node.children.get(char)
currentWord += char

                if (node.isEndOfWord) {
                    matches.push({
                        key: currentWord,
                        value: node.value,
                        start: i,
                        end: j,
                        length: node.length
                    })
}
        }
        }

        return matches
}

    /**
     * 清空Trie树
     */
    clear() {
        this.root = new TrieNode()
this.size = 0
}

    /**
     * 获取Trie树的大小
     * @returns Trie树中的单词数量
     */
    getSize() {
        return this.size
}
        }

/**
 * 翻译核心对象
 */
const translationCore = {
  /**
   * 合并后的完整词典
   * @type */
  dictionary: {},

  /**
   * 翻译缓存项结构
   * @typedef CacheItem
   * @property value - 缓存的值
   * @property timestamp - 最后访问时间戳
   * @property accessCount - 访问次数
   */

  /**
   * 翻译缓存，用于存储已翻译过的文本
   * @type {Map<string, CacheItem>}
   */
  translationCache: new Map(),

  /**
   * DOM元素缓存，用于存储元素的翻译状态
   * 使用WeakMap可以避免内存泄漏
   * @type {WeakMap<Element, boolean>}
   */
  elementCache: new WeakMap(),

  /**
   * 词典哈希表，用于快速查找
   * @type {Map<string, string>}
   */
  dictionaryHash: new Map(),

  /**
   * Trie树数据结构，用于高效的部分匹配
   * @type */
  dictionaryTrie: new Trie(),

  /**
   * 正则表达式缓存，避免重复创建
   * @type */
  regexCache: new Map(),

  /**
   * 缓存统计信息
   */
  cacheStats: {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  },

  /**
   * 性能监控数据
   */
  performanceData: {
    translateStartTime: 0,
    elementsProcessed: 0,
    textsTranslated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheEvictions: 0,
    cacheCleanups: 0
  },

  /**
   * 当前页面模式
   * @type */
  currentPageMode: null,

  /**
   * 页面模式配置，定义不同页面模式的特定翻译策略
   */
  pageModeConfig: {
    default: {
      batchSize: CONFIG.performance.batchSize,
      enablePartialMatch: CONFIG.performance.enablePartialMatch
    },
    search: {
      batchSize: 100, // 搜索页面可能有更多元素
      enablePartialMatch: false // 搜索页面更注重精确匹配
    },
    repository: {
      batchSize: 50,
      enablePartialMatch: false
    },
    issues: {
      batchSize: 75,
      enablePartialMatch: true // 问题描述可能包含需要部分匹配的文本
    },
    pullRequests: {
      batchSize: 75,
      enablePartialMatch: true // PR描述和评论可能需要部分匹配
    },
    explore: {
      batchSize: 100,
      enablePartialMatch: false
    },
    notifications: {
      batchSize: 60,
      enablePartialMatch: true // 通知内容可能需要部分匹配
    },
    marketplace: {
      batchSize: 80,
      enablePartialMatch: true // 插件描述可能需要部分匹配
    },
    codespaces: {
      batchSize: 50,
      enablePartialMatch: false
    },
    wiki: {
      batchSize: 120,
      enablePartialMatch: true // Wiki页面内容可能需要部分匹配
    },
    actions: {
      batchSize: 60,
      enablePartialMatch: false
    }
        },

  /**
   * 初始化词典
   */
  initDictionary() {
    try {
      if (CONFIG.debugMode) {
        console.time('[GitHub 中文翻译] 词典初始化')
}

      this.dictionary = mergeAllDictionaries()

      // 初始化词典哈希表和Trie树，提高查找效率
      this.dictionaryHash.clear()
this.dictionaryTrie.clear()
this.regexCache.clear()

      Object.keys(this.dictionary).forEach(key => {
        // 只添加非待翻译的有效条目
        if (!this.dictionary[key].startsWith('待翻译: ')) {
          this.dictionaryHash.set(key, this.dictionary[key])
// 同时添加小写和大写版本，优化大小写不敏感匹配
          if (key.length <= 100) {
            this.dictionaryHash.set(key.toLowerCase(), this.dictionary[key])
this.dictionaryHash.set(key.toUpperCase(), this.dictionary[key])
}
          
          // 添加到Trie树中，用于高效的部分匹配
          this.dictionaryTrie.insert(key)
}
        })

      if (CONFIG.debugMode) {
        console.timeEnd('[GitHub 中文翻译] 词典初始化')
console.log(`[GitHub 中文翻译] 词典条目数量: ${Object.keys(this.dictionary).length}`)
console.log(`[GitHub 中文翻译] 哈希表条目数量: ${this.dictionaryHash.size}`)
console.log(`[GitHub 中文翻译] Trie树条目数量: ${this.dictionaryTrie.getSize()}`)
}
        } catch (error) {
      ErrorHandler.handleError('词典初始化', error, ErrorHandler.ERROR_TYPES.DICTIONARY)
// 提供一个空的默认词典作为回退
      this.dictionary = {}
this.dictionaryHash.clear()
this.dictionaryTrie.clear()
this.regexCache.clear()
}
        },

  /**
   * 检测当前页面模式
   * @returns 当前页面模式
   */
  detectPageMode() {
    try {
      const currentPath = window.location.pathname

      // 优先检测精确匹配的特殊页面
      for (const [mode, pattern] of Object.entries(CONFIG.pagePatterns)) {
        if (pattern && pattern instanceof RegExp && pattern.test(currentPath)) {
          // 特殊处理仓库页面的匹配优先级
          if (mode === 'repository') {
            // 确保不是其他更具体的仓库子页面
            const isSubPage = ['issues', 'pullRequests', 'projects', 'wiki', 'actions', 'packages', 'security', 'insights']
              .some(subMode => CONFIG.pagePatterns[subMode]?.test(currentPath))
if (!isSubPage) {
              this.currentPageMode = mode
return mode
}
        } else {
            this.currentPageMode = mode
return mode
}
        }
      }

      // 默认模式
      this.currentPageMode = 'default'
return 'default'
} catch (error) {
      if (CONFIG.debugMode) {
        console.warn('[GitHub 中文翻译] 检测页面模式失败:', error)
}
      this.currentPageMode = 'default'
return 'default'
}
        },

  /**
   * 获取当前页面模式的配置
   * @returns 页面模式配置
   */
  getCurrentPageModeConfig() {
    const mode = this.currentPageMode || this.detectPageMode()
return this.pageModeConfig[mode] || this.pageModeConfig.default
},

  /**
   * 执行翻译
   * 支持翻译整个页面或指定的元素区域
   * @param {HTMLElement[]} [targetElements] - 可选的目标元素数组，只翻译这些元素
   * @returns {Promise<void>} 翻译完成的Promise
   */
  translate(targetElements = null) {
    // 确保词典已初始化
    if (!this.dictionary || Object.keys(this.dictionary).length === 0) {
      this.initDictionary()
}

    // 检测当前页面模式
    const pageMode = this.detectPageMode()
const modeConfig = this.getCurrentPageModeConfig()

    if (CONFIG.debugMode) {
      console.log(`[GitHub 中文翻译] 当前页面模式: $`, modeConfig)
}

    // 重置性能统计数据
    this.resetPerformanceData()
this.performanceData.translateStartTime = Date.now()

    return new Promise((resolve, reject) => {
      try {
        let elements

        if (Array.isArray(targetElements)) {
          // 如果提供了目标元素，只翻译这些元素
          elements = targetElements.filter(el => el && el instanceof HTMLElement)
if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译特定区域，目标元素数量: ${elements.length}`)
}
        } else {
          // 否则翻译整个页面
          elements = this.getElementsToTranslate()
if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译整个页面，目标元素数量: ${elements.length}`)
}
        }

        // 检查是否有元素需要翻译
        if (!elements || elements.length === 0) {
          if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 没有找到需要翻译的元素')
}
          this.logPerformanceData()
resolve()
return
}

        // 批量处理元素，避免长时间运行导致UI阻塞
        this.processElementsInBatches(elements)
          .then(() => {
            // 记录翻译结束时间
            this.performanceData.translateEndTime = Date.now()
// 记录性能数据
            this.logPerformanceData()
resolve()
})
          .catch((batchError) => {
            // 使用ErrorHandler处理批处理错误
            ErrorHandler.handleError('批处理过程', batchError, ErrorHandler.ERROR_TYPES.TRANSLATION, {
              retryable: true,
              recoveryFn: () => {
                // 错误恢复机制：尝试继续执行基本翻译
                this.translateCriticalElementsOnly()
                  .then(() => {
                    // 记录翻译结束时间
                    this.performanceData.translateEndTime = Date.now()
this.logPerformanceData()
resolve(); // 即使有错误，也尽量完成基本翻译
                  })
                  .catch((recoverError) => {
                    ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION)
// 记录翻译结束时间
                    this.performanceData.translateEndTime = Date.now()
this.logPerformanceData()
reject(recoverError)
})
},
              maxRetries: 2
            })
})
} catch (error) {
        // 使用ErrorHandler处理翻译过程中的错误
        ErrorHandler.handleError('翻译过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION, {
          retryable: true,
          recoveryFn: () => {
            // 错误恢复机制：尝试继续执行基本翻译
            this.translateCriticalElementsOnly()
              .then(() => {
                this.logPerformanceData()
resolve(); // 即使有错误，也尽量完成基本翻译
              })
              .catch((recoverError) => {
                ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION)
this.logPerformanceData()
reject(recoverError)
})
},
          maxRetries: 2
        })
}
        })
},

  /**
   * 重置性能统计数据
   */
  /**
   * 重置性能数据
   */
  resetPerformanceData() {
    this.performanceData = {
      translateStartTime: 0,
      translateEndTime: 0,
      elementsProcessed: 0,
      textsTranslated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheEvictions: 0,
      cacheCleanups: 0,
      domOperations: 0,
      domOperationTime: 0,
      networkRequests: 0,
      networkRequestTime: 0,
      dictionaryLookups: 0,
      partialMatches: 0,
      batchProcessings: 0,
      errorCount: 0,
      totalMemory: 0
    }
        },

  /**
   * 记录性能数据
   */
  logPerformanceData() {
    if (CONFIG.debugMode && CONFIG.performance.logTiming) {
      const duration = Date.now() - this.performanceData.translateStartTime
console.log(`[GitHub 中文翻译] 性能数据 - 总耗时: $ms`)
console.log(`  元素处理: ${this.performanceData.elementsProcessed}`)
console.log(`  文本翻译: ${this.performanceData.textsTranslated}`)
console.log(`  缓存命中: ${this.performanceData.cacheHits}`)
console.log(`  缓存未命中: ${this.performanceData.cacheMisses}`)
console.log(`  缓存驱逐: ${this.performanceData.cacheEvictions}`)
console.log(`  缓存清理: ${this.performanceData.cacheCleanups}`)
console.log(`  DOM操作: ${this.performanceData.domOperations} (${this.performanceData.domOperationTime}ms)`)
console.log(`  网络请求: ${this.performanceData.networkRequests} (${this.performanceData.networkRequestTime}ms)`)
console.log(`  字典查询: ${this.performanceData.dictionaryLookups}`)
console.log(`  部分匹配: ${this.performanceData.partialMatches}`)
console.log(`  批处理次数: ${this.performanceData.batchProcessings}`)
console.log(`  错误次数: ${this.performanceData.errorCount}`)
}
        },

  /**
   * 记录单个性能事件
   * @param eventType - 事件类型
   * @param data - 事件数据
   */
  recordPerformanceEvent(eventType, data = {}) {
    switch (eventType) {
      case 'dom-operation':
        this.performanceData.domOperations++
this.performanceData.domOperationTime += data.duration || 0
break
case 'network-request':
        this.performanceData.networkRequests++
this.performanceData.networkRequestTime += data.duration || 0
break
case 'dictionary-lookup':
        this.performanceData.dictionaryLookups++
break
case 'partial-match':
        this.performanceData.partialMatches++
break
case 'batch-processing':
        this.performanceData.batchProcessings++
break
case 'error':
        this.performanceData.errorCount++
break
default:
        break
}
        },

  /**
   * 获取当前性能统计数据
   * @returns - 性能统计数据
   */
  getPerformanceStats() {
    const stats = { ...this.performanceData }
if (stats.translateStartTime > 0) {
      stats.totalDuration = stats.translateEndTime > 0 
        ? stats.translateEndTime - stats.translateStartTime 
        : Date.now() - stats.translateStartTime
} else {
      stats.totalDuration = 0
}
    
    // 计算缓存命中率
    const totalCacheRequests = stats.cacheHits + stats.cacheMisses
stats.cacheHitRate = totalCacheRequests > 0 
      ? (stats.cacheHits / totalCacheRequests * 100).toFixed(2) + '%' 
      : '0%'

    // 计算平均DOM操作时间
    stats.avgDomOperationTime = stats.domOperations > 0 
      ? (stats.domOperationTime / stats.domOperations).toFixed(2) + 'ms' 
      : '0ms'

    // 计算平均网络请求时间
    stats.avgNetworkRequestTime = stats.networkRequests > 0 
      ? (stats.networkRequestTime / stats.networkRequests).toFixed(2) + 'ms' 
      : '0ms'

    return stats
},

  /**
   * 导出性能数据
   * @returns - JSON格式的性能数据
   */
  exportPerformanceData() {
    const data = {
      timestamp: new Date().toISOString(),
      pageMode: this.currentPageMode,
      stats: this.getPerformanceStats(),
      userAgent: navigator.userAgent,
      browserLanguage: navigator.language
    }
return JSON.stringify(data, null, 2)
},

  /**
   * 分批处理元素
   * 避免单次处理过多元素导致UI阻塞
   * @param {HTMLElement[]} elements - 要处理的元素数组
   * @returns {Promise<void>} 处理完成的Promise
   */
  processElementsInBatches(elements) {
    // 使用虚拟DOM优化：只处理需要更新的元素
    elements = virtualDomManager.processElements(elements)
const modeConfig = this.getCurrentPageModeConfig()
const batchSize = modeConfig.batchSize || CONFIG.performance.batchSize || 50; // 每批处理的元素数量
    const delay = CONFIG.performance.batchDelay || 0; // 批处理之间的延迟

    // 如果元素数组为空或无效，直接返回
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return Promise.resolve()
}

    // 过滤掉无效元素
    const validElements = elements.filter(element => element instanceof HTMLElement)

    // 如果元素数量较少，直接处理
    if (validElements.length <= batchSize) {
      validElements.forEach(element => {
        try {
          this.translateElement(element)
} catch (error) {
          ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
}
        })
return Promise.resolve()
}

    return new Promise((resolve) => {
      // 分批处理
      const processBatch = (startIndex) => {
        try {
          const endIndex = Math.min(startIndex + batchSize, validElements.length)
const batch = validElements.slice(startIndex, endIndex)

          // 批量处理当前批次
          batch.forEach(element => {
            try {
              this.translateElement(element)
} catch (error) {
              ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
}
        })

          // 性能日志记录
          if (CONFIG.performance.logTiming && (endIndex % (batchSize * 5) === 0 || endIndex === validElements.length)) {
            const progress = Math.round((endIndex / validElements.length) * 100)
console.log(`[GitHub 中文翻译] 翻译进度: $%, 已处理: $/${validElements.length} 元素`)
}

          if (endIndex < validElements.length) {
            // 继续处理下一批
            if (delay > 0) {
              setTimeout(() => processBatch(endIndex), delay)
} else {
              // 使用requestAnimationFrame确保UI线程不被阻塞
              requestAnimationFrame(() => processBatch(endIndex))
}
        } else {
            // 所有批次处理完成
            resolve()
}
        } catch (error) {
          ErrorHandler.handleError('批处理过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION)
resolve(); // 即使出错也要完成Promise
        }
        }

      // 开始处理第一批
      processBatch(0)
})
},

  /**
   * 仅翻译关键元素
   * 用于错误恢复时的最小化翻译
   * @returns {Promise<void>} 翻译完成的Promise
   */
  translateCriticalElementsOnly() {
    return new Promise((resolve) => {
      const criticalSelectors = [
        '.Header',
        '.repository-content',
        '.js-repo-pjax-container',
        'main'
      ]

      const criticalElements = []
let processedElements = 0
let failedElements = 0

      // 安全地获取关键元素
      criticalSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
if (elements && elements.length > 0) {
            Array.from(elements).forEach(el => {
              if (el && el instanceof HTMLElement) {
                criticalElements.push(el)
}
        })

            if (CONFIG.debugMode) {
              console.log(`[GitHub 中文翻译] 找到关键元素: $, 数量: ${elements.length}`)
}
        }
        } catch (err) {
          ErrorHandler.handleError('查询选择器', err, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
// 继续处理其他选择器
        }
        })

      // 如果没有找到任何关键元素，直接返回
      if (criticalElements.length === 0) {
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 没有找到关键元素需要翻译')
}
        resolve()
return
}

      // 处理所有关键元素
      criticalElements.forEach(element => {
        try {
          this.translateElement(element)
processedElements++
} catch (err) {
          failedElements++
ErrorHandler.handleError('关键元素翻译', err, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
}
        })

      // 记录统计信息
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 关键元素翻译完成 - 总数量: ${criticalElements.length}, 成功: $, 失败: $`)
}

      resolve()
})
},

  /**
   * 获取需要翻译的元素
   * 性能优化：使用查询优化和缓存策略
   * @returns {HTMLElement[]} 需要翻译的元素数组
   */
  getElementsToTranslate() {
    // 使用Set避免重复添加元素，提高性能
    const uniqueElements = new Set()

    // 合并所有选择器
    const allSelectors = [...CONFIG.selectors.primary, ...CONFIG.selectors.popupMenus]

    // 优化：一次性查询所有选择器（如果数量合适）
    if (allSelectors.length <= 10) { // 避免选择器过长
      const combinedSelector = allSelectors.join(', ')
try {
        const allElements = document.querySelectorAll(combinedSelector)
Array.from(allElements).forEach(element => {
          if (this.shouldTranslateElement(element)) {
            uniqueElements.add(element)
}
        })
if (CONFIG.debugMode && CONFIG.performance.logTiming) {
          console.log(`[GitHub 中文翻译] 合并查询选择器: $, 结果数量: ${allElements.length}`)
}
        return Array.from(uniqueElements)
} catch (error) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 合并选择器查询失败，回退到逐个查询:', error)
}
        // 合并查询失败，回退到逐个查询
      }
        }

    // 逐个查询选择器
    allSelectors.forEach(selector => {
      try {
        const matchedElements = document.querySelectorAll(selector)
Array.from(matchedElements).forEach(element => {
          // 过滤不应该翻译的元素
          if (this.shouldTranslateElement(element)) {
            uniqueElements.add(element)
}
        })
} catch (error) {
        if (CONFIG.debugMode) {
          console.warn(`[GitHub 中文翻译] 选择器 "$" 解析失败:`, error)
}
        }
    })

    // 过滤无效元素
    return Array.from(uniqueElements).filter(element => element instanceof HTMLElement)
},

  /**
   * 判断元素是否应该被翻译
   * 优化版：增加更多过滤条件和快速路径
   * @param element - 要检查的元素
   * @returns 是否应该翻译
   */
  shouldTranslateElement(element) {
    // 快速路径：无效元素检查
    if (!element || !(element instanceof HTMLElement)) {
      return false
}

    // 快速路径：检查是否已翻译
    if (element.hasAttribute('data-github-zh-translated')) {
      return false
}

    // 快速路径：检查是否有内容
    if (!element.textContent.trim()) {
      return false
}

    // 避免翻译特定类型的元素
    const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'img', 'svg', 'canvas', 'video', 'audio']
const tagName = element.tagName.toLowerCase()
if (skipTags.includes(tagName)) {
      return false
}

    // 避免翻译具有特定属性的元素
    if (element.hasAttribute('data-no-translate') ||
      element.hasAttribute('translate') && element.getAttribute('translate') === 'no' ||
      element.hasAttribute('aria-hidden') ||
      element.hasAttribute('hidden')) {
      return false
}

    // 检查类名 - 优化：使用正则表达式提高匹配效率
    const className = element.className
if (className) {
      // 编译正则表达式并缓存（但在这个函数范围内无法缓存）
      const skipClassPatterns = [
        /language-\w+/,
        /highlight/,
        /token/,
        /no-translate/,
        /octicon/,
        /emoji/,
        /avatar/,
        /timestamp/,
        /numeral/,
        /filename/,
        /hash/,
        /sha/,
        /shortsha/,
        /hex-color/,
        /code/,
        /gist/,
        /language-/,
        /markdown-/,
        /monaco-editor/,
        /syntax-/,
        /highlight-/,
        /clipboard/,
        /progress-/,
        /count/,
        /size/,
        /time/,
        /date/,
        /sortable/,
        /label/,
        /badge/,
        /url/,
        /email/,
        /key/,
        /token/,
        /user-name/,
        /repo-name/
      ]

      if (skipClassPatterns.some(pattern => pattern.test(className))) {
        return false
}
        }

    // 检查ID - 通常技术/数据相关ID不翻译
    const id = element.id
if (id) {
      const skipIdPatterns = [
        /\d+/,
        /-\d+/,
        /_\d+/,
        /sha-/,
        /hash-/,
        /commit-/,
        /issue-/,
        /pull-/,
        /pr-/,
        /repo-/,
        /user-/,
        /file-/,
        /blob-/,
        /tree-/,
        /branch-/,
        /tag-/,
        /release-/,
        /gist-/,
        /discussion-/,
        /comment-/,
        /review-/,
        /workflow-/,
        /action-/,
        /job-/,
        /step-/,
        /runner-/,
        /package-/,
        /registry-/,
        /marketplace-/,
        /organization-/,
        /team-/,
        /project-/,
        /milestone-/,
        /label-/,
        /assignee-/,
        /reporter-/,
        /reviewer-/,
        /author-/,
        /committer-/,
        /contributor-/,
        /sponsor-/,
        /funding-/,
        /donation-/,
        /payment-/,
        /billing-/,
        /plan-/,
        /subscription-/,
        /license-/,
        /secret-/,
        /key-/,
        /token-/,
        /password-/,
        /credential-/,
        /certificate-/,
        /ssh-/,
        /git-/,
        /clone-/,
        /push-/,
        /pull-/,
        /fetch-/,
        /merge-/,
        /rebase-/,
        /cherry-pick-/,
        /reset-/,
        /revert-/,
        /tag-/,
        /branch-/,
        /commit-/,
        /diff-/,
        /patch-/,
        /stash-/,
        /ref-/,
        /head-/,
        /remote-/,
        /upstream-/,
        /origin-/,
        /local-/,
        /tracking-/,
        /merge-base-/,
        /conflict-/,
        /resolve-/,
        /status-/,
        /log-/,
        /blame-/,
        /bisect-/,
        /grep-/,
        /find-/,
        /filter-/,
        /archive-/,
        /submodule-/,
        /worktree-/,
        /lfs-/,
        /graphql-/,
        /rest-/,
        /api-/,
        /webhook-/,
        /event-/,
        /payload-/,
        /callback-/,
        /redirect-/,
        /oauth-/,
        /sso-/,
        /ldap-/,
        /saml-/,
        /2fa-/,
        /mfa-/,
        /security-/,
        /vulnerability-/,
        /cve-/,
        /dependency-/,
        /alert-/,
        /secret-scanning-/,
        /code-scanning-/,
        /codeql-/,
        /actions-/,
        /workflow-/,
        /job-/,
        /step-/,
        /runner-/,
        /artifact-/,
        /cache-/,
        /environment-/,
        /deployment-/,
        /app-/,
        /oauth-app-/,
        /github-app-/,
        /integration-/,
        /webhook-/,
        /marketplace-/,
        /listing-/,
        /subscription-/,
        /billing-/,
        /plan-/,
        /usage-/,
        /limits-/,
        /quota-/,
        /traffic-/,
        /analytics-/,
        /insights-/,
        /search-/,
        /explore-/,
        /trending-/,
        /stars-/,
        /forks-/,
        /watchers-/,
        /contributors-/,
        /activity-/,
        /events-/,
        /notifications-/,
        /feeds-/,
        /dashboard-/,
        /profile-/,
        /settings-/,
        /preferences-/,
        /billing-/,
        /organization-/,
        /team-/,
        /project-/,
        /milestone-/,
        /label-/,
        /assignee-/,
        /reporter-/,
        /reviewer-/,
        /author-/,
        /committer-/,
        /contributor-/,
        /sponsor-/,
        /funding-/,
        /donation-/,
        /payment-/,
        /\b\w+[0-9]\w*\b/ // 包含数字的单词
      ]

      if (skipIdPatterns.some(pattern => pattern.test(id))) {
        return false
}
        }

    // 检查元素是否隐藏
    const computedStyle = window.getComputedStyle(element)
if (computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0' ||
      computedStyle.position === 'absolute' && computedStyle.left === '-9999px') {
      return false
}

    // 检查内容是否全是数字或代码相关字符
    const textContent = element.textContent.trim()
if (textContent.length === 0) {
      return false
}

    // 检查是否全是数字和特殊符号
    if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(textContent)) {
      return false
}

    return true
},

  /**
 * 翻译单个元素
 * 性能优化：使用更高效的DOM遍历和翻译策略
 * @param element - 要翻译的元素
 * @returns 是否成功翻译了元素
 */
translateElement(element) {
    // 快速检查：避免无效元素
    if (!element || !(element instanceof HTMLElement)) {
      return false
}
    
    // 使用虚拟DOM检查是否需要翻译
    if (!virtualDomManager.shouldTranslate(element)) {
      return false
}

    // 性能优化：检查元素缓存，避免重复翻译
    if (this.elementCache.has(element)) {
      return false
}
    
    // 性能优化：检查是否已翻译，避免重复翻译
    if (element.hasAttribute('data-github-zh-translated')) {
      // 将已标记的元素添加到缓存
      this.elementCache.set(element, true)
return false
}

    // 增加性能计数
    this.performanceData.elementsProcessed++

    // 检查是否应该翻译该元素
    if (!this.shouldTranslateElement(element)) {
      // 即使不翻译，也标记为已检查，避免重复检查
      element.setAttribute('data-github-zh-translated', 'checked')
return false
}

    // 优化：使用文档片段批量处理，减少DOM操作
    const fragment = document.createDocumentFragment()
let hasTranslation = false

    // 获取子节点的快照，避免在遍历过程中修改DOM导致的问题
    const childNodes = Array.from(element.childNodes)
const textNodesToProcess = []

    // 先收集所有文本节点
    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmedText = node.nodeValue.trim()
if (trimmedText && trimmedText.length >= CONFIG.performance.minTextLengthToTranslate) {
          textNodesToProcess.push(node)
}
        } else if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          // 对于子元素，使用递归处理
          // 但先移除，稍后再添加到片段中
          element.removeChild(node)
fragment.appendChild(node)

          // 递归翻译子元素
          const childTranslated = this.translateElement(node)
hasTranslation = hasTranslation || childTranslated
} catch (e) {
          // 安全处理：如果处理子元素失败，尝试将其添加回原始位置
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 处理子元素失败:', e, '元素:', node)
}
          try {
            // 尝试将节点添加回原始位置
            if (!node.parentNode) {
              element.appendChild(node)
}
        } catch (addBackError) {
            // 如果添加回原始位置也失败，至少记录错误
            if (CONFIG.debugMode) {
              console.error('[GitHub 中文翻译] 将子元素添加回原始位置失败:', addBackError)
}
        }
        }
        }
    }

    // 处理所有文本节点
    textNodesToProcess.forEach(node => {
      // 保存原始节点位置的引用
      const parentNode = node.parentNode

      // 移除原始节点
      parentNode.removeChild(node)

      const originalText = node.nodeValue
const translatedText = this.getTranslatedText(originalText)

      // 如果有翻译结果且与原文不同，创建翻译后的文本节点
      if (translatedText && typeof translatedText === 'string' && translatedText !== originalText) {
        try {
          // 确保翻译文本是有效的字符串，去除可能导致问题的字符
          const controlChars = [
            '\u0000', '\u0001', '\u0002', '\u0003', '\u0004', '\u0005', '\u0006', '\u0007',
            '\u0008', '\u000B', '\u000C', '\u000E', '\u000F', '\u0010', '\u0011', '\u0012',
            '\u0013', '\u0014', '\u0015', '\u0016', '\u0017', '\u0018', '\u0019', '\u001A',
            '\u001B', '\u001C', '\u001D', '\u001E', '\u001F', '\u007F'
          ]
let safeTranslatedText = String(translatedText)
controlChars.forEach(char => {
            safeTranslatedText = safeTranslatedText.split(char).join('')
})
// 创建新的文本节点
          const translatedNode = document.createTextNode(safeTranslatedText)
fragment.appendChild(translatedNode)

          hasTranslation = true
this.performanceData.textsTranslated++
} catch (e) {
          // 安全处理：如果创建节点失败，保留原始文本
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 创建翻译节点失败:', e, '翻译文本:', translatedText)
}
          fragment.appendChild(node)
}
        } else {
        // 没有翻译，保留原始节点
        fragment.appendChild(node)
}
        })

    // 将处理后的片段重新添加到原始位置
    try {
      // 额外检查fragment的有效性
      if (fragment && fragment.hasChildNodes()) {
        if (element.firstChild) {
          element.insertBefore(fragment, element.firstChild)
} else {
          element.appendChild(fragment)
}
        }
    } catch (appendError) {
      // 安全处理：如果添加片段失败，至少记录错误
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 添加文档片段失败:', appendError, '元素:', element)
}
        }

    // 标记为已翻译
    if (hasTranslation) {
      virtualDomManager.markElementAsTranslated(element)
} else {
      // 标记为已检查但未翻译，避免重复检查
      element.setAttribute('data-github-zh-translated', 'checked')
}
    
    // 将元素添加到缓存，避免重复翻译
    this.elementCache.set(element, true)

    return hasTranslation
},

  /**
   * 获取文本的翻译结果
   * 优化版：改进缓存策略、添加更智能的文本处理
   * @param text - 原始文本
   * @returns {string|null} 翻译后的文本，如果没有找到翻译则返回null
   */
  getTranslatedText(text) {
    // 边界条件快速检查
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text
}

    // 去除文本中的多余空白字符
    const normalizedText = text.trim()

    // 快速路径：非常短的文本通常不需要翻译
    if (normalizedText.length < CONFIG.performance.minTextLengthToTranslate) {
      return null
}

    // 检查缓存 - 使用Map的O(1)查找
    if (CONFIG.performance.enableTranslationCache) {
      const cachedResult = this.getFromCache(normalizedText)
if (cachedResult !== null) {
        return cachedResult
}
        }

    // 记录缓存未命中
    this.performanceData.cacheMisses++

    // 尝试不同的规范化形式进行匹配
    let result = null

    // 1. 尝试使用哈希表进行快速查找（已经规范化的文本）
    result = this.dictionaryHash.get(normalizedText)

    // 2. 如果哈希表没有匹配，且文本长度适合，尝试大小写转换（作为回退）
    if (result === undefined && normalizedText.length <= 100) {
      const lowerCaseText = normalizedText.toLowerCase()
const upperCaseText = normalizedText.toUpperCase()

      result = this.dictionaryHash.get(lowerCaseText) || this.dictionaryHash.get(upperCaseText)
}

    // 3. 如果启用了部分匹配且尚未找到结果
    const modeConfig = this.getCurrentPageModeConfig()
const enablePartialMatch = modeConfig.enablePartialMatch !== undefined ?
      modeConfig.enablePartialMatch : CONFIG.performance.enablePartialMatch

    if (result === null && enablePartialMatch) {
      result = this.performPartialTranslation(normalizedText)
}

    // 更新缓存 - 优化：根据文本长度选择是否缓存
    if (CONFIG.performance.enableTranslationCache &&
      normalizedText.length <= CONFIG.performance.maxCachedTextLength) {
      // 只缓存翻译结果不为null的文本
      if (result !== null) {
        this.setToCache(normalizedText, result)
}
        }

    return result
},

  /**
   * 执行部分翻译匹配
   * 优化版：使用Trie树进行高效匹配，减少不必要的字典遍历
   * @param text - 要翻译的文本
   * @returns {string|null} - 翻译后的文本
   */
  performPartialTranslation(text) {
    // 性能优化：预先计算长度，避免重复计算
    const textLen = text.length

    // 快速路径：非常短的文本不进行部分匹配
    if (textLen < 5) {
      return null
}

    // 收集所有匹配项
    const matches = []

    // 优化：仅考虑长度合适的字典键，避免不必要的匹配
    const minKeyLength = Math.min(4, Math.floor(textLen / 2)); // 最小键长度至少为4或文本长度的一半

    // 使用Trie树查找所有可能的匹配项，避免遍历整个字典
    const potentialKeys = this.dictionaryTrie.findAllMatches(text, minKeyLength)

    // 处理找到的潜在匹配项
    for (const key of potentialKeys) {
      if (!this.dictionary.hasOwnProperty(key) || 
          this.dictionary[key].startsWith('待翻译: ')) {
        continue
}

      const value = this.dictionary[key]

      // 避免对纯数字或特殊字符的匹配
      if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(key)) {
        continue
}

      // 尝试将key视为一个完整的单词进行匹配
      // 使用单词边界的正则表达式
      const wordRegexKey = `word_$`
let wordRegex

      // 检查正则表达式缓存
      if (this.regexCache.has(wordRegexKey)) {
        wordRegex = this.regexCache.get(wordRegexKey)
} else {
        // 使用安全的正则表达式创建方法防止ReDoS攻击
        wordRegex = utils.safeRegExp('\\b' + utils.escapeRegExp(key) + '\\b', 'gi')
if (wordRegex) {
          this.regexCache.set(wordRegexKey, wordRegex)
} else {
          continue; // 如果正则表达式不安全，跳过此键
        }
        }
      
      const wordMatches = text.match(wordRegex)

      if (wordMatches && wordMatches.length > 0) {
        // 记录匹配项，按匹配长度排序
        matches.push({
          key,
          value,
          length: key.length,
          matches: wordMatches.length,
          regex: wordRegex
        })
} else {
        // 如果不是完整单词，也记录匹配项
        const nonWordRegexKey = `nonword_$`
let nonWordRegex

        // 检查正则表达式缓存
        if (this.regexCache.has(nonWordRegexKey)) {
          nonWordRegex = this.regexCache.get(nonWordRegexKey)
} else {
          // 使用安全的正则表达式创建方法防止ReDoS攻击
          nonWordRegex = utils.safeRegExp(utils.escapeRegExp(key), 'g')
if (nonWordRegex) {
            this.regexCache.set(nonWordRegexKey, nonWordRegex)
} else {
            continue; // 如果正则表达式不安全，跳过此键
          }
        }
        
        matches.push({
          key,
          value,
          length: key.length,
          matches: 1,
          regex: nonWordRegex
        })
}
        }

    // 如果没有匹配项，返回null
    if (matches.length === 0) {
      return null
}

    // 按匹配优先级排序
    // 1. 长度（更长的匹配优先）
    // 2. 匹配次数（匹配次数多的优先）
    matches.sort((a, b) => {
      if (b.length !== a.length) {
        return b.length - a.length
}
      return b.matches - a.matches
})

    // 执行替换
    let result = text
let hasReplaced = false

    // 为了避免替换影响后续匹配，最多只替换前N个匹配项
    const maxReplacements = Math.min(5, matches.length)

    for (let i = 0; i < maxReplacements; i++) {
      const match = matches[i]
const newResult = result.replace(match.regex, match.value)

      if (newResult !== result) {
        result = newResult
hasReplaced = true
}
        }

    // 返回替换后的文本或null
    return hasReplaced ? result : null
},

  /**
   * 实现LRU缓存策略的辅助方法：获取缓存项
   * @param key - 缓存键
   * @returns {string|null} 缓存的值，如果不存在返回null
   */
  getFromCache(key) {
    const cacheItem = this.translationCache.get(key)

    if (cacheItem && cacheItem.value) {
      // 更新访问时间和访问次数
      cacheItem.timestamp = Date.now()
cacheItem.accessCount = (cacheItem.accessCount || 0) + 1

      // 更新缓存统计
      this.cacheStats.hits++
this.performanceData.cacheHits++

      return cacheItem.value
}
    
    // 缓存未命中
    this.cacheStats.misses++
this.performanceData.cacheMisses++
return null
},

  /**
   * 实现LRU缓存策略的辅助方法：设置缓存项
   * @param key - 缓存键
   * @param value - 缓存值
   */
  setToCache(key, value) {
    // 检查缓存大小是否超过限制
    this.checkCacheSizeLimit()

    // 创建或更新缓存项
    this.translationCache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    })

    // 更新缓存大小统计
    this.cacheStats.size = this.translationCache.size
},

  /**
   * 检查并维护缓存大小限制
   * 实现真正的LRU（最近最少使用）缓存淘汰策略
   */
  checkCacheSizeLimit() {
    const maxSize = CONFIG.performance.maxDictSize || 1000

    if (this.translationCache.size >= maxSize) {
      // 需要执行LRU清理
      this.performLRUCacheEviction(maxSize)
}
        },

  /**
   * 执行LRU缓存淘汰
   * @param maxSize - 最大缓存大小
   */
  performLRUCacheEviction(maxSize) {
    try {
      // 目标大小设为最大值的80%，为新条目预留空间
      const targetSize = Math.floor(maxSize * 0.8)

      // 获取缓存条目并按LRU策略排序
      const cacheEntries = Array.from(this.translationCache.entries())

      // LRU排序策略：
      // 1. 优先保留最近访问的条目（时间戳降序）
      // 2. 对于相同时间戳，保留访问次数多的条目
      cacheEntries.sort(([, itemA], [, itemB]) => {
        // 主要按时间戳排序（最近访问的优先）
        if (itemB.timestamp !== itemA.timestamp) {
          return itemB.timestamp - itemA.timestamp
}
        // 次要按访问次数排序（访问次数多的优先）
        return (itemB.accessCount || 0) - (itemA.accessCount || 0)
})

      // 保留最重要的条目
      const entriesToKeep = cacheEntries.slice(0, targetSize)
const evictedCount = cacheEntries.length - entriesToKeep.length

      // 重建缓存
      this.translationCache.clear()
entriesToKeep.forEach(([key, item]) => {
        this.translationCache.set(key, item)
})

      // 更新统计信息
      this.cacheStats.evictions += evictedCount
this.cacheStats.size = this.translationCache.size
this.performanceData.cacheEvictions += evictedCount

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] LRU缓存淘汰完成，移除了$项，当前缓存大小：${this.translationCache.size}`)
}
        } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] LRU缓存淘汰失败:', error)
}
      
      // 回退策略：如果LRU失败，清空部分缓存
      try {
        const evictCount = Math.max(50, Math.floor(this.translationCache.size * 0.2))
const oldestEntries = Array.from(this.translationCache.entries())
          .sort(([, itemA], [, itemB]) => itemA.timestamp - itemB.timestamp)
          .slice(0, evictCount)

        oldestEntries.forEach(([key]) => {
          this.translationCache.delete(key)
})

        this.cacheStats.evictions += evictCount
this.cacheStats.size = this.translationCache.size
this.performanceData.cacheEvictions += evictCount
} catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 缓存回退策略失败:', fallbackError)
}
        }
    }
        },

  /**
   * 清理翻译缓存
   * 使用LRU策略进行智能缓存管理
   */
  cleanCache() {
    try {
      // 验证缓存是否存在和有效
      if (!this.translationCache || !(this.translationCache instanceof Map)) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 缓存对象不存在或无效')
}
        return
}

      // 执行LRU缓存淘汰
      this.checkCacheSizeLimit()

      // 更新性能数据
      this.performanceData.cacheCleanups = (this.performanceData.cacheCleanups || 0) + 1

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存清理完成，当前大小：${this.translationCache.size}，总命中：${this.cacheStats.hits}，总未命中：${this.cacheStats.misses}`)
}
        } catch (error) {
      // 如果清理过程出错，使用更安全的回退策略
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 缓存清理过程出错，使用回退策略:', error)
}

      try {
        // 最后手段：如果所有清理方法都失败，清空缓存
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 执行缓存重置作为最后手段')
}
        this.translationCache.clear()
this.cacheStats.size = 0

      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 缓存重置失败:', fallbackError)
}
        }
    }
        },

  /**
 * 清除翻译缓存
 */
clearCache() {
    // 清除虚拟DOM缓存
    virtualDomManager.clear()
this.translationCache.clear()

    // 清除元素缓存
    this.elementCache = new WeakMap()

    // 重置缓存统计
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    }

    // 重置已翻译标记
    const translatedElements = document.querySelectorAll('[data-github-zh-translated]')
translatedElements.forEach(element => {
      element.removeAttribute('data-github-zh-translated')
})

    if (CONFIG.debugMode) {
      console.log('[GitHub 中文翻译] 翻译缓存已清除，已移除所有翻译标记')
}
        },

  /**
   * 预热词典缓存
   * 预加载常用词典条目到缓存中
   */
  warmUpCache() {
    if (!CONFIG.performance.enableTranslationCache) {
      return
}

    try {
      // 收集常用词汇（这里简单处理，实际项目可能有更复杂的选择逻辑）
      const commonKeys = Object.keys(this.dictionary)
        .filter(key => !this.dictionary[key].startsWith('待翻译: ') && key.length <= 50)
        .slice(0, 100); // 预加载前100个常用词条

      commonKeys.forEach(key => {
        const value = this.dictionary[key]
this.setToCache(key, value)
})

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存预热完成，已预加载${commonKeys.length}个常用词条`)
}
        } catch (error) {
      console.error('[GitHub 中文翻译] 缓存预热失败:', error)
}
        },

  /**
   * 更新词典
   * 支持动态更新词典内容
   * @param newDictionary - 新的词典条目
   */
  updateDictionary(newDictionary) {
    try {
      // 合并新词典
      Object.assign(this.dictionary, newDictionary)

      // 清除缓存，因为词典已更新
      this.clearCache()

      // 重新预热缓存
      this.warmUpCache()

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 词典已更新，新增/修改${Object.keys(newDictionary).length}个条目`)
}
        } catch (error) {
      console.error('[GitHub 中文翻译] 更新词典失败:', error)
}
        }
}

/**
 * 页面监控模块
 * 负责监听GitHub页面的变化，检测DOM更新并触发翻译
 */
/**
 * 页面监控对象
 */
const pageMonitor = {
    /**
     * 观察器实例
     * @type {MutationObserver|null}
     */
    observer: null,
    
    /**
     * 最后翻译的路径
     * @type */
    lastPath: '',
    
    /**
     * 最后翻译的时间戳
     * @type */
    lastTranslateTimestamp: 0,
    
    /**
     * 存储事件监听器引用，用于清理
     * @type {Array<{target: EventTarget, type: string, handler: Function}>}
     */
    eventListeners: [],
    
    /**
     * 存储定时检查的interval ID
     * @type */
    fallbackIntervalId: null,
    
    /**
     * 初始化监控
     */
    init() {
        try {
            // 设置路径变化监听
            this.setupPathListener()

            // 设置DOM变化监听
            this.setupDomObserver()

            // 页面监控已初始化
        } catch (error) {
            console.error('[GitHub 中文翻译] 页面监控初始化失败:', error)
}
        },
    
    /**
     * 设置路径变化监听
     * 用于监听GitHub的SPA路由变化
     */
    setupPathListener() {
        // 保存当前路径
        this.lastPath = window.location.pathname + window.location.search

        // 监听popstate事件
        const popstateHandler = utils.debounce(() => {
            const currentPath = window.location.pathname + window.location.search
if (currentPath !== this.lastPath) {
                this.handlePathChange()
}
        }, CONFIG.routeChangeDelay)

        window.addEventListener('popstate', popstateHandler)
this.eventListeners.push({ target: window, type: 'popstate', handler: popstateHandler })

        // 监听pushState和replaceState方法
        const originalPushState = history.pushState
const originalReplaceState = history.replaceState

        history.pushState = function(...args) {
            originalPushState.apply(this, args)
pageMonitor.handlePathChange()
}

        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args)
pageMonitor.handlePathChange()
}
        },
    
    /**
     * 处理路径变化
     */
    handlePathChange() {
        try {
            const currentPath = window.location.pathname + window.location.search
this.lastPath = currentPath

            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 页面路径变化: $`)
}
            
            // 延迟执行翻译，等待页面内容加载完成
            setTimeout(() => {
                this.translateWithThrottle()
}, CONFIG.routeChangeDelay)
} catch (error) {
            console.error('[GitHub 中文翻译] 路径变化处理失败:', error)
}
        },
    
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断
     */
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断，支持Promise链式调用
     * @returns {Promise<void>} 翻译完成的Promise
     */
    async translateWithThrottle() {
        try {
            const now = Date.now()
// 从配置中读取性能参数，确保有默认值
            const minInterval = CONFIG.performance?.minTranslateInterval || 500; // 最小翻译间隔，默认500ms
            // 批处理大小配置，通过函数参数传入
            const useSmartThrottling = CONFIG.performance?.useSmartThrottling !== false; // 智能节流开关
            
            // 智能节流逻辑
            if (useSmartThrottling) {
                // 根据页面复杂度调整节流阈值
                const complexityFactor = this.isComplexPage() ? 2 : 1
const adjustedInterval = minInterval * complexityFactor

                // 检查是否需要节流
                if (now - this.lastTranslateTimestamp >= adjustedInterval) {
                    return this.delayedTranslate(0); // 立即翻译
                }
                
                // 如果短时间内多次触发，设置一个延迟翻译
                if (!this.scheduledTranslate) {
                    this.scheduledTranslate = setTimeout(() => {
                        this.scheduledTranslate = null
this.delayedTranslate(0)
}, minInterval)
}
                
                return; // 节流生效，退出当前调用
            }
            
            // 普通节流逻辑
            if (now - this.lastTranslateTimestamp >= minInterval) {
                return this.delayedTranslate(0)
} else if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 翻译请求被节流，距离上次翻译${now - this.lastTranslateTimestamp}ms`)
}
        } catch (error) {
            this.handleError('translateWithThrottle', error)
}
        },
    
    /**
     * 延迟执行翻译
     * @param delay - 延迟毫秒数
     */
    async delayedTranslate() {
        try {
            // 确保性能配置正确应用
            const performanceConfig = {
                batchSize: CONFIG.performance?.batchSize || 100,
                usePartialMatch: CONFIG.performance?.usePartialMatch || false,
                enableTranslationCache: CONFIG.performance?.enableTranslationCache || true
            }

            // 记录执行时间
            this.lastTranslateTimestamp = Date.now()

            // 获取当前页面关键区域
            const keyAreas = this.identifyKeyTranslationAreas()

            // 记录性能数据
            if (CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.time('[GitHub 中文翻译] 翻译耗时')
}
            
            // 根据关键区域和性能配置决定翻译方式
            if (keyAreas.length > 0) {
                // 对关键区域进行批处理翻译
                await this.processElementsInBatches(keyAreas, performanceConfig.batchSize)
if (CONFIG.debugMode) {
                    console.log(`[GitHub 中文翻译] 已翻译关键区域: ${keyAreas.length} 个`)
}
        } else {
                // 翻译整个页面
                await translationCore.translate(null, performanceConfig)
if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 已翻译整个页面')
}
        }
            
            // 记录完成时间
            if (CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.timeEnd('[GitHub 中文翻译] 翻译耗时')
}
        } catch (error) {
            return this.handleTranslationError(error)
}
        },
    
    /**
     * 批处理元素翻译
     * @param {HTMLElement[]} elements - 要翻译的元素数组
     * @param batchSize - 每批处理的元素数量
     */
    async processElementsInBatches(elements, batchSize) {
        const performanceConfig = {
            batchSize: batchSize,
            usePartialMatch: CONFIG.performance?.usePartialMatch || false,
            enableTranslationCache: CONFIG.performance?.enableTranslationCache || true
        }

        // 分批处理元素
        for (let i = 0; i < elements.length; i += batchSize) {
            const batch = elements.slice(i, i + batchSize)
await translationCore.translate(batch, performanceConfig)
}
        },
    
    /**
     * 处理翻译错误
     * @param error - 错误对象
     */
    async handleTranslationError(error) {
        this.handleError('翻译过程', error)

        // 即使出错也尝试最小化翻译
        if (CONFIG.performance?.enableErrorRecovery !== false) {
            try {
                await translationCore.translateCriticalElementsOnly()
if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 已尝试最小化翻译恢复')
}
        } catch (recoverError) {
                this.handleError('错误恢复', recoverError)
}
        }
    },
    
    /**
     * 统一错误处理
     * @param operation - 操作名称
     * @param error - 错误对象
     */
    handleError(operation, error) {
        const errorMessage = `[GitHub 中文翻译] $时出错: ${error.message}`
if (CONFIG.debugMode) {
            console.error(errorMessage, error)
} else {
            console.error(errorMessage)
}
        
        // 记录错误次数
        this.errorCount = (this.errorCount || 0) + 1

        // 如果错误过多，考虑重启监控
        if (this.errorCount > (CONFIG.performance?.maxErrorCount || 5)) {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 错误次数过多，尝试重启监控')
}
            setTimeout(() => this.restart(), 1000)
this.errorCount = 0
}
        },
    
    /**
     * 识别当前页面的关键翻译区域
     * 性能优化：只翻译需要的区域而不是整个页面
     * @returns {HTMLElement[]} 关键翻译区域元素数组
     */
    identifyKeyTranslationAreas() {
        const keySelectors = []
const path = window.location.pathname

        // 根据页面类型选择关键区域
        if (/\/pull\/\d+/.test(path) || /\/issues\/\d+/.test(path)) {
            // PR或Issue页面
            keySelectors.push('.js-discussion', '.issue-details', '.js-issue-title', '.js-issue-labels')
} else if (/\/blob\//.test(path)) {
            // 文件查看页面
            keySelectors.push('.blob-wrapper', '.file-header', '.file-info')
} else if (/\/commit\//.test(path)) {
            // 提交详情页面
            keySelectors.push('.commit-meta', '.commit-files', '.commit-body', '.commit-desc')
} else if (/\/notifications/.test(path)) {
            // 通知页面
            keySelectors.push('.notifications-list', '.notification-shelf')
} else if (/\/actions/.test(path)) {
            // Actions页面
            keySelectors.push('.workflow-run-list', '.workflow-jobs', '.workflow-run-header')
} else if (/\/settings/.test(path)) {
            // 设置页面
            keySelectors.push('.settings-content', '.js-settings-content')
} else if (/\/projects/.test(path)) {
            // Projects页面
            keySelectors.push('.project-layout', '.project-columns')
} else if (/\/wiki/.test(path)) {
            // Wiki页面
            keySelectors.push('.wiki-wrapper', '.markdown-body')
} else if (/\/search/.test(path)) {
            // 搜索结果页面
            keySelectors.push('.codesearch-results', '.search-title')
} else if (/\/orgs\//.test(path) || /\/users\//.test(path)) {
            // 组织或用户页面
            keySelectors.push('.org-profile, .profile-timeline', '.user-profile-sticky-header', '.user-profile-main')
} else if (/\/repos\/\w+\/\w+/.test(path)) {
            // 仓库主页面
            keySelectors.push('.repository-content', '.repository-meta-content', '.readme')
} else {
            // 其他页面，使用通用关键区域
            keySelectors.push('.repository-content', '.profile-timeline', '.application-main', 'main')
}
        
        // 获取并过滤存在的元素
        const elements = []
for (const selector of keySelectors) {
            const element = document.querySelector(selector)
if (element) {
                elements.push(element)
}
        }
        
        // 如果没有找到关键区域，尝试使用更通用的选择器
        if (elements.length === 0) {
            const genericSelectors = [
                '#js-pjax-container', '.application-main', 'main', 'body'
            ]

            for (const selector of genericSelectors) {
                const element = document.querySelector(selector)
if (element) {
                    elements.push(element)
break
}
        }
        }
        
        return elements
},
    
    /**
     * 设置DOM变化监听
     * 性能优化：使用更精确的观察范围和优化的配置
     */
    setupDomObserver() {
        try {
            // 先断开之前可能存在的observer
            if (this.observer) {
                try {
                    this.observer.disconnect()
this.observer = null
} catch (error) {
                    if (CONFIG.debugMode) {
                        console.warn('[GitHub 中文翻译] 断开现有observer失败:', error)
}
        }
            }
            
            // 检测当前页面模式
            const pageMode = this.detectPageMode()

            // 选择最优的观察根节点 - 性能优化：减少观察范围
            const rootNode = this.selectOptimalRootNode(pageMode)

            // 根据页面类型调整观察器配置
            const observerConfig = this.getOptimizedObserverConfig(pageMode)

            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 当前页面模式:', pageMode)
}
            
            // 使用命名函数以便调试和维护
            const handleMutations = (mutations) => {
                try {
                    // 检测页面模式
                    const pageMode = this.detectPageMode()
// 智能判断是否需要翻译
                    if (this.shouldTriggerTranslation(mutations, pageMode)) {
                        this.translateWithThrottle()
}
        } catch (error) {
                    console.error('[GitHub 中文翻译] 处理DOM变化时出错:', error)
}
        }

            this.observer = new MutationObserver(utils.debounce(handleMutations, CONFIG.debounceDelay))

            // 开始观察最优根节点
            if (rootNode) {
                try {
                    this.observer.observe(rootNode, observerConfig)
if (CONFIG.debugMode) {
                        console.log('[GitHub 中文翻译] DOM观察器已启动，观察范围:', rootNode.tagName + (rootNode.id ? '#' + rootNode.id : ''))
}
        } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 启动DOM观察者失败:', error)
}
                    // 降级方案
                    this.setupFallbackMonitoring()
}
        } else {
                console.error('[GitHub 中文翻译] 无法找到合适的观察节点，回退到body')
// 如果body还不存在，等待DOMContentLoaded
                const domLoadedHandler = () => {
                    try {
                        this.setupDomObserver(); // 重新尝试设置DOM观察器
                    } catch (error) {
                        if (CONFIG.debugMode) {
                            console.error('[GitHub 中文翻译] DOMContentLoaded后启动观察者失败:', error)
}
        }
                    // 移除一次性监听器
                    document.removeEventListener('DOMContentLoaded', domLoadedHandler)
// 从事件监听器数组中移除
                    this.eventListeners = this.eventListeners.filter(l => !(l.target === document && l.type === 'DOMContentLoaded'))
}

                document.addEventListener('DOMContentLoaded', domLoadedHandler)
this.eventListeners.push({ target: document, type: 'DOMContentLoaded', handler: domLoadedHandler })
}
        } catch (error) {
            console.error('[GitHub 中文翻译] 设置DOM观察器失败:', error)
// 降级方案
            this.setupFallbackMonitoring()
}
        },
    
    /**
     * 选择最佳的DOM观察根节点
     * 减少观察的DOM范围，提高性能
     * @param pageMode - 页面模式
     * @returns 最佳观察根节点
     */
    selectOptimalRootNode(pageMode) {
        // 如果没有提供页面模式，则自动检测
        const effectivePageMode = pageMode || this.detectPageMode()
// 根据页面模式定制候选选择器优先级
        let candidateSelectors
// 基于页面模式的候选选择器列表
        switch (effectivePageMode) {
            case 'search':
                candidateSelectors = [
                    '.codesearch-results', // 搜索结果容器
                    '#js-pjax-container',   // 通用PJAX容器
                    'main',                 // 主内容
                    'body'                  // 降级方案
                ]
break

            case 'issues':
            case 'pullRequests':
                candidateSelectors = [
                    '.js-discussion',       // 讨论区容器
                    '.issue-details',       // 问题详情容器
                    '#js-issue-title',      // 问题标题
                    '#js-pjax-container',   // 通用PJAX容器
                    'main',                 // 主内容
                    'body'                  // 降级方案
                ]
break

            case 'repository':
                candidateSelectors = [
                    '#js-repo-pjax-container', // 仓库页面主容器
                    '.repository-content',     // 仓库内容区域
                    '.application-main',       // 应用主容器
                    'body'                     // 降级方案
                ]
break

            case 'notifications':
                candidateSelectors = [
                    '.notifications-list',    // 通知列表
                    '.notification-shelf',    // 通知顶栏
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'wiki':
                candidateSelectors = [
                    '.wiki-wrapper',         // Wiki内容包装器
                    '.markdown-body',        // Markdown内容
                    '#js-pjax-container',    // 通用PJAX容器
                    'main',                  // 主内容
                    'body'                   // 降级方案
                ]
break

            case 'actions':
                candidateSelectors = [
                    '.workflow-run-list',     // 工作流运行列表
                    '.workflow-jobs',         // 工作流任务列表
                    '.workflow-run-header',   // 工作流运行头部
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'projects':
                candidateSelectors = [
                    '.project-layout',        // 项目布局容器
                    '.project-columns',       // 项目列容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'packages':
                candidateSelectors = [
                    '.packages-list',         // 包列表容器
                    '.package-details',       // 包详情容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'security':
                candidateSelectors = [
                    '.security-overview',     // 安全概览容器
                    '.vulnerability-list',    // 漏洞列表
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'insights':
                candidateSelectors = [
                    '.insights-container',    // 洞察容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'settings':
                candidateSelectors = [
                    '.settings-content',      // 设置内容
                    '.js-settings-content',   // JS设置内容
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'profile':
            case 'organizations':
                candidateSelectors = [
                    '.profile-timeline',      // 个人资料时间线
                    '.org-profile',           // 组织资料
                    '.user-profile-main',     // 用户资料主内容
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            default:
                // 默认选择器优先级
                candidateSelectors = [
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    '.application-main',      // 应用主容器
                    'body'                    // 降级方案
                ]
}
        
        for (const selector of candidateSelectors) {
            const element = document.querySelector(selector)
if (element && element.textContent.trim().length > 0) {
                return element
}
        }
        
        // 回退到body
        return document.body
},
    
    /**
     * 获取优化的观察器配置
     * 根据页面模式和复杂度动态调整观察选项
     * @param pageMode - 页面模式
     * @returns 优化的MutationObserver配置
     */
    getOptimizedObserverConfig(pageMode) {
        // 如果没有提供页面模式，则自动检测
        pageMode = pageMode || this.detectPageMode()

        // 基础配置
        const baseConfig = {
            childList: true  // 始终监听子节点变化
        }

        // 根据配置决定是否监听字符数据变化
        if (!CONFIG.performance.ignoreCharacterDataMutations) {
            baseConfig.characterData = true
}
        
        // 根据页面模式调整subtree观察选项
        const complexPages = ['wiki', 'issues', 'pullRequests', 'markdown']
const simplePages = ['search', 'codespaces', 'marketplace']

        // 复杂页面可能需要更深入的观察，但要平衡性能
        if (complexPages.includes(pageMode)) {
            baseConfig.subtree = CONFIG.performance.observeSubtree
} else if (simplePages.includes(pageMode)) {
            // 简单页面可以减少观察深度，提高性能
            baseConfig.subtree = false
} else {
            // 默认配置
            baseConfig.subtree = CONFIG.performance.observeSubtree
}
        
        // 根据配置决定是否观察属性变化
        if (CONFIG.performance.observeAttributes && !CONFIG.performance.ignoreAttributeMutations) {
            baseConfig.attributes = true
baseConfig.attributeFilter = CONFIG.performance.importantAttributes
}
        
        return baseConfig
},
    
    /**
     * 判断是否为复杂页面
     * @returns 是否为复杂页面
     */
    isComplexPage() {
        const complexPaths = [
            /\/pull\/\d+/,
            /\/issues\/\d+/,
            /\/blob\//,
            /\/commit\//,
            /\/compare\//
        ]

        return complexPaths.some(pattern => pattern.test(window.location.pathname))
},
    
    /**
     * 检测当前页面模式
     * 复用translationCore中的页面模式检测逻辑
     * @returns 当前页面模式
     */
    detectPageMode() {
        return translationCore.detectPageMode()
},
    
    /**
     * 根据页面模式获取快速路径阈值
     * @param pageMode - 页面模式
     * @returns 快速路径阈值
     */
    getQuickPathThresholdByPageMode(pageMode) {
        const thresholds = {
            'search': 5,
            'issues': 4,
            'pullRequests': 4,
            'wiki': 6,
            'actions': 5,
            'codespaces': 3
        }
return thresholds[pageMode] || 3
},
    
    /**
     * 获取页面模式特定的阈值
     * @param pageMode - 页面模式
     * @returns 页面模式特定的阈值
     */
    getModeSpecificThreshold(pageMode) {
        const thresholds = {
            'issues': 0.35,
            'pullRequests': 0.35,
            'wiki': 0.4,
            'search': 0.3,
            'codespaces': 0.25
        }
return thresholds[pageMode]
},
    
    /**
     * 根据页面模式获取最小文本长度
     * @param pageMode - 页面模式
     * @returns 最小文本长度
     */
    getMinTextLengthByPageMode(pageMode) {
        const lengths = {
            'issues': 4,
            'pullRequests': 4,
            'wiki': 5,
            'search': 3
        }
return lengths[pageMode] || CONFIG.performance.minTextLengthToTranslate || 3
},
    
    /**
     * 根据页面模式判断是否应该跳过元素
     * @param element - 元素
     * @param pageMode - 页面模式
     * @returns 是否应该跳过
     */
    shouldSkipElementByPageMode(element, pageMode) {
        if (!element || !pageMode) return false

        // 通用跳过规则
        if (element.tagName === 'CODE' || element.tagName === 'SCRIPT' || 
            element.tagName === 'STYLE' || element.classList.contains('blob-code')) {
            return true
}
        
        // 特定页面模式的元素跳过规则
        switch (pageMode) {
            case 'codespaces':
                return element.classList.contains('terminal') || 
                       element.classList.contains('command-input') ||
                       element.dataset.terminal
case 'wiki':
                // wiki页面中的代码块
                return element.classList.contains('codehilite') || 
                       element.classList.contains('highlight') ||
                       element.closest('.highlight')
case 'issues':
            case 'pullRequests':
                // 跳过代码块和diff
                return element.classList.contains('blob-code') ||
                       element.classList.contains('diff-line')
case 'search':
                // 搜索页面特定跳过规则
                if (element.classList.contains('search-match')) {
                    return false; // 搜索匹配结果不要跳过
                }
                return element.classList.contains('text-small') ||
                       element.classList.contains('link-gray')
default:
                return false
}
        },
    
    /**
     * 智能判断是否需要触发翻译
     * 比简单的变化检测更高效
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @param pageMode - 当前页面模式
     * @returns 是否需要触发翻译
     */
    shouldTriggerTranslation(mutations, pageMode) {
        // 如果没有提供页面模式，则自动检测
        pageMode = pageMode || this.detectPageMode()
try {
            // 空检查
            if (!mutations || mutations.length === 0) {
                return false
}
            
            // 获取性能配置
            const { 
                importantElements = [], 
                ignoreElements = [], 
                importantAttributes = ['id', 'class', 'href', 'title'],
                mutationThreshold = 30,
                contentChangeWeight = 1,
                importantChangeWeight = 2,
                translationTriggerRatio = 0.3,
                maxMutationProcessing = 50,
                minContentChangesToTrigger = 3,
                ignoreCharacterDataMutations = false,
                ignoreAttributeMutations = false
            } = CONFIG.performance

            // 快速路径：少量变化直接检查，阈值根据页面模式调整
            const quickPathThreshold = this.getQuickPathThresholdByPageMode(pageMode)
if (mutations.length <= quickPathThreshold) {
                return this.detectImportantChanges(mutations, pageMode)
}
            
            // 大量变化时的优化检测
            let contentChanges = 0
let importantChanges = 0
// 限制检查数量，避免处理过多变化
            const maxCheckCount = Math.min(mutations.length, Math.max(mutationThreshold, maxMutationProcessing))

            // 缓存重要元素和忽略元素的匹配结果，避免重复计算
            const elementCheckCache = new WeakMap()

            // 分批处理变化，每批检查一定数量
            for (let i = 0; i < maxCheckCount; i++) {
                const mutation = mutations[i]

                // 根据配置忽略特定类型的变化
                if (ignoreCharacterDataMutations && mutation.type === 'characterData') {
                    continue
}
                if (ignoreAttributeMutations && mutation.type === 'attributes') {
                    continue
}
                
                // 跳过空目标或已缓存为忽略的元素
                if (mutation.target) {
                    // 从缓存获取忽略结果或计算并缓存
                    let isIgnored = elementCheckCache.get(mutation.target)
if (isIgnored === undefined) {
                        isIgnored = this.shouldIgnoreElement(mutation.target, ignoreElements, elementCheckCache, pageMode)
elementCheckCache.set(mutation.target, isIgnored)
}
                    
                    if (isIgnored) {
                        continue
}
                    
                    // 检查是否为重要元素，结果也加入缓存
                    let isImportant = elementCheckCache.get(`important-${mutation.target}`)
if (isImportant === undefined && mutation.target.nodeType === Node.ELEMENT_NODE) {
                        isImportant = this.isImportantElement(mutation.target, importantElements, elementCheckCache, pageMode)
elementCheckCache.set(`important-${mutation.target}`, isImportant)
}
                    
                    // 重要元素变化直接触发翻译
                    if (isImportant) {
                        return true
}
        }
                
                // 检查重要属性变化
                if (mutation.type === 'attributes') {
                    if (CONFIG.performance.observeAttributes && importantAttributes.includes(mutation.attributeName)) {
                        importantChanges++
// 重要属性变化达到阈值直接触发
                        if (importantChanges >= 3) {
                            return true
}
        }
                    continue; // 属性变化检查完毕，继续下一个mutation
                }
                
                // 检查内容相关变化（字符数据或子节点变化）
                if (this.isContentRelatedMutation(mutation, pageMode)) {
                    contentChanges++

                    // 内容变化达到阈值直接触发
                    if (contentChanges >= Math.max(5, minContentChangesToTrigger)) {
                        return true
}
        }
            }
            
            // 检查内容变化是否达到最小触发阈值
            if (contentChanges < minContentChangesToTrigger) {
                return false
}
            
            // 计算加权变化比例
            const weightedChanges = (contentChanges * contentChangeWeight) + (importantChanges * importantChangeWeight)
const totalChangesChecked = maxCheckCount

            // 根据页面模式获取特定阈值或使用默认阈值
            const threshold = this.getModeSpecificThreshold(pageMode) || translationTriggerRatio

            // 根据加权变化比例决定是否触发翻译
            return weightedChanges / totalChangesChecked > threshold
} catch (error) {
            console.error('[GitHub 中文翻译] 判断翻译触发条件时出错:', error)
return false
}
        },
    
    /**
     * 判断元素是否为重要元素
     * @param element - 要检查的元素
     * @param {string[]} importantElements - 重要元素选择器数组
     * @returns 是否为重要元素
     */
    isImportantElement(element, importantElements, cache, pageMode) {
        try {
            // 检查是否应该基于页面模式跳过元素
            if (pageMode && this.shouldSkipElementByPageMode(element, pageMode)) {
                return false
}
            
            // 使用缓存
            if (cache && cache.has(element)) {
                return cache.get(element)
}
            
            // 页面模式特定的重要元素检查
            let isImportant = false

            // 基础重要元素检查
            isImportant = importantElements.some(selector => {
                try {
                    return element.matches(selector)
} catch (e) {
                    return false; // 选择器无效时跳过
                }
        })

            // 页面模式特定的额外检查
            if (!isImportant && pageMode) {
                switch (pageMode) {
                    case 'issues':
                    case 'pullRequests':
                        isImportant = element.classList.contains('comment-body') || 
                                     element.classList.contains('timeline-comment-header')
break
case 'wiki':
                        isImportant = element.classList.contains('markdown-body') || 
                                     element.tagName === 'H1' || 
                                     element.tagName === 'H2'
break
case 'search':
                        isImportant = element.classList.contains('search-match') || 
                                     element.classList.contains('f4')
break
case 'codespaces':
                        isImportant = element.classList.contains('codespace-status')
break
}
        }
            
            // 存储到缓存
            if (cache) {
                cache.set(element, isImportant)
}
            
            return isImportant
} catch (error) {
            console.error('[GitHub 中文翻译] 判断重要元素时出错:', error)
return false
}
        },
    
    /**
     * 判断是否应该忽略元素的变化
     * @param node - 要检查的节点
     * @param {string[]} ignoreElements - 忽略元素选择器数组
     * @returns 是否应该忽略
     */
    shouldIgnoreElement(node, ignoreElements, cache, pageMode) {
        try {
            // 非元素节点不忽略
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return false
}
            
            const element = node

            // 使用缓存
            if (cache && cache.has(node)) {
                return cache.get(node)
}
            
            // 检查是否应该基于页面模式跳过元素
            if (pageMode && this.shouldSkipElementByPageMode(element, pageMode)) {
                if (cache) {
                    cache.set(node, true)
}
                return true
}
            
            // 基础忽略元素检查
            let shouldIgnore = ignoreElements.some(selector => {
                try {
                    return element.matches(selector)
} catch (e) {
                    return false; // 选择器无效时跳过
                }
        })

            // 页面模式特定的忽略规则
            if (!shouldIgnore && pageMode) {
                switch (pageMode) {
                    case 'codespaces':
                        shouldIgnore = element.classList.contains('terminal') || 
                                      element.tagName === 'PRE' || 
                                      element.classList.contains('command-input')
break
case 'wiki':
                        // wiki页面中的代码块不忽略
                        if (element.tagName === 'PRE' && element.classList.contains('codehilite')) {
                            shouldIgnore = true
}
                        break
case 'search':
                        // 搜索页面中的代码片段不忽略
                        if (element.tagName === 'CODE' && !element.classList.contains('search-match')) {
                            shouldIgnore = true
}
                        break
}
        }
            
            // 存储到缓存
            if (cache) {
                cache.set(node, shouldIgnore)
}
            
            return shouldIgnore
} catch (error) {
            console.error('[GitHub 中文翻译] 判断忽略元素时出错:', error)
return false
}
        },
    
    /**
     * 判断是否为内容相关的DOM变化
     * @param mutation - 变更记录
     * @returns 是否为内容相关变化
     */
    isContentRelatedMutation(mutation, pageMode) {
        try {
            // 检查字符数据变化
            if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
                // 判断文本内容变化是否有意义
                const oldValue = mutation.oldValue || ''
const newValue = mutation.target.textContent || ''

                // 忽略纯空白字符的变化
                if (oldValue.trim() === newValue.trim()) {
                    return false
}
                
                // 页面模式特定的文本变化阈值
                const { minLength, lengthDiffThreshold } = this.getTextChangeThreshold(pageMode)

                // 判断变化是否有实质内容
                const hasMeaningfulChange = oldValue !== newValue && 
                                           (newValue.length >= minLength || oldValue.length >= minLength || 
                                            Math.abs(newValue.length - oldValue.length) >= lengthDiffThreshold)

                return hasMeaningfulChange
}
            
            // 检查子节点变化
            if (mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                // 页面模式特定的子节点过滤逻辑
                return Array.from(mutation.addedNodes).some(node => {
                    // 忽略脚本、样式等非内容节点
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node
// 基础过滤
                        if (element.tagName === 'SCRIPT' || 
                            element.tagName === 'STYLE' || 
                            element.tagName === 'META') {
                            return false
}
                        
                        // 页面模式特定过滤
                        if (pageMode) {
                            switch (pageMode) {
                                case 'issues':
                                case 'pullRequests':
                                    // 对于Issues/PR页面，优先关注评论和描述
                                    return element.classList.contains('comment-body') || 
                                           element.classList.contains('timeline-comment') ||
                                           element.classList.contains('js-issue-title')
case 'wiki':
                                    // 对于wiki页面，关注内容和标题
                                    return element.classList.contains('markdown-body') || 
                                           /^H[1-6]$/.test(element.tagName)
case 'codespaces':
                                    // 对于codespaces页面，忽略终端输出
                                    if (element.classList.contains('terminal') || 
                                        element.classList.contains('command-input')) {
                                        return false
}
                                    break
case 'search':
                                    // 搜索结果页面
                                    return element.classList.contains('search-result') || 
                                           element.classList.contains('search-match')
}
        }
                        
                        // 默认接受其他元素
                        return true
}
                    return node.nodeType === Node.TEXT_NODE
})
}
            
            return false
} catch (error) {
            console.error('[GitHub 中文翻译] 判断内容相关变化时出错:', error)
return false
}
        },
    
    /**
     * 判断节点是否需要翻译
     * @param node - 要检查的节点
     * @param pageMode - 当前页面模式
     * @returns 是否需要翻译
     */
    isTranslatableNode(node) {
        // 不再需要页面模式参数，简化函数逻辑
        // 跳过脚本、样式等
        if (node.nodeType === Node.SCRIPT_NODE || 
            node.nodeType === Node.STYLE_NODE || 
            node.nodeType === Node.COMMENT_NODE) {
            return false
}
        
        // 文本节点且有内容
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.trim().length > 5; // 只有足够长的文本才翻译
        }
        
        // 元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            // 跳过已翻译的元素
            if (node.hasAttribute('data-github-zh-translated')) {
                return false
}
            
            // 跳过隐藏元素
            const style = window.getComputedStyle(node)
if (style.display === 'none' || style.visibility === 'hidden') {
                return false
}
            
            // 检查是否为内容容器
            const contentTags = [
                'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'li', 'a', 'button', 'label', 'div', 'td', 'th',
                'pre', 'code', 'blockquote'
            ]

            const tagName = node.tagName.toLowerCase()
const hasContent = node.textContent.trim().length > 0

            // 常见内容容器且有内容，或者包含内容子节点
            return (contentTags.includes(tagName) && hasContent) || 
                   (node.children.length > 0 && this.hasTranslatableChildren(node))
}
        
        return false
},
    
    /**
     * 检查元素是否包含可翻译的子元素
     * @param element - 要检查的元素
     * @returns 是否包含可翻译的子元素
     */
    hasTranslatableChildren(element) {
        // 快速检查：只查看前10个子元素
        const children = Array.from(element.children).slice(0, 10)
return children.some(child => {
            const tagName = child.tagName.toLowerCase()
return ['p', 'span', 'a', 'button', 'label'].includes(tagName) && 
                   child.textContent.trim().length > 0
})
},
    
    /**
     * 设置降级监控方案
     * 当MutationObserver失败时使用
     */
    setupFallbackMonitoring() {
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 使用降级监控方案')
}
        
        // 定时检查页面变化
        const fallbackIntervalHandler = () => {
            // 只在页面可见时执行
            if (document.visibilityState === 'visible') {
                this.translateWithThrottle()
}
        }

        const intervalId = setInterval(fallbackIntervalHandler, 30000); // 30秒检查一次
        
        // 保存interval ID以便后续清理
      this.fallbackIntervalId = intervalId
// 也保存到事件监听器数组中便于统一管理
      this.eventListeners.push({ target: window, type: 'interval', handler: null, intervalId: intervalId })
},
    
    /**
     * 获取页面模式特定的文本变化阈值
     * @param pageMode - 页面模式
     * @returns 阈值配置
     */
    getTextChangeThreshold(pageMode) {
        const defaultThresholds = { minLength: 5, lengthDiffThreshold: 3 }

        if (!pageMode) return defaultThresholds

        switch (pageMode) {
            case 'codespaces':
                return { minLength: 8, lengthDiffThreshold: 5 }; // 代码空间更严格
            case 'wiki':
                return { minLength: 3, lengthDiffThreshold: 2 }; // wiki页面更宽松
            case 'issues':
            case 'pullRequests':
                return { minLength: 4, lengthDiffThreshold: 3 }; // 适中阈值
            case 'search':
                return { minLength: 5, lengthDiffThreshold: 4 }; // 搜索结果适中
            default:
                return defaultThresholds
}
        },
    
    /**
     * 检测重要的DOM变化
     * 只在有实际内容变化时触发翻译
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @param pageMode - 页面模式
     * @returns 是否有需要触发翻译的重要变化
     */
    detectImportantChanges(mutations, pageMode) {
        try {
            // 确保页面模式存在
            const currentPageMode = pageMode || this.detectPageMode()

            // 空检查
            if (!mutations || !Array.isArray(mutations)) {
                return false
}
            
            // 从配置中读取性能参数
            const { 
                // minTextLengthToTranslate = 3, // 从getMinTextLengthByPageMode获取
                importantAttributes = ['id', 'class', 'href', 'title', 'placeholder', 'alt'],
                importantElements = ['.btn', '.link', '.header', '.title', '.nav-item']
            } = CONFIG.performance

            // 使用缓存避免重复检查相同的节点
            const nodeCheckCache = new WeakMap()

            // 快速检查：如果是少量变化，优先检查重要属性和字符数据变化
            if (mutations.length <= 2) {
                // 先检查简单的变化类型
                for (const mutation of mutations) {
                    // 字符数据变化检查
                    if (mutation.type === 'characterData' && mutation.target.nodeValue) {
                        const trimmedText = mutation.target.nodeValue.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode)
if (trimmedText.length >= textThreshold.minLength) {
                            return true
}
        }
                    // 重要属性变化检查
                    if (mutation.type === 'attributes' && 
                        importantAttributes.includes(mutation.attributeName)) {
                        return true
}
        }
            }
            
            // 检查是否有实际内容变化
            return mutations.some(mutation => {
                // 子节点变化处理
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 过滤出可见的元素节点
                    return Array.from(mutation.addedNodes).some(node => {
                        // 检查缓存
                        let result = nodeCheckCache.get(node)
if (result !== undefined) {
                            return result
}
                        
                        // 忽略不可翻译的节点类型
                        if (node.nodeType === Node.SCRIPT_NODE || 
                            node.nodeType === Node.STYLE_NODE || 
                            node.nodeType === Node.COMMENT_NODE ||
                            node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                            nodeCheckCache.set(node, false)
return false
}
                        
                        // 文本节点检查
                        if (node.nodeType === Node.TEXT_NODE) {
                            const trimmedText = node.textContent.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode)
const isImportant = trimmedText.length >= textThreshold.minLength
nodeCheckCache.set(node, isImportant)
return isImportant
}
                        
                        // 元素节点检查
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node

                            // 跳过隐藏元素
                            const style = window.getComputedStyle(element)
if (style.display === 'none' || style.visibility === 'hidden') {
                                nodeCheckCache.set(node, false)
return false
}
                            
                            // 根据页面模式跳过特定元素
                        if (this.shouldSkipElementByPageMode(element, currentPageMode)) {
                                nodeCheckCache.set(node, false)
return false
}
                            
                            // 检查是否为重要元素
                        if (this.isImportantElement(element, importantElements, nodeCheckCache, currentPageMode)) {
                                nodeCheckCache.set(node, true)
return true
}
                            
                            // 检查文本内容长度
                            const trimmedText = element.textContent.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode)
if (trimmedText.length >= textThreshold.minLength) {
                                nodeCheckCache.set(node, true)
return true
}
                            
                            // 检查是否包含可翻译的子元素（限制深度以提高性能）
                            const hasTranslatableContent = this.hasTranslatableChildren(element)
nodeCheckCache.set(node, hasTranslatableContent)
return hasTranslatableContent
}
                        
                        nodeCheckCache.set(node, false)
return false
})
}
                
                // 字符数据变化检查
                if (mutation.type === 'characterData' && mutation.target.nodeValue) {
                    const trimmedText = mutation.target.nodeValue.trim()
// 使用页面模式特定的文本长度阈值
                const textThreshold = this.getTextChangeThreshold(currentPageMode)
return trimmedText.length >= textThreshold.minLength
}
                
                // 重要属性变化检查
                if (mutation.type === 'attributes' && 
                    importantAttributes.includes(mutation.attributeName)) {
                    // 对于重要属性，直接认为需要翻译
                    return true
}
                
                return false
})
} catch (error) {
            console.error('[GitHub 中文翻译] 检测重要变化时出错:', error)
return false
}
        },
    
    /**
     * 停止监控
     */
    stop() {
        try {
            // 断开MutationObserver连接
            if (this.observer) {
                try {
                    this.observer.disconnect()
this.observer = null
} catch (obsError) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 断开MutationObserver失败:', obsError)
}
        }
            }
            
            // 清理所有事件监听器
            this.cleanupEventListeners()

            // 重置状态
            this.lastPath = ''
this.lastTranslateTimestamp = 0

            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面监控已停止并清理')
}
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 停止监控时出错:', error)
}
        }
    },
    

    
    /**
     * 清理所有注册的事件监听器
     */
    cleanupEventListeners() {
      try {
        // 清理所有事件监听器
        this.eventListeners.forEach(listener => {
          try {
            if (listener.intervalId) {
              // 清理定时器
              clearInterval(listener.intervalId)
} else if (listener.target && listener.type && listener.handler) {
              // 清理DOM事件监听器
              listener.target.removeEventListener(listener.type, listener.handler)
}
        } catch (error) {
            if (CONFIG.debugMode) {
              console.warn(`[GitHub 中文翻译] 移除事件监听器(${listener.type})失败:`, error)
}
        }
        })

        // 清空监听器列表
        this.eventListeners = []
this.fallbackIntervalId = null

        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 事件监听器已清理')
}
        } catch (error) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 清理事件监听器失败:', error)
}
        }
    },
    
    /**
     * 重新开始监控
     */
    restart() {
        try {
            this.stop()
this.init()

            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面监控已重启')
}
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 重新开始监控失败:', error)
}
        }
    },
    
    /**
     * 手动触发翻译
     * 提供外部调用接口
     */
    triggerTranslation() {
        // 性能优化：如果启用了虚拟DOM，先检查是否有需要翻译的元素
        if (CONFIG.performance.enableVirtualDom) {
            // 如果页面没有明显变化，可以跳过翻译
            if (this.lastMutationTime && Date.now() - this.lastMutationTime < 500) {
                return
}
        }
        this.translateWithThrottle()
}
        }

/**
 * 开发工具模块
 * 包含字符串提取、自动更新和词典处理等开发工具
 */
// 删除未使用的CONFIG导入
/**
 * 字符串提取器对象
 */
const stringExtractor = {
    /**
     * 收集页面上的字符串
     * @param showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 收集到的字符串集合
     */
    collectStrings(showInConsole = true) {
        const strings = new Set()
utils.collectTextNodes(document.body, strings)

        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 收集到 ${strings.size} 个字符串`)
console.log('收集到的字符串:', strings)
}
        
        return strings
},
    
    /**
     * 查找未翻译的字符串
     * @param showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 未翻译的字符串集合
     */
    findUntranslatedStrings(showInConsole = true) {
        const allStrings = this.collectStrings(false)
const untranslated = new Set()

        // 合并所有词典
        const mergedDictionary = {}
for (const module in translationModule) {
            Object.assign(mergedDictionary, translationModule[module])
}
        
        // 检查每个字符串是否已翻译
        allStrings.forEach(string => {
            if (!mergedDictionary[string] || mergedDictionary[string].startsWith('待翻译: ')) {
                untranslated.add(string)
}
        })

        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 找到 ${untranslated.size} 个未翻译的字符串`)
console.log('未翻译的字符串:', untranslated)
}
        
        return untranslated
}
        }

/**
 * 自动字符串更新器类
 */
class AutoStringUpdater {
    constructor() {
        this.processedCount = 0
}
    
    /**
     * 查找需要添加的字符串
     * @returns {Set<string>} 需要添加的字符串集合
     */
    findStringsToAdd() {
        const untranslated = stringExtractor.findUntranslatedStrings(false)
return new Set(Array.from(untranslated).filter(str => !str.startsWith('待翻译: ')))
}
    
    /**
     * 生成更新报告
     * @returns 更新报告对象
     */
    generateUpdateReport() {
        const stringsToAdd = this.findStringsToAdd()
return {
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href,
            pageTitle: document.title,
            stringsToAdd: Array.from(stringsToAdd),
            totalNew: stringsToAdd.size
        }
        }
    
    /**
     * 在控制台显示报告
     */
    showReportInConsole() {
        const report = this.generateUpdateReport()
console.log('[GitHub 中文翻译] 字符串更新报告')
console.log(`📄 页面: ${report.pageTitle}`)
console.log(`✅ 找到 ${report.totalNew} 个新字符串`)
}
        }

/**
 * 词典处理器类
 */
class DictionaryProcessor {
    constructor() {
        this.processedCount = 0
}
    
    /**
     * 合并词典
     * @returns 合并后的词典
     */
    mergeDictionaries() {
        const merged = {}
for (const module in translationModule) {
            Object.assign(merged, translationModule[module])
}
        return merged
}
    
    /**
     * 验证词典
     * @returns 词典验证结果
     */
    validateDictionary() {
        const dictionary = this.mergeDictionaries()
const total = Object.keys(dictionary).length
const untranslated = Array.from(stringExtractor.findUntranslatedStrings(false)).length
return {
            totalEntries: total,
            translatedEntries: total - untranslated,
            completionRate: total > 0 ? ((total - untranslated) / total * 100).toFixed(2) : '0.00'
        }
        }
    
    /**
     * 在控制台显示统计信息
     */
    showStatisticsInConsole() {
        const stats = this.validateDictionary()
console.log('[GitHub 中文翻译] 词典统计')
console.log(`📊 总条目数: ${stats.totalEntries}`)
console.log(`✅ 已翻译条目: ${stats.translatedEntries}`)
console.log(`📈 完成率: ${stats.completionRate}%`)
}
        }

/**
 * 加载工具类
 * @returns 包含工具类的对象
 */
function loadTools() {
    return { 
        stringExtractor, 
        AutoStringUpdater, 
        DictionaryProcessor 
    }
        }

/**
 * GitHub 中文翻译主入口文件
 * 整合所有模块并初始化脚本
 */

// 导入核心模块
/**
 * 初始化脚本
 */
async function init() {
    try {
        // 检查更新
        if (CONFIG.updateCheck.enabled) {
            versionChecker.checkForUpdates().catch(() => {
                // 静默失败，不影响用户体验
            })
}
        
        // 初始化翻译核心功能
        translationCore.translate()

        // 初始化页面监控
        pageMonitor.init()

        // 初始化配置界面
        configUI.init()
} catch (error) {
        console.error('[GitHub 中文翻译] 脚本初始化失败:', error)
}
        }

/**
 * 启动脚本
 */
function startScript() {
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await init()
})
} else {
        // 如果DOM已经加载完成，直接初始化
        init()
}
        }

// 将核心模块暴露到全局作用域，便于调试和配置界面使用
if (typeof window !== 'undefined') {
    window.translationCore = translationCore
window.configUI = configUI
}

// 🕒 启动脚本
startScript();, '{', '}', '(', ')', '[', ']', '|', '\'];
        let result = '';
        for (let i = 0; i < string.length; i++) {
            if (specialChars.includes(string[i])) {
                result += '\' + string[i];
            } else {
                result += string[i];
            }
        }
        return result;
    },

    // 安全JSON解析
    safeJSONParse: function(jsonString, defaultValue) {
        defaultValue = defaultValue || null;
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            return defaultValue;
        }
        },

    // 安全JSON序列化
    safeJSONStringify: function(obj, defaultValue) {
        defaultValue = defaultValue || '{}';
        try {
            return JSON.stringify(obj);
        } catch (e) {
            return defaultValue;
        }
        },

    // 获取URL参数
    getQueryParam: function(name, url) {
        url = url || window.location.href;
        const paramName = name + '=';
        const urlParams = url.split('?')[1] || '';
        const paramList = urlParams.split('&');
        for (let i = 0; i < paramList.length; i++) {
            let param = paramList[i];
            while (param.charAt(0) == ' ') param = param.substring(1);
            if (param.indexOf(paramName) == 0) {
                return decodeURIComponent(param.substring(paramName.length).replace(/+/g, ' '));
            }
        }
        return '';
    },

    // 获取所有URL参数
    getAllQueryParams: function(url) {
        url = url || window.location.href;
        const params = {};
        const urlParams = url.split('?')[1] || '';
        const paramList = urlParams.split('&');
        for (let i = 0; i < paramList.length; i++) {
            const param = paramList[i].split('=');
            if (param.length >= 2) {
                params[decodeURIComponent(param[0])] = decodeURIComponent(param[1].replace(/+/g, ' '));
            }
        }
        return params;
    }
        };) {
        const { leading = true, trailing = true } = options
let inThrottle, lastArgs, lastThis, result, timerId

        const later = (context, args) => {
            inThrottle = false
if (trailing && lastArgs) {
                result = func.apply(context, args)
lastArgs = lastThis = null
}
        }

        return function() {
            const args = arguments
const context = this

            if (!inThrottle) {
                if (leading) {
                    result = func.apply(context, args)
}
                inThrottle = true
timerId = setTimeout(() => later(context, args), limit)
} else if (trailing) {
                lastArgs = args
lastThis = context

                // 确保只有一个定时器
                clearTimeout(timerId)
timerId = setTimeout(() => later(lastThis, lastArgs), limit)
}
            
            return result
}
        },
    
    /**
     * 防抖函数，延迟执行函数直到停止触发一段时间
     * 支持返回Promise
     * @param func - 要防抖的函数
     * @param delay - 延迟时间（毫秒）
     * @param options - 配置选项
     * @param options.leading - 是否在开始时执行一次（默认false）
     * @returns 防抖后的函数
     */
    debounce(func, delay, options = {}) {
        const { leading = false } = options
let timeout, result

        const later = (context, args) => {
            result = func.apply(context, args)
}

        return function() {
            const args = arguments
const context = this
const isLeadingCall = !timeout && leading

            clearTimeout(timeout)
timeout = setTimeout(() => later(context, args), delay)

            if (isLeadingCall) {
                result = func.apply(context, args)
}
            
            return result
}
        },
    
    /**
     * 延迟函数，返回Promise的setTimeout
     * @param ms - 延迟时间（毫秒）
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
},

    /**
     * 转义正则表达式中的特殊字符
     * @param string - 要转义的字符串
     * @returns 转义后的字符串
     */
    escapeRegExp(string) {
        // 转义所有正则表达式特殊字符，包括/字符
        return string.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
},
    
    /**
     * 安全地解析JSON字符串
     * @param jsonString - JSON字符串
     * @param {*} defaultValue - 解析失败时的默认值
     * @returns {*} 解析结果或默认值
     */
    safeJSONParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString)
} catch (error) {
            console.warn('[GitHub 中文翻译] JSON解析失败:', error)
return defaultValue
}
        },

    /**
     * 检查正则表达式是否存在潜在的ReDoS风险
     * @param {string|RegExp} pattern - 正则表达式模式
     * @returns - 是否安全
     */
    isSafeRegex(pattern) {
        if (typeof pattern === 'string') {
            pattern = new RegExp(pattern)
}

        const source = pattern.source
let depth = 0
let hasNestedRepetition = false

        // 检查是否存在嵌套的重复量词（ReDoS的主要来源）
        for (let i = 0; i < source.length; i++) {
            const char = source[i]

            if (char === '(' && source[i - 1] !== '\\') {
                depth++
} else if (char === ')' && source[i - 1] !== '\\') {
                depth--
} else if (depth > 0 && /[*+?]/.test(char) && source[i - 1] !== '\\') {
                // 在分组内发现重复量词
                hasNestedRepetition = true
break
}
        }
        
        // 检查是否存在长时间运行的可能性
        const longPatternWarning = source.length > 100; // 过长的正则表达式
        const hasMultipleRepetitions = (source.match(/[*+?]/g) || []).length > 5; // 过多的重复量词
        
        return !hasNestedRepetition && !longPatternWarning && !hasMultipleRepetitions
},

    /**
     * 安全地创建正则表达式，防止ReDoS攻击
     * @param pattern - 正则表达式模式
     * @param flags - 正则表达式标志
     * @returns {RegExp|null} - 安全的正则表达式或null
     */
    safeRegExp(pattern, flags = '') {
        try {
            const regex = new RegExp(pattern, flags)
if (this.isSafeRegex(regex)) {
                return regex
}
            console.warn('[GitHub 中文翻译] 检测到可能存在ReDoS风险的正则表达式:', pattern)
return null
} catch (error) {
            console.warn('[GitHub 中文翻译] 创建正则表达式失败:', error)
return null
}
        },
    
    /**
     * 安全地序列化对象为JSON字符串
     * @param {*} obj - 要序列化的对象
     * @param defaultValue - 序列化失败时的默认值
     * @returns JSON字符串或默认值
     */
    safeJSONStringify(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj)
} catch (error) {
            console.warn('[GitHub 中文翻译] JSON序列化失败:', error)
return defaultValue
}
        },
    
    /**
     * 获取当前页面路径
     * @returns 当前页面的路径
     */
    getCurrentPath() {
        return window.location.pathname
},
    
    /**
     * 获取完整的当前页面URL（包含查询参数）
     * @returns 完整的URL
     */
    getCurrentUrl() {
        return window.location.href
},
    
    /**
     * 判断当前页面是否匹配某个路径模式
     * @param pattern - 路径模式
     * @returns 是否匹配
     */
    isCurrentPathMatch(pattern) {
        return pattern.test(this.getCurrentPath())
},
    
    /**
     * 从URL获取查询参数
     * @param name - 参数名
     * @param url - URL字符串，默认使用当前页面URL
     * @returns {string|null} 参数值或null
     */
    getQueryParam(name, url = window.location.href) {
        const match = RegExp(`[?&]$=([^&]*)`).exec(url)
return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
},
    
    /**
     * 获取URL中的所有查询参数
     * @param url - URL字符串，默认使用当前页面URL
     * @returns 查询参数对象
     */
    getAllQueryParams(url = window.location.href) {
        const params = {}
const searchParams = new URL(url).searchParams
for (const [key, value] of searchParams) {
            params[key] = value
}
        return params
},
    
    /**
     * 收集DOM树中的所有文本节点内容
     * @param element - 要收集文本的起始元素
     * @param {Set<string>} resultSet - 用于存储结果的Set集合
     * @param options - 配置选项
     * @param options.maxLength - 最大文本长度（默认200）
     * @param {string[]} options.skipTags - 跳过的标签名数组
     */
    collectTextNodes(element, resultSet, options = {}) {
        if (!element || !resultSet || typeof resultSet.add !== 'function') return

        const {
            maxLength = 200,
            skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'noscript', 'template']
        } = options

        try {
            // 检查是否需要跳过此元素
            if (element.tagName && skipTags.includes(element.tagName.toLowerCase())) {
                return
}
            
            // 检查元素是否有隐藏类或样式
            if (element.classList && element.classList.contains('sr-only')) {
                return
}
            
            // 遍历所有子节点
            const childNodes = Array.from(element.childNodes || [])
for (const node of childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue ? node.nodeValue.trim() : ''
// 只收集符合条件的文本
                    if (text && 
                        text.length > 0 && 
                        text.length < maxLength && 
                        !/^\d+$/.test(text) &&
                        // 使用基础字符类替代Unicode属性转义，避免构建过程中的解析问题
                        !/^[\s\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A1-\u00BF\u2000-\u206F\u3000-\u303F]+$/.test(text)) {
                        resultSet.add(text)
}
        } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // 递归收集子元素的文本
                    this.collectTextNodes(node, resultSet, options)
}
        }
        } catch (error) {
            console.error('[GitHub 中文翻译] 收集文本节点时出错:', error)
}
        },
    
    /**
     * 安全地访问对象属性，避免嵌套属性访问出错
     * @param obj - 目标对象
     * @param {string|string[]} path - 属性路径，如'a.b.c'或['a','b','c']
     * @param {*} defaultValue - 获取失败时的默认值
     * @returns {*} 属性值或默认值
     */
    getNestedProperty(obj, path, defaultValue = null) {
        try {
            const pathArray = Array.isArray(path) ? path : path.split('.')
let result = obj

            for (const key of pathArray) {
                if (result === null || result === undefined) {
                    return defaultValue
}
                result = result[key]
}
            
            return result === undefined ? defaultValue : result
} catch (error) {
            return defaultValue
}
        },
    
    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
        try {
            if (obj === null || typeof obj !== 'object') return obj
if (obj instanceof Date) return new Date(obj.getTime())
if (obj instanceof Array) return obj.map(item => this.deepClone(item))
if (obj instanceof Object) {
                const clonedObj = {}
for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        clonedObj[key] = this.deepClone(obj[key])
}
        }
                return clonedObj
}
        } catch (error) {
            console.warn('[GitHub 中文翻译] 深拷贝失败:', error)
return obj
}
        },
    
    /**
     * 安全地执行函数，捕获可能的异常
     * @param fn - 要执行的函数
     * @param {*} defaultValue - 执行失败时的默认返回值
     * @param context - 函数执行上下文
     * @param {...*} args - 函数参数
     * @returns {*} 函数返回值或默认值
     */
    safeExecute(fn, defaultValue = null, context = null, ...args) {
        try {
            if (typeof fn === 'function') {
                return fn.apply(context, args)
}
            return defaultValue
} catch (error) {
            console.error('[GitHub 中文翻译] 安全执行函数失败:', error)
return defaultValue
}
        }
}

/**
 * GitHub 中文翻译配置文件
 * 包含脚本所有可配置项
 */

// 导入版本常量（从单一版本源）
// 定义greasemonkeyInfo以避免未定义错误，使用空值合并运算符提高代码可读性
const greasemonkeyInfo = typeof window !== 'undefined' ? window.GM_info ?? {} : {}

/**
 * 从用户脚本头部注释中提取版本号
 * @returns 版本号
 */
function getVersionFromComment() {
  try {
    // 作为用户脚本，我们可以直接从当前执行环境中提取版本信息
    const versionMatch = greasemonkeyInfo?.script?.version
if (versionMatch) {
      return versionMatch
}

    // 如果greasemonkeyInfo不可用，返回配置中的版本号
    return VERSION
} catch (e) {
    // 出错时返回配置中的版本号
    return VERSION
}
        }

/**
 * 配置对象，包含所有可配置项
 */
const CONFIG = {
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
      ".js-user-profile-bio", ".js-header-search-input", ".js-file-line"
    ], // 重要内容元素
    "ignoreElements": [
      "script", "style", "link", "meta", "svg", "canvas",
      "pre", "code", "kbd", "samp", ".blob-code-inner", ".file-line",
      ".highlight", ".language-*", ".mermaid", ".mathjax",
      ".js-zeroclipboard-button", ".js-minimizable-content",
      ".reponav-dropdown", ".dropdown-caret", ".avatar", ".emoji"
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
        }

/**
 * 版本更新检查模块
 * 负责检查和处理脚本更新
 */
const = require('./config.js')
const = require('./utils.js')

/**
 * 版本检查器对象
 */
const versionChecker = {
  /**
   * 检查版本更新
   * 支持重试机制和更详细的错误处理
   * @returns {Promise<boolean>} 检查完成的Promise，resolve为是否发现更新
   */
  async checkForUpdates() {
    // 检查是否启用了更新检查
    if (!CONFIG.updateCheck.enabled) {
      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 已禁用更新检查')
}
      return false
}

    // 检查是否达到检查间隔
    const lastCheck = localStorage.getItem('githubZhLastUpdateCheck')
const now = Date.now()
const intervalMs = (CONFIG.updateCheck.intervalHours || 24) * 60 * 60 * 1000

    if (lastCheck && now - parseInt(lastCheck) < intervalMs) {
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 未达到更新检查间隔，跳过检查 (上次检查: ${new Date(parseInt(lastCheck)).toLocaleString()})`)
}
      return false
}

    try {
      // 记录本次检查时间
      localStorage.setItem('githubZhLastUpdateCheck', now.toString())

      // 使用带重试的获取方法
      const scriptContent = await this.fetchWithRetry(CONFIG.updateCheck.scriptUrl)

      // 提取远程版本号 - 支持多种格式
      const remoteVersion = this.extractVersion(scriptContent)

      if (!remoteVersion) {
        throw new Error('无法从远程脚本提取有效的版本号')
}

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 当前版本: ${CONFIG.version}, 远程版本: $`)
}

      // 比较版本号
      if (this.isNewerVersion(remoteVersion, CONFIG.version)) {
        // 显示更新通知
        this.showUpdateNotification(remoteVersion)

        // 如果启用了自动更新版本号
        if (CONFIG.updateCheck.autoUpdateVersion) {
          this.updateVersionInStorage(remoteVersion)
}

        // 记录版本历史
        this.recordVersionHistory(remoteVersion)

        return true
}

      return false
} catch (error) {
      const errorMsg = `[GitHub 中文翻译] 检查更新时发生错误: ${error.message || error}`
if (CONFIG.debugMode) {
        console.error(errorMsg, error)
}

      // 记录错误日志
      try {
        localStorage.setItem('githubZhUpdateError', JSON.stringify({
          message: error.message,
          timestamp: now
        }))
} catch (e) {
        // 忽略存储错误
      }

      return false
}
        },

  /**
   * 带重试机制的网络请求
   * @param url - 请求URL
   * @param maxRetries - 最大重试次数
   * @param retryDelay - 重试间隔（毫秒）
   * @returns {Promise<string>} 响应文本
   */
  async fetchWithRetry(url, maxRetries = 2, retryDelay = 1000) {
    let lastError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (CONFIG.debugMode && attempt > 0) {
          console.log(`[GitHub 中文翻译] 重试更新检查 ($/$)...`)
}

        // 自定义超时控制
        const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Accept': 'text/javascript, text/plain, */*'
          },
          signal: controller.signal,
          credentials: 'omit' // 不发送凭证信息
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP错误! 状态码: ${response.status}`)
}

        return await response.text()
} catch (error) {
        lastError = error

        // 如果是最后一次尝试，则抛出错误
        if (attempt === maxRetries) {
          throw error
}

        // 等待后重试
        await utils.delay(retryDelay * Math.pow(2, attempt)); // 指数退避策略
      }
        }

    throw lastError
},

  /**
   * 从脚本内容中提取版本号
   * 支持多种版本号格式
   * @param content - 脚本内容
   * @returns {string|null} 提取的版本号或null
   */
  extractVersion(content) {
    // 尝试多种版本号格式
    const patterns = [
      // UserScript格式
      /\/\*\s*@version\s+(\d+\.\d+\.\d+)\s*\*\//i,
      // JavaScript注释格式
      /\/\/\s*version\s*:\s*(\d+\.\d+\.\d+)/i,
      // 变量赋值格式
      /version\s*=\s*['"](\d+\.\d+\.\d+)['"]/i,
      // 对象属性格式
      /version:\s*['"](\d+\.\d+\.\d+)['"]/i
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
if (match && match[1]) {
                return match[1]
            }

    return null
},

  /**
   * 比较版本号，判断是否有新版本
   * @param newVersion - 新版本号
   * @param currentVersion - 当前版本号
   * @returns 是否有新版本
   */
  isNewerVersion(newVersion, currentVersion) {
    // 将版本号转换为数组进行比较
    const newParts = newVersion.split('.').map(Number)
const currentParts = currentVersion.split('.').map(Number)

    // 比较每个部分
    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0
const currentPart = currentParts[i] || 0

      if (newPart > currentPart) {
        return true
} else if (newPart < currentPart) {
        return false
}
        }

    // 版本号相同
    return false
},

  /**
   * 显示更新通知
   * 使用安全的DOM操作而不是innerHTML
   * @param newVersion - 新版本号
   */
  showUpdateNotification(newVersion) {
    const notificationKey = 'githubZhUpdateNotificationDismissed'
const notificationVersionKey = 'githubZhLastNotifiedVersion'

    // 获取最后通知的版本
    const lastNotifiedVersion = localStorage.getItem(notificationVersionKey)

    // 如果用户已经关闭过通知，或者已经通知过相同版本，则不显示
    if (localStorage.getItem(notificationKey) === 'dismissed' ||
      lastNotifiedVersion === newVersion) {
      if (CONFIG.debugMode && lastNotifiedVersion === newVersion) {
        console.log(`[GitHub 中文翻译] 已经通知过版本 $的更新`)
}
      return
}

    try {
      // 创建通知元素 - 安全的DOM操作
      const notification = document.createElement('div')
notification.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md transform transition-all duration-300 translate-y-0 opacity-100'

      // 生成唯一的ID
      const notificationId = `github-zh-update-${Date.now()}`
notification.id = notificationId

      // 创建flex容器
      const flexContainer = document.createElement('div')
flexContainer.className = 'flex items-start'
notification.appendChild(flexContainer)

      // 创建图标容器
      const iconContainer = document.createElement('div')
iconContainer.className = 'flex-shrink-0 bg-blue-100 rounded-full p-2'
flexContainer.appendChild(iconContainer)

      // 创建SVG图标
      const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svgIcon.setAttribute('class', 'h-6 w-6 text-blue-600')
svgIcon.setAttribute('fill', 'none')
svgIcon.setAttribute('viewBox', '0 0 24 24')
svgIcon.setAttribute('stroke', 'currentColor')
iconContainer.appendChild(svgIcon)

      // 创建SVG路径
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
pathElement.setAttribute('stroke-linecap', 'round')
pathElement.setAttribute('stroke-linejoin', 'round')
pathElement.setAttribute('stroke-width', '2')
pathElement.setAttribute('d', 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z')
svgIcon.appendChild(pathElement)

      // 创建内容容器
      const contentContainer = document.createElement('div')
contentContainer.className = 'ml-3 flex-1'
flexContainer.appendChild(contentContainer)

      // 创建标题
      const titleElement = document.createElement('p')
titleElement.className = 'text-sm font-medium text-blue-800'
titleElement.textContent = 'GitHub 中文翻译脚本更新'
contentContainer.appendChild(titleElement)

      // 创建消息文本 - 安全地设置文本内容
      const messageElement = document.createElement('p')
messageElement.className = 'text-sm text-blue-700 mt-1'
messageElement.textContent = `发现新版本 $，建议更新以获得更好的翻译体验。`
contentContainer.appendChild(messageElement)

      // 创建按钮容器
      const buttonsContainer = document.createElement('div')
buttonsContainer.className = 'mt-3 flex space-x-2'
contentContainer.appendChild(buttonsContainer)

      // 创建更新按钮 - 安全地设置URL
      const updateButton = document.createElement('a')
updateButton.id = `$-update-btn`
updateButton.href = CONFIG.updateCheck.scriptUrl || '#'
updateButton.target = '_blank'
updateButton.rel = 'noopener noreferrer'
updateButton.className = 'inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors'
updateButton.textContent = '立即更新'
buttonsContainer.appendChild(updateButton)

      // 创建稍后按钮
      const laterButton = document.createElement('button')
laterButton.id = `$-later-btn`
laterButton.className = 'inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-transparent hover:bg-blue-50 transition-colors'
laterButton.textContent = '稍后'
laterButton.addEventListener('click', () => {
        this.hideNotification(notification, false)
})
buttonsContainer.appendChild(laterButton)

      // 创建不再提醒按钮
      const dismissButton = document.createElement('button')
dismissButton.id = `$-dismiss-btn`
dismissButton.className = 'inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors'
dismissButton.textContent = '不再提醒'
dismissButton.addEventListener('click', () => {
        this.hideNotification(notification, true)
})
buttonsContainer.appendChild(dismissButton)

      // 添加到DOM
      if (document.body) {
        document.body.appendChild(notification)

        // 记录本次通知的版本
        localStorage.setItem(notificationVersionKey, newVersion)

        // 自动隐藏（可选）
        if (CONFIG.updateCheck.autoHideNotification !== false) {
          setTimeout(() => {
            this.hideNotification(notification, false)
}, 20000); // 20秒后自动隐藏
        }

        if (CONFIG.debugMode) {
          console.log(`[GitHub 中文翻译] 显示更新通知: 版本 $`)
}
        }
    } catch (error) {
      console.error('[GitHub 中文翻译] 创建更新通知失败:', error)
}
        },

  /**
   * 隐藏通知元素（带动画效果）
   * @param notification - 通知元素
   * @param permanently - 是否永久隐藏
   */
  hideNotification(notification, permanently = false) {
    try {
      // 添加动画效果
      notification.style.transform = 'translateY(20px)'
notification.style.opacity = '0'

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
}
        }, 300)

      // 如果是永久隐藏，记录到localStorage
      if (permanently) {
        localStorage.setItem('githubZhUpdateNotificationDismissed', 'dismissed')
if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 更新通知已永久隐藏')
}
        }
    } catch (error) {
      console.error('[GitHub 中文翻译] 隐藏通知失败:', error)
}
        },

  /**
   * 记录版本历史
   * @param version - 版本号
   */
  recordVersionHistory(version) {
    try {
      const historyKey = 'githubZhVersionHistory'
let history = utils.safeJSONParse(localStorage.getItem(historyKey), [])

      // 确保是数组
      if (!Array.isArray(history)) {
        history = []
}

      // 添加新版本记录
      history.push({
        version,
        detectedAt: Date.now()
      })

      // 限制历史记录数量
      if (history.length > 10) {
        history = history.slice(-10)
}

      localStorage.setItem(historyKey, JSON.stringify(history))
} catch (error) {
      // 忽略存储错误
    }
        },

  /**
   * 更新本地存储中的版本号
   * @param newVersion - 新版本号
   */
  updateVersionInStorage(newVersion) {
    try {
      const cacheData = {
        version: newVersion,
        cachedAt: Date.now(),
        currentVersion: CONFIG.version
      }

      localStorage.setItem('githubZhCachedVersion', utils.safeJSONStringify(cacheData))

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 已缓存新版本号: $(缓存时间: ${new Date().toLocaleString()})`)
}

      return true
} catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 更新缓存版本号时出错:', error)
}
      return false
}
        },

  /**
   * 获取缓存的版本信息
   * @returns {Object|null} 缓存的版本数据
   */
  getCachedVersion() {
    try {
      const cachedData = utils.safeJSONParse(localStorage.getItem('githubZhCachedVersion'))
return cachedData
} catch (error) {
      return null
}
        },

  /**
   * 清除更新通知的忽略状态
   * 允许再次显示更新通知
   */
  clearNotificationDismissal() {
    try {
      localStorage.removeItem('githubZhUpdateNotificationDismissed')
localStorage.removeItem('githubZhLastNotifiedVersion')

      if (CONFIG.debugMode) {
        console.log('[GitHub 中文翻译] 已清除更新通知忽略状态')
}

      return true
} catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 清除通知忽略状态失败:', error)
}
      return false
}
        }
}

module.exports = 

/**
 * 翻译词典合并模块
 * 整合所有页面的翻译词典
 */
/**
 * 翻译词典对象，包含所有需要翻译的字符串
 */
const translationModule = {
    "common": commonDictionary,
    "codespaces": codespacesDictionary,
    "explore": exploreDictionary
    // 可以根据需要添加更多页面的词典
}

/**
 * 合并所有词典为一个完整的词典对象
 * @returns 合并后的词典
 */
function mergeAllDictionaries() {
    const merged = {}
for (const module in translationModule) {
        Object.assign(merged, translationModule[module])
}
    return merged
}

/**
 * 通用翻译词典
 * 包含所有页面共用的翻译字符串
 */
const commonDictionary = {
  "common": {
    "search": "搜索",
    "new": "新建",
    "actions": "操作",
    "settings": "设置",
    "help": "帮助",
    "sign_in": "登录",
    "sign_up": "注册"
  }
        }

/**
 * Codespaces 页面翻译词典
 */
const codespacesDictionary = {
    "Skip to content": "待翻译: Skip to content",
    "You signed in with another tab or window. Reload to refresh your session.": "待翻译: You signed in with another tab or window. Reload to refresh your session.",
    "Reload": "待翻译: Reload",
    "You signed out in another tab or window. Reload to refresh your session.": "待翻译: You signed out in another tab or window. Reload to refresh your session.",
    "Dismiss alert": "待翻译: Dismiss alert",
    "Uh oh!

              There was an error while loading. Please reload this page.": "待翻译: Uh oh!

              There was an error while loading. Please reload this page.",
    "Uh oh!": "待翻译: Uh oh!",
    "There was an error while loading. Please reload this page.": "待翻译: There was an error while loading. Please reload this page.",
    "Please reload this page": "待翻译: Please reload this page",
    "Sign in with a passkey": "待翻译: Sign in with a passkey",
    "Terms": "待翻译: Terms",
    "Privacy": "待翻译: Privacy",
    "Docs": "待翻译: Docs",
    "Manage cookies": "待翻译: Manage cookies",
    "Do not share my personal information": "待翻译: Do not share my personal information",
    "You can't perform that action at this time.": "待翻译: You can't perform that action at this time."
}

/**
 * Explore 页面翻译词典
 */
const exploreDictionary = {
  "Navigation Menu": "导航菜单",
  "Toggle navigation": "切换导航",
  "Sign in
          
              
    
        
    

Appearance settings": "登录
          
              
    
        
    

外观设置",
  "Sign in": "登录",
  "Appearance settings": "外观设置",
  "New": "新建",
  "Actions

        

        Automate any workflow": "Actions

        

        自动化任何工作流",
  "Actions": "Actions",
  "Codespaces

        

        Instant dev environments": "Codespaces

        

        即时开发环境",
  "Issues

        

        Plan and track work": "Issues

        

        计划和跟踪工作",
  "Issues": "问题",
  "Code Review

        

        Manage code changes": "代码审查

        

        管理代码变更",
  "Code Review": "代码审查",
  "Discussions

        

        Collaborate outside of code": "讨论

        

        代码外的协作",
  "Code Search

        

        Find more, search less": "代码搜索

        

        查找更多，搜索更少",
  "Code Search": "代码搜索",
  "Explore": "探索",
  "Blog": "博客",
  "MCP Registry": "MCP 注册表",
  "View all features": "查看全部功能",
  "By company size": "按公司规模",
  "Small and medium teams": "中小型团队",
  "By use case": "按使用场景",
  "App Modernization": "应用现代化",
  "DevOps": "开发运维",
  "CI/CD": "持续集成/持续部署",
  "View all use cases": "查看全部使用场景",
  "By industry": "按行业",
  "Financial services": "金融服务",
  "View all industries": "查看全部行业",
  "View all solutions": "查看全部解决方案",
  "Topics": "主题",
  "AI": "人工智能",
  "Software Development": "软件开发",
  "View all": "查看全部",
  "Learning Pathways": "学习路径",
  "Events & Webinars": "活动与网络研讨会",
  "Ebooks & Whitepapers": "电子书与白皮书",
  "Customer Stories": "客户案例",
  "Executive Insights": "高管见解",
  "Open Source": "开源",
  "The ReadME Project": "ReadME 项目",
  "Enterprise platform

        

        AI-powered developer platform": "企业平台

        

        人工智能驱动的开发者平台",
  "Enterprise platform": "企业平台",
  "Available add-ons": "可用附加组件",
  "Copilot for business

        

        Enterprise-grade AI features": "商业版 Copilot

        

        企业级人工智能功能",
  "Copilot for business": "商业版 Copilot",
  "Premium Support

        

        Enterprise-grade 24/7 support": "高级支持

        

        企业级 24/7 支持",
  "Premium Support": "高级支持",
  "Pricing": "价格",
  "Search or jump to...": "搜索或跳转到...",
  "Search": "搜索",
  "Clear": "清除",
  "Search syntax tips": "搜索语法提示",
  "Provide feedback": "提供反馈",
  "We read every piece of feedback, and take your input very seriously.": "我们会阅读每一条反馈，并非常重视您的意见。",
  "Cancel

              Submit feedback": "取消

              提交反馈",
  "Cancel": "取消",
  "Submit feedback": "提交反馈",
  "Saved searches
      
        Use saved searches to filter your results more quickly": "已保存的搜索
      
        使用已保存的搜索更快地筛选结果",
  "Saved searches": "已保存的搜索",
  "Use saved searches to filter your results more quickly": "使用已保存的搜索更快地筛选结果",
  "Name": "名称",
  "Query": "查询",
  "To see all available qualifiers, see our documentation.": "查看我们的文档了解所有可用的限定符。",
  "Cancel

              Create saved search": "取消

              创建已保存的搜索",
  "Create saved search": "创建已保存的搜索",
  "Sign up": "注册",
  "Resetting focus": "重置焦点",
  "Events": "活动",
  "Collections
    Curated lists and insight into burgeoning industries, topics, and communities.": "收藏集
    精选列表和对新兴行业、主题和社区的洞察。",
  "Curated lists and insight into burgeoning industries, topics, and communities.": "精选列表和对新兴行业、主题和社区的洞察。",
  "Pixel Art Tools": "像素艺术工具",
  "Learn to Code
    Resources to help people learn to code": "学习编程
    帮助人们学习编程的资源",
  "Learn to Code": "学习编程",
  "Resources to help people learn to code": "帮助人们学习编程的资源",
  "#
    Game Engines
    Frameworks for building games across multiple platforms.": "#
    游戏引擎
    用于跨平台构建游戏的框架。",
  "Game Engines": "游戏引擎",
  "Frameworks for building games across multiple platforms.": "用于跨平台构建游戏的框架。",
  "How to choose (and contribute to) your first open source project": "如何选择（并贡献于）您的第一个开源项目",
  "Clean code linters": "代码整洁检查工具",
  "Open journalism": "开放新闻业",
  "Design essentials": "设计基础",
  "#
    

    
      Music
      Drop the code bass with these musically themed repositories.": "#
    

    
      音乐
      用这些音乐主题的仓库释放代码节奏。",
  "Music
      Drop the code bass with these musically themed repositories.": "音乐
      用这些音乐主题的仓库释放代码节奏。",
  "Music": "音乐",
  "Government apps": "政府应用",
  "DevOps tools": "DevOps 工具",
  "Front-end JavaScript frameworks": "前端 JavaScript 框架",
  "Hacking Minecraft": "Minecraft 黑客技术",
  "JavaScript Game Engines": "JavaScript 游戏引擎",
  "Learn to Code
      Resources to help people learn to code": "学习编程
      帮助人们学习编程的资源",
  "Getting started with machine learning": "机器学习入门",
  "Made in Africa": "非洲制造",
  "Net neutrality
      Software, research, and organizations protecting the free and open internet.": "网络中立性
      保护自由开放互联网的软件、研究和组织。",
  "Net neutrality": "网络中立性",
  "Open data": "开放数据",
  "Open source organizations
      A showcase of organizations showcasing their open source projects.": "开源组织
      展示开源项目的组织展示。",
  "Open source organizations": "开源组织",
  "Software productivity tools": "软件生产力工具",
  "Load more…": "加载更多…",
  "Footer": "页脚",
  "Footer navigation": "页脚导航",
  "Status": "状态",
  "Contact": "联系",
  "The Download": "The Download",
  "Get the latest developer and open source news": "获取最新的开发者和开源新闻",
  "Trending repository": "热门仓库",
  "juspay          /
          hyperswitch": "juspay          /
          hyperswitch",
  "juspay": "juspay",
  "Star
          35.6k": "星标
          35.6k",
  "Star": "星标",
  "35.6k": "35.6k",
  "Code": "代码",
  "Pull requests": "拉取请求",
  "An open source payments switch written in Rust to make payments fast, reliable and affordable": "一个用 Rust 编写的开源支付交换机，使支付变得快速、可靠且经济实惠",
  "rust": "rust",
  "redis": "redis",
  "open-source": "开源",
  "finance": "金融",
  "sdk": "SDK",
  "high-performance": "高性能",
  "beginner-friendly": "对初学者友好",
  "works-with-react": "兼容 React",
  "Updated
            Oct 4, 2025": "更新于
            2025年10月4日"
}

/**
 * 翻译核心模块
 * 负责页面内容的实际翻译工作
 */
/**
 * Trie树数据结构，用于高效的字符串匹配
 * 优化部分匹配算法的性能
 */
class TrieNode {
    constructor() {
        this.children = new Map()
this.isEndOfWord = false
this.value = null
this.length = 0
}
        }

class Trie {
    constructor() {
        this.root = new TrieNode()
this.size = 0
}

    /**
     * 向Trie树中插入一个单词及其翻译
     * @param word - 要插入的单词
     * @param value - 翻译结果
     */
    insert(word, value) {
        if (!word || typeof word !== 'string' || word.length === 0) {
            return
}

        let node = this.root
for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode())
}
            node = node.children.get(char)
}
        node.isEndOfWord = true
node.value = value
node.length = word.length
this.size++
}

    /**
     * 在Trie树中查找所有匹配的单词
     * @param text - 要查找的文本
     * @returns 匹配结果数组
     */
    findAllMatches(text) {
        if (!text || typeof text !== 'string' || text.length === 0) {
            return []
}

        const matches = []
const textLen = text.length

        for (let i = 0; i < textLen; i++) {
            let node = this.root
let currentWord = ''

            for (let j = i; j < textLen; j++) {
                const char = text[j]
if (!node.children.has(char)) {
                    break
}

                node = node.children.get(char)
currentWord += char

                if (node.isEndOfWord) {
                    matches.push({
                        key: currentWord,
                        value: node.value,
                        start: i,
                        end: j,
                        length: node.length
                    })
}
        }
        }

        return matches
}

    /**
     * 清空Trie树
     */
    clear() {
        this.root = new TrieNode()
this.size = 0
}

    /**
     * 获取Trie树的大小
     * @returns Trie树中的单词数量
     */
    getSize() {
        return this.size
}
        }

/**
 * 翻译核心对象
 */
const translationCore = {
  /**
   * 合并后的完整词典
   * @type */
  dictionary: {},

  /**
   * 翻译缓存项结构
   * @typedef CacheItem
   * @property value - 缓存的值
   * @property timestamp - 最后访问时间戳
   * @property accessCount - 访问次数
   */

  /**
   * 翻译缓存，用于存储已翻译过的文本
   * @type {Map<string, CacheItem>}
   */
  translationCache: new Map(),

  /**
   * DOM元素缓存，用于存储元素的翻译状态
   * 使用WeakMap可以避免内存泄漏
   * @type {WeakMap<Element, boolean>}
   */
  elementCache: new WeakMap(),

  /**
   * 词典哈希表，用于快速查找
   * @type {Map<string, string>}
   */
  dictionaryHash: new Map(),

  /**
   * Trie树数据结构，用于高效的部分匹配
   * @type */
  dictionaryTrie: new Trie(),

  /**
   * 正则表达式缓存，避免重复创建
   * @type */
  regexCache: new Map(),

  /**
   * 缓存统计信息
   */
  cacheStats: {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  },

  /**
   * 性能监控数据
   */
  performanceData: {
    translateStartTime: 0,
    elementsProcessed: 0,
    textsTranslated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheEvictions: 0,
    cacheCleanups: 0
  },

  /**
   * 当前页面模式
   * @type */
  currentPageMode: null,

  /**
   * 页面模式配置，定义不同页面模式的特定翻译策略
   */
  pageModeConfig: {
    default: {
      batchSize: CONFIG.performance.batchSize,
      enablePartialMatch: CONFIG.performance.enablePartialMatch
    },
    search: {
      batchSize: 100, // 搜索页面可能有更多元素
      enablePartialMatch: false // 搜索页面更注重精确匹配
    },
    repository: {
      batchSize: 50,
      enablePartialMatch: false
    },
    issues: {
      batchSize: 75,
      enablePartialMatch: true // 问题描述可能包含需要部分匹配的文本
    },
    pullRequests: {
      batchSize: 75,
      enablePartialMatch: true // PR描述和评论可能需要部分匹配
    },
    explore: {
      batchSize: 100,
      enablePartialMatch: false
    },
    notifications: {
      batchSize: 60,
      enablePartialMatch: true // 通知内容可能需要部分匹配
    },
    marketplace: {
      batchSize: 80,
      enablePartialMatch: true // 插件描述可能需要部分匹配
    },
    codespaces: {
      batchSize: 50,
      enablePartialMatch: false
    },
    wiki: {
      batchSize: 120,
      enablePartialMatch: true // Wiki页面内容可能需要部分匹配
    },
    actions: {
      batchSize: 60,
      enablePartialMatch: false
    }
        },

  /**
   * 初始化词典
   */
  initDictionary() {
    try {
      if (CONFIG.debugMode) {
        console.time('[GitHub 中文翻译] 词典初始化')
}

      this.dictionary = mergeAllDictionaries()

      // 初始化词典哈希表和Trie树，提高查找效率
      this.dictionaryHash.clear()
this.dictionaryTrie.clear()
this.regexCache.clear()

      Object.keys(this.dictionary).forEach(key => {
        // 只添加非待翻译的有效条目
        if (!this.dictionary[key].startsWith('待翻译: ')) {
          this.dictionaryHash.set(key, this.dictionary[key])
// 同时添加小写和大写版本，优化大小写不敏感匹配
          if (key.length <= 100) {
            this.dictionaryHash.set(key.toLowerCase(), this.dictionary[key])
this.dictionaryHash.set(key.toUpperCase(), this.dictionary[key])
}
          
          // 添加到Trie树中，用于高效的部分匹配
          this.dictionaryTrie.insert(key)
}
        })

      if (CONFIG.debugMode) {
        console.timeEnd('[GitHub 中文翻译] 词典初始化')
console.log(`[GitHub 中文翻译] 词典条目数量: ${Object.keys(this.dictionary).length}`)
console.log(`[GitHub 中文翻译] 哈希表条目数量: ${this.dictionaryHash.size}`)
console.log(`[GitHub 中文翻译] Trie树条目数量: ${this.dictionaryTrie.getSize()}`)
}
        } catch (error) {
      ErrorHandler.handleError('词典初始化', error, ErrorHandler.ERROR_TYPES.DICTIONARY)
// 提供一个空的默认词典作为回退
      this.dictionary = {}
this.dictionaryHash.clear()
this.dictionaryTrie.clear()
this.regexCache.clear()
}
        },

  /**
   * 检测当前页面模式
   * @returns 当前页面模式
   */
  detectPageMode() {
    try {
      const currentPath = window.location.pathname

      // 优先检测精确匹配的特殊页面
      for (const [mode, pattern] of Object.entries(CONFIG.pagePatterns)) {
        if (pattern && pattern instanceof RegExp && pattern.test(currentPath)) {
          // 特殊处理仓库页面的匹配优先级
          if (mode === 'repository') {
            // 确保不是其他更具体的仓库子页面
            const isSubPage = ['issues', 'pullRequests', 'projects', 'wiki', 'actions', 'packages', 'security', 'insights']
              .some(subMode => CONFIG.pagePatterns[subMode]?.test(currentPath))
if (!isSubPage) {
              this.currentPageMode = mode
return mode
}
        } else {
            this.currentPageMode = mode
return mode
}
        }
      }

      // 默认模式
      this.currentPageMode = 'default'
return 'default'
} catch (error) {
      if (CONFIG.debugMode) {
        console.warn('[GitHub 中文翻译] 检测页面模式失败:', error)
}
      this.currentPageMode = 'default'
return 'default'
}
        },

  /**
   * 获取当前页面模式的配置
   * @returns 页面模式配置
   */
  getCurrentPageModeConfig() {
    const mode = this.currentPageMode || this.detectPageMode()
return this.pageModeConfig[mode] || this.pageModeConfig.default
},

  /**
   * 执行翻译
   * 支持翻译整个页面或指定的元素区域
   * @param {HTMLElement[]} [targetElements] - 可选的目标元素数组，只翻译这些元素
   * @returns {Promise<void>} 翻译完成的Promise
   */
  translate(targetElements = null) {
    // 确保词典已初始化
    if (!this.dictionary || Object.keys(this.dictionary).length === 0) {
      this.initDictionary()
}

    // 检测当前页面模式
    const pageMode = this.detectPageMode()
const modeConfig = this.getCurrentPageModeConfig()

    if (CONFIG.debugMode) {
      console.log(`[GitHub 中文翻译] 当前页面模式: $`, modeConfig)
}

    // 重置性能统计数据
    this.resetPerformanceData()
this.performanceData.translateStartTime = Date.now()

    return new Promise((resolve, reject) => {
      try {
        let elements

        if (Array.isArray(targetElements)) {
          // 如果提供了目标元素，只翻译这些元素
          elements = targetElements.filter(el => el && el instanceof HTMLElement)
if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译特定区域，目标元素数量: ${elements.length}`)
}
        } else {
          // 否则翻译整个页面
          elements = this.getElementsToTranslate()
if (CONFIG.debugMode) {
            console.log(`[GitHub 中文翻译] 翻译整个页面，目标元素数量: ${elements.length}`)
}
        }

        // 检查是否有元素需要翻译
        if (!elements || elements.length === 0) {
          if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 没有找到需要翻译的元素')
}
          this.logPerformanceData()
resolve()
return
}

        // 批量处理元素，避免长时间运行导致UI阻塞
        this.processElementsInBatches(elements)
          .then(() => {
            // 记录翻译结束时间
            this.performanceData.translateEndTime = Date.now()
// 记录性能数据
            this.logPerformanceData()
resolve()
})
          .catch((batchError) => {
            // 使用ErrorHandler处理批处理错误
            ErrorHandler.handleError('批处理过程', batchError, ErrorHandler.ERROR_TYPES.TRANSLATION, {
              retryable: true,
              recoveryFn: () => {
                // 错误恢复机制：尝试继续执行基本翻译
                this.translateCriticalElementsOnly()
                  .then(() => {
                    // 记录翻译结束时间
                    this.performanceData.translateEndTime = Date.now()
this.logPerformanceData()
resolve(); // 即使有错误，也尽量完成基本翻译
                  })
                  .catch((recoverError) => {
                    ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION)
// 记录翻译结束时间
                    this.performanceData.translateEndTime = Date.now()
this.logPerformanceData()
reject(recoverError)
})
},
              maxRetries: 2
            })
})
} catch (error) {
        // 使用ErrorHandler处理翻译过程中的错误
        ErrorHandler.handleError('翻译过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION, {
          retryable: true,
          recoveryFn: () => {
            // 错误恢复机制：尝试继续执行基本翻译
            this.translateCriticalElementsOnly()
              .then(() => {
                this.logPerformanceData()
resolve(); // 即使有错误，也尽量完成基本翻译
              })
              .catch((recoverError) => {
                ErrorHandler.handleError('错误恢复', recoverError, ErrorHandler.ERROR_TYPES.TRANSLATION)
this.logPerformanceData()
reject(recoverError)
})
},
          maxRetries: 2
        })
}
        })
},

  /**
   * 重置性能统计数据
   */
  /**
   * 重置性能数据
   */
  resetPerformanceData() {
    this.performanceData = {
      translateStartTime: 0,
      translateEndTime: 0,
      elementsProcessed: 0,
      textsTranslated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheEvictions: 0,
      cacheCleanups: 0,
      domOperations: 0,
      domOperationTime: 0,
      networkRequests: 0,
      networkRequestTime: 0,
      dictionaryLookups: 0,
      partialMatches: 0,
      batchProcessings: 0,
      errorCount: 0,
      totalMemory: 0
    }
        },

  /**
   * 记录性能数据
   */
  logPerformanceData() {
    if (CONFIG.debugMode && CONFIG.performance.logTiming) {
      const duration = Date.now() - this.performanceData.translateStartTime
console.log(`[GitHub 中文翻译] 性能数据 - 总耗时: $ms`)
console.log(`  元素处理: ${this.performanceData.elementsProcessed}`)
console.log(`  文本翻译: ${this.performanceData.textsTranslated}`)
console.log(`  缓存命中: ${this.performanceData.cacheHits}`)
console.log(`  缓存未命中: ${this.performanceData.cacheMisses}`)
console.log(`  缓存驱逐: ${this.performanceData.cacheEvictions}`)
console.log(`  缓存清理: ${this.performanceData.cacheCleanups}`)
console.log(`  DOM操作: ${this.performanceData.domOperations} (${this.performanceData.domOperationTime}ms)`)
console.log(`  网络请求: ${this.performanceData.networkRequests} (${this.performanceData.networkRequestTime}ms)`)
console.log(`  字典查询: ${this.performanceData.dictionaryLookups}`)
console.log(`  部分匹配: ${this.performanceData.partialMatches}`)
console.log(`  批处理次数: ${this.performanceData.batchProcessings}`)
console.log(`  错误次数: ${this.performanceData.errorCount}`)
}
        },

  /**
   * 记录单个性能事件
   * @param eventType - 事件类型
   * @param data - 事件数据
   */
  recordPerformanceEvent(eventType, data = {}) {
    switch (eventType) {
      case 'dom-operation':
        this.performanceData.domOperations++
this.performanceData.domOperationTime += data.duration || 0
break
case 'network-request':
        this.performanceData.networkRequests++
this.performanceData.networkRequestTime += data.duration || 0
break
case 'dictionary-lookup':
        this.performanceData.dictionaryLookups++
break
case 'partial-match':
        this.performanceData.partialMatches++
break
case 'batch-processing':
        this.performanceData.batchProcessings++
break
case 'error':
        this.performanceData.errorCount++
break
default:
        break
}
        },

  /**
   * 获取当前性能统计数据
   * @returns - 性能统计数据
   */
  getPerformanceStats() {
    const stats = { ...this.performanceData }
if (stats.translateStartTime > 0) {
      stats.totalDuration = stats.translateEndTime > 0 
        ? stats.translateEndTime - stats.translateStartTime 
        : Date.now() - stats.translateStartTime
} else {
      stats.totalDuration = 0
}
    
    // 计算缓存命中率
    const totalCacheRequests = stats.cacheHits + stats.cacheMisses
stats.cacheHitRate = totalCacheRequests > 0 
      ? (stats.cacheHits / totalCacheRequests * 100).toFixed(2) + '%' 
      : '0%'

    // 计算平均DOM操作时间
    stats.avgDomOperationTime = stats.domOperations > 0 
      ? (stats.domOperationTime / stats.domOperations).toFixed(2) + 'ms' 
      : '0ms'

    // 计算平均网络请求时间
    stats.avgNetworkRequestTime = stats.networkRequests > 0 
      ? (stats.networkRequestTime / stats.networkRequests).toFixed(2) + 'ms' 
      : '0ms'

    return stats
},

  /**
   * 导出性能数据
   * @returns - JSON格式的性能数据
   */
  exportPerformanceData() {
    const data = {
      timestamp: new Date().toISOString(),
      pageMode: this.currentPageMode,
      stats: this.getPerformanceStats(),
      userAgent: navigator.userAgent,
      browserLanguage: navigator.language
    }
return JSON.stringify(data, null, 2)
},

  /**
   * 分批处理元素
   * 避免单次处理过多元素导致UI阻塞
   * @param {HTMLElement[]} elements - 要处理的元素数组
   * @returns {Promise<void>} 处理完成的Promise
   */
  processElementsInBatches(elements) {
    // 使用虚拟DOM优化：只处理需要更新的元素
    elements = virtualDomManager.processElements(elements)
const modeConfig = this.getCurrentPageModeConfig()
const batchSize = modeConfig.batchSize || CONFIG.performance.batchSize || 50; // 每批处理的元素数量
    const delay = CONFIG.performance.batchDelay || 0; // 批处理之间的延迟

    // 如果元素数组为空或无效，直接返回
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return Promise.resolve()
}

    // 过滤掉无效元素
    const validElements = elements.filter(element => element instanceof HTMLElement)

    // 如果元素数量较少，直接处理
    if (validElements.length <= batchSize) {
      validElements.forEach(element => {
        try {
          this.translateElement(element)
} catch (error) {
          ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
}
        })
return Promise.resolve()
}

    return new Promise((resolve) => {
      // 分批处理
      const processBatch = (startIndex) => {
        try {
          const endIndex = Math.min(startIndex + batchSize, validElements.length)
const batch = validElements.slice(startIndex, endIndex)

          // 批量处理当前批次
          batch.forEach(element => {
            try {
              this.translateElement(element)
} catch (error) {
              ErrorHandler.handleError('翻译元素', error, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
}
        })

          // 性能日志记录
          if (CONFIG.performance.logTiming && (endIndex % (batchSize * 5) === 0 || endIndex === validElements.length)) {
            const progress = Math.round((endIndex / validElements.length) * 100)
console.log(`[GitHub 中文翻译] 翻译进度: $%, 已处理: $/${validElements.length} 元素`)
}

          if (endIndex < validElements.length) {
            // 继续处理下一批
            if (delay > 0) {
              setTimeout(() => processBatch(endIndex), delay)
} else {
              // 使用requestAnimationFrame确保UI线程不被阻塞
              requestAnimationFrame(() => processBatch(endIndex))
}
        } else {
            // 所有批次处理完成
            resolve()
}
        } catch (error) {
          ErrorHandler.handleError('批处理过程', error, ErrorHandler.ERROR_TYPES.TRANSLATION)
resolve(); // 即使出错也要完成Promise
        }
        }

      // 开始处理第一批
      processBatch(0)
})
},

  /**
   * 仅翻译关键元素
   * 用于错误恢复时的最小化翻译
   * @returns {Promise<void>} 翻译完成的Promise
   */
  translateCriticalElementsOnly() {
    return new Promise((resolve) => {
      const criticalSelectors = [
        '.Header',
        '.repository-content',
        '.js-repo-pjax-container',
        'main'
      ]

      const criticalElements = []
let processedElements = 0
let failedElements = 0

      // 安全地获取关键元素
      criticalSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
if (elements && elements.length > 0) {
            Array.from(elements).forEach(el => {
              if (el && el instanceof HTMLElement) {
                criticalElements.push(el)
}
        })

            if (CONFIG.debugMode) {
              console.log(`[GitHub 中文翻译] 找到关键元素: $, 数量: ${elements.length}`)
}
        }
        } catch (err) {
          ErrorHandler.handleError('查询选择器', err, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
// 继续处理其他选择器
        }
        })

      // 如果没有找到任何关键元素，直接返回
      if (criticalElements.length === 0) {
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 没有找到关键元素需要翻译')
}
        resolve()
return
}

      // 处理所有关键元素
      criticalElements.forEach(element => {
        try {
          this.translateElement(element)
processedElements++
} catch (err) {
          failedElements++
ErrorHandler.handleError('关键元素翻译', err, ErrorHandler.ERROR_TYPES.DOM_OPERATION)
}
        })

      // 记录统计信息
      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 关键元素翻译完成 - 总数量: ${criticalElements.length}, 成功: $, 失败: $`)
}

      resolve()
})
},

  /**
   * 获取需要翻译的元素
   * 性能优化：使用查询优化和缓存策略
   * @returns {HTMLElement[]} 需要翻译的元素数组
   */
  getElementsToTranslate() {
    // 使用Set避免重复添加元素，提高性能
    const uniqueElements = new Set()

    // 合并所有选择器
    const allSelectors = [...CONFIG.selectors.primary, ...CONFIG.selectors.popupMenus]

    // 优化：一次性查询所有选择器（如果数量合适）
    if (allSelectors.length <= 10) { // 避免选择器过长
      const combinedSelector = allSelectors.join(', ')
try {
        const allElements = document.querySelectorAll(combinedSelector)
Array.from(allElements).forEach(element => {
          if (this.shouldTranslateElement(element)) {
            uniqueElements.add(element)
}
        })
if (CONFIG.debugMode && CONFIG.performance.logTiming) {
          console.log(`[GitHub 中文翻译] 合并查询选择器: $, 结果数量: ${allElements.length}`)
}
        return Array.from(uniqueElements)
} catch (error) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 合并选择器查询失败，回退到逐个查询:', error)
}
        // 合并查询失败，回退到逐个查询
      }
        }

    // 逐个查询选择器
    allSelectors.forEach(selector => {
      try {
        const matchedElements = document.querySelectorAll(selector)
Array.from(matchedElements).forEach(element => {
          // 过滤不应该翻译的元素
          if (this.shouldTranslateElement(element)) {
            uniqueElements.add(element)
}
        })
} catch (error) {
        if (CONFIG.debugMode) {
          console.warn(`[GitHub 中文翻译] 选择器 "$" 解析失败:`, error)
}
        }
    })

    // 过滤无效元素
    return Array.from(uniqueElements).filter(element => element instanceof HTMLElement)
},

  /**
   * 判断元素是否应该被翻译
   * 优化版：增加更多过滤条件和快速路径
   * @param element - 要检查的元素
   * @returns 是否应该翻译
   */
  shouldTranslateElement(element) {
    // 快速路径：无效元素检查
    if (!element || !(element instanceof HTMLElement)) {
      return false
}

    // 快速路径：检查是否已翻译
    if (element.hasAttribute('data-github-zh-translated')) {
      return false
}

    // 快速路径：检查是否有内容
    if (!element.textContent.trim()) {
      return false
}

    // 避免翻译特定类型的元素
    const skipTags = ['script', 'style', 'code', 'pre', 'textarea', 'input', 'select', 'img', 'svg', 'canvas', 'video', 'audio']
const tagName = element.tagName.toLowerCase()
if (skipTags.includes(tagName)) {
      return false
}

    // 避免翻译具有特定属性的元素
    if (element.hasAttribute('data-no-translate') ||
      element.hasAttribute('translate') && element.getAttribute('translate') === 'no' ||
      element.hasAttribute('aria-hidden') ||
      element.hasAttribute('hidden')) {
      return false
}

    // 检查类名 - 优化：使用正则表达式提高匹配效率
    const className = element.className
if (className) {
      // 编译正则表达式并缓存（但在这个函数范围内无法缓存）
      const skipClassPatterns = [
        /language-\w+/,
        /highlight/,
        /token/,
        /no-translate/,
        /octicon/,
        /emoji/,
        /avatar/,
        /timestamp/,
        /numeral/,
        /filename/,
        /hash/,
        /sha/,
        /shortsha/,
        /hex-color/,
        /code/,
        /gist/,
        /language-/,
        /markdown-/,
        /monaco-editor/,
        /syntax-/,
        /highlight-/,
        /clipboard/,
        /progress-/,
        /count/,
        /size/,
        /time/,
        /date/,
        /sortable/,
        /label/,
        /badge/,
        /url/,
        /email/,
        /key/,
        /token/,
        /user-name/,
        /repo-name/
      ]

      if (skipClassPatterns.some(pattern => pattern.test(className))) {
        return false
}
        }

    // 检查ID - 通常技术/数据相关ID不翻译
    const id = element.id
if (id) {
      const skipIdPatterns = [
        /\d+/,
        /-\d+/,
        /_\d+/,
        /sha-/,
        /hash-/,
        /commit-/,
        /issue-/,
        /pull-/,
        /pr-/,
        /repo-/,
        /user-/,
        /file-/,
        /blob-/,
        /tree-/,
        /branch-/,
        /tag-/,
        /release-/,
        /gist-/,
        /discussion-/,
        /comment-/,
        /review-/,
        /workflow-/,
        /action-/,
        /job-/,
        /step-/,
        /runner-/,
        /package-/,
        /registry-/,
        /marketplace-/,
        /organization-/,
        /team-/,
        /project-/,
        /milestone-/,
        /label-/,
        /assignee-/,
        /reporter-/,
        /reviewer-/,
        /author-/,
        /committer-/,
        /contributor-/,
        /sponsor-/,
        /funding-/,
        /donation-/,
        /payment-/,
        /billing-/,
        /plan-/,
        /subscription-/,
        /license-/,
        /secret-/,
        /key-/,
        /token-/,
        /password-/,
        /credential-/,
        /certificate-/,
        /ssh-/,
        /git-/,
        /clone-/,
        /push-/,
        /pull-/,
        /fetch-/,
        /merge-/,
        /rebase-/,
        /cherry-pick-/,
        /reset-/,
        /revert-/,
        /tag-/,
        /branch-/,
        /commit-/,
        /diff-/,
        /patch-/,
        /stash-/,
        /ref-/,
        /head-/,
        /remote-/,
        /upstream-/,
        /origin-/,
        /local-/,
        /tracking-/,
        /merge-base-/,
        /conflict-/,
        /resolve-/,
        /status-/,
        /log-/,
        /blame-/,
        /bisect-/,
        /grep-/,
        /find-/,
        /filter-/,
        /archive-/,
        /submodule-/,
        /worktree-/,
        /lfs-/,
        /graphql-/,
        /rest-/,
        /api-/,
        /webhook-/,
        /event-/,
        /payload-/,
        /callback-/,
        /redirect-/,
        /oauth-/,
        /sso-/,
        /ldap-/,
        /saml-/,
        /2fa-/,
        /mfa-/,
        /security-/,
        /vulnerability-/,
        /cve-/,
        /dependency-/,
        /alert-/,
        /secret-scanning-/,
        /code-scanning-/,
        /codeql-/,
        /actions-/,
        /workflow-/,
        /job-/,
        /step-/,
        /runner-/,
        /artifact-/,
        /cache-/,
        /environment-/,
        /deployment-/,
        /app-/,
        /oauth-app-/,
        /github-app-/,
        /integration-/,
        /webhook-/,
        /marketplace-/,
        /listing-/,
        /subscription-/,
        /billing-/,
        /plan-/,
        /usage-/,
        /limits-/,
        /quota-/,
        /traffic-/,
        /analytics-/,
        /insights-/,
        /search-/,
        /explore-/,
        /trending-/,
        /stars-/,
        /forks-/,
        /watchers-/,
        /contributors-/,
        /activity-/,
        /events-/,
        /notifications-/,
        /feeds-/,
        /dashboard-/,
        /profile-/,
        /settings-/,
        /preferences-/,
        /billing-/,
        /organization-/,
        /team-/,
        /project-/,
        /milestone-/,
        /label-/,
        /assignee-/,
        /reporter-/,
        /reviewer-/,
        /author-/,
        /committer-/,
        /contributor-/,
        /sponsor-/,
        /funding-/,
        /donation-/,
        /payment-/,
        /\b\w+[0-9]\w*\b/ // 包含数字的单词
      ]

      if (skipIdPatterns.some(pattern => pattern.test(id))) {
        return false
}
        }

    // 检查元素是否隐藏
    const computedStyle = window.getComputedStyle(element)
if (computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0' ||
      computedStyle.position === 'absolute' && computedStyle.left === '-9999px') {
      return false
}

    // 检查内容是否全是数字或代码相关字符
    const textContent = element.textContent.trim()
if (textContent.length === 0) {
      return false
}

    // 检查是否全是数字和特殊符号
    if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(textContent)) {
      return false
}

    return true
},

  /**
 * 翻译单个元素
 * 性能优化：使用更高效的DOM遍历和翻译策略
 * @param element - 要翻译的元素
 * @returns 是否成功翻译了元素
 */
translateElement(element) {
    // 快速检查：避免无效元素
    if (!element || !(element instanceof HTMLElement)) {
      return false
}
    
    // 使用虚拟DOM检查是否需要翻译
    if (!virtualDomManager.shouldTranslate(element)) {
      return false
}

    // 性能优化：检查元素缓存，避免重复翻译
    if (this.elementCache.has(element)) {
      return false
}
    
    // 性能优化：检查是否已翻译，避免重复翻译
    if (element.hasAttribute('data-github-zh-translated')) {
      // 将已标记的元素添加到缓存
      this.elementCache.set(element, true)
return false
}

    // 增加性能计数
    this.performanceData.elementsProcessed++

    // 检查是否应该翻译该元素
    if (!this.shouldTranslateElement(element)) {
      // 即使不翻译，也标记为已检查，避免重复检查
      element.setAttribute('data-github-zh-translated', 'checked')
return false
}

    // 优化：使用文档片段批量处理，减少DOM操作
    const fragment = document.createDocumentFragment()
let hasTranslation = false

    // 获取子节点的快照，避免在遍历过程中修改DOM导致的问题
    const childNodes = Array.from(element.childNodes)
const textNodesToProcess = []

    // 先收集所有文本节点
    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmedText = node.nodeValue.trim()
if (trimmedText && trimmedText.length >= CONFIG.performance.minTextLengthToTranslate) {
          textNodesToProcess.push(node)
}
        } else if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          // 对于子元素，使用递归处理
          // 但先移除，稍后再添加到片段中
          element.removeChild(node)
fragment.appendChild(node)

          // 递归翻译子元素
          const childTranslated = this.translateElement(node)
hasTranslation = hasTranslation || childTranslated
} catch (e) {
          // 安全处理：如果处理子元素失败，尝试将其添加回原始位置
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 处理子元素失败:', e, '元素:', node)
}
          try {
            // 尝试将节点添加回原始位置
            if (!node.parentNode) {
              element.appendChild(node)
}
        } catch (addBackError) {
            // 如果添加回原始位置也失败，至少记录错误
            if (CONFIG.debugMode) {
              console.error('[GitHub 中文翻译] 将子元素添加回原始位置失败:', addBackError)
}
        }
        }
        }
    }

    // 处理所有文本节点
    textNodesToProcess.forEach(node => {
      // 保存原始节点位置的引用
      const parentNode = node.parentNode

      // 移除原始节点
      parentNode.removeChild(node)

      const originalText = node.nodeValue
const translatedText = this.getTranslatedText(originalText)

      // 如果有翻译结果且与原文不同，创建翻译后的文本节点
      if (translatedText && typeof translatedText === 'string' && translatedText !== originalText) {
        try {
          // 确保翻译文本是有效的字符串，去除可能导致问题的字符
          const controlChars = [
            '\u0000', '\u0001', '\u0002', '\u0003', '\u0004', '\u0005', '\u0006', '\u0007',
            '\u0008', '\u000B', '\u000C', '\u000E', '\u000F', '\u0010', '\u0011', '\u0012',
            '\u0013', '\u0014', '\u0015', '\u0016', '\u0017', '\u0018', '\u0019', '\u001A',
            '\u001B', '\u001C', '\u001D', '\u001E', '\u001F', '\u007F'
          ]
let safeTranslatedText = String(translatedText)
controlChars.forEach(char => {
            safeTranslatedText = safeTranslatedText.split(char).join('')
})
// 创建新的文本节点
          const translatedNode = document.createTextNode(safeTranslatedText)
fragment.appendChild(translatedNode)

          hasTranslation = true
this.performanceData.textsTranslated++
} catch (e) {
          // 安全处理：如果创建节点失败，保留原始文本
          if (CONFIG.debugMode) {
            console.error('[GitHub 中文翻译] 创建翻译节点失败:', e, '翻译文本:', translatedText)
}
          fragment.appendChild(node)
}
        } else {
        // 没有翻译，保留原始节点
        fragment.appendChild(node)
}
        })

    // 将处理后的片段重新添加到原始位置
    try {
      // 额外检查fragment的有效性
      if (fragment && fragment.hasChildNodes()) {
        if (element.firstChild) {
          element.insertBefore(fragment, element.firstChild)
} else {
          element.appendChild(fragment)
}
        }
    } catch (appendError) {
      // 安全处理：如果添加片段失败，至少记录错误
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 添加文档片段失败:', appendError, '元素:', element)
}
        }

    // 标记为已翻译
    if (hasTranslation) {
      virtualDomManager.markElementAsTranslated(element)
} else {
      // 标记为已检查但未翻译，避免重复检查
      element.setAttribute('data-github-zh-translated', 'checked')
}
    
    // 将元素添加到缓存，避免重复翻译
    this.elementCache.set(element, true)

    return hasTranslation
},

  /**
   * 获取文本的翻译结果
   * 优化版：改进缓存策略、添加更智能的文本处理
   * @param text - 原始文本
   * @returns {string|null} 翻译后的文本，如果没有找到翻译则返回null
   */
  getTranslatedText(text) {
    // 边界条件快速检查
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text
}

    // 去除文本中的多余空白字符
    const normalizedText = text.trim()

    // 快速路径：非常短的文本通常不需要翻译
    if (normalizedText.length < CONFIG.performance.minTextLengthToTranslate) {
      return null
}

    // 检查缓存 - 使用Map的O(1)查找
    if (CONFIG.performance.enableTranslationCache) {
      const cachedResult = this.getFromCache(normalizedText)
if (cachedResult !== null) {
        return cachedResult
}
        }

    // 记录缓存未命中
    this.performanceData.cacheMisses++

    // 尝试不同的规范化形式进行匹配
    let result = null

    // 1. 尝试使用哈希表进行快速查找（已经规范化的文本）
    result = this.dictionaryHash.get(normalizedText)

    // 2. 如果哈希表没有匹配，且文本长度适合，尝试大小写转换（作为回退）
    if (result === undefined && normalizedText.length <= 100) {
      const lowerCaseText = normalizedText.toLowerCase()
const upperCaseText = normalizedText.toUpperCase()

      result = this.dictionaryHash.get(lowerCaseText) || this.dictionaryHash.get(upperCaseText)
}

    // 3. 如果启用了部分匹配且尚未找到结果
    const modeConfig = this.getCurrentPageModeConfig()
const enablePartialMatch = modeConfig.enablePartialMatch !== undefined ?
      modeConfig.enablePartialMatch : CONFIG.performance.enablePartialMatch

    if (result === null && enablePartialMatch) {
      result = this.performPartialTranslation(normalizedText)
}

    // 更新缓存 - 优化：根据文本长度选择是否缓存
    if (CONFIG.performance.enableTranslationCache &&
      normalizedText.length <= CONFIG.performance.maxCachedTextLength) {
      // 只缓存翻译结果不为null的文本
      if (result !== null) {
        this.setToCache(normalizedText, result)
}
        }

    return result
},

  /**
   * 执行部分翻译匹配
   * 优化版：使用Trie树进行高效匹配，减少不必要的字典遍历
   * @param text - 要翻译的文本
   * @returns {string|null} - 翻译后的文本
   */
  performPartialTranslation(text) {
    // 性能优化：预先计算长度，避免重复计算
    const textLen = text.length

    // 快速路径：非常短的文本不进行部分匹配
    if (textLen < 5) {
      return null
}

    // 收集所有匹配项
    const matches = []

    // 优化：仅考虑长度合适的字典键，避免不必要的匹配
    const minKeyLength = Math.min(4, Math.floor(textLen / 2)); // 最小键长度至少为4或文本长度的一半

    // 使用Trie树查找所有可能的匹配项，避免遍历整个字典
    const potentialKeys = this.dictionaryTrie.findAllMatches(text, minKeyLength)

    // 处理找到的潜在匹配项
    for (const key of potentialKeys) {
      if (!this.dictionary.hasOwnProperty(key) || 
          this.dictionary[key].startsWith('待翻译: ')) {
        continue
}

      const value = this.dictionary[key]

      // 避免对纯数字或特殊字符的匹配
      if (/^[0-9.,\s()[\]{}/*^$#@!~`|:;"'?>+-]+$/i.test(key)) {
        continue
}

      // 尝试将key视为一个完整的单词进行匹配
      // 使用单词边界的正则表达式
      const wordRegexKey = `word_$`
let wordRegex

      // 检查正则表达式缓存
      if (this.regexCache.has(wordRegexKey)) {
        wordRegex = this.regexCache.get(wordRegexKey)
} else {
        // 使用安全的正则表达式创建方法防止ReDoS攻击
        wordRegex = utils.safeRegExp('\\b' + utils.escapeRegExp(key) + '\\b', 'gi')
if (wordRegex) {
          this.regexCache.set(wordRegexKey, wordRegex)
} else {
          continue; // 如果正则表达式不安全，跳过此键
        }
        }
      
      const wordMatches = text.match(wordRegex)

      if (wordMatches && wordMatches.length > 0) {
        // 记录匹配项，按匹配长度排序
        matches.push({
          key,
          value,
          length: key.length,
          matches: wordMatches.length,
          regex: wordRegex
        })
} else {
        // 如果不是完整单词，也记录匹配项
        const nonWordRegexKey = `nonword_$`
let nonWordRegex

        // 检查正则表达式缓存
        if (this.regexCache.has(nonWordRegexKey)) {
          nonWordRegex = this.regexCache.get(nonWordRegexKey)
} else {
          // 使用安全的正则表达式创建方法防止ReDoS攻击
          nonWordRegex = utils.safeRegExp(utils.escapeRegExp(key), 'g')
if (nonWordRegex) {
            this.regexCache.set(nonWordRegexKey, nonWordRegex)
} else {
            continue; // 如果正则表达式不安全，跳过此键
          }
        }
        
        matches.push({
          key,
          value,
          length: key.length,
          matches: 1,
          regex: nonWordRegex
        })
}
        }

    // 如果没有匹配项，返回null
    if (matches.length === 0) {
      return null
}

    // 按匹配优先级排序
    // 1. 长度（更长的匹配优先）
    // 2. 匹配次数（匹配次数多的优先）
    matches.sort((a, b) => {
      if (b.length !== a.length) {
        return b.length - a.length
}
      return b.matches - a.matches
})

    // 执行替换
    let result = text
let hasReplaced = false

    // 为了避免替换影响后续匹配，最多只替换前N个匹配项
    const maxReplacements = Math.min(5, matches.length)

    for (let i = 0; i < maxReplacements; i++) {
      const match = matches[i]
const newResult = result.replace(match.regex, match.value)

      if (newResult !== result) {
        result = newResult
hasReplaced = true
}
        }

    // 返回替换后的文本或null
    return hasReplaced ? result : null
},

  /**
   * 实现LRU缓存策略的辅助方法：获取缓存项
   * @param key - 缓存键
   * @returns {string|null} 缓存的值，如果不存在返回null
   */
  getFromCache(key) {
    const cacheItem = this.translationCache.get(key)

    if (cacheItem && cacheItem.value) {
      // 更新访问时间和访问次数
      cacheItem.timestamp = Date.now()
cacheItem.accessCount = (cacheItem.accessCount || 0) + 1

      // 更新缓存统计
      this.cacheStats.hits++
this.performanceData.cacheHits++

      return cacheItem.value
}
    
    // 缓存未命中
    this.cacheStats.misses++
this.performanceData.cacheMisses++
return null
},

  /**
   * 实现LRU缓存策略的辅助方法：设置缓存项
   * @param key - 缓存键
   * @param value - 缓存值
   */
  setToCache(key, value) {
    // 检查缓存大小是否超过限制
    this.checkCacheSizeLimit()

    // 创建或更新缓存项
    this.translationCache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    })

    // 更新缓存大小统计
    this.cacheStats.size = this.translationCache.size
},

  /**
   * 检查并维护缓存大小限制
   * 实现真正的LRU（最近最少使用）缓存淘汰策略
   */
  checkCacheSizeLimit() {
    const maxSize = CONFIG.performance.maxDictSize || 1000

    if (this.translationCache.size >= maxSize) {
      // 需要执行LRU清理
      this.performLRUCacheEviction(maxSize)
}
        },

  /**
   * 执行LRU缓存淘汰
   * @param maxSize - 最大缓存大小
   */
  performLRUCacheEviction(maxSize) {
    try {
      // 目标大小设为最大值的80%，为新条目预留空间
      const targetSize = Math.floor(maxSize * 0.8)

      // 获取缓存条目并按LRU策略排序
      const cacheEntries = Array.from(this.translationCache.entries())

      // LRU排序策略：
      // 1. 优先保留最近访问的条目（时间戳降序）
      // 2. 对于相同时间戳，保留访问次数多的条目
      cacheEntries.sort(([, itemA], [, itemB]) => {
        // 主要按时间戳排序（最近访问的优先）
        if (itemB.timestamp !== itemA.timestamp) {
          return itemB.timestamp - itemA.timestamp
}
        // 次要按访问次数排序（访问次数多的优先）
        return (itemB.accessCount || 0) - (itemA.accessCount || 0)
})

      // 保留最重要的条目
      const entriesToKeep = cacheEntries.slice(0, targetSize)
const evictedCount = cacheEntries.length - entriesToKeep.length

      // 重建缓存
      this.translationCache.clear()
entriesToKeep.forEach(([key, item]) => {
        this.translationCache.set(key, item)
})

      // 更新统计信息
      this.cacheStats.evictions += evictedCount
this.cacheStats.size = this.translationCache.size
this.performanceData.cacheEvictions += evictedCount

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] LRU缓存淘汰完成，移除了$项，当前缓存大小：${this.translationCache.size}`)
}
        } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] LRU缓存淘汰失败:', error)
}
      
      // 回退策略：如果LRU失败，清空部分缓存
      try {
        const evictCount = Math.max(50, Math.floor(this.translationCache.size * 0.2))
const oldestEntries = Array.from(this.translationCache.entries())
          .sort(([, itemA], [, itemB]) => itemA.timestamp - itemB.timestamp)
          .slice(0, evictCount)

        oldestEntries.forEach(([key]) => {
          this.translationCache.delete(key)
})

        this.cacheStats.evictions += evictCount
this.cacheStats.size = this.translationCache.size
this.performanceData.cacheEvictions += evictCount
} catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 缓存回退策略失败:', fallbackError)
}
        }
    }
        },

  /**
   * 清理翻译缓存
   * 使用LRU策略进行智能缓存管理
   */
  cleanCache() {
    try {
      // 验证缓存是否存在和有效
      if (!this.translationCache || !(this.translationCache instanceof Map)) {
        if (CONFIG.debugMode) {
          console.warn('[GitHub 中文翻译] 缓存对象不存在或无效')
}
        return
}

      // 执行LRU缓存淘汰
      this.checkCacheSizeLimit()

      // 更新性能数据
      this.performanceData.cacheCleanups = (this.performanceData.cacheCleanups || 0) + 1

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存清理完成，当前大小：${this.translationCache.size}，总命中：${this.cacheStats.hits}，总未命中：${this.cacheStats.misses}`)
}
        } catch (error) {
      // 如果清理过程出错，使用更安全的回退策略
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 缓存清理过程出错，使用回退策略:', error)
}

      try {
        // 最后手段：如果所有清理方法都失败，清空缓存
        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 执行缓存重置作为最后手段')
}
        this.translationCache.clear()
this.cacheStats.size = 0

      } catch (fallbackError) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 缓存重置失败:', fallbackError)
}
        }
    }
        },

  /**
 * 清除翻译缓存
 */
clearCache() {
    // 清除虚拟DOM缓存
    virtualDomManager.clear()
this.translationCache.clear()

    // 清除元素缓存
    this.elementCache = new WeakMap()

    // 重置缓存统计
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    }

    // 重置已翻译标记
    const translatedElements = document.querySelectorAll('[data-github-zh-translated]')
translatedElements.forEach(element => {
      element.removeAttribute('data-github-zh-translated')
})

    if (CONFIG.debugMode) {
      console.log('[GitHub 中文翻译] 翻译缓存已清除，已移除所有翻译标记')
}
        },

  /**
   * 预热词典缓存
   * 预加载常用词典条目到缓存中
   */
  warmUpCache() {
    if (!CONFIG.performance.enableTranslationCache) {
      return
}

    try {
      // 收集常用词汇（这里简单处理，实际项目可能有更复杂的选择逻辑）
      const commonKeys = Object.keys(this.dictionary)
        .filter(key => !this.dictionary[key].startsWith('待翻译: ') && key.length <= 50)
        .slice(0, 100); // 预加载前100个常用词条

      commonKeys.forEach(key => {
        const value = this.dictionary[key]
this.setToCache(key, value)
})

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 缓存预热完成，已预加载${commonKeys.length}个常用词条`)
}
        } catch (error) {
      console.error('[GitHub 中文翻译] 缓存预热失败:', error)
}
        },

  /**
   * 更新词典
   * 支持动态更新词典内容
   * @param newDictionary - 新的词典条目
   */
  updateDictionary(newDictionary) {
    try {
      // 合并新词典
      Object.assign(this.dictionary, newDictionary)

      // 清除缓存，因为词典已更新
      this.clearCache()

      // 重新预热缓存
      this.warmUpCache()

      if (CONFIG.debugMode) {
        console.log(`[GitHub 中文翻译] 词典已更新，新增/修改${Object.keys(newDictionary).length}个条目`)
}
        } catch (error) {
      console.error('[GitHub 中文翻译] 更新词典失败:', error)
}
        }
}

/**
 * 页面监控模块
 * 负责监听GitHub页面的变化，检测DOM更新并触发翻译
 */
/**
 * 页面监控对象
 */
const pageMonitor = {
    /**
     * 观察器实例
     * @type {MutationObserver|null}
     */
    observer: null,
    
    /**
     * 最后翻译的路径
     * @type */
    lastPath: '',
    
    /**
     * 最后翻译的时间戳
     * @type */
    lastTranslateTimestamp: 0,
    
    /**
     * 存储事件监听器引用，用于清理
     * @type {Array<{target: EventTarget, type: string, handler: Function}>}
     */
    eventListeners: [],
    
    /**
     * 存储定时检查的interval ID
     * @type */
    fallbackIntervalId: null,
    
    /**
     * 初始化监控
     */
    init() {
        try {
            // 设置路径变化监听
            this.setupPathListener()

            // 设置DOM变化监听
            this.setupDomObserver()

            // 页面监控已初始化
        } catch (error) {
            console.error('[GitHub 中文翻译] 页面监控初始化失败:', error)
}
        },
    
    /**
     * 设置路径变化监听
     * 用于监听GitHub的SPA路由变化
     */
    setupPathListener() {
        // 保存当前路径
        this.lastPath = window.location.pathname + window.location.search

        // 监听popstate事件
        const popstateHandler = utils.debounce(() => {
            const currentPath = window.location.pathname + window.location.search
if (currentPath !== this.lastPath) {
                this.handlePathChange()
}
        }, CONFIG.routeChangeDelay)

        window.addEventListener('popstate', popstateHandler)
this.eventListeners.push({ target: window, type: 'popstate', handler: popstateHandler })

        // 监听pushState和replaceState方法
        const originalPushState = history.pushState
const originalReplaceState = history.replaceState

        history.pushState = function(...args) {
            originalPushState.apply(this, args)
pageMonitor.handlePathChange()
}

        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args)
pageMonitor.handlePathChange()
}
        },
    
    /**
     * 处理路径变化
     */
    handlePathChange() {
        try {
            const currentPath = window.location.pathname + window.location.search
this.lastPath = currentPath

            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 页面路径变化: $`)
}
            
            // 延迟执行翻译，等待页面内容加载完成
            setTimeout(() => {
                this.translateWithThrottle()
}, CONFIG.routeChangeDelay)
} catch (error) {
            console.error('[GitHub 中文翻译] 路径变化处理失败:', error)
}
        },
    
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断
     */
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断，支持Promise链式调用
     * @returns {Promise<void>} 翻译完成的Promise
     */
    async translateWithThrottle() {
        try {
            const now = Date.now()
// 从配置中读取性能参数，确保有默认值
            const minInterval = CONFIG.performance?.minTranslateInterval || 500; // 最小翻译间隔，默认500ms
            // 批处理大小配置，通过函数参数传入
            const useSmartThrottling = CONFIG.performance?.useSmartThrottling !== false; // 智能节流开关
            
            // 智能节流逻辑
            if (useSmartThrottling) {
                // 根据页面复杂度调整节流阈值
                const complexityFactor = this.isComplexPage() ? 2 : 1
const adjustedInterval = minInterval * complexityFactor

                // 检查是否需要节流
                if (now - this.lastTranslateTimestamp >= adjustedInterval) {
                    return this.delayedTranslate(0); // 立即翻译
                }
                
                // 如果短时间内多次触发，设置一个延迟翻译
                if (!this.scheduledTranslate) {
                    this.scheduledTranslate = setTimeout(() => {
                        this.scheduledTranslate = null
this.delayedTranslate(0)
}, minInterval)
}
                
                return; // 节流生效，退出当前调用
            }
            
            // 普通节流逻辑
            if (now - this.lastTranslateTimestamp >= minInterval) {
                return this.delayedTranslate(0)
} else if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 翻译请求被节流，距离上次翻译${now - this.lastTranslateTimestamp}ms`)
}
        } catch (error) {
            this.handleError('translateWithThrottle', error)
}
        },
    
    /**
     * 延迟执行翻译
     * @param delay - 延迟毫秒数
     */
    async delayedTranslate() {
        try {
            // 确保性能配置正确应用
            const performanceConfig = {
                batchSize: CONFIG.performance?.batchSize || 100,
                usePartialMatch: CONFIG.performance?.usePartialMatch || false,
                enableTranslationCache: CONFIG.performance?.enableTranslationCache || true
            }

            // 记录执行时间
            this.lastTranslateTimestamp = Date.now()

            // 获取当前页面关键区域
            const keyAreas = this.identifyKeyTranslationAreas()

            // 记录性能数据
            if (CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.time('[GitHub 中文翻译] 翻译耗时')
}
            
            // 根据关键区域和性能配置决定翻译方式
            if (keyAreas.length > 0) {
                // 对关键区域进行批处理翻译
                await this.processElementsInBatches(keyAreas, performanceConfig.batchSize)
if (CONFIG.debugMode) {
                    console.log(`[GitHub 中文翻译] 已翻译关键区域: ${keyAreas.length} 个`)
}
        } else {
                // 翻译整个页面
                await translationCore.translate(null, performanceConfig)
if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 已翻译整个页面')
}
        }
            
            // 记录完成时间
            if (CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.timeEnd('[GitHub 中文翻译] 翻译耗时')
}
        } catch (error) {
            return this.handleTranslationError(error)
}
        },
    
    /**
     * 批处理元素翻译
     * @param {HTMLElement[]} elements - 要翻译的元素数组
     * @param batchSize - 每批处理的元素数量
     */
    async processElementsInBatches(elements, batchSize) {
        const performanceConfig = {
            batchSize: batchSize,
            usePartialMatch: CONFIG.performance?.usePartialMatch || false,
            enableTranslationCache: CONFIG.performance?.enableTranslationCache || true
        }

        // 分批处理元素
        for (let i = 0; i < elements.length; i += batchSize) {
            const batch = elements.slice(i, i + batchSize)
await translationCore.translate(batch, performanceConfig)
}
        },
    
    /**
     * 处理翻译错误
     * @param error - 错误对象
     */
    async handleTranslationError(error) {
        this.handleError('翻译过程', error)

        // 即使出错也尝试最小化翻译
        if (CONFIG.performance?.enableErrorRecovery !== false) {
            try {
                await translationCore.translateCriticalElementsOnly()
if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 已尝试最小化翻译恢复')
}
        } catch (recoverError) {
                this.handleError('错误恢复', recoverError)
}
        }
    },
    
    /**
     * 统一错误处理
     * @param operation - 操作名称
     * @param error - 错误对象
     */
    handleError(operation, error) {
        const errorMessage = `[GitHub 中文翻译] $时出错: ${error.message}`
if (CONFIG.debugMode) {
            console.error(errorMessage, error)
} else {
            console.error(errorMessage)
}
        
        // 记录错误次数
        this.errorCount = (this.errorCount || 0) + 1

        // 如果错误过多，考虑重启监控
        if (this.errorCount > (CONFIG.performance?.maxErrorCount || 5)) {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 错误次数过多，尝试重启监控')
}
            setTimeout(() => this.restart(), 1000)
this.errorCount = 0
}
        },
    
    /**
     * 识别当前页面的关键翻译区域
     * 性能优化：只翻译需要的区域而不是整个页面
     * @returns {HTMLElement[]} 关键翻译区域元素数组
     */
    identifyKeyTranslationAreas() {
        const keySelectors = []
const path = window.location.pathname

        // 根据页面类型选择关键区域
        if (/\/pull\/\d+/.test(path) || /\/issues\/\d+/.test(path)) {
            // PR或Issue页面
            keySelectors.push('.js-discussion', '.issue-details', '.js-issue-title', '.js-issue-labels')
} else if (/\/blob\//.test(path)) {
            // 文件查看页面
            keySelectors.push('.blob-wrapper', '.file-header', '.file-info')
} else if (/\/commit\//.test(path)) {
            // 提交详情页面
            keySelectors.push('.commit-meta', '.commit-files', '.commit-body', '.commit-desc')
} else if (/\/notifications/.test(path)) {
            // 通知页面
            keySelectors.push('.notifications-list', '.notification-shelf')
} else if (/\/actions/.test(path)) {
            // Actions页面
            keySelectors.push('.workflow-run-list', '.workflow-jobs', '.workflow-run-header')
} else if (/\/settings/.test(path)) {
            // 设置页面
            keySelectors.push('.settings-content', '.js-settings-content')
} else if (/\/projects/.test(path)) {
            // Projects页面
            keySelectors.push('.project-layout', '.project-columns')
} else if (/\/wiki/.test(path)) {
            // Wiki页面
            keySelectors.push('.wiki-wrapper', '.markdown-body')
} else if (/\/search/.test(path)) {
            // 搜索结果页面
            keySelectors.push('.codesearch-results', '.search-title')
} else if (/\/orgs\//.test(path) || /\/users\//.test(path)) {
            // 组织或用户页面
            keySelectors.push('.org-profile, .profile-timeline', '.user-profile-sticky-header', '.user-profile-main')
} else if (/\/repos\/\w+\/\w+/.test(path)) {
            // 仓库主页面
            keySelectors.push('.repository-content', '.repository-meta-content', '.readme')
} else {
            // 其他页面，使用通用关键区域
            keySelectors.push('.repository-content', '.profile-timeline', '.application-main', 'main')
}
        
        // 获取并过滤存在的元素
        const elements = []
for (const selector of keySelectors) {
            const element = document.querySelector(selector)
if (element) {
                elements.push(element)
}
        }
        
        // 如果没有找到关键区域，尝试使用更通用的选择器
        if (elements.length === 0) {
            const genericSelectors = [
                '#js-pjax-container', '.application-main', 'main', 'body'
            ]

            for (const selector of genericSelectors) {
                const element = document.querySelector(selector)
if (element) {
                    elements.push(element)
break
}
        }
        }
        
        return elements
},
    
    /**
     * 设置DOM变化监听
     * 性能优化：使用更精确的观察范围和优化的配置
     */
    setupDomObserver() {
        try {
            // 先断开之前可能存在的observer
            if (this.observer) {
                try {
                    this.observer.disconnect()
this.observer = null
} catch (error) {
                    if (CONFIG.debugMode) {
                        console.warn('[GitHub 中文翻译] 断开现有observer失败:', error)
}
        }
            }
            
            // 检测当前页面模式
            const pageMode = this.detectPageMode()

            // 选择最优的观察根节点 - 性能优化：减少观察范围
            const rootNode = this.selectOptimalRootNode(pageMode)

            // 根据页面类型调整观察器配置
            const observerConfig = this.getOptimizedObserverConfig(pageMode)

            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 当前页面模式:', pageMode)
}
            
            // 使用命名函数以便调试和维护
            const handleMutations = (mutations) => {
                try {
                    // 检测页面模式
                    const pageMode = this.detectPageMode()
// 智能判断是否需要翻译
                    if (this.shouldTriggerTranslation(mutations, pageMode)) {
                        this.translateWithThrottle()
}
        } catch (error) {
                    console.error('[GitHub 中文翻译] 处理DOM变化时出错:', error)
}
        }

            this.observer = new MutationObserver(utils.debounce(handleMutations, CONFIG.debounceDelay))

            // 开始观察最优根节点
            if (rootNode) {
                try {
                    this.observer.observe(rootNode, observerConfig)
if (CONFIG.debugMode) {
                        console.log('[GitHub 中文翻译] DOM观察器已启动，观察范围:', rootNode.tagName + (rootNode.id ? '#' + rootNode.id : ''))
}
        } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 启动DOM观察者失败:', error)
}
                    // 降级方案
                    this.setupFallbackMonitoring()
}
        } else {
                console.error('[GitHub 中文翻译] 无法找到合适的观察节点，回退到body')
// 如果body还不存在，等待DOMContentLoaded
                const domLoadedHandler = () => {
                    try {
                        this.setupDomObserver(); // 重新尝试设置DOM观察器
                    } catch (error) {
                        if (CONFIG.debugMode) {
                            console.error('[GitHub 中文翻译] DOMContentLoaded后启动观察者失败:', error)
}
        }
                    // 移除一次性监听器
                    document.removeEventListener('DOMContentLoaded', domLoadedHandler)
// 从事件监听器数组中移除
                    this.eventListeners = this.eventListeners.filter(l => !(l.target === document && l.type === 'DOMContentLoaded'))
}

                document.addEventListener('DOMContentLoaded', domLoadedHandler)
this.eventListeners.push({ target: document, type: 'DOMContentLoaded', handler: domLoadedHandler })
}
        } catch (error) {
            console.error('[GitHub 中文翻译] 设置DOM观察器失败:', error)
// 降级方案
            this.setupFallbackMonitoring()
}
        },
    
    /**
     * 选择最佳的DOM观察根节点
     * 减少观察的DOM范围，提高性能
     * @param pageMode - 页面模式
     * @returns 最佳观察根节点
     */
    selectOptimalRootNode(pageMode) {
        // 如果没有提供页面模式，则自动检测
        const effectivePageMode = pageMode || this.detectPageMode()
// 根据页面模式定制候选选择器优先级
        let candidateSelectors
// 基于页面模式的候选选择器列表
        switch (effectivePageMode) {
            case 'search':
                candidateSelectors = [
                    '.codesearch-results', // 搜索结果容器
                    '#js-pjax-container',   // 通用PJAX容器
                    'main',                 // 主内容
                    'body'                  // 降级方案
                ]
break

            case 'issues':
            case 'pullRequests':
                candidateSelectors = [
                    '.js-discussion',       // 讨论区容器
                    '.issue-details',       // 问题详情容器
                    '#js-issue-title',      // 问题标题
                    '#js-pjax-container',   // 通用PJAX容器
                    'main',                 // 主内容
                    'body'                  // 降级方案
                ]
break

            case 'repository':
                candidateSelectors = [
                    '#js-repo-pjax-container', // 仓库页面主容器
                    '.repository-content',     // 仓库内容区域
                    '.application-main',       // 应用主容器
                    'body'                     // 降级方案
                ]
break

            case 'notifications':
                candidateSelectors = [
                    '.notifications-list',    // 通知列表
                    '.notification-shelf',    // 通知顶栏
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'wiki':
                candidateSelectors = [
                    '.wiki-wrapper',         // Wiki内容包装器
                    '.markdown-body',        // Markdown内容
                    '#js-pjax-container',    // 通用PJAX容器
                    'main',                  // 主内容
                    'body'                   // 降级方案
                ]
break

            case 'actions':
                candidateSelectors = [
                    '.workflow-run-list',     // 工作流运行列表
                    '.workflow-jobs',         // 工作流任务列表
                    '.workflow-run-header',   // 工作流运行头部
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'projects':
                candidateSelectors = [
                    '.project-layout',        // 项目布局容器
                    '.project-columns',       // 项目列容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'packages':
                candidateSelectors = [
                    '.packages-list',         // 包列表容器
                    '.package-details',       // 包详情容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'security':
                candidateSelectors = [
                    '.security-overview',     // 安全概览容器
                    '.vulnerability-list',    // 漏洞列表
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'insights':
                candidateSelectors = [
                    '.insights-container',    // 洞察容器
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'settings':
                candidateSelectors = [
                    '.settings-content',      // 设置内容
                    '.js-settings-content',   // JS设置内容
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            case 'profile':
            case 'organizations':
                candidateSelectors = [
                    '.profile-timeline',      // 个人资料时间线
                    '.org-profile',           // 组织资料
                    '.user-profile-main',     // 用户资料主内容
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    'body'                    // 降级方案
                ]
break

            default:
                // 默认选择器优先级
                candidateSelectors = [
                    '#js-pjax-container',     // 通用PJAX容器
                    'main',                   // 主内容
                    '.application-main',      // 应用主容器
                    'body'                    // 降级方案
                ]
}
        
        for (const selector of candidateSelectors) {
            const element = document.querySelector(selector)
if (element && element.textContent.trim().length > 0) {
                return element
}
        }
        
        // 回退到body
        return document.body
},
    
    /**
     * 获取优化的观察器配置
     * 根据页面模式和复杂度动态调整观察选项
     * @param pageMode - 页面模式
     * @returns 优化的MutationObserver配置
     */
    getOptimizedObserverConfig(pageMode) {
        // 如果没有提供页面模式，则自动检测
        pageMode = pageMode || this.detectPageMode()

        // 基础配置
        const baseConfig = {
            childList: true  // 始终监听子节点变化
        }

        // 根据配置决定是否监听字符数据变化
        if (!CONFIG.performance.ignoreCharacterDataMutations) {
            baseConfig.characterData = true
}
        
        // 根据页面模式调整subtree观察选项
        const complexPages = ['wiki', 'issues', 'pullRequests', 'markdown']
const simplePages = ['search', 'codespaces', 'marketplace']

        // 复杂页面可能需要更深入的观察，但要平衡性能
        if (complexPages.includes(pageMode)) {
            baseConfig.subtree = CONFIG.performance.observeSubtree
} else if (simplePages.includes(pageMode)) {
            // 简单页面可以减少观察深度，提高性能
            baseConfig.subtree = false
} else {
            // 默认配置
            baseConfig.subtree = CONFIG.performance.observeSubtree
}
        
        // 根据配置决定是否观察属性变化
        if (CONFIG.performance.observeAttributes && !CONFIG.performance.ignoreAttributeMutations) {
            baseConfig.attributes = true
baseConfig.attributeFilter = CONFIG.performance.importantAttributes
}
        
        return baseConfig
},
    
    /**
     * 判断是否为复杂页面
     * @returns 是否为复杂页面
     */
    isComplexPage() {
        const complexPaths = [
            /\/pull\/\d+/,
            /\/issues\/\d+/,
            /\/blob\//,
            /\/commit\//,
            /\/compare\//
        ]

        return complexPaths.some(pattern => pattern.test(window.location.pathname))
},
    
    /**
     * 检测当前页面模式
     * 复用translationCore中的页面模式检测逻辑
     * @returns 当前页面模式
     */
    detectPageMode() {
        return translationCore.detectPageMode()
},
    
    /**
     * 根据页面模式获取快速路径阈值
     * @param pageMode - 页面模式
     * @returns 快速路径阈值
     */
    getQuickPathThresholdByPageMode(pageMode) {
        const thresholds = {
            'search': 5,
            'issues': 4,
            'pullRequests': 4,
            'wiki': 6,
            'actions': 5,
            'codespaces': 3
        }
return thresholds[pageMode] || 3
},
    
    /**
     * 获取页面模式特定的阈值
     * @param pageMode - 页面模式
     * @returns 页面模式特定的阈值
     */
    getModeSpecificThreshold(pageMode) {
        const thresholds = {
            'issues': 0.35,
            'pullRequests': 0.35,
            'wiki': 0.4,
            'search': 0.3,
            'codespaces': 0.25
        }
return thresholds[pageMode]
},
    
    /**
     * 根据页面模式获取最小文本长度
     * @param pageMode - 页面模式
     * @returns 最小文本长度
     */
    getMinTextLengthByPageMode(pageMode) {
        const lengths = {
            'issues': 4,
            'pullRequests': 4,
            'wiki': 5,
            'search': 3
        }
return lengths[pageMode] || CONFIG.performance.minTextLengthToTranslate || 3
},
    
    /**
     * 根据页面模式判断是否应该跳过元素
     * @param element - 元素
     * @param pageMode - 页面模式
     * @returns 是否应该跳过
     */
    shouldSkipElementByPageMode(element, pageMode) {
        if (!element || !pageMode) return false

        // 通用跳过规则
        if (element.tagName === 'CODE' || element.tagName === 'SCRIPT' || 
            element.tagName === 'STYLE' || element.classList.contains('blob-code')) {
            return true
}
        
        // 特定页面模式的元素跳过规则
        switch (pageMode) {
            case 'codespaces':
                return element.classList.contains('terminal') || 
                       element.classList.contains('command-input') ||
                       element.dataset.terminal
case 'wiki':
                // wiki页面中的代码块
                return element.classList.contains('codehilite') || 
                       element.classList.contains('highlight') ||
                       element.closest('.highlight')
case 'issues':
            case 'pullRequests':
                // 跳过代码块和diff
                return element.classList.contains('blob-code') ||
                       element.classList.contains('diff-line')
case 'search':
                // 搜索页面特定跳过规则
                if (element.classList.contains('search-match')) {
                    return false; // 搜索匹配结果不要跳过
                }
                return element.classList.contains('text-small') ||
                       element.classList.contains('link-gray')
default:
                return false
}
        },
    
    /**
     * 智能判断是否需要触发翻译
     * 比简单的变化检测更高效
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @param pageMode - 当前页面模式
     * @returns 是否需要触发翻译
     */
    shouldTriggerTranslation(mutations, pageMode) {
        // 如果没有提供页面模式，则自动检测
        pageMode = pageMode || this.detectPageMode()
try {
            // 空检查
            if (!mutations || mutations.length === 0) {
                return false
}
            
            // 获取性能配置
            const { 
                importantElements = [], 
                ignoreElements = [], 
                importantAttributes = ['id', 'class', 'href', 'title'],
                mutationThreshold = 30,
                contentChangeWeight = 1,
                importantChangeWeight = 2,
                translationTriggerRatio = 0.3,
                maxMutationProcessing = 50,
                minContentChangesToTrigger = 3,
                ignoreCharacterDataMutations = false,
                ignoreAttributeMutations = false
            } = CONFIG.performance

            // 快速路径：少量变化直接检查，阈值根据页面模式调整
            const quickPathThreshold = this.getQuickPathThresholdByPageMode(pageMode)
if (mutations.length <= quickPathThreshold) {
                return this.detectImportantChanges(mutations, pageMode)
}
            
            // 大量变化时的优化检测
            let contentChanges = 0
let importantChanges = 0
// 限制检查数量，避免处理过多变化
            const maxCheckCount = Math.min(mutations.length, Math.max(mutationThreshold, maxMutationProcessing))

            // 缓存重要元素和忽略元素的匹配结果，避免重复计算
            const elementCheckCache = new WeakMap()

            // 分批处理变化，每批检查一定数量
            for (let i = 0; i < maxCheckCount; i++) {
                const mutation = mutations[i]

                // 根据配置忽略特定类型的变化
                if (ignoreCharacterDataMutations && mutation.type === 'characterData') {
                    continue
}
                if (ignoreAttributeMutations && mutation.type === 'attributes') {
                    continue
}
                
                // 跳过空目标或已缓存为忽略的元素
                if (mutation.target) {
                    // 从缓存获取忽略结果或计算并缓存
                    let isIgnored = elementCheckCache.get(mutation.target)
if (isIgnored === undefined) {
                        isIgnored = this.shouldIgnoreElement(mutation.target, ignoreElements, elementCheckCache, pageMode)
elementCheckCache.set(mutation.target, isIgnored)
}
                    
                    if (isIgnored) {
                        continue
}
                    
                    // 检查是否为重要元素，结果也加入缓存
                    let isImportant = elementCheckCache.get(`important-${mutation.target}`)
if (isImportant === undefined && mutation.target.nodeType === Node.ELEMENT_NODE) {
                        isImportant = this.isImportantElement(mutation.target, importantElements, elementCheckCache, pageMode)
elementCheckCache.set(`important-${mutation.target}`, isImportant)
}
                    
                    // 重要元素变化直接触发翻译
                    if (isImportant) {
                        return true
}
        }
                
                // 检查重要属性变化
                if (mutation.type === 'attributes') {
                    if (CONFIG.performance.observeAttributes && importantAttributes.includes(mutation.attributeName)) {
                        importantChanges++
// 重要属性变化达到阈值直接触发
                        if (importantChanges >= 3) {
                            return true
}
        }
                    continue; // 属性变化检查完毕，继续下一个mutation
                }
                
                // 检查内容相关变化（字符数据或子节点变化）
                if (this.isContentRelatedMutation(mutation, pageMode)) {
                    contentChanges++

                    // 内容变化达到阈值直接触发
                    if (contentChanges >= Math.max(5, minContentChangesToTrigger)) {
                        return true
}
        }
            }
            
            // 检查内容变化是否达到最小触发阈值
            if (contentChanges < minContentChangesToTrigger) {
                return false
}
            
            // 计算加权变化比例
            const weightedChanges = (contentChanges * contentChangeWeight) + (importantChanges * importantChangeWeight)
const totalChangesChecked = maxCheckCount

            // 根据页面模式获取特定阈值或使用默认阈值
            const threshold = this.getModeSpecificThreshold(pageMode) || translationTriggerRatio

            // 根据加权变化比例决定是否触发翻译
            return weightedChanges / totalChangesChecked > threshold
} catch (error) {
            console.error('[GitHub 中文翻译] 判断翻译触发条件时出错:', error)
return false
}
        },
    
    /**
     * 判断元素是否为重要元素
     * @param element - 要检查的元素
     * @param {string[]} importantElements - 重要元素选择器数组
     * @returns 是否为重要元素
     */
    isImportantElement(element, importantElements, cache, pageMode) {
        try {
            // 检查是否应该基于页面模式跳过元素
            if (pageMode && this.shouldSkipElementByPageMode(element, pageMode)) {
                return false
}
            
            // 使用缓存
            if (cache && cache.has(element)) {
                return cache.get(element)
}
            
            // 页面模式特定的重要元素检查
            let isImportant = false

            // 基础重要元素检查
            isImportant = importantElements.some(selector => {
                try {
                    return element.matches(selector)
} catch (e) {
                    return false; // 选择器无效时跳过
                }
        })

            // 页面模式特定的额外检查
            if (!isImportant && pageMode) {
                switch (pageMode) {
                    case 'issues':
                    case 'pullRequests':
                        isImportant = element.classList.contains('comment-body') || 
                                     element.classList.contains('timeline-comment-header')
break
case 'wiki':
                        isImportant = element.classList.contains('markdown-body') || 
                                     element.tagName === 'H1' || 
                                     element.tagName === 'H2'
break
case 'search':
                        isImportant = element.classList.contains('search-match') || 
                                     element.classList.contains('f4')
break
case 'codespaces':
                        isImportant = element.classList.contains('codespace-status')
break
}
        }
            
            // 存储到缓存
            if (cache) {
                cache.set(element, isImportant)
}
            
            return isImportant
} catch (error) {
            console.error('[GitHub 中文翻译] 判断重要元素时出错:', error)
return false
}
        },
    
    /**
     * 判断是否应该忽略元素的变化
     * @param node - 要检查的节点
     * @param {string[]} ignoreElements - 忽略元素选择器数组
     * @returns 是否应该忽略
     */
    shouldIgnoreElement(node, ignoreElements, cache, pageMode) {
        try {
            // 非元素节点不忽略
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return false
}
            
            const element = node

            // 使用缓存
            if (cache && cache.has(node)) {
                return cache.get(node)
}
            
            // 检查是否应该基于页面模式跳过元素
            if (pageMode && this.shouldSkipElementByPageMode(element, pageMode)) {
                if (cache) {
                    cache.set(node, true)
}
                return true
}
            
            // 基础忽略元素检查
            let shouldIgnore = ignoreElements.some(selector => {
                try {
                    return element.matches(selector)
} catch (e) {
                    return false; // 选择器无效时跳过
                }
        })

            // 页面模式特定的忽略规则
            if (!shouldIgnore && pageMode) {
                switch (pageMode) {
                    case 'codespaces':
                        shouldIgnore = element.classList.contains('terminal') || 
                                      element.tagName === 'PRE' || 
                                      element.classList.contains('command-input')
break
case 'wiki':
                        // wiki页面中的代码块不忽略
                        if (element.tagName === 'PRE' && element.classList.contains('codehilite')) {
                            shouldIgnore = true
}
                        break
case 'search':
                        // 搜索页面中的代码片段不忽略
                        if (element.tagName === 'CODE' && !element.classList.contains('search-match')) {
                            shouldIgnore = true
}
                        break
}
        }
            
            // 存储到缓存
            if (cache) {
                cache.set(node, shouldIgnore)
}
            
            return shouldIgnore
} catch (error) {
            console.error('[GitHub 中文翻译] 判断忽略元素时出错:', error)
return false
}
        },
    
    /**
     * 判断是否为内容相关的DOM变化
     * @param mutation - 变更记录
     * @returns 是否为内容相关变化
     */
    isContentRelatedMutation(mutation, pageMode) {
        try {
            // 检查字符数据变化
            if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
                // 判断文本内容变化是否有意义
                const oldValue = mutation.oldValue || ''
const newValue = mutation.target.textContent || ''

                // 忽略纯空白字符的变化
                if (oldValue.trim() === newValue.trim()) {
                    return false
}
                
                // 页面模式特定的文本变化阈值
                const { minLength, lengthDiffThreshold } = this.getTextChangeThreshold(pageMode)

                // 判断变化是否有实质内容
                const hasMeaningfulChange = oldValue !== newValue && 
                                           (newValue.length >= minLength || oldValue.length >= minLength || 
                                            Math.abs(newValue.length - oldValue.length) >= lengthDiffThreshold)

                return hasMeaningfulChange
}
            
            // 检查子节点变化
            if (mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                // 页面模式特定的子节点过滤逻辑
                return Array.from(mutation.addedNodes).some(node => {
                    // 忽略脚本、样式等非内容节点
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node
// 基础过滤
                        if (element.tagName === 'SCRIPT' || 
                            element.tagName === 'STYLE' || 
                            element.tagName === 'META') {
                            return false
}
                        
                        // 页面模式特定过滤
                        if (pageMode) {
                            switch (pageMode) {
                                case 'issues':
                                case 'pullRequests':
                                    // 对于Issues/PR页面，优先关注评论和描述
                                    return element.classList.contains('comment-body') || 
                                           element.classList.contains('timeline-comment') ||
                                           element.classList.contains('js-issue-title')
case 'wiki':
                                    // 对于wiki页面，关注内容和标题
                                    return element.classList.contains('markdown-body') || 
                                           /^H[1-6]$/.test(element.tagName)
case 'codespaces':
                                    // 对于codespaces页面，忽略终端输出
                                    if (element.classList.contains('terminal') || 
                                        element.classList.contains('command-input')) {
                                        return false
}
                                    break
case 'search':
                                    // 搜索结果页面
                                    return element.classList.contains('search-result') || 
                                           element.classList.contains('search-match')
}
        }
                        
                        // 默认接受其他元素
                        return true
}
                    return node.nodeType === Node.TEXT_NODE
})
}
            
            return false
} catch (error) {
            console.error('[GitHub 中文翻译] 判断内容相关变化时出错:', error)
return false
}
        },
    
    /**
     * 判断节点是否需要翻译
     * @param node - 要检查的节点
     * @param pageMode - 当前页面模式
     * @returns 是否需要翻译
     */
    isTranslatableNode(node) {
        // 不再需要页面模式参数，简化函数逻辑
        // 跳过脚本、样式等
        if (node.nodeType === Node.SCRIPT_NODE || 
            node.nodeType === Node.STYLE_NODE || 
            node.nodeType === Node.COMMENT_NODE) {
            return false
}
        
        // 文本节点且有内容
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.trim().length > 5; // 只有足够长的文本才翻译
        }
        
        // 元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            // 跳过已翻译的元素
            if (node.hasAttribute('data-github-zh-translated')) {
                return false
}
            
            // 跳过隐藏元素
            const style = window.getComputedStyle(node)
if (style.display === 'none' || style.visibility === 'hidden') {
                return false
}
            
            // 检查是否为内容容器
            const contentTags = [
                'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'li', 'a', 'button', 'label', 'div', 'td', 'th',
                'pre', 'code', 'blockquote'
            ]

            const tagName = node.tagName.toLowerCase()
const hasContent = node.textContent.trim().length > 0

            // 常见内容容器且有内容，或者包含内容子节点
            return (contentTags.includes(tagName) && hasContent) || 
                   (node.children.length > 0 && this.hasTranslatableChildren(node))
}
        
        return false
},
    
    /**
     * 检查元素是否包含可翻译的子元素
     * @param element - 要检查的元素
     * @returns 是否包含可翻译的子元素
     */
    hasTranslatableChildren(element) {
        // 快速检查：只查看前10个子元素
        const children = Array.from(element.children).slice(0, 10)
return children.some(child => {
            const tagName = child.tagName.toLowerCase()
return ['p', 'span', 'a', 'button', 'label'].includes(tagName) && 
                   child.textContent.trim().length > 0
})
},
    
    /**
     * 设置降级监控方案
     * 当MutationObserver失败时使用
     */
    setupFallbackMonitoring() {
        if (CONFIG.debugMode) {
            console.log('[GitHub 中文翻译] 使用降级监控方案')
}
        
        // 定时检查页面变化
        const fallbackIntervalHandler = () => {
            // 只在页面可见时执行
            if (document.visibilityState === 'visible') {
                this.translateWithThrottle()
}
        }

        const intervalId = setInterval(fallbackIntervalHandler, 30000); // 30秒检查一次
        
        // 保存interval ID以便后续清理
      this.fallbackIntervalId = intervalId
// 也保存到事件监听器数组中便于统一管理
      this.eventListeners.push({ target: window, type: 'interval', handler: null, intervalId: intervalId })
},
    
    /**
     * 获取页面模式特定的文本变化阈值
     * @param pageMode - 页面模式
     * @returns 阈值配置
     */
    getTextChangeThreshold(pageMode) {
        const defaultThresholds = { minLength: 5, lengthDiffThreshold: 3 }

        if (!pageMode) return defaultThresholds

        switch (pageMode) {
            case 'codespaces':
                return { minLength: 8, lengthDiffThreshold: 5 }; // 代码空间更严格
            case 'wiki':
                return { minLength: 3, lengthDiffThreshold: 2 }; // wiki页面更宽松
            case 'issues':
            case 'pullRequests':
                return { minLength: 4, lengthDiffThreshold: 3 }; // 适中阈值
            case 'search':
                return { minLength: 5, lengthDiffThreshold: 4 }; // 搜索结果适中
            default:
                return defaultThresholds
}
        },
    
    /**
     * 检测重要的DOM变化
     * 只在有实际内容变化时触发翻译
     * @param {MutationRecord[]} mutations - 变更记录数组
     * @param pageMode - 页面模式
     * @returns 是否有需要触发翻译的重要变化
     */
    detectImportantChanges(mutations, pageMode) {
        try {
            // 确保页面模式存在
            const currentPageMode = pageMode || this.detectPageMode()

            // 空检查
            if (!mutations || !Array.isArray(mutations)) {
                return false
}
            
            // 从配置中读取性能参数
            const { 
                // minTextLengthToTranslate = 3, // 从getMinTextLengthByPageMode获取
                importantAttributes = ['id', 'class', 'href', 'title', 'placeholder', 'alt'],
                importantElements = ['.btn', '.link', '.header', '.title', '.nav-item']
            } = CONFIG.performance

            // 使用缓存避免重复检查相同的节点
            const nodeCheckCache = new WeakMap()

            // 快速检查：如果是少量变化，优先检查重要属性和字符数据变化
            if (mutations.length <= 2) {
                // 先检查简单的变化类型
                for (const mutation of mutations) {
                    // 字符数据变化检查
                    if (mutation.type === 'characterData' && mutation.target.nodeValue) {
                        const trimmedText = mutation.target.nodeValue.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode)
if (trimmedText.length >= textThreshold.minLength) {
                            return true
}
        }
                    // 重要属性变化检查
                    if (mutation.type === 'attributes' && 
                        importantAttributes.includes(mutation.attributeName)) {
                        return true
}
        }
            }
            
            // 检查是否有实际内容变化
            return mutations.some(mutation => {
                // 子节点变化处理
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 过滤出可见的元素节点
                    return Array.from(mutation.addedNodes).some(node => {
                        // 检查缓存
                        let result = nodeCheckCache.get(node)
if (result !== undefined) {
                            return result
}
                        
                        // 忽略不可翻译的节点类型
                        if (node.nodeType === Node.SCRIPT_NODE || 
                            node.nodeType === Node.STYLE_NODE || 
                            node.nodeType === Node.COMMENT_NODE ||
                            node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                            nodeCheckCache.set(node, false)
return false
}
                        
                        // 文本节点检查
                        if (node.nodeType === Node.TEXT_NODE) {
                            const trimmedText = node.textContent.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode)
const isImportant = trimmedText.length >= textThreshold.minLength
nodeCheckCache.set(node, isImportant)
return isImportant
}
                        
                        // 元素节点检查
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node

                            // 跳过隐藏元素
                            const style = window.getComputedStyle(element)
if (style.display === 'none' || style.visibility === 'hidden') {
                                nodeCheckCache.set(node, false)
return false
}
                            
                            // 根据页面模式跳过特定元素
                        if (this.shouldSkipElementByPageMode(element, currentPageMode)) {
                                nodeCheckCache.set(node, false)
return false
}
                            
                            // 检查是否为重要元素
                        if (this.isImportantElement(element, importantElements, nodeCheckCache, currentPageMode)) {
                                nodeCheckCache.set(node, true)
return true
}
                            
                            // 检查文本内容长度
                            const trimmedText = element.textContent.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode)
if (trimmedText.length >= textThreshold.minLength) {
                                nodeCheckCache.set(node, true)
return true
}
                            
                            // 检查是否包含可翻译的子元素（限制深度以提高性能）
                            const hasTranslatableContent = this.hasTranslatableChildren(element)
nodeCheckCache.set(node, hasTranslatableContent)
return hasTranslatableContent
}
                        
                        nodeCheckCache.set(node, false)
return false
})
}
                
                // 字符数据变化检查
                if (mutation.type === 'characterData' && mutation.target.nodeValue) {
                    const trimmedText = mutation.target.nodeValue.trim()
// 使用页面模式特定的文本长度阈值
                const textThreshold = this.getTextChangeThreshold(currentPageMode)
return trimmedText.length >= textThreshold.minLength
}
                
                // 重要属性变化检查
                if (mutation.type === 'attributes' && 
                    importantAttributes.includes(mutation.attributeName)) {
                    // 对于重要属性，直接认为需要翻译
                    return true
}
                
                return false
})
} catch (error) {
            console.error('[GitHub 中文翻译] 检测重要变化时出错:', error)
return false
}
        },
    
    /**
     * 停止监控
     */
    stop() {
        try {
            // 断开MutationObserver连接
            if (this.observer) {
                try {
                    this.observer.disconnect()
this.observer = null
} catch (obsError) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub 中文翻译] 断开MutationObserver失败:', obsError)
}
        }
            }
            
            // 清理所有事件监听器
            this.cleanupEventListeners()

            // 重置状态
            this.lastPath = ''
this.lastTranslateTimestamp = 0

            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面监控已停止并清理')
}
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 停止监控时出错:', error)
}
        }
    },
    

    
    /**
     * 清理所有注册的事件监听器
     */
    cleanupEventListeners() {
      try {
        // 清理所有事件监听器
        this.eventListeners.forEach(listener => {
          try {
            if (listener.intervalId) {
              // 清理定时器
              clearInterval(listener.intervalId)
} else if (listener.target && listener.type && listener.handler) {
              // 清理DOM事件监听器
              listener.target.removeEventListener(listener.type, listener.handler)
}
        } catch (error) {
            if (CONFIG.debugMode) {
              console.warn(`[GitHub 中文翻译] 移除事件监听器(${listener.type})失败:`, error)
}
        }
        })

        // 清空监听器列表
        this.eventListeners = []
this.fallbackIntervalId = null

        if (CONFIG.debugMode) {
          console.log('[GitHub 中文翻译] 事件监听器已清理')
}
        } catch (error) {
        if (CONFIG.debugMode) {
          console.error('[GitHub 中文翻译] 清理事件监听器失败:', error)
}
        }
    },
    
    /**
     * 重新开始监控
     */
    restart() {
        try {
            this.stop()
this.init()

            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面监控已重启')
}
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 重新开始监控失败:', error)
}
        }
    },
    
    /**
     * 手动触发翻译
     * 提供外部调用接口
     */
    triggerTranslation() {
        // 性能优化：如果启用了虚拟DOM，先检查是否有需要翻译的元素
        if (CONFIG.performance.enableVirtualDom) {
            // 如果页面没有明显变化，可以跳过翻译
            if (this.lastMutationTime && Date.now() - this.lastMutationTime < 500) {
                return
}
        }
        this.translateWithThrottle()
}
        }

/**
 * 开发工具模块
 * 包含字符串提取、自动更新和词典处理等开发工具
 */
// 删除未使用的CONFIG导入
/**
 * 字符串提取器对象
 */
const stringExtractor = {
    /**
     * 收集页面上的字符串
     * @param showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 收集到的字符串集合
     */
    collectStrings(showInConsole = true) {
        const strings = new Set()
utils.collectTextNodes(document.body, strings)

        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 收集到 ${strings.size} 个字符串`)
console.log('收集到的字符串:', strings)
}
        
        return strings
},
    
    /**
     * 查找未翻译的字符串
     * @param showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 未翻译的字符串集合
     */
    findUntranslatedStrings(showInConsole = true) {
        const allStrings = this.collectStrings(false)
const untranslated = new Set()

        // 合并所有词典
        const mergedDictionary = {}
for (const module in translationModule) {
            Object.assign(mergedDictionary, translationModule[module])
}
        
        // 检查每个字符串是否已翻译
        allStrings.forEach(string => {
            if (!mergedDictionary[string] || mergedDictionary[string].startsWith('待翻译: ')) {
                untranslated.add(string)
}
        })

        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 找到 ${untranslated.size} 个未翻译的字符串`)
console.log('未翻译的字符串:', untranslated)
}
        
        return untranslated
}
        }

/**
 * 自动字符串更新器类
 */
class AutoStringUpdater {
    constructor() {
        this.processedCount = 0
}
    
    /**
     * 查找需要添加的字符串
     * @returns {Set<string>} 需要添加的字符串集合
     */
    findStringsToAdd() {
        const untranslated = stringExtractor.findUntranslatedStrings(false)
return new Set(Array.from(untranslated).filter(str => !str.startsWith('待翻译: ')))
}
    
    /**
     * 生成更新报告
     * @returns 更新报告对象
     */
    generateUpdateReport() {
        const stringsToAdd = this.findStringsToAdd()
return {
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href,
            pageTitle: document.title,
            stringsToAdd: Array.from(stringsToAdd),
            totalNew: stringsToAdd.size
        }
        }
    
    /**
     * 在控制台显示报告
     */
    showReportInConsole() {
        const report = this.generateUpdateReport()
console.log('[GitHub 中文翻译] 字符串更新报告')
console.log(`📄 页面: ${report.pageTitle}`)
console.log(`✅ 找到 ${report.totalNew} 个新字符串`)
}
        }

/**
 * 词典处理器类
 */
class DictionaryProcessor {
    constructor() {
        this.processedCount = 0
}
    
    /**
     * 合并词典
     * @returns 合并后的词典
     */
    mergeDictionaries() {
        const merged = {}
for (const module in translationModule) {
            Object.assign(merged, translationModule[module])
}
        return merged
}
    
    /**
     * 验证词典
     * @returns 词典验证结果
     */
    validateDictionary() {
        const dictionary = this.mergeDictionaries()
const total = Object.keys(dictionary).length
const untranslated = Array.from(stringExtractor.findUntranslatedStrings(false)).length
return {
            totalEntries: total,
            translatedEntries: total - untranslated,
            completionRate: total > 0 ? ((total - untranslated) / total * 100).toFixed(2) : '0.00'
        }
        }
    
    /**
     * 在控制台显示统计信息
     */
    showStatisticsInConsole() {
        const stats = this.validateDictionary()
console.log('[GitHub 中文翻译] 词典统计')
console.log(`📊 总条目数: ${stats.totalEntries}`)
console.log(`✅ 已翻译条目: ${stats.translatedEntries}`)
console.log(`📈 完成率: ${stats.completionRate}%`)
}
        }

/**
 * 加载工具类
 * @returns 包含工具类的对象
 */
function loadTools() {
    return { 
        stringExtractor, 
        AutoStringUpdater, 
        DictionaryProcessor 
    }
        }

/**
 * GitHub 中文翻译主入口文件
 * 整合所有模块并初始化脚本
 */

// 导入核心模块
/**
 * 初始化脚本
 */
async function init() {
    try {
        // 检查更新
        if (CONFIG.updateCheck.enabled) {
            versionChecker.checkForUpdates().catch(() => {
                // 静默失败，不影响用户体验
            })
}
        
        // 初始化翻译核心功能
        translationCore.translate()

        // 初始化页面监控
        pageMonitor.init()

        // 初始化配置界面
        configUI.init()
} catch (error) {
        console.error('[GitHub 中文翻译] 脚本初始化失败:', error)
}
        }

/**
 * 启动脚本
 */
function startScript() {
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await init()
})
} else {
        // 如果DOM已经加载完成，直接初始化
        init()
}
        }

// 将核心模块暴露到全局作用域，便于调试和配置界面使用
if (typeof window !== 'undefined') {
    window.translationCore = translationCore
window.configUI = configUI
}

// 🕒 启动脚本
startScript();