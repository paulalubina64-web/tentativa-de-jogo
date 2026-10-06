/* Florescer · dicas inteligentes a partir dos SEUS dados */
(function (F) {
  'use strict';

  const U = F.utils;

  // Cada dica: { level (maior = mais urgente), emoji, text, view? }
  function list(state) {
    const today = U.today();
    const out = [];
    const sub = (id) => state.subjects.find((s) => s.id === id);
    if (!state.subjects.length) return out;

    // 1. Provas em risco de não dar tempo
    const upcoming = state.exams.filter((e) => e.date >= today && U.diffDays(today, e.date) <= 60);
    if (upcoming.length) {
      const horizon = Math.max(...upcoming.map((e) => U.diffDays(today, e.date)));
      const proj = F.planner.projectWeek(state, today, Math.max(1, horizon));
      upcoming.forEach((e) => {
        const f = F.planner.examForecast(state, e, proj);
        const s = sub(e.subjectId);
        if (!f || !s) return;
        if (f.status === 'risco') {
          out.push({ level: 10, emoji: '🚨', view: 'provas', text: `${s.emoji} ${s.name}: faltam ${f.pending} conteúdos e só há ${f.blocks} blocos previstos até a ${e.title || e.kind}. Suba o peso da matéria ou aumente suas horas.` });
        } else if (f.status === 'apertado') {
          out.push({ level: 7, emoji: '⏳', view: 'provas', text: `${s.emoji} ${s.name}: o ritmo para a ${e.title || e.kind} está apertado. Evite pular blocos dessa matéria.` });
        }
      });
    }

    // 2. Revisões acumuladas
    const overdue = state.topics.filter((t) => t.nextReview && t.nextReview < today).length;
    if (overdue >= 5) out.push({ level: 8, emoji: '🥀', view: 'hoje', text: `${overdue} revisões atrasadas. Que tal um bloco extra só de revisão hoje? A memória agradece.` });

    // 3. Padrão de erros
    const errors = state.cards.filter((c) => c.kind === 'erro' && c.errorType);
    if (errors.length >= 3) {
      const count = {};
      errors.forEach((c) => (count[c.errorType] = (count[c.errorType] || 0) + 1));
      const top = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
      const t = F.srs.ERROR_TYPES[top];
      if (t) out.push({ level: 6, emoji: t.emoji, view: 'cartoes', text: `Seu erro mais comum é "${t.label.toLowerCase()}" (${count[top]}x). ${t.advice}` });
    }

    // 4. Cartões do dia
    const dueCards = F.srs.dueCards(state, today).length;
    if (dueCards) out.push({ level: 6, emoji: '🃏', view: 'cartoes', text: `${dueCards} cartão(ões) esperando você hoje. Leva só uns minutinhos.` });

    // 5. Matéria abandonada
    const last = F.planner.lastActivity(state);
    state.subjects.forEach((s) => {
      const d = last[s.id] ? U.diffDays(last[s.id], today) : null;
      if (d !== null && d >= 7) out.push({ level: 5, emoji: '🍂', view: 'materias', text: `Faz ${d} dias que você não estuda ${s.emoji} ${s.name}.` });
    });

    // 6. Notas abaixo da meta
    state.exams
      .filter((e) => e.grade != null && e.date >= U.addDays(today, -30))
      .forEach((e) => {
        const s = sub(e.subjectId);
        if (!s || s.goal == null) return;
        const g = (e.grade / (e.maxGrade || 10)) * 10;
        if (g < s.goal) {
          out.push({ level: 6, emoji: '📉', view: 'cartoes', text: `Em ${s.name} você tirou ${e.grade} e a meta é ${s.goal}. Registre os erros dessa prova no caderno de erros: é o caminho mais rápido para subir.` });
        } else {
          out.push({ level: 2, emoji: '🏆', text: `Você bateu a meta em ${s.name} (${e.grade}). Isso foi método, não sorte!` });
        }
      });

    // 7. Ritmo da semana
    const wk = U.weekStart(today);
    const done = state.sessions.filter((x) => x.date >= wk).reduce((a, x) => a + x.minutes, 0);
    const goal = state.settings.dailyTarget.reduce((a, b) => a + b, 0);
    const passed = U.diffDays(wk, today) + 1;
    if (goal && passed >= 4 && done < goal * 0.35) {
      out.push({ level: 4, emoji: '🌧️', view: 'rotina', text: `Semana mais devagar (${U.duration(done)} de ${U.duration(goal)}). Se a meta está irreal para sua rotina, ajuste em Minha rotina: meta realista vence meta bonita.` });
    } else if (goal && done >= goal) {
      out.push({ level: 3, emoji: '🌟', text: `Meta da semana batida: ${U.duration(done)}! Descanso também é estratégia.` });
    }

    // 8. Recordação ativa
    const studied = state.topics.filter((t) => t.status !== 'pendente').length;
    if (studied >= 5 && !state.cards.length) {
      out.push({ level: 4, emoji: '💡', view: 'cartoes', text: 'Crie flashcards dos conteúdos estudados. Tentar lembrar fixa muito mais do que reler.' });
    }

    // 9. Reflexão semanal
    const lastWeek = U.addDays(wk, -7);
    const hadActivity = state.sessions.some((x) => x.date >= lastWeek && x.date < wk);
    if (hadActivity && !state.reflections[lastWeek]) {
      out.push({ level: 5, emoji: '📝', view: 'jardim', text: 'Faça a revisão da semana passada (3 perguntas, 2 minutos). Quem ajusta o método sobe mais rápido.' });
    }

    // 10. Sono
    const bed = U.toMinutes(state.settings.sleep.bed);
    if (bed >= 60 && bed < 360) {
      out.push({ level: 3, emoji: '😴', view: 'rotina', text: 'Você dorme depois da 1h. O sono é quando o cérebro consolida a memória: dormir mais cedo rende mais nota.' });
    }

    return out.sort((a, b) => b.level - a.level);
  }

  F.insights = { list };
})(window.Florescer = window.Florescer || {});
