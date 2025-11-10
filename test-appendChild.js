/**
 * 测试脚本：检查生成的用户脚本中是否存在appendChild语法错误
 */
const fs = require('fs');
const path = require('path');

// 获取构建产物路径
const userScriptPath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');

// 读取文件内容
if (fs.existsSync(userScriptPath)) {
    const content = fs.readFileSync(userScriptPath, 'utf8');
    
    console.log('开始检查appendChild语法问题...');
    console.log(`用户脚本大小: ${(content.length / 1024).toFixed(2)} KB`);
    
    // 检查潜在的语法错误模式
    const patterns = [
        { regex: /appendChild\(.*,.*\)/g, name: 'appendChild调用中包含逗号' },
        { regex: /appendChild\(\s*,\s*\)/g, name: 'appendChild空括号内有逗号' },
        { regex: /appendChild\(\s*\)/g, name: 'appendChild调用缺少参数' },
        { regex: /appendChild\(\s*([^,)]+)\s*,\s*\)/g, name: 'appendChild括号内末尾有逗号' },
        { regex: /appendChild\(\s*([^,]+)\s*,\s*([^)]*)\)/g, name: 'appendChild多个参数' },
    ];
    
    let hasErrors = false;
    
    patterns.forEach(({ regex, name }) => {
        const matches = content.match(regex);
        if (matches) {
            console.error(`❌ 发现 ${matches.length} 处潜在的 ${name} 问题`);
            // 显示前5个匹配作为示例
            matches.slice(0, 5).forEach((match, index) => {
                const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
                console.error(`   示例 ${index + 1}: 第 ${lineNumber} 行 - ${match}`);
            });
            hasErrors = true;
        } else {
            console.log(`✅ 未发现 ${name} 问题`);
        }
    });
    
    // 检查第660行附近的代码（错误报告中提到的行号）
    const lines = content.split('\n');
    const targetLine = 660;
    const contextLines = 5;
    const startLine = Math.max(0, targetLine - contextLines - 1);
    const endLine = Math.min(lines.length - 1, targetLine + contextLines - 1);
    
    console.log(`\n检查第 ${targetLine} 行附近的代码:`);
    for (let i = startLine; i <= endLine; i++) {
        console.log(`第 ${i + 1} 行: ${lines[i]}`);
    }
    
    // 总结
    if (!hasErrors) {
        console.log('\n🎉 恭喜！未发现明显的appendChild语法错误。');
    } else {
        console.log('\n⚠️  警告：发现潜在的语法错误，请进一步检查。');
    }
    
} else {
    console.error('❌ 找不到用户脚本文件:', userScriptPath);
}
