/**
 * Markdown格式检查和修复工具
 * 用于检查和修复文档中的Markdown格式问题
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
    docsDir: path.resolve(__dirname, '../docs'),
    reportFile: path.resolve(__dirname, '../docs/Markdown格式检查报告.md'),
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
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];
        
        // 检查段落之间是否有空行
        if (line.trim() !== '' && nextLine && nextLine.trim() !== '') {
            // 如果当前行和下一行都是文本，且不是列表、标题等，则可能缺少空行
            const isTextLine = /^[a-zA-Z\u4e00-\u9fa5]/.test(line);
            const isNextTextLine = /^[a-zA-Z\u4e00-\u9fa5]/.test(nextLine);
            
            if (isTextLine && isNextTextLine && 
                !line.startsWith('#') && !line.startsWith('>') && 
                !line.startsWith('-') && !line.startsWith('*') && 
                !line.match(/^\d+\./) && !line.startsWith('```')) {
                
                issues.push({
                    type: IssueType.PARAGRAPH_SPACING,
                    message: '段落之间应有空行',
                    line: i + 1,
                    fixable: true
                });
            }
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
        
        // 检查无序列表
        const unorderedMatch = line.match(/^(\s*)[-*+]\s*(.*)$/);
        if (unorderedMatch) {
            const indent = unorderedMatch[1];
            const text = unorderedMatch[2];
            
            // 检查列表项后是否有内容
            if (text.trim() === '') {
                issues.push({
                    type: IssueType.LIST_FORMAT,
                    message: '列表项后应有内容',
                    line: i + 1,
                    fixable: false
                });
            }
        }
        
        // 检查有序列表
        const orderedMatch = line.match(/^(\s*)\d+\.\s*(.*)$/);
        if (orderedMatch) {
            const indent = orderedMatch[1];
            const text = orderedMatch[2];
            
            // 检查列表项后是否有内容
            if (text.trim() === '') {
                issues.push({
                    type: IssueType.LIST_FORMAT,
                    message: '列表项后应有内容',
                    line: i + 1,
                    fixable: false
                });
            }
        }
    }
    
    return issues;
}

// 检查代码块
function checkCodeBlock(content) {
    const issues = [];
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let codeBlockStart = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                // 代码块开始
                inCodeBlock = true;
                codeBlockStart = i + 1;
                
                // 检查是否指定了语言
                if (line.trim() === '```') {
                    issues.push({
                        type: IssueType.CODE_BLOCK,
                        message: '代码块应指定语言类型',
                        line: i + 1,
                        fixable: true
                    });
                }
            } else {
                // 代码块结束
                inCodeBlock = false;
                
                // 检查代码块是否为空
                if (i - codeBlockStart <= 0) {
                    issues.push({
                        type: IssueType.CODE_BLOCK,
                        message: '代码块内容不能为空',
                        line: codeBlockStart,
                        fixable: false
                    });
                }
            }
        }
    }
    
    // 检查未闭合的代码块
    if (inCodeBlock) {
        issues.push({
            type: IssueType.CODE_BLOCK,
            message: '代码块未闭合',
            line: codeBlockStart,
            fixable: false
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
        
        // 检查表格行
        if (line.includes('|')) {
            const cells = line.split('|').filter(cell => cell !== '');
            
            // 检查表格行是否以|开头和结尾
            if (!line.startsWith('|') || !line.endsWith('|')) {
                issues.push({
                    type: IssueType.TABLE_FORMAT,
                    message: '表格行应以|开头和结尾',
                    line: i + 1,
                    fixable: true
                });
            }
            
            // 检查分隔行
            if (i > 0 && lines[i - 1].includes('|')) {
                const prevLine = lines[i - 1];
                const prevCells = prevLine.split('|').filter(cell => cell !== '');
                
                // 检查列数是否一致
                if (cells.length !== prevCells.length) {
                    issues.push({
                        type: IssueType.TABLE_FORMAT,
                        message: '表格列数不一致',
                        line: i + 1,
                        fixable: false
                    });
                }
            }
        }
    }
    
    return issues;
}

// 检查链接格式
function checkLinkFormat(content) {
    const issues = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检查Markdown链接格式
        const linkMatches = line.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g);
        for (const match of linkMatches) {
            const text = match[1];
            const url = match[2];
            
            // 检查链接文本
            if (text.trim() === '') {
                issues.push({
                    type: IssueType.LINK_FORMAT,
                    message: '链接文本不能为空',
                    line: i + 1,
                    fixable: false
                });
            }
            
            // 检查链接URL
            if (url.trim() === '') {
                issues.push({
                    type: IssueType.LINK_FORMAT,
                    message: '链接URL不能为空',
                    line: i + 1,
                    fixable: false
                });
            }
        }
    }
    
    return issues;
}

// 检查图片格式
function checkImageFormat(content) {
    const issues = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检查Markdown图片格式
        const imgMatches = line.matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g);
        for (const match of imgMatches) {
            const alt = match[1];
            const url = match[2];
            
            // 检查替代文本
            if (alt.trim() === '') {
                issues.push({
                    type: IssueType.IMAGE_FORMAT,
                    message: '图片替代文本不能为空',
                    line: i + 1,
                    fixable: false
                });
            }
            
            // 检查图片URL
            if (url.trim() === '') {
                issues.push({
                    type: IssueType.IMAGE_FORMAT,
                    message: '图片URL不能为空',
                    line: i + 1,
                    fixable: false
                });
            }
        }
    }
    
    return issues;
}

// 检查引用格式
function checkReferenceFormat(content) {
    const issues = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检查引用格式
        if (line.startsWith('>')) {
            // 检查引用后是否有空格
            if (!line.startsWith('> ') && line !== '>') {
                issues.push({
                    type: IssueType.REFERENCE_FORMAT,
                    message: '引用符号后应有空格',
                    line: i + 1,
                    fixable: true
                });
            }
        }
    }
    
    return issues;
}

// 修复文件编码和换行符
function fixFileEncoding(filePath) {
    const buffer = fs.readFileSync(filePath);
    let content = buffer.toString('utf8');
    
    // 移除BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        content = content.substring(1);
    }
    
    // 统一换行符为LF
    content = content.replace(/\r\n/g, '\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

// 修复标题格式
function fixTitleFormat(content) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(#+)(.*)$/);
        
        if (match) {
            const level = match[1];
            const text = match[2];
            
            // 修复标题格式
            if (!text.startsWith(' ')) {
                lines[i] = level + ' ' + text;
            }
            
            // 移除标题末尾标点
            lines[i] = lines[i].replace(/([。，；：！？])$/, '');
        }
    }
    
    return lines.join('\n');
}

// 修复段落间距
function fixParagraphSpacing(content) {
    const lines = content.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        result.push(line);
        
        const nextLine = lines[i + 1];
        if (nextLine) {
            // 如果当前行和下一行都是文本，且不是列表、标题等，则添加空行
            const isTextLine = /^[a-zA-Z\u4e00-\u9fa5]/.test(line);
            const isNextTextLine = /^[a-zA-Z\u4e00-\u9fa5]/.test(nextLine);
            
            if (isTextLine && isNextTextLine && 
                !line.startsWith('#') && !line.startsWith('>') && 
                !line.startsWith('-') && !line.startsWith('*') && 
                !line.match(/^\d+\./) && !line.startsWith('```')) {
                
                result.push('');
            }
        }
    }
    
    return result.join('\n');
}

// 修复代码块语言
function fixCodeBlock(content) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 修复未指定语言的代码块
        if (line.trim() === '```') {
            // 尝试从下一行推断语言
            const nextLine = lines[i + 1];
            if (nextLine) {
                // 简单的语言推断
                if (nextLine.includes('function') || nextLine.includes('const') || nextLine.includes('let')) {
                    lines[i] = '```javascript';
                } else if (nextLine.includes('class ') || nextLine.includes('def ')) {
                    lines[i] = '```python';
                } else if (nextLine.includes('<') && nextLine.includes('>')) {
                    lines[i] = '```html';
                } else {
                    lines[i] = '```text';
                }
            }
        }
    }
    
    return lines.join('\n');
}

// 修复表格格式
function fixTableFormat(content) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 修复表格行格式
        if (line.includes('|') && (!line.startsWith('|') || !line.endsWith('|'))) {
            lines[i] = '|' + line + '|';
        }
    }
    
    return lines.join('\n');
}

// 修复引用格式
function fixReferenceFormat(content) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 修复引用格式
        if (line.startsWith('>') && !line.startsWith('> ') && line !== '>') {
            lines[i] = '> ' + line.substring(1);
        }
    }
    
    return lines.join('\n');
}

// 检查单个文档
function checkDocument(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 检查文件编码和换行符
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
    issues.push(...checkCodeBlock(content));
    
    // 检查表格格式
    issues.push(...checkTableFormat(content));
    
    // 检查链接格式
    issues.push(...checkLinkFormat(content));
    
    // 检查图片格式
    issues.push(...checkImageFormat(content));
    
    // 检查引用格式
    issues.push(...checkReferenceFormat(content));
    
    return issues;
}

// 修复单个文档
function fixDocument(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复文件编码和换行符
    fixFileEncoding(filePath);
    content = fs.readFileSync(filePath, 'utf8');
    
    // 修复标题格式
    content = fixTitleFormat(content);
    
    // 修复段落间距
    content = fixParagraphSpacing(content);
    
    // 修复代码块语言
    content = fixCodeBlock(content);
    
    // 修复表格格式
    content = fixTableFormat(content);
    
    // 修复引用格式
    content = fixReferenceFormat(content);
    
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

// 生成检查报告
function generateReport(results) {
    const reportPath = config.reportFile;
    const timestamp = new Date().toLocaleString('zh-CN');
    
    let report = `# Markdown格式检查报告\n\n`;
    report += `## 检查时间\n${timestamp}\n\n`;
    report += `## 检查统计\n`;
    report += `- 总文档数: ${results.total}\n`;
    report += `- 有问题文档数: ${results.withIssues}\n`;
    report += `- 无问题文档数: ${results.withoutIssues}\n`;
    report += `- 总问题数: ${results.totalIssues}\n`;
    report += `- 可修复问题数: ${results.fixableIssues}\n\n`;
    
    report += `## 问题类型统计\n\n`;
    
    for (const [type, count] of Object.entries(results.issueTypeCount)) {
        report += `- ${type}: ${count}\n`;
    }
    
    report += `\n## 问题详情\n\n`;
    
    for (const doc of results.documents) {
        if (doc.issues.length > 0) {
            report += `### ${doc.path}\n\n`;
            
            for (const issue of doc.issues) {
                const fixable = issue.fixable ? '可修复' : '需手动修复';
                report += `- **第${issue.line}行**: ${issue.message} (${fixable})\n`;
            }
            
            report += '\n';
        }
    }
    
    report += `## 修复建议\n\n`;
    report += `1. 运行自动修复工具修复可修复的问题\n`;
    report += `2. 手动修复需要人工处理的问题\n`;
    report += `3. 重新运行检查工具验证修复结果\n`;
    report += `4. 定期检查文档格式，确保符合规范\n\n`;
    
    report += `## 工具使用\n\n`;
    report += `### 检查格式\n`;
    report += `\`\`\`bash\n`;
    report += `node utils/checkMarkdownFormat.js\n`;
    report += `\`\`\`\n\n`;
    
    report += `### 自动修复\n`;
    report += `\`\`\`bash\n`;
    report += `node utils/fixMarkdownFormat.js\n`;
    report += `\`\`\`\n\n`;
    
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`检查报告已保存到: ${reportPath}`);
}

// 主函数
function main() {
    console.log('开始检查Markdown格式...');
    
    // 获取所有文档
    const documents = getAllDocuments();
    console.log(`找到 ${documents.length} 个文档文件`);
    
    // 检查结果
    const results = {
        total: documents.length,
        withIssues: 0,
        withoutIssues: 0,
        totalIssues: 0,
        fixableIssues: 0,
        issueTypeCount: {},
        documents: []
    };
    
    // 检查每个文档
    for (const doc of documents) {
        const relativePath = path.relative(config.docsDir, doc);
        console.log(`检查文档: ${relativePath}`);
        
        const issues = checkDocument(doc);
        
        if (issues.length > 0) {
            results.withIssues++;
        } else {
            results.withoutIssues++;
        }
        
        results.totalIssues += issues.length;
        
        for (const issue of issues) {
            results.issueTypeCount[issue.type] = (results.issueTypeCount[issue.type] || 0) + 1;
            if (issue.fixable) {
                results.fixableIssues++;
            }
        }
        
        results.documents.push({
            path: relativePath,
            issues: issues
        });
    }
    
    // 生成报告
    generateReport(results);
    
    console.log('Markdown格式检查完成');
    console.log(`发现问题 ${results.totalIssues} 个，其中可修复 ${results.fixableIssues} 个`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    checkDocument,
    fixDocument,
    getAllDocuments,
    generateReport
};