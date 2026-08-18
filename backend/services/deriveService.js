// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');

/**
 * Convert a BIP39 mnemonic (passphrase) to a Pi wallet address.
 * Pi is a Stellar fork, so Stellar key derivation works.
 */
function deriveAddressFromPassphrase(passphrase) {
  try {
    // Normalize passphrase
    const trimmed = passphrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = trimmed.split(' ');

    console.log(`🔑 Deriving address from passphrase (${words.length} words)`);

    // Basic validation
    if (words.length !== 24) {
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // Word validation
    if (words.some((w) => w.length < 2)) {
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // BIP39 validation (checksum validation)
    const isValidMnemonic = bip39.validateMnemonic(trimmed);
    if (!isValidMnemonic) {
      console.error('❌ Invalid BIP39 mnemonic (checksum failed)');
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // Derive seed and keypair
    const seed = bip39.mnemonicToSeedSync(trimmed);
    const keypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    const publicKey = keypair.publicKey();
    
    console.log(`✅ Derived address: ${publicKey}`);
    
    return publicKey;
  } catch (err) {
    // Always return same generic error
    console.error(`❌ Derivation error: ${err.message}`);
    throw new Error('Invalid passphrase: please enter a valid passphrase');
  }
}

/**
 * Validate passphrase format without deriving address
 */
function validatePassphraseFormat(passphrase) {
  try {
    const trimmed = passphrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = trimmed.split(' ');
    
    if (words.length !== 24) return false;
    if (words.some((w) => w.length < 2)) return false;
    if (!bip39.validateMnemonic(trimmed)) return false;
    
    return true;
  } catch {
    return false;
  }
}

module.exports = { deriveAddressFromPassphrase, validatePassphraseFormat };