// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');
const crypto = require('crypto');

function deriveAddressFromPassphrase(passphrase) {
  try {
    const trimmed = passphrase.trim();
    const words = trimmed.split(/\s+/);

    console.log('=================================');
    console.log('🔑 PI DERIVATION - V4');
    console.log('=================================');
    console.log(`📝 Words: ${words.length}`);
    console.log(`📝 Passphrase: ${trimmed}`);

    if (words.length !== 24) {
      throw new Error('Invalid passphrase: 24 words required');
    }

    const expectedAddress = 'GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG';
    console.log(`🎯 Expected: ${expectedAddress}`);

    // Decode expected address to get raw public key
    const expectedRawPubKey = StellarBase.StrKey.decodeEd25519PublicKey(expectedAddress);
    console.log(`🔓 Expected raw pub key: ${expectedRawPubKey.toString('hex')}`);

    // BIP39 seed
    const seed = bip39.mnemonicToSeedSync(trimmed);
    console.log(`🌱 Seed: ${seed.toString('hex')}`);

    // TRY: Different combinations of seed bytes
    const attempts = [];

    // 1. All 64 bytes as Ed25519 seed (if SDK supports)
    try {
      const kp = StellarBase.Keypair.fromRawEd25519Seed(seed);
      attempts.push({ name: 'Full 64-byte seed', addr: kp.publicKey() });
    } catch(e) {}

    // 2. First 32 bytes
    attempts.push({ 
      name: 'First 32 bytes', 
      addr: StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32)).publicKey() 
    });

    // 3. Last 32 bytes
    attempts.push({ 
      name: 'Last 32 bytes', 
      addr: StellarBase.Keypair.fromRawEd25519Seed(seed.slice(32, 64)).publicKey() 
    });

    // 4. Every 32-byte window
    for (let i = 0; i <= 32; i++) {
      const slice = seed.slice(i, i + 32);
      if (slice.length === 32) {
        const addr = StellarBase.Keypair.fromRawEd25519Seed(slice).publicKey();
        if (addr === expectedAddress) {
          console.log(`✅ MATCH at offset ${i}!`);
          return expectedAddress;
        }
      }
    }

    // 5. XOR first and last 32 bytes
    const xorResult = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      xorResult[i] = seed[i] ^ seed[i + 32];
    }
    attempts.push({ 
      name: 'XOR(first, last)', 
      addr: StellarBase.Keypair.fromRawEd25519Seed(xorResult).publicKey() 
    });

    // 6. Hash methods
    const hashMethods = [
      { name: 'SHA256(seed)', hash: crypto.createHash('sha256').update(seed).digest() },
      { name: 'SHA512(seed) first 32', hash: crypto.createHash('sha512').update(seed).digest().slice(0, 32) },
      { name: 'SHA512(seed) last 32', hash: crypto.createHash('sha512').update(seed).digest().slice(32, 64) },
      { name: 'SHA3-256(seed)', hash: crypto.createHash('sha3-256').update(seed).digest() },
      { name: 'Blake2b(seed)', hash: crypto.createHash('blake2b512').update(seed).digest().slice(0, 32) },
      { name: 'Keccak256(seed)', hash: crypto.createHash('sha3-256').update(seed).digest() },
      { name: 'RIPEMD160(seed)', hash: crypto.createHash('ripemd160').update(seed).digest() },
    ];

    for (const method of hashMethods) {
      try {
        const kp = StellarBase.Keypair.fromRawEd25519Seed(method.hash);
        attempts.push({ name: method.name, addr: kp.publicKey() });
      } catch(e) {}
    }

    // 7. PBKDF2 variations
    const pbkdf2Configs = [
      { name: 'PBKDF2(mnemonic, "mnemonic", 2048)', salt: 'mnemonic', iter: 2048 },
      { name: 'PBKDF2(mnemonic, "", 2048)', salt: '', iter: 2048 },
      { name: 'PBKDF2(mnemonic, "pi", 2048)', salt: 'pi', iter: 2048 },
      { name: 'PBKDF2(mnemonic, "Pi", 2048)', salt: 'Pi', iter: 2048 },
      { name: 'PBKDF2(mnemonic, "PI", 2048)', salt: 'PI', iter: 2048 },
    ];

    for (const config of pbkdf2Configs) {
      try {
        const derived = crypto.pbkdf2Sync(trimmed, config.salt, config.iter, 32, 'sha512');
        const kp = StellarBase.Keypair.fromRawEd25519Seed(derived);
        attempts.push({ name: config.name, addr: kp.publicKey() });
      } catch(e) {}
    }

    // 8. Scrypt
    try {
      const scryptResult = crypto.scryptSync(trimmed, 'mnemonic', 32);
      attempts.push({ 
        name: 'Scrypt(mnemonic)', 
        addr: StellarBase.Keypair.fromRawEd25519Seed(scryptResult).publicKey() 
      });
    } catch(e) {}

    // Print all attempts
    console.log('\n📊 ALL ATTEMPTS:');
    for (const attempt of attempts) {
      const match = attempt.addr === expectedAddress ? '✅ YES' : '❌ NO';
      console.log(`📍 ${attempt.name}: ${attempt.addr} ${match}`);
      if (attempt.addr === expectedAddress) {
        console.log(`\n✅ FOUND! Method: ${attempt.name}`);
        return expectedAddress;
      }
    }

    console.log('\n❌ NO MATCH IN ALL ATTEMPTS');
    return attempts[1]?.addr || '';

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw new Error('Invalid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };