# 词典处理翻译工具使用说明

## 概述

词典处理翻译工具（`dictionary_processor.js`）是一个用于管理GitHub中文翻译项目中字符串词典的命令行工具。它提供了以下主要功能：

1. 将从GitHub页面抓取的字符串保存到JSON词典文件
2. 从用户脚本（GitHub_zh-CN.user.js）导出词典到JSON文件
3. 从JSON文件导入词典到用户脚本
4. 优化翻译词典（去重、清理无效字符串等）

## 安装与配置

### 依赖环境

- Node.js >= 14.0.0

### 安装步骤

1. 确保已安装Node.js环境
2. 克隆或下载GitHub_i18n项目
3. 在项目的`utils`目录下运行以下命令安装依赖：

```bash
npm install
```

## 使用方法

### 通过npm脚本使用（推荐）

项目的`package.json`中已配置了以下脚本命令：

```bash
# 从用户脚本导出词典到JSON文件
npm run dictionary:export

# 从JSON文件导入词典到用户脚本
npm run dictionary:import

# 优化JSON词典文件
npm run dictionary:optimize

# 运行工具测试
npm run dictionary:test
```

### 通过命令行直接使用

```bash
# 从用户脚本导出词典到JSON文件
node dictionary_processor.js export

# 从JSON文件导入词典到用户脚本
node dictionary_processor.js import

# 优化JSON词典文件
node dictionary_processor.js optimize

# 查看使用帮助
node dictionary_processor.js --help
```

### 命令行选项

所有命令都支持以下选项：

```bash
--userScriptPath=path      # 指定用户脚本文件路径
--dictionaryFilePath=path  # 指定词典JSON文件路径
--logLevel=level           # 设置日志级别 (error, warn, info, debug)
```

示例：

```bash
node dictionary_processor.js export --logLevel=debug
```

## 自动字符串抓取流程

当运行`auto_string_updater.js`进行字符串抓取时，系统会自动：

1. 从GitHub页面抓取字符串
2. 将抓取的字符串保存到JSON词典文件（`../api/translations.json`）
3. 更新用户脚本（`../GitHub_zh-CN.user.js`）中的翻译词典

这样，您可以通过编辑JSON词典文件来管理翻译，并在需要时将其导入回用户脚本。

## 文件结构

- `dictionary_processor.js` - 词典处理工具的主文件
- `auto_string_updater.js` - 自动化字符串抓取和更新工具（已集成保存到JSON词典功能）
- `test_dictionary_processor.js` - 测试文件
- `../api/translations.json` - 默认的JSON词典文件
- `../GitHub_zh-CN.user.js` - 用户脚本文件

## 词典优化功能

词典优化功能会自动执行以下操作：

1. 移除模块内的重复字符串
2. 移除跨模块的重复字符串（可选）
3. 移除空字符串
4. 清理字符串（去除首尾空格等）
5. 按字母顺序排序字符串

## 注意事项

1. 新添加的字符串会被标记为`"待翻译: [原始字符串]"`，需要手动进行翻译
2. 在导入词典到用户脚本前，建议先创建备份
3. 导入操作会覆盖用户脚本中已有的词典内容，请谨慎使用
4. 优化操作会修改JSON词典文件，请确保在进行重要操作前备份原始文件

## 开发说明

如果您想在其他模块中使用词典处理工具的功能，可以通过以下方式导入：

```javascript
const { 
  extractDictionaryFromUserScript,
  readDictionaryFromJson,
  saveDictionaryToJson,
  writeDictionaryToUserScript,
  optimizeDictionary,
  saveExtractedStringsToDictionary
} = require('./dictionary_processor');
```

## 故障排除

### 常见问题

1. **无法读取/写入文件**
   - 检查文件路径是否正确
   - 检查文件权限是否足够

2. **解析词典失败**
   - 检查JSON文件格式是否正确
   - 检查用户脚本中的词典结构是否符合预期

3. **导入词典后用户脚本无法正常工作**
   - 检查导入的词典格式是否正确
   - 尝试使用备份恢复用户脚本

如果遇到其他问题，可以尝试使用`--logLevel=debug`选项获取更详细的日志信息，以便排查问题。