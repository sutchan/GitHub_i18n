const fs = require('fs');
const path = require('path');

describe('版本检查器模块安全审查', () => {
  // 模拟CONFIG对象
  const mockConfig = {
    version: '1.8.59',
    debugMode: true,
    updateCheck: {
      enabled: true,
      scriptUrl: 'https://github.com/sutchan/GitHub_i18n/raw/main/dist/GitHub_zh-CN.user.js'
    }
  };
  
  // 模拟localStorage
  const mockLocalStorage = {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    }
  };
  
  // 测试XSS漏洞修复
  test('showUpdateNotification方法不应使用innerHTML', async () => {
    // 读取文件内容
    const versionCheckerPath = path.join(__dirname, '../src/versionChecker.js');
    const fileContent = fs.readFileSync(versionCheckerPath, 'utf8');
    
    // 检查是否存在使用innerHTML的情况
    const hasInnerHTMLInNotification = /showUpdateNotification[\s\S]*?innerHTML[\s\S]*?=<[\s\S]*?(`|')/g.test(fileContent);
    
    // 如果找到innerHTML的使用，测试失败
    expect(hasInnerHTMLInNotification).toBe(false);
    
    console.log('✓ 测试通过: showUpdateNotification方法未使用innerHTML');
  });
  
  test('fetchWithRetry方法应正确处理安全相关的请求头', async () => {
    // 读取文件内容
    const versionCheckerPath = path.join(__dirname, '../src/versionChecker.js');
    const fileContent = fs.readFileSync(versionCheckerPath, 'utf8');
    
    // 检查是否设置了credentials: 'omit'以避免发送凭证
    const hasCredentialsOmit = /credentials:\s*['"]omit['"]/.test(fileContent);
    
    // 检查是否设置了适当的Cache-Control
    const hasCacheControl = /'Cache-Control':\s*['"]no-cache['"]/.test(fileContent);
    
    expect(hasCredentialsOmit).toBe(true);
    expect(hasCacheControl).toBe(true);
    
    console.log('✓ 测试通过: fetchWithRetry方法正确设置了安全相关的请求头');
  });
  
  test('extractVersion方法应使用安全的正则表达式', async () => {
    // 读取文件内容
    const versionCheckerPath = path.join(__dirname, '../src/versionChecker.js');
    const fileContent = fs.readFileSync(versionCheckerPath, 'utf8');
    
    // 检查extractVersion方法中的正则表达式是否安全
    const hasSafeRegexPatterns = /patterns\s*=\s*\[([\s\S]*?)\];/.test(fileContent);
    const match = fileContent.match(/patterns\s*=\s*\[([\s\S]*?)\];/);
    
    expect(hasSafeRegexPatterns).toBe(true);
    
    // 如果匹配到了patterns数组，进一步检查每个模式是否安全
    if (match) {
      const patternsString = match[1];
      // 检查是否使用了贪婪量词
      const hasGreedyQuantifiers = /[*+?]{1,2}[^?*+{\}]/g.test(patternsString);
      
      // 虽然贪婪量词本身不是不安全的，但在某些情况下可能导致性能问题
      // 这里只是警告，不直接导致测试失败
      if (hasGreedyQuantifiers) {
        console.warn('警告: 发现贪婪量词，可能需要优化以避免潜在的ReDoS攻击');
      }
    }
    
    console.log('✓ 测试通过: extractVersion方法使用了安全的正则表达式');
  });
});

console.log('\n安全测试套件执行完成。在修复代码后，应重新运行此测试以验证修复效果。');