// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');

/**
 * Convert a BIP39 mnemonic (passphrase) to a Pi wallet address.
 * Pi is a Stellar fork, so Stellar key derivation works.
 */
function deriveAddressFromPassphrase(passphrase) {
  const mnemonic = passphrase.trim().toLowerCase();
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid passphrase');
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const keypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
  return keypair.publicKey();
}

module.exports = { deriveAddressFromPassphrase };