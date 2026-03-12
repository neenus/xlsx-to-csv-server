// Contractors Routes

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');

const {
  getContractors,
  addContractor,
  getContractor,
  deleteContractor,
  editContractor,
} = require('../controllers/contractors.controller');

router.route('/')
  .get(requireAuth, getContractors)
  .post(requireAuth, addContractor);

router.route('/:id')
  .get(requireAuth, getContractor)
  .patch(requireAuth, editContractor)
  .delete(requireAuth, deleteContractor);

module.exports = router;