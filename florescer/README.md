# 🌸 Florescer: seu jardim de estudos

Um cronograma de estudos que **se monta sozinho a partir da vida de cada pessoa**: as matérias, as provas, a rotina, o sono e o horário em que a cabeça rende mais.
Cada matéria vira uma flor. Quando você estuda e revisa, ela floresce. Se fica esquecida, ela murcha.

O app começa **vazio**. Cada pessoa cria a própria conta, responde a um questionário de boas-vindas e cadastra as próprias matérias.

---

## 🚀 Como usar

### Sozinha(o), no computador
Dê dois cliques em `index.html`. Pronto.

### Mandar para as amigas (link na internet, de graça)
1. No GitHub, abra o repositório → **Settings** → **Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**, a branch e a pasta `/ (root)`. Salve.
3. Em 1 a 2 minutos o site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/florescer/`.
4. Mande esse link. Cada pessoa que abrir no próprio celular ou computador tem o seu Florescer separado.

> No plano gratuito do GitHub, o Pages exige que o repositório seja **público**. O código fica visível, mas os **dados de cada pessoa não**: eles ficam no navegador dela ou na conta dela na nuvem.

---

## 👤 Contas: dois modos

| | **Contas locais** (padrão) | **Contas na nuvem** (opcional) |
|---|---|---|
| Configuração | Nenhuma | ~10 min no Firebase (grátis) |
| Login | Escolher o perfil ("Quem vai estudar hoje?") | Google ou e-mail e senha |
| Onde ficam os dados | No navegador daquela pessoa | Na conta dela, na nuvem |
| Usar no celular E no computador | ❌ cada aparelho é separado | ✅ sincroniza tudo |
| Se limpar o navegador | Perde (use o backup em Ajustes) | Não perde |

### Ativar as contas na nuvem (Firebase)
1. Acesse <https://console.firebase.google.com> → **Adicionar projeto** (pode desativar o Analytics).
2. **Authentication** → *Vamos começar* → ative **E-mail/senha** e **Google**.
3. **Authentication → Configurações → Domínios autorizados** → adicione `SEU-USUARIO.github.io`.
4. **Firestore Database** → *Criar banco de dados* → modo de produção → escolha uma região (ex.: `southamerica-east1`).
5. Na aba **Regras** do Firestore, cole o conteúdo de [`firestore.rules`](firestore.rules) e publique. Com isso, cada pessoa só enxerga os próprios dados.
6. **Configurações do projeto (⚙️) → Seus apps → Web (`</>`)** → registre o app e copie o objeto `firebaseConfig`.
7. Cole esse objeto em [`js/config.js`](js/config.js), no lugar do `null`:
   ```js
   window.FLORESCER_FIREBASE = {
     apiKey: '...',
     authDomain: 'seu-projeto.firebaseapp.com',
     projectId: 'seu-projeto',
     appId: '...'
   };
   ```
8. Faça o commit. Pronto: a tela de entrada passa a ter "Entrar com Google" e e-mail/senha.

> A `apiKey` do Firebase **não é segredo**: ela só identifica o projeto. Quem protege os dados são as regras do passo 5.

---

## 🧭 O questionário de boas-vindas

Na primeira vez, cada pessoa responde a 7 passos e o app monta tudo:

1. **Sobre você:** nome, avatar, curso, semestre e objetivo (notas altas, passar sem sufoco, recuperar matérias, OAB ou concurso).
2. **Seu ritmo:** horário de acordar e dormir, quando a cabeça rende mais, intensidade (leve, equilibrado ou intenso).
3. **Quando você pode estudar:** os períodos livres de cada dia e as horas de estudo por dia.
4. **Sua vida fora dos estudos:** aula, estágio, academia, terapia, igreja, tempo com quem você ama, além de eventos como aniversários e viagens.
5. **Suas matérias:** peso, dificuldade, quanto você já domina, meta de nota e conteúdos (dá para colar a ementa).
6. **Suas provas:** datas e tipos.
7. **Resumo:** como o tempo vai ser dividido nos próximos 7 dias.

Tudo pode ser mudado depois. Em Ajustes dá para refazer o questionário.

---

## 🧠 A inteligência por trás

| Recurso | O que faz |
|---|---|
| 🧺 **Respeita a sua vida** | Nunca coloca estudo em cima de compromissos (e deixa 15 min de folga para deslocamento), respeita o sono e libera os dias marcados como "sem estudo". |
| ⚡ **Horário de pico** | As matérias mais difíceis vão para o período em que você rende mais. |
| ⚖️ **Prioridade** | Peso na nota + dificuldade + o que falta dominar + prova perto + dias sem estudar decidem quanto tempo cada matéria recebe. |
| 🔀 **Intercalação** | Evita a mesma matéria em dois blocos seguidos. |
| 🔁 **Revisão espaçada** | Ao estudar um conteúdo, as revisões são agendadas sozinhas (1, 3, 7, 14, 30 dias) e se ajustam a cada resposta: difícil, ok ou fácil. |
| 🎯 **Inteligência de provas** | Você marca o que cai, e o app prioriza esses conteúdos, entra em modo *reta final* e faz uma **revisão pré-prova** de tudo nos 2 dias anteriores. |
| 🚦 **Vai dar tempo?** | Cada prova mostra 🟢 no ritmo, 🟡 apertado ou 🔴 risco, comparando os blocos previstos até a data com o que falta estudar. |
| 🃏 **Cartões** | Flashcards e **caderno de erros** (com o *motivo* de cada erro), todos com revisão espaçada. |
| 💡 **Dicas pelos seus dados** | Avisa sobre provas em risco, revisões acumuladas, seu tipo de erro mais comum, notas abaixo da meta, matérias abandonadas e sono ruim. |
| 🌙 **Replanejamento** | Perdeu um dia? Tudo volta nos dias seguintes. "Replanejar" refaz o resto do dia **a partir de agora**. |
| 📈 **Histórico** | Cada pessoa tem o próprio histórico semana a semana (horas, conteúdos, revisões, blocos) e uma **revisão da semana** com 3 perguntas. |
| 🍅 **Pomodoro** | Integrado aos blocos. Os minutos entram sozinhos no progresso. |

---

## 🛠️ Código

HTML, CSS e JavaScript puros, sem build. O Firebase só é carregado se estiver configurado.

```
florescer/
├── index.html
├── firestore.rules          regras de segurança da nuvem
├── css/style.css
└── js/
    ├── config.js            configuração da nuvem (opcional)
    ├── utils.js             datas e textos
    ├── store.js             dados de uma conta + migração de versões
    ├── auth.js              contas locais e na nuvem
    ├── srs.js               revisão espaçada, cartões, tipos de erro
    ├── planner.js           rotina, prioridade, intercalação, pico, provas
    ├── insights.js          dicas a partir dos dados
    ├── pomodoro.js          timer
    ├── app.js               navegação e componentes
    └── views/               uma tela por arquivo
```
