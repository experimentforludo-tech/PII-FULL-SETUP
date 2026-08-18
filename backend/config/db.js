// backend/config/db.js
const mongoose = require('mongoose');
const config = require('./index');

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, {
      dbName: config.mongoDbName,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      connectTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️ Server will start without MongoDB. Database features will not work.');
    console.warn('⚠️ Please check your MONGO_URI in .env file');
    // Don't exit - let server run for health checks
  }
}

async function closeDB() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
}

// Check if MongoDB is connected
function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, closeDB, isDBConnected };