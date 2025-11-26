// page_manager.js
// GitHub页面管理模块
// 作者: SutChan
// 版本: 1.8.16

// 配置 - 浏览器兼容版本
const CONFIG = {
  pagesFilePath: 'api/pages.json',
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  storageKey: 'github_i18n_pages' // localStorage键名
};

/**
 * 统一日志处理函数
 */
function log(level, message, details = null) {
  // 根据日志级别过滤
  const levels = ['debug', 'info', 'warn', 'error'];
  if (levels.indexOf(level) < levels.indexOf(CONFIG.logLevel)) {
    return;
  }

  let logMessage = `[${level.toUpperCase()}] ${message}`;

  if (details) {
    if (details instanceof Error) {
      logMessage += `
错误详情: ${details.message}
${details.stack}`;
    } else if (typeof details === 'object') {
      try {
        logMessage += `
详细信息: ${JSON.stringify(details, null, 2)}`;
      } catch (e) {
        logMessage += `
详细信息: [对象序列化失败]`;
      }
    } else {
      logMessage += `
详细信息: ${details}`;
    }
  }

  if (level === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
}

/**
 * 验证页面配置对象的有效性
 * @param {Object} page - 页面配置对象
 * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
 */
function validatePage(page) {
  const errors = [];

  // 支持两种格式：
  // 1. 旧格式：id, name, pattern, selectors
  // 2. 新格式：url, selector, module

  // 检查是否是新格式 (url, selector, module)
  const isNewFormat = page.url && (page.selector || page.selectors);

  if (isNewFormat) {
    // 新格式验证
    if (typeof page.url !== 'string' || page.url.trim() === '') {
      errors.push('页面URL不能为空');
    }

    if (!page.selector && (!Array.isArray(page.selectors) || page.selectors.length === 0)) {
      errors.push('页面选择器不能为空');
    }

    if (page.module && typeof page.module !== 'string') {
      errors.push('模块名称必须是字符串');
    }
  } else {
    // 旧格式验证
    if (!page.id || typeof page.id !== 'string' || page.id.trim() === '') {
      errors.push('页面ID不能为空');
    }

    if (!page.name || typeof page.name !== 'string' || page.name.trim() === '') {
      errors.push('页面名称不能为空');
    }

    if (!page.pattern || typeof page.pattern !== 'string' || page.pattern.trim() === '') {
      errors.push('页面模式不能为空');
    }

    if (!Array.isArray(page.selectors) || page.selectors.length === 0) {
      errors.push('页面选择器必须是非空数组');
    }

    // 检查正则表达式是否有效
    try {
      new RegExp(page.pattern);
    } catch (e) {
      errors.push(`无效的正则表达式: ${page.pattern}`);
    }
  }

  // 两种格式都需要的字段验证
  if (page.priority !== undefined && (typeof page.priority !== 'number' || isNaN(page.priority))) {
    errors.push('优先级必须是数字');
  }

  if (page.enabled !== undefined && typeof page.enabled !== 'boolean') {
    errors.push('启用状态必须是布尔值');
  }

  return {
    isValid: errors.length === 0,
    errors,
    isNewFormat // 返回是否为新格式，便于其他函数处理
  };
}

/**
 * 加载页面配置 (浏览器版本 - 使用localStorage)
 * @returns {Promise<Object>} 页面配置对象
 */
async function loadPages() {
  try {
    const data = localStorage.getItem(CONFIG.storageKey);
    if (!data) {
      log('warn', '本地存储中没有页面配置，使用空配置');
      return { pages: [] };
    }

    const pagesData = JSON.parse(data);

    // 确保返回标准格式
    if (!pagesData.pages || !Array.isArray(pagesData.pages)) {
      log('warn', '页面配置格式不正确，使用空页面配置');
      return { pages: [] };
    }

    log('info', `成功加载 ${pagesData.pages.length} 个页面配置`);
    return pagesData;
  } catch (error) {
    log('error', '加载页面配置失败', error);
    return { pages: [] };
  }
}

/**
 * 保存页面配置 (浏览器版本 - 使用localStorage)
 * @param {Object} pagesData - 页面配置对象
 * @returns {Promise<void>}
 */
async function savePages(pagesData) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(pagesData, null, 2));
    log('info', `成功保存 ${pagesData.pages.length} 个页面配置到本地存储`);
  } catch (error) {
    log('error', '保存页面配置失败', error);
    throw error;
  }
}

/**
 * 获取所有页面配置
 * @returns {Promise<Array>} 页面配置数组
 */
async function getAllPages() {
  const pagesData = await loadPages();
  return pagesData.pages;
}

/**
 * 根据ID获取页面配置
 * @param {string} pageId - 页面ID
 * @returns {Promise<Object|null>} 页面配置对象或null
 */
async function getPageById(pageId) {
  const pagesData = await loadPages();
  return pagesData.pages.find(page => page.id === pageId) || null;
}

/**
 * 添加新页面
 * @param {Object} page - 页面配置对象
 * @returns {Promise<Object>} 添加结果 { success: boolean, message: string, page?: Object }
 */
async function addPage(page) {
  // 验证页面配置
  const validation = validatePage(page);
  if (!validation.isValid) {
    return {
      success: false,
      message: `页面配置验证失败: ${validation.errors.join(', ')}`
    };
  }

  try {
    const pagesData = await loadPages();

    // 检查ID是否已存在
    if (pagesData.pages.some(p => p.id === page.id)) {
      return {
        success: false,
        message: `页面ID '${page.id}' 已存在`
      };
    }

    // 设置默认值
    const newPage = {
      ...page,
      priority: page.priority ?? 100,
      enabled: page.enabled ?? true
    };

    // 添加页面
    pagesData.pages.push(newPage);
    await savePages(pagesData);

    return {
      success: true,
      message: '页面添加成功',
      page: newPage
    };
  } catch (error) {
    log('error', '添加页面失败', error);
    return {
      success: false,
      message: `添加页面失败: ${error.message}`
    };
  }
}

/**
 * 更新页面配置
 * @param {string} pageId - 页面ID
 * @param {Object} updates - 更新的配置
 * @returns {Promise<Object>} 更新结果 { success: boolean, message: string, page?: Object }
 */
async function updatePage(pageId, updates) {
  try {
    const pagesData = await loadPages();

    // 查找页面索引 - 只处理旧格式页面
    const pageIndex = pagesData.pages.findIndex(p => {
      // 跳过新格式页面 (有url字段的)
      if (p.url) return false;
      return p.id === pageId;
    });

    if (pageIndex === -1) {
      return {
        success: false,
        message: `页面ID '${pageId}' 不存在或不支持更新`
      };
    }

    // 合并更新
    const updatedPage = { ...pagesData.pages[pageIndex], ...updates };

    // 验证更新后的配置
    const validation = validatePage(updatedPage);
    if (!validation.isValid) {
      return {
        success: false,
        message: `页面配置验证失败: ${validation.errors.join(', ')}`
      };
    }

    // 如果更新了ID，检查新ID是否已存在
    if (updates.id && updates.id !== pageId &&
      pagesData.pages.some(p => {
        // 只检查旧格式页面的ID冲突
        if (p.url) return false;
        return p.id === updates.id && p.id !== pageId;
      })) {
      return {
        success: false,
        message: `页面ID '${updates.id}' 已存在`
      };
    }

    // 更新页面
    pagesData.pages[pageIndex] = updatedPage;
    await savePages(pagesData);

    return {
      success: true,
      message: '页面更新成功',
      page: updatedPage
    };
  } catch (error) {
    log('error', '更新页面失败', error);
    return {
      success: false,
      message: `更新页面失败: ${error.message}`
    };
  }
}

/**
 * 删除页面
 * @param {string} pageId - 页面ID
 * @returns {Promise<Object>} 删除结果 { success: boolean, message: string }
 */
async function deletePage(pageId) {
  try {
    const pagesData = await loadPages();
    const initialLength = pagesData.pages.length;

    // 过滤掉要删除的页面
    pagesData.pages = pagesData.pages.filter(page => page.id !== pageId);

    if (pagesData.pages.length === initialLength) {
      return {
        success: false,
        message: `页面ID '${pageId}' 不存在`
      };
    }

    await savePages(pagesData);

    return {
      success: true,
      message: '页面删除成功'
    };
  } catch (error) {
    log('error', '删除页面失败', error);
    return {
      success: false,
      message: `删除页面失败: ${error.message}`
    };
  }
}

/**
 * 切换页面启用状态
 * @param {string} pageId - 页面ID
 * @returns {Promise<Object>} 切换结果 { success: boolean, message: string, enabled?: boolean }
 */
async function togglePageStatus(pageId) {
  try {
    const pagesData = await loadPages();
    const page = pagesData.pages.find(p => p.id === pageId);

    if (!page) {
      return {
        success: false,
        message: `页面ID '${pageId}' 不存在`
      };
    }

    // 切换启用状态
    page.enabled = !page.enabled;
    await savePages(pagesData);

    return {
      success: true,
      message: `页面已${page.enabled ? '启用' : '禁用'}`,
      enabled: page.enabled
    };
  } catch (error) {
    log('error', '切换页面状态失败', error);
    return {
      success: false,
      message: `切换页面状态失败: ${error.message}`
    };
  }
}

/**
 * 按模块获取页面
 * @param {string} module - 模块名称
 * @returns {Promise<Array>} 页面配置数组
 */
async function getPagesByModule(module) {
  const pagesData = await loadPages();
  return pagesData.pages.filter(page => page.module === module);
}

/**
 * 搜索页面
 * @param {string} query - 搜索关键词
 * @returns {Promise<Array>} 匹配的页面配置数组
 */
async function searchPages(query) {
  const pagesData = await loadPages();
  const lowercaseQuery = query.toLowerCase();

  return pagesData.pages.filter(page =>
    page.id.toLowerCase().includes(lowercaseQuery) ||
    page.name.toLowerCase().includes(lowercaseQuery) ||
    (page.module && page.module.toLowerCase().includes(lowercaseQuery)) ||
    page.pattern.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * 导入页面配置数据
 * @param {Array|Object} importData - 导入的页面数据，可以是数组或包含pages数组的对象
 * @param {Object} options - 导入选项
 * @param {boolean} options.merge - 是否合并现有数据 (true) 或替换 (false)
 * @returns {Promise<Object>} 导入结果 { success: boolean, message: string, importedCount: number, skippedCount: number }
 */
async function importPages(importData, options = { merge: true }) {
  try {
    // 验证并规范化导入数据格式
    let pagesToImport;
    if (Array.isArray(importData)) {
      pagesToImport = importData;
    } else if (importData && importData.pages && Array.isArray(importData.pages)) {
      pagesToImport = importData.pages;
    } else {
      return {
        success: false,
        message: '导入数据格式不正确，必须是页面数组或包含pages数组的对象',
        importedCount: 0,
        skippedCount: 0
      };
    }

    // 获取现有页面数据
    let pagesData = await loadPages();
    let existingPages = options.merge ? [...pagesData.pages] : [];
    let importedCount = 0;
    let skippedCount = 0;

    // 创建用于检测重复的映射
    const existingPageIds = new Set();
    const existingUrls = new Set();
    
    existingPages.forEach(page => {
      if (page.id) existingPageIds.add(page.id);
      if (page.url) existingUrls.add(page.url);
    });

    // 导入页面数据
    for (const page of pagesToImport) {
      // 验证页面数据
      const validation = validatePage(page);
      if (!validation.isValid) {
        log('warn', `跳过无效页面: ${validation.errors.join(', ')}`, page);
        skippedCount++;
        continue;
      }

      // 检查是否重复
      let isDuplicate = false;
      
      if (page.id && existingPageIds.has(page.id)) {
        isDuplicate = true;
      } else if (page.url && existingUrls.has(page.url)) {
        isDuplicate = true;
      }

      if (isDuplicate) {
        if (options.merge) {
          // 找到并更新现有页面
          const existingIndex = existingPages.findIndex(p => 
            p.id === page.id || p.url === page.url
          );
          
          if (existingIndex !== -1) {
            // 合并页面数据，保留现有页面的某些属性
            const existingPage = existingPages[existingIndex];
            const updatedPage = {
              ...existingPage,
              ...page,
              // 保留原始的enabled状态（除非明确提供）
              enabled: page.enabled !== undefined ? page.enabled : existingPage.enabled
            };
            existingPages[existingIndex] = updatedPage;
            log('info', `更新现有页面: ${page.id || page.url}`);
          }
        } else {
          // 替换模式下，跳过重复页面
          skippedCount++;
          continue;
        }
      } else {
        // 添加新页面
        const newPage = {
          ...page,
          priority: page.priority ?? 100,
          enabled: page.enabled ?? true
        };
        
        existingPages.push(newPage);
        existingPageIds.add(newPage.id);
        existingUrls.add(newPage.url);
        importedCount++;
        log('info', `导入新页面: ${newPage.id || newPage.url}`);
      }
    }

    // 保存更新后的页面数据
    pagesData.pages = existingPages;
    await savePages(pagesData);

    return {
      success: true,
      message: `成功导入 ${importedCount} 个页面，更新 ${skippedCount} 个页面`,
      importedCount,
      updatedCount: skippedCount
    };
  } catch (error) {
    log('error', '导入页面配置失败', error);
    return {
      success: false,
      message: `导入失败: ${error.message}`,
      importedCount: 0,
      skippedCount: 0
    };
  }
}

// 在浏览器环境中导出
if (typeof window !== 'undefined') {
  window.PageManager = {
    CONFIG,
    loadPages,
    savePages,
    getAllPages,
    getPageById,
    addPage,
    updatePage,
    deletePage,
    togglePageStatus,
    getPagesByModule,
    searchPages,
    validatePage,
    log,
    importPages
  };
} else {
  // 为可能的Node.js环境提供一个基本导出
  const PageManager = {
    CONFIG,
    loadPages,
    savePages,
    getAllPages,
    getPageById,
    addPage,
    updatePage,
    deletePage,
    togglePageStatus,
    getPagesByModule,
    searchPages,
    validatePage,
    log,
    importPages
  };

  try {
    module.exports = PageManager;
  } catch (e) {
    // 忽略导出错误
  }
}
