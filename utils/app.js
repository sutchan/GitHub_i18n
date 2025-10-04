// 当前的SSE连接
// Web界面交互逻辑模块
// 作者: SutChan
// 版本: 1.8.15

let eventSource = null;

// 全局的带超时的fetch函数
function fetchWithTimeout(url, options = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error(`请求超时: ${timeout}ms后未响应`));
        }, timeout);
        
        fetch(url, { ...options, signal: controller.signal })
            .then(response => {
                clearTimeout(timeoutId);
                resolve(response);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 从服务器加载配置
    loadConfig();

    // 从服务器加载页面配置
    loadPagesConfig();

    // 从服务器加载统计数据
    loadStats();

    // 绑定事件
    bindEvents();

    // 初始化选项卡功能
    initTabs();
    
    // 从localStorage恢复上次运行的日志
    restoreLogsFromLocalStorage();
});

// 显示用户脚本设置模态框
function showUserScriptModal() {
    const modal = document.getElementById('userScriptSettingsModal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.querySelector('.scale-95').classList.replace('scale-95', 'scale-100');
    }, 10);
}

// 隐藏用户脚本设置模态框
function hideUserScriptModal() {
    const modal = document.getElementById('userScriptSettingsModal');
    modal.querySelector('.scale-100').classList.replace('scale-100', 'scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// 选项卡切换功能
function initTabs() {
    const tabConfig = document.getElementById('tabConfig');
    const tabPages = document.getElementById('tabPages');
    const tabConfigContent = document.getElementById('tabConfigContent');
    const tabPagesContent = document.getElementById('tabPagesContent');

    // 配置设置选项卡点击事件
    tabConfig.addEventListener('click', function() {
        // 激活配置选项卡
        tabConfig.classList.add('text-secondary', 'border-secondary');
        tabConfig.classList.remove('text-gray-500', 'border-transparent', 'hover:border-gray-300');
        
        // 取消激活页面选项卡
        tabPages.classList.remove('text-secondary', 'border-secondary');
        tabPages.classList.add('text-gray-500', 'border-transparent', 'hover:border-gray-300');
        
        // 显示配置内容，隐藏页面内容
        tabConfigContent.classList.remove('hidden');
        tabPagesContent.classList.add('hidden');
    });

    // GitHub页面配置选项卡点击事件
    tabPages.addEventListener('click', function() {
        // 激活页面选项卡
        tabPages.classList.add('text-secondary', 'border-secondary');
        tabPages.classList.remove('text-gray-500', 'border-transparent', 'hover:border-gray-300');
        
        // 取消激活配置选项卡
        tabConfig.classList.remove('text-secondary', 'border-secondary');
        tabConfig.classList.add('text-gray-500', 'border-transparent', 'hover:border-gray-300');
        
        // 显示页面内容，隐藏配置内容
        tabPagesContent.classList.remove('hidden');
        tabConfigContent.classList.add('hidden');
    });
}

// 绑定事件
function bindEvents() {
    // 操作按钮事件
    document.getElementById('toggleBtn').addEventListener('click', toggleTool);
    document.getElementById('saveConfigBtn').addEventListener('click', showUserScriptModal);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveConfig);
    document.getElementById('savePagesBtn').addEventListener('click', savePagesConfig);
    document.getElementById('resetConfigBtn').addEventListener('click', resetConfig);
    
    // 用户脚本设置按钮事件
    document.getElementById('saveUserScriptSettingsBtn').addEventListener('click', saveUserScriptSettings);
    document.getElementById('resetUserScriptConfigBtn').addEventListener('click', resetUserScriptConfig);

    // 页面管理事件
    document.getElementById('addPageBtn').addEventListener('click', showAddPageModal);
    document.getElementById('cancelModalBtn').addEventListener('click', hidePageModal);
    document.getElementById('saveModalBtn').addEventListener('click', savePage);

    // 日志事件
    document.getElementById('clearLogBtn').addEventListener('click', clearLog);

    // 帮助事件
    document.getElementById('helpBtn').addEventListener('click', showHelpModal);
    document.getElementById('closeHelpBtn').addEventListener('click', hideHelpModal);

    // 用户脚本设置入口事件
    document.getElementById('userScriptSettingsBtn').addEventListener('click', showUserScriptModal);
    
    // 用户脚本设置模态框事件
    document.getElementById('closeUserScriptModalBtn').addEventListener('click', hideUserScriptModal);

    // 查看备份
    document.getElementById('viewBackupBtn').addEventListener('click', viewBackup);
    
    // 重置工具状态
    document.getElementById('resetStatusBtn').addEventListener('click', resetToolStatus);
}

// 切换工具状态（开始/停止）
async function toggleTool() {
    const toggleBtn = document.getElementById('toggleBtn');
    
    // 根据按钮文本判断当前状态
    if (toggleBtn.innerHTML.includes('开始')) {
        await runTool();
    } else {
        await stopTool();
    }
}

// 运行工具
async function runTool() {
    try {
        // 检查服务器状态
        const serverStatus = await checkServerStatus();
        if (!serverStatus) {
            addLog('服务器连接失败，请检查服务器是否正常运行', 'error');
            return;
        }

        // 保存当前配置，确保运行时使用最新配置
        await saveConfig();

        // 更新状态
        updateStatus('running');

        // 更新按钮状态：显示停止状态
        const toggleBtn = document.getElementById('toggleBtn');
        toggleBtn.innerHTML = '<i class="fa fa-stop mr-2"></i>停止抓取';
        toggleBtn.classList.remove('bg-primary', 'hover:bg-primary/90');
        toggleBtn.classList.add('bg-danger', 'hover:bg-danger/90');

        // 清空日志
        clearLog();

        // 添加日志
        addLog('工具开始运行...');

        // 发送请求到后端运行工具
        startEventSource();
    } catch (error) {
        addLog(`配置保存失败: ${error}`, 'error');
        // 确保UI状态正确
        updateStatus('stopped');
        const toggleBtn = document.getElementById('toggleBtn');
        toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
        toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
        toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');
    }
}

// 服务器基础URL - 使用正确的端口3004
const API_BASE_URL = 'http://localhost:3004';

// 检查服务器状态
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`, {
            method: 'GET',
            timeout: 5000
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 开始SSE连接
function startEventSource() {
    // 关闭之前的连接
    if (eventSource) {
        eventSource.close();
        eventSource = null; // 确保设置为null
    }

    // 创建新的SSE连接
    try {
        eventSource = new EventSource(`${API_BASE_URL}/api/run`);

        // 设置连接超时计时器 - 增加到5分钟，避免长时间运行的任务被过早终止
        const connectionTimeout = setTimeout(() => {
            if (eventSource && eventSource.readyState === EventSource.CONNECTING) {
                addLog('连接超时，请检查服务器状态', 'error');
                eventSource.close();
                eventSource = null; // 确保设置为null
                updateStatus('stopped');
                const toggleBtn = document.getElementById('toggleBtn');
                toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
                toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
                toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');
            }
        }, 300000); // 5分钟 = 300000毫秒

        // 连接成功处理
        eventSource.onopen = function() {
            clearTimeout(connectionTimeout);
            addLog('已连接到服务器', 'info');
            
            // 再次确认按钮状态
            const toggleBtn = document.getElementById('toggleBtn');
            toggleBtn.innerHTML = '<i class="fa fa-stop mr-2"></i>停止抓取';
            toggleBtn.classList.remove('bg-primary', 'hover:bg-primary/90');
            toggleBtn.classList.add('bg-danger', 'hover:bg-danger/90');
        };

        // 处理消息事件
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);

                switch(data.type) {
                    case 'log':
                        addLog(data.message);
                        break;
                    case 'error':
                        addLog(data.message, 'error');
                        break;
                    case 'success':
                        addLog(data.message, 'success');
                        break;
                    case 'start':
                        addLog(data.message);
                        break;
                    case 'complete':
                        // 重新加载统计数据
                        loadStats().catch(err => {
                            addLog(`加载统计数据失败: ${err}`, 'error');
                        });

                        // 更新状态
                        updateStatus('completed');

                        // 更新按钮状态：显示开始状态
                        const toggleBtn = document.getElementById('toggleBtn');
                        toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
                        toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
                        toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');

                        // 关闭SSE连接
                        if (eventSource) {
                            eventSource.close();
                            eventSource = null;
                        }
                        break;
                }
            } catch (e) {
                addLog(`解析服务器消息失败: ${e}`, 'error');
                // 出错时确保按钮状态正确
                updateStatus('stopped');
                const toggleBtn = document.getElementById('toggleBtn');
                toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
                toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
                toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');
            }
        };

        // 处理错误事件
        eventSource.onerror = function(event) {
            // 避免重复记录错误
            if (event && event.target && event.target.readyState === EventSource.CLOSED) {
                addLog('与服务器的连接已关闭', 'info');
            } else {
                addLog('与服务器的连接中断', 'error');
            }

            // 更新状态
            updateStatus('stopped');

            // 更新按钮状态：显示开始状态
            const toggleBtn = document.getElementById('toggleBtn');
            toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
            toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
            toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');

            // 关闭SSE连接
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
        };
    } catch (e) {
        addLog(`创建SSE连接失败: ${e}`, 'error');
        updateStatus('stopped');
        const toggleBtn = document.getElementById('toggleBtn');
        toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
        toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
        toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');
        eventSource = null;
    }
}

// 停止工具
async function stopTool() {
    try {
        // 先更新UI状态，表示正在停止
        updateStatus('stopping');
        addLog('正在停止工具...', 'info');

        // 发送停止请求到服务器
        const response = await fetch(`${API_BASE_URL}/api/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 增加超时时间到5秒
        });

        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
            addLog('工具停止命令已发送到服务器', 'info');
        } else {
            addLog(`停止命令发送失败: ${result.message || '未知错误'}`, 'error');
        }
    } catch (error) {
        addLog(`发送停止命令时发生错误: ${error}`, 'warning');
        addLog('尝试直接关闭连接...', 'info');
    } finally {
        // 无论请求是否成功，都确保关闭SSE连接
        if (eventSource) {
            try {
                eventSource.close();
            } catch (closeError) {
                console.warn('关闭SSE连接时发生错误:', closeError);
            }
            eventSource = null; // 确保设置为null以防止后续访问
        }

        // 更新状态为已停止
        updateStatus('stopped');

        // 更新按钮状态：显示开始状态
        const toggleBtn = document.getElementById('toggleBtn');
        toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
        toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
        toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');

        // 添加日志
        addLog('工具已停止');
    }
}

// 更新状态
function updateStatus(status) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    switch(status) {
        case 'running':
            indicator.className = 'w-3 h-3 rounded-full bg-secondary';
            statusText.className = 'text-sm text-secondary';
            statusText.textContent = '运行中';
            break;
        case 'stopping':
            indicator.className = 'w-3 h-3 rounded-full bg-warning';
            statusText.className = 'text-sm text-warning';
            statusText.textContent = '停止中';
            break;
        case 'stopped':
            indicator.className = 'w-3 h-3 rounded-full bg-danger';
            statusText.className = 'text-sm text-danger';
            statusText.textContent = '已停止';
            break;
        case 'completed':
            indicator.className = 'w-3 h-3 rounded-full bg-accent';
            statusText.className = 'text-sm text-accent';
            statusText.textContent = '已完成';
            break;
        default:
            indicator.className = 'w-3 h-3 rounded-full bg-gray-300';
            statusText.className = 'text-sm text-gray-500';
            statusText.textContent = '就绪';
    }
}

// 更新进度条和进度文本
function updateProgress(progress, processed, total) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressDetails = document.getElementById('progressDetails');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }
    
    if (progressDetails) {
        progressDetails.textContent = `${processed}/${total} 页面`;
    }
}

// 添加日志
function addLog(message, type = 'normal') {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');

    // 确保message是字符串
    if (message === undefined || message === null) {
        message = '未知消息';
    } else if (typeof message !== 'string') {
        message = String(message);
    }

    // 根据类型设置样式
    switch(type) {
        case 'error':
            logEntry.className = 'text-danger';
            break;
        case 'success':
            logEntry.className = 'text-secondary';
            break;
        case 'info':
            logEntry.className = 'text-primary';
            break;
        case 'warning':
            logEntry.className = 'text-warning';
            break;
        default:
            logEntry.className = 'text-gray-800';
    }

    // 添加时间戳（使用精简格式）
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timestamp = `${hours}:${minutes}:${seconds}`;
    logEntry.textContent = `[${timestamp}] ${message}`;

    // 移除初始提示
    if (logContainer.children.length === 1 && logContainer.firstChild.textContent.includes('日志将显示在这里...')) {
        logContainer.innerHTML = '';
    }

    // 限制日志条目数量，防止DOM过大
    const maxLogEntries = 500;
    while (logContainer.children.length >= maxLogEntries) {
        logContainer.removeChild(logContainer.firstChild);
    }

    // 添加到容器
    logContainer.appendChild(logEntry);

    // 滚动到底部
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // 保存日志到localStorage
    saveLogToLocalStorage(message, type, timestamp);
}

// 保存日志到localStorage
function saveLogToLocalStorage(message, type, timestamp) {
    try {
        // 获取现有的日志数组
        let logs = JSON.parse(localStorage.getItem('lastRunLogs') || '[]');
        
        // 添加新日志条目
        logs.push({
            message: message,
            type: type,
            timestamp: timestamp,
            datetime: new Date().toISOString()
        });
        
        // 限制保存的日志数量
        const maxSavedLogs = 500;
        if (logs.length > maxSavedLogs) {
            logs = logs.slice(-maxSavedLogs);
        }
        
        // 保存回localStorage
        localStorage.setItem('lastRunLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('保存日志到localStorage失败:', error);
    }
}

// 从localStorage恢复日志
function restoreLogsFromLocalStorage() {
    try {
        const logs = JSON.parse(localStorage.getItem('lastRunLogs') || '[]');
        
        if (logs.length > 0) {
            const logContainer = document.getElementById('logContainer');
            logContainer.innerHTML = ''; // 清空初始提示
            
            logs.forEach(log => {
                const logEntry = document.createElement('div');
                
                // 设置样式
                switch(log.type) {
                    case 'error':
                        logEntry.className = 'text-danger';
                        break;
                    case 'success':
                        logEntry.className = 'text-secondary';
                        break;
                    case 'info':
                        logEntry.className = 'text-primary';
                        break;
                    case 'warning':
                        logEntry.className = 'text-warning';
                        break;
                    default:
                        logEntry.className = 'text-gray-800';
                }
                
                // 设置内容
                logEntry.textContent = `[${log.timestamp}] ${log.message}`;
                logContainer.appendChild(logEntry);
            });
            
            // 滚动到底部
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    } catch (error) {
        console.error('从localStorage恢复日志失败:', error);
    }
}

// 清空日志
function clearLog() {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = '<div class="text-gray-500">日志将显示在这里...</div>';
    
    // 同时清空localStorage中的日志
    try {
        localStorage.removeItem('lastRunLogs');
    } catch (error) {
        console.error('清空localStorage中的日志失败:', error);
    }
}

// 保存用户脚本设置
async function saveUserScriptSettings() {
    console.log('saveUserScriptSettings函数被调用');
    try {
        // 获取用户脚本设置表单值
        const enableExternalTranslation = document.getElementById('scriptExternalTranslation').checked;
        const externalTranslationMinLength = parseInt(document.getElementById('scriptMinTranslationLength').value);
        const externalTranslationMaxLength = parseInt(document.getElementById('scriptMaxTranslationLength').value);
        const externalTranslationTimeout = parseInt(document.getElementById('scriptTranslationTimeout').value);
        const externalTranslationDelay = parseInt(document.getElementById('scriptRequestDelay').value);
        const routeChangeDelay = parseInt(document.getElementById('scriptRouteChangeDelay').value);
        const throttleInterval = parseInt(document.getElementById('scriptThrottleInterval').value);
        const enableUpdateCheck = document.getElementById('scriptCheckUpdate').checked;
        const enableDeepDomObserver = document.getElementById('scriptEnableDeepObserver').checked;

        // 验证用户脚本设置
        if (isNaN(externalTranslationMinLength) || externalTranslationMinLength < 1) {
            throw new Error('外部翻译最小长度必须大于0');
        }

        if (isNaN(externalTranslationMaxLength) || externalTranslationMaxLength < externalTranslationMinLength) {
            throw new Error('外部翻译最大长度必须大于或等于最小长度');
        }

        if (isNaN(routeChangeDelay) || routeChangeDelay < 0) {
            throw new Error('路由变化延迟必须大于或等于0');
        }

        if (isNaN(throttleInterval) || throttleInterval < 0) {
            throw new Error('节流间隔必须大于或等于0');
        }

        // 构建用户脚本设置配置
        const userScriptConfig = {
            enableExternalTranslation,
            externalTranslationMinLength,
            externalTranslationMaxLength,
            externalTranslationTimeout,
            externalTranslationDelay,
            routeChangeDelay,
            throttleInterval,
            enableUpdateCheck,
            enableDeepDomObserver
        };
        console.log('构建的用户脚本配置:', userScriptConfig);

        console.log('准备发送请求到/api/config');

        // 使用带超时的fetch
        const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
            return new Promise((resolve, reject) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                    reject(new Error(`请求超时: ${timeout}ms后未响应`));
                }, timeout);
                
                fetch(url, { ...options, signal: controller.signal })
                    .then(response => {
                        clearTimeout(timeoutId);
                        resolve(response);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
            });
        };
        
        // 1. 保存到配置文件（保留原有功能）
        const configResponse = await fetchWithTimeout(`${API_BASE_URL}/api/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // 保留其他配置不变，只更新用户脚本设置
                ...(await loadConfigSilently()),
                ...userScriptConfig
            })
        }, 5000);

        if (!configResponse.ok) {
            throw new Error(`保存配置文件失败: ${configResponse.status} ${configResponse.statusText}`);
        }

        console.log('准备发送请求到/api/update-user-script-config');

        // 2. 直接修改GitHub_zh-CN.user.js文件
        const scriptUpdateResponse = await fetchWithTimeout(`${API_BASE_URL}/api/update-user-script-config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                debounceDelay: externalTranslationDelay,
                routeChangeDelay: routeChangeDelay,
                externalTranslation: {
                    enabled: enableExternalTranslation,
                    minLength: externalTranslationMinLength,
                    maxLength: externalTranslationMaxLength,
                    timeout: externalTranslationTimeout,
                    requestInterval: externalTranslationDelay
                },
                updateCheck: {
                    enabled: enableUpdateCheck
                },
                performance: {
                    enableDeepObserver: enableDeepDomObserver
                }
            })
        }, 5000);

        if (!scriptUpdateResponse.ok) {
            throw new Error(`更新用户脚本文件失败: ${scriptUpdateResponse.status} ${scriptUpdateResponse.statusText}`);
        }

        const configResult = await configResponse.json();
        const scriptUpdateResult = await scriptUpdateResponse.json();
        console.log('请求成功完成，配置结果:', configResult);
        console.log('请求成功完成，脚本更新结果:', scriptUpdateResult);

        if (configResult.success && scriptUpdateResult.success) {
            addLog('用户脚本设置已保存并应用到脚本文件中', 'success');
            return Promise.resolve();
        } else {
            let errorMessage = '';
            if (!configResult.success) errorMessage += `保存配置: ${configResult.message || '失败'} `;
            if (!scriptUpdateResult.success) errorMessage += `更新脚本: ${scriptUpdateResult.message || '失败'}`;
            addLog(`保存用户脚本设置不完整: ${errorMessage}`, 'warning');
            return Promise.resolve(); // 即使部分失败，也返回成功，因为主要功能已完成
        }
    } catch (error) {
        console.error('保存用户脚本设置时发生错误:', error);
        addLog(`保存用户脚本设置时发生错误: ${error}`, 'error');
        return Promise.reject(error);
    }
}

// 静默加载配置，用于保存用户脚本设置时保留其他配置
async function loadConfigSilently() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/config`, {
            method: 'GET',
            timeout: 3000
        });

        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('静默加载配置失败:', error);
        return {};
    }
}

// 保存配置
async function saveConfig() {
    try {
        // 获取表单值
        const userScriptPath = document.getElementById('userScriptPath').value;
        const backupDir = document.getElementById('backupDir').value;
        const minStringLength = parseInt(document.getElementById('minStringLength').value);
        const maxStringLength = parseInt(document.getElementById('maxStringLength').value);
        const httpTimeout = parseInt(document.getElementById('httpTimeout').value);
        const maxRetries = parseInt(document.getElementById('maxRetries').value);
        const retryDelay = parseInt(document.getElementById('retryDelay').value);
        const requestDelay = parseInt(document.getElementById('requestDelay').value);
        const userAgent = document.getElementById('userAgent').value;
        const debugMode = document.getElementById('debugMode').checked;
        const debugOutputFile = document.getElementById('debugOutputFile').value;
        const exactMatchOnly = document.getElementById('exactMatchOnly').checked;
        const ignoreWords = document.getElementById('ignoreWords').value.split(',').map(word => word.trim()).filter(word => word.length > 0);
        const ignorePatterns = document.getElementById('ignorePatterns').value.split('\n').map(pattern => pattern.trim()).filter(pattern => pattern.length > 0);
        const includePatterns = document.getElementById('includePatterns').value.split('\n').map(pattern => pattern.trim()).filter(pattern => pattern.length > 0);
        
        // 用户脚本设置
        const enableExternalTranslation = document.getElementById('scriptExternalTranslation').checked;
        const externalTranslationMinLength = parseInt(document.getElementById('scriptMinTranslationLength').value);
        const externalTranslationMaxLength = parseInt(document.getElementById('scriptMaxTranslationLength').value);
        const externalTranslationTimeout = parseInt(document.getElementById('scriptTranslationTimeout').value);
        const externalTranslationDelay = parseInt(document.getElementById('scriptRequestDelay').value);
        const routeChangeDelay = parseInt(document.getElementById('scriptRouteChangeDelay').value);
        const throttleInterval = parseInt(document.getElementById('scriptThrottleInterval').value);
        const enableUpdateCheck = document.getElementById('scriptCheckUpdate').checked;
        const enableDeepDomObserver = document.getElementById('scriptEnableDeepObserver').checked;

        // 验证配置数据
        if (!userScriptPath || !backupDir) {
            throw new Error('用户脚本路径和备份目录不能为空');
        }

        if (isNaN(minStringLength) || minStringLength < 1) {
            throw new Error('最小字符串长度必须大于0');
        }

        if (isNaN(maxStringLength) || maxStringLength < minStringLength) {
            throw new Error('最大字符串长度必须大于或等于最小字符串长度');
        }

        // 用户脚本设置验证
        if (isNaN(externalTranslationMinLength) || externalTranslationMinLength < 1) {
            throw new Error('外部翻译最小长度必须大于0');
        }

        if (isNaN(externalTranslationMaxLength) || externalTranslationMaxLength < externalTranslationMinLength) {
            throw new Error('外部翻译最大长度必须大于或等于最小长度');
        }

        if (isNaN(routeChangeDelay) || routeChangeDelay < 0) {
            throw new Error('路由变化延迟必须大于或等于0');
        }

        if (isNaN(throttleInterval) || throttleInterval < 0) {
            throw new Error('节流间隔必须大于或等于0');
        }

        const config = {
            userScriptPath,
            backupDir,
            minStringLength,
            maxStringLength,
            httpTimeout,
            maxRetries,
            retryDelay,
            requestDelay,
            userAgent,
            debugMode,
            debugOutputFile,
            exactMatchOnly,
            ignoreWords,
            ignorePatterns,
            includePatterns,
            enableExternalTranslation,
            externalTranslationMinLength,
            externalTranslationMaxLength,
            externalTranslationTimeout,
            externalTranslationDelay,
            routeChangeDelay,
            throttleInterval,
            enableUpdateCheck,
            enableDeepDomObserver
        };

        // 使用带超时的fetch
        const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
            return new Promise((resolve, reject) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                    reject(new Error(`请求超时: ${timeout}ms后未响应`));
                }, timeout);
                
                fetch(url, { ...options, signal: controller.signal })
                    .then(response => {
                        clearTimeout(timeoutId);
                        resolve(response);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
            });
        };
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        }, 5000);

        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            addLog('配置已保存', 'success');
            return Promise.resolve();
        } else {
            addLog(`保存配置失败: ${result.message || '未知错误'}`, 'error');
            return Promise.reject(result.message || '未知错误');
        }
    } catch (error) {
        addLog(`保存配置时发生错误: ${error}`, 'error');
        return Promise.reject(error);
    }
}

// 加载配置
async function loadConfig() {
    try {
        // 添加重试逻辑
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // 使用带超时的fetch
                const fetchWithTimeout = (url, options = {}, timeout = 3000) => {
                    return new Promise((resolve, reject) => {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => {
                            controller.abort();
                            reject(new Error(`请求超时: ${timeout}ms后未响应`));
                        }, timeout);
                        
                        fetch(url, { ...options, signal: controller.signal })
                            .then(response => {
                                clearTimeout(timeoutId);
                                resolve(response);
                            })
                            .catch(error => {
                                clearTimeout(timeoutId);
                                reject(error);
                            });
                    });
                };
                
                const response = await fetchWithTimeout(`${API_BASE_URL}/api/config`, {
                    method: 'GET'
                }, 3000);

                if (!response.ok) {
                    throw new Error(`服务器响应错误: ${response.status}`);
                }

                let config;
                try {
                    config = await response.json();
                } catch (jsonError) {
                    throw new Error(`配置数据解析失败: ${jsonError.message}`);
                }

                // 使用默认值确保表单不会出现空值
                const defaults = {
                    userScriptPath: '../GitHub_zh-CN.user.js',
                    backupDir: '../backups',
                    minStringLength: 2,
                    maxStringLength: 100,
                    httpTimeout: 30000,
                    maxRetries: 3,
                    retryDelay: 2000,
                    requestDelay: 1000,
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                    debugMode: false,
                    debugOutputFile: '../debug/fetched_strings.json',
                    exactMatchOnly: false,
                    ignoreWords: [],
                    ignorePatterns: [],
                    includePatterns: [],
                    enableExternalTranslation: true,
                    externalTranslationMinLength: 2,
                    externalTranslationMaxLength: 500,
                    externalTranslationTimeout: 10000,
                    externalTranslationDelay: 500,
                    routeChangeDelay: 500,
                    throttleInterval: 200,
                    enableUpdateCheck: true,
                    enableDeepDomObserver: true
                };

                // 合并配置并填充表单
                const mergedConfig = { ...defaults, ...config };

                document.getElementById('userScriptPath').value = mergedConfig.userScriptPath;
                document.getElementById('backupDir').value = mergedConfig.backupDir;
                document.getElementById('minStringLength').value = mergedConfig.minStringLength;
                document.getElementById('maxStringLength').value = mergedConfig.maxStringLength;
                document.getElementById('httpTimeout').value = mergedConfig.httpTimeout;
                document.getElementById('maxRetries').value = mergedConfig.maxRetries;
                document.getElementById('retryDelay').value = mergedConfig.retryDelay;
                document.getElementById('requestDelay').value = mergedConfig.requestDelay;
                document.getElementById('userAgent').value = mergedConfig.userAgent;
                document.getElementById('debugMode').checked = mergedConfig.debugMode;
                document.getElementById('debugOutputFile').value = mergedConfig.debugOutputFile;
                document.getElementById('exactMatchOnly').checked = mergedConfig.exactMatchOnly;
                document.getElementById('ignoreWords').value = (mergedConfig.ignoreWords || defaults.ignoreWords).join(', ');
                document.getElementById('ignorePatterns').value = (mergedConfig.ignorePatterns || defaults.ignorePatterns).join('\n');
                document.getElementById('includePatterns').value = (mergedConfig.includePatterns || defaults.includePatterns).join('\n');
                
                // 填充用户脚本设置
                document.getElementById('scriptExternalTranslation').checked = mergedConfig.enableExternalTranslation;
                document.getElementById('scriptMinTranslationLength').value = mergedConfig.externalTranslationMinLength;
                document.getElementById('scriptMaxTranslationLength').value = mergedConfig.externalTranslationMaxLength;
                document.getElementById('scriptTranslationTimeout').value = mergedConfig.externalTranslationTimeout;
                document.getElementById('scriptRequestDelay').value = mergedConfig.externalTranslationDelay;
                document.getElementById('scriptRouteChangeDelay').value = mergedConfig.routeChangeDelay;
                document.getElementById('scriptThrottleInterval').value = mergedConfig.throttleInterval;
                document.getElementById('scriptCheckUpdate').checked = mergedConfig.enableUpdateCheck;
                document.getElementById('scriptEnableDeepObserver').checked = mergedConfig.enableDeepDomObserver;

                // 成功加载，退出循环
                return;
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        // 所有重试都失败
        throw lastError || new Error('加载配置失败，所有重试都已耗尽');
    } catch (error) {
        console.error('加载配置失败:', error);
        addLog(`加载配置失败: ${error}`, 'error');
    }
}

// 加载页面配置
async function loadPagesConfig() {
    try {
        // 添加重试逻辑
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // 使用带超时的fetch
                const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
                    return new Promise((resolve, reject) => {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => {
                            controller.abort();
                            reject(new Error(`请求超时: ${timeout}ms后未响应`));
                        }, timeout);

                        fetch(url, { ...options, signal: controller.signal })
                            .then(response => {
                                clearTimeout(timeoutId);
                                resolve(response);
                            })
                            .catch(error => {
                                clearTimeout(timeoutId);
                                reject(error);
                            });
                    });
                };

                const response = await fetchWithTimeout('/utils/api/pages.json');

                // 检查响应状态
                if (!response.ok) {
                    throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
                }

                // 检查响应内容类型
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    // 如果不是JSON，尝试获取HTML内容并解析错误
                    const text = await response.text();
                    throw new Error(`无效的响应格式: 期望JSON但收到HTML. 状态码: ${response.status}`);
                }

                // 解析JSON响应
                let pages;
                try {
                    pages = await response.json();
                } catch (jsonError) {
                    throw new Error(`JSON解析失败: ${jsonError.message}`);
                }

                const tableBody = document.getElementById('pagesTableBody');
                tableBody.innerHTML = '';

                // 确保pages是数组
                if (!Array.isArray(pages)) {
                    throw new Error('页面配置格式错误: 期望数组但收到其他类型');
                }

                // 检查是否为空数组，显示友好的空状态提示
                if (pages.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">没有配置的页面，请点击"添加页面"按钮添加新页面</td></tr>';
                } else {
                    pages.forEach((page, index) => {
                        // 验证每个页面配置的必需字段
                        if (!page.url || !page.selector || !page.module) {
                            console.warn(`页面配置 ${index} 缺少必需字段:`, page);
                            return;
                        }

                        const newRow = document.createElement('tr');
                        newRow.setAttribute('data-index', index);
                        newRow.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escapeHTML(page.url)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHTML(page.selector)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHTML(page.module)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button class="text-primary hover:text-primary/80 mr-3 edit-page">
                                    <i class="fa fa-pencil"></i>
                                </button>
                                <button class="text-danger hover:text-danger/80 delete-page">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </td>
                        `;
                        tableBody.appendChild(newRow);

                        // 绑定事件
                        newRow.querySelector('.edit-page').addEventListener('click', function() {
                            showEditPageModal(index);
                        });

                        newRow.querySelector('.delete-page').addEventListener('click', function() {
                            deletePage(index);
                        });
                    });
                }

                // 更新页面计数
                updatePagesCount();

                // 成功加载，退出循环
                return;
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    console.warn(`第${attempt}次加载页面配置失败，${attempt+1}秒后重试...`, error);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        // 所有重试都失败
        throw lastError || new Error('加载页面配置失败，所有重试都已耗尽');
    } catch (error) {
        console.error('加载页面配置失败:', error);
        addLog(`加载页面配置失败: ${error}`, 'error');

        // 在错误情况下显示默认页面配置
        try {
            const tableBody = document.getElementById('pagesTableBody');
            tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">无法加载页面配置，请刷新页面重试</td></tr>';
            updatePagesCount();
        } catch (uiError) {
            console.error('更新UI失败:', uiError);
        }
    }
}

// HTML转义函数，防止XSS攻击
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 加载统计数据
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        const stats = await response.json();

        if (stats.lastUpdate) {
            const date = new Date(stats.lastUpdate);
            document.getElementById('lastUpdate').textContent = date.toLocaleString();
        }

        document.getElementById('extractedCount').textContent = stats.extractedCount || 0;
        document.getElementById('addedCount').textContent = stats.addedCount || 0;
    } catch (error) {
        console.error('加载统计数据失败:', error);
        addLog(`加载统计数据失败: ${error}`, 'error');
    }
}

// 重置配置
function resetConfig() {
    if (confirm('确定要重置所有配置吗？')) {
        // 使用默认配置
        document.getElementById('userScriptPath').value = '../GitHub_zh-CN.user.js';
        document.getElementById('backupDir').value = '../backups';
        document.getElementById('minStringLength').value = 2;
        document.getElementById('maxStringLength').value = 100;
        document.getElementById('httpTimeout').value = 30000;
        document.getElementById('maxRetries').value = 3;
        document.getElementById('retryDelay').value = 2000;
        document.getElementById('userAgent').value = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
        document.getElementById('debugMode').checked = false;
        document.getElementById('debugOutputFile').value = '../debug/fetched_strings.json';

        // 保存默认配置
        saveConfig();
    }
}

// 重置用户脚本配置
function resetUserScriptConfig() {
    if (confirm('确定要重置用户脚本设置吗？')) {
        // 使用用户脚本默认配置
        document.getElementById('scriptExternalTranslation').checked = true;
        document.getElementById('scriptMinTranslationLength').value = 20;
        document.getElementById('scriptMaxTranslationLength').value = 500;
        document.getElementById('scriptTranslationTimeout').value = 3000;
        document.getElementById('scriptRequestDelay').value = 500;
        document.getElementById('scriptRouteChangeDelay').value = 500;
        document.getElementById('scriptThrottleInterval').value = 100;
        document.getElementById('scriptCheckUpdate').checked = true;
        document.getElementById('scriptEnableDeepObserver').checked = true;

        // 保存默认用户脚本配置
        saveUserScriptSettings();
    }
}

// 显示添加页面对话框
function showAddPageModal() {
    document.getElementById('modalTitle').textContent = '添加GitHub页面';
    document.getElementById('pageUrl').value = '';
    document.getElementById('pageSelector').value = 'body';
    document.getElementById('pageModule').value = 'global';
    document.getElementById('pageModal').classList.remove('hidden');
    document.getElementById('pageUrl').focus();
}

// 显示编辑页面对话框
function showEditPageModal(index) {
    // 获取当前页面数据
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (row) {
        const cells = row.querySelectorAll('td');
        document.getElementById('modalTitle').textContent = '编辑GitHub页面';
        document.getElementById('pageUrl').value = cells[0].textContent;
        document.getElementById('pageSelector').value = cells[1].textContent;
        document.getElementById('pageModule').value = cells[2].textContent;
        document.getElementById('pageModal').classList.remove('hidden');

        // 存储当前编辑的索引
        document.getElementById('pageModal').setAttribute('data-edit-index', index);
    }
}

// 隐藏页面对话框
function hidePageModal() {
    document.getElementById('pageModal').classList.add('hidden');
    document.getElementById('pageModal').removeAttribute('data-edit-index');
}

// 保存页面配置
async function savePage() {
    const url = document.getElementById('pageUrl').value.trim();
    const selector = document.getElementById('pageSelector').value.trim();
    const module = document.getElementById('pageModule').value.trim();

    // 验证输入
    if (!url) {
        alert('请填写GitHub页面URL');
        document.getElementById('pageUrl').focus();
        return;
    }

    if (!selector) {
        alert('请填写选择器');
        document.getElementById('pageSelector').focus();
        return;
    }

    if (!module) {
        alert('请填写模块名称');
        document.getElementById('pageModule').focus();
        return;
    }

    // 验证URL格式
    try {
        new URL(url);
    } catch (e) {
        alert('请输入有效的GitHub URL');
        document.getElementById('pageUrl').focus();
        return;
    }

    // 检查是否是编辑模式
    const editIndex = document.getElementById('pageModal').getAttribute('data-edit-index');

    try {
        // 确保先获取最新的页面配置
        let pages = [];
        try {
            const response = await fetch(`${API_BASE_URL}/api/pages`, {
                method: 'GET',
                timeout: 3000
            });

            if (!response.ok) {
                throw new Error(`获取页面配置失败: ${response.status}`);
            }

            pages = await response.json();
            // 确保pages是数组
            if (!Array.isArray(pages)) {
                pages = [];
            }
        } catch (getError) {
            addLog(`获取现有页面配置失败: ${getError}`, 'error');
            alert('获取现有页面配置失败，请刷新页面重试');
            return;
        }

        // 检查URL是否已存在（除了编辑的当前项）
        const duplicateIndex = pages.findIndex((page, index) =>
            page.url === url && (editIndex === null || index != editIndex)
        );

        if (duplicateIndex !== -1) {
            alert('该GitHub URL已存在于配置中');
            return;
        }

        if (editIndex !== null) {
            // 编辑现有页面
            const numericIndex = parseInt(editIndex);
            if (!isNaN(numericIndex) && numericIndex >= 0 && numericIndex < pages.length) {
                pages[numericIndex] = { url, selector, module };
            } else {
                throw new Error('无效的编辑索引');
            }
        } else {
            // 添加新页面
            pages.push({ url, selector, module });
        }

        // 保存到服务器
        const saveResponse = await fetch(`${API_BASE_URL}/api/pages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pages),
            timeout: 5000
        });

        if (!saveResponse.ok) {
            throw new Error(`服务器响应错误: ${saveResponse.status} ${saveResponse.statusText}`);
        }

        const saveResult = await saveResponse.json();

        if (saveResult.success) {
            // 重新加载页面配置
            await loadPagesConfig().catch(err => {
                addLog(`重新加载页面配置失败: ${err}`, 'error');
            });

            // 隐藏对话框
            hidePageModal();

            // 显示成功消息
            addLog(editIndex !== null ? '页面配置已更新' : '页面已添加', 'success');
        } else {
            addLog(`保存页面配置失败: ${saveResult.message || '未知错误'}`, 'error');
        }
    } catch (error) {
        addLog(`保存页面配置时发生错误: ${error}`, 'error');
    }
}
// 删除页面
async function deletePage(index) {
    if (confirm('确定要删除这个页面配置吗？')) {
        try {
            // 获取当前页面配置
            const response = await fetch(`${API_BASE_URL}/api/pages`);
            let pages = await response.json();

            // 删除指定页面
            pages.splice(index, 1);

            // 保存到服务器
            const saveResponse = await fetch(`${API_BASE_URL}/api/pages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pages)
            });

            const saveResult = await saveResponse.json();

            if (saveResult.success) {
                // 重新加载页面配置
                await loadPagesConfig();

                // 显示成功消息
                addLog('页面已删除', 'success');
            } else {
                addLog(`删除页面失败: ${saveResult.message || '未知错误'}`, 'error');
            }
        } catch (error) {
            addLog(`删除页面时发生错误: ${error}`, 'error');
        }
    }
}

// 更新页面计数
function updatePagesCount() {
    const count = document.querySelectorAll('#pagesTableBody tr').length;
    document.getElementById('pagesCount').textContent = count;
}

// 显示帮助对话框
function showHelpModal() {
    document.getElementById('helpModal').classList.remove('hidden');
}

// 隐藏帮助对话框
function hideHelpModal() {
    document.getElementById('helpModal').classList.add('hidden');
}

// 查看备份
function viewBackup() {
    // 首先尝试通过API获取备份目录路径
    fetchWithTimeout(`${API_BASE_URL}/api/open-backup-dir`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }, 10000) // 10秒超时
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // 无论服务器返回什么状态，都显示备份路径对话框
        // 因为由于浏览器安全限制，无法直接从浏览器打开文件系统
        showBackupPathDialog(data.backupDir || '../backups');
    })
    .catch(error => {
        console.error('获取备份目录路径时出错:', error);
        addLog(`获取备份目录路径时发生错误: ${error.message || error}`, 'error');
        showBackupPathDialog('../backups');
    });
}

// 显示备份路径对话框，提供复制功能
function showBackupPathDialog(path) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
    dialog.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 class="text-xl font-semibold mb-4">备份目录路径</h3>
            <div class="flex mb-4">
                <input type="text" value="${escapeHTML(path)}" readonly 
                       class="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-secondary" 
                       id="backupPathInput">
                <button id="copyBackupPathBtn" 
                        class="bg-secondary text-white px-4 py-2 rounded-r-md hover:bg-secondary/80 transition-colors">
                    复制
                </button>
            </div>
            <p class="text-sm text-gray-500 mb-4">
                由于浏览器安全限制，无法直接打开文件系统。请手动导航到上述目录查看备份文件。
            </p>
            <div class="flex justify-end">
                <button id="closeBackupDialogBtn" 
                        class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                    关闭
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 绑定复制按钮事件
    dialog.querySelector('#copyBackupPathBtn').addEventListener('click', function() {
        const input = dialog.querySelector('#backupPathInput');
        input.select();
        document.execCommand('copy');
        
        // 显示复制成功提示
        this.textContent = '已复制!';
        setTimeout(() => {
            this.textContent = '复制';
        }, 2000);
    });
    
    // 绑定关闭按钮事件
    dialog.querySelector('#closeBackupDialogBtn').addEventListener('click', function() {
        document.body.removeChild(dialog);
    });
    
    // 点击外部区域关闭对话框
    dialog.addEventListener('click', function(event) {
        if (event.target === dialog) {
            document.body.removeChild(dialog);
        }
    });
}



// 页面关闭时确保关闭SSE连接
window.addEventListener('beforeunload', function() {
    if (eventSource) {
        eventSource.close();
    }
});

// 保存所有页面配置
async function savePagesConfig() {
    try {
        // 获取当前表格中的所有页面配置
        const tableRows = document.querySelectorAll('#pagesTableBody tr[data-index]');
        const pages = Array.from(tableRows).map((row, index) => {
            const cells = row.querySelectorAll('td');
            return {
                url: cells[0].textContent,
                selector: cells[1].textContent,
                module: cells[2].textContent
            };
        });

        // 保存到服务器
        const saveResponse = await fetch(`${API_BASE_URL}/api/pages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pages),
            timeout: 5000
        });

        if (!saveResponse.ok) {
            throw new Error(`服务器响应错误: ${saveResponse.status} ${saveResponse.statusText}`);
        }

        const saveResult = await saveResponse.json();

        if (saveResult.success) {
            // 显示成功消息
            addLog('GitHub页面配置已保存', 'success');
        } else {
            addLog(`保存页面配置失败: ${saveResult.message || '未知错误'}`, 'error');
        }
    } catch (error) {
        addLog(`保存页面配置时发生错误: ${error}`, 'error');
    }
}

// 重置工具状态
async function resetToolStatus() {
    try {
        // 显示确认对话框
        if (!confirm('确定要重置工具状态吗？这将清除当前的运行锁，允许重新开始抓取字符串。')) {
            return;
        }
        
        // 检查服务器状态
        const serverStatus = await checkServerStatus();
        if (!serverStatus) {
            addLog('服务器连接失败，请检查服务器是否正常运行', 'error');
            return;
        }
        
        // 调用重置API
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // 重置UI状态
            updateStatus('stopped');
            updateProgress(0, 0, 0);
            
            // 确保按钮状态正确
            const toggleBtn = document.getElementById('toggleBtn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始抓取字符串';
                toggleBtn.classList.remove('bg-danger', 'hover:bg-danger/90');
                toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');
            }
            
            // 显示成功消息
            addLog('工具状态已成功重置', 'success');
            
            // 重新检查服务器状态
            setTimeout(checkServerStatus, 1000);
        } else {
            addLog(`重置工具状态失败: ${result.message || '未知错误'}`, 'error');
        }
    } catch (error) {
        addLog(`重置工具状态时发生错误: ${error}`, 'error');
    }
}
