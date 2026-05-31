const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');

const {
  login,
  logout,
  getProfile,
} = require('../controllers/auth.controller');

router.route('/login').post(login);
router.route('/logout').post(requireAuth, logout);
router.route('/profile').get(requireAuth, getProfile);

module.exports = router;
