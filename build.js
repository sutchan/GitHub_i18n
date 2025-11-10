/**
 * GitHub 中文翻译 - 构建脚本
 * @version 1.8.93
 * @description 自动化构建、版本管理和清理工具
 * @author Sut (https://github.com/sutchan)
 */

const fs = require('fs');
const path = require('path');

class BuildManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, 'dist');
    this.srcDir = path.join(this.projectRoot, 'src');
    // 将输出文件直接设置到dist目录，避免根目录冗余
    this.outputFile = path.join(this.buildDir, 'GitHub_zh-CN.user.js');
    this.srcFiles = {
      indexJs: path.join(this.srcDir, 'index.js'),
      configJs: path.join(this.srcDir, 'config.js'),
      versionJs: path.join(this.srcDir, 'version.js'),
      mainScript: this.outputFile,
      apiDir: path.join(this.projectRoot, 'api')
    };
    this.currentVersion = null; // 将在readCurrentVersion中初始化
    // 初始化版本号
    this.readCurrentVersion();
  }

  /**
   * 读取当前版本号 - 从单一版本源（version.js）读取
   * @returns {string} 当前版本号
   */
  readCurrentVersion() {
    try {
      // 直接从version.js读取版本号作为单一版本源
      const versionContent = fs.readFileSync(this.srcFiles.versionJs, 'utf8');
      const match = versionContent.match(/VERSION\s*=\s*['"](.+)['"]/);
      if (match && match[1]) {
        this.currentVersion = match[1];
        return match[1];
      }

      // 降级方案：尝试从其他文件读取版本号
      console.warn('无法从version.js读取版本号，尝试从其他文件读取...');

      // 从index.js读取版本号（包含UserScript元数据）
      const indexContent = fs.readFileSync(this.srcFiles.indexJs, 'utf8');
      const indexMatch = indexContent.match(/@version\s+([\d.]+)/);
      if (indexMatch && indexMatch[1]) {
        this.currentVersion = indexMatch[1];
        return indexMatch[1];
      }

      // 从config.js读取版本号
      const configContent = fs.readFileSync(this.srcFiles.configJs, 'utf8');
      const configMatch = configContent.match(/version:\s*['"](.+)['"]/);
      if (configMatch && configMatch[1]) {
        this.currentVersion = configMatch[1];
        return configMatch[1];
      }

    } catch (error) {
      console.error('读取版本号失败:', error.message);
    }

    return this.currentVersion;
  }

  /**
   * 升级版本号
   * @param {string} level - 升级级别: 'major', 'minor', 'patch'
   * @returns {string} 新的版本号
   */
  upgradeVersion(level = 'patch') {
    const parts = this.currentVersion.split('.').map(Number);

    switch (level) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
      default:
        parts[2]++;
        break;
    }

    this.currentVersion = parts.join('.');
    return this.currentVersion;
  }

  /**
   * 更新所有文件中的版本号
   */
  updateVersionInFiles() {
    try {
      // 需要更新版本号的文件列表
      // 注意：version.js是单一版本源，应该首先更新它
      const filesToUpdate = [
        {
          path: this.srcFiles.versionJs,
          regex: /VERSION\s*=\s*['"](.+)['"]/,
          replacement: `VERSION = '${this.currentVersion}'`,
          name: 'version.js' // 单一版本源，优先更新
        },
        {
          path: this.srcFiles.indexJs,
          regex: /@version\s+([\d.]+)/,
          replacement: `@version ${this.currentVersion}`,
          name: 'index.js' // UserScript元数据
        },
        {
          path: path.join(this.projectRoot, 'build.js'),
          regex: /@version\s+([\d.]+)/,
          replacement: `@version ${this.currentVersion}`,
          name: 'build.js' // 构建脚本
        }
        // config.js不需要在这里更新，因为它从version.js导入VERSION
      ];

      // 遍历所有文件并更新版本号
      filesToUpdate.forEach(file => {
        if (fs.existsSync(file.path)) {
          let content = fs.readFileSync(file.path, 'utf8');
          content = content.replace(file.regex, file.replacement);
          fs.writeFileSync(file.path, content, 'utf8');
          console.log(`✅ 已更新 ${file.name} 版本号为: ${this.currentVersion}`);
        }
      });

      // 同时更新version.js中的版本历史记录（仅在有版本升级时）
      if (fs.existsSync(this.srcFiles.versionJs)) {
        const currentDate = new Date().toISOString().split('T')[0];
        let versionContent = fs.readFileSync(this.srcFiles.versionJs, 'utf8');

        // 检查是否需要添加新版本历史记录
        if (!versionContent.includes(`version: '${this.currentVersion}'`) &&
          !versionContent.includes(`version: "${this.currentVersion}"`)) {
          // 从命令行参数或环境变量获取更新说明
          const updateNote = process.env.UPDATE_NOTE || process.argv.find(arg => arg.startsWith('--note='))?.replace('--note=', '') || '自动版本更新';
          const changes = updateNote.split('|').map(note => note.trim());

          // 在VERSION_HISTORY数组的开头添加新版本记录
          const newVersionEntry = `  {
    version: '${this.currentVersion}',
    date: '${currentDate}',
    changes: [${changes.map(change => `'${change}'`).join(', ')}]
  }`;

          // 插入新版本记录到数组顶部
          versionContent = versionContent.replace(
            /export const VERSION_HISTORY = \[\s*\{/,
            `export const VERSION_HISTORY = [\n${newVersionEntry},\n  {`
          );

          fs.writeFileSync(this.srcFiles.versionJs, versionContent, 'utf8');
          console.log(`✅ 已更新版本历史记录，添加版本: ${this.currentVersion}`);
          console.log(`   更新内容: ${changes.join(', ')}`);
        }
      }

    } catch (error) {
      console.error('更新版本号失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理冗余文件和目录
   */
  cleanProject() {
    // 仅清理临时文件和不必要的文件，保留用户指定的文件和重要目录
    // 注意：
    // 1. 不清理根目录下的api文件夹，它现在是项目的重要组成部分
    // 2. 不清理dist目录，它将在构建过程中被重建
    const itemsToClean = [
      'node_modules',   // Node.js 模块目录
      '*.log',          // 日志文件
      '*.tmp',          // 临时文件
      'GitHub_zh-CN_TEMP.user.js', // 临时用户脚本
      'GitHub_zh-CN.user.js' // 清理根目录的用户脚本，避免冗余
    ];

    itemsToClean.forEach(item => {
      const itemPath = path.join(this.projectRoot, item);
      if (fs.existsSync(itemPath)) {
        try {
          if (fs.lstatSync(itemPath).isDirectory()) {
            fs.rmdirSync(itemPath, { recursive: true });
            console.log(`✅ 已删除目录: ${item}`);
          } else {
            fs.unlinkSync(itemPath);
            console.log(`✅ 已删除文件: ${item}`);
          }
        } catch (error) {
          console.warn(`⚠️  无法删除 ${item}: ${error.message}`);
        }
      }
    });

    // 清理构建目录
    if (fs.existsSync(this.buildDir)) {
      fs.rmdirSync(this.buildDir, { recursive: true });
      console.log('✅ 已清理分发目录');
    }
  }

  /**
   * 创建构建目录
   */
  createBuildDir() {
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
      console.log(`✅ 已创建分发目录: ${this.buildDir}`);
    }
  }

  /**
   * 合并src目录下的所有JS文件
   * @returns {string} 合并后的代码
   */
  mergeSourceFiles() {
    console.log('🔄 开始合并源代码文件...');

    // 读取index.js文件作为入口
    const indexContent = fs.readFileSync(this.srcFiles.indexJs, 'utf8');

    // 移除import语句，使用增强的正则表达式
    let mergedCode = indexContent;

    // 移除所有类型的import语句（包括空行和注释）
    mergedCode = mergedCode.replace(/^\s*import\s+.*?from\s+['"][^'"]+['"][^;]*;\s*(?:\n|$)/gm, '');
    mergedCode = mergedCode.replace(/^\s*import\s+\{[^}]+\}\s*from\s+['"][^'"]+['"][^;]*;\s*(?:\n|$)/gm, '');
    mergedCode = mergedCode.replace(/^\s*import\s+['"][^'"]+['"][^;]*;\s*(?:\n|$)/gm, '');

    // 移除导入相关的注释行
    mergedCode = mergedCode.replace(/^\s*\/\/\s*导入[^\n]*\n/gm, '');
    // 移除导出相关的注释行
    mergedCode = mergedCode.replace(/^\s*\/\/\s*导出[^\n]*\n/gm, '');
    // 清理连续的空行
    mergedCode = mergedCode.replace(/\n{3,}/g, '\n\n');

    // 获取所有需要合并的文件（确保依赖顺序正确）
    const filesToMerge = [
      path.join(this.srcDir, 'version.js'), // 首先合并版本文件，作为依赖源
      path.join(this.srcDir, 'utils.js'),
      path.join(this.srcDir, 'config.js'),
      path.join(this.srcDir, 'versionChecker.js'),
      path.join(this.srcDir, 'dictionaries/index.js'),
      path.join(this.srcDir, 'dictionaries/common.js'),
      path.join(this.srcDir, 'dictionaries/codespaces.js'),
      path.join(this.srcDir, 'dictionaries/explore.js'),
      path.join(this.srcDir, 'translationCore.js'),
      path.join(this.srcDir, 'pageMonitor.js'),
      path.join(this.srcDir, 'tools.js'),
      path.join(this.srcDir, 'main.js')
    ];

    // 合并所有文件内容
    filesToMerge.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        let fileContent = fs.readFileSync(filePath, 'utf8');

        // 移除所有ES模块语法，使用全面的正则表达式

        // 1. 移除所有类型的import语句（行首匹配，包括注释和空行）
        fileContent = fileContent.replace(/^\s*import\s+.*?from\s+['"][^'"]+['"][^;]*;\s*(?:\n|$)/gm, '');
        fileContent = fileContent.replace(/^\s*import\s+\{[^}]+\}\s*from\s+['"][^'"]+['"][^;]*;\s*(?:\n|$)/gm, '');
        fileContent = fileContent.replace(/^\s*import\s+['"][^'"]+['"][^;]*;\s*(?:\n|$)/gm, '');
        fileContent = fileContent.replace(/^\s*import\s+type\s+.*?from\s+['"][^'"]+['"][^;]*;\s*(?:\n|$)/gm, '');

        // 2. 移除所有类型的export语句
        // 移除export default
        fileContent = fileContent.replace(/^\s*export\s+default\s+/gm, '');

        // 移除export { ... } 形式的导出
        fileContent = fileContent.replace(/^\s*export\s+\{[^}]+\}\s*;?\s*(?:\n|$)/gm, '');
        fileContent = fileContent.replace(/^\s*export\s+\*\s+from\s+['"][^'"]+['"]\s*;?\s*(?:\n|$)/gm, '');
        fileContent = fileContent.replace(/^\s*export\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]\s*;?\s*(?:\n|$)/gm, '');

        // 移除export function/const/class/let/var声明（包括箭头函数形式）
        fileContent = fileContent.replace(/^\s*export\s+(?:async\s+)?function\s+/gm, 'function ');
        fileContent = fileContent.replace(/^\s*export\s+const\s+(\w+)\s*=\s*((?:async\s+)?)function\s*/gm, 'const $1 = $2function ');
        fileContent = fileContent.replace(/^\s*export\s+const\s+(\w+)\s*=\s*\(/gm, 'const $1 = (');
        fileContent = fileContent.replace(/^\s*export\s+(const|let|var)\s+/gm, '$1 ');
        fileContent = fileContent.replace(/^\s*export\s+class\s+/gm, 'class ');
        fileContent = fileContent.replace(/^\s*export\s+interface\s+/gm, 'interface ');
        fileContent = fileContent.replace(/^\s*export\s+type\s+/gm, 'type ');

        // 确保没有遗漏的export语句
        fileContent = fileContent.replace(/export\s+/g, '');

        // 对于version.js文件，优化版本历史记录显示，只保留最新版本
        if (filePath.includes('version.js')) {
          // 替换完整版本历史为只包含当前版本的简化版本
          const versionRegex = /const\s+VERSION\s*=\s*['"]([^'"]+)['"];/;
          const versionMatch = fileContent.match(versionRegex);
          const currentVersion = versionMatch ? versionMatch[1] : this.currentVersion;

          // 简化版本历史记录，只保留当前版本和最近的几个重要版本
          fileContent = fileContent.replace(
            /const\s+VERSION_HISTORY\s*=\s*\[([\s\S]+?)\];/,
            `const VERSION_HISTORY = [\n  {\n    version: '${currentVersion}',\n    date: '${new Date().toISOString().split('T')[0]}',\n    changes: ['当前版本']\n  }\n];`
          );
        }

        // 对version.js文件进行特殊处理，清理冗余内容
        if (filePath.includes('version.js')) {
          // 先找到getFormattedVersion函数定义
          const functionMatch = fileContent.match(/function getFormattedVersion\([^)]*\)\s*\{[^}]*\}/);
          if (functionMatch) {
            // 获取函数定义部分
            const functionDef = functionMatch[0];
            // 查找函数定义之后的内容
            const functionIndex = fileContent.indexOf(functionDef);
            const afterFunction = fileContent.substring(functionIndex + functionDef.length);

            // 查找工具函数模块开始的位置
            const utilsModuleStart = afterFunction.indexOf('/**\n * 工具函数模块');

            if (utilsModuleStart !== -1) {
              // 保留函数定义和工具函数模块之间的必要内容
              const newContent = fileContent.substring(0, functionIndex + functionDef.length) + afterFunction.substring(utilsModuleStart);
              fileContent = newContent;
            }
          }
        } else {
          // 对于其他文件，使用通用的导出语句清理
          fileContent = fileContent.replace(/\/\/\s*导出[^\n]*\n+/g, '');
          fileContent = fileContent.replace(/\{\s*\w+\s*\}\s*;?\s*/g, '');
        }

        // 清理连续的空行
        fileContent = fileContent.replace(/\n{3,}/g, '\n\n');

        mergedCode += '\n\n' + fileContent;
        console.log(`✅ 已合并: ${path.relative(this.srcDir, filePath)}`);
      }
    });

    // 最后检查并确保所有export关键字都被移除
    // 检查并移除所有剩余的export语句，包括export { ... }形式
    let previousCode;
    do {
      previousCode = mergedCode;
      // 移除export { ... } 语句块
      mergedCode = mergedCode.replace(/export\s*\{[^}]+\}\s*;?/gs, '');
      // 移除任何剩余的export关键字
      mergedCode = mergedCode.replace(/export\s+/g, '');
    } while (previousCode !== mergedCode); // 循环直到没有更多变化

    if (mergedCode.includes('export')) {
      console.warn('⚠️  警告: 合并后的代码中仍存在export字符串');
    }

    return mergedCode;
  }

  /**
   * 修复构建产物中的问题
   * 主要处理：
   * 1. 修复字符串模板语法错误 ($ 替换为 ${})
   * 2. 移除重复的注释
   * 3. 修复变量引用问题
   * 4. 修复函数调用格式问题
   */
  fixBuildOutput(outputFilePath) {
    console.log('🔧 开始修复构建产物中的问题...');

    let fileContent = fs.readFileSync(outputFilePath, 'utf8');
    let hasChanges = false;
    let changesCount = 0;

    // 1. 修复字符串模板语法错误
    const templateFixes = [
      { pattern: /已经通知过版本 \$的更新/, replacement: "已经通知过版本 ${newVersion}的更新" },
      { pattern: /发现新版本 \$，/, replacement: "发现新版本 ${newVersion}，" },
      { pattern: /显示更新通知: 版本 \$/, replacement: "显示更新通知: 版本 ${newVersion}" },
      { pattern: /已缓存新版本号: \$\(缓存时间:/, replacement: "已缓存新版本号: ${newVersion}(缓存时间:" }
    ];

    templateFixes.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    // 2. 修复按钮ID中的$符号
    const buttonIdFixes = [
      { pattern: /id = `\$-update-btn`/, replacement: "id = `notificationId-update-btn`" },
      { pattern: /id = `\$-later-btn`/, replacement: "id = `notificationId-later-btn`" },
      { pattern: /id = `\$-dismiss-btn`/, replacement: "id = `notificationId-dismiss-btn`" }
    ];

    buttonIdFixes.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    // 3. 移除重复的注释
    const duplicateComments = [
      { pattern: /\/\*\*\s*翻译词典合并模块\s*\*\/\s*\/\*\*/, replacement: "/*" },
      { pattern: /\/\*\*\s*GitHub 中文翻译主入口文件\s*\*\/\s*\/\*\*/, replacement: "/*" }
    ];

    duplicateComments.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    // 4. 修复函数调用末尾多余的大括号和格式问题
    const functionCallFixes = [
      {
        pattern: /if \(!response\.ok\) \{\s*throw new Error\(`HTTP错误! 状态码: \${response\.status}`\)\s*\}\s*\}/g,
        replacement: "if (!response.ok) {\n                    throw new Error(`HTTP错误! 状态码: ${response.status}`)\n                }"
      },
      {
        pattern: /if \(attempt === maxRetries\) \{\s*throw error\s*\}\s*\}/g,
        replacement: "if (attempt === maxRetries) {\n                    throw error\n                }"
      },
      {
        pattern: /if \(match && match\[1\]\) \{\s*return match\[1\]\s*\}\s*\}/g,
        replacement: "if (match && match[1]) {\n                return match[1]\n            }"
      },
      {
        pattern: /if \(newPart > currentPart\) \{\s*return true\s*\}\s*\}/g,
        replacement: "if (newPart > currentPart) {\n                return true\n            }"
      },
      { pattern: /\}\s*\}/g, replacement: "\}\n        }" },
    ];

    functionCallFixes.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    // 5. 修复对象赋值后的多余分号和空格
    const extraSemicolonCount = (fileContent.match(/\}\s*\s*;/g) || []).length;
    if (extraSemicolonCount > 0) {
      fileContent = fileContent.replace(/\}\s*\s*;/g, '};');
      hasChanges = true;
      changesCount += extraSemicolonCount;
    }

    // 6. 移除可能的BOM字符
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.substring(1);
      hasChanges = true;
      changesCount++;
    }

    // 7. 修复DOM操作中的语法错误 - 特别针对appendChild调用
    // 修复appendChild调用中可能出现的语法错误
    const domOperationFixes = [
      // 修复appendChild调用中的语法错误，处理逗号问题
      { pattern: /appendChild\(\s*(\w+),/g, replacement: "appendChild($1)" },
      // 修复appendChild调用末尾的语法错误，使用捕获组
      { pattern: /appendChild\(\s*(\w+)\s*\)\s*,/g, replacement: "appendChild($1);" },
      // 修复括号不匹配的问题，使用捕获组
      { pattern: /appendChild\(\s*(\w+)\s*\),/g, replacement: "appendChild($1)" },
      // 修复可能存在的错误语法模式，使用捕获组
      { pattern: /\((\w+),\s*\w+\)/g, replacement: "($1)" },
      // 修复嵌套appendChild调用中的语法问题
      { pattern: /appendChild\(\s*(\w+)\.appendChild\(/g, replacement: "appendChild($1.appendChild(" }
    ];

    domOperationFixes.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    // 8. 针对版本比较函数的特殊修复，确保其语法正确
    // 检查并修复isNewerVersion函数中的语法错误
    const versionFunctionMatch = fileContent.match(/function isNewerVersion\([^)]*\)\s*{[^}]*}/);
    if (versionFunctionMatch) {
      const versionFunction = versionFunctionMatch[0];
      // 修复版本比较函数中的语法错误
      const fixedFunction = versionFunction
        .replace(/function isNewerVersion\([^)]*\)/, 'function isNewerVersion(newVersion, currentVersion)') // 修复参数
        .replace(/\s*,\s*\)/g, ')') // 移除参数列表末尾的逗号
        .replace(/\{\s*,/g, '{')     // 移除代码块开始处的逗号
        .replace(/,\s*\}/g, '}')     // 移除代码块结束前的逗号
        .replace(/const newParts = newVersion\.split\(\'\.\'\)\.map\(Number\)/g, '        const newParts = newVersion.split(\'.\').map(Number);') // 修复缩进和添加分号
        .replace(/const currentParts = currentVersion\.split\(\'\.\'\)\.map\(Number\)/g, '        const currentParts = currentVersion.split(\'.\').map(Number);'); // 修复缩进和添加分号

      if (fixedFunction !== versionFunction) {
        fileContent = fileContent.replace(versionFunction, fixedFunction);
        hasChanges = true;
        changesCount++;
      }
    }

    // 9. 修复事件监听器中的$1参数问题
    const eventListenerFixes = [
      { pattern: /\(this\.hideNotification\(\$1\)\)/g, replacement: '(this.hideNotification(notificationId))' },
      { pattern: /hideNotification\(\$1\)/g, replacement: 'hideNotification(notificationId)' }
    ];

    eventListenerFixes.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    // 10. 修复按钮ID中的模板字符串问题
    const btnIdFixes = [
      { pattern: /id = `notificationId-update-btn`/, replacement: "id = `\${notificationId}-update-btn`" },
      { pattern: /id = `notificationId-later-btn`/, replacement: "id = `\${notificationId}-later-btn`" },
      { pattern: /id = `notificationId-dismiss-btn`/, replacement: "id = `\${notificationId}-dismiss-btn`" }
    ];

    btnIdFixes.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    // 11. 检查并修复所有DOM操作函数调用中的语法错误
    const domFunctions = ['appendChild', 'insertBefore', 'replaceChild', 'removeChild'];
    domFunctions.forEach(func => {
      // 查找并修复所有这些DOM函数调用中的语法错误
      const regex = new RegExp(`${func}\(\s*([^)]*)\),`, 'g');
      const count = (fileContent.match(regex) || []).length;
      if (count > 0) {
        // 移除函数调用后的逗号，保留参数并添加分号
        fileContent = fileContent.replace(regex, `${func}($1);`);
        hasChanges = true;
        changesCount += count;
      }
    });

    // 12. 为DOM操作代码块添加分号并统一缩进
    // 修复DOM操作代码块中的格式问题，确保每个语句都有分号
    const domStatementFixes = [
      { pattern: /(\w+\.createElement\([^)]*\))/g, replacement: '$1;' },
      { pattern: /(\w+\.setAttribute\([^)]*\))/g, replacement: '$1;' },
      { pattern: /(\w+\.className\s*=\s*[^;]*)(?![;])/g, replacement: '$1;' },
      { pattern: /(\w+\.textContent\s*=\s*[^;]*)(?![;])/g, replacement: '$1;' },
      { pattern: /(\w+\.href\s*=\s*[^;]*)(?![;])/g, replacement: '$1;' },
      { pattern: /(\w+\.target\s*=\s*[^;]*)(?![;])/g, replacement: '$1;' },
      { pattern: /(\w+\.rel\s*=\s*[^;]*)(?![;])/g, replacement: '$1;' },
      { pattern: /(\w+\.id\s*=\s*[^;]*)(?![;])/g, replacement: '$1;' }
    ];

    domStatementFixes.forEach(({ pattern, replacement }) => {
      const originalCount = (fileContent.match(pattern) || []).length;
      if (originalCount > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        hasChanges = true;
        changesCount += originalCount;
      }
    });

    if (hasChanges) {
      // 保存修复后的文件
      fs.writeFileSync(outputFilePath, fileContent, 'utf8');
      console.log(`✅ 构建产物修复完成，共进行了 ${changesCount} 处修改`);
    } else {
      console.log('✅ 构建产物无需修复，没有发现问题');
    }

    return hasChanges;
  }

  /**
   * 构建用户脚本
   */
  buildUserScript() {

    try {
      // 确保构建目录存在
      this.createBuildDir();

      // 合并所有源文件
      let mergedCode = this.mergeSourceFiles();

      // 最终清理：移除version.js中的无效导出语句和相关注释
      mergedCode = mergedCode.replace(/\/\/ 导出格式化版本函数\s*(\{[^}]*\}\s*;?)?\s*/g, '');
      mergedCode = mergedCode.replace(/\s*\{\s*getFormattedVersion\s*\}\s*;?\s*/g, '');
      mergedCode = mergedCode.replace(/\s*\/\/ 导出格式化版本函数\s*\n?\s*/g, '');

      // 移除合并过程中产生的多余分号和换行符组合
      mergedCode = mergedCode.replace(/;\\n\\n/g, '\\n\\n');
      mergedCode = mergedCode.replace(/;\\n/g, '\\n');
      mergedCode = mergedCode.replace(/;\s*\n\s*\n/g, '\n\n');
      mergedCode = mergedCode.replace(/;\s*\n\s*/g, '\n');

      // 将字面的\n转义序列替换为实际的换行符
      mergedCode = mergedCode.replace(/\\n/g, '\n');

      // 写入到输出文件
      fs.writeFileSync(this.outputFile, mergedCode, 'utf8');
      console.log(`✅ 已生成: ${path.relative(this.projectRoot, this.outputFile)}`);

      // 修复构建产物中的问题
      this.fixBuildOutput(this.outputFile);

      return true;
    } catch (error) {
      console.error('❌ 构建用户脚本失败:', error.message);
      return false;
    }
  }

  /**
   * 复制文件到分发目录
   */
  copyFilesToDist() {
    // 由于输出文件已经直接放在dist目录，这个方法现在主要用于记录日志
    console.log(`✅ 用户脚本已直接生成到分发目录: ${this.buildDir}`);
    console.log(`✅ 文件位置: ${path.relative(this.projectRoot, this.outputFile)}`);

    // API目录已直接位于根目录，不再需要复制到dist目录
    console.log('✅ API目录已直接位于根目录，无需复制到dist目录');

    console.log(`✅ 构建产物已准备就绪`);
  }

  /**
   * 运行构建流程
   * @param {Object} options - 构建选项
   */
  build(options = {}) {
    const {
      upgradeVersion = true,
      versionLevel = 'patch',
      clean = true,
      copyToDist = true
    } = options;

    try {
      console.log('🔄 开始构建流程...');

      // 读取当前版本
      this.readCurrentVersion();
      console.log(`📦 当前版本: ${this.currentVersion}`);

      // 升级版本
      if (upgradeVersion) {
        const newVersion = this.upgradeVersion(versionLevel);
        console.log(`🚀 升级到新版本: ${newVersion}`);
        this.updateVersionInFiles();
      }

      // 清理项目
      if (clean) {
        console.log('🧹 清理项目...');
        this.cleanProject();
      }

      // 构建用户脚本
      console.log('🏗️  开始构建用户脚本...');
      this.buildUserScript();

      // 复制到分发目录
      if (copyToDist) {
        console.log('📋 复制文件到分发目录...');
        this.copyFilesToDist();
      }

      console.log('🎉 构建完成!');
      return {
        success: true,
        version: this.currentVersion,
        buildDir: this.buildDir
      };
    } catch (error) {
      console.error('❌ 构建失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证构建结果
   * @returns {Object} 验证结果
   */
  validateBuild() {
    try {
      // 检查构建后的用户脚本是否存在
      const buildScript = path.join(this.buildDir, 'GitHub_zh-CN.user.js');
      if (!fs.existsSync(buildScript)) {
        return { valid: false, error: '构建后的用户脚本不存在' };
      }

      // 检查版本一致性
      const buildContent = fs.readFileSync(buildScript, 'utf8');
      const buildVersionMatch = buildContent.match(/@version\s+([\d.]+)/);

      if (!buildVersionMatch || buildVersionMatch[1] !== this.currentVersion) {
        return {
          valid: false,
          error: '构建版本与当前版本不一致'
        };
      }

      // 检查主要模块是否包含在构建后的文件中
      const requiredModules = ['CONFIG', 'translationModule', 'translationCore', 'pageMonitor'];
      for (const module of requiredModules) {
        if (!buildContent.includes(module)) {
          return {
            valid: false,
            error: `构建后的文件中缺少必要模块: ${module}`
          };
        }
      }

      console.log(`✅ 构建验证通过，版本: ${this.currentVersion}`);
      return { valid: true, version: this.currentVersion };
    } catch (error) {
      console.error('❌ 构建验证失败:', error.message);
      return { valid: false, error: error.message };
    }
  }
}

// 命令行接口
function main() {
  const buildManager = new BuildManager();
  const args = process.argv.slice(2);

  // 解析命令行参数
  const options = {
    upgradeVersion: !args.includes('--no-upgrade'),
    versionLevel: args.includes('--major') ? 'major' :
      args.includes('--minor') ? 'minor' : 'patch',
    clean: !args.includes('--no-clean'),
    copyToDist: !args.includes('--no-copy')
  };

  // 运行构建
  const result = buildManager.build(options);

  if (!result.success) {
    console.error(`❌ 构建失败: ${result.error}`);
  }

  process.exit(result.success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

// 导出类供其他模块使用
module.exports = BuildManager;
