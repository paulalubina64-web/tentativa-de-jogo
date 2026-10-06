/* Florescer · o planejador
 *
 * Monta o dia em quatro passos:
 *   1. Fatia seus períodos (tarde/noite) em blocos de estudo.
 *   2. Encaixa as revisões vencidas no começo de cada período, como aquecimento,
 *      até um teto (o que não couber vai pro dia seguinte: replanejamento).
 *   3. Distribui o resto dos blocos entre as matérias conforme a prioridade.
 *   4. Intercala: evita a mesma matéria em dois blocos seguidos.
 *
 * Prioridade = peso na nota + dificuldade + (quanto falta dominar)
 *            + proximidade da prova + tempo sem estudar a matéria.
 */
(function (F) {
  'use strict';

  const U = F.utils;

  const MODES = {
    estudo: { label: 'Conteúdo novo', emoji: '📖', hint: 'Leia ativamente. No fim, feche o material e escreva 3 perguntas com as respostas.' },
    pratica: { label: 'Exercícios', emoji: '✍️', hint: 'Sem conteúdo novo pendente: resolva questões e refaça as que errou.' },
    prova: { label: 'Reta final', emoji: '🎯', hint: 'Prova chegando! Questões antigas, simulado cronometrado e resumo de 1 página.' },
    revisao: { label: 'Revisão', emoji: '🔁', hint: 'Tente lembrar ANTES de olhar: escreva tudo o que lembra e só depois confira.' }
  };

  function upcomingExam(state, subjectId, dateKey) {
    return (
      state.exams
        .filter((e) => e.subjectId === subjectId && e.date >= dateKey)
        .sort((a, b) => a.date.localeCompare(b.date))[0] || null
    );
  }

  function lastActivity(state) {
    const map = {};
    const touch = (id, d) => {
      if (id && d && (!map[id] || d > map[id])) map[id] = d;
    };
    state.sessions.forEach((s) => touch(s.subjectId, s.date));
    state.topics.forEach((t) => (t.history || []).forEach((h) => touch(t.subjectId, h.date)));
    return map;
  }

  function scoreSubjects(state, dateKey, lastMap) {
    return state.subjects.map((sub) => {
      const exam = upcomingExam(state, sub.id, dateKey);
      const examDays = exam ? U.diffDays(dateKey, exam.date) : null;
      const examBoost = exam ? (Math.max(0, 30 - examDays) / 30) * 10 : 0;
      const last = lastMap[sub.id];
      const idle = last ? Math.max(0, U.diffDays(last, dateKey)) : 5;
      const neglect = Math.min(idle, 14) * 0.6;
      const base = sub.weight * 1.5 + sub.difficulty * 1.2 + (6 - sub.mastery) * 1.3;
      return {
        subject: sub,
        exam,
        examDays,
        idle,
        score: base + examBoost + neglect,
        parts: { base, examBoost, neglect }
      };
    });
  }

  function buildSlots(settings) {
    const slots = [];
    settings.periods.forEach((p) => {
      let left = Number(p.minutes) || 0;
      let clock = U.toMinutes(p.start);
      while (left >= 15) {
        const len = Math.min(left, settings.blockMinutes);
        slots.push({ period: p.id, minutes: len, start: U.fromMinutes(clock), end: U.fromMinutes(clock + len) });
        clock += len + settings.breakMinutes;
        left -= len;
      }
    });
    return slots;
  }

  // Primeiro bloco de cada período, depois os seguintes: revisão funciona como aquecimento.
  function reviewSlotOrder(slots) {
    const firsts = [];
    const rest = [];
    slots.forEach((s, i) => {
      if (i === 0 || slots[i - 1].period !== s.period) firsts.push(i);
      else rest.push(i);
    });
    return firsts.concat(rest);
  }

  // Intercalação: escolhe sempre a matéria com mais blocos restantes que não seja a anterior.
  function interleave(counts, scoreById) {
    const left = Object.assign({}, counts);
    const total = Object.values(left).reduce((a, b) => a + b, 0);
    const seq = [];
    let prev = null;
    for (let i = 0; i < total; i++) {
      const ids = Object.keys(left).filter((id) => left[id] > 0);
      ids.sort((a, b) => left[b] - left[a] || scoreById[b].score - scoreById[a].score);
      const pick = ids.find((id) => id !== prev) || ids[0];
      seq.push(pick);
      left[pick]--;
      prev = pick;
    }
    return seq;
  }

  function pendingTopics(state, subjectId) {
    return state.topics
      .filter((t) => t.subjectId === subjectId && t.status === 'pendente')
      .sort((a, b) => a.order - b.order);
  }

  function buildDay(state, dateKey, opts) {
    opts = opts || {};
    const s = state.settings;
    const day = { date: dateKey, blocks: [], postponed: [], off: false, generatedAt: Date.now() };

    if (!opts.force && !s.studyDays[U.weekday(dateKey)]) {
      day.off = true;
      return day;
    }
    if (!state.subjects.length) return day;

    let slots = buildSlots(s);
    if (opts.skipSlots) slots = slots.slice(opts.skipSlots);
    if (!slots.length) return day;

    const lastMap = opts.lastMap || lastActivity(state);
    const scored = scoreSubjects(state, dateKey, lastMap);
    const scoreById = {};
    scored.forEach((x) => (scoreById[x.subject.id] = x));

    // 1. Revisões: as mais atrasadas primeiro; empate → matéria mais prioritária.
    const due = (opts.reviews || F.srs.dueOn(state, dateKey))
      .filter((t) => scoreById[t.subjectId])
      .slice()
      .sort(
        (a, b) =>
          a.nextReview.localeCompare(b.nextReview) || scoreById[b.subjectId].score - scoreById[a.subjectId].score
      );

    // Intercala as revisões por matéria (rodízio).
    const bySubject = {};
    due.forEach((t) => (bySubject[t.subjectId] = bySubject[t.subjectId] || []).push(t));
    const queue = [];
    const groups = Object.values(bySubject);
    while (groups.some((g) => g.length)) groups.forEach((g) => g.length && queue.push(g.shift()));

    const total = slots.reduce((a, x) => a + x.minutes, 0);
    const budget = Math.max(s.reviewMinutes, Math.round(total * s.reviewShare));
    const blocks = slots.map((slot) => Object.assign({ id: U.uid(), reviews: [], reviewed: {}, done: false }, slot));

    let used = 0;
    for (const idx of reviewSlotOrder(slots)) {
      if (!queue.length) break;
      const b = blocks[idx];
      const capacity = Math.floor(b.minutes / s.reviewMinutes);
      const room = Math.floor((budget - used) / s.reviewMinutes);
      const take = Math.min(capacity, room, queue.length);
      if (take <= 0) break;
      b.reviews = queue.splice(0, take).map((t) => t.id);
      used += take * s.reviewMinutes;
    }
    day.postponed = queue.map((t) => t.id);

    // 2. Blocos com espaço sobrando (≥ 20 min) recebem estudo.
    const studyBlocks = blocks.filter((b) => b.minutes - b.reviews.length * s.reviewMinutes >= 20);

    // 3. Distribuição proporcional à prioridade (método D'Hondt) + memória dos dias anteriores.
    const carry = opts.carry || {};
    const counts = {};
    studyBlocks.forEach(() => {
      let best = null;
      let bestVal = -Infinity;
      scored.forEach((x) => {
        const id = x.subject.id;
        const val = x.score / (1 + (counts[id] || 0) + (carry[id] || 0) * 0.6);
        if (val > bestVal) {
          bestVal = val;
          best = id;
        }
      });
      counts[best] = (counts[best] || 0) + 1;
    });

    // 4. Intercalação e escolha do conteúdo de cada bloco.
    const used2 = opts.usedTopics || new Set();
    interleave(counts, scoreById).forEach((subjectId, i) => {
      const b = studyBlocks[i];
      const info = scoreById[subjectId];
      const next = pendingTopics(state, subjectId).find((t) => !used2.has(t.id));
      b.subjectId = subjectId;
      if (next) used2.add(next.id);
      b.topicId = next ? next.id : null;
      if (info.examDays !== null && info.examDays <= s.examPrepDays) b.mode = 'prova';
      else b.mode = next ? 'estudo' : 'pratica';
      if (info.exam) b.examId = info.exam.id;
    });

    blocks.forEach((b) => {
      if (!b.subjectId && b.reviews.length) b.mode = 'revisao';
    });
    day.blocks = blocks.filter((b) => b.subjectId || b.reviews.length);
    day.counts = counts;
    return day;
  }

  const planner = {
    MODES,
    scoreSubjects,
    upcomingExam,
    lastActivity,
    buildSlots,

    // Garante que exista um plano para hoje; refaz sozinho se nada foi feito ainda.
    ensureToday(state) {
      const today = U.today();
      const plan = state.plans[today];
      const anyDone = plan && plan.blocks.some((b) => b.done || Object.keys(b.reviewed || {}).length);
      if (!plan || (plan.stale && !anyDone)) {
        const force = plan ? plan.forced : false;
        state.plans[today] = buildDay(state, today, { force });
        state.plans[today].forced = force;
        return { plan: state.plans[today], changed: true };
      }
      return { plan, changed: false };
    },

    // Refaz o resto do dia mantendo o que já foi feito.
    replanToday(state, opts) {
      opts = opts || {};
      const today = U.today();
      const old = state.plans[today];
      const kept = old ? old.blocks.filter((b) => b.done) : [];
      const force = opts.force || (old && old.forced);
      const fresh = buildDay(state, today, { force, skipSlots: kept.length });
      fresh.blocks = kept.concat(fresh.blocks);
      fresh.forced = !!force;
      state.plans[today] = fresh;
      return fresh;
    },

    // O dia de estudo anterior que ficou com blocos sem fazer (para avisar do replanejamento).
    missedBefore(state, today) {
      const keys = Object.keys(state.plans)
        .filter((k) => k < today)
        .sort();
      const last = keys[keys.length - 1];
      if (!last) return null;
      const missed = state.plans[last].blocks.filter((b) => !b.done).length;
      return missed ? { date: last, missed } : null;
    },

    // Projeção dos próximos dias (não altera nada salvo).
    projectWeek(state, startKey, days) {
      const lastMap = Object.assign({}, lastActivity(state));
      const carry = {};
      const usedTopics = new Set();
      const out = [];
      for (let i = 0; i < (days || 7); i++) {
        const d = U.addDays(startKey, i);
        let day;
        if (i === 0 && state.plans[d]) {
          day = state.plans[d];
        } else {
          const reviews = i === 0 ? F.srs.dueOn(state, d) : state.topics.filter((t) => t.nextReview === d);
          day = buildDay(state, d, { reviews, carry, usedTopics, lastMap });
        }
        const today = {};
        day.blocks.forEach((b) => {
          if (!b.subjectId) return;
          lastMap[b.subjectId] = d;
          today[b.subjectId] = (today[b.subjectId] || 0) + 1;
          if (b.topicId) usedTopics.add(b.topicId);
        });
        Object.keys(carry).forEach((k) => (carry[k] *= 0.5));
        Object.keys(today).forEach((k) => (carry[k] = (carry[k] || 0) + today[k]));
        out.push(day);
      }
      return out;
    }
  };

  F.planner = planner;
})(window.Florescer = window.Florescer || {});
