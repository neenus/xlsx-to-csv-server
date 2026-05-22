const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');

const {
  getServices,
  addService,
  getService,
  updateService,
  deleteService,
} = require('../controllers/services.controller');

router.route('/')
  .get(requireAuth, getServices)
  .post(requireAuth, addService);

router.route('/:id')
  .get(requireAuth, getService)
  .put(requireAuth, updateService)
  .delete(requireAuth, deleteService);

module.exports = router;