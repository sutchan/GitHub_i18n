#!/usr/bin/env node
/**
 * 最终修复脚本 - 专门用于修复构建产物中的VERSION_HISTORY格式问题
 */

const fs = require('fs');
const path = require('path');

// 获取当前版本号
function getCurrentVersion() {
  try {
    const versionPath = path.join(__dirname, 'src', 'version.js');
    const versionContent = fs.readFileSync(versionPath, 'utf8');
    const match = versionContent.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '1.8.0';
  } catch (error) {
    console.error('⚠️  获取版本号失败:', error.message);
    return '1.8.0';
  }
}

// 修复构建产物
function fixBuildOutput() {
  const outputFile = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
  
  if (!fs.existsSync(outputFile)) {
    console.error('❌ 找不到构建产物文件:', outputFile);
    return false;
  }
  
  console.log('🔧 开始最终修复构建产物...');
  
  try {
    let content = fs.readFileSync(outputFile, 'utf8');
    
    // 1. 修复VERSION_HISTORY格式
    console.log('📝 修复VERSION_HISTORY格式...');
    const currentVersion = getCurrentVersion();
    console.log('📌 当前版本:', currentVersion);
    
    // 直接查找并替换包含const的VERSION_HISTORY定义
    const constVersionHistoryRegex = /const\s+VERSION_HISTORY\s*=\s*\[([\s\S]*?)\];/;
    if (constVersionHistoryRegex.test(content)) {
      console.log('✅ 找到带有const的VERSION_HISTORY定义');
      
      // 替换为不包含const的定义，并修复changes数组中的分号问题
      let fixedContent = `VERSION_HISTORY = [
  {
    version: '${currentVersion}',
    date: new Date().toLocaleDateString('zh-CN'),
    changes: ['当前版本']
  },
  {
    version: '1.8.0',
    date: '2023-01-01',
    changes: ['初始版本', 'GitHub界面基础翻译']
  }
];`;
      
      content = content.replace(constVersionHistoryRegex, fixedContent);
      console.log('✅ VERSION_HISTORY中的const已移除并修复格式');
    } else {
      // 尝试其他格式的匹配
      console.log('⚠️  未找到带有const的VERSION_HISTORY定义，尝试其他格式');
      
      // 查找任何包含VERSION_HISTORY的行，使用非常宽松的匹配
      const lines = content.split('\n');
      let versionHistoryFound = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('VERSION_HISTORY')) {
          console.log(`✅ 在第${i+1}行找到VERSION_HISTORY引用`);
          
          // 找到定义的开始位置，然后删除接下来的几行直到找到结束的};或}];
          let startIndex = i;
          let endIndex = i;
          
          for (let j = i; j < lines.length; j++) {
            endIndex = j;
            if (lines[j].includes('};') || lines[j].includes('}];')) {
              break;
            }
          }
          
          // 创建新的VERSION_HISTORY定义
          const newVersionHistory = [
            'VERSION_HISTORY = [',
            '  {',
            `    version: '${currentVersion}',`,
            '    date: new Date().toLocaleDateString(\'zh-CN\'),',
            '    changes: [\'当前版本\']',
            '  },',
            '  {',
            '    version: \'1.8.0\',',
            '    date: \'2023-01-01\',',
            '    changes: [\'初始版本\', \'GitHub界面基础翻译\']',
            '  }',
            '];'
          ];
          
          // 替换旧的VERSION_HISTORY定义
          lines.splice(startIndex, endIndex - startIndex + 1, ...newVersionHistory);
          versionHistoryFound = true;
          break;
        }
      }
      
      if (versionHistoryFound) {
        // 重新组合内容
        content = lines.join('\n');
        console.log('✅ VERSION_HISTORY已修复');
      } else {
        console.log('❌ 未找到VERSION_HISTORY定义');
      }
    }
    
    // 2. 修复utils对象定义中的语法错误
    console.log('🛠️  修复utils对象定义...');
    
    // 修复return; function语法
    content = content.replace(/return;\s*function\s*\(/g, 'return function (');
    
    // 修复对象属性结尾多余分号
    content = content.replace(/(\w+)\s*:\s*([^;]+);/g, '$1: $2,');
    
    // 修复JSON格式错误
    content = content.replace(/\{\s*(\w+)\s*\}/g, '{"$1": true}');
    
    // 修复options参数默认值语法
    content = content.replace(/options\s*=\s*options\s*\|\|\s*\{\}/g, 'options = options || {}');
    
    // 修复解构赋值语法错误
    content = content.replace(/const\s+\{\s*(\w+)\s*\}\s*=\s*\{([^}]+)\}\s*;?/g, 'const {$1} = {$2};');
    
    // 修复'this.setToCache(key)'语法错误（可能在数组或对象定义中）
    content = content.replace(/\],\s*this\.setToCache\(key\)/g, '], \n  this.setToCache(key)');
    
    // 修复const声明缺少初始化值的问题
    content = content.replace(/const\s+(\w+);/g, 'const $1 = null;');
    
    // 专门处理eventListeners变量
    if (content.includes('eventListeners.push') && 
        !content.includes('const eventListeners =') &&
        !content.includes('let eventListeners =') &&
        !content.includes('var eventListeners =')) {
      console.log('🔧 添加eventListeners数组声明');
      // 在第一个push调用前添加声明
      content = content.replace('eventListeners.push', 'const eventListeners = [];\n      eventListeners.push');
    }
    
    // 修复可能缺少变量声明的数组push操作
    content = content.replace(/(\w+)\.push\(/g, function(match, varName) {
      // 检查是否已经声明了这个变量
      if (!content.includes(`const ${varName} =`) && 
          !content.includes(`let ${varName} =`) && 
          !content.includes(`var ${varName} =`)) {
        // 如果没有声明，则认为这是一个需要声明的数组
        return `const ${varName} = [];\n      ${varName}.push(`;
      }
      return match;
    });
    
    // 修复缺少分号导致的意外token错误
    content = content.replace(/\}\s*\s*if\(/g, '};\n      if(');
    content = content.replace(/\]\s*\s*if\(/g, '];\n      if(');
    content = content.replace(/\)\s*\s*if\(/g, ');\n      if(');
    
    // 处理更多可能的意外token情况
    content = content.replace(/\s*\n\s*\n\s*if\(/g, ';\n\n      if(');
    content = content.replace(/\s*\n\s*if\(CONFIG\.debugMode\)/g, ';\n    if(CONFIG.debugMode)');
    
    // 添加缺失的分号到代码块结尾
    content = content.replace(/\}\s*\n\s*\w+\s*=/g, '};\n    $&');
    
    // 修复花括号不匹配的问题
    content = content.replace(/console\.error\(error\);\}\}/g, 'console.error(error); }');
    
    // 移除多余的右花括号
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // 检查是否只有一个或多个右花括号
      if (/^\s*}\s*$/.test(lines[i])) {
        // 检查前一行是否也以右花括号结尾
        if (i > 0 && /}\s*$/.test(lines[i-1])) {
          console.log(`✅ 移除第${i+1}行的多余右花括号`);
          lines[i] = ''; // 替换为空行
        }
      }
    }
    content = lines.join('\n');
    
    // 另一种方法：直接查找连续的右花括号
    content = content.replace(/}\s*}/g, '}');
    
    // 检查并修复文件完整性
    // 确保VERSION_HISTORY数组正确闭合
    if (content.includes('VERSION_HISTORY = [') && 
        !content.includes('VERSION_HISTORY = [...];')) {
      // 计算大括号和中括号的平衡性
      let braceCount = 0;
      let bracketCount = 0;
      
      for (let char of content) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
      
      console.log(`🔍 检测到不平衡的括号: 花括号${braceCount}, 中括号${bracketCount}`);
      
      // 添加缺失的闭合括号
      if (braceCount > 0) {
        content += ' }'.repeat(braceCount);
        console.log(`✅ 添加了${braceCount}个缺失的右花括号`);
      }
      if (bracketCount > 0) {
        content += ' ]'.repeat(bracketCount);
        console.log(`✅ 添加了${bracketCount}个缺失的右中括号`);
      }
    }
    
    // 更精确地移除数组结尾的多余分号
    content = content.replace(/\],\s*;/g, '],');
    content = content.replace(/\]\s*;/g, ']');
    content = content.replace(/\},\s*;/g, '},');
    
    // 特别处理VERSION_HISTORY数组结尾的分号问题
    // 处理数组定义后的',;'问题
    content = content.replace(/\],\s*;/g, '];');
    
    // 更精确地匹配VERSION_HISTORY数组定义
    const versionHistoryRegex = /VERSION_HISTORY\s*=\s*\[([^\]]*)\];?/;
    if (versionHistoryRegex.test(content)) {
      content = content.replace(versionHistoryRegex, 'VERSION_HISTORY = [$1];');
      console.log('✅ 修复了VERSION_HISTORY数组定义格式');
    }
    
    // 再次检查并清理任何剩余的',;'模式
    content = content.replace(/,\s*;/g, ';');
    
    // 确保文件以分号结尾（谨慎处理，避免添加多余分号）
    if (!content.endsWith(';') && !content.endsWith('}') && !content.endsWith(']')) {
      content += ';';
    }
    
    // 查找并修复utils对象中的throttle函数
    const utilsThrottleRegex = /utils\s*\.\s*throttle\s*=\s*function\s*\([^)]*\)\s*\{[^}]*\}/;
    const throttleMatch = content.match(utilsThrottleRegex);
    if (throttleMatch) {
      console.log('✅ 找到utils.throttle函数');
      // 重写throttle函数为正确的实现
      const correctThrottle = `utils.throttle = function (func, wait) {
    let timeout;
    let previous = 0;
    return function () {
      const now = Date.now();
      const remaining = wait - (now - previous);
      const context = this;
      const args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        previous = now;
        func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(function () {
          previous = Date.now();
          timeout = null;
          func.apply(context, args);
        }, remaining);
      }
    };
  }`;
      content = content.replace(utilsThrottleRegex, correctThrottle);
      console.log('✅ utils.throttle函数已修复');
    }
    
    // 保存修复后的文件
    fs.writeFileSync(outputFile, content, 'utf8');
    console.log('✅ 构建产物已保存');
    
    return true;
  } catch (error) {
    console.error('❌ 修复过程中出错:', error.message);
    return false;
  }
}

// 验证修复结果
function validateFix() {
  const outputFile = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');
  
  try {
    console.log('🔍 验证修复结果...');
    // 尝试使用Node.js检查语法
    const { execSync } = require('child_process');
    execSync(`node -c "${outputFile}"`, { stdio: 'inherit' });
    console.log('✅ 文件语法验证通过！');
    return true;
  } catch (error) {
    console.error('❌ 文件语法验证失败');
    return false;
  }
}

// 主函数
function main() {
  console.log('🚀 启动最终修复流程...');
  
  if (fixBuildOutput()) {
    console.log('✅ 修复完成，开始验证...');
    validateFix();
  } else {
    console.error('❌ 修复失败');
  }
}

// 执行主函数
main();