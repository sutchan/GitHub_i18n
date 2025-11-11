const fs = require('fs');

// 构建产物文件路径
const buildFilePath = 'e:\\Dropbox\\GitHub\\GitHub_i18n\\dist\\GitHub_zh-CN.user.js';

console.log(`正在读取构建产物: ${buildFilePath}`);

// 1. 读取文件内容
let fileContent = fs.readFileSync(buildFilePath, 'utf8');

console.log('正在修复语法错误...');

// 2. 修复可能存在的所有语法错误
// 修复const关键字缺失或重复
fileContent = fileContent.replace(/c*onst VERSION_HISTORY/g, 'const VERSION_HISTORY');
fileContent = fileContent.replace(/cc*onst VERSION_HISTORY/g, 'const VERSION_HISTORY');

// 修复数组后的多余分号
fileContent = fileContent.replace(/changes:\s*\[([^\]]*)\];/g, 'changes: [$1]');

// 修复JSON对象格式
fileContent = fileContent.replace(/\{\s*version:\s*'([^']*)',\s*date:\s*'([^']*)',\s*changes:\s*\[([^\]]*)\]\s*\}/g, '{version: \'$1\', date: \'$2\', changes: [$3]}');

// 3. 保存修复后的文件
fs.writeFileSync(buildFilePath, fileContent, 'utf8');

console.log('构建产物修复完成！');