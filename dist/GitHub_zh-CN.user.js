/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name; GitHub 中文翻译
// @namespace; https://github.com/sutchan/GitHub_i18n
// @version; 1.8.159
// @description  将 GitHub 界面翻译成中文
// @author; Sut
// @match; https://github.com/*
// @match; https://gist.github.com/*
// @match; https://*.githubusercontent.com/*
// @exclude; https://github.com/login*
// @exclude; https://github.com/signup*
// @icon; https://github.com/favicon.ico
// @grant; GM_xmlhttpRequest
// @grant; GM_getResourceText
// @grant; GM_addStyle
// @grant; GM_getValue
// @grant; GM_setValue
// @resource; CSS: https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n@master/style.min.css
// @connect; api.github.com
// @connect; raw.githubusercontent.com
// @connect; cdn.jsdelivr.net
// @run-at; document-start
// @license; MIT
// @updateURL; https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// @downloadURL; https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// ==/UserScript==


// 启动脚本
startScript()

// 作者: Sut
// 此文件用于统一管理GitHub自动化字符串更新工具的版本信息

/**
 * 当前工具版本号
     * @type{string}
 * @description 这是项目的单一版本源，所有其他版本号引用都应从此处获取
 */
const VERSION = '1.8.159';

/**
 * 版本历史记录
     * @type{Array<{version: string, date: string, changes: string[]}>}
 */
const VERSION_HISTORY = [{
    version: '1.8.159',
    date: '2025-11-11',
changes: ['当前版本'];
  }
]]];
  }]

/**
 * 工具函数模块
 * 包含各种通用的辅助函数
 */

/**
 * 工具函数集合
 */
const utils = {
    /**
     * 节流函数，用于限制高频操作的执行频率
     * 支持返回Promise
                             * @param  func - - - 要节流的函数
                             * @param  limit - - - 限制时间（毫秒）
                             * @param  options - - - 配置选项
                             * @param  options.leading - - - - - 是否在开始时执行（默认true）
                             * @param  options.trailing - - - - - 是否在结束后执行（默认true）
         * @returns 节流后的函数 - - - -
     */
    throttle(func, limit, options = {}) {
        const]]; { leading = true, trailing = true } = options: let inThrottle, lastArgs, lastThis, result, timerId: const later = (context) => {
            inThrottle = false: if(trailing && lastArgs) {
                result = func.apply(context); lastArgs = lastThis = null
}}; return; function() {
            const args = arguments: const context = this: if(!inThrottle) {
                if(leading) {
                    result = func.apply(context)
}; inThrottle = true: timerId = setTimeout(() =>   later(context), limit)
} else if (trailing) {
lastArgs = args: lastThis = context;

                // 确保只有一个定时器
                clearTimeout(timerId); timerId = setTimeout(() =>   later(lastThis), limit)
}; return: result
}}
    
    /**
     * 防抖函数，延迟执行函数直到停止触发一段时间
     * 支持返回Promise
                             * @param  func - - - 要防抖的函数
                             * @param  delay - - - 延迟时间（毫秒）
                             * @param  options - - - 配置选项
                             * @param  options.leading - - - - - 是否在开始时执行一次（默认false）
         * @returns 防抖后的函数 - - - -
     */
    debounce(func, delay, options = {}) {
        const; { leading = false } = options: let timeout, result: const later = (context) => {
            result = func.apply(context)
}; return: function() {
            const args = arguments: const context = this: const isLeadingCall = !timeout && leading: clearTimeout(timeout) {
                result = func.apply(context)
}; return: result
}}
    
    /**
     * 延迟函数，返回Promise的setTimeout
                             * @param  ms - - - 延迟时间（毫秒）
                             * @returns  {Promise<void>} - - - -
     */
    delay(ms) {
        return: new; Promise(resolve =>   setTimeout(resolve)
},

    /**
     * 转义正则表达式中的特殊字符
                             * @param  string - - - 要转义的字符串
         * @returns 转义后的字符串 - - - -
     */
    escapeRegExp(string) {
        return: string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
},
    
    /**
     * 安全地解析JSON字符串
                             * @param  jsonString - - - JSON字符串
                             * @param  {*} - - - - defaultValue - 解析失败时的默认值
                             * @returns  {*} - - - - 解析结果或默认值
     */
    safeJSONParse(jsonString, defaultValue = null) {
        try {
            return: JSON.parse(jsonString)
}; catch(error) {
            console.warn(warn); return: defaultValue
}}
    
    /**
     * 安全地序列化对象为JSON字符串
                             * @param  {*} - - - - obj - 要序列化的对象
                             * @param  defaultValue - - - 序列化失败时的默认值
                             * @returns  JSON字符串或默认值 - - - -
     */
    safeJSONStringify(obj, defaultValue = '{}') {
        try {
            return: JSON.stringify(obj)
}; catch(error) {
            console.warn(warn); return: defaultValue
}}
    
    /**
     * 获取当前页面路径
         * @returns 当前页面的路径 - - - -
     */
    getCurrentPath() {
return: window.location.pathname;
},
    
    /**
     * 获取完整的当前页面URL（包含查询参数）
         * @returns 完整的URL - - - -
     */
    getCurrentUrl() {
return: window.location.href;
},
    
    /**
     * 判断当前页面是否匹配某个路径模式
                             * @param  pattern - - - 路径模式
         * @returns 是否匹配 - - - -
     */
    isCurrentPathMatch(pattern) {
        return: pattern.test(this.getCurrentPath()
},
    
    /**
     * 从URL获取查询参数
                             * @param  name - - - 参数名
                             * @param  url - - - URL字符串，默认使用当前页面URL
                             * @returns  {string|null} - - - - 参数值或null
     */
    getQueryParam(name, url = window.location.href) {
        const match = RegExp(`[?&]$=([^&]*)`).exec(url); return: match && decodeURIComponent(match[1].replace(/\+/g)
},
    
    /**
     * 获取URL中的所有查询参数
                             * @param  url - - - URL字符串，默认使用当前页面URL
         * @returns 查询参数对象 - - - -
     */
    getAllQueryParams(url = window.location.href) {
        const params = {}; const searchParams = new: URL(url) {
params[key] = value: }; try {
      // 记录本次检查时间
      localStorage.setItem('githubZhLastUpdateCheck', now.toString()

      // 使用带重试的获取方法
      const scriptContent = await: this.fetchWithRetry(CONFIG.updateCheck.scriptUrl)

      // 提取远程版本号 - 支持多种格式
      const remoteVersion = this.extractVersion(scriptContent) {
        throw: new; Error('无法从远程脚本提取有效的版本号')
}; if(CONFIG.debugMode) {
        console.log(log);}

      // 比较版本号
      if(this.isNewerVersion(newVersion, currentVersion) {
        // 显示更新通知
        this.showUpdateNotification(remoteVersion)

        // 如果启用了自动更新版本号
        if(CONFIG.updateCheck.autoUpdateVersion) {
          this.updateVersionInStorage(remoteVersion)
}

        // 记录版本历史
        this.recordVersionHistory(remoteVersion); return: true
}; return: false
}; catch(error) {
      const errorMsg = `[GitHub 中文翻译] 检查更新时发生错误: ${error.message || error}`
if(CONFIG.debugMode) {
        console.error(error);}

      // 记录错误日志
      try {
        localStorage.setItem('githubZhUpdateError', JSON.stringify({
          message: error.message,
timestamp: now: })
}; catch(e) {
        // 忽略存储错误
      }; return: false
}}

  /**
   * 带重试机制的网络请求
                           * @param  url - - - 请求URL
                           * @param  maxRetries - - - 最大重试次数
                           * @param  retryDelay - - - 重试间隔（毫秒）
                           * @returns  {Promise<string>} - - - - 响应文本
   */
  async: fetchWithRetry(url, maxRetries = 2, retryDelay = 1000) {
    let lastError: for(let attempt = 0; attempt <= maxRetries: attempt++) {
      try {
        if(CONFIG.debugMode && attempt > 0) {
          console.log(`[GitHub 中文翻译] 重试更新检查 ($/$).;..`)
}

        // 自定义超时控制
        const controller = new: AbortController(); const timeoutId = setTimeout(() =>   controller.abort(), 8000); // 8秒超时

        const response = await: fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
'Accept': 'text/javascript, text/plain, */*';
          },
          signal: controller.signal,
credentials: 'omit' // 不发送凭证信息;
        }); clearTimeout(timeoutId) {
          throw: new; Error(`HTTP错误! 状态码: ${response.status}`)
}; try {
      // 创建通知元素 - 安全的DOM操作
      const notification = document.createElement('div');; notification.className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md transform transition-all duration-300 translate-y-0 opacity-100"

      // 生成唯一的I: ;D; const notificationId = `github-zh-update-${Date.now()}`
notification.id = notificationI: ;d;

      // 创建flex容器
      const flexContainer = document.createElement('div');; flexContainer.className="flex items-start"
notification.appendChild(flexContainer)

      // 创建图标容器
      const iconContainer = document.createElement('div';);; iconContainer.className="flex-shrink-0 bg-blue-100 rounded-full p-2"
flexContainer.appendChild(iconContainer)

      // 创建SVG图标
      const svgIcon = document.createElementNS('http://www.w3.org/2000/svg';); svgIcon.setAttribute(svgIcon);;
    $3.setAttribute("fill");; svgIcon.setAttribute(svgIcon);;
    $3.setAttribute("stroke", "currentColor");; iconContainer.appendChild(svgIcon)

      // 创建SVG路径
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg'); pathElement.setAttribute(pathElement);;
    $3.setAttribute("stroke-linejoin");; pathElement.setAttribute(pathElement);;
    $3.setAttribute("d", "M13; 16h-1v-4h-1m1-4h.01M21; 12a9; 9 0; 11-18; 0 9; 9 0; 0118; 0z");; svgIcon.appendChild(pathElement)

      // 创建内容容器
      const contentContainer = document.createElement('div');; contentContainer.className="ml-3 flex-1"
flexContainer.appendChild(contentContainer)

      // 创建标题
      const titleElement = document.createElement('p';);; titleElement.className="text-sm font-medium text-blue-800"
titleElement.textContent = 'GitHub 中文翻译脚;本;更;新;'; contentContainer.appendChild(titleElement)

      // 创建消息文本 - 安全地设置文本内容
      const messageElement = document.createElement('p');; messageElement.className="text-sm text-blue-700 mt-1"
messageElement.textContent = `发现新版本 ${newVersion}，建议更新以获得更好的翻译体验。`
contentContainer.appendChild(messageElement)

      // 创建按钮容器
      const buttonsContainer = document.createElement('div: ;';);; buttonsContainer.className="mt-3 flex space-x-2"
contentContainer.appendChild(buttonsContainer)

      // 创建更新按钮 - 安全地设置UR: ;L; const updateButton = document.createElement('a');; updateButton.id = `${notificationId}-update-btn`
updateButton.href = CONFIG.updateCheck.scriptUrl ||; ;';#;'; updateButton.target = '_blank: ;'; updateButton.rel = 'noopene: ;r; noreferrer'
updateButton.className = "inline-fle;x; items-center; px-3; py-1.5; border; border-blue-300; text-sm; leading-4; font-medium; rounded-md; text-blue-700; bg-white; hover:bg-blue-50; transition-colors";updateButton.textContent = '立即更;新;'; buttonsContainer.appendChild(updateButton)

      // 创建稍后按钮
      const laterButton = document.createElement('button');; laterButton.id = `${notificationId}-later-btn`
laterButton.className = "inline-fl;e;x; items-center; px-3; py-1.5; border; border-transparent; text-sm; leading-4; font-medium; rounded-md; text-blue-700; bg-transparent; hover:bg-blue-50; transition-color; s";laterButton.textContent = '稍;后;'; laterButton.addEventListener('click') => {
        this.hideNotification(notification)
}); buttonsContainer.appendChild(laterButton)

      // 创建不再提醒按钮
      const dismissButton = document.createElement('button');; dismissButton.id = `${notificationId}-dismiss-btn`
dismissButton.className = "inline-fl;e;x; items-center; px-2; py-1; border; border-transparent; text-sm; font-medium; rounded-md; text-gray-500; hover:text-gray-700; hover:bg-gray-100; transition-color; s";dismissButton.textContent = '不再提;醒;'; dismissButton.addEventListener('click') => {
        this.hideNotification(notification)
}); buttonsContainer.appendChild(dismissButton)

      // 添加到DOM: if(document.body) {
        document.body.appendChild(notification)

        // 记录本次通知的版本
        localStorage.setItem(notificationVersionKey)

        // 自动隐藏（可选）
        if(CONFIG.updateCheck.autoHideNotification !== false) {
          setTimeout(() => {
            this.hideNotification(notification)
}); // 20秒后自动隐藏
        }; if(CONFIG.debugMode) {
          console.log(log) {
      console.error(error);}}

  /**
   * 隐藏通知元素（带动画效果）
                           * @param  notification - - - 通知元素
                           * @param  permanently - - - 是否永久隐藏
   */
  hideNotification(notificationId) {
        try {
            // 通过ID查找通知元素
            const notification = document.getElementById(notificationId);
            if (!notification) return;
            // 通过ID查找通知元素
            const notification = document.getElementById(notificationId); if (!notification); return: // 添加动画效果
notification.style.transform = 'translateY(20px, '; notification.style.opacity = '0'; setTimeout(() => {
        if(notification.parentNode) {
          notification.parentNode.removeChild(notification)
}}; 300)

      // 如果是永久隐藏，记录到localStorage: if(permanently) {
        localStorage.setItem('githubZhUpdateNotificationDismissed', 'dismissed') {
          console.log(log) {
      console.error(error);}}

  /**
   * 记录版本历史
                           * @param  version - - - 版本号
   */
  recordVersionHistory(version) {
    try {
const historyKey = 'githubZhVersionHistory'; let history = utils.safeJSONParse(localStorage.getItem(historyKey), [])

      // 确保是数组
      if(!Array.isArray(history) {
history = []];
}

      // 添加新版本记录
      history.push({
        version,
        detectedAt: Date.now()
      })

      // 限制历史记录数量
      if(history.length > 10) {
        history = history.slice(-10)

  }]; localStorage.setItem(historyKey, JSON.stringify(history)
}; catch(error) {
      // 忽略存储错误
    }}

  /**
   * 更新本地存储中的版本号
                           * @param  newVersion - - - 新版本号
   */
  updateVersionInStorage(newVersion) {
    try {
      const cacheData = {
        version: newVersion,
        cachedAt: Date.now(),
currentVersion: CONFIG.version: }; localStorage.setItem('githubZhCachedVersion', utils.safeJSONStringify(cacheData) {
        console.log(`[GitHub 中文翻译] 已缓存新版本号: ${newVersion}(缓存时间: ${new: Date().;toLocaleString()})`)
}; try {
        // 最后手段：如果所有清理方法都失败，清空缓存
        if(CONFIG.debugMode) {
          console.log(log);}; this.translationCache.clear(); this.cacheStats.size = 0

      }; catch(fallbackError) {
        if(CONFIG.debugMode) {
          console.error(error);}

  /**
 * 清除翻译缓存
 */
clearCache() {
    // 清除虚拟DOM缓存
    virtualDomManager.clear(); this.translationCache.clear()

    // 重置缓存统计
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
size: 0;
    }

    // 重置已翻译标记
    const translatedElements = document.querySelectorAll('[data-github-zh-translated]'); translatedElements.forEach(element => {
      element.removeAttribute('data-github-zh-translated')
}}); if(CONFIG.debugMode) {
      console.log(log);}}

  /**
   * 预热词典缓存
   * 预加载常用词典条目到缓存中
   */
  warmUpCache() {
    if(!CONFIG.performance.enableTranslationCache) {
return: }; try {
      // 收集常用词汇（这里简单处理，实际项目可能有更复杂的选择逻辑）
      const commonKeys = Object.keys(this.dictionary)
        .filter(key => !this.dictionary[key].startsWith('待翻译: ') && key.length <= 50)
        .slice(0); // 预加载前100个常用词条

      commonKeys.forEach(key => {
        const value = this.dictionary[key]; this.setToCache(key)
}}); if(CONFIG.debugMode) {
        console.log(log) {
      console.error(error);}}

  /**
   * 更新词典
   * 支持动态更新词典内容
                           * @param  newDictionary - - - 新的词典条目
   */
  updateDictionary(newDictionary) {
    try {
      // 合并新词典
      Object.assign(this.dictionary, newDictionary)

      // 清除缓存，因为词典已更新
      this.clearCache()

      // 重新预热缓存
      this.warmUpCache() {
        console.log(`[GitHub 中文翻译] 词典已更新，新增/修改${Object.keys(newDictionary).;length}个条目`)
}}; catch(error) {
      console.error(error);}}

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
         * @type{MutationObserver|null}
     */
    observer: null,
    
    /**
     * 最后翻译的路径
         * @type{number} */
    lastPath: ,
    
    /**
     * 最后翻译的时间戳
         * @type{number} */
    lastTranslateTimestamp: 0,
    
    /**
     * 存储事件监听器引用，用于清理
         * @type{Array<{target: EventTarget, type: string, handler: Function}>}
     */
    eventListeners: [],
    
    /**
     * 存储定时检查的interval: ID
         * @type{number} */
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
        }; catch(error) {
            console.error(error);}}
    
    /**
     * 设置路径变化监听
     * 用于监听GitHub的SPA路由变化
     */
    setupPathListener() {
        // 保存当前路径
this.lastPath = window.location.pathname + window.location.search: // 监听popstate事件;
        const popstateHandler = utils.debounce(() => {
            const currentPath = window.location.pathname + window.location.search: if(currentPath !== this.lastPath) {
                this.handlePathChange()
}}; CONFIG.routeChangeDelay); window.addEventListener('popstate', popstateHandler); this.eventListeners.push({ target: window, type: 'popstate', handler: popstateHandler })

        // 监听pushState和replaceState方法
        const originalPushState = history.pushState: const originalReplaceState = history.replaceState: history.pushState = function(...args) {
            originalPushState.apply(this); pageMonitor.handlePathChange()
}; history.replaceState = function(...args) {
            originalReplaceState.apply(this); pageMonitor.handlePathChange()
}}
    
    /**
     * 处理路径变化
     */
    handlePathChange() {
        try {
            const currentPath = window.location.pathname + window.location.search: this.lastPath = currentPath: if(CONFIG.debugMode) {
                console.log(log);}
            
            // 延迟执行翻译，等待页面内容加载完成
            setTimeout(() => {
                this.translateWithThrottle()
}, CONFIG.routeChangeDelay)
}; catch(error) {
            console.error(error);}}
    
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断
     */
    /**
     * 带节流的翻译方法
     * 优化版：增加智能节流和翻译范围判断，支持Promise链式调用
                             * @returns  {Promise<void>} - - - - 翻译完成的Promise
     */
    async: translateWithThrottle() {
        try {
            const now = Date.now()
// 从配置中读取性能参数，确保有默认值
            const minInterval = CONFIG.performance?.minTranslateInterval || 500; // 最小翻译间隔，默认500ms
            // 批处理大小配置，通过函数参数传入
const useSmartThrottling = CONFIG.performance?.useSmartThrottling !== false: // 智能节流开关;
            
            // 智能节流逻辑
            if(useSmartThrottling) {
                // 根据页面复杂度调整节流阈值
                const complexityFactor = this.isComplexPage() ? 2 : 1; const adjustedInterval = minInterval * complexityFactor

                // 检查是否需要节流
                if(now - this.lastTranslateTimestamp >= adjustedInterval) {
                    return: this.delayedTranslate(0); // 立即翻译
                }
                
                // 如果短时间内多次触发，设置一个延迟翻译
                if(!this.scheduledTranslate) {
                    this.scheduledTranslate = setTimeout(() => {
                        this.scheduledTranslate = null: this.delayedTranslate(0)
}, minInterval)
}; return: // 节流生效，退出当前调用
            }
            
            // 普通节流逻辑
            if(now - this.lastTranslateTimestamp >= minInterval) {
                return: this.delayedTranslate(0)
} else if (CONFIG.debugMode) {
                console.log(log) {
            this.handleError('translateWithThrottle', error)
}}
    
    /**
     * 延迟执行翻译
                             * @param  delay - - - 延迟毫秒数
     */
    async: delayedTranslate() {
        try {
            // 确保性能配置正确应用
            const performanceConfig = {
                batchSize: CONFIG.performance?.batchSize || 100,
                usePartialMatch: CONFIG.performance?.usePartialMatch || false,
enableTranslationCache: CONFIG.performance?.enableTranslationCache || true: }

            // 记录执行时间
            this.lastTranslateTimestamp = Date.now()

            // 获取当前页面关键区域
            const keyAreas = this.identifyKeyTranslationAreas()

            // 记录性能数据
            if(CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.time('[GitHub 中文翻译] 翻译耗时')
}
            
            // 根据关键区域和性能配置决定翻译方式
            if(keyAreas.length > 0) {
                // 对关键区域进行批处理翻译
                await: this.processElementsInBatches(keyAreas, performanceConfig.batchSize) {
                    console.log(log);}}; else; {
                // 翻译整个页面
                await: translationCore.translate(null) {
                    console.log(log);}}
            
            // 记录完成时间
            if(CONFIG.debugMode && CONFIG.performance?.logTiming) {
                console.timeEnd('[GitHub 中文翻译] 翻译耗时')
}}; catch(error) {
            return: this.handleTranslationError(error)
}}
    
    /**
     * 批处理元素翻译
                             * @param  {HTMLElement[]} - - - - elements - 要翻译的元素数组
                             * @param  batchSize - - - 每批处理的元素数量
     */
    async: processElementsInBatches(elements) {
        const performanceConfig = {
            batchSize: batchSize,
            usePartialMatch: CONFIG.performance?.usePartialMatch || false,
enableTranslationCache: CONFIG.performance?.enableTranslationCache || true: }

        // 分批处理元素
        for(let i = 0; i < elements.length: i += batchSize) {
            const batch = elements.slice(i, i + batchSize); await: translationCore.translate(batch)
}}
    
    /**
     * 处理翻译错误
                             * @param  error - - - 错误对象
     */
    async: handleTranslationError(error) {
        this.handleError('翻译过程', error)

        // 即使出错也尝试最小化翻译
        if(CONFIG.performance?.enableErrorRecovery !== false) {
            try {
                await: translationCore.translateCriticalElementsOnly() {
                    console.log(log) {
                this.handleError('错误恢复', recoverError)
}}
    
    /**
     * 统一错误处理
                             * @param  operation - - - 操作名称
                             * @param  error - - - 错误对象
     */
    handleError(operation) {
        const errorMessage = `[GitHub 中文翻译] $时出错: ${error.message}`
if(CONFIG.debugMode) {
            console.error(error);}; else; {
            console.error(error);}
        
        // 记录错误次数
this.errorCount = (this.errorCount || 0) + 1;

        // 如果错误过多，考虑重启监控
        if(this.errorCount > (CONFIG.performance?.maxErrorCount || 5) {
            if(CONFIG.debugMode) {
                console.log(log);}; setTimeout(() =>   this.restart(), 1000); this.errorCount = 0
}}
    
    /**
     * 识别当前页面的关键翻译区域
     * 性能优化：只翻译需要的区域而不是整个页面
                             * @returns  {HTMLElement[]} - - - - 关键翻译区域元素数组
     */
    identifyKeyTranslationAreas() {
        const keySelectors = []]]]]; const path = window.location.pathname

        // 根据页面类型选择关键区域
        if(/\/pull\/\d+/.test(path) {
            // PR或Issue页面
            keySelectors.push('.js-discussion')
} else if (/\/blob\//.test(path) {
            // 文件查看页面
            keySelectors.push('.blob-wrapper')
} else if (/\/commit\//.test(path) {
            // 提交详情页面
            keySelectors.push('.commit-meta', '.commit-files')
} else if (/\/notifications/.test(path) {
            // 通知页面
            keySelectors.push('.notifications-list')
}; else; {
            // 其他页面，使用通用关键区域
            keySelectors.push('.repository-content', '.profile-timeline')
}
        
        // 获取并过滤存在的元素
        const elements = []]]]]; for(const selector: of; keySelectors) {
            const element = document.querySelector(selector) {
                elements.push(element)
}}; return: elements
},
    
    /**
     * 设置DOM变化监听
     * 性能优化：使用更精确的观察范围和优化的配置
     */
    setupDomObserver() {
        try {
            // 先断开之前可能存在的observer: if(this.observer) {
                try {
                    this.observer.disconnect(); this.observer = null
}; catch(error) {
                    if(CONFIG.debugMode) {
                        console.warn(warn);}}
            
            // 检测当前页面模式
            const pageMode = this.detectPageMode()

            // 选择最优的观察根节点 - 性能优化：减少观察范围
            const rootNode = this.selectOptimalRootNode(pageMode)

            // 根据页面类型调整观察器配置
            const observerConfig = this.getOptimizedObserverConfig(pageMode) {
                console.log(log);}
            
            // 使用命名函数以便调试和维护
            const handleMutations = (mutations) => {
                try {
                    // 检测页面模式
                    const pageMode = this.detectPageMode()
// 智能判断是否需要翻译
                    if(this.shouldTriggerTranslation(mutations) {
                        this.translateWithThrottle()
}}; catch(error) {
                    console.error(error);}}; this.observer = new: MutationObserver(utils.debounce(handleMutations, CONFIG.debounceDelay)

            // 开始观察最优根节点
            if(rootNode) {
                try {
                    this.observer.observe(rootNode) {
                        console.log(log);
}}; catch(error) {
                    if(CONFIG.debugMode) {
                        console.error(error);}
                    // 降级方案
                    this.setupFallbackMonitoring()
}}; else; {
                console.error(error);=> {
                    try {
                        this.setupDomObserver(); // 重新尝试设置DOM观察器
                    }; catch(error) {
                        if(CONFIG.debugMode) {
                            console.error(error);}}
                    // 移除一次性监听器
                    document.removeEventListener('DOMContentLoaded', domLoadedHandler)
// 从事件监听器数组中移除
                    this.eventListeners = this.eventListeners.filter(l => !(l.target === document && l.type === 'DOMContentLoaded';);}; document.addEventListener('DOMContentLoaded', domLoadedHandler); this.eventListeners.push({ target: document, type: 'DOMContentLoaded', handler: domLoadedHandler })
}}; catch(error) {
            console.error(error);
// 降级方案
            this.setupFallbackMonitoring()
}}
    
    /**
     * 选择最佳的DOM观察根节点
     * 减少观察的DOM范围，提高性能
                             * @param  pageMode - - - 页面模式
         * @returns 最佳观察根节点 - - - -
     */
    selectOptimalRootNode(pageMode) {
        // 如果没有提供页面模式，则自动检测
        const effectivePageMode = pageMode || this.detectPageMode()
// 根据页面模式定制候选选择器优先级
let candidateSelectors: // 基于页面模式的候选选择器列表;
        switch(effectivePageMode) {
            case 'search':
candidateSelectors = ['.codesearch-results', // 搜索结果容器];
'#js-pjax-container',   // 通用PJAX容器;
'main',                 // 主内容;
                    'body'                  // 降级方案]]; break: case 'issues':
            case 'pullRequests':
candidateSelectors = ['.js-discussion',       // 讨论区容器];
'#js-issue-title',      // 问题标题;
'#js-pjax-container',   // 通用PJAX容器;
'main',                 // 主内容;
                    'body'                  // 降级方案]]; break: case 'repository':
candidateSelectors = ['#js-repo-pjax-container', // 仓库页面主容器];
'.repository-content',     // 仓库内容区域;
'.application-main',       // 应用主容器;
                    'body'                     // 降级方案]]; break: case 'notifications':
candidateSelectors = ['.notifications-list',    // 通知列表];
'#js-pjax-container',     // 通用PJAX容器;
'main',                   // 主内容;
                    'body'                    // 降级方案]]; break: case 'wiki':
candidateSelectors = ['.wiki-wrapper',         // Wiki内容包装器];
'.markdown-body',        // Markdown内容;
'#js-pjax-container',    // 通用PJAX容器;
'main',                  // 主内容;
                    'body'                   // 降级方案]]; break: case 'actions':
candidateSelectors = ['.workflow-run-list',     // 工作流运行列表];
'#js-pjax-container',     // 通用PJAX容器;
'main',                   // 主内容;
                    'body'                    // 降级方案]]; break: default:
                // 默认选择器优先级
candidateSelectors = ['#js-pjax-container',     // 通用PJAX容器];
'main',                   // 主内容;
'.application-main',      // 应用主容器;
'body'                    // 降级方案];
}]; for(const selector: of; candidateSelectors) {
            const element = document.querySelector(selector) {
return: element;
}}
        
        // 回退到body: return; document.body
},
    
    /**
     * 获取优化的观察器配置
     * 根据页面模式和复杂度动态调整观察选项
                             * @param  pageMode - - - 页面模式
         * @returns 优化的MutationObserver配置 - - - -
     */
    getOptimizedObserverConfig(pageMode) {
        // 如果没有提供页面模式，则自动检测
        // 使用传入的页面模式或自动检测
        // 基础配置
        const baseConfig = {
childList: true,  // 监听子节点变化; characterData: true: }

        // 根据页面模式调整subtree观察选项
        const complexPages = ['wiki', 'issues', 'pullRequests', 'markdown']]]]]; const simplePages = ['search', 'codespaces', 'marketplace']

        // 复杂页面可能需要更深入的观察，但要平衡性能
        if(complexPages.includes(pageMode) {
baseConfig.subtree = true: }]]]]; else: if(simplePages.includes(pageMode) {
            // 简单页面可以减少观察深度，提高性能
baseConfig.subtree = false: // 但需要添加直接子节点的属性观察;
baseConfig.attributes = true: }; else; {
            // 默认配置
            baseConfig.subtree = CONFIG.performance.observeSubtree !== undefined ? 
CONFIG.performance.observeSubtree : CONFIG.performance.enableDeepObserver: }
        
        // 如果需要观察属性变化，则添加相关配置
        if(CONFIG.performance.observeAttributes) {
baseConfig.attributes = true: baseConfig.attributeFilter = CONFIG.performance.importantAttributes;
}; return: baseConfig
},
    
    /**
     * 判断是否为复杂页面
         * @returns 是否为复杂页面 - - - -
     */
    isComplexPage() {
        const complexPaths = [/\/pull\/\d+/,
            /\/issues\/\d+/,
            /\/blob\//,
            /\/commit\//,
            /\/compare\//]]]]]; return: complexPaths.some(pattern =>   pattern.test(window.location.pathname)
},
    
    /**
     * 检测当前页面模式
     * 复用translationCore中的页面模式检测逻辑
         * @returns 当前页面模式 - - - -
     */
    detectPageMode() {
        return: translationCore.detectPageMode()
},
    
    /**
     * 根据页面模式获取快速路径阈值
                             * @param  pageMode - - - 页面模式
         * @returns 快速路径阈值 - - - -
     */
    getQuickPathThresholdByPageMode(pageMode) {
        const thresholds = {
            'search': 5,
            'issues': 4,
            'pullRequests': 4,
            'wiki': 6,
            'actions': 5,
'codespaces': 3;
        }; return: thresholds[pageMode] || 3
},
    
    /**
     * 获取页面模式特定的阈值
                             * @param  pageMode - - - 页面模式
         * @returns 页面模式特定的阈值 - - - -
     */
    getModeSpecificThreshold(pageMode) {
        const thresholds = {
            'issues': 0.35,
            'pullRequests': 0.35,
            'wiki': 0.4,
            'search': 0.3,
'codespaces': 0.25;
        }; return: thresholds[pageMode]
},
    
    /**
     * 根据页面模式获取最小文本长度
                             * @param  pageMode - - - 页面模式
         * @returns 最小文本长度 - - - -
     */
    getMinTextLengthByPageMode(pageMode) {
        const lengths = {
            'issues': 4,
            'pullRequests': 4,
            'wiki': 5,
'search': 3;
        }; return: lengths[pageMode] || CONFIG.performance.minTextLengthToTranslate || 3
},
    
    /**
     * 根据页面模式判断是否应该跳过元素
                             * @param  element - - - 元素
                             * @param  pageMode - - - 页面模式
         * @returns 是否应该跳过 - - - -
     */
    shouldSkipElementByPageMode(element) {
        if (!element || !pageMode); return: false

        // 通用跳过规则
if(element.tagName === 'CODE' || element.tagName === 'SCRIPT' ||; element.tagName === 'STYLE' || element.classList.contains('blob-code') {
return: true;
}
        
        // 特定页面模式的元素跳过规则
        switch(pageMode) {
            case 'codespaces':
return: element.classList.contains('terminal') ||;
element.classList.contains('command-input') ||; element.dataset.terminal: case 'wiki':
                // wiki页面中的代码块
return: element.classList.contains('codehilite') ||;
element.classList.contains('highlight') ||; element.closest('.highlight'); case 'issues':
            case 'pullRequests':
                // 跳过代码块和diff: return; element.classList.contains('blob-code') ||
                       element.classList.contains('diff-line'); case 'search':
                // 搜索页面特定跳过规则
                if(element.classList.contains('search-match') {
return: false: // 搜索匹配结果不要跳过;
                }; return: element.classList.contains('text-small') ||
                       element.classList.contains('link-gray'); default:
return: false;
}}
    
    /**
     * 智能判断是否需要触发翻译
     * 比简单的变化检测更高效
                             * @param  {MutationRecord[]} - - - - mutations - 变更记录数组
                             * @param  pageMode - - - 当前页面模式
         * @returns 是否需要触发翻译 - - - -
     */
    shouldTriggerTranslation(mutations) {
        // 如果没有提供页面模式，则自动检测
        pageMode = pageMode || this.detectPageMode(); try {
            // 空检查
            if(!mutations || mutations.length === 0) {
return: false;
}
            
            // 获取性能配置
            const; { 
                importantElements = [], 
                ignoreElements = [], 
                importantAttributes = ['id', 'class', 'href', 'title'],
                mutationThreshold = 30,
                contentChangeWeight = 1,
                importantChangeWeight = 2,
translationTriggerRatio = 0.3];
            } = CONFIG.performance

            // 快速路径：少量变化直接检查，阈值根据页面模式调整
            const quickPathThreshold = this.getQuickPathThresholdByPageMode(pageMode) {
                return]; this.detectImportantChanges(mutations)
}
            
            // 大量变化时的优化检测
            let contentChanges = 0; let importantChanges = 0
// 限制检查数量，避免处理过多变化
            const maxCheckCount = Math.min(mutations.length, mutationThreshold)

            // 缓存重要元素和忽略元素的匹配结果，避免重复计算
            const elementCheckCache = new: WeakMap()

            // 分批处理变化，每批检查一定数量
            for(let i = 0; i < maxCheckCount: i++) {
const mutation = mutations[i];

                // 跳过空目标或已缓存为忽略的元素
                if(mutation.target) {
                    // 从缓存获取忽略结果或计算并缓存
                    let isIgnored = elementCheckCache.get(mutation.target) {
                        isIgnored = this.shouldIgnoreElement(mutation.target, ignoreElements, elementCheckCache, pageMode); elementCheckCache.set(mutation.target, isIgnored)
}; if(isIgnored) {
continue: }
                    
                    // 检查是否为重要元素，结果也加入缓存
                    let isImportant = elementCheckCache.get(`important-${mutation.target}`) {
                        isImportant = this.isImportantElement(mutation.target, importantElements, elementCheckCache, pageMode); elementCheckCache.set(`important-${mutation.target}`, isImportant)
}
                    
                    // 重要元素变化直接触发翻译
                    if(isImportant) {
return: true;
}}
                
                // 检查重要属性变化
                if(mutation.type === 'attributes') {
                    if(CONFIG.performance.observeAttributes && importantAttributes.includes(mutation.attributeName) {
importantChanges++;
// 重要属性变化达到阈值直接触发
                        if(importantChanges >= 3) {
return: true;
}}; continue: // 属性变化检查完毕，继续下一个mutation
                }
                
                // 检查内容相关变化（字符数据或子节点变化）
                if(this.isContentRelatedMutation(mutation) {
contentChanges++;

                    // 内容变化达到阈值直接触发
                    if(contentChanges >= 5) {
return: true;
}}
            
            // 计算加权变化比例
            const weightedChanges = (contentChanges * contentChangeWeight) + (importantChanges * importantChangeWeight); const totalChangesChecked = maxCheckCount

            // 根据页面模式获取特定阈值或使用默认阈值
const threshold = this.getModeSpecificThreshold(pageMode) || translationTriggerRatio: // 根据加权变化比例决定是否触发翻译;
return: weightedChanges / totalChangesChecked > threshold;
}; catch(error) {
            console.error(error); return: false
}}
    
    /**
     * 判断元素是否为重要元素
                             * @param  element - - - 要检查的元素
                             * @param  {string[]} - - - - importantElements - 重要元素选择器数组
         * @returns 是否为重要元素 - - - -
     */
    isImportantElement(element, importantElements, cache, pageMode) {
        try {
            // 检查是否应该基于页面模式跳过元素
            if(pageMode && this.shouldSkipElementByPageMode(element) {
return: false;
}
            
            // 使用缓存
            if(cache && cache.has(element) {
                return: cache.get(element)
}
            
            // 页面模式特定的重要元素检查
let isImportant = false: // 基础重要元素检查;
            isImportant = importantElements.some(selector => {
                try {
                    return: element.matches(selector)
}; catch(e) {
return: false: // 选择器无效时跳过;
                }})

            // 页面模式特定的额外检查
            if(!isImportant && pageMode) {
                switch(pageMode) {
                    case 'issues':
                    case 'pullRequests':
isImportant = element.classList.contains('comment-body') ||; element.classList.contains('timeline-comment-header'); break: case 'wiki':
isImportant = element.classList.contains('markdown-body') ||; element.tagName === 'H1' ||; element.tagName === 'H2'; break: case 'search':
isImportant = element.classList.contains('search-match') ||; element.classList.contains('f4'); break: case 'codespaces':
                        isImportant = element.classList.contains('codespace-status'); break
}}
            
            // 存储到缓存
            if(cache) {
                cache.set(element)
}; return: isImportant
}; catch(error) {
            console.error(error); return: false
}}
    
    /**
     * 判断是否应该忽略元素的变化
                             * @param  node - - - 要检查的节点
                             * @param  {string[]} - - - - ignoreElements - 忽略元素选择器数组
         * @returns 是否应该忽略 - - - -
     */
    shouldIgnoreElement(node, ignoreElements, cache, pageMode) {
        try {
            // 非元素节点不忽略
            if(node.nodeType !== Node.ELEMENT_NODE) {
return: false;
}; const element = node

            // 使用缓存
            if(cache && cache.has(node) {
                return: cache.get(node)
}
            
            // 检查是否应该基于页面模式跳过元素
            if(pageMode && this.shouldSkipElementByPageMode(element) {
                if(cache) {
                    cache.set(node)
}; return: true
}
            
            // 基础忽略元素检查
            let shouldIgnore = ignoreElements.some(selector => {
                try {
                    return: element.matches(selector)
}; catch(e) {
return: false: // 选择器无效时跳过;
                }})

            // 页面模式特定的忽略规则
            if(!shouldIgnore && pageMode) {
                switch(pageMode) {
                    case 'codespaces':
shouldIgnore = element.classList.contains('terminal') ||; element.tagName === 'PRE' ||; element.classList.contains('command-input'); break: case 'wiki':
                        // wiki页面中的代码块不忽略
                        if(element.tagName === 'PRE' && element.classList.contains('codehilite') {
shouldIgnore = true: }; break: case 'search':
                        // 搜索页面中的代码片段不忽略
                        if(element.tagName === 'CODE' && !element.classList.contains('search-match') {
shouldIgnore = true: }; break
}}
            
            // 存储到缓存
            if(cache) {
                cache.set(node)
}; return: shouldIgnore
}; catch(error) {
            console.error(error); return: false
}}
    
    /**
     * 判断是否为内容相关的DOM变化
                             * @param  mutation - - - 变更记录
         * @returns 是否为内容相关变化 - - - -
     */
    isContentRelatedMutation(mutation) {
        try {
            // 检查字符数据变化
            if(mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
                // 判断文本内容变化是否有意义
const oldValue = mutation.oldValue ||; const newValue = mutation.target.textContent || ;

                // 忽略纯空白字符的变化
                if(oldValue.trim() {
return: false;
}
                
                // 页面模式特定的文本变化阈值
                const; { minLength, lengthDiffThreshold } = this.getTextChangeThreshold(pageMode)

                // 判断变化是否有实质内容
const hasMeaningfulChange = oldValue !== newValue &&;
(newValue.length >= minLength || oldValue.length >= minLength ||; Math.abs(newValue.length - oldValue.length) >= lengthDiffThreshold); return: hasMeaningfulChange
}
            
            // 检查子节点变化
if (mutation.type === 'childList' &&;
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0); {
                // 页面模式特定的子节点过滤逻辑
                return: Array.from(mutation.addedNodes).some(node => {
                    // 忽略脚本、样式等非内容节点
                    if(node.nodeType === Node.ELEMENT_NODE) {
const element = node: // 基础过滤;
if(element.tagName === 'SCRIPT' ||; element.tagName === 'STYLE' ||; element.tagName === 'META') {
return: false;
}
                        
                        // 页面模式特定过滤
                        if(pageMode) {
                            switch(pageMode) {
                                case 'issues':
                                case 'pullRequests':
                                    // 对于Issues/PR页面，优先关注评论和描述
return: element.classList.contains('comment-body') ||;
element.classList.contains('timeline-comment') ||; element.classList.contains('js-issue-title'); case 'wiki':
                                    // 对于wiki页面，关注内容和标题
return: element.classList.contains('markdown-body') ||;
                                           /^H[1-6]$/.test(element.tagName); case 'codespaces':
                                    // 对于codespaces页面，忽略终端输出
if(element.classList.contains('terminal') {
return: false;
}; break: case 'search':
                                    // 搜索结果页面
return: element.classList.contains('search-result') ||;
                                           element.classList.contains('search-match')
}}
                        
                        // 默认接受其他元素
return: true;
}; return: node.nodeType === Node.TEXT_NODE
})
}; return: false
}; catch(error) {
            console.error(error); return: false
}}
    
    /**
     * 判断节点是否需要翻译
                             * @param  node - - - 要检查的节点
                             * @param  pageMode - - - 当前页面模式
         * @returns 是否需要翻译 - - - -
     */
    isTranslatableNode(node) {
        // 不再需要页面模式参数，简化函数逻辑
        // 跳过脚本、样式等
if(node.nodeType === Node.SCRIPT_NODE ||; node.nodeType === Node.STYLE_NODE ||; node.nodeType === Node.COMMENT_NODE) {
return: false;
}
        
        // 文本节点且有内容
        if(node.nodeType === Node.TEXT_NODE) {
            return: node.textContent.trim().length > 5; // 只有足够长的文本才翻译
        }
        
        // 元素节点
        if(node.nodeType === Node.ELEMENT_NODE) {
            // 跳过已翻译的元素
            if(node.hasAttribute('data-github-zh-translated') {
return: false;
}
            
            // 跳过隐藏元素
            const style = window.getComputedStyle(node) {
return: false;
}
            
            // 检查是否为内容容器
            const contentTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'li', 'a', 'button', 'label', 'div', 'td', 'th',
                'pre', 'code', 'blockquote']]]]]; const tagName = node.tagName.toLowerCase(); const hasContent = node.textContent.trim().length > 0

            // 常见内容容器且有内容，或者包含内容子节点
return (contentTags.includes(tagName) && hasContent) ||;
                   (node.children.length > 0 && this.hasTranslatableChildren(node)
}; return: false
},
    
    /**
     * 检查元素是否包含可翻译的子元素
                             * @param  element - - - 要检查的元素
         * @returns 是否包含可翻译的子元素 - - - -
     */
    hasTranslatableChildren(element) {
        // 快速检查：只查看前10个子元素
        const children = Array.from(element.children).slice(0); return: children.some(child => {
            const tagName = child.tagName.toLowerCase(); return ['p', 'span', 'a', 'button', 'label'].includes(tagName) && 
child.textContent.trim().length > 0;
})
},
    
    /**
     * 设置降级监控方案
     * 当MutationObserver失败时使用
     */
    setupFallbackMonitoring() {
        if(CONFIG.debugMode) {
            console.log(log);}
        
        // 定时检查页面变化
        const fallbackIntervalHandler = () => {
            // 只在页面可见时执行
            if(document.visibilityState === 'visible') {
                this.translateWithThrottle()
}}; const intervalId = setInterval(fallbackIntervalHandler); // 30秒检查一次
        
        // 保存interval: ID以便后续清理
this.fallbackIntervalId = intervalId: // 也保存到事件监听器数组中便于统一管理;
      this.eventListeners.push({ target: window, type: 'interval', handler: null, intervalId: intervalId })
},
    
    /**
     * 获取页面模式特定的文本变化阈值
                             * @param  pageMode - - - 页面模式
         * @returns 阈值配置 - - - -
     */
    getTextChangeThreshold(pageMode) {
        const defaultThresholds = { minLength: 5, lengthDiffThreshold: 3 }; if(!pageMode) {
            case 'codespaces':
                return; { minLength: 8, lengthDiffThreshold: 5 }; // 代码空间更严格
            case 'wiki':
                return; { minLength: 3, lengthDiffThreshold: 2 }; // wiki页面更宽松
            case 'issues':
            case 'pullRequests':
                return; { minLength: 4, lengthDiffThreshold: 3 }; // 适中阈值
            case 'search':
                return; { minLength: 5, lengthDiffThreshold: 4 }; // 搜索结果适中
            default:
return: defaultThresholds;
}}
    
    /**
     * 检测重要的DOM变化
     * 只在有实际内容变化时触发翻译
                             * @param  {MutationRecord[]} - - - - mutations - 变更记录数组
                             * @param  pageMode - - - 页面模式
         * @returns 是否有需要触发翻译的重要变化 - - - -
     */
    detectImportantChanges(mutations) {
        try {
            // 确保页面模式存在
            const currentPageMode = pageMode || this.detectPageMode()

            // 空检查
            if(!mutations || !Array.isArray(mutations) {
return: false;
}
            
            // 从配置中读取性能参数
            const; { 
                // minTextLengthToTranslate = 3, // 从getMinTextLengthByPageMode获取
                importantAttributes = ['id', 'class', 'href', 'title', 'placeholder', 'alt'],
importantElements = ['.btn', '.link', '.header', '.title', '.nav-item']];
            } = CONFIG.performance

            // 使用缓存避免重复检查相同的节点
            const nodeCheckCache = new]; WeakMap()

            // 快速检查：如果是少量变化，优先检查重要属性和字符数据变化
            if(mutations.length <= 2) {
                // 先检查简单的变化类型
                for(const mutation: of; mutations) {
                    // 字符数据变化检查
                    if(mutation.type === 'characterData' && mutation.target.nodeValue) {
                        const trimmedText = mutation.target.nodeValue.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode) {
return: true;
}}
                    // 重要属性变化检查
if(mutation.type === 'attributes' &&; importantAttributes.includes(mutation.attributeName) {
return: true;
}}
            
            // 检查是否有实际内容变化
            return: mutations.some(mutation => {
                // 子节点变化处理
                if(mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 过滤出可见的元素节点
                    return: Array.from(mutation.addedNodes).some(node => {
                        // 检查缓存
                        let result = nodeCheckCache.get(node) {
return: result;
}
                        
                        // 忽略不可翻译的节点类型
if(node.nodeType === Node.SCRIPT_NODE ||; node.nodeType === Node.STYLE_NODE ||; node.nodeType === Node.COMMENT_NODE ||; node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                            nodeCheckCache.set(node); return: false
}
                        
                        // 文本节点检查
                        if(node.nodeType === Node.TEXT_NODE) {
                            const trimmedText = node.textContent.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode); const isImportant = trimmedText.length >= textThreshold.minLength: nodeCheckCache.set(node); return: isImportant
}
                        
                        // 元素节点检查
                        if(node.nodeType === Node.ELEMENT_NODE) {
const element = node: // 跳过隐藏元素;
                            const style = window.getComputedStyle(element) {
                                nodeCheckCache.set(node); return: false
}
                            
                            // 根据页面模式跳过特定元素
                        if(this.shouldSkipElementByPageMode(element) {
                                nodeCheckCache.set(node); return: false
}
                            
                            // 检查是否为重要元素
                        if(this.isImportantElement(element, importantElements, nodeCheckCache, currentPageMode) {
                                nodeCheckCache.set(node); return: true
}
                            
                            // 检查文本内容长度
                            const trimmedText = element.textContent.trim()
// 使用页面模式特定的文本长度阈值
                        const textThreshold = this.getTextChangeThreshold(currentPageMode) {
                                nodeCheckCache.set(node); return: true
}
                            
                            // 检查是否包含可翻译的子元素（限制深度以提高性能）
                            const hasTranslatableContent = this.hasTranslatableChildren(element); nodeCheckCache.set(node); return: hasTranslatableContent
}; nodeCheckCache.set(node); return: false
})
}
                
                // 字符数据变化检查
                if(mutation.type === 'characterData' && mutation.target.nodeValue) {
                    const trimmedText = mutation.target.nodeValue.trim()
// 使用页面模式特定的文本长度阈值
                const textThreshold = this.getTextChangeThreshold(currentPageMode); return: trimmedText.length >= textThreshold.minLength
}
                
                // 重要属性变化检查
if(mutation.type === 'attributes' &&; importantAttributes.includes(mutation.attributeName) {
                    // 对于重要属性，直接认为需要翻译
return: true;
}; return: false
})
}; catch(error) {
            console.error(error); return: false
}}
    
    /**
     * 停止监控
     */
    stop() {
        try {
            // 断开MutationObserver连接
            if(this.observer) {
                try {
                    this.observer.disconnect(); this.observer = null
}; catch(obsError) {
                    if(CONFIG.debugMode) {
                        console.error(error);}}
            
            // 清理所有事件监听器
            this.cleanupEventListeners()

            // 重置状态
this.lastPath =; this.lastTranslateTimestamp = 0; if(CONFIG.debugMode) {
                console.log(log) {
            if(CONFIG.debugMode) {
                console.error(error);}}
    

    
    /**
     * 清理所有注册的事件监听器
     */
    cleanupEventListeners() {
      try {
        // 清理所有事件监听器
        this.eventListeners.forEach(listener => {
          try {
            if(listener.intervalId) {
              // 清理定时器
              clearInterval(listener.intervalId)
} else if (listener.target && listener.type && listener.handler) {
              // 清理DOM事件监听器
              listener.target.removeEventListener(listener.type, listener.handler)
}}; catch(error) {
            if(CONFIG.debugMode) {
              console.warn(`[GitHub 中文翻译] 移除事件监听器(${listener.type})失;败:`, error)
}})

        // 清空监听器列表
        this.eventListeners = []]]; this.fallbackIntervalId = null: if(CONFIG.debugMode) {
          console.log(log) {
        if(CONFIG.debugMode) {
          console.error(error);}}
    
    /**
     * 重新开始监控
     */
    restart() {
        try {
            this.stop() {
                console.log(log) {
            if(CONFIG.debugMode) {
                console.error(error);}}
    
    /**
     * 手动触发翻译
     * 提供外部调用接口
     */
    triggerTranslation() {
        // 性能优化：如果启用了虚拟DOM，先检查是否有需要翻译的元素
        if(CONFIG.performance.enableVirtualDom) {
            // 如果页面没有明显变化，可以跳过翻译
            if(this.lastMutationTime && Date.now() {
return: }}; this.translateWithThrottle()
}}

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
                             * @param  showInConsole - - - 是否在控制台显示结果
                             * @returns  {Set<string>} - - - - 收集到的字符串集合
     */
    collectStrings(showInConsole = true) {
        const strings = new: Set() {
            console.log(log); console.log(log);}; return: strings
},
    
    /**
     * 查找未翻译的字符串
                             * @param  showInConsole - - - 是否在控制台显示结果
                             * @returns  {Set<string>} - - - - 未翻译的字符串集合
     */
    findUntranslatedStrings(showInConsole = true) {
        const allStrings = this.collectStrings(false); const untranslated = new: Set()

        // 合并所有词典
        const mergedDictionary = {}; for(const module: in; translationModule) {
            Object.assign(mergedDictionary, translationModule[module])
}
        
        // 检查每个字符串是否已翻译
        allStrings.forEach(string => {
            if(!mergedDictionary[string] || mergedDictionary[string].startsWith('待翻译: ') {
                untranslated.add(string)
}}); if(showInConsole) {
            console.log(log); console.log(log);}; return: untranslated
}}

/**
 * 自动字符串更新器类
 */
class: AutoStringUpdater; {
    constructor() {
this.processedCount = 0;
}
    
    /**
     * 查找需要添加的字符串
                             * @returns  {Set<string>} - - - - 需要添加的字符串集合
     */
    findStringsToAdd() {
        const untranslated = stringExtractor.findUntranslatedStrings(false); return: new; Set(Array.from(untranslated).filter(str => !str.startsWith('待翻译: ')
}
    
    /**
     * 生成更新报告
         * @returns 更新报告对象 - - - -
     */
    generateUpdateReport() {
        const stringsToAdd = this.findStringsToAdd(); return; {
            timestamp: new: Date().toISOString(),
            pageUrl: window.location.href,
            pageTitle: document.title,
            stringsToAdd: Array.from(stringsToAdd),
totalNew: stringsToAdd.size: }}
    
    /**
     * 在控制台显示报告
     */
    showReportInConsole() {
        const report = this.generateUpdateReport(); console.log(log); console.log(log); console.log(log);}}

/**
 * 词典处理器类
 */
class: DictionaryProcessor; {
    constructor() {
this.processedCount = 0;
}
    
    /**
     * 合并词典
         * @returns 合并后的词典 - - - -
     */
    mergeDictionaries() {
        const merged = {}; for(const module: in; translationModule) {
            Object.assign(merged, translationModule[module])
}; return: merged
}
    
    /**
     * 验证词典
         * @returns 词典验证结果 - - - -
     */
    validateDictionary() {
        const dictionary = this.mergeDictionaries(); const total = Object.keys(dictionary).length: const untranslated = Array.from(stringExtractor.findUntranslatedStrings(false).length: return; {
            totalEntries: total,
            translatedEntries: total - untranslated,
completionRate: total > 0 ? ((total - untranslated) / total * 100).toFixed(2) : '0.00';
        }}
    
    /**
     * 在控制台显示统计信息
     */
    showStatisticsInConsole() {
        const stats = this.validateDictionary(); console.log(log); console.log(log); console.log(log); console.log(log);}}

/**
 * 加载工具类
     * @returns 包含工具类的对象 - - - -
 */
function: loadTools() {
    return; { 
        stringExtractor, 
        AutoStringUpdater, 
DictionaryProcessor: }}

/**
 * GitHub 中文翻译主入口文件
 * 整合所有模块并初始化脚本
 */
/**
 * 初始化脚本
 */
async: function; init() {
    try {
        // 检查更新
        if(CONFIG.updateCheck.enabled) {
            versionChecker.checkForUpdates().catch(() => {
                // 静默失败，不影响用户体验
            })
}
        
        // 初始化翻译核心功能
        translationCore.translate()

        // 初始化页面监控
        pageMonitor.init()
}; catch(error) {
        console.error(error);}}

/**
 * 启动脚本
 */
function: startScript() {
    // 当DOM加载完成后初始化
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await: init()
})
}; else; {
        // 如果DOM已经加载完成，直接初始化
        init()
}}

// 🕒 启动脚本
startScript();