let workDuration = 25 * 60;
let breakDuration = 5 * 60;
let longBreakDuration = 15 * 60;

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
const longBreakInput = document.getElementById('long-break-duration-input');
const tabWork = document.getElementById('tab-work');
const tabBreak = document.getElementById('tab-break');
const tabLongBreak = document.getElementById('tab-long-break');
const allTabs = [tabWork, tabBreak, tabLongBreak];
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const autoSwitchToggle = document.getElementById('auto-switch-toggle');

let tasks = [];
let autoSwitch = true;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function durationFor(mode) {
  if (mode === 'work') return workDuration;
  if (mode === 'long-break') return longBreakDuration;
  return breakDuration;
}

const modeLabels = { work: 'Work', break: 'Short Break', 'long-break': 'Long Break' };
const tabForMode = { work: tabWork, break: tabBreak, 'long-break': tabLongBreak };

function render() {
  timeDisplay.textContent = formatTime(timeRemaining);
  modeIndicator.textContent = modeLabels[currentMode];
  app.dataset.mode = currentMode;
  startPauseBtn.textContent = isRunning ? 'Pause' : 'Start';

  allTabs.forEach(tab => {
    tab.classList.remove('is-active');
    tab.setAttribute('aria-selected', 'false');
  });
  const activeTab = tabForMode[currentMode];
  activeTab.classList.add('is-active');
  activeTab.setAttribute('aria-selected', 'true');
}

function playNotification() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
}

function flashBackground() {
  document.body.classList.remove('flash');
  void document.body.offsetWidth; // force reflow so the animation replays
  document.body.classList.add('flash');
  document.body.addEventListener('animationend', () => {
    document.body.classList.remove('flash');
  }, { once: true });
}

function setMode(mode) {
  pause();
  currentMode = mode;
  timeRemaining = durationFor(currentMode);
  render();
}

function switchMode() {
  playNotification();
  flashBackground();
  // auto-switch only toggles between work and short break
  currentMode = currentMode === 'work' ? 'break' : 'work';
  timeRemaining = durationFor(currentMode);
}

function tick() {
  if (timeRemaining === 0) {
    if (autoSwitch) {
      switchMode();
    } else {
      pause();
    }
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
  const longBreakMinutes = Number(longBreakInput.value);
  if (workMinutes >= 1 && workMinutes <= 60) workDuration = workMinutes * 60;
  if (breakMinutes >= 1 && breakMinutes <= 60) breakDuration = breakMinutes * 60;
  if (longBreakMinutes >= 1 && longBreakMinutes <= 60) longBreakDuration = longBreakMinutes * 60;

  if (!isRunning) {
    timeRemaining = durationFor(currentMode);
    render();
  }
}

workInput.addEventListener('change', applySettings);
breakInput.addEventListener('change', applySettings);
longBreakInput.addEventListener('change', applySettings);
autoSwitchToggle.addEventListener('change', () => {
  autoSwitch = autoSwitchToggle.checked;
});

tabWork.addEventListener('click', () => setMode('work'));
tabBreak.addEventListener('click', () => setMode('break'));
tabLongBreak.addEventListener('click', () => setMode('long-break'));

function openSettings() {
  settingsModal.removeAttribute('hidden');
  settingsToggleBtn.classList.add('is-active');
  settingsToggleBtn.setAttribute('aria-expanded', 'true');
  settingsCloseBtn.focus();
}

function closeSettings() {
  settingsModal.setAttribute('hidden', '');
  settingsToggleBtn.classList.remove('is-active');
  settingsToggleBtn.setAttribute('aria-expanded', 'false');
  settingsToggleBtn.focus();
}

settingsToggleBtn.addEventListener('click', openSettings);
settingsCloseBtn.addEventListener('click', closeSettings);

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettings();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsModal.hasAttribute('hidden')) closeSettings();
});

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((text, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const span = document.createElement('span');
    span.className = 'task-item-text';
    span.textContent = text;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'task-remove-btn';
    removeBtn.setAttribute('aria-label', `Remove task: ${text}`);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeTask(index));

    li.appendChild(span);
    li.appendChild(removeBtn);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push(text);
  taskInput.value = '';
  renderTasks();
}

function removeTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

render();
