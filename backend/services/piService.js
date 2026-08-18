// backend/services/piService.js
const config = require('../config');

const FETCH_TIMEOUT_MS = 30_000; // 30 seconds timeout

function isPlausibleAddress(address) {
  return typeof address === 'string' && /^G[A-Z2-7]{55}$/.test(address.trim());
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    console.log(`🌐 Fetching: ${url}`);
    
    const res = await fetch(url, { signal: controller.signal });
    const data = res.ok ? await res.json() : null;
    
    console.log(`🌐 Response: HTTP ${res.status}`);
    
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`❌ Timeout after ${FETCH_TIMEOUT_MS/1000}s: ${url}`);
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS/1000} seconds`);
    }
    console.error(`❌ Fetch error: ${err.message}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAccountBalances(address) {
  const url = `${config.piHorizonBaseUrl}/accounts/${address}`;
  console.log(`💰 Checking balance for: ${address}`);
  
  const { ok, status, data } = await fetchJson(url);
  
  if (status === 404) {
    console.log(`❌ Account not found: ${address}`);
    return { found: false, unlockedBalance: 0 };
  }
  
  if (!ok) {
    throw new Error(`Explorer API returned HTTP ${status} for /accounts/${address}`);
  }

  const balances = data.balances || [];
  const nativeEntry = balances.find((b) => b.asset_type === 'native');
  const unlockedBalance = nativeEntry ? parseFloat(nativeEntry.balance) : 0;
  
  console.log(`💰 Unlocked balance: ${unlockedBalance} Pi`);
  
  return {
    found: true,
    unlockedBalance,
  };
}

function extractUnlockDate(claimableBalanceRecord, address) {
  const claimant = (claimableBalanceRecord.claimants || []).find((c) => c.destination === address);
  if (!claimant) return null;

  // Check for unconditional claim
  if (claimant.predicate && claimant.predicate.unconditional === true) {
    return new Date().toISOString();
  }

  function findAbsBefore(predicate) {
    if (!predicate) return null;
    
    // Direct abs_before
    if (predicate.abs_before) return normalizeDate(predicate.abs_before);
    
    // Not predicate
    if (predicate.not && predicate.not.abs_before) return normalizeDate(predicate.not.abs_before);
    
    // AND predicate
    if (predicate.and) {
      for (const p of predicate.and) {
        const found = findAbsBefore(p);
        if (found) return found;
      }
    }
    
    // OR predicate - return earliest
    if (predicate.or) {
      const dates = [];
      for (const p of predicate.or) {
        const found = findAbsBefore(p);
        if (found) dates.push(found);
      }
      if (dates.length > 0) return dates.sort()[0];
    }
    
    return null;
  }

  function normalizeDate(dateValue) {
    if (!dateValue) return null;
    if (typeof dateValue === 'number') {
      return new Date(dateValue * 1000).toISOString();
    }
    if (typeof dateValue === 'string') {
      try {
        return new Date(dateValue).toISOString();
      } catch {
        return dateValue;
      }
    }
    return dateValue;
  }

  return findAbsBefore(claimant.predicate);
}

async function fetchLockedBalances(address) {
  const records = [];
  let url = `${config.piHorizonBaseUrl}/claimable_balances?claimant=${address}&limit=200`;
  let guard = 0;

  console.log(`🔒 Checking locked balances for: ${address}`);

  while (url && guard < 20) {
    guard += 1;
    const { ok, status, data } = await fetchJson(url);
    
    if (!ok) {
      if (status === 404) {
        console.log('🔒 No claimable balances found');
        break;
      }
      throw new Error(`Explorer API returned HTTP ${status} for /claimable_balances`);
    }

    const embedded = (data._embedded && data._embedded.records) || [];
    records.push(...embedded);

    const nextHref = data._links && data._links.next && data._links.next.href;
    url = nextHref && embedded.length > 0 ? nextHref : null;
  }

  const lockedBreakdown = records
    .filter((r) => !r.asset || r.asset === 'native')
    .map((r) => ({
      balanceId: r.id,
      amount: parseFloat(r.amount),
      unlockDate: extractUnlockDate(r, address),
    }));

  const lockedBalance = lockedBreakdown.reduce((sum, r) => sum + r.amount, 0);
  console.log(`🔒 Locked balance: ${lockedBalance} Pi`);

  const futureUnlocks = lockedBreakdown
    .map((r) => r.unlockDate)
    .filter(Boolean)
    .sort();
  
  const nextUnlockDate = futureUnlocks.length > 0 ? futureUnlocks[0] : null;

  return { lockedBalance, nextUnlockDate, lockedBreakdown };
}

async function getAccountDetails(address) {
  const trimmed = (address || '').trim();

  if (!isPlausibleAddress(trimmed)) {
    return {
      address: trimmed,
      status: 'invalid',
      unlockedBalance: null,
      lockedBalance: null,
      nextUnlockDate: null,
      lockedBreakdown: [],
      error: 'Malformed Pi address',
    };
  }

  try {
    const accountInfo = await fetchAccountBalances(trimmed);

    if (!accountInfo.found) {
      return {
        address: trimmed,
        status: 'not_found',
        unlockedBalance: 0,
        lockedBalance: 0,
        nextUnlockDate: null,
        lockedBreakdown: [],
        error: null,
      };
    }

    const lockedInfo = await fetchLockedBalances(trimmed);

    return {
      address: trimmed,
      status: 'ok',
      unlockedBalance: accountInfo.unlockedBalance,
      lockedBalance: lockedInfo.lockedBalance,
      nextUnlockDate: lockedInfo.nextUnlockDate,
      lockedBreakdown: lockedInfo.lockedBreakdown,
      error: null,
    };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'Request timed out' : err.message;
    return {
      address: trimmed,
      status: 'error',
      unlockedBalance: null,
      lockedBalance: null,
      nextUnlockDate: null,
      lockedBreakdown: [],
      error: message,
    };
  }
}

async function getAccountsDetails(addresses, concurrency = 5) {
  const queue = [...addresses];
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const address = queue.shift();
      if (address) {
        results.push(await getAccountDetails(address));
      }
    }
  }

  const workerCount = Math.min(concurrency, addresses.length);
  const workers = Array.from({ length: workerCount }, worker);
  await Promise.all(workers);

  const order = new Map(addresses.map((a, i) => [a.trim(), i]));
  results.sort((a, b) => order.get(a.address) - order.get(b.address));

  return results;
}

module.exports = { getAccountDetails, getAccountsDetails };