// ============================================
// GERENCIADOR DE LOCAL STORAGE
// ============================================

class StorageManager {
  constructor() {
    this.storageKey = 'todoAppTasks';
  }

  // Salva tarefas no LocalStorage
  saveTasks(tasks) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
      console.log('✅ Tarefas salvas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar tarefas:', error);
    }
  }

  // Carrega tarefas do LocalStorage
  loadTasks() {
    try {
      const tasks = localStorage.getItem(this.storageKey);
      console.log('📂 Tarefas carregadas do LocalStorage');
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
      return [];
    }
  }

  // Limpa todas as tarefas
  clearAllTasks() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🗑️ Todas as tarefas foram removidas');
    } catch (error) {
      console.error('❌ Erro ao limpar tarefas:', error);
    }
  }

  // Exporta tarefas em JSON
  exportTasks(tasks) {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tarefas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('📥 Tarefas exportadas com sucesso!');
  }
}

// Instância global
const storage = new StorageManager();