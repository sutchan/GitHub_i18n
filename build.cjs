/**
 * GitHub 中文翻译插件构建脚本
 * @file build.js
 * @version 1.9.15
 * @description 简化的单文件构建脚本
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname);
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const BUILD_DIR = path.join(PROJECT_ROOT, 'build');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const OUTPUT_FILE = path.join(BUILD_DIR, 'GitHub_i18n.user.js');
const DIST_OUTPUT = path.join(DIST_DIR, 'GitHub_i18n.user.js');

const SOURCE_ORDER = [
  'version.js',
  'config.js',
  'trie.js',
  'utils.js',
  'cacheManager.js',
  'errorHandler.js',
  'tools.js',
  'pageMonitor/cacheManager.js',
  'pageMonitor/pageAnalyzer.js',
  'pageMonitor/pathListener.js',
  'pageMonitor/domObserver.js',
  'pageMonitor/translationTrigger.js',
  'pageMonitor/index.js',
  'translationCore/dictionaryManager.js',
  'translationCore/pageModeDetector.js',
  'translationCore/elementSelector.js',
  'translationCore/elementTranslator.js',
  'translationCore/partialTranslator.js',
  'translationCore/performanceMonitor.js',
  'translationCore/index.js',
  'configUI.js',
  'versionChecker.js',
  'virtualDom.js',
  'i18n.js',
  'dictionaries/index.js',
  'dictionaries/common.js',
  'dictionaries/codespaces.js',
  'dictionaries/explore.js',
  'main.js',
];

const USER_SCRIPT_HEADER = `// ==UserScript==
// @name         GitHub 中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      {VERSION}
// @description  GitHub页面自动翻译为中文
// @author       Sut
// @match        https://github.com/*
// @match        https://docs.github.com/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      raw.githubusercontent.com
// @connect      github.com
// @run-at       document-idle
// @noframes
// @updateURL    https://raw.githubusercontent.com/sutchan/GitHub_i18n/main/build/GitHub_i18n.user.js
// @downloadURL  https://raw.githubusercontent.com/sutchan/GitHub_i18n/main/build/GitHub_i18n.user.js
// @license      MIT
// @homepage     https://github.com/sutchan/GitHub_i18n
// ==/UserScript==

(function() {
'use strict';
`;

const USER_SCRIPT_FOOTER = `})();
`;

function readCurrentVersion() {
  const versionFile = path.join(SRC_DIR, 'version.js');
  const content = fs.readFileSync(versionFile, 'utf-8');
  const match = content.match(/export\s+const\s+VERSION\s+=\s+['"]([^'"]+)['"]/);
  return match ? match[1] : '0.0.0';
}

function mergeSourceFiles() {
  const mergedParts = [];

  for (const file of SOURCE_ORDER) {
    const filePath = path.join(SRC_DIR, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      content = content.replace(/^import\s+.*from\s+['"].+['"];?\s*$/gm, '');
      content = content.replace(/^export\s+default\s+(\w+);?\s*$/gm, '$1;');
      content = content.replace(/^export\s+default\s+/gm, '');
      content = content.replace(/^export\s+{\s*([^}]+)\s*};?\s*$/gm, '');
      content = content.replace(/^export\s+/gm, '');
      mergedParts.push(content.trim());
    }
  }

  return mergedParts.join('\n\n');
}

function cleanProject() {
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
}

function createBuildDir() {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

function buildUserScript(version) {
  createBuildDir();

  const mergedCode = mergeSourceFiles();
  let scriptContent = USER_SCRIPT_HEADER.replace('{VERSION}', version) + mergedCode + USER_SCRIPT_FOOTER;
  
  scriptContent = scriptContent.replace(/export\s+const\s+VERSION\s+=/g, 'const VERSION =');
  scriptContent = scriptContent.replace(/\n{3,}/g, '\n\n');
  scriptContent = scriptContent.replace(/\s+\n/g, '\n');

  fs.writeFileSync(OUTPUT_FILE, scriptContent, 'utf-8');
  return true;
}

function build() {
  console.log('\n========================================');
  console.log('  GitHub 中文翻译插件构建');
  console.log('========================================\n');

  cleanProject();
  console.log('✓ 清理完成');

  const version = readCurrentVersion();
  console.log(`📌 当前版本: ${version}`);

  console.log('🔨 开始构建...');
  buildUserScript(version);
  fs.copyFileSync(OUTPUT_FILE, DIST_OUTPUT);

  const fileSize = (fs.readFileSync(OUTPUT_FILE, 'utf-8').length / 1024).toFixed(2);
  
  console.log('\n========================================');
  console.log('  🎉 构建完成!');
  console.log(`  📦 构建产物: ${OUTPUT_FILE}`);
  console.log(`  📊 文件大小: ${fileSize} KB`);
  console.log('========================================\n');

  return true;
}

if (require.main === module) {
  try {
    build();
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

module.exports = { build, readCurrentVersion };
