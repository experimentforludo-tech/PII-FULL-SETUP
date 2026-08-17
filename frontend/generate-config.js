// frontend/generate-config.js
// This script is run during Netlify build to generate js/config.js
// from the environment variable API_URL.
// No manual editing needed; set API_URL in Netlify dashboard.

const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'https://your-backend.up.railway.app/api/check-balances';
const outputDir = path.join(__dirname, 'js');
const outputFile = path.join(outputDir, 'config.js');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const content = `window.APP_CONFIG = {\n  API_URL: '${apiUrl}'\n};\n`;

fs.writeFileSync(outputFile, content);
console.log(`Generated ${outputFile} with API_URL=${apiUrl}`);