// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');

/**
 * Convert a BIP39 mnemonic (passphrase) to a Pi wallet address.
 * 
 * IMPORTANT: Pi Network does NOT strictly follow BIP39 standard.
 * Some Pi passphrases may use non-standard words or word combinations.
 * Therefore, we only do basic validation (24 words, minimum length).
 * We do NOT use bip39.validateMnemonic() as it rejects valid Pi passphrases.
 */
function deriveAddressFromPassphrase(passphrase) {
  try {
    // Normalize passphrase
    const trimmed = passphrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = trimmed.split(' ');

    console.log(`🔑 Deriving address from passphrase (${words.length} words)`);

    // Basic validation only - 24 words required
    if (words.length !== 24) {
      console.error(`❌ Expected 24 words, got ${words.length}`);
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // Word length validation
    if (words.some((w) => w.length < 2)) {
      console.error('❌ Some words are too short');
      throw new Error('Invalid passphrase: please enter a valid passphrase');
    }

    // NOTE: We intentionally DO NOT use bip39.validateMnemonic() here
    // Pi Network passphrases may not be BIP39 compliant
    // Even if checksum is invalid, address can still be derived

    // Derive seed directly
    const seed = bip39.mnemonicToSeedSync(trimmed);
    console.log(`🔑 Seed generated (${seed.length} bytes)`);
    
    const keypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    const publicKey = keypair.publicKey();
    
    console.log(`✅ Derived address: ${publicKey}`);
    
    return publicKey;
  } catch (err) {
    console.error(`❌ Derivation error: ${err.message}`);
    throw new Error('Invalid passphrase: please enter a valid passphrase');
  }
}

/**
 * Validate passphrase format without deriving address
 * Same logic as derivation - basic checks only
 */
function validatePassphraseFormat(passphrase) {
  try {
    const trimmed = passphrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = trimmed.split(' ');
    
    if (words.length !== 24) return false;
    if (words.some((w) => w.length < 2)) return false;
    
    return true;
  } catch {
    return false;
  }
}

module.exports = { deriveAddressFromPassphrase, validatePassphraseFormat };