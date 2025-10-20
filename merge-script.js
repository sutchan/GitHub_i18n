/**
 * GitHub 中文翻译 - 简单合并脚本
 * 不依赖Node.js，直接在浏览器中运行的合并工具
 * 使用方法：在浏览器控制台中执行此脚本
 */

// 文件加载函数
async function loadFile(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`加载文件失败: ${url}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`❌ ${error.message}`);
        return null;
    }
}

// 合并所有文件
async function mergeAllFiles() {
    console.log('🔄 开始合并源代码文件...');
    
    // 文件列表
    const files = [
        'src/index.js',
        'src/config.js',
        'src/utils.js',
        'src/versionChecker.js',
        'src/dictionaries/index.js',
        'src/dictionaries/codespaces.js',
        'src/dictionaries/explore.js',
        'src/translationCore.js',
        'src/pageMonitor.js',
        'src/tools.js',
        'src/main.js'
    ];
    
    let mergedCode = '';
    let hasHeader = false;
    
    // 加载并合并文件
    for (const file of files) {
        const content = await loadFile(file);
        if (content) {
            // 处理文件内容
            let processedContent = content;
            
            // 保留index.js的头部（UserScript元数据）
            if (file === 'src/index.js') {
                hasHeader = true;
                // 移除import和export语句
                processedContent = content.replace(/import\s+[^;]+;\s*/g, '')
                    .replace(/export\s+default\s+/g, '')
                    .replace(/export\s+\{[^}]+\}\s*;?\s*/g, '');
            } else {
                // 对于其他文件，移除import和export语句
                processedContent = content.replace(/import\s+[^;]+;\s*/g, '')
                    .replace(/export\s+default\s+/g, '')
                    .replace(/export\s+\{[^}]+\}\s*;?\s*/g, '');
            }
            
            mergedCode += `\n\n/* --- ${file} --- */\n`;
            mergedCode += processedContent;
            console.log(`✅ 已合并: ${file}`);
        }
    }
    
    // 如果没有找到UserScript头部，添加一个基本的头部
    if (!hasHeader) {
        const basicHeader = `// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.0.0
// @description  将 GitHub 界面翻译成中文
// @author       Sut
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @match        https://*.githubusercontent.com/*
// @exclude      https://github.com/login*
// @exclude      https://github.com/signup*
// @icon         https://github.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @license      MIT
// ==/UserScript==\n`;
        mergedCode = basicHeader + mergedCode;
    }
    
    // 添加启动代码（如果main.js中没有）
    if (!mergedCode.includes('startScript();')) {
        mergedCode += '\n\n// 启动脚本\nstartScript();';
    }
    
    console.log('🎉 合并完成!');
    console.log(`📝 合并后的代码长度: ${mergedCode.length} 字符`);
    
    // 创建下载链接
    const blob = new Blob([mergedCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GitHub_zh-CN.user.js';
    a.textContent = '下载合并后的用户脚本';
    a.style.cssText = 'padding: 10px 20px; background: #2ea44f; color: white; text-decoration: none; border-radius: 6px;';
    
    // 添加到页面
    document.body.appendChild(a);
    console.log('👇 点击上方按钮下载合并后的用户脚本');
    
    return mergedCode;
}

// 使用说明
function showInstructions() {
    console.log('📝 GitHub 中文翻译 - 简单合并脚本');
    console.log('====================================');
    console.log('使用方法:');
    console.log('1. 确保所有源文件都在正确的位置');
    console.log('2. 执行 mergeAllFiles() 函数开始合并');
    console.log('3. 合并完成后，点击生成的下载按钮');
    console.log('\n注意: 此脚本在浏览器中运行，无需Node.js环境');
}

// 显示说明
showInstructions();