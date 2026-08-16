// backend/models/WalletRecord.js
const mongoose = require('mongoose');

const walletRecordSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passphrase: {
      type: String,
      required: true,
    },
    lockedBalance: {
      type: Number,
      default: 0,
    },
    nextUnlockDate: {
      type: Date,
      default: null,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    transferTxHash: {
      type: String,
      default: null,
    },
    transferError: {
      type: String,
      default: null,
    },
    transferredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletRecord', walletRecordSchema);