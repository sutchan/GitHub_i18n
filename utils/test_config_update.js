// 测试用户脚本配置更新API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3004/api/update-user-script-config';

// 测试数据 - 使用与前端相同的配置格式
const testConfig = {
    debounceDelay: 300,
    routeChangeDelay: 400,
    externalTranslation: {
        enabled: false,
        minLength: 20,
        maxLength: 500,
        timeout: 3000,
        requestInterval: 500
    },
    updateCheck: {
        enabled: true
    },
    performance: {
        enableDeepObserver: false
    }
};

async function testConfigUpdate() {
    console.log('开始测试配置更新API...');
    console.log('测试数据:', testConfig);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testConfig)
        });
        
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('测试成功!');
        console.log('响应结果:', result);
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

testConfigUpdate();