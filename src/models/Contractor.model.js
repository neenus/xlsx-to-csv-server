// Contrator model

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractorSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
    trim: true,
    maxlength: [50, 'Address can not be more than 50 characters']
  },
  city: {
    type: String,
    required: [true, 'Please add a city'],
    trim: true,
    maxlength: [50, 'City can not be more than 50 characters']
  },
  state: {
    type: String,
    required: [true, 'Please add a state'],
    trim: true,
    maxlength: [50, 'State can not be more than 50 characters']
  },
  zip: {
    type: String,
    required: [true, 'Please add a zip'],
    trim: true,
    maxlength: [50, 'Zip can not be more than 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone'],
    trim: true,
    maxlength: [50, 'Phone can not be more than 50 characters'],
    match: [
      /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/,
      'Please add a valid phone number'
    ]
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    trim: true,
    maxlength: [50, 'Email can not be more than 50 characters'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  }
},
  {
    timestamps: true
  });

module.exports = mongoose.model('Contractor', ContractorSchema);
