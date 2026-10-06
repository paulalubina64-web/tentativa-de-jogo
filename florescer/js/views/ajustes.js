/* Florescer · tela "Ajustes" */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;

  function render() {
    const st = store.state;
    const s = st.settings;
    return `
      <header class="page-head">
        <h1>⚙️ Ajustes</h1>
        <p class="muted">Deixe o Florescer do seu jeito.</p>
      </header>
      <form class="stack" data-form="settings">
        <section class="card form">
          <h3>💗 Você</h3>
          <div class="row two">
            <label class="field"><span>Nome ou apelido</span><input name="name" maxlength="40" value="${U.esc(st.profile.name)}"></label>
            <label class="field"><span>Tema</span>
              <select name="theme">
                <option value="dia" ${s.theme !== 'noite' ? 'selected' : ''}>☀️ Dia (rosinha)</option>
                <option value="noite" ${s.theme === 'noite' ? 'selected' : ''}>🌙 Noite (lavanda escura)</option>
              </select>
            </label>
          </div>
          <div class="field"><span>Avatar</span><div class="picker">${F.AVATARS.map(
            (a) => `<label><input type="radio" name="avatar" value="${a}" ${a === st.profile.avatar ? 'checked' : ''}><span>${a}</span></label>`
          ).join('')}</div></div>
          <div class="row two">
            <label class="field"><span>Curso</span><input name="course" maxlength="60" value="${U.esc(st.profile.course)}"></label>
            <label class="field"><span>Semestre</span><input name="semester" maxlength="20" value="${U.esc(st.profile.semester)}"></label>
          </div>
          <p class="muted small">⏰ Horários, compromissos, sono e intensidade ficam em <button type="button" class="link" data-action="go" data-view="rotina">Minha rotina</button>.</p>
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
        <h3>🧭 Recomeçar o questionário</h3>
        <p class="muted small">Mudou de semestre? Refaça o questionário. Suas matérias, provas e histórico continuam aqui; você só revisa as respostas.</p>
        <div class="row"><button class="btn soft" data-action="redo-wizard">Refazer questionário</button></div>
      </section>

      <section class="card form">
        <h3>👤 Conta</h3>
        <p class="muted small">${
          F.auth.mode === 'nuvem'
            ? `Conectada(o) como <strong>${U.esc((F.auth.user && F.auth.user.email) || '')}</strong>. Seus dados sincronizam na nuvem.`
            : 'Conta local: os dados ficam neste navegador. Cada pessoa pode ter a sua conta aqui, ou abrir o app no próprio aparelho.'
        }</p>
        <div class="row"><button class="btn soft" data-action="sign-out">${F.auth.mode === 'nuvem' ? 'Sair da conta' : 'Trocar de conta'}</button></div>
      </section>

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
    try {
      localStorage.setItem('florescer:tema', s.theme);
    } catch (e) {
      /* ok */
    }
    st.profile.avatar = data.get('avatar') || st.profile.avatar;
    st.profile.course = String(data.get('course') || '').trim();
    st.profile.semester = String(data.get('semester') || '').trim();
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

  F.action('redo-wizard', () => {
    store.state.profile.onboarded = false;
    store.state.profile.onboardingStep = 0;
    store.save();
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
    if (!confirm('Apagar TODAS as matérias, provas, rotina e histórico desta conta? Isso não tem volta.')) return;
    if (!confirm('Tem certeza mesmo? Talvez baixar um backup antes 💗')) return;
    store.reset();
    F.pomodoro.attach(null, null);
    F.ui.view = 'hoje';
    F.render();
  });

  F.views.ajustes = { render };
})(window.Florescer = window.Florescer || {});
