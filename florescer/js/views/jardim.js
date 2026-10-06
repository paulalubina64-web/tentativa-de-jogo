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
    const targets = st.settings.dailyTarget;
    const avgGoal = Math.round(targets.reduce((a, b) => a + b, 0) / Math.max(1, targets.filter(Boolean).length)) || 60;
    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const d = U.addDays(today, -i);
      const m = minutesByDay[d] || 0;
      const goal = targets[U.weekday(d)] || avgGoal;
      const lvl = m === 0 ? 0 : m < goal * 0.34 ? 1 : m < goal * 0.67 ? 2 : m < goal ? 3 : 4;
      cells.push(`<span class="cell l${lvl}" title="${U.formatDate(d)}: ${U.duration(m)}"></span>`);
    }

    const total = st.sessions.reduce((a, x) => a + x.minutes, 0);
    const week = st.sessions.filter((x) => x.date > U.addDays(today, -7)).reduce((a, x) => a + x.minutes, 0);
    const reviewsDone = st.topics.concat(st.cards).reduce((a, t) => a + (t.history || []).filter((h) => h.type === 'revisao').length, 0);
    const mastered = st.topics.filter((t) => t.status === 'dominado').length;
    const grades = st.exams.filter((e) => e.grade != null);
    const avg = grades.length ? (grades.reduce((a, e) => a + (e.grade / (e.maxGrade || 10)) * 10, 0) / grades.length).toFixed(1) : null;
    const tips = F.insights.list(st);

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
        ${avg ? `<div class="stat"><span class="stat-label">Média das notas</span><strong>${avg}</strong><small class="muted">de 0 a 10</small></div>` : ''}
      </section>
      ${tips.length ? `<section class="card"><h3>💡 O que seus dados dizem</h3><div class="insights">${F.insightCards(tips)}</div></section>` : ''}
      <section class="garden">${flowers}</section>
      <section class="card">
        <h3>🗓️ Últimos 28 dias</h3>
        <div class="heat">${cells.join('')}</div>
        <p class="muted small">Quanto mais escuro, mais perto da sua meta do dia.</p>
      </section>
      ${reflection()}
      ${history()}`;
  }

  /* ---------- histórico semanal (de cada pessoa, desde o primeiro dia) ---------- */

  function weekSummary(st, wk) {
    const end = U.addDays(wk, 7);
    const inWeek = (d) => d >= wk && d < end;
    const minutes = st.sessions.filter((x) => inWeek(x.date)).reduce((a, x) => a + x.minutes, 0);
    let reviews = 0;
    let learned = 0;
    st.topics.concat(st.cards).forEach((t) =>
      (t.history || []).forEach((h) => {
        if (!inWeek(h.date)) return;
        if (h.type === 'revisao') reviews++;
        else if (h.type === 'estudo') learned++;
      })
    );
    let planned = (st.weekStats[wk] || {}).planned || 0;
    let done = (st.weekStats[wk] || {}).done || 0;
    Object.keys(st.plans).forEach((k) => {
      if (!inWeek(k)) return;
      planned += st.plans[k].blocks.length;
      done += st.plans[k].blocks.filter((b) => b.done).length;
    });
    const goal = st.settings.dailyTarget.reduce((a, b) => a + b, 0);
    return { wk, minutes, reviews, learned, planned, done, goal };
  }

  function history() {
    const st = store.state;
    const today = U.today();
    const firstDates = [st.profile.createdAt].concat(st.sessions.map((x) => x.date)).filter(Boolean).sort();
    const first = U.weekStart(firstDates[0] || today);
    const weeks = [];
    for (let wk = U.weekStart(today); wk >= first && weeks.length < 52; wk = U.addDays(wk, -7)) weeks.push(weekSummary(st, wk));
    const rows = weeks
      .map((w) => {
        const r = st.reflections[w.wk];
        const pct = w.goal ? Math.min(100, Math.round((w.minutes / w.goal) * 100)) : 0;
        return `
          <li class="hist">
            <div class="hist-head">
              <strong>${w.wk === U.weekStart(today) ? 'Esta semana' : 'Semana de ' + U.formatDate(w.wk, { day: 'numeric', month: 'short' })}</strong>
              <span class="muted small">${U.duration(w.minutes)} · ${w.learned} conteúdos novos · ${w.reviews} revisões${w.planned ? ` · ${w.done}/${w.planned} blocos` : ''}</span>
            </div>
            <div class="bar"><span style="width:${pct}%"></span></div>
            ${
              r
                ? `<div class="hist-ref"><span>✅ ${U.esc(r.good)}</span><span>🚧 ${U.esc(r.hard)}</span><span>🔧 ${U.esc(r.change)}</span></div>`
                : ''
            }
          </li>`;
      })
      .join('');
    return `
      <section class="card">
        <h3>📈 Seu histórico</h3>
        <p class="muted small">Tudo o que você já fez, semana a semana. Comparar você com você mesma(o) é a única comparação que importa.</p>
        <ul class="hist-list">${rows}</ul>
      </section>`;
  }

  function reflection() {
    const st = store.state;
    const today = U.today();
    const thisWk = U.weekStart(today);
    // Domingo: reflete sobre a semana atual; nos outros dias, sobre a semana passada (se ainda não fez).
    const lastWk = U.addDays(thisWk, -7);
    const lastHadActivity = st.sessions.some((x) => x.date >= lastWk && x.date < thisWk);
    const wk = U.weekday(today) !== 0 && lastHadActivity && !st.reflections[lastWk] ? lastWk : thisWk;
    const r = st.reflections[wk];
    if (r && wk !== thisWk) return '';
    const s = weekSummary(st, wk);
    return `
      <form class="card form" data-form="reflection" data-wk="${wk}">
        <h3>📝 Revisão da semana <small class="muted">· ${wk === thisWk ? 'esta semana' : 'semana passada'}: ${U.duration(s.minutes)} estudados</small></h3>
        <p class="muted small">Dois minutos de reflexão valem horas de estudo no automático. É assim que se ajusta o método.</p>
        <label class="field"><span>✅ O que funcionou?</span><input name="good" maxlength="200" value="${r ? U.esc(r.good) : ''}" placeholder="Ex.: estudar Penal de manhã rendeu muito"></label>
        <label class="field"><span>🚧 O que atrapalhou?</span><input name="hard" maxlength="200" value="${r ? U.esc(r.hard) : ''}" placeholder="Ex.: celular na mesa, dormi tarde"></label>
        <label class="field"><span>🔧 O que vou mudar na próxima semana?</span><input name="change" maxlength="200" value="${r ? U.esc(r.change) : ''}" placeholder="Ex.: celular em outro cômodo durante o pomodoro"></label>
        <button class="btn primary" type="submit">${r ? 'Atualizar' : 'Salvar reflexão'}</button>
      </form>`;
  }

  F.action('form:reflection', (form, data) => {
    store.state.reflections[form.dataset.wk] = {
      good: String(data.get('good') || '').trim(),
      hard: String(data.get('hard') || '').trim(),
      change: String(data.get('change') || '').trim(),
      savedAt: U.today()
    };
    store.save();
    F.toast('Reflexão guardada no seu histórico 📝');
    F.render();
  });

  F.views.jardim = { render };
})(window.Florescer = window.Florescer || {});
