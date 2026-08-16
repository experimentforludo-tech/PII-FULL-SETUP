// backend/routes/balanceRoutes.js
const express = require('express');
const { checkBalances } = require('../controllers/balanceController');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/check-balances', rateLimiter, checkBalances);

module.exports = router;