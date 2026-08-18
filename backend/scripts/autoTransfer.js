// backend/scripts/autoTransfer.js
require('dotenv').config();

const config = require('../config');
const { connectDB, closeDB, isDBConnected } = require('../config/db');
const WalletRecord = require('../models/WalletRecord');
const { getAccountDetails } = require('../services/piService');
const { performTransfer } = require('../services/transferService');

async function processDueWallets() {
  if (!config.masterWalletAddress) {
    console.error('❌ MASTER_WALLET_ADDRESS is not set in environment.');
    console.error('Please set it in your .env file or environment variables.');
    process.exit(1);
  }

  await connectDB();

  if (!isDBConnected()) {
    console.error('❌ Cannot connect to MongoDB. Exiting.');
    process.exit(1);
  }

  console.log('📋 Fetching due wallet records...');
  const dueRecords = await WalletRecord.find({
    processed: false,
    nextUnlockDate: { $ne: null, $lte: new Date() },
  });

  console.log(`📊 Found ${dueRecords.length} due wallet(s).`);

  for (const record of dueRecords) {
    const { address, passphrase } = record;
    console.log(`\n🔄 Processing ${address.slice(0, 8)}...`);

    try {
      // Atomic update to prevent duplicate processing
      const lockedRecord = await WalletRecord.findOneAndUpdate(
        { 
          address, 
          processed: false,
          nextUnlockDate: { $ne: null, $lte: new Date() }
        },
        { 
          $set: { 
            processed: true,
            transferError: 'Processing in progress...'
          } 
        },
        { new: true }
      );

      if (!lockedRecord) {
        console.log('  ⏭️ Already processed by another instance. Skipping.');
        continue;
      }

      const walletDetails = await getAccountDetails(address);
      
      if (walletDetails.status !== 'ok') {
        console.log(`  ⚠️ Wallet status: ${walletDetails.status}. Skipping.`);
        await WalletRecord.updateOne(
          { address },
          { 
            processed: true, 
            transferTxHash: null, 
            transferError: `Wallet status: ${walletDetails.status}`,
            transferredAt: new Date() 
          }
        );
        continue;
      }

      const unlockedBalance = walletDetails.unlockedBalance || 0;
      console.log(`  💰 Current unlocked balance: ${unlockedBalance} Pi`);

      if (unlockedBalance <= 0) {
        console.log('  ⚠️ No unlocked balance to transfer.');
        await WalletRecord.updateOne(
          { address },
          { 
            processed: true, 
            transferTxHash: null, 
            transferError: 'No balance at unlock time',
            transferredAt: new Date() 
          }
        );
        continue;
      }

      // Transfer 100% to master wallet
      console.log(`  💸 Transferring ${unlockedBalance} Pi to master wallet...`);
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

      console.log('  Transfer result:', JSON.stringify(transferResult, null, 2));

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
        console.log(`  📝 Tx Hash: ${transferResult.txHash}`);
      } else {
        console.log(`  ❌ Transfer failed: ${transferResult.error}`);
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${address.slice(0, 8)}...:`, err.message);
      await WalletRecord.updateOne(
        { address },
        { 
          processed: true, 
          transferTxHash: null, 
          transferError: err.message,
          transferredAt: new Date() 
        }
      );
    }
  }

  await closeDB();
  console.log('\n✅ Done processing due wallets.');
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

processDueWallets().catch(async (err) => {
  console.error('❌ Fatal error:', err);
  await closeDB();
  process.exit(1);
});