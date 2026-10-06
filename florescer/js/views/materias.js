/* Florescer · tela "Matérias" (você cadastra tudo aqui) */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;

  const SCALES = {
    weight: { label: 'Peso na nota', help: 'Quanto essa matéria pesa no seu semestre ou média', icon: '⭐', names: ['', 'bem pouco', 'pouco', 'médio', 'alto', 'altíssimo'] },
    difficulty: { label: 'Dificuldade', help: 'Quanto ela é difícil pra você', icon: '🔥', names: ['', 'tranquila', 'ok', 'média', 'difícil', 'muito difícil'] },
    mastery: { label: 'Quanto já domino', help: 'Com sinceridade: quanto você já sabe hoje', icon: '🌸', names: ['', 'nada', 'pouco', 'metade', 'bastante', 'quase tudo'] }
  };

  function scaleInput(key, value) {
    const sc = SCALES[key];
    return `
      <label class="field">
        <span>${sc.label} <small class="muted">· ${sc.help}</small></span>
        <div class="scale">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) => `<label class="scale-opt">
                <input type="radio" name="${key}" value="${n}" ${n === value ? 'checked' : ''}>
                <span title="${sc.names[n]}">${sc.icon}<small>${n}</small></span>
              </label>`
            )
            .join('')}
        </div>
      </label>`;
  }

  function form() {
    const editing = F.ui.editingSubject ? store.subject(F.ui.editingSubject) : null;
    const s = editing || { name: '', emoji: F.EMOJIS[store.state.subjects.length % F.EMOJIS.length], color: F.COLORS[store.state.subjects.length % F.COLORS.length], weight: 3, difficulty: 3, mastery: 2 };
    return `
      <form class="card form" data-form="subject">
        <h3>${editing ? '✏️ Editar matéria' : '🌱 Nova matéria'}</h3>
        <label class="field">
          <span>Nome</span>
          <input name="name" required maxlength="60" placeholder="Ex.: Direito Constitucional" value="${U.esc(s.name)}">
        </label>
        <div class="field">
          <span>Emoji</span>
          <div class="picker">
            ${F.EMOJIS.map(
              (e) => `<label><input type="radio" name="emoji" value="${e}" ${e === s.emoji ? 'checked' : ''}><span>${e}</span></label>`
            ).join('')}
          </div>
        </div>
        <div class="field">
          <span>Cor</span>
          <div class="picker colors">
            ${F.COLORS.map(
              (c) => `<label><input type="radio" name="color" value="${c}" ${c === s.color ? 'checked' : ''}><span style="background:${c}"></span></label>`
            ).join('')}
          </div>
        </div>
        ${scaleInput('weight', s.weight)}
        ${scaleInput('difficulty', s.difficulty)}
        ${scaleInput('mastery', s.mastery)}
        <div class="row">
          <button class="btn primary" type="submit">${editing ? 'Salvar' : 'Adicionar matéria'}</button>
          ${editing ? '<button class="btn ghost" type="button" data-action="cancel-subject">Cancelar</button>' : ''}
        </div>
      </form>`;
  }

  function topicList(sub) {
    const today = U.today();
    const topics = store.state.topics.filter((t) => t.subjectId === sub.id).sort((a, b) => a.order - b.order);
    const rows = topics
      .map((t) => {
        const d = F.srs.describe(t, today);
        return `
          <li class="topic">
            <span class="pill pill-${d.tone}">${d.text}</span>
            <span class="topic-title">${U.esc(t.title)}</span>
            <span class="topic-actions">
              ${
                t.status === 'pendente'
                  ? `<button class="btn ghost tiny" data-action="topic-studied" data-id="${t.id}" title="Marcar como estudado hoje">🌱 estudei</button>`
                  : `<button class="btn ghost tiny" data-action="topic-unmark" data-id="${t.id}" title="Voltar para pendente">↺</button>`
              }
              <button class="btn ghost tiny" data-action="topic-delete" data-id="${t.id}" title="Excluir">✕</button>
            </span>
          </li>`;
      })
      .join('');
    return `
      <div class="topics">
        <form data-form="topics" data-subject="${sub.id}" class="topics-form">
          <textarea name="titles" rows="3" placeholder="Adicione os conteúdos, um por linha. Dá pra colar a ementa inteira!&#10;Ex.: Princípios fundamentais&#10;Direitos e garantias fundamentais&#10;Controle de constitucionalidade"></textarea>
          <button class="btn primary small" type="submit">Adicionar conteúdos</button>
        </form>
        ${rows ? `<ul class="topic-list">${rows}</ul>` : '<p class="muted small">Nenhum conteúdo ainda. Sem conteúdos, o plano sugere exercícios.</p>'}
      </div>`;
  }

  function card(sub, scoreInfo, maxScore) {
    const topics = store.state.topics.filter((t) => t.subjectId === sub.id);
    const pend = topics.filter((t) => t.status === 'pendente').length;
    const est = topics.filter((t) => t.status === 'estudado').length;
    const dom = topics.filter((t) => t.status === 'dominado').length;
    const pct = maxScore ? Math.round((scoreInfo.score / maxScore) * 100) : 0;
    const level = pct > 75 ? 'alta' : pct > 45 ? 'média' : 'baixa';
    const open = F.ui.openSubject === sub.id;
    const why = [];
    if (scoreInfo.examDays !== null) why.push(`prova ${U.countdownLabel(scoreInfo.examDays)}`);
    if (sub.weight >= 4) why.push('peso alto');
    if (sub.difficulty >= 4) why.push('é difícil pra você');
    if (sub.mastery <= 2) why.push('ainda falta dominar');
    if (scoreInfo.idle >= 4) why.push(`${scoreInfo.idle} dias sem estudar`);

    return `
      <article class="card subject" style="--c:${sub.color}">
        <header class="subject-head">
          <span class="subject-emoji">${sub.emoji}</span>
          <div class="subject-name">
            <h3>${U.esc(sub.name)}</h3>
            <small class="muted">${pend} para estudar · ${est} em revisão · ${dom} dominados</small>
          </div>
          <div class="subject-actions">
            <button class="btn ghost tiny" data-action="edit-subject" data-id="${sub.id}" title="Editar">✏️</button>
            <button class="btn ghost tiny" data-action="delete-subject" data-id="${sub.id}" title="Excluir">🗑️</button>
          </div>
        </header>
        <div class="subject-scales">
          <span>Peso ${F.hearts(sub.weight, '⭐')}</span>
          <span>Dificuldade ${F.hearts(sub.difficulty, '🔥')}</span>
          <span>Domínio ${F.hearts(sub.mastery, '🌸')}</span>
        </div>
        <div class="priority">
          <span class="small">Prioridade <strong>${level}</strong></span>
          <div class="bar"><span style="width:${pct}%"></span></div>
          ${why.length ? `<small class="muted">por quê: ${why.join(' · ')}</small>` : ''}
        </div>
        <button class="btn soft small full" data-action="toggle-subject" data-id="${sub.id}">
          ${open ? '▲ Fechar conteúdos' : `▼ Conteúdos (${topics.length})`}
        </button>
        ${open ? topicList(sub) : ''}
      </article>`;
  }

  function render() {
    const st = store.state;
    const scored = F.planner.scoreSubjects(st, U.today(), F.planner.lastActivity(st));
    const max = Math.max(1, ...scored.map((x) => x.score));
    const sorted = scored.slice().sort((a, b) => b.score - a.score);
    return `
      <header class="page-head">
        <h1>📚 Matérias</h1>
        <p class="muted">Cadastre suas matérias e os conteúdos de cada uma. O cronograma usa o peso, a dificuldade e o seu domínio para decidir onde colocar mais tempo.</p>
      </header>
      <div class="split">
        <div>${form()}</div>
        <div class="stack">
          ${
            sorted.length
              ? sorted.map((x) => card(x.subject, x, max)).join('')
              : F.empty('🌱', 'Nenhuma matéria ainda', 'Adicione a primeira ao lado. Ela vai virar uma flor no seu jardim.')
          }
        </div>
      </div>`;
  }

  /* ---------- ações ---------- */

  F.action('form:subject', (form, data) => {
    const payload = {
      name: String(data.get('name') || '').trim(),
      emoji: data.get('emoji') || '📚',
      color: data.get('color') || F.COLORS[0],
      weight: Number(data.get('weight') || 3),
      difficulty: Number(data.get('difficulty') || 3),
      mastery: Number(data.get('mastery') || 2)
    };
    if (!payload.name) return;
    if (F.ui.editingSubject) {
      store.updateSubject(F.ui.editingSubject, payload);
      F.ui.editingSubject = null;
      F.toast('Matéria atualizada 💗');
    } else {
      const s = store.addSubject(payload);
      F.ui.openSubject = s.id;
      F.toast(`${payload.emoji} ${payload.name} plantada no seu jardim!`);
    }
    F.render();
  });

  F.action('form:topics', (form, data) => {
    const titles = String(data.get('titles') || '')
      .split('\n')
      .map((l) => l.replace(/^\s*[-•*\d.)]+\s*/, '').trim())
      .filter(Boolean);
    if (!titles.length) return;
    store.addTopics(form.dataset.subject, titles);
    F.toast(`${titles.length} conteúdo${titles.length > 1 ? 's' : ''} adicionado${titles.length > 1 ? 's' : ''} 🌱`);
    F.render();
  });

  F.action('edit-subject', (el) => {
    F.ui.editingSubject = el.dataset.id;
    F.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  F.action('cancel-subject', () => {
    F.ui.editingSubject = null;
    F.render();
  });
  F.action('delete-subject', (el) => {
    const s = store.subject(el.dataset.id);
    if (!s) return;
    if (!confirm(`Excluir "${s.name}" com todos os conteúdos e provas dela?`)) return;
    store.deleteSubject(s.id);
    if (F.ui.editingSubject === s.id) F.ui.editingSubject = null;
    F.render();
  });
  F.action('toggle-subject', (el) => {
    F.ui.openSubject = F.ui.openSubject === el.dataset.id ? null : el.dataset.id;
    F.render();
  });
  F.action('topic-studied', (el) => {
    const t = store.topic(el.dataset.id);
    if (!t) return;
    F.srs.markStudied(store.state, t, U.today());
    store.touchPlan();
    store.save();
    F.toast('🌱 Plantado! As revisões já foram agendadas.');
    F.render();
  });
  F.action('topic-unmark', (el) => {
    const t = store.topic(el.dataset.id);
    if (!t) return;
    F.srs.unmark(t);
    store.touchPlan();
    store.save();
    F.render();
  });
  F.action('topic-delete', (el) => {
    store.deleteTopic(el.dataset.id);
    F.render();
  });

  F.views.materias = { render };
})(window.Florescer = window.Florescer || {});
