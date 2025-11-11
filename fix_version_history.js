// 专用VERSION_HISTORY格式修复脚本 - 完全重写版本
const fs = require('fs');
const path = require('path');

function fixVersionHistory() {
  const outputFilePath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
  
  try {
    // 读取构建产物
    let content = fs.readFileSync(outputFilePath, 'utf8');
    
    // 获取当前版本号
    const versionMatch = content.match(/const VERSION = '([^']+)'/);
    const currentVersion = versionMatch ? versionMatch[1] : 'unknown';
    
    // 找到VERSION_HISTORY的起始位置（包括注释）
    const typeCommentStart = content.indexOf('/**\n * @type{Array<{version: string, date: string, changes: string[]}>}');
    const versionHistoryStart = content.indexOf('const VERSION_HISTORY =');
    
    // 确定要替换的起始位置
    const startPos = typeCommentStart !== -1 ? typeCommentStart : versionHistoryStart;
    
    if (startPos === -1) {
      throw new Error('未找到VERSION_HISTORY相关定义');
    }
    
    // 找到utils对象的起始位置，这是我们要保留的下一个重要代码
    const utilsStart = content.indexOf('const utils = {');
    
    if (utilsStart === -1) {
      throw new Error('未找到utils对象定义');
    }
    
    // 构建一个全新的、格式绝对正确的VERSION_HISTORY块
    const versionHistoryBlock = `/**
 * 版本历史记录
 * @type{Array<{version: string, date: string, changes: string[]}>
 */
const VERSION_HISTORY = [
  {
    version: '${currentVersion}',
    date: '${new Date().toISOString().split('T')[0]}',
    changes: ['当前版本']
  }
];`;
    
    // 重建文件内容
    const newContent = 
      content.substring(0, startPos) + 
      versionHistoryBlock + 
      '\n\n' + 
      content.substring(utilsStart);
    
    // 保存修复后的文件
    fs.writeFileSync(outputFilePath, newContent, 'utf8');
    console.log('✅ VERSION_HISTORY已完全重写并修复！');
    
  } catch (error) {
    console.error('❌ 修复VERSION_HISTORY时出错:', error);
  }
}

fixVersionHistory();