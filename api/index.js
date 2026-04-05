const COS = require('cos-nodejs-sdk-v5');

// 初始化 COS 客户端
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY
});

const bucket = process.env.COS_BUCKET;
const region = process.env.COS_REGION;

module.exports = async function handler(req, res) {
  // Vercel Serverless Function 使用原生 Node.js 响应对象
  
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
            domain: process.env.COS_DOMAIN || ''
          }));
        } else {
          res.writeHead(200, headers);
          return res.end(JSON.stringify({ valid: false }));
        }
      }

      case 'config': {
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
          domain: process.env.COS_DOMAIN || ''
        }));
      }

      case 'list': {
        // 列出 COS 中的图片
        const result = await new Promise((resolve, reject) => {
          cos.getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: 'screenshots/',
            MaxKeys: 1000
          }, function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });

        const files = (result.Contents || [])
          .filter(item => item.Key !== 'screenshots/')
          .map(item => ({
            key: item.Key,
            url: `https://${process.env.COS_DOMAIN}/${item.Key}`,
            lastModified: item.LastModified,
            size: item.Size
          }))
          .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        res.writeHead(200, headers);
        return res.end(JSON.stringify({ files }));
      }

      case 'upload': {
        // 上传图片到 COS
        const { filename, data: base64Data, contentType } = params;
        const key = 'screenshots/' + filename;
        const buffer = Buffer.from(base64Data, 'base64');

        await new Promise((resolve, reject) => {
          cos.putObject({
            Bucket: bucket,
            Region: region,
            Key: key,
            Body: buffer,
            ContentType: contentType
          }, function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });

        res.writeHead(200, headers);
        return res.end(JSON.stringify({
          success: true,
          url: `https://${process.env.COS_DOMAIN}/${key}`,
          key: key
        }));
      }

      case 'delete': {
        // 删除 COS 中的图片
        const { key } = params;

        await new Promise((resolve, reject) => {
          cos.deleteObject({
            Bucket: bucket,
            Region: region,
            Key: key
          }, function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
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

