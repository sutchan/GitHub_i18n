// github_page_collector.js
// 用于从GitHub网站收集主要页面URL并更新页面配置文件
// 作者: SutChan
// 版本: 1.8.16

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const https = require('https');

// 配置
const CONFIG = {
  pagesFilePath: path.resolve(__dirname, 'api', 'pages.json'),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  httpTimeout: 30000,
  maxRetries: 3,
  retryDelay: 2000,
  baseUrl: 'https://github.com'
};

/**
 * 统一日志处理函数
 */
function log(level, message, details = null) {
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

/**
 * 休眠函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 下载网页内容
 */
async function downloadPage(url, retryCount = 0) {
  try {
    // 验证URL格式
    try {
      new URL(url);
    } catch (e) {
      throw new Error(`URL格式无效: ${url}`);
    }

    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': CONFIG.userAgent
        },
        timeout: CONFIG.httpTimeout
      };

      const req = https.get(url, options, (res) => {
        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).href;
          log('info', `重定向: ${url} -> ${redirectUrl}`);
          req.destroy();
          downloadPage(redirectUrl, retryCount).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          const error = new Error(`请求失败: ${url}, 状态码: ${res.statusCode}`);
          if (retryCount < CONFIG.maxRetries) {
            log('info', `请求失败，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
            req.destroy();
            setTimeout(() => {
              downloadPage(url, retryCount + 1).then(resolve).catch(reject);
            }, CONFIG.retryDelay);
          } else {
            reject(error);
          }
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            const data = Buffer.concat(chunks).toString('utf8');
            log('info', `成功下载 ${url}`);
            resolve(data);
          } catch (encodingError) {
            reject(new Error(`解析响应内容失败: ${encodingError.message}`));
          }
        });
      });

      req.on('error', (e) => {
        const error = new Error(`请求错误: ${url}, 错误: ${e.message}`);
        if (retryCount < CONFIG.maxRetries) {
          log('info', `请求错误，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
          setTimeout(() => {
            downloadPage(url, retryCount + 1).then(resolve).catch(reject);
          }, CONFIG.retryDelay);
        } else {
          reject(error);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        const error = new Error(`请求超时: ${url} (${CONFIG.httpTimeout}ms)`);
        if (retryCount < CONFIG.maxRetries) {
          log('info', `请求超时，${CONFIG.retryDelay}ms后重试 (${retryCount + 1}/${CONFIG.maxRetries})`);
          setTimeout(() => {
            downloadPage(url, retryCount + 1).then(resolve).catch(reject);
          }, CONFIG.retryDelay);
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    log('error', `下载页面时发生错误: ${url}`, error);
    throw error;
  }
}

/**
 * 从HTML中提取链接
 */
function extractLinks(html, baseUrl) {
  try {
    const { window } = new JSDOM(html);
    const document = window.document;
    const links = new Set();
    
    // 提取所有a标签的链接
    const aTags = document.querySelectorAll('a[href]');
    aTags.forEach(tag => {
      const href = tag.getAttribute('href');
      if (href) {
        try {
          // 构建完整URL
          const fullUrl = new URL(href, baseUrl).href;
          // 只保留GitHub域名的链接
          if (fullUrl.startsWith('https://github.com/')) {
            links.add(fullUrl);
          }
        } catch (e) {
          // 忽略无效URL
        }
      }
    });
    
    window.close();
    return Array.from(links);
  } catch (error) {
    log('error', `提取链接时发生错误: ${error.message}`, error);
    return [];
  }
}

/**
 * 分类页面并分配模块
 */
function categorizePage(url) {
  const pathname = new URL(url).pathname;
  const pathParts = pathname.split('/').filter(Boolean);
  
  // 根据路径模式确定模块
  if (pathname === '/') {
    return { url, selector: 'body', module: 'global' };
  } else if (pathname.startsWith('/settings')) {
    return { url, selector: 'body', module: 'settings' };
  } else if (pathname.startsWith('/notifications')) {
    return { url, selector: 'body', module: 'notifications' };
  } else if (pathname.startsWith('/search')) {
    return { url, selector: 'body', module: 'search' };
  } else if (pathname.startsWith('/explore')) {
    return { url, selector: 'body', module: 'explore' };
  } else if (pathname.startsWith('/codespaces')) {
    return { url, selector: 'body', module: 'codespaces' };
  } else if (pathname.startsWith('/pulls')) {
    return { url, selector: 'body', module: 'pullRequests' };
  } else if (pathname.startsWith('/issues')) {
    return { url, selector: 'body', module: 'issues' };
  } else if (pathname.startsWith('/actions')) {
    return { url, selector: 'body', module: 'actions' };
  } else if (pathname.startsWith('/security')) {
    return { url, selector: 'body', module: 'security' };
  } else if (pathname.startsWith('/projects')) {
    return { url, selector: 'body', module: 'projects' };
  } else if (pathname.startsWith('/marketplace')) {
    return { url, selector: 'body', module: 'marketplace' };
  } else if (pathParts.length >= 2 && !pathParts[1].includes('.')) {
    // 识别仓库页面，但排除文件路径
    if (pathParts.length === 2 || 
        (pathParts.length === 3 && ['issues', 'pulls', 'actions', 'wiki', 'pulse', 'settings'].includes(pathParts[2]))) {
      return { url, selector: 'body', module: 'repository' };
    }
  }
  
  // 默认使用全局模块
  return { url, selector: 'body', module: 'global' };
}

/**
 * 过滤有效页面
 */
function filterValidPages(links) {
  const validPages = new Set();
  const fileExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.json', '.xml'];
  
  links.forEach(link => {
    // 排除包含查询参数和锚点的URL，只保留基础路径
    const url = new URL(link);
    const pathname = url.pathname;
    
    // 跳过API路径和文件路径
    if (pathname.includes('/api/') || 
        fileExtensions.some(ext => pathname.endsWith(ext)) ||
        pathname.includes('/raw/') ||
        pathname.includes('/login') ||
        pathname.includes('/signup') ||
        pathname.includes('/logout')) {
      return;
    }
    
    // 构建基础URL（不包含查询参数和锚点）
    const baseUrl = `${url.origin}${pathname}`;
    validPages.add(baseUrl);
  });
  
  return Array.from(validPages);
}

/**
 * 加载现有的页面配置
 */
async function loadExistingPages() {
  try {
    const pagesData = await fs.readFile(CONFIG.pagesFilePath, 'utf8');
    const pages = JSON.parse(pagesData);
    if (Array.isArray(pages)) {
      log('info', `已加载 ${pages.length} 个现有页面配置`);
      return pages;
    } else {
      throw new Error('pages.json 格式错误，应为数组');
    }
  } catch (error) {
    log('error', `加载现有页面配置失败: ${error.message}`);
    log('info', '使用空的页面配置列表');
    return [];
  }
}

/**
 * 保存页面配置到文件
 */
async function savePagesToFile(pages) {
  try {
    // 确保目录存在
    const dir = path.dirname(CONFIG.pagesFilePath);
    await fs.mkdir(dir, { recursive: true });
    
    // 保存文件
    await fs.writeFile(CONFIG.pagesFilePath, JSON.stringify(pages, null, 2), 'utf8');
    log('info', `已保存 ${pages.length} 个页面配置到 ${CONFIG.pagesFilePath}`);
  } catch (error) {
    log('error', `保存页面配置失败: ${error.message}`, error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  log('info', 'GitHub页面收集器启动');
  
  try {
    // 1. 加载现有的页面配置
    const existingPages = await loadExistingPages();
    const existingUrls = new Set(existingPages.map(page => page.url));
    
    // 2. 从GitHub首页开始收集链接
    const html = await downloadPage(CONFIG.baseUrl);
    let allLinks = extractLinks(html, CONFIG.baseUrl);
    
    // 3. 过滤出有效的GitHub页面
    const validPages = filterValidPages(allLinks);
    log('info', `从首页提取了 ${validPages.length} 个有效页面链接`);
    
    // 4. 为每个页面分配模块并去重
    const newPages = [];
    validPages.forEach(url => {
      if (!existingUrls.has(url)) {
        const categorizedPage = categorizePage(url);
        newPages.push(categorizedPage);
        existingUrls.add(url); // 避免重复添加
      }
    });
    
    // 5. 添加一些手动定义的重要页面
    const importantPages = [
      { url: 'https://github.com/settings/profile', selector: 'body', module: 'settings' },
      { url: 'https://github.com/settings/account', selector: 'body', module: 'settings' },
      { url: 'https://github.com/settings/repositories', selector: 'body', module: 'settings' },
      { url: 'https://github.com/settings/billing', selector: 'body', module: 'settings' },
      { url: 'https://github.com/settings/apps', selector: 'body', module: 'settings' },
      { url: 'https://github.com/settings/keys', selector: 'body', module: 'settings' },
      { url: 'https://github.com/notifications', selector: 'body', module: 'notifications' },
      { url: 'https://github.com/notifications/unread', selector: 'body', module: 'notifications' },
      { url: 'https://github.com/pulls', selector: 'body', module: 'pullRequests' },
      { url: 'https://github.com/pulls/review-requested', selector: 'body', module: 'pullRequests' },
      { url: 'https://github.com/issues', selector: 'body', module: 'issues' },
      { url: 'https://github.com/issues/assigned', selector: 'body', module: 'issues' },
      { url: 'https://github.com/explore', selector: 'body', module: 'explore' },
      { url: 'https://github.com/trending', selector: 'body', module: 'explore' },
      { url: 'https://github.com/collections', selector: 'body', module: 'explore' },
      { url: 'https://github.com/marketplace', selector: 'body', module: 'marketplace' },
      { url: 'https://github.com/marketplace/stars', selector: 'body', module: 'marketplace' },
      { url: 'https://github.com/codespaces', selector: 'body', module: 'codespaces' },
      { url: 'https://github.com/codespaces/new', selector: 'body', module: 'codespaces' },
      { url: 'https://github.com/actions', selector: 'body', module: 'actions' },
      { url: 'https://github.com/security', selector: 'body', module: 'security' },
      { url: 'https://github.com/projects', selector: 'body', module: 'projects' },
      { url: 'https://github.com/search', selector: 'body', module: 'search' },
      { url: 'https://github.com/search/advanced', selector: 'body', module: 'search' },
      { url: 'https://github.com/orgs/github/repositories', selector: 'body', module: 'repository' },
      { url: 'https://github.com/github/github', selector: 'body', module: 'repository' },
      { url: 'https://github.com/github/github/issues', selector: 'body', module: 'repository' },
      { url: 'https://github.com/github/github/pulls', selector: 'body', module: 'repository' }
    ];
    
    importantPages.forEach(page => {
      if (!existingUrls.has(page.url)) {
        newPages.push(page);
        existingUrls.add(page.url);
      }
    });
    
    // 6. 合并新旧页面配置
    const updatedPages = [...existingPages, ...newPages];
    
    // 7. 保存更新后的页面配置
    if (newPages.length > 0) {
      log('info', `发现并添加了 ${newPages.length} 个新页面配置`);
      await savePagesToFile(updatedPages);
    } else {
      log('info', '没有发现新的页面配置，pages.json已是最新');
    }
    
    // 8. 生成报告
    log('info', 'GitHub页面收集完成！');
    log('info', `总计收集了 ${updatedPages.length} 个GitHub页面配置`);
    log('info', `现有页面: ${existingPages.length} 个`);
    log('info', `新增页面: ${newPages.length} 个`);
    
    // 按模块统计
    const modules = {};
    updatedPages.forEach(page => {
      if (!modules[page.module]) {
        modules[page.module] = 0;
      }
      modules[page.module]++;
    });
    log('info', '按模块统计的页面数量:');
    Object.entries(modules).forEach(([module, count]) => {
      log('info', `  ${module}: ${count} 个页面`);
    });
    
  } catch (error) {
    log('error', 'GitHub页面收集失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main().catch(err => {
  log('error', '程序执行出错:', err);
  process.exit(1);
});