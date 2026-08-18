// backend/server.js
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB, isDBConnected } = require('./config/db');
const balanceRoutes = require('./routes/balanceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  const dbStatus = isDBConnected() ? 'connected' : 'disconnected';
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    memory: process.memoryUsage()
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Pi Wallet Balance Checker API',
    status: 'running',
    version: '1.0.0',
    endpoints: ['/health', '/api/check-balances'],
    database: isDBConnected() ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api', balanceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use(errorHandler);

// Connect to DB and start server
const startServer = async () => {
  try {
    // Try to connect to MongoDB (won't crash if fails)
    await connectDB();
    
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log('=================================');
      console.log(`🚀 Pi balance checker listening on port ${config.port}`);
      console.log(`📊 Database: ${isDBConnected() ? '✅ Connected' : '⚠️ Disconnected'}`);
      console.log(`🌐 Allowed Origins: ${config.allowedOrigins.join(', ')}`);
      console.log('=================================');
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`${signal} received: closing server`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
      
      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();