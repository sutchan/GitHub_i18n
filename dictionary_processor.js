/**
 * GitHub 中文翻译 - 词典处理器
 * @version 1.8.24
 * @description 处理翻译词典的合并、提取和验证
 * @author Sut (https://github.com/sutchan)
 */

class DictionaryProcessor {
    constructor() {
        this.processedCount = 0;
        this.errorCount = 0;
    }

    /**
     * 合并多个翻译模块
     * @param {Object} modules - 翻译模块对象集合
     * @returns {Object} 合并后的翻译词典
     */
    mergeDictionaries(modules) {
        const merged = {};
        let duplicateCount = 0;
        
        for (const moduleName in modules) {
            const module = modules[moduleName];
            
            for (const key in module) {
                if (merged[key]) {
                    // 检测到重复键
                    duplicateCount++;
                    if (merged[key] !== module[key]) {
                        console.warn(`[词典处理] 发现冲突键: "${key}" 在模块 ${moduleName} 中与现有翻译不同`);
                        this.errorCount++;
                    }
                } else {
                    merged[key] = module[key];
                    this.processedCount++;
                }
            }
        }
        
        console.log(`[词典处理] 已合并 ${Object.keys(merged).length} 个翻译条目，发现 ${duplicateCount} 个重复键`);
        return merged;
    }

    /**
     * 验证翻译词典的完整性
     * @param {Object} dictionary - 翻译词典
     * @returns {Object} 验证报告
     */
    validateDictionary(dictionary) {
        const validationReport = {
            totalEntries: 0,
            untranslatedEntries: 0,
            emptyEntries: 0,
            sameAsOriginal: 0,
            untranslatedKeys: [],
            emptyKeys: [],
            sameAsOriginalKeys: []
        };
        
        for (const key in dictionary) {
            validationReport.totalEntries++;
            const translation = dictionary[key];
            
            // 检查是否为空
            if (!translation || translation.trim() === '') {
                validationReport.emptyEntries++;
                validationReport.emptyKeys.push(key);
                this.errorCount++;
            }
            // 检查是否标记为待翻译
            else if (translation.startsWith('待翻译: ')) {
                validationReport.untranslatedEntries++;
                validationReport.untranslatedKeys.push(key);
            }
            // 检查是否与原文相同（去除标记后）
            else if (translation === key) {
                validationReport.sameAsOriginal++;
                validationReport.sameAsOriginalKeys.push(key);
                this.errorCount++;
            }
        }
        
        // 计算翻译完成率
        const translatedEntries = validationReport.totalEntries - 
                                 validationReport.untranslatedEntries - 
                                 validationReport.emptyEntries;
        
        validationReport.translatedEntries = translatedEntries;
        validationReport.completionRate = validationReport.totalEntries > 0 ? 
                                         (translatedEntries / validationReport.totalEntries * 100).toFixed(2) : '0.00';
        
        return validationReport;
    }

    /**
     * 从词典中提取特定模块的翻译
     * @param {Object} dictionary - 完整的翻译词典
     * @param {Array} moduleKeys - 模块的关键词数组
     * @returns {Object} 提取的模块翻译
     */
    extractModuleDictionary(dictionary, moduleKeys) {
        const moduleDictionary = {};
        
        for (const key in dictionary) {
            // 检查键是否包含模块关键词
            const isModuleKey = moduleKeys.some(moduleKey => 
                key.toLowerCase().includes(moduleKey.toLowerCase())
            );
            
            if (isModuleKey) {
                moduleDictionary[key] = dictionary[key];
            }
        }
        
        return moduleDictionary;
    }

    /**
     * 按长度排序翻译词典
     * @param {Object} dictionary - 翻译词典
     * @param {boolean} descending - 是否降序排列
     * @returns {Array} 排序后的键值对数组
     */
    sortDictionaryByLength(dictionary, descending = true) {
        return Object.entries(dictionary)
            .sort((a, b) => {
                const lenA = a[0].length;
                const lenB = b[0].length;
                return descending ? lenB - lenA : lenA - lenB;
            });
    }

    /**
     * 过滤词典中的未翻译条目
     * @param {Object} dictionary - 翻译词典
     * @param {boolean} includeUntranslated - 是否包含未翻译条目
     * @returns {Object} 过滤后的词典
     */
    filterDictionary(dictionary, includeUntranslated = true) {
        const filtered = {};
        
        for (const key in dictionary) {
            const translation = dictionary[key];
            
            if (includeUntranslated || 
                (!translation.startsWith('待翻译: ') && 
                 translation.trim() !== '' && 
                 translation !== key)) {
                filtered[key] = translation;
            }
        }
        
        return filtered;
    }

    /**
     * 导出词典为JSON格式
     * @param {Object} dictionary - 翻译词典
     * @param {Object} options - 导出选项
     * @returns {string} JSON字符串
     */
    exportToJson(dictionary, options = {}) {
        const {
            prettyPrint = true,
            sortKeys = true,
            includeMetadata = true
        } = options;
        
        let exportData = { ...dictionary };
        
        // 添加元数据
        if (includeMetadata) {
            exportData = {
                ...exportData,
                _metadata: {
                    exportDate: new Date().toISOString(),
                    entryCount: Object.keys(dictionary).length,
                    version: '1.8.20',
                    author: 'Sut (https://github.com/sutchan)'
                }
            };
        }
        
        // 排序键
        if (sortKeys) {
            const sorted = {};
            Object.keys(exportData).sort().forEach(key => {
                sorted[key] = exportData[key];
            });
            exportData = sorted;
        }
        
        return JSON.stringify(exportData, null, prettyPrint ? 2 : 0);
    }

    /**
     * 生成翻译统计报告
     * @param {Object} dictionary - 翻译词典
     * @returns {Object} 统计报告
     */
    generateStatisticsReport(dictionary) {
        const validation = this.validateDictionary(dictionary);
        const sortedEntries = this.sortDictionaryByLength(dictionary);
        
        // 计算平均字符串长度
        const totalKeyLength = Object.keys(dictionary).reduce((sum, key) => sum + key.length, 0);
        const averageKeyLength = validation.totalEntries > 0 ? 
                                (totalKeyLength / validation.totalEntries).toFixed(2) : 0;
        
        return {
            ...validation,
            averageKeyLength,
            longestKeys: sortedEntries.slice(0, 10).map(entry => entry[0]),
            shortestKeys: sortedEntries.slice(-10).map(entry => entry[0]),
            processingInfo: {
                processedCount: this.processedCount,
                errorCount: this.errorCount,
                processedAt: new Date().toISOString()
            }
        };
    }

    /**
     * 在控制台显示统计报告
     * @param {Object} dictionary - 翻译词典
     */
    showStatisticsInConsole(dictionary) {
        const stats = this.generateStatisticsReport(dictionary);
        
        console.log('[GitHub 中文翻译] 词典统计报告');
        console.log(`📊 总条目数: ${stats.totalEntries}`);
        console.log(`✅ 已翻译条目: ${stats.translatedEntries}`);
        console.log(`⏳ 待翻译条目: ${stats.untranslatedEntries}`);
        console.log(`❌ 空条目: ${stats.emptyEntries}`);
        console.log(`⚠️  与原文相同: ${stats.sameAsOriginal}`);
        console.log(`📈 完成率: ${stats.completionRate}%`);
        console.log(`📏 平均键长度: ${stats.averageKeyLength} 字符`);
        
        if (stats.longestKeys.length > 0) {
            console.log('\n📏 最长的5个键:');
            stats.longestKeys.slice(0, 5).forEach((key, i) => {
                console.log(`${i + 1}. "${key}" (${key.length} 字符)`);
            });
        }
        
        if (stats.errorCount > 0) {
            console.log('\n❌ 发现问题:');
            if (stats.emptyKeys.length > 0) {
                console.log(`- ${stats.emptyKeys.length} 个空翻译`);
            }
            if (stats.sameAsOriginalKeys.length > 0) {
                console.log(`- ${stats.sameAsOriginalKeys.length} 个翻译与原文相同`);
            }
        }
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined') {
    module.exports = DictionaryProcessor;
} else {
    // 在浏览器环境中，挂载到全局对象
    window.DictionaryProcessor = DictionaryProcessor;
}