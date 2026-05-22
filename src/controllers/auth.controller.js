const axios = require('axios');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Login user — proxies to nr-auth service
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/v1/auth/login`,
      req.body,
      { headers: { 'x-app-name': process.env.APP_NAME } }
    );
    res.status(200).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const error = err.response?.data?.error || 'Login failed';
    res.status(status).json({ success: false, error });
  }
});

// @desc    Logout user
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
  res.clearCookie('token').status(200).json({ success: true, data: {} });
});

