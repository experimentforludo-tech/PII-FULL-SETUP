// backend/test-address.js
require('dotenv').config();

const { deriveAddressFromPassphrase } = require('./services/deriveService');

async function testAddress() {
  console.log('=================================');
  console.log('🧪 ADDRESS DERIVATION TEST');
  console.log('=================================');
  
  // Yahan apna ACTUAL passphrase daalo (jo Pi app mein hai)
  const testPassphrase = 'YOUR_24_WORD_PASSPHRASE_HERE';
  
  // Ye actual address hai jo aapne abhi check kiya
  const actualWalletAddress = 'GAWNCRJUZCV3HEJSE4IXDIHOX6JHPL6AUANMOJP2JTLZTZVEUWY4PWUN';
  
  console.log(`\n📝 Actual Wallet Address: ${actualWalletAddress}`);
  console.log(`📝 Actual Balance: 773.37 Pi`);
  
  try {
    const derivedAddress = deriveAddressFromPassphrase(testPassphrase);
    
    console.log(`\n📍 Derived Address: ${derivedAddress}`);
    
    if (derivedAddress === actualWalletAddress) {
      console.log('\n✅ ADDRESS MATCH!');
    } else {
      console.log('\n❌ ADDRESS MISMATCH!');
      console.log(`❌ Derived: ${derivedAddress}`);
      console.log(`❌ Actual:  ${actualWalletAddress}`);
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
  
  process.exit(0);
}

testAddress();