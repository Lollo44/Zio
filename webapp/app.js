/* === Walter the Walker — PWA App Logic === */
(function () {
  'use strict';

  /* ---------- State ---------- */
  const defaultState = {
    onboarded: false,
    profile: { age: '', weight: '', level: 'principiante', goals: [], days: [] },
    walkHistory: [],
    circuitHistory: [],
    activePlan: null,
    customPlans: []
  };
  let state = loadState();
  let currentSection = 'home';

  // Walk timer state
  let walkInterval = null;
  let walkSeconds = 0;
  let walkRunning = false;
  let walkSteps = 0;

  // Circuit timer state
  let circuitInterval = null;
  let circuitSeconds = 0;
  let circuitRunning = false;
  let circuitExIdx = 0;
  let circuitExData = [];
  const EXERCISES = ['Bicipiti', 'Tricipiti', 'Petto', 'Spalle', 'Schiena', 'Addome', 'Gambe', 'Cardio'];

  /* ---------- Persistence ---------- */
  function loadState() {
    try {
      const s = localStorage.getItem('wtw_state');
      return s ? Object.assign({}, defaultState, JSON.parse(s)) : Object.assign({}, defaultState);
    } catch { return Object.assign({}, defaultState); }
  }
  function saveState() { localStorage.setItem('wtw_state', JSON.stringify(state)); }

  /* ---------- Helpers ---------- */
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtHMS(s) { return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60); }
  function fmtMS(s) { return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function todayStr() {
    const d = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const now = new Date();
    return d[now.getDay()] + ' ' + now.getDate() + '/' + (now.getMonth() + 1);
  }

  /* ---------- Routing ---------- */
  function navigate(section) {
    currentSection = section;
    $$('.page').forEach(p => p.classList.add('hidden'));
    const el = $('#page-' + section);
    if (el) el.classList.remove('hidden');
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === section));
    if (section === 'stats') renderStats();
    if (section === 'plans') renderPlans();
    if (section === 'home') renderHome();
  }

  /* ---------- Onboarding ---------- */
  function initOnboarding() {
    if (state.onboarded) {
      $('#onboarding').classList.add('hidden');
      $('#app-main').classList.remove('hidden');
      navigate('home');
      return;
    }
    $('#onboarding').classList.remove('hidden');
    $('#app-main').classList.add('hidden');

    $('#onboarding-form').addEventListener('submit', function (e) {
      e.preventDefault();
      state.profile.age = $('#input-age').value;
      state.profile.weight = $('#input-weight').value;
      state.profile.level = $('#input-level').value;
      state.profile.goals = Array.from($$('#onboarding-form input[name="goal"]:checked')).map(c => c.value);
      state.profile.days = Array.from($$('#onboarding-form input[name="day"]:checked')).map(c => c.value);
      state.onboarded = true;
      saveState();
      $('#onboarding').classList.add('hidden');
      $('#app-main').classList.remove('hidden');
      navigate('home');
    });
  }

  /* ---------- Home ---------- */
  function renderHome() {
    $('#home-date').textContent = todayStr();
    // Show today's plan snippet if active plan exists
    const plan = state.activePlan;
    if (plan) {
      const dayIdx = new Date().getDay();
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      const todayPlan = plan.find(d => d.day === dayNames[dayIdx]);
      if (todayPlan) {
        $('#today-plan-text').textContent = todayPlan.activity;
      } else {
        $('#today-plan-text').textContent = 'Riposo';
      }
    } else {
      $('#today-plan-text').textContent = 'Nessun piano attivo — vai su Piani per crearne uno!';
    }
    // Quick stats
    const totalWalks = state.walkHistory.length;
    const totalDist = state.walkHistory.reduce((s, w) => s + (w.distance || 0), 0).toFixed(1);
    $('#home-walks').textContent = totalWalks;
    $('#home-distance').textContent = totalDist + ' km';
  }

  /* ---------- Walk ---------- */
  function resetWalk() {
    walkSeconds = 0; walkSteps = 0; walkRunning = false;
    clearInterval(walkInterval); walkInterval = null;
    updateWalkDisplay();
    $('#walk-btn-start').classList.remove('hidden');
    $('#walk-btn-pause').classList.add('hidden');
    $('#walk-btn-stop').classList.add('hidden');
  }
  function updateWalkDisplay() {
    $('#walk-timer').textContent = fmtHMS(walkSeconds);
    $('#walk-steps').textContent = walkSteps;
    const dist = (walkSteps * 0.0007).toFixed(2);
    const speed = walkSeconds > 0 ? ((walkSteps * 0.0007) / (walkSeconds / 3600)).toFixed(1) : '0.0';
    $('#walk-distance').textContent = dist;
    $('#walk-speed').textContent = speed;
  }
  function startWalk() {
    walkRunning = true;
    $('#walk-btn-start').classList.add('hidden');
    $('#walk-btn-pause').classList.remove('hidden');
    $('#walk-btn-stop').classList.remove('hidden');
    walkInterval = setInterval(function () {
      walkSeconds++;
      // Simulate steps: ~1-2 steps per second for seniors
      walkSteps += Math.floor(Math.random() * 2) + 1;
      updateWalkDisplay();
    }, 1000);
  }
  function pauseWalk() {
    walkRunning = false;
    clearInterval(walkInterval); walkInterval = null;
    $('#walk-btn-start').classList.remove('hidden');
    $('#walk-btn-pause').classList.add('hidden');
  }
  function stopWalk() {
    clearInterval(walkInterval); walkInterval = null;
    const dist = parseFloat((walkSteps * 0.0007).toFixed(2));
    if (walkSeconds > 0) {
      state.walkHistory.push({
        date: new Date().toISOString(),
        seconds: walkSeconds,
        steps: walkSteps,
        distance: dist
      });
      saveState();
    }
    resetWalk();
    alert('Camminata salvata!');
  }

  /* ---------- Circuit ---------- */
  function resetCircuit() {
    circuitSeconds = 0; circuitRunning = false; circuitExIdx = 0;
    circuitExData = [];
    clearInterval(circuitInterval); circuitInterval = null;
    updateCircuitDisplay();
    $('#circuit-btn-start').classList.remove('hidden');
    $('#circuit-btn-pause').classList.add('hidden');
    $('#circuit-btn-stop').classList.add('hidden');
    $('#circuit-btn-next').classList.add('hidden');
    $('#circuit-series').value = '';
    $('#circuit-reps').value = '';
    $('#circuit-weight').value = '';
  }
  function updateCircuitDisplay() {
    $('#circuit-timer').textContent = fmtMS(circuitSeconds);
    $('#circuit-exercise').textContent = EXERCISES[circuitExIdx];
    $('#circuit-progress').textContent = 'Esercizio ' + (circuitExIdx + 1) + ' di ' + EXERCISES.length;
  }
  function startCircuit() {
    circuitRunning = true;
    $('#circuit-btn-start').classList.add('hidden');
    $('#circuit-btn-pause').classList.remove('hidden');
    $('#circuit-btn-stop').classList.remove('hidden');
    $('#circuit-btn-next').classList.remove('hidden');
    circuitInterval = setInterval(function () {
      circuitSeconds++;
      updateCircuitDisplay();
    }, 1000);
  }
  function pauseCircuit() {
    circuitRunning = false;
    clearInterval(circuitInterval); circuitInterval = null;
    $('#circuit-btn-start').classList.remove('hidden');
    $('#circuit-btn-pause').classList.add('hidden');
  }
  function nextExercise() {
    circuitExData.push({
      exercise: EXERCISES[circuitExIdx],
      series: $('#circuit-series').value || '0',
      reps: $('#circuit-reps').value || '0',
      weight: $('#circuit-weight').value || '0'
    });
    circuitExIdx++;
    if (circuitExIdx >= EXERCISES.length) {
      stopCircuit();
      return;
    }
    updateCircuitDisplay();
    $('#circuit-series').value = '';
    $('#circuit-reps').value = '';
    $('#circuit-weight').value = '';
  }
  function stopCircuit() {
    clearInterval(circuitInterval); circuitInterval = null;
    if (circuitSeconds > 0) {
      state.circuitHistory.push({
        date: new Date().toISOString(),
        seconds: circuitSeconds,
        exercisesDone: circuitExIdx + 1,
        exercises: circuitExData
      });
      saveState();
    }
    resetCircuit();
    alert('Circuito completato e salvato!');
  }

  /* ---------- Plans ---------- */
  let plansTab = 'auto';
  function renderPlans() {
    $$('.plan-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === plansTab));
    $('#plans-auto').classList.toggle('hidden', plansTab !== 'auto');
    $('#plans-custom').classList.toggle('hidden', plansTab !== 'custom');

    if (plansTab === 'auto') {
      renderAutoPlan();
    } else {
      renderCustomPlans();
    }
  }
  function generateWeeklyPlan() {
    const days = state.profile.days.length > 0 ? state.profile.days : ['Lunedì', 'Mercoledì', 'Venerdì'];
    const allDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const plan = allDays.map(function (day) {
      if (!days.includes(day)) return { day: day, activity: 'Riposo', type: 'rest' };
      const idx = days.indexOf(day);
      if (idx % 3 === 0) return { day: day, activity: 'Camminata 30 min — ritmo moderato', type: 'walk' };
      if (idx % 3 === 1) return { day: day, activity: 'Circuito pesi — 3 serie × 12 ripetizioni', type: 'circuit' };
      return { day: day, activity: 'Camminata 20 min + stretching', type: 'walk' };
    });
    return plan;
  }
  function renderAutoPlan() {
    const container = $('#auto-plan-list');
    const plan = state.activePlan;
    if (!plan) {
      container.innerHTML = '<p style="color:var(--text2);text-align:center;padding:20px">Premi "Genera piano" per creare un piano settimanale personalizzato.</p>';
      return;
    }
    container.innerHTML = plan.map(function (d) {
      return '<div class="plan-day"><h3>' + d.day + '</h3><div class="plan-activity ' + d.type + '">' + d.activity + '</div></div>';
    }).join('');
  }
  function renderCustomPlans() {
    const list = $('#custom-plan-list');
    list.innerHTML = '';
    state.customPlans.forEach(function (cp, i) {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = '<strong>' + cp.day + '</strong> — ' + cp.activity +
        '<button class="btn btn-sm btn-outline mt-8" data-remove-idx="' + i + '" style="width:auto;padding:6px 12px">Rimuovi</button>';
      div.querySelector('button').addEventListener('click', function (e) {
        const idx = parseInt(e.currentTarget.dataset.removeIdx, 10);
        state.customPlans.splice(idx, 1);
        saveState();
        renderCustomPlans();
      });
      list.appendChild(div);
    });
  }

  /* ---------- Stats ---------- */
  let statsPeriod = 'week';
  function renderStats() {
    $$('.stats-tab').forEach(t => t.classList.toggle('active', t.dataset.period === statsPeriod));
    const now = new Date();
    let walks, circuits;
    if (statsPeriod === 'week') {
      const weekAgo = new Date(now - 7 * 86400000);
      walks = state.walkHistory.filter(w => new Date(w.date) >= weekAgo);
      circuits = state.circuitHistory.filter(c => new Date(c.date) >= weekAgo);
    } else if (statsPeriod === 'month') {
      const monthAgo = new Date(now - 30 * 86400000);
      walks = state.walkHistory.filter(w => new Date(w.date) >= monthAgo);
      circuits = state.circuitHistory.filter(c => new Date(c.date) >= monthAgo);
    } else {
      walks = state.walkHistory;
      circuits = state.circuitHistory;
    }
    const totalWalks = walks.length;
    const totalDist = walks.reduce((s, w) => s + (w.distance || 0), 0).toFixed(1);
    const totalWalkTime = walks.reduce((s, w) => s + (w.seconds || 0), 0);
    const totalCircuits = circuits.length;
    const bestWalk = walks.length > 0 ? walks.reduce((best, w) => (w.distance || 0) > (best.distance || 0) ? w : best, walks[0]) : null;

    $('#stat-walks').textContent = totalWalks;
    $('#stat-distance').textContent = totalDist + ' km';
    $('#stat-time').textContent = fmtHMS(totalWalkTime);
    $('#stat-circuits').textContent = totalCircuits;
    $('#stat-best').textContent = bestWalk ? bestWalk.distance + ' km in ' + fmtHMS(bestWalk.seconds) : '—';
  }

  /* ---------- Init ---------- */
  function init() {
    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }

    initOnboarding();

    // Navigation
    $$('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () { navigate(btn.dataset.section); });
    });

    // Home buttons
    $('#btn-start-walk').addEventListener('click', function () { navigate('walk'); });
    $('#btn-start-circuit').addEventListener('click', function () { navigate('circuit'); });

    // Walk controls
    $('#walk-btn-start').addEventListener('click', startWalk);
    $('#walk-btn-pause').addEventListener('click', pauseWalk);
    $('#walk-btn-stop').addEventListener('click', stopWalk);

    // Circuit controls
    $('#circuit-btn-start').addEventListener('click', startCircuit);
    $('#circuit-btn-pause').addEventListener('click', pauseCircuit);
    $('#circuit-btn-stop').addEventListener('click', stopCircuit);
    $('#circuit-btn-next').addEventListener('click', nextExercise);

    // Plan tabs
    $$('.plan-tab').forEach(function (t) {
      t.addEventListener('click', function () { plansTab = t.dataset.tab; renderPlans(); });
    });
    $('#btn-generate-plan').addEventListener('click', function () {
      state.activePlan = generateWeeklyPlan();
      saveState();
      renderPlans();
      renderHome();
    });
    $('#btn-add-custom').addEventListener('click', function () {
      const day = $('#custom-day').value;
      const activity = $('#custom-activity').value.trim();
      if (!activity) return;
      state.customPlans.push({ day: day, activity: activity });
      saveState();
      $('#custom-activity').value = '';
      renderCustomPlans();
    });
    $('#btn-activate-custom').addEventListener('click', function () {
      if (state.customPlans.length === 0) { alert('Aggiungi almeno un\'attività!'); return; }
      const allDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
      state.activePlan = allDays.map(function (day) {
        const cp = state.customPlans.find(c => c.day === day);
        if (cp) {
          const type = cp.activity.toLowerCase().includes('camminat') ? 'walk' :
            cp.activity.toLowerCase().includes('circuit') ? 'circuit' : 'rest';
          return { day: day, activity: cp.activity, type: type };
        }
        return { day: day, activity: 'Riposo', type: 'rest' };
      });
      saveState();
      alert('Piano personalizzato attivato!');
      renderHome();
    });

    // Stats tabs
    $$('.stats-tab').forEach(function (t) {
      t.addEventListener('click', function () { statsPeriod = t.dataset.period; renderStats(); });
    });

    // Initial render
    resetWalk();
    resetCircuit();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
