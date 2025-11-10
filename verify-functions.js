// 从versionChecker.js中提取的相关函数进行语法验证

/**
 * 从文本内容中提取版本号
 * @param {string} content - 包含版本号的文本内容
 * @returns {string|null} 提取到的版本号，如果没有找到则返回null
 */
function extractVersion(content) {
  try {
    // 尝试从注释中提取版本号，支持多种格式
    const versionRegexes = [
      /@version\s+([\d.]+)/i,
      /version:\s*['"]([\d.]+)['"]/i,
      /version\s*:\s*([\d.]+)/i,
      /v([\d.]+)/i,
      /version\s*=\s*['"]([\d.]+)['"]/i,
      /VERSION\s*=\s*['"]([\d.]+)['"]/i,
      /([\d.]+)\s+\(latest\)/i,
      /"version":\s*"([\d.]+)"/i
    ];

    for (const regex of versionRegexes) {
      const match = content.match(regex);
      if (match && match[1]) {
        // 确保提取到的是有效的版本号格式
        if (/^\d+(\.\d+)*(\.\d+)?$/.test(match[1])) {
          return match[1];
        }
      }
    }

    return null;
  } catch (error) {
    console.error('提取版本号出错:', error);
    return null;
  }
}

/**
 * 比较两个版本号是否有更新
 * @param {string} localVersion - 本地版本号
 * @param {string} remoteVersion - 远程版本号
 * @returns {boolean} 如果远程版本更新则返回true，否则返回false
 */
function isNewerVersion(localVersion, remoteVersion) {
  try {
    // 参数验证
    if (!localVersion || !remoteVersion) {
      return false;
    }

    // 将版本号分割成数组并转换为数字
    const localParts = localVersion.split('.').map(part => parseInt(part, 10));
    const remoteParts = remoteVersion.split('.').map(part => parseInt(part, 10));

    // 填充较短的数组以确保长度相等
    const maxLength = Math.max(localParts.length, remoteParts.length);
    while (localParts.length < maxLength) {
      localParts.push(0);
    }
    while (remoteParts.length < maxLength) {
      remoteParts.push(0);
    }

    // 比较版本号各部分
    for (let i = 0; i < maxLength; i++) {
      if (remoteParts[i] > localParts[i]) {
        return true;
      } else if (remoteParts[i] < localParts[i]) {
        return false;
      }
      // 如果相等，则继续比较下一部分
    }

    // 版本号完全相同
    return false;
  } catch (error) {
    console.error('比较版本号出错:', error);
    return false;
  }
}

console.log('语法验证通过！extractVersion和isNewerVersion函数没有语法错误。');

// 测试一些版本号比较场景
console.log('\n版本比较测试结果:');
console.log('1.0.0 < 1.0.1:', isNewerVersion('1.0.0', '1.0.1'));
console.log('1.1.0 > 1.0.9:', isNewerVersion('1.1.0', '1.0.9'));
console.log('2.0.0 > 1.9.9:', isNewerVersion('1.9.9', '2.0.0'));
console.log('相同版本 1.0.0:', isNewerVersion('1.0.0', '1.0.0'));
