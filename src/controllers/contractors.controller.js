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
  const { name, address, city, state, zip, phone, email } = req.body;
  const contractor = await Contractor.create({ name, address, city, state, zip, phone, email });
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



// @desc    Temporary route to seed database
// @route   POST /api/v1/contractors/seed
// @access  Public

// exports.seedContractors = async (req, res, next) => {
//   // drop existing contractors collection
//   try {
//     await Contractor.collection.drop();
//   } catch (err) {
//     console.log({ err })
//   }

//   // seed database with contractors.json data using contractor name only
// try {
//   const contractors = await Contractor.create(contractorsJSON.map(contractor => {
//     console.log(contractor.name);
//     return { name: contractor.name }
//   }));

//   return res.status(201).json({
//     success: true,
//     count: contractors.length,
//     data: contractors
//   });
// } catch (err) {
//   console.log({ err })
//   return res.status(500).json({
//     success: false,
//     error: 'Server Error'
//   })
// }
// }