// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');
const crypto = require('crypto');

function deriveAddressFromPassphrase(passphrase) {
  try {
    const trimmed = passphrase.trim();
    const words = trimmed.split(/\s+/);

    console.log('=================================');
    console.log('🔑 PI WALLET DERIVATION - V3');
    console.log('=================================');
    console.log(`📝 Words count: ${words.length}`);
    console.log(`📝 First word: ${words[0]}`);
    console.log(`📝 Last word: ${words[23]}`);

    if (words.length !== 24) {
      throw new Error('Invalid passphrase: 24 words required');
    }

    const expectedAddress = 'GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG';
    console.log(`🎯 Expected: ${expectedAddress}`);

    // BIP39 seed
    const seed = bip39.mnemonicToSeedSync(trimmed);
    console.log(`🌱 BIP39 Seed (64 bytes): ${seed.toString('hex').substring(0, 32)}...`);

    // Stellar StrKey encoding check
    // Expected address: GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG
    // Decode expected address to get raw public key
    try {
      const decodedExpected = StellarBase.StrKey.decodeEd25519PublicKey(expectedAddress);
      console.log(`🔓 Expected raw public key (32 bytes): ${decodedExpected.toString('hex')}`);
      
      // Ab humein ye raw public key chahiye from passphrase
      // Try reverse engineering - kaunsa 32-byte value is public key ka private key hai?
      
      // Stellar address G... = version byte + 32 bytes public key + checksum
      // Expected raw public key: ${decodedExpected.toString('hex')}
      
      // Try: Is public key directly from BIP39 seed?
      const directKeypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
      const directPubKey = directKeypair.rawPublicKey();
      console.log(`📍 Direct raw pub key: ${directPubKey.toString('hex')}`);
      console.log(`   Match: ${directPubKey.toString('hex') === decodedExpected.toString('hex') ? '✅ YES' : '❌ NO'}`);
      
      // Try: Ed25519 from seed with different offsets
      for (let offset = 0; offset < 32; offset++) {
        try {
          const slice = seed.slice(offset, offset + 32);
          if (slice.length !== 32) continue;
          const kp = StellarBase.Keypair.fromRawEd25519Seed(slice);
          if (kp.publicKey() === expectedAddress) {
            console.log(`✅ MATCH FOUND at offset ${offset}!`);
            return expectedAddress;
          }
        } catch (e) {}
      }
      
      // Try: Different hash combinations
      const hashMethods = [
        { name: 'SHA256(seed)', hash: () => crypto.createHash('sha256').update(seed).digest() },
        { name: 'SHA512(seed)', hash: () => crypto.createHash('sha512').update(seed).digest() },
        { name: 'SHA256(seed[0:32])', hash: () => crypto.createHash('sha256').update(seed.slice(0, 32)).digest() },
        { name: 'SHA256(seed[32:64])', hash: () => crypto.createHash('sha256').update(seed.slice(32, 64)).digest() },
        { name: 'SHA3-256(seed)', hash: () => crypto.createHash('sha3-256').update(seed).digest() },
        { name: 'RIPEMD160(seed)', hash: () => crypto.createHash('ripemd160').update(seed).digest() },
        { name: 'Blake2b512(seed)', hash: () => crypto.createHash('blake2b512').update(seed).digest() },
      ];
      
      for (const method of hashMethods) {
        try {
          const hashResult = method.hash();
          const kp = StellarBase.Keypair.fromRawEd25519Seed(hashResult.slice(0, 32));
          console.log(`📍 ${method.name}: ${kp.publicKey()}`);
          console.log(`   Match: ${kp.publicKey() === expectedAddress ? '✅ YES' : '❌ NO'}`);
          if (kp.publicKey() === expectedAddress) {
            return expectedAddress;
          }
        } catch (e) {
          console.log(`📍 ${method.name}: failed`);
        }
      }
      
      // Try: PBKDF2 variations
      const pbkdf2Methods = [
        { name: 'PBKDF2(seed, "mnemonic", 2048)', salt: 'mnemonic', iterations: 2048 },
        { name: 'PBKDF2(seed, "", 2048)', salt: '', iterations: 2048 },
        { name: 'PBKDF2(seed, "pi", 2048)', salt: 'pi', iterations: 2048 },
        { name: 'PBKDF2(seed, "Pi Network", 2048)', salt: 'Pi Network', iterations: 2048 },
      ];
      
      for (const method of pbkdf2Methods) {
        try {
          const derived = crypto.pbkdf2Sync(seed, method.salt, method.iterations, 32, 'sha512');
          const kp = StellarBase.Keypair.fromRawEd25519Seed(derived);
          console.log(`📍 ${method.name}: ${kp.publicKey()}`);
          console.log(`   Match: ${kp.publicKey() === expectedAddress ? '✅ YES' : '❌ NO'}`);
          if (kp.publicKey() === expectedAddress) {
            return expectedAddress;
          }
        } catch (e) {
          console.log(`📍 ${method.name}: failed`);
        }
      }
      
    } catch (e) {
      console.error(`❌ Decode error: ${e.message}`);
    }

    console.log('=================================');
    console.log('❌ NO MATCH FOUND');
    
    // Fallback
    const fallbackKp = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    return fallbackKp.publicKey();
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw new Error('Invalid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };