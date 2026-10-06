/* Florescer · tela "Hoje" */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const planner = F.planner;

  function noSubjects() {
    return F.empty('🌱', 'Seu jardim começa com uma matéria', 'Cadastre suas matérias e eu monto o seu dia sozinho.', '<button class="btn primary" data-action="go" data-view="materias">Cadastrar matérias</button>');
  }

  function lifeCard(x) {
    return `
      <article class="life-card">
        <div class="block-time"><strong>${x.start}</strong><span>${x.end}</span></div>
        <div><span class="life-emoji">${x.emoji}</span> <strong>${U.esc(x.title)}</strong> <small class="muted">${x.kind === 'evento' ? 'evento' : 'compromisso'}</small></div>
      </article>`;
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
    const tips = st.subjects.length ? F.insights.list(st).filter((i) => i.view !== 'cartoes' || !/esperando/.test(i.text)).slice(0, 2) : [];

    const life = plan.life || [];
    let body = '';
    if (!st.subjects.length) {
      body = noSubjects();
    } else if (plan.off) {
      body = F.empty(
        plan.offReason ? '📌' : '🌙',
        plan.offReason ? `Hoje é dia de: ${U.esc(plan.offReason)}` : 'Hoje é dia de descanso',
        plan.offReason
          ? 'Aproveite! O estudo de hoje já foi redistribuído pelos outros dias.'
          : 'Descansar também faz parte: é dormindo que o cérebro consolida o que você estudou.',
        '<button class="btn primary" data-action="force-day">Quero estudar mesmo assim</button>'
      );
    } else if (!plan.blocks.length) {
      body = F.empty(
        '🫧',
        plan.full ? 'Sem espaço livre hoje' : 'Nada planejado',
        plan.full
          ? 'Seus compromissos ocupam todos os horários livres de hoje (ou o dia já acabou). Tudo bem: o que faltou vai para os próximos dias.'
          : 'Confira em Minha rotina se você tem horas de estudo para hoje.',
        '<button class="btn ghost" data-action="go" data-view="rotina">Abrir Minha rotina</button>'
      );
    } else {
      body = planner.PERIODS.map((p) => {
        const items = plan.blocks
          .filter((b) => b.period === p.id)
          .map((b) => ({ at: b.start, html: blockCard(b) }))
          .concat(
            life
              .filter((x) => x.start && planner.periodOf(U.toMinutes(x.start)) === p.id)
              .map((x) => ({ at: x.start, html: lifeCard(x) }))
          )
          .sort((a, b) => a.at.localeCompare(b.at));
        if (!items.length) return '';
        return `
            <section class="period">
              <h3 class="period-title">${p.emoji} ${p.label}</h3>
              ${items.map((i) => i.html).join('')}
            </section>`;
      }).join('');
    }

    const banners = [];
    const allDay = life.filter((x) => x.allDay && !x.blocksStudy);
    if (allDay.length) {
      banners.push(`<div class="banner soft"><span>📌 Hoje: ${allDay.map((x) => U.esc(x.title)).join(', ')}</span></div>`);
    }
    const cardsDue = F.srs.dueCards(st, today).length;
    if (cardsDue) {
      banners.push(`
        <div class="banner soft">
          <span>🃏 <strong>${cardsDue} cartão${cardsDue > 1 ? 'ões' : ''}</strong> para revisar hoje. Uns 5 minutinhos, ótimo para começar.</span>
          <button class="btn primary small" data-action="go" data-view="cartoes">Revisar</button>
        </div>`);
    }
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
      ${tips.length ? `<section class="insights">${F.insightCards(tips)}</section>` : ''}
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
