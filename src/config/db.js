const mongoose = require('mongoose');

const connectDB = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await console.log(`MongoDB connected: ${connection.connection.host}`);
};

const closeDB = async () => await mongoose.connection.close();

module.exports = { connectDB, closeDB };