/**
 * 性能基准测试工具
 * 用于量化性能改进和比较不同实现的性能
 */

const fs = require('fs');
const path = require('path');

/**
 * 性能基准测试器
 */
class PerformanceBenchmark {
    constructor() {
        this.results = {};
        this.testSuites = [];
    }

    /**
     * 添加测试套件
     * @param {string} name - 测试套件名称
     * @param {Function} setup - 设置函数
     * @param {Function} test - 测试函数
     * @param {Function} teardown - 清理函数
     */
    addTestSuite(name, setup, test, teardown) {
        this.testSuites.push({
            name,
            setup,
            test,
            teardown
        });
    }

    /**
     * 运行基准测试
     * @param {Object} options - 选项
     * @returns {Object} 测试结果
     */
    async runBenchmarks(options = {}) {
        const {
            iterations = 1000,
            warmupIterations = 100,
            timeout = 5000
        } = options;

        this.results = {};

        for (const suite of this.testSuites) {
            console.log(`运行测试套件: ${suite.name}`);
            
            try {
                // 预热
                if (suite.setup) {
                    for (let i = 0; i < warmupIterations; i++) {
                        const context = suite.setup();
                        if (suite.test) {
                            await suite.test(context);
                        }
                        if (suite.teardown) {
                            suite.teardown(context);
                        }
                    }
                }

                // 实际测试
                const times = [];
                
                for (let i = 0; i < iterations; i++) {
                    const context = suite.setup ? suite.setup() : {};
                    
                    const startTime = process.hrtime.bigint();
                    
                    if (suite.test) {
                        await Promise.race([
                            suite.test(context),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('测试超时')), timeout)
                            )
                        ]);
                    }
                    
                    const endTime = process.hrtime.bigint();
                    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
                    
                    times.push(duration);
                    
                    if (suite.teardown) {
                        suite.teardown(context);
                    }
                }

                // 计算统计数据
                const stats = this.calculateStats(times);
                this.results[suite.name] = stats;
                
                console.log(`完成测试套件: ${suite.name}`);
                console.log(`平均时间: ${stats.mean.toFixed(2)}ms`);
                console.log(`中位数: ${stats.median.toFixed(2)}ms`);
                console.log(`标准差: ${stats.stdDev.toFixed(2)}ms`);
                console.log(`最小值: ${stats.min.toFixed(2)}ms`);
                console.log(`最大值: ${stats.max.toFixed(2)}ms`);
                console.log('---');
                
            } catch (error) {
                console.error(`测试套件 ${suite.name} 执行失败:`, error.message);
                this.results[suite.name] = {
                    error: error.message
                };
            }
        }

        return this.results;
    }

    /**
     * 计算统计数据
     * @param {Array} values - 值数组
     * @returns {Object} 统计数据
     */
    calculateStats(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const count = sorted.length;
        
        // 计算平均值
        const sum = sorted.reduce((acc, val) => acc + val, 0);
        const mean = sum / count;
        
        // 计算中位数
        const median = count % 2 === 0
            ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
            : sorted[Math.floor(count / 2)];
        
        // 计算标准差
        const squaredDiffs = sorted.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
        const stdDev = Math.sqrt(avgSquaredDiff);
        
        // 计算百分位数
        const p95 = sorted[Math.floor(count * 0.95)];
        const p99 = sorted[Math.floor(count * 0.99)];
        
        return {
            count,
            mean,
            median,
            stdDev,
            min: sorted[0],
            max: sorted[count - 1],
            p95,
            p99,
            values: sorted
        };
    }

    /**
     * 比较两个测试结果
     * @param {string} test1 - 第一个测试名称
     * @param {string} test2 - 第二个测试名称
     * @returns {Object} 比较结果
     */
    compareResults(test1, test2) {
        const result1 = this.results[test1];
        const result2 = this.results[test2];
        
        if (!result1 || !result2 || result1.error || result2.error) {
            return {
                error: '无法比较，测试结果不可用'
            };
        }
        
        const improvement = ((result1.mean - result2.mean) / result1.mean) * 100;
        const significant = Math.abs(improvement) > 5; // 5%以上认为显著
        
        return {
            test1,
            test2,
            improvement: improvement.toFixed(2),
            significant,
            test1Mean: result1.mean,
            test2Mean: result2.mean,
            test1Median: result1.median,
            test2Median: result2.median,
            test1StdDev: result1.stdDev,
            test2StdDev: result2.stdDev
        };
    }

    /**
     * 生成性能报告
     * @param {string} outputPath - 输出路径
     * @returns {string} 报告内容
     */
    generateReport(outputPath = null) {
        const report = this.buildReport();
        
        if (outputPath) {
            fs.writeFileSync(outputPath, report, 'utf8');
            console.log(`性能报告已生成: ${outputPath}`);
        }
        
        return report;
    }

    /**
     * 构建报告内容
     * @returns {string} 报告内容
     */
    buildReport() {
        const now = new Date();
        const timestamp = now.toISOString();
        
        let report = `# 性能基准测试报告\n\n`;
        report += `生成时间: ${timestamp}\n\n`;
        
        // 测试结果表格
        report += `## 测试结果\n\n`;
        report += `| 测试名称 | 平均时间(ms) | 中位数(ms) | 标准差(ms) | 最小值(ms) | 最大值(ms) | P95(ms) | P99(ms) |\n`;
        report += `|----------|--------------|------------|------------|------------|------------|---------|---------|\n`;
        
        Object.entries(this.results).forEach(([name, result]) => {
            if (result.error) {
                report += `| ${name} | 错误 | 错误 | 错误 | 错误 | 错误 | 错误 | 错误 |\n`;
            } else {
                report += `| ${name} | ${result.mean.toFixed(2)} | ${result.median.toFixed(2)} | ${result.stdDev.toFixed(2)} | ${result.min.toFixed(2)} | ${result.max.toFixed(2)} | ${result.p95.toFixed(2)} | ${result.p99.toFixed(2)} |\n`;
            }
        });
        
        // 详细结果
        report += `\n## 详细结果\n\n`;
        
        Object.entries(this.results).forEach(([name, result]) => {
            report += `### ${name}\n\n`;
            
            if (result.error) {
                report += `错误: ${result.error}\n\n`;
            } else {
                report += `- 平均时间: ${result.mean.toFixed(2)}ms\n`;
                report += `- 中位数: ${result.median.toFixed(2)}ms\n`;
                report += `- 标准差: ${result.stdDev.toFixed(2)}ms\n`;
                report += `- 最小值: ${result.min.toFixed(2)}ms\n`;
                report += `- 最大值: ${result.max.toFixed(2)}ms\n`;
                report += `- P95: ${result.p95.toFixed(2)}ms\n`;
                report += `- P99: ${result.p99.toFixed(2)}ms\n`;
                report += `- 测试次数: ${result.count}\n\n`;
            }
        });
        
        return report;
    }
}

/**
 * 创建翻译性能基准测试
 * @returns {PerformanceBenchmark} 基准测试实例
 */
function createTranslationBenchmark() {
    const benchmark = new PerformanceBenchmark();
    
    // 模拟翻译词典
    const dictionary = {
        'Pull Request': '拉取请求',
        'Issues': '问题',
        'Code': '代码',
        'Actions': '操作',
        'Projects': '项目',
        'Security': '安全',
        'Insights': '洞察',
        'Settings': '设置'
    };
    
    // 模拟DOM元素
    const createMockDOM = () => {
        return {
            elements: [
                { textContent: 'Pull Request' },
                { textContent: 'Issues' },
                { textContent: 'Code' },
                { textContent: 'Actions' },
                { textContent: 'Projects' },
                { textContent: 'Security' },
                { textContent: 'Insights' },
                { textContent: 'Settings' }
            ]
        };
    };
    
    // 简单翻译函数
    const simpleTranslate = (text) => {
        return dictionary[text] || text;
    };
    
    // 使用Trie树的翻译函数
    class TrieNode {
        constructor() {
            this.children = {};
            this.isEndOfWord = false;
            this.translation = null;
        }
    }
    
    class TranslationTrie {
        constructor() {
            this.root = new TrieNode();
        }
        
        insert(word, translation) {
            let node = this.root;
            
            for (const char of word) {
                if (!node.children[char]) {
                    node.children[char] = new TrieNode();
                }
                node = node.children[char];
            }
            
            node.isEndOfWord = true;
            node.translation = translation;
        }
        
        search(word) {
            let node = this.root;
            
            for (const char of word) {
                if (!node.children[char]) {
                    return null;
                }
                node = node.children[char];
            }
            
            return node.isEndOfWord ? node.translation : null;
        }
    }
    
    const trieTranslate = (text) => {
        // 初始化Trie树（在实际应用中应该只初始化一次）
        const trie = new TranslationTrie();
        
        for (const [key, value] of Object.entries(dictionary)) {
            trie.insert(key, value);
        }
        
        return trie.search(text) || text;
    };
    
    // 添加测试套件：简单翻译
    benchmark.addTestSuite(
        '简单翻译',
        createMockDOM,
        (context) => {
            for (const element of context.elements) {
                element.textContent = simpleTranslate(element.textContent);
            }
        },
        null
    );
    
    // 添加测试套件：Trie树翻译
    benchmark.addTestSuite(
        'Trie树翻译',
        createMockDOM,
        (context) => {
            // 初始化Trie树（在实际应用中应该只初始化一次）
            const trie = new TranslationTrie();
            
            for (const [key, value] of Object.entries(dictionary)) {
                trie.insert(key, value);
            }
            
            for (const element of context.elements) {
                element.textContent = trie.search(element.textContent) || element.textContent;
            }
        },
        null
    );
    
    // 添加测试套件：DOM操作性能
    benchmark.addTestSuite(
        'DOM操作',
        () => {
            // 创建大量DOM元素
            const elements = [];
            for (let i = 0; i < 100; i++) {
                elements.push({
                    innerHTML: '',
                    textContent: '',
                    setAttribute: function(key, value) { this[key] = value; },
                    addEventListener: function() {},
                    classList: { add: () => {}, remove: () => {} }
                });
            }
            return { elements };
        },
        (context) => {
            for (const element of context.elements) {
                element.setAttribute('data-translated', 'true');
                element.classList.add('translated');
                element.textContent = 'Translated';
            }
        },
        null
    );
    
    return benchmark;
}

/**
 * 运行翻译性能基准测试
 * @param {string} outputPath - 输出路径
 * @returns {Object} 测试结果
 */
async function runTranslationBenchmark(outputPath = null) {
    const benchmark = createTranslationBenchmark();
    const results = await benchmark.runBenchmarks({
        iterations: 1000,
        warmupIterations: 100
    });
    
    if (!outputPath) {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        outputPath = path.join(process.cwd(), 'docs', `performance-benchmark-${timestamp}.md`);
        
        // 确保目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }
    
    benchmark.generateReport(outputPath);
    
    // 比较结果
    if (results['简单翻译'] && results['Trie树翻译']) {
        const comparison = benchmark.compareResults('简单翻译', 'Trie树翻译');
        console.log(`性能比较: Trie树翻译 vs 简单翻译`);
        console.log(`性能改进: ${comparison.improvement}%`);
        console.log(`显著改进: ${comparison.significant ? '是' : '否'}`);
    }
    
    return results;
}

module.exports = {
    PerformanceBenchmark,
    createTranslationBenchmark,
    runTranslationBenchmark
};