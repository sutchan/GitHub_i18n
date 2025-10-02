const fs = require('fs');

try {
  const data = fs.readFileSync('e:\\Dropbox\\GitHub\\GitHub_i18n\\GitHub_i18n.code-workspace', 'utf8');
  JSON.parse(data);
  console.log('JSON语法正确');
} catch (e) {
  console.error('JSON语法错误:', e.message);
  process.exit(1);
}