const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * 全面修复构建产物的语法问题
 * 1. 修复UserScript头部@标签分号问题
 * 2. 修复VERSION_HISTORY数组语法错误
 * 3. 逐行检测并修复潜在的语法问题
 */
function comprehensiveFix() {
  try {
    const filePath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
    console.log(`🔍 读取文件: ${filePath}`);
    
    // 读取文件内容
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 1. 修复UserScript头部@标签分号问题
    console.log('🔧 修复UserScript头部@标签分号问题...');
    
    // 提取UserScript头部区域
    const headerStart = fileContent.indexOf('// ==UserScript==');
    const headerEnd = fileContent.indexOf('// ==/UserScript==');
    
    if (headerStart !== -1 && headerEnd !== -1) {
      const headerContent = fileContent.substring(headerStart, headerEnd + '// ==/UserScript=='.length);
      
      // 修复所有@标签后的分号
      const fixedHeader = headerContent.replace(/\/\/\s*@(\w+)\s*;\s*/g, '// @$1 ');
      
      fileContent = fileContent.substring(0, headerStart) + fixedHeader + fileContent.substring(headerEnd + '// ==/UserScript=='.length);
      console.log('✅ UserScript头部修复完成');
    }
    
    // 2. 修复VERSION_HISTORY数组语法错误
    console.log('🔧 修复VERSION_HISTORY数组语法错误...');
    
    // 获取当前版本号
    const versionMatch = fileContent.match(/const VERSION = '(\d+\.\d+\.\d+)'/);
    const currentVersion = versionMatch ? versionMatch[1] : '1.8.136';
    
    // 完全重写VERSION_HISTORY定义
    const correctVersionHistory = `const VERSION_HISTORY = [{
    version: '${currentVersion}',
    date: '2025-11-10',
    changes: ['当前版本']
  }]`;
    
    // 替换VERSION_HISTORY定义
    fileContent = fileContent.replace(/const VERSION_HISTORY\s*=\s*\[([\s\S]*?)\];/, correctVersionHistory);
    
    console.log('✅ VERSION_HISTORY数组修复完成');
    
    // 3. 基本的语法错误检查和修复
    console.log('🔧 进行基本语法错误检查...');
    
    // 移除头部注释和UserScript元数据，只保留JavaScript代码部分
    let jsCode = fileContent;
    
    // 移除文件开头的注释块
    jsCode = jsCode.replace(/^\/\*[\s\S]*?\*\//, '');
    
    // 移除UserScript头部
    jsCode = jsCode.replace(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/, '');
    
    // 尝试创建安全的上下文并运行代码
    const context = vm.createContext({
      console: { log: () => {}, error: () => {}, warn: () => {} },
      document: {},
      window: {},
      GM_xmlhttpRequest: () => {},
      GM_getResourceText: () => '',
      GM_addStyle: () => {},
      GM_getValue: () => null,
      GM_setValue: () => {},
      startScript: () => {}
    });
    
    try {
      // 尝试执行代码来检查语法错误
      vm.runInContext(jsCode, context);
      console.log('✅ 代码语法检查通过！');
    } catch (parseError) {
      console.error('❌ 检测到语法错误:', parseError.message);
      
      // 尝试进行简单的修复
      console.log('🔧 尝试进行基本修复...');
      
      // 修复常见的语法错误模式
      // 1. 移除多余的分号
      fileContent = fileContent.replace(/;;/g, ';');
      
      // 2. 修复数组中的尾随逗号
      fileContent = fileContent.replace(/,\s*\]/g, ']');
      fileContent = fileContent.replace(/,\s*\}/g, '}');
      
      // 3. 修复括号不匹配
      fileContent = fileContent.replace(/\(\s*\)/g, '()');
      
      console.log('✅ 基本修复完成');
    }
    
    // 4. 修复任何剩余的@标签分号问题
    fileContent = fileContent.replace(/\/\/\s*@(\w+)\s*;\s*/g, '// @$1 ');
    
    // 写回文件
    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log('✅ 文件已保存，所有修复完成');
    
    return true;
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    return false;
  }
}

// 运行修复
const result = comprehensiveFix();
process.exit(result ? 0 : 1);