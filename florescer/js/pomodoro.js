/* Florescer · Pomodoro
 * Usa o horário de término (e não um contador) para continuar certo mesmo com a aba em segundo plano.
 */
(function (F) {
  'use strict';

  const KEY = 'florescer:pomodoro';
  const PHASES = {
    foco: { label: 'Foco', emoji: '🍅' },
    curta: { label: 'Pausa curta', emoji: '🫖' },
    longa: { label: 'Pausa longa', emoji: '🌿' }
  };

  const listeners = [];

  function cfg() {
    return F.store.state.settings.pomodoro;
  }

  function phaseSeconds(phase) {
    const c = cfg();
    return (phase === 'foco' ? c.focus : phase === 'curta' ? c.short : c.long) * 60;
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.phase) return saved;
    } catch (e) {
      /* começa do zero */
    }
    return { phase: 'foco', running: false, endsAt: null, remaining: null, cycle: 0, subjectId: null, blockId: null };
  }

  const p = {
    PHASES,
    s: restore(),

    persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify(p.s));
      } catch (e) {
        /* sem persistência, sem problema */
      }
    },

    onTick(fn) {
      listeners.push(fn);
    },

    remaining() {
      if (p.s.running) return Math.max(0, Math.round((p.s.endsAt - Date.now()) / 1000));
      return p.s.remaining == null ? phaseSeconds(p.s.phase) : p.s.remaining;
    },
    total() {
      return phaseSeconds(p.s.phase);
    },

    start() {
      if (p.s.running) return;
      p.s.endsAt = Date.now() + p.remaining() * 1000;
      p.s.running = true;
      p.persist();
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      p.emit();
    },
    pause() {
      if (!p.s.running) return;
      p.s.remaining = p.remaining();
      p.s.running = false;
      p.persist();
      p.emit();
    },
    reset() {
      p.s.running = false;
      p.s.remaining = null;
      p.persist();
      p.emit();
    },
    skip() {
      p.finish(true);
    },

    attach(subjectId, blockId) {
      if (p.s.phase !== 'foco') {
        p.s.phase = 'foco';
        p.s.running = false;
        p.s.remaining = null;
      }
      p.s.subjectId = subjectId || null;
      p.s.blockId = blockId || null;
      p.persist();
      p.emit();
    },

    finish(skipped) {
      const wasFocus = p.s.phase === 'foco';
      if (wasFocus && !skipped && p.s.subjectId) {
        F.store.logSession({ subjectId: p.s.subjectId, minutes: cfg().focus, kind: 'pomodoro', blockId: p.s.blockId });
      }
      if (wasFocus) {
        p.s.cycle += 1;
        p.s.phase = p.s.cycle % cfg().cycles === 0 ? 'longa' : 'curta';
      } else {
        p.s.phase = 'foco';
      }
      p.s.running = false;
      p.s.remaining = null;
      p.persist();
      if (!skipped) p.chime(wasFocus);
      p.emit();
    },

    chime(wasFocus) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.18, 0.36].forEach((t, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = [660, 880, 990][i];
          g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.4);
          o.connect(g).connect(ctx.destination);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.45);
        });
      } catch (e) {
        /* sem áudio */
      }
      const msg = wasFocus ? 'Foco concluído! Hora de uma pausa 🫖' : 'Pausa acabou. Bora florescer 🌸';
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Florescer', { body: msg });
        } catch (e) {
          /* alguns navegadores bloqueiam */
        }
      }
      if (F.toast) F.toast(msg);
    },

    emit() {
      listeners.forEach((fn) => fn(p));
    }
  };

  setInterval(() => {
    if (p.s.running && p.remaining() <= 0) p.finish(false);
    if (p.s.running) p.emit();
  }, 500);

  F.pomodoro = p;
})(window.Florescer = window.Florescer || {});
