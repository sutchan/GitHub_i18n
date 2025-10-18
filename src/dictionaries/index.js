/**
 * 翻译词典合并模块
 * 整合所有页面的翻译词典
 */
import { codespacesDictionary } from './codespaces.js';
import { exploreDictionary } from './explore.js';

/**
 * 翻译词典对象，包含所有需要翻译的字符串
 */
export const translationModule = {
    "codespaces": codespacesDictionary,
    "explore": exploreDictionary
    // 可以根据需要添加更多页面的词典
};

/**
 * 合并所有词典为一个完整的词典对象
 * @returns {Object} 合并后的词典
 */
export function mergeAllDictionaries() {
    const merged = {};
    for (const module in translationModule) {
        Object.assign(merged, translationModule[module]);
    }
    return merged;
}