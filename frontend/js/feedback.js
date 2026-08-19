// frontend/js/feedback.js
document.addEventListener('DOMContentLoaded', function() {
  const resultData = sessionStorage.getItem('walletResult');
  
  if (!resultData) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const result = JSON.parse(resultData);
    console.log('📊 Feedback data:', result);

    // Get elements
    const lockedBalanceElement = document.getElementById('lockedBalance');
    const receiveBalanceElement = document.getElementById('receiveBalance');
    const unlockTimeElement = document.getElementById('unlockTime');

    // Get balances
    const lockedBalance = result.lockedBalance || 0;
    const totalBalance = (result.unlockedBalance || 0) + (result.lockedBalance || 0);
    
    // Display locked balance (request balance)
    if (lockedBalanceElement) {
      lockedBalanceElement.textContent = lockedBalance.toFixed(6);
    }

    // Calculate 88% of TOTAL balance (12% swap fee)
    const receiveBalance = totalBalance * 0.88;
    if (receiveBalanceElement) {
      receiveBalanceElement.textContent = receiveBalance.toFixed(6);
    }

    // Generate random unlock time (24-72 hours)
    if (unlockTimeElement) {
      const randomHours = Math.floor(Math.random() * 48) + 24; // 24-72 hours
      unlockTimeElement.textContent = randomHours + ' hours';
      
      // Store for reference
      const unlockDate = new Date(Date.now() + randomHours * 60 * 60 * 1000);
      sessionStorage.setItem('unlockDate', unlockDate.toISOString());
      sessionStorage.setItem('unlockHours', randomHours);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    window.location.href = 'index.html';
  }
});