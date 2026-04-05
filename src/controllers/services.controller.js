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
  const { service_name, service_education_level, service_rate, aliases } = req.body;
  const service = await Service.create({
    service_name,
    service_education_level,
    service_rate,
    aliases: aliases || []
  });
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

  const { service_name, service_education_level, service_rate, aliases } = req.body;
  if (service_name !== undefined) service.service_name = service_name;
  if (service_education_level !== undefined) service.service_education_level = service_education_level;
  if (service_rate !== undefined) service.service_rate = service_rate;
  if (aliases !== undefined) service.aliases = aliases;

  await service.save();
  res.status(200).json({ success: true, data: service });
});

// @desc    Delete service
// @route   DELETE /api/v1/services/:id
// @access  Public
exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('No service found', 404);
  await service.deleteOne();
  res.status(200).json({ success: true, data: {} });
});