/**
 * 版本更新检查模块
 * 负责检查和处理脚本更新
 */
import { CONFIG } from './config.js';
import { utils } from './utils.js';

/**
 * 版本检查器对象
 */
export const versionChecker = {
    /**
     * 检查版本更新
     * 支持重试机制和更详细的错误处理
     * @returns {Promise<boolean>} 检查完成的Promise，resolve为是否发现更新
     */
    async checkForUpdates() {
        // 检查是否启用了更新检查
        if (!CONFIG.updateCheck.enabled) {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 已禁用更新检查');
            }
            return false;
        }
        
        // 检查是否达到检查间隔
        const lastCheck = localStorage.getItem('githubZhLastUpdateCheck');
        const now = Date.now();
        const intervalMs = (CONFIG.updateCheck.intervalHours || 24) * 60 * 60 * 1000;
        
        if (lastCheck && now - parseInt(lastCheck) < intervalMs) {
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 未达到更新检查间隔，跳过检查 (上次检查: ${new Date(parseInt(lastCheck)).toLocaleString()})`);
            }
            return false;
        }
        
        try {
            // 记录本次检查时间
            localStorage.setItem('githubZhLastUpdateCheck', now.toString());
            
            // 使用带重试的获取方法
            const scriptContent = await this.fetchWithRetry(CONFIG.updateCheck.scriptUrl);
            
            // 提取远程版本号 - 支持多种格式
            const remoteVersion = this.extractVersion(scriptContent);
            
            if (!remoteVersion) {
                throw new Error('无法从远程脚本提取有效的版本号');
            }
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 当前版本: ${CONFIG.version}, 远程版本: ${remoteVersion}`);
            }
            
            // 比较版本号
            if (this.isNewerVersion(remoteVersion, CONFIG.version)) {
                // 显示更新通知
                this.showUpdateNotification(remoteVersion);
                
                // 如果启用了自动更新版本号
                if (CONFIG.updateCheck.autoUpdateVersion) {
                    this.updateVersionInStorage(remoteVersion);
                }
                
                // 记录版本历史
                this.recordVersionHistory(remoteVersion);
                
                return true;
            }
            
            return false;
        } catch (error) {
            const errorMsg = `[GitHub 中文翻译] 检查更新时发生错误: ${error.message || error}`;
            if (CONFIG.debugMode) {
                console.error(errorMsg, error);
            }
            
            // 记录错误日志
            try {
                localStorage.setItem('githubZhUpdateError', JSON.stringify({
                    message: error.message,
                    timestamp: now
                }));
            } catch (e) {
                // 忽略存储错误
            }
            
            return false;
        }
    },
    
    /**
     * 带重试机制的网络请求
     * @param {string} url - 请求URL
     * @param {number} maxRetries - 最大重试次数
     * @param {number} retryDelay - 重试间隔（毫秒）
     * @returns {Promise<string>} 响应文本
     */
    async fetchWithRetry(url, maxRetries = 2, retryDelay = 1000) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (CONFIG.debugMode && attempt > 0) {
                    console.log(`[GitHub 中文翻译] 重试更新检查 (${attempt}/${maxRetries})...`);
                }
                
                // 自定义超时控制
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Accept': 'text/javascript, text/plain, */*'
                    },
                    signal: controller.signal,
                    credentials: 'omit' // 不发送凭证信息
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态码: ${response.status}`);
                }
                
                return await response.text();
            } catch (error) {
                lastError = error;
                
                // 如果是最后一次尝试，则抛出错误
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 等待后重试
                await utils.delay(retryDelay * Math.pow(2, attempt)); // 指数退避策略
            }
        }
        
        throw lastError;
    },
    
    /**
     * 从脚本内容中提取版本号
     * 支持多种版本号格式
     * @param {string} content - 脚本内容
     * @returns {string|null} 提取的版本号或null
     */
    extractVersion(content) {
        // 尝试多种版本号格式
        const patterns = [
            // UserScript格式
            /\/\*\s*@version\s+(\d+\.\d+\.\d+)\s*\*\//i,
            // JavaScript注释格式
            /\/\/\s*version\s*:\s*(\d+\.\d+\.\d+)/i,
            // 变量赋值格式
            /version\s*=\s*['"](\d+\.\d+\.\d+)['"]/i,
            // 对象属性格式
            /version:\s*['"](\d+\.\d+\.\d+)['"]/i
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    },

    /**
     * 比较版本号，判断是否有新版本
     * @param {string} newVersion - 新版本号
     * @param {string} currentVersion - 当前版本号
     * @returns {boolean} 是否有新版本
     */
    isNewerVersion(newVersion, currentVersion) {
        // 将版本号转换为数组进行比较
        const newParts = newVersion.split('.').map(Number);
        const currentParts = currentVersion.split('.').map(Number);
        
        // 比较每个部分
        for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
            const newPart = newParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            
            if (newPart > currentPart) {
                return true;
            } else if (newPart < currentPart) {
                return false;
            }
        }
        
        // 版本号相同
        return false;
    },

    /**
     * 显示更新通知
     * 使用安全的DOM操作而不是innerHTML
     * @param {string} newVersion - 新版本号
     */
    showUpdateNotification(newVersion) {
        const notificationKey = 'githubZhUpdateNotificationDismissed';
        const notificationVersionKey = 'githubZhLastNotifiedVersion';
        
        // 获取最后通知的版本
        const lastNotifiedVersion = localStorage.getItem(notificationVersionKey);
        
        // 如果用户已经关闭过通知，或者已经通知过相同版本，则不显示
        if (localStorage.getItem(notificationKey) === 'dismissed' || 
            lastNotifiedVersion === newVersion) {
            if (CONFIG.debugMode && lastNotifiedVersion === newVersion) {
                console.log(`[GitHub 中文翻译] 已经通知过版本 ${newVersion} 的更新`);
            }
            return;
        }
        
        try {
            // 创建通知元素 - 安全的DOM操作
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md transform transition-all duration-300 translate-y-0 opacity-100';
            
            // 生成唯一的ID
            const notificationId = `github-zh-update-${Date.now()}`;
            notification.id = notificationId;
            
            // 创建flex容器
            const flexContainer = document.createElement('div');
            flexContainer.className = 'flex items-start';
            notification.appendChild(flexContainer);
            
            // 创建图标容器
            const iconContainer = document.createElement('div');
            iconContainer.className = 'flex-shrink-0 bg-blue-100 rounded-full p-2';
            flexContainer.appendChild(iconContainer);
            
            // 创建SVG图标
            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgIcon.setAttribute('class', 'h-6 w-6 text-blue-600');
            svgIcon.setAttribute('fill', 'none');
            svgIcon.setAttribute('viewBox', '0 0 24 24');
            svgIcon.setAttribute('stroke', 'currentColor');
            iconContainer.appendChild(svgIcon);
            
            // 创建SVG路径
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('stroke-linecap', 'round');
            pathElement.setAttribute('stroke-linejoin', 'round');
            pathElement.setAttribute('stroke-width', '2');
            pathElement.setAttribute('d', 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
            svgIcon.appendChild(pathElement);
            
            // 创建内容容器
            const contentContainer = document.createElement('div');
            contentContainer.className = 'ml-3 flex-1';
            flexContainer.appendChild(contentContainer);
            
            // 创建标题
            const titleElement = document.createElement('p');
            titleElement.className = 'text-sm font-medium text-blue-800';
            titleElement.textContent = 'GitHub 中文翻译脚本更新';
            contentContainer.appendChild(titleElement);
            
            // 创建消息文本 - 安全地设置文本内容
            const messageElement = document.createElement('p');
            messageElement.className = 'text-sm text-blue-700 mt-1';
            messageElement.textContent = `发现新版本 ${newVersion}，建议更新以获得更好的翻译体验。`;
            contentContainer.appendChild(messageElement);
            
            // 创建按钮容器
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'mt-3 flex space-x-2';
            contentContainer.appendChild(buttonsContainer);
            
            // 创建更新按钮 - 安全地设置URL
            const updateButton = document.createElement('a');
            updateButton.id = `${notificationId}-update-btn`;
            updateButton.href = CONFIG.updateCheck.scriptUrl || '#';
            updateButton.target = '_blank';
            updateButton.rel = 'noopener noreferrer';
            updateButton.className = 'inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors';
            updateButton.textContent = '立即更新';
            buttonsContainer.appendChild(updateButton);
            
            // 创建稍后按钮
            const laterButton = document.createElement('button');
            laterButton.id = `${notificationId}-later-btn`;
            laterButton.className = 'inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-transparent hover:bg-blue-50 transition-colors';
            laterButton.textContent = '稍后';
            laterButton.addEventListener('click', () => {
                this.hideNotification(notification, false);
            });
            buttonsContainer.appendChild(laterButton);
            
            // 创建不再提醒按钮
            const dismissButton = document.createElement('button');
            dismissButton.id = `${notificationId}-dismiss-btn`;
            dismissButton.className = 'inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors';
            dismissButton.textContent = '不再提醒';
            dismissButton.addEventListener('click', () => {
                this.hideNotification(notification, true);
            });
            buttonsContainer.appendChild(dismissButton);
            
            // 添加到DOM
            if (document.body) {
                document.body.appendChild(notification);
                
                // 记录本次通知的版本
                localStorage.setItem(notificationVersionKey, newVersion);
                
                // 自动隐藏（可选）
                if (CONFIG.updateCheck.autoHideNotification !== false) {
                    setTimeout(() => {
                        this.hideNotification(notification, false);
                    }, 20000); // 20秒后自动隐藏
                }
                
                if (CONFIG.debugMode) {
                    console.log(`[GitHub 中文翻译] 显示更新通知: 版本 ${newVersion}`);
                }
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 创建更新通知失败:', error);
        }
    },
    
    /**
     * 隐藏通知元素（带动画效果）
     * @param {HTMLElement} notification - 通知元素
     * @param {boolean} permanently - 是否永久隐藏
     */
    hideNotification(notification, permanently = false) {
        try {
            // 添加动画效果
            notification.style.transform = 'translateY(20px)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
            
            // 如果是永久隐藏，记录到localStorage
            if (permanently) {
                localStorage.setItem('githubZhUpdateNotificationDismissed', 'dismissed');
                if (CONFIG.debugMode) {
                    console.log('[GitHub 中文翻译] 更新通知已永久隐藏');
                }
            }
        } catch (error) {
            console.error('[GitHub 中文翻译] 隐藏通知失败:', error);
        }
    },
    
    /**
     * 记录版本历史
     * @param {string} version - 版本号
     */
    recordVersionHistory(version) {
        try {
            const historyKey = 'githubZhVersionHistory';
            let history = utils.safeJSONParse(localStorage.getItem(historyKey), []);
            
            // 确保是数组
            if (!Array.isArray(history)) {
                history = [];
            }
            
            // 添加新版本记录
            history.push({
                version,
                detectedAt: Date.now()
            });
            
            // 限制历史记录数量
            if (history.length > 10) {
                history = history.slice(-10);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (error) {
            // 忽略存储错误
        }
    },
    
    /**
     * 更新本地存储中的版本号
     * @param {string} newVersion - 新版本号
     */
    updateVersionInStorage(newVersion) {
        try {
            const cacheData = {
                version: newVersion,
                cachedAt: Date.now(),
                currentVersion: CONFIG.version
            };
            
            localStorage.setItem('githubZhCachedVersion', utils.safeJSONStringify(cacheData));
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 已缓存新版本号: ${newVersion} (缓存时间: ${new Date().toLocaleString()})`);
            }
            
            return true;
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 更新缓存版本号时出错:', error);
            }
            return false;
        }
    },
    
    /**
     * 获取缓存的版本信息
     * @returns {Object|null} 缓存的版本数据
     */
    getCachedVersion() {
        try {
            const cachedData = utils.safeJSONParse(localStorage.getItem('githubZhCachedVersion'));
            return cachedData;
        } catch (error) {
            return null;
        }
    },
    
    /**
     * 清除更新通知的忽略状态
     * 允许再次显示更新通知
     */
    clearNotificationDismissal() {
        try {
            localStorage.removeItem('githubZhUpdateNotificationDismissed');
            localStorage.removeItem('githubZhLastNotifiedVersion');
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 已清除更新通知忽略状态');
            }
            
            return true;
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 清除通知忽略状态失败:', error);
            }
            return false;
        }
    }
};