// Contractors Routes

const express = require('express');
const router = express.Router();

const {
  getContractors,
  addContractor,
  getContractor,
  deleteContractor,
  editContractor,
  // seedContractors
} = require('../controllers/contractors.controller');

router.route('/')
  .get(getContractors)
  .post(addContractor);

router.route('/:id')
  .get(getContractor)
  .patch(editContractor)
  .delete(deleteContractor);

// router.route('/seed')
//   .post(seedContractors);

module.exports = router;