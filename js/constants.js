// ============================================
// CONSTANTES E BANCO DE QUESTÕES
// ============================================

const TOTAL_PHASES = 30;
const QUESTIONS_PER_PHASE = 3;
const CONNECTION_PHASE = 20;
const REVIEW_PHASE = 30;

const COLORS = {
  pink: '#ffb6c1',
  darkPink: '#ff8fa3',
  green: '#a8e6cf',
  red: '#ffaaa5',
  blue: '#a2e1db'
};

// ============================================
// BANCO DE QUESTÕES (Direito Administrativo)
// ============================================

const QUESTOES = [
  {
    tipo: 'q',
    enunciado: "Sobre a Desconcentração, é correto afirmar que:",
    alternativas: [
      "Cria entidades externas",
      "Cria órgãos internos",
      "Não há hierarquia",
      "Extingue o Estado"
    ],
    correta: 1,
    explicacao: "Na Desconcentração, o Estado se divide internamente (Órgãos). Lembre-se: O de Órgão = Desconcentração.",
    dica: "Pense em 'dentro da mesma casa'."
  },
  {
    tipo: 'p',
    enunciado: "CASO 01: O motorista do Banco do Brasil bateu em um civil. O BB explora atividade econômica.",
    alternativas: [
      "Resp. Objetiva",
      "Resp. Subjetiva",
      "Não responde",
      "O Estado paga tudo"
    ],
    correta: 1,
    explicacao: "Empresas estatais que exploram atividade econômica respondem de forma Subjetiva (precisa provar culpa).",
    dica: "Atividade econômica = igual a empresa privada."
  },
  {
    tipo: 'q',
    enunciado: "A Descentralização difere da Desconcentração porque:",
    alternativas: [
      "Cria apenas órgãos",
      "Cria entidades com personalidade jurídica",
      "Não cria nada novo",
      "É menos eficaz"
    ],
    correta: 1,
    explicacao: "Descentralização cria entidades externas (PJ própria), enquanto desconcentração cria apenas órgãos.",
    dica: "D de Descentralização = Distante (com PJ)."
  },
  {
    tipo: 'p',
    enunciado: "CASO 02: Uma autarquia feriu um cidadão durante suas atividades. Qual responsabilidade?",
    alternativas: [
      "Não responde",
      "Responde subjetivamente (com culpa)",
      "Responde objetivamente",
      "O cidadão não pode processar"
    ],
    correta: 2,
    explicacao: "Entidades da Administração Indireta (autarquias) respondem OBJETIVAMENTE por danos.",
    dica: "Entidades externas = responsabilidade objetiva sempre."
  },
  {
    tipo: 'q',
    enunciado: "Qual órgão é considerado simples e não possui PJ?",
    alternativas: [
      "Autarquia",
      "Empresa Pública",
      "Órgão Público",
      "Fundação Pública"
    ],
    correta: 2,
    explicacao: "Órgãos Públicos são unidades desconcentradas, SEM personalidade jurídica própria.",
    dica: "Órgão = sem PJ, hierarquizado."
  },
  {
    tipo: 'p',
    enunciado: "CASO 03: A CEF (Empresa Pública que explora atividade bancária) cometeu fraude. Como responde?",
    alternativas: [
      "O Estado não responde",
      "Responde objetivamente sempre",
      "Responde subjetivamente (precisa de culpa)",
      "Só o funcionário responde"
    ],
    correta: 2,
    explicacao: "Empresas Públicas que exploram atividade econômica têm responsabilidade SUBJETIVA.",
    dica: "Atividade econômica = subjetiva (igual empresa privada)."
  },
  {
    tipo: 'q',
    enunciado: "Uma autarquia pode ser criada por:",
    alternativas: [
      "Decreto do Presidente",
      "Lei Específica",
      "Resolução do Senado",
      "Portaria do Ministério"
    ],
    correta: 1,
    explicacao: "Autarquias obrigatoriamente são criadas por LEI específica (reserva legal).",
    dica: "Autarquia = Lei específica (criação)."
  },
  {
    tipo: 'p',
    enunciado: "CASO 04: Um servidor de órgão público causou dano a terceiro no exercício do cargo.",
    alternativas: [
      "Só o servidor paga",
      "O Estado responde objetivamente",
      "Não há responsabilidade",
      "Varia conforme o dano"
    ],
    correta: 1,
    explicacao: "O Estado responde OBJETIVAMENTE pelos danos causados por seus agentes. Depois cobra do servidor (regresso).",
    dica: "Estado responde sempre = responsabilidade objetiva."
  },
  {
    tipo: 'q',
    enunciado: "Qual característica diferencia uma Fundação Pública de uma Autarquia?",
    alternativas: [
      "A autarquia tem mais poder",
      "A fundação é criada por lei e tem patrimônio próprio para fins específicos",
      "Ambas são idênticas",
      "A fundação é mais simples"
    ],
    correta: 1,
    explicacao: "Fundações Públicas têm patrimônio afetado a fins públicos específicos, enquanto autarquias são serviços descentralizados.",
    dica: "Fundação = patrimônio + finalidade específica."
  },
  {
    tipo: 'p',
    enunciado: "CASO 05: INSS (autarquia) negou benefício irregularmente. O cidadão pode processar?",
    alternativas: [
      "Não, autarquias têm imunidade",
      "Sim, responde objetivamente",
      "Apenas em tribunal administrativo",
      "Depende do tipo de benefício"
    ],
    correta: 1,
    explicacao: "Sim! Autarquias respondem OBJETIVAMENTE. O cidadão pode processar judicialmente.",
    dica: "Entidade descentralizada = responsabilidade objetiva."
  }
];

// ============================================
// FLASHCARDS
// ============================================

const FLASHCARDS = [
  {
    pergunta: "O que é Desconcentração?",
    resposta: "Distribuição de competências dentro da mesma pessoa jurídica. Cria ÓRGÃOS sem PJ."
  },
  {
    pergunta: "O que é Descentralização?",
    resposta: "Transferência de funções para entidades externas com PJ própria (Autarquias, Fundações, Empresas Públicas)."
  },
  {
    pergunta: "Qual a responsabilidade civil das Autarquias?",
    resposta: "OBJETIVA - Respondem automaticamente por danos, sem necessidade de provar culpa."
  },
  {
    pergunta: "E as Empresas Públicas em atividade econômica?",
    resposta: "SUBJETIVA - Só respondem se comprovada a culpa, como empresas privadas normais."
  },
  {
    pergunta: "Como o Estado responde por seus servidores?",
    resposta: "OBJETIVAMENTE - O Estado indeniza a vítima. Depois cobra do servidor (ação regressiva)."
  },
  {
    pergunta: "Qual requisito para criar uma Autarquia?",
    resposta: "LEI ESPECÍFICA - Não pode ser criada por decreto ou portaria."
  }
];
