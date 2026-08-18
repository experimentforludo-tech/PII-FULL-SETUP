// backend/services/transferService.js
const StellarBase = require('stellar-base');
const bip39 = require('bip39');
const config = require('../config');

// Pi Network actual base fee is 0.01 Pi (100000 stroops)
const BASE_FEE_STROOPS = 100000;

function deriveKeypair(passphrase) {
  const trimmed = passphrase.trim().toLowerCase().replace(/\s+/g, ' ');
  const seed = bip39.mnemonicToSeedSync(trimmed);
  return StellarBase.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
}

async function fetchAccount(address) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  
  try {
    const res = await fetch(`${config.piHorizonBaseUrl}/accounts/${address}`, {
      signal: controller.signal
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Failed to fetch account ${address}: HTTP ${res.status} - ${errorData.detail || res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function submitTransaction(xdr) {
  const params = new URLSearchParams({ tx: xdr });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  try {
    const res = await fetch(`${config.piHorizonBaseUrl}/transactions`, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const errorDetail = data.extras?.result_codes?.transaction || data.detail || res.statusText;
      throw new Error(`Transaction submission failed: ${errorDetail}`);
    }
    
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function roundDownToStroops(value) {
  return Math.floor(value * 1e7) / 1e7;
}

/**
 * Transfer Pi balance (unlocked) from source address to business/domestic wallets
 * according to split percentages.
 */
async function performTransfer(sourceAddress, passphrase, unlockedBalance, options = {}) {
  if (!sourceAddress || !passphrase) {
    return { attempted: false, success: false, error: 'Source address and passphrase required' };
  }

  if (unlockedBalance <= 0) {
    return { attempted: false, success: false, error: 'No unlocked balance to transfer' };
  }

  const businessWallet = options.businessWallet ?? config.businessWalletAddress;
  const domesticWallet = options.domesticWallet ?? config.domesticWalletAddress;
  const businessPercent = options.businessPercent ?? config.businessPercent;
  const domesticPercent = options.domesticPercent ?? config.domesticPercent;

  if (!businessWallet || !domesticWallet) {
    return { 
      attempted: false, 
      success: false, 
      error: 'Business/domestic wallet addresses not configured. Set BUSINESS_WALLET_ADDRESS and DOMESTIC_WALLET_ADDRESS in .env' 
    };
  }
  
  if (businessPercent + domesticPercent !== 100) {
    return { attempted: false, success: false, error: 'Split percentages must sum to 100' };
  }

  const fee = BASE_FEE_STROOPS / 1e7; // 0.01 Pi
  const totalToSend = unlockedBalance - fee;
  
  if (totalToSend <= 0) {
    return { 
      attempted: false, 
      success: false, 
      error: `Pi balance too low to cover fee. Need at least ${fee} Pi for transaction fee` 
    };
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

    // Verify derived address matches source
    if (keypair.publicKey() !== sourceAddress) {
      return { 
        attempted: true, 
        success: false, 
        error: 'Passphrase does not match source address',
        txHash: null,
        piBusinessAmount: null,
        piDomesticAmount: null
      };
    }

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

    console.log(`✅ Transfer successful: ${businessAmount} Pi → business, ${domesticAmount} Pi → domestic`);
    console.log(`   Tx Hash: ${submitResult.hash || submitResult.id}`);

    return {
      attempted: true,
      success: true,
      txHash: submitResult.hash || submitResult.id,
      piBusinessAmount: businessAmount.toFixed(7),
      piDomesticAmount: domesticAmount.toFixed(7),
      error: null,
    };
  } catch (err) {
    console.error('❌ Transfer failed:', err.message);
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