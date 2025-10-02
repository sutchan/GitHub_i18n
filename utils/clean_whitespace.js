const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'api_test.html');
let content = fs.readFileSync(filePath, 'utf8');

// 清理尾随空格
const cleanContent = content.split('\n')
    .map(line => line.trimEnd())
    .join('\n');

// 写回文件
fs.writeFileSync(filePath, cleanContent);
console.log('api_test.html中的尾随空格已成功清理！');