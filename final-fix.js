const fs = require('fs');
const path = require('path');

/**
 * 最终修复脚本 - 精确处理所有注释格式和语法问题
 * 1. 修复所有JSDoc注释格式问题
 * 2. 确保VERSION_HISTORY数组定义正确
 * 3. 处理所有可能的语法错误
 */
function finalFix() {
  try {
    const filePath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
    console.log(`🔍 读取文件: ${filePath}`);
    
    // 读取文件内容
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 1. 提取UserScript头部（保持完整）
    console.log('🔧 提取并修复UserScript头部...');
    
    const headerStartIndex = fileContent.indexOf('// ==UserScript==');
    const headerEndIndex = fileContent.indexOf('// ==/UserScript==');
    
    let userScriptHeader = '';
    let restOfContent = fileContent;
    
    if (headerStartIndex !== -1 && headerEndIndex !== -1) {
      userScriptHeader = fileContent.substring(
        headerStartIndex, 
        headerEndIndex + '// ==/UserScript=='.length
      );
      restOfContent = fileContent.substring(0, headerStartIndex) + 
                      fileContent.substring(headerEndIndex + '// ==/UserScript=='.length);
    }
    
    // 2. 清理并重建文件内容
    console.log('🔧 重建文件内容...');
    
    // 获取当前版本号
    const versionMatch = fileContent.match(/const VERSION = '(\d+\.\d+\.\d+)'/);
    const currentVersion = versionMatch ? versionMatch[1] : '1.8.136';
    
    // 创建正确的文件结构
    let newFileContent = `/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

`;
    
    // 添加UserScript头部
    if (userScriptHeader) {
      newFileContent += userScriptHeader + '\n\n';
    }
    
    // 添加启动脚本调用
    newFileContent += `// 启动脚本
startScript();

`;
    
    // 添加版本信息（使用正确的JSDoc格式）
    newFileContent += `/**
 * 当前工具版本号
 * @type {string}
 * @description 这是项目的单一版本源，所有其他版本号引用都应从此处获取
 */
const VERSION = '${currentVersion}';

/**
 * 版本历史记录
 * @type {Array<{version: string, date: string, changes: string[]}>}
 */
const VERSION_HISTORY = [{
  version: '${currentVersion}',
  date: '2025-11-10',
  changes: ['当前版本']
}];

`;
    
    // 3. 修复剩余内容中的注释格式
    console.log('🔧 修复剩余内容中的注释格式...');
    
    // 修复所有的JSDoc注释格式
    let remainingContent = restOfContent;
    
    // 移除文件开头的内容（已经重建了）
    remainingContent = remainingContent.replace(/^[\s\S]*?startScript\(\)[\s\S]*?VERSION_HISTORY\s*=\s*\[[\s\S]*?\];/, '');
    
    // 修复注释中的星号格式问题
    remainingContent = remainingContent.replace(/\/ \*/g, '/**');
    remainingContent = remainingContent.replace(/\/\* \*/g, '/**');
    remainingContent = remainingContent.replace(/ \* /g, ' * ');
    remainingContent = remainingContent.replace(/ \*\//g, ' */');
    
    // 确保所有注释都有正确的格式
    remainingContent = remainingContent.replace(/\/\*([^*]|\*[^/])*\*\//g, (match) => {
      // 处理每一个注释块
      let lines = match.split('\n');
      if (lines.length > 1) {
        // 多行注释，确保每行都有正确的格式
        return '/**\n' + 
               lines.slice(1, -1).map(line => ' * ' + line.trim()).join('\n') + '\n' + 
               ' */';
      }
      return match; // 单行注释保持不变
    });
    
    // 添加剩余内容
    newFileContent += remainingContent;
    
    // 4. 清理和最终修复
    console.log('🔧 最终清理...');
    
    // 移除多余的空行
    newFileContent = newFileContent.replace(/\n{3,}/g, '\n\n');
    
    // 确保分号正确
    newFileContent = newFileContent.replace(/;\s*;/g, ';');
    
    // 修复可能的JSON相关问题
    newFileContent = newFileContent.replace(/JSON\s*(解析失败|错误|异常)/g, '"JSON$1"');
    
    // 修复任何未正确引用的中文字符串（错误消息）
    const errorMessages = ['错误', '失败', '异常', '警告', '提示'];
    errorMessages.forEach(msg => {
      const regex = new RegExp(`([^"\'])([\u4e00-\u9fa5]*${msg}[\u4e00-\u9fa5]*)([^"\'])`, 'g');
      newFileContent = newFileContent.replace(regex, (match, p1, p2, p3) => {
        // 避免在注释中添加引号
        if (p1.includes('//') || p1.includes('/*')) {
          return match;
        }
        return p1 + '"' + p2 + '"' + p3;
      });
    });
    
    // 写回文件
    fs.writeFileSync(filePath, newFileContent, 'utf8');
    console.log('✅ 文件已保存，最终修复完成');
    
    // 验证修复结果
    console.log('🔍 验证修复结果...');
    const fixedContent = fs.readFileSync(filePath, 'utf8');
    
    // 检查注释格式
    const hasInvalidComments = fixedContent.match(/\/ \*|\/\* \*| \* | \*\//);
    if (!hasInvalidComments) {
      console.log('✅ 注释格式验证通过！');
    } else {
      console.warn('⚠️  可能仍存在注释格式问题');
    }
    
    // 检查VERSION_HISTORY格式
    const versionHistoryMatch = fixedContent.match(/const VERSION_HISTORY\s*=\s*\[([\s\S]*?)\];/);
    if (versionHistoryMatch) {
      console.log('✅ VERSION_HISTORY定义验证通过！');
    } else {
      console.warn('⚠️  VERSION_HISTORY定义可能有问题');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    return false;
  }
}

// 运行修复
const result = finalFix();
process.exit(result ? 0 : 1);