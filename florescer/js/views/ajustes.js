/* Florescer · tela "Ajustes" */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function render() {
    const st = store.state;
    const s = st.settings;
    const total = s.periods.reduce((a, p) => a + Number(p.minutes || 0), 0);
    return `
      <header class="page-head">
        <h1>⚙️ Ajustes</h1>
        <p class="muted">Deixe o Florescer do seu jeito. Tudo fica salvo só neste navegador.</p>
      </header>
      <form class="stack" data-form="settings">
        <section class="card form">
          <h3>💗 Você</h3>
          <label class="field"><span>Nome ou apelido</span>
            <input name="name" maxlength="40" value="${U.esc(st.profile.name)}" placeholder="Seu nome ou apelido">
          </label>
          <label class="field"><span>Tema</span>
            <select name="theme">
              <option value="dia" ${s.theme !== 'noite' ? 'selected' : ''}>☀️ Dia (rosinha)</option>
              <option value="noite" ${s.theme === 'noite' ? 'selected' : ''}>🌙 Noite (lavanda escura)</option>
            </select>
          </label>
        </section>

        <section class="card form">
          <h3>⏰ Quando você estuda</h3>
          <p class="muted small">Total por dia agora: <strong>${U.duration(total)}</strong></p>
          ${s.periods
            .map(
              (p, i) => `
            <div class="row three">
              <label class="field"><span>${p.emoji} Período</span><input name="p${i}-label" value="${U.esc(p.label)}" maxlength="20"></label>
              <label class="field"><span>Começa às</span><input type="time" name="p${i}-start" value="${p.start}"></label>
              <label class="field"><span>Minutos de estudo</span><input type="number" min="0" max="600" step="5" name="p${i}-minutes" value="${p.minutes}"></label>
            </div>`
            )
            .join('')}
          <div class="field"><span>Dias de estudo</span>
            <div class="days">
              ${DAYS.map((d, i) => `<label><input type="checkbox" name="day${i}" ${s.studyDays[i] ? 'checked' : ''}><span>${d}</span></label>`).join('')}
            </div>
          </div>
          <div class="row two">
            <label class="field"><span>Tamanho do bloco (min)</span><input type="number" min="20" max="120" step="5" name="blockMinutes" value="${s.blockMinutes}"></label>
            <label class="field"><span>Intervalo entre blocos (min)</span><input type="number" min="0" max="60" step="5" name="breakMinutes" value="${s.breakMinutes}"></label>
          </div>
        </section>

        <section class="card form">
          <h3>🔁 Revisão espaçada</h3>
          <label class="field"><span>Intervalos (em dias, separados por vírgula)</span>
            <input name="reviewIntervals" value="${s.reviewIntervals.join(', ')}">
            <small class="muted">Depois de estudar, a 1ª revisão vem em ${s.reviewIntervals[0]} dia(s). A cada revisão "ok" você sobe um degrau; "fácil" sobe dois; "difícil" desce um.</small>
          </label>
          <div class="row three">
            <label class="field"><span>Minutos por revisão</span><input type="number" min="5" max="60" step="5" name="reviewMinutes" value="${s.reviewMinutes}"></label>
            <label class="field"><span>Máx. do dia em revisão (%)</span><input type="number" min="10" max="80" step="5" name="reviewShare" value="${Math.round(s.reviewShare * 100)}"></label>
            <label class="field"><span>Reta final da prova (dias)</span><input type="number" min="1" max="30" name="examPrepDays" value="${s.examPrepDays}"></label>
          </div>
        </section>

        <section class="card form">
          <h3>🍅 Pomodoro</h3>
          <div class="row four">
            <label class="field"><span>Foco</span><input type="number" min="5" max="90" name="focus" value="${s.pomodoro.focus}"></label>
            <label class="field"><span>Pausa curta</span><input type="number" min="1" max="30" name="short" value="${s.pomodoro.short}"></label>
            <label class="field"><span>Pausa longa</span><input type="number" min="5" max="60" name="long" value="${s.pomodoro.long}"></label>
            <label class="field"><span>Ciclos até a longa</span><input type="number" min="2" max="8" name="cycles" value="${s.pomodoro.cycles}"></label>
          </div>
        </section>

        <div class="center"><button class="btn primary big" type="submit">Salvar ajustes 💗</button></div>
      </form>

      <section class="card form">
        <h3>💾 Backup</h3>
        <p class="muted small">Seus dados ficam só neste navegador. Baixe um backup de vez em quando (e antes de trocar de computador).</p>
        <div class="row">
          <button class="btn soft" data-action="export">⬇️ Baixar backup</button>
          <label class="btn soft">⬆️ Restaurar backup<input type="file" accept="application/json" hidden data-change="import"></label>
          <span class="spacer"></span>
          <button class="btn danger" data-action="reset">Apagar tudo</button>
        </div>
      </section>`;
  }

  F.action('form:settings', (form, data) => {
    const st = store.state;
    const s = st.settings;
    const num = (k, d, min, max) => {
      const v = Number(data.get(k));
      return Number.isFinite(v) && data.get(k) !== '' ? U.clamp(v, min, max) : d;
    };
    st.profile.name = String(data.get('name') || '').trim();
    s.theme = data.get('theme') === 'noite' ? 'noite' : 'dia';
    s.periods.forEach((p, i) => {
      p.label = String(data.get(`p${i}-label`) || p.label).trim() || p.label;
      p.start = data.get(`p${i}-start`) || p.start;
      p.minutes = num(`p${i}-minutes`, p.minutes, 0, 600);
    });
    s.studyDays = s.studyDays.map((_, i) => data.get(`day${i}`) === 'on');
    s.blockMinutes = num('blockMinutes', s.blockMinutes, 20, 120);
    s.breakMinutes = num('breakMinutes', s.breakMinutes, 0, 60);
    const iv = String(data.get('reviewIntervals') || '')
      .split(/[,; ]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
      .map(Math.round);
    if (iv.length) s.reviewIntervals = iv;
    s.reviewMinutes = num('reviewMinutes', s.reviewMinutes, 5, 60);
    s.reviewShare = num('reviewShare', s.reviewShare * 100, 10, 80) / 100;
    s.examPrepDays = num('examPrepDays', s.examPrepDays, 1, 30);
    s.pomodoro.focus = num('focus', s.pomodoro.focus, 5, 90);
    s.pomodoro.short = num('short', s.pomodoro.short, 1, 30);
    s.pomodoro.long = num('long', s.pomodoro.long, 5, 60);
    s.pomodoro.cycles = num('cycles', s.pomodoro.cycles, 2, 8);
    if (!F.pomodoro.s.running) F.pomodoro.reset();
    store.touchPlan();
    store.save();
    F.toast('Ajustes salvos 💗');
    F.render();
  });

  F.action('export', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `florescer-backup-${U.today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  F.action('change:import', (el) => {
    const file = el.files && el.files[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        store.importJSON(text);
        F.toast('Backup restaurado 🌸');
        F.render();
      } catch (e) {
        alert('Não consegui ler esse arquivo: ' + e.message);
      }
    });
  });

  F.action('reset', () => {
    if (!confirm('Apagar TODAS as matérias, provas e progresso? Isso não tem volta.')) return;
    if (!confirm('Tem certeza mesmo? Talvez baixar um backup antes 💗')) return;
    store.reset();
    F.pomodoro.attach(null, null);
    F.go('hoje');
  });

  F.views.ajustes = { render };
})(window.Florescer = window.Florescer || {});
