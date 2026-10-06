/* Florescer · navegação, ações e peças de interface compartilhadas */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;

  F.COLORS = ['#F9A8D4', '#C4B5FD', '#A7F3D0', '#FDE68A', '#BAE6FD', '#FDBA74', '#FCA5A5', '#D9F99D', '#F5D0FE', '#99F6E4'];
  F.EMOJIS = ['📚', '⚖️', '🏛️', '📜', '🧠', '🔬', '🧮', '🌍', '💼', '🩺', '🎨', '🧬', '✍️', '💡', '🦋', '🍓', '🐝', '🌙'];

  const VIEWS = [
    { id: 'hoje', label: 'Hoje', icon: '🌷' },
    { id: 'semana', label: 'Semana', icon: '🗓️' },
    { id: 'materias', label: 'Matérias', icon: '📚' },
    { id: 'provas', label: 'Provas', icon: '🎯' },
    { id: 'pomodoro', label: 'Pomodoro', icon: '🍅' },
    { id: 'jardim', label: 'Meu jardim', icon: '🌸' },
    { id: 'ajustes', label: 'Ajustes', icon: '⚙️' }
  ];

  F.views = F.views || {};
  F.actions = {};
  F.ui = { view: 'hoje', openSubject: null, editingSubject: null, editingExam: null };

  F.action = (name, fn) => {
    F.actions[name] = fn;
  };

  /* ---------- peças reutilizáveis ---------- */

  F.chip = (subject, extra) => {
    if (!subject) return '<span class="chip">matéria removida</span>';
    return `<span class="chip" style="--c:${subject.color}">${subject.emoji} ${U.esc(subject.name)}${extra || ''}</span>`;
  };

  F.hearts = (n, icon) => {
    let out = '';
    for (let i = 1; i <= 5; i++) out += `<span class="${i <= n ? 'on' : 'off'}">${icon || '♥'}</span>`;
    return `<span class="hearts">${out}</span>`;
  };

  F.empty = (emoji, title, text, btn) => `
    <div class="empty">
      <div class="empty-emoji">${emoji}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${btn || ''}
    </div>`;

  F.toast = (msg) => {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => el.classList.add('out'), 2800);
    setTimeout(() => el.remove(), 3300);
  };

  F.minutesOn = (dateKey, subjectId) =>
    store.state.sessions
      .filter((s) => s.date === dateKey && (!subjectId || s.subjectId === subjectId))
      .reduce((a, s) => a + s.minutes, 0);

  F.streak = () => {
    const days = new Set(store.state.sessions.map((s) => s.date));
    store.state.topics.forEach((t) => (t.history || []).forEach((h) => days.add(h.date)));
    let d = U.today();
    if (!days.has(d)) d = U.addDays(d, -1);
    let n = 0;
    while (days.has(d)) {
      n++;
      d = U.addDays(d, -1);
    }
    return n;
  };

  /* ---------- navegação ---------- */

  function renderNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = VIEWS.map(
      (v) => `<button class="nav-item ${F.ui.view === v.id ? 'active' : ''}" data-action="go" data-view="${v.id}">
        <span class="nav-icon">${v.icon}</span><span class="nav-label">${v.label}</span></button>`
    ).join('');
  }

  F.render = () => {
    document.documentElement.dataset.theme = store.state.settings.theme === 'noite' ? 'dark' : 'light';
    renderNav();
    const view = F.views[F.ui.view];
    const root = document.getElementById('view');
    root.innerHTML = view ? view.render() : '';
    if (view && view.after) view.after(root);
    renderMiniTimer();
  };

  F.go = (id) => {
    F.ui.view = id;
    try {
      history.replaceState(null, '', '#' + id);
    } catch (e) {
      /* file:// às vezes bloqueia */
    }
    F.render();
    window.scrollTo({ top: 0 });
  };

  F.action('go', (el) => F.go(el.dataset.view));

  F.action('theme', () => {
    store.state.settings.theme = store.state.settings.theme === 'noite' ? 'dia' : 'noite';
    store.save();
    F.render();
  });

  /* ---------- mini-timer no topo ---------- */

  function renderMiniTimer() {
    const el = document.getElementById('mini-timer');
    const p = F.pomodoro;
    const show = p.s.running && F.ui.view !== 'pomodoro';
    el.hidden = !show;
    const sec = p.remaining();
    const label = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    if (show) el.innerHTML = `${p.PHASES[p.s.phase].emoji} ${label}`;
    document.title = p.s.running ? `${label} · Florescer` : 'Florescer · cronograma de estudos';
  }

  F.pomodoro.onTick(() => {
    if (F.ui.view === 'pomodoro' && F.views.pomodoro.tick) F.views.pomodoro.tick();
    renderMiniTimer();
  });

  /* ---------- eventos (delegação) ---------- */

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const fn = F.actions[el.dataset.action];
    if (fn) {
      ev.preventDefault();
      fn(el, ev);
    }
  });

  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const fn = F.actions['form:' + form.dataset.form];
    if (fn) fn(form, new FormData(form));
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-change]');
    if (!el) return;
    const fn = F.actions['change:' + el.dataset.change];
    if (fn) fn(el, ev);
  });

  // Ao virar o dia com a aba aberta, refaz a tela (e o plano) automaticamente.
  let lastDay = U.today();
  setInterval(() => {
    if (U.today() !== lastDay) {
      lastDay = U.today();
      F.render();
    }
  }, 60000);

  window.addEventListener('DOMContentLoaded', () => {
    const hash = location.hash.replace('#', '');
    if (VIEWS.some((v) => v.id === hash)) F.ui.view = hash;
    if (!store.state.subjects.length && !hash) F.ui.view = 'hoje';
    F.render();
  });
})(window.Florescer = window.Florescer || {});
