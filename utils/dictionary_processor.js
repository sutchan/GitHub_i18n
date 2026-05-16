// 词典处理工具
// 作者: SutChan
// 版本: 1.9.0
// GitHub i18n 项目专用版本

const fs = require('fs').promises;
const path = require('path');

// 导入共享工具函数
const { formatNumber } = require('./utils');

// 默认配置 - 适用于 GitHub i18n 项目结构
const DEFAULT_CONFIG = {
  srcDir: '../src/dictionaries',
  dictionaryFilePath: '../api/translations.json',
  backupDir: '../backups',
  logLevel: 'info', // error, warn, info, debug
};

// 配置对象
const CONFIG = { ...DEFAULT_CONFIG };

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
        } catch (_e) {
          logMessage += '\n详细信息: [对象序列化失败]';
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
 * 安全地解析模块内容为对象
 * @param {string} moduleContent - 模块内容字符串
 * @returns {Object} 解析后的对象
 */
function safeParseModuleContent(moduleContent) {
  // 确保内容是一个有效的对象字面量
  const trimmedContent = moduleContent.trim();

  try {
    // 验证内容以 { 开始和以 } 结束
    if (!trimmedContent.startsWith('{') || !trimmedContent.endsWith('}')) {
      throw new Error('模块内容格式不正确，不是有效的对象字面量');
    }

    // 尝试使用 JSON.parse，但先处理 JavaScript 对象字面量
    const jsonCompatibleContent = trimmedContent
      // 替换单引号为双引号，但要小心处理字符串内容中的引号
      .replace(/^'|'$/g, '"')
      // 处理属性名（确保所有属性名都有双引号）
      .replace(/(\w+)(\s*:\s*)/g, '"$1"$2')
      // 处理字符串值的引号
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      // 移除尾随逗号
      .replace(/,(\s*[}\]])/g, '$1');

    // 尝试解析
    return JSON.parse(jsonCompatibleContent);
  } catch (error) {
    log('warn', '使用JSON.parse解析失败，尝试使用正则表达式解析', error.message);

    try {
      // 回退方案：使用正则表达式提取键值对
      const result = {};
      // 匹配键值对：支持单引号或双引号
      const keyValueRegex = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"]/g;
      let match;

      while ((match = keyValueRegex.exec(trimmedContent)) !== null) {
        const key = match[1];
        const value = match[2];
        result[key] = value;
      }

      if (Object.keys(result).length > 0) {
        log('info', `使用正则表达式解析成功，提取了 ${Object.keys(result).length} 个键值对`);
        return result;
      }

      throw new Error('无法使用正则表达式解析模块内容');
    } catch (fallbackError) {
      log('error', '无法安全解析模块内容', fallbackError);
      throw new Error(`解析模块内容失败: ${fallbackError.message}`);
    }
  }
}

/**
 * 从 src/dictionaries 目录读取翻译词典
 * @returns {Promise<Object>} 提取的词典对象
 */
async function extractDictionaryFromUserScript() {
  try {
    const fullPath = path.resolve(__dirname, CONFIG.srcDir);
    const files = await fs.readdir(fullPath);
    const dictionary = {};

    for (const file of files) {
      if (file.endsWith('.js') && file !== 'index.js') {
        const moduleName = file.replace('.js', '');
        const filePath = path.join(fullPath, file);
        const content = await fs.readFile(filePath, 'utf8');

        // 匹配 export default 后的对象
        const match = content.match(/export\s+default\s*(\{[\s\S]*?\});?/);
        if (match) {
          try {
            // 解析为对象
            const moduleDict = safeParseModuleContent(match[1]);
            dictionary[moduleName] = moduleDict;
            log(
              'debug',
              `已读取模块 ${moduleName}，包含 ${Object.keys(moduleDict).length} 个字符串`,
            );
          } catch (e) {
            log('warn', `解析模块失败: ${file}`, e);
          }
        }
      }
    }

    log('info', `已从目录中读取 ${Object.keys(dictionary).length} 个模块的词典`);
    return dictionary;
  } catch (error) {
    log('error', '从源文件读取词典失败:', error);
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
    log(
      'info',
      `词典包含 ${formatNumber(Object.keys(dictionary).length)} 个模块，共 ${formatNumber(totalStrings)} 个字符串`,
    );
  } catch (error) {
    log('error', '保存词典到JSON文件失败:', error);
    throw error;
  }
}

/**
 * 创建文件备份
 * @param {string} moduleName - 模块名称
 * @param {string} content - 要备份的文件内容
 * @returns {Promise<string|null>} 备份路径或 null
 */
async function createBackup(moduleName, content) {
  try {
    const backupDir = path.resolve(__dirname, CONFIG.backupDir);
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${moduleName}.js.${timestamp}.bak`);

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
 * 将词典写入到 src/dictionaries 目录
 * @param {Object} dictionary - 要写入的词典对象
 * @returns {Promise<void>}
 */
async function writeDictionaryToUserScript(dictionary) {
  try {
    const fullPath = path.resolve(__dirname, CONFIG.srcDir);

    // 对每个模块更新词典
    for (const moduleName in dictionary) {
      const moduleDict = dictionary[moduleName];
      const filePath = path.join(fullPath, `${moduleName}.js`);

      let originalContent = '';
      try {
        originalContent = await fs.readFile(filePath, 'utf8');
        // 创建备份
        await createBackup(moduleName, originalContent);
      } catch (_e) {
        // 文件可能不存在，没关系
      }

      // 构建新的模块内容
      const newContent = `// ${moduleName}.js
// GitHub i18n 词典模块
// 版本: 1.0.0

export default ${JSON.stringify(moduleDict, null, 2)};
`;

      // 保存更新后的模块
      await fs.writeFile(filePath, newContent, 'utf8');
      log('info', `已更新模块 ${moduleName}，包含 ${Object.keys(moduleDict).length} 个字符串`);
    }

    log('info', `已将词典写入到目录: ${fullPath}`);
  } catch (error) {
    log('error', '将词典写入到源文件失败:', error);
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

    log(
      'info',
      `词典优化完成: 原始 ${originalTotal} 个字符串，优化后 ${optimizedTotal} 个字符串，移除了 ${originalTotal - optimizedTotal} 个重复或无效字符串`,
    );
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
    } catch (_error) {
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
      case 'export': {
        const dictionary = await extractDictionaryFromUserScript();
        const optimizedDictionary = optimizeDictionary(dictionary);
        await saveDictionaryToJson(optimizedDictionary);
        log('info', '词典导出完成');
        break;
      }
      case 'import': {
        const importDictionary = await readDictionaryFromJson();
        await writeDictionaryToUserScript(importDictionary);
        log('info', '词典导入完成');
        break;
      }
      case 'optimize': {
        const currentDictionary = await extractDictionaryFromUserScript();
        const optimized = optimizeDictionary(currentDictionary);
        await writeDictionaryToUserScript(optimized);
        log('info', '词典优化完成');
        break;
      }
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
    console.log('  node dictionary_processor.js export [options]   - 从源文件导出词典到JSON文件');
    console.log('  node dictionary_processor.js import [options]   - 从JSON文件导入词典到源文件');
    console.log('  node dictionary_processor.js optimize [options] - 优化源文件中的词典');
    console.log('');
    console.log('选项:');
    console.log('  --srcDir=path               - 指定源文件目录');
    console.log('  --dictionaryFilePath=path   - 指定词典JSON文件路径');
    console.log('  --logLevel=level            - 设置日志级别 (error, warn, info, debug)');
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
  cli,
};
