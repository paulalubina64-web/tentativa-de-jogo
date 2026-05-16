// ============================================
// APLICAÇÃO PRINCIPAL - TO-DO LIST
// ============================================

class TodoApp {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'todas';
    this.currentSort = 'recente';
    this.init();
  }

  // Inicializa a aplicação
  init() {
    console.log('🚀 To-Do List iniciado!');
    
    // Carrega tarefas salvas
    this.tasks = storage.loadTasks();
    console.log(`📊 ${this.tasks.length} tarefas carregadas`);
    
    // Vincula eventos
    this.bindEvents();
    
    // Renderiza interface
    this.render();
  }

  // Vincula eventos dos botões
  bindEvents() {
    // Adicionar tarefa
    document.getElementById('addBtn').addEventListener('click', () => this.addTask());
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
    });

    // Ordenação
    document.getElementById('sortSelect').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.render();
    });

    // Ações
    document.getElementById('exportBtn').addEventListener('click', () => this.exportTasks());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearCompleted());
    document.getElementById('resetBtn').addEventListener('click', () => this.resetAll());
  }

  // Adiciona nova tarefa
  addTask() {
    const input = document.getElementById('taskInput');
    const priority = document.getElementById('prioritySelect').value;
    const text = input.value.trim();

    if (!text) {
      alert('⚠️ Digite uma tarefa!');
      return;
    }

    const task = {
      id: Date.now(),
      text: text,
      priority: priority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(task);
    console.log('✅ Tarefa adicionada:', task);

    input.value = '';
    storage.saveTasks(this.tasks);
    this.render();
  }

  // Delete tarefa
  deleteTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    console.log('🗑️ Tarefa deletada:', id);
    storage.saveTasks(this.tasks);
    this.render();
  }

  // Toggle completa/não completa
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      console.log('✏️ Tarefa alterada:', task);
      storage.saveTasks(this.tasks);
      this.render();
    }
  }

  // Define filtro
  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    this.render();
  }

  // Filtra tarefas
  getFilteredTasks() {
    let filtered = this.tasks;

    switch (this.currentFilter) {
      case 'ativas':
        filtered = this.tasks.filter(t => !t.completed);
        break;
      case 'completas':
        filtered = this.tasks.filter(t => t.completed);
        break;
      case 'alta':
      case 'media':
      case 'baixa':
        filtered = this.tasks.filter(t => t.priority === this.currentFilter);
        break;
      default:
        filtered = this.tasks;
    }

    return this.sortTasks(filtered);
  }

  // Ordena tarefas
  sortTasks(tasks) {
    const sorted = [...tasks];

    switch (this.currentSort) {
      case 'antiguo':
        sorted.reverse();
        break;
      case 'prioridade':
        const priorityOrder = { 'alta': 1, 'media': 2, 'baixa': 3 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'nome':
        sorted.sort((a, b) => a.text.localeCompare(b.text));
        break;
      case 'recente':
      default:
        // Já está em ordem recente
        break;
    }

    return sorted;
  }

  // Limpa tarefas completas
  clearCompleted() {
    const completed = this.tasks.filter(t => t.completed).length;
    if (completed === 0) {
      alert('✨ Nenhuma tarefa completa para remover!');
      return;
    }

    if (confirm(`🗑️ Remover ${completed} tarefa(s) completa(s)?`)) {
      this.tasks = this.tasks.filter(t => !t.completed);
      storage.saveTasks(this.tasks);
      this.render();
      console.log('✅ Tarefas completas removidas');
    }
  }

  // Reseta tudo
  resetAll() {
    if (confirm('⚠️ Tem certeza? Isso removerá TODAS as tarefas!')) {
      this.tasks = [];
      storage.clearAllTasks();
      this.render();
      console.log('🔄 Aplicação resetada');
    }
  }

  // Exporta tarefas
  exportTasks() {
    if (this.tasks.length === 0) {
      alert('⚠️ Não há tarefas para exportar!');
      return;
    }
    storage.exportTasks(this.tasks);
  }

  // Renderiza a interface
  render() {
    this.updateStats();
    this.renderTasks();
  }

  // Atualiza estatísticas
  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    document.getElementById('stats').innerText = `${total} tarefas · ${completed} completas`;
  }

  // Renderiza lista de tarefas
  renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    const filtered = this.getFilteredTasks();

    // Limpa lista
    tasksList.innerHTML = '';

    if (filtered.length === 0) {
      tasksList.style.display = 'none';
      emptyState.classList.add('show');
      return;
    }

    tasksList.style.display = 'block';
    emptyState.classList.remove('show');

    // Renderiza cada tarefa
    filtered.forEach(task => {
      const taskEl = this.createTaskElement(task);
      tasksList.appendChild(taskEl);
    });
  }

  // Cria elemento da tarefa
  createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
    div.dataset.id = task.id;

    const date = new Date(task.createdAt).toLocaleDateString('pt-BR');

    div.innerHTML = `
      <input 
        type="checkbox" 
        class="task-checkbox" 
        ${task.completed ? 'checked' : ''}
        onchange="app.toggleTask(${task.id})"
      >
      <div class="task-content">
        <div class="task-header">
          <span class="task-text">${this.escapeHtml(task.text)}</span>
          <span class="priority-badge ${task.priority}">${task.priority}</span>
        </div>
        <div class="task-date">📅 ${date}</div>
      </div>
      <button class="delete-btn" onclick="app.deleteTask(${task.id})">🗑️</button>
    `;

    return div;
  }

  // Escapa HTML para segurança
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Instancia a aplicação quando o DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new TodoApp();
  console.log('✅ Aplicação carregada e pronta!');
});