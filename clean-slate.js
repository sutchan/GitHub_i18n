const fs = require('fs');
const path = require('path');

/**
 * 完全重新生成构建产物文件
 * 1. 创建一个干净的文件，包含正确格式的所有必要部分
 * 2. 避免之前的注释和格式化问题
 * 3. 确保所有URL和元数据正确
 */
function createCleanSlate() {
  try {
    const filePath = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
    console.log(`🔍 准备重新生成文件: ${filePath}`);
    
    // 当前版本号
    const currentVersion = '1.8.136';
    
    // 创建完全干净的文件内容
    const cleanContent = `/**
 * GitHub 中文翻译入口文件
 * 包含 UserScript 元数据和所有模块导出
 */

// ==UserScript==
// @name GitHub 中文翻译
// @namespace https://github.com/sutchan/GitHub_i18n
// @version ${currentVersion}
// @description 将 GitHub 界面翻译成中文
// @author Sut
// @match https://github.com/*
// @match https://gist.github.com/*
// @match https://*.githubusercontent.com/*
// @exclude https://github.com/login*
// @exclude https://github.com/signup*
// @icon https://github.com/favicon.ico
// @grant GM_xmlhttpRequest
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_getValue
// @grant GM_setValue
// @resource CSS https://cdn.jsdelivr.net/gh/sutchan/GitHub_i18n@master/style.min.css
// @connect api.github.com
// @connect raw.githubusercontent.com
// @connect cdn.jsdelivr.net
// @run-at document-start
// @license MIT
// @updateURL https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// @downloadURL https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js
// ==/UserScript==

// 启动脚本
startScript();

/**
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
    
    // 写回文件
    fs.writeFileSync(filePath, cleanContent, 'utf8');
    console.log('✅ 干净的构建产物文件已生成');
    
    // 验证生成的文件
    const generatedContent = fs.readFileSync(filePath, 'utf8');
    console.log('🔍 验证生成的文件...');
    
    // 检查关键部分
    if (generatedContent.includes('// ==UserScript==') && 
        generatedContent.includes('// ==/UserScript==') && 
        generatedContent.includes('startScript();') &&
        generatedContent.includes(`const VERSION = '${currentVersion}'`)) {
      console.log('✅ 文件验证通过！所有关键部分都存在');
    } else {
      console.warn('⚠️ 文件验证失败，可能缺少关键部分');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 重新生成文件过程中发生错误:', error.message);
    return false;
  }
}

// 运行重新生成
const result = createCleanSlate();
process.exit(result ? 0 : 1);