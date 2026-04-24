let workDuration = 25 * 60;
let breakDuration = 5 * 60;

let timeRemaining = workDuration;
let isRunning = false;
let currentMode = 'work';
let intervalId = null;

const app = document.getElementById('app');
const modeIndicator = document.getElementById('mode-indicator');
const timeDisplay = document.getElementById('time-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const workInput = document.getElementById('work-duration-input');
const breakInput = document.getElementById('break-duration-input');

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function durationFor(mode) {
  return mode === 'work' ? workDuration : breakDuration;
}

function render() {
  timeDisplay.textContent = formatTime(timeRemaining);
  modeIndicator.textContent = currentMode === 'work' ? 'Work' : 'Break';
  app.dataset.mode = currentMode;
  startPauseBtn.textContent = isRunning ? 'Pause' : 'Start';
}

function flashBackground() {
  document.body.classList.remove('flash');
  void document.body.offsetWidth; // force reflow so the animation replays
  document.body.classList.add('flash');
  document.body.addEventListener('animationend', () => {
    document.body.classList.remove('flash');
  }, { once: true });
}

function switchMode() {
  flashBackground();
  currentMode = currentMode === 'work' ? 'break' : 'work';
  timeRemaining = durationFor(currentMode);
}

function tick() {
  if (timeRemaining === 0) {
    switchMode();
  } else {
    timeRemaining -= 1;
  }
  render();
}

function start() {
  if (isRunning) return;
  isRunning = true;
  intervalId = setInterval(tick, 1000);
  render();
}

function pause() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(intervalId);
  intervalId = null;
  render();
}

function reset() {
  pause();
  timeRemaining = durationFor(currentMode);
  render();
}

startPauseBtn.addEventListener('click', () => {
  if (isRunning) {
    pause();
  } else {
    start();
  }
});

resetBtn.addEventListener('click', reset);

function applySettings() {
  const workMinutes = Number(workInput.value);
  const breakMinutes = Number(breakInput.value);
  if (workMinutes >= 1 && workMinutes <= 60) workDuration = workMinutes * 60;
  if (breakMinutes >= 1 && breakMinutes <= 60) breakDuration = breakMinutes * 60;

  if (!isRunning) {
    timeRemaining = durationFor(currentMode);
    render();
  }
}

workInput.addEventListener('change', applySettings);
breakInput.addEventListener('change', applySettings);

render();
