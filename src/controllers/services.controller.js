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
  const { service_name, education_level, service_rate } = req.body;
  const service = await Service.create({ service_name, education_level, service_rate });
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

  const { service_name, education_level, service_rate } = req.body;
  service_name && (service.service_name = service_name);
  education_level && (service.education_level = education_level);
  service_rate && (service.service_rate = service_rate);

  await service.save();
  res.status(200).json({ success: true, data: service });
});

// @desc    Temporary route to seed database
// @route   POST /api/v1/services/seed
// exports.seedServices = async (req, res, next) => {
//   // Drop collection
//   try {
//     await Service.collection.drop();
//   } catch (err) {
//     console.log({ err })
//   }

//   // insert services from json file into database
//   // each service is an object with the following properties:
//   // service_name, education_level, service_rate
//   try {

//     // create an array of documents to insert into database
//     const serviceDocuments = servicesJson.map(service => ({
//       service_name: service.service_name,
//       education_level: service.education_level,
//       service_rate: service.service_rate
//     }));

//     // insert many documents into database
//     await Service.insertMany(serviceDocuments);

//     return res.status(201).json({
//       success: true,
//       count: await Service.countDocuments(),
//       data: await Service.find()
//     });

//   } catch (err) {
//     console.log({ err })
//     return res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// }