const axios = require('axios');
const asyncHandler = require('../middlewares/asyncHandler');

const authServiceUrl = () => {
  const url = process.env.AUTH_SERVICE_URL;
  if (!url) throw new Error('AUTH_SERVICE_URL is not configured');
  return url;
};

const appName = () => {
  const name = process.env.APP_NAME;
  if (!name) throw new Error('APP_NAME is not configured');
  return name;
};

// @desc    Authenticate user — proxies to nr-auth, sets httpOnly cookie
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  try {
    const response = await axios.post(
      `${authServiceUrl()}/api/v1/auth/login`,
      req.body,
      { headers: { 'x-app-name': appName() } }
    );

    const { token, user, requiresTwoFactor, tempToken } = response.data.data ?? {};

    // 2FA required — forward the prompt, no cookie yet
    if (requiresTwoFactor) {
      return res.status(200).json({ success: true, data: { requiresTwoFactor: true, tempToken } });
    }

    if (!token || !user) {
      return res.status(500).json({ success: false, error: 'Unexpected response from auth service' });
    }

    // Set JWT in httpOnly cookie — frontend reads session via GET /auth/profile
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({ success: true, user });
  } catch (err) {
    const status = err.response?.status || 500;
    const error = err.response?.data?.error || 'Login failed';
    res.status(status).json({ success: false, error });
  }
});

// @desc    Logout user — clears cookie and notifies nr-auth (best effort)
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.token;

  // Fire-and-forget logout to nr-auth — don't block or fail on error
  if (token) {
    axios.post(
      `${authServiceUrl()}/api/v1/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'x-app-name': appName() } }
    ).catch(() => {});
  }

  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged-in user — returns req.user set by requireAuth middleware
// @route   GET /api/v1/auth/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  res.status(200).json({ success: true, user: req.user });
});
