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

    if (action === 'verify') {
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

    if (action === 'config') {
      res.writeHead(200, headers);
      return res.end(JSON.stringify({
        domain: process.env.COS_DOMAIN || ''
      }));
    }

    res.writeHead(400, headers);
    return res.end(JSON.stringify({ error: '未知操作: ' + action }));
  } catch (error) {
    console.error('API错误:', error);
    res.writeHead(500, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
    return res.end(JSON.stringify({ error: error.message || '服务器错误' }));
  }
};
