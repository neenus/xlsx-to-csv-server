const axios = require('axios');

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Proxy authentication request to auth service from Doc-Hub Server
    const response = await axios.post(`${process.env.AUTH_SERVICE_URL}/login`, {
      email,
      password
    });

    return res.
      status(200)
      .cookie('token', response.data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      .json(response.data.data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

// @desc    Logout user
// @route   GET /api/v1/auth/logout
// @access  Private

exports.logout = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  return res
    .clearCookie('token')
    .status(200)
    .json({ success: true, data: {} });
}

