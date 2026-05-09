/**
 * GitHub 中文翻译插件构建脚本
 * @file build.js
 * @version 1.9.1
 * @description 构建脚本入口 - 调用 CommonJS 版本
 */
import { build } from './build.cjs';

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
