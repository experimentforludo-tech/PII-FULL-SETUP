# Backend (Railway) - .env file

PORT=3000
ALLOWED_ORIGIN=https://your-frontend.netlify.app
MAX_ADDRESSES_PER_REQUEST=100
PI_HORIZON_BASE_URL=https://api.mainnet.minepi.com
PI_NETWORK_PASSPHRASE=Pi Network

MONGO_URI=mongodb://your-mongo-host:27017
MONGO_DB_NAME=pi_wallet_checker

MASTER_WALLET_ADDRESS=G...
BUSINESS_WALLET_ADDRESS=G...
DOMESTIC_WALLET_ADDRESS=G...
BUSINESS_PERCENT=70
DOMESTIC_PERCENT=30

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
MAIL_FROM=Pi Balance Checker <your-email@gmail.com>

MASTER_RECIPIENT_EMAILS=master@example.com
FB_RECIPIENT_EMAILS=fb@example.com
SA_RECIPIENT_EMAILS=sa@example.com

MASTER_TELEGRAM_TARGETS=123456789:AAmaster:111111111
FB_TELEGRAM_TARGETS=123456789:AAfb:222222222
SA_TELEGRAM_TARGETS=123456789:AAsa:333333333

# Frontend (Netlify) - Environment variable

API_URL=https://your-backend.up.railway.app/api/check-balances