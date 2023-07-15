const Service = require('../models/Service.model');
// const servicesJson = require('../data/services.json');

// @desc    Get all services
// @route   GET /api/v1/services
// @access  Public

exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find();

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

// @desc    Add service
// @route   POST /api/v1/services
// @access  Public

exports.addService = async (req, res, next) => {
  const { service_name, education_level, service_rate } = req.body;

  try {
    const service = await Service.create({
      service_name,
      education_level,
      service_rate
    });

    return res.status(201).json({
      success: true,
      data: service
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'This service already exists'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

// @desc    Get single service
// @route   GET /api/v1/services/:id
// @access  Public

exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'No service found'
      });
    }

    return res.status(200).json({
      success: true,
      data: service
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}

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