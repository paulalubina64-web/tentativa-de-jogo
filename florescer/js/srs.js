/* Florescer · revisão espaçada
 *
 * Cada conteúdo estudado entra numa "escada" de intervalos (padrão 1, 3, 7, 14, 30 dias).
 * A cada revisão você diz como foi:
 *   difícil → desce um degrau (revisa logo de novo)
 *   ok      → sobe um degrau
 *   fácil   → sobe dois degraus
 * Passou do último degrau → conteúdo "dominado" 🌸.
 */
(function (F) {
  'use strict';

  const U = F.utils;

  const QUALITY = {
    dificil: { label: 'Difícil', emoji: '😵‍💫', delta: -1 },
    ok: { label: 'Ok', emoji: '🙂', delta: 1 },
    facil: { label: 'Fácil', emoji: '🤩', delta: 2 }
  };

  const srs = {
    QUALITY,

    markStudied(state, topic, dateKey) {
      const iv = state.settings.reviewIntervals;
      topic.status = 'estudado';
      topic.studiedAt = dateKey;
      topic.step = 0;
      topic.nextReview = U.addDays(dateKey, iv[0]);
      topic.history = (topic.history || []).concat({ date: dateKey, type: 'estudo' });
    },

    unmark(topic) {
      topic.status = 'pendente';
      topic.step = 0;
      topic.nextReview = null;
      topic.studiedAt = null;
      topic.history = [];
    },

    review(state, topic, quality, dateKey) {
      const iv = state.settings.reviewIntervals;
      const step = Math.max(0, (topic.step || 0) + QUALITY[quality].delta);
      topic.history = (topic.history || []).concat({ date: dateKey, type: 'revisao', quality });
      if (step >= iv.length) {
        topic.status = 'dominado';
        topic.step = iv.length;
        topic.nextReview = null;
      } else {
        topic.status = 'estudado';
        topic.step = step;
        topic.nextReview = U.addDays(dateKey, iv[step]);
      }
    },

    // Revisões vencidas até a data (as atrasadas entram também: ninguém fica para trás).
    dueOn(state, dateKey) {
      return state.topics.filter((t) => t.nextReview && t.nextReview <= dateKey);
    },

    describe(topic, today) {
      if (topic.status === 'pendente') return { text: 'para estudar', tone: 'pendente' };
      if (topic.status === 'dominado') return { text: 'dominado 🌸', tone: 'dominado' };
      const d = U.diffDays(today, topic.nextReview);
      if (d < 0) return { text: `revisão atrasada ${-d}d`, tone: 'atrasado' };
      if (d === 0) return { text: 'revisar hoje', tone: 'hoje' };
      return { text: `revisa em ${d}d`, tone: 'estudado' };
    }
  };

  F.srs = srs;
})(window.Florescer = window.Florescer || {});
