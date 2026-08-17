// backend/server.js
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB } = require('./config/db');
const balanceRoutes = require('./routes/balanceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS - Allow all origins for now
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Pi Wallet Balance Checker API',
    status: 'running',
    endpoints: ['/health', '/api/check-balances']
  });
});

// Routes
app.use('/api', balanceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Connect to DB and start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Pi balance checker listening on port ${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received: closing server');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received: closing server');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();