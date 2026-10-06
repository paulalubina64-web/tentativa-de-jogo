/* Florescer · tela de entrada (contas) */
(function (F) {
  'use strict';

  const U = F.utils;
  const ui = { tab: 'entrar', creating: false };

  function avatarPicker(selected) {
    return `<div class="picker">${F.AVATARS.map(
      (a) => `<label><input type="radio" name="avatar" value="${a}" ${a === selected ? 'checked' : ''}><span>${a}</span></label>`
    ).join('')}</div>`;
  }

  function hero() {
    return `
      <div class="auth-hero">
        <div class="auth-flower">🌸</div>
        <h1>Florescer</h1>
        <p class="muted">O cronograma de estudos que se monta sozinho a partir da <strong>sua</strong> vida: suas matérias, suas provas, sua rotina.</p>
        <ul class="auth-perks">
          <li>🔁 Revisão espaçada automática</li>
          <li>🎯 Avisa se vai dar tempo antes de cada prova</li>
          <li>🧺 Respeita aula, estágio, academia e descanso</li>
          <li>🃏 Flashcards e caderno de erros</li>
        </ul>
      </div>`;
  }

  function localScreen() {
    const accounts = F.auth.listLocal();
    const showForm = ui.creating || !accounts.length;
    return `
      <div class="auth-card card">
        ${
          accounts.length
            ? `<h2>Quem vai estudar hoje?</h2>
              <div class="profiles">
                ${accounts
                  .map(
                    (a) => `<div class="profile">
                      <button class="profile-btn" data-action="open-local" data-id="${a.id}">
                        <span class="profile-avatar">${a.avatar}</span>
                        <strong>${U.esc(a.name)}</strong>
                      </button>
                      <button class="profile-del" data-action="delete-local" data-id="${a.id}" title="Excluir conta">✕</button>
                    </div>`
                  )
                  .join('')}
                ${showForm ? '' : `<button class="profile-btn add" data-action="new-local"><span class="profile-avatar">＋</span><strong>Nova conta</strong></button>`}
              </div>`
            : '<h2>Crie sua conta 🌱</h2>'
        }
        ${
          showForm
            ? `<form class="form" data-form="new-local">
                <label class="field"><span>Seu nome ou apelido</span><input name="name" required maxlength="40" placeholder="Como você quer ser chamada(o)?"></label>
                <div class="field"><span>Escolha um avatar</span>${avatarPicker(F.AVATARS[accounts.length % F.AVATARS.length])}</div>
                <div class="row">
                  <button class="btn primary" type="submit">Criar minha conta</button>
                  ${accounts.length ? '<button class="btn ghost" type="button" data-action="cancel-local">Cancelar</button>' : ''}
                </div>
              </form>`
            : ''
        }
        <p class="muted small auth-note">💾 As contas e o histórico de cada pessoa ficam salvos <strong>neste navegador</strong>.
        Cada amiga que abrir o link no próprio celular ou computador tem o seu Florescer separado.</p>
      </div>`;
  }

  function cloudScreen() {
    if (!F.auth.ready) return '<div class="auth-card card center"><p>Conectando… 🌸</p></div>';
    const t = ui.tab;
    return `
      <div class="auth-card card">
        <button class="btn google full" data-action="google">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Entrar com Google
        </button>
        <div class="divider"><span>ou com e-mail</span></div>
        <div class="tabs">
          <button class="tab ${t === 'entrar' ? 'on' : ''}" data-action="auth-tab" data-tab="entrar">Entrar</button>
          <button class="tab ${t === 'criar' ? 'on' : ''}" data-action="auth-tab" data-tab="criar">Criar conta</button>
        </div>
        <form class="form" data-form="auth-email">
          ${t === 'criar' ? '<label class="field"><span>Nome</span><input name="name" required maxlength="40" autocomplete="name"></label>' : ''}
          <label class="field"><span>E-mail</span><input type="email" name="email" required autocomplete="email"></label>
          <label class="field"><span>Senha</span><input type="password" name="password" required minlength="6" autocomplete="${t === 'criar' ? 'new-password' : 'current-password'}"></label>
          ${F.auth.error ? `<p class="error">${U.esc(F.auth.error)}</p>` : ''}
          <button class="btn primary full" type="submit">${t === 'criar' ? 'Criar conta' : 'Entrar'}</button>
          ${t === 'entrar' ? '<button class="link small center" type="button" data-action="forgot">Esqueci minha senha</button>' : ''}
        </form>
        <p class="muted small auth-note">☁️ Seus dados ficam guardados na sua conta e aparecem em qualquer aparelho em que você entrar.</p>
      </div>`;
  }

  function render() {
    return `
      <div class="auth">
        ${hero()}
        ${F.auth.mode === 'nuvem' ? cloudScreen() : localScreen()}
      </div>`;
  }

  F.action('open-local', (el) => F.auth.openLocal(el.dataset.id));
  F.action('new-local', () => {
    ui.creating = true;
    F.renderAuth();
  });
  F.action('cancel-local', () => {
    ui.creating = false;
    F.renderAuth();
  });
  F.action('delete-local', (el) => {
    const acc = F.auth.listLocal().find((a) => a.id === el.dataset.id);
    if (!acc) return;
    if (!confirm(`Excluir a conta de ${acc.name} e TODO o histórico dela neste navegador?`)) return;
    F.auth.deleteLocal(acc.id);
    F.renderAuth();
  });
  F.action('form:new-local', (form, data) => {
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    ui.creating = false;
    F.auth.createLocal({ name, avatar: data.get('avatar') || '🌸' });
  });

  F.action('google', () => F.auth.signInGoogle());
  F.action('auth-tab', (el) => {
    ui.tab = el.dataset.tab;
    F.auth.error = '';
    F.renderAuth();
  });
  F.action('form:auth-email', (form, data) => {
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    if (ui.tab === 'criar') F.auth.signUpEmail(String(data.get('name') || '').trim(), email, password);
    else F.auth.signInEmail(email, password);
  });
  F.action('forgot', () => {
    const input = document.querySelector('input[name=email]');
    const email = input && input.value.trim();
    if (!email) {
      F.auth.error = 'Digite seu e-mail acima e clique de novo em "Esqueci minha senha".';
      F.renderAuth();
      return;
    }
    F.auth.resetPassword(email);
  });

  F.views.entrar = { render };
})(window.Florescer = window.Florescer || {});
