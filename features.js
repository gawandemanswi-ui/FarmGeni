/**
 * Digital Agriculture - Extended Features Module
 * Crop intelligence, livestock, analytics, weather advanced, UX enhancements
 */
(function () {
  'use strict';

  const { Storage, Utils, UI, Crops, Expenses, Income, Tasks, Weather, Notifications, ActivityLog, Inventory } = window.FMS || {};
  if (!Storage) return;

  const K = Storage.KEYS;

  // --- Fertilizer recommendation database ---
  const FERTILIZER_DB = {
    Vegetables: { Seedling: 'NPK 19:19:19 @ 50kg/ha', Vegetative: 'Urea @ 40kg/ha', Flowering: 'Potash @ 30kg/ha', Fruiting: 'NPK 13:0:45 @ 25kg/ha', Mature: 'Organic compost @ 2 tons/ha', 'Harvest Ready': 'No fertilizer needed' },
    Fruits: { Seedling: 'FYM @ 10 tons/ha + DAP', Vegetative: 'NPK 12:32:16', Flowering: 'Boron foliar spray', Fruiting: 'Potassium sulphate', Mature: 'Micronutrient mix', 'Harvest Ready': 'Stop fertilization' },
    Grains: { Seedling: 'DAP @ sowing', Vegetative: 'Urea split dose', Flowering: 'NPK top dressing', Fruiting: 'Zinc sulphate if deficient', Mature: 'Monitor only', 'Harvest Ready': '—' },
    Legumes: { Seedling: 'Rhizobium inoculant', Vegetative: 'Low nitrogen NPK', Flowering: 'Phosphorus boost', Fruiting: 'Potash light dose', Mature: '—', 'Harvest Ready': '—' },
    Herbs: { Seedling: 'Compost tea weekly', Vegetative: 'Organic liquid fertilizer', Flowering: 'Seaweed extract', Fruiting: '—', Mature: '—', 'Harvest Ready': '—' },
    Other: { Seedling: 'Balanced NPK', Vegetative: 'As per soil test', Flowering: 'As per soil test', Fruiting: 'As per soil test', Mature: '—', 'Harvest Ready': '—' }
  };

  const ROTATION_DB = {
    Wheat: ['Legumes', 'Vegetables', 'Fallow'],
    Corn: ['Legumes', 'Vegetables', 'Wheat'],
    Tomatoes: ['Onion', 'Garlic', 'Legumes'],
    Rice: ['Legumes', 'Vegetables', 'Fallow'],
    Potato: ['Legumes', 'Cabbage', 'Fallow'],
    default: ['Legumes', 'Vegetables', 'Grains']
  };

  // ==========================================
  // INTELLIGENCE MODULE
  // ==========================================
  const Intelligence = {
    tab: 'pest',

    init() {
      document.querySelectorAll('#intel-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#intel-tabs .tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.tab = btn.dataset.intel;
          this.render();
        });
      });
    },

    render() {
      const el = document.getElementById('intel-content');
      if (!el) return;
      const renderers = { pest: () => this.renderPest(), fertilizer: () => this.renderFertilizer(), yield: () => this.renderYield(), rotation: () => this.renderRotation(), soil: () => this.renderSoil(), irrigation: () => this.renderIrrigation() };
      renderers[this.tab]?.();
    },

    // --- Pest & Disease ---
    getPestLog() { return Storage.getUserData(K.PEST_LOG); },
    savePestLog(d) { Storage.setUserData(K.PEST_LOG, d); },

    renderPest() {
      const el = document.getElementById('intel-content');
      const logs = this.getPestLog().sort((a, b) => new Date(b.date) - new Date(a.date));
      el.innerHTML = `
        <div class="page-header" style="margin-bottom:1rem">
          <p class="subtitle">Log pests, diseases, photos & treatments</p>
          <button class="btn btn-primary" onclick="Features.Intelligence.openPestModal()"><i class="fas fa-plus"></i> Add Record</button>
        </div>
        <div class="cards-grid" id="pest-grid">${logs.length ? logs.map(l => `
          <div class="item-card glass-card glass-dark">
            ${l.photo ? `<img src="${l.photo}" class="pest-photo" alt="pest">` : ''}
            <h4>${Utils.escapeHtml(l.cropName)} — ${Utils.escapeHtml(l.issue)}</h4>
            <p class="text-muted">${Utils.formatDate(l.date)} · ${Utils.escapeHtml(l.severity)}</p>
            <p><strong>Treatment:</strong> ${Utils.escapeHtml(l.treatment)}</p>
            ${l.history ? `<p class="text-muted"><small>History: ${Utils.escapeHtml(l.history)}</small></p>` : ''}
            <div class="data-item-actions">
              <button class="btn-icon" onclick="Features.Intelligence.openPestModal('${l.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn-icon" onclick="Features.Intelligence.deletePest('${l.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </div>`).join('') : UI.emptyState('bug', 'No pest records yet')}</div>`;
    },

    openPestModal(id) {
      const item = id ? this.getPestLog().find(p => p.id === id) : {};
      const crops = Crops.getAll();
      UI.openModal(id ? 'Edit Pest Record' : 'Add Pest / Disease', `
        <form id="pest-form">
          <div class="form-group"><label>Crop</label>
            <select name="cropName" class="form-select" required>
              ${crops.map(c => `<option value="${Utils.escapeHtml(c.name)}" ${item.cropName === c.name ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
              <option value="General">General / Field</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Issue</label><input name="issue" class="form-input" value="${Utils.escapeHtml(item.issue || '')}" placeholder="Aphids, Blight..." required></div>
            <div class="form-group"><label>Severity</label>
              <select name="severity" class="form-select">${['Low', 'Medium', 'High', 'Critical'].map(s => `<option ${item.severity === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-group"><label>Date</label><input type="date" name="date" class="form-input" value="${item.date || Utils.today()}" required></div>
          <div class="form-group"><label>Treatment Applied</label><textarea name="treatment" class="form-textarea" required>${Utils.escapeHtml(item.treatment || '')}</textarea></div>
          <div class="form-group"><label>Treatment History</label><textarea name="history" class="form-textarea" placeholder="Previous treatments...">${Utils.escapeHtml(item.history || '')}</textarea></div>
          <div class="form-group"><label>Photo</label><input type="file" name="photo" accept="image/*" id="pest-photo-input"></div>
          ${item.photo ? `<img src="${item.photo}" style="max-height:80px;border-radius:8px;margin-bottom:1rem">` : ''}
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>`);

      document.getElementById('pest-form').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        let photo = item.photo || '';
        const fileInput = document.getElementById('pest-photo-input');
        if (fileInput?.files[0]) {
          photo = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(fileInput.files[0]); });
        }
        const logs = this.getPestLog();
        const record = { id: id || Utils.generateId(), cropName: fd.get('cropName'), issue: fd.get('issue'), severity: fd.get('severity'), date: fd.get('date'), treatment: fd.get('treatment'), history: fd.get('history'), photo };
        if (id) { const i = logs.findIndex(p => p.id === id); logs[i] = record; } else logs.push(record);
        this.savePestLog(logs);
        ActivityLog.add('Pest logged', record.issue);
        UI.closeModal(); UI.toast('Pest record saved', 'success'); this.render();
      };
    },

    deletePest(id) {
      if (!confirm('Delete this record?')) return;
      this.savePestLog(this.getPestLog().filter(p => p.id !== id));
      UI.toast('Record deleted', 'info'); this.render();
    },

    // --- Fertilizer Schedule ---
    renderFertilizer() {
      const el = document.getElementById('intel-content');
      const crops = Crops.getAll().filter(c => c.status === 'Growing');
      el.innerHTML = `
        <p class="subtitle" style="margin-bottom:1rem">Auto-suggested schedules based on crop type & growth stage</p>
        <div class="cards-grid">${crops.length ? crops.map(c => {
        const rec = FERTILIZER_DB[c.type]?.[c.growthStage] || FERTILIZER_DB.Other[c.growthStage] || 'Consult agronomist';
        return `<div class="glass-card glass-dark item-card">
          <h4>${Utils.escapeHtml(c.name)} <span class="badge badge-growing">${c.growthStage}</span></h4>
          <p class="text-muted">${c.type} · ${Utils.escapeHtml(c.fieldName)}</p>
          <div class="recommendation-box"><i class="fas fa-flask"></i> ${rec}</div>
          <button class="btn btn-outline btn-sm" onclick="Features.Intelligence.addFertTask('${c.id}')"><i class="fas fa-tasks"></i> Create Task</button>
        </div>`;
      }).join('') : UI.emptyState('seedling', 'No active crops for fertilizer scheduling')}</div>`;
    },

    addFertTask(cropId) {
      const c = Crops.getAll().find(x => x.id === cropId);
      if (!c) return;
      const rec = FERTILIZER_DB[c.type]?.[c.growthStage] || 'Apply fertilizer';
      const tasks = Tasks.getAll();
      tasks.push({ id: Utils.generateId(), title: `Fertilize ${c.name}`, type: 'Fertilizing', dueDate: Utils.today(), description: rec, completed: false });
      Storage.setUserData(K.TASKS, tasks);
      UI.toast('Fertilizer task created', 'success');
    },

    // --- Yield Prediction ---
    getYieldHistory() { return Storage.getUserData(K.YIELD_HISTORY); },
    saveYieldHistory(d) { Storage.setUserData(K.YIELD_HISTORY, d); },

    renderYield() {
      const el = document.getElementById('intel-content');
      const crops = Crops.getAll();
      const history = this.getYieldHistory();
      el.innerHTML = `
        <div class="page-header" style="margin-bottom:1rem">
          <p class="subtitle">Predictions from past harvest data</p>
          <button class="btn btn-primary" onclick="Features.Intelligence.openYieldModal()"><i class="fas fa-plus"></i> Log Harvest</button>
        </div>
        <div class="cards-grid">${crops.map(c => {
        const past = history.filter(h => h.cropName.toLowerCase() === c.name.toLowerCase());
        const avg = past.length ? past.reduce((s, h) => s + h.yieldKg, 0) / past.length : null;
        const stageFactor = { Seedling: 0.1, Vegetative: 0.3, Flowering: 0.6, Fruiting: 0.85, Mature: 0.95, 'Harvest Ready': 1 }[c.growthStage] || 0.5;
        const predicted = avg ? Math.round(avg * stageFactor) : Math.round(Utils.parseHectares(c.quantity) * 500 * stageFactor);
        return `<div class="glass-card glass-dark">
          <h4>${Utils.escapeHtml(c.name)}</h4>
          <p class="text-muted">${c.fieldName} · ${c.growthStage}</p>
          <div class="yield-predict"><span class="yield-num">${predicted.toLocaleString('en-IN')}</span><small>kg predicted</small></div>
          <p class="text-muted">${past.length ? `Based on ${past.length} past harvest(s), avg ${Math.round(avg)} kg` : 'Estimated from field size'}</p>
        </div>`;
      }).join('') || UI.emptyState('chart-line', 'Add crops to see yield predictions')}</div>
        <h3 style="margin-top:1.5rem">Harvest History</h3>
        <div class="data-list">${history.length ? history.map(h => `
          <div class="data-item glass-dark"><div><h4>${Utils.escapeHtml(h.cropName)}</h4><p>${h.yieldKg} kg · ${Utils.formatDate(h.date)}</p></div></div>`).join('') : '<p class="text-muted">No harvest records</p>'}</div>`;
    },

    openYieldModal() {
      const crops = Crops.getAll();
      UI.openModal('Log Harvest Yield', `
        <form id="yield-form">
          <div class="form-group"><label>Crop</label><select name="cropName" class="form-select">${crops.map(c => `<option>${Utils.escapeHtml(c.name)}</option>`).join('')}</select></div>
          <div class="form-row">
            <div class="form-group"><label>Yield (kg)</label><input type="number" name="yieldKg" class="form-input" min="0" required></div>
            <div class="form-group"><label>Date</label><input type="date" name="date" class="form-input" value="${Utils.today()}" required></div>
          </div>
          <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="UI.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>`);
      document.getElementById('yield-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const h = this.getYieldHistory();
        h.push({ id: Utils.generateId(), cropName: fd.get('cropName'), yieldKg: parseFloat(fd.get('yieldKg')), date: fd.get('date') });
        this.saveYieldHistory(h);
        UI.closeModal(); UI.toast('Harvest logged', 'success'); this.render();
      };
    },

    // --- Crop Rotation ---
    renderRotation() {
      const el = document.getElementById('intel-content');
      const fields = [...new Set(Crops.getAll().map(c => c.fieldName))];
      el.innerHTML = `<p class="subtitle" style="margin-bottom:1rem">Suggested next-season crops per field</p>
        <div class="cards-grid">${fields.length ? fields.map(field => {
        const current = Crops.getAll().filter(c => c.fieldName === field);
        const lastCrop = current[0]?.name || 'Unknown';
        const key = Object.keys(ROTATION_DB).find(k => lastCrop.toLowerCase().includes(k.toLowerCase())) || 'default';
        const suggestions = ROTATION_DB[key] || ROTATION_DB.default;
        return `<div class="glass-card glass-dark">
          <h4><i class="fas fa-map-marker-alt"></i> ${Utils.escapeHtml(field)}</h4>
          <p class="text-muted">Current: ${Utils.escapeHtml(lastCrop)}</p>
          <h5 style="margin:0.75rem 0 0.5rem">Next Season — Plant:</h5>
          <ul class="rotation-list">${suggestions.map((s, i) => `<li><span class="rotation-rank">${i + 1}</span> ${s}</li>`).join('')}</ul>
        </div>`;
      }).join('') : UI.emptyState('sync-alt', 'Add crops with field names to see rotation plans')}</div>`;
    },

    // --- Soil Tests ---
    getSoilTests() { return Storage.getUserData(K.SOIL_TESTS); },
    saveSoilTests(d) { Storage.setUserData(K.SOIL_TESTS, d); },

    soilRecommendations(pH, n, p, k) {
      const recs = [];
      if (pH < 6) recs.push('Soil is acidic — apply agricultural lime');
      if (pH > 7.5) recs.push('Soil is alkaline — apply gypsum or sulphur');
      if (n < 40) recs.push('Low Nitrogen — apply urea or organic manure');
      if (p < 20) recs.push('Low Phosphorus — apply DAP or single super phosphate');
      if (k < 150) recs.push('Low Potassium — apply MOP (Muriate of Potash)');
      if (!recs.length) recs.push('Soil nutrients look balanced — maintain organic matter');
      return recs;
    },

    renderSoil() {
      const el = document.getElementById('intel-content');
      const tests = this.getSoilTests().sort((a, b) => new Date(b.date) - new Date(a.date));
      el.innerHTML = `
        <div class="page-header" style="margin-bottom:1rem">
          <p class="subtitle">pH, NPK levels & recommendations</p>
          <button class="btn btn-primary" onclick="Features.Intelligence.openSoilModal()"><i class="fas fa-plus"></i> Add Soil Test</button>
        </div>
        <div class="cards-grid">${tests.length ? tests.map(t => {
        const recs = this.soilRecommendations(t.pH, t.nitrogen, t.phosphorus, t.potassium);
        return `<div class="glass-card glass-dark">
          <h4>${Utils.escapeHtml(t.fieldName)}</h4>
          <p class="text-muted">${Utils.formatDate(t.date)}</p>
          <div class="soil-metrics">
            <span>pH: <strong>${t.pH}</strong></span>
            <span>N: <strong>${t.nitrogen}</strong></span>
            <span>P: <strong>${t.phosphorus}</strong></span>
            <span>K: <strong>${t.potassium}</strong></span>
          </div>
          <ul class="recommendations">${recs.map(r => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')}</ul>
          <button class="btn-icon" onclick="Features.Intelligence.deleteSoil('${t.id}')"><i class="fas fa-trash"></i></button>
        </div>`;
      }).join('') : UI.emptyState('flask', 'No soil test records')}</div>`;
    },

    openSoilModal() {
      const fields = [...new Set(Crops.getAll().map(c => c.fieldName))];
      UI.openModal('Add Soil Test', `
        <form id="soil-form">
          <div class="form-group"><label>Field</label>
            <input name="fieldName" class="form-input" list="field-list" required>
            <datalist id="field-list">${fields.map(f => `<option value="${Utils.escapeHtml(f)}">`).join('')}</datalist>
          </div>
          <div class="form-row">
            <div class="form-group"><label>pH</label><input type="number" step="0.1" name="pH" class="form-input" min="4" max="9" required></div>
            <div class="form-group"><label>Nitrogen (kg/ha)</label><input type="number" name="nitrogen" class="form-input" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Phosphorus (kg/ha)</label><input type="number" name="phosphorus" class="form-input" required></div>
            <div class="form-group"><label>Potassium (kg/ha)</label><input type="number" name="potassium" class="form-input" required></div>
          </div>
          <div class="form-group"><label>Date</label><input type="date" name="date" class="form-input" value="${Utils.today()}" required></div>
          <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="UI.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>`);
      document.getElementById('soil-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const tests = this.getSoilTests();
        tests.push({ id: Utils.generateId(), fieldName: fd.get('fieldName'), pH: parseFloat(fd.get('pH')), nitrogen: parseFloat(fd.get('nitrogen')), phosphorus: parseFloat(fd.get('phosphorus')), potassium: parseFloat(fd.get('potassium')), date: fd.get('date') });
        this.saveSoilTests(tests);
        UI.closeModal(); UI.toast('Soil test saved', 'success'); this.render();
      };
    },

    deleteSoil(id) {
      if (!confirm('Delete?')) return;
      this.saveSoilTests(this.getSoilTests().filter(t => t.id !== id));
      this.render();
    },

    renderIrrigation() {
      const el = document.getElementById('intel-content');
      const data = Weather.data;
      const moisture = data?.waterLevel ?? 50;
      const rain = data?.rainForecast ?? 0;
      const needsWater = moisture < 35 && rain < 50;
      el.innerHTML = `
        <div class="glass-card glass-dark">
          <h3><i class="fas fa-tint"></i> Smart Irrigation Scheduler</h3>
          <p>Based on live soil moisture (${moisture}%) and rain forecast (${rain}%)</p>
          <div class="alert-item ${needsWater ? '' : 'alert-ok'}" style="margin:1rem 0">
            <i class="fas fa-${needsWater ? 'exclamation-triangle' : 'check-circle'}"></i>
            <span>${needsWater ? 'Irrigation recommended today' : 'No irrigation needed — adequate moisture or rain expected'}</span>
          </div>
          <button class="btn btn-primary" onclick="Features.Irrigation.autoSchedule(true)"><i class="fas fa-sync"></i> Auto-Schedule Tasks</button>
        </div>
        <div id="irrigation-schedule-list" class="data-list" style="margin-top:1rem"></div>`;
      const tasks = Tasks.getAll().filter(t => t.type === 'Watering' && !t.completed);
      document.getElementById('irrigation-schedule-list').innerHTML = tasks.length
        ? tasks.map(t => `<div class="data-item glass-dark"><div><h4>${Utils.escapeHtml(t.title)}</h4><p>${Utils.formatDate(t.dueDate)}</p></div></div>`).join('')
        : '<p class="text-muted">No pending irrigation tasks</p>';
    }
  };

  // ==========================================
  // IRRIGATION AUTO-SCHEDULER
  // ==========================================
  const Irrigation = {
    autoSchedule(manual = false) {
      const data = Weather.data;
      if (!data) { if (manual) UI.toast('Load weather data first', 'error'); return; }
      const moisture = data.waterLevel ?? 50;
      const rain = data.rainForecast ?? 0;
      if (moisture >= 35 || rain >= 70) {
        if (manual) UI.toast('No irrigation needed right now', 'info');
        return;
      }
      const crops = Crops.getAll().filter(c => c.status === 'Growing');
      const tasks = Tasks.getAll();
      let added = 0;
      crops.forEach(c => {
        const exists = tasks.some(t => t.title.includes(c.fieldName) && t.type === 'Watering' && t.dueDate === Utils.today() && !t.completed);
        if (!exists) {
          tasks.push({ id: Utils.generateId(), title: `Irrigate ${c.fieldName} — ${c.name}`, type: 'Watering', dueDate: Utils.today(), description: `Auto: soil ${moisture}%, rain ${rain}%`, completed: false });
          added++;
        }
      });
      if (added) {
        Storage.setUserData(K.TASKS, tasks);
        Notifications.add(`Irrigation scheduled for ${added} field(s)`, 'tint');
        if (manual) UI.toast(`${added} irrigation task(s) created`, 'success');
      } else if (manual) UI.toast('Tasks already scheduled', 'info');
    }
  };

  // ==========================================
  // LIVESTOCK MODULE
  // ==========================================
  const Livestock = {
    tab: 'animals',

    init() {
      document.querySelectorAll('#livestock-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#livestock-tabs .tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.tab = btn.dataset.livestock;
          this.render();
        });
      });
      document.getElementById('livestock-add-btn')?.addEventListener('click', () => {
        if (this.tab === 'animals') this.openAnimalModal();
        else if (this.tab === 'milk') this.openMilkModal();
        else if (this.tab === 'vaccination') this.openVaccModal();
        else if (this.tab === 'breeding') this.openBreedModal();
        else Inventory.openAddModal();
      });
    },

    getAnimals() { return Storage.getUserData(K.LIVESTOCK); },
    saveAnimals(d) { Storage.setUserData(K.LIVESTOCK, d); },
    getMilk() { return Storage.getUserData(K.MILK_LOG); },
    saveMilk(d) { Storage.setUserData(K.MILK_LOG, d); },
    getVacc() { return Storage.getUserData(K.VACCINATIONS); },
    saveVacc(d) { Storage.setUserData(K.VACCINATIONS, d); },
    getBreed() { return Storage.getUserData(K.BREEDING); },
    saveBreed(d) { Storage.setUserData(K.BREEDING, d); },

    render() {
      const renderers = { animals: () => this.renderAnimals(), milk: () => this.renderMilk(), feed: () => this.renderFeed(), vaccination: () => this.renderVacc(), breeding: () => this.renderBreed() };
      renderers[this.tab]?.();
      const btn = document.getElementById('livestock-add-btn');
      if (btn) btn.style.display = this.tab === 'feed' ? 'none' : '';
    },

    renderAnimals() {
      const el = document.getElementById('livestock-content');
      const animals = this.getAnimals();
      el.innerHTML = `<div class="cards-grid">${animals.length ? animals.map(a => `
        <div class="glass-card glass-dark item-card">
          <h4><i class="fas fa-${a.type === 'Poultry' ? 'egg' : 'paw'}"></i> ${Utils.escapeHtml(a.name)}</h4>
          <span class="badge badge-${a.health === 'Healthy' ? 'healthy' : 'warning'}">${a.health}</span>
          <div class="item-details">
            <div class="detail-row"><span>Type</span>${a.type}</div>
            <div class="detail-row"><span>Age</span>${a.age} yrs</div>
            <div class="detail-row"><span>Weight</span>${a.weight} kg</div>
            <div class="detail-row"><span>Tag</span>${Utils.escapeHtml(a.tag || '-')}</div>
          </div>
          <div class="data-item-actions">
            <button class="btn-icon" onclick="Features.Livestock.openAnimalModal('${a.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-icon" onclick="Features.Livestock.deleteAnimal('${a.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>`).join('') : UI.emptyState('horse', 'No animals registered')}</div>`;
    },

    openAnimalModal(id) {
      const a = id ? this.getAnimals().find(x => x.id === id) : {};
      UI.openModal(id ? 'Edit Animal' : 'Add Animal', `
        <form id="animal-form">
          <div class="form-row">
            <div class="form-group"><label>Name</label><input name="name" class="form-input" value="${Utils.escapeHtml(a.name || '')}" required></div>
            <div class="form-group"><label>Type</label><select name="type" class="form-select">${['Cattle', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Other'].map(t => `<option ${a.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Age (years)</label><input type="number" name="age" class="form-input" value="${a.age || ''}"></div>
            <div class="form-group"><label>Weight (kg)</label><input type="number" name="weight" class="form-input" value="${a.weight || ''}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Health</label><select name="health" class="form-select">${['Healthy', 'Sick', 'Recovering', 'Under Treatment'].map(h => `<option ${a.health === h ? 'selected' : ''}>${h}</option>`).join('')}</select></div>
            <div class="form-group"><label>Tag ID</label><input name="tag" class="form-input" value="${Utils.escapeHtml(a.tag || '')}"></div>
          </div>
          <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="UI.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>`);
      document.getElementById('animal-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const list = this.getAnimals();
        const rec = { id: id || Utils.generateId(), name: fd.get('name'), type: fd.get('type'), age: fd.get('age'), weight: fd.get('weight'), health: fd.get('health'), tag: fd.get('tag') };
        if (id) { const i = list.findIndex(x => x.id === id); list[i] = rec; } else list.push(rec);
        this.saveAnimals(list); UI.closeModal(); UI.toast('Animal saved', 'success'); this.render();
      };
    },

    deleteAnimal(id) { if (confirm('Delete?')) { this.saveAnimals(this.getAnimals().filter(a => a.id !== id)); this.render(); } },

    renderMilk() {
      const el = document.getElementById('livestock-content');
      const logs = this.getMilk().sort((a, b) => new Date(b.date) - new Date(a.date));
      const total = logs.reduce((s, l) => s + l.liters, 0);
      el.innerHTML = `
        <div class="stat-pill glass-dark" style="display:inline-block;margin-bottom:1rem"><span>${total.toFixed(1)} L</span><small>Total Recorded</small></div>
        <div class="data-list">${logs.length ? logs.map(l => `
          <div class="data-item glass-dark"><div><h4>${Utils.escapeHtml(l.animalName)}</h4><p>${l.liters} L · ${Utils.formatDate(l.date)} · ${l.session}</p></div>
          <button class="btn-icon" onclick="Features.Livestock.deleteMilk('${l.id}')"><i class="fas fa-trash"></i></button></div>`).join('') : UI.emptyState('glass-whiskey', 'No milk records')}</div>`;
    },

    openMilkModal() {
      const animals = this.getAnimals().filter(a => ['Cattle', 'Buffalo', 'Goat'].includes(a.type));
      UI.openModal('Log Milk Production', `
        <form id="milk-form">
          <div class="form-group"><label>Animal</label><select name="animalName" class="form-select">${animals.map(a => `<option>${Utils.escapeHtml(a.name)}</option>`).join('') || '<option>General</option>'}</select></div>
          <div class="form-row">
            <div class="form-group"><label>Liters</label><input type="number" step="0.1" name="liters" class="form-input" required></div>
            <div class="form-group"><label>Session</label><select name="session" class="form-select"><option>Morning</option><option>Evening</option></select></div>
          </div>
          <div class="form-group"><label>Date</label><input type="date" name="date" class="form-input" value="${Utils.today()}"></div>
          <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="UI.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>`);
      document.getElementById('milk-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const logs = this.getMilk();
        logs.push({ id: Utils.generateId(), animalName: fd.get('animalName'), liters: parseFloat(fd.get('liters')), session: fd.get('session'), date: fd.get('date') });
        this.saveMilk(logs); UI.closeModal(); UI.toast('Milk logged', 'success'); this.render();
      };
    },

    deleteMilk(id) { this.saveMilk(this.getMilk().filter(l => l.id !== id)); this.render(); },

    renderFeed() {
      const el = document.getElementById('livestock-content');
      const feed = Inventory.getAll().filter(i => i.type === 'fertilizers' || i.name.toLowerCase().includes('feed') || i.type === 'equipment');
      const animals = this.getAnimals();
      const dailyNeed = animals.length * 5;
      el.innerHTML = `
        <p class="subtitle">Feed stock linked to inventory · Est. ${dailyNeed} kg/day for ${animals.length} animal(s)</p>
        <div class="cards-grid">${feed.length ? feed.map(i => `
          <div class="glass-card glass-dark"><h4>${Utils.escapeHtml(i.name)}</h4><p>${i.quantity} ${i.unit}</p>
          ${i.quantity <= i.minStock ? '<span class="badge badge-low-stock">Low Stock</span>' : ''}</div>`).join('') : UI.emptyState('boxes', 'Add feed items in Inventory')}</div>
        <button class="btn btn-outline" style="margin-top:1rem" onclick="UI.navigateTo('inventory')">Manage Inventory</button>`;
    },

    renderVacc() {
      const el = document.getElementById('livestock-content');
      const vaccs = this.getVacc().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      const today = Utils.today();
      el.innerHTML = `<div class="data-list">${vaccs.length ? vaccs.map(v => {
        const overdue = v.dueDate < today && !v.completed;
        return `<div class="data-item glass-dark ${overdue ? 'alert-border' : ''}"><div>
          <h4>${Utils.escapeHtml(v.animalName)} — ${Utils.escapeHtml(v.vaccine)}</h4>
          <p>Due: ${Utils.formatDate(v.dueDate)} ${v.completed ? '✓ Done' : overdue ? '⚠ Overdue' : ''}</p>
        </div><div class="data-item-actions">
          ${!v.completed ? `<button class="btn btn-sm btn-primary" onclick="Features.Livestock.completeVacc('${v.id}')">Mark Done</button>` : ''}
          <button class="btn-icon" onclick="Features.Livestock.deleteVacc('${v.id}')"><i class="fas fa-trash"></i></button>
        </div></div>`;
      }).join('') : UI.emptyState('syringe', 'No vaccination schedules')}</div>`;
    },

    openVaccModal() {
      const animals = this.getAnimals();
      UI.openModal('Add Vaccination', `
        <form id="vacc-form">
          <div class="form-group"><label>Animal</label><select name="animalName" class="form-select">${animals.map(a => `<option>${Utils.escapeHtml(a.name)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Vaccine</label><input name="vaccine" class="form-input" placeholder="FMD, Brucellosis..." required></div>
          <div class="form-group"><label>Due Date</label><input type="date" name="dueDate" class="form-input" required></div>
          <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="UI.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>`);
      document.getElementById('vacc-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const list = this.getVacc();
        list.push({ id: Utils.generateId(), animalName: fd.get('animalName'), vaccine: fd.get('vaccine'), dueDate: fd.get('dueDate'), completed: false });
        this.saveVacc(list); UI.closeModal(); UI.toast('Vaccination scheduled', 'success'); this.render();
      };
    },

    completeVacc(id) {
      const list = this.getVacc();
      const v = list.find(x => x.id === id);
      if (v) { v.completed = true; v.completedDate = Utils.today(); this.saveVacc(list); Notifications.add(`Vaccination done: ${v.vaccine}`, 'syringe'); this.render(); }
    },

    deleteVacc(id) { this.saveVacc(this.getVacc().filter(v => v.id !== id)); this.render(); },

    renderBreed() {
      const el = document.getElementById('livestock-content');
      const records = this.getBreed().sort((a, b) => new Date(b.date) - new Date(a.date));
      el.innerHTML = `<div class="data-list">${records.length ? records.map(r => `
        <div class="data-item glass-dark"><div>
          <h4>${Utils.escapeHtml(r.female)} × ${Utils.escapeHtml(r.male)}</h4>
          <p>${Utils.escapeHtml(r.method)} · ${Utils.formatDate(r.date)} · Expected: ${Utils.formatDate(r.expectedDate)}</p>
          <p class="text-muted">Status: ${r.status}</p>
        </div><button class="btn-icon" onclick="Features.Livestock.deleteBreed('${r.id}')"><i class="fas fa-trash"></i></button></div>`).join('') : UI.emptyState('dna', 'No breeding records')}</div>`;
    },

    openBreedModal() {
      const animals = this.getAnimals();
      const females = animals.map(a => a.name);
      UI.openModal('Add Breeding Record', `
        <form id="breed-form">
          <div class="form-row">
            <div class="form-group"><label>Female</label><select name="female" class="form-select">${females.map(n => `<option>${Utils.escapeHtml(n)}</option>`).join('')}</select></div>
            <div class="form-group"><label>Male</label><input name="male" class="form-input" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Method</label><select name="method" class="form-select"><option>Natural</option><option>AI (Artificial Insemination)</option></select></div>
            <div class="form-group"><label>Date</label><input type="date" name="date" class="form-input" value="${Utils.today()}"></div>
          </div>
          <div class="form-group"><label>Expected Calving/Birth</label><input type="date" name="expectedDate" class="form-input" required></div>
          <div class="form-group"><label>Status</label><select name="status" class="form-select"><option>Pregnant</option><option>Pending</option><option>Delivered</option></select></div>
          <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="UI.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>`);
      document.getElementById('breed-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const list = this.getBreed();
        list.push({ id: Utils.generateId(), female: fd.get('female'), male: fd.get('male'), method: fd.get('method'), date: fd.get('date'), expectedDate: fd.get('expectedDate'), status: fd.get('status') });
        this.saveBreed(list); UI.closeModal(); UI.toast('Breeding record saved', 'success'); this.render();
      };
    },

    deleteBreed(id) { this.saveBreed(this.getBreed().filter(r => r.id !== id)); this.render(); }
  };

  // ==========================================
  // WEATHER ADVANCED
  // ==========================================
  const WeatherAdvanced = {
    onWeatherUpdate(data) {
      this.recordSnapshot(data);
      this.checkAlerts(data);
      if (document.getElementById('section-weather')?.classList.contains('active')) {
        this.renderHistoryChart();
        this.renderAlerts(data);
      }
    },

    recordSnapshot(data) {
      if (!data) return;
      const history = Storage.getUserData(K.WEATHER_HISTORY);
      const today = Utils.today();
      const existing = history.findIndex(h => h.date === today);
      const snap = { date: today, temp: data.temp, humidity: data.humidity, rain: data.rainForecast, wind: data.windSpeed };
      if (existing >= 0) history[existing] = snap; else history.push(snap);
      if (history.length > 30) history.splice(0, history.length - 30);
      Storage.setUserData(K.WEATHER_HISTORY, history);
    },

    checkAlerts(data) {
      const settings = Storage.get(Storage.KEYS.SETTINGS)?.[window.FMS.Auth.getCurrentUserId()] || {};
      if (settings.weatherNotif === false) return;

      if (data.rainForecast > 70) {
        this.pushAlert('Rain Alert', `${data.rainForecast}% rain chance today — delay spraying`, 'cloud-rain');
      }
      if (data.temp <= 5) {
        this.pushAlert('Frost Warning', `Temperature ${data.temp}°C — protect sensitive crops`, 'snowflake');
      }
      if (data.temp >= 38) {
        this.pushAlert('Heat Wave', `Temperature ${data.temp}°C — increase irrigation`, 'temperature-high');
      }
    },

    pushAlert(title, body, icon) {
      Notifications.add(`${title}: ${body}`, icon || 'bell');
      if (Notification.permission === 'granted') {
        try { new Notification(title, { body, icon: '/favicon.ico' }); } catch {}
      }
    },

    renderAlerts(data) {
      const bar = document.getElementById('weather-alerts-bar');
      if (!bar || !data) return;
      const alerts = [];
      if (data.rainForecast > 70) alerts.push({ msg: `Heavy rain expected (${data.rainForecast}%)`, type: 'danger' });
      if (data.temp <= 5) alerts.push({ msg: `Frost risk — ${data.temp}°C`, type: 'danger' });
      if (data.temp >= 38) alerts.push({ msg: `Heat wave — ${data.temp}°C`, type: 'danger' });
      bar.innerHTML = alerts.map(a => `<div class="alert-item"><i class="fas fa-exclamation-triangle"></i><span>${a.msg}</span></div>`).join('');
    },

    renderHistoryChart() {
      const history = Storage.getUserData(K.WEATHER_HISTORY);
      if (!history.length) return;
      const labels = history.map(h => h.date.slice(5));
      UI.createChart('weather-history-chart', {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Temp °C', data: history.map(h => h.temp), borderColor: '#ff6b4a', tension: 0.3 },
            { label: 'Humidity %', data: history.map(h => h.humidity), borderColor: '#5ec8e8', tension: 0.3 },
            { label: 'Rain %', data: history.map(h => h.rain), borderColor: '#3d9b5f', tension: 0.3 }
          ]
        }
      });
    },

    init() {
      const origRender = Weather.renderDetail.bind(Weather);
      Weather.renderDetail = async function () {
        await origRender();
        WeatherAdvanced.renderHistoryChart();
        WeatherAdvanced.renderAlerts(Weather.data);
        IoT.renderReadings();
      };
    }
  };

  // ==========================================
  // IoT INTEGRATION
  // ==========================================
  const IoT = {
    getConfig() {
      const uid = window.FMS.Auth.getCurrentUserId();
      return (Storage.get(K.IOT_CONFIG) || {})[uid] || { apiUrl: '', interval: 60000 };
    },

    saveConfig(cfg) {
      const uid = window.FMS.Auth.getCurrentUserId();
      const all = Storage.get(K.IOT_CONFIG) || {};
      all[uid] = cfg;
      Storage.set(K.IOT_CONFIG, all);
    },

    getReadings() { return Storage.getUserData(K.IOT_READINGS); },
    saveReadings(d) { Storage.setUserData(K.IOT_READINGS, d); },

    async poll() {
      const cfg = this.getConfig();
      if (!cfg.apiUrl) { UI.toast('Set IoT API URL first', 'error'); return; }
      try {
        const res = await fetch(cfg.apiUrl, { mode: 'cors' });
        const json = await res.json();
        const reading = {
          id: Utils.generateId(),
          timestamp: new Date().toISOString(),
          soilMoisture: json.soil_moisture ?? json.soilMoisture ?? json.moisture,
          tankLevel: json.tank_level ?? json.tankLevel ?? json.water_level,
          temp: json.temperature ?? json.temp
        };
        const readings = this.getReadings();
        readings.unshift(reading);
        if (readings.length > 50) readings.length = 50;
        this.saveReadings(readings);
        if (Weather.data && reading.soilMoisture != null) {
          Weather.data.waterLevel = reading.soilMoisture;
        }
        this.renderReadings();
        UI.toast('IoT data received', 'success');
      } catch {
        UI.toast('Could not reach sensor API. Use CORS-enabled endpoint or mock JSON.', 'error');
      }
    },

    renderReadings() {
      const el = document.getElementById('iot-readings');
      if (!el) return;
      const readings = this.getReadings();
      const latest = readings[0];
      el.innerHTML = latest ? `
        <div class="iot-stats">
          <div class="stat-pill glass-dark"><span>${latest.soilMoisture ?? '—'}%</span><small>Soil Moisture</small></div>
          <div class="stat-pill glass-dark"><span>${latest.tankLevel ?? '—'}%</span><small>Tank Level</small></div>
          <div class="stat-pill glass-dark"><span>${latest.temp ?? '—'}°C</span><small>Sensor Temp</small></div>
        </div>
        <p class="text-muted">Last poll: ${Utils.formatDate(latest.timestamp)}</p>` : '<p class="text-muted">No readings yet — configure API and poll</p>';
    },

    init() {
      const cfg = this.getConfig();
      if (cfg.apiUrl) document.getElementById('iot-api-url').value = cfg.apiUrl;
      document.getElementById('iot-config-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveConfig({ apiUrl: document.getElementById('iot-api-url').value, interval: 60000 });
        UI.toast('IoT config saved', 'success');
      });
      document.getElementById('iot-poll-btn')?.addEventListener('click', () => this.poll());
      this.renderReadings();
    }
  };

  // ==========================================
  // ANALYTICS MODULE
  // ==========================================
  const Analytics = {
    render() {
      const el = document.getElementById('analytics-content');
      if (!el) return;
      const income = Income.getAll();
      const expenses = Expenses.getAll();
      const crops = Crops.getAll();

      const cropRevenue = {};
      income.forEach(i => { cropRevenue[i.cropSold] = (cropRevenue[i.cropSold] || 0) + i.total; });
      const bestCrop = Object.entries(cropRevenue).sort((a, b) => b[1] - a[1])[0];

      const years = [...new Set([...income, ...expenses].map(x => new Date(x.date).getFullYear()))].sort();
      const yoyIncome = years.map(y => income.filter(i => new Date(i.date).getFullYear() === y).reduce((s, i) => s + i.total, 0));
      const yoyExpense = years.map(y => expenses.filter(e => new Date(e.date).getFullYear() === y).reduce((s, e) => s + e.amount, 0));

      const totalHa = crops.reduce((s, c) => s + Utils.parseHectares(c.quantity), 0) || 1;
      const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
      const costPerHa = totalExp / totalHa;

      const yieldHist = Storage.getUserData(K.YIELD_HISTORY);
      const totalKg = yieldHist.reduce((s, h) => s + h.yieldKg, 0) || 1;
      const costPerKg = totalExp / totalKg;

      el.innerHTML = `
        <div class="stats-pills" style="margin-bottom:1.5rem">
          <div class="stat-pill glass-dark highlight"><span>${bestCrop ? bestCrop[0] : '—'}</span><small>Best Crop</small></div>
          <div class="stat-pill glass-dark"><span>${bestCrop ? Utils.formatCurrency(bestCrop[1]) : '—'}</span><small>Top Revenue</small></div>
          <div class="stat-pill glass-dark"><span>${Utils.formatCurrency(costPerHa)}</span><small>Cost / Hectare</small></div>
          <div class="stat-pill glass-dark"><span>${Utils.formatCurrency(costPerKg)}</span><small>Cost / kg</small></div>
        </div>
        <div class="dashboard-extras">
          <div class="glass-card glass-dark chart-card"><h3>Year-over-Year Income vs Expenses</h3><canvas id="yoy-chart"></canvas></div>
          <div class="glass-card glass-dark chart-card"><h3>Best Performing Crops</h3><canvas id="best-crop-chart"></canvas></div>
        </div>
        <div class="glass-card glass-dark" style="margin-top:1rem">
          <h3>Export & Share</h3>
          <div class="report-actions" style="justify-content:flex-start;margin-top:1rem">
            <button class="btn btn-primary" onclick="Features.Analytics.exportAllCSV()"><i class="fas fa-file-csv"></i> Export All CSV</button>
            <button class="btn btn-outline" onclick="Features.Analytics.shareSummary()"><i class="fas fa-share-alt"></i> Share Summary</button>
            <button class="btn btn-outline" onclick="Features.Analytics.emailReport()"><i class="fas fa-envelope"></i> Email Report</button>
          </div>
        </div>`;

      if (years.length) {
        UI.createChart('yoy-chart', {
          type: 'bar',
          data: {
            labels: years.map(String),
            datasets: [
              { label: 'Income (₹)', data: yoyIncome, backgroundColor: 'rgba(61,155,95,0.8)', borderRadius: 4 },
              { label: 'Expenses (₹)', data: yoyExpense, backgroundColor: 'rgba(255,107,74,0.8)', borderRadius: 4 }
            ]
          }
        });
      }

      UI.createChart('best-crop-chart', {
        type: 'doughnut',
        data: {
          labels: Object.keys(cropRevenue),
          datasets: [{ data: Object.values(cropRevenue), backgroundColor: ['#3d9b5f', '#f5c842', '#ff6b4a', '#5ec8e8', '#9b5de5'] }]
        },
        options: { cutout: '60%' }
      });
    },

    exportAllCSV() {
      ExportCSV.exportReport('profit');
      ExportCSV.exportReport('crops');
      ExportCSV.exportReport('income');
      ExportCSV.exportReport('expenses');
      UI.toast('CSV files exported', 'success');
    },

    shareSummary() {
      const income = Income.getAll().reduce((s, i) => s + i.total, 0);
      const exp = Expenses.getAll().reduce((s, e) => s + e.amount, 0);
      const text = `Farm Summary\nIncome: ${Utils.formatCurrency(income)}\nExpenses: ${Utils.formatCurrency(exp)}\nProfit: ${Utils.formatCurrency(income - exp)}`;
      if (navigator.share) {
        navigator.share({ title: 'Farm Report', text }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(text);
        UI.toast('Summary copied to clipboard', 'success');
      }
    },

    emailReport() {
      const user = window.FMS.Auth.getCurrentUser();
      const income = Income.getAll().reduce((s, i) => s + i.total, 0);
      const exp = Expenses.getAll().reduce((s, e) => s + e.amount, 0);
      const body = encodeURIComponent(`Farm P&L Summary\n\nIncome: ${Utils.formatCurrency(income)}\nExpenses: ${Utils.formatCurrency(exp)}\nNet: ${Utils.formatCurrency(income - exp)}`);
      window.location.href = `mailto:${user?.email || ''}?subject=Farm Report&body=${body}`;
    }
  };

  // ==========================================
  // CSV EXPORT
  // ==========================================
  const ExportCSV = {
    download(filename, csv) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    },

    toCSV(rows) {
      return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    },

    exportReport(type) {
      let rows = [], name = type;
      if (type === 'crops') {
        rows = [['Name', 'Type', 'Field', 'Status', 'Stage', 'Planted']];
        Crops.getAll().forEach(c => rows.push([c.name, c.type, c.fieldName, c.status, c.growthStage, c.plantingDate]));
      } else if (type === 'expenses') {
        rows = [['Description', 'Category', 'Amount', 'Date']];
        Expenses.getAll().forEach(e => rows.push([e.description, e.category, e.amount, e.date]));
      } else if (type === 'income') {
        rows = [['Crop', 'Buyer', 'Qty', 'Amount', 'Date']];
        Income.getAll().forEach(i => rows.push([i.cropSold, i.buyerName, i.quantitySold, i.total, i.date]));
      } else if (type === 'profit') {
        const inc = Income.getAll().reduce((s, i) => s + i.total, 0);
        const exp = Expenses.getAll().reduce((s, e) => s + e.amount, 0);
        rows = [['Metric', 'Value'], ['Income', inc], ['Expenses', exp], ['Profit', inc - exp]];
      }
      this.download(`${type}-report-${Utils.today()}.csv`, this.toCSV(rows));
    },

    init() {
      document.querySelectorAll('.export-csv').forEach(btn => {
        btn.addEventListener('click', () => this.exportReport(btn.dataset.report));
      });
      document.querySelectorAll('.share-report').forEach(btn => {
        btn.addEventListener('click', () => {
          ExportCSV.exportReport(btn.dataset.report);
          Analytics.shareSummary();
        });
      });
    }
  };

  // ==========================================
  // UX ENHANCEMENTS
  // ==========================================
  const Voice = {
  start(target) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { UI.toast('Voice not supported in this browser', 'error'); return; }
      const rec = new SR();
      rec.lang = 'en-IN';
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        UI.toast(`Heard: "${text}"`, 'info');
        if (target === 'expense') {
          const amount = text.match(/[\d,]+/)?.[0]?.replace(/,/g, '');
          Expenses.openAddModal();
          setTimeout(() => {
            const desc = document.querySelector('#expense-form [name="description"]');
            const amt = document.querySelector('#expense-form [name="amount"]');
            if (desc) desc.value = text;
            if (amt && amount) amt.value = amount;
          }, 300);
        } else if (target === 'task') {
          Tasks.openAddModal();
          setTimeout(() => {
            const t = document.querySelector('#task-form [name="title"]');
            if (t) t.value = text;
          }, 300);
        }
      };
      rec.start();
      UI.toast('Listening... speak now', 'info');
    }
  };

  const Barcode = {
    scanner: null,

    async start() {
      if (typeof Html5Qrcode === 'undefined') { UI.toast('Scanner library not loaded', 'error'); return; }
      document.getElementById('scanner-overlay').classList.remove('hidden');
      this.scanner = new Html5Qrcode('scanner-reader');
      try {
        await this.scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 200 },
          (code) => { this.onScan(code); this.stop(); },
          () => {});
      } catch {
        UI.toast('Camera access denied', 'error');
        this.stop();
      }
    },

    stop() {
      document.getElementById('scanner-overlay').classList.add('hidden');
      this.scanner?.stop().catch(() => {});
    },

    onScan(code) {
      UI.toast(`Scanned: ${code}`, 'success');
      Inventory.openAddModal();
      setTimeout(() => {
        const name = document.querySelector('#inventory-form [name="name"]');
        if (name) name.value = `Item ${code}`;
      }, 300);
    },

    init() {
      document.getElementById('scan-barcode-btn')?.addEventListener('click', () => this.start());
      document.getElementById('scanner-close')?.addEventListener('click', () => this.stop());
    }
  };

  const AutoTheme = {
    init() {
      const apply = () => {
        const settings = Storage.get(K.SETTINGS)?.[window.FMS.Auth.getCurrentUserId()] || {};
        if (!settings.autoTheme) return;
        const hour = new Date().getHours();
        document.documentElement.setAttribute('data-theme', (hour >= 18 || hour < 6) ? 'dark' : 'light');
      };
      apply();
      setInterval(apply, 60000);
      document.getElementById('settings-auto-theme')?.addEventListener('change', (e) => {
        const uid = window.FMS.Auth.getCurrentUserId();
        const all = Storage.get(K.SETTINGS) || {};
        all[uid] = { ...(all[uid] || {}), autoTheme: e.target.checked };
        Storage.set(K.SETTINGS, all);
        apply();
      });
    }
  };

  const Onboarding = {
    steps: [
      { title: 'Welcome to Digital Agriculture', text: 'Manage your entire farm from one dashboard — crops, finances, weather & more.' },
      { title: 'My Fields Dashboard', text: 'View live weather, soil moisture, crop distribution and daily schedule at a glance.' },
      { title: 'Farm Intelligence', text: 'Track pests, soil tests, fertilizer schedules, yield predictions and crop rotation.' },
      { title: 'Livestock Module', text: 'Manage animals, milk production, vaccinations and breeding records.' },
      { title: 'Quick Add Button', text: 'Use the + button on mobile to quickly add expenses, tasks, or use voice input in the field.' }
    ],
    step: 0,

    maybeStart() {
      const uid = window.FMS.Auth.getCurrentUserId();
      const done = Storage.get(K.ONBOARDING) || {};
      if (done[uid]) return;
      this.step = 0;
      document.getElementById('onboarding-overlay').classList.remove('hidden');
      this.show();
    },

    show() {
      const s = this.steps[this.step];
      document.getElementById('onboarding-title').textContent = s.title;
      document.getElementById('onboarding-text').textContent = s.text;
      document.getElementById('onboarding-progress-bar').style.width = `${((this.step + 1) / this.steps.length) * 100}%`;
      document.getElementById('onboarding-next').textContent = this.step === this.steps.length - 1 ? 'Get Started' : 'Next';
    },

    finish() {
      const uid = window.FMS.Auth.getCurrentUserId();
      const done = Storage.get(K.ONBOARDING) || {};
      done[uid] = true;
      Storage.set(K.ONBOARDING, done);
      document.getElementById('onboarding-overlay').classList.add('hidden');
    },

    init() {
      document.getElementById('onboarding-next')?.addEventListener('click', () => {
        if (this.step < this.steps.length - 1) { this.step++; this.show(); } else this.finish();
      });
      document.getElementById('onboarding-skip')?.addEventListener('click', () => this.finish());
    }
  };

  const FAB = {
    open: false,

    init() {
      const main = document.getElementById('fab-main');
      const menu = document.getElementById('fab-menu');
      main?.addEventListener('click', () => {
        this.open = !this.open;
        menu?.classList.toggle('hidden', !this.open);
        main.querySelector('i').className = this.open ? 'fas fa-times' : 'fas fa-plus';
      });
      document.querySelectorAll('.fab-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = btn.dataset.fab;
          if (t === 'expense') Expenses.openAddModal();
          else if (t === 'income') Income.openAddModal();
          else if (t === 'task') Tasks.openAddModal();
          else if (t === 'crop') Crops.openAddModal();
          else if (t === 'voice') Voice.start('expense');
          menu.classList.add('hidden');
          this.open = false;
          main.querySelector('i').className = 'fas fa-plus';
        });
      });
    }
  };

  const UX = {
    init() {
      FAB.init();
      Onboarding.init();
      AutoTheme.init();
      Barcode.init();
    }
  };

  // ==========================================
  // SEED DEMO DATA FOR NEW FEATURES
  // ==========================================
  const DemoSeed = {
    seed() {
      if (Storage.getUserData(K.LIVESTOCK).length) return;
      Storage.setUserData(K.LIVESTOCK, [
        { id: Utils.generateId(), name: 'Gauri', type: 'Cattle', age: 4, weight: 450, health: 'Healthy', tag: 'CAT001' },
        { id: Utils.generateId(), name: 'Lakshmi', type: 'Buffalo', age: 3, weight: 520, health: 'Healthy', tag: 'BUF002' }
      ]);
      Storage.setUserData(K.MILK_LOG, [
        { id: Utils.generateId(), animalName: 'Gauri', liters: 12, session: 'Morning', date: Utils.today() }
      ]);
      Storage.setUserData(K.VACCINATIONS, [
        { id: Utils.generateId(), animalName: 'Gauri', vaccine: 'FMD', dueDate: Utils.today(), completed: false }
      ]);
    }
  };

  // ==========================================
  // INIT
  // ==========================================
  window.Features = {
    Intelligence, Livestock, Analytics, WeatherAdvanced, IoT, Irrigation,
    ExportCSV, Voice, Barcode, AutoTheme, Onboarding, FAB, UX, DemoSeed,

    init() {
      Intelligence.init();
      Livestock.init();
      WeatherAdvanced.init();
      IoT.init();
      ExportCSV.init();
      UX.init();
      if (window.FMS?.Auth?.getCurrentUser()) DemoSeed.seed();
    }
  };

})();
