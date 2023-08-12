// Contractors Routes

const express = require('express');
const router = express.Router();

const {
  getContractors,
  addContractor,
  getContractor,
  deleteContractor
} = require('../controllers/contractors.controller');

router.route('/')
  .get(getContractors)
  .post(addContractor);

router.route('/:id')
  .get(getContractor)
  .delete(deleteContractor);

module.exports = router;