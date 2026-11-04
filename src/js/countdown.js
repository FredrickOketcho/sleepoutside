const countdownDisplay = document.getElementById('countdown');
const timerForm = document.getElementById('timerForm');
const startTimeInput = document.getElementById('startTime');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const timerStatus = document.getElementById('timerStatus');

let remainingSeconds = Number(startTimeInput.value);
let intervalId;
let timeoutId;
let isPaused = false;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function renderTime() {
  countdownDisplay.textContent = formatTime(remainingSeconds);
}

function stopTimers() {
  window.clearInterval(intervalId);
  window.clearTimeout(timeoutId);
  intervalId = undefined;
  timeoutId = undefined;
}

function finishCountdown() {
  stopTimers();
  remainingSeconds = 0;
  isPaused = false;
  renderTime();
  timerStatus.textContent = 'Time\'s up!';
  startButton.disabled = false;
  pauseButton.disabled = true;
  pauseButton.textContent = 'Pause';
}

function runCountdown() {
  isPaused = false;
  timerStatus.textContent = 'Countdown in progress.';
  startButton.disabled = true;
  pauseButton.disabled = false;
  pauseButton.textContent = 'Pause';

  intervalId = window.setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds -= 1;
      renderTime();
    }
  }, 1000);

  timeoutId = window.setTimeout(finishCountdown, remainingSeconds * 1000);
}

timerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  stopTimers();

  if (!timerForm.reportValidity()) {
    return;
  }

  remainingSeconds = Number(startTimeInput.value);
  renderTime();
  runCountdown();
});

pauseButton.addEventListener('click', () => {
  if (pauseButton.disabled) {
    return;
  }

  stopTimers();
  isPaused = !isPaused;

  if (isPaused) {
    timerStatus.textContent = 'Countdown paused.';
    pauseButton.textContent = 'Resume';
    return;
  }

  runCountdown();
});

resetButton.addEventListener('click', () => {
  stopTimers();
  isPaused = false;
  remainingSeconds = Number(startTimeInput.value);
  renderTime();
  timerStatus.textContent = 'Ready when you are.';
  startButton.disabled = false;
  pauseButton.disabled = true;
  pauseButton.textContent = 'Pause';
});
