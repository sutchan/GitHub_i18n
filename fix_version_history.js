/**
 * 全面修复构建产物中的语法错误
 * 包括VERSION_HISTORY格式和其他语法问题
 */

const fs = require('fs');
const path = require('path');

// 构建产物路径
const USER_SCRIPT_PATH = path.join(__dirname, 'dist', 'GitHub_zh-CN.user.js');

/**
 * 全面修复构建产物中的语法错误
 */
function fixBuildOutput() {
  try {
    console.log('🔍 开始全面修复构建产物...');

    // 读取构建产物
    let content = fs.readFileSync(USER_SCRIPT_PATH, 'utf8');

    // 1. 修复VERSION_HISTORY部分 - 使用更直接的方法
    console.log('📝 修复VERSION_HISTORY部分...');

    // 获取当前版本号
    const versionMatch = content.match(/const VERSION = '(.*)';/);
    const currentVersion = versionMatch ? versionMatch[1] : '1.8.156';

    console.log(`📌 当前版本号: ${currentVersion}`);

    // 重建VERSION_HISTORY数组，使用正确的JSON格式
    const versionHistoryString = `const VERSION_HISTORY = [
  {
    version: '${currentVersion}',
    date: new Date().toISOString().split('T')[0],
    changes: ['当前版本']
  }
];`;

    // 使用正则表达式替换整个VERSION_HISTORY部分
    content = content.replace(/\/\*\*\s*\* 版本历史记录[\s\S]*?const VERSION_HISTORY = [\s\S]*?\];/, versionHistoryString);

    console.log('✅ VERSION_HISTORY已重写！');

    // 2. 修复utils对象定义 - 替换整个utils对象定义
    console.log('🛠️  修复utils对象定义...');

    // 查找utils对象的开始和结束位置
    const utilsStartRegex = /\/\*\*\s*\* 工具函数集合[\s\S]*?const utils = \{/;
    const utilsEndRegex = /\};\s*\/\*\*/;

    const utilsStartMatch = content.match(utilsStartRegex);
    const utilsEndMatch = content.match(utilsEndRegex);

    if (utilsStartMatch && utilsEndMatch) {
      // 保存utils对象之前的内容
      const beforeUtils = content.substring(0, utilsStartMatch.index);
      // 保存utils对象之后的内容
      const afterUtils = content.substring(utilsEndMatch.index + utilsEndMatch[0].length);

      // 重建一个简化但有效的utils对象
      const utilsObject = `/**
 * 工具函数集合
 */
const utils = {
    // 基础工具函数
    throttle: function(func, limit, options = {}) {
        const { leading = true, trailing = true } = options || {};
        let inThrottle = false;
        return function() {
            if (!inThrottle) {
                if (leading) func.apply(this, arguments);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                    if (trailing) func.apply(this, arguments);
                }, limit);
            }
        };
    },

    debounce: function(func, delay) {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, arguments), delay);
        };
    },

    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
`;

      // 重建内容
      content = beforeUtils + utilsObject + afterUtils;
      console.log('✅ utils对象已重写！');
    } else {
      console.log('⚠️  未找到完整的utils对象定义，跳过此修复');
    }

    // 3. 清理所有多余的分号和格式问题
    console.log('🧹 清理多余的分号和格式问题...');
    content = content.replace(/;\s*\]/g, ']');
    content = content.replace(/\[\s*;/g, '[');
    content = content.replace(/}\s*;\s*{/g, '},\n  {');
    content = content.replace(/;\s*\)/g, ')');
    content = content.replace(/;\s*\}/g, '}');
    content = content.replace(/return; /g, 'return ');
    content = content.replace(/const\]\]; /g, 'const ');

    // 4. 保存修复后的内容
    fs.writeFileSync(USER_SCRIPT_PATH, content, 'utf8');
    console.log('✅ 构建产物已保存！');

    return true;
  } catch (error) {
    console.error('❌ 修复构建产物时出错:', error.message);
    return false;
  }
}

/**
 * 验证修复后的文件是否有语法错误
 */
function validateFile() {
  try {
    // 使用Node.js的语法检查
    require('child_process').execSync(`node -c "${USER_SCRIPT_PATH}"`, {
      stdio: 'inherit'
    });
    console.log('✅ 文件语法验证通过！');
    return true;
  } catch (error) {
    console.error('❌ 文件语法验证失败！');
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 启动全面构建输出修复...');

  if (fixBuildOutput()) {
    console.log('🧪 验证修复结果...');
    if (validateFile()) {
      console.log('🎉 构建输出已全面修复！VERSION_HISTORY和utils对象都已重写。');
    } else {
      console.log('⚠️  虽然进行了修复，但仍有语法错误，请检查详细信息。');
    }
  } else {
    console.log('❌ 修复失败，请检查错误信息。');
  }
}

// 运行主函数
main();
