const fs = require('fs');
const path = require('path');

/**
 * 修复VERSION_HISTORY数组中的语法错误
 * 通过完全重写该部分来确保正确的JavaScript语法
 */
function fixVersionHistory() {
  try {
    const filePath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
    console.log(`🔍 读取文件: ${filePath}`);
    
    // 读取文件内容
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 查找VERSION_HISTORY的起始和结束位置
    const versionHistoryStart = fileContent.indexOf('const VERSION_HISTORY = [');
    
    if (versionHistoryStart === -1) {
      console.log('❌ 未找到VERSION_HISTORY定义');
      return false;
    }
    
    // 查找数组的结束位置
    let braceCount = 0;
    let bracketCount = 1; // 已经找到一个开始的[
    let endPos = versionHistoryStart + 'const VERSION_HISTORY = ['.length;
    
    while (endPos < fileContent.length && bracketCount > 0) {
      const char = fileContent[endPos];
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      endPos++;
    }
    
    // 找到分号结束
    while (endPos < fileContent.length && fileContent[endPos] !== ';') {
      endPos++;
    }
    if (endPos < fileContent.length) endPos++;
    
    console.log(`📌 找到VERSION_HISTORY定义，从 ${versionHistoryStart} 到 ${endPos}`);
    
    // 获取当前版本号
    const versionMatch = fileContent.match(/const VERSION = '(\d+\.\d+\.\d+)'/);
    const currentVersion = versionMatch ? versionMatch[1] : '1.8.136';
    
    // 创建正确的VERSION_HISTORY定义
    const correctVersionHistory = `const VERSION_HISTORY = [{
    version: '${currentVersion}',
    date: '2025-11-10',
    changes: ['当前版本']
  }]`;
    
    console.log(`✅ 创建正确的VERSION_HISTORY定义`);
    
    // 替换文件内容
    const newFileContent = fileContent.substring(0, versionHistoryStart) + 
                           correctVersionHistory + 
                           fileContent.substring(endPos);
    
    // 写回文件
    fs.writeFileSync(filePath, newFileContent, 'utf8');
    console.log('✅ 文件已保存，VERSION_HISTORY已修复');
    
    return true;
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    return false;
  }
}

// 运行修复
const result = fixVersionHistory();
process.exit(result ? 0 : 1);