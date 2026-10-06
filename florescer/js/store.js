/* Florescer · dados de UMA conta (cada pessoa tem os seus).
 * O armazenamento local é sempre a fonte imediata; a nuvem (se ativada) sincroniza por cima.
 */
(function (F) {
  'use strict';

  const U = F.utils;
  const listeners = [];
  let currentKey = null;
  let saveHook = null;

  // Janelas padrão de cada período do dia (editáveis na Rotina).
  const WINDOWS = {
    manha: { start: '08:00', end: '12:00' },
    tarde: { start: '13:30', end: '18:00' },
    noite: { start: '19:00', end: '22:30' }
  };

  const INTENSITY = {
    leve: { label: '🌿 Leve', blockMinutes: 40, breakMinutes: 10, reviewShare: 0.35, pomodoro: { focus: 25, short: 5, long: 15, cycles: 4 } },
    equilibrado: { label: '🌸 Equilibrado', blockMinutes: 50, breakMinutes: 10, reviewShare: 0.4, pomodoro: { focus: 25, short: 5, long: 15, cycles: 4 } },
    intenso: { label: '🔥 Intenso', blockMinutes: 60, breakMinutes: 10, reviewShare: 0.4, pomodoro: { focus: 50, short: 10, long: 20, cycles: 3 } }
  };

  function defaults() {
    const day = () => [Object.assign({}, WINDOWS.tarde), Object.assign({}, WINDOWS.noite)];
    return {
      version: 2,
      updatedAt: 0,
      profile: { name: '', avatar: '🌸', course: '', semester: '', goal: 'notas', onboarded: false, onboardingStep: 0, createdAt: U.today() },
      settings: {
        theme: 'dia',
        intensity: 'equilibrado',
        peak: 'tarde',
        sleep: { wake: '07:00', bed: '23:30' },
        windows: JSON.parse(JSON.stringify(WINDOWS)),
        availability: [day(), day(), day(), day(), day(), day(), day()],
        // minutos de estudo por dia, domingo .. sábado
        dailyTarget: [0, 270, 270, 270, 270, 270, 270],
        blockMinutes: 50,
        breakMinutes: 10,
        reviewMinutes: 15,
        reviewShare: 0.4,
        reviewIntervals: [1, 3, 7, 14, 30],
        examPrepDays: 7,
        pomodoro: { focus: 25, short: 5, long: 15, cycles: 4 }
      },
      subjects: [],
      topics: [],
      exams: [],
      sessions: [],
      plans: {},
      commitments: [],
      events: [],
      cards: [],
      reflections: {},
      weekStats: {}
    };
  }

  // Dados da primeira versão (períodos fixos tarde/noite) → modelo novo.
  function migrate(saved) {
    if (!saved || !Object.keys(saved).length || saved.version >= 2) return saved;
    const s = saved.settings || {};
    if (Array.isArray(s.periods)) {
      const block = s.blockMinutes || 50;
      const brk = s.breakMinutes || 10;
      const wins = s.periods
        .filter((p) => Number(p.minutes) > 0)
        .map((p) => {
          const n = Math.ceil(p.minutes / block);
          const start = U.toMinutes(p.start);
          return { start: p.start, end: U.fromMinutes(Math.min(1439, start + Number(p.minutes) + (n - 1) * brk)) };
        });
      const total = s.periods.reduce((a, p) => a + Number(p.minutes || 0), 0);
      const days = s.studyDays || [false, true, true, true, true, true, true];
      s.availability = days.map(() => wins.map((w) => Object.assign({}, w)));
      s.windows = Object.assign({}, WINDOWS);
      s.periods.forEach((p, i) => {
        if (wins[i] && WINDOWS[p.id]) s.windows[p.id] = Object.assign({}, wins[i]);
      });
      s.dailyTarget = days.map((on) => (on ? total : 0));
      delete s.periods;
      delete s.studyDays;
    }
    saved.profile = Object.assign({}, saved.profile, { onboarded: true });
    saved.version = 2;
    return saved;
  }

  function merge(base, saved) {
    saved = migrate(saved) || {};
    const out = Object.assign({}, base, saved);
    out.profile = Object.assign({}, base.profile, saved.profile);
    out.settings = Object.assign({}, base.settings, saved.settings);
    out.settings.pomodoro = Object.assign({}, base.settings.pomodoro, (saved.settings || {}).pomodoro);
    out.settings.sleep = Object.assign({}, base.settings.sleep, (saved.settings || {}).sleep);
    out.settings.windows = Object.assign({}, base.settings.windows, (saved.settings || {}).windows);
    ['subjects', 'topics', 'exams', 'sessions', 'commitments', 'events', 'cards'].forEach((k) => {
      if (!Array.isArray(out[k])) out[k] = [];
    });
    ['plans', 'reflections', 'weekStats'].forEach((k) => {
      if (!out[k] || typeof out[k] !== 'object') out[k] = {};
    });
    return out;
  }

  // Planos antigos viram um resumo semanal (o histórico nunca se perde, só fica mais leve).
  function prunePlans(state) {
    const limit = U.addDays(U.today(), -45);
    Object.keys(state.plans).forEach((k) => {
      if (k >= limit) return;
      const plan = state.plans[k];
      const wk = U.weekStart(k);
      const ws = (state.weekStats[wk] = state.weekStats[wk] || { planned: 0, done: 0 });
      ws.planned += plan.blocks.length;
      ws.done += plan.blocks.filter((b) => b.done).length;
      delete state.plans[k];
    });
  }

  const store = {
    WINDOWS,
    INTENSITY,
    defaults,
    state: defaults(),

    get key() {
      return currentKey;
    },

    open(key) {
      currentKey = key;
      let data = null;
      try {
        const raw = localStorage.getItem(key);
        if (raw) data = JSON.parse(raw);
      } catch (e) {
        console.warn('Florescer: não consegui ler os dados salvos', e);
      }
      store.state = merge(defaults(), data || {});
      saveHook = null;
      return store.state;
    },

    // Substitui os dados (ex.: vieram da nuvem) sem disparar nova sincronização.
    replace(data) {
      store.state = merge(defaults(), data || {});
      store.writeLocal();
      listeners.forEach((fn) => fn(store.state));
    },

    close() {
      currentKey = null;
      saveHook = null;
      store.state = defaults();
    },

    setSaveHook(fn) {
      saveHook = fn;
    },

    writeLocal() {
      if (!currentKey) return;
      try {
        localStorage.setItem(currentKey, JSON.stringify(store.state));
      } catch (e) {
        console.warn('Florescer: não consegui salvar', e);
      }
    },

    save() {
      prunePlans(store.state);
      store.state.updatedAt = Date.now();
      store.writeLocal();
      if (saveHook) saveHook(store.state);
      listeners.forEach((fn) => fn(store.state));
    },

    onChange(fn) {
      listeners.push(fn);
    },

    touchPlan() {
      const plan = store.state.plans[U.today()];
      if (plan) plan.stale = true;
    },

    applyIntensity(level) {
      const p = INTENSITY[level] || INTENSITY.equilibrado;
      const s = store.state.settings;
      s.intensity = level;
      s.blockMinutes = p.blockMinutes;
      s.breakMinutes = p.breakMinutes;
      s.reviewShare = p.reviewShare;
      s.pomodoro = Object.assign({}, p.pomodoro);
    },

    subject(id) {
      return store.state.subjects.find((s) => s.id === id) || null;
    },
    topic(id) {
      return store.state.topics.find((t) => t.id === id) || null;
    },

    /* coleções genéricas: commitments, events, cards ... */
    add(collection, data) {
      const item = Object.assign({ id: U.uid() }, data);
      store.state[collection].push(item);
      store.touchPlan();
      store.save();
      return item;
    },
    remove(collection, id) {
      store.state[collection] = store.state[collection].filter((x) => x.id !== id);
      store.touchPlan();
      store.save();
    },

    addSubject(data) {
      const s = Object.assign({ id: U.uid(), createdAt: U.today(), goal: null }, data);
      store.state.subjects.push(s);
      store.touchPlan();
      store.save();
      return s;
    },
    updateSubject(id, data) {
      const s = store.subject(id);
      if (!s) return;
      Object.assign(s, data);
      store.touchPlan();
      store.save();
    },
    deleteSubject(id) {
      const st = store.state;
      st.subjects = st.subjects.filter((s) => s.id !== id);
      st.topics = st.topics.filter((t) => t.subjectId !== id);
      st.exams = st.exams.filter((e) => e.subjectId !== id);
      st.cards = st.cards.filter((c) => c.subjectId !== id);
      store.touchPlan();
      store.save();
    },

    addTopics(subjectId, titles) {
      const now = Date.now();
      titles.forEach((title, i) => {
        store.state.topics.push({
          id: U.uid(),
          subjectId,
          title,
          order: now + i,
          status: 'pendente',
          step: 0,
          nextReview: null,
          history: []
        });
      });
      store.touchPlan();
      store.save();
    },
    deleteTopic(id) {
      store.state.topics = store.state.topics.filter((t) => t.id !== id);
      store.state.exams.forEach((e) => {
        if (e.topicIds) e.topicIds = e.topicIds.filter((x) => x !== id);
      });
      store.touchPlan();
      store.save();
    },

    addExam(data) {
      store.state.exams.push(Object.assign({ id: U.uid(), maxGrade: 10, topicIds: [] }, data));
      store.touchPlan();
      store.save();
    },
    updateExam(id, data) {
      const e = store.state.exams.find((x) => x.id === id);
      if (e) Object.assign(e, data);
      store.touchPlan();
      store.save();
    },
    deleteExam(id) {
      store.state.exams = store.state.exams.filter((e) => e.id !== id);
      store.touchPlan();
      store.save();
    },

    logSession({ subjectId, minutes, kind, blockId }) {
      if (!minutes || minutes <= 0) return;
      const date = U.today();
      store.state.sessions.push({ id: U.uid(), subjectId, minutes, kind: kind || 'estudo', date });
      if (blockId) {
        const plan = store.state.plans[date];
        const block = plan && plan.blocks.find((b) => b.id === blockId);
        if (block) block.logged = (block.logged || 0) + minutes;
      }
      store.save();
    },

    exportJSON() {
      return JSON.stringify(store.state, null, 2);
    },
    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.subjects)) throw new Error('Arquivo não parece um backup do Florescer.');
      store.state = merge(defaults(), data);
      store.state.profile.onboarded = true;
      store.save();
    },
    reset() {
      const keepName = store.state.profile.name;
      const keepAvatar = store.state.profile.avatar;
      store.state = defaults();
      store.state.profile.name = keepName;
      store.state.profile.avatar = keepAvatar;
      store.save();
    }
  };

  F.store = store;
})(window.Florescer = window.Florescer || {});
