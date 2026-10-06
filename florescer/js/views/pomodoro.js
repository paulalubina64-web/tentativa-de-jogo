/* Florescer · tela "Pomodoro" */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const R = 110;
  const CIRC = 2 * Math.PI * R;

  function fmt(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  function render() {
    const p = F.pomodoro;
    const st = store.state;
    const c = st.settings.pomodoro;
    const sub = store.subject(p.s.subjectId);
    const today = U.today();
    const todaySessions = st.sessions.filter((s) => s.date === today && s.kind === 'pomodoro').length;
    const plan = st.plans[today];
    const block = plan && p.s.blockId ? plan.blocks.find((b) => b.id === p.s.blockId) : null;
    const topic = block && block.topicId ? store.topic(block.topicId) : null;

    return `
      <header class="page-head">
        <h1>🍅 Pomodoro</h1>
        <p class="muted">${c.focus} min de foco, ${c.short} de pausa e, a cada ${c.cycles} ciclos, uma pausa de ${c.long}. Os minutos de foco entram sozinhos no seu progresso.</p>
      </header>
      <div class="pomo card phase-${p.s.phase}">
        <div class="pomo-phases">
          ${Object.keys(p.PHASES)
            .map((k) => `<span class="${k === p.s.phase ? 'on' : ''}">${p.PHASES[k].emoji} ${p.PHASES[k].label}</span>`)
            .join('')}
        </div>
        <div class="ring">
          <svg viewBox="0 0 260 260" aria-hidden="true">
            <circle class="ring-bg" cx="130" cy="130" r="${R}"></circle>
            <circle class="ring-fg" id="ring-fg" cx="130" cy="130" r="${R}" stroke-dasharray="${CIRC}" stroke-dashoffset="0"></circle>
          </svg>
          <div class="ring-center">
            <div class="ring-time" id="pomo-time">${fmt(p.remaining())}</div>
            <div class="muted small">ciclo ${(p.s.cycle % c.cycles) + 1} de ${c.cycles}</div>
          </div>
        </div>
        <label class="field narrow">
          <span>Estudando</span>
          <select data-change="pomo-subject">
            <option value="">— escolha a matéria —</option>
            ${st.subjects.map((s) => `<option value="${s.id}" ${sub && s.id === sub.id ? 'selected' : ''}>${s.emoji} ${U.esc(s.name)}</option>`).join('')}
          </select>
        </label>
        ${topic ? `<p class="muted small center">Bloco de hoje: <strong>${U.esc(topic.title)}</strong></p>` : ''}
        <div class="row center">
          ${
            p.s.running
              ? '<button class="btn primary big" data-action="pomo-pause">⏸ Pausar</button>'
              : '<button class="btn primary big" data-action="pomo-start">▶ Começar</button>'
          }
          <button class="btn ghost" data-action="pomo-reset">↺ Zerar</button>
          <button class="btn ghost" data-action="pomo-skip">⏭ Pular</button>
        </div>
        <p class="center tomatoes">${'🍅'.repeat(Math.min(todaySessions, 16)) || '<span class="muted small">Nenhum pomodoro hoje ainda</span>'}</p>
        ${!sub ? '<p class="muted small center">Dica: escolha a matéria para os minutos contarem no seu jardim.</p>' : ''}
      </div>`;
  }

  function tick() {
    const p = F.pomodoro;
    const t = document.getElementById('pomo-time');
    const ring = document.getElementById('ring-fg');
    if (!t || !ring) return;
    const rem = p.remaining();
    t.textContent = fmt(rem);
    ring.style.strokeDashoffset = String(CIRC * (1 - rem / p.total()));
  }

  F.pomodoro.onTick(() => {
    // Quando a fase muda, a tela precisa ser redesenhada inteira (botões, fase, tomates).
    if (F.ui.view === 'pomodoro') {
      const running = document.querySelector('[data-action="pomo-pause"]') !== null;
      if (running !== F.pomodoro.s.running) F.render();
    }
  });

  F.action('pomo-start', () => {
    F.pomodoro.start();
    F.render();
  });
  F.action('pomo-pause', () => {
    F.pomodoro.pause();
    F.render();
  });
  F.action('pomo-reset', () => {
    F.pomodoro.reset();
    F.render();
  });
  F.action('pomo-skip', () => {
    F.pomodoro.skip();
    F.render();
  });
  F.action('change:pomo-subject', (el) => {
    F.pomodoro.attach(el.value || null, null);
  });

  F.views.pomodoro = { render, tick, after: tick };
})(window.Florescer = window.Florescer || {});
