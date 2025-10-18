/**
 * 版本更新检查模块
 * 负责检查和处理脚本更新
 */
import { CONFIG } from './config.js';

/**
 * 版本检查器对象
 */
export const versionChecker = {
    /**
     * 检查版本更新
     * @returns {Promise<void>} 检查完成的Promise
     */
    async checkForUpdates() {
        // 检查是否启用了更新检查
        if (!CONFIG.updateCheck.enabled) return;
        
        // 检查是否达到检查间隔
        const lastCheck = localStorage.getItem('githubZhLastUpdateCheck');
        const now = Date.now();
        const intervalMs = CONFIG.updateCheck.intervalHours * 60 * 60 * 1000;
        
        if (lastCheck && now - parseInt(lastCheck) < intervalMs) {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 未达到更新检查间隔，跳过检查');
            }
            return;
        }
        
        try {
            // 记录本次检查时间
            localStorage.setItem('githubZhLastUpdateCheck', now.toString());
            
            // 获取远程脚本内容
            const response = await fetch(CONFIG.updateCheck.scriptUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                },
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            
            const scriptContent = await response.text();
            
            // 提取远程版本号
            const remoteVersionMatch = scriptContent.match(/\/\*\s*@version\s+(\d+\.\d+\.\d+)\s*\*\//i);
            if (!remoteVersionMatch) {
                throw new Error('无法从远程脚本提取版本号');
            }
            
            const remoteVersion = remoteVersionMatch[1];
            
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
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 检查更新时发生错误:', error);
            }
        }
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
     * @param {string} newVersion - 新版本号
     */
    showUpdateNotification(newVersion) {
        const notificationKey = 'githubZhUpdateNotificationDismissed';
        
        // 检查用户是否已经关闭过通知
        if (localStorage.getItem(notificationKey) === 'dismissed') {
            return;
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md';
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0 bg-blue-100 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-blue-800">GitHub 中文翻译脚本更新</p>
                    <p class="text-sm text-blue-700 mt-1">发现新版本 ${newVersion}，建议更新以获得更好的翻译体验。</p>
                    <div class="mt-3 flex space-x-2">
                        <a href="${CONFIG.updateCheck.scriptUrl}" target="_blank" rel="noopener noreferrer"
                            class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                            立即更新
                        </a>
                        <button onclick="this.closest('.fixed').remove(); localStorage.setItem('${notificationKey}', 'dismissed');"
                            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-transparent hover:bg-blue-50 transition-colors">
                            稍后
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
    },
    
    /**
     * 更新本地存储中的版本号
     * @param {string} newVersion - 新版本号
     */
    updateVersionInStorage(newVersion) {
        try {
            localStorage.setItem('githubZhCachedVersion', newVersion);
            if (CONFIG.debugMode) {
                console.log(`[GitHub 中文翻译] 已缓存新版本号: ${newVersion}`);
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub 中文翻译] 更新缓存版本号时出错:', error);
            }
        }
    }
};