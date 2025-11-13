/**
 * GitHub 中文翻译插件构建脚本
 * 负责合并源代码、修复问题并生成最终的用户脚本
 */

// 引入依赖和模块化组件
const fs = require('fs');
const path = require('path');

// 导入模块化组件
const VersionManager = require('./build/versionManager');
const ProjectCleaner = require('./build/projectCleaner');
const SourceMerger = require('./build/sourceMerger');
const BuildFixer = require('./build/buildFixer');
const UserScriptBuilder = require('./build/userScriptBuilder');
const BuildValidator = require('./build/buildValidator');

/**
 * 主构建管理器类
 * 协调各个模块化组件完成构建流程
 */
class BuildManager {
  constructor() {
    // 项目根目录
    this.projectRoot = path.resolve(__dirname);
    
    // 初始化各个模块
    this.versionManager = new VersionManager(this.projectRoot);
    this.projectCleaner = new ProjectCleaner(this.projectRoot);
    this.sourceMerger = new SourceMerger(this.projectRoot);
    this.buildFixer = new BuildFixer();
    this.userScriptBuilder = new UserScriptBuilder(this.projectRoot);
    this.buildValidator = new BuildValidator(this.projectRoot);
    
    // 当前版本号
    this.currentVersion = null;
  }

  /**
   * 读取当前版本号
   * @returns {string} 当前版本号
   */
  readCurrentVersion() {
    this.currentVersion = this.versionManager.readCurrentVersion();
    return this.currentVersion;
  }

  /**
   * 升级版本号
   * @param {string} level - 版本升级级别: major, minor, patch
   * @returns {string} 新的版本号
   */
  upgradeVersion(level = 'patch') {
    this.currentVersion = this.versionManager.upgradeVersion(level);
    return this.currentVersion;
  }

  /**
   * 更新所有文件中的版本号
   */
  updateVersionInFiles() {
    this.versionManager.updateVersionInFiles();
  }

  /**
   * 清理项目目录
   */
  cleanProject() {
    this.projectCleaner.cleanProject();
  }

  /**
   * 创建构建目录
   */
  createBuildDir() {
    this.projectCleaner.createBuildDir(this.userScriptBuilder.buildDir);
  }

  /**
   * 合并src目录下的所有JS文件
   * @returns {string} 合并后的代码
   */
  mergeSourceFiles() {
    return this.sourceMerger.mergeSourceFiles();
  }

  /**
   * 修复构建产物中的问题
   * @param {string} outputFilePath - 输出文件路径
   * @returns {boolean} 是否有修改
   */
  fixBuildOutput(outputFilePath) {
    return this.buildFixer.fixBuildOutput(outputFilePath, this.currentVersion);
  }

  /**
   * 构建用户脚本
   * @returns {boolean} 构建是否成功
   */
  buildUserScript() {
    try {
      // 确保构建目录存在
      this.createBuildDir();
      
      // 合并所有源文件
      let mergedCode = this.mergeSourceFiles();

      // 构建用户脚本
      const success = this.userScriptBuilder.buildUserScript(mergedCode, this.currentVersion);
      
      if (success) {
        // 修复构建产物中的问题
        this.fixBuildOutput(this.userScriptBuilder.outputFile);
      }

      return success;
    } catch (error) {
      console.error('❌ 构建用户脚本失败:', error.message);
      return false;
    }
  }

  /**
   * 复制文件到分发目录
   */
  copyFilesToDist() {
    this.userScriptBuilder.copyFilesToDist();
  }

  /**
   * 验证构建结果
   * @returns {Object} 验证结果
   */
  validateBuild() {
    return this.buildValidator.validateBuild(this.currentVersion);
  }

  /**
   * 完整构建流程
   * @param {string} versionLevel - 版本升级级别
   * @returns {boolean} 构建是否成功
   */
  build(versionLevel = 'patch') {
    try {
      console.log('🚀 开始 GitHub 中文翻译插件构建流程');
      
      // 1. 清理项目
      this.cleanProject();
      
      // 2. 读取当前版本
      this.readCurrentVersion();
      console.log(`📌 当前版本: ${this.currentVersion}`);
      
      // 3. 升级版本号
      this.upgradeVersion(versionLevel);
      console.log(`📈 升级到版本: ${this.currentVersion}`);
      
      // 4. 更新所有文件中的版本号
      this.updateVersionInFiles();
      
      // 5. 构建用户脚本
      const buildSuccess = this.buildUserScript();
      if (!buildSuccess) {
        throw new Error('用户脚本构建失败');
      }
      
      // 6. 复制文件到分发目录
      this.copyFilesToDist();
      
      // 7. 验证构建结果
      const validation = this.validateBuild();
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      console.log('🎉 构建完成！');
      console.log(`📦 构建产物: ${this.userScriptBuilder.outputFile}`);
      console.log(`🔍 验证通过: 版本 ${validation.version}`);
      
      return true;
    } catch (error) {
      console.error('❌ 构建流程失败:', error.message);
      return false;
    }
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const buildType = args[0] || 'patch';
  
  const buildManager = new BuildManager();
  
  // 支持的构建类型
  const buildTypes = {
    'patch': 'patch',
    'minor': 'minor',
    'major': 'major',
    'build': 'patch' // 默认构建类型
  };
  
  const versionLevel = buildTypes[buildType] || 'patch';
  
  buildManager.build(versionLevel);
}

module.exports = BuildManager;