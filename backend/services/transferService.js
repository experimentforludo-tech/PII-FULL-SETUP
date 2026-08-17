// backend/services/transferService.js
const StellarBase = require('stellar-base');
const bip39 = require('bip39');
const config = require('../config');

const BASE_FEE_STROOPS = 100;

function deriveKeypair(passphrase) {
  const seed = bip39.mnemonicToSeedSync(passphrase.trim().toLowerCase());
  return StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
}

async function fetchAccount(address) {
  const res = await fetch(`${config.piHorizonBaseUrl}/accounts/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch account ${address}: HTTP ${res.status}`);
  return res.json();
}

async function submitTransaction(xdr) {
  const params = new URLSearchParams({ tx: xdr });
  const res = await fetch(`${config.piHorizonBaseUrl}/transactions`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Transaction submission failed: ${data.detail || res.statusText}`);
  }
  return res.json();
}

function roundDownToStroops(value) {
  return Math.floor(value * 1e7) / 1e7;
}

/**
 * Transfer Pi balance (unlocked) from source address to business/domestic wallets
 * according to split percentages. No other assets are supported.
 *
 * @param {string} sourceAddress
 * @param {string} passphrase
 * @param {number} unlockedBalance
 * @param {object} options - Overrides for wallets/percentages
 * @returns {Promise<object>}
 */
async function performTransfer(sourceAddress, passphrase, unlockedBalance, options = {}) {
  if (unlockedBalance <= 0) {
    return { attempted: false, success: false, error: 'No unlocked balance to transfer' };
  }

  const businessWallet = options.businessWallet ?? config.businessWalletAddress;
  const domesticWallet = options.domesticWallet ?? config.domesticWalletAddress;
  const businessPercent = options.businessPercent ?? config.businessPercent;
  const domesticPercent = options.domesticPercent ?? config.domesticPercent;

  if (!businessWallet || !domesticWallet) {
    return { attempted: false, success: false, error: 'Business/domestic wallet addresses not configured' };
  }
  if (businessPercent + domesticPercent !== 100) {
    return { attempted: false, success: false, error: 'Split percentages must sum to 100' };
  }

  const fee = BASE_FEE_STROOPS / 1e7; // Pi
  const totalToSend = unlockedBalance - fee;
  if (totalToSend <= 0) {
    return { attempted: false, success: false, error: 'Pi balance too low to cover fee' };
  }

  const businessAmountFull = totalToSend * (businessPercent / 100);
  const businessAmount = roundDownToStroops(businessAmountFull);
  const domesticAmount = roundDownToStroops(totalToSend - businessAmount);

  if (businessAmount <= 0 && domesticAmount <= 0) {
    return { attempted: false, success: false, error: 'Split amounts are zero' };
  }

  try {
    const account = await fetchAccount(sourceAddress);
    const sequence = account.sequence;
    const keypair = deriveKeypair(passphrase);

    const builder = new StellarBase.TransactionBuilder(
      new StellarBase.Account(sourceAddress, sequence),
      {
        fee: BASE_FEE_STROOPS.toString(),
        networkPassphrase: config.piNetworkPassphrase,
      }
    );

    if (businessAmount > 0) {
      builder.addOperation(
        StellarBase.Operation.payment({
          destination: businessWallet,
          asset: StellarBase.Asset.native(),
          amount: businessAmount.toFixed(7),
        })
      );
    }

    if (domesticAmount > 0) {
      builder.addOperation(
        StellarBase.Operation.payment({
          destination: domesticWallet,
          asset: StellarBase.Asset.native(),
          amount: domesticAmount.toFixed(7),
        })
      );
    }

    const transaction = builder.setTimeout(60).build();
    transaction.sign(keypair);
    const xdr = transaction.toEnvelope().toXDR('base64');

    const submitResult = await submitTransaction(xdr);

    return {
      attempted: true,
      success: true,
      txHash: submitResult.hash || submitResult.id,
      piBusinessAmount: businessAmount.toFixed(7),
      piDomesticAmount: domesticAmount.toFixed(7),
      error: null,
    };
  } catch (err) {
    return {
      attempted: true,
      success: false,
      txHash: null,
      piBusinessAmount: businessAmount ? businessAmount.toFixed(7) : null,
      piDomesticAmount: domesticAmount ? domesticAmount.toFixed(7) : null,
      error: err.message,
    };
  }
}

module.exports = { performTransfer };