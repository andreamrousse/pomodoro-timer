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
const workError = document.getElementById('work-duration-error');
const breakError = document.getElementById('break-duration-error');
const longBreakError = document.getElementById('long-break-duration-error');
const tabWork = document.getElementById('tab-work');
const tabBreak = document.getElementById('tab-break');
const tabLongBreak = document.getElementById('tab-long-break');
const allTabs = [tabWork, tabBreak, tabLongBreak];
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const taskCountPending = document.getElementById('task-count-pending');
const taskCountDone = document.getElementById('task-count-done');
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const modalXBtn = document.getElementById('modal-x-btn');
const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
const autoSwitchToggle = document.getElementById('auto-switch-toggle');
const sessionDotsEl = document.getElementById('session-dots');
const sessionTotalEl = document.getElementById('session-total');

let tasks = [];
let autoSwitch = true;
let sessionCount = 0;

const STORAGE_KEY = 'pomodoro-settings';

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    workDuration,
    breakDuration,
    longBreakDuration,
    autoSwitch,
    tasks,
    sessionCount,
  }));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);

  if (data.workDuration) workDuration = data.workDuration;
  if (data.breakDuration) breakDuration = data.breakDuration;
  if (data.longBreakDuration) longBreakDuration = data.longBreakDuration;
  if (typeof data.autoSwitch === 'boolean') autoSwitch = data.autoSwitch;
  if (Array.isArray(data.tasks)) {
    tasks = data.tasks.map(t => (typeof t === 'string' ? { text: t, done: false } : t));
  }
  if (typeof data.sessionCount === 'number') sessionCount = data.sessionCount;

  workInput.value = workDuration / 60;
  breakInput.value = breakDuration / 60;
  longBreakInput.value = longBreakDuration / 60;
  autoSwitchToggle.checked = autoSwitch;

  timeRemaining = workDuration;
}

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
  resetBtn.disabled = !isRunning && timeRemaining === durationFor(currentMode);

  allTabs.forEach(tab => {
    tab.classList.remove('is-active');
    tab.setAttribute('aria-selected', 'false');
  });
  const activeTab = tabForMode[currentMode];
  activeTab.classList.add('is-active');
  activeTab.setAttribute('aria-selected', 'true');

  const cyclePosition = sessionCount % 4;
  sessionDotsEl.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('span');
    dot.className = 'session-dot' + (i < cyclePosition ? ' is-complete' : '');
    dot.setAttribute('aria-hidden', 'true');
    sessionDotsEl.appendChild(dot);
  }
  sessionTotalEl.textContent = sessionCount === 1 ? '1 session' : `${sessionCount} sessions`;
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

function withModeTransition(stateUpdate) {
  const timerEl = document.querySelector('.timer');
  timerEl.classList.add('is-switching');
  setTimeout(() => {
    stateUpdate();
    render();
  }, 200);
  timerEl.addEventListener('animationend', () => {
    timerEl.classList.remove('is-switching');
  }, { once: true });
}

function setMode(mode) {
  pause();
  withModeTransition(() => {
    currentMode = mode;
    timeRemaining = durationFor(currentMode);
  });
}

function switchMode() {
  playNotification();
  flashBackground();
  withModeTransition(() => {
    if (currentMode === 'work') {
      sessionCount += 1;
      // every 4th completed session triggers a long break
      currentMode = sessionCount % 4 === 0 ? 'long-break' : 'break';
    } else {
      currentMode = 'work';
    }
    timeRemaining = durationFor(currentMode);
    saveToStorage();
  });
}

function tick() {
  if (timeRemaining === 0) {
    if (autoSwitch) {
      switchMode();
    } else {
      pause();
      render();
    }
  } else {
    timeRemaining -= 1;
    render();
  }
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

function validateInput(input, errorEl, min, max) {
  const value = Number(input.value);
  const valid = value >= min && value <= max;
  input.classList.toggle('is-invalid', !valid);
  errorEl.hidden = valid;
  if (valid) input.value = value; // strip leading zeros
  return valid;
}

function applySettings() {
  const workMinutes = Number(workInput.value);
  const breakMinutes = Number(breakInput.value);
  const longBreakMinutes = Number(longBreakInput.value);

  if (validateInput(workInput, workError, 1, 60)) workDuration = workMinutes * 60;
  if (validateInput(breakInput, breakError, 1, 60)) breakDuration = breakMinutes * 60;
  if (validateInput(longBreakInput, longBreakError, 1, 60)) longBreakDuration = longBreakMinutes * 60;

  if (!isRunning) {
    timeRemaining = durationFor(currentMode);
    render();
  }
  saveToStorage();
}

function updateResetBtn() {
  const isDefault =
    Number(workInput.value) === 25 &&
    Number(breakInput.value) === 5 &&
    Number(longBreakInput.value) === 15;
  resetDefaultsBtn.disabled = isDefault;
}

workInput.addEventListener('change', () => { applySettings(); updateResetBtn(); });
breakInput.addEventListener('change', () => { applySettings(); updateResetBtn(); });
longBreakInput.addEventListener('change', () => { applySettings(); updateResetBtn(); });
autoSwitchToggle.addEventListener('change', () => {
  autoSwitch = autoSwitchToggle.checked;
  saveToStorage();
});

tabWork.addEventListener('click', () => setMode('work'));
tabBreak.addEventListener('click', () => setMode('break'));
tabLongBreak.addEventListener('click', () => setMode('long-break'));

function openSettings() {
  settingsModal.removeAttribute('hidden');
  settingsToggleBtn.classList.add('is-active');
  settingsToggleBtn.setAttribute('aria-expanded', 'true');
  updateResetBtn();
  settingsCloseBtn.focus();
}

function closeSettings() {
  settingsModal.setAttribute('hidden', '');
  settingsToggleBtn.classList.remove('is-active');
  settingsToggleBtn.setAttribute('aria-expanded', 'false');
  settingsToggleBtn.focus();
}

function resetToDefaults() {
  workDuration = 25 * 60;
  breakDuration = 5 * 60;
  longBreakDuration = 15 * 60;
  workInput.value = 25;
  breakInput.value = 5;
  longBreakInput.value = 15;
  [workInput, breakInput, longBreakInput].forEach(el => el.classList.remove('is-invalid'));
  [workError, breakError, longBreakError].forEach(el => el.hidden = true);
  if (!isRunning) {
    timeRemaining = durationFor(currentMode);
    render();
  }
  saveToStorage();
  updateResetBtn();
}

settingsToggleBtn.addEventListener('click', openSettings);
settingsCloseBtn.addEventListener('click', closeSettings);
modalXBtn.addEventListener('click', closeSettings);
resetDefaultsBtn.addEventListener('click', resetToDefaults);

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettings();
});

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  const typingInField = tag === 'INPUT' || tag === 'TEXTAREA';

  if (e.key === 'Escape' && !settingsModal.hasAttribute('hidden')) {
    closeSettings();
    return;
  }

  if (typingInField) return;

  if (e.key === ' ') {
    e.preventDefault(); // stop the page from scrolling on Space
    if (isRunning) { pause(); } else { start(); }
  }

  if (e.key === 'r' || e.key === 'R') {
    reset();
  }
});

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks();
  saveToStorage();
}

const SVG_SQUARE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`;
const SVG_SQUARE_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

function renderTasks() {
  taskList.innerHTML = '';
  const pendingCount = tasks.filter(t => !t.done).length;
  const doneCount = tasks.filter(t => t.done).length;
  taskCountPending.textContent = pendingCount === 1 ? '1 pending' : `${pendingCount} pending`;
  taskCountDone.textContent = doneCount === 1 ? '1 done' : `${doneCount} done`;
  taskCountPending.hidden = tasks.length === 0;
  taskCountDone.hidden = doneCount === 0;
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' is-done' : '');

    const checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.className = 'task-checkbox' + (task.done ? ' is-checked' : '');
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute('aria-checked', task.done ? 'true' : 'false');
    checkbox.setAttribute('aria-label', 'Mark task complete');
    checkbox.innerHTML = task.done ? SVG_SQUARE_CHECK : SVG_SQUARE;
    checkbox.addEventListener('click', () => toggleTask(index));

    const span = document.createElement('span');
    span.className = 'task-item-text' + (task.done ? ' is-done' : '');
    span.textContent = task.text;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'task-remove-btn';
    removeBtn.setAttribute('aria-label', `Remove task: ${task.text}`);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeTask(index));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(removeBtn);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ text, done: false });
  taskInput.value = '';
  renderTasks();
  saveToStorage();
}

function removeTask(index) {
  tasks.splice(index, 1);
  renderTasks();
  saveToStorage();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

loadFromStorage();
renderTasks();
render();
lucide.createIcons();
