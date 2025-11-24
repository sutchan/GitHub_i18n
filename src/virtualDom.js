/**
 * 虚拟DOM模块
 * @file virtualDom.js
 * @version 1.8.172
 * @date 2025-06-17
 * @author Sut
 * @description 用于跟踪已翻译元素的状态，避免重复翻译和不必要的DOM操作
 */
import { CONFIG } from './config.js';

/**
 * 虚拟DOM节点类
 * 表示一个DOM元素的虚拟映射，包含其状态和内容哈希
 */
class VirtualNode {
  /**
   * 构造函数
   * @param {HTMLElement} element - 对应的真实DOM元素
   */
  constructor(element) {
    this.element = element;
    this.elementId = null;
    this.contentHash = null;
    this.isTranslated = false;
    this.attributes = new Map();
    this.childNodes = new Map();
    this.lastUpdated = Date.now();
    
    // 初始化节点
    this.initialize();
  }
  
  /**
   * 初始化虚拟节点
   */
  initialize() {
    try {
      // 生成唯一标识符
      this.generateId();
      
      // 计算内容哈希
      this.updateContentHash();
      
      // 记录属性状态
      this.updateAttributes();
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 初始化虚拟节点失败:', error);
      }
    }
  }
  
  /**
   * 生成唯一标识符
   */
  generateId() {
    try {
      // 优先使用元素ID
      if (this.element.id) {
        this.elementId = `id:${this.element.id}`;
      } else if (this.element.dataset && this.element.dataset.testid) {
        // 使用testid
        this.elementId = `testid:${this.element.dataset.testid}`;
      } else {
        // 生成临时ID
        this.elementId = `temp:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        // 保存到元素上用于跟踪
        this.element.dataset.virtualDomId = this.elementId;
      }
    } catch (error) {
      // 生成最基本的ID
      this.elementId = `fallback:${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  /**
   * 更新内容哈希
   * @returns {string} 内容哈希值
   */
  updateContentHash() {
    try {
      const content = this.element.textContent || '';
      this.contentHash = this.hashString(content);
      return this.contentHash;
    } catch (error) {
      this.contentHash = null;
      return null;
    }
  }
  
  /**
   * 更新属性状态
   */
  updateAttributes() {
    try {
      // 只跟踪重要属性
      const importantAttrs = CONFIG.performance.importantAttributes || [];
      
      importantAttrs.forEach(attrName => {
        if (this.element.hasAttribute(attrName)) {
          this.attributes.set(attrName, this.element.getAttribute(attrName));
        } else {
          this.attributes.delete(attrName);
        }
      });
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 更新属性状态失败:', error);
      }
    }
  }
  
  /**
   * 检查内容是否发生变化
   * @returns {boolean} 是否变化
   */
  hasContentChanged() {
    const newHash = this.updateContentHash();
    return newHash !== this.contentHash;
  }
  
  /**
   * 检查属性是否发生变化
   * @returns {boolean} 是否变化
   */
  hasAttributesChanged() {
    const originalAttributes = new Map(this.attributes);
    this.updateAttributes();
    
    // 检查是否有变化
    if (originalAttributes.size !== this.attributes.size) {
      return true;
    }
    
    // 检查每个属性的值
    for (const [key, value] of originalAttributes) {
      if (!this.attributes.has(key) || this.attributes.get(key) !== value) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 标记为已翻译
   */
  markAsTranslated() {
    this.isTranslated = true;
    this.lastUpdated = Date.now();
    // 更新实际DOM元素上的标记
    try {
      this.element.dataset.githubZhTranslated = 'true';
    } catch (error) {
      // 忽略错误
    }
  }
  
  /**
   * 重置翻译状态
   */
  resetTranslation() {
    this.isTranslated = false;
    this.lastUpdated = Date.now();
    // 移除实际DOM元素上的标记
    try {
      delete this.element.dataset.githubZhTranslated;
    } catch (error) {
      // 忽略错误
    }
  }
  
  /**
   * 简单的字符串哈希函数
   * @param {string} str - 要哈希的字符串
   * @returns {string} 哈希值
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }
}

/**
 * 虚拟DOM管理器
 * 负责管理所有虚拟节点，提供查找、更新和清理功能
 */
class VirtualDomManager {
  /**
   * 构造函数
   */
  constructor() {
    this.nodes = new Map();
    this.nodeCache = new Map(); // 快速查找缓存
    this.lastCleanupTime = Date.now();
    this.cleanupInterval = 60000; // 1分钟清理一次
    
    // 自动清理定时器
    this.cleanupTimer = null;
    this.startAutoCleanup();
  }
  
  /**
   * 为元素获取或创建虚拟节点
   * @param {HTMLElement} element - DOM元素
   * @returns {VirtualNode|null} 虚拟节点
   */
  getOrCreateNode(element) {
    try {
      // 先尝试从缓存查找
      if (element.dataset && element.dataset.virtualDomId) {
        const cachedNode = this.nodeCache.get(element.dataset.virtualDomId);
        if (cachedNode && cachedNode.element === element) {
          return cachedNode;
        }
      }
      
      // 创建新节点
      const node = new VirtualNode(element);
      this.nodes.set(node.elementId, node);
      this.nodeCache.set(node.elementId, node);
      
      return node;
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 获取或创建虚拟节点失败:', error);
      }
      return null;
    }
  }
  
  /**
   * 通过ID查找虚拟节点
   * @param {string} elementId - 元素ID
   * @returns {VirtualNode|null} 虚拟节点
   */
  findNodeById(elementId) {
    return this.nodes.get(elementId) || null;
  }
  
  /**
   * 检查元素是否需要翻译
   * @param {HTMLElement} element - 要检查的元素
   * @returns {boolean} 是否需要翻译
   */
  shouldTranslate(element) {
    try {
      const node = this.getOrCreateNode(element);
      
      if (!node) {
        return true; // 如果无法创建虚拟节点，默认需要翻译
      }
      
      // 检查内容是否变化
      const contentChanged = node.hasContentChanged();
      // 检查属性是否变化
      const attributesChanged = node.hasAttributesChanged();
      
      // 如果内容或属性变化，需要重新翻译
      if (contentChanged || attributesChanged) {
        node.resetTranslation();
        return true;
      }
      
      // 如果已经翻译过且内容没有变化，不需要再次翻译
      if (node.isTranslated) {
        return false;
      }
      
      // 其他情况需要翻译
      return true;
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 检查翻译状态失败:', error);
      }
      // 出错时默认需要翻译
      return true;
    }
  }
  
  /**
   * 标记元素为已翻译
   * @param {HTMLElement} element - 已翻译的元素
   */
  markElementAsTranslated(element) {
    try {
      const node = this.getOrCreateNode(element);
      if (node) {
        node.markAsTranslated();
      }
    } catch (error) {
      // 忽略错误
    }
  }
  
  /**
   * 批量处理元素
   * @param {NodeList|Array} elements - 要处理的元素列表
   * @returns {Array} 需要翻译的元素列表
   */
  processElements(elements) {
    const elementsToTranslate = [];
    
    try {
      elements.forEach(element => {
        if (this.shouldTranslate(element)) {
          elementsToTranslate.push(element);
        }
      });
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 批量处理元素失败:', error);
      }
      // 出错时返回原始元素列表
      elementsToTranslate.push(...elements);
    }
    
    return elementsToTranslate;
  }
  
  /**
   * 开始自动清理
   */
  startAutoCleanup() {
    this.stopAutoCleanup();
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
  
  /**
   * 停止自动清理
   */
  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  /**
   * 清理无效的虚拟节点
   */
  cleanup() {
    try {
      const now = Date.now();
      const nodesToRemove = [];
      
      // 检查每个节点
      for (const [id, node] of this.nodes) {
        // 检查元素是否仍然存在于DOM中
        if (!document.contains(node.element)) {
          nodesToRemove.push(id);
        } else if (now - node.lastUpdated > 3600000) { // 1小时未更新
          // 对于长时间未更新的节点，重新检查
          if (!node.element || !document.contains(node.element)) {
            nodesToRemove.push(id);
          }
        }
      }
      
      // 删除无效节点
      nodesToRemove.forEach(id => {
        this.nodes.delete(id);
        this.nodeCache.delete(id);
      });
      
      this.lastCleanupTime = now;
      
      if (CONFIG.debugMode && nodesToRemove.length > 0) {
        console.log(`[GitHub 中文翻译] 清理了${nodesToRemove.length}个无效的虚拟节点`);
      }
    } catch (error) {
      if (CONFIG.debugMode) {
        console.error('[GitHub 中文翻译] 清理虚拟DOM失败:', error);
      }
    }
  }
  
  /**
   * 清空所有虚拟节点
   */
  clear() {
    this.nodes.clear();
    this.nodeCache.clear();
    this.lastCleanupTime = Date.now();
  }
  
  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      nodeCount: this.nodes.size,
      lastCleanupTime: this.lastCleanupTime
    };
  }
}

// 创建单例实例
const virtualDomManager = new VirtualDomManager();

export default virtualDomManager;
export { VirtualNode, VirtualDomManager };