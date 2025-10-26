/**
 * 开发工具模块
 * 包含字符串提取、自动更新和词典处理等开发工具
 */
// 删除未使用的CONFIG导入
import { utils } from './utils.js';
import { translationModule } from './dictionaries/index.js';

/**
 * 字符串提取器对象
 */
export const stringExtractor = {
    /**
     * 收集页面上的字符串
     * @param {boolean} showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 收集到的字符串集合
     */
    collectStrings(showInConsole = true) {
        const strings = new Set();
        utils.collectTextNodes(document.body, strings);
        
        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 收集到 ${strings.size} 个字符串`);
            console.log('收集到的字符串:', strings);
        }
        
        return strings;
    },
    
    /**
     * 查找未翻译的字符串
     * @param {boolean} showInConsole - 是否在控制台显示结果
     * @returns {Set<string>} 未翻译的字符串集合
     */
    findUntranslatedStrings(showInConsole = true) {
        const allStrings = this.collectStrings(false);
        const untranslated = new Set();
        
        // 合并所有词典
        const mergedDictionary = {};
        for (const module in translationModule) {
            Object.assign(mergedDictionary, translationModule[module]);
        }
        
        // 检查每个字符串是否已翻译
        allStrings.forEach(string => {
            if (!mergedDictionary[string] || mergedDictionary[string].startsWith('待翻译: ')) {
                untranslated.add(string);
            }
        });
        
        if (showInConsole) {
            console.log(`[GitHub 中文翻译] 找到 ${untranslated.size} 个未翻译的字符串`);
            console.log('未翻译的字符串:', untranslated);
        }
        
        return untranslated;
    }
};

/**
 * 自动字符串更新器类
 */
export class AutoStringUpdater {
    constructor() {
        this.processedCount = 0;
    }
    
    /**
     * 查找需要添加的字符串
     * @returns {Set<string>} 需要添加的字符串集合
     */
    findStringsToAdd() {
        const untranslated = stringExtractor.findUntranslatedStrings(false);
        return new Set(Array.from(untranslated).filter(str => !str.startsWith('待翻译: ')));
    }
    
    /**
     * 生成更新报告
     * @returns {Object} 更新报告对象
     */
    generateUpdateReport() {
        const stringsToAdd = this.findStringsToAdd();
        return {
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href,
            pageTitle: document.title,
            stringsToAdd: Array.from(stringsToAdd),
            totalNew: stringsToAdd.size
        };
    }
    
    /**
     * 在控制台显示报告
     */
    showReportInConsole() {
        const report = this.generateUpdateReport();
        console.log('[GitHub 中文翻译] 字符串更新报告');
        console.log(`📄 页面: ${report.pageTitle}`);
        console.log(`✅ 找到 ${report.totalNew} 个新字符串`);
    }
}

/**
 * 词典处理器类
 */
export class DictionaryProcessor {
    constructor() {
        this.processedCount = 0;
    }
    
    /**
     * 合并词典
     * @returns {Object} 合并后的词典
     */
    mergeDictionaries() {
        const merged = {};
        for (const module in translationModule) {
            Object.assign(merged, translationModule[module]);
        }
        return merged;
    }
    
    /**
     * 验证词典
     * @returns {Object} 词典验证结果
     */
    validateDictionary() {
        const dictionary = this.mergeDictionaries();
        const total = Object.keys(dictionary).length;
        const untranslated = Array.from(stringExtractor.findUntranslatedStrings(false)).length;
        return {
            totalEntries: total,
            translatedEntries: total - untranslated,
            completionRate: total > 0 ? ((total - untranslated) / total * 100).toFixed(2) : '0.00'
        };
    }
    
    /**
     * 在控制台显示统计信息
     */
    showStatisticsInConsole() {
        const stats = this.validateDictionary();
        console.log('[GitHub 中文翻译] 词典统计');
        console.log(`📊 总条目数: ${stats.totalEntries}`);
        console.log(`✅ 已翻译条目: ${stats.translatedEntries}`);
        console.log(`📈 完成率: ${stats.completionRate}%`);
    }
}

/**
 * 加载工具类
 * @returns {Object} 包含工具类的对象
 */
export function loadTools() {
    return { 
        stringExtractor, 
        AutoStringUpdater, 
        DictionaryProcessor 
    };
}