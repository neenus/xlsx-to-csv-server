// Contractors controller

const Contractor = require('../models/Contractor.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError } = require('../middlewares/error.middleware');

// @desc    Get all contractors
// @route   GET /api/v1/contractors
// @access  Private
exports.getContractors = asyncHandler(async (req, res) => {
  const contractors = await Contractor.find();
  res.status(200).json({ success: true, count: contractors.length, data: contractors });
});

// @desc    Add contractor
// @route   POST /api/v1/contractors
// @access  Private
exports.addContractor = asyncHandler(async (req, res) => {
  const { contractor_name, contractor_address, contractor_city, contractor_state, contractor_zip, contractor_phone, contractor_email } = req.body;
  const contractor = await Contractor.create({ contractor_name, contractor_address, contractor_city, contractor_state, contractor_zip, contractor_phone, contractor_email });
  res.status(201).json({ success: true, data: contractor });
});

// @desc    Get single contractor
// @route   GET /api/v1/contractors/:id
// @access  Private
exports.getContractor = asyncHandler(async (req, res) => {
  const contractor = await Contractor.findById(req.params.id);
  if (!contractor) throw new AppError('No contractor found', 404);
  res.status(200).json({ success: true, data: contractor });
});

// @desc    Delete contractor
// @route   DELETE /api/v1/contractors/:id
// @access  Private
exports.deleteContractor = asyncHandler(async (req, res) => {
  const contractor = await Contractor.findById(req.params.id);
  if (!contractor) throw new AppError('No contractor found', 404);
  await contractor.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Edit contractor
// @route   PATCH /api/v1/contractors/:id
// @access  Private
exports.editContractor = asyncHandler(async (req, res) => {
  const contractor = await Contractor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!contractor) throw new AppError('No contractor found', 404);
  res.status(200).json({ success: true, data: contractor });
});