// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');

function deriveAddressFromPassphrase(passphrase) {
  try {
    const trimmed = passphrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = trimmed.split(' ');

    console.log('=================================');
    console.log('🔑 ADDRESS DERIVATION DEBUG');
    console.log('=================================');
    console.log(`📝 Words count: ${words.length}`);
    console.log(`📝 First 3 words: ${words.slice(0, 3).join(' ')}...`);
    console.log(`📝 Last 3 words: ...${words.slice(-3).join(' ')}`);

    if (words.length !== 24) {
      console.error('❌ Expected 24 words');
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    if (words.some((w) => w.length < 2)) {
      console.error('❌ Some words too short');
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // Expected address
    const expectedAddress = 'GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG';
    console.log(`🎯 Expected address: ${expectedAddress}`);

    // Method 1: Raw seed
    const seed = bip39.mnemonicToSeedSync(trimmed);
    console.log(`🌱 Seed (first 8 bytes): ${seed.slice(0, 8).toString('hex')}...`);
    
    const keypair1 = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    const addr1 = keypair1.publicKey();
    console.log(`📍 Method 1 (Raw seed): ${addr1}`);
    console.log(`   Match: ${addr1 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    // Method 2: With empty passphrase
    const seed2 = bip39.mnemonicToSeedSync(words.join(' '), '');
    const keypair2 = StellarBase.Keypair.fromRawEd25519Seed(seed2.slice(0, 32));
    const addr2 = keypair2.publicKey();
    console.log(`📍 Method 2 (Empty pass): ${addr2}`);
    console.log(`   Match: ${addr2 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    // Method 3: Original case (no lowercase)
    const seed3 = bip39.mnemonicToSeedSync(passphrase.trim());
    const keypair3 = StellarBase.Keypair.fromRawEd25519Seed(seed3.slice(0, 32));
    const addr3 = keypair3.publicKey();
    console.log(`📍 Method 3 (Original case): ${addr3}`);
    console.log(`   Match: ${addr3 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    // Method 4: Full seed as key
    try {
      const keypair4 = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 64));
      const addr4 = keypair4.publicKey();
      console.log(`📍 Method 4 (64 bytes): ${addr4}`);
      console.log(`   Match: ${addr4 === expectedAddress ? '✅ YES' : '❌ NO'}`);
    } catch (err) {
      console.log(`📍 Method 4 failed: ${err.message}`);
    }

    // Method 5: SHA256 of seed
    try {
      const crypto = require('crypto');
      const hashedSeed = crypto.createHash('sha256').update(seed).digest();
      const keypair5 = StellarBase.Keypair.fromRawEd25519Seed(hashedSeed.slice(0, 32));
      const addr5 = keypair5.publicKey();
      console.log(`📍 Method 5 (SHA256): ${addr5}`);
      console.log(`   Match: ${addr5 === expectedAddress ? '✅ YES' : '❌ NO'}`);
    } catch (err) {
      console.log(`📍 Method 5 failed: ${err.message}`);
    }

    console.log('=================================');

    // Check which method matches
    if (addr1 === expectedAddress) {
      console.log('✅ RETURNING: Method 1 (Raw seed)');
      return addr1;
    }
    if (addr2 === expectedAddress) {
      console.log('✅ RETURNING: Method 2 (Empty pass)');
      return addr2;
    }
    if (addr3 === expectedAddress) {
      console.log('✅ RETURNING: Method 3 (Original case)');
      return addr3;
    }
    if (typeof addr4 !== 'undefined' && addr4 === expectedAddress) {
      console.log('✅ RETURNING: Method 4 (64 bytes)');
      return addr4;
    }
    if (typeof addr5 !== 'undefined' && addr5 === expectedAddress) {
      console.log('✅ RETURNING: Method 5 (SHA256)');
      return addr5;
    }

    console.log('❌ NO METHOD MATCHES! Using Method 1 as default.');
    console.log('❌ Pi Network derivation is DIFFERENT from standard BIP39.');
    return addr1;
  } catch (err) {
    console.error(`❌ Derivation error: ${err.message}`);
    throw new Error('Invalid passphrase: please enter a valid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };