module.exports = function handler(req, res) {
  res.json({
    status: 'ok',
    hasKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT SET',
    method: req.method
  });
};
