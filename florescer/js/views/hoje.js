/* Florescer · tela "Hoje" */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const planner = F.planner;

  function onboarding() {
    const st = store.state;
    const steps = [
      { done: !!st.profile.name, text: 'Me conta seu nome', view: 'ajustes' },
      { done: st.subjects.length > 0, text: 'Cadastre suas matérias (com peso e dificuldade)', view: 'materias' },
      { done: st.topics.length > 0, text: 'Adicione os conteúdos de cada matéria', view: 'materias' },
      { done: st.exams.length > 0, text: 'Coloque as datas das provas', view: 'provas' }
    ];
    return `
      <section class="card welcome">
        <div class="welcome-art">🌱</div>
        <div>
          <h2>Seu jardim começa aqui</h2>
          <p class="muted">Cada matéria vai virar uma flor. Quanto mais você estuda e revisa, mais ela floresce.</p>
          <ol class="steps">
            ${steps
              .map(
                (s) => `<li class="${s.done ? 'done' : ''}">
                  <span class="step-dot">${s.done ? '✓' : ''}</span>
                  <button class="link" data-action="go" data-view="${s.view}">${s.text}</button>
                </li>`
              )
              .join('')}
          </ol>
        </div>
      </section>`;
  }

  function examBanner() {
    const today = U.today();
    const next = store.state.exams
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!next) return '';
    const sub = store.subject(next.subjectId);
    const days = U.diffDays(today, next.date);
    return `
      <button class="countdown" data-action="go" data-view="provas" style="--c:${sub ? sub.color : '#F9A8D4'}">
        <span class="countdown-num">${days}</span>
        <span class="countdown-txt">
          <small>${days === 0 ? 'prova hoje!' : days === 1 ? 'dia para' : 'dias para'}</small>
          <strong>${U.esc(next.title)}</strong>
          <small>${sub ? sub.emoji + ' ' + U.esc(sub.name) : ''} · ${U.formatDate(next.date, { day: 'numeric', month: 'long' })}</small>
        </span>
      </button>`;
  }

  function reviewRow(block, topicId) {
    const t = store.topic(topicId);
    if (!t) return '';
    const sub = store.subject(t.subjectId);
    const q = block.reviewed[topicId];
    const buttons = q
      ? `<span class="reviewed">${F.srs.QUALITY[q].emoji} ${F.srs.QUALITY[q].label} · ${
          t.nextReview ? 'próxima ' + U.formatDate(t.nextReview) : 'dominado 🌸'
        }</span>`
      : Object.keys(F.srs.QUALITY)
          .map(
            (k) => `<button class="q q-${k}" data-action="review" data-block="${block.id}" data-topic="${t.id}" data-q="${k}"
              title="${F.srs.QUALITY[k].label}">${F.srs.QUALITY[k].emoji} ${F.srs.QUALITY[k].label}</button>`
          )
          .join('');
    return `
      <li class="review-row ${q ? 'is-done' : ''}">
        <span class="dot" style="--c:${sub ? sub.color : '#ddd'}"></span>
        <span class="review-title">${U.esc(t.title)} <small class="muted">${sub ? sub.emoji : ''} · ${t.step + 1}ª revisão</small></span>
        <span class="review-actions">${buttons}</span>
      </li>`;
  }

  function blockCard(block) {
    const sub = store.subject(block.subjectId);
    const topic = block.topicId ? store.topic(block.topicId) : null;
    const mode = planner.MODES[block.mode] || planner.MODES.estudo;
    const exam = block.examId ? store.state.exams.find((e) => e.id === block.examId) : null;
    const examDays = exam ? U.diffDays(U.today(), exam.date) : null;
    const isActive = F.pomodoro.s.blockId === block.id;

    let study = '';
    if (sub) {
      const title = topic
        ? U.esc(topic.title)
        : block.mode === 'prova'
          ? 'Questões e simulado'
          : 'Exercícios e aprofundamento';
      const learned = topic && topic.status !== 'pendente';
      study = `
        <div class="study">
          <div class="study-head">
            ${F.chip(sub)}
            <span class="tag tag-${block.mode}">${mode.emoji} ${mode.label}${
              block.mode === 'prova' && exam ? ` · ${U.countdownLabel(examDays)}` : ''
            }</span>
          </div>
          <h4>${title}</h4>
          <p class="hint">${mode.hint}</p>
          ${
            topic && !block.done
              ? `<button class="btn soft small" data-action="learned" data-block="${block.id}">
                  ${learned ? '✓ Conteúdo estudado' : '🌱 Estudei esse conteúdo'}</button>`
              : ''
          }
        </div>`;
    }

    const reviews = block.reviews.length
      ? `<div class="reviews">
          <p class="reviews-head">🔁 Revisões (${block.reviews.length}) <small class="muted">· tente lembrar antes de olhar</small></p>
          <ul>${block.reviews.map((id) => reviewRow(block, id)).join('')}</ul>
        </div>`
      : '';

    const logged = block.logged ? `<span class="muted small">🍅 ${U.duration(block.logged)} registrados</span>` : '';

    return `
      <article class="block ${block.done ? 'done' : ''} ${isActive ? 'active' : ''}" style="--c:${sub ? sub.color : 'var(--lilac)'}">
        <div class="block-time">
          <strong>${block.start}</strong><span>${block.end}</span><small>${U.duration(block.minutes)}</small>
        </div>
        <div class="block-body">
          ${reviews}
          ${study}
          <div class="block-foot">
            ${logged}
            <span class="spacer"></span>
            ${
              block.done
                ? ''
                : `<button class="btn ghost small" data-action="focus" data-block="${block.id}">▶ Pomodoro</button>`
            }
            <button class="btn ${block.done ? 'ghost' : 'primary'} small" data-action="done" data-block="${block.id}">
              ${block.done ? '↺ Desfazer' : '✓ Concluir bloco'}</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const st = store.state;
    const today = U.today();
    const name = st.profile.name ? `, ${U.esc(st.profile.name)}` : '';

    const { plan, changed } = planner.ensureToday(st);
    if (changed) store.save();

    const planned = plan.blocks.reduce((a, b) => a + b.minutes, 0);
    const studied = F.minutesOn(today);
    const pct = planned ? U.clamp(Math.round((studied / planned) * 100), 0, 100) : 0;
    const doneBlocks = plan.blocks.filter((b) => b.done).length;
    const streak = F.streak();

    let body = '';
    if (!st.subjects.length) {
      body = onboarding();
    } else if (plan.off) {
      body = F.empty(
        '🌙',
        'Hoje é dia de descanso',
        'Descansar também faz parte: é dormindo que o cérebro consolida o que você estudou.',
        '<button class="btn primary" data-action="force-day">Quero estudar mesmo assim</button>'
      );
    } else if (!plan.blocks.length) {
      body = F.empty('🫧', 'Nada planejado', 'Confira em Ajustes se seus períodos de estudo têm minutos.', '');
    } else {
      const periods = st.settings.periods
        .map((p) => {
          const blocks = plan.blocks.filter((b) => b.period === p.id);
          if (!blocks.length) return '';
          return `
            <section class="period">
              <h3 class="period-title">${p.emoji} ${U.esc(p.label)} <small class="muted">a partir das ${p.start}</small></h3>
              ${blocks.map(blockCard).join('')}
            </section>`;
        })
        .join('');
      body = periods;
    }

    const banners = [];
    const missed = planner.missedBefore(st, today);
    if (missed && st.subjects.length && plan.noticeDismissed !== missed.date) {
      banners.push(`
        <div class="banner info">
          <span>💗 No dia ${U.formatDate(missed.date)} ficaram <strong>${missed.missed} bloco${missed.missed > 1 ? 's' : ''}</strong> sem fazer.
          Tudo bem! Os conteúdos e revisões já foram redistribuídos no plano de hoje.</span>
          <button class="btn ghost small" data-action="dismiss-missed" data-date="${missed.date}">Entendi</button>
        </div>`);
    }
    if (plan.stale && st.subjects.length) {
      banners.push(`
        <div class="banner warn">
          <span>✨ Você mudou matérias, provas ou ajustes. Quer que eu refaça o resto do dia?</span>
          <button class="btn primary small" data-action="replan">Replanejar</button>
        </div>`);
    }
    if (plan.postponed && plan.postponed.length) {
      banners.push(`
        <div class="banner soft">
          <span>🧺 ${plan.postponed.length} revis${plan.postponed.length > 1 ? 'ões ficaram' : 'ão ficou'} para amanhã:
          o dia já estava cheio, e revisar com calma rende mais.</span>
        </div>`);
    }

    return `
      <header class="hero">
        <div>
          <p class="muted hero-date">${U.longDate(today)}</p>
          <h1>${U.greeting()}${name} 🌷</h1>
          <p class="muted">${
            st.subjects.length
              ? `${doneBlocks} de ${plan.blocks.length} blocos concluídos hoje`
              : 'Vamos montar seu cronograma?'
          }</p>
        </div>
        ${examBanner()}
      </header>

      ${
        st.subjects.length
          ? `<section class="stats-row">
              <div class="stat"><span class="stat-label">Estudado hoje</span><strong>${U.duration(studied)}</strong>
                <div class="bar"><span style="width:${pct}%"></span></div><small class="muted">meta: ${U.duration(planned)}</small></div>
              <div class="stat"><span class="stat-label">Sequência</span><strong>${streak} ${streak === 1 ? 'dia' : 'dias'} 🔥</strong>
                <small class="muted">${streak ? 'não quebre a corrente!' : 'comece hoje 🌱'}</small></div>
              <div class="stat"><span class="stat-label">Revisões hoje</span><strong>${plan.blocks.reduce(
                (a, b) => a + b.reviews.length,
                0
              )}</strong><small class="muted">para a memória não murchar</small></div>
            </section>`
          : ''
      }

      ${banners.join('')}
      ${body}

      ${
        st.subjects.length && !plan.off && plan.blocks.length
          ? `<div class="center"><button class="btn ghost" data-action="replan">🔄 Replanejar o resto do dia</button></div>`
          : ''
      }`;
  }

  /* ---------- ações ---------- */

  function todayBlock(id) {
    const plan = store.state.plans[U.today()];
    return plan ? plan.blocks.find((b) => b.id === id) : null;
  }

  F.action('review', (el) => {
    const b = todayBlock(el.dataset.block);
    const t = store.topic(el.dataset.topic);
    if (!b || !t) return;
    F.srs.review(store.state, t, el.dataset.q, U.today());
    b.reviewed[t.id] = el.dataset.q;
    const allDone = b.reviews.every((id) => b.reviewed[id] || !store.topic(id));
    if (allDone && !b.subjectId && !b.done) completeBlock(b);
    store.save();
    F.render();
  });

  F.action('learned', (el) => {
    const b = todayBlock(el.dataset.block);
    const t = b && store.topic(b.topicId);
    if (!t) return;
    if (t.status === 'pendente') {
      F.srs.markStudied(store.state, t, U.today());
      F.toast(`🌱 Plantado! Primeira revisão em ${store.state.settings.reviewIntervals[0]} dia(s).`);
    }
    if (!b.done) completeBlock(b);
    store.save();
    F.render();
  });

  function completeBlock(b) {
    b.done = true;
    // Registra o tempo do bloco que o Pomodoro ainda não registrou.
    const missing = b.minutes - (b.logged || 0);
    const subjectId = b.subjectId || (store.topic(b.reviews[0]) || {}).subjectId;
    if (missing > 0 && subjectId) {
      store.state.sessions.push({
        id: U.uid(),
        subjectId,
        minutes: missing,
        kind: b.subjectId ? 'estudo' : 'revisao',
        date: U.today(),
        blockId: b.id
      });
      b.autoLogged = missing;
    }
    if (F.pomodoro.s.blockId === b.id) F.pomodoro.attach(null, null);
  }

  F.action('done', (el) => {
    const b = todayBlock(el.dataset.block);
    if (!b) return;
    if (b.done) {
      b.done = false;
      if (b.autoLogged) {
        store.state.sessions = store.state.sessions.filter((s) => s.blockId !== b.id);
        b.autoLogged = 0;
      }
    } else {
      completeBlock(b);
      F.toast('Bloco concluído! Mais uma pétala 🌸');
    }
    store.save();
    F.render();
  });

  F.action('focus', (el) => {
    const b = todayBlock(el.dataset.block);
    if (!b) return;
    const subjectId = b.subjectId || (store.topic(b.reviews[0]) || {}).subjectId;
    F.pomodoro.attach(subjectId, b.id);
    F.go('pomodoro');
  });

  F.action('replan', () => {
    F.planner.replanToday(store.state);
    store.save();
    F.toast('Pronto! Refiz o resto do seu dia ✨');
    F.render();
  });

  F.action('force-day', () => {
    F.planner.replanToday(store.state, { force: true });
    store.save();
    F.render();
  });

  F.action('dismiss-missed', (el) => {
    const plan = store.state.plans[U.today()];
    if (plan) plan.noticeDismissed = el.dataset.date;
    store.save();
    F.render();
  });

  F.views.hoje = { render };
})(window.Florescer = window.Florescer || {});
