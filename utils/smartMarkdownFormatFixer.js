/**
 * 智能Markdown格式自动修复工具
 * 能够正确处理共享片段引用的文档
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
    docsDir: path.resolve(__dirname, '../docs'),
    reportFile: path.resolve(__dirname, '../docs/智能Markdown格式修复报告.md'),
    backupDir: path.resolve(__dirname, '../docs/_backup/smart_markdown_fix')
};

// 确保备份目录存在
if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
}

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

// 备份文档
function backupDocument(filePath) {
    const relativePath = path.relative(config.docsDir, filePath);
    const backupPath = path.join(config.backupDir, relativePath);
    
    // 确保备份目录结构存在
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

// 修复标题格式
function fixTitleFormat(content) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        // 修复标题格式 - 确保标题后有空格
        lines[i] = line.replace(/^(#+)([^\s])/, '$1 $2');
        
        // 移除标题末尾的中文标点符号
        lines[i] = lines[i].replace(/^(#+\s+.*?)[。，；：！？]$/, '$1');
    }
    
    return lines.join('\n');
}

// 修复段落间距
function fixParagraphSpacing(content) {
    const lines = content.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
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
            result.push('');
        }
        
        // 检查是否需要在代码块前后添加空行
        if (nextLine && /^```/.test(nextLine) && line.trim() !== '' && 
            !line.includes('{% include ') && !nextLine.includes('{% include ')) {
            result.push('');
        }
        
        // 检查代码块后是否需要添加空行
        if (line.startsWith('```') && i < lines.length - 2 && 
            lines[i + 1].trim() !== '' && !lines[i + 1].startsWith('```') &&
            !line.includes('{% include ') && !lines[i + 1].includes('{% include ')) {
            result.push('');
        }
    }
    
    return result.join('\n');
}

// 修复列表格式
function fixListFormat(content) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        // 修复无序列表格式
        const unorderedMatch = line.match(/^(\s*)([-*+])(\s*)(.*)$/);
        if (unorderedMatch) {
            const indent = unorderedMatch[1];
            const marker = unorderedMatch[2];
            const text = unorderedMatch[4];
            
            // 确保标记后只有一个空格
            lines[i] = `${indent}${marker} ${text}`;
        }
        
        // 修复有序列表格式
        const orderedMatch = line.match(/^(\s*)(\d+)(\.\s*)(.*)$/);
        if (orderedMatch) {
            const indent = orderedMatch[1];
            const number = orderedMatch[2];
            const text = orderedMatch[4];
            
            // 确保数字后只有一个点和空格
            lines[i] = `${indent}${number}. ${text}`;
        }
    }
    
    return lines.join('\n');
}

// 修复代码块格式
function fixCodeBlocks(content) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过共享片段引用行
        if (line.includes('{% include ') && line.includes(' %}')) {
            continue;
        }
        
        // 检查未闭合的代码块
        if (line.startsWith('```') && !line.includes('```')) {
            // 这里不做处理，因为自动闭合代码块可能会破坏文档结构
            // 只在报告中标记，需要手动修复
        }
    }
    
    return lines.join('\n');
}

// 修复单个文档
function fixDocument(filePath) {
    // 备份原文件
    const backupPath = backupDocument(filePath);
    
    // 读取内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 应用各种修复
    content = fixFileEncoding(content);
    content = fixTitleFormat(content);
    content = fixParagraphSpacing(content);
    content = fixListFormat(content);
    content = fixCodeBlocks(content);
    
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
    let report = '# 智能Markdown格式修复报告\n\n';
    
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
        report += `### ${relativePath}\n\n`;
        
        if (result.success) {
            report += `- 状态：✅ 修复成功\n`;
            report += `- 备份：${path.relative(path.dirname(reportPath), result.backupPath)}\n`;
        } else {
            report += `- 状态：❌ 修复失败\n`;
            if (result.error) {
                report += `- 错误：${result.error}\n`;
            }
        }
        
        report += '\n';
    });
    
    // 写入报告
    fs.writeFileSync(reportPath, report, 'utf8');
    return reportPath;
}

// 主函数
function main() {
    console.log('开始智能Markdown格式修复...');
    
    const documents = getAllDocuments();
    console.log(`找到 ${documents.length} 个文档`);
    
    const results = [];
    
    documents.forEach(doc => {
        try {
            const result = fixDocument(doc);
            results.push(result);
            console.log(`${path.relative(config.docsDir, doc)}: 修复成功`);
        } catch (error) {
            results.push({
                filePath: doc,
                success: false,
                error: error.message
            });
            console.error(`${path.relative(config.docsDir, doc)}: 修复失败 - ${error.message}`);
        }
    });
    
    const reportPath = generateReport(results);
    console.log(`修复完成，报告已保存到: ${reportPath}`);
    
    // 输出统计信息
    const successCount = results.filter(r => r.success).length;
    console.log(`成功修复 ${successCount}/${results.length} 个文档`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    fixDocument,
    getAllDocuments
};