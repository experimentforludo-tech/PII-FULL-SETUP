// backend/services/deriveService.js
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
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

    // Step 1: BIP39 seed
    const seed = bip39.mnemonicToSeedSync(trimmed);
    
    // Step 2: Pi derivation path (314 = Pi coin type)
    const path = `m/44'/314'/0'`;
    const { key } = derivePath(path, seed.toString('hex'));

    // Step 3: Stellar address
    const keypair = StellarBase.Keypair.fromRawEd25519Seed(key);
    const address = keypair.publicKey();
    
    console.log(`📍 Derived:  ${address}`);
    console.log('=================================');

    return address;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw new Error('Invalid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };