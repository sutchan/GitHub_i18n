// 词典处理工具测试文件
// 作者: SutChan
// 版本: 1.0.0

const { 
  extractDictionaryFromUserScript,
  readDictionaryFromJson,
  saveDictionaryToJson,
  writeDictionaryToUserScript,
  optimizeDictionary,
  saveExtractedStringsToDictionary
} = require('./dictionary_processor');

/**
 * 测试主函数
 */
async function test() {
  console.log('===== 词典处理工具测试 =====\n');
  
  try {
    // 1. 测试从用户脚本导出词典
    console.log('1. 测试从用户脚本导出词典...');
    try {
      const dictionary = await extractDictionaryFromUserScript();
      console.log(`   成功导出词典，包含 ${Object.keys(dictionary).length} 个模块`);
      
      // 显示前几个模块作为示例
      const moduleNames = Object.keys(dictionary).slice(0, 3);
      moduleNames.forEach(module => {
        const stringCount = Object.keys(dictionary[module]).length;
        console.log(`   - ${module}: ${stringCount} 个字符串`);
      });
    } catch (error) {
      console.error('   导出词典失败:', error.message);
    }
    
    // 2. 测试优化词典功能
    console.log('\n2. 测试优化词典功能...');
    try {
      // 创建一个测试用的词典对象
      const testDictionary = {
        module1: {
          'Hello': '你好',
          'World': '世界',
          'Hello': '你好', // 重复的字符串
          '': '空字符串' // 空字符串
        },
        module2: {
          'GitHub': 'GitHub',
          'Repository': '仓库',
          'Repository': '仓库' // 重复的字符串
        }
      };
      
      const optimized = optimizeDictionary(testDictionary);
      console.log(`   词典优化完成`);
      console.log(`   原始模块数: ${Object.keys(testDictionary).length}, 优化后模块数: ${Object.keys(optimized).length}`);
      
      let originalTotal = 0;
      let optimizedTotal = 0;
      for (const module in testDictionary) {
        originalTotal += Object.keys(testDictionary[module]).length;
      }
      for (const module in optimized) {
        optimizedTotal += Object.keys(optimized[module]).length;
      }
      console.log(`   原始字符串数: ${originalTotal}, 优化后字符串数: ${optimizedTotal}`);
    } catch (error) {
      console.error('   优化词典失败:', error.message);
    }
    
    // 3. 测试保存提取的字符串到词典
    console.log('\n3. 测试保存提取的字符串到词典...');
    try {
      // 创建一些测试用的提取字符串
      const testStrings = [
        { text: 'New test string 1', module: 'test' },
        { text: 'New test string 2', module: 'test' },
        { text: 'Another test string', module: 'another' }
      ];
      
      await saveExtractedStringsToDictionary(testStrings);
      console.log(`   成功保存 ${testStrings.length} 个测试字符串到词典`);
      console.log('   注意：这些字符串已标记为"待翻译"，需要手动进行翻译');
    } catch (error) {
      console.error('   保存提取的字符串失败:', error.message);
    }
    
    // 4. 显示使用帮助
    console.log('\n===== 使用帮助 =====');
    console.log('词典处理工具支持以下命令:');
    console.log('  node dictionary_processor.js export - 从用户脚本导出词典到JSON文件');
    console.log('  node dictionary_processor.js import - 从JSON文件导入词典到用户脚本');
    console.log('  node dictionary_processor.js optimize - 优化JSON词典文件');
    console.log('');
    console.log('更多选项可通过 --help 参数查看:');
    console.log('  node dictionary_processor.js --help');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
if (require.main === module) {
  test().catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { test };