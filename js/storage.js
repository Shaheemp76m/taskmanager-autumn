/**
 * TASKFLOW - Material Autumn Storage Layer
 * LocalStorage data management with Autumn category presets and JSON/CSV backup
 */

const STORAGE_KEYS = {
  TASKS: 'taskflow_autumn_tasks_v1',
  CATEGORIES: 'taskflow_autumn_categories_v1'
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: 'Work & Projects', color: '#B84A28' },  // Terracotta / Burnt Sienna
  { id: 'cat-personal', name: 'Personal & Life', color: '#D97706' }, // Maple Amber
  { id: 'cat-errands', name: 'Errands & Home', color: '#854D0E' },  // Chestnut Brown
  { id: 'cat-ideas', name: 'Ideas & Learning', color: '#556B2F' }   // Olive Moss Green
];

const Storage = {
  getRelativeDate(offsetDays, hour = 17, minute = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  },

  // Seed initial tasks
  generateSampleTasks() {
    return [
      {
        id: 'task-1',
        title: 'Finalize Autumn Q4 campaign presentation & designs',
        desc: 'Review brand assets, autumn typography scale, and align team on rollout milestones.',
        categoryId: 'cat-work',
        priority: 'urgent',
        status: 'todo',
        dueDate: this.getRelativeDate(0, 18, 0), // Today
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'task-2',
        title: 'Home winterization & garden harvest prep',
        desc: 'Clear fallen leaves, check roof gutters, and store outdoor patio furniture.',
        categoryId: 'cat-errands',
        priority: 'high',
        status: 'todo',
        dueDate: this.getRelativeDate(1, 14, 0), // Tomorrow
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: 'task-3',
        title: 'Plan weekend foliage hike in the state park',
        desc: 'Check trail conditions, pack warm thermal layers, and invite friends for trail walk.',
        categoryId: 'cat-personal',
        priority: 'medium',
        status: 'todo',
        dueDate: this.getRelativeDate(3, 10, 0),
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'task-4',
        title: 'Read System Design & Cache Invalidation chapter 3',
        desc: 'Take notes on distributed caches (Redis vs Memcached) and write summary.',
        categoryId: 'cat-ideas',
        priority: 'low',
        status: 'todo',
        dueDate: this.getRelativeDate(4, 21, 0),
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
      },
      {
        id: 'task-5',
        title: 'Bake spiced pumpkin and walnut bread',
        desc: 'Roasted pumpkin puree, cinnamon, nutmeg, and organic walnuts.',
        categoryId: 'cat-personal',
        priority: 'medium',
        status: 'completed',
        dueDate: this.getRelativeDate(-1, 15, 0),
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
      }
    ];
  },

  getTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!raw) {
        const seed = this.generateSampleTasks();
        this.saveTasks(seed);
        return seed;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse tasks', e);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (e) {
      console.error('Failed to save tasks', e);
      return false;
    }
  },

  getCategories() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!raw) {
        this.saveCategories(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse categories', e);
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      return true;
    } catch (e) {
      console.error('Failed to save categories', e);
      return false;
    }
  },

  exportJSON() {
    const data = {
      app: 'TaskFlow Autumn',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      categories: this.getCategories(),
      tasks: this.getTasks()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow-autumn-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.tasks)) {
        throw new Error('Tasks array missing from backup file.');
      }
      if (Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      this.saveTasks(data.tasks);
      return { success: true, count: data.tasks.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  }
};

window.Storage = Storage;
window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
