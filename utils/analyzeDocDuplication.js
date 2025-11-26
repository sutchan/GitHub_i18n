#!/usr/bin/env node

/**
 * 文档内容重复分析脚本
 * 
 * 功能：
 * 1. 扫描所有文档文件
 * 2. 提取每个文档的主要章节和内容
 * 3. 分析文档间的重复内容
 * 4. 生成重复内容报告
 */

const fs = require('fs');
const path = require('path');

// 项目根目录
const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');

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

// 提取文档的主要章节
function extractSections(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const sections = [];
    let currentSection = null;
    let currentContent = [];
    
    lines.forEach(line => {
      // 检测标题行
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // 保存上一个章节
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        
        // 开始新章节
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2].trim(),
          content: ''
        };
        currentContent = [];
      } else {
        // 添加到当前章节内容
        if (line.trim() || currentContent.length > 0) {
          currentContent.push(line);
        }
      }
    });
    
    // 保存最后一个章节
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }
    
    return sections;
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error.message);
    return [];
  }
}

// 计算文本相似度（简单的基于共同词汇的相似度）
function calculateSimilarity(text1, text2) {
  // 简单的文本相似度算法
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// 分析文档重复内容
function analyzeDuplicateContent(docFiles) {
  const documentData = [];
  
  // 提取每个文档的章节
  docFiles.forEach(filePath => {
    const relativePath = path.relative(projectRoot, filePath);
    const sections = extractSections(filePath);
    
    documentData.push({
      path: relativePath,
      sections: sections
    });
  });
  
  // 查找相似章节
  const similarSections = [];
  
  for (let i = 0; i < documentData.length; i++) {
    for (let j = i + 1; j < documentData.length; j++) {
      const doc1 = documentData[i];
      const doc2 = documentData[j];
      
      // 比较每个章节
      doc1.sections.forEach(section1 => {
        doc2.sections.forEach(section2 => {
          // 只比较标题相似的章节
          if (section1.title.toLowerCase() === section2.title.toLowerCase()) {
            const similarity = calculateSimilarity(section1.content, section2.content);
            
            if (similarity > 0.5) { // 相似度阈值
              similarSections.push({
                doc1: doc1.path,
                doc2: doc2.path,
                section: section1.title,
                similarity: similarity
              });
            }
          }
        });
      });
    }
  }
  
  return {
    documents: documentData,
    similarSections: similarSections
  };
}

// 生成重复内容报告
function generateReport(analysisResult) {
  const { documents, similarSections } = analysisResult;
  
  // 统计各文档的章节类型
  const sectionTypes = {};
  
  documents.forEach(doc => {
    doc.sections.forEach(section => {
      const title = section.title.toLowerCase();
      if (!sectionTypes[title]) {
        sectionTypes[title] = [];
      }
      sectionTypes[title].push(doc.path);
    });
  });
  
  // 找出最常见的章节类型
  const commonSections = Object.entries(sectionTypes)
    .filter(([title, docs]) => docs.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  
  // 生成报告
  let report = `# 文档内容重复分析报告\n\n`;
  report += `## 分析时间\n${new Date().toLocaleString('zh-CN')}\n\n`;
  report += `## 文档总数\n${documents.length}\n\n`;
  
  report += `## 常见章节类型\n\n`;
  commonSections.forEach(([title, docs]) => {
    report += `### ${title}\n`;
    report += `出现次数: ${docs.length}\n`;
    report += `文档:\n`;
    docs.forEach(doc => {
      report += `- ${doc}\n`;
    });
    report += '\n';
  });
  
  report += `## 高相似度章节\n\n`;
  similarSections.forEach(item => {
    report += `### ${item.section}\n`;
    report += `- 文档1: ${item.doc1}\n`;
    report += `- 文档2: ${item.doc2}\n`;
    report += `- 相似度: ${(item.similarity * 100).toFixed(2)}%\n\n`;
  });
  
  report += `## 建议\n\n`;
  report += `1. 对于高相似度的章节，考虑合并或引用\n`;
  report += `2. 明确各文档的职责范围，避免内容重复\n`;
  report += `3. 建立统一的文档模板，规范章节结构\n`;
  report += `4. 对于通用内容，创建独立的共享文档\n`;
  
  return report;
}

// 主函数
function main() {
  console.log('开始分析文档内容重复...');
  
  // 获取所有文档文件
  const docFiles = getAllDocFiles(docsDir);
  console.log(`找到 ${docFiles.length} 个文档文件`);
  
  // 分析重复内容
  const analysisResult = analyzeDuplicateContent(docFiles);
  
  // 生成报告
  const report = generateReport(analysisResult);
  
  // 保存报告
  const reportPath = path.join(docsDir, `文档内容重复分析报告_${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.md`);
  fs.writeFileSync(reportPath, report, 'utf8');
  
  console.log(`分析完成，报告已保存到: ${path.relative(projectRoot, reportPath)}`);
  console.log(`发现 ${analysisResult.similarSections.length} 对高相似度章节`);
}

// 运行主函数
main();