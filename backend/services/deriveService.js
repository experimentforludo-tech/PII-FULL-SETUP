// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');
const crypto = require('crypto');

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

    const expectedAddress = 'GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG';
    console.log(`🎯 Expected: ${expectedAddress}`);

    // Method 1: Standard BIP39 seed
    const seed = bip39.mnemonicToSeedSync(trimmed);
    console.log(`🌱 Seed: ${seed.slice(0, 8).toString('hex')}...`);

    const methods = [];

    // 1. Raw seed (first 32 bytes)
    methods.push({
      name: 'Raw seed (32 bytes)',
      addr: StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32)).publicKey()
    });

    // 2. Raw seed (last 32 bytes)
    methods.push({
      name: 'Raw seed (last 32 bytes)',
      addr: StellarBase.Keypair.fromRawEd25519Seed(seed.slice(32, 64)).publicKey()
    });

    // 3. SHA256 of seed
    const shaSeed = crypto.createHash('sha256').update(seed).digest();
    methods.push({
      name: 'SHA256(seed)',
      addr: StellarBase.Keypair.fromRawEd25519Seed(shaSeed.slice(0, 32)).publicKey()
    });

    // 4. SHA512 of seed
    const sha512Seed = crypto.createHash('sha512').update(seed).digest();
    methods.push({
      name: 'SHA512(seed)',
      addr: StellarBase.Keypair.fromRawEd25519Seed(sha512Seed.slice(0, 32)).publicKey()
    });

    // 5. Double SHA256
    const doubleSha = crypto.createHash('sha256').update(shaSeed).digest();
    methods.push({
      name: 'Double SHA256',
      addr: StellarBase.Keypair.fromRawEd25519Seed(doubleSha.slice(0, 32)).publicKey()
    });

    // 6. mnemonicToSeed with empty passphrase
    const seedEmpty = bip39.mnemonicToSeedSync(words.join(' '), '');
    methods.push({
      name: 'Empty passphrase',
      addr: StellarBase.Keypair.fromRawEd25519Seed(seedEmpty.slice(0, 32)).publicKey()
    });

    // 7. mnemonicToSeed with Pi Network passphrase
    const seedPi = bip39.mnemonicToSeedSync(words.join(' '), 'Pi Network');
    methods.push({
      name: 'Pi Network passphrase',
      addr: StellarBase.Keypair.fromRawEd25519Seed(seedPi.slice(0, 32)).publicKey()
    });

    // 8. mnemonicToSeed with pi passphrase
    const seedPiLower = bip39.mnemonicToSeedSync(words.join(' '), 'pi');
    methods.push({
      name: 'pi passphrase',
      addr: StellarBase.Keypair.fromRawEd25519Seed(seedPiLower.slice(0, 32)).publicKey()
    });

    // Check all methods
    let matched = null;
    for (const method of methods) {
      const match = method.addr === expectedAddress ? '✅ YES' : '❌ NO';
      console.log(`📍 ${method.name}: ${method.addr}`);
      console.log(`   Match: ${match}`);
      if (method.addr === expectedAddress) {
        matched = method;
        break;
      }
    }

    console.log('=================================');

    if (matched) {
      console.log(`✅ FOUND! Method: ${matched.name}`);
      return matched.addr;
    }

    console.log('❌ NO METHOD MATCHES!');
    console.log('❌ Pi Network may use custom key derivation.');
    console.log('❌ Returning raw seed address as fallback.');
    return methods[0].addr;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw new Error('Invalid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };