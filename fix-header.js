const fs = require('fs');
const path = require('path');

// 直接修复构建产物中的用户脚本头部注释块
function fixUserScriptHeader() {
  const outputFile = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
  
  console.log(`🔍 直接读取文件: ${outputFile}`);
  
  // 读取文件内容
  let fileContent = fs.readFileSync(outputFile, 'utf8');
  
  // 显示修复前的前10行，确认问题
  console.log('\n📄 修复前的前10行:');
  const lines = fileContent.split('\n');
  console.log(lines.slice(0, 10).join('\n'));
  
  // 使用最简单直接的正则表达式模式
  console.log('\n🔧 开始修复...');
  
  // 修复@name标签
  fileContent = fileContent.replace('// @name; GitHub 中文翻译', '// @name GitHub 中文翻译');
  // 修复@namespace标签
  fileContent = fileContent.replace('// @namespace; https://github.com/sutchan/GitHub_i18n', '// @namespace https://github.com/sutchan/GitHub_i18n');
  // 修复@version标签
  const versionMatch = fileContent.match(/@version;\s*([\d.]+)/);
  if (versionMatch) {
    fileContent = fileContent.replace(`// @version; ${versionMatch[1]}`, `// @version ${versionMatch[1]}`);
  }
  // 修复@description标签
  fileContent = fileContent.replace('// @description ; 将 GitHub 界面翻译 成中文', '// @description 将 GitHub 界面翻译 成中文');
  // 修复@author标签 - 使用更精确的替换
  fileContent = fileContent.replace(/\/\/\s*@author;\s*Sut/g, '// @author Sut');
  // 修复@match标签 - 使用更广泛的匹配
  fileContent = fileContent.replace(/\/\/\s*@match\s*;\s*/g, '// @match ');
  // 修复@exclude标签
  fileContent = fileContent.replace(/\/\/\s*@exclude\s*;\s*/g, '// @exclude ');
  // 修复@icon标签
  fileContent = fileContent.replace(/\/\/\s*@icon\s*;\s*/g, '// @icon ');
  // 修复@grant标签
  fileContent = fileContent.replace(/\/\/\s*@grant\s*;\s*/g, '// @grant ');
  // 修复@resource标签 - 特别注意这里的分号
  fileContent = fileContent.replace(/\/\/\s*@resource\s*CSS\s*;\s*/g, '// @resource CSS ');
  // 修复@connect标签
  fileContent = fileContent.replace(/\/\/\s*@connect\s*;\s*/g, '// @connect ');
  // 修复@run-at标签
  fileContent = fileContent.replace(/\/\/\s*@run-at\s*;\s*/g, '// @run-at ');
  // 修复@license标签
  fileContent = fileContent.replace(/\/\/\s*@license\s*;\s*/g, '// @license ');
  // 修复@updateURL标签
  fileContent = fileContent.replace(/\/\/\s*@updateURL\s*;\s*/g, '// @updateURL ');
  // 修复@downloadURL标签
  fileContent = fileContent.replace(/\/\/\s*@downloadURL\s*;\s*/g, '// @downloadURL ');
  
  // 最后使用一个通用的正则表达式来捕获任何遗漏的@标签分号
  fileContent = fileContent.replace(/\/\/\s*@(\w+)\s*;\s*/g, '// @$1 ');
  
  // 修复VERSION_HISTORY数组中的语法错误 - 移除数组元素后的分号
  // 使用更精确的替换，确保保留数组内容
  fileContent = fileContent.replace(/changes:\s*\['褰撳墠鐗堟湰'\];/, "changes: ['褰撳墠鐗堟湰']");
  // 检查并修复VERSION_HISTORY数组的闭合
  fileContent = fileContent.replace(/const VERSION_HISTORY = \[\{([^}]*)\}\]/g, "const VERSION_HISTORY = [{ $1 }]");
  
  // 显示修复后的前10行，确认修复效果
  console.log('\n📄 修复后的前10行:');
  const newLines = fileContent.split('\n');
  console.log(newLines.slice(0, 10).join('\n'));
  
  // 写回文件
  fs.writeFileSync(outputFile, fileContent, 'utf8');
  console.log('\n✅ 修复完成！文件已保存。');
}

// 执行修复
fixUserScriptHeader();