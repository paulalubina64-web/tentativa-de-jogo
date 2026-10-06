/* Florescer · estado do app, persistido no LocalStorage do navegador */
(function (F) {
  'use strict';

  const U = F.utils;
  const KEY = 'florescer:v1';
  const listeners = [];

  function defaults() {
    return {
      version: 1,
      profile: { name: '', createdAt: U.today() },
      settings: {
        theme: 'dia',
        periods: [
          { id: 'tarde', label: 'Tarde', emoji: '☀️', start: '14:00', minutes: 150 },
          { id: 'noite', label: 'Noite', emoji: '🌙', start: '19:30', minutes: 120 }
        ],
        // domingo .. sábado
        studyDays: [false, true, true, true, true, true, true],
        blockMinutes: 50,
        breakMinutes: 10,
        reviewMinutes: 15,
        reviewShare: 0.4,
        // dias entre uma revisão e a próxima, a cada acerto
        reviewIntervals: [1, 3, 7, 14, 30],
        examPrepDays: 7,
        pomodoro: { focus: 25, short: 5, long: 15, cycles: 4 }
      },
      subjects: [],
      topics: [],
      exams: [],
      sessions: [],
      plans: {}
    };
  }

  function merge(base, saved) {
    const out = Object.assign({}, base, saved);
    out.profile = Object.assign({}, base.profile, saved.profile);
    out.settings = Object.assign({}, base.settings, saved.settings);
    out.settings.pomodoro = Object.assign({}, base.settings.pomodoro, (saved.settings || {}).pomodoro);
    ['subjects', 'topics', 'exams', 'sessions'].forEach((k) => {
      if (!Array.isArray(out[k])) out[k] = [];
    });
    if (!out.plans || typeof out.plans !== 'object') out.plans = {};
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return merge(defaults(), JSON.parse(raw));
    } catch (e) {
      console.warn('Florescer: não consegui ler os dados salvos', e);
    }
    return defaults();
  }

  function prunePlans(state) {
    const limit = U.addDays(U.today(), -60);
    Object.keys(state.plans).forEach((k) => {
      if (k < limit) delete state.plans[k];
    });
  }

  const store = {
    state: load(),

    save() {
      prunePlans(store.state);
      try {
        localStorage.setItem(KEY, JSON.stringify(store.state));
      } catch (e) {
        console.warn('Florescer: não consegui salvar', e);
      }
      listeners.forEach((fn) => fn(store.state));
    },

    onChange(fn) {
      listeners.push(fn);
    },

    // Marca o plano de hoje como desatualizado após mudanças que afetam o cronograma.
    touchPlan() {
      const plan = store.state.plans[U.today()];
      if (plan) plan.stale = true;
    },

    subject(id) {
      return store.state.subjects.find((s) => s.id === id) || null;
    },
    topic(id) {
      return store.state.topics.find((t) => t.id === id) || null;
    },

    addSubject(data) {
      const s = Object.assign({ id: U.uid(), createdAt: U.today() }, data);
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
      store.touchPlan();
      store.save();
    },

    addExam(data) {
      store.state.exams.push(Object.assign({ id: U.uid() }, data));
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
      store.save();
    },
    reset() {
      store.state = defaults();
      store.save();
    }
  };

  F.store = store;
})(window.Florescer = window.Florescer || {});
