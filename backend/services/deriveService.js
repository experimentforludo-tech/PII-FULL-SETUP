// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');

function deriveAddressFromPassphrase(passphrase) {
  try {
    const trimmed = passphrase.trim();
    const words = trimmed.split(/\s+/);

    console.log('=================================');
    console.log('🔑 PI WALLET DERIVATION');
    console.log('=================================');
    console.log(`📝 Words count: ${words.length}`);

    if (words.length !== 24) {
      throw new Error('Invalid passphrase: 24 words required');
    }

    // Expected address
    const expectedAddress = 'GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG';
    console.log(`🎯 Expected: ${expectedAddress}`);

    // Method 1: Raw seed (first 32 bytes)
    const seed = bip39.mnemonicToSeedSync(trimmed);
    const keypair1 = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    const addr1 = keypair1.publicKey();
    console.log(`📍 Method 1 (Raw seed): ${addr1}`);
    console.log(`   Match: ${addr1 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    // Method 2: Seed with empty passphrase
    const seed2 = bip39.mnemonicToSeedSync(words.join(' '), '');
    const keypair2 = StellarBase.Keypair.fromRawEd25519Seed(seed2.slice(0, 32));
    const addr2 = keypair2.publicKey();
    console.log(`📍 Method 2 (Empty pass): ${addr2}`);
    console.log(`   Match: ${addr2 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    // Method 3: Seed without lowercase
    const seed3 = bip39.mnemonicToSeedSync(passphrase.trim());
    const keypair3 = StellarBase.Keypair.fromRawEd25519Seed(seed3.slice(0, 32));
    const addr3 = keypair3.publicKey();
    console.log(`📍 Method 3 (Original case): ${addr3}`);
    console.log(`   Match: ${addr3 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    // Method 4: SHA256 of seed
    const crypto = require('crypto');
    const hashedSeed = crypto.createHash('sha256').update(seed).digest();
    const keypair4 = StellarBase.Keypair.fromRawEd25519Seed(hashedSeed.slice(0, 32));
    const addr4 = keypair4.publicKey();
    console.log(`📍 Method 4 (SHA256): ${addr4}`);
    console.log(`   Match: ${addr4 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    // Method 5: MD5 of seed
    const md5Seed = crypto.createHash('md5').update(seed).digest();
    const keypair5 = StellarBase.Keypair.fromRawEd25519Seed(md5Seed.slice(0, 32));
    const addr5 = keypair5.publicKey();
    console.log(`📍 Method 5 (MD5): ${addr5}`);
    console.log(`   Match: ${addr5 === expectedAddress ? '✅ YES' : '❌ NO'}`);

    console.log('=================================');

    // Check matches
    if (addr1 === expectedAddress) { console.log('✅ RETURNING: Method 1'); return addr1; }
    if (addr2 === expectedAddress) { console.log('✅ RETURNING: Method 2'); return addr2; }
    if (addr3 === expectedAddress) { console.log('✅ RETURNING: Method 3'); return addr3; }
    if (addr4 === expectedAddress) { console.log('✅ RETURNING: Method 4'); return addr4; }
    if (addr5 === expectedAddress) { console.log('✅ RETURNING: Method 5'); return addr5; }

    console.log('❌ NO METHOD MATCHES!');
    console.log('❌ Pi Network uses DIFFERENT mnemonic generation.');
    return addr1;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw new Error('Invalid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };