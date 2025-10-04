// pages_processor.js
// 用于处理 pages.json 文件的去重和重新排序

const fs = require('fs');
const path = require('path');

/**
 * 处理 pages.json 文件：去重并按 URL 排序
 */
function processPagesFile() {
    try {
        // 读取原始文件
        const pagesFilePath = path.join(__dirname, 'api', 'pages.json');
        const rawData = fs.readFileSync(pagesFilePath, 'utf8');
        const pages = JSON.parse(rawData);
        
        console.log(`原始页面数量: ${pages.length}`);
        
        // 使用 Set 去重
        const uniquePages = [];
        const urlSet = new Set();
        
        for (const page of pages) {
            if (!urlSet.has(page.url)) {
                urlSet.add(page.url);
                uniquePages.push(page);
            }
        }
        
        // 按 URL 字母顺序排序
        const sortedPages = uniquePages.sort((a, b) => {
            return a.url.localeCompare(b.url);
        });
        
        console.log(`去重后页面数量: ${sortedPages.length}`);
        console.log(`删除了 ${pages.length - sortedPages.length} 个重复页面`);
        
        // 保存处理后的文件
        const output = JSON.stringify(sortedPages, null, 2);
        fs.writeFileSync(pagesFilePath, output, 'utf8');
        
        console.log('pages.json 文件已成功去重并排序！');
        
    } catch (error) {
        console.error('处理 pages.json 文件时出错:', error.message);
        process.exit(1);
    }
}

// 执行处理函数
processPagesFile();