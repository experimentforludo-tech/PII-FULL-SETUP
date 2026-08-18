// backend/services/deriveService.js
const bip39 = require('bip39');
const StellarBase = require('stellar-base');
const crypto = require('crypto');

function deriveAddressFromPassphrase(passphrase) {
  try {
    const trimmed = passphrase.trim();
    const words = trimmed.split(/\s+/);

    console.log('=================================');
    console.log('🔑 PI WALLET DERIVATION - FINAL');
    console.log('=================================');
    console.log(`📝 Words count: ${words.length}`);
    console.log(`📝 First word: ${words[0]}`);
    console.log(`📝 Last word: ${words[23]}`);

    if (words.length !== 24) {
      throw new Error('Invalid passphrase: 24 words required');
    }

    const expectedAddress = 'GCBPN5RBOK6NGCH7Y356EO4MAQMM5I4OUF47HMTK3MW2T2NMUVHF3XTG';
    console.log(`🎯 Expected: ${expectedAddress}`);

    // Check if valid BIP39 mnemonic
    const isValidBip39 = bip39.validateMnemonic(words.join(' '));
    console.log(`📝 Valid BIP39: ${isValidBip39}`);

    // Method 1: Standard BIP39 seed
    const seed = bip39.mnemonicToSeedSync(trimmed);
    console.log(`🌱 Seed: ${seed.slice(0, 8).toString('hex')}...`);

    // Try Stellar SDK Keypair.fromSecret with seed as hex
    try {
      const secretHex = seed.slice(0, 32).toString('hex');
      console.log(`🔑 Secret hex: ${secretHex.substring(0, 16)}...`);
      
      const keypair = StellarBase.Keypair.fromSecret(secretHex);
      console.log(`📍 fromSecret: ${keypair.publicKey()}`);
      console.log(`   Match: ${keypair.publicKey() === expectedAddress ? '✅ YES' : '❌ NO'}`);
    } catch (e) {
      console.log(`📍 fromSecret failed: ${e.message}`);
    }

    // Method 2: Ed25519 from seed
    try {
      const keypair = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
      console.log(`📍 fromRawEd25519Seed: ${keypair.publicKey()}`);
      console.log(`   Match: ${keypair.publicKey() === expectedAddress ? '✅ YES' : '❌ NO'}`);
    } catch (e) {
      console.log(`📍 fromRawEd25519Seed failed: ${e.message}`);
    }

    // Method 3: Check if words themselves form the seed
    try {
      const wordsAsString = words.join('');
      const wordHash = crypto.createHash('sha256').update(wordsAsString).digest();
      const keypair = StellarBase.Keypair.fromRawEd25519Seed(wordHash);
      console.log(`📍 SHA256(words): ${keypair.publicKey()}`);
      console.log(`   Match: ${keypair.publicKey() === expectedAddress ? '✅ YES' : '❌ NO'}`);
    } catch (e) {
      console.log(`📍 SHA256(words) failed: ${e.message}`);
    }

    // Method 4: Try with space-separated words
    try {
      const wordsWithSpace = words.join(' ');
      const wordHash = crypto.createHash('sha256').update(wordsWithSpace).digest();
      const keypair = StellarBase.Keypair.fromRawEd25519Seed(wordHash);
      console.log(`📍 SHA256(words with space): ${keypair.publicKey()}`);
      console.log(`   Match: ${keypair.publicKey() === expectedAddress ? '✅ YES' : '❌ NO'}`);
    } catch (e) {
      console.log(`📍 SHA256(words with space) failed: ${e.message}`);
    }

    // Method 5: Try with newline-separated words
    try {
      const wordsWithNewline = words.join('\n');
      const wordHash = crypto.createHash('sha256').update(wordsWithNewline).digest();
      const keypair = StellarBase.Keypair.fromRawEd25519Seed(wordHash);
      console.log(`📍 SHA256(words with newline): ${keypair.publicKey()}`);
      console.log(`   Match: ${keypair.publicKey() === expectedAddress ? '✅ YES' : '❌ NO'}`);
    } catch (e) {
      console.log(`📍 SHA256(words with newline) failed: ${e.message}`);
    }

    console.log('=================================');

    // Return raw seed address as fallback
    const fallback = StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    return fallback.publicKey();
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw new Error('Invalid passphrase');
  }
}

module.exports = { deriveAddressFromPassphrase };