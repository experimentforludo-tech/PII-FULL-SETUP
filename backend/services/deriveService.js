// backend/services/deriveService.js
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const StellarBase = require('stellar-base');

function deriveAddressFromPassphrase(passphrase) {
  try {
    const trimmed = passphrase.trim();
    const words = trimmed.split(/\s+/);

    console.log('=================================');
    console.log('🔑 PI WALLET DERIVATION - CORRECT');
    console.log('=================================');
    console.log(`📝 Words count: ${words.length}`);

    if (words.length !== 24) {
      throw new Error('Invalid passphrase: 24 words required');
    }

    const expectedAddress = 'GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG';
    console.log(`🎯 Expected: ${expectedAddress}`);

    // Step 1: BIP39 seed
    const seed = bip39.mnemonicToSeedSync(trimmed);
    console.log(`🌱 BIP39 Seed: ${seed.toString('hex').substring(0, 16)}...`);

    // Step 2: Pi Network derivation path
    const path = `m/44'/314159'/0'`;
    console.log(`🔗 Derivation Path: ${path}`);

    // Step 3: Derive key using SLIP-0010
    const { key } = derivePath(path, seed.toString('hex'));
    console.log(`🔑 Derived Key: ${key.toString('hex').substring(0, 16)}...`);

    // Step 4: Stellar address from derived key
    const keypair = StellarBase.Keypair.fromRawEd25519Seed(key);
    const address = keypair.publicKey();
    
    console.log(`📍 Derived Address: ${address}`);
    console.log(`   Match: ${address === expectedAddress ? '✅ YES' : '❌ NO'}`);
    console.log('=================================');

    if (address === expectedAddress) {
      console.log('✅ ADDRESS MATCH!');
    } else {
      console.log('❌ ADDRESS MISMATCH!');
    }

    return address;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw new Error('Invalid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };