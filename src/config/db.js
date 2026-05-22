const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URL);
  await console.log(`MongoDB connected: ${connection.connection.host}`);
};

const closeDB = async () => await mongoose.connection.close();

module.exports = { connectDB, closeDB };