/**
 * GitHub 中文翻译 - 构建脚本
 * @version 1.8.38
 * @description 自动化构建、版本管理和清理工具
 * @author Sut (https://github.com/sutchan)
 */

const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process'); // 暂时注释掉未使用的模块

class BuildManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, 'dist');
    this.srcDir = path.join(this.projectRoot, 'src');
    this.outputFile = path.join(this.projectRoot, 'GitHub_zh-CN.user.js');
    this.srcFiles = {
      indexJs: path.join(this.srcDir, 'index.js'),
      configJs: path.join(this.srcDir, 'config.js'),
      mainScript: this.outputFile,
      apiDir: path.join(this.projectRoot, 'api')
    };
    this.currentVersion = '1.8.26'; // 初始版本号
  }

  /**
   * 读取当前版本号
   * @returns {string} 当前版本号
   */
  readCurrentVersion() {
    try {
      // 从config.js读取版本号
      const configContent = fs.readFileSync(this.srcFiles.configJs, 'utf8');
      const match = configContent.match(/version:\s*['"](.+)['"]/);
      if (match && match[1]) {
        this.currentVersion = match[1];
        return match[1];
      }

      // 从index.js读取版本号（包含UserScript元数据）
      const indexContent = fs.readFileSync(this.srcFiles.indexJs, 'utf8');
      const indexMatch = indexContent.match(/@version\s+([\d.]+)/);
      if (indexMatch && indexMatch[1]) {
        this.currentVersion = indexMatch[1];
        return indexMatch[1];
      }
    } catch (error) {
      console.error('读取版本号失败:', error.message);
    }

    return this.currentVersion;
  }

  /**
   * 升级版本号
   * @param {string} level - 升级级别: 'major', 'minor', 'patch'
   * @returns {string} 新的版本号
   */
  upgradeVersion(level = 'patch') {
    const parts = this.currentVersion.split('.').map(Number);

    switch (level) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
      default:
        parts[2]++;
        break;
    }

    this.currentVersion = parts.join('.');
    return this.currentVersion;
  }

  /**
   * 更新所有文件中的版本号
   */
  updateVersionInFiles() {
    try {
      // 更新config.js中的版本号
      let configContent = fs.readFileSync(this.srcFiles.configJs, 'utf8');
      configContent = configContent.replace(
        /version:\s*['"](.+)['"]/,
        `version: '${this.currentVersion}'`
      );
      fs.writeFileSync(this.srcFiles.configJs, configContent, 'utf8');
      console.log(`✅ 已更新 config.js 版本号为: ${this.currentVersion}`);

      // 更新index.js中的版本号（UserScript元数据）
      let indexContent = fs.readFileSync(this.srcFiles.indexJs, 'utf8');
      indexContent = indexContent.replace(
        /@version\s+([\d.]+)/,
        `@version ${this.currentVersion}`
      );
      fs.writeFileSync(this.srcFiles.indexJs, indexContent, 'utf8');
      console.log(`✅ 已更新 index.js 版本号为: ${this.currentVersion}`);

      // 更新build.js中的版本号注释
      let buildContent = fs.readFileSync(path.join(this.projectRoot, 'build.js'), 'utf8');
      buildContent = buildContent.replace(
        /@version\s+([\d.]+)/,
        `@version ${this.currentVersion}`
      );
      fs.writeFileSync(path.join(this.projectRoot, 'build.js'), buildContent, 'utf8');
      console.log(`✅ 已更新 build.js 版本号为: ${this.currentVersion}`);

    } catch (error) {
      console.error('更新版本号失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理冗余文件和目录
   */
  cleanProject() {
    // 仅清理临时文件和不必要的文件，保留用户指定的文件和重要目录
    // 注意：
    // 1. 不清理根目录下的api文件夹，它现在是项目的重要组成部分
    // 2. 不清理dist目录，它将在构建过程中被重建
    const itemsToClean = [
      'node_modules',   // Node.js 模块目录
      '*.log',          // 日志文件
      '*.tmp',          // 临时文件
      'GitHub_zh-CN_TEMP.user.js' // 临时用户脚本
    ];

    itemsToClean.forEach(item => {
      const itemPath = path.join(this.projectRoot, item);
      if (fs.existsSync(itemPath)) {
        try {
          if (fs.lstatSync(itemPath).isDirectory()) {
            fs.rmdirSync(itemPath, { recursive: true });
            console.log(`✅ 已删除目录: ${item}`);
          } else {
            fs.unlinkSync(itemPath);
            console.log(`✅ 已删除文件: ${item}`);
          }
        } catch (error) {
          console.warn(`⚠️  无法删除 ${item}: ${error.message}`);
        }
      }
    });

    // 清理构建目录
    if (fs.existsSync(this.buildDir)) {
      fs.rmdirSync(this.buildDir, { recursive: true });
      console.log('✅ 已清理分发目录');
    }
  }

  /**
   * 创建构建目录
   */
  createBuildDir() {
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
      console.log(`✅ 已创建分发目录: ${this.buildDir}`);
    }
  }

  /**
   * 合并src目录下的所有JS文件
   * @returns {string} 合并后的代码
   */
  mergeSourceFiles() {
    console.log('🔄 开始合并源代码文件...');
    
    // 读取index.js文件作为入口
    const indexContent = fs.readFileSync(this.srcFiles.indexJs, 'utf8');
    
    // 移除import语句，因为我们会将所有代码合并到一个文件中
    let mergedCode = indexContent.replace(/import\s+[^;]+;\s*/g, '');
    
    // 获取所有需要合并的文件
    const filesToMerge = [
      path.join(this.srcDir, 'config.js'),
      path.join(this.srcDir, 'utils.js'),
      path.join(this.srcDir, 'versionChecker.js'),
      path.join(this.srcDir, 'dictionaries/index.js'),
      path.join(this.srcDir, 'dictionaries/codespaces.js'),
      path.join(this.srcDir, 'dictionaries/explore.js'),
      path.join(this.srcDir, 'translationCore.js'),
      path.join(this.srcDir, 'pageMonitor.js'),
      path.join(this.srcDir, 'tools.js'),
      path.join(this.srcDir, 'main.js')
    ];
    
    // 合并所有文件内容
    filesToMerge.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // 移除文件中的import语句
        const cleanContent = fileContent.replace(/import\s+[^;]+;\s*/g, '')
          .replace(/export\s+default\s+/g, '')
          .replace(/export\s+\{[^}]+\}\s*;?\s*/g, '');
        mergedCode += '\n\n' + cleanContent;
        console.log(`✅ 已合并: ${path.relative(this.srcDir, filePath)}`);
      }
    });
    
    return mergedCode;
  }
  
  /**
   * 构建用户脚本
   */
  buildUserScript() {
    console.log('🏗️  开始构建用户脚本...');
    
    try {
      // 合并所有源文件
      const mergedCode = this.mergeSourceFiles();
      
      // 写入到输出文件
      fs.writeFileSync(this.outputFile, mergedCode, 'utf8');
      console.log(`✅ 已生成: ${path.basename(this.outputFile)}`);
      
      return true;
    } catch (error) {
      console.error('❌ 构建用户脚本失败:', error.message);
      return false;
    }
  }
  
  /**
   * 复制文件到分发目录
   */
  copyFilesToDist() {
    this.createBuildDir();

    // 确保用户脚本已构建
    if (!fs.existsSync(this.outputFile)) {
      console.error('❌ 用户脚本不存在，请先构建');
      return;
    }

    // 复制主要文件到dist目录
    const destScript = path.join(this.buildDir, path.basename(this.outputFile));
    fs.copyFileSync(this.outputFile, destScript);
    console.log(`✅ 已复制: ${path.basename(this.outputFile)}`);

    // API目录已直接位于根目录，不再需要复制到dist目录
    console.log('✅ API目录已直接位于根目录，无需复制到dist目录');
    
    
    console.log(`✅ 所有文件已复制到分发目录: ${this.buildDir}`);
  }

  /**
   * 运行构建流程
   * @param {Object} options - 构建选项
   */
  build(options = {}) {
    const {
      upgradeVersion = true,
      versionLevel = 'patch',
      clean = true,
      copyToDist = true
    } = options;

    try {
      console.log('🔄 开始构建流程...');

      // 读取当前版本
      this.readCurrentVersion();
      console.log(`📦 当前版本: ${this.currentVersion}`);

      // 升级版本
      if (upgradeVersion) {
        const newVersion = this.upgradeVersion(versionLevel);
        console.log(`🚀 升级到新版本: ${newVersion}`);
        this.updateVersionInFiles();
      }

      // 清理项目
      if (clean) {
        console.log('🧹 清理项目...');
        this.cleanProject();
      }

      // 构建用户脚本
      console.log('🏗️  开始构建用户脚本...');
      this.buildUserScript();
      
      // 复制到分发目录
      if (copyToDist) {
        console.log('📋 复制文件到分发目录...');
        this.copyFilesToDist();
      }

      console.log('🎉 构建完成!');
      return {
        success: true,
        version: this.currentVersion,
        buildDir: this.buildDir
      };
    } catch (error) {
      console.error('❌ 构建失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证构建结果
   * @returns {Object} 验证结果
   */
  validateBuild() {
    try {
      // 检查构建后的用户脚本是否存在
      const buildScript = path.join(this.buildDir, 'GitHub_zh-CN.user.js');
      if (!fs.existsSync(buildScript)) {
        return { valid: false, error: '构建后的用户脚本不存在' };
      }

      // 检查版本一致性
      const buildContent = fs.readFileSync(buildScript, 'utf8');
      const buildVersionMatch = buildContent.match(/@version\s+([\d.]+)/);

      if (!buildVersionMatch || buildVersionMatch[1] !== this.currentVersion) {
        return {
          valid: false,
          error: '构建版本与当前版本不一致'
        };
      }

      // 检查主要模块是否包含在构建后的文件中
      const requiredModules = ['CONFIG', 'translationModule', 'translationCore', 'pageMonitor'];
      for (const module of requiredModules) {
        if (!buildContent.includes(module)) {
          return {
            valid: false,
            error: `构建后的文件中缺少必要模块: ${module}`
          };
        }
      }

      console.log(`✅ 构建验证通过，版本: ${this.currentVersion}`);
      return { valid: true, version: this.currentVersion };
    } catch (error) {
      console.error('❌ 构建验证失败:', error.message);
      return { valid: false, error: error.message };
    }
  }
}

// 命令行接口
function main() {
  const buildManager = new BuildManager();
  const args = process.argv.slice(2);

  // 解析命令行参数
  const options = {
    upgradeVersion: !args.includes('--no-upgrade'),
    versionLevel: args.includes('--major') ? 'major' :
      args.includes('--minor') ? 'minor' : 'patch',
    clean: !args.includes('--no-clean'),
    copyToDist: !args.includes('--no-copy')
  };

  // 运行构建
  const result = buildManager.build(options);

  if (result.success) {
    // 验证构建
    const validation = buildManager.validateBuild();
    if (validation.valid) {
      console.log(`✅ 构建验证通过，版本: ${validation.version}`);
    } else {
      console.error(`❌ 构建验证失败: ${validation.error}`);
    }
  }

  process.exit(result.success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

// 导出类供其他模块使用
module.exports = BuildManager;
