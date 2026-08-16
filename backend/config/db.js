// backend/config/db.js
const mongoose = require('mongoose');
const config = require('./index');

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, {
      dbName: config.mongoDbName,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function closeDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, closeDB };