// ============================================
// CONTROLADOR PRINCIPAL DO JOGO
// ============================================

class GameController {
  // Navega entre telas
  static navigateTo(id) {
    document.querySelectorAll('.tela').forEach(t => t.style.display = 'none');
    document.getElementById(id).style.display = 'block';
  }

  // Vai para tela inicial
  static goToStart() {
    this.navigateTo('t-inicio');
  }

  // Inicia o jogo (vai para intro)
  static start() {
    this.navigateTo('t-intro');
  }

  // Vai para o mapa
  static goToMap() {
    this.navigateTo('t-mapa');
    QuestionRenderer.renderMap();
  }

  // Inicia uma fase
  static startPhase(phaseNumber) {
    gameState.startPhase(phaseNumber);
    this.navigateTo('t-jogo');
    QuestionRenderer.renderQuestion(0);
  }

  // Verifica resposta
  static checkAnswer(answerIndex) {
    const question = QUESTOES[gameState.questaoAtual % QUESTOES.length];
    const buttons = document.querySelectorAll('.alt-btn');

    // Desabilita todos os botões
    buttons.forEach(b => b.disabled = true);

    const isCorrect = answerIndex === question.correta;

    if (isCorrect) {
      buttons[answerIndex].classList.add('certo');
    } else {
      buttons[answerIndex].classList.add('errado');
      buttons[question.correta].classList.add('certo');
      gameState.addError(question.explicacao);
    }

    QuestionRenderer.renderFeedback(isCorrect, question.explicacao, question.correta);
  }

  // Próxima questão
  static nextQuestion() {
    gameState.nextQuestion();

    if (gameState.questaoAtual >= QUESTOES.length) {
      this.completePhase();
    } else {
      QuestionRenderer.renderQuestion(gameState.questaoAtual);
    }
  }

  // Completa a fase e mostra revisão
  static completePhase() {
    gameState.completePhase();
    this.navigateTo('t-revisao');
    QuestionRenderer.renderReview();
  }

  // Mostra dica
  static showHint() {
    const question = QUESTOES[gameState.questaoAtual % QUESTOES.length];
    alert(`💡 Dica: ${question.dica}`);
  }

  // Marca como "Não sei"
  static markAsUnknown() {
    const question = QUESTOES[gameState.questaoAtual % QUESTOES.length];
    gameState.addError(question.explicacao);
    this.checkAnswer(-1); // Simula resposta errada
  }

  // Valida conexões
  static validateConnections() {
    if (!gameState.conexoes.p || !gameState.conexoes.c) {
      alert('⚠️ Você precisa selecionar um item de cada coluna!');
      return;
    }

    alert('👩🏽‍🦱 Fru-fru: Conexões registradas! Vamos para os Casos Práticos!');
    gameState.nextQuestion();
    this.navigateTo('t-jogo');
    QuestionRenderer.renderQuestion(gameState.questaoAtual);
  }

  // Abre flashcards
  static openFlashcards() {
    let content = '📖 <b>FLASHCARDS DA FRU-FRU</b>\n\n';
    FLASHCARDS.forEach((card, i) => {
      content += `${i + 1}. <b>${card.pergunta}</b>\n   ${card.resposta}\n\n`;
    });
    alert(content);
  }
}

const gameController = new GameController();
