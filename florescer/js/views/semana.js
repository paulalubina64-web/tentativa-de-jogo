/* Florescer · tela "Semana": previsão dos próximos 7 dias */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;

  function render() {
    const st = store.state;
    if (!st.subjects.length) {
      return `<header class="page-head"><h1>🗓️ Semana</h1></header>` +
        F.empty('🌱', 'Ainda sem matérias', 'Cadastre suas matérias e eu monto a semana inteira pra você.', '<button class="btn primary" data-action="go" data-view="materias">Cadastrar matérias</button>');
    }
    const today = U.today();
    F.planner.ensureToday(st);
    const days = F.planner.projectWeek(st, today, 7);

    const cols = days
      .map((day, i) => {
        const exams = st.exams.filter((e) => e.date === day.date);
        const life = (day.life || []).filter((x) => !x.blocksStudy);
        const minutes = day.blocks.reduce((a, b) => a + b.minutes, 0);
        const reviews = day.blocks.reduce((a, b) => a + b.reviews.length, 0);
        const items = day.blocks
          .map((b) => {
            const sub = st.subjects.find((s) => s.id === b.subjectId);
            const mode = F.planner.MODES[b.mode] || F.planner.MODES.estudo;
            const topic = b.topicId ? store.topic(b.topicId) : null;
            if (!sub) {
              return `<li class="wk-item" style="--c:var(--lilac)"><span>🔁 Revisões</span><small>${b.reviews.length} conteúdo(s)</small></li>`;
            }
            return `<li class="wk-item ${b.done ? 'done' : ''}" style="--c:${sub.color}">
                <span>${sub.emoji} ${U.esc(sub.name)}</span>
                <small>${mode.emoji} ${topic ? U.esc(topic.title) : mode.label}${b.reviews.length ? ` · +${b.reviews.length} rev.` : ''}</small>
              </li>`;
          })
          .join('');
        return `
          <section class="wk-day ${day.off ? 'off' : ''} ${i === 0 ? 'today' : ''}">
            <header>
              <strong>${i === 0 ? 'Hoje' : U.weekdayShort(day.date)}</strong>
              <small>${U.formatDate(day.date)}</small>
            </header>
            ${exams.map((e) => {
              const s = store.subject(e.subjectId);
              return `<div class="wk-exam">🎯 ${U.esc(e.title || e.kind)}${s ? ' · ' + s.emoji : ''}</div>`;
            }).join('')}
            ${life.length ? `<p class="wk-life">${life.map((x) => `<span title="${U.esc(x.title)}${x.start ? ' ' + x.start : ''}">${x.emoji}</span>`).join('')}</p>` : ''}
            ${
              day.off
                ? `<p class="muted small center">${day.offReason ? '📌 ' + U.esc(day.offReason) : '🌙 descanso'}</p>`
                : `<p class="muted small">${U.duration(minutes)} · ${reviews} revisões</p><ul>${items}</ul>`
            }
          </section>`;
      })
      .join('');

    // Quanto tempo cada matéria recebe na semana
    const totals = {};
    days.forEach((d) => d.blocks.forEach((b) => b.subjectId && (totals[b.subjectId] = (totals[b.subjectId] || 0) + b.minutes)));
    const max = Math.max(1, ...Object.values(totals));
    const dist = st.subjects
      .slice()
      .sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0))
      .map(
        (s) => `<div class="dist-row">
          <span class="dist-name">${s.emoji} ${U.esc(s.name)}</span>
          <div class="bar thick" style="--c:${s.color}"><span style="width:${((totals[s.id] || 0) / max) * 100}%"></span></div>
          <span class="dist-val">${U.duration(totals[s.id] || 0)}</span>
        </div>`
      )
      .join('');

    return `
      <header class="page-head">
        <h1>🗓️ Sua semana</h1>
        <p class="muted">Previsão dos próximos 7 dias. Ela se reorganiza sozinha conforme você estuda, revisa ou adiciona provas.</p>
      </header>
      <div class="week">${cols}</div>
      <section class="card">
        <h3>⚖️ Como seu tempo está dividido</h3>
        <p class="muted small">Mais tempo para o que pesa mais, é mais difícil, você domina menos ou tem prova perto.</p>
        ${dist}
      </section>`;
  }

  F.views.semana = { render };
})(window.Florescer = window.Florescer || {});
