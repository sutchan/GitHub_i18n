# GitHub i18n 自动化工具

此工具用于自动化从 GitHub 网站抓取字符串并更新翻译词典，帮助维护者持续更新 GitHub 中文翻译词典。

## 功能特点

- 自动从多个 GitHub 核心页面抓取文本字符串
- 根据页面类型智能分类字符串到相应模块
- 自动更新翻译词典，避免重复添加已存在的字符串
- 自动备份原始文件，确保安全
- 支持请求重试和超时处理，提高稳定性
- 增强的错误处理机制，包括输入验证、异常捕获和友好的错误提示
- 健壮的 API 端点测试工具，支持超时检测和自动重试
- 完善的状态管理，确保工具在各种情况下都能正常工作
- 词典优化功能，自动移除重复和无效字符串
- 词典导入导出功能，支持 JSON 格式

## 安装依赖

### 从项目根目录（推荐）

```bash
npm run tools:install
```

### 或在 utils 目录内

```bash
cd utils
npm install
```

这会安装包括 jsdom、express、cors 和 morgan 在内的所有必要依赖。

## 工具说明

### 1. 词典处理工具 (dictionary_processor.js)

用于管理翻译词典的命令行工具。

**可用命令：**

```bash
# 从源文件导出词典到 JSON 文件
node dictionary_processor.js export

# 从 JSON 文件导入词典到源文件
node dictionary_processor.js import

# 优化源文件中的词典（去重、清理）
node dictionary_processor.js optimize

# 查看帮助
node dictionary_processor.js help
```

**选项：**
- `--srcDir=path` - 指定源文件目录
- `--dictionaryFilePath=path` - 指定词典JSON文件路径
- `--logLevel=level` - 设置日志级别 (error, warn, info, debug)

### 2. 自动化工具服务器 (auto_string_updater.js)

提供 Web 界面和 REST API 的完整工具。

**启动服务器：**

```bash
# 从项目根目录
npm run tools:server

# 或在 utils 目录内
npm start
```

然后打开浏览器访问 http://localhost:3000

### 3. 字符串采集工具 (string_collector.js)

可作为独立模块使用的字符串采集工具。

## 从项目根目录使用（推荐）

为了方便使用，我们提供了以下 npm 脚本：

```bash
# 安装工具依赖
npm run tools:install

# 启动自动化工具服务器
npm run tools:server
npm run tools:start

# 词典导出
npm run dictionary:export

# 词典导入
npm run dictionary:import

# 词典优化
npm run dictionary:optimize
```

## REST API 端点

服务器提供以下 API 端点：

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/stats | 获取统计信息 |
| GET | /api/dictionary | 获取词典（支持 search 查询参数） |
| POST | /api/dictionary/update | 更新翻译条目 |
| POST | /api/collect | 从页面采集字符串 |
| POST | /api/dictionary/optimize | 优化词典 |
| GET | /api/dictionary/export | 导出词典到 JSON |
| GET | /api/dictionary/import | 从 JSON 导入词典 |
| GET | /api/backup | 创建备份 |
| GET/POST | /api/settings | 管理设置 |

## 配置说明

设置通过 API 进行管理，主要配置项包括：

- **requestInterval**: 请求间隔（毫秒）
- **maxRetries**: 最大重试次数
- **httpTimeout**: HTTP 超时时间（毫秒）
- **autoBackup**: 是否自动备份

## 项目结构

```
utils/
├── README.md                  # 本文件
├── package.json               # 工具依赖配置
├── auto_string_updater.js     # 自动化工具服务器
├── dictionary_processor.js    # 词典处理工具
├── string_collector.js        # 字符串采集工具
├── utils.js                   # 共享工具函数
├── api/                       # API 数据目录
│   └── stats.json            # 统计信息
├── backups/                   # 备份目录
└── settings.json              # 设置文件
```

## 注意事项

1. 新添加的字符串默认翻译为空，需要手动进行翻译
2. 过度频繁的请求可能会触发 GitHub 的访问限制，建议合理设置抓取频率
3. 运行前请确保有足够的文件系统权限
4. 使用 optimize 命令前建议先创建备份

## 故障排除

- **请求失败**: 检查网络连接和代理设置，可能需要调整请求头
- **文件访问错误**: 确认文件路径正确且有读写权限
- **字符串重复**: 使用 optimize 命令可自动清理重复字符串
- **GitHub 限制**: 减少抓取频率，增加请求间隔

## 开发与维护

作者: SutChan
版本: 1.1.0
