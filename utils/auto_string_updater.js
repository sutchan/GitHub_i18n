// auto_string_updater.js
// GitHub i18n 自动化工具服务器
// 版本: 1.1.0
// 为 GitHub i18n 项目优化的版本

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

const StringCollector = require('./string_collector');
const DictionaryProcessor = require('./dictionary_processor');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..')));

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(error.status || 500).json({
    error: error.message || '内部服务器错误',
  });
});

const CONFIG = {
  dictionaryPath: path.resolve(__dirname, '../src/dictionaries'),
  settingsPath: path.resolve(__dirname, 'settings.json'),
  statsPath: path.resolve(__dirname, 'api/stats.json'),
  defaultSettings: {
    requestInterval: 1000,
    maxRetries: 3,
    httpTimeout: 30000,
    autoBackup: true,
  },
};

async function readSettings() {
  try {
    const data = await fs.readFile(CONFIG.settingsPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return { ...CONFIG.defaultSettings };
  }
}

async function saveSettings(settings) {
  await fs.mkdir(path.dirname(CONFIG.settingsPath), { recursive: true });
  await fs.writeFile(CONFIG.settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

async function readStats() {
  try {
    const data = await fs.readFile(CONFIG.statsPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return { lastUpdated: null, totalStrings: 0, modules: 0, updates: 0 };
  }
}

async function saveStats(stats) {
  await fs.mkdir(path.dirname(CONFIG.statsPath), { recursive: true });
  await fs.writeFile(CONFIG.statsPath, JSON.stringify(stats, null, 2), 'utf8');
}

async function readDictionary() {
  try {
    const files = await fs.readdir(CONFIG.dictionaryPath);
    const dictionary = {};

    for (const file of files) {
      if (file.endsWith('.js') && file !== 'index.js') {
        const moduleName = file.replace('.js', '');
        const filePath = path.join(CONFIG.dictionaryPath, file);
        const content = await fs.readFile(filePath, 'utf8');

        const match = content.match(/export\s+default\s*(\{[\s\S]*?\});?/);
        if (match) {
          try {
            dictionary[moduleName] = JSON.parse(match[1].replace(/'/g, '"'));
          } catch {
            const keyValueRegex = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"]/g;
            const moduleDict = {};
            let m;
            while ((m = keyValueRegex.exec(match[1])) !== null) {
              moduleDict[m[1]] = m[2];
            }
            dictionary[moduleName] = moduleDict;
          }
        }
      }
    }

    return dictionary;
  } catch {
    return {};
  }
}

async function getDictionaryStats(dictionary) {
  let totalStrings = 0;
  let pendingCount = 0;
  const stats = await readStats();

  for (const moduleName in dictionary) {
    const entries = dictionary[moduleName];
    for (const key in entries) {
      totalStrings++;
      const value = entries[key];
      if (!value || value.startsWith('待翻译:')) {
        pendingCount++;
      }
    }
  }

  return {
    totalStrings,
    moduleCount: Object.keys(dictionary).length,
    pendingCount,
    lastUpdated: stats.lastUpdated,
    updates: stats.updates || 0,
  };
}

app.get('/api/stats', async (req, res) => {
  try {
    const dictionary = await readDictionary();
    const stats = await getDictionaryStats(dictionary);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dictionary', async (req, res) => {
  try {
    const dictionary = await readDictionary();
    const search = req.query.search?.toLowerCase();

    if (search) {
      const filtered = {};
      for (const [module, entries] of Object.entries(dictionary)) {
        const matched = {};
        for (const [key, value] of Object.entries(entries)) {
          if (
            key.toLowerCase().includes(search) ||
            (value && value.toLowerCase().includes(search))
          ) {
            matched[key] = value;
          }
        }
        if (Object.keys(matched).length > 0) {
          filtered[module] = matched;
        }
      }
      res.json(filtered);
    } else {
      res.json(dictionary);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dictionary/update', async (req, res) => {
  try {
    const { module, key, value } = req.body;
    const dictionary = await readDictionary();

    if (!dictionary[module]) {
      dictionary[module] = {};
    }
    dictionary[module][key] = value;

    const filePath = path.join(CONFIG.dictionaryPath, `${module}.js`);
    const content = `// ${module}.js
// GitHub i18n 词典模块
// 版本: 1.0.0

export default ${JSON.stringify(dictionary[module], null, 2)};
`;
    await fs.writeFile(filePath, content, 'utf8');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/collect', async (req, res) => {
  try {
    const { pages } = req.body;
    const settings = await readSettings();

    Object.assign(StringCollector.CONFIG, {
      maxRetries: settings.maxRetries,
      httpTimeout: settings.httpTimeout,
    });

    const results = await StringCollector.collectStringsFromPages(pages, (progress) => {
      console.log(
        `[${progress.current}/${progress.total}] ${progress.page.name}: ${progress.result?.strings?.length || 0} strings`,
      );
    });

    if (results.summary.successCount > 0) {
      const dictionary = await readDictionary();
      let newStringsCount = 0;

      results.results.forEach((result) => {
        if (result.strings && result.strings.length > 0) {
          const moduleName = result.pageId;
          if (!dictionary[moduleName]) {
            dictionary[moduleName] = {};
          }

          result.strings.forEach((str) => {
            if (!dictionary[moduleName][str]) {
              dictionary[moduleName][str] = '';
              newStringsCount++;
            }
          });
        }
      });

      // 保存更新后的词典
      for (const [moduleName, entries] of Object.entries(dictionary)) {
        const filePath = path.join(CONFIG.dictionaryPath, `${moduleName}.js`);
        const content = `// ${moduleName}.js
// GitHub i18n 词典模块
// 版本: 1.0.0

export default ${JSON.stringify(entries, null, 2)};
`;
        await fs.writeFile(filePath, content, 'utf8');
      }

      // 更新统计信息
      const stats = await readStats();
      stats.lastUpdated = new Date().toISOString();
      stats.updates = (stats.updates || 0) + 1;
      await saveStats(stats);

      res.json({
        success: true,
        summary: results.summary,
        newStrings: newStringsCount,
        results: results.results.map((r) => ({
          pageId: r.pageId,
          pageName: r.pageName,
          stringCount: r.strings?.length || 0,
          error: r.error,
        })),
      });
    } else {
      res.json({
        success: true,
        summary: results.summary,
        results: results.results.map((r) => ({
          pageId: r.pageId,
          pageName: r.pageName,
          stringCount: r.strings?.length || 0,
          error: r.error,
        })),
      });
    }
  } catch (error) {
    console.error('采集过程出错:', error);
    res.status(500).json({ error: error.message || '采集过程出错' });
  }
});

app.post('/api/dictionary/optimize', async (req, res) => {
  try {
    const dictionary = await readDictionary();
    const originalCount = Object.values(dictionary).reduce(
      (sum, m) => sum + Object.keys(m).length,
      0,
    );

    // 使用 DictionaryProcessor 进行优化
    const optimized = DictionaryProcessor.optimizeDictionary(dictionary);

    // 保存优化后的词典
    await DictionaryProcessor.writeDictionaryToUserScript(optimized);

    // 更新统计信息
    const stats = await readStats();
    stats.lastUpdated = new Date().toISOString();
    stats.updates = (stats.updates || 0) + 1;
    await saveStats(stats);

    const optimizedCount = Object.values(optimized).reduce(
      (sum, m) => sum + Object.keys(m).length,
      0,
    );

    res.json({
      success: true,
      originalCount,
      optimizedCount,
      removed: originalCount - optimizedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dictionary/export', async (req, res) => {
  try {
    // 导出词典到 JSON 文件
    const dictionary = await readDictionary();
    await DictionaryProcessor.saveDictionaryToJson(dictionary);

    const stringCount = Object.values(dictionary).reduce(
      (sum, m) => sum + Object.keys(m).length,
      0,
    );

    res.json({
      success: true,
      stringCount,
      message: '词典已成功导出到 JSON 文件',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dictionary/import', async (req, res) => {
  try {
    // 从 JSON 文件导入词典
    const importDictionary = await DictionaryProcessor.readDictionaryFromJson();
    await DictionaryProcessor.writeDictionaryToUserScript(importDictionary);

    // 更新统计信息
    const stats = await readStats();
    stats.lastUpdated = new Date().toISOString();
    stats.updates = (stats.updates || 0) + 1;
    await saveStats(stats);

    const stringCount = Object.values(importDictionary).reduce(
      (sum, m) => sum + Object.keys(m).length,
      0,
    );

    res.json({
      success: true,
      stringCount,
      message: '词典已成功从 JSON 文件导入',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/backup', async (req, res) => {
  try {
    const dictionary = await readDictionary();
    const backupDir = path.resolve(__dirname, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const [moduleName, entries] of Object.entries(dictionary)) {
      const backupPath = path.join(backupDir, `${moduleName}.js.${timestamp}.bak`);
      const content = `// ${moduleName}.js
// GitHub i18n 词典模块 - 备份
// 备份时间: ${new Date().toISOString()}

export default ${JSON.stringify(entries, null, 2)};
`;
      await fs.writeFile(backupPath, content, 'utf8');
    }

    res.json({ success: true, backupDir, timestamp, message: '备份创建成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    await saveSettings(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/reset', async (req, res) => {
  try {
    await saveSettings({ ...CONFIG.defaultSettings });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('  GitHub i18n 自动化工具服务器已启动!');
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('');
  console.log('可用的 API 端点:');
  console.log('  GET /api/stats                  - 获取统计信息');
  console.log('  GET /api/dictionary             - 获取词典');
  console.log('  POST /api/dictionary/update     - 更新翻译');
  console.log('  POST /api/collect               - 采集字符串');
  console.log('  POST /api/dictionary/optimize   - 优化词典');
  console.log('  GET /api/dictionary/export      - 导出词典到 JSON');
  console.log('  GET /api/dictionary/import      - 从 JSON 导入词典');
  console.log('  GET /api/backup                 - 创建备份');
  console.log('  GET/POST /api/settings          - 设置管理');
  console.log('');
});

module.exports = app;
