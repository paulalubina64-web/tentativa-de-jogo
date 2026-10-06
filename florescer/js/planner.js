/* Florescer · o planejador
 *
 * Para cada dia:
 *   1. Pega suas janelas livres (manhã/tarde/noite), respeita sono, compromissos e eventos.
 *   2. Distribui a sua meta de minutos do dia nessas janelas (o horário de pico ganha mais).
 *   3. Encaixa as revisões vencidas no começo das janelas, como aquecimento, até um teto.
 *      O que não couber vai pro dia seguinte (replanejamento).
 *   4. Divide o resto entre as matérias pela prioridade:
 *      peso + dificuldade + quanto falta dominar + prova perto + dias sem estudar.
 *   5. Intercala as matérias e põe as mais pesadas no seu horário de pico.
 */
(function (F) {
  'use strict';

  const U = F.utils;

  const MODES = {
    estudo: { label: 'Conteúdo novo', emoji: '📖', hint: 'Leia ativamente. No fim, feche o material e escreva 3 perguntas com as respostas (dá pra virar cartões!).' },
    pratica: { label: 'Exercícios', emoji: '✍️', hint: 'Sem conteúdo novo pendente: resolva questões e anote cada erro no caderno de erros.' },
    prova: { label: 'Reta final', emoji: '🎯', hint: 'Prova chegando! Questões antigas, simulado cronometrado e resumo de 1 página.' },
    revisao: { label: 'Revisão', emoji: '🔁', hint: 'Tente lembrar ANTES de olhar: escreva tudo o que lembra e só depois confira.' }
  };

  const PERIODS = [
    { id: 'manha', label: 'Manhã', emoji: '🌅', from: 0, to: 720 },
    { id: 'tarde', label: 'Tarde', emoji: '☀️', from: 720, to: 1080 },
    { id: 'noite', label: 'Noite', emoji: '🌙', from: 1080, to: 1440 }
  ];

  function periodOf(min) {
    return (PERIODS.find((p) => min >= p.from && min < p.to) || PERIODS[2]).id;
  }

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
      return { subject: sub, exam, examDays, idle, score: base + examBoost + neglect, parts: { base, examBoost, neglect } };
    });
  }

  /* ---------- vida pessoal ---------- */

  // Compromissos e eventos que ocupam o dia (para descontar do estudo e mostrar na tela).
  function lifeOn(state, dateKey) {
    const wd = U.weekday(dateKey);
    const items = [];
    state.commitments.forEach((c) => {
      if (c.days && c.days[wd]) items.push({ kind: 'rotina', id: c.id, title: c.title, emoji: c.emoji, start: c.start, end: c.end });
    });
    state.events.forEach((e) => {
      if (e.date === dateKey) {
        items.push({ kind: 'evento', id: e.id, title: e.title, emoji: e.emoji || '📌', start: e.allDay ? null : e.start, end: e.allDay ? null : e.end, allDay: !!e.allDay, blocksStudy: e.allDay && e.noStudy });
      }
    });
    return items.sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));
  }

  function subtract(ranges, busy) {
    let out = ranges.slice();
    busy.forEach((b) => {
      const next = [];
      out.forEach((r) => {
        if (b.end <= r.start || b.start >= r.end) {
          next.push(r);
          return;
        }
        if (b.start > r.start) next.push({ start: r.start, end: b.start });
        if (b.end < r.end) next.push({ start: b.end, end: r.end });
      });
      out = next;
    });
    return out;
  }

  // Janelas livres do dia, já sem sono, compromissos e eventos.
  function freeWindows(state, dateKey, opts) {
    const s = state.settings;
    const wd = U.weekday(dateKey);
    let wins = (s.availability[wd] || []).slice();
    if (opts.force && !wins.length) wins = [s.windows.tarde, s.windows.noite];
    const wake = U.toMinutes(s.sleep.wake) + 30;
    let bed = U.toMinutes(s.sleep.bed);
    if (bed <= wake) bed += 1440; // dorme depois da meia-noite
    bed = Math.min(1440, bed - 30);
    let ranges = wins
      .map((w) => {
        const start = U.toMinutes(w.start);
        let end = U.toMinutes(w.end);
        if (end <= start) end = 1440;
        return { start: Math.max(start, wake), end: Math.min(end, bed) };
      })
      .filter((r) => r.end - r.start >= 15)
      .sort((a, b) => a.start - b.start);
    const busy = lifeOn(state, dateKey)
      .filter((x) => x.start && x.end)
      .map((x) => {
        const start = U.toMinutes(x.start);
        let end = U.toMinutes(x.end);
        if (end <= start) end = 1440;
        // 15 min de folga para deslocamento antes e depois
        return { start: start - 15, end: end + 15 };
      });
    ranges = subtract(ranges, busy);
    if (opts.fromMinute != null) {
      ranges = ranges.map((r) => ({ start: Math.max(r.start, opts.fromMinute), end: r.end }));
    }
    return ranges.filter((r) => r.end - r.start >= 20);
  }

  function fill(range, settings, limit) {
    const slots = [];
    let clock = range.start;
    let left = limit == null ? Infinity : limit;
    while (range.end - clock >= 15 && left >= 15) {
      const len = Math.min(settings.blockMinutes, range.end - clock, left);
      if (len < 15) break;
      slots.push({ minutes: len, start: U.fromMinutes(clock), end: U.fromMinutes(clock + len), period: periodOf(clock) });
      clock += len + settings.breakMinutes;
      left -= len;
    }
    return slots;
  }

  function dayTarget(state, dateKey, opts) {
    const s = state.settings;
    const t = s.dailyTarget[U.weekday(dateKey)] || 0;
    if (t || !opts.force) return t;
    return Math.max(...s.dailyTarget, 120);
  }

  function buildSlots(state, dateKey, opts) {
    opts = opts || {};
    const s = state.settings;
    let target = dayTarget(state, dateKey, opts);
    if (!target) return [];
    if (opts.fromMinute != null) {
      // Replanejando no meio do dia: só o que ainda falta da meta.
      target = Math.max(0, target - (opts.alreadyDone || 0));
    }
    const ranges = freeWindows(state, dateKey, opts);
    const caps = ranges.map((r) => fill(r, s).reduce((a, x) => a + x.minutes, 0));
    const totalCap = caps.reduce((a, b) => a + b, 0);
    if (!totalCap) return [];
    // O horário de pico pesa 1,5x na distribuição.
    const weights = ranges.map((r, i) => caps[i] * (periodOf(r.start) === s.peak ? 1.5 : 1));
    const wSum = weights.reduce((a, b) => a + b, 0);
    let shares = ranges.map((r, i) => Math.min(caps[i], Math.round((target * weights[i]) / wSum / 5) * 5));
    // Redistribui o que sobrou por limite de capacidade.
    let rest = Math.min(target, totalCap) - shares.reduce((a, b) => a + b, 0);
    for (let i = 0; rest > 0 && i < ranges.length; i++) {
      const add = Math.min(rest, caps[i] - shares[i]);
      shares[i] += add;
      rest -= add;
    }
    return ranges.flatMap((r, i) => fill(r, s, shares[i]));
  }

  /* ---------- montagem do dia ---------- */

  function reviewSlotOrder(slots) {
    const firsts = [];
    const rest = [];
    slots.forEach((s, i) => {
      const prev = slots[i - 1];
      if (!prev || prev.period !== s.period || U.toMinutes(s.start) - U.toMinutes(prev.end) > 30) firsts.push(i);
      else rest.push(i);
    });
    return firsts.concat(rest);
  }

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

  // Coloca as matérias mais exigentes no horário de pico, sem quebrar a intercalação.
  function placeByEnergy(seq, blocks, scoreById, peak) {
    const effort = (id) => {
      const x = scoreById[id];
      const prep = x.examDays !== null && x.examDays <= 7 ? 3 : 0;
      return x.subject.difficulty * 2 + (6 - x.subject.mastery) + prep;
    };
    const peakIdx = blocks.map((b, i) => (b.period === peak ? i : -1)).filter((i) => i >= 0);
    if (!peakIdx.length || peakIdx.length === blocks.length) return seq;
    const ranked = seq.map((id, i) => ({ id, i })).sort((a, b) => effort(b.id) - effort(a.id));
    const toPeak = ranked.slice(0, peakIdx.length).map((x) => x.i);
    const peakItems = toPeak.sort((a, b) => a - b).map((i) => seq[i]);
    const otherItems = seq.filter((_, i) => !toPeak.includes(i));
    const out = [];
    let p = 0;
    let o = 0;
    blocks.forEach((b) => out.push(b.period === peak ? peakItems[p++] : otherItems[o++]));
    // Conserta repetições lado a lado trocando com um vizinho do mesmo grupo.
    for (let i = 1; i < out.length; i++) {
      if (out[i] !== out[i - 1]) continue;
      const group = blocks[i].period === peak;
      for (let j = i + 1; j < out.length; j++) {
        if ((blocks[j].period === peak) === group && out[j] !== out[i - 1] && (j + 1 >= out.length || out[j + 1] !== out[i])) {
          [out[i], out[j]] = [out[j], out[i]];
          break;
        }
      }
    }
    return out;
  }

  function pendingTopics(state, subjectId, exam) {
    const list = state.topics.filter((t) => t.subjectId === subjectId && t.status === 'pendente').sort((a, b) => a.order - b.order);
    if (exam && exam.topicIds && exam.topicIds.length) {
      const inExam = list.filter((t) => exam.topicIds.includes(t.id));
      return inExam.concat(list.filter((t) => !exam.topicIds.includes(t.id)));
    }
    return list;
  }

  function lastTouch(topic) {
    const h = topic.history || [];
    return h.length ? h[h.length - 1].date : null;
  }

  // Nos 2 dias antes da prova: revisa tudo o que cai e não foi visto nos últimos 3 dias.
  function preExamReviews(state, dateKey, already) {
    const ids = new Set(already.map((t) => t.id));
    const out = [];
    state.exams.forEach((e) => {
      const d = U.diffDays(dateKey, e.date);
      if (d < 1 || d > 2) return;
      const pool = e.topicIds && e.topicIds.length ? state.topics.filter((t) => e.topicIds.includes(t.id)) : state.topics.filter((t) => t.subjectId === e.subjectId);
      pool.forEach((t) => {
        if (t.status === 'pendente' || ids.has(t.id)) return;
        const lt = lastTouch(t);
        if (lt && lt > U.addDays(dateKey, -3)) return;
        ids.add(t.id);
        out.push(t);
      });
    });
    return out;
  }

  function buildDay(state, dateKey, opts) {
    opts = opts || {};
    const s = state.settings;
    const life = lifeOn(state, dateKey);
    const day = { date: dateKey, blocks: [], postponed: [], off: false, life, generatedAt: Date.now() };

    const blocker = life.find((x) => x.blocksStudy);
    if (blocker && !opts.force) {
      day.off = true;
      day.offReason = blocker.title;
      return day;
    }
    if (!opts.force && !dayTarget(state, dateKey, opts)) {
      day.off = true;
      return day;
    }
    if (!state.subjects.length) return day;

    const slots = buildSlots(state, dateKey, opts);
    if (!slots.length) {
      day.full = true;
      return day;
    }

    const lastMap = opts.lastMap || lastActivity(state);
    const scored = scoreSubjects(state, dateKey, lastMap);
    const scoreById = {};
    scored.forEach((x) => (scoreById[x.subject.id] = x));

    // Revisões: vencidas + pré-prova; as mais atrasadas primeiro.
    let due = (opts.reviews || F.srs.dueOn(state, dateKey)).filter((t) => scoreById[t.subjectId]);
    due = due.concat(preExamReviews(state, dateKey, due));
    due.sort(
      (a, b) => (a.nextReview || dateKey).localeCompare(b.nextReview || dateKey) || scoreById[b.subjectId].score - scoreById[a.subjectId].score
    );
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
      const take = Math.min(Math.floor(b.minutes / s.reviewMinutes), Math.floor((budget - used) / s.reviewMinutes), queue.length);
      if (take <= 0) break;
      b.reviews = queue.splice(0, take).map((t) => t.id);
      used += take * s.reviewMinutes;
    }
    day.postponed = queue.map((t) => t.id);

    const studyBlocks = blocks.filter((b) => b.minutes - b.reviews.length * s.reviewMinutes >= 20);

    // Distribuição proporcional à prioridade (D'Hondt) + memória dos dias anteriores.
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

    const usedTopics = opts.usedTopics || new Set();
    const seq = placeByEnergy(interleave(counts, scoreById), studyBlocks, scoreById, s.peak);
    seq.forEach((subjectId, i) => {
      const b = studyBlocks[i];
      const info = scoreById[subjectId];
      const next = pendingTopics(state, subjectId, info.exam).find((t) => !usedTopics.has(t.id));
      b.subjectId = subjectId;
      if (next) usedTopics.add(next.id);
      b.topicId = next ? next.id : null;
      if (info.examDays !== null && info.examDays <= s.examPrepDays) b.mode = 'prova';
      else b.mode = next ? 'estudo' : 'pratica';
      if (info.exam) b.examId = info.exam.id;
    });

    blocks.forEach((b) => {
      if (!b.subjectId && b.reviews.length) b.mode = 'revisao';
    });
    day.blocks = blocks.filter((b) => b.subjectId || b.reviews.length);
    return day;
  }

  const planner = {
    MODES,
    PERIODS,
    periodOf,
    scoreSubjects,
    upcomingExam,
    lastActivity,
    lifeOn,
    freeWindows,
    buildSlots,

    // Quantos minutos de estudo CABEM nas janelas livres desse dia (para avisar metas irreais).
    capacity(state, dateKey) {
      return freeWindows(state, dateKey, {}).reduce((a, r) => a + fill(r, state.settings).reduce((x, s) => x + s.minutes, 0), 0);
    },

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
      if (!plan.life) plan.life = lifeOn(state, today);
      return { plan, changed: false };
    },

    // Refaz o que falta do dia a partir de AGORA, mantendo o que já foi feito.
    replanToday(state, opts) {
      opts = opts || {};
      const today = U.today();
      const old = state.plans[today];
      const kept = old ? old.blocks.filter((b) => b.done) : [];
      const force = opts.force || (old && old.forced);
      const alreadyDone = kept.reduce((a, b) => a + b.minutes, 0);
      const fresh = buildDay(state, today, { force, fromMinute: U.nowMinutes(), alreadyDone });
      fresh.blocks = kept.concat(fresh.blocks).sort((a, b) => a.start.localeCompare(b.start));
      fresh.forced = !!force;
      if (old && old.noticeDismissed) fresh.noticeDismissed = old.noticeDismissed;
      state.plans[today] = fresh;
      return fresh;
    },

    missedBefore(state, today) {
      const keys = Object.keys(state.plans)
        .filter((k) => k < today)
        .sort();
      const last = keys[keys.length - 1];
      if (!last) return null;
      const missed = state.plans[last].blocks.filter((b) => !b.done).length;
      return missed ? { date: last, missed } : null;
    },

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
    },

    // Vai dar tempo? Compara os blocos previstos até a prova com o que falta estudar.
    examForecast(state, exam, projection) {
      const today = U.today();
      const days = U.diffDays(today, exam.date);
      if (days < 0) return null;
      const pool = exam.topicIds && exam.topicIds.length ? state.topics.filter((t) => exam.topicIds.includes(t.id)) : state.topics.filter((t) => t.subjectId === exam.subjectId);
      const pending = pool.filter((t) => t.status === 'pendente').length;
      const proj = projection || planner.projectWeek(state, today, Math.min(days, 60));
      const blocks = proj.slice(0, days).reduce((a, d) => a + d.blocks.filter((b) => b.subjectId === exam.subjectId && !b.done).length, 0);
      const needed = pending + 1; // +1 para um simulado/questões no final
      let status = 'ok';
      if (!pool.length) status = 'sem-conteudo';
      else if (blocks < pending) status = 'risco';
      else if (blocks < needed + 1) status = 'apertado';
      return { days, pending, total: pool.length, blocks, needed, status };
    }
  };

  F.planner = planner;
})(window.Florescer = window.Florescer || {});
