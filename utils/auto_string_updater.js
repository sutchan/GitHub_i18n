// auto_string_updater.js
// GitHub i18n 自动化工具服务器
// 版本: 1.0.0

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
  defaultSettings: {
    requestInterval: 1000,
    maxRetries: 3,
    httpTimeout: 30000,
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
  await fs.writeFile(CONFIG.settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

async function readDictionary() {
  try {
    const files = await fs.readdir(CONFIG.dictionaryPath);
    const dictionary = {};

    for (const file of files) {
      if (file.endsWith('.js')) {
        const moduleName = file.replace('.js', '');
        const filePath = path.join(CONFIG.dictionaryPath, file);
        const content = await fs.readFile(filePath, 'utf8');

        const match = content.match(/export\s+default\s+(\{[\s\S]*?\});?$/m);
        if (match) {
          try {
            dictionary[moduleName] = JSON.parse(match[1].replace(/'/g, '"'));
          } catch {
            const keyValueRegex = /['"](\w+)['"]\s*:\s*['"]([^'"]*)['"]/g;
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
  let lastUpdated = null;

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

  try {
    const statFile = path.join(CONFIG.dictionaryPath, 'last_updated.json');
    const data = await fs.readFile(statFile, 'utf8');
    const stats = JSON.parse(data);
    lastUpdated = stats.lastUpdated;
  } catch {
    lastUpdated = null;
  }

  return {
    totalStrings,
    moduleCount: Object.keys(dictionary).length,
    pendingCount,
    lastUpdated,
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
    const content = `// ${module}.js\n// GitHub i18n 词典模块\n// 版本: 1.0.0\n\nexport default ${JSON.stringify(dictionary[module], null, 2)};`;
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

      results.results.forEach((result) => {
        if (result.strings && result.strings.length > 0) {
          const moduleName = result.pageId;
          if (!dictionary[moduleName]) {
            dictionary[moduleName] = {};
          }

          result.strings.forEach((str) => {
            if (!dictionary[moduleName][str]) {
              dictionary[moduleName][str] = '';
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

export default ${JSON.stringify(entries, null, 2)};`;
        await fs.writeFile(filePath, content, 'utf8');
      }

      // 更新最后修改时间
      const statFile = path.join(CONFIG.dictionaryPath, 'last_updated.json');
      await fs.writeFile(
        statFile,
        JSON.stringify({ lastUpdated: new Date().toISOString() }, null, 2),
        'utf8',
      );
    }

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
  } catch (error) {
    console.error('采集过程出错:', error);
    res.status(500).json({ error: error.message || '采集过程出错' });
  }
});

app.get('/api/export', async (req, res) => {
  try {
    // 简单的导出功能：直接使用当前的词典
    const dictionary = await readDictionary();
    const stringCount = Object.values(dictionary).reduce(
      (sum, m) => sum + Object.keys(m).length,
      0,
    );

    res.json({
      success: true,
      stringCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/import', async (req, res) => {
  try {
    // 简单的导入功能：目前只是标记成功
    res.json({ success: true, message: '导入功能需要手动同步词典' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/optimize', async (req, res) => {
  try {
    const dictionary = await readDictionary();
    const originalCount = Object.values(dictionary).reduce(
      (sum, m) => sum + Object.keys(m).length,
      0,
    );

    // 优化词典：去重，清理空值
    const optimized = {};
    for (const [moduleName, entries] of Object.entries(dictionary)) {
      const cleanEntries = {};
      for (const [key, value] of Object.entries(entries)) {
        if (key && key.trim()) {
          cleanEntries[key.trim()] = value;
        }
      }
      if (Object.keys(cleanEntries).length > 0) {
        optimized[moduleName] = cleanEntries;
      }
    }

    // 保存优化后的词典
    for (const [moduleName, entries] of Object.entries(optimized)) {
      const filePath = path.join(CONFIG.dictionaryPath, `${moduleName}.js`);
      const content = `// ${moduleName}.js
// GitHub i18n 词典模块
// 版本: 1.0.0

export default ${JSON.stringify(entries, null, 2)};`;
      await fs.writeFile(filePath, content, 'utf8');
    }

    const optimizedCount = Object.values(optimized).reduce(
      (sum, m) => sum + Object.keys(m).length,
      0,
    );

    res.json({
      success: true,
      originalCount,
      optimizedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/backup', async (req, res) => {
  try {
    const userScriptPath = path.resolve(__dirname, '../build/GitHub_i18n.user.js');
    const content = await fs.readFile(userScriptPath, 'utf8');

    const backupDir = path.resolve(__dirname, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `GitHub_i18n.user.js.${timestamp}.bak`);

    await fs.writeFile(backupPath, content, 'utf8');

    res.json({ success: true, path: backupPath });
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GitHub i18n 自动化工具已启动: http://localhost:${PORT}`);
  console.log(`打开 http://localhost:${PORT} 开始使用`);
});

module.exports = app;
