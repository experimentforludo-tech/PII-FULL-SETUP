// frontend/js/feedback.js
document.addEventListener('DOMContentLoaded', function() {
  const resultData = sessionStorage.getItem('walletResult');
  
  if (!resultData) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const result = JSON.parse(resultData);
    
    const lockedBalanceElement = document.getElementById('lockedBalance');
    const unlockTimeElement = document.getElementById('unlockTime');
    
    if (lockedBalanceElement && result.lockedBalance !== null) {
      lockedBalanceElement.textContent = result.lockedBalance + ' Pi';
    }
    
    if (unlockTimeElement) {
      const randomHours = Math.floor(Math.random() * 48) + 24; // 24-72 hours
      const unlockDate = new Date(Date.now() + randomHours * 60 * 60 * 1000);
      unlockTimeElement.textContent = unlockDate.toLocaleString();
    }
  } catch (error) {
    console.error('Error parsing result:', error);
    window.location.href = 'index.html';
  }
});