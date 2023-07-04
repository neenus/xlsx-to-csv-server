const mongoose = require('mongoose');
require("dotenv").config({ path: "../.env" });

const connectDB = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

module.exports = connectDB;