// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Fru-fru Jus iniciado!');
  console.log(`📊 Fase desbloqueada: ${gameState.faseAtiva}`);
  console.log(`📈 Progresso: ${gameState.totalFasesCompletadas}/${TOTAL_PHASES}`);

  // Carrega estado salvo
  gameState.load();
});

// Salva estado periodicamente
setInterval(() => {
  gameState.save();
}, 30000); // A cada 30 segundos
