const axios = require('axios');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const authServiceUrl = process.env.NODE_ENV === 'production'
    ? process.env.AUTH_SERVICE_URL
    : process.env.AUTH_SERVICE_URL_DEV;

  const response = await axios.post(`${authServiceUrl}/login`, { email, password });

  res
    .status(200)
    .cookie('token', response.data.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .json(response.data.data);
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

