/* Florescer · contas
 *
 * Modo "local": várias contas no mesmo navegador (cada uma com seus dados e histórico).
 * Modo "nuvem": login com Google ou e-mail/senha via Firebase; os dados de cada pessoa
 * ficam no documento usuarios/{uid} e sincronizam entre aparelhos.
 */
(function (F) {
  'use strict';

  const U = F.utils;
  const store = F.store;
  const INDEX_KEY = 'florescer:contas';
  const LAST_KEY = 'florescer:ultima-conta';
  const LEGACY_KEY = 'florescer:v1';
  const SDK = '10.12.2';

  const cfg = window.FLORESCER_FIREBASE;
  const cloud = !!(cfg && cfg.apiKey && cfg.projectId);

  const ERRORS = {
    'auth/invalid-email': 'Esse e-mail não parece válido.',
    'auth/missing-password': 'Digite a senha.',
    'auth/weak-password': 'A senha precisa de pelo menos 6 caracteres.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Tente entrar.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Não achei uma conta com esse e-mail.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouquinho e tente de novo.',
    'auth/popup-closed-by-user': 'A janela de login foi fechada antes de terminar.',
    'auth/network-request-failed': 'Sem internet no momento.'
  };

  function readIndex() {
    try {
      return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function writeIndex(list) {
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(list));
    } catch (e) {
      /* sem armazenamento */
    }
  }
  function setLast(id) {
    try {
      localStorage.setItem(LAST_KEY, id);
    } catch (e) {
      /* ok */
    }
  }
  function getLast() {
    try {
      return localStorage.getItem(LAST_KEY);
    } catch (e) {
      return null;
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Não consegui carregar ' + src));
      document.head.appendChild(s);
    });
  }

  async function loadFirebase() {
    if (!window.firebase) {
      const base = `https://www.gstatic.com/firebasejs/${SDK}/`;
      await loadScript(base + 'firebase-app-compat.js');
      await Promise.all([loadScript(base + 'firebase-auth-compat.js'), loadScript(base + 'firebase-firestore-compat.js')]);
    }
    if (!window.firebase.apps.length) window.firebase.initializeApp(cfg);
    return window.firebase;
  }

  // Primeira vez com contas: se havia dados da versão antiga, viram a primeira conta.
  function migrateLegacy() {
    if (readIndex().length) return;
    let raw = null;
    try {
      raw = localStorage.getItem(LEGACY_KEY);
    } catch (e) {
      return;
    }
    if (!raw) return;
    let name = 'Minha conta';
    try {
      name = JSON.parse(raw).profile.name || name;
    } catch (e) {
      /* usa o padrão */
    }
    const id = U.uid();
    try {
      localStorage.setItem('florescer:conta:' + id, raw);
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) {
      return;
    }
    writeIndex([{ id, name, avatar: '🌸', createdAt: U.today() }]);
    setLast(id);
  }

  let syncTimer = null;

  const auth = {
    mode: cloud ? 'nuvem' : 'local',
    user: null,
    sync: 'local', // local | salvando | salvo | offline
    error: '',
    ready: false,

    listLocal() {
      return readIndex();
    },

    createLocal({ name, avatar }) {
      const id = U.uid();
      const list = readIndex();
      list.push({ id, name, avatar: avatar || '🌸', createdAt: U.today() });
      writeIndex(list);
      store.open('florescer:conta:' + id);
      store.state.profile.name = name;
      store.state.profile.avatar = avatar || '🌸';
      store.save();
      auth.openLocal(id);
    },

    openLocal(id) {
      const acc = readIndex().find((a) => a.id === id);
      if (!acc) return;
      store.open('florescer:conta:' + id);
      auth.user = { id, name: store.state.profile.name || acc.name, avatar: store.state.profile.avatar || acc.avatar };
      auth.sync = 'local';
      setLast(id);
      F.enterApp();
    },

    refreshIndex() {
      if (auth.mode !== 'local' || !auth.user) return;
      const list = readIndex();
      const acc = list.find((a) => a.id === auth.user.id);
      if (!acc) return;
      const p = store.state.profile;
      if (acc.name !== p.name || acc.avatar !== p.avatar) {
        acc.name = p.name || acc.name;
        acc.avatar = p.avatar || acc.avatar;
        writeIndex(list);
      }
      auth.user.name = acc.name;
      auth.user.avatar = acc.avatar;
    },

    deleteLocal(id) {
      writeIndex(readIndex().filter((a) => a.id !== id));
      try {
        localStorage.removeItem('florescer:conta:' + id);
      } catch (e) {
        /* ok */
      }
    },

    /* ---------- nuvem ---------- */

    async signInGoogle() {
      return auth.wrap(async () => {
        const fb = await loadFirebase();
        await fb.auth().signInWithPopup(new fb.auth.GoogleAuthProvider());
      });
    },
    async signInEmail(email, password) {
      return auth.wrap(async () => {
        const fb = await loadFirebase();
        await fb.auth().signInWithEmailAndPassword(email, password);
      });
    },
    async signUpEmail(name, email, password) {
      return auth.wrap(async () => {
        const fb = await loadFirebase();
        auth.pendingName = name;
        const cred = await fb.auth().createUserWithEmailAndPassword(email, password);
        if (name && cred.user) await cred.user.updateProfile({ displayName: name });
      });
    },
    async resetPassword(email) {
      return auth.wrap(async () => {
        const fb = await loadFirebase();
        await fb.auth().sendPasswordResetEmail(email);
        F.toast('Enviei um e-mail para você criar uma senha nova 💌');
      });
    },

    async wrap(fn) {
      auth.error = '';
      try {
        await fn();
        return true;
      } catch (e) {
        auth.error = ERRORS[e.code] || e.message || 'Algo deu errado.';
        F.renderAuth();
        return false;
      }
    },

    async openCloud(user) {
      const fb = window.firebase;
      store.open('florescer:nuvem:' + user.uid);
      auth.user = { id: user.uid, name: user.displayName || user.email, avatar: store.state.profile.avatar, email: user.email };
      const ref = fb.firestore().collection('usuarios').doc(user.uid);
      try {
        const snap = await ref.get();
        const remote = snap.exists ? snap.data() : null;
        if (remote && remote.data && (remote.updatedAt || 0) > (store.state.updatedAt || 0)) {
          store.replace(JSON.parse(remote.data));
        } else if (store.state.updatedAt) {
          await auth.push(ref);
        }
        auth.sync = 'salvo';
      } catch (e) {
        console.warn('Florescer: sem sincronizar agora', e);
        auth.sync = 'offline';
      }
      const display = user.displayName || auth.pendingName;
      auth.pendingName = null;
      if (!store.state.profile.name && display) store.state.profile.name = display.split(' ')[0];
      store.setSaveHook(() => {
        auth.sync = 'salvando';
        F.renderAccount();
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => auth.push(ref), 1500);
      });
      F.enterApp();
    },

    async push(ref) {
      try {
        await ref.set({
          data: JSON.stringify(store.state),
          updatedAt: store.state.updatedAt || Date.now(),
          name: store.state.profile.name || '',
          email: (auth.user && auth.user.email) || ''
        });
        auth.sync = 'salvo';
      } catch (e) {
        console.warn('Florescer: falha ao salvar na nuvem', e);
        auth.sync = 'offline';
      }
      F.renderAccount();
    },

    async signOut() {
      if (F.pomodoro) {
        F.pomodoro.attach(null, null);
        F.pomodoro.reset();
      }
      if (auth.mode === 'nuvem' && window.firebase) {
        clearTimeout(syncTimer);
        if (auth.sync === 'salvando') await auth.push(window.firebase.firestore().collection('usuarios').doc(auth.user.id));
        await window.firebase.auth().signOut();
      } else {
        try {
          localStorage.removeItem(LAST_KEY);
        } catch (e) {
          /* ok */
        }
      }
      auth.user = null;
      store.close();
      F.renderAuth();
    },

    async init() {
      if (cloud) {
        try {
          const fb = await loadFirebase();
          fb.auth().onAuthStateChanged((u) => {
            auth.ready = true;
            if (u) auth.openCloud(u);
            else {
              auth.user = null;
              store.close();
              F.renderAuth();
            }
          });
        } catch (e) {
          auth.ready = true;
          auth.error = 'Não consegui conectar à nuvem. Verifique sua internet e recarregue a página.';
          F.renderAuth();
        }
        return;
      }
      auth.ready = true;
      migrateLegacy();
      const last = getLast();
      if (last && readIndex().some((a) => a.id === last)) auth.openLocal(last);
      else F.renderAuth();
    }
  };

  // Mantém a lista de contas com o nome/avatar atual de cada uma.
  store.onChange(() => auth.refreshIndex());

  F.auth = auth;
})(window.Florescer = window.Florescer || {});
