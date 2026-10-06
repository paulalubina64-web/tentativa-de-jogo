# 🌸 Florescer: seu jardim de estudos

Um cronograma de estudos que **se monta sozinho** a partir do que você cadastra: matérias, conteúdos e datas de provas.
Cada matéria vira uma flor. Quando você estuda e revisa, ela floresce. Se fica esquecida, ela murcha.

## 🚀 Como abrir

- **No computador:** dê dois cliques em `index.html`. Não precisa instalar nada.
- **Online (GitHub Pages):** ative o Pages no repositório e acesse `/florescer/`.

Os dados ficam salvos **só no seu navegador**. Use **Ajustes → Baixar backup** de vez em quando.

## 🧠 O que tem dentro (e por que funciona)

| Recurso | O que faz | A ciência por trás |
|---|---|---|
| 🔁 **Revisão espaçada** | Ao estudar um conteúdo, as revisões são agendadas sozinhas (1, 3, 7, 14, 30 dias). Você responde *difícil / ok / fácil* e o próximo intervalo se ajusta. | Curva do esquecimento (Ebbinghaus): revisar perto do ponto de esquecer fixa a memória. |
| 🧪 **Recordação ativa** | Cada bloco pede que você tente lembrar *antes* de reler. | Efeito de teste: puxar da memória fixa mais do que reler. |
| 🔀 **Intercalação** | O plano evita a mesma matéria em dois blocos seguidos. | Intercalar melhora a discriminação entre assuntos e a retenção. |
| ⚖️ **Peso por prioridade** | Peso na nota, dificuldade, seu domínio, prova próxima e tempo sem estudar decidem quanto tempo cada matéria recebe. | Tempo vai para onde dá mais retorno. |
| 🎯 **Contagem regressiva** | Nos últimos dias antes da prova, a matéria entra em modo *reta final*: questões e simulado. | Prática no formato da prova. |
| 🍅 **Pomodoro** | Timer integrado. Os minutos de foco entram sozinhos no seu progresso. | Blocos curtos com pausas reduzem fadiga. |
| 🌙 **Replanejamento automático** | Perdeu um dia? Conteúdos e revisões voltam para o plano seguinte. Revisões que não cabem no dia vão para o próximo. Mudou algo? Um clique refaz o resto do dia. | Sem acúmulo nem culpa. |

## 🗂️ Telas

- **Hoje:** os blocos do dia (tarde ☀️ e noite 🌙), com revisões, conteúdo sugerido e botão de Pomodoro.
- **Semana:** previsão dos próximos 7 dias e como seu tempo se divide entre as matérias.
- **Matérias:** você cadastra matérias (emoji, cor, peso, dificuldade, domínio) e os conteúdos (pode colar a ementa, um por linha).
- **Provas:** datas, contagem regressiva, progresso dos conteúdos e registro das notas.
- **Pomodoro:** timer com foco, pausa curta e pausa longa.
- **Meu jardim:** flores por matéria, sequência de dias, horas, revisões e mapa dos últimos 28 dias.
- **Ajustes:** horários, dias de estudo, tamanho dos blocos, intervalos de revisão, Pomodoro, tema dia/noite e backup.

## 🛠️ Código

HTML, CSS e JavaScript puros, sem bibliotecas.

```
florescer/
├── index.html
├── css/style.css
└── js/
    ├── utils.js      datas e textos
    ├── store.js      dados + LocalStorage
    ├── srs.js        revisão espaçada
    ├── planner.js    prioridade, intercalação e replanejamento
    ├── pomodoro.js   timer
    ├── app.js        navegação e componentes
    └── views/        uma tela por arquivo
```
