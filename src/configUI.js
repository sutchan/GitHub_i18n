/**
 * GitHub 中文翻译配置界面模块
 * 提供用户友好的配置界面，允许用户调整插件参数
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
        this.container.innerHTML = `
      <div class="github-i18n-config-panel">
        <div class="github-i18n-config-header">
          <h3>GitHub 中文翻译配置</h3>
          <button class="github-i18n-config-close">×</button>
        </div>
        <div class="github-i18n-config-content">
          <div class="github-i18n-config-section">
            <h4>基本设置</h4>
            <div class="github-i18n-config-item">
              <label class="github-i18n-config-label">
                <input type="checkbox" id="github-i18n-debug-mode" ${this.config.debugMode ? 'checked' : ''}>
                启用调试模式
              </label>
            </div>
            <div class="github-i18n-config-item">
              <label class="github-i18n-config-label">
                <input type="checkbox" id="github-i18n-enable-partial-match" ${this.config.performance.enablePartialMatch ? 'checked' : ''}>
                启用部分匹配
              </label>
            </div>
          </div>
          
          <div class="github-i18n-config-section">
            <h4>更新设置</h4>
            <div class="github-i18n-config-item">
              <label class="github-i18n-config-label">
                <input type="checkbox" id="github-i18n-auto-update" ${this.config.updateCheck.enabled ? 'checked' : ''}>
                自动检查更新
              </label>
            </div>
          </div>
          
          <div class="github-i18n-config-section">
            <h4>性能设置</h4>
            <div class="github-i18n-config-item">
              <label class="github-i18n-config-label">
                <input type="checkbox" id="github-i18n-translation-cache" ${this.config.performance.enableTranslationCache ? 'checked' : ''}>
                启用翻译缓存
              </label>
            </div>
            <div class="github-i18n-config-item">
              <label class="github-i18n-config-label">
                <input type="checkbox" id="github-i18n-virtual-dom" ${this.config.performance.enableVirtualDom ? 'checked' : ''}>
                启用虚拟DOM优化
              </label>
            </div>
          </div>
          
          <div class="github-i18n-config-section">
            <h4>性能监控</h4>
            <div class="github-i18n-config-content">
              <div id="github-i18n-performance-stats">
                <div class="github-i18n-config-item">
                  <span class="github-i18n-config-label">总耗时:</span>
                  <span id="github-i18n-stat-duration">-</span>
                </div>
                <div class="github-i18n-config-item">
                  <span class="github-i18n-config-label">元素处理:</span>
                  <span id="github-i18n-stat-elements">-</span>
                </div>
                <div class="github-i18n-config-item">
                  <span class="github-i18n-config-label">文本翻译:</span>
                  <span id="github-i18n-stat-texts">-</span>
                </div>
                <div class="github-i18n-config-item">
                  <span class="github-i18n-config-label">缓存命中率:</span>
                  <span id="github-i18n-stat-cache-rate">-</span>
                </div>
                <div class="github-i18n-advanced-stats">
                  <div class="github-i18n-config-item">
                    <span class="github-i18n-config-label">缓存命中:</span>
                    <span id="github-i18n-stat-cache-hits">-</span>
                  </div>
                  <div class="github-i18n-config-item">
                    <span class="github-i18n-config-label">缓存未命中:</span>
                    <span id="github-i18n-stat-cache-misses">-</span>
                  </div>
                  <div class="github-i18n-config-item">
                    <span class="github-i18n-config-label">DOM操作:</span>
                    <span id="github-i18n-stat-dom">-</span>
                  </div>
                  <div class="github-i18n-config-item">
                    <span class="github-i18n-config-label">网络请求:</span>
                    <span id="github-i18n-stat-network">-</span>
                  </div>
                  <div class="github-i18n-config-item">
                    <span class="github-i18n-config-label">批处理次数:</span>
                    <span id="github-i18n-stat-batches">-</span>
                  </div>
                </div>
                <div class="github-i18n-config-actions">
                  <button class="github-i18n-config-save" id="github-i18n-refresh-stats">刷新性能数据</button>
                  <button class="github-i18n-config-reset" id="github-i18n-export-stats">导出性能数据</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="github-i18n-config-footer">
          <button class="github-i18n-config-reset">重置默认</button>
          <button class="github-i18n-config-save">保存配置</button>
        </div>
      </div>
    `;

    // 添加样式
    this.addStyles();

    // 添加事件监听器
    this.addEventListeners();
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
    // 从translationCore获取性能数据
    if (window.translationCore && window.translationCore.getPerformanceStats) {
      const stats = window.translationCore.getPerformanceStats();
      
      // 更新基本统计
      document.getElementById('github-i18n-stat-duration').textContent = `${stats.totalDuration} ms`;
      document.getElementById('github-i18n-stat-elements').textContent = stats.elementsProcessed;
      document.getElementById('github-i18n-stat-texts').textContent = stats.textsTranslated;
      document.getElementById('github-i18n-stat-cache-rate').textContent = `${stats.cacheHitRate}%`;
      
      // 更新高级统计
      document.getElementById('github-i18n-stat-cache-hits').textContent = stats.cacheHits;
      document.getElementById('github-i18n-stat-cache-misses').textContent = stats.cacheMisses;
      document.getElementById('github-i18n-stat-dom').textContent = stats.domOperations;
      document.getElementById('github-i18n-stat-network').textContent = stats.networkRequests;
      document.getElementById('github-i18n-stat-batches').textContent = stats.batchCount;
    }
  }

  /**
   * 导出性能数据为JSON文件
   */
  exportPerformanceData() {
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
    // 关闭按钮
    this.container.querySelector('.github-i18n-config-close').addEventListener('click', () => {
      this.close();
    });

    // 保存按钮
    this.container.querySelector('.github-i18n-config-save').addEventListener('click', () => {
      this.saveConfig();
    });

    // 重置按钮
    this.container.querySelector('.github-i18n-config-reset').addEventListener('click', () => {
      this.resetConfig();
    });

    // 点击遮罩关闭
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
    
    // 性能监控按钮
    document.getElementById('github-i18n-refresh-stats').addEventListener('click', () => {
      this.updatePerformanceStats();
    });
    
    document.getElementById('github-i18n-export-stats').addEventListener('click', () => {
      this.exportPerformanceData();
    });
  }

  /**
   * 保存当前配置
   */
  saveConfig() {
    const newConfig = {
      debugMode: document.getElementById('github-i18n-debug-mode').checked,
      performance: {
        enablePartialMatch: document.getElementById('github-i18n-enable-partial-match').checked,
        enableTranslationCache: document.getElementById('github-i18n-translation-cache').checked,
        enableVirtualDom: document.getElementById('github-i18n-virtual-dom').checked
      },
      updateCheck: {
        enabled: document.getElementById('github-i18n-auto-update').checked
      }
    };

    this.saveUserSettings(newConfig);
    this.close();
  }

  /**
   * 重置配置为默认值
   */
  resetConfig() {
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
    if (!this.container) {
      this.createUI();
    }

    // 更新界面值
    document.getElementById('github-i18n-debug-mode').checked = this.config.debugMode;
    document.getElementById('github-i18n-enable-partial-match').checked = this.config.performance.enablePartialMatch;
    document.getElementById('github-i18n-translation-cache').checked = this.config.performance.enableTranslationCache;
    document.getElementById('github-i18n-virtual-dom').checked = this.config.performance.enableVirtualDom;
    document.getElementById('github-i18n-auto-update').checked = this.config.updateCheck.enabled;
    
    // 更新性能统计数据
    this.updatePerformanceStats();

    document.body.appendChild(this.container);
    this.isOpen = true;
  }

  /**
   * 关闭配置界面
   */
  close() {
    if (this.container && this.isOpen) {
      document.body.removeChild(this.container);
      this.isOpen = false;
    }
  }

  /**
   * 创建切换按钮
   */
  createToggleButton() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'github-i18n-toggle-btn';
    toggleBtn.innerHTML = '⚙️';
    toggleBtn.title = 'GitHub 中文翻译配置';
    toggleBtn.addEventListener('click', () => {
      this.open();
    });

    document.body.appendChild(toggleBtn);
  }

  /**
   * 初始化配置界面
   */
  init() {
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
