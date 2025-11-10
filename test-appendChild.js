/**
 * 测试脚本：检查生成的用户脚本中是否存在appendChild语法错误
 */
const fs = require('fs');
const path = require('path');

// 定义appendChild语法错误检测函数
function checkAppendChildSyntax() {
    console.log('=== 检查appendChild语法错误 ===');
    
    // 读取生成的用户脚本
    const userScriptPath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
    let content;
    
    try {
        content = fs.readFileSync(userScriptPath, 'utf8');
        console.log(`✅ 成功读取用户脚本: ${userScriptPath}`);
        console.log(`用户脚本大小: ${(content.length / 1024).toFixed(2)} KB`);
    } catch (error) {
        console.error('❌ 读取用户脚本失败:', error.message);
        return false;
    }
    
    // 定义更精确的错误检测模式
    const errorPatterns = [
        // 模式1: appendChild调用中的多余逗号
        { regex: /appendChild\(\s*([^)]+?)\s*,\s*\)/g, name: 'appendChild括号内末尾有逗号' },
        { regex: /appendChild\(\s*([^,]+)\s*,\s*([^)]*)\)/g, name: 'appendChild多个参数' },
        { regex: /appendChild\(\s*\)/g, name: 'appendChild调用缺少参数' },
        { regex: /appendChild\(\s*,\s*\)/g, name: 'appendChild空括号内有逗号' },
        // 新增模式: 检查isNewerVersion函数定义附近
        { regex: /isNewerVersion\s*\([^)]*\)\s*{/g, name: 'isNewerVersion函数定义' },
        // 新增模式: 检查所有DOM操作相关函数
        { regex: /(appendChild|removeChild|insertBefore)\(.*?\)/g, name: 'DOM操作函数调用' }
    ];
    
    // 统计发现的错误
    let errorCount = 0;
    let hasErrors = false;
    
    // 检查每种错误模式
    errorPatterns.forEach(({ regex, name }) => {
        const matches = content.matchAll(regex);
        const matchArray = Array.from(matches);
        
        if (matchArray.length > 0) {
            console.error(`\n❌ 发现 ${matchArray.length} 处潜在的 ${name} 问题`);
            matchArray.slice(0, 3).forEach((match, i) => {
                // 找到匹配内容所在的行号
                const lines = content.split('\n');
                let lineNumber = 0;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(match[0])) {
                        lineNumber = i + 1;
                        // 显示匹配行的前后2行以提供上下文
                        console.error(`  第 ${Math.max(0, i - 1) + 1} 行: ${lines[Math.max(0, i - 1)] || ''}`);
                        console.error(`  第 ${lineNumber} 行: ${lines[i] || ''}`);
                        console.error(`  第 ${Math.min(lines.length - 1, i + 1) + 1} 行: ${lines[Math.min(lines.length - 1, i + 1)] || ''}`);
                        break;
                    }
                }
            });
            errorCount += matchArray.length;
            hasErrors = true;
        } else {
            console.log(`✅ 未发现 ${name} 问题`);
        }
    });
    
    // 特别检查第660行附近的代码
    console.log('\n检查第 660 行附近的代码:');
    const lines = content.split('\n');
    const targetLine = 660;
    const contextLines = 5;
    const startLine = Math.max(0, targetLine - contextLines - 1);
    const endLine = Math.min(lines.length - 1, targetLine + contextLines - 1);
    
    for (let i = startLine; i <= endLine; i++) {
        console.log(`第 ${i + 1} 行: ${lines[i] || ''}`);
        
        // 检查这一行是否包含语法错误的特征
        if (lines[i] && lines[i].includes('appendChild') && lines[i].includes(',')) {
            console.log(`  ⚠️  警告: 第 ${i + 1} 行可能存在逗号问题!`);
        }
        
        if (lines[i] && lines[i].includes('isNewerVersion') && lines[i].includes('{')) {
            console.log(`  发现isNewerVersion函数定义`);
        }
    }
    
    // 特别检查第2129行附近的代码（可能的问题点）
    console.log('\n检查第 2129 行附近的代码:');
    const startLine2129 = Math.max(0, 2124);
    const endLine2129 = Math.min(lines.length - 1, 2134);
    
    for (let i = startLine2129; i <= endLine2129; i++) {
        console.log(`第 ${i + 1} 行: ${lines[i] || ''}`);
        
        // 检查这一行是否包含语法错误的特征
        if (lines[i] && lines[i].includes('appendChild')) {
            console.log(`  ⚠️  警告: 第 ${i + 1} 行包含appendChild调用`);
        }
    }
    
    // 查找可能的语法错误标记
    const suspiciousPatterns = [
        /,\s*\)/g,           // 括号前的逗号
        /\(\s*,/g,           // 括号内开头的逗号
        /appendChild\(.*?\),/g, // appendChild调用后有逗号
        /\}\s*\}\s*\}\s*\}/g // 过多的右括号
    ];
    
    let suspiciousCount = 0;
    suspiciousPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
            console.log(`\n可疑模式 ${index + 1} (${pattern.toString()}): 发现 ${matches.length} 处`);
            suspiciousCount += matches.length;
        }
    });
    
    // 输出检查结果
    console.log('\n=== 检查结果 ===');
    console.log(`发现的错误模式: ${errorCount}`);
    console.log(`发现的可疑模式: ${suspiciousCount}`);
    
    if (!hasErrors && suspiciousCount === 0) {
        console.log('\n🎉 恭喜！未发现明显的appendChild语法错误。');
        return true;
    } else {
        console.log('\n⚠️  警告：发现潜在的语法错误，请进一步检查。');
        return false;
    }
}

// 执行检查
checkAppendChildSyntax();

function main() {
    try {
        if (fs.existsSync(path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js'))) {
            checkAppendChildSyntax();
        } else {
            console.error(`❌ 文件不存在: ${userScriptPath}`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ 程序执行出错:', error.message);
        process.exit(1);
    }
}

// 主函数入口
main();
