const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

// 导入共享工具函数
const { log, updateStatsAfterRun, validateConfig } = require('./utils');

const app = express();
const PORT = 3000;

// 中间件设置
app.use(express.json());

// 添加CORS支持，允许所有来源的请求
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// 静态文件服务 - 指向包含HTML文件的根目录
app.use(express.static(path.join(__dirname, '..')));

// 配置文件路径 - 正确指向api目录
const CONFIG_PATH = path.join(__dirname, 'api', 'config.json');
const PAGES_PATH = path.join(__dirname, 'api', 'pages.json');
const STATS_PATH = path.join(__dirname, 'api', 'stats.json');
const AUTO_STRING_UPDATER_PATH = path.join(__dirname, 'auto_string_updater.js');

// 当前运行的进程
let runningProcess = null;

/**
 * 初始化配置文件
 * 确保所有必要的配置文件都存在，如果不存在则创建默认配置
 */
async function initializeConfig() {
    try {
        // 确保api目录存在
        const apiDir = path.dirname(CONFIG_PATH);
        await fsPromises.mkdir(apiDir, { recursive: true });
        log('info', 'API目录已准备好');

        try {
            // 检查配置文件是否存在
            await fsPromises.access(CONFIG_PATH);
            log('info', '配置文件已存在');
        } catch (error) {
            // 如果不存在，创建默认配置文件
            const defaultConfig = {
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
                ignoreWords: ['GitHub', 'API', 'URL', 'HTTP', 'HTTPS'],
                ignorePatterns: [],
                includePatterns: []
            };
            await fsPromises.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
            log('info', '已创建默认配置文件');
        }

        try {
            // 检查页面配置文件是否存在
            await fsPromises.access(PAGES_PATH);
            log('info', '页面配置文件已存在');
        } catch (error) {
            // 如果不存在，创建默认页面配置文件
            const defaultPages = [
                { url: 'https://github.com/', selector: 'body', module: 'global' },
                { url: 'https://github.com/features', selector: 'body', module: 'features' }
            ];
            await fsPromises.writeFile(PAGES_PATH, JSON.stringify(defaultPages, null, 2));
            log('info', '已创建默认页面配置文件');
        }

        try {
            // 检查统计文件是否存在
            await fs.access(STATS_PATH);
            log('info', '统计文件已存在');
        } catch (error) {
            // 如果不存在，创建默认统计文件
            const defaultStats = {
                extractedCount: 0,
                addedCount: 0,
                lastUpdate: null,
                lastRunStatus: 'idle',
                runCount: 0
            };
            await fsPromises.writeFile(STATS_PATH, JSON.stringify(defaultStats, null, 2));
            log('info', '已创建默认统计文件');
        }
    } catch (error) {
        log('error', '初始化配置时发生错误:', error);
        // 即使出错也继续运行，使用默认配置
    }
}

/**
 * API端点：获取配置
 */
app.get('/api/config', async (req, res) => {
    try {
        log('debug', '请求获取配置文件');
        // 确保配置文件存在
        await fsPromises.access(CONFIG_PATH);
        const config = JSON.parse(await fsPromises.readFile(CONFIG_PATH, 'utf8'));
        log('debug', '成功获取配置文件');
        res.json(config);
    } catch (error) {
        log('error', '获取配置失败:', error);
        // 如果文件不存在，返回默认配置
        const defaultConfig = {
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
            ignoreWords: ['GitHub', 'API', 'URL', 'HTTP', 'HTTPS'],
            ignorePatterns: [],
            includePatterns: []
        };
        res.status(200).json(defaultConfig);
    }
});

/**
 * API端点：保存配置
 */
app.post('/api/config', async (req, res) => {
    try {
        log('debug', '请求保存配置文件');
        // 验证配置数据
        if (!req.body || typeof req.body !== 'object') {
            throw new Error('配置数据无效，必须是JSON对象');
        }

        // 使用validateConfig函数验证配置
        const validationErrors = validateConfig(req.body);
        if (validationErrors.length > 0) {
            log('warn', '配置验证失败:', validationErrors);
            res.status(400).json({
                success: false,
                message: '配置验证失败',
                errors: validationErrors
            });
            return;
        }

        // 确保api目录存在
        const apiDir = path.dirname(CONFIG_PATH);
        await fsPromises.mkdir(apiDir, { recursive: true });

        await fsPromises.writeFile(CONFIG_PATH, JSON.stringify(req.body, null, 2));
        log('info', '配置文件已成功保存');
        res.json({ success: true, message: '配置已保存' });
    } catch (error) {
        log('error', '保存配置失败:', error);
        res.status(500).json({
            success: false,
            message: '保存配置失败',
            error: error.message
        });
    }
});

/**
 * API端点：获取页面配置
 */
app.get('/api/pages', async (req, res) => {
    try {
        log('debug', '请求获取页面配置');
        
        // 确保配置文件存在
        try {
            await fsPromises.access(PAGES_PATH);
            const pages = JSON.parse(await fsPromises.readFile(PAGES_PATH, 'utf8'));
            
            // 验证返回的数据是数组
            if (!Array.isArray(pages)) {
                throw new Error('页面配置格式错误，应为数组');
            }
            
            log('debug', '成功获取页面配置');
            res.json(pages);
        } catch (error) {
            log('warn', '获取页面配置失败，返回默认配置:', error);
            
            // 返回默认页面配置
            const defaultPages = [
                { url: 'https://github.com', selector: 'body', module: 'global' },
                { url: 'https://github.com/settings/profile', selector: 'body', module: 'settings' },
                { url: 'https://github.com/notifications', selector: 'body', module: 'notifications' },
                { url: 'https://github.com/explore', selector: 'body', module: 'explore' },
                { url: 'https://github.com/search', selector: 'body', module: 'search' }
            ];
            res.status(200).json(defaultPages);
        }
    } catch (error) {
        log('error', '获取页面配置失败:', error);
        res.status(500).json({
            success: false,
            message: '读取页面配置失败',
            error: error.message
        });
    }
});

/**
 * 验证页面配置数组
 * @param {Array} pages - 页面配置数组
 * @returns {Array<string>} 验证错误列表，为空表示验证通过
 */
function validatePageConfigs(pages) {
    const errors = [];
    
    // 验证是否为数组
    if (!Array.isArray(pages)) {
        errors.push('页面配置必须是数组格式');
        return errors;
    }
    
    // 验证数组长度
    if (pages.length === 0) {
        errors.push('页面配置数组不能为空');
    }
    
    // 验证每个页面配置项
    pages.forEach((page, index) => {
        const pageErrors = [];
        
        if (!page || typeof page !== 'object') {
            errors.push(`索引 ${index} 处的配置不是有效的对象`);
            return;
        }
        
        // 验证必需字段
        if (!page.url || typeof page.url !== 'string' || page.url.trim() === '') {
            pageErrors.push('url 字段必须是非空字符串');
        }
        
        if (!page.selector || typeof page.selector !== 'string' || page.selector.trim() === '') {
            pageErrors.push('selector 字段必须是非空字符串');
        }
        
        if (!page.module || typeof page.module !== 'string' || page.module.trim() === '') {
            pageErrors.push('module 字段必须是非空字符串');
        }
        
        // 验证URL格式
        if (page.url) {
            try {
                new URL(page.url);
            } catch (e) {
                pageErrors.push(`url 格式无效: ${page.url}`);
            }
        }
        
        if (pageErrors.length > 0) {
            errors.push(`索引 ${index} 处的页面配置错误: ${pageErrors.join(', ')}`);
        }
    });
    
    return errors;
}

/**
 * API端点：保存页面配置
 */
app.post('/api/pages', async (req, res) => {
    try {
        log('debug', '请求保存页面配置');
        
        // 验证输入数据
        if (!req.body) {
            throw new Error('页面配置数据不能为空');
        }
        
        // 验证页面配置数组
        const validationErrors = validatePageConfigs(req.body);
        if (validationErrors.length > 0) {
            log('warn', '页面配置验证失败:', validationErrors);
            res.status(400).json({
                success: false,
                message: '页面配置验证失败',
                errors: validationErrors
            });
            return;
        }
        
        // 确保api目录存在
        const apiDir = path.dirname(PAGES_PATH);
        await fsPromises.mkdir(apiDir, { recursive: true });
        
        await fsPromises.writeFile(PAGES_PATH, JSON.stringify(req.body, null, 2));
        log('info', '页面配置已成功保存');
        res.json({ success: true, message: '页面配置已保存' });
    } catch (error) {
        log('error', '保存页面配置失败:', error);
        res.status(500).json({
            success: false,
            message: '保存页面配置失败',
            error: error.message
        });
    }
});

/**
 * API端点：获取统计数据
 */
app.get('/api/stats', async (req, res) => {
    try {
        log('debug', '请求获取统计数据');
        
        // 确保统计文件存在
        try {
            await fsPromises.access(STATS_PATH);
            const stats = JSON.parse(await fsPromises.readFile(STATS_PATH, 'utf8'));
            
            // 验证返回的数据是对象
            if (!stats || typeof stats !== 'object') {
                throw new Error('统计数据格式错误，应为对象');
            }
            
            log('debug', '成功获取统计数据');
            res.json(stats);
        } catch (error) {
            log('warn', '获取统计数据失败，返回默认统计数据:', error);
            
            // 返回默认统计数据
            const defaultStats = {
                totalStrings: 0,
                translatedStrings: 0,
                skippedStrings: 0,
                errorCount: 0,
                lastRun: null,
                runHistory: [],
                modules: {}
            };
            res.status(200).json(defaultStats);
        }
    } catch (error) {
        log('error', '获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '读取统计数据失败',
            error: error.message
        });
    }
});

/**
 * API端点：运行工具（使用SSE实时返回结果）
 */
app.get('/api/run', (req, res) => {
    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    console.log('请求运行工具');

    // 检查是否已有运行中的进程
    if (runningProcess) {
        console.warn('工具已经在运行中，拒绝新的请求');
        res.write(`data: {"type":"error","message":"工具已经在运行中，请先停止当前运行的任务"}\n\n`);
        res.end();
        return;
    }

    // 确保临时统计文件目录存在
    const tempStatsPath = path.join(__dirname, 'temp_stats.json');
    try {
        const tempStatsDir = path.dirname(tempStatsPath);
        fs.mkdirSync(tempStatsDir, { recursive: true });
        // 初始化临时统计文件
        fs.writeFileSync(tempStatsPath, JSON.stringify({ extractedCount: 0, addedCount: 0 }));
        console.log('已创建临时统计文件');
    } catch (error) {
        console.error('创建临时统计文件失败:', error.message);
        res.write(`data: {"type":"error","message":"创建临时统计文件失败: ${error.message.replace(/"/g, '\\"')}"}\n\n`);
        res.end();
        return;
    }

    // 发送开始消息
        res.write(`data: {"type":"start","message":"工具正在启动..."}\n\n`);

        try {
            // 运行auto_string_updater.js
            console.log(`准备运行: node ${AUTO_STRING_UPDATER_PATH}`);
            console.log(`当前工作目录: ${__dirname}`);
            runningProcess = exec(`node ${AUTO_STRING_UPDATER_PATH}`, {
                cwd: __dirname,
                // 设置合理的超时时间（例如，10分钟）
                timeout: 600000
            });
            console.log(`子进程已创建: ${runningProcess.pid}`);

            log('info', `已启动子进程: ${runningProcess.pid}`);

        // 处理stdout
            runningProcess.stdout.on('data', (data) => {
                try {
                    const lines = data.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            const escapedMessage = line.trim().replace(/"/g, '\\"').replace(/\\n/g, '\\\\n');
                            log('debug', `子进程输出: ${line.trim()}`);
                            res.write(`data: {"type":"log","message":"${escapedMessage}"}\n\n`);
                        }
                    });
                } catch (error) {
                    log('error', '处理子进程输出时出错:', error);
                }
            });

        // 处理stderr
            runningProcess.stderr.on('data', (data) => {
                try {
                    const lines = data.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            const escapedMessage = line.trim().replace(/"/g, '\\"').replace(/\\n/g, '\\\\n');
                            log('error', `子进程错误: ${line.trim()}`);
                            res.write(`data: {"type":"error","message":"${escapedMessage}"}\n\n`);
                        }
                    });
                } catch (error) {
                    log('error', '处理子进程错误时出错:', error);
                }
            });

        // 处理进程结束
            runningProcess.on('close', (code) => {
                runningProcess = null;
                log('info', `子进程已退出，退出码: ${code}`);

                // 更新统计数据
                updateStatsAfterRun(code === 0 ? 'success' : 'failed', null, STATS_PATH, path.join(__dirname, 'temp_stats.json'))
                    .then(() => {
                        log('debug', '统计数据已更新');
                    })
                    .catch((error) => {
                        log('error', '更新统计数据失败:', error);
                    });

            try {
                if (code === 0) {
                    res.write(`data: {"type":"complete","message":"工具运行完成"}\n\n`);
                } else {
                    res.write(`data: {"type":"error","message":"工具运行失败，退出码: ${code}"}\n\n`);
                }
            } catch (error) {
                console.error('发送完成消息时出错:', error.message);
            }

            // 关闭连接
            res.end();
        });

        // 处理进程错误
            runningProcess.on('error', (error) => {
                log('error', `子进程发生错误: ${error.message}`);
                runningProcess = null;
                
                try {
                    res.write(`data: {"type":"error","message":"子进程执行错误: ${error.message.replace(/"/g, '\\"')}"}\n\n`);
                } catch (e) {
                    log('error', '发送错误消息时出错:', e);
                }
                
                // 更新统计数据为失败
                updateStatsAfterRun('failed', null, STATS_PATH, path.join(__dirname, 'temp_stats.json'))
                    .then(() => {
                        log('debug', '统计数据已更新为失败状态');
                    })
                    .catch((e) => {
                        log('error', '更新统计数据失败:', e);
                    });
            
            res.end();
        });

        // 处理连接关闭
            req.on('close', () => {
                if (runningProcess) {
                    log('info', '客户端断开连接，正在终止子进程');
                    try {
                        // 在Windows上，需要使用taskkill来终止进程树
                        if (process.platform === 'win32') {
                            exec(`taskkill /F /PID ${runningProcess.pid} /T`, (error) => {
                                if (error) {
                                    log('error', '终止Windows进程时出错:', error);
                                } else {
                                    log('debug', '已成功终止Windows进程');
                                }
                            });
                        } else {
                            // 在非Windows系统上使用kill方法
                            const killed = runningProcess.kill();
                            log('debug', `终止进程结果: ${killed ? '成功' : '失败'}`);
                        }
                    } catch (error) {
                        log('error', '终止进程时出错:', error);
                    }
                    runningProcess = null;
                }
            });
    } catch (error) {
            log('error', '启动子进程失败:', error);
            runningProcess = null;
            res.write(`data: {"type":"error","message":"启动工具失败: ${error.message.replace(/"/g, '\\"')}"}\n\n`);
            res.end();
        }
});

/**
 * API端点：停止工具
 */
app.get('/api/stop', (req, res) => {
    if (runningProcess) {
        log('info', `尝试停止运行中的子进程: ${runningProcess.pid}`);
        
        try {
            // 在Windows上，需要使用taskkill来终止进程树
            if (process.platform === 'win32') {
                exec(`taskkill /F /PID ${runningProcess.pid} /T`, (error) => {
                    if (error) {
                        log('error', '终止Windows进程时出错:', error);
                        res.json({ success: false, message: '停止工具失败', error: error.message });
                    } else {
                        log('info', '已成功终止Windows进程');
                        runningProcess = null;
                        res.json({ success: true, message: '工具已停止' });
                    }
                });
            } else {
                // 在非Windows系统上使用kill方法
                const killed = runningProcess.kill();
                log('debug', `终止进程结果: ${killed ? '成功' : '失败'}`);
                
                if (killed) {
                    runningProcess = null;
                    res.json({ success: true, message: '工具已停止' });
                } else {
                    res.json({ success: false, message: '停止工具失败，进程可能已经结束' });
                }
            }
        } catch (error) {
            log('error', '停止工具时捕获异常:', error);
            runningProcess = null; // 即使出错，也尝试将进程标记为null
            res.json({ success: false, message: '停止工具失败', error: error.message });
        }
    } else {
        log('debug', '没有运行中的工具进程');
        res.json({ success: true, message: '工具未在运行' });
    }
});

// 注意：updateStatsAfterRun函数已移至utils.js文件中

/**
 * API端点：查看备份目录
 */
app.get('/api/view-backup', async (req, res) => {
    try {
        const config = JSON.parse(await fsPromises.readFile(CONFIG_PATH, 'utf8'));
        const backupDir = path.resolve(__dirname, config.backupDir || '../backups');

        // 在实际应用中，可以返回备份文件列表或打开备份目录
        res.json({
            success: true,
            message: '备份目录信息已获取',
            backupDir: backupDir
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取备份目录信息失败', error: error.message });
    }
});

/**
 * 启动服务器
 */
async function startServer() {
    try {
        // 初始化配置文件
        await initializeConfig();

        // 启动服务器
        app.listen(PORT, () => {
            log('info', `服务器运行在 http://localhost:${PORT}`);
            log('info', '请在浏览器中打开上述地址以使用Web界面');
        });
    } catch (error) {
        log('error', '启动服务器失败:', error);
    }
}

// 启动服务器
startServer();