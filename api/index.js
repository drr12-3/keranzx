module.exports = async function handler(req, res) {
  return res.json({ 
    success: true, 
    message: 'API 正常工作！',
    password: process.env.ACCESS_PASSWORD ? '已设置' : '未设置'
  });
};
