/* Florescer · "Meu jardim": cada matéria é uma flor que reflete como está sua memória dela */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;

  // Vitalidade: cai com revisões atrasadas e com dias sem estudar a matéria.
  function vitality(sub, today, lastMap) {
    const topics = store.state.topics.filter((t) => t.subjectId === sub.id);
    const started = topics.some((t) => t.status !== 'pendente') || lastMap[sub.id];
    if (!started) return { stage: 'semente', emoji: '🌱', label: 'semente', value: null };
    const overdue = topics.filter((t) => t.nextReview && t.nextReview < today).length;
    const idle = lastMap[sub.id] ? U.diffDays(lastMap[sub.id], today) : 7;
    const value = U.clamp(100 - overdue * 15 - Math.max(0, idle - 2) * 8, 0, 100);
    if (value >= 75) return { stage: 'flor', emoji: '🌸', label: 'florescendo', value, overdue, idle };
    if (value >= 45) return { stage: 'botao', emoji: '🌷', label: 'precisa de carinho', value, overdue, idle };
    if (value >= 20) return { stage: 'murcha', emoji: '🥀', label: 'murchando', value, overdue, idle };
    return { stage: 'seca', emoji: '🍂', label: 'esquecendo', value, overdue, idle };
  }

  function render() {
    const st = store.state;
    const today = U.today();
    const lastMap = F.planner.lastActivity(st);

    if (!st.subjects.length) {
      return `<header class="page-head"><h1>🌸 Meu jardim</h1></header>` +
        F.empty('🌱', 'Jardim vazio por enquanto', 'Cada matéria que você cadastrar vira uma flor aqui.', '<button class="btn primary" data-action="go" data-view="materias">Plantar a primeira</button>');
    }

    const flowers = st.subjects
      .map((s) => {
        const v = vitality(s, today, lastMap);
        const topics = st.topics.filter((t) => t.subjectId === s.id);
        const dom = topics.filter((t) => t.status === 'dominado').length;
        const week = st.sessions
          .filter((x) => x.subjectId === s.id && x.date > U.addDays(today, -7))
          .reduce((a, x) => a + x.minutes, 0);
        return `
          <article class="flower stage-${v.stage}" style="--c:${s.color}">
            <div class="flower-art">${v.emoji}</div>
            <h4>${s.emoji} ${U.esc(s.name)}</h4>
            <p class="small">${v.label}</p>
            ${v.value != null ? `<div class="bar"><span style="width:${v.value}%"></span></div>` : ''}
            <p class="muted tiny-txt">${U.duration(week)} na semana · ${dom}/${topics.length} dominados${
              v.overdue ? ` · ${v.overdue} revisão(ões) atrasada(s)` : ''
            }</p>
          </article>`;
      })
      .join('');

    // Últimos 28 dias
    const minutesByDay = {};
    st.sessions.forEach((x) => (minutesByDay[x.date] = (minutesByDay[x.date] || 0) + x.minutes));
    const goal = st.settings.periods.reduce((a, p) => a + Number(p.minutes || 0), 0) || 1;
    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const d = U.addDays(today, -i);
      const m = minutesByDay[d] || 0;
      const lvl = m === 0 ? 0 : m < goal * 0.34 ? 1 : m < goal * 0.67 ? 2 : m < goal ? 3 : 4;
      cells.push(`<span class="cell l${lvl}" title="${U.formatDate(d)}: ${U.duration(m)}"></span>`);
    }

    const total = st.sessions.reduce((a, x) => a + x.minutes, 0);
    const week = st.sessions.filter((x) => x.date > U.addDays(today, -7)).reduce((a, x) => a + x.minutes, 0);
    const reviewsDone = st.topics.reduce((a, t) => a + (t.history || []).filter((h) => h.type === 'revisao').length, 0);
    const mastered = st.topics.filter((t) => t.status === 'dominado').length;
    const grades = st.exams.filter((e) => e.grade != null);
    const avg = grades.length ? (grades.reduce((a, e) => a + e.grade, 0) / grades.length).toFixed(1) : null;

    return `
      <header class="page-head">
        <h1>🌸 Meu jardim</h1>
        <p class="muted">A memória funciona como uma planta: sem revisão, murcha. Aqui você vê, de relance, qual matéria precisa de água.</p>
      </header>
      <section class="stats-row">
        <div class="stat"><span class="stat-label">Nesta semana</span><strong>${U.duration(week)}</strong></div>
        <div class="stat"><span class="stat-label">Total estudado</span><strong>${U.duration(total)}</strong></div>
        <div class="stat"><span class="stat-label">Sequência</span><strong>${F.streak()} 🔥</strong></div>
        <div class="stat"><span class="stat-label">Revisões feitas</span><strong>${reviewsDone}</strong></div>
        <div class="stat"><span class="stat-label">Dominados</span><strong>${mastered} 🌸</strong></div>
        ${avg ? `<div class="stat"><span class="stat-label">Média das notas</span><strong>${avg}</strong></div>` : ''}
      </section>
      <section class="garden">${flowers}</section>
      <section class="card">
        <h3>🗓️ Últimos 28 dias</h3>
        <div class="heat">${cells.join('')}</div>
        <p class="muted small">Quanto mais escuro, mais perto da sua meta diária (${U.duration(goal)}).</p>
      </section>`;
  }

  F.views.jardim = { render };
})(window.Florescer = window.Florescer || {});
