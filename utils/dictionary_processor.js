// 词典处理工具
// 作者: SutChan
// 版本: 1.8.16

const fs = require('fs').promises;
const path = require('path');

// 导入共享工具函数
const { formatNumber } = require('./utils');

// 默认配置
const DEFAULT_CONFIG = {
  userScriptPath: '../GitHub_zh-CN.user.js',
  dictionaryFilePath: '../api/translations.json',
  backupDir: '../backups',
  logLevel: 'info', // error, warn, info, debug
};

// 配置对象
let CONFIG = { ...DEFAULT_CONFIG };

/**
 * 统一日志处理函数
 * @param {string} level - 日志级别: error, warn, info, debug
 * @param {string} message - 日志消息
 * @param {any} [details] - 详细信息或错误对象
 */
function log(level, message, details = null) {
  const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = logLevels[CONFIG.logLevel] || logLevels.info;
  const messageLevel = logLevels[level] || logLevels.info;

  // 只输出级别大于等于当前设置的日志
  if (messageLevel <= currentLevel) {
    let logMessage = `[${level.toUpperCase()}] ${message}`;

    if (details) {
      if (details instanceof Error) {
        logMessage += `\n错误详情: ${details.message}\n${details.stack}`;
      } else if (typeof details === 'object') {
        try {
          logMessage += `\n详细信息: ${JSON.stringify(details, null, 2)}`;
        } catch (e) {
          logMessage += `\n详细信息: [对象序列化失败]`;
        }
      } else {
        logMessage += `\n详细信息: ${details}`;
      }
    }

    if (level === 'error') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }
}

/**
 * 安全地解析模块内容为对象，替代eval()以符合CSP要求
 * @param {string} moduleContent - 模块内容字符串
 * @returns {Object} 解析后的对象
 */
function safeParseModuleContent(moduleContent) {
  try {
    // 确保内容是一个有效的对象字面量
    const trimmedContent = moduleContent.trim();
    
    // 验证内容以 { 开始和以 } 结束
    if (!trimmedContent.startsWith('{') || !trimmedContent.endsWith('}')) {
      throw new Error('模块内容格式不正确，不是有效的对象字面量');
    }
    
    // 使用JSON.parse替代eval，但需要先处理非标准JSON格式
    // 将单引号替换为双引号，并处理JavaScript对象字面量中的其他格式差异
    let jsonCompatibleContent = trimmedContent
      // 替换单引号为双引号
      .replace(/'/g, '"')
      // 移除对象字面量中的尾随逗号（JSON不允许）
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      // 处理属性名（确保所有属性名都有引号）
      .replace(/(\w+)\s*:/g, '"$1":')
      // 处理字符串值中的转义字符
      .replace(/\\n/g, '\\n')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t')
      // 处理多行字符串（将它们连接成单行）
      .replace(/"\s*\+\s*"/g, '')
      // 处理字符串中的换行符
      .replace(/[\r\n]+/g, ' ');
    
    // 尝试解析处理后的内容
    return JSON.parse(jsonCompatibleContent);
  } catch (error) {
    log('warn', '使用JSON.parse解析失败，尝试使用更安全的解析方法', error.message);
    
    try {
      // 作为后备方案，使用更安全的解析方法
      // 1. 尝试使用简单的正则表达式解析键值对
      const result = {};
      // 匹配键值对的正则表达式，支持单引号和双引号
      const keyValueRegex = /(['"])([^'"]+)\1\s*:\s*(['"])([^'"]*)\3/g;
      let match;
      
      while ((match = keyValueRegex.exec(trimmedContent)) !== null) {
        const key = match[2];
        const value = match[4];
        result[key] = value;
      }
      
      // 如果找到了键值对，返回结果
      if (Object.keys(result).length > 0) {
        log('info', `使用正则表达式解析成功，提取了 ${Object.keys(result).length} 个键值对`);
        return result;
      }
      
      // 2. 如果正则表达式解析失败，尝试使用更宽松的解析方法
      // 注意：这是一个最后的后备方案，可能不适用于所有情况
      // 在生产环境中，应该确保模块内容是有效的JSON格式
      throw new Error('无法使用安全方法解析模块内容，请确保模块内容是有效的JSON格式');
    } catch (fallbackError) {
      log('error', '无法安全解析模块内容', fallbackError);
      throw new Error(`解析模块内容失败: ${fallbackError.message}`);
    }
  }
}

/**
 * 从GitHub_zh-CN.user.js中提取翻译词典
 * @returns {Promise<Object>} 提取的词典对象
 */
async function extractDictionaryFromUserScript() {
  try {
    const fullPath = path.resolve(__dirname, CONFIG.userScriptPath);
    const scriptContent = await fs.readFile(fullPath, 'utf8');

    // 匹配translationModule对象
    const translationModulePattern = /const\s+translationModule\s*=\s*\{[\s\S]*?\};/;
    const match = scriptContent.match(translationModulePattern);

    if (!match) {
      throw new Error('未找到translationModule对象');
    }

    // 提取所有模块的词典
    const dictionary = {};
    const modulePattern = /(\w+)\s*:\s*\{[\s\S]*?\}(?=,|\s*\})/g;
    let moduleMatch;

    while ((moduleMatch = modulePattern.exec(match[0])) !== null) {
      try {
        // 提取模块名和模块内容
        const moduleName = moduleMatch[1];
        const moduleContent = moduleMatch[0].replace(`${moduleName}: `, '');

        // 使用安全的方法解析模块内容为对象，替代eval()
        const moduleDict = safeParseModuleContent(moduleContent);
        dictionary[moduleName] = moduleDict;

        log('debug', `已提取模块 ${moduleName}，包含 ${Object.keys(moduleDict).length} 个字符串`);
      } catch (e) {
        log('warn', `解析模块失败: ${moduleMatch[0]}`, e);
      }
    }

    log('info', `已从用户脚本中提取 ${Object.keys(dictionary).length} 个模块的词典`);
    return dictionary;
  } catch (error) {
    log('error', '从用户脚本提取词典失败:', error);
    throw error;
  }
}

/**
 * 从JSON文件读取词典
 * @returns {Promise<Object>} 读取的词典对象
 */
async function readDictionaryFromJson() {
  try {
    const fullPath = path.resolve(__dirname, CONFIG.dictionaryFilePath);
    const dictionaryData = await fs.readFile(fullPath, 'utf8');
    const dictionary = JSON.parse(dictionaryData);

    log('info', `已从JSON文件读取词典，包含 ${Object.keys(dictionary).length} 个模块`);
    return dictionary;
  } catch (error) {
    log('error', '从JSON文件读取词典失败:', error);
    throw error;
  }
}

/**
 * 将词典保存到JSON文件
 * @param {Object} dictionary - 要保存的词典对象
 * @returns {Promise<void>}
 */
async function saveDictionaryToJson(dictionary) {
  try {
    // 确保目录存在
    const dir = path.dirname(path.resolve(__dirname, CONFIG.dictionaryFilePath));
    await fs.mkdir(dir, { recursive: true });

    const fullPath = path.resolve(__dirname, CONFIG.dictionaryFilePath);
    await fs.writeFile(fullPath, JSON.stringify(dictionary, null, 2), 'utf8');

    // 计算词典中的字符串总数
    let totalStrings = 0;
    for (const moduleName in dictionary) {
      totalStrings += Object.keys(dictionary[moduleName]).length;
    }

    log('info', `已将词典保存到JSON文件: ${fullPath}`);
    log('info', `词典包含 ${formatNumber(Object.keys(dictionary).length)} 个模块，共 ${formatNumber(totalStrings)} 个字符串`);
  } catch (error) {
    log('error', '保存词典到JSON文件失败:', error);
    throw error;
  }
}

/**
 * 创建文件备份
 * @param {string} content - 要备份的文件内容
 * @returns {Promise<string>}
 */
async function createBackup(content) {
  try {
    const backupDir = path.resolve(__dirname, CONFIG.backupDir);
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `GitHub_zh-CN.user.js.${timestamp}.bak`);

    await fs.writeFile(backupPath, content, 'utf8');
    log('info', `已创建备份: ${backupPath}`);
    return backupPath;
  } catch (error) {
    log('error', '创建备份失败:', error);
    // 备份失败不应阻止主流程
    return null;
  }
}

/**
 * 将词典写入到GitHub_zh-CN.user.js
 * @param {Object} dictionary - 要写入的词典对象
 * @returns {Promise<void>}
 */
async function writeDictionaryToUserScript(dictionary) {
  try {
    const fullPath = path.resolve(__dirname, CONFIG.userScriptPath);
    const originalContent = await fs.readFile(fullPath, 'utf8');

    // 创建备份
    await createBackup(originalContent);

    let updatedContent = originalContent;

    // 对每个模块更新词典
    for (const moduleName in dictionary) {
      const moduleDict = dictionary[moduleName];

      // 转义模块名中的特殊字符
      const escapedModule = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 使用字符类和普通字符，避免不必要的转义
      const moduleRegex = new RegExp(`(\\s+${escapedModule}\\s*=\\s*{[\\s\\S]*?})`);

      const match = updatedContent.match(moduleRegex);

      if (match) {
        const moduleContent = match[1];
        const closingBraceIndex = moduleContent.lastIndexOf('}');

        if (closingBraceIndex === -1) {
          log('error', `无法找到模块 ${moduleName} 的结束标记`);
          continue;
        }

        // 构建新的模块内容
        let newModuleContent = moduleContent.substring(0, moduleContent.indexOf('{') + 1) + '\n';

        // 按字母顺序排序并添加字符串条目
        const sortedKeys = Object.keys(moduleDict).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
          const key = sortedKeys[i];
          const value = moduleDict[key];

          // 安全地转义字符串内容
          const safeKey = key.replace(/"/g, '\\"');
          const safeValue = value.replace(/"/g, '\\"');

          newModuleContent += `    "${safeKey}": "${safeValue}"`;

          // 如果不是最后一个条目，添加逗号
          if (i < sortedKeys.length - 1) {
            newModuleContent += ',';
          }
          newModuleContent += '\n';
        }

        newModuleContent += '  }';

        // 替换模块内容
        updatedContent = updatedContent.replace(moduleContent, newModuleContent);
        log('info', `已更新模块 ${moduleName}，包含 ${sortedKeys.length} 个字符串`);
      } else {
        log('error', `无法找到模块 ${moduleName} 的定义`);
      }
    }

    // 保存更新后的脚本
    await fs.writeFile(fullPath, updatedContent, 'utf8');
    log('info', `已将词典写入到用户脚本: ${fullPath}`);
  } catch (error) {
    log('error', '将词典写入到用户脚本失败:', error);
    throw error;
  }
}

/**
 * 优化翻译词典
 * @param {Object} dictionary - 要优化的词典对象
 * @returns {Object} 优化后的词典对象
 */
function optimizeDictionary(dictionary) {
  try {
    const optimizedDictionary = {};
    const globalSeen = new Set(); // 用于检测跨模块重复字符串

    // 按模块处理
    for (const moduleName in dictionary) {
      const moduleDict = dictionary[moduleName];
      const optimizedModule = {};
      const moduleSeen = new Set(); // 用于检测模块内重复字符串

      // 处理每个字符串
      for (const key in moduleDict) {
        const value = moduleDict[key];

        // 跳过空字符串
        if (!key || key.trim() === '') {
          continue;
        }

        // 跳过模块内重复字符串
        if (moduleSeen.has(key)) {
          log('debug', `跳过模块 ${moduleName} 中的重复字符串: "${key}"`);
          continue;
        }

        // 跳过跨模块重复字符串（可选功能）
        if (globalSeen.has(key)) {
          log('debug', `跳过跨模块重复字符串: "${key}" (已在其他模块中存在)`);
          continue;
        }

        // 清理字符串（去除首尾空格等）
        const cleanedKey = key.trim();
        const cleanedValue = value && typeof value === 'string' ? value.trim() : value;

        // 保存到优化后的模块
        optimizedModule[cleanedKey] = cleanedValue;
        moduleSeen.add(cleanedKey);
        globalSeen.add(cleanedKey);
      }

      // 只有当模块中还有字符串时才保存
      if (Object.keys(optimizedModule).length > 0) {
        optimizedDictionary[moduleName] = optimizedModule;
      }
    }

    // 计算优化统计信息
    let originalTotal = 0;
    let optimizedTotal = 0;
    for (const moduleName in dictionary) {
      originalTotal += Object.keys(dictionary[moduleName]).length;
    }
    for (const moduleName in optimizedDictionary) {
      optimizedTotal += Object.keys(optimizedDictionary[moduleName]).length;
    }

    log('info', `词典优化完成: 原始 ${originalTotal} 个字符串，优化后 ${optimizedTotal} 个字符串，移除了 ${originalTotal - optimizedTotal} 个重复或无效字符串`);
    return optimizedDictionary;
  } catch (error) {
    log('error', '优化词典失败:', error);
    throw error;
  }
}

/**
 * 将新提取的字符串保存到JSON词典文件
 * @param {Array<{text: string, module: string}>} strings - 提取的字符串数组
 * @returns {Promise<void>}
 */
async function saveExtractedStringsToDictionary(strings) {
  try {
    // 尝试读取现有词典
    let existingDictionary = {};
    try {
      existingDictionary = await readDictionaryFromJson();
    } catch (error) {
      log('info', '未找到现有词典，创建新词典');
    }

    // 按模块组织新字符串
    const newStringsByModule = {};
    for (const { text, module } of strings) {
      if (!newStringsByModule[module]) {
        newStringsByModule[module] = {};
      }
      // 只添加新字符串，不覆盖已有翻译
      if (!existingDictionary[module] || !existingDictionary[module][text]) {
        newStringsByModule[module][text] = `待翻译: ${text}`;
      }
    }

    // 合并新旧词典
    const mergedDictionary = { ...existingDictionary };
    for (const module in newStringsByModule) {
      if (!mergedDictionary[module]) {
        mergedDictionary[module] = {};
      }
      mergedDictionary[module] = { ...mergedDictionary[module], ...newStringsByModule[module] };
    }

    // 优化合并后的词典
    const optimizedDictionary = optimizeDictionary(mergedDictionary);

    // 保存到JSON文件
    await saveDictionaryToJson(optimizedDictionary);

    // 统计信息
    let addedCount = 0;
    for (const module in newStringsByModule) {
      addedCount += Object.keys(newStringsByModule[module]).length;
    }

    log('info', `已将 ${addedCount} 个新字符串添加到JSON词典文件`);
  } catch (error) {
    log('error', '保存提取的字符串到词典失败:', error);
    throw error;
  }
}

/**
 * 命令行接口函数
 * @param {string} command - 命令名称
 * @param {Object} options - 选项参数
 */
async function cli(command, options = {}) {
  try {
    // 合并配置
    Object.assign(CONFIG, options);

    switch (command) {
      case 'export':
        // 从用户脚本导出词典到JSON文件
        const dictionary = await extractDictionaryFromUserScript();
        const optimizedDictionary = optimizeDictionary(dictionary);
        await saveDictionaryToJson(optimizedDictionary);
        log('info', '词典导出完成');
        break;

      case 'import':
        // 从JSON文件导入词典到用户脚本
        const importDictionary = await readDictionaryFromJson();
        await writeDictionaryToUserScript(importDictionary);
        log('info', '词典导入完成');
        break;

      case 'optimize':
        // 优化JSON词典文件
        const currentDictionary = await readDictionaryFromJson();
        const optimized = optimizeDictionary(currentDictionary);
        await saveDictionaryToJson(optimized);
        log('info', '词典优化完成');
        break;

      default:
        log('error', `未知命令: ${command}`);
        log('info', '可用命令: export, import, optimize');
    }
  } catch (error) {
    log('error', '命令执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};

  // 解析命令行选项
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value;
    }
  }

  if (command === 'help') {
    console.log('词典处理工具使用帮助:');
    console.log('  node dictionary_processor.js export [options] - 从用户脚本导出词典到JSON文件');
    console.log('  node dictionary_processor.js import [options] - 从JSON文件导入词典到用户脚本');
    console.log('  node dictionary_processor.js optimize [options] - 优化JSON词典文件');
    console.log('');
    console.log('选项:');
    console.log('  --userScriptPath=path - 指定用户脚本文件路径');
    console.log('  --dictionaryFilePath=path - 指定词典JSON文件路径');
    console.log('  --logLevel=level - 设置日志级别 (error, warn, info, debug)');
    process.exit(0);
  }

  cli(command, options);
}

// 导出函数供其他模块使用
module.exports = {
  extractDictionaryFromUserScript,
  readDictionaryFromJson,
  saveDictionaryToJson,
  writeDictionaryToUserScript,
  optimizeDictionary,
  saveExtractedStringsToDictionary,
  cli
};
