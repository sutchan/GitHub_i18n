/**
 * 智能Markdown格式检查和修复工具
 * 能够正确处理共享片段引用的文档
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
    docsDir: path.resolve(__dirname, '../docs'),
    reportFile: path.resolve(__dirname, '../docs/智能Markdown格式检查报告.md'),
    formatSpecFile: path.resolve(__dirname, '../docs/_fragments/Markdown格式规范.md')
};

// 问题类型
const IssueType = {
    ENCODING: 'encoding',
    LINE_ENDING: 'line_ending',
    TITLE_FORMAT: 'title_format',
    TITLE_HIERARCHY: 'title_hierarchy',
    PARAGRAPH_SPACING: 'paragraph_spacing',
    LIST_FORMAT: 'list_format',
    CODE_BLOCK: 'code_block',
    TABLE_FORMAT: 'table_format',
    LINK_FORMAT: 'link_format',
    IMAGE_FORMAT: 'image_format',
    REFERENCE_FORMAT: 'reference_format'
};

// 获取所有文档文件
function getAllDocuments() {
    const documents = [];
    
    function scanDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            // 跳过备份目录和片段目录
            if (entry.name === '_backup' || entry.name === '_fragments' || entry.name === '_templates') {
                continue;
            }
            
            if (entry.isDirectory()) {
                scanDirectory(fullPath);
            } else if (entry.isFile() && path.extname(entry.name) === '.md') {
                documents.push(fullPath);
            }
        }
    }
    
    scanDirectory(config.docsDir);
    return documents;
}

// 检查文件编码和换行符
function checkFileEncoding(filePath) {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf8');
    
    const issues = [];
    
    // 检查BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        issues.push({
            type: IssueType.ENCODING,
            message: '文件包含BOM头，应使用UTF-8无BOM格式',
            line: 1,
            fixable: true
        });
    }
    
    // 检查换行符
    const crlfCount = (content.match(/\r\n/g) || []).length;
    const lfCount = (content.match(/(?<!\r)\n/g) || []).length;
    
    if (crlfCount > 0 && lfCount > 0) {
        issues.push({
            type: IssueType.LINE_ENDING,
            message: '文件混合使用CRLF和LF换行符，应统一使用Unix LF',
            line: 1,
            fixable: true
        });
    } else if (crlfCount > 0) {
        issues.push({
            type: IssueType.LINE_ENDING,
            message: '文件使用CRLF换行符，应改为Unix LF',
            line: 1,
            fixable: true
        });
    }
    
    return issues;
}

// 检查标题格式
function checkTitleFormat(content) {
    const issues = [];
    const lines = content.split('\n');
    
    let h1Count = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        const match = line.match(/^(#+)\s*(.*)$/);
        
        if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            
            // 检查标题格式
            if (!/^#\s/.test(line)) {
                issues.push({
                    type: IssueType.TITLE_FORMAT,
                    message: `标题格式不正确，'#'后应有空格`,
                    line: i + 1,
                    fixable: true
                });
            }
            
            // 检查标题末尾标点
            if (/[。，；：！？]$/.test(text)) {
                issues.push({
                    type: IssueType.TITLE_FORMAT,
                    message: '标题末尾不应有标点符号',
                    line: i + 1,
                    fixable: true
                });
            }
            
            // 检查空标题
            if (text === '') {
                issues.push({
                    type: IssueType.TITLE_FORMAT,
                    message: '标题内容不能为空',
                    line: i + 1,
                    fixable: false
                });
            }
            
            // 统计一级标题
            if (level === 1) {
                h1Count++;
            }
        }
    }
    
    // 检查一级标题数量
    if (h1Count === 0) {
        issues.push({
            type: IssueType.TITLE_FORMAT,
            message: '文档缺少一级标题',
            line: 1,
            fixable: false
        });
    } else if (h1Count > 1) {
        issues.push({
            type: IssueType.TITLE_FORMAT,
            message: '文档有多个一级标题',
            line: 1,
            fixable: false
        });
    }
    
    return issues;
}

// 检查标题层级
function checkTitleHierarchy(content) {
    const issues = [];
    const lines = content.split('\n');
    
    let lastLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        const match = line.match(/^(#+)\s/);
        
        if (match) {
            const level = match[1].length;
            
            // 检查标题层级跳跃
            if (lastLevel > 0 && level > lastLevel + 1) {
                issues.push({
                    type: IssueType.TITLE_HIERARCHY,
                    message: `标题层级跳跃，从H${lastLevel}直接跳到H${level}`,
                    line: i + 1,
                    fixable: false
                });
            }
            
            lastLevel = level;
        }
    }
    
    return issues;
}

// 检查段落间距
function checkParagraphSpacing(content) {
    const issues = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}') || 
            nextLine.includes('{% include ') && nextLine.includes(' %}')) {
            continue;
        }
        
        // 检查标题前是否有空行
        if (/^#+\s/.test(nextLine) && line.trim() !== '') {
            issues.push({
                type: IssueType.PARAGRAPH_SPACING,
                message: '标题前应有空行',
                line: i + 2,
                fixable: true
            });
        }
        
        // 检查代码块前后是否有空行
        if (/^```/.test(nextLine) && line.trim() !== '') {
            issues.push({
                type: IssueType.PARAGRAPH_SPACING,
                message: '代码块前应有空行',
                line: i + 2,
                fixable: true
            });
        }
        
        if (/^```/.test(line) && i < lines.length - 2 && lines[i + 1].trim() !== '' && 
            !/^```/.test(lines[i + 1])) {
            issues.push({
                type: IssueType.PARAGRAPH_SPACING,
                message: '代码块后应有空行',
                line: i + 2,
                fixable: true
            });
        }
    }
    
    return issues;
}

// 检查列表格式
function checkListFormat(content) {
    const issues = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        // 检查无序列表格式
        const unorderedMatch = line.match(/^(\s*)([-*+])(\s*)(.*)$/);
        if (unorderedMatch) {
            const indent = unorderedMatch[1];
            const marker = unorderedMatch[2];
            const space = unorderedMatch[3];
            
            if (space.length !== 1) {
                issues.push({
                    type: IssueType.LIST_FORMAT,
                    message: '无序列表标记后应有且仅有一个空格',
                    line: i + 1,
                    fixable: true
                });
            }
        }
        
        // 检查有序列表格式
        const orderedMatch = line.match(/^(\s*)(\d+)(\.\s*)(.*)$/);
        if (orderedMatch) {
            const indent = orderedMatch[1];
            const number = orderedMatch[2];
            const dotSpace = orderedMatch[3];
            
            if (dotSpace.length !== 2) {
                issues.push({
                    type: IssueType.LIST_FORMAT,
                    message: '有序列表数字后应有且仅有一个点和空格',
                    line: i + 1,
                    fixable: true
                });
            }
        }
    }
    
    return issues;
}

// 检查代码块格式
function checkCodeBlocks(content) {
    const issues = [];
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let codeBlockStart = 0;
    let codeBlockLang = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                // 代码块开始
                inCodeBlock = true;
                codeBlockStart = i + 1;
                codeBlockLang = line.substring(3).trim();
                
                // 检查代码块语言标识
                if (codeBlockLang === '') {
                    issues.push({
                        type: IssueType.CODE_BLOCK,
                        message: '代码块应指定语言标识',
                        line: i + 1,
                        fixable: false
                    });
                }
            } else {
                // 代码块结束
                inCodeBlock = false;
            }
        }
    }
    
    // 检查未闭合的代码块
    if (inCodeBlock) {
        issues.push({
            type: IssueType.CODE_BLOCK,
            message: '代码块未闭合',
            line: codeBlockStart,
            fixable: true
        });
    }
    
    return issues;
}

// 检查表格格式
function checkTableFormat(content) {
    const issues = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        // 检查表格行
        if (line.includes('|')) {
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            
            // 检查表格分隔行
            if (/^[\s\|\-:]*$/.test(line)) {
                if (!/^[\s\|\-:]*$/.test(line) || !line.includes('|')) {
                    issues.push({
                        type: IssueType.TABLE_FORMAT,
                        message: '表格分隔行格式不正确',
                        line: i + 1,
                        fixable: true
                    });
                }
            }
        }
    }
    
    return issues;
}

// 检查单个文档
function checkDocument(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 检查编码和换行符
    issues.push(...checkFileEncoding(filePath));
    
    // 检查标题格式
    issues.push(...checkTitleFormat(content));
    
    // 检查标题层级
    issues.push(...checkTitleHierarchy(content));
    
    // 检查段落间距
    issues.push(...checkParagraphSpacing(content));
    
    // 检查列表格式
    issues.push(...checkListFormat(content));
    
    // 检查代码块
    issues.push(...checkCodeBlocks(content));
    
    // 检查表格格式
    issues.push(...checkTableFormat(content));
    
    return issues;
}

// 生成检查报告
function generateReport(results) {
    const reportPath = config.reportFile;
    let report = '# 智能Markdown格式检查报告\n\n';
    
    report += `## 检查时间\n\n${new Date().toLocaleString()}\n\n`;
    
    // 统计信息
    const totalDocuments = results.length;
    const documentsWithIssues = results.filter(r => r.issues.length > 0).length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const fixableIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.fixable).length, 0);
    
    report += `## 统计信息\n\n`;
    report += `- 检查文档数：${totalDocuments}\n`;
    report += `- 有问题的文档：${documentsWithIssues}\n`;
    report += `- 发现问题数：${totalIssues}\n`;
    report += `- 可修复问题数：${fixableIssues}\n\n`;
    
    // 问题类型统计
    const issueTypeCount = {};
    results.forEach(r => {
        r.issues.forEach(issue => {
            issueTypeCount[issue.type] = (issueTypeCount[issue.type] || 0) + 1;
        });
    });
    
    report += `## 问题类型分布\n\n`;
    report += `| 问题类型 | 数量 |\n`;
    report += `|---------|------|\n`;
    
    Object.entries(issueTypeCount).forEach(([type, count]) => {
        const typeName = {
            [IssueType.ENCODING]: '编码问题',
            [IssueType.LINE_ENDING]: '换行符问题',
            [IssueType.TITLE_FORMAT]: '标题格式',
            [IssueType.TITLE_HIERARCHY]: '标题层级',
            [IssueType.PARAGRAPH_SPACING]: '段落间距',
            [IssueType.LIST_FORMAT]: '列表格式',
            [IssueType.CODE_BLOCK]: '代码块格式',
            [IssueType.TABLE_FORMAT]: '表格格式',
            [IssueType.LINK_FORMAT]: '链接格式',
            [IssueType.IMAGE_FORMAT]: '图片格式',
            [IssueType.REFERENCE_FORMAT]: '引用格式'
        }[type] || type;
        
        report += `| ${typeName} | ${count} |\n`;
    });
    
    report += '\n';
    
    // 详细问题列表
    report += `## 详细问题列表\n\n`;
    
    results.forEach(result => {
        if (result.issues.length > 0) {
            const relativePath = path.relative(config.docsDir, result.filePath);
            report += `### ${relativePath}\n\n`;
            
            result.issues.forEach(issue => {
                report += `- **第${issue.line}行** [${issue.type}] ${issue.message}`;
                report += issue.fixable ? ' (可修复)' : ' (需手动修复)';
                report += '\n';
            });
            
            report += '\n';
        }
    });
    
    // 写入报告
    fs.writeFileSync(reportPath, report, 'utf8');
    return reportPath;
}

// 主函数
function main() {
    console.log('开始智能Markdown格式检查...');
    
    const documents = getAllDocuments();
    console.log(`找到 ${documents.length} 个文档`);
    
    const results = [];
    
    documents.forEach(doc => {
        const issues = checkDocument(doc);
        results.push({
            filePath: doc,
            issues
        });
        
        if (issues.length > 0) {
            console.log(`${path.relative(config.docsDir, doc)}: 发现 ${issues.length} 个问题`);
        }
    });
    
    const reportPath = generateReport(results);
    console.log(`检查完成，报告已保存到: ${reportPath}`);
    
    // 输出统计信息
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const fixableIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.fixable).length, 0);
    
    console.log(`总计发现 ${totalIssues} 个问题，其中 ${fixableIssues} 个可自动修复`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    checkDocument,
    getAllDocuments,
    IssueType
};