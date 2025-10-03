// auto_string_updater.js
// 用于自动化从GitHub网站抓取字符串并更新翻译词典的工具
// 作者: SutChan
// 版本: 1.8.11

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const https = require('https');

// 导入共享工具函数
const { updateStatsAfterRun, validateConfig, processPagesInBatches, sleep, formatNumber } = require('./utils');



/**
 * 统一日志处理函数
 * @param {string} level - 日志级别: error, warn, info, debug
 * @param {string} message - 日志消息
 * @param {any} [details] - 详细信息或错误对象
 */
function log(level, message, details = null) {
  const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = logLevels[CONFIG.logLevel] || logLevels.info;
  const messageLevel = logLevels[level] || logLevels.info;
  
  // 只输出级别大于等于当前设置的日志
  if (messageLevel <= currentLevel) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (details) {
      if (details instanceof Error) {
        logMessage += `\n错误详情: ${details.message}\n${details.stack}`;
      } else if (typeof details === 'object') {
        try {
          logMessage += `\n详细信息: ${JSON.stringify(details, null, 2)}`;
        } catch (e) {
          logMessage += `\n详细信息: [对象序列化失败]`;
        }
      } else {
        logMessage += `\n详细信息: ${details}`;
      }
    }
    
    if (level === 'error') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }
  
  // 如果是子进程，将日志消息发送给父进程
  if (process.send) {
    process.send({
      type: 'log',
      level: level,
      message: message,
      timestamp: new Date().toISOString(),
      hasDetails: !!details
    });
  }
}

// 默认配置
const DEFAULT_CONFIG = {
  userScriptPath: '../GitHub_zh-CN.user.js',
  backupDir: '../backups',
  minStringLength: 2,
  maxStringLength: 100,
  httpTimeout: 30000,
  maxRetries: 3,
  retryDelay: 2000,
  requestDelay: 1000, // 请求间隔时间
  concurrentRequests: 3, // 并行请求数量
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  debugMode: false,
  logLevel: 'info', // error, warn, info, debug
  debugOutputFile: '../debug/fetched_strings.json',
  exactMatchOnly: true, // 只翻译全文匹配的字符串
  ignoreWords: ['GitHub', 'API', 'URL', 'HTTP', 'HTTPS'], // 忽略的单词列表
  ignorePatterns: [], // 忽略的正则表达式模式列表
  includePatterns: [], // 必须包含的正则表达式模式列表
  requestHeaders: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
  }
};

// 配置对象，将在初始化时从文件加载
let CONFIG = { ...DEFAULT_CONFIG };
let GITHUB_PAGES = [];

// 统计数据
let STATS = {
    extractedCount: 0,
    addedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    startTime: null,
    endTime: null,
    processingTime: 0,
    modules: {}
};

/**
 * 保存临时统计数据
 */
async function saveTempStats() {
  try {
    const tempStatsPath = path.resolve(__dirname, 'temp_stats.json');
    await fs.writeFile(tempStatsPath, JSON.stringify(STATS, null, 2));
    console.log('临时统计数据已保存');
  } catch (error) {
    console.error('保存临时统计数据失败:', error.message);
  }
}

/**
 * 从文件加载配置
 */
async function loadConfig() {
  try {
    // 加载主配置
    const configFilePath = path.resolve(__dirname, 'api', 'config.json');
    const configData = await fs.readFile(configFilePath, 'utf8');
    const config = JSON.parse(configData);
    Object.assign(CONFIG, config);
    log('info', '配置文件已加载');
    
    // 验证配置
    const validationErrors = validateConfig(CONFIG);
    if (validationErrors.length > 0) {
      log('warn', '配置验证警告:', validationErrors);
    }
    
    // 更新请求头中的User-Agent
    if (config.userAgent) {
      CONFIG.requestHeaders['User-Agent'] = config.userAgent;
    }
    
    // 加载GitHub页面配置
    const pagesFilePath = path.resolve(__dirname, 'api', 'pages.json');
    const pagesData = await fs.readFile(pagesFilePath, 'utf8');
    GITHUB_PAGES = JSON.parse(pagesData);
    
    // 验证页面配置
    if (GITHUB_PAGES && Array.isArray(GITHUB_PAGES)) {
      log('info', `已加载 ${GITHUB_PAGES.length} 个GitHub页面配置`);
    } else {
      throw new Error('pages.json 格式错误，应为数组');
    }
  } catch (error) {
    log('error', '加载配置文件失败:', error);
    log('info', '使用默认配置');
    
    // 重置为默认配置
    Object.keys(DEFAULT_CONFIG).forEach(key => {
      CONFIG[key] = DEFAULT_CONFIG[key];
    });
    
    GITHUB_PAGES = [
      { url: 'https://github.com', selector: 'body', module: 'global' },
      { url: 'https://github.com/settings/profile', selector: 'body', module: 'settings' },
      { url: 'https://github.com/notifications', selector: 'body', module: 'notifications' },
      { url: 'https://github.com/explore', selector: 'body', module: 'explore' },
      { url: 'https://github.com/search', selector: 'body', module: 'search' }
    ];
  }
}

/**
 * 下载网页内容
 * @param {string} url - 要下载的URL
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise<string>} 页面内容
 */
async function downloadPage(url, retryCount = 0) {
  try {
    // 验证URL格式
    try {
      new URL(url);
    } catch (e) {
      throw new Error(`URL格式无效: ${url}`);
    }

    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          ...CONFIG.requestHeaders,
          'User-Agent': CONFIG.userAgent // 确保用户代理设置
        },
        timeout: CONFIG.httpTimeout || 30000 // 默认为30秒超时
      };

      const req = https.get(url, options, (res) => {
        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).href;
          log('info', `重定向: ${url} -> ${redirectUrl}`);
          downloadPage(redirectUrl, retryCount).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          const error = new Error(`请求失败: ${url}, 状态码: ${res.statusCode}`);
          if (retryCount < CONFIG.maxRetries) {
            log('info', `请求失败，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
            sleep(CONFIG.retryDelay).then(() => {
              downloadPage(url, retryCount + 1).then(resolve).catch(reject);
            });
          } else {
            reject(error);
          }
          return;
        }

        // 使用字符串累加器的替代方案，减少内存占用
        const chunks = [];
        let totalSize = 0;
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
          totalSize += chunk.length;
          
          // 检查响应大小是否超过限制（可选）
          const maxSize = CONFIG.maxResponseSize || 10 * 1024 * 1024; // 默认10MB
          if (totalSize > maxSize) {
            req.destroy();
            reject(new Error(`响应大小超过限制: ${totalSize} bytes`));
          }
        });
        
        res.on('end', () => {
          try {
            const data = Buffer.concat(chunks).toString('utf8');
            log('info', `成功下载 ${url}，大小: ${(totalSize / 1024).toFixed(2)} KB`);
            resolve(data);
          } catch (encodingError) {
            reject(new Error(`解析响应内容失败: ${encodingError.message}`));
          }
        });
      });

      req.on('error', (e) => {
        const error = new Error(`请求错误: ${url}, 错误: ${e.message}`);
        if (retryCount < CONFIG.maxRetries) {
          log('info', `请求错误，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
          sleep(CONFIG.retryDelay).then(() => {
            downloadPage(url, retryCount + 1).then(resolve).catch(reject);
          });
        } else {
          reject(error);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        const error = new Error(`请求超时: ${url} (${CONFIG.httpTimeout}ms)`);
        if (retryCount < CONFIG.maxRetries) {
          log('info', `请求超时，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
          sleep(CONFIG.retryDelay).then(() => {
            downloadPage(url, retryCount + 1).then(resolve).catch(reject);
          });
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    log('error', `下载页面时发生错误: ${url}`, error);
    
    // 如果发生非请求相关的错误，也尝试重试
    if (retryCount < CONFIG.maxRetries) {
      log('info', `非请求错误，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
      await sleep(CONFIG.retryDelay);
      return downloadPage(url, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * 过滤字符串
 * @param {string} text - 要过滤的文本
 * @returns {boolean} 是否保留该字符串
 */
function filterString(text) {
  try {
    // 确保输入是字符串
    if (typeof text !== 'string') {
      return false;
    }

    // 检查字符串长度
    if (text.length < CONFIG.minStringLength || text.length > CONFIG.maxStringLength) {
      return false;
    }

    // 检查是否包含至少一个字母
    if (!/[a-zA-Z]/.test(text)) {
      return false;
    }

    // 检查是否包含忽略的单词（优化匹配速度）
    const lowerText = text.toLowerCase();
    if (CONFIG.ignoreWords.some(word => lowerText.includes(word.toLowerCase()))) {
      return false;
    }

    // 检查是否匹配忽略的模式
    for (const pattern of CONFIG.ignorePatterns) {
      try {
        if (new RegExp(pattern).test(text)) {
          return false;
        }
      } catch (e) {
        log('warn', `无效的忽略模式: ${pattern}, 错误: ${e.message}`);
      }
    }

    // 检查是否匹配必须包含的模式
    if (CONFIG.includePatterns.length > 0) {
      let matched = false;
      for (const pattern of CONFIG.includePatterns) {
        try {
            if (new RegExp(pattern).test(text)) {
              matched = true;
              break;
            }
          } catch (e) {
            log('warn', `无效的包含模式: ${pattern}, 错误: ${e.message}`);
          }
      }
      if (!matched) {
        return false;
      }
    }

    // 检查是否包含敏感内容或无意义的字符串
    if (/^[\s\d\W]+$/.test(text)) {
      return false;
    }

    // 检查是否是敏感内容（优化正则表达式，合并相似模式）
    const sensitivePatterns = [
      /password|passwd|pw|pwd/i,
      /api[_-]?key|token|auth/i,
      /credit[_-]?card|cc|cvc|cvv/i,
      /email|e[_-]?mail|mail/i,
      /phone|tel|mobile/i,
      /address|addr/i,
      /user|username|login/i,
      /secret|private|confidential/i
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }

    // 添加重复字符检测
    if (hasExcessiveRepeats(text)) {
      return false;
    }

    // 添加常见数字格式检测（排除日期、版本号等合理格式）
    if (isLikelyNumericData(text)) {
      return false;
    }

    // 添加常见代码片段检测
    if (isLikelyCodeSnippet(text)) {
      return false;
    }

    return true;
  } catch (error) {
    log('error', `字符串过滤错误: ${error.message}`, error);
    return false;
  }
}

/**
 * 检测字符串是否包含过多重复字符
 * @param {string} text - 要检查的文本
 * @returns {boolean} 是否包含过多重复字符
 */
function hasExcessiveRepeats(text) {
  // 检查连续重复的字符
  if (/([a-zA-Z0-9])\1{4,}/.test(text)) {
    return true;
  }
  
  // 检查整体重复模式
  const charMap = {};
  for (let char of text) {
    charMap[char] = (charMap[char] || 0) + 1;
    // 如果单个字符占比超过60%，认为是重复内容
    if (charMap[char] > text.length * 0.6) {
      return true;
    }
  }
  
  return false;
}

/**
 * 检测字符串是否可能是纯数字数据（如日期、版本号、ID等）
 * @param {string} text - 要检查的文本
 * @returns {boolean} 是否可能是纯数字数据
 */
function isLikelyNumericData(text) {
  // 常见的数字格式：日期、版本号、ID、尺寸等
  const numericPatterns = [
    // 日期格式 (YYYY-MM-DD, MM/DD/YYYY, etc.)
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,
    // 时间格式 (HH:MM:SS, HH:MM)
    /^\d{1,2}:\d{2}(:\d{2})?$/,
    // 版本号格式 (X.Y.Z, X.Y)
    /^(\d+\.){1,2}\d+(?:-\w+)?$/,
    // 纯数字ID或序列号
    /^[A-Za-z0-9]{8,}$/,
    // 尺寸格式 (XxY, X × Y)
    /^\d+\s*[x×]\s*\d+$/,
    // 百分比格式
    /^\d+%$/,
    // 货币格式（简化版）
    /^\$?\d+(,\d{3})*(\.\d{2})?$/
  ];
  
  return numericPatterns.some(pattern => pattern.test(text));
}

/**
 * 检测字符串是否可能是代码片段
 * @param {string} text - 要检查的文本
 * @returns {boolean} 是否可能是代码片段
 */
function isLikelyCodeSnippet(text) {
  // 常见的代码特征：花括号、分号、等号、括号等
  const codePatterns = [
    // 包含常见代码符号
    /[{}()\[\];=<>]+/,
    // 可能是HTML标签
    /<\/?\w+>/,
    // 可能是URL参数或查询字符串
    /[?&]\w+=\w+/,
    // 可能是命令行指令
    /^\s*[a-z]+\s+--?\w+/i
  ];
  
  // 如果字符串包含多个代码特征，认为是代码片段
  let codeFeaturesCount = 0;
  for (const pattern of codePatterns) {
    if (pattern.test(text)) {
      codeFeaturesCount++;
      if (codeFeaturesCount >= 2) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 从HTML中提取文本字符串
 * @param {string} html - HTML内容
 * @param {string} module - 字符串所属模块
 * @returns {Array<{text: string, module: string}>}
 */
function extractStrings(html, module) {
  try {
    // 检查输入
  if (!html || typeof html !== 'string') {
    log('warn', 'HTML内容为空或不是字符串');
    return [];
  }

  if (!module || typeof module !== 'string') {
    log('warn', '模块名称为空或不是字符串');
    module = 'global';
  }

    const { window } = new JSDOM(html);
    const document = window.document;
    const strings = [];
    const seen = new Set();

    // 提取所有文本内容的辅助函数
    function extractTextFromElement(element) {
      try {
        // 检查元素是否有效
        if (!element || !element.tagName) {
          return;
        }

        const tagName = element.tagName.toLowerCase();
        const excludedTags = ['script', 'style', 'noscript', 'svg', 'canvas', 'iframe', 'input', 'textarea', 'select', 'option'];
        
        if (excludedTags.includes(tagName)) {
          return;
        }

        // 获取文本内容
        const text = element.textContent.trim();
        
        // 应用过滤规则
        if (text && filterString(text) && !seen.has(text)) {
          seen.add(text);
          strings.push({ text, module });
        }

        // 递归处理子元素
        Array.from(element.children).forEach(child => {
          extractTextFromElement(child);
        });
      } catch (error) {
          log('error', `从元素提取文本错误: ${error.message}`, error);
        }
    }

    // 开始提取文本
    extractTextFromElement(document.body);

    // 更新统计数据
    STATS.extractedCount += strings.length;
    
    window.close();
    return strings;
  } catch (error) {
    log('error', `提取字符串错误: ${error.message}`, error);
    return [];
  }
}

/**
 * 读取用户脚本文件
 * @returns {Promise<string>}
 */
async function readUserScript() {
  try {
    const fullPath = path.resolve(__dirname, CONFIG.userScriptPath);
    return await fs.readFile(fullPath, 'utf8');
  } catch (error) {
    log('error', '读取用户脚本文件失败:', error);
    throw error;
  }
}

/**
 * 创建文件备份
 * @param {string} content - 要备份的文件内容
 * @returns {Promise<string>}
 */
async function createBackup(content) {
  try {
    const backupDir = path.resolve(__dirname, CONFIG.backupDir);
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `GitHub_zh-CN.user.js.${timestamp}.bak`);
    
    await fs.writeFile(backupPath, content, 'utf8');
    log('info', `已创建备份: ${backupPath}`);
    return backupPath;
  } catch (error) {
    log('error', '创建备份失败:', error);
    // 备份失败不应阻止主流程
    return null;
  }
}

/**
 * 检查字符串是否在脚本中全文匹配
 * @param {string} scriptContent - 用户脚本内容
 * @param {string} text - 要检查的文本
 * @returns {boolean} 字符串是否在脚本中作为完整字符串出现
 */
function isStringUsedInScript(scriptContent, text) {
  if (!CONFIG.exactMatchOnly) {
    return true; // 如果不是只匹配全文，则所有字符串都通过
  }
  
  try {
    // 对文本进行转义，使其可以在正则表达式中使用
    // 改进的转义逻辑，确保所有正则表达式特殊字符都被正确转义
    const escapedText = text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    
    // 匹配字符串作为完整标识符、属性名、参数值等
    // 这包括：函数调用参数、赋值、字符串拼接等场景
    const patterns = [
      // 匹配JavaScript中的字符串字面量（双引号）
      `"${escapedText}"`,
      // 匹配JavaScript中的字符串字面量（单引号）
      `'${escapedText}'`,
      // 匹配模板字符串中的变量或表达式
      `\\${escapedText}\\b`,
      // 匹配对象属性名
      `\\b${escapedText}\\s*:`
    ];
    
    // 检查是否匹配任何模式
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'g');
        if (regex.test(scriptContent)) {
          return true;
        }
      } catch (regexError) {
        // 如果单个正则表达式出错，继续尝试下一个模式
        log('debug', `正则表达式模式出错: ${pattern}`, regexError);
        continue;
      }
    }
    
    return false;
  } catch (error) {
    log('error', `检查字符串 "${text}" 时出错:`, error);
    return false;
  }
}

/**
 * 更新翻译词典
 * @param {string} scriptContent - 用户脚本内容
 * @param {Array<{text: string, module: string}>} newStrings - 新提取的字符串
 * @returns {Promise<string>}
 */
async function updateTranslationDictionary(scriptContent, newStrings) {
  try {
    let updatedContent = scriptContent;
    let addedCount = 0;
    let skippedCount = 0;
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 按模块分组字符串并去重
    const stringsByModule = new Map();
    const allTextStrings = new Set(); // 用于全局去重
    
    newStrings.forEach(({ text, module }) => {
      if (!allTextStrings.has(text)) {
        allTextStrings.add(text);
        
        if (!stringsByModule.has(module)) {
          stringsByModule.set(module, new Set());
        }
        stringsByModule.get(module).add(text);
      }
    });

    // 批量检查字符串使用情况，优化性能
    log('info', `准备批量检查 ${allTextStrings.size} 个字符串的使用情况...`);
    
    // 构建所有模块的正则表达式缓存
    const moduleRegexCache = new Map();
    const stringUsageCache = new Map();
    
    // 分批处理字符串检查
    const batchSize = 50;
    const textArray = Array.from(allTextStrings);
    
    for (let i = 0; i < textArray.length; i += batchSize) {
      const batch = textArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => isStringUsedInScript(scriptContent, text))
      );
      
      batch.forEach((text, index) => {
        stringUsageCache.set(text, batchResults[index]);
      });
      
      // 显示进度
      if (process.send) {
        process.send({
          type: 'string_check_progress',
          processed: Math.min(i + batchSize, textArray.length),
          total: textArray.length
        });
      }
    }
    
    log('info', `字符串使用情况检查完成，耗时: ${((Date.now() - startTime) / 1000).toFixed(2)}秒`);
    
    // 为每个模块更新翻译词典
    for (const [module, strings] of stringsByModule.entries()) {
      log('info', `正在处理模块 ${module}，包含 ${strings.size} 个字符串`);
      
      // 从缓存获取或创建模块正则表达式
      let moduleRegex = moduleRegexCache.get(module);
      if (!moduleRegex) {
        // 转义模块名中的特殊字符
        const escapedModule = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        moduleRegex = new RegExp(`(const\s+${escapedModule}\s*=\s*{[\s\S]*?})`);
        moduleRegexCache.set(module, moduleRegex);
      }
      
      const match = updatedContent.match(moduleRegex);
      
      if (match) {
        const moduleContent = match[1];
        let newModuleContent = moduleContent;
        
        // 检查模块中是否已存在结束的花括号
        const closingBraceIndex = moduleContent.lastIndexOf('}');
        if (closingBraceIndex === -1) {
          log('error', `无法找到模块 ${module} 的结束标记`);
          continue;
        }
        
        // 构建模块中已存在字符串的缓存，避免重复匹配
        const existingStringsInModule = new Set();
        const stringPattern = /"([^"]+)"\s*:\s*"[^"]*"/g;
        let stringMatch;
        while ((stringMatch = stringPattern.exec(moduleContent)) !== null) {
          existingStringsInModule.add(stringMatch[1]);
        }
        
        // 收集需要添加的条目，一次性添加
        const entriesToAdd = [];
        const moduleAddedCount = 0;
        
        // 检查每个字符串是否已存在
        strings.forEach(text => {
          // 检查是否在模块中已存在
          if (existingStringsInModule.has(text)) {
            if (CONFIG.debugMode) {
              log('debug', `字符串 "${text}" 已存在于模块 ${module} 中，跳过`);
            }
            return;
          }
          
          // 检查是否在脚本中使用（从缓存获取）
          const isUsed = stringUsageCache.get(text) || false;
          
          if (isUsed) {
            // 字符串不存在，添加到待添加列表
            const indent = '    '; // 保持缩进一致
            // 安全地转义字符串内容
            const safeText = text.replace(/"/g, '\\"');
            entriesToAdd.push(`${indent}"${safeText}": "待翻译: ${safeText}"`);
            addedCount++;
            
            // 标记为已存在，避免重复添加
            existingStringsInModule.add(text);
            
            // 显示进度
            if (addedCount % 10 === 0) {
              log('info', `已添加 ${formatNumber(addedCount)} 个新字符串...`);
              
              // 如果是子进程，发送进度
              if (process.send) {
                process.send({
                  type: 'translation_progress',
                  addedCount: addedCount,
                  totalCount: allTextStrings.size,
                  moduleName: module
                });
              }
            }
          } else {
            skippedCount++;
            if (CONFIG.debugMode) {
              log('debug', `跳过字符串 "${text}" (不是全文匹配)`);
            }
          }
        });
        
        // 一次性添加所有新条目
        if (entriesToAdd.length > 0) {
          // 检查模块是否为空（只有空对象）
          const moduleBody = moduleContent.substring(moduleContent.indexOf('{') + 1, closingBraceIndex).trim();
          
          // 构建新的模块内容
          let contentBeforeBrace = newModuleContent.slice(0, closingBraceIndex);
          const contentAfterBrace = newModuleContent.slice(closingBraceIndex);
          
          // 如果模块不为空，添加逗号
          if (moduleBody.length > 0) {
            contentBeforeBrace += ',\n';
          } else {
            contentBeforeBrace += '\n';
          }
          
          // 添加所有新条目
          newModuleContent = contentBeforeBrace + entriesToAdd.join(',\n') + '\n  ' + contentAfterBrace;
          
          // 替换模块内容
          updatedContent = updatedContent.replace(moduleContent, newModuleContent);
          
          log('info', `已向模块 ${module} 添加 ${entriesToAdd.length} 个新字符串`);
        }
      } else {
        log('error', `无法找到模块 ${module} 的定义`);
      }
    }

    // 更新统计数据
    STATS.addedCount = addedCount;
    STATS.skippedCount = skippedCount;
    
    log('info', `已添加 ${formatNumber(addedCount)} 个新字符串到翻译词典`);
    if (skippedCount > 0) {
      log('info', `跳过了 ${formatNumber(skippedCount)} 个字符串 (未在脚本中全文匹配)`);
    }
    log('info', `翻译词典更新完成，耗时: ${((Date.now() - startTime) / 1000).toFixed(2)}秒`);
    
    return updatedContent;
  } catch (error) {
    log('error', '更新翻译词典失败:', error);
    throw error;
  }
}

/**
 * 更新版本号
 * @param {string} scriptContent - 用户脚本内容
 * @returns {Promise<string>}
 */
async function updateVersion(scriptContent) {
  try {
    // 从package.json读取版本号
    const packageJsonPath = path.resolve(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageJsonContent);
    const packageVersion = packageData.version;
    
    // 匹配用户脚本中的版本号行
    const versionPattern = /(\/\/\s*@version\s+)((\d+)\.(\d+)\.(\d+))/;
    const match = scriptContent.match(versionPattern);
    
    if (match) {
      const [fullMatch, prefix, currentVersion] = match;
      
      // 如果版本号不同，则同步更新
      if (currentVersion !== packageVersion) {
        const newVersionLine = `${prefix}${packageVersion}`;
        const updatedContent = scriptContent.replace(fullMatch, newVersionLine);
        log('info', `版本号已从 ${currentVersion} 同步更新为 ${packageVersion}`);
        return updatedContent;
      } else {
        log('info', `版本号 ${packageVersion} 已是最新，无需更新`);
        return scriptContent;
      }
    } else {
      log('error', '无法找到用户脚本中的版本号');
      return scriptContent;
    }
  } catch (error) {
    log('error', '更新版本号失败:', error);
    // 如果同步失败，回退到原有的版本号升级逻辑
    try {
      const versionPattern = /(\/\/\s*@version\s+)((\d+)\.(\d+)\.(\d+))/;
      const match = scriptContent.match(versionPattern);
      
      if (match) {
        const [fullMatch, prefix, currentVersion, major, minor, patch] = match;
        const newPatch = parseInt(patch, 10) + 1;
        const newVersion = `${major}.${minor}.${newPatch}`;
        const newVersionLine = `${prefix}${newVersion}`;
        
        const updatedContent = scriptContent.replace(fullMatch, newVersionLine);
        log('info', `回退到版本号升级模式，已从 ${currentVersion} 更新为 ${newVersion}`);
        return updatedContent;
      }
    } catch (fallbackError) {
      log('error', '回退版本号升级也失败:', fallbackError);
    }
    return scriptContent;
  }
}

/**
 * 保存更新后的脚本文件
 * @param {string} content - 更新后的脚本内容
 * @returns {Promise<void>}
 */
async function saveUserScript(content) {
  try {
    const fullPath = path.resolve(__dirname, CONFIG.userScriptPath);
    await fs.writeFile(fullPath, content, 'utf8');
    log('info', `已保存更新后的脚本文件: ${fullPath}`);
  } catch (error) {
    log('error', '保存脚本文件失败:', error);
    throw error;
  }
}

/**
 * 保存调试信息
 * @param {Array<{text: string, module: string}>} strings - 提取的字符串
 */
async function saveDebugInfo(strings) {
  if (!CONFIG.debugMode) return;
  
  try {
    const debugDir = path.dirname(CONFIG.debugOutputFile);
    await fs.mkdir(debugDir, { recursive: true });
    
    const debugData = {
      timestamp: new Date().toISOString(),
      totalStrings: strings.length,
      strings: strings,
      stats: STATS
    };
    
    const fullPath = path.resolve(__dirname, CONFIG.debugOutputFile);
    await fs.writeFile(fullPath, JSON.stringify(debugData, null, 2), 'utf8');
    log('info', `已保存调试信息: ${fullPath}`);
  } catch (error) {
    log('error', '保存调试信息失败:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  log('info', '自动化字符串更新工具启动');
  
  // 初始化统计数据
  STATS = {
    extractedCount: 0,
    addedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    processingTime: 0,
    modules: {}
  };
  
  // 检查是否通过子进程运行
  const isChildProcess = process.send !== undefined;
  
  try {
    // 加载配置
    await loadConfig();
    
    // 1. 读取用户脚本
    const originalScript = await readUserScript();
    
    // 2. 创建备份
    await createBackup(originalScript);
    
    // 3. 下载GitHub页面并提取字符串 - 使用并行批处理优化
    log('info', `开始处理 ${GITHUB_PAGES.length} 个页面...`);
    
    // 定义单个页面的处理函数
    const processPage = async (page) => {
      try {
        log('info', `正在处理页面: ${page.url}`);
        
        // 发送进度信息（如果是子进程）
        if (isChildProcess) {
          process.send({
            type: 'progress',
            message: `正在处理页面: ${page.url}`
          });
        }
        
        const html = await downloadPage(page.url);
        const strings = extractStrings(html, page.module);
        
        // 更新模块统计
        if (!STATS.modules) {
          STATS.modules = {};
        }
        
        if (!STATS.modules[page.module]) {
          STATS.modules[page.module] = { extracted: 0, added: 0 };
        }
        STATS.modules[page.module].extracted = strings.length;
        
        log('info', `从 ${page.url} 提取了 ${strings.length} 个字符串`);
        return strings;
      } catch (error) {
        STATS.errorCount++;
        log('error', `处理页面 ${page.url} 失败:`, error);
        
        // 发送错误信息（如果是子进程）
        if (isChildProcess) {
          process.send({
            type: 'error',
            message: `处理页面 ${page.url} 失败: ${error.message}`
          });
        }
        
        return [];
      }
    };
    
    // 进度回调函数
    const progressCallback = (progressInfo) => {
      // 发送进度信息到父进程
      if (isChildProcess) {
        process.send({
          type: 'progress',
          progress: progressInfo.progress,
          processed: progressInfo.processed,
          total: progressInfo.total,
          currentUrl: progressInfo.currentUrl,
          elapsedTime: progressInfo.elapsedTime,
          remainingTime: progressInfo.remainingTime
        });
      }
      
      // 输出进度到控制台
      if (progressInfo.progress % 10 === 0 || progressInfo.progress === 100) {
        log('info', `进度: ${progressInfo.progress}% (${progressInfo.processed}/${progressInfo.total} 页面)`);
      }
    };
    
    // 批量并行处理页面
    const allStrings = await processPagesInBatches(
      GITHUB_PAGES,
      processPage,
      CONFIG.concurrentRequests || 3, // 使用配置中的并发数或默认值
      CONFIG.requestDelay || 1000,    // 使用配置中的延迟时间或默认值
      CONFIG.maxRetries || 3,         // 使用配置中的最大重试次数
      progressCallback                // 进度回调函数
    );
    
    // 去重（优化性能）
    const uniqueStrings = [];
    const seenTexts = new Set();
    
    for (const item of allStrings) {
      if (!seenTexts.has(item.text)) {
        seenTexts.add(item.text);
        uniqueStrings.push(item);
      }
    }
    
    log('info', `总共提取了 ${formatNumber(uniqueStrings.length)} 个唯一字符串`);
    
    // 更新统计信息
    STATS.extractedCount = uniqueStrings.length;
    STATS.endTime = new Date().toISOString();
    
    // 计算处理时间
    const startTimeMs = new Date(STATS.startTime).getTime();
    const endTimeMs = new Date(STATS.endTime).getTime();
    STATS.processingTime = ((endTimeMs - startTimeMs) / 1000).toFixed(2);
    
    // 保存调试信息
    await saveDebugInfo(uniqueStrings);
    
    // 发送提取完成信息
    if (isChildProcess) {
      process.send({
        type: 'extraction_complete',
        extractedCount: STATS.extractedCount,
        processingTime: STATS.processingTime
      });
    }
    
    // 4. 更新翻译词典
    let updatedScript = await updateTranslationDictionary(originalScript, uniqueStrings);
    
    // 5. 更新版本号
    updatedScript = await updateVersion(updatedScript);
    
    // 6. 保存更新后的脚本
    await saveUserScript(updatedScript);
    
    // 生成最终统计信息
    const finalStats = {
      success: true,
      extractedCount: STATS.extractedCount,
      addedCount: STATS.addedCount,
      skippedCount: STATS.skippedCount || 0,
      errorCount: STATS.errorCount,
      startTime: STATS.startTime,
      endTime: new Date().toISOString(),
      modules: STATS.modules
    };
    
    // 计算总处理时间
    finalStats.totalProcessingTime = ((new Date(finalStats.endTime).getTime() - 
                                      new Date(finalStats.startTime).getTime()) / 1000).toFixed(2);
    
    log('info', '自动化字符串更新完成！');
    log('info', `总计添加了 ${formatNumber(STATS.addedCount)} 个新字符串`);
    if (STATS.errorCount > 0) {
      log('warn', `处理过程中遇到 ${STATS.errorCount} 个错误`);
    }
    log('info', '注意：新添加的字符串标记为"待翻译:"，需要手动进行翻译。');
    
    // 更新统计数据，传入完整的STATS对象
    await updateStatsAfterRun('success', finalStats);
    
    // 保存临时统计数据，供server.js使用
    await saveTempStats();
    
    // 通知父进程处理完成
    if (isChildProcess) {
      process.send({
        type: 'complete',
        success: true,
        addedCount: STATS.addedCount,
        errorCount: STATS.errorCount,
        stats: finalStats
      });
    }
    
    // 正常退出
    process.exit(0);
  } catch (error) {
    log('error', '自动化字符串更新失败:', error);
    
    // 更新统计信息
    STATS.errorCount++;
    STATS.endTime = new Date().toISOString();
    
    // 生成失败统计信息
    const failureStats = {
      success: false,
      error: error.message,
      extractedCount: STATS.extractedCount,
      addedCount: STATS.addedCount,
      errorCount: STATS.errorCount,
      startTime: STATS.startTime,
      endTime: STATS.endTime,
      modules: STATS.modules
    };
    
    // 更新失败状态
    try {
      await updateStatsAfterRun('failed', failureStats);
      // 即使失败，也保存临时统计数据
      await saveTempStats();
    } catch (e) {
      log('error', '更新统计数据失败:', e);
    }
    
    // 通知父进程处理失败
    if (isChildProcess) {
      process.send({
        type: 'error',
        success: false,
        message: error.message,
        errorCount: STATS.errorCount,
        stats: failureStats
      });
    }
    
    process.exit(1);
  }
}

// 注意：updateStatsAfterRun函数已移至utils.js文件中

// 执行主函数
main().catch(err => {
  log('error', '程序执行出错:', err);
  process.exit(1);
});