// string_collector.js
// GitHub字符串采集模块
// 作者: SutChan
// 版本: 1.8.16

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const https = require('https');

// 配置
const CONFIG = {
  outputDir: path.resolve(__dirname, '../src/dictionaries'),
  temporaryDir: path.resolve(__dirname, 'temp'),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  httpTimeout: 30000,
  maxRetries: 3,
  retryDelay: 2000,
  logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};

/**
 * 统一日志处理函数
 */
function log(level, message, details = null) {
  // 根据日志级别过滤
  const levels = ['debug', 'info', 'warn', 'error'];
  if (levels.indexOf(level) < levels.indexOf(CONFIG.logLevel)) {
    return;
  }

  let logMessage = `[${level.toUpperCase()}] ${message}`;

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

/**
 * 确保目录存在
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    log('debug', `确保目录存在: ${dirPath}`);
  } catch (error) {
    log('error', `创建目录失败: ${dirPath}`, error);
    throw error;
  }
}

/**
 * 下载网页内容
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
          'User-Agent': CONFIG.userAgent
        },
        timeout: CONFIG.httpTimeout
      };

      const req = https.get(url, options, (res) => {
        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).href;
          log('info', `重定向: ${url} -> ${redirectUrl}`);
          req.destroy();
          downloadPage(redirectUrl, retryCount).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          const error = new Error(`请求失败: ${url}, 状态码: ${res.statusCode}`);
          if (retryCount < CONFIG.maxRetries) {
            log('info', `请求失败，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
            req.destroy();
            setTimeout(() => {
              downloadPage(url, retryCount + 1).then(resolve).catch(reject);
            }, CONFIG.retryDelay);
          } else {
            reject(error);
          }
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            const data = Buffer.concat(chunks).toString('utf8');
            log('info', `成功下载 ${url}`);
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
          setTimeout(() => {
            downloadPage(url, retryCount + 1).then(resolve).catch(reject);
          }, CONFIG.retryDelay);
        } else {
          reject(error);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        const error = new Error(`请求超时: ${url} (${CONFIG.httpTimeout}ms)`);
        if (retryCount < CONFIG.maxRetries) {
          log('info', `请求超时，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
          setTimeout(() => {
            downloadPage(url, retryCount + 1).then(resolve).catch(reject);
          }, CONFIG.retryDelay);
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    log('error', `下载页面时发生错误: ${url}`, error);
    throw error;
  }
}

/**
 * 从页面中提取字符串
 * @param {string} html - HTML内容
 * @param {Array} selectors - CSS选择器数组
 * @returns {Array} 提取的字符串数组
 */
function extractStrings(html, selectors = ['body']) {
  try {
    const { window } = new JSDOM(html);
    const document = window.document;
    const extractedStrings = new Set();

    // 遍历所有选择器
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // 提取文本节点
          extractTextFromElement(element, extractedStrings);
        });
      } catch (e) {
        log('warn', `无效的选择器: ${selector}`, e);
      }
    });

    window.close();
    return Array.from(extractedStrings);
  } catch (error) {
    log('error', '提取字符串时发生错误', error);
    return [];
  }
}

/**
 * 从元素中递归提取文本
 */
function extractTextFromElement(element, stringSet) {
  // 跳过脚本和样式元素
  if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes(element.tagName)) {
    return;
  }

  // 处理文本节点
  Array.from(element.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const text = node.textContent.trim();
      
      // 过滤掉不符合条件的字符串
      if (isValidString(text)) {
        stringSet.add(text);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 递归处理子元素
      extractTextFromElement(node, stringSet);
    }
  });

  // 处理placeholder属性
  if (element.hasAttribute('placeholder')) {
    const placeholder = element.getAttribute('placeholder').trim();
    if (placeholder && isValidString(placeholder)) {
      stringSet.add(placeholder);
    }
  }

  // 处理title属性
  if (element.hasAttribute('title')) {
    const title = element.getAttribute('title').trim();
    if (title && isValidString(title)) {
      stringSet.add(title);
    }
  }
}

/**
 * 检查字符串是否有效（可翻译）
 */
function isValidString(text) {
  // 过滤掉空字符串
  if (!text || text.length === 0) {
    return false;
  }

  // 过滤掉过短的字符串（可能是无意义的符号）
  if (text.length < 2) {
    return false;
  }

  // 过滤掉纯数字和特殊字符
  if (/^[\d\s!@#$%^&*(),.?":{}|<>\[\]]+$/.test(text)) {
    return false;
  }

  // 过滤掉纯CSS或HTML代码片段
  if (/^[\s\S]*<[^>]+>[\s\S]*$/.test(text) || 
      /^[\s\S]*{[^}]+}[\s\S]*$/.test(text)) {
    return false;
  }

  // 过滤掉URL
  if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) {
    return false;
  }

  return true;
}

/**
 * 从页面配置中采集字符串
 */
async function collectStringsFromPage(pageConfig) {
  try {
    log('info', `开始从页面采集字符串: ${pageConfig.name} (${pageConfig.url})`);
    
    // 下载页面
    const html = await downloadPage(pageConfig.url);
    
    // 提取字符串
    const selectors = pageConfig.selectors || ['body'];
    const strings = extractStrings(html, selectors);
    
    log('info', `从 ${pageConfig.name} 成功提取 ${strings.length} 个字符串`);
    
    return {
      pageId: pageConfig.id,
      pageName: pageConfig.name,
      url: pageConfig.url,
      strings,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    log('error', `从页面采集字符串失败: ${pageConfig.name}`, error);
    return {
      pageId: pageConfig.id,
      pageName: pageConfig.name,
      url: pageConfig.url,
      strings: [],
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 批量采集多个页面的字符串
 */
async function collectStringsFromPages(pages, onProgress) {
  const results = [];
  let successCount = 0;
  let failedCount = 0;
  let totalStrings = 0;
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    if (page.enabled === false) {
      log('info', `跳过已禁用的页面: ${page.name}`);
      continue;
    }
    
    try {
      const result = await collectStringsFromPage(page);
      results.push(result);
      
      if (result.error) {
        failedCount++;
      } else {
        successCount++;
        totalStrings += result.strings.length;
      }
      
      // 调用进度回调
      if (typeof onProgress === 'function') {
        onProgress({
          current: i + 1,
          total: pages.length,
          page: page,
          result: result,
          successCount,
          failedCount,
          totalStrings
        });
      }
    } catch (error) {
      log('error', `处理页面时发生错误: ${page.name}`, error);
      failedCount++;
      
      // 即使失败也要更新进度
      if (typeof onProgress === 'function') {
        onProgress({
          current: i + 1,
          total: pages.length,
          page: page,
          error: error.message,
          successCount,
          failedCount,
          totalStrings
        });
      }
    }
    
    // 添加小延迟，避免请求过快
    if (i < pages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    results,
    summary: {
      totalPages: pages.length,
      processedPages: results.length,
      successCount,
      failedCount,
      totalStrings
    }
  };
}

/**
 * 保存采集结果到JSON文件
 */
async function saveCollectionResults(results, outputPath) {
  try {
    await ensureDirectoryExists(path.dirname(outputPath));
    
    const outputData = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      summary: results.summary,
      data: results.results
    };
    
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    log('info', `采集结果已保存到: ${outputPath}`);
    
    return true;
  } catch (error) {
    log('error', '保存采集结果失败', error);
    return false;
  }
}

/**
 * 导出字符串为字典格式
 */
async function exportToDictionary(results, outputPath) {
  try {
    // 合并所有页面的字符串并去重
    const allStrings = new Set();
    
    results.results.forEach(result => {
      result.strings.forEach(str => {
        allStrings.add(str);
      });
    });
    
    // 创建字典对象
    const dictionary = {};
    Array.from(allStrings).forEach(str => {
      dictionary[str] = ''; // 空翻译，等待手动填充
    });
    
    const outputData = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      source: 'auto-collected',
      entries: dictionary
    };
    
    await ensureDirectoryExists(path.dirname(outputPath));
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    
    log('info', `字典已导出到: ${outputPath}`);
    log('info', `共导出 ${allStrings.size} 个唯一字符串`);
    
    return {
      success: true,
      path: outputPath,
      stringCount: allStrings.size
    };
  } catch (error) {
    log('error', '导出字典失败', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 导出模块
try {
  module.exports = {
    CONFIG,
    downloadPage,
    extractStrings,
    collectStringsFromPage,
    collectStringsFromPages,
    saveCollectionResults,
    exportToDictionary,
    log,
    ensureDirectoryExists
  };
} catch (e) {
  // 如果在浏览器环境中，导出到全局对象
  if (typeof window !== 'undefined') {
    window.StringCollector = {
      CONFIG,
      downloadPage,
      extractStrings,
      collectStringsFromPage,
      collectStringsFromPages,
      saveCollectionResults,
      exportToDictionary,
      log,
      ensureDirectoryExists
    };
  }
}
