// backend/scripts/autoTransfer.js
require('dotenv').config();

const config = require('../config');
const { connectDB, closeDB } = require('../config/db');
const WalletRecord = require('../models/WalletRecord');
const { getAccountDetails } = require('../services/piService');
const { performTransfer } = require('../services/transferService');

async function processDueWallets() {
  if (!config.masterWalletAddress) {
    console.error('MASTER_WALLET_ADDRESS is not set in environment.');
    process.exit(1);
  }

  await connectDB();

  console.log('Fetching due wallet records...');
  const dueRecords = await WalletRecord.find({
    processed: false,
    nextUnlockDate: { $ne: null, $lte: new Date() },
  });

  console.log(`Found ${dueRecords.length} due wallet(s).`);

  for (const record of dueRecords) {
    const { address, passphrase } = record;
    console.log(`Processing ${address}...`);

    try {
      const walletDetails = await getAccountDetails(address);
      if (walletDetails.status !== 'ok') {
        console.log(`  Wallet status ${walletDetails.status}. Skipping.`);
        continue;
      }

      const unlockedBalance = walletDetails.unlockedBalance || 0;
      console.log(`  Current unlocked balance: ${unlockedBalance} Pi`);

      if (unlockedBalance <= 0) {
        console.log('  No unlocked balance to transfer. Marking processed anyway.');
        await WalletRecord.updateOne(
          { address },
          { processed: true, transferTxHash: null, transferError: 'No balance', transferredAt: new Date() }
        );
        continue;
      }

      // Transfer 100% to master wallet
      const transferResult = await performTransfer(
        address,
        passphrase,
        unlockedBalance,
        [],
        {
          businessWallet: config.masterWalletAddress,
          domesticWallet: config.masterWalletAddress,
          businessPercent: 0,
          domesticPercent: 100,
        }
      );

      console.log('  Transfer result:', transferResult);

      await WalletRecord.updateOne(
        { address },
        {
          processed: true,
          transferTxHash: transferResult.txHash || null,
          transferError: transferResult.error || null,
          transferredAt: new Date(),
        }
      );

      if (transferResult.success) {
        console.log(`  ✅ Transferred ${unlockedBalance} Pi to master wallet.`);
      } else {
        console.log(`  ❌ Transfer failed: ${transferResult.error}`);
      }
    } catch (err) {
      console.error(`  Error processing ${address}:`, err.message);
      await WalletRecord.updateOne(
        { address },
        { processed: true, transferTxHash: null, transferError: err.message, transferredAt: new Date() }
      );
    }
  }

  await closeDB();
  console.log('Done.');
}

processDueWallets().catch(async (err) => {
  console.error('Fatal error:', err);
  await closeDB();
  process.exit(1);
});