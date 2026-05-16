# 📝 To-Do List App

**Uma aplicação moderna de gerenciamento de tarefas com persistência em LocalStorage!**

## ✨ Funcionalidades

### 🎯 Principais
- ✅ Criar, editar e deletar tarefas
- 🎯 3 níveis de prioridade (Alta, Média, Baixa)
- 🔍 Filtros avançados (Todas, Ativas, Completas, Por Prioridade)
- 🔄 4 formas de ordenação (Recente, Antigo, Prioridade, Alfabética)
- 💾 Persistência automática com LocalStorage
- 📥 Exportar tarefas em JSON
- 🗑️ Limpar tarefas completas
- ⚠️ Resetar tudo

### 🎨 Design
- 🌈 Gradiente moderno (roxo/violeta)
- 📱 100% Responsivo
- 🎬 Animações suaves
- ⚡ Interface intuitiva
- 🌟 Emojis interativos

## 🚀 Como Usar

### 1. **Adicionar Tarefa**
   - Digite a tarefa no campo de entrada
   - Selecione a prioridade (Baixa/Média/Alta)
   - Clique em "➕ Adicionar" ou pressione Enter

### 2. **Filtrar Tarefas**
   - Clique nos botões de filtro:
     - **Todas**: Mostra todas as tarefas
     - **Ativas**: Apenas tarefas não completas
     - **Completas**: Apenas tarefas completadas
     - **🔴 Alta/🟡 Média/🟢 Baixa**: Por prioridade

### 3. **Ordenar Tarefas**
   - Use o seletor "Ordenar por":
     - Mais Recente
     - Mais Antigo
     - Prioridade
     - Nome (A-Z)

### 4. **Gerenciar Tarefas**
   - Marque como completa: Clique no checkbox
   - Deletar: Clique no botão 🗑️
   - Limpar completas: Botão "🗑️ Limpar Completas"

### 5. **Exportar**
   - Clique em "📥 Exportar" para baixar JSON com todas as tarefas
   - Arquivo: `tarefas-YYYY-MM-DD.json`

## 📁 Estrutura de Arquivos

```
todo-app/
├── index.html          ✅ Estrutura HTML
├── css/
│   └── styles.css      ✅ Estilos completos
├── js/
│   ├── storage.js      ✅ Gerenciador LocalStorage
│   └── app.js          ✅ Lógica principal
└── README.md           ✅ Documentação
```

## 💾 LocalStorage

### Como Funciona
- Todas as tarefas são automaticamente salvas no LocalStorage do navegador
- Dados persistem mesmo após fechar a aba/navegador
- Nenhum servidor necessário
- Dados armazenados localmente no seu computador

### Inspecionar Dados
```javascript
// Abra o console do navegador (F12) e digite:
localStorage.getItem('todoAppTasks')

// Para limpar tudo:
localStorage.clear()
```

## 🔍 Console

Abra o DevTools (F12) e veja logs de:
- ✅ Tarefas adicionadas
- ✏️ Tarefas alteradas
- 🗑️ Tarefas deletadas
- 📂 Tarefas carregadas
- 💾 Tarefas salvas

## 📱 Responsividade

Funciona perfeitamente em:
- 📱 Smartphones (320px+)
- 📱 Tablets (600px+)
- 💻 Desktops (1024px+)

## 🎨 Cores e Prioridades

| Prioridade | Cor | Emoji |
|-----------|-----|-------|
| Alta | 🔴 Vermelho | Red |
| Média | 🟡 Amarelo | Yellow |
| Baixa | 🟢 Verde | Green |

## ⚙️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Flexbox, Grid, Animações, Gradientes
- **JavaScript Vanilla** - Sem dependências
- **LocalStorage API** - Persistência de dados
- **Responsive Design** - Mobile-first

## 🚀 Próximas Features

- [ ] Busca/pesquisa de tarefas
- [ ] Editar tarefa existente
- [ ] Datas de vencimento
- [ ] Categorias/tags
- [ ] Notificações
- [ ] Modo escuro
- [ ] Sincronizar com nuvem
- [ ] Tarefas recorrentes

## 🐛 Troubleshooting

### As tarefas não estão sendo salvas?
1. Verifique se LocalStorage está habilitado
2. Abra DevTools (F12) → Console
3. Digite: `localStorage.getItem('todoAppTasks')`
4. Deve retornar um array JSON

### Como recuperar tarefas?
1. As tarefas são salvas automaticamente
2. Se perdeu, tente Ctrl+Z (undo do navegador)
3. Verificar no aba de privacidade

### Limpou tudo por acidente?
- Infelizmente, o histórico não é sincronizado
- Use backup regular exportando para JSON

## 📝 Exemplo de Uso

```javascript
// Abra o console (F12) e execute:

// Ver todas as tarefas
JSON.parse(localStorage.getItem('todoAppTasks'))

// Contar tarefas
JSON.parse(localStorage.getItem('todoAppTasks')).length

// Encontrar tarefas de alta prioridade
JSON.parse(localStorage.getItem('todoAppTasks')).filter(t => t.priority === 'alta')

// Remover tudo
localStorage.clear()
```

## 💡 Dicas

1. **Organize por prioridade** - Use Alta para urgentes, Média para importantes, Baixa para depois
2. **Revise regularmente** - Marque completas para não perder tempo
3. **Exporte periodicamente** - Crie backups em JSON
4. **Use filtros** - Foque no que você precisa fazer agora
5. **Ordene inteligentemente** - Veja por prioridade para tarefas importantes

## 📄 Licença

Este projeto é educacional e de código aberto.

---

**Desenvolvido com ❤️ para produtividade!**