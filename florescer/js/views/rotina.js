/* Florescer · "Minha rotina": horários livres, compromissos, eventos, sono e energia.
 * Os blocos daqui também são usados dentro do questionário de boas-vindas.
 */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const WIN = [
    { id: 'manha', label: '🌅 Manhã' },
    { id: 'tarde', label: '☀️ Tarde' },
    { id: 'noite', label: '🌙 Noite' }
  ];
  const LIFE = [
    { title: 'Aula', emoji: '🎓', start: '08:00', end: '12:00', days: [0, 1, 1, 1, 1, 1, 0] },
    { title: 'Estágio', emoji: '💼', start: '13:00', end: '17:00', days: [0, 1, 1, 1, 1, 1, 0] },
    { title: 'Trabalho', emoji: '🏢', start: '09:00', end: '18:00', days: [0, 1, 1, 1, 1, 1, 0] },
    { title: 'Academia', emoji: '🏋️', start: '18:00', end: '19:00', days: [0, 1, 0, 1, 0, 1, 0] },
    { title: 'Terapia', emoji: '🧘', start: '17:00', end: '18:00', days: [0, 0, 0, 1, 0, 0, 0] },
    { title: 'Almoço', emoji: '🍽️', start: '12:00', end: '13:00', days: [1, 1, 1, 1, 1, 1, 1] },
    { title: 'Igreja', emoji: '⛪', start: '18:00', end: '20:00', days: [1, 0, 0, 0, 0, 0, 0] },
    { title: 'Tempo com quem amo', emoji: '💕', start: '20:00', end: '22:00', days: [0, 0, 0, 0, 0, 1, 1] },
    { title: 'Lazer', emoji: '🎮', start: '19:00', end: '21:00', days: [0, 0, 0, 0, 0, 0, 1] }
  ];
  const LIFE_EMOJIS = ['🎓', '💼', '🏢', '🏋️', '🧘', '🍽️', '⛪', '💕', '🎮', '🚌', '🏠', '🐶', '🎵', '🩺', '✨'];

  function nextDateFor(wd) {
    const t = U.today();
    return U.addDays(t, (wd - U.weekday(t) + 7) % 7);
  }

  function windowsOf(dayList) {
    const st = store.state.settings;
    return WIN.filter((w) => dayList.some((x) => x.start === st.windows[w.id].start && x.end === st.windows[w.id].end));
  }

  /* ---------- blocos reutilizáveis ---------- */

  function availability(submitLabel) {
    const s = store.state.settings;
    const rows = DAYS.map((d, i) => {
      const on = windowsOf(s.availability[i] || []).map((w) => w.id);
      const cap = F.planner.capacity(store.state, nextDateFor(i));
      const target = s.dailyTarget[i] || 0;
      const warn = target > cap + 5;
      return `
        <tr>
          <th>${d}</th>
          ${WIN.map((w) => `<td><label class="check"><input type="checkbox" name="w${i}-${w.id}" ${on.includes(w.id) ? 'checked' : ''}><span></span></label></td>`).join('')}
          <td><input type="number" name="h${i}" min="0" max="14" step="0.5" value="${target / 60}" class="hours"></td>
          <td class="small ${warn ? 'warn-txt' : 'muted'}">${target ? (warn ? `⚠️ só cabem ${U.duration(cap)}` : `cabem ${U.duration(cap)}`) : 'descanso'}</td>
        </tr>`;
    }).join('');
    return `
      <form class="card form" data-form="availability">
        <h3>🗓️ Quando você pode estudar</h3>
        <p class="muted small">Marque os períodos livres de cada dia e quantas horas quer estudar. Coloque 0 nos dias de descanso. Seus compromissos são descontados automaticamente.</p>
        <div class="row three">
          ${WIN.map(
            (w) => `<div class="field"><span>${w.label}</span>
              <div class="row nowrap"><input type="time" name="${w.id}-start" value="${s.windows[w.id].start}"><span class="muted">às</span><input type="time" name="${w.id}-end" value="${s.windows[w.id].end}"></div></div>`
          ).join('')}
        </div>
        <div class="table-wrap">
          <table class="avail">
            <thead><tr><th></th>${WIN.map((w) => `<th>${w.label}</th>`).join('')}<th>Horas</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="row">
          <button class="btn soft small" type="button" data-action="copy-weekday">Copiar segunda para os outros dias úteis</button>
          <span class="spacer"></span>
          <button class="btn primary" type="submit">${submitLabel || 'Salvar horários'}</button>
        </div>
      </form>`;
  }

  function commitments() {
    const list = store.state.commitments;
    return `
      <section class="card form">
        <h3>🧺 Compromissos fixos da semana</h3>
        <p class="muted small">Aula, estágio, academia, terapia, tempo com quem você ama… O cronograma nunca coloca estudo em cima disso (e ainda deixa 15 min de folga para deslocamento).</p>
        <div class="chips">${LIFE.map((l, i) => `<button class="chip-btn" type="button" data-action="life-chip" data-i="${i}">${l.emoji} ${l.title}</button>`).join('')}</div>
        <form class="form inner" data-form="commitment" id="commit-form">
          <div class="row two">
            <label class="field"><span>O quê</span><input name="title" required maxlength="40" placeholder="Ex.: Aula, Estágio, Academia"></label>
            <label class="field"><span>Ícone</span><select name="emoji">${LIFE_EMOJIS.map((e) => `<option>${e}</option>`).join('')}</select></label>
          </div>
          <div class="field"><span>Dias</span><div class="days">${DAYS.map((d, i) => `<label><input type="checkbox" name="d${i}"><span>${d}</span></label>`).join('')}</div></div>
          <div class="row two">
            <label class="field"><span>Começa</span><input type="time" name="start" required value="08:00"></label>
            <label class="field"><span>Termina</span><input type="time" name="end" required value="12:00"></label>
          </div>
          <button class="btn primary small" type="submit">Adicionar compromisso</button>
        </form>
        ${
          list.length
            ? `<ul class="life-list">${list
                .map(
                  (c) => `<li><span class="life-emoji">${c.emoji}</span><span><strong>${U.esc(c.title)}</strong>
                    <small class="muted">${DAYS.filter((_, i) => c.days[i]).join(', ')} · ${c.start}–${c.end}</small></span>
                    <button class="btn ghost tiny" data-action="del-commitment" data-id="${c.id}">✕</button></li>`
                )
                .join('')}</ul>`
            : ''
        }
      </section>`;
  }

  function events() {
    const today = U.today();
    const list = store.state.events.filter((e) => e.date >= U.addDays(today, -1)).sort((a, b) => a.date.localeCompare(b.date));
    return `
      <section class="card form">
        <h3>📌 Eventos e dias especiais</h3>
        <p class="muted small">Aniversário, viagem, consulta, show… Marque "sem estudo" para o dia inteiro ficar livre: o cronograma redistribui o resto da semana.</p>
        <form class="form inner" data-form="event">
          <div class="row two">
            <label class="field"><span>O quê</span><input name="title" required maxlength="50" placeholder="Ex.: Aniversário da Ju"></label>
            <label class="field"><span>Data</span><input type="date" name="date" required value="${today}"></label>
          </div>
          <div class="row">
            <label class="toggle"><input type="checkbox" name="allDay" checked data-change="event-allday"><span>Dia inteiro</span></label>
            <label class="toggle"><input type="checkbox" name="noStudy"><span>Sem estudo nesse dia</span></label>
          </div>
          <div class="row two event-times" hidden>
            <label class="field"><span>Começa</span><input type="time" name="start" value="19:00"></label>
            <label class="field"><span>Termina</span><input type="time" name="end" value="22:00"></label>
          </div>
          <button class="btn primary small" type="submit">Adicionar evento</button>
        </form>
        ${
          list.length
            ? `<ul class="life-list">${list
                .map(
                  (e) => `<li><span class="life-emoji">${e.emoji || '📌'}</span><span><strong>${U.esc(e.title)}</strong>
                    <small class="muted">${U.formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${
                    e.allDay ? (e.noStudy ? 'dia livre, sem estudo' : 'dia inteiro') : `${e.start}–${e.end}`
                  }</small></span>
                    <button class="btn ghost tiny" data-action="del-event" data-id="${e.id}">✕</button></li>`
                )
                .join('')}</ul>`
            : ''
        }
      </section>`;
  }

  function rhythm(submitLabel) {
    const s = store.state.settings;
    return `
      <form class="card form" data-form="rhythm">
        <h3>⚡ Seu ritmo</h3>
        <div class="row two">
          <label class="field"><span>😴 Acordo às</span><input type="time" name="wake" value="${s.sleep.wake}"></label>
          <label class="field"><span>🛌 Durmo às</span><input type="time" name="bed" value="${s.sleep.bed}"></label>
        </div>
        <div class="field"><span>Quando sua cabeça rende mais? <small class="muted">As matérias mais difíceis vão para esse horário.</small></span>
          <div class="cards-pick">
            ${[['manha', '🌅', 'Manhã'], ['tarde', '☀️', 'Tarde'], ['noite', '🌙', 'Noite']]
              .map(([v, e, l]) => `<label><input type="radio" name="peak" value="${v}" ${s.peak === v ? 'checked' : ''}><span>${e}<strong>${l}</strong></span></label>`)
              .join('')}
          </div>
        </div>
        <div class="field"><span>Intensidade</span>
          <div class="cards-pick">
            ${Object.keys(store.INTENSITY)
              .map((k) => {
                const p = store.INTENSITY[k];
                return `<label><input type="radio" name="intensity" value="${k}" ${s.intensity === k ? 'checked' : ''}><span>${p.label}<small>blocos de ${p.blockMinutes} min · pomodoro ${p.pomodoro.focus}/${p.pomodoro.short}</small></span></label>`;
              })
              .join('')}
          </div>
        </div>
        <button class="btn primary" type="submit">${submitLabel || 'Salvar ritmo'}</button>
      </form>`;
  }

  F.rotinaUI = { availability, commitments, events, rhythm };

  function render() {
    const s = store.state.settings;
    const week = s.dailyTarget.reduce((a, b) => a + b, 0);
    return `
      <header class="page-head">
        <h1>🧺 Minha rotina</h1>
        <p class="muted">Estudo bom é estudo que cabe na sua vida. Aqui você conta pro Florescer quando pode estudar e o que não pode ser mexido.
        Meta atual: <strong>${U.duration(week)} por semana</strong>.</p>
      </header>
      <div class="stack">
        ${availability()}
        <div class="split even">
          ${commitments()}
          <div class="stack">${rhythm()}${events()}</div>
        </div>
      </div>`;
  }

  /* ---------- ações ---------- */

  function afterChange(msg) {
    store.touchPlan();
    store.save();
    if (msg) F.toast(msg);
    F.render();
  }

  F.action('form:availability', (form, data) => {
    const s = store.state.settings;
    WIN.forEach((w) => {
      const start = data.get(`${w.id}-start`);
      const end = data.get(`${w.id}-end`);
      if (start && end) s.windows[w.id] = { start, end };
    });
    s.availability = DAYS.map((_, i) => WIN.filter((w) => data.get(`w${i}-${w.id}`) === 'on').map((w) => Object.assign({}, s.windows[w.id])));
    s.dailyTarget = DAYS.map((_, i) => Math.round(U.clamp(Number(data.get(`h${i}`)) || 0, 0, 14) * 60));
    if (form.dataset.next) F.actions['wiz-next']();
    else afterChange('Horários salvos 💗');
  });

  F.action('copy-weekday', () => {
    const form = document.querySelector('form[data-form=availability]');
    if (!form) return;
    for (let i = 2; i <= 5; i++) {
      WIN.forEach((w) => (form[`w${i}-${w.id}`].checked = form[`w1-${w.id}`].checked));
      form[`h${i}`].value = form.h1.value;
    }
    F.toast('Copiei a segunda para terça a sexta. Agora é só salvar.');
  });

  F.action('life-chip', (el) => {
    const l = LIFE[Number(el.dataset.i)];
    const form = document.getElementById('commit-form');
    if (!l || !form) return;
    form.title.value = l.title;
    form.emoji.value = l.emoji;
    form.start.value = l.start;
    form.end.value = l.end;
    l.days.forEach((on, i) => (form[`d${i}`].checked = !!on));
    form.title.focus();
  });

  F.action('form:commitment', (form, data) => {
    const days = DAYS.map((_, i) => data.get(`d${i}`) === 'on');
    if (!days.some(Boolean)) {
      F.toast('Escolha pelo menos um dia 🙂');
      return;
    }
    store.add('commitments', {
      title: String(data.get('title') || '').trim(),
      emoji: data.get('emoji') || '✨',
      days,
      start: data.get('start'),
      end: data.get('end')
    });
    F.toast('Compromisso guardado. O estudo vai desviar dele 💗');
    F.render();
  });
  F.action('del-commitment', (el) => {
    store.remove('commitments', el.dataset.id);
    F.render();
  });

  F.action('change:event-allday', (el) => {
    const box = el.closest('form').querySelector('.event-times');
    if (box) box.hidden = el.checked;
  });
  F.action('form:event', (form, data) => {
    const allDay = data.get('allDay') === 'on';
    store.add('events', {
      title: String(data.get('title') || '').trim(),
      emoji: '📌',
      date: data.get('date'),
      allDay,
      noStudy: allDay && data.get('noStudy') === 'on',
      start: allDay ? null : data.get('start'),
      end: allDay ? null : data.get('end')
    });
    F.toast('Evento anotado 📌');
    F.render();
  });
  F.action('del-event', (el) => {
    store.remove('events', el.dataset.id);
    F.render();
  });

  F.action('form:rhythm', (form, data) => {
    const s = store.state.settings;
    s.sleep = { wake: data.get('wake') || s.sleep.wake, bed: data.get('bed') || s.sleep.bed };
    s.peak = data.get('peak') || s.peak;
    const intensity = data.get('intensity') || s.intensity;
    if (intensity !== s.intensity) {
      store.applyIntensity(intensity);
      if (!F.pomodoro.s.running) F.pomodoro.reset();
    }
    if (form.dataset.next) F.actions['wiz-next']();
    else afterChange('Ritmo salvo ⚡');
  });

  F.views.rotina = { render };
})(window.Florescer = window.Florescer || {});
