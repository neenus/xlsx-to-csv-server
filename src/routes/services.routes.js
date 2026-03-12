const express = require('express');
const router = express.Router();

const {
  getServices,
  addService,
  getService,
  updateService,
} = require('../controllers/services.controller');

router.route('/')
  .get(getServices)
  .post(addService);

router.route('/:id')
  .get(getService)
  .put(updateService);

module.exports = router;