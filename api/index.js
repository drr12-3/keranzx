const COS = require('cos-nodejs-sdk-v5');

// 初始化 COS 客户端
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY
});

const bucket = process.env.COS_BUCKET;
const region = process.env.COS_REGION;

// 获取 COS 访问域名
function getCosDomain() {
  const domain = process.env.COS_DOMAIN || '';
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain.replace(/\/$/, '');
  }
  return 'https://' + domain;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    });
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
    return res.end(JSON.stringify({ error: '只支持POST请求' }));
  }

  try {
    const body = req.body || {};
    const action = body.action;
    const params = body.params || {};

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };

    switch (action) {
      case 'verify': {
        const inputPwd = params.password;
        const storedPwd = process.env.ACCESS_PASSWORD;
        
        if (inputPwd === storedPwd) {
          res.writeHead(200, headers);
          return res.end(JSON.stringify({
            valid: true,
            domain: getCosDomain()
          }));
        } else {
          res.writeHead(200, headers);
          return res.end(JSON.stringify({ valid: false }));
        }
      }

      case 'config': {
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
          domain: getCosDomain()
        }));
      }

      case 'list': {
        const cosDomain = getCosDomain();
        const result = await new Promise((resolve, reject) => {
          cos.getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: 'screenshots/',
            MaxKeys: 1000
          }, function(err, data) {
            if (err) reject(err);
            else resolve(data);
          });
        });

        const files = (result.Contents || [])
          .filter(item => item.Key !== 'screenshots/')
          .map(item => ({
            key: item.Key,
            url: `${cosDomain}/${item.Key}`,
            lastModified: item.LastModified,
            size: item.Size
          }))
          .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        res.writeHead(200, headers);
        return res.end(JSON.stringify({ files }));
      }

      case 'upload': {
        const { key, body: base64Data } = params;
        
        if (!key || !base64Data) {
          res.writeHead(400, headers);
          return res.end(JSON.stringify({ error: '缺少必要参数' }));
        }

        const filename = key.split('/').pop();
        const ext = filename.split('.').pop().toLowerCase();
        const contentTypes = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
          'png': 'image/png', 'gif': 'image/gif',
          'webp': 'image/webp', 'bmp': 'image/bmp'
        };
        const contentType = contentTypes[ext] || 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');

        await new Promise((resolve, reject) => {
          cos.putObject({
            Bucket: bucket,
            Region: region,
            Key: key,
            Body: buffer,
            ContentLength: buffer.length,
            ContentType: contentType
          }, function(err, data) {
            if (err) reject(err);
            else resolve(data);
          });
        });

        res.writeHead(200, headers);
        return res.end(JSON.stringify({
          success: true,
          url: `${getCosDomain()}/${key}`,
          key: key
        }));
      }

      case 'delete': {
        const { key } = params;

        await new Promise((resolve, reject) => {
          cos.deleteObject({
            Bucket: bucket,
            Region: region,
            Key: key
          }, function(err, data) {
            if (err) reject(err);
            else resolve(data);
          });
        });

        res.writeHead(200, headers);
        return res.end(JSON.stringify({ success: true }));
      }

      default:
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: '未知操作: ' + action }));
    }
  } catch (error) {
    console.error('API错误:', error);
    res.writeHead(500, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
    return res.end(JSON.stringify({ error: error.message || '服务器错误' }));
  }
};
