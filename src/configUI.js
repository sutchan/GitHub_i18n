/**
 * GitHub 中文翻译配置界面模块
 * @file configUI.js
 * @version 1.8.172
 * @date 2025-06-17
 * @author Sut
 * @description 提供用户友好的配置界面，允许用户调整插件参数
 */

import { CONFIG } from './config.js';
import { utils } from './utils.js';

class ConfigUI {
  constructor() {
    this.config = CONFIG;
    this.userConfig = {};
    this.isOpen = false;
    this.container = null;
    this.settings = this.loadUserSettings();
    this.isPageUnloading = false;
    this.eventListeners = [];
    
    // 设置页面卸载处理
    this.setupPageUnloadHandler();
  }

  /**
   * 从本地存储加载用户配置
   * @returns {Object} 用户配置对象
   */
  loadUserSettings() {
    try {
      const saved = localStorage.getItem('github-i18n-config');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('[GitHub 中文翻译] 加载用户配置失败:', error);
      return {};
    }
  }

  /**
   * 设置页面卸载处理
   */
  setupPageUnloadHandler() {
    const handlePageUnload = () => {
      this.isPageUnloading = true;
      this.cleanup();
    };
    
    // 监听多种页面卸载事件
    window.addEventListener('beforeunload', handlePageUnload, { once: true });
    window.addEventListener('unload', handlePageUnload, { once: true });
    window.addEventListener('pagehide', handlePageUnload, { once: true });
  }

  /**
   * 添加事件监听器并记录
   * @param {Element} element - 目标元素
   * @param {string} event - 事件类型
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 事件选项
   */
  addTrackedEventListener(element, event, handler, options = {}) {
    if (!element || this.isPageUnloading) return;
    
    element.addEventListener(event, handler, options);
    this.eventListeners.push({ element, event, handler, options });
  }

  /**
   * 清理所有事件监听器
   */
  cleanupEventListeners() {
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        console.warn('[GitHub 中文翻译] 移除事件监听器失败:', error);
      }
    });
    this.eventListeners = [];
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 关闭配置界面
    if (this.isOpen && this.container) {
      try {
        if (document.body.contains(this.container)) {
          document.body.removeChild(this.container);
        }
      } catch (error) {
        console.warn('[GitHub 中文翻译] 移除配置界面失败:', error);
      }
      this.isOpen = false;
    }
    
    // 清理事件监听器
    this.cleanupEventListeners();
    
    // 清理DOM引用
    this.container = null;
  }

  /**
   * 保存用户配置到本地存储
   * @param {Object} settings - 用户配置对象
   */
  saveUserSettings(settings) {
    try {
      localStorage.setItem('github-i18n-config', JSON.stringify(settings));
      this.userConfig = { ...settings };
      // 合并用户配置到当前配置
      this.mergeUserConfig();
    } catch (error) {
      console.error('[GitHub 中文翻译] 保存用户配置失败:', error);
    }
  }

  /**
   * 合并用户配置到默认配置
   */
  mergeUserConfig() {
    // 递归合并配置
    const merge = (target, source) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
      return target;
    };

    merge(CONFIG, this.userConfig);
  }

  /**
   * 创建配置界面元素
   */
  createUI() {
    if (this.container) return;

    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'github-i18n-config-container';
    
    // 使用安全的DOM操作方法创建界面元素，替代innerHTML
    const configPanel = document.createElement('div');
    configPanel.className = 'github-i18n-config-panel';
    
    // 创建头部
    const header = document.createElement('div');
    header.className = 'github-i18n-config-header';
    
    const title = document.createElement('h3');
    title.textContent = 'GitHub 中文翻译配置';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'github-i18n-config-close';
    closeBtn.textContent = '×';
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'github-i18n-config-content';
    
    // 基本设置部分
    const basicSection = this.createConfigSection('基本设置', [
      {
        type: 'checkbox',
        id: 'github-i18n-debug-mode',
        label: '启用调试模式',
        checked: this.config.debugMode
      },
      {
        type: 'checkbox',
        id: 'github-i18n-enable-partial-match',
        label: '启用部分匹配',
        checked: this.config.performance.enablePartialMatch
      }
    ]);
    
    // 更新设置部分
    const updateSection = this.createConfigSection('更新设置', [
      {
        type: 'checkbox',
        id: 'github-i18n-auto-update',
        label: '自动检查更新',
        checked: this.config.updateCheck.enabled
      }
    ]);
    
    // 性能设置部分
    const performanceSection = this.createConfigSection('性能设置', [
      {
        type: 'checkbox',
        id: 'github-i18n-translation-cache',
        label: '启用翻译缓存',
        checked: this.config.performance.enableTranslationCache
      },
      {
        type: 'checkbox',
        id: 'github-i18n-virtual-dom',
        label: '启用虚拟DOM优化',
        checked: this.config.performance.enableVirtualDom
      }
    ]);
    
    // 性能监控部分
    const monitoringSection = this.createPerformanceMonitoringSection();
    
    // 组装内容区域
    content.appendChild(basicSection);
    content.appendChild(updateSection);
    content.appendChild(performanceSection);
    content.appendChild(monitoringSection);
    
    // 创建底部
    const footer = document.createElement('div');
    footer.className = 'github-i18n-config-footer';
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'github-i18n-config-reset';
    resetBtn.textContent = '重置默认';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'github-i18n-config-save';
    saveBtn.textContent = '保存配置';
    
    footer.appendChild(resetBtn);
    footer.appendChild(saveBtn);
    
    // 组装面板
    configPanel.appendChild(header);
    configPanel.appendChild(content);
    configPanel.appendChild(footer);
    
    // 添加面板到容器
    this.container.appendChild(configPanel);

    // 添加样式
    this.addStyles();

    // 添加事件监听器
    this.addEventListeners();
  }

  /**
   * 创建配置区域
   * @param {string} title - 区域标题
   * @param {Array} items - 配置项数组
   * @returns {HTMLElement} 配置区域元素
   */
  createConfigSection(title, items) {
    const section = document.createElement('div');
    section.className = 'github-i18n-config-section';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);
    
    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'github-i18n-config-item';
      
      const label = document.createElement('label');
      label.className = 'github-i18n-config-label';
      
      const input = document.createElement('input');
      input.type = item.type;
      input.id = item.id;
      if (item.checked !== undefined) {
        input.checked = item.checked;
      }
      
      const textNode = document.createTextNode(item.label);
      
      label.appendChild(input);
      label.appendChild(textNode);
      itemDiv.appendChild(label);
      section.appendChild(itemDiv);
    });
    
    return section;
  }

  /**
   * 创建性能监控区域
   * @returns {HTMLElement} 性能监控区域元素
   */
  createPerformanceMonitoringSection() {
    const section = document.createElement('div');
    section.className = 'github-i18n-config-section';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = '性能监控';
    section.appendChild(sectionTitle);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'github-i18n-config-content';
    
    const statsContainer = document.createElement('div');
    statsContainer.id = 'github-i18n-performance-stats';
    
    // 基本统计数据
    const basicStats = [
      { label: '总耗时:', id: 'github-i18n-stat-duration' },
      { label: '元素处理:', id: 'github-i18n-stat-elements' },
      { label: '文本翻译:', id: 'github-i18n-stat-texts' },
      { label: '缓存命中率:', id: 'github-i18n-stat-cache-rate' }
    ];
    
    basicStats.forEach(stat => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'github-i18n-config-item';
      
      const label = document.createElement('span');
      label.className = 'github-i18n-config-label';
      label.textContent = stat.label;
      
      const value = document.createElement('span');
      value.id = stat.id;
      value.textContent = '-';
      
      itemDiv.appendChild(label);
      itemDiv.appendChild(value);
      statsContainer.appendChild(itemDiv);
    });
    
    // 高级统计数据
    const advancedStatsDiv = document.createElement('div');
    advancedStatsDiv.className = 'github-i18n-advanced-stats';
    
    const advancedStats = [
      { label: '缓存命中:', id: 'github-i18n-stat-cache-hits' },
      { label: '缓存未命中:', id: 'github-i18n-stat-cache-misses' },
      { label: 'DOM操作:', id: 'github-i18n-stat-dom' },
      { label: '网络请求:', id: 'github-i18n-stat-network' },
      { label: '批处理次数:', id: 'github-i18n-stat-batches' }
    ];
    
    advancedStats.forEach(stat => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'github-i18n-config-item';
      
      const label = document.createElement('span');
      label.className = 'github-i18n-config-label';
      label.textContent = stat.label;
      
      const value = document.createElement('span');
      value.id = stat.id;
      value.textContent = '-';
      
      itemDiv.appendChild(label);
      itemDiv.appendChild(value);
      advancedStatsDiv.appendChild(itemDiv);
    });
    
    statsContainer.appendChild(advancedStatsDiv);
    
    // 操作按钮
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'github-i18n-config-actions';
    
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'github-i18n-config-save';
    refreshBtn.id = 'github-i18n-refresh-stats';
    refreshBtn.textContent = '刷新性能数据';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'github-i18n-config-reset';
    exportBtn.id = 'github-i18n-export-stats';
    exportBtn.textContent = '导出性能数据';
    
    actionsDiv.appendChild(refreshBtn);
    actionsDiv.appendChild(exportBtn);
    
    statsContainer.appendChild(actionsDiv);
    contentDiv.appendChild(statsContainer);
    section.appendChild(contentDiv);
    
    return section;
  }

  /**
   * 添加配置界面样式
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .github-i18n-config-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
      }
      
      .github-i18n-config-panel {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      }
      
      .github-i18n-config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background-color: #f6f8fa;
        border-bottom: 1px solid #e1e4e8;
      }
      
      .github-i18n-config-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #24292e;
      }
      
      .github-i18n-config-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #586069;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      
      .github-i18n-config-close:hover {
        background-color: #e1e4e8;
      }
      
      .github-i18n-config-content {
        padding: 20px;
        max-height: calc(80vh - 120px);
        overflow-y: auto;
      }
      
      .github-i18n-config-section {
        margin-bottom: 24px;
      }
      
      .github-i18n-config-section h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #24292e;
      }
      
      .github-i18n-config-item {
        margin-bottom: 12px;
      }
      
      .github-i18n-config-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 14px;
        color: #24292e;
      }
      
      .github-i18n-config-label input[type="checkbox"] {
        margin-right: 8px;
      }
      
      .github-i18n-config-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 20px;
        background-color: #f6f8fa;
        border-top: 1px solid #e1e4e8;
      }
      
      .github-i18n-config-footer button {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s ease;
      }
      
      .github-i18n-config-reset {
        background-color: #f6f8fa;
        color: #24292e;
        border-color: #e1e4e8;
      }
      
      .github-i18n-config-reset:hover {
        background-color: #e1e4e8;
      }
      
      .github-i18n-config-save {
        background-color: #2ea44f;
        color: white;
        border-color: #2ea44f;
      }
      
      .github-i18n-config-save:hover {
        background-color: #2c974b;
      }
      
      /* GitHub 风格按钮 */
      .github-i18n-toggle-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #24292e;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .github-i18n-toggle-btn:hover {
        background-color: #30363d;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 更新性能统计数据显示
   */
  updatePerformanceStats() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    // 从translationCore获取性能数据
    if (window.translationCore && window.translationCore.getPerformanceStats) {
      const stats = window.translationCore.getPerformanceStats();
      
      // 更新基本统计
      const durationEl = document.getElementById('github-i18n-stat-duration');
      if (durationEl) durationEl.textContent = `${stats.totalDuration} ms`;
      
      const elementsEl = document.getElementById('github-i18n-stat-elements');
      if (elementsEl) elementsEl.textContent = stats.elementsProcessed;
      
      const textsEl = document.getElementById('github-i18n-stat-texts');
      if (textsEl) textsEl.textContent = stats.textsTranslated;
      
      const cacheRateEl = document.getElementById('github-i18n-stat-cache-rate');
      if (cacheRateEl) cacheRateEl.textContent = `${stats.cacheHitRate}%`;
      
      // 更新高级统计
      const cacheHitsEl = document.getElementById('github-i18n-stat-cache-hits');
      if (cacheHitsEl) cacheHitsEl.textContent = stats.cacheHits;
      
      const cacheMissesEl = document.getElementById('github-i18n-stat-cache-misses');
      if (cacheMissesEl) cacheMissesEl.textContent = stats.cacheMisses;
      
      const domEl = document.getElementById('github-i18n-stat-dom');
      if (domEl) domEl.textContent = stats.domOperations;
      
      const networkEl = document.getElementById('github-i18n-stat-network');
      if (networkEl) networkEl.textContent = stats.networkRequests;
      
      const batchesEl = document.getElementById('github-i18n-stat-batches');
      if (batchesEl) batchesEl.textContent = stats.batchCount;
    }
  }

  /**
   * 导出性能数据为JSON文件
   */
  exportPerformanceData() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    if (window.translationCore && window.translationCore.exportPerformanceData) {
      const data = window.translationCore.exportPerformanceData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `github-i18n-performance-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListeners() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    // 关闭按钮
    const closeBtn = this.container.querySelector('.github-i18n-config-close');
    if (closeBtn) {
      this.addTrackedEventListener(closeBtn, 'click', () => {
        this.close();
      });
    }

    // 保存按钮
    const saveBtn = this.container.querySelector('.github-i18n-config-save');
    if (saveBtn) {
      this.addTrackedEventListener(saveBtn, 'click', () => {
        this.saveConfig();
      });
    }

    // 重置按钮
    const resetBtn = this.container.querySelector('.github-i18n-config-reset');
    if (resetBtn) {
      this.addTrackedEventListener(resetBtn, 'click', () => {
        this.resetConfig();
      });
    }

    // 点击遮罩关闭
    this.addTrackedEventListener(this.container, 'click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
    
    // 性能监控按钮
    const refreshBtn = document.getElementById('github-i18n-refresh-stats');
    if (refreshBtn) {
      this.addTrackedEventListener(refreshBtn, 'click', () => {
        this.updatePerformanceStats();
      });
    }
    
    const exportBtn = document.getElementById('github-i18n-export-stats');
    if (exportBtn) {
      this.addTrackedEventListener(exportBtn, 'click', () => {
        this.exportPerformanceData();
      });
    }
  }

  /**
   * 保存当前配置
   */
  saveConfig() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    const debugModeEl = document.getElementById('github-i18n-debug-mode');
    const partialMatchEl = document.getElementById('github-i18n-enable-partial-match');
    const translationCacheEl = document.getElementById('github-i18n-translation-cache');
    const virtualDomEl = document.getElementById('github-i18n-virtual-dom');
    const autoUpdateEl = document.getElementById('github-i18n-auto-update');
    
    const newConfig = {
      debugMode: debugModeEl ? debugModeEl.checked : this.config.debugMode,
      performance: {
        enablePartialMatch: partialMatchEl ? partialMatchEl.checked : this.config.performance.enablePartialMatch,
        enableTranslationCache: translationCacheEl ? translationCacheEl.checked : this.config.performance.enableTranslationCache,
        enableVirtualDom: virtualDomEl ? virtualDomEl.checked : this.config.performance.enableVirtualDom
      },
      updateCheck: {
        enabled: autoUpdateEl ? autoUpdateEl.checked : this.config.updateCheck.enabled
      }
    };

    this.saveUserSettings(newConfig);
    this.close();
  }

  /**
   * 重置配置为默认值
   */
  resetConfig() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    if (confirm('确定要重置所有配置为默认值吗？')) {
      localStorage.removeItem('github-i18n-config');
      this.userConfig = {};
      this.mergeUserConfig();
      this.close();
      // 重新打开界面以显示默认值
      this.open();
    }
  }

  /**
   * 打开配置界面
   */
  open() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    if (!this.container) {
      this.createUI();
    }

    // 更新界面值
    const debugModeEl = document.getElementById('github-i18n-debug-mode');
    if (debugModeEl) debugModeEl.checked = this.config.debugMode;
    
    const partialMatchEl = document.getElementById('github-i18n-enable-partial-match');
    if (partialMatchEl) partialMatchEl.checked = this.config.performance.enablePartialMatch;
    
    const translationCacheEl = document.getElementById('github-i18n-translation-cache');
    if (translationCacheEl) translationCacheEl.checked = this.config.performance.enableTranslationCache;
    
    const virtualDomEl = document.getElementById('github-i18n-virtual-dom');
    if (virtualDomEl) virtualDomEl.checked = this.config.performance.enableVirtualDom;
    
    const autoUpdateEl = document.getElementById('github-i18n-auto-update');
    if (autoUpdateEl) autoUpdateEl.checked = this.config.updateCheck.enabled;
    
    // 更新性能统计数据
    this.updatePerformanceStats();

    document.body.appendChild(this.container);
    this.isOpen = true;
  }

  /**
   * 关闭配置界面
   */
  close() {
    if (this.container && this.isOpen && document.body.contains(this.container)) {
      document.body.removeChild(this.container);
      this.isOpen = false;
    }
  }

  /**
   * 创建切换按钮
   */
  createToggleButton() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'github-i18n-toggle-btn';
    // 使用安全的DOM操作方法替代innerHTML
    toggleBtn.textContent = '⚙️';
    toggleBtn.title = 'GitHub 中文翻译配置';
    
    this.addTrackedEventListener(toggleBtn, 'click', () => {
      this.open();
    });

    document.body.appendChild(toggleBtn);
  }

  /**
   * 初始化配置界面
   */
  init() {
    // 检查页面是否正在卸载
    if (this.isPageUnloading) return;
    
    // 合并用户配置
    this.mergeUserConfig();
    
    // 创建切换按钮
    if (document.body) {
      this.createToggleButton();
    } else {
      // 如果body还没加载完成，等DOM加载完成后再创建
      document.addEventListener('DOMContentLoaded', () => {
        this.createToggleButton();
      });
    }
  }
}

// 导出配置界面实例
export const configUI = new ConfigUI();
