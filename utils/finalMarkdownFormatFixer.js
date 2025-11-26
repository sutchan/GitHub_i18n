/**
 * 最终Markdown格式修复工具
 * 专门修复代码块格式和段落间距问题
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
    docsDir: path.resolve(__dirname, '../docs'),
    reportFile: path.resolve(__dirname, '../docs/最终Markdown格式修复报告.md'),
    backupDir: path.resolve(__dirname, '../docs/_backup/final_markdown_fix')
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

// 创建备份目录
function ensureBackupDir() {
    if (!fs.existsSync(config.backupDir)) {
        fs.mkdirSync(config.backupDir, { recursive: true });
    }
}

// 备份文档
function backupDocument(filePath) {
    ensureBackupDir();
    
    const relativePath = path.relative(config.docsDir, filePath);
    const backupPath = path.join(config.backupDir, relativePath);
    
    // 确保备份目录存在
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 复制文件
    fs.copyFileSync(filePath, backupPath);
    
    return backupPath;
}

// 修复文件编码和换行符
function fixFileEncoding(content) {
    // 移除BOM
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    
    // 统一换行符为LF
    content = content.replace(/\r\n/g, '\n');
    
    return content;
}

// 修复代码块格式
function fixCodeBlocks(content) {
    const lines = content.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeBlockLang = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            result.push(line);
            continue;
        }
        
        // 检查代码块标记
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                // 代码块开始
                inCodeBlock = true;
                
                // 检查是否指定了语言
                const lang = line.trim().substring(3);
                if (lang === '') {
                    // 如果没有指定语言，默认使用javascript
                    result.push('```javascript');
                    codeBlockLang = 'javascript';
                } else {
                    result.push(line);
                    codeBlockLang = lang;
                }
            } else {
                // 代码块结束
                inCodeBlock = false;
                result.push(line);
                codeBlockLang = '';
            }
        } else {
            result.push(line);
        }
    }
    
    // 检查是否有未闭合的代码块
    if (inCodeBlock) {
        result.push('```');
    }
    
    return result.join('\n');
}

// 修复段落间距
function fixParagraphSpacing(content) {
    const lines = content.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const prevLine = i > 0 ? result[result.length - 1] : '';
        const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            result.push(line);
            continue;
        }
        
        // 添加当前行
        result.push(line);
        
        // 检查是否需要在标题前添加空行
        if (nextLine && /^#+\s/.test(nextLine) && line.trim() !== '' && 
            !line.includes('{% include ') && !nextLine.includes('{% include ')) {
            // 如果前面不是空行，添加一个空行
            if (prevLine.trim() !== '') {
                result.push('');
            }
        }
    }
    
    // 移除连续的空行
    const finalResult = [];
    for (let i = 0; i < result.length; i++) {
        const line = result[i];
        const nextLine = i < result.length - 1 ? result[i + 1] : '';
        
        finalResult.push(line);
        
        // 如果当前行是空行且下一行也是空行，跳过添加下一行
        if (line.trim() === '' && nextLine.trim() === '') {
            // 跳过下一个空行
            i++;
        }
    }
    
    return finalResult.join('\n');
}

// 修复单个文档
function fixDocument(filePath) {
    // 备份原文件
    const backupPath = backupDocument(filePath);
    
    // 读取内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 应用各种修复
    content = fixFileEncoding(content);
    content = fixCodeBlocks(content);
    content = fixParagraphSpacing(content);
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, content, 'utf8');
    
    return {
        filePath,
        backupPath,
        success: true
    };
}

// 生成修复报告
function generateReport(results) {
    const reportPath = config.reportFile;
    let report = '# 最终Markdown格式修复报告\n\n';
    
    report += `## 修复时间\n\n${new Date().toLocaleString()}\n\n`;
    
    // 统计信息
    const totalDocuments = results.length;
    const successDocuments = results.filter(r => r.success).length;
    const failedDocuments = totalDocuments - successDocuments;
    
    report += `## 统计信息\n\n`;
    report += `- 处理文档数：${totalDocuments}\n`;
    report += `- 修复成功：${successDocuments}\n`;
    report += `- 修复失败：${failedDocuments}\n`;
    report += `- 备份位置：${path.relative(path.dirname(reportPath), config.backupDir)}\n\n`;
    
    // 详细修复列表
    report += `## 修复详情\n\n`;
    
    results.forEach(result => {
        const relativePath = path.relative(config.docsDir, result.filePath);
        const status = result.success ? '✅ 修复成功' : '❌ 修复失败';
        const backupRelative = path.relative(config.docsDir, result.backupPath);
        
        report += `### ${relativePath}\n\n`;
        report += `- 状态：${status}\n`;
        report += `- 备份：${backupRelative}\n\n`;
    });
    
    // 写入报告
    fs.writeFileSync(reportPath, report, 'utf8');
    return reportPath;
}

// 主函数
function main() {
    console.log('开始修复Markdown文档格式...');
    
    // 获取所有文档
    const documents = getAllDocuments();
    console.log(`找到 ${documents.length} 个文档`);
    
    // 修复每个文档
    const results = documents.map(doc => {
        console.log(`修复: ${path.relative(config.docsDir, doc)}`);
        return fixDocument(doc);
    });
    
    // 生成报告
    const reportPath = generateReport(results);
    console.log(`修复完成，报告已保存到: ${reportPath}`);
    
    // 输出统计信息
    const successDocuments = results.filter(r => r.success).length;
    console.log(`成功修复 ${successDocuments}/${documents.length} 个文档`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    fixDocument,
    generateReport,
    getAllDocuments
};