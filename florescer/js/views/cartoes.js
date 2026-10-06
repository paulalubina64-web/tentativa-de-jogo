/* Florescer · Cartões: flashcards + caderno de erros, com revisão espaçada */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const ui = { tab: 'revisar', kind: 'flashcard', flipped: false, filter: '' };

  function due() {
    return F.srs.dueCards(store.state, U.today()).sort((a, b) => a.nextReview.localeCompare(b.nextReview));
  }

  function reviewTab() {
    const list = due();
    if (!list.length) {
      const total = store.state.cards.length;
      return F.empty(
        '🌼',
        total ? 'Nenhum cartão para hoje' : 'Ainda não há cartões',
        total ? 'Você está em dia! Os próximos aparecem sozinhos no dia certo.' : 'Crie flashcards dos conteúdos e registre seus erros em questões. Eles voltam no momento certo para você não esquecer.',
        '<button class="btn primary" data-action="cards-tab" data-tab="criar">Criar cartão</button>'
      );
    }
    const c = list[0];
    const sub = store.subject(c.subjectId);
    const topic = c.topicId ? store.topic(c.topicId) : null;
    const err = c.kind === 'erro' ? F.srs.ERROR_TYPES[c.errorType] : null;
    return `
      <p class="muted center">${list.length} para hoje · tente responder de cabeça antes de virar</p>
      <div class="flash ${ui.flipped ? 'flipped' : ''}" style="--c:${sub ? sub.color : 'var(--lilac)'}">
        <div class="flash-top">${F.chip(sub)} ${c.kind === 'erro' ? '<span class="tag tag-prova">📕 caderno de erros</span>' : '<span class="tag">🃏 flashcard</span>'}
          ${topic ? `<small class="muted">${U.esc(topic.title)}</small>` : ''}</div>
        <div class="flash-q">${U.esc(c.front)}</div>
        ${
          ui.flipped
            ? `<div class="flash-a">${U.esc(c.back)}</div>
              ${err ? `<p class="flash-err">${err.emoji} Por que errei: <strong>${err.label}</strong><br><small>${err.advice}</small></p>` : ''}
              <div class="row center">${Object.keys(F.srs.QUALITY)
                .map((k) => `<button class="q q-${k} big" data-action="card-rate" data-id="${c.id}" data-q="${k}">${F.srs.QUALITY[k].emoji} ${F.srs.QUALITY[k].label}</button>`)
                .join('')}</div>`
            : '<div class="center"><button class="btn primary big" data-action="card-flip">Virar cartão</button></div>'
        }
      </div>`;
  }

  function createTab() {
    const st = store.state;
    if (!st.subjects.length) return F.empty('📚', 'Primeiro, uma matéria', 'Cadastre suas matérias para criar cartões.', '<button class="btn primary" data-action="go" data-view="materias">Ir para Matérias</button>');
    const isErr = ui.kind === 'erro';
    const topicsBySub = st.subjects
      .map((s) => {
        const ts = st.topics.filter((t) => t.subjectId === s.id);
        return ts.length ? `<optgroup label="${U.esc(s.name)}">${ts.map((t) => `<option value="${t.id}">${U.esc(t.title)}</option>`).join('')}</optgroup>` : '';
      })
      .join('');
    return `
      <div class="split even">
        <form class="card form" data-form="card">
          <div class="tabs">
            <button type="button" class="tab ${!isErr ? 'on' : ''}" data-action="card-kind" data-kind="flashcard">🃏 Flashcard</button>
            <button type="button" class="tab ${isErr ? 'on' : ''}" data-action="card-kind" data-kind="erro">📕 Erro em questão</button>
          </div>
          <p class="muted small">${
            isErr
              ? 'Errou uma questão? Anote aqui. Entender POR QUE você errou é o que faz não errar de novo.'
              : 'Uma pergunta de um lado, a resposta do outro. Pergunta curta, resposta curta.'
          }</p>
          <div class="row two">
            <label class="field"><span>Matéria</span><select name="subjectId" required>${st.subjects.map((s) => `<option value="${s.id}">${s.emoji} ${U.esc(s.name)}</option>`).join('')}</select></label>
            <label class="field"><span>Conteúdo <small class="muted">(opcional)</small></span><select name="topicId"><option value="">—</option>${topicsBySub}</select></label>
          </div>
          <label class="field"><span>${isErr ? 'A questão (ou o resumo dela)' : 'Pergunta'}</span><textarea name="front" rows="3" required maxlength="1000" placeholder="${isErr ? 'Ex.: Questão sobre prescrição da pretensão punitiva...' : 'Ex.: Qual a diferença entre dolo eventual e culpa consciente?'}"></textarea></label>
          <label class="field"><span>${isErr ? 'A resposta certa e o porquê' : 'Resposta'}</span><textarea name="back" rows="3" required maxlength="1500"></textarea></label>
          ${
            isErr
              ? `<label class="field"><span>Por que você errou?</span><select name="errorType">${Object.keys(F.srs.ERROR_TYPES)
                  .map((k) => `<option value="${k}">${F.srs.ERROR_TYPES[k].emoji} ${F.srs.ERROR_TYPES[k].label}</option>`)
                  .join('')}</select></label>`
              : ''
          }
          <button class="btn primary" type="submit">Salvar ${isErr ? 'erro' : 'cartão'}</button>
        </form>
        <div class="card">
          <h3>💡 Como fazer bons cartões</h3>
          <ul class="tips">
            <li><strong>Uma ideia por cartão.</strong> Se a resposta tem 5 itens, faça 5 cartões.</li>
            <li><strong>Escreva com suas palavras.</strong> Copiar a lei não é aprender a lei.</li>
            <li><strong>Pergunte o "porquê"</strong>, não só o "o quê".</li>
            <li><strong>Erros valem ouro.</strong> Cada questão errada vira um cartão e volta até você acertar com facilidade.</li>
          </ul>
        </div>
      </div>`;
  }

  function listTab() {
    const st = store.state;
    const today = U.today();
    const cards = st.cards.filter((c) => !ui.filter || c.subjectId === ui.filter).slice().reverse();
    const errs = st.cards.filter((c) => c.kind === 'erro');
    const byType = {};
    errs.forEach((c) => (byType[c.errorType] = (byType[c.errorType] || 0) + 1));
    const maxT = Math.max(1, ...Object.values(byType));
    return `
      ${
        errs.length
          ? `<section class="card">
              <h3>📕 Raio-x dos seus erros</h3>
              ${Object.keys(F.srs.ERROR_TYPES)
                .filter((k) => byType[k])
                .sort((a, b) => byType[b] - byType[a])
                .map(
                  (k) => `<div class="dist-row"><span class="dist-name">${F.srs.ERROR_TYPES[k].emoji} ${F.srs.ERROR_TYPES[k].label}</span>
                    <div class="bar thick"><span style="width:${(byType[k] / maxT) * 100}%"></span></div><span class="dist-val">${byType[k]}</span></div>`
                )
                .join('')}
            </section>`
          : ''
      }
      <section class="card">
        <div class="row">
          <h3>Todos os cartões (${cards.length})</h3><span class="spacer"></span>
          <select data-change="cards-filter" class="narrow-select"><option value="">Todas as matérias</option>${st.subjects
            .map((s) => `<option value="${s.id}" ${ui.filter === s.id ? 'selected' : ''}>${s.emoji} ${U.esc(s.name)}</option>`)
            .join('')}</select>
        </div>
        ${
          cards.length
            ? `<ul class="topic-list">${cards
                .map((c) => {
                  const d = F.srs.describe(c, today);
                  return `<li class="topic"><span class="pill pill-${d.tone}">${d.text}</span>
                    <span class="topic-title">${c.kind === 'erro' ? '📕 ' : '🃏 '}${U.esc(c.front)}</span>
                    <button class="btn ghost tiny" data-action="card-del" data-id="${c.id}">✕</button></li>`;
                })
                .join('')}</ul>`
            : '<p class="muted">Nada por aqui ainda.</p>'
        }
      </section>`;
  }

  function render() {
    const n = due().length;
    const tabs = [
      ['revisar', `Revisar hoje${n ? ` (${n})` : ''}`],
      ['criar', 'Criar'],
      ['todos', 'Todos e raio-x']
    ];
    const body = ui.tab === 'criar' ? createTab() : ui.tab === 'todos' ? listTab() : reviewTab();
    return `
      <header class="page-head">
        <h1>🃏 Cartões</h1>
        <p class="muted">Flashcards e caderno de erros com revisão espaçada. É aqui que a matéria sai do "eu li" e vira "eu sei".</p>
      </header>
      <div class="tabs page-tabs">${tabs.map(([id, l]) => `<button class="tab ${ui.tab === id ? 'on' : ''}" data-action="cards-tab" data-tab="${id}">${l}</button>`).join('')}</div>
      ${body}`;
  }

  F.action('cards-tab', (el) => {
    ui.tab = el.dataset.tab;
    ui.flipped = false;
    F.render();
  });
  F.action('card-kind', (el) => {
    ui.kind = el.dataset.kind;
    F.render();
  });
  F.action('card-flip', () => {
    ui.flipped = true;
    F.render();
  });
  F.action('card-rate', (el) => {
    const c = store.state.cards.find((x) => x.id === el.dataset.id);
    if (!c) return;
    F.srs.review(store.state, c, el.dataset.q, U.today());
    store.save();
    ui.flipped = false;
    if (!due().length) F.toast('Cartões do dia concluídos! 🌼');
    F.render();
  });
  F.action('form:card', (form, data) => {
    const card = F.srs.newCard(store.state, {
      kind: ui.kind,
      subjectId: data.get('subjectId'),
      topicId: data.get('topicId') || null,
      front: String(data.get('front') || '').trim(),
      back: String(data.get('back') || '').trim(),
      errorType: ui.kind === 'erro' ? data.get('errorType') : null
    });
    if (!card.front || !card.back) return;
    store.state.cards.push(card);
    store.save();
    F.toast(ui.kind === 'erro' ? '📕 Erro anotado. Ele volta amanhã para você acertar.' : '🃏 Cartão criado! Primeira revisão amanhã.');
    form.front.value = '';
    form.back.value = '';
    form.front.focus();
  });
  F.action('card-del', (el) => {
    store.state.cards = store.state.cards.filter((c) => c.id !== el.dataset.id);
    store.save();
    F.render();
  });
  F.action('change:cards-filter', (el) => {
    ui.filter = el.value;
    F.render();
  });

  F.views.cartoes = { render };
})(window.Florescer = window.Florescer || {});
