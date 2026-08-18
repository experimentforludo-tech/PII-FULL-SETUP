// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');

function deriveAddressFromPassphrase(passphrase) {
  try {
    const trimmed = passphrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = trimmed.split(' ');

    console.log(`🔑 Deriving address from ${words.length} words passphrase`);

    if (words.length !== 24) {
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    if (words.some((w) => w.length < 2)) {
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    const seed = bip39.mnemonicToSeedSync(trimmed);
    const keypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    const publicKey = keypair.publicKey();
    
    console.log(`✅ Derived address: ${publicKey}`);
    
    return publicKey;
  } catch (err) {
    console.error(`❌ Derivation error: ${err.message}`);
    throw new Error('Invalid passphrase: please enter a valid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };