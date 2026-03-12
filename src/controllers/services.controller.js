const Service = require('../models/Service.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError } = require('../middlewares/error.middleware');
// const servicesJson = require('../data/services.json');

// @desc    Get all services
// @route   GET /api/v1/services
// @access  Public
exports.getServices = asyncHandler(async (req, res) => {
  const services = await Service.find();
  res.status(200).json({ success: true, count: services.length, data: services });
});

// @desc    Add service
// @route   POST /api/v1/services
// @access  Public
exports.addService = asyncHandler(async (req, res) => {
  const { service_name, service_education_level, service_rate } = req.body;
  const service = await Service.create({ service_name, service_education_level, service_rate });
  res.status(201).json({ success: true, data: service });
});

// @desc    Get single service
// @route   GET /api/v1/services/:id
// @access  Public
exports.getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('No service found', 404);
  res.status(200).json({ success: true, data: service });
});

// @desc    Update service
// @route   PUT /api/v1/services/:id
// @access  Public
exports.updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('No service found', 404);

  const { service_name, service_education_level, service_rate } = req.body;
  service_name && (service.service_name = service_name);
  service_education_level && (service.service_education_level = service_education_level);
  service_rate && (service.service_rate = service_rate);

  await service.save();
  res.status(200).json({ success: true, data: service });
});