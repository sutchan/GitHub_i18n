/**
 * GitHub 中文翻译 - 自动字符串更新器
 * @version 1.8.24
 * @description 自动检测和更新翻译词典中的字符串
 * @author Sut (https://github.com/sutchan)
 */

class AutoStringUpdater {
  constructor() {
    this.translationModule = {};
    this.newStrings = new Set();
    this.removedStrings = new Set();
  }

  /**
   * 设置翻译模块引用
   * @param {Object} module - 翻译模块对象
   */
  setTranslationModule(module) {
    this.translationModule = module;
  }

  /**
   * 从页面收集新字符串
   * @returns {Set<string>} 收集到的新字符串集合
   */
  collectNewStrings() {
    const collected = new Set();

    // 递归收集文本节点
    const collectTextNodes = (node, result) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text && text.length > 2 && /[a-zA-Z]/.test(text)) {
          result.add(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 跳过某些元素
        const skipTags = ['script', 'style', 'noscript', 'svg', 'canvas', 'input', 'textarea'];
        const skipClasses = ['language-', 'muted-link', 'text-gray-', 'markdown-body'];

        const tagName = node.tagName.toLowerCase();
        const className = node.className || '';

        if (skipTags.includes(tagName) ||
          skipClasses.some(cls => className.includes(cls)) ||
          node.hasAttribute('data-skip-translation')) {
          return;
        }

        // 递归处理子节点
        for (const child of node.childNodes) {
          collectTextNodes(child, result);
        }
      }
    };

    // 从body开始收集
    collectTextNodes(document.body, collected);
    this.newStrings = collected;

    return collected;
  }

  /**
   * 查找需要添加的字符串
   * @returns {Set<string>} 需要添加的新字符串集合
   */
  findStringsToAdd() {
    const toAdd = new Set();
    const allTranslations = {};

    // 合并所有翻译模块
    for (const module in this.translationModule) {
      Object.assign(allTranslations, this.translationModule[module]);
    }

    // 查找未在翻译中的新字符串
    for (const str of this.newStrings) {
      if (!allTranslations[str] || allTranslations[str].startsWith('待翻译: ')) {
        toAdd.add(str);
      }
    }

    return toAdd;
  }

  /**
   * 查找需要移除的字符串
   * @returns {Set<string>} 需要移除的字符串集合
   */
  findStringsToRemove() {
    const toRemove = new Set();
    const allTranslations = {};

    // 合并所有翻译模块
    for (const module in this.translationModule) {
      Object.assign(allTranslations, this.translationModule[module]);
    }

    // 检查是否所有翻译字符串都在当前页面存在
    for (const str in allTranslations) {
      if (!this.newStrings.has(str) && !allTranslations[str].startsWith('待翻译: ')) {
        toRemove.add(str);
      }
    }

    return toRemove;
  }

  /**
   * 生成更新报告
   * @returns {Object} 更新报告对象
   */
  generateUpdateReport() {
    const stringsToAdd = this.findStringsToAdd();
    const stringsToRemove = this.findStringsToRemove();

    return {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      stringsToAdd: Array.from(stringsToAdd),
      stringsToRemove: Array.from(stringsToRemove),
      totalNew: stringsToAdd.size,
      totalRemoved: stringsToRemove.size,
      summary: `找到 ${stringsToAdd.size} 个新字符串， ${stringsToRemove.size} 个可能不再使用的字符串`
    };
  }

  /**
   * 执行自动更新
   * @param {boolean} dryRun - 是否为模拟运行，不实际修改
   * @returns {Object} 更新结果
   */
  async runUpdate(dryRun = true) {
    try {
      this.collectNewStrings();
      const report = this.generateUpdateReport();

      if (!dryRun) {
        // 实际更新逻辑将在扩展中实现
        console.log('[GitHub 中文翻译] 自动更新已执行，但在用户脚本模式下不进行实际修改');
        console.log('[GitHub 中文翻译] 请使用扩展版本进行实际更新操作');
      }

      return {
        success: true,
        dryRun,
        report
      };
    } catch (error) {
      console.error('[GitHub 中文翻译] 自动更新失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导出更新建议为JSON
   * @returns {string} JSON格式的更新建议
   */
  exportUpdateSuggestions() {
    const report = this.generateUpdateReport();

    // 为新字符串创建翻译模板
    const suggestedTranslations = {};
    for (const str of report.stringsToAdd) {
      suggestedTranslations[str] = `待翻译: ${str}`;
    }

    const exportData = {
      ...report,
      suggestedTranslations
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 在控制台显示更新报告
   */
  showReportInConsole() {
    const report = this.generateUpdateReport();

    console.log('[GitHub 中文翻译] 字符串更新报告');
    console.log(`📄 页面: ${report.pageTitle}`);
    console.log(`🔗 URL: ${report.pageUrl}`);
    console.log(`📊 ${report.summary}`);

    if (report.stringsToAdd.length > 0) {
      console.log('\n✅ 需要添加的新字符串:');
      report.stringsToAdd.slice(0, 20).forEach((str, i) => {
        console.log(`${i + 1}. ${str}`);
      });
      if (report.stringsToAdd.length > 20) {
        console.log(`... 还有 ${report.stringsToAdd.length - 20} 个字符串`);
      }
    }

    if (report.stringsToRemove.length > 0) {
      console.log('\n❌ 可能不再使用的字符串:');
      report.stringsToRemove.slice(0, 20).forEach((str, i) => {
        console.log(`${i + 1}. ${str}`);
      });
      if (report.stringsToRemove.length > 20) {
        console.log(`... 还有 ${report.stringsToRemove.length - 20} 个字符串`);
      }
    }
  }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = AutoStringUpdater;
} else if (typeof window !== 'undefined') {
  // 在浏览器环境中，挂载到全局对象
  window.AutoStringUpdater = AutoStringUpdater;
} else if (typeof global !== 'undefined') {
  // 在Node.js环境但module.exports不可用的情况
  global.AutoStringUpdater = AutoStringUpdater;
}
