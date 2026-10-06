/* Florescer · utilitários de data, texto e números */
(function (F) {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');

  const U = {
    uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    // Datas são guardadas como "AAAA-MM-DD" no fuso local: comparar strings = comparar datas.
    toKey(date) {
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    },
    fromKey(key) {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m - 1, d);
    },
    today() {
      return U.toKey(new Date());
    },
    addDays(key, n) {
      const d = U.fromKey(key);
      d.setDate(d.getDate() + n);
      return U.toKey(d);
    },
    // Quantos dias de `a` até `b` (b - a). Math.round absorve o horário de verão.
    diffDays(a, b) {
      return Math.round((U.fromKey(b) - U.fromKey(a)) / 86400000);
    },
    weekday(key) {
      return U.fromKey(key).getDay();
    },
    formatDate(key, opts) {
      return U.fromKey(key).toLocaleDateString('pt-BR', opts || { day: '2-digit', month: 'short' });
    },
    longDate(key) {
      const txt = U.formatDate(key, { weekday: 'long', day: 'numeric', month: 'long' });
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    },
    // Segunda-feira da semana da data (a semana de estudos começa na segunda).
    weekStart(key) {
      const wd = U.weekday(key);
      return U.addDays(key, wd === 0 ? -6 : 1 - wd);
    },
    nowMinutes() {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    },
    weekdayShort(key) {
      return U.formatDate(key, { weekday: 'short' }).replace('.', '');
    },

    // "14:30" <-> minutos desde a meia-noite
    toMinutes(hhmm) {
      const [h, m] = String(hhmm || '00:00').split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    },
    fromMinutes(total) {
      const t = ((total % 1440) + 1440) % 1440;
      return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
    },

    duration(min) {
      min = Math.round(min || 0);
      const h = Math.floor(min / 60);
      const m = min % 60;
      if (!h) return `${m}min`;
      return m ? `${h}h${pad(m)}` : `${h}h`;
    },

    countdownLabel(days) {
      if (days === 0) return 'é hoje!';
      if (days === 1) return 'é amanhã';
      if (days < 0) return `foi há ${-days} dia${days === -1 ? '' : 's'}`;
      return `faltam ${days} dias`;
    },

    clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    },

    esc(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    greeting() {
      const h = new Date().getHours();
      if (h < 5) return 'Boa madrugada';
      if (h < 12) return 'Bom dia';
      if (h < 18) return 'Boa tarde';
      return 'Boa noite';
    }
  };

  F.utils = U;
})(window.Florescer = window.Florescer || {});
