/**
 * GitHub 中文翻译插件构建脚本
 * @file build.js
 * @version 1.9.1
 * @description 简化的单文件构建脚本 - 合并源代码并生成用户脚本
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
  'translationCore.js',
  'pageMonitor.js',
  'configUI.js',
  'versionChecker.js',
  'virtualDom.js',
  'i18n.js',
  'dictionaries/index.js',
  'dictionaries/common.js',
  'dictionaries/codespaces.js',
  'dictionaries/explore.js',
  'main.js'
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

function bumpVersion(version, level) {
  const parts = version.split('.').map(Number);
  const [major, minor, patch] = parts;
  switch (level) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: return `${major}.${minor}.${patch + 1}`;
  }
}

function updateVersionInFiles(newVersion) {
  const versionFile = path.join(SRC_DIR, 'version.js');
  let content = fs.readFileSync(versionFile, 'utf-8');
  content = content.replace(
    /export\s+const\s+VERSION\s+=\s+['"][^'"]+['"]/,
    `export const VERSION = '${newVersion}'`
  );
  fs.writeFileSync(versionFile, content, 'utf-8');

  const srcFiles = getAllJsFiles(SRC_DIR);
  srcFiles.forEach(file => {
    let fileContent = fs.readFileSync(file, 'utf-8');
    fileContent = fileContent.replace(
      /@version\s+[\d.]+/g,
      `@version ${newVersion}`
    );
    fs.writeFileSync(file, fileContent, 'utf-8');
  });

  console.log(`  版本已更新为: ${newVersion}`);
}

function getAllJsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllJsFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function mergeSourceFiles() {
  console.log('  合并源文件...');
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
      content = content.replace(/\/\*[#@]\s*(?:sourceMappingURL|mapping).*?\*\//g, '');
      content = content.replace(/\/\/\s*[@#]\s*(?:sourceMappingURL|mapping).*$/gm, '');
      mergedParts.push(`\n// ===== ${file} =====\n${content.trim()}\n`);
    }
  }

  return mergedParts.join('\n');
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

function fixBuildOutput(content) {
  content = content.replace(/export\s+const\s+VERSION\s+=/g, 'const VERSION =');
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.replace(/\s+\n/g, '\n');
  return content;
}

function buildUserScript(version) {
  console.log('  生成用户脚本...');
  createBuildDir();

  let mergedCode = mergeSourceFiles();
  let scriptContent = USER_SCRIPT_HEADER.replace('{VERSION}', version) + mergedCode + USER_SCRIPT_FOOTER;
  scriptContent = fixBuildOutput(scriptContent);

  fs.writeFileSync(OUTPUT_FILE, scriptContent, 'utf-8');
  console.log(`  输出: ${OUTPUT_FILE}`);
  return true;
}

function copyFilesToDist() {
  fs.copyFileSync(OUTPUT_FILE, DIST_OUTPUT);
  console.log(`  复制到: ${DIST_OUTPUT}`);
}

function validateBuild(version) {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return { valid: false, error: '构建产物不存在' };
  }
  const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
  if (!content.match(/@version\s+[\d.]+/)) {
    return { valid: false, error: '版本号不匹配' };
  }
  if (content.length < 1000) {
    return { valid: false, error: '构建产物过小' };
  }
  return { valid: true, version, size: content.length };
}

function build(versionLevel = 'patch') {
  console.log('\n========================================');
  console.log('  GitHub 中文翻译插件构建');
  console.log('========================================\n');

  cleanProject();
  console.log('✓ 清理完成');

  const currentVersion = readCurrentVersion();
  console.log(`\n📌 当前版本: ${currentVersion}`);

  const newVersion = bumpVersion(currentVersion, versionLevel);
  console.log(`📈 升级到版本: ${newVersion} (${versionLevel})`);

  updateVersionInFiles(newVersion);

  console.log('\n🔨 开始构建...');
  const success = buildUserScript(newVersion);
  if (!success) {
    console.error('❌ 构建失败');
    process.exit(1);
  }

  copyFilesToDist();

  const validation = validateBuild(newVersion);
  if (!validation.valid) {
    console.error('❌ 验证失败:', validation.error);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('  🎉 构建完成!');
  console.log(`  📦 构建产物: ${OUTPUT_FILE}`);
  console.log(`  📊 文件大小: ${(validation.size / 1024).toFixed(2)} KB`);
  console.log(`  🔍 版本验证: ${validation.version}`);
  console.log('========================================\n');

  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const buildType = args[0] || 'patch';
  const validTypes = ['patch', 'minor', 'major'];
  const versionLevel = validTypes.includes(buildType) ? buildType : 'patch';

  try {
    build(versionLevel);
  } catch (error) {
    console.error('❌ 构建流程失败:', error.message);
    process.exit(1);
  }
}

module.exports = { build, readCurrentVersion, bumpVersion };
