// ============================================
// GERENCIADOR DE ESTADO DO JOGO
// ============================================

class GameState {
  constructor() {
    this.faseAtiva = 1;
    this.questaoAtual = 0;
    this.errosFase = [];
    this.conexoes = { p: null, c: null };
    this.paresAtivos = [];
    this.totalFasesCompletadas = 0;
    this.load();
  }

  // Salva estado no LocalStorage
  save() {
    const state = {
      faseAtiva: this.faseAtiva,
      questaoAtual: this.questaoAtual,
      errosFase: this.errosFase,
      totalFasesCompletadas: this.totalFasesCompletadas,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('gameState', JSON.stringify(state));
  }

  // Carrega estado do LocalStorage
  load() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      const state = JSON.parse(saved);
      this.faseAtiva = state.faseAtiva || 1;
      this.totalFasesCompletadas = state.totalFasesCompletadas || 0;
    }
  }

  // Reset completo do jogo
  reset() {
    this.faseAtiva = 1;
    this.questaoAtual = 0;
    this.errosFase = [];
    this.totalFasesCompletadas = 0;
    this.conexoes = { p: null, c: null };
    localStorage.removeItem('gameState');
    this.save();
  }

  // Inicia uma nova fase
  startPhase(n) {
    this.faseAtiva = n;
    this.questaoAtual = 0;
    this.errosFase = [];
    this.conexoes = { p: null, c: null };
    this.save();
  }

  // Avança para próxima questão
  nextQuestion() {
    this.questaoAtual++;
    this.save();
  }

  // Adiciona erro ao registro
  addError(explanation) {
    this.errosFase.push(explanation);
    this.save();
  }

  // Completa a fase
  completePhase() {
    if (this.faseAtiva <= TOTAL_PHASES) {
      this.totalFasesCompletadas = Math.max(this.totalFasesCompletadas, this.faseAtiva);
      if (this.faseAtiva < TOTAL_PHASES) {
        this.faseAtiva++;
      }
      this.save();
    }
  }

  // Retorna se uma fase foi desbloqueada
  isPhaseUnlocked(n) {
    return n <= this.faseAtiva || n <= this.totalFasesCompletadas;
  }

  // Obtém progresso total
  getProgress() {
    return {
      faseAtiva: this.faseAtiva,
      totalCompletadas: this.totalFasesCompletadas,
      percentual: Math.round((this.totalFasesCompletadas / TOTAL_PHASES) * 100)
    };
  }
}

// Instância global
const gameState = new GameState();
