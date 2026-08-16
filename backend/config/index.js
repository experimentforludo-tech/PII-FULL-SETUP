// backend/config/index.js
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  allowedOrigins: (process.env.ALLOWED_ORIGIN || '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  maxAddressesPerRequest: Number(process.env.MAX_ADDRESSES_PER_REQUEST) || 100,

  piHorizonBaseUrl: process.env.PI_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com',
  piNetworkPassphrase: process.env.PI_NETWORK_PASSPHRASE || 'Pi Network',

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
  mongoDbName: process.env.MONGO_DB_NAME || 'pi_wallet_checker',

  masterWalletAddress: process.env.MASTER_WALLET_ADDRESS || '',
  businessWalletAddress: process.env.BUSINESS_WALLET_ADDRESS || '',
  domesticWalletAddress: process.env.DOMESTIC_WALLET_ADDRESS || '',
  businessPercent: parseFloat(process.env.BUSINESS_PERCENT || '70'),
  domesticPercent: parseFloat(process.env.DOMESTIC_PERCENT || '30'),

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    secure: process.env.SMTP_SECURE === 'true',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },

  recipients: {
    masterEmails: (process.env.MASTER_RECIPIENT_EMAILS || process.env.RECIPIENT_EMAILS || '')
      .split(',').map((e) => e.trim()).filter(Boolean),
    fbEmails: (process.env.FB_RECIPIENT_EMAILS || '')
      .split(',').map((e) => e.trim()).filter(Boolean),
    saEmails: (process.env.SA_RECIPIENT_EMAILS || '')
      .split(',').map((e) => e.trim()).filter(Boolean),
  },

  telegram: {
    masterTargets: parseTelegramTargets(process.env.MASTER_TELEGRAM_TARGETS || process.env.TELEGRAM_TARGETS),
    fbTargets: parseTelegramTargets(process.env.FB_TELEGRAM_TARGETS),
    saTargets: parseTelegramTargets(process.env.SA_TELEGRAM_TARGETS),
  },
};

function parseTelegramTargets(envValue) {
  return (envValue || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const lastColon = entry.lastIndexOf(':');
      if (lastColon === -1) return null;
      const botToken = entry.slice(0, lastColon).trim();
      const chatId = entry.slice(lastColon + 1).trim();
      if (!botToken || !chatId) return null;
      return { botToken, chatId };
    })
    .filter(Boolean);
}

module.exports = config;