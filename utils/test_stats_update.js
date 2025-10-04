// 测试脚本：用于验证统计数据更新功能
const fs = require('fs').promises;
const path = require('path');
const { updateStatsAfterRun } = require('./utils.js');

async function testStatsUpdate() {
    try {
        console.log('开始测试统计数据更新...');
        
        // 准备测试数据
        const testStats = {
            extractedCount: 125,
            addedCount: 42,
            errorCount: 0,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            modules: {
                global: { extracted: 85, added: 28 },
                features: { extracted: 40, added: 14 }
            }
        };
        
        // 更新统计数据
        await updateStatsAfterRun('success', testStats);
        console.log('统计数据更新成功！');
        
        // 读取并显示更新后的统计数据
        const statsPath = path.join(__dirname, 'api', 'stats.json');
        const statsContent = await fs.readFile(statsPath, 'utf8');
        const stats = JSON.parse(statsContent);
        
        console.log('\n更新后的统计数据:');
        console.log(`- 提取字符串数量: ${stats.extractedCount}`);
        console.log(`- 新增字符串数量: ${stats.addedCount}`);
        console.log(`- 上次更新时间: ${stats.lastUpdate}`);
        console.log(`- 运行状态: ${stats.lastRunStatus}`);
        console.log(`- 运行次数: ${stats.runCount}`);
        
        console.log('\n统计数据更新测试完成，现在可以在Web界面上查看结果。');
    } catch (error) {
        console.error('测试失败:', error);
    }
}

testStatsUpdate();