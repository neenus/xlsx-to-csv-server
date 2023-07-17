const express = require('express');
const router = express.Router();

const {
  getServices,
  addService,
  getService,
  // seedServices
} = require('../controllers/services.controller');

router.route('/')
  .get(getServices)
  .post(addService);

router.route('/:id')
  .get(getService);

// router.route('/seed')
//   .post(seedServices);

module.exports = router;