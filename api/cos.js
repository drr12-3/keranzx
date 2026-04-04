const COS = require('cos-nodejs-sdk-v5');

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY
});

module.exports = async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).set(headers).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).set(headers).json({ error: '只支持POST请求' });
  }

  try {
    const { action, params } = req.body;
    const bucket = process.env.COS_BUCKET;
    const region = process.env.COS_REGION;

    switch (action) {
      case 'list': {
        // 列出文件
        const data = await new Promise((resolve, reject) => {
          cos.getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: 'screenshots/',
            Marker: params?.marker || '',
            MaxKeys: params?.maxKeys || 30
          }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        return res.status(200).set(headers).json(data);
      }

      case 'upload': {
        // 获取预签名URL
        const key = params.key;
        const data = await new Promise((resolve, reject) => {
          cos.putObject({
            Bucket: bucket,
            Region: region,
            Key: key,
            Body: Buffer.from(params.body, 'base64'),
            ContentLength: params.size
          }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        return res.status(200).set(headers).json({ success: true, key, data });
      }

      case 'delete': {
        const key = params.key;
        await new Promise((resolve, reject) => {
          cos.deleteObject({
            Bucket: bucket,
            Region: region,
            Key: key
          }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        return res.status(200).set(headers).json({ success: true });
      }

      default:
        return res.status(400).set(headers).json({ error: '未知操作: ' + action });
    }
  } catch (error) {
    console.error('COS操作错误:', error);
    return res.status(500).set(headers).json({ error: error.message || '服务器错误' });
  }
};
