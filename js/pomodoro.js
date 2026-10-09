/**
 * TASKFLOW PRO - Focus & Pomodoro Timer Module
 * Integrated with task tracking, Web Audio API, and desktop notifications
 */

class PomodoroTimer {
  constructor() {
    this.DURATIONS = {
      work: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };

    this.mode = 'work'; // 'work' | 'shortBreak' | 'longBreak'
    this.totalSeconds = this.DURATIONS[this.mode];
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = false;
    this.intervalId = null;

    this.activeTaskId = null;
    this.activeTaskTitle = null;

    // Load stats
    const stats = window.Storage.getPomodoroStats();
    this.completedRounds = stats.completedRounds || 0;
    this.totalFocusMinutes = stats.totalFocusMinutes || 0;

    // Radius for SVG ring
    this.CIRCUMFERENCE = 2 * Math.PI * 115; // r=115 -> ~722.57

    this.initElements();
    this.initEvents();
    this.updateDisplay();
    this.requestNotificationPermission();
  }

  initElements() {
    this.timeLargeEl = document.getElementById('pomodoroTimeLarge');
    this.modeLabelEl = document.getElementById('pomodoroModeLabel');
    this.ringFillEl = document.getElementById('pomodoroRingFill');
    this.btnToggle = document.getElementById('btnPomodoroToggle');
    this.btnReset = document.getElementById('btnPomodoroReset');
    this.btnSkip = document.getElementById('btnPomodoroSkip');
    this.playIcon = document.getElementById('pomPlayIcon');
    this.pauseIcon = document.getElementById('pomPauseIcon');
    this.roundsCountEl = document.getElementById('pomodoroRoundsCount');
    this.roundsDotsEl = document.getElementById('pomodoroRoundsDots');
    this.activeTaskNameEl = document.getElementById('pomodoroActiveTaskName');
    this.tabs = document.querySelectorAll('.pom-tab');

    // Mini pill in header
    this.miniPill = document.getElementById('miniPomodoroPill');
    this.miniDisplay = document.getElementById('miniTimerDisplay');
    this.liveDot = document.getElementById('pomodoroLiveDot');

    if (this.ringFillEl) {
      this.ringFillEl.style.strokeDasharray = `${this.CIRCUMFERENCE}`;
    }
  }

  initEvents() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggle());
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.reset());
    }

    if (this.btnSkip) {
      this.btnSkip.addEventListener('click', () => this.skip());
    }

    this.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetMode = e.currentTarget.dataset.mode;
        this.switchMode(targetMode);
      });
    });

    if (this.miniPill) {
      this.miniPill.addEventListener('click', () => {
        if (window.app) {
          window.app.switchView('pomodoro');
        }
      });
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><circle cx="12" cy="12" r="10"/></svg>'
        });
      } catch (e) {
        console.warn('Notification error', e);
      }
    }
  }

  setActiveTask(taskId, taskTitle) {
    this.activeTaskId = taskId;
    this.activeTaskTitle = taskTitle;
    if (this.activeTaskNameEl) {
      this.activeTaskNameEl.textContent = taskTitle ? `Task: ${taskTitle}` : 'Select a task below';
      this.activeTaskNameEl.title = taskTitle || '';
    }
  }

  switchMode(newMode) {
    if (!this.DURATIONS[newMode]) return;
    this.pause();
    this.mode = newMode;
    this.totalSeconds = this.DURATIONS[newMode];
    this.remainingSeconds = this.totalSeconds;

    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === newMode);
    });

    if (this.modeLabelEl) {
      if (newMode === 'work') this.modeLabelEl.textContent = 'Focus Session';
      else if (newMode === 'shortBreak') this.modeLabelEl.textContent = 'Short Break';
      else this.modeLabelEl.textContent = 'Long Break';
    }

    // Color theme for ring based on mode
    if (this.ringFillEl) {
      if (newMode === 'work') this.ringFillEl.style.stroke = 'var(--primary)';
      else if (newMode === 'shortBreak') this.ringFillEl.style.stroke = 'var(--color-emerald)';
      else this.ringFillEl.style.stroke = 'var(--color-teal)';
    }

    this.updateDisplay();
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.updatePlayPauseButton();

    if (this.miniPill) this.miniPill.classList.add('running');
    if (this.liveDot) this.liveDot.style.display = 'inline-block';

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.updatePlayPauseButton();

    if (this.miniPill) this.miniPill.classList.remove('running');
    if (this.liveDot) this.liveDot.style.display = 'none';
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    this.updateDisplay();
  }

  skip() {
    this.pause();
    if (this.mode === 'work') {
      const nextMode = (this.completedRounds + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      this.switchMode(nextMode);
    } else {
      this.switchMode('work');
    }
  }

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
      this.updateDisplay();
    } else {
      this.handleSessionComplete();
    }
  }

  handleSessionComplete() {
    this.pause();

    // Audio chime
    if (window.soundEffects) {
      window.soundEffects.playTimerDone();
    }

    if (this.mode === 'work') {
      this.completedRounds++;
      this.totalFocusMinutes += Math.round(this.DURATIONS.work / 60);

      window.Storage.savePomodoroStats({
        completedRounds: this.completedRounds,
        totalFocusMinutes: this.totalFocusMinutes
      });

      const nextMode = this.completedRounds % 4 === 0 ? 'longBreak' : 'shortBreak';
      this.sendNotification(
        'Focus Session Completed! 🎉',
        `Superb work! Time for a well-deserved ${nextMode === 'longBreak' ? '15m long' : '5m short'} break.`
      );

      if (window.app) {
        window.app.showToast('Focus session complete! 🎉 Great work.', 'info');
      }

      this.switchMode(nextMode);
    } else {
      this.sendNotification('Break Finished! ⚡', 'Ready to dive back into deep focus?');
      if (window.app) {
        window.app.showToast('Break finished! Ready to focus again.', 'info');
      }
      this.switchMode('work');
    }

    this.updateDisplay();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateDisplay() {
    const timeFormatted = this.formatTime(this.remainingSeconds);

    if (this.timeLargeEl) {
      this.timeLargeEl.textContent = timeFormatted;
    }

    if (this.miniDisplay) {
      this.miniDisplay.textContent = timeFormatted;
    }

    // Update circular progress ring
    if (this.ringFillEl) {
      const progressFraction = (this.totalSeconds - this.remainingSeconds) / this.totalSeconds;
      const offset = this.CIRCUMFERENCE * (1 - progressFraction);
      this.ringFillEl.style.strokeDashoffset = `${offset}`;
    }

    // Update tally counts
    if (this.roundsCountEl) {
      this.roundsCountEl.textContent = this.completedRounds;
    }

    if (this.roundsDotsEl) {
      const dotCount = this.completedRounds % 4;
      this.roundsDotsEl.textContent = ' 🍅'.repeat(dotCount);
    }
  }

  updatePlayPauseButton() {
    if (this.playIcon && this.pauseIcon) {
      this.playIcon.style.display = this.isRunning ? 'none' : 'block';
      this.pauseIcon.style.display = this.isRunning ? 'block' : 'none';
    }
  }
}

window.PomodoroTimer = PomodoroTimer;
