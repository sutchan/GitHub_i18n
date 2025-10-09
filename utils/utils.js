// utils.js
// 共享工具函数库
// 作者: SutChan

const fs = require('fs').promises;
const path = require('path');

/**
 * 统一日志处理函数
 * @param {string} level - 日志级别 (debug, info, warn, error)
 * @param {string} message - 日志消息
 * @param {Error|Object} [error] - 可选的错误对象或其他数据
 */
function log(level, message, error = null) {
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  // 开发环境下显示所有日志
  // 生产环境可以通过环境变量设置日志级别
  const currentLevel = 'debug'; // 临时改为debug级别以显示所有调试信息

  // 如果当前日志级别低于设置的级别，则不输出
  // if (levels[level] < levels[currentLevel]) {
  //   return;
  // }

  // 构建基础日志消息（不包含时间戳，因为前端会添加）
  let logMessage = `[${level.toUpperCase()}] ${message}`;

  // 如果有错误对象，添加错误详情
  if (error instanceof Error) {
    logMessage += `\n错误: ${error.message}\n堆栈: ${error.stack}`;
  } else if (error !== null) {
    try {
      // 尝试将其他类型的错误数据转换为字符串
      logMessage += `\n详细信息: ${JSON.stringify(error, null, 2)}`;
    } catch (e) {
      // 如果无法序列化，直接使用toString()
      logMessage += `\n详细信息: ${String(error)}`;
    }
  }

  // 根据日志级别选择输出方法
  switch (level) {
    case 'debug':
    case 'info':
      console.log(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'error':
      console.error(logMessage);
      break;
    default:
      console.log(logMessage);
  }

  // 如果是子进程，将日志信息发送给父进程
  if (process.send && level !== 'debug') {
    try {
      process.send({
        type: 'log',
        level: level,
        message: message,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });
    } catch (sendError) {
      // 发送失败不影响主流程
      console.error('发送日志到父进程失败:', sendError);
    }
  }
}

/**
 * 更新运行后的统计数据
 * @param {string} status - 运行状态 (success/failed)
 * @param {Object} statsData - 可选的统计数据对象
 * @param {string} statsFilePath - 统计文件路径
 * @param {string} tempStatsPath - 临时统计文件路径
 * @returns {Promise<void>}
 */
async function updateStatsAfterRun(status = 'success', statsData = null, 
                                   statsFilePath = path.resolve(__dirname, 'api', 'stats.json'),
                                   tempStatsPath = path.join(__dirname, 'temp_stats.json')) {
  try {
    let stats = {};
    
    try {
      // 读取现有统计数据
      const data = await fs.readFile(statsFilePath, 'utf8');
      stats = JSON.parse(data);
    } catch (error) {
      log('info', '创建新的统计数据文件');
    }
    
    // 使用传入的数据或从临时文件读取
    if (statsData) {
      Object.assign(stats, statsData);
    } else {
      // 尝试从临时文件读取统计数据
      try {
        if (await fs.stat(tempStatsPath).catch(() => false)) {
          const tempStats = JSON.parse(await fs.readFile(tempStatsPath, 'utf8'));
          Object.assign(stats, tempStats);
          // 删除临时文件
          await fs.unlink(tempStatsPath);
        }
      } catch (error) {
        log('info', '没有找到临时统计文件，使用现有统计数据');
      }
    }
    
    // 更新通用统计信息
    stats.lastUpdate = new Date().toLocaleString('zh-CN');
    stats.lastRunStatus = status;
    stats.runCount = (stats.runCount || 0) + 1;
    
    // 添加运行历史记录
    if (!stats.runHistory) {
      stats.runHistory = [];
    }
    
    // 限制历史记录长度为10条
    stats.runHistory.unshift({
      timestamp: new Date().toISOString(),
      status: status,
      extractedCount: stats.extractedCount || 0,
      addedCount: stats.addedCount || 0
    });
    
    if (stats.runHistory.length > 10) {
      stats.runHistory = stats.runHistory.slice(0, 10);
    }
    
    await fs.writeFile(statsFilePath, JSON.stringify(stats, null, 2));
    log('info', '统计数据已更新');
  } catch (error) {
    log('error', '更新统计数据失败:', error);
  }
}

/**
 * 验证配置对象
 * @param {Object} config - 配置对象
 * @returns {Array<string>} 验证错误列表，为空表示验证通过
 */
function validateConfig(config) {
  const errors = [];
  
  // 验证必需字段
  if (!config.userScriptPath || typeof config.userScriptPath !== 'string') {
    errors.push('userScriptPath 必须是有效的字符串');
  }
  
  // 验证数字字段
  const numericFields = ['minStringLength', 'maxStringLength', 'httpTimeout', 'maxRetries', 'retryDelay', 'requestDelay', 'concurrentRequests'];
  numericFields.forEach(field => {
    if (config[field] !== undefined && (typeof config[field] !== 'number' || config[field] < 0)) {
      errors.push(`${field} 必须是非负数字`);
    }
  });
  
  // 验证并发请求数的合理范围
  if (config.concurrentRequests !== undefined && (config.concurrentRequests < 1 || config.concurrentRequests > 10)) {
    errors.push('concurrentRequests 必须在 1 到 10 之间');
  }
  
  // 验证布尔字段
  const booleanFields = ['debugMode', 'exactMatchOnly'];
  booleanFields.forEach(field => {
    if (config[field] !== undefined && typeof config[field] !== 'boolean') {
      errors.push(`${field} 必须是布尔值`);
    }
  });
  
  // 验证数组字段
  const arrayFields = ['ignoreWords', 'ignorePatterns', 'includePatterns'];
  arrayFields.forEach(field => {
    if (config[field] !== undefined && !Array.isArray(config[field])) {
      errors.push(`${field} 必须是数组`);
    }
  });
  
  return errors;
}

/**
 * 分批并行处理页面
 * @param {Array} pages - 页面配置数组
 * @param {Function} processFn - 处理单个页面的函数
 * @param {number} batchSize - 每批处理的页面数量
 * @param {number} delayMs - 批处理间隔时间（毫秒）
 * @param {number} maxRetries - 最大重试次数
 * @param {Function} progressCallback - 进度回调函数
 * @returns {Promise<Array>} 所有页面的处理结果合并后的数组
 */
async function processPagesInBatches(pages, processFn, batchSize = 3, delayMs = 1000, maxRetries = 2, progressCallback = null) {
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    return [];
  }
  
  // 确保batchSize在合理范围内
  batchSize = Math.max(1, Math.min(10, batchSize));
  
  const results = [];
  const totalPages = pages.length;
  let processedCount = 0;
  const startTime = Date.now();
  
  // 辅助函数：重试处理单个页面
  const processWithRetry = async (page, retriesLeft = maxRetries) => {
    try {
      const result = await processFn(page);
      
      // 更新进度
      processedCount++;
      if (progressCallback) {
        const progress = Math.round((processedCount / totalPages) * 100);
        const elapsedTime = (Date.now() - startTime) / 1000;
        const estimatedTotalTime = (elapsedTime / processedCount) * totalPages;
        const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
        
        progressCallback({
          progress: progress,
          processed: processedCount,
          total: totalPages,
          elapsedTime: elapsedTime,
          remainingTime: remainingTime,
          currentUrl: page.url
        });
      }
      
      return result;
    } catch (error) {
      log('error', `处理页面 ${page.url || page} 失败:`, error);
      
      if (retriesLeft > 0) {
        log('info', `剩余重试次数: ${retriesLeft}, 1秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return processWithRetry(page, retriesLeft - 1);
      } else {
        log('error', `页面 ${page.url || page} 已达到最大重试次数，放弃处理`);
        
        // 即使失败也要更新进度
        processedCount++;
        if (progressCallback) {
          const progress = Math.round((processedCount / totalPages) * 100);
          progressCallback({
            progress: progress,
            processed: processedCount,
            total: totalPages,
            currentUrl: page.url,
            status: 'failed'
          });
        }
        
        return [];
      }
    }
  };
  
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    
    log('info', `正在处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)}，包含 ${batch.length} 个页面`);
    
    // 并行处理一批页面
    const batchResults = await Promise.all(
      batch.map(page => processWithRetry(page))
    );
    
    // 合并结果
    batchResults.forEach(pageResults => {
      if (Array.isArray(pageResults)) {
        results.push(...pageResults);
      } else if (pageResults) {
        results.push(pageResults);
      }
    });
    
    // 批处理间隔
    if (i + batchSize < pages.length) {
        log('info', `批次 ${Math.floor(i / batchSize) + 1} 处理完成，等待 ${delayMs}ms 开始下一批次...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  log('info', `所有 ${totalPages} 个页面处理完成，耗时 ${totalTime.toFixed(2)} 秒`);
  
  return results;
}

/**
 * 延迟执行函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化数字显示
 * @param {number} num - 数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num, decimals = 2) {
  return num.toFixed(decimals);
}

module.exports = {
  log,
  updateStatsAfterRun,
  validateConfig,
  processPagesInBatches,
  sleep,
  formatNumber
};