// 测试SSE连接的脚本
// 此脚本用于验证修复后的SSE连接是否能够保持足够长的时间

const EventSource = require('eventsource');

console.log('开始测试SSE连接...');
console.log('连接到: http://localhost:3004/api/run');

// 创建SSE连接 - 正确的实例化方式
eventSource = new EventSource('http://localhost:3004/api/run');

// 记录开始时间
const startTime = new Date();

// 连接成功处理
eventSource.onopen = function() {
    console.log('[连接状态] 已成功连接到服务器');
    console.log(`[连接状态] 当前时间: ${new Date().toLocaleTimeString()}`);
};

// 处理消息事件
eventSource.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);
        const currentTime = new Date().toLocaleTimeString();
        
        // 只打印关键信息，避免输出过多
        if (data.type === 'start' || data.type === 'complete' || data.type === 'error') {
            console.log(`[${data.type.toUpperCase()}] ${currentTime} - ${data.message}`);
        } else if (data.message && 
                  (data.message.includes('处理完成') || 
                   data.message.includes('添加了') || 
                   data.message.includes('已完成'))) {
            console.log(`[${data.type.toUpperCase()}] ${currentTime} - ${data.message}`);
        }
        
        // 计算已运行时间
        const runTime = Math.round((new Date() - startTime) / 1000);
        if (runTime % 30 === 0) {
            console.log(`[连接状态] 连接已保持 ${runTime} 秒...`);
        }
        
    } catch (e) {
        console.error(`解析服务器消息失败: ${e}`);
    }
};

// 处理错误事件
eventSource.onerror = function(event) {
    const currentTime = new Date().toLocaleTimeString();
    
    if (event && event.target && event.target.readyState === EventSource.CLOSED) {
        console.log(`[连接状态] ${currentTime} - 与服务器的连接已关闭`);
    } else {
        console.error(`[连接错误] ${currentTime} - 与服务器的连接中断`);
    }
};

// 监听进程终止
signalEvents = ['SIGINT', 'SIGTERM'];
signalEvents.forEach(signal => {
    process.on(signal, () => {
        console.log('\n接收到终止信号，正在关闭连接...');
        if (eventSource) {
            eventSource.close();
        }
        process.exit(0);
    });
});

// 设置超时，防止测试无限运行（6分钟后自动结束）
setTimeout(() => {
    console.log('\n测试已达到最大运行时间(6分钟)，正在停止...');
    if (eventSource) {
        eventSource.close();
    }
    process.exit(0);
}, 360000); // 6分钟 = 360000毫秒

console.log('测试脚本已启动，请按 Ctrl+C 停止测试');
console.log('-----------------------------------');