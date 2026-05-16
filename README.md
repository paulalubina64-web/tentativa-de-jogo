# 🎮 Fru-fru Jus - Jogo de Direito Administrativo

## 📝 Sobre o Projeto

**Fru-fru Jus** é um jogo educativo interativo para ensinar **Direito Administrativo** de forma divertida e didática. Com 30 fases progressivas, o jogo combina:

- ✅ **Quizzes** com feedback explicativo
- 📋 **Casos práticos** para aplicação de conceitos
- 🔗 **Exercícios de conexão** entre conceitos
- 📚 **Flashcards** para revisão rápida
- 💾 **Progresso persistente** com LocalStorage

## 🎯 Conceitos Abordados

### Módulo 1: Organização Administrativa
- Desconcentração vs Descentralização
- Órgãos Públicos
- Autarquias
- Empresas Públicas
- Fundações Públicas

### Módulo 2: Responsabilidade Civil do Estado
- Responsabilidade Objetiva
- Responsabilidade Subjetiva
- Casos práticos de responsabilidade
- Ação regressiva

## 🚀 Como Usar

### Localmente
1. Clone o repositório
2. Abra `index.html` em um navegador
3. Comece a jogar!

### Estrutura de Arquivos
```
├── index.html           # Estrutura HTML principal
├── css/
│   └── styles.css       # Estilos centralizados
├── js/
│   ├── constants.js     # Questões e flashcards
│   ├── gameState.js     # Gerenciador de estado
│   ├── questionRenderer.js # Renderização de UI
│   ├── gameController.js   # Lógica principal
│   └── app.js           # Inicialização
└── README.md            # Esta arquivo
```

## 🎮 Como Jogar

### 1. **Selecione uma Fase**
   - Clique no número da fase para começar
   - Fases anteriores estarão desbloqueadas

### 2. **Responda as Questões**
   - Leia o enunciado com atenção
   - Selecione a alternativa correta
   - Receba feedback imediato

### 3. **Use as Dicas**
   - Clique em "DICA" para ajuda
   - Clique em "NÃO SEI" se desistir

### 4. **Revisão de Erros**
   - Ao final, veja todos os conceitos que precisa reforçar
   - Desça para ler as explicações completas

### 5. **Flashcards**
   - Acesse do menu inicial
   - Estude os 6 conceitos principais

## 📊 Progresso Salvo

Seu progresso é **automaticamente salvo** em LocalStorage:
- ✅ Qual fase você chegou
- ✅ Total de fases completadas
- ✅ Timestamp do último jogo

Para resetar: `localStorage.removeItem('gameState')`

## 🛠️ Melhorias Implementadas

### ✨ Qualidade de Código
- ✅ Separação em módulos JavaScript
- ✅ Padrão Orientado a Objetos
- ✅ CSS centralizado e bem organizado
- ✅ Variáveis CSS reutilizáveis
- ✅ Sem repetição de código

### 🎨 Interface
- ✅ Animações suaves
- ✅ Feedback visual melhorado
- ✅ Responsivo em mobile
- ✅ Acessibilidade melhorada
- ✅ Hover effects nos botões

### 🧠 Funcionalidades
- ✅ 10 questões base (rotacionam nas 30 fases)
- ✅ 6 flashcards educativos
- ✅ Sistema de dicas
- ✅ Rastreamento de erros
- ✅ Desbloqueio progressivo de fases

## 📱 Responsividade

O jogo funciona perfeitamente em:
- 📱 Smartphones (320px+)
- 💻 Tablets (600px+)
- 🖥️ Desktops (1024px+)

## 🔮 Próximas Features

- [ ] Sistema de pontuação/ranking
- [ ] Badges de conquistas
- [ ] Modo multiplayer
- [ ] Exportar relatório de desempenho
- [ ] Modo offline (PWA)
- [ ] Mais de 30 fases
- [ ] Integração com API de questões

## 📚 Tecnologias

- **HTML5** - Estrutura
- **CSS3** - Estilos (Flexbox, Grid, Animações)
- **JavaScript (Vanilla)** - Lógica
- **LocalStorage API** - Persistência
- **Google Fonts** - Tipografia

## 👩🏽‍🦱 Sobre a Fru-fru

Fru-fru Jus é uma personagem educativa que guia o jogador através de 30 fases de aprendizado em Direito Administrativo. Ela oferece:
- Explicações claras de conceitos
- Dicas para responder questões
- Feedback gentil e encorajador
- Resumo das lições aprendidas

## 📝 Licença

Este projeto é educacional e de código aberto.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se livre para:
- Adicionar novas questões
- Melhorar as explicações
- Reportar bugs
- Sugerir novas features

---

**Desenvolvido com ❤️ para aprender Direito Administrativo de forma divertida!**
