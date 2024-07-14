const jwt = require('jsonwebtoken');
const axios = require('axios');


const requireAuth = async (req, res, next) => {
  const authServiceUrl = process.env.NODE_ENV === 'production' ? process.env.AUTH_SERVICE_URL : process.env.AUTH_SERVICE_URL_DEV;
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  }


  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Veryify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Proxy request to auth server to validate token and get user data
    const response = await axios.get(`${authServiceUrl}/validate`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": 'application/json'
        }
      });

    // Set user data in request object
    req.user = response.data.data.user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

module.exports = { requireAuth };