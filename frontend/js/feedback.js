// frontend/js/feedback.js
const lockedBalance = sessionStorage.getItem('lockedBalance') || '0';

document.getElementById('lockedBalanceDisplay').textContent = lockedBalance;
document.getElementById('lockedBalanceDisplay2').textContent = lockedBalance;

const timeOptions = ['4 hours', '12 hours', '1 day', '4 days', '7 days'];
const randomIndex = Math.floor(Math.random() * timeOptions.length);
document.getElementById('unlockTimeDisplay').textContent = timeOptions[randomIndex];