#!/usr/bin/env node

/**
 * 版本信息统一更新脚本
 * 
 * 功能：
 * 1. 读取源代码中的当前版本号
 * 2. 搜索所有文档文件中的版本信息
 * 3. 将文档中的版本信息更新为当前版本号
 * 4. 生成更新报告
 */

const fs = require('fs');
const path = require('path');

// 项目根目录
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const docsDir = path.join(projectRoot, 'docs');

// 从源代码中读取当前版本号
function getCurrentVersion() {
  try {
    const versionFilePath = path.join(srcDir, 'version.js');
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
    
    // 匹配 VERSION 常量
    const versionMatch = versionFileContent.match(/const VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }
    
    // 如果没有找到，尝试匹配其他可能的格式
    const versionMatch2 = versionFileContent.match(/VERSION\s*[:=]\s*['"`]([^'"`]+)['"`]/);
    if (versionMatch2 && versionMatch2[1]) {
      return versionMatch2[1];
    }
    
    throw new Error('无法在version.js中找到版本号');
  } catch (error) {
    console.error('读取版本号失败:', error.message);
    process.exit(1);
  }
}

// 获取所有文档文件
function getAllDocFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllDocFiles(filePath, fileList);
    } else if (path.extname(file) === '.md') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 更新文件中的版本信息
function updateVersionInFile(filePath, currentVersion) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // 匹配各种可能的版本号格式
    const versionPatterns = [
      /版本[:：]\s*(\d+\.\d+\.\d+)/g,
      /当前版本[:：]\s*(\d+\.\d+\.\d+)/g,
      /版本号[:：]\s*(\d+\.\d+\.\d+)/g,
      /v(\d+\.\d+\.\d+)/g,
      /(\d+\.\d+\.\d+)/g
    ];
    
    // 对每种模式进行替换
    versionPatterns.forEach(pattern => {
      const newContent = content.replace(pattern, (match, version) => {
        // 只替换看起来像版本号的数字
        if (/^\d+\.\d+\.\d+$/.test(version)) {
          updated = true;
          return match.replace(version, currentVersion);
        }
        return match;
      });
      
      if (newContent !== content) {
        content = newContent;
      }
    });
    
    // 如果内容有更新，写回文件
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error.message);
    return false;
  }
}

// 主函数
function main() {
  console.log('开始统一文档版本信息...');
  
  // 获取当前版本号
  const currentVersion = getCurrentVersion();
  console.log(`当前版本号: ${currentVersion}`);
  
  // 获取所有文档文件
  const docFiles = getAllDocFiles(docsDir);
  console.log(`找到 ${docFiles.length} 个文档文件`);
  
  // 更新版本信息
  let updatedCount = 0;
  const updatedFiles = [];
  
  docFiles.forEach(filePath => {
    const relativePath = path.relative(projectRoot, filePath);
    if (updateVersionInFile(filePath, currentVersion)) {
      updatedCount++;
      updatedFiles.push(relativePath);
      console.log(`✓ 已更新: ${relativePath}`);
    }
  });
  
  // 生成更新报告
  console.log('\n=== 版本信息更新完成 ===');
  console.log(`当前版本号: ${currentVersion}`);
  console.log(`已更新文件数: ${updatedCount}`);
  
  if (updatedFiles.length > 0) {
    console.log('\n已更新的文件:');
    updatedFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  }
  
  // 写入更新报告到文档目录
  const reportPath = path.join(docsDir, `版本更新报告_${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.md`);
  const reportContent = `# 版本信息统一更新报告

## 更新时间
${new Date().toLocaleString('zh-CN')}

## 当前版本号
${currentVersion}

## 更新统计
- 总文档文件数: ${docFiles.length}
- 已更新文件数: ${updatedCount}
- 更新比例: ${((updatedCount / docFiles.length) * 100).toFixed(2)}%

## 已更新文件列表
${updatedFiles.map(file => `- ${file}`).join('\n')}

## 注意事项
- 所有文档中的版本号已统一为当前版本号
- 如果某些文件中的版本号未更新，可能是因为格式不符合预期模式
- 请手动检查关键文档以确保版本信息正确
`;
  
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`\n更新报告已保存到: ${path.relative(projectRoot, reportPath)}`);
}

// 运行主函数
main();