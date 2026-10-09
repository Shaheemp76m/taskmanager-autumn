/**
 * TASKFLOW - Material Autumn Application Controller
 * Streamlined, basic task management with Material Design 3 and warm Autumn colors
 */

class TaskFlowApp {
  constructor() {
    this.tasks = window.Storage.getTasks();
    this.categories = window.Storage.getCategories();

    // Filters
    this.statusFilter = 'all'; // 'all' | 'active' | 'completed'
    this.categoryFilter = 'all'; // 'all' | categoryId
    this.searchQuery = '';
    this.sortBy = 'dueDateAsc';

    // State
    this.editingTaskId = null;
    this.lastDeletedTask = null;

    window.app = this;

    this.initTheme();
    this.initAudioUI();
    this.cacheDOMElements();
    this.bindEvents();
    this.render();
  }

  // ==========================================
  // THEME & AUDIO INITIALIZATION
  // ==========================================
  initTheme() {
    const savedTheme = localStorage.getItem('taskflow_autumn_theme') || 'light';
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taskflow_autumn_theme', theme);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  initAudioUI() {
    const soundOn = document.getElementById('soundOnIcon');
    const soundOff = document.getElementById('soundOffIcon');
    const isMuted = window.soundEffects ? window.soundEffects.isMuted() : false;

    if (soundOn && soundOff) {
      soundOn.style.display = isMuted ? 'none' : 'inline-block';
      soundOff.style.display = isMuted ? 'inline-block' : 'none';
    }
  }

  toggleSound() {
    if (!window.soundEffects) return;
    const muted = window.soundEffects.toggleMute();
    this.initAudioUI();
    this.showSnackbar(muted ? 'Audio feedback muted' : 'Audio feedback enabled');
  }

  // ==========================================
  // CACHE DOM ELEMENTS
  // ==========================================
  cacheDOMElements() {
    // Header
    this.globalSearchInput = document.getElementById('globalSearchInput');
    this.searchClearBtn = document.getElementById('searchClearBtn');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.menuBtn = document.getElementById('menuBtn');
    this.optionsMenu = document.getElementById('optionsMenu');

    // Inline Add
    this.inlineTaskInput = document.getElementById('inlineTaskInput');
    this.inlineCategorySelect = document.getElementById('inlineCategorySelect');
    this.inlinePrioritySelect = document.getElementById('inlinePrioritySelect');
    this.inlineDueDate = document.getElementById('inlineDueDate');
    this.btnInlineAdd = document.getElementById('btnInlineAdd');

    // Tabs & Filters
    this.statusTabs = document.querySelectorAll('.md-tab');
    this.badgeAll = document.getElementById('badgeAll');
    this.badgeActive = document.getElementById('badgeActive');
    this.badgeCompleted = document.getElementById('badgeCompleted');
    this.categoryChipsContainer = document.getElementById('categoryChipsContainer');
    this.summaryText = document.getElementById('summaryText');
    this.sortSelect = document.getElementById('sortSelect');
    this.taskCardsList = document.getElementById('taskCardsList');

    // FAB
    this.fabAddTaskBtn = document.getElementById('fabAddTaskBtn');

    // Dialog Modal
    this.taskDialogBackdrop = document.getElementById('taskDialogBackdrop');
    this.taskDialogForm = document.getElementById('taskDialogForm');
    this.dialogTitle = document.getElementById('dialogTitle');
    this.dialogTaskId = document.getElementById('dialogTaskId');
    this.dialogTitleInput = document.getElementById('dialogTitleInput');
    this.dialogDescInput = document.getElementById('dialogDescInput');
    this.dialogCategorySelect = document.getElementById('dialogCategorySelect');
    this.dialogPrioritySelect = document.getElementById('dialogPrioritySelect');
    this.dialogDueDateInput = document.getElementById('dialogDueDateInput');
    this.dialogStatusSelect = document.getElementById('dialogStatusSelect');
    this.dialogCloseBtn = document.getElementById('dialogCloseBtn');
    this.dialogCancelBtn = document.getElementById('dialogCancelBtn');

    // Menu Actions
    this.btnLoadDemoData = document.getElementById('btnLoadDemoData');
    this.btnExportJSON = document.getElementById('btnExportJSON');
    this.importFileInput = document.getElementById('importFileInput');
    this.btnClearAllData = document.getElementById('btnClearAllData');

    // Snackbar Container
    this.snackbarContainer = document.getElementById('snackbarContainer');
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  bindEvents() {
    // Theme & Audio
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    this.soundToggleBtn.addEventListener('click', () => this.toggleSound());

    // Search Bar
    this.globalSearchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.searchClearBtn.style.display = this.searchQuery ? 'inline-flex' : 'none';
      this.render();
    });

    this.searchClearBtn.addEventListener('click', () => {
      this.globalSearchInput.value = '';
      this.searchQuery = '';
      this.searchClearBtn.style.display = 'none';
      this.render();
    });

    // Options Menu
    this.menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.optionsMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      this.optionsMenu.classList.remove('show');
    });

    // Status Tabs
    this.statusTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.statusTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.statusFilter = e.currentTarget.dataset.statusFilter;
        this.render();
      });
    });

    // Sorting
    this.sortSelect.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.render();
    });

    // Inline Task Creator
    this.btnInlineAdd.addEventListener('click', () => this.handleInlineAdd());
    this.inlineTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleInlineAdd();
      }
    });

    // FAB Button & Keyboard Shortcut
    this.fabAddTaskBtn.addEventListener('click', () => this.openTaskDialog());

    document.addEventListener('keydown', (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      if (e.key === 'Escape') {
        this.closeTaskDialog();
        return;
      }
      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openTaskDialog();
      } else if (e.key === '/') {
        e.preventDefault();
        this.globalSearchInput.focus();
      }
    });

    // Dialog Modal
    this.dialogCloseBtn.addEventListener('click', () => this.closeTaskDialog());
    this.dialogCancelBtn.addEventListener('click', () => this.closeTaskDialog());
    this.taskDialogBackdrop.addEventListener('click', (e) => {
      if (e.target === this.taskDialogBackdrop) this.closeTaskDialog();
    });
    this.taskDialogForm.addEventListener('submit', (e) => this.handleDialogSubmit(e));

    // Menu Item Actions
    this.btnLoadDemoData.addEventListener('click', () => {
      if (confirm('Load fresh autumn sample tasks?')) {
        this.tasks = window.Storage.generateSampleTasks();
        this.categories = window.DEFAULT_CATEGORIES || this.categories;
        window.Storage.saveTasks(this.tasks);
        window.Storage.saveCategories(this.categories);
        this.render();
        this.showSnackbar('Sample tasks loaded!');
      }
    });

    this.btnExportJSON.addEventListener('click', () => window.Storage.exportJSON());

    this.importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = window.Storage.importJSON(event.target.result);
        if (result.success) {
          this.tasks = window.Storage.getTasks();
          this.categories = window.Storage.getCategories();
          this.render();
          this.showSnackbar(`Imported ${result.count} tasks successfully!`);
        } else {
          this.showSnackbar(`Import error: ${result.error}`);
        }
        this.importFileInput.value = '';
      };
      reader.readAsText(file);
    });

    this.btnClearAllData.addEventListener('click', () => {
      if (confirm('Clear all tasks?')) {
        this.tasks = [];
        window.Storage.saveTasks(this.tasks);
        this.render();
        this.showSnackbar('All tasks cleared.');
      }
    });
  }

  // ==========================================
  // FILTERING & SORTING LOGIC
  // ==========================================
  isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  }

  isOverdue(dateStr, isCompleted) {
    if (!dateStr || isCompleted) return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  }

  getFilteredTasks() {
    let filtered = [...this.tasks];

    // Status Tab Filter
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(t => t.status !== 'completed');
    } else if (this.statusFilter === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed');
    }

    // Category Filter
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.categoryId === this.categoryFilter);
    }

    // Search Query
    if (this.searchQuery) {
      filtered = filtered.filter(t => {
        const matchTitle = (t.title || '').toLowerCase().includes(this.searchQuery);
        const matchDesc = (t.desc || '').toLowerCase().includes(this.searchQuery);
        return matchTitle || matchDesc;
      });
    }

    // Sort
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => {
      if (this.sortBy === 'dueDateAsc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (this.sortBy === 'priority') {
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      } else if (this.sortBy === 'titleAsc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (this.sortBy === 'createdDesc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });

    return filtered;
  }

  // ==========================================
  // RENDER PIPELINE
  // ==========================================
  render() {
    this.populateSelects();
    this.renderCategoryChips();
    this.renderBadges();
    this.renderTasks();
  }

  populateSelects() {
    const optionsHTML = this.categories.map(c => 
      `<option value="${c.id}">${this.escapeHTML(c.name)}</option>`
    ).join('');

    if (this.inlineCategorySelect) this.inlineCategorySelect.innerHTML = optionsHTML;
    if (this.dialogCategorySelect) this.dialogCategorySelect.innerHTML = optionsHTML;
  }

  renderCategoryChips() {
    this.categoryChipsContainer.innerHTML = '';

    // "All Categories" chip
    const allChip = document.createElement('button');
    allChip.className = `md-chip ${this.categoryFilter === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `
      <span class="chip-dot" style="background-color: var(--md-primary);"></span>
      <span>All Categories</span>
    `;
    allChip.addEventListener('click', () => {
      this.categoryFilter = 'all';
      this.render();
    });
    this.categoryChipsContainer.appendChild(allChip);

    // Individual category chips
    this.categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `md-chip ${this.categoryFilter === cat.id ? 'active' : ''}`;
      chip.innerHTML = `
        <span class="chip-dot" style="background-color: ${cat.color};"></span>
        <span>${this.escapeHTML(cat.name)}</span>
      `;
      chip.addEventListener('click', () => {
        this.categoryFilter = cat.id;
        this.render();
      });
      this.categoryChipsContainer.appendChild(chip);
    });
  }

  renderBadges() {
    const total = this.tasks.length;
    const active = this.tasks.filter(t => t.status !== 'completed').length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;

    this.badgeAll.textContent = total;
    this.badgeActive.textContent = active;
    this.badgeCompleted.textContent = completed;
  }

  renderTasks() {
    const tasks = this.getFilteredTasks();
    this.taskCardsList.innerHTML = '';
    this.summaryText.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;

    if (tasks.length === 0) {
      this.taskCardsList.innerHTML = `
        <div class="empty-state-card">
          <span class="material-symbols-outlined empty-icon">forest</span>
          <h3>No tasks in view</h3>
          <p>Everything is tidy! Add a new task using the quick input above or the button below.</p>
          <button class="md-btn md-btn-filled" onclick="window.app.openTaskDialog()">
            <span class="material-symbols-outlined">add</span>
            <span>Create Task</span>
          </button>
        </div>
      `;
      return;
    }

    tasks.forEach(task => {
      const card = this.createTaskCard(task);
      this.taskCardsList.appendChild(card);
    });
  }

  createTaskCard(task) {
    const card = document.createElement('div');
    const isDone = task.status === 'completed';
    card.className = `task-item-card ${isDone ? 'completed' : ''}`;

    const cat = this.categories.find(c => c.id === task.categoryId) || { name: 'General', color: '#B84A28' };
    const dateBadge = this.formatDateBadge(task.dueDate, isDone);

    card.innerHTML = `
      <label class="md-checkbox-wrapper" title="${isDone ? 'Mark as incomplete' : 'Mark as complete'}">
        <input type="checkbox" ${isDone ? 'checked' : ''} data-action="toggle-complete">
        <div class="md-checkbox-box">
          <span class="material-symbols-outlined">check</span>
        </div>
      </label>

      <div class="task-main-content" data-action="edit">
        <div class="task-header-row">
          <span class="task-title">${this.escapeHTML(task.title)}</span>
          <span class="card-badge badge-priority-${task.priority}">
            ${task.priority.toUpperCase()}
          </span>
        </div>
        ${task.desc ? `<p class="task-desc">${this.escapeHTML(task.desc)}</p>` : ''}
        <div class="task-badges-row">
          <span class="card-badge" style="background-color: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">
            <span class="chip-dot" style="background-color: ${cat.color};"></span>
            ${this.escapeHTML(cat.name)}
          </span>
          ${dateBadge}
        </div>
      </div>

      <div class="task-actions-group">
        <button class="action-icon-btn" data-action="edit" title="Edit task">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="action-icon-btn btn-delete" data-action="delete" title="Delete task">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;

    // Click handler with delegation
    card.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      if (action === 'toggle-complete') {
        e.stopPropagation();
        this.toggleTaskCompletion(task.id);
      } else if (action === 'edit') {
        this.openTaskDialog(task);
      } else if (action === 'delete') {
        e.stopPropagation();
        this.deleteTask(task.id);
      }
    });

    return card;
  }

  formatDateBadge(dateStr, isDone) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    let text = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    let cls = 'badge-date';

    if (this.isToday(dateStr)) {
      text = 'Today';
      cls += ' today';
    } else if (this.isOverdue(dateStr, isDone)) {
      text = 'Overdue';
      cls += ' overdue';
    }

    return `
      <span class="card-badge ${cls}">
        <span class="material-symbols-outlined" style="font-size: 13px;">calendar_today</span>
        ${text}
      </span>
    `;
  }

  // ==========================================
  // TASK CRUD OPERATIONS
  // ==========================================
  handleInlineAdd() {
    const title = this.inlineTaskInput.value.trim();
    if (!title) return;

    const newTask = {
      id: 'task-' + Date.now(),
      title,
      desc: '',
      categoryId: this.inlineCategorySelect.value || this.categories[0].id,
      priority: this.inlinePrioritySelect.value || 'medium',
      status: 'todo',
      dueDate: this.inlineDueDate.value ? new Date(this.inlineDueDate.value).toISOString() : null,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(newTask);
    window.Storage.saveTasks(this.tasks);

    if (window.soundEffects) {
      window.soundEffects.playAdd();
    }

    this.inlineTaskInput.value = '';
    this.inlineDueDate.value = '';
    this.render();
    this.showSnackbar('Task added!');
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'completed') {
      task.status = 'todo';
    } else {
      task.status = 'completed';
      if (window.soundEffects) {
        window.soundEffects.playComplete();
      }
    }

    window.Storage.saveTasks(this.tasks);
    this.render();
  }

  deleteTask(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    this.lastDeletedTask = { task: this.tasks[index], index };
    this.tasks.splice(index, 1);
    window.Storage.saveTasks(this.tasks);

    if (window.soundEffects) {
      window.soundEffects.playDelete();
    }

    this.render();
    this.showSnackbar('Task deleted', () => this.undoDelete());
  }

  undoDelete() {
    if (!this.lastDeletedTask) return;
    this.tasks.splice(this.lastDeletedTask.index, 0, this.lastDeletedTask.task);
    window.Storage.saveTasks(this.tasks);
    this.lastDeletedTask = null;
    this.render();
    this.showSnackbar('Task restored!');
  }

  // ==========================================
  // DIALOG MODAL (ADD / EDIT)
  // ==========================================
  openTaskDialog(task = null) {
    this.editingTaskId = task && task.id ? task.id : null;
    this.dialogTitle.textContent = this.editingTaskId ? 'Edit Task' : 'Create Task';

    if (task && task.id) {
      this.dialogTaskId.value = task.id;
      this.dialogTitleInput.value = task.title || '';
      this.dialogDescInput.value = task.desc || '';
      this.dialogCategorySelect.value = task.categoryId || this.categories[0].id;
      this.dialogPrioritySelect.value = task.priority || 'medium';
      this.dialogStatusSelect.value = task.status || 'todo';

      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const pad = n => String(n).padStart(2, '0');
        this.dialogDueDateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else {
        this.dialogDueDateInput.value = '';
      }
    } else {
      this.dialogTaskId.value = '';
      this.dialogTitleInput.value = '';
      this.dialogDescInput.value = '';
      this.dialogCategorySelect.value = this.categories[0].id;
      this.dialogPrioritySelect.value = 'medium';
      this.dialogStatusSelect.value = 'todo';
      this.dialogDueDateInput.value = '';
    }

    this.taskDialogBackdrop.style.display = 'flex';
    this.dialogTitleInput.focus();
  }

  closeTaskDialog() {
    this.taskDialogBackdrop.style.display = 'none';
    this.editingTaskId = null;
  }

  handleDialogSubmit(e) {
    e.preventDefault();
    const title = this.dialogTitleInput.value.trim();
    if (!title) return;

    const desc = this.dialogDescInput.value.trim();
    const categoryId = this.dialogCategorySelect.value;
    const priority = this.dialogPrioritySelect.value;
    const status = this.dialogStatusSelect.value;
    const dueDateVal = this.dialogDueDateInput.value;
    const dueDate = dueDateVal ? new Date(dueDateVal).toISOString() : null;

    if (this.editingTaskId) {
      const task = this.tasks.find(t => t.id === this.editingTaskId);
      if (task) {
        task.title = title;
        task.desc = desc;
        task.categoryId = categoryId;
        task.priority = priority;
        task.status = status;
        task.dueDate = dueDate;
      }
      this.showSnackbar('Task updated!');
    } else {
      const newTask = {
        id: 'task-' + Date.now(),
        title,
        desc,
        categoryId,
        priority,
        status,
        dueDate,
        createdAt: new Date().toISOString()
      };
      this.tasks.unshift(newTask);
      if (window.soundEffects) {
        window.soundEffects.playAdd();
      }
      this.showSnackbar('Task created!');
    }

    window.Storage.saveTasks(this.tasks);
    this.closeTaskDialog();
    this.render();
  }

  // ==========================================
  // MATERIAL SNACKBAR
  // ==========================================
  showSnackbar(message, actionCallback = null) {
    const snackbar = document.createElement('div');
    snackbar.className = 'md-snackbar';
    snackbar.innerHTML = `
      <span>${this.escapeHTML(message)}</span>
      ${actionCallback ? `<span class="md-snackbar-action">UNDO</span>` : ''}
    `;

    if (actionCallback) {
      snackbar.querySelector('.md-snackbar-action').addEventListener('click', () => {
        actionCallback();
        snackbar.remove();
      });
    }

    this.snackbarContainer.appendChild(snackbar);

    setTimeout(() => {
      snackbar.style.opacity = '0';
      snackbar.style.transform = 'translateY(12px)';
      snackbar.style.transition = 'all 0.2s ease';
      setTimeout(() => snackbar.remove(), 200);
    }, 3500);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
  new TaskFlowApp();
});
