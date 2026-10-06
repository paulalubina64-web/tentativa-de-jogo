/* Florescer · tela "Provas" com contagem regressiva */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const KINDS = ['Prova', 'Trabalho', 'Seminário', 'Simulado', 'Prova final'];

  function form() {
    const st = store.state;
    const e = F.ui.editingExam ? st.exams.find((x) => x.id === F.ui.editingExam) : null;
    if (!st.subjects.length) {
      return F.empty('📚', 'Primeiro, uma matéria', 'Cadastre suas matérias para poder marcar as provas delas.', '<button class="btn primary" data-action="go" data-view="materias">Ir para Matérias</button>');
    }
    const v = e || { subjectId: st.subjects[0].id, kind: 'Prova', title: '', date: U.addDays(U.today(), 14), notes: '' };
    return `
      <form class="card form" data-form="exam">
        <h3>${e ? '✏️ Editar avaliação' : '🎯 Nova prova'}</h3>
        <label class="field"><span>Matéria</span>
          <select name="subjectId" required data-change="exam-subject">
            ${st.subjects.map((s) => `<option value="${s.id}" ${s.id === v.subjectId ? 'selected' : ''}>${s.emoji} ${U.esc(s.name)}</option>`).join('')}
          </select>
        </label>
        <div class="row two">
          <label class="field"><span>Tipo</span>
            <select name="kind">${KINDS.map((k) => `<option ${k === v.kind ? 'selected' : ''}>${k}</option>`).join('')}</select>
          </label>
          <label class="field"><span>Data</span><input type="date" name="date" required value="${v.date}"></label>
        </div>
        <label class="field"><span>Nome <small class="muted">(opcional)</small></span>
          <input name="title" maxlength="80" placeholder="Ex.: P1, AV2, Prova bimestral" value="${U.esc(v.title)}">
        </label>
        <div class="topic-slot">${topicPicker(v)}</div>
        <label class="field"><span>Anotações</span>
          <textarea name="notes" rows="3" placeholder="Ex.: Capítulos 1 a 4, súmulas vinculantes, questões da lista">${U.esc(v.notes)}</textarea>
        </label>
        <div class="row">
          <button class="btn primary" type="submit">${e ? 'Salvar' : 'Adicionar prova'}</button>
          ${e ? '<button class="btn ghost" type="button" data-action="cancel-exam">Cancelar</button>' : ''}
        </div>
        <p class="muted small">🎯 Nos ${store.state.settings.examPrepDays} dias antes da prova, os blocos dessa matéria entram em modo <strong>reta final</strong>: questões, simulado e revisão.</p>
      </form>`;
  }

  function topicPicker(v) {
    const topics = store.state.topics.filter((t) => t.subjectId === v.subjectId).sort((a, b) => a.order - b.order);
    if (!topics.length) {
      return '<p class="muted small">💡 Cadastre os conteúdos da matéria (em Matérias) para marcar o que cai e eu priorizar exatamente isso.</p>';
    }
    const sel = v.topicIds || [];
    return `
      <div class="field"><span>O que cai? <small class="muted">· marque os conteúdos (nada marcado = a matéria toda)</small></span>
        <div class="checklist">${topics
          .map((t) => `<label><input type="checkbox" name="topic" value="${t.id}" ${sel.includes(t.id) ? 'checked' : ''}><span>${U.esc(t.title)}</span></label>`)
          .join('')}</div>
      </div>`;
  }

  const FORECAST = {
    ok: { cls: 'ok', icon: '🟢', text: (f) => `No ritmo: ${f.blocks} blocos previstos para ${f.pending} conteúdo(s) pendente(s) + simulado.` },
    apertado: { cls: 'tight', icon: '🟡', text: (f) => `Apertado: ${f.blocks} blocos para ${f.pending} conteúdo(s). Não pule blocos dessa matéria.` },
    risco: { cls: 'risk', icon: '🔴', text: (f) => `Não vai dar tempo no ritmo atual: ${f.blocks} blocos para ${f.pending} conteúdos. Aumente o peso da matéria ou suas horas em Minha rotina.` },
    'sem-conteudo': { cls: 'tight', icon: '⚪', text: () => 'Cadastre os conteúdos dessa matéria para eu calcular se vai dar tempo.' }
  };

  function upcomingCard(e, projection) {
    const sub = store.subject(e.subjectId);
    const today = U.today();
    const days = U.diffDays(today, e.date);
    const topics = e.topicIds && e.topicIds.length ? store.state.topics.filter((t) => e.topicIds.includes(t.id)) : store.state.topics.filter((t) => t.subjectId === e.subjectId);
    const seen = topics.filter((t) => t.status !== 'pendente').length;
    const pct = topics.length ? Math.round((seen / topics.length) * 100) : 0;
    const urgent = days <= store.state.settings.examPrepDays;
    return `
      <article class="card exam ${urgent ? 'urgent' : ''}" style="--c:${sub ? sub.color : '#F9A8D4'}">
        <div class="exam-count"><strong>${days}</strong><small>${days === 1 ? 'dia' : 'dias'}</small></div>
        <div class="exam-body">
          <div class="exam-top">${F.chip(sub)} <span class="tag">${U.esc(e.kind)}</span> ${urgent ? '<span class="tag tag-prova">🎯 reta final</span>' : ''}</div>
          <h3>${U.esc(e.title || e.kind)} <small class="muted">· ${U.formatDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' })}</small></h3>
          ${e.notes ? `<p class="notes">${U.esc(e.notes)}</p>` : ''}
          ${(() => {
            const f = F.planner.examForecast(store.state, e, projection);
            if (!f) return '';
            const k = FORECAST[f.status];
            return `<p class="forecast ${k.cls}">${k.icon} ${k.text(f)}</p>`;
          })()}
          ${
            topics.length
              ? `<div class="priority"><small>${e.topicIds && e.topicIds.length ? 'Conteúdos da prova' : 'Conteúdos da matéria'} já estudados: ${seen}/${topics.length}</small><div class="bar"><span style="width:${pct}%"></span></div></div>`
              : ''
          }
        </div>
        <div class="exam-actions">
          <button class="btn ghost tiny" data-action="edit-exam" data-id="${e.id}">✏️</button>
          <button class="btn ghost tiny" data-action="delete-exam" data-id="${e.id}">🗑️</button>
        </div>
      </article>`;
  }

  function pastRow(e) {
    const sub = store.subject(e.subjectId);
    return `
      <li class="past">
        ${F.chip(sub)}
        <span>${U.esc(e.title || e.kind)} <small class="muted">· ${U.formatDate(e.date)}</small></span>
        <span class="spacer"></span>
        <label class="grade">Nota
          <input type="number" step="0.1" min="0" max="1000" value="${e.grade == null ? '' : e.grade}" data-change="grade" data-id="${e.id}" placeholder="–">
        </label>
        <label class="grade">de
          <input type="number" step="0.5" min="1" max="1000" value="${e.maxGrade || 10}" data-change="max-grade" data-id="${e.id}">
        </label>
        <button class="btn ghost tiny" data-action="delete-exam" data-id="${e.id}">✕</button>
      </li>`;
  }

  function render() {
    const today = U.today();
    const all = store.state.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = all.filter((e) => e.date >= today);
    const past = all.filter((e) => e.date < today).reverse();
    const horizon = upcoming.length ? Math.min(60, Math.max(1, ...upcoming.map((e) => U.diffDays(today, e.date)))) : 0;
    const projection = horizon ? F.planner.projectWeek(store.state, today, horizon) : null;
    return `
      <header class="page-head">
        <h1>🎯 Provas</h1>
        <p class="muted">Coloque as datas assim que souber. Quanto mais perto a prova, mais espaço a matéria ganha no cronograma.</p>
      </header>
      <div class="split">
        <div>${form()}</div>
        <div class="stack">
          ${upcoming.length ? upcoming.map((e) => upcomingCard(e, projection)).join('') : F.empty('🗓️', 'Nenhuma prova marcada', 'Quando tiver datas, adicione ao lado para ativar a contagem regressiva.')}
          ${
            past.length
              ? `<section class="card"><h3>📒 Já passaram</h3><p class="muted small">Registre as notas para acompanhar sua evolução.</p><ul class="past-list">${past.map(pastRow).join('')}</ul></section>`
              : ''
          }
        </div>
      </div>`;
  }

  F.action('form:exam', (form, data) => {
    const payload = {
      subjectId: data.get('subjectId'),
      kind: data.get('kind') || 'Prova',
      title: String(data.get('title') || '').trim(),
      date: data.get('date'),
      notes: String(data.get('notes') || '').trim(),
      topicIds: data.getAll('topic')
    };
    if (!payload.date || !payload.subjectId) return;
    if (F.ui.editingExam) {
      store.updateExam(F.ui.editingExam, payload);
      F.ui.editingExam = null;
      F.toast('Prova atualizada 💗');
    } else {
      store.addExam(payload);
      F.toast(`🎯 Anotado! ${U.countdownLabel(U.diffDays(U.today(), payload.date))}.`);
    }
    F.render();
  });

  F.action('edit-exam', (el) => {
    F.ui.editingExam = el.dataset.id;
    F.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  F.action('cancel-exam', () => {
    F.ui.editingExam = null;
    F.render();
  });
  F.action('delete-exam', (el) => {
    if (!confirm('Excluir esta prova?')) return;
    store.deleteExam(el.dataset.id);
    F.render();
  });
  // Ao trocar a matéria no formulário, atualiza a lista de conteúdos.
  F.action('change:exam-subject', (el) => {
    const slot = el.closest('form').querySelector('.topic-slot');
    if (slot) slot.innerHTML = topicPicker({ subjectId: el.value, topicIds: [] });
  });

  F.action('change:max-grade', (el) => {
    const e = store.state.exams.find((x) => x.id === el.dataset.id);
    if (e) e.maxGrade = Math.max(1, Number(el.value) || 10);
    store.save();
  });

  F.action('change:grade', (el) => {
    const v = el.value === '' ? null : Number(el.value);
    const e = store.state.exams.find((x) => x.id === el.dataset.id);
    if (e) e.grade = v;
    store.save();
    if (v != null) F.toast('Nota registrada 📒');
  });

  F.views.provas = { render };
})(window.Florescer = window.Florescer || {});
