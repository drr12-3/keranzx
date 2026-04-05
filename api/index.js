module.exports = async function handler(req, res) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    res.set(headers);
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    res.set(headers);
    return res.status(405).json({ error: '只支持POST请求' });
  }

  res.set(headers);

  try {
    const body = req.body || {};
    const action = body.action;
    const params = body.params || {};

    if (action === 'verify') {
      const inputPwd = params.password;
      const storedPwd = process.env.ACCESS_PASSWORD;

      if (inputPwd === storedPwd) {
        return res.status(200).json({
          valid: true,
          domain: process.env.COS_DOMAIN || ''
        });
      } else {
        return res.status(200).json({ valid: false });
      }
    }

    if (action === 'config') {
      return res.status(200).json({
        domain: process.env.COS_DOMAIN || ''
      });
    }

    return res.status(400).json({ error: '未知操作: ' + action });
  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ error: error.message || '服务器错误' });
  }
};

