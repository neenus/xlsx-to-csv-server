const axios = require('axios');

const requireAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }

  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    const appName = process.env.APP_NAME;
    const response = await axios.get(
      `${authServiceUrl}/api/v1/auth/validate?app=${appName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    req.user = response.data.data.user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }
};

module.exports = { requireAuth };