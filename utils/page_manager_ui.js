// page_manager_ui.js
// GitHub页面管理界面前端逻辑
// 作者: SutChan
// 版本: 1.8.16

// 添加字符串哈希函数，用于生成唯一ID
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
};

/**
 * 页面管理器UI类
 */
class PageManagerUI {
  constructor() {
    this.pages = [];
    this.currentPageId = null;
    this.init();
  }

  /**
   * 初始化UI组件
   */
  init() {
    // 绑定事件监听
    this.bindEvents();
    
    // 加载页面配置
    this.loadPages();
    
    // 初始化表格
    this.initTable();
  }

  /**
   * 绑定事件处理函数
   */
  bindEvents() {
    // 页面添加按钮事件
    document.getElementById('addPageBtn')?.addEventListener('click', () => this.showAddPageForm());
    
    // 页面编辑按钮事件
    document.getElementById('editPageBtn')?.addEventListener('click', () => this.editSelectedPage());
    
    // 页面删除按钮事件
    document.getElementById('deletePageBtn')?.addEventListener('click', () => this.deleteSelectedPage());
    
    // 启用/禁用按钮事件
    document.getElementById('toggleStatusBtn')?.addEventListener('click', () => this.togglePageStatus());
    
    // 保存页面按钮事件
    document.getElementById('savePageBtn')?.addEventListener('click', () => this.savePage());
    
    // 取消按钮事件
    document.getElementById('cancelPageBtn')?.addEventListener('click', () => this.hidePageForm());
    
    // 字符串采集按钮事件
    document.getElementById('collectStringsBtn')?.addEventListener('click', () => this.collectStrings());
    
    // 全选复选框事件
    document.getElementById('selectAllPages')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
  }

  /**
   * 从本地存储加载页面配置
   */
  async loadPages() {
    try {
      // 尝试从API加载新格式的页面配置
      try {
        const response = await fetch('api/pages.json');
        if (response.ok) {
          const apiPagesData = await response.json();
          
          // 检查是否为数组格式（新格式）
          if (Array.isArray(apiPagesData)) {
            // 合并本地存储的旧格式页面和API的新格式页面
            const pagesData = await window.PageManager.loadPages();
            const localPages = pagesData.pages || [];
            
            // 过滤掉可能重复的页面
            const uniqueApiPages = apiPagesData.filter(apiPage => {
              // 检查是否已经在本地存储中有相同的URL
              return !localPages.some(localPage => localPage.url === apiPage.url);
            });
            
            // 合并页面列表
            this.pages = [...localPages, ...uniqueApiPages];
            this.renderPageTable();
            this.updateStatistics();
            return;
          }
        }
      } catch (apiError) {
        console.warn('加载API页面配置失败，使用本地存储:', apiError);
      }
      
      // 如果API加载失败或不是新格式，则使用PageManager加载本地存储的页面
      const pagesData = await window.PageManager.loadPages();
      this.pages = pagesData.pages || [];
      this.renderPageTable();
      this.updateStatistics();
    } catch (error) {
      this.showNotification('错误', `加载页面配置失败: ${error.message}`, 'error');
      console.error('加载页面配置失败:', error);
    }
  }

  /**
   * 初始化表格
   */
  initTable() {
    const table = document.getElementById('pageTable');
    if (!table) return;
    
    // 设置表格样式
    table.classList.add('w-full', 'border-collapse');
    
    // 添加响应式处理
    window.addEventListener('resize', () => this.handleTableResponsiveness());
    this.handleTableResponsiveness();
  }

  /**
   * 处理表格响应式布局
   */
  handleTableResponsiveness() {
    const tableWrapper = document.getElementById('tableWrapper');
    if (!tableWrapper) return;
    
    if (window.innerWidth < 768) {
      tableWrapper.classList.add('overflow-x-auto');
    } else {
      tableWrapper.classList.remove('overflow-x-auto');
    }
  }

  /**
   * 渲染页面表格
   */
  renderPageTable() {
    const tbody = document.getElementById('pageTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    this.pages.forEach(page => {
      // 确定是否为新格式 (url, selector, module)
      const isNewFormat = page.url && (page.selector || page.selectors);
      
      // 为新格式页面生成唯一ID用于DOM操作
      const pageId = isNewFormat ? `page_${page.url.hashCode()}` : page.id;
      
      const row = document.createElement('tr');
      row.className = page.enabled !== false ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 hover:bg-gray-200';
      row.dataset.pageId = pageId;
      
      // 点击行时选中页面
      row.addEventListener('click', (e) => {
        if (!e.target.closest('input[type="checkbox"]')) {
          this.selectPage(pageId);
        }
      });
      
      // 获取选择器显示内容
      const selectorDisplay = isNewFormat ? 
        (page.selector || page.selectors?.join(', ') || 'body') : 
        (page.selectors?.join(', ') || 'body');
      
      // 获取页面名称显示内容
      const nameDisplay = isNewFormat ? 
        (page.name || page.url.split('/').filter(Boolean).pop() || '未命名页面') : 
        page.name;
      
      // 获取URL/模式显示内容
      const urlDisplay = isNewFormat ? page.url : page.pattern;
      
      // 获取模块信息
      const moduleInfo = page.module ? ` (${page.module})` : '';
      
      // 构建表格行内容
      row.innerHTML = `
        <td class="border px-4 py-2">
          <input type="checkbox" class="page-checkbox" value="${pageId}">
        </td>
        <td class="border px-4 py-2">${pageId}</td>
        <td class="border px-4 py-2">${nameDisplay}${moduleInfo}</td>
        <td class="border px-4 py-2 max-w-xs overflow-hidden text-ellipsis">
          <span title="${urlDisplay}">${urlDisplay}</span>
        </td>
        <td class="border px-4 py-2">${selectorDisplay}</td>
        <td class="border px-4 py-2">${page.priority || 0}</td>
        <td class="border px-4 py-2">
          <span class="inline-block px-2 py-1 text-xs rounded-full ${page.enabled !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
            ${page.enabled !== false ? '启用' : '禁用'}
          </span>
        </td>
        <td class="border px-4 py-2">
          <button class="edit-btn px-2 py-1 text-blue-600 hover:text-blue-800" ${isNewFormat ? 'disabled title="不支持编辑新格式页面"' : ''}>
            ${isNewFormat ? '查看' : '编辑'}
          </button>
          <button class="delete-btn px-2 py-1 text-red-600 hover:text-red-800">删除</button>
        </td>
      `;
      
      // 绑定行内按钮事件
      row.querySelector('.edit-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isNewFormat) {
          this.editPage(pageId);
        }
      });
      
      row.querySelector('.delete-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deletePage(pageId);
      });
      
      row.querySelector('.page-checkbox')?.addEventListener('change', (e) => {
        e.stopPropagation();
        if (e.target.checked) {
          this.selectPage(pageId);
        } else {
          this.deselectPage(pageId);
        }
      });
      
      tbody.appendChild(row);
    });
    
    // 更新选中状态
    this.updateSelectionState();
  }

  /**
   * 选中页面
   */
  selectPage(pageId) {
    this.currentPageId = pageId;
    this.updateSelectionState();
  }

  /**
   * 取消选中页面
   */
  deselectPage(pageId) {
    if (this.currentPageId === pageId) {
      this.currentPageId = null;
      this.updateSelectionState();
    }
  }

  /**
   * 更新选中状态显示
   */
  updateSelectionState() {
    // 更新表格行选中样式
    document.querySelectorAll('#pageTableBody tr').forEach(row => {
      if (row.dataset.pageId === this.currentPageId) {
        row.classList.add('bg-blue-50', 'border-blue-200');
        row.querySelector('.page-checkbox')?.setAttribute('checked', 'checked');
      } else {
        row.classList.remove('bg-blue-50', 'border-blue-200');
        row.querySelector('.page-checkbox')?.removeAttribute('checked');
      }
    });
    
    // 更新按钮状态
    const hasSelection = !!this.currentPageId;
    document.getElementById('editPageBtn')?.classList.toggle('disabled', !hasSelection);
    document.getElementById('deletePageBtn')?.classList.toggle('disabled', !hasSelection);
    document.getElementById('toggleStatusBtn')?.classList.toggle('disabled', !hasSelection);
  }

  /**
   * 切换全选状态
   */
  toggleSelectAll(checked) {
    if (checked && this.pages.length > 0) {
      // 全选时只选中第一个
      this.selectPage(this.pages[0].id);
    } else {
      this.deselectPage(this.currentPageId);
    }
  }

  /**
   * 显示添加页面表单
   */
  showAddPageForm() {
    this.resetPageForm();
    document.getElementById('pageFormTitle').textContent = '添加新页面';
    document.getElementById('pageForm').style.display = 'block';
    document.getElementById('pageName').focus();
  }

  /**
   * 编辑选中的页面
   */
  editSelectedPage() {
    if (this.currentPageId) {
      this.editPage(this.currentPageId);
    }
  }

  /**
   * 编辑指定ID的页面
   */
  async editPage(pageId) {
    // 查找页面 - 同时考虑新旧格式
    const page = this.pages.find(p => {
      if (p.url) {
        return `page_${p.url.hashCode()}` === pageId;
      }
      return p.id === pageId;
    });
    
    if (!page) {
      this.showNotification('错误', '未找到页面', 'error');
      return;
    }
    
    // 检查是否为新格式页面
    if (page.url) {
      // 新格式页面不允许编辑
      this.showNotification('提示', '新格式页面不支持编辑', 'info');
      return;
    }
    
    // 填充表单
    document.getElementById('pageId').value = page.id;
    document.getElementById('pageName').value = page.name;
    document.getElementById('pagePattern').value = page.pattern || '';
    document.getElementById('pageSelectors').value = (page.selectors || ['body']).join(', ');
    document.getElementById('pagePriority').value = page.priority || 0;
    document.getElementById('pageEnabled').checked = page.enabled !== false;
    
    // 显示表单
    document.getElementById('pageFormTitle').textContent = '编辑页面';
    document.getElementById('pageForm').style.display = 'block';
    document.getElementById('pageName').focus();
  }

  /**
   * 删除选中的页面
   */
  deleteSelectedPage() {
    if (this.currentPageId) {
      this.deletePage(this.currentPageId);
    }
  }

  /**
   * 删除指定ID的页面
   */
  async deletePage(pageId) {
    // 找出要删除的页面对象
    const pageToDelete = this.pages.find(page => {
      // 检查是否为新格式页面
      if (page.url) {
        return `page_${page.url.hashCode()}` === pageId;
      }
      return page.id === pageId;
    });
    
    if (!pageToDelete) return;
    
    if (confirm(`确定要删除页面 "${pageToDelete.name}" 吗？`)) {
      // 过滤掉要删除的页面
      this.pages = this.pages.filter(page => {
        if (page.url) {
          return `page_${page.url.hashCode()}` !== pageId;
        }
        return page.id !== pageId;
      });
      
      // 保存到本地存储
      await this.savePagesToServer();
      this.currentPageId = null;
      this.renderPageTable();
      this.updateStatistics();
      this.showNotification('成功', '页面删除成功', 'success');
    }
  }

  /**
   * 切换页面启用状态
   */
  togglePageStatus() {
    if (!this.currentPageId) return;
    
    const page = this.pages.find(p => p.id === this.currentPageId);
    if (page) {
      page.enabled = !page.enabled;
      this.savePagesToServer();
      this.renderPageTable();
      this.updateStatistics();
      this.showNotification('成功', `页面已${page.enabled ? '启用' : '禁用'}`, 'success');
    }
  }

  /**
   * 重置页面表单
   */
  resetPageForm() {
    document.getElementById('pageId').value = '';
    document.getElementById('pageName').value = '';
    document.getElementById('pagePattern').value = '';
    document.getElementById('pageSelectors').value = 'body';
    document.getElementById('pagePriority').value = 0;
    document.getElementById('pageEnabled').checked = true;
  }

  /**
   * 隐藏页面表单
   */
  hidePageForm() {
    document.getElementById('pageForm').style.display = 'none';
    this.resetPageForm();
  }

  /**
   * 验证页面表单
   */
  validatePageForm() {
    const name = document.getElementById('pageName').value.trim();
    const pattern = document.getElementById('pagePattern').value.trim();
    
    if (!name) {
      this.showNotification('错误', '页面名称不能为空', 'error');
      document.getElementById('pageName').focus();
      return false;
    }
    
    if (!pattern) {
      this.showNotification('错误', 'URL模式不能为空', 'error');
      document.getElementById('pagePattern').focus();
      return false;
    }
    
    return true;
  }

  /**
   * 保存页面
   */
  async savePage() {
    if (!this.validatePageForm()) return;
    
    const id = document.getElementById('pageId').value.trim();
    const name = document.getElementById('pageName').value.trim();
    const pattern = document.getElementById('pagePattern').value.trim();
    const selectorsInput = document.getElementById('pageSelectors').value.trim();
    const priority = parseInt(document.getElementById('pagePriority').value) || 0;
    const enabled = document.getElementById('pageEnabled').checked;
    
    // 处理选择器数组
    const selectors = selectorsInput ? selectorsInput.split(',').map(s => s.trim()) : ['body'];
    
    // 检查ID是否存在，如果不存在则生成新ID
    let pageId = id;
    if (!pageId) {
      // 生成新ID：使用名称的驼峰命名 + 时间戳
      pageId = name.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-') + '-' + Date.now();
    }
    
    // 创建或更新页面对象
    const pageIndex = this.pages.findIndex(p => p.id === pageId);
    const page = {
      id: pageId,
      name,
      pattern,
      selectors,
      priority,
      enabled
    };
    
    // 更新页面列表
    if (pageIndex >= 0) {
      this.pages[pageIndex] = page;
    } else {
      this.pages.push(page);
    }
    
    // 保存到服务器
    if (await this.savePagesToServer()) {
      this.renderPageTable();
      this.updateStatistics();
      this.hidePageForm();
      this.showNotification('成功', pageIndex >= 0 ? '页面已更新' : '页面已添加', 'success');
    }
  }

  /**
   * 保存页面配置到本地存储
   */
  async savePagesToServer() {
    try {
      // 使用PageManager模块保存页面数据
      await window.PageManager.savePages({ pages: this.pages });
      return true;
    } catch (error) {
      this.showNotification('错误', `保存页面配置失败: ${error.message}`, 'error');
      console.error('保存页面配置失败:', error);
      return false;
    }
  }

  /**
   * 执行字符串采集
   */
  async collectStrings() {
    const enabledPages = this.pages.filter(page => page.enabled);
    
    if (enabledPages.length === 0) {
      this.showNotification('提示', '请先启用至少一个页面', 'info');
      return;
    }
    
    if (!confirm(`确定要从 ${enabledPages.length} 个已启用的页面采集字符串吗？这可能需要一些时间。`)) {
      return;
    }
    
    // 显示进度条
    const progressContainer = document.getElementById('collectionProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressContainer) {
      progressContainer.style.display = 'block';
      progressBar.style.width = '0%';
      progressText.textContent = '开始采集...';
    }
    
    try {
      // 在实际项目中，这里应该调用后端API执行采集
      // 这里我们只是模拟采集过程
      let successCount = 0;
      let failedCount = 0;
      let totalStrings = 0;
      
      for (let i = 0; i < enabledPages.length; i++) {
        const page = enabledPages[i];
        
        // 更新进度
        const progress = Math.round(((i + 1) / enabledPages.length) * 100);
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `正在采集: ${page.name} (${i + 1}/${enabledPages.length})`;
        
        // 模拟采集延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟采集结果
        const randomResult = Math.random();
        if (randomResult > 0.2) { // 80%成功率
          successCount++;
          totalStrings += Math.floor(Math.random() * 50) + 10; // 随机10-60个字符串
        } else {
          failedCount++;
        }
      }
      
      // 显示完成消息
      this.showNotification(
        '采集完成', 
        `成功: ${successCount}, 失败: ${failedCount}, 总计字符串: ${totalStrings}`, 
        'success'
      );
    } catch (error) {
      this.showNotification('错误', `字符串采集失败: ${error.message}`, 'error');
      console.error('字符串采集失败:', error);
    } finally {
      // 隐藏进度条
      setTimeout(() => {
        if (progressContainer) progressContainer.style.display = 'none';
      }, 2000);
    }
  }

  /**
   * 更新统计信息
   */
  updateStatistics() {
    const totalCount = this.pages.length;
    const enabledCount = this.pages.filter(p => p.enabled !== false).length;
    const disabledCount = totalCount - enabledCount;
    
    // 更新单个统计元素的内容，而不是替换整个结构
    document.getElementById('totalPages')?.textContent = totalCount;
    document.getElementById('enabledPages')?.textContent = enabledCount;
    document.getElementById('disabledPages')?.textContent = disabledCount;
    
    // 更新选中页面计数
    const selectedCount = this.pages.filter(p => {
      const pageId = p.url ? `page_${p.url.hashCode()}` : p.id;
      return pageId === this.currentPageId;
    }).length;
    document.getElementById('selectedPages')?.textContent = selectedCount;
  }

  /**
   * 显示通知
   */
  showNotification(title, message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">×</button>
    `;
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 添加关闭事件
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    });
    
    // 自动关闭
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

/**
 * 初始化页面管理器
 * @param {boolean} autoLoad - 是否自动加载页面数据
 */
function initPageManager(autoLoad = true) {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const ui = new PageManagerUI();
      if (!autoLoad) {
        ui.resetPageForm();
        ui.hidePageForm();
      }
    });
  } else {
    const ui = new PageManagerUI();
    if (!autoLoad) {
      ui.resetPageForm();
      ui.hidePageForm();
    }
  }
}

// 浏览器环境下的导出和初始化
if (typeof window !== 'undefined') {
  window.PageManagerUI = PageManagerUI;
  window.initPageManager = initPageManager;
  
  // 不自动初始化，而是在页面管理选项卡被激活时初始化
  // 这样可以避免在不需要时加载资源
  // 如果需要立即初始化，可以调用 initPageManager()
} else {
  // 为可能的Node.js环境提供基本导出
  try {
    module.exports = {
      PageManagerUI,
      initPageManager
    };
  } catch (e) {
    // 忽略导出错误
  }
}
