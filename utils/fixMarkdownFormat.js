/**
 * Markdown格式自动修复工具
 * 用于自动修复文档中的Markdown格式问题
 */

const fs = require('fs');
const path = require('path');
const { checkDocument, getAllDocuments, generateReport } = require('./checkMarkdownFormat');

// 配置
const config = {
    docsDir: path.resolve(__dirname, '../docs'),
    reportFile: path.resolve(__dirname, '../docs/Markdown格式修复报告.md'),
    backupDir: path.resolve(__dirname, '../docs/_backup/markdown_fix')
};

// 创建备份目录
function ensureBackupDir() {
    if (!fs.existsSync(config.backupDir)) {
        fs.mkdirSync(config.backupDir, { recursive: true });
    }
}

// 备份文件
function backupFile(filePath) {
    ensureBackupDir();
    
    const relativePath = path.relative(config.docsDir, filePath);
    const backupPath = path.join(config.backupDir, relativePath);
    const backupDir = path.dirname(backupPath);
    
    // 创建备份目录结构
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 复制文件
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
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
            let text = match[2];
            
            // 修复标题格式
            if (!text.startsWith(' ')) {
                text = ' ' + text;
            }
            
            // 移除标题末尾标点
            text = text.replace(/([。，；：！？])$/, '');
            
            lines[i] = level + text;
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
                
                // 检查下一行是否已经是空行
                if (nextLine.trim() !== '') {
                    result.push('');
                }
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
                if (nextLine.includes('function') || nextLine.includes('const') || nextLine.includes('let') || nextLine.includes('var')) {
                    lines[i] = '```javascript';
                } else if (nextLine.includes('class ') || nextLine.includes('def ') || nextLine.includes('import ')) {
                    lines[i] = '```python';
                } else if (nextLine.includes('<') && nextLine.includes('>')) {
                    lines[i] = '```html';
                } else if (nextLine.includes('SELECT') || nextLine.includes('FROM') || nextLine.includes('WHERE')) {
                    lines[i] = '```sql';
                } else if (nextLine.includes('{') && nextLine.includes('}') || nextLine.includes('"') || nextLine.includes("'")) {
                    lines[i] = '```json';
                } else if (nextLine.includes('npm') || nextLine.includes('node') || nextLine.includes('require')) {
                    lines[i] = '```bash';
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

// 修复单个文档
function fixDocument(filePath) {
    // 备份原文件
    const backupPath = backupFile(filePath);
    
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
    return { backupPath, fixed: true };
}

// 生成修复报告
function generateFixReport(results) {
    const reportPath = config.reportFile;
    const timestamp = new Date().toLocaleString('zh-CN');
    
    let report = `# Markdown格式修复报告\n\n`;
    report += `## 修复时间\n${timestamp}\n\n`;
    report += `## 修复统计\n`;
    report += `- 总文档数: ${results.total}\n`;
    report += `- 已修复文档数: ${results.fixed}\n`;
    report += `- 无需修复文档数: ${results.skipped}\n`;
    report += `- 修复失败文档数: ${results.failed}\n\n`;
    
    report += `## 修复详情\n\n`;
    
    for (const doc of results.documents) {
        if (doc.fixed) {
            report += `### ${doc.path}\n\n`;
            report += `- 修复状态: 成功\n`;
            report += `- 备份位置: ${doc.backupPath}\n\n`;
        } else if (doc.error) {
            report += `### ${doc.path}\n\n`;
            report += `- 修复状态: 失败\n`;
            report += `- 错误信息: ${doc.error}\n\n`;
        }
    }
    
    report += `## 备份说明\n\n`;
    report += `所有修复前的文件已备份到: ${config.backupDir}\n`;
    report += `如需恢复，请从备份目录复制文件回原位置\n\n`;
    
    report += `## 后续操作\n\n`;
    report += `1. 运行检查工具验证修复结果:\n`;
    report += `\`\`\`bash\n`;
    report += `node utils/checkMarkdownFormat.js\n`;
    report += `\`\`\`\n\n`;
    
    report += `2. 手动修复无法自动处理的问题\n`;
    report += `3. 定期运行格式检查和修复工具\n\n`;
    
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`修复报告已保存到: ${reportPath}`);
}

// 主函数
function main() {
    console.log('开始修复Markdown格式...');
    
    // 获取所有文档
    const documents = getAllDocuments();
    console.log(`找到 ${documents.length} 个文档文件`);
    
    // 修复结果
    const results = {
        total: documents.length,
        fixed: 0,
        skipped: 0,
        failed: 0,
        documents: []
    };
    
    // 修复每个文档
    for (const doc of documents) {
        const relativePath = path.relative(config.docsDir, doc);
        console.log(`处理文档: ${relativePath}`);
        
        try {
            // 检查文档是否有可修复的问题
            const issues = checkDocument(doc);
            const fixableIssues = issues.filter(issue => issue.fixable);
            
            if (fixableIssues.length === 0) {
                console.log(`  无可修复问题，跳过`);
                results.skipped++;
                results.documents.push({
                    path: relativePath,
                    fixed: false,
                    skipped: true
                });
                continue;
            }
            
            // 修复文档
            const fixResult = fixDocument(doc);
            results.fixed++;
            results.documents.push({
                path: relativePath,
                fixed: true,
                backupPath: path.relative(config.docsDir, fixResult.backupPath)
            });
            
            console.log(`  修复完成，备份到: ${fixResult.backupPath}`);
        } catch (error) {
            console.error(`  修复失败: ${error.message}`);
            results.failed++;
            results.documents.push({
                path: relativePath,
                fixed: false,
                error: error.message
            });
        }
    }
    
    // 生成修复报告
    generateFixReport(results);
    
    console.log('Markdown格式修复完成');
    console.log(`已修复 ${results.fixed} 个文档`);
    console.log(`跳过 ${results.skipped} 个文档`);
    console.log(`失败 ${results.failed} 个文档`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    fixDocument,
    fixFileEncoding,
    fixTitleFormat,
    fixParagraphSpacing,
    fixCodeBlock,
    fixTableFormat,
    fixReferenceFormat
};