// backend/server.js
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB } = require('./config/db');
const balanceRoutes = require('./routes/balanceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS
app.use(
  cors({
    origin:
      config.allowedOrigins.includes('*')
        ? '*'
        : (origin, callback) => {
            if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          },
  })
);

app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api', balanceRoutes);

// Error handler
app.use(errorHandler);

// Connect to DB and start server
connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(`Pi balance checker listening on port ${config.port}`);
  });
});