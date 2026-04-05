module.exports = async function handler(req, res) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return res.status(200).set(headers).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).set(headers).json({ error: '只支持POST请求' });
  }

  try {
    const { action, params } = req.body || {};
    
    if (!action) {
      return res.status(400).set(headers).json({ error: '缺少action参数' });
    }

    switch (action) {
      case 'verify': {
        const inputPwd = params?.password;
        const storedPwd = process.env.ACCESS_PASSWORD;
        
        if (inputPwd === storedPwd) {
          return res.status(200).set(headers).json({
            valid: true,
            domain: process.env.COS_DOMAIN || ''
          });
        } else {
          return res.status(200).set(headers).json({ valid: false });
        }
      }

      case 'config': {
        return res.status(200).set(headers).json({
          domain: process.env.COS_DOMAIN || ''
        });
      }

      default:
        return res.status(400).set(headers).json({ error: '未知操作: ' + action });
    }
  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).set(headers).json({ error: error.message || '服务器错误' });
  }
};
