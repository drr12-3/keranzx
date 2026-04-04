const fs = require('fs');
const path = require('path');

// 读取源代码
const source = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// 替换占位符为环境变量
const config = {
  '__COS_BUCKET__': process.env.COS_BUCKET || '',
  '__COS_REGION__': process.env.COS_REGION || 'ap-guangzhou',
  '__COS_SECRET_ID__': process.env.COS_SECRET_ID || '',
  '__COS_SECRET_KEY__': process.env.COS_SECRET_KEY || '',
  '__COS_DOMAIN__': process.env.COS_DOMAIN || '',
  '__ACCESS_PASSWORD__': process.env.ACCESS_PASSWORD || '123456'
};

let result = source;
for (const [placeholder, value] of Object.entries(config)) {
  result = result.split(placeholder).join(value);
}

// 确保输出目录存在
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 写入到 dist 目录
fs.writeFileSync(path.join(distDir, 'index.html'), result, 'utf8');

console.log('✅ 构建完成！配置已注入：');
console.log(`   - Bucket: ${config.__COS_BUCKET__ ? '✓' : '✗ 未设置'}`);
console.log(`   - Region: ${config.__COS_REGION__}`);
console.log(`   - SecretId: ${config.__COS_SECRET_ID__ ? '✓' : '✗ 未设置'}`);
console.log(`   - SecretKey: ${config.__COS_SECRET_KEY__ ? '✓' : '✗ 未设置'}`);
console.log(`   - Domain: ${config.__COS_DOMAIN__ ? '✓' : '✗ 未设置'}`);
console.log(`   - Password: ${config.__ACCESS_PASSWORD__ ? '✓' : '✗ 未设置'}`);

if (!config.__COS_BUCKET__ || !config.__COS_SECRET_ID__ || !config.__COS_SECRET_KEY__) {
  console.log('\n⚠️  警告：请在 Vercel 后台设置以下环境变量：');
  console.log('   COS_BUCKET, COS_SECRET_ID, COS_SECRET_KEY, COS_DOMAIN, ACCESS_PASSWORD');
}
