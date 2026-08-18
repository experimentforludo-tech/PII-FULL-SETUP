// frontend/js/config.js
// Backend API URL configuration
// This file is auto-generated during Netlify build
// Manual changes will be overwritten

(function() {
  const API_URL = 'https://pi-wallet-backend-production.up.railway.app/api/check-balances';
  
  // Set both formats for compatibility
  window.APP_CONFIG = {
    API_URL: API_URL
  };
  window.API_URL = API_URL;
  
  console.log('✅ Config loaded. API URL:', API_URL);
})();