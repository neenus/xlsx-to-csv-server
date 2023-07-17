const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  service_name: {
    type: String,
    required: [true, 'Please add a service name'],
    trim: true,
    maxlength: [50, 'Service name cannot be more than 50 characters']
  },
  education_level: {
    type: [String],
    required: [true, 'Please add an education level'],
    enum: [
      'elementary',
      'high school',
      'postsecondary'
    ],
  },
  service_rate: {
    type: Number,
    required: [true, 'Please add a service rate']
  }
},
  {
    timestamps: true
  });

module.exports = mongoose.model('Service', ServiceSchema);