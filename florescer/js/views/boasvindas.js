/* Florescer · questionário de boas-vindas (o app monta tudo a partir das respostas) */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;

  const GOALS = {
    notas: { emoji: '🏆', label: 'Tirar notas altas', prep: 10 },
    passar: { emoji: '✅', label: 'Passar em tudo sem sufoco', prep: 7 },
    recuperar: { emoji: '🩹', label: 'Recuperar matérias difíceis', prep: 10 },
    concurso: { emoji: '⚖️', label: 'Me preparar para OAB / concurso', prep: 14 }
  };

  const STEPS = [
    { title: 'Sobre você', emoji: '💗' },
    { title: 'Seu ritmo', emoji: '⚡' },
    { title: 'Quando você pode estudar', emoji: '🗓️' },
    { title: 'Sua vida fora dos estudos', emoji: '🧺' },
    { title: 'Suas matérias', emoji: '📚' },
    { title: 'Suas provas', emoji: '🎯' },
    { title: 'Tudo pronto', emoji: '🌸' }
  ];

  const SCALE = (name, label, value, names) => `
    <label class="field"><span>${label}</span>
      <select name="${name}">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === value ? 'selected' : ''}>${n} · ${names[n - 1]}</option>`).join('')}</select>
    </label>`;

  function step0() {
    const p = store.state.profile;
    return `
      <form class="card form" data-form="wiz-profile">
        <label class="field"><span>Como você quer ser chamada(o)?</span><input name="name" required maxlength="40" value="${U.esc(p.name)}"></label>
        <div class="field"><span>Avatar</span><div class="picker">${F.AVATARS.map(
          (a) => `<label><input type="radio" name="avatar" value="${a}" ${a === p.avatar ? 'checked' : ''}><span>${a}</span></label>`
        ).join('')}</div></div>
        <div class="row two">
          <label class="field"><span>Curso</span><input name="course" maxlength="60" placeholder="Ex.: Direito" value="${U.esc(p.course)}"></label>
          <label class="field"><span>Semestre / período</span><input name="semester" maxlength="20" placeholder="Ex.: 3º" value="${U.esc(p.semester)}"></label>
        </div>
        <div class="field"><span>Qual é o seu objetivo principal agora?</span>
          <div class="cards-pick">${Object.keys(GOALS)
            .map((k) => `<label><input type="radio" name="goal" value="${k}" ${p.goal === k ? 'checked' : ''}><span>${GOALS[k].emoji}<strong>${GOALS[k].label}</strong></span></label>`)
            .join('')}</div>
        </div>
        <div class="wiz-nav"><span></span><button class="btn primary" type="submit">Continuar →</button></div>
      </form>`;
  }

  function next(html) {
    // Os formulários da Rotina avançam o questionário quando estão aqui dentro.
    return html.replace(/data-form="(availability|rhythm)"/, 'data-form="$1" data-next="1"').replace(/>(Salvar horários|Salvar ritmo)</, '>Continuar →<');
  }

  function subjectsStep() {
    const subs = store.state.subjects;
    return `
      <div class="split even">
        <form class="card form" data-form="wiz-subject">
          <h3>Adicionar matéria</h3>
          <label class="field"><span>Nome</span><input name="name" required maxlength="60" placeholder="Ex.: Direito Civil I"></label>
          <div class="row three">
            ${SCALE('weight', 'Peso na nota', 3, ['bem pouco', 'pouco', 'médio', 'alto', 'altíssimo'])}
            ${SCALE('difficulty', 'Dificuldade pra você', 3, ['tranquila', 'ok', 'média', 'difícil', 'muito difícil'])}
            ${SCALE('mastery', 'Quanto já domina', 2, ['nada', 'pouco', 'metade', 'bastante', 'quase tudo'])}
          </div>
          <label class="field"><span>Meta de nota <small class="muted">(0 a 10, opcional)</small></span><input type="number" name="goal" min="0" max="10" step="0.5" placeholder="Ex.: 9"></label>
          <label class="field"><span>Conteúdos <small class="muted">(opcional: um por linha, pode colar a ementa)</small></span>
            <textarea name="topics" rows="4" placeholder="Pessoa natural&#10;Personalidade e capacidade&#10;Direitos da personalidade"></textarea></label>
          <button class="btn primary" type="submit">Adicionar matéria</button>
        </form>
        <div class="card">
          <h3>Suas matérias (${subs.length})</h3>
          ${
            subs.length
              ? `<ul class="life-list">${subs
                  .map((s) => {
                    const n = store.state.topics.filter((t) => t.subjectId === s.id).length;
                    return `<li><span class="life-emoji" style="background:${s.color}">${s.emoji}</span><span><strong>${U.esc(s.name)}</strong>
                      <small class="muted">peso ${s.weight} · dificuldade ${s.difficulty} · ${n} conteúdo(s)${s.goal != null ? ` · meta ${s.goal}` : ''}</small></span>
                      <button class="btn ghost tiny" data-action="wiz-del-subject" data-id="${s.id}">✕</button></li>`;
                  })
                  .join('')}</ul>`
              : '<p class="muted">Nenhuma ainda. Adicione todas as matérias do semestre: o cronograma divide o tempo entre elas.</p>'
          }
        </div>
      </div>
      <div class="wiz-nav">
        <button class="btn ghost" data-action="wiz-back">← Voltar</button>
        <button class="btn primary" data-action="wiz-next" ${subs.length ? '' : 'disabled'}>Continuar →</button>
      </div>`;
  }

  function examsStep() {
    const st = store.state;
    const list = st.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    return `
      <div class="split even">
        <form class="card form" data-form="wiz-exam">
          <h3>Adicionar prova ou trabalho</h3>
          <label class="field"><span>Matéria</span><select name="subjectId">${st.subjects.map((s) => `<option value="${s.id}">${s.emoji} ${U.esc(s.name)}</option>`).join('')}</select></label>
          <div class="row two">
            <label class="field"><span>Tipo</span><select name="kind">${['Prova', 'Trabalho', 'Seminário', 'Simulado', 'Prova final'].map((k) => `<option>${k}</option>`).join('')}</select></label>
            <label class="field"><span>Data</span><input type="date" name="date" required value="${U.addDays(U.today(), 21)}"></label>
          </div>
          <label class="field"><span>Nome <small class="muted">(opcional)</small></span><input name="title" maxlength="60" placeholder="Ex.: P1"></label>
          <button class="btn primary" type="submit">Adicionar</button>
        </form>
        <div class="card">
          <h3>Calendário de provas (${list.length})</h3>
          ${
            list.length
              ? `<ul class="life-list">${list
                  .map((e) => {
                    const s = store.subject(e.subjectId);
                    return `<li><span class="life-emoji">🎯</span><span><strong>${U.esc(e.title || e.kind)} · ${s ? s.emoji + ' ' + U.esc(s.name) : ''}</strong>
                      <small class="muted">${U.formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${U.countdownLabel(U.diffDays(U.today(), e.date))}</small></span>
                      <button class="btn ghost tiny" data-action="wiz-del-exam" data-id="${e.id}">✕</button></li>`;
                  })
                  .join('')}</ul>`
              : '<p class="muted">Ainda não sabe as datas? Tudo bem, pule e adicione depois em Provas.</p>'
          }
        </div>
      </div>
      <div class="wiz-nav">
        <button class="btn ghost" data-action="wiz-back">← Voltar</button>
        <button class="btn primary" data-action="wiz-next">${list.length ? 'Continuar →' : 'Pular por enquanto →'}</button>
      </div>`;
  }

  function summary() {
    const st = store.state;
    const s = st.settings;
    const week = s.dailyTarget.reduce((a, b) => a + b, 0);
    const studyDays = s.dailyTarget.filter(Boolean).length;
    const proj = F.planner.projectWeek(st, U.today(), 7);
    const totals = {};
    proj.forEach((d) => d.blocks.forEach((b) => b.subjectId && (totals[b.subjectId] = (totals[b.subjectId] || 0) + b.minutes)));
    const max = Math.max(1, ...Object.values(totals));
    const goal = GOALS[st.profile.goal] || GOALS.notas;
    return `
      <div class="card summary">
        <h2>${U.esc(st.profile.name)}, seu jardim está pronto 🌸</h2>
        <div class="stats-row">
          <div class="stat"><span class="stat-label">Por semana</span><strong>${U.duration(week)}</strong><small class="muted">em ${studyDays} dias</small></div>
          <div class="stat"><span class="stat-label">Matérias</span><strong>${st.subjects.length}</strong></div>
          <div class="stat"><span class="stat-label">Provas</span><strong>${st.exams.length}</strong></div>
          <div class="stat"><span class="stat-label">Compromissos</span><strong>${st.commitments.length}</strong><small class="muted">respeitados</small></div>
        </div>
        <h3>Como vou dividir seus próximos 7 dias</h3>
        ${st.subjects
          .slice()
          .sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0))
          .map(
            (x) => `<div class="dist-row"><span class="dist-name">${x.emoji} ${U.esc(x.name)}</span>
              <div class="bar thick" style="--c:${x.color}"><span style="width:${((totals[x.id] || 0) / max) * 100}%"></span></div>
              <span class="dist-val">${U.duration(totals[x.id] || 0)}</span></div>`
          )
          .join('')}
        <ul class="promise">
          <li>${goal.emoji} Objetivo: <strong>${goal.label}</strong>. A reta final começa ${s.examPrepDays} dias antes de cada prova.</li>
          <li>⚡ As matérias mais difíceis vão para a sua <strong>${{ manha: 'manhã', tarde: 'tarde', noite: 'noite' }[s.peak]}</strong>.</li>
          <li>🔁 Tudo o que você estudar volta em revisões espaçadas: ${s.reviewIntervals.join(', ')} dias.</li>
          <li>🌙 Perdeu um dia? Eu replanejo sozinho, sem culpa.</li>
        </ul>
        <p class="muted small">Dá para mudar qualquer resposta depois em Matérias, Provas, Minha rotina e Ajustes.</p>
      </div>
      <div class="wiz-nav">
        <button class="btn ghost" data-action="wiz-back">← Voltar</button>
        <button class="btn primary big" data-action="wiz-finish">Começar a florescer 🌸</button>
      </div>`;
  }

  function render() {
    const p = store.state.profile;
    const step = U.clamp(p.onboardingStep || 0, 0, STEPS.length - 1);
    const R = F.rotinaUI;
    const bodies = [
      step0,
      () => next(R.rhythm()) + '<div class="wiz-nav"><button class="btn ghost" data-action="wiz-back">← Voltar</button><span></span></div>',
      () => next(R.availability()) + '<div class="wiz-nav"><button class="btn ghost" data-action="wiz-back">← Voltar</button><span></span></div>',
      () =>
        `<div class="split even">${R.commitments()}${R.events()}</div>
        <div class="wiz-nav"><button class="btn ghost" data-action="wiz-back">← Voltar</button><button class="btn primary" data-action="wiz-next">Continuar →</button></div>`,
      subjectsStep,
      examsStep,
      summary
    ];
    const pct = Math.round((step / (STEPS.length - 1)) * 100);
    const intro = [
      'Vamos montar um cronograma que é a sua cara. São 7 passos rapidinhos.',
      'Cada cérebro tem seu horário nobre. Vamos usar o seu a seu favor.',
      'Seja realista: uma meta que você cumpre vale mais que uma meta bonita que você abandona.',
      'Estudo bom respeita a vida. Diga o que não pode ser mexido.',
      'O peso e a dificuldade decidem quanto tempo cada matéria recebe.',
      'Com as datas, eu aviso se vai dar tempo e acelero a matéria quando a prova chegar.',
      ''
    ][step];
    return `
      <div class="wizard">
        <header class="wiz-head">
          <div class="wiz-top">
            <div class="wiz-brand">🌸 Florescer</div>
            <button class="btn ghost tiny" data-action="sign-out">${F.auth.mode === 'local' ? '↔ Trocar conta' : 'Sair'}</button>
          </div>
          <div class="wiz-progress"><span style="width:${pct}%"></span></div>
          <p class="muted small">Passo ${step + 1} de ${STEPS.length}</p>
          <h1>${STEPS[step].emoji} ${STEPS[step].title}</h1>
          ${intro ? `<p class="muted">${intro}</p>` : ''}
        </header>
        ${bodies[step]()}
      </div>`;
  }

  /* ---------- ações ---------- */

  function go(delta) {
    const p = store.state.profile;
    p.onboardingStep = U.clamp((p.onboardingStep || 0) + delta, 0, STEPS.length - 1);
    store.save();
    F.render();
    window.scrollTo({ top: 0 });
  }

  F.action('wiz-next', () => go(1));
  F.action('wiz-back', () => go(-1));

  F.action('form:wiz-profile', (form, data) => {
    const p = store.state.profile;
    p.name = String(data.get('name') || '').trim();
    p.avatar = data.get('avatar') || p.avatar;
    p.course = String(data.get('course') || '').trim();
    p.semester = String(data.get('semester') || '').trim();
    p.goal = data.get('goal') || 'notas';
    store.state.settings.examPrepDays = (GOALS[p.goal] || GOALS.notas).prep;
    go(1);
  });

  F.action('form:wiz-subject', (form, data) => {
    const st = store.state;
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const n = st.subjects.length;
    const goal = data.get('goal') === '' ? null : Number(data.get('goal'));
    const s = store.addSubject({
      name,
      emoji: F.EMOJIS[n % F.EMOJIS.length],
      color: F.COLORS[n % F.COLORS.length],
      weight: Number(data.get('weight')),
      difficulty: Number(data.get('difficulty')),
      mastery: Number(data.get('mastery')),
      goal: Number.isFinite(goal) ? goal : null
    });
    const topics = String(data.get('topics') || '')
      .split('\n')
      .map((l) => l.replace(/^\s*[-•*\d.)]+\s*/, '').trim())
      .filter(Boolean);
    if (topics.length) store.addTopics(s.id, topics);
    F.toast(`${s.emoji} ${name} plantada!`);
    F.render();
    const input = document.querySelector('form[data-form=wiz-subject] input[name=name]');
    if (input) input.focus();
  });
  F.action('wiz-del-subject', (el) => {
    store.deleteSubject(el.dataset.id);
    F.render();
  });

  F.action('form:wiz-exam', (form, data) => {
    store.addExam({
      subjectId: data.get('subjectId'),
      kind: data.get('kind') || 'Prova',
      title: String(data.get('title') || '').trim(),
      date: data.get('date'),
      notes: ''
    });
    F.toast('🎯 Anotado!');
    F.render();
  });
  F.action('wiz-del-exam', (el) => {
    store.deleteExam(el.dataset.id);
    F.render();
  });

  F.action('wiz-finish', () => {
    const st = store.state;
    st.profile.onboarded = true;
    st.profile.onboardingStep = 0;
    delete st.plans[U.today()];
    store.save();
    F.ui.view = 'hoje';
    F.toast('Bem-vinda(o) ao seu jardim 🌸');
    F.render();
  });

  F.views.boasvindas = { render, GOALS };
})(window.Florescer = window.Florescer || {});
