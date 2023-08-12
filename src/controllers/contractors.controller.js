// Contractors controller

const Contractor = require('../models/Contractor.model');

// @desc    Get all contractors
// @route   GET /api/v1/contractors
// @access  Public

exports.getContractors = async (req, res, next) => {
  try {
    const contractors = await Contractor.find();

    return res.status(200).json({
      success: true,
      count: contractors.length,
      data: contractors
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

// @desc    Add contractor
// @route   POST /api/v1/contractors
// @access  Public

exports.addContractor = async (req, res, next) => {
  const { name, address, city, state, zip, phone, email } = req.body;

  try {
    const contractor = await Contractor.create({
      name,
      address,
      city,
      state,
      zip,
      phone,
      email
    });

    return res.status(201).json({
      success: true,
      data: contractor
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'This contractor already exists'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

// @desc    Get single contractor
// @route   GET /api/v1/contractors/:id
// @access  Public

exports.getContractor = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id);

    if (!contractor) {
      return res.status(404).json({
        success: false,
        error: 'No contractor found'
      });
    }

    return res.status(200).json({
      success: true,
      data: contractor
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

// @desc    Delete contractor
// @route   DELETE /api/v1/contractors/:id
// @access  Public

exports.deleteContractor = async (req, res, next) => {

  try {
    const contractor = await Contractor.findById(req.params.id);

    if (!contractor) {
      return res.status(404).json({
        success: false,
        error: 'No contractor found'
      });
    }

    await contractor.deleteOne();

    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

