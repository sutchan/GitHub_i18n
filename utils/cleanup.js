const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * @function cleanupRedundantFiles
 * @description 清理冗余文件和缓存
 */
function cleanupRedundantFiles() {
    const utilsDir = path.resolve(__dirname);
    console.log(`开始清理目录: ${utilsDir}`);
    
    // 清理临时文件
    const tempFiles = [
        'fix_newlines.js',
        'check_newlines.js',
        'fix_app_newlines.js',
        'detailed_newline_check.js',
        'force_fix_app.js',
        'fix_readme_newlines.js',
        'fix_tailwind_newlines.js'
    ];
    
    // 清理dist目录中的旧构建产物
    const distDir = path.join(utilsDir, 'dist');
    if (fs.existsSync(distDir)) {
        console.log(`\n清理构建产物目录: ${distDir}`);
        const distFiles = fs.readdirSync(distDir);
        distFiles.forEach(file => {
            const filePath = path.join(distDir, file);
            const stats = fs.statSync(filePath);
            const daysOld = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
            
            // 只清理超过7天的旧文件
            if (daysOld > 7) {
                console.log(`删除超过7天的旧文件: ${file} (${daysOld.toFixed(1)}天)`);
                fs.unlinkSync(filePath);
            }
        });
    }
    
    // 清理临时脚本文件
    console.log('\n清理临时脚本文件:');
    let deletedCount = 0;
    tempFiles.forEach(file => {
        const filePath = path.join(utilsDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`删除临时文件: ${file}`);
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    });
    
    if (deletedCount === 0) {
        console.log('没有发现需要删除的临时脚本文件');
    }
    
    // 检查package.json中的引用是否有效
    console.log('\n检查package.json中的引用:');
    const packageJsonPath = path.join(utilsDir, 'package.json');
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageJson.scripts || {};
        let hasInvalidReference = false;
        
        for (const [name, script] of Object.entries(scripts)) {
            // 检查脚本是否引用了不存在的JavaScript文件
            const jsFileMatch = script.match(/node\s+([\w\-_\.\/]+\.js)/i);
            if (jsFileMatch) {
                const jsFilePath = path.join(utilsDir, jsFileMatch[1]);
                if (!fs.existsSync(jsFilePath)) {
                    console.log(`⚠️  警告: 脚本 ${name} 引用了不存在的文件: ${jsFileMatch[1]}`);
                    hasInvalidReference = true;
                }
            }
        }
        
        if (!hasInvalidReference) {
            console.log('✅ package.json中的脚本引用均有效');
        }
    } catch (error) {
        console.error('❌ 读取package.json时出错:', error.message);
    }
    
    // 检查换行符格式
    console.log('\n检查关键文件的换行符格式:');
    const keyFiles = [
        path.join(utilsDir, 'package.json'),
        path.join(utilsDir, 'README.md'),
        path.join(utilsDir, '使用说明.md')
    ];
    
    keyFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasCRLF = /\r\n/.test(content);
            const hasBOM = content.charCodeAt(0) === 0xFEFF;
            
            console.log(`${path.basename(filePath)}:`);
            console.log(`  - 换行符: ${hasCRLF ? 'CRLF ❌' : 'LF ✅'}`);
            console.log(`  - BOM: ${hasBOM ? '存在 ❌' : '不存在 ✅'}`);
        }
    });
    
    console.log('\n清理完成!');
}

// 执行清理
cleanupRedundantFiles();
