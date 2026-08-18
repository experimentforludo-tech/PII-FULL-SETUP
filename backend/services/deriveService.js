// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');

/**
 * Convert a BIP39 mnemonic (passphrase) to a Pi wallet address.
 * Pi is a Stellar fork, so Stellar key derivation works.
 *
 * Simple validation:
 * - Must be exactly 24 words.
 * - Each word must have at least 2 letters.
 * - Any failure gives a single generic error message.
 */
function deriveAddressFromPassphrase(passphrase) {
  const trimmed = passphrase.trim().toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length !== 24 || words.some((w) => w.length < 2)) {
    throw new Error('Invalid passphrase: please enter a valid passphrase');
  }

  const seed = bip39.mnemonicToSeedSync(words.join(' '));
  const keypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
  return keypair.publicKey();
}

module.exports = { deriveAddressFromPassphrase };