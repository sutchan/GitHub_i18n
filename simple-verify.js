const fs = require('fs');
const path = require('path');

/**
 * 简单验证脚本 - 只检查构建产物的基本语法
 * 1. 读取构建产物文件
 * 2. 提取JavaScript代码部分
 * 3. 使用Function构造函数验证语法
 */
function simpleVerify() {
  try {
    const filePath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
    console.log(`🔍 读取文件: ${filePath}`);
    
    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('✅ 文件读取成功');
    
    // 提取文件开头信息
    const lines = fileContent.split('\n');
    console.log('📄 文件前10行预览:');
    lines.slice(0, 10).forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
    
    // 检查UserScript头部
    if (fileContent.includes('// ==UserScript==') && fileContent.includes('// ==/UserScript==')) {
      console.log('✅ UserScript头部存在');
    } else {
      console.error('❌ UserScript头部缺失');
      return false;
    }
    
    // 检查启动脚本调用
    if (fileContent.includes('startScript();')) {
      console.log('✅ 启动脚本调用存在');
    } else {
      console.error('❌ 启动脚本调用缺失');
      return false;
    }
    
    // 检查VERSION常量
    if (fileContent.includes('const VERSION =')) {
      console.log('✅ VERSION常量存在');
    } else {
      console.error('❌ VERSION常量缺失');
      return false;
    }
    
    // 检查VERSION_HISTORY数组
    if (fileContent.includes('const VERSION_HISTORY =')) {
      console.log('✅ VERSION_HISTORY数组存在');
    } else {
      console.error('❌ VERSION_HISTORY数组缺失');
      return false;
    }
    
    // 提取JavaScript代码部分进行语法验证
    let jsCode = fileContent;
    
    // 移除文件开头的注释块
    jsCode = jsCode.replace(/^\/\*[\s\S]*?\*\//, '');
    
    // 移除UserScript头部
    jsCode = jsCode.replace(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/, '');
    
    // 模拟环境并验证语法
    console.log('🔍 验证JavaScript语法...');
    
    try {
      // 使用Function构造函数验证语法，但不执行代码
      new Function(`
        // 模拟必要的环境变量
        const console = { log: () => {}, error: () => {} };
        const document = {};
        const window = {};
        const GM_xmlhttpRequest = () => {};
        const GM_getResourceText = () => '';
        const GM_addStyle = () => {};
        const GM_getValue = () => null;
        const GM_setValue = () => {};
        const startScript = () => {};
        
        // 验证代码语法（不执行）
        ${jsCode.replace(/startScript\(\);/, '// startScript();')}
      `);
      
      console.log('✅ JavaScript语法验证通过！');
    } catch (parseError) {
      console.error('❌ JavaScript语法错误:', parseError.message);
      return false;
    }
    
    console.log('🎉 所有验证通过！构建产物没有语法错误');
    return true;
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    return false;
  }
}

// 运行验证
const result = simpleVerify();
process.exit(result ? 0 : 1);