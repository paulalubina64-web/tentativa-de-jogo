// ============================================
// RENDERIZADOR DE PERGUNTAS E UI
// ============================================

class QuestionRenderer {
  static renderQuestion(questionIndex) {
    const container = document.getElementById('container-pergunta');
    const question = QUESTOES[questionIndex % QUESTOES.length];

    // Atualiza HUD
    document.getElementById('fase-txt').innerText = `Fase ${gameState.faseAtiva}`;
    document.getElementById('progresso-txt').innerText = `${questionIndex + 1}/${QUESTOES.length}`;

    // Limpa feedback anterior
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('btn-prox').style.display = 'none';

    // Monta HTML da questão
    let html = `<div class="${question.tipo === 'p' ? 'pasta-processo' : 'pergunta-card'}">`;
    if (question.tipo === 'p') html += `<div class="carimbo">URGENTE</div>`;
    html += `<p>${question.enunciado}</p></div><div id="alts">`;

    question.alternativas.forEach((text, i) => {
      html += `<button class="alt-btn" onclick="gameController.checkAnswer(${i})">${text}</button>`;
    });
    html += `</div>`;

    container.innerHTML = html;
  }

  static renderMap() {
    const lista = document.getElementById('lista-fases');
    lista.innerHTML = '';

    for (let i = 1; i <= TOTAL_PHASES; i++) {
      const dot = document.createElement('div');
      dot.className = `fase-dot ${gameState.isPhaseUnlocked(i) ? 'concluida' : ''}`;
      dot.innerText = i;

      if (gameState.isPhaseUnlocked(i)) {
        dot.style.cursor = 'pointer';
        dot.onclick = () => gameController.startPhase(i);
      } else {
        dot.style.cursor = 'not-allowed';
        dot.style.opacity = '0.5';
      }

      lista.appendChild(dot);
    }
  }

  static renderFeedback(isCorrect, explanation, correctIndex) {
    const feed = document.getElementById('feedback');
    feed.style.display = 'block';

    if (isCorrect) {
      feed.innerHTML = `🌟 <b>Certo!</b> ${explanation}`;
    } else {
      feed.innerHTML = `❌ <b>Vish!</b> A resposta correta era a <b>${String.fromCharCode(65 + correctIndex)}</b>. ${explanation}`;
    }

    document.getElementById('btn-prox').style.display = 'block';
  }

  static renderConnections() {
    const grid = document.getElementById('grid-c');
    grid.innerHTML = '';

    gameState.paresAtivos = [
      { p: 'Órgão', c: 'Sem PJ' },
      { p: 'Entidade', c: 'Com PJ' },
      { p: 'Desconcentração', c: 'Interno' },
      { p: 'Descentralização', c: 'Externo' }
    ];

    gameState.paresAtivos.forEach(par => {
      // Coluna esquerda
      const p = document.createElement('div');
      p.className = 'item-c';
      p.innerText = par.p;
      p.onclick = () => {
        gameState.conexoes.p = par.p;
        document.querySelectorAll('#grid-c .item-c').forEach(item => item.classList.remove('selecionado'));
        p.classList.add('selecionado');
      };

      // Coluna direita
      const c = document.createElement('div');
      c.className = 'item-c';
      c.innerText = par.c;
      c.onclick = () => {
        gameState.conexoes.c = par.c;
        c.classList.toggle('selecionado');
      };

      grid.appendChild(p);
      grid.appendChild(c);
    });
  }

  static renderReview() {
    const lista = document.getElementById('erros-lista');

    if (gameState.errosFase.length === 0) {
      lista.innerHTML = "🎉 <b>Incrível!</b> Você acertou tudo de primeira! 💖";
    } else {
      lista.innerHTML = "<b>📚 O que precisamos reforçar:</b><br><br>" +
        gameState.errosFase.map((e, idx) => `<b>${idx + 1}.</b> ${e}`).join("<br><br>");
    }
  }
}
