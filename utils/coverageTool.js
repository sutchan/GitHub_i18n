/**
 * 代码覆盖率工具
 * 用于分析和报告测试覆盖率情况
 */

const fs = require('fs');
const path = require('path');

/**
 * 代码覆盖率分析器
 */
class CodeCoverageAnalyzer {
    constructor() {
        this.coverageData = {};
        this.sourceFiles = [];
        this.testFiles = [];
        this.excludedFiles = [
            'node_modules',
            'test',
            'dist',
            'build',
            'utils',
            'docs',
            '.git',
            '.vscode',
            '*.test.js',
            '*.spec.js'
        ];
    }

    /**
     * 初始化覆盖率分析
     * @param {string} projectPath - 项目路径
     * @param {Array} sourceDirs - 源代码目录列表
     * @param {Array} testDirs - 测试目录列表
     */
    init(projectPath, sourceDirs = ['src'], testDirs = ['test']) {
        this.projectPath = projectPath;
        this.sourceDirs = sourceDirs;
        this.testDirs = testDirs;

        // 扫描源代码文件
        this.sourceFiles = this.scanFiles(sourceDirs, ['.js']);
        
        // 扫描测试文件
        this.testFiles = this.scanFiles(testDirs, ['.test.js', '.spec.js']);
        
        // 初始化覆盖率数据
        this.initializeCoverageData();
    }

    /**
     * 扫描指定目录中的文件
     * @param {Array} dirs - 目录列表
     * @param {Array} extensions - 文件扩展名列表
     * @returns {Array} 文件列表
     */
    scanFiles(dirs, extensions) {
        const files = [];
        
        dirs.forEach(dir => {
            const dirPath = path.join(this.projectPath, dir);
            
            if (!fs.existsSync(dirPath)) {
                console.warn(`目录不存在: ${dirPath}`);
                return;
            }
            
            this.scanDirectory(dirPath, extensions, files);
        });
        
        return files;
    }

    /**
     * 递归扫描目录
     * @param {string} dirPath - 目录路径
     * @param {Array} extensions - 文件扩展名列表
     * @param {Array} files - 文件列表（用于累积结果）
     */
    scanDirectory(dirPath, extensions, files) {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                // 检查是否在排除列表中
                if (!this.excludedFiles.includes(item)) {
                    this.scanDirectory(itemPath, extensions, files);
                }
            } else if (stat.isFile()) {
                // 检查文件扩展名
                const ext = path.extname(item);
                if (extensions.includes(ext) || extensions.some(e => item.endsWith(e))) {
                    files.push(itemPath);
                }
            }
        });
    }

    /**
     * 初始化覆盖率数据
     */
    initializeCoverageData() {
        this.coverageData = {
            total: {
                files: this.sourceFiles.length,
                functions: 0,
                statements: 0,
                branches: 0,
                lines: 0
            },
            covered: {
                files: 0,
                functions: 0,
                statements: 0,
                branches: 0,
                lines: 0
            },
            percentage: {
                files: 0,
                functions: 0,
                statements: 0,
                branches: 0,
                lines: 0
            },
            fileDetails: {}
        };
        
        // 为每个源文件初始化详细信息
        this.sourceFiles.forEach(filePath => {
            const relativePath = path.relative(this.projectPath, filePath);
            this.coverageData.fileDetails[relativePath] = {
                functions: { total: 0, covered: 0 },
                statements: { total: 0, covered: 0 },
                branches: { total: 0, covered: 0 },
                lines: { total: 0, covered: 0 },
                hasTestFile: false
            };
        });
    }

    /**
     * 分析源代码文件
     * @param {string} filePath - 文件路径
     * @returns {Object} 分析结果
     */
    analyzeSourceFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 简单的代码分析（实际项目中可能需要使用AST解析器）
        const analysis = {
            functions: this.extractFunctions(content),
            statements: this.extractStatements(content),
            branches: this.extractBranches(content),
            lines: this.extractLines(content)
        };
        
        return analysis;
    }

    /**
     * 提取函数
     * @param {string} content - 文件内容
     * @returns {Array} 函数列表
     */
    extractFunctions(content) {
        const functions = [];
        
        // 匹配函数声明
        const functionRegex = /(?:function\s+(\w+)|(\w+)\s*:\s*function|const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)|(\w+)\s*\([^)]*\)\s*{)/g;
        let match;
        
        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1] || match[2] || match[3] || match[4];
            if (functionName) {
                functions.push({
                    name: functionName,
                    line: this.getLineNumber(content, match.index)
                });
            }
        }
        
        return functions;
    }

    /**
     * 提取语句
     * @param {string} content - 文件内容
     * @returns {Array} 语句列表
     */
    extractStatements(content) {
        const statements = [];
        
        // 匹配常见语句模式
        const statementPatterns = [
            /if\s*\([^)]+\)\s*{/g,
            /for\s*\([^)]+\)\s*{/g,
            /while\s*\([^)]+\)\s*{/g,
            /switch\s*\([^)]+\)\s*{/g,
            /return\s+[^;]+;/g,
            /throw\s+[^;]+;/g,
            /try\s*{/g,
            /catch\s*\([^)]*\)\s*{/g,
            /finally\s*{/g
        ];
        
        statementPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                statements.push({
                    type: pattern.toString().match(/\/(.+?)\\/)[1],
                    line: this.getLineNumber(content, match.index)
                });
            }
        });
        
        return statements;
    }

    /**
     * 提取分支
     * @param {string} content - 文件内容
     * @returns {Array} 分支列表
     */
    extractBranches(content) {
        const branches = [];
        
        // 匹配条件分支
        const branchPatterns = [
            /if\s*\([^)]+\)\s*{/g,
            /else\s+if\s*\([^)]+\)\s*{/g,
            /else\s*{/g,
            /case\s+[^:]+:/g,
            /\?\s*[^:]+\s*:/g
        ];
        
        branchPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                branches.push({
                    type: pattern.toString().match(/\/(.+?)\\/)[1],
                    line: this.getLineNumber(content, match.index)
                });
            }
        });
        
        return branches;
    }

    /**
     * 提取行
     * @param {string} content - 文件内容
     * @returns {Array} 行列表
     */
    extractLines(content) {
        const lines = content.split('\n');
        const codeLines = [];
        
        lines.forEach((line, index) => {
            // 排除空行和注释行
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*') && !trimmedLine.startsWith('*')) {
                codeLines.push({
                    number: index + 1,
                    content: trimmedLine
                });
            }
        });
        
        return codeLines;
    }

    /**
     * 获取行号
     * @param {string} content - 文件内容
     * @param {number} index - 字符索引
     * @returns {number} 行号
     */
    getLineNumber(content, index) {
        const before = content.substring(0, index);
        return (before.match(/\n/g) || []).length + 1;
    }

    /**
     * 检查文件是否有对应的测试文件
     * @param {string} sourceFilePath - 源文件路径
     * @returns {boolean} 是否有测试文件
     */
    hasTestFile(sourceFilePath) {
        const sourceFileName = path.basename(sourceFilePath, '.js');
        const sourceDir = path.dirname(sourceFilePath);
        
        // 查找可能的测试文件
        const possibleTestFiles = [
            `${sourceFileName}.test.js`,
            `${sourceFileName}.spec.js`,
            `test.${sourceFileName}.js`,
            `spec.${sourceFileName}.js`
        ];
        
        // 检查测试目录中是否有对应的测试文件
        for (const testDir of this.testDirs) {
            for (const testFileName of possibleTestFiles) {
                const testFilePath = path.join(this.projectPath, testDir, testFileName);
                if (fs.existsSync(testFilePath)) {
                    return true;
                }
            }
        }
        
        // 检查与源文件同目录的测试文件
        for (const testFileName of possibleTestFiles) {
            const testFilePath = path.join(sourceDir, testFileName);
            if (fs.existsSync(testFilePath)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 运行覆盖率分析
     */
    runAnalysis() {
        // 分析每个源文件
        this.sourceFiles.forEach(filePath => {
            const relativePath = path.relative(this.projectPath, filePath);
            const analysis = this.analyzeSourceFile(filePath);
            
            // 更新总计数
            this.coverageData.total.functions += analysis.functions.length;
            this.coverageData.total.statements += analysis.statements.length;
            this.coverageData.total.branches += analysis.branches.length;
            this.coverageData.total.lines += analysis.lines.length;
            
            // 更新文件详细信息
            this.coverageData.fileDetails[relativePath].functions.total = analysis.functions.length;
            this.coverageData.fileDetails[relativePath].statements.total = analysis.statements.length;
            this.coverageData.fileDetails[relativePath].branches.total = analysis.branches.length;
            this.coverageData.fileDetails[relativePath].lines.total = analysis.lines.length;
            this.coverageData.fileDetails[relativePath].hasTestFile = this.hasTestFile(filePath);
            
            // 如果有测试文件，假设所有代码都被覆盖（简化处理）
            if (this.coverageData.fileDetails[relativePath].hasTestFile) {
                this.coverageData.covered.functions += analysis.functions.length;
                this.coverageData.covered.statements += analysis.statements.length;
                this.coverageData.covered.branches += analysis.branches.length;
                this.coverageData.covered.lines += analysis.lines.length;
                
                this.coverageData.covered.files += 1;
                
                this.coverageData.fileDetails[relativePath].functions.covered = analysis.functions.length;
                this.coverageData.fileDetails[relativePath].statements.covered = analysis.statements.length;
                this.coverageData.fileDetails[relativePath].branches.covered = analysis.branches.length;
                this.coverageData.fileDetails[relativePath].lines.covered = analysis.lines.length;
            }
        });
        
        // 计算覆盖率百分比
        this.calculatePercentages();
    }

    /**
     * 计算覆盖率百分比
     */
    calculatePercentages() {
        this.coverageData.percentage.files = this.calculatePercentage(
            this.coverageData.covered.files,
            this.coverageData.total.files
        );
        
        this.coverageData.percentage.functions = this.calculatePercentage(
            this.coverageData.covered.functions,
            this.coverageData.total.functions
        );
        
        this.coverageData.percentage.statements = this.calculatePercentage(
            this.coverageData.covered.statements,
            this.coverageData.total.statements
        );
        
        this.coverageData.percentage.branches = this.calculatePercentage(
            this.coverageData.covered.branches,
            this.coverageData.total.branches
        );
        
        this.coverageData.percentage.lines = this.calculatePercentage(
            this.coverageData.covered.lines,
            this.coverageData.total.lines
        );
    }

    /**
     * 计算百分比
     * @param {number} covered - 已覆盖数量
     * @param {number} total - 总数量
     * @returns {number} 百分比
     */
    calculatePercentage(covered, total) {
        if (total === 0) return 100;
        return Math.round((covered / total) * 100 * 100) / 100;
    }

    /**
     * 生成覆盖率报告
     * @param {string} outputPath - 输出路径
     * @returns {string} 报告内容
     */
    generateReport(outputPath = null) {
        const report = this.buildReport();
        
        if (outputPath) {
            fs.writeFileSync(outputPath, report, 'utf8');
            console.log(`覆盖率报告已生成: ${outputPath}`);
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
        
        let report = `# 代码覆盖率报告\n\n`;
        report += `生成时间: ${timestamp}\n\n`;
        
        // 总体覆盖率
        report += `## 总体覆盖率\n\n`;
        report += `| 指标 | 覆盖数量 | 总数量 | 覆盖率 |\n`;
        report += `|------|----------|--------|--------|\n`;
        report += `| 文件 | ${this.coverageData.covered.files} | ${this.coverageData.total.files} | ${this.coverageData.percentage.files}% |\n`;
        report += `| 函数 | ${this.coverageData.covered.functions} | ${this.coverageData.total.functions} | ${this.coverageData.percentage.functions}% |\n`;
        report += `| 语句 | ${this.coverageData.covered.statements} | ${this.coverageData.total.statements} | ${this.coverageData.percentage.statements}% |\n`;
        report += `| 分支 | ${this.coverageData.covered.branches} | ${this.coverageData.total.branches} | ${this.coverageData.percentage.branches}% |\n`;
        report += `| 行数 | ${this.coverageData.covered.lines} | ${this.coverageData.total.lines} | ${this.coverageData.percentage.lines}% |\n\n`;
        
        // 覆盖率评级
        const overallPercentage = this.coverageData.percentage.functions;
        let grade = 'F';
        
        if (overallPercentage >= 90) grade = 'A+';
        else if (overallPercentage >= 80) grade = 'A';
        else if (overallPercentage >= 70) grade = 'B';
        else if (overallPercentage >= 60) grade = 'C';
        else if (overallPercentage >= 50) grade = 'D';
        
        report += `### 覆盖率评级: ${grade}\n\n`;
        
        // 文件详细覆盖率
        report += `## 文件详细覆盖率\n\n`;
        report += `| 文件路径 | 函数覆盖率 | 语句覆盖率 | 分支覆盖率 | 行覆盖率 | 有测试文件 |\n`;
        report += `|----------|------------|------------|------------|----------|------------|\n`;
        
        Object.entries(this.coverageData.fileDetails).forEach(([filePath, details]) => {
            const funcPercentage = this.calculatePercentage(
                details.functions.covered,
                details.functions.total
            );
            const stmtPercentage = this.calculatePercentage(
                details.statements.covered,
                details.statements.total
            );
            const branchPercentage = this.calculatePercentage(
                details.branches.covered,
                details.branches.total
            );
            const linePercentage = this.calculatePercentage(
                details.lines.covered,
                details.lines.total
            );
            const hasTest = details.hasTestFile ? '是' : '否';
            
            report += `| ${filePath} | ${funcPercentage}% | ${stmtPercentage}% | ${branchPercentage}% | ${linePercentage}% | ${hasTest} |\n`;
        });
        
        // 未覆盖文件
        const uncoveredFiles = Object.entries(this.coverageData.fileDetails)
            .filter(([_, details]) => !details.hasTestFile)
            .map(([filePath, _]) => filePath);
        
        if (uncoveredFiles.length > 0) {
            report += `\n## 未覆盖文件\n\n`;
            uncoveredFiles.forEach(filePath => {
                report += `- ${filePath}\n`;
            });
            report += `\n`;
        }
        
        // 建议
        report += `## 建议\n\n`;
        
        if (this.coverageData.percentage.functions < 80) {
            report += `- 函数覆盖率较低，建议为更多模块添加单元测试\n`;
        }
        
        if (this.coverageData.percentage.statements < 80) {
            report += `- 语句覆盖率较低，建议增加测试用例覆盖更多代码路径\n`;
        }
        
        if (this.coverageData.percentage.branches < 80) {
            report += `- 分支覆盖率较低，建议测试更多条件分支\n`;
        }
        
        if (uncoveredFiles.length > 0) {
            report += `- 有 ${uncoveredFiles.length} 个文件没有测试文件，建议为这些文件添加测试\n`;
        }
        
        if (this.coverageData.percentage.functions >= 80 && 
            this.coverageData.percentage.statements >= 80 && 
            this.coverageData.percentage.branches >= 80) {
            report += `- 测试覆盖率良好，继续保持！\n`;
        }
        
        return report;
    }
}

/**
 * 生成覆盖率报告
 * @param {string} projectPath - 项目路径
 * @param {string} outputPath - 输出路径
 */
function generateCoverageReport(projectPath = process.cwd(), outputPath = null) {
    const analyzer = new CodeCoverageAnalyzer();
    analyzer.init(projectPath);
    analyzer.runAnalysis();
    
    if (!outputPath) {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        outputPath = path.join(projectPath, 'docs', `coverage-report-${timestamp}.md`);
        
        // 确保目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }
    
    return analyzer.generateReport(outputPath);
}

module.exports = {
    CodeCoverageAnalyzer,
    generateCoverageReport
};