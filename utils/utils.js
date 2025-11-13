/**
 * 共享工具函数模块
 * 包含各种通用的辅助函数
 */

/**
 * 转义正则表达式中的特殊字符
 * @param {string} string - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeRegExp(string) {
    // 转义所有正则表达式特殊字符，包括/字符
    return string.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/**
 * 格式化数字（添加千分位分隔符）
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 延迟函数，返回Promise的setTimeout
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 分批处理数组
 * @param {Array} items - 要处理的数组
 * @param {Function} processFn - 处理函数
 * @param {number} batchSize - 批次大小
 * @returns {Promise<Array>} 处理结果
 */
export async function processPagesInBatches(items, processFn, batchSize = 5) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processFn));
        results.push(...batchResults);
        // 批次之间添加延迟，避免请求过于频繁
        if (i + batchSize < items.length) {
            await sleep(1000);
        }
    }
    return results;
}

/**
 * 验证配置对象
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果
 */
export function validateConfig(config) {
    const errors = [];
    
    // 验证必要的配置项
    if (!config.userScriptPath) {
        errors.push('userScriptPath 是必填项');
    }
    
    if (!config.backupDir) {
        errors.push('backupDir 是必填项');
    }
    
    // 验证数字配置项
    if (config.minStringLength && (typeof config.minStringLength !== 'number' || config.minStringLength < 0)) {
        errors.push('minStringLength 必须是大于等于0的数字');
    }
    
    if (config.maxStringLength && (typeof config.maxStringLength !== 'number' || config.maxStringLength < config.minStringLength)) {
        errors.push('maxStringLength 必须大于等于 minStringLength');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * 更新运行后的统计信息
 * @param {Object} stats - 统计信息对象
 * @returns {void}
 */
export function updateStatsAfterRun(stats) {
    // 这里可以添加统计信息的更新逻辑
    console.log('运行完成，更新统计信息:', stats);
}

// 导出所有函数
module.exports = {
    escapeRegExp,
    formatNumber,
    sleep,
    processPagesInBatches,
    validateConfig,
    updateStatsAfterRun
};
