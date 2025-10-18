/**
 * GitHub 中文翻译 - 自动字符串更新器
 * 版本: 1.8.23
 * 作者: Sut
 * 功能: 自动从GitHub页面提取并更新未翻译的字符串
 */

class AutoStringUpdater {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      userScriptPath: '../GitHub_zh-CN.user.js',
      backupDir: './backups',
      ignorePatterns: [
        /^https?:\/\//i,
        /^\d+$/, 
        /^[a-fA-F0-9]{6,}$/, // 可能是颜色码
        /^\s*$/ // 空字符串
      ],
      minLength: 2,
      maxLength: 500,
      ...options
    };
    
    this.extractedStrings = new Set();
    this.existingTranslations = new Map();
    this.newStrings = new Set();
    this.logger = new Logger();
    
    // 初始化文件系统模块
    if (typeof window !== 'undefined') {
      // 浏览器环境
      this.isBrowser = true;
    } else {
      // Node.js环境
      this.isBrowser = false;
      // 使用动态方式加载Node.js模块，避免浏览器解析错误
      try {
        // 使用函数包裹require调用，避免浏览器环境中的语法错误
        (function() {
          this.fs = require('fs');
          this.path = require('path');
          this.axios = require('axios').default;
          // 在Node.js环境中引入jsdom来提供DOMParser
          const { JSDOM } = require('jsdom');
          this.DOMParser = new JSDOM().window.DOMParser;
        }).bind(this)();
      } catch (e) {
        console.warn('无法加载Node.js模块:', e.message);
      }
    }
  }
  
  /**
   * 初始化备份目录
   */
  initBackupDir() {
    if (!this.isBrowser) {
      if (!this.fs.existsSync(this.options.backupDir)) {
        this.fs.mkdirSync(this.options.backupDir, { recursive: true });
        this.logger.info(`创建备份目录: ${this.options.backupDir}`);
      }
    }
  }
  
  /**
   * 读取用户脚本文件
   * @returns {Promise<string>}
   */
  async readUserScript() {
    if (this.isBrowser) {
      // 浏览器环境使用fetch
      const response = await fetch(this.options.userScriptPath);
      if (!response.ok) {
        throw new Error(`无法读取文件: ${this.options.userScriptPath}`);
      }
      return await response.text();
    } else {
      // Node.js环境使用fs
      return this.fs.promises.readFile(this.options.userScriptPath, 'utf8');
    }
  }
  
  /**
   * 备份用户脚本
   * @param {string} content - 文件内容
   */
  async backupUserScript(content) {
    if (!this.isBrowser) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = this.path.join(this.options.backupDir, `GitHub_zh-CN.user.js.${timestamp}.bak`);
      await this.fs.promises.writeFile(backupPath, content);
      this.logger.info(`已备份用户脚本到: ${backupPath}`);
    }
  }
  
  /**
   * 解析现有翻译
   * @param {string} scriptContent - 用户脚本内容
   */
  parseExistingTranslations(scriptContent) {
    // 提取translations对象
    const translationsMatch = scriptContent.match(/const\s+translations\s*=\s*(\{[\s\S]*?\});/);
    if (!translationsMatch) {
      this.logger.error('未找到translations对象');
      return;
    }
    
    try {
      const translations = JSON.parse(translationsMatch[1]);
      for (const [key, value] of Object.entries(translations)) {
        this.existingTranslations.set(key, value);
      }
      this.logger.info(`已解析 ${this.existingTranslations.size} 条现有翻译`);
    } catch (error) {
      this.logger.error('解析translations对象失败:', error.message);
    }
  }
  
  /**
   * 从页面提取字符串
   * @param {string} html - HTML内容
   */
  extractStringsFromHtml(html) {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(html, 'text/html');
    
    // 提取可见文本
    const extractTextNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (this._shouldProcessString(text)) {
          this.extractedStrings.add(text);
        }
      }
      
      for (const child of node.childNodes) {
        // 跳过脚本和样式
        if (child.nodeName.toLowerCase() !== 'script' && 
            child.nodeName.toLowerCase() !== 'style') {
          extractTextNodes(child);
        }
      }
    };
    
    extractTextNodes(doc.body);
    this.logger.info(`从页面提取了 ${this.extractedStrings.size} 个字符串`);
  }
  
  /**
   * 检查是否应该处理字符串
   * @private
   * @param {string} str - 要检查的字符串
   * @returns {boolean}
   */
  _shouldProcessString(str) {
    // 检查长度
    if (str.length < this.options.minLength || str.length > this.options.maxLength) {
      return false;
    }
    
    // 检查忽略模式
    for (const pattern of this.options.ignorePatterns) {
      if (pattern.test(str)) {
        return false;
      }
    }
    
    // 检查是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(str)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 查找新字符串
   */
  findNewStrings() {
    for (const str of this.extractedStrings) {
      if (!this.existingTranslations.has(str)) {
        this.newStrings.add(str);
      }
    }
    this.logger.info(`找到 ${this.newStrings.size} 个新字符串`);
  }
  
  /**
   * 生成报告
   * @returns {Object}
   */
  generateReport() {
    return {
      totalExtracted: this.extractedStrings.size,
      totalExisting: this.existingTranslations.size,
      newStrings: Array.from(this.newStrings),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 导出新字符串
   * @param {string} format - 导出格式 (json/csv/txt)
   * @returns {string}
   */
  exportNewStrings(format = 'json') {
    const newStringsArray = Array.from(this.newStrings);
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(newStringsArray, null, 2);
      
      case 'csv':
        return newStringsArray.map(str => `"${str.replace(/"/g, '""')}","待翻译: ${str}"`).join('\n');
      
      case 'txt':
        return newStringsArray.join('\n');
      
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }
  
  /**
   * 保存更新后的用户脚本
   * @param {string} scriptContent - 原始脚本内容
   * @returns {string} 更新后的脚本内容
   */
  updateUserScript(scriptContent) {
    if (this.newStrings.size === 0) {
      return scriptContent;
    }
    
    // 创建新的translations对象
    const newTranslations = { ...Object.fromEntries(this.existingTranslations) };
    
    for (const str of this.newStrings) {
      newTranslations[str] = `待翻译: ${str}`;
    }
    
    // 替换translations对象
    const updatedContent = scriptContent.replace(
      /const\s+translations\s*=\s*(\{[\s\S]*?\});/, 
      `const translations = ${JSON.stringify(newTranslations, null, 2)};`
    );
    
    this.logger.info(`已更新用户脚本，添加了 ${this.newStrings.size} 条新翻译`);
    return updatedContent;
  }
  
  /**
   * 保存文件
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   */
  async saveFile(filePath, content) {
    if (this.isBrowser) {
      // 浏览器环境：创建下载链接
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.path ? this.path.basename(filePath) : 'updated_file.js';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js环境：写入文件
      await this.fs.promises.writeFile(filePath, content);
      this.logger.info(`已保存文件: ${filePath}`);
    }
  }
  
  /**
   * 主执行函数
   */
  async run() {
    try {
      this.logger.info('开始自动字符串更新...');
      
      // 初始化备份目录
      this.initBackupDir();
      
      // 读取用户脚本
      const scriptContent = await this.readUserScript();
      
      // 备份用户脚本
      await this.backupUserScript(scriptContent);
      
      // 解析现有翻译
      this.parseExistingTranslations(scriptContent);
      
      // 从页面提取字符串
      if (typeof document !== 'undefined') {
        this.extractStringsFromHtml(document.documentElement.outerHTML);
      } else {
        this.logger.warn('无法直接访问DOM，需要手动提供HTML内容');
      }
      
      // 查找新字符串
      this.findNewStrings();
      
      // 更新用户脚本
      const updatedContent = this.updateUserScript(scriptContent);
      
      // 保存更新后的脚本
      await this.saveFile(this.options.userScriptPath, updatedContent);
      
      // 生成报告
      const report = this.generateReport();
      this.logger.info('自动字符串更新完成！', report);
      
      return report;
    } catch (error) {
      this.logger.error('执行过程中出错:', error);
      throw error;
    }
  }
}

// 使用来自dictionary_processor.js的Logger类

// 浏览器环境中注册全局变量
if (typeof window !== 'undefined') {
  window.AutoStringUpdater = AutoStringUpdater;
} else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // Node.js环境中导出模块
  module.exports = { AutoStringUpdater };
} else if (typeof global !== 'undefined') {
  // 其他环境
  global.AutoStringUpdater = AutoStringUpdater;
}

// 如果直接运行此脚本
if (typeof require !== 'undefined' && require.main === module) {
  const updater = new AutoStringUpdater();
  updater.run().catch(console.error);
}