/**
 * AgriFarm Pro - Farm Management System
 * Modular Vanilla JavaScript Application
 * Uses LocalStorage for data persistence
 */

(function () {
  'use strict';

  // ==========================================
  // STORAGE MODULE - LocalStorage operations
  // ==========================================
  const Storage = {
    KEYS: {
      USERS: 'agrifarm_users',
      CURRENT_USER: 'agrifarm_current_user',
      CROPS: 'agrifarm_crops',
      EXPENSES: 'agrifarm_expenses',
      INCOME: 'agrifarm_income',
      INVENTORY: 'agrifarm_inventory',
      TASKS: 'agrifarm_tasks',
      ACTIVITIES: 'agrifarm_activities',
      NOTIFICATIONS: 'agrifarm_notifications',
      SETTINGS: 'agrifarm_settings',
      THEME: 'agrifarm_theme',
      LOCATION: 'agrifarm_location',
      PEST_LOG: 'agrifarm_pest_log',
      SOIL_TESTS: 'agrifarm_soil_tests',
      YIELD_HISTORY: 'agrifarm_yield_history',
      LIVESTOCK: 'agrifarm_livestock',
      MILK_LOG: 'agrifarm_milk_log',
      VACCINATIONS: 'agrifarm_vaccinations',
      BREEDING: 'agrifarm_breeding',
      WEATHER_HISTORY: 'agrifarm_weather_history',
      IOT_CONFIG: 'agrifarm_iot_config',
      IOT_READINGS: 'agrifarm_iot_readings',
      ONBOARDING: 'agrifarm_onboarding_done'
    },

    get(key) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },

    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },

    getUserData(key) {
      const userId = Auth.getCurrentUserId();
      if (!userId) return [];
      const all = this.get(key) || {};
      return all[userId] || [];
    },

    setUserData(key, data) {
      const userId = Auth.getCurrentUserId();
      if (!userId) return;
      const all = this.get(key) || {};
      all[userId] = data;
      this.set(key, all);
    }
  };

  // ==========================================
  // UTILITY MODULE
  // ==========================================
  const Utils = {
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    formatCurrency(amount) {
      const value = Number(amount || 0);
      return '₹' + value.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: value % 1 === 0 ? 0 : 2
      });
    },

    formatDate(dateStr) {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    getInitials(name) {
      if (!name) return 'U';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },

    getMonthName(month) {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
    },

    today() {
      return new Date().toISOString().split('T')[0];
    },

    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    getCropImage(name, type) {
      const key = (name || '').toLowerCase();
      const map = {
        tomato: 'https://images.unsplash.com/photo-1592924358218-76904b12a659?w=600&q=80',
        tomatoes: 'https://images.unsplash.com/photo-1592924358218-76904b12a659?w=600&q=80',
        corn: 'https://images.unsplash.com/photo-1551759450-3cc920c2d0a0?w=600&q=80',
        wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
        apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80',
        apples: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80',
        orange: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=600&q=80',
        cherry: 'https://images.unsplash.com/photo-1528821120020-f71fc1620905?w=600&q=80',
        cherries: 'https://images.unsplash.com/photo-1528821120020-f71fc1620905?w=600&q=80',
        rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
        potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80'
      };
      for (const k of Object.keys(map)) {
        if (key.includes(k)) return map[k];
      }
      const defaults = {
        Vegetables: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
        Fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80',
        Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
        Legumes: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
        Herbs: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
        Other: 'https://images.unsplash.com/photo-1574943329822-80107a6fd0f6?w=600&q=80'
      };
      return (type && defaults[type]) || defaults.Other;
    },

    parseHectares(quantity) {
      if (!quantity) return 5;
      const match = String(quantity).match(/[\d.]+/);
      return match ? Math.min(parseFloat(match[0]) / 10, 50) : 5;
    }
  };

  const BG_IMAGES = {
    fields: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80',
    farmhouse: 'https://images.unsplash.com/photo-1560493676-04071c5f467d?w=1920&q=80',
    splash: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80',
    default: 'https://images.unsplash.com/photo-1574943329822-80107a6fd0f6?w=1920&q=80'
  };

  const CROP_COLORS = ['#3d9b5f', '#f5c842', '#ff6b4a', '#5ec8e8', '#9b5de5', '#f4a261'];

  // ==========================================
  // UI MODULE - Toasts, Modals, Navigation
  // ==========================================
  const UI = {
    charts: {},

    toast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${Utils.escapeHtml(message)}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    },

    openModal(title, bodyHtml) {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = bodyHtml;
      document.getElementById('modal-overlay').classList.remove('hidden');
    },

    closeModal() {
      document.getElementById('modal-overlay').classList.add('hidden');
    },

    navigateTo(section) {
      document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(n => n.classList.remove('active'));
      const sectionEl = document.getElementById(`section-${section}`);
      if (sectionEl) {
        sectionEl.classList.add('active');
        const bg = sectionEl.dataset.bg || 'default';
        const pageBg = document.getElementById('page-bg');
        if (pageBg) pageBg.style.setProperty('--bg-image', `url('${BG_IMAGES[bg] || BG_IMAGES.default}')`);
      }
      document.querySelectorAll(`[data-section="${section}"]`).forEach(n => n.classList.add('active'));
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('active');
      App.renderSection(section);
    },

    destroyChart(id) {
      if (this.charts[id]) {
        this.charts[id].destroy();
        delete this.charts[id];
      }
    },

    createChart(id, config) {
      this.destroyChart(id);
      const canvas = document.getElementById(id);
      if (!canvas) return null;
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const textColor = isDark ? 'rgba(255,255,255,0.7)' : '#52796f';
      const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(45,106,79,0.1)';

      if (config.options) {
        config.options = {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: textColor, font: { family: 'Inter' } } }
          },
          scales: config.type !== 'doughnut' && config.type !== 'pie' ? {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } }
          } : {},
          ...config.options
        };
      }

      this.charts[id] = new Chart(canvas, config);
      return this.charts[id];
    },

    emptyState(icon, message) {
      return `<div class="empty-state"><i class="fas fa-${icon}"></i><p>${message}</p></div>`;
    }
  };

  // ==========================================
  // AUTH MODULE
  // ==========================================
  const Auth = {
    getCurrentUserId() {
      const user = Storage.get(Storage.KEYS.CURRENT_USER);
      return user ? user.id : null;
    },

    getCurrentUser() {
      return Storage.get(Storage.KEYS.CURRENT_USER);
    },

    showAuthView(view) {
      document.querySelectorAll('.auth-view').forEach(v => v.classList.remove('active'));
      document.getElementById(`${view}-view`).classList.add('active');
    },

    register(name, email, phone, password) {
      const users = Storage.get(Storage.KEYS.USERS) || [];
      if (users.find(u => u.email === email)) {
        UI.toast('Email already registered', 'error');
        return false;
      }
      const user = {
        id: Utils.generateId(),
        name,
        email,
        phone,
        password,
        farmName: 'My Farm',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      Storage.set(Storage.KEYS.USERS, users);
      UI.toast('Account created successfully!', 'success');
      return true;
    },

    login(email, password) {
      const users = Storage.get(Storage.KEYS.USERS) || [];
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        UI.toast('Invalid email or password', 'error');
        return false;
      }
      const { password: _, ...safeUser } = user;
      Storage.set(Storage.KEYS.CURRENT_USER, safeUser);
      return true;
    },

    logout() {
      Storage.set(Storage.KEYS.CURRENT_USER, null);
      document.getElementById('app-container').classList.add('hidden');
      document.getElementById('fab-container')?.classList.add('hidden');
      document.getElementById('auth-container').classList.remove('hidden');
      Auth.showAuthView('login');
      UI.toast('Logged out successfully', 'info');
    },

    updateProfile(data) {
      const users = Storage.get(Storage.KEYS.USERS) || [];
      const current = this.getCurrentUser();
      const idx = users.findIndex(u => u.id === current.id);
      if (idx === -1) return;
      Object.assign(users[idx], data);
      Storage.set(Storage.KEYS.USERS, users);
      const { password: _, ...safeUser } = users[idx];
      Storage.set(Storage.KEYS.CURRENT_USER, safeUser);
    },

    init() {
      document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (Auth.login(email, password)) {
          App.showApp();
        }
      });

      document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        if (password !== confirm) {
          UI.toast('Passwords do not match', 'error');
          return;
        }
        if (Auth.register(name, email, phone, password)) {
          Auth.showAuthView('login');
        }
      });

      document.getElementById('forgot-form').addEventListener('submit', (e) => {
        e.preventDefault();
        UI.toast('Password reset link sent to your email (demo)', 'success');
        Auth.showAuthView('login');
      });

      document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.showAuthView('register');
      });
      document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.showAuthView('login');
      });
      document.getElementById('show-forgot').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.showAuthView('forgot');
      });
      document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.showAuthView('login');
      });

      document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());
    }
  };

  // ==========================================
  // ACTIVITY LOGGER
  // ==========================================
  const ActivityLog = {
    add(action, details) {
      const activities = Storage.getUserData(Storage.KEYS.ACTIVITIES);
      activities.unshift({
        id: Utils.generateId(),
        action,
        details,
        timestamp: new Date().toISOString()
      });
      if (activities.length > 50) activities.length = 50;
      Storage.setUserData(Storage.KEYS.ACTIVITIES, activities);
    },

    getAll() {
      return Storage.getUserData(Storage.KEYS.ACTIVITIES);
    }
  };

  // ==========================================
  // NOTIFICATIONS MODULE
  // ==========================================
  const Notifications = {
    add(message, icon = 'bell') {
      const notifs = Storage.getUserData(Storage.KEYS.NOTIFICATIONS);
      notifs.unshift({
        id: Utils.generateId(),
        message,
        icon,
        timestamp: new Date().toISOString(),
        read: false
      });
      Storage.setUserData(Storage.KEYS.NOTIFICATIONS, notifs);
      this.updateBadge();
    },

    getAll() {
      return Storage.getUserData(Storage.KEYS.NOTIFICATIONS);
    },

    clear() {
      Storage.setUserData(Storage.KEYS.NOTIFICATIONS, []);
      this.updateBadge();
      this.render();
    },

    updateBadge() {
      const notifs = this.getAll();
      const unread = notifs.filter(n => !n.read).length;
      const badge = document.getElementById('notification-badge');
      if (unread > 0) {
        badge.textContent = unread;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    },

    render() {
      const list = document.getElementById('notification-list');
      const notifs = this.getAll();
      if (!notifs.length) {
        list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>';
        return;
      }
      list.innerHTML = notifs.map(n => `
        <div class="notification-item">
          <i class="fas fa-${n.icon}"></i>
          <div>
            <p>${Utils.escapeHtml(n.message)}</p>
            <small>${Utils.formatDate(n.timestamp)}</small>
          </div>
        </div>
      `).join('');
    }
  };

  // ==========================================
  // DASHBOARD MODULE
  // ==========================================
  const Dashboard = {
    async render() {
      const crops = Crops.getAll();
      const expenses = Expenses.getAll();
      const income = Income.getAll();
      const user = Auth.getCurrentUser();
      const now = new Date();

      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalIncome = income.reduce((s, i) => s + Number(i.total), 0);
      const netProfit = totalIncome - totalExpenses;
      const activeCrops = crops.filter(c => c.status === 'Growing').length;
      const farms = new Set(crops.map(c => c.fieldName)).size || (user?.farmName ? 1 : 0);

      document.getElementById('stat-farms').textContent = farms;
      document.getElementById('stat-crops').textContent = activeCrops;
      document.getElementById('stat-expenses').textContent = Utils.formatCurrency(totalExpenses);
      document.getElementById('stat-income').textContent = Utils.formatCurrency(totalIncome);
      const profitEl = document.getElementById('stat-profit');
      profitEl.textContent = Utils.formatCurrency(netProfit);
      profitEl.style.color = netProfit >= 0 ? 'var(--accent)' : 'var(--danger)';

      document.getElementById('dash-day').textContent = now.getDate();
      document.getElementById('dashboard-date').textContent = now.toLocaleDateString('en-IN', {
        month: 'long', year: 'numeric'
      });

      Weather.renderWidget('dashboard-weather', true);
      await Weather.ensureData();
      Weather.renderWidget('dashboard-weather');
      this.renderTempBar();
      this.renderWaterChart();
      this.renderCropDistribution(crops);
      this.renderCropGallery(crops);
      this.renderCropHealth(crops);
      this.renderOverview(expenses, income);
      this.renderActivities();
    },

    renderTempBar() {
      const data = Weather.data;
      const hours = data?.hourlyLabels?.length ? data.hourlyLabels : ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM'];
      const temps = data?.hourlyTemps?.length ? data.hourlyTemps : [22, 24, 27, 30, 32, 31, 28];

      UI.createChart('temp-bar-chart', {
        type: 'bar',
        data: {
          labels: hours,
          datasets: [{
            data: temps,
            backgroundColor: temps.map(t =>
              t < 15 ? 'rgba(61,155,95,0.9)' : t < 25 ? 'rgba(245,200,66,0.9)' : 'rgba(255,107,74,0.9)'),
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9 } } },
            y: { display: false, max: 40 }
          }
        }
      });

      const widget = document.getElementById('dashboard-weather');
      if (widget) {
        widget.querySelector('.hourly-temps')?.remove();
        widget.insertAdjacentHTML('beforeend', `
          <div class="hourly-temps">${hours.map((h, i) => `<span>${temps[i]}°</span>`).join('')}</div>`);
      }
    },

    renderWaterChart() {
      const data = Weather.data;
      const level = data?.waterLevel ?? 35;
      const alertEl = document.getElementById('water-alert');
      const levelEl = document.getElementById('water-level-value');

      if (levelEl) levelEl.textContent = level.toFixed(1) + '%';
      if (alertEl) {
        if (level < 30) {
          alertEl.textContent = 'Dangerous level';
          alertEl.className = 'alert-tag';
        } else {
          alertEl.textContent = 'Normal level';
          alertEl.className = 'alert-tag normal';
        }
      }

      const points = data?.soilMoistureTrend?.length
        ? data.soilMoistureTrend
        : Array.from({ length: 12 }, (_, i) => level + Math.sin(i * 0.8) * 8);

      UI.createChart('water-level-chart', {
        type: 'line',
        data: {
          labels: points.map((_, i) => ''),
          datasets: [{
            data: points,
            borderColor: '#5ec8e8',
            backgroundColor: 'rgba(94,200,232,0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    },

    renderCropDistribution(crops) {
      const list = document.getElementById('crop-distribution-list');
      if (!list) return;

      if (!crops.length) {
        list.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No crops yet</p>';
        document.getElementById('total-hectares').textContent = '0';
        return;
      }

      const areas = crops.map(c => ({ name: c.name, ha: Utils.parseHectares(c.quantity) }));
      const totalHa = areas.reduce((s, a) => s + a.ha, 0);

      list.innerHTML = areas.slice(0, 4).map((a, i) => {
        const pct = totalHa ? ((a.ha / totalHa) * 100).toFixed(1) : 0;
        return `
          <div class="distribution-item">
            <span class="dot" style="background:${CROP_COLORS[i % CROP_COLORS.length]}"></span>
            <span>${Utils.escapeHtml(a.name)}</span>
            <span class="area">${a.ha.toFixed(1)} Ha</span>
            <span class="pct">${pct}%</span>
          </div>`;
      }).join('');

      document.getElementById('total-hectares').textContent = totalHa.toFixed(1);

      UI.createChart('crop-distribution-gauge', {
        type: 'doughnut',
        data: {
          labels: areas.map(a => a.name),
          datasets: [{
            data: areas.map(a => a.ha),
            backgroundColor: areas.map((_, i) => CROP_COLORS[i % CROP_COLORS.length]),
            borderWidth: 0
          }]
        },
        options: {
          rotation: -90,
          circumference: 180,
          cutout: '72%',
          plugins: { legend: { display: false } }
        }
      });
    },

    renderCropGallery(crops) {
      const gallery = document.getElementById('dashboard-crop-gallery');
      if (!gallery) return;

      const icons = { Vegetables: 'carrot', Fruits: 'apple-alt', Grains: 'wheat-awn', Legumes: 'seedling', Herbs: 'leaf', Other: 'seedling' };

      if (!crops.length) {
        gallery.innerHTML = '';
        return;
      }

      gallery.innerHTML = crops.slice(0, 4).map(c => `
        <div class="crop-photo-card" onclick="Crops.viewDetails('${c.id}')">
          <img src="${Utils.getCropImage(c.name, c.type)}" alt="${Utils.escapeHtml(c.name)}">
          <div class="crop-photo-label">
            <i class="fas fa-${icons[c.type] || 'leaf'}"></i>
            <span>${Utils.escapeHtml(c.name)}</span>
          </div>
        </div>`).join('');
    },

    init() {
      const menuBtn = document.getElementById('dash-menu-btn');
      if (menuBtn) {
        menuBtn.addEventListener('click', () => {
          document.getElementById('sidebar').classList.add('open');
          document.getElementById('sidebar-overlay').classList.add('active');
        });
      }
      document.getElementById('dash-water-btn')?.addEventListener('click', () => {
        UI.navigateTo('tasks');
        UI.toast('Watering task scheduled', 'success');
      });
      document.getElementById('dash-snooze-btn')?.addEventListener('click', () => {
        UI.toast('Water alert snoozed for 2 hours', 'info');
      });
    },

    renderCropHealth(crops) {
      const healthCounts = { Healthy: 0, Warning: 0, Critical: 0 };
      crops.forEach(c => {
        const stage = c.growthStage || 'Healthy';
        if (stage.includes('Critical') || c.status === 'Critical') healthCounts.Critical++;
        else if (stage.includes('Warning') || stage === 'Flowering') healthCounts.Warning++;
        else healthCounts.Healthy++;
      });

      UI.createChart('crop-health-chart', {
        type: 'doughnut',
        data: {
          labels: ['Healthy', 'Warning', 'Critical'],
          datasets: [{
            data: [healthCounts.Healthy, healthCounts.Warning, healthCounts.Critical],
            backgroundColor: ['#52b788', '#e9c46a', '#e76f51'],
            borderWidth: 0
          }]
        },
        options: { cutout: '65%' }
      });
    },

    renderOverview(expenses, income) {
      const months = [];
      const expenseData = [];
      const incomeData = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(Utils.getMonthName(d.getMonth()));
        const m = d.getMonth();
        const y = d.getFullYear();
        expenseData.push(expenses.filter(e => {
          const ed = new Date(e.date);
          return ed.getMonth() === m && ed.getFullYear() === y;
        }).reduce((s, e) => s + Number(e.amount), 0));
        incomeData.push(income.filter(inc => {
          const id = new Date(inc.date);
          return id.getMonth() === m && id.getFullYear() === y;
        }).reduce((s, inc) => s + Number(inc.total), 0));
      }

      UI.createChart('dashboard-overview-chart', {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'Income', data: incomeData, backgroundColor: 'rgba(82,183,136,0.8)', borderRadius: 6 },
            { label: 'Expenses', data: expenseData, backgroundColor: 'rgba(231,111,81,0.8)', borderRadius: 6 }
          ]
        }
      });
    },

    renderActivities() {
      const container = document.getElementById('recent-activities');
      const activities = ActivityLog.getAll().slice(0, 8);
      const icons = {
        crop: 'leaf', expense: 'wallet', income: 'coins',
        task: 'tasks', inventory: 'boxes', default: 'info-circle'
      };
      const colors = {
        crop: '#52b788', expense: '#e76f51', income: '#2a9d8f',
        task: '#9b5de5', inventory: '#f4a261', default: '#48cae4'
      };

      if (!activities.length) {
        container.innerHTML = UI.emptyState('history', 'No recent activities');
        return;
      }

      container.innerHTML = activities.map(a => {
        const type = a.action.split(' ')[0].toLowerCase();
        return `
          <div class="activity-item">
            <div class="activity-icon" style="background:${colors[type] || colors.default}">
              <i class="fas fa-${icons[type] || icons.default}"></i>
            </div>
            <div class="activity-text">
              <strong>${Utils.escapeHtml(a.action)}</strong>
              <small>${Utils.escapeHtml(a.details)} · ${Utils.formatDate(a.timestamp)}</small>
            </div>
          </div>`;
      }).join('');
    }
  };

  // ==========================================
  // CROPS MODULE
  // ==========================================
  const Crops = {
    getAll() {
      return Storage.getUserData(Storage.KEYS.CROPS);
    },

    save(crops) {
      Storage.setUserData(Storage.KEYS.CROPS, crops);
    },

    getFormHtml(crop = {}) {
      return `
        <form id="crop-form">
          <div class="form-row">
            <div class="form-group">
              <label>Crop Name</label>
              <input type="text" name="name" class="form-input" value="${Utils.escapeHtml(crop.name || '')}" required>
            </div>
            <div class="form-group">
              <label>Crop Type</label>
              <select name="type" class="form-select" required>
                ${['Vegetables', 'Fruits', 'Grains', 'Legumes', 'Herbs', 'Other'].map(t =>
        `<option value="${t}" ${crop.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Field Name</label>
              <input type="text" name="fieldName" class="form-input" value="${Utils.escapeHtml(crop.fieldName || '')}" required>
            </div>
            <div class="form-group">
              <label>Quantity</label>
              <input type="text" name="quantity" class="form-input" value="${Utils.escapeHtml(crop.quantity || '')}" placeholder="e.g. 500 kg">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Planting Date</label>
              <input type="date" name="plantingDate" class="form-input" value="${crop.plantingDate || ''}" required>
            </div>
            <div class="form-group">
              <label>Harvest Date</label>
              <input type="date" name="harvestDate" class="form-input" value="${crop.harvestDate || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Growth Stage</label>
              <select name="growthStage" class="form-select">
                ${['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature', 'Harvest Ready'].map(s =>
        `<option value="${s}" ${crop.growthStage === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select name="status" class="form-select">
                ${['Planned', 'Growing', 'Harvested'].map(s =>
        `<option value="${s}" ${crop.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button>
            <button type="submit" class="btn btn-primary">${crop.id ? 'Update' : 'Add'} Crop</button>
          </div>
        </form>`;
    },

    openAddModal() {
      UI.openModal('Add New Crop', this.getFormHtml());
      document.getElementById('crop-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const crops = this.getAll();
        crops.push({
          id: Utils.generateId(),
          name: fd.get('name'),
          type: fd.get('type'),
          fieldName: fd.get('fieldName'),
          quantity: fd.get('quantity'),
          plantingDate: fd.get('plantingDate'),
          harvestDate: fd.get('harvestDate'),
          growthStage: fd.get('growthStage'),
          status: fd.get('status')
        });
        this.save(crops);
        ActivityLog.add('Crop added', fd.get('name'));
        Notifications.add(`New crop "${fd.get('name')}" added`, 'leaf');
        UI.closeModal();
        UI.toast('Crop added successfully', 'success');
        this.render();
      });
    },

    openEditModal(id) {
      const crop = this.getAll().find(c => c.id === id);
      if (!crop) return;
      UI.openModal('Edit Crop', this.getFormHtml(crop));
      document.getElementById('crop-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const crops = this.getAll();
        const idx = crops.findIndex(c => c.id === id);
        Object.assign(crops[idx], {
          name: fd.get('name'),
          type: fd.get('type'),
          fieldName: fd.get('fieldName'),
          quantity: fd.get('quantity'),
          plantingDate: fd.get('plantingDate'),
          harvestDate: fd.get('harvestDate'),
          growthStage: fd.get('growthStage'),
          status: fd.get('status')
        });
        this.save(crops);
        ActivityLog.add('Crop updated', fd.get('name'));
        UI.closeModal();
        UI.toast('Crop updated successfully', 'success');
        this.render();
      });
    },

    delete(id) {
      if (!confirm('Delete this crop?')) return;
      const crops = this.getAll();
      const crop = crops.find(c => c.id === id);
      this.save(crops.filter(c => c.id !== id));
      ActivityLog.add('Crop deleted', crop?.name || '');
      UI.toast('Crop deleted', 'info');
      this.render();
    },

    viewDetails(id) {
      const crop = this.getAll().find(c => c.id === id);
      if (!crop) return;
      UI.openModal(crop.name, `
        <div class="detail-list">
          <div class="detail-item"><span class="detail-label">Type</span><span>${Utils.escapeHtml(crop.type)}</span></div>
          <div class="detail-item"><span class="detail-label">Field</span><span>${Utils.escapeHtml(crop.fieldName)}</span></div>
          <div class="detail-item"><span class="detail-label">Quantity</span><span>${Utils.escapeHtml(crop.quantity || '-')}</span></div>
          <div class="detail-item"><span class="detail-label">Planted</span><span>${Utils.formatDate(crop.plantingDate)}</span></div>
          <div class="detail-item"><span class="detail-label">Harvest</span><span>${Utils.formatDate(crop.harvestDate)}</span></div>
          <div class="detail-item"><span class="detail-label">Growth Stage</span><span>${Utils.escapeHtml(crop.growthStage)}</span></div>
          <div class="detail-item"><span class="detail-label">Status</span><span class="badge badge-${crop.status.toLowerCase()}">${crop.status}</span></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="UI.closeModal()">Close</button>
          <button class="btn btn-primary" onclick="Crops.openEditModal('${id}')">Edit</button>
        </div>`);
    },

    render() {
      const container = document.getElementById('crops-grid');
      const statusFilter = document.getElementById('crop-filter-status')?.value || 'all';
      const search = document.getElementById('crop-search')?.value?.toLowerCase() || '';
      let crops = this.getAll();

      if (statusFilter !== 'all') crops = crops.filter(c => c.status === statusFilter);
      if (search) crops = crops.filter(c =>
        c.name.toLowerCase().includes(search) || c.fieldName.toLowerCase().includes(search));

      if (!crops.length) {
        container.innerHTML = UI.emptyState('seedling', 'No crops found. Add your first crop!');
        return;
      }

      const icons = { Vegetables: 'carrot', Fruits: 'apple-alt', Grains: 'wheat-awn', Legumes: 'seedling', Herbs: 'leaf', Other: 'seedling' };

      container.innerHTML = crops.map(c => `
        <div class="crop-card-photo glass-card glass-dark">
          <div class="crop-card-bg" style="background-image:url('${Utils.getCropImage(c.name, c.type)}')"></div>
          <div class="crop-card-content">
            <div class="item-card-header">
              <div>
                <div class="crop-photo-label" style="position:static;margin-bottom:0.5rem">
                  <i class="fas fa-${icons[c.type] || 'leaf'}"></i>
                  <h4>${Utils.escapeHtml(c.name)}</h4>
                </div>
                <span class="badge badge-${c.status.toLowerCase()}">${c.status}</span>
              </div>
              <div class="item-card-actions">
                <button class="btn-icon" onclick="Crops.viewDetails('${c.id}')" title="View"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="Crops.openEditModal('${c.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="Crops.delete('${c.id}')" title="Delete"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <div class="item-details">
              <div class="detail-row"><span>Field</span>${Utils.escapeHtml(c.fieldName)}</div>
              <div class="detail-row"><span>Stage</span>${Utils.escapeHtml(c.growthStage)}</div>
            </div>
          </div>
        </div>`).join('');
    },

    init() {
      document.getElementById('add-crop-btn').addEventListener('click', () => this.openAddModal());
      document.getElementById('crop-filter-status').addEventListener('change', () => this.render());
      document.getElementById('crop-search').addEventListener('input', () => this.render());
    }
  };

  // ==========================================
  // EXPENSES MODULE
  // ==========================================
  const Expenses = {
    CATEGORIES: ['Seeds', 'Fertilizers', 'Labor', 'Machinery', 'Irrigation', 'Transport', 'Other'],

    getAll() {
      return Storage.getUserData(Storage.KEYS.EXPENSES);
    },

    save(data) {
      Storage.setUserData(Storage.KEYS.EXPENSES, data);
    },

    getFormHtml(expense = {}) {
      return `
        <form id="expense-form">
          <div class="form-group">
            <label>Description</label>
            <input type="text" name="description" class="form-input" value="${Utils.escapeHtml(expense.description || '')}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select name="category" class="form-select" required>
                ${this.CATEGORIES.map(c =>
        `<option value="${c}" ${expense.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Amount (₹)</label>
              <input type="number" name="amount" class="form-input" step="0.01" min="0" value="${expense.amount || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" name="date" class="form-input" value="${expense.date || Utils.today()}" required>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button>
            <button type="submit" class="btn btn-primary">${expense.id ? 'Update' : 'Add'} Expense</button>
          </div>
        </form>`;
    },

    openAddModal() {
      UI.openModal('Add Expense', this.getFormHtml());
      document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const expenses = this.getAll();
        expenses.push({
          id: Utils.generateId(),
          description: fd.get('description'),
          category: fd.get('category'),
          amount: parseFloat(fd.get('amount')),
          date: fd.get('date')
        });
        this.save(expenses);
        ActivityLog.add('Expense added', `${fd.get('description')} - ${Utils.formatCurrency(fd.get('amount'))}`);
        UI.closeModal();
        UI.toast('Expense added', 'success');
        this.render();
        Dashboard.render();
      });
    },

    openEditModal(id) {
      const expense = this.getAll().find(e => e.id === id);
      if (!expense) return;
      UI.openModal('Edit Expense', this.getFormHtml(expense));
      document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const expenses = this.getAll();
        const idx = expenses.findIndex(e => e.id === id);
        Object.assign(expenses[idx], {
          description: fd.get('description'),
          category: fd.get('category'),
          amount: parseFloat(fd.get('amount')),
          date: fd.get('date')
        });
        this.save(expenses);
        UI.closeModal();
        UI.toast('Expense updated', 'success');
        this.render();
        Dashboard.render();
      });
    },

    delete(id) {
      if (!confirm('Delete this expense?')) return;
      this.save(this.getAll().filter(e => e.id !== id));
      UI.toast('Expense deleted', 'info');
      this.render();
      Dashboard.render();
    },

    render() {
      const expenses = this.getAll().sort((a, b) => new Date(b.date) - new Date(a.date));
      const list = document.getElementById('expense-list');

      if (!expenses.length) {
        list.innerHTML = UI.emptyState('wallet', 'No expenses recorded');
      } else {
        list.innerHTML = expenses.map(e => `
          <div class="data-item">
            <div class="data-item-info">
              <h4>${Utils.escapeHtml(e.description)}</h4>
              <p>${e.category} · ${Utils.formatDate(e.date)}</p>
            </div>
            <span class="data-item-amount expense">${Utils.formatCurrency(e.amount)}</span>
            <div class="data-item-actions">
              <button class="btn-icon" onclick="Expenses.openEditModal('${e.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn-icon" onclick="Expenses.delete('${e.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </div>`).join('');
      }

      this.renderCharts(expenses);
    },

    renderCharts(expenses) {
      const now = new Date();
      const months = [];
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(Utils.getMonthName(d.getMonth()));
        data.push(expenses.filter(e => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        }).reduce((s, e) => s + e.amount, 0));
      }

      UI.createChart('expense-monthly-chart', {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Expenses',
            data,
            borderColor: '#e76f51',
            backgroundColor: 'rgba(231,111,81,0.1)',
            fill: true,
            tension: 0.4
          }]
        }
      });

      const catTotals = {};
      this.CATEGORIES.forEach(c => catTotals[c] = 0);
      expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

      UI.createChart('expense-pie-chart', {
        type: 'pie',
        data: {
          labels: Object.keys(catTotals).filter(k => catTotals[k] > 0),
          datasets: [{
            data: Object.values(catTotals).filter(v => v > 0),
            backgroundColor: ['#2d6a4f', '#52b788', '#e9c46a', '#e76f51', '#48cae4', '#9b5de5', '#f4a261']
          }]
        }
      });
    },

    init() {
      document.getElementById('add-expense-btn').addEventListener('click', () => this.openAddModal());
    }
  };

  // ==========================================
  // INCOME MODULE
  // ==========================================
  const Income = {
    getAll() {
      return Storage.getUserData(Storage.KEYS.INCOME);
    },

    save(data) {
      Storage.setUserData(Storage.KEYS.INCOME, data);
    },

    getFormHtml(item = {}) {
      return `
        <form id="income-form">
          <div class="form-row">
            <div class="form-group">
              <label>Crop Sold</label>
              <input type="text" name="cropSold" class="form-input" value="${Utils.escapeHtml(item.cropSold || '')}" required>
            </div>
            <div class="form-group">
              <label>Buyer Name</label>
              <input type="text" name="buyerName" class="form-input" value="${Utils.escapeHtml(item.buyerName || '')}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Quantity Sold</label>
              <input type="text" name="quantitySold" class="form-input" value="${Utils.escapeHtml(item.quantitySold || '')}" required>
            </div>
            <div class="form-group">
              <label>Selling Price (₹)</label>
              <input type="number" name="sellingPrice" class="form-input" step="0.01" min="0" value="${item.sellingPrice || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" name="date" class="form-input" value="${item.date || Utils.today()}" required>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button>
            <button type="submit" class="btn btn-primary">${item.id ? 'Update' : 'Add'} Income</button>
          </div>
        </form>`;
    },

    openAddModal() {
      UI.openModal('Add Income', this.getFormHtml());
      document.getElementById('income-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const price = parseFloat(fd.get('sellingPrice'));
        const items = this.getAll();
        items.push({
          id: Utils.generateId(),
          cropSold: fd.get('cropSold'),
          buyerName: fd.get('buyerName'),
          quantitySold: fd.get('quantitySold'),
          sellingPrice: price,
          total: price,
          date: fd.get('date')
        });
        this.save(items);
        ActivityLog.add('Income recorded', `${fd.get('cropSold')} - ${Utils.formatCurrency(price)}`);
        UI.closeModal();
        UI.toast('Income added', 'success');
        this.render();
        Dashboard.render();
      });
    },

    openEditModal(id) {
      const item = this.getAll().find(i => i.id === id);
      if (!item) return;
      UI.openModal('Edit Income', this.getFormHtml(item));
      document.getElementById('income-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const items = this.getAll();
        const idx = items.findIndex(i => i.id === id);
        const price = parseFloat(fd.get('sellingPrice'));
        Object.assign(items[idx], {
          cropSold: fd.get('cropSold'),
          buyerName: fd.get('buyerName'),
          quantitySold: fd.get('quantitySold'),
          sellingPrice: price,
          total: price,
          date: fd.get('date')
        });
        this.save(items);
        UI.closeModal();
        UI.toast('Income updated', 'success');
        this.render();
        Dashboard.render();
      });
    },

    delete(id) {
      if (!confirm('Delete this income record?')) return;
      this.save(this.getAll().filter(i => i.id !== id));
      UI.toast('Income deleted', 'info');
      this.render();
      Dashboard.render();
    },

    render() {
      const items = this.getAll().sort((a, b) => new Date(b.date) - new Date(a.date));
      const total = items.reduce((s, i) => s + Number(i.total), 0);

      document.getElementById('income-total').textContent = Utils.formatCurrency(total);
      document.getElementById('income-count').textContent = items.length;
      document.getElementById('income-avg').textContent = Utils.formatCurrency(items.length ? total / items.length : 0);

      const list = document.getElementById('income-list');
      if (!items.length) {
        list.innerHTML = UI.emptyState('coins', 'No income recorded');
      } else {
        list.innerHTML = items.map(i => `
          <div class="data-item">
            <div class="data-item-info">
              <h4>${Utils.escapeHtml(i.cropSold)}</h4>
              <p>${Utils.escapeHtml(i.buyerName)} · ${i.quantitySold} · ${Utils.formatDate(i.date)}</p>
            </div>
            <span class="data-item-amount income">${Utils.formatCurrency(i.total)}</span>
            <div class="data-item-actions">
              <button class="btn-icon" onclick="Income.openEditModal('${i.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn-icon" onclick="Income.delete('${i.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </div>`).join('');
      }

      const cropSales = {};
      items.forEach(i => { cropSales[i.cropSold] = (cropSales[i.cropSold] || 0) + i.total; });

      UI.createChart('income-chart', {
        type: 'bar',
        data: {
          labels: Object.keys(cropSales),
          datasets: [{
            label: 'Sales (₹)',
            data: Object.values(cropSales),
            backgroundColor: 'rgba(82,183,136,0.8)',
            borderRadius: 6
          }]
        }
      });
    },

    init() {
      document.getElementById('add-income-btn').addEventListener('click', () => this.openAddModal());
    }
  };

  // ==========================================
  // PROFIT & LOSS MODULE
  // ==========================================
  const ProfitLoss = {
    render() {
      const expenses = Expenses.getAll();
      const income = Income.getAll();
      const period = document.getElementById('profit-period').value;

      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const totalIncome = income.reduce((s, i) => s + i.total, 0);
      const net = totalIncome - totalExpenses;

      document.getElementById('pl-income').textContent = Utils.formatCurrency(totalIncome);
      document.getElementById('pl-expenses').textContent = Utils.formatCurrency(totalExpenses);
      document.getElementById('pl-profit').textContent = Utils.formatCurrency(Math.max(0, net));
      document.getElementById('pl-loss').textContent = Utils.formatCurrency(Math.max(0, -net));

      this.renderCharts(expenses, income, period);
    },

    renderCharts(expenses, income, period) {
      const labels = [];
      const incomeData = [];
      const expenseData = [];
      const profitData = [];
      const now = new Date();

      if (period === 'monthly') {
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(Utils.getMonthName(d.getMonth()));
          const m = d.getMonth(), y = d.getFullYear();
          const inc = income.filter(x => { const dd = new Date(x.date); return dd.getMonth() === m && dd.getFullYear() === y; }).reduce((s, x) => s + x.total, 0);
          const exp = expenses.filter(x => { const dd = new Date(x.date); return dd.getMonth() === m && dd.getFullYear() === y; }).reduce((s, x) => s + x.amount, 0);
          incomeData.push(inc);
          expenseData.push(exp);
          profitData.push(inc - exp);
        }
      } else {
        for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
          labels.push(y.toString());
          const inc = income.filter(x => new Date(x.date).getFullYear() === y).reduce((s, x) => s + x.total, 0);
          const exp = expenses.filter(x => new Date(x.date).getFullYear() === y).reduce((s, x) => s + x.amount, 0);
          incomeData.push(inc);
          expenseData.push(exp);
          profitData.push(inc - exp);
        }
      }

      UI.createChart('profit-trend-chart', {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Net Profit',
            data: profitData,
            borderColor: '#52b788',
            backgroundColor: 'rgba(82,183,136,0.1)',
            fill: true,
            tension: 0.4
          }]
        }
      });

      UI.createChart('profit-comparison-chart', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Income', data: incomeData, backgroundColor: 'rgba(82,183,136,0.8)', borderRadius: 4 },
            { label: 'Expenses', data: expenseData, backgroundColor: 'rgba(231,111,81,0.8)', borderRadius: 4 }
          ]
        }
      });
    },

    init() {
      document.getElementById('profit-period').addEventListener('change', () => this.render());
    }
  };

  // ==========================================
  // INVENTORY MODULE
  // ==========================================
  const Inventory = {
    TYPES: ['seeds', 'fertilizers', 'pesticides', 'equipment'],
    currentTab: 'seeds',

    getAll() {
      return Storage.getUserData(Storage.KEYS.INVENTORY);
    },

    save(data) {
      Storage.setUserData(Storage.KEYS.INVENTORY, data);
    },

    getFormHtml(item = {}) {
      return `
        <form id="inventory-form">
          <div class="form-group">
            <label>Item Name</label>
            <input type="text" name="name" class="form-input" value="${Utils.escapeHtml(item.name || '')}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select name="type" class="form-select">
                ${this.TYPES.map(t =>
        `<option value="${t}" ${(item.type || this.currentTab) === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Quantity</label>
              <input type="number" name="quantity" class="form-input" min="0" value="${item.quantity || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Unit</label>
              <input type="text" name="unit" class="form-input" value="${Utils.escapeHtml(item.unit || 'kg')}" placeholder="kg, liters, units">
            </div>
            <div class="form-group">
              <label>Min Stock Alert</label>
              <input type="number" name="minStock" class="form-input" min="0" value="${item.minStock || 10}">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button>
            <button type="submit" class="btn btn-primary">${item.id ? 'Update' : 'Add'} Item</button>
          </div>
        </form>`;
    },

    openAddModal() {
      UI.openModal('Add Inventory Item', this.getFormHtml());
      document.getElementById('inventory-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const items = this.getAll();
        items.push({
          id: Utils.generateId(),
          name: fd.get('name'),
          type: fd.get('type'),
          quantity: parseInt(fd.get('quantity')),
          unit: fd.get('unit'),
          minStock: parseInt(fd.get('minStock'))
        });
        this.save(items);
        ActivityLog.add('Inventory added', fd.get('name'));
        UI.closeModal();
        UI.toast('Item added', 'success');
        this.render();
      });
    },

    openEditModal(id) {
      const item = this.getAll().find(i => i.id === id);
      if (!item) return;
      UI.openModal('Edit Inventory', this.getFormHtml(item));
      document.getElementById('inventory-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const items = this.getAll();
        const idx = items.findIndex(i => i.id === id);
        Object.assign(items[idx], {
          name: fd.get('name'),
          type: fd.get('type'),
          quantity: parseInt(fd.get('quantity')),
          unit: fd.get('unit'),
          minStock: parseInt(fd.get('minStock'))
        });
        this.save(items);
        UI.closeModal();
        UI.toast('Item updated', 'success');
        this.render();
      });
    },

    delete(id) {
      if (!confirm('Delete this item?')) return;
      this.save(this.getAll().filter(i => i.id !== id));
      UI.toast('Item deleted', 'info');
      this.render();
    },

    renderAlerts(items) {
      const alerts = document.getElementById('stock-alerts');
      const lowStock = items.filter(i => i.quantity <= i.minStock);
      if (!lowStock.length) {
        alerts.innerHTML = '';
        return;
      }
      alerts.innerHTML = lowStock.map(i => `
        <div class="alert-item">
          <i class="fas fa-exclamation-triangle"></i>
          <span><strong>${Utils.escapeHtml(i.name)}</strong> is low on stock (${i.quantity} ${i.unit} remaining)</span>
        </div>`).join('');
    },

    render() {
      const items = this.getAll();
      const filtered = items.filter(i => i.type === this.currentTab);
      const container = document.getElementById('inventory-grid');

      this.renderAlerts(items);

      if (!filtered.length) {
        container.innerHTML = UI.emptyState('boxes', `No ${this.currentTab} in inventory`);
        return;
      }

      container.innerHTML = filtered.map(i => {
        const pct = Math.min(100, (i.quantity / (i.minStock * 3)) * 100);
        const level = i.quantity <= i.minStock ? 'low' : i.quantity <= i.minStock * 2 ? 'medium' : 'high';
        return `
          <div class="item-card glass-card">
            <div class="item-card-header">
              <div>
                <h4>${Utils.escapeHtml(i.name)}</h4>
                ${i.quantity <= i.minStock ? '<span class="badge badge-low-stock">Low Stock</span>' : ''}
              </div>
              <div class="item-card-actions">
                <button class="btn-icon" onclick="Inventory.openEditModal('${i.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="Inventory.delete('${i.id}')"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <div class="item-details">
              <div class="detail-row"><span>Quantity</span>${i.quantity} ${Utils.escapeHtml(i.unit)}</div>
              <div class="detail-row"><span>Min Alert</span>${i.minStock} ${Utils.escapeHtml(i.unit)}</div>
            </div>
            <div class="stock-bar">
              <div class="stock-bar-fill ${level}" style="width:${pct}%"></div>
            </div>
          </div>`;
      }).join('');
    },

    init() {
      document.getElementById('add-inventory-btn').addEventListener('click', () => this.openAddModal());
      document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.inventory-tabs .tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentTab = btn.dataset.tab;
          this.render();
        });
      });
    }
  };

  // ==========================================
  // TASKS MODULE
  // ==========================================
  const Tasks = {
    TYPES: ['Watering', 'Fertilizing', 'Harvesting', 'Maintenance'],
    currentFilter: 'all',

    getAll() {
      return Storage.getUserData(Storage.KEYS.TASKS);
    },

    save(data) {
      Storage.setUserData(Storage.KEYS.TASKS, data);
    },

    getFormHtml(task = {}) {
      return `
        <form id="task-form">
          <div class="form-group">
            <label>Task Title</label>
            <input type="text" name="title" class="form-input" value="${Utils.escapeHtml(task.title || '')}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Task Type</label>
              <select name="type" class="form-select">
                ${this.TYPES.map(t =>
        `<option value="${t}" ${task.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="date" name="dueDate" class="form-input" value="${task.dueDate || Utils.today()}" required>
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" class="form-textarea">${Utils.escapeHtml(task.description || '')}</textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button>
            <button type="submit" class="btn btn-primary">${task.id ? 'Update' : 'Add'} Task</button>
          </div>
        </form>`;
    },

    openAddModal() {
      UI.openModal('Add Task', this.getFormHtml());
      document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const tasks = this.getAll();
        tasks.push({
          id: Utils.generateId(),
          title: fd.get('title'),
          type: fd.get('type'),
          dueDate: fd.get('dueDate'),
          description: fd.get('description'),
          completed: false
        });
        this.save(tasks);
        ActivityLog.add('Task created', fd.get('title'));
        Notifications.add(`New task: ${fd.get('title')}`, 'tasks');
        UI.closeModal();
        UI.toast('Task added', 'success');
        this.render();
      });
    },

    openEditModal(id) {
      const task = this.getAll().find(t => t.id === id);
      if (!task) return;
      UI.openModal('Edit Task', this.getFormHtml(task));
      document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const tasks = this.getAll();
        const idx = tasks.findIndex(t => t.id === id);
        Object.assign(tasks[idx], {
          title: fd.get('title'),
          type: fd.get('type'),
          dueDate: fd.get('dueDate'),
          description: fd.get('description')
        });
        this.save(tasks);
        UI.closeModal();
        UI.toast('Task updated', 'success');
        this.render();
      });
    },

    toggleComplete(id) {
      const tasks = this.getAll();
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      task.completed = !task.completed;
      this.save(tasks);
      if (task.completed) {
        ActivityLog.add('Task completed', task.title);
        UI.toast('Task marked complete', 'success');
      }
      this.render();
    },

    delete(id) {
      if (!confirm('Delete this task?')) return;
      this.save(this.getAll().filter(t => t.id !== id));
      UI.toast('Task deleted', 'info');
      this.render();
    },

    render() {
      let tasks = this.getAll().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      if (this.currentFilter === 'pending') tasks = tasks.filter(t => !t.completed);
      if (this.currentFilter === 'completed') tasks = tasks.filter(t => t.completed);

      const container = document.getElementById('tasks-list');
      const typeClass = { Watering: 'watering', Fertilizing: 'fertilizing', Harvesting: 'harvesting', Maintenance: 'maintenance' };
      const typeIcons = { Watering: 'tint', Fertilizing: 'seedling', Harvesting: 'cut', Maintenance: 'wrench' };

      if (!tasks.length) {
        container.innerHTML = UI.emptyState('tasks', 'No tasks found');
        return;
      }

      container.innerHTML = tasks.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}">
          <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="Tasks.toggleComplete('${t.id}')">
            ${t.completed ? '<i class="fas fa-check" style="font-size:0.7rem"></i>' : ''}
          </div>
          <div class="task-type-icon task-type-${typeClass[t.type]}">
            <i class="fas fa-${typeIcons[t.type]}"></i>
          </div>
          <div class="task-info">
            <div class="task-title">${Utils.escapeHtml(t.title)}</div>
            <div class="task-meta">
              <span><i class="fas fa-tag"></i> ${t.type}</span>
              <span><i class="fas fa-calendar"></i> ${Utils.formatDate(t.dueDate)}</span>
            </div>
          </div>
          <div class="data-item-actions">
            <button class="btn-icon" onclick="Tasks.openEditModal('${t.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-icon" onclick="Tasks.delete('${t.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>`).join('');
    },

    init() {
      document.getElementById('add-task-btn').addEventListener('click', () => this.openAddModal());
      document.querySelectorAll('[data-task-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-task-filter]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentFilter = btn.dataset.taskFilter;
          this.render();
        });
      });
    }
  };

  // ==========================================
  // WEATHER MODULE (Live data via Open-Meteo)
  // ==========================================
  const Weather = {
    data: null,
    loading: false,
    fetchPromise: null,

    DEFAULT_LOCATION: { city: 'New Delhi', lat: 28.6139, lon: 77.209, name: 'New Delhi, India' },

    getLocation() {
      const userId = Auth.getCurrentUserId();
      if (!userId) return { ...this.DEFAULT_LOCATION };
      const all = Storage.get(Storage.KEYS.LOCATION) || {};
      return all[userId] || { ...this.DEFAULT_LOCATION };
    },

    saveLocation(loc) {
      const userId = Auth.getCurrentUserId();
      if (!userId) return;
      const all = Storage.get(Storage.KEYS.LOCATION) || {};
      all[userId] = loc;
      Storage.set(Storage.KEYS.LOCATION, all);
    },

    codeToCondition(code) {
      if (code === 0) return { icon: 'sun', label: 'Clear' };
      if (code <= 2) return { icon: 'sun', label: 'Sunny' };
      if (code <= 3) return { icon: 'cloud-sun', label: 'Partly Cloudy' };
      if (code <= 48) return { icon: 'cloud', label: 'Cloudy' };
      if (code <= 67) return { icon: 'cloud-rain', label: 'Rainy' };
      if (code <= 82) return { icon: 'cloud-showers-heavy', label: 'Showers' };
      return { icon: 'bolt', label: 'Stormy' };
    },

    async geocodeCity(city) {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );
      if (!res.ok) throw new Error('Geocoding failed');
      const json = await res.json();
      if (!json.results?.length) throw new Error('City not found. Try another name.');
      const r = json.results[0];
      const parts = [r.name, r.admin1, r.country].filter(Boolean);
      return {
        city: r.name,
        lat: r.latitude,
        lon: r.longitude,
        name: parts.join(', ')
      };
    },

    async reverseGeocode(lat, lon) {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (!res.ok) throw new Error('Reverse geocode failed');
        const r = await res.json();
        const name = [r.city || r.locality, r.principalSubdivision, r.countryName].filter(Boolean).join(', ');
        return { city: r.city || r.locality || 'My Location', lat, lon, name: name || 'Current Location' };
      } catch {
        return { city: 'My Location', lat, lon, name: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})` };
      }
    },

    async fetchFromAPI(lat, lon, locationName) {
      const url = [
        'https://api.open-meteo.com/v1/forecast?',
        `latitude=${lat}&longitude=${lon}`,
        '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
        '&hourly=temperature_2m,precipitation_probability,soil_moisture_0_to_1cm',
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        '&timezone=auto&forecast_days=5'
      ].join('');

      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API unavailable');
      const json = await res.json();
      const cond = this.codeToCondition(json.current.weather_code);
      const now = new Date();

      const hourlyLabels = [];
      const hourlyTemps = [];
      for (let i = 0; i < json.hourly.time.length && hourlyLabels.length < 7; i++) {
        const t = new Date(json.hourly.time[i]);
        if (t >= now) {
          hourlyLabels.push(t.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true }));
          hourlyTemps.push(Math.round(json.hourly.temperature_2m[i]));
        }
      }

      const soilRaw = json.hourly.soil_moisture_0_to_1cm || [];
      const soilMoistureTrend = soilRaw.slice(0, 12).map(v =>
        v != null ? Math.round(Math.min(100, v * 250)) : 30
      );
      const currentSoil = soilRaw.find(v => v != null);
      const waterLevel = currentSoil != null
        ? Math.round(Math.min(100, currentSoil * 250) * 10) / 10
        : Math.max(20, 100 - (json.daily.precipitation_probability_max?.[0] || 0));

      const rainForecast = json.daily.precipitation_probability_max?.[0] ?? 0;

      const forecast = json.daily.time.map((day, i) => {
        const c = this.codeToCondition(json.daily.weather_code[i]);
        return {
          day: new Date(day).toLocaleDateString('en-IN', { weekday: 'short' }),
          icon: c.icon,
          temp: Math.round((json.daily.temperature_2m_max[i] + json.daily.temperature_2m_min[i]) / 2),
          max: Math.round(json.daily.temperature_2m_max[i]),
          min: Math.round(json.daily.temperature_2m_min[i]),
          rain: json.daily.precipitation_probability_max[i]
        };
      });

      this.data = {
        ...cond,
        temp: Math.round(json.current.temperature_2m),
        humidity: json.current.relative_humidity_2m,
        windSpeed: Math.round(json.current.wind_speed_10m),
        rainForecast,
        waterLevel,
        soilMoistureTrend,
        hourlyLabels,
        hourlyTemps,
        forecast,
        locationName: locationName || '',
        recommendations: []
      };
      this.data.recommendations = this.getRecommendations(cond);
      this.updateLocationUI();
      window.Features?.WeatherAdvanced?.onWeatherUpdate?.(this.data);
      return this.data;
    },

    generateFallback() {
      const conditions = [
        { icon: 'sun', label: 'Sunny', temp: 30 },
        { icon: 'cloud', label: 'Cloudy', temp: 26 }
      ];
      const cond = conditions[0];
      const loc = this.getLocation();
      this.data = {
        ...cond,
        humidity: 65,
        windSpeed: 10,
        rainForecast: 20,
        waterLevel: 35,
        soilMoistureTrend: [30, 32, 34, 33, 35, 36, 34, 33, 32, 31, 30, 29],
        hourlyLabels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM'],
        hourlyTemps: [26, 28, 30, 32, 33, 31, 29],
        forecast: [],
        locationName: loc.name || loc.city,
        recommendations: this.getRecommendations(cond)
      };
      return this.data;
    },

    getRecommendations(cond) {
      const recs = [];
      const label = cond.label || '';
      if (label.includes('Clear') || label.includes('Sunny')) {
        recs.push('Ideal conditions for harvesting dry crops');
        recs.push('Increase irrigation frequency for young plants');
        recs.push('Apply mulch to retain soil moisture');
      } else if (label.includes('Rain') || label.includes('Shower') || label.includes('Storm')) {
        recs.push('Delay fertilizer application until soil dries');
        recs.push('Check drainage systems in fields');
        recs.push('Good time for transplanting seedlings');
      } else {
        recs.push('Moderate conditions — proceed with regular tasks');
        recs.push('Monitor crop health for pest activity');
        recs.push('Suitable for light field work');
      }
      if (this.data?.humidity > 70) {
        recs.push('High humidity — watch for fungal diseases');
      }
      if (this.data?.rainForecast > 60) {
        recs.push('High rain chance — plan irrigation accordingly');
      }
      if (this.data?.waterLevel < 30) {
        recs.push('Low soil moisture — schedule watering soon');
      }
      return recs;
    },

    updateLocationUI() {
      const loc = this.getLocation();
      const label = document.getElementById('weather-location-label');
      const display = document.getElementById('settings-location-display');
      const cityInput = document.getElementById('settings-city');
      const weatherInput = document.getElementById('weather-city-input');
      const text = this.data?.locationName || loc.name || loc.city || 'Unknown';
      if (label) label.textContent = `Live weather for ${text}`;
      if (display) display.textContent = `Current: ${text}`;
      if (cityInput && loc.city) cityInput.value = loc.city;
      if (weatherInput && loc.city) weatherInput.value = loc.city;
    },

    async ensureData(force = false) {
      if (this.data && !force) return this.data;
      if (this.fetchPromise && !force) return this.fetchPromise;

      this.fetchPromise = (async () => {
        this.loading = true;
        try {
          const loc = this.getLocation();
          await this.fetchFromAPI(loc.lat, loc.lon, loc.name || loc.city);
        } catch (err) {
          console.error(err);
          this.generateFallback();
          if (force) UI.toast(err.message || 'Could not load live weather', 'error');
        } finally {
          this.loading = false;
          this.fetchPromise = null;
        }
        return this.data;
      })();

      return this.fetchPromise;
    },

    async setCity(city) {
      if (!city?.trim()) throw new Error('Please enter a city name');
      const loc = await this.geocodeCity(city.trim());
      this.saveLocation(loc);
      this.data = null;
      await this.ensureData(true);
      UI.toast(`Weather updated for ${loc.name}`, 'success');
      return loc;
    },

    async useGeolocation() {
      if (!navigator.geolocation) throw new Error('Geolocation is not supported on this device');
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000
        });
      });
      const { latitude, longitude } = pos.coords;
      const loc = await this.reverseGeocode(latitude, longitude);
      this.saveLocation(loc);
      this.data = null;
      await this.ensureData(true);
      UI.toast(`Location set to ${loc.name}`, 'success');
      return loc;
    },

    renderWidget(containerId, loading = false) {
      const el = document.getElementById(containerId);
      if (!el) return;

      if (loading || (this.loading && !this.data)) {
        el.innerHTML = `
          <div class="widget-header">
            <div class="widget-title"><i class="fas fa-sun"></i> Weather</div>
          </div>
          <div class="weather-loading"><i class="fas fa-spinner fa-spin"></i> Loading live weather...</div>`;
        return;
      }

      const data = this.data || this.generateFallback();
      const loc = this.getLocation();
      el.innerHTML = `
        <div class="widget-header">
          <div class="widget-title"><i class="fas fa-${data.icon}"></i> Weather</div>
          <span class="weather-loc-tag">${Utils.escapeHtml(data.locationName || loc.city)}</span>
        </div>
        <div class="weather-top">
          <div class="weather-temp-big">${data.temp}°C</div>
          <div class="weather-conditions">
            <div><i class="fas fa-cloud"></i> ${data.label}</div>
            <div><i class="fas fa-wind"></i> ${data.windSpeed} km/h</div>
            <div><i class="fas fa-tint"></i> ${data.humidity}%</div>
          </div>
        </div>`;
    },

    async renderDetail() {
      const el = document.getElementById('weather-detail');
      if (!el) return;

      el.innerHTML = `<div class="weather-loading glass-card glass-dark"><i class="fas fa-spinner fa-spin"></i> Fetching live weather...</div>`;
      await this.ensureData();

      const data = this.data || this.generateFallback();
      el.innerHTML = `
        <div class="glass-card glass-dark weather-hero">
          <p class="weather-hero-loc"><i class="fas fa-map-marker-alt"></i> ${Utils.escapeHtml(data.locationName)}</p>
          <i class="fas fa-${data.icon}"></i>
          <div class="weather-temp">${data.temp}°C</div>
          <p>${data.label}</p>
          <div class="weather-forecast">
            ${data.forecast.map(f => `
              <div class="forecast-day">
                <div>${f.day}</div>
                <i class="fas fa-${f.icon}"></i>
                <div>${f.max}° / ${f.min}°</div>
                <small>${f.rain}% rain</small>
              </div>`).join('')}
          </div>
        </div>
        <div class="glass-card glass-dark">
          <h3><i class="fas fa-info-circle"></i> Current Conditions</h3>
          <div class="detail-list">
            <div class="detail-item"><span class="detail-label">Temperature</span><span>${data.temp}°C</span></div>
            <div class="detail-item"><span class="detail-label">Humidity</span><span>${data.humidity}%</span></div>
            <div class="detail-item"><span class="detail-label">Wind Speed</span><span>${data.windSpeed} km/h</span></div>
            <div class="detail-item"><span class="detail-label">Rain Chance Today</span><span>${data.rainForecast}%</span></div>
            <div class="detail-item"><span class="detail-label">Soil Moisture</span><span>${data.waterLevel}%</span></div>
          </div>
        </div>
        <div class="glass-card glass-dark">
          <h3><i class="fas fa-lightbulb"></i> Farming Recommendations</h3>
          <ul class="recommendations">
            ${data.recommendations.map(r => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')}
          </ul>
        </div>`;
    },

    async refresh() {
      this.data = null;
      await this.ensureData(true);
      await this.renderDetail();
      if (document.getElementById('section-dashboard')?.classList.contains('active')) {
        await Dashboard.render();
      }
      UI.toast('Weather refreshed', 'success');
    },

    init() {
      document.getElementById('refresh-weather').addEventListener('click', () => this.refresh());

      document.getElementById('weather-city-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = document.getElementById('weather-city-input').value;
        try {
          await this.setCity(city);
          await this.renderDetail();
          if (document.getElementById('section-dashboard')?.classList.contains('active')) {
            await Dashboard.render();
          }
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });

      document.getElementById('weather-use-location')?.addEventListener('click', async () => {
        try {
          await this.useGeolocation();
          await this.renderDetail();
          if (document.getElementById('section-dashboard')?.classList.contains('active')) {
            await Dashboard.render();
          }
        } catch (err) {
          UI.toast(err.message || 'Could not get your location', 'error');
        }
      });
    }
  };

  // ==========================================
  // REPORTS MODULE
  // ==========================================
  const Reports = {
    generate(type) {
      const user = Auth.getCurrentUser();
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      let title = '', content = '';

      switch (type) {
        case 'crops': {
          title = 'Crop Report';
          const crops = Crops.getAll();
          content = `
            <p><strong>Farm:</strong> ${Utils.escapeHtml(user?.farmName || 'N/A')} | <strong>Date:</strong> ${date}</p>
            <table class="report-table">
              <thead><tr><th>Name</th><th>Type</th><th>Field</th><th>Planted</th><th>Status</th><th>Stage</th></tr></thead>
              <tbody>${crops.map(c => `
                <tr><td>${Utils.escapeHtml(c.name)}</td><td>${c.type}</td><td>${Utils.escapeHtml(c.fieldName)}</td>
                <td>${Utils.formatDate(c.plantingDate)}</td><td>${c.status}</td><td>${c.growthStage}</td></tr>`).join('')}
              </tbody>
            </table>
            <p style="margin-top:1rem"><strong>Total Crops:</strong> ${crops.length} | <strong>Active:</strong> ${crops.filter(c => c.status === 'Growing').length}</p>`;
          break;
        }
        case 'expenses': {
          title = 'Expense Report';
          const expenses = Expenses.getAll();
          const total = expenses.reduce((s, e) => s + e.amount, 0);
          content = `
            <p><strong>Date:</strong> ${date}</p>
            <table class="report-table">
              <thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead>
              <tbody>${expenses.map(e => `
                <tr><td>${Utils.escapeHtml(e.description)}</td><td>${e.category}</td>
                <td>${Utils.formatDate(e.date)}</td><td>${Utils.formatCurrency(e.amount)}</td></tr>`).join('')}
              </tbody>
            </table>
            <p style="margin-top:1rem"><strong>Total Expenses:</strong> ${Utils.formatCurrency(total)}</p>`;
          break;
        }
        case 'income': {
          title = 'Income Report';
          const income = Income.getAll();
          const total = income.reduce((s, i) => s + i.total, 0);
          content = `
            <p><strong>Date:</strong> ${date}</p>
            <table class="report-table">
              <thead><tr><th>Crop</th><th>Buyer</th><th>Quantity</th><th>Date</th><th>Amount</th></tr></thead>
              <tbody>${income.map(i => `
                <tr><td>${Utils.escapeHtml(i.cropSold)}</td><td>${Utils.escapeHtml(i.buyerName)}</td>
                <td>${Utils.escapeHtml(i.quantitySold)}</td><td>${Utils.formatDate(i.date)}</td><td>${Utils.formatCurrency(i.total)}</td></tr>`).join('')}
              </tbody>
            </table>
            <p style="margin-top:1rem"><strong>Total Income:</strong> ${Utils.formatCurrency(total)}</p>`;
          break;
        }
        case 'profit': {
          title = 'Profit & Loss Report';
          const expenses = Expenses.getAll();
          const income = Income.getAll();
          const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
          const totalInc = income.reduce((s, i) => s + i.total, 0);
          const net = totalInc - totalExp;
          content = `
            <p><strong>Date:</strong> ${date}</p>
            <table class="report-table">
              <tr><td><strong>Total Income</strong></td><td style="color:green">${Utils.formatCurrency(totalInc)}</td></tr>
              <tr><td><strong>Total Expenses</strong></td><td style="color:red">${Utils.formatCurrency(totalExp)}</td></tr>
              <tr><td><strong>Net ${net >= 0 ? 'Profit' : 'Loss'}</strong></td><td><strong>${Utils.formatCurrency(Math.abs(net))}</strong></td></tr>
            </table>
            <h4 style="margin-top:1.5rem">Expense Breakdown</h4>
            <table class="report-table">
              <thead><tr><th>Category</th><th>Amount</th></tr></thead>
              <tbody>${Expenses.CATEGORIES.map(c => {
            const amt = expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0);
            return amt ? `<tr><td>${c}</td><td>${Utils.formatCurrency(amt)}</td></tr>` : '';
          }).join('')}
              </tbody>
            </table>`;
          break;
        }
      }

      return { title, content };
    },

    showPreview(type) {
      const report = this.generate(type);
      document.getElementById('report-preview-title').textContent = report.title;
      document.getElementById('report-preview-content').innerHTML = report.content;
      document.getElementById('report-preview').classList.remove('hidden');
    },

    print(type) {
      const report = this.generate(type);
      const printArea = document.getElementById('print-area');
      printArea.innerHTML = `<h1>${report.title}</h1>${report.content}`;
      window.print();
    },

    exportPDF(type) {
      const report = this.generate(type);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(report.title, 14, 22);
      doc.setFontSize(10);
      const temp = document.createElement('div');
      temp.innerHTML = report.content;
      const text = temp.textContent || temp.innerText;
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 14, 35);
      doc.save(`${type}-report-${Utils.today()}.pdf`);
      UI.toast('PDF exported successfully', 'success');
    },

    init() {
      document.querySelectorAll('.print-report').forEach(btn => {
        btn.addEventListener('click', () => this.print(btn.dataset.report));
      });
      document.querySelectorAll('.export-pdf').forEach(btn => {
        btn.addEventListener('click', () => this.exportPDF(btn.dataset.report));
      });
      document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('button')) {
            this.showPreview(card.dataset.report);
          }
        });
      });
      document.getElementById('close-report-preview').addEventListener('click', () => {
        document.getElementById('report-preview').classList.add('hidden');
      });
    }
  };

  // ==========================================
  // SETTINGS MODULE
  // ==========================================
  const Settings = {
    get() {
      const userId = Auth.getCurrentUserId();
      const all = Storage.get(Storage.KEYS.SETTINGS) || {};
      return all[userId] || {
        taskNotif: true,
        stockNotif: true,
        weatherNotif: true,
        language: 'en',
        accentColor: 'green'
      };
    },

    save(settings) {
      const userId = Auth.getCurrentUserId();
      const all = Storage.get(Storage.KEYS.SETTINGS) || {};
      all[userId] = settings;
      Storage.set(Storage.KEYS.SETTINGS, all);
    },

    load() {
      const user = Auth.getCurrentUser();
      if (!user) return;

      document.getElementById('settings-name').value = user.name || '';
      document.getElementById('settings-email').value = user.email || '';
      document.getElementById('settings-phone').value = user.phone || '';
      document.getElementById('settings-farm').value = user.farmName || '';

      const settings = this.get();
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.getElementById('settings-dark-mode').checked = isDark;
      document.getElementById('settings-task-notif').checked = settings.taskNotif;
      document.getElementById('settings-stock-notif').checked = settings.stockNotif;
      document.getElementById('settings-weather-notif').checked = settings.weatherNotif;
      document.getElementById('settings-language').value = settings.language;
      const autoThemeEl = document.getElementById('settings-auto-theme');
      if (autoThemeEl) autoThemeEl.checked = !!settings.autoTheme;
      Weather.updateLocationUI();
    },

    init() {
      document.getElementById('location-settings-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = document.getElementById('settings-city').value;
        try {
          await Weather.setCity(city);
          Weather.updateLocationUI();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });

      document.getElementById('settings-use-gps')?.addEventListener('click', async () => {
        try {
          await Weather.useGeolocation();
          Weather.updateLocationUI();
        } catch (err) {
          UI.toast(err.message || 'Could not get GPS location', 'error');
        }
      });

      document.getElementById('profile-settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        Auth.updateProfile({
          name: document.getElementById('settings-name').value,
          email: document.getElementById('settings-email').value,
          phone: document.getElementById('settings-phone').value,
          farmName: document.getElementById('settings-farm').value
        });
        App.updateUserUI();
        UI.toast('Profile saved', 'success');
      });

      document.getElementById('settings-dark-mode').addEventListener('change', (e) => {
        Theme.set(e.target.checked ? 'dark' : 'light');
      });

      ['settings-task-notif', 'settings-stock-notif', 'settings-weather-notif'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
          this.save({
            ...this.get(),
            taskNotif: document.getElementById('settings-task-notif').checked,
            stockNotif: document.getElementById('settings-stock-notif').checked,
            weatherNotif: document.getElementById('settings-weather-notif').checked,
            language: document.getElementById('settings-language').value
          });
        });
      });

      document.getElementById('settings-language').addEventListener('change', (e) => {
        this.save({ ...this.get(), language: e.target.value });
        UI.toast('Language preference saved', 'info');
      });

      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const colors = { green: '#2d6a4f', emerald: '#059669', teal: '#0d9488' };
          document.documentElement.style.setProperty('--primary', colors[btn.dataset.color]);
          this.save({ ...this.get(), accentColor: btn.dataset.color });
        });
      });
    }
  };

  // ==========================================
  // PROFILE MODULE
  // ==========================================
  const Profile = {
    render() {
      const user = Auth.getCurrentUser();
      if (!user) return;

      document.getElementById('profile-avatar').textContent = Utils.getInitials(user.name);
      document.getElementById('profile-name').textContent = user.name;
      document.getElementById('profile-email').textContent = user.email;
      document.getElementById('profile-phone').textContent = user.phone || 'Not set';
      document.getElementById('profile-farm').textContent = user.farmName || 'Not set';
      document.getElementById('profile-joined').textContent = Utils.formatDate(user.createdAt);
      document.getElementById('profile-crops-count').textContent = Crops.getAll().length;
      document.getElementById('profile-tasks-count').textContent = Tasks.getAll().filter(t => !t.completed).length;
      document.getElementById('profile-farm-name').textContent = user.farmName || '-';
    },

    init() {
      document.getElementById('edit-profile-btn').addEventListener('click', () => {
        UI.navigateTo('settings');
      });
    }
  };

  // ==========================================
  // THEME MODULE
  // ==========================================
  const Theme = {
    get() {
      return Storage.get(Storage.KEYS.THEME) || 'dark';
    },

    set(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      Storage.set(Storage.KEYS.THEME, theme);
      const icon = document.querySelector('#theme-toggle i');
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      const settingsToggle = document.getElementById('settings-dark-mode');
      if (settingsToggle) settingsToggle.checked = theme === 'dark';
    },

    toggle() {
      this.set(this.get() === 'dark' ? 'light' : 'dark');
    },

    init() {
      this.set(this.get());
      document.getElementById('theme-toggle').addEventListener('click', () => this.toggle());
    }
  };

  // ==========================================
  // DEMO DATA SEEDER
  // ==========================================
  const DemoData = {
    seed() {
      if (Crops.getAll().length > 0) return;

      const crops = [
        { id: Utils.generateId(), name: 'Tomatoes', type: 'Vegetables', fieldName: 'North Field', quantity: '500 kg', plantingDate: '2025-03-15', harvestDate: '2025-07-20', growthStage: 'Fruiting', status: 'Growing' },
        { id: Utils.generateId(), name: 'Corn', type: 'Grains', fieldName: 'South Field', quantity: '2 tons', plantingDate: '2025-04-01', harvestDate: '2025-09-15', growthStage: 'Vegetative', status: 'Growing' },
        { id: Utils.generateId(), name: 'Wheat', type: 'Grains', fieldName: 'East Field', quantity: '1.5 tons', plantingDate: '2025-01-10', harvestDate: '2025-06-30', growthStage: 'Mature', status: 'Harvested' }
      ];
      Crops.save(crops);

      Expenses.save([
        { id: Utils.generateId(), description: 'Tomato Seeds', category: 'Seeds', amount: 25000, date: '2025-03-10' },
        { id: Utils.generateId(), description: 'NPK Fertilizer', category: 'Fertilizers', amount: 45000, date: '2025-03-20' },
        { id: Utils.generateId(), description: 'Field Workers', category: 'Labor', amount: 120000, date: '2025-04-05' },
        { id: Utils.generateId(), description: 'Tractor Fuel', category: 'Machinery', amount: 38000, date: '2025-04-15' },
        { id: Utils.generateId(), description: 'Drip Irrigation', category: 'Irrigation', amount: 65000, date: '2025-05-01' }
      ]);

      Income.save([
        { id: Utils.generateId(), cropSold: 'Wheat', buyerName: 'Grain Co.', quantitySold: '500 kg', sellingPrice: 150000, total: 150000, date: '2025-06-15' },
        { id: Utils.generateId(), cropSold: 'Tomatoes', buyerName: 'Fresh Market', quantitySold: '200 kg', sellingPrice: 80000, total: 80000, date: '2025-05-20' }
      ]);

      Inventory.save([
        { id: Utils.generateId(), name: 'Tomato Seeds', type: 'seeds', quantity: 5, unit: 'kg', minStock: 10 },
        { id: Utils.generateId(), name: 'Corn Seeds', type: 'seeds', quantity: 25, unit: 'kg', minStock: 15 },
        { id: Utils.generateId(), name: 'NPK 20-20-20', type: 'fertilizers', quantity: 50, unit: 'kg', minStock: 20 },
        { id: Utils.generateId(), name: 'Organic Pesticide', type: 'pesticides', quantity: 8, unit: 'liters', minStock: 5 },
        { id: Utils.generateId(), name: 'Tractor', type: 'equipment', quantity: 2, unit: 'units', minStock: 1 }
      ]);

      Tasks.save([
        { id: Utils.generateId(), title: 'Water North Field', type: 'Watering', dueDate: Utils.today(), description: 'Irrigate tomato plants', completed: false },
        { id: Utils.generateId(), title: 'Apply Fertilizer', type: 'Fertilizing', dueDate: Utils.today(), description: 'NPK for corn field', completed: false },
        { id: Utils.generateId(), title: 'Harvest Wheat', type: 'Harvesting', dueDate: '2025-06-30', description: 'Complete wheat harvest', completed: true },
        { id: Utils.generateId(), title: 'Tractor Maintenance', type: 'Maintenance', dueDate: '2025-07-01', description: 'Oil change and inspection', completed: false }
      ]);

      ActivityLog.add('System initialized', 'Demo data loaded');
      Notifications.add('Welcome to AgriFarm Pro!', 'seedling');
    }
  };

  // ==========================================
  // SPLASH MODULE
  // ==========================================
  const Splash = {
    hide() {
      const splash = document.getElementById('splash-screen');
      if (!splash) return;
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.5s ease';
      setTimeout(() => splash.classList.add('hidden'), 500);
    },

    showAuth() {
      this.hide();
      document.getElementById('auth-container').classList.remove('hidden');
      Auth.showAuthView('login');
    },

    init() {
      const cta = document.getElementById('splash-cta');
      if (cta) {
        cta.addEventListener('click', () => {
          if (Auth.getCurrentUser()) {
            this.hide();
            App.showApp();
          } else {
            this.showAuth();
          }
        });
      }

      if (Auth.getCurrentUser()) {
        this.hide();
      }
    }
  };

  // ==========================================
  // MAIN APP
  // ==========================================
  const App = {
    showApp() {
      document.getElementById('splash-screen')?.classList.add('hidden');
      document.getElementById('auth-container').classList.add('hidden');
      document.getElementById('app-container').classList.remove('hidden');
      DemoData.seed();
      window.Features?.DemoSeed?.seed?.();
      this.updateUserUI();
      UI.navigateTo('dashboard');
      Notifications.updateBadge();
      document.getElementById('fab-container')?.classList.remove('hidden');
      window.Features?.Onboarding?.maybeStart();
      window.Features?.Irrigation?.autoSchedule();
      if (Notification.permission === 'default') Notification.requestPermission();
    },

    updateUserUI() {
      const user = Auth.getCurrentUser();
      if (!user) return;
      const initials = Utils.getInitials(user.name);
      document.getElementById('topbar-avatar').textContent = initials;
      document.getElementById('topbar-username').textContent = user.name.split(' ')[0];
    },

    renderSection(section) {
      const renderers = {
        dashboard: () => Dashboard.render(),
        crops: () => Crops.render(),
        expenses: () => Expenses.render(),
        income: () => Income.render(),
        profit: () => ProfitLoss.render(),
        inventory: () => Inventory.render(),
        tasks: () => Tasks.render(),
        weather: () => Weather.renderDetail(),
        intelligence: () => window.Features?.Intelligence?.render(),
        livestock: () => window.Features?.Livestock?.render(),
        analytics: () => window.Features?.Analytics?.render(),
        settings: () => Settings.load(),
        profile: () => Profile.render()
      };
      const result = renderers[section]?.();
      if (result?.catch) {
        result.catch(err => {
          console.error(err);
          UI.toast('Something went wrong loading this section', 'error');
        });
      }
    },

    initNavigation() {
      document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          UI.navigateTo(item.dataset.section);
        });
      });

      document.getElementById('profile-btn').addEventListener('click', () => UI.navigateTo('profile'));

      document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebar-overlay').classList.add('active');
      });

      document.getElementById('sidebar-close').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
      });

      document.getElementById('sidebar-overlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
      });
    },

    initModals() {
      document.getElementById('modal-close').addEventListener('click', () => UI.closeModal());
      document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) UI.closeModal();
      });
    },

    initNotifications() {
      document.getElementById('notifications-btn').addEventListener('click', () => {
        const panel = document.getElementById('notification-panel');
        panel.classList.toggle('hidden');
        Notifications.render();
        const notifs = Notifications.getAll();
        notifs.forEach(n => n.read = true);
        Storage.setUserData(Storage.KEYS.NOTIFICATIONS, notifs);
        Notifications.updateBadge();
      });

      document.getElementById('clear-notifications').addEventListener('click', () => {
        Notifications.clear();
      });

      document.addEventListener('click', (e) => {
        const panel = document.getElementById('notification-panel');
        const btn = document.getElementById('notifications-btn');
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
          panel.classList.add('hidden');
        }
      });
    },

    initSearch() {
      document.getElementById('global-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) return;
        const crops = Crops.getAll().filter(c =>
          c.name.toLowerCase().includes(query) || c.fieldName.toLowerCase().includes(query));
        if (crops.length) {
          UI.navigateTo('crops');
          document.getElementById('crop-search').value = query;
          Crops.render();
        }
      });
    },

    init() {
      Theme.init();
      Splash.init();
      Auth.init();
      Dashboard.init();
      Crops.init();
      Expenses.init();
      Income.init();
      ProfitLoss.init();
      Inventory.init();
      Tasks.init();
      Weather.init();
      Reports.init();
      Settings.init();
      Profile.init();
      this.initNavigation();
      this.initModals();
      this.initNotifications();
      this.initSearch();

      if (Auth.getCurrentUser()) {
        this.showApp();
      }
      window.Features?.UX?.init();
    }
  };

  // Expose modules globally
  window.FMS = { Storage, Utils, UI, Auth, Crops, Expenses, Income, Inventory, Tasks, Weather, Notifications, ActivityLog, Dashboard, App };
  window.UI = UI;
  window.Crops = Crops;
  window.Expenses = Expenses;
  window.Income = Income;
  window.Inventory = Inventory;
  window.Tasks = Tasks;

  document.addEventListener('DOMContentLoaded', () => {
    App.init();
    if (window.Features) Features.init();
  });

})();
