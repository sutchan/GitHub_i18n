/**
 * 文档重构工具
 * 用于自动处理文档中的重复内容，应用内容片段引用
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
    docsDir: path.resolve(__dirname, '../docs'),
    fragmentsDir: path.resolve(__dirname, '../docs/_fragments'),
    templatesDir: path.resolve(__dirname, '../docs/_templates'),
    outputDir: path.resolve(__dirname, '../docs'),
    backupDir: path.resolve(__dirname, '../docs/_backup'),
    reportFile: path.resolve(__dirname, '../docs/文档重构报告.md')
};

// 确保目录存在
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 备份原始文档
function backupDocuments() {
    console.log('备份原始文档...');
    ensureDirectoryExists(config.backupDir);
    
    const docsDir = config.docsDir;
    const backupDir = config.backupDir;
    
    // 复制整个docs目录到备份目录
    copyDirectory(docsDir, backupDir);
    
    console.log('备份完成');
}

// 复制目录
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // 跳过备份目录本身
        if (entry.name === '_backup') {
            continue;
        }
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
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

// 检查文档是否包含版本信息
function hasVersionSection(content) {
    return /##\s*版本信息\s*$/im.test(content);
}

// 检查文档是否包含项目基本信息
function hasProjectInfoSection(content) {
    return /##\s*项目信息\s*$/im.test(content) || 
           /##\s*项目概述\s*$/im.test(content) ||
           /##\s*项目名称\s*$/im.test(content);
}

// 检查文档是否包含技术栈信息
function hasTechStackSection(content) {
    return /##\s*技术栈\s*$/im.test(content) || 
           /##\s*核心技术栈\s*$/im.test(content) ||
           /##\s*技术架构\s*$/im.test(content);
}

// 替换版本信息为引用
function replaceVersionInfo(content) {
    // 查找版本信息部分
    const versionRegex = /##\s*版本信息\s*\n[\s\S]*?(?=\n##|\n#|$)/im;
    const replacement = '## 版本信息\n\n{% include "_fragments/版本信息.md" %}';
    
    return content.replace(versionRegex, replacement);
}

// 替换项目基本信息为引用
function replaceProjectInfo(content) {
    // 查找项目信息部分
    const projectInfoRegex = /##\s*(项目信息|项目概述|项目名称)\s*\n[\s\S]*?(?=\n##|\n#|$)/im;
    const replacement = '## 项目信息\n\n{% include "_fragments/项目基本信息.md" %}';
    
    return content.replace(projectInfoRegex, replacement);
}

// 替换技术栈信息为引用
function replaceTechStackInfo(content) {
    // 查找技术栈信息部分
    const techStackRegex = /##\s*(技术栈|核心技术栈|技术架构)\s*\n[\s\S]*?(?=\n##|\n#|$)/im;
    const replacement = '## 技术栈信息\n\n{% include "_fragments/技术栈信息.md" %}';
    
    return content.replace(techStackRegex, replacement);
}

// 重构文档
function refactorDocument(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // 处理版本信息
    if (hasVersionSection(content)) {
        newContent = replaceVersionInfo(newContent);
        modified = true;
    }
    
    // 处理项目信息
    if (hasProjectInfoSection(content)) {
        newContent = replaceProjectInfo(newContent);
        modified = true;
    }
    
    // 处理技术栈信息
    if (hasTechStackSection(content)) {
        newContent = replaceTechStackInfo(newContent);
        modified = true;
    }
    
    // 如果文档没有版本信息，添加版本信息引用
    if (!hasVersionSection(content) && !hasVersionSection(newContent)) {
        newContent += '\n\n---\n\n## 版本信息\n\n{% include "_fragments/版本信息.md" %}\n';
        modified = true;
    }
    
    // 如果文档有修改，写回文件
    if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        return true;
    }
    
    return false;
}

// 计算相对路径
function getRelativePath(from, to) {
    const fromDir = path.dirname(from);
    return path.relative(fromDir, to).replace(/\\/g, '/');
}

// 生成重构报告
function generateReport(results) {
    const reportPath = config.reportFile;
    const timestamp = new Date().toLocaleString('zh-CN');
    
    let report = `# 文档重构报告\n\n`;
    report += `## 重构时间\n${timestamp}\n\n`;
    report += `## 处理统计\n`;
    report += `- 总文档数: ${results.total}\n`;
    report += `- 已重构文档数: ${results.refactored}\n`;
    report += `- 未修改文档数: ${results.unchanged}\n`;
    report += `- 重构比例: ${((results.refactored / results.total) * 100).toFixed(2)}%\n\n`;
    
    report += `## 重构详情\n\n`;
    report += `### 已重构文档\n\n`;
    
    for (const doc of results.refactoredDocs) {
        report += `- ${doc}\n`;
    }
    
    report += `\n### 未修改文档\n\n`;
    
    for (const doc of results.unchangedDocs) {
        report += `- ${doc}\n`;
    }
    
    report += `\n## 注意事项\n\n`;
    report += `1. 所有原始文档已备份到 \`_backup\` 目录\n`;
    report += `2. 请检查重构后的文档，确保内容正确\n`;
    report += `3. 如有问题，可以从备份目录恢复原始文档\n`;
    report += `4. 内容片段引用可能需要根据文档构建系统调整\n`;
    
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`重构报告已保存到: ${reportPath}`);
}

// 主函数
function main() {
    console.log('开始文档重构...');
    
    // 备份原始文档
    backupDocuments();
    
    // 获取所有文档
    const documents = getAllDocuments();
    console.log(`找到 ${documents.length} 个文档文件`);
    
    // 重构结果
    const results = {
        total: documents.length,
        refactored: 0,
        unchanged: 0,
        refactoredDocs: [],
        unchangedDocs: []
    };
    
    // 重构每个文档
    for (const doc of documents) {
        const relativePath = path.relative(config.docsDir, doc);
        console.log(`处理文档: ${relativePath}`);
        
        if (refactorDocument(doc)) {
            results.refactored++;
            results.refactoredDocs.push(relativePath);
        } else {
            results.unchanged++;
            results.unchangedDocs.push(relativePath);
        }
    }
    
    // 生成报告
    generateReport(results);
    
    console.log('文档重构完成');
    console.log(`已重构 ${results.refactored} 个文档`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    backupDocuments,
    getAllDocuments,
    refactorDocument,
    generateReport
};