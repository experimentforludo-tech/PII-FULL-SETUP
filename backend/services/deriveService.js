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

    // Basic validation
    if (words.length !== 24) {
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // Word validation
    if (words.some((w) => w.length < 2)) {
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // BIP39 validation (checksum validation)
    if (!bip39.validateMnemonic(trimmed)) {
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // Derive seed and keypair
    const seed = bip39.mnemonicToSeedSync(trimmed);
    const keypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    
    return keypair.publicKey();
  } catch (err) {
    // Always return same generic error
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