// Seeds — dados reais extraídos do edital SECTI/FAPEMA Trilhas Inova 3

const TRILHAS = [
  {
    slug: 'frontend',
    nome: 'Programação Front-end',
    vagas_totais: 210,
    carga_horaria_horas: 300,
    modulos: [
      'Algoritmo e Lógica de Programação',
      'HTML',
      'CSS',
      'Git',
      'GitHub',
      'JavaScript',
      'React',
      'TypeScript',
      'Node.js',
    ],
    desafios: [
      {
        apos_modulo: 3, // após CSS
        titulo: 'Página Estática no GitHub Pages',
        descricao:
          'Construa e publique no GitHub Pages uma página estática sobre você, utilizando HTML e CSS semântico. A página deve ter pelo menos: seção de apresentação, seção de habilidades e um formulário de contato (não precisa funcionar). Entregue o link do repositório e da página publicada.',
        semana_alvo: 3,
      },
      {
        apos_modulo: 6, // após JavaScript
        titulo: 'Mini-Projeto JavaScript Interativo',
        descricao:
          'Crie um mini-projeto JavaScript interativo (calculadora, quiz ou to-do list) e versione no GitHub com histórico de commits organizado. O projeto deve usar apenas HTML, CSS e JavaScript puro (sem frameworks). Entregue o link do repositório e, se possível, uma demo no GitHub Pages.',
        semana_alvo: 6,
      },
      {
        apos_modulo: 9, // após Node.js
        titulo: 'Landing Page React + TypeScript com API',
        descricao:
          'Desenvolva uma landing page em React com TypeScript que consuma uma API pública (ex.: OpenWeather, PokeAPI, GitHub API). A aplicação deve ter roteamento com React Router, ao menos 2 páginas e tipagem TypeScript adequada. Faça deploy na Vercel ou Netlify e entregue o link da aplicação e do repositório.',
        semana_alvo: 10,
      },
    ],
  },
  {
    slug: 'backend',
    nome: 'Programação Back-end',
    vagas_totais: 210,
    carga_horaria_horas: 300,
    modulos: [
      'Algoritmos e Lógica de Programação',
      'Python',
      'Node.js',
      'Git',
      'GitHub',
      'HTTP',
      'Cloud',
      'SQL',
      'Conexões',
      'API',
      'Docker',
      'REST',
    ],
    desafios: [
      {
        apos_modulo: 3, // após Node.js
        titulo: 'Script de Processamento de Dados',
        descricao:
          'Crie um script em Python ou Node.js que leia um arquivo CSV com dados públicos (ex.: dados do IBGE ou do portal dados.gov.br) e gere um relatório em arquivo de texto com estatísticas básicas: total de registros, média de uma coluna numérica, e os 5 maiores valores. Versione no GitHub.',
        semana_alvo: 3,
      },
      {
        apos_modulo: 6, // após HTTP
        titulo: 'Projeto Versionado com Git e GitHub',
        descricao:
          'Versione no GitHub um projeto back-end com histórico de commits organizado seguindo Conventional Commits, uso de branches de feature (feature/nome-da-funcionalidade), e ao menos um Pull Request mergeado. Inclua um README.md explicando como rodar o projeto.',
        semana_alvo: 6,
      },
      {
        apos_modulo: 10, // após API
        titulo: 'API REST com Banco de Dados SQL',
        descricao:
          'Crie uma API REST com Node.js conectada a um banco de dados SQL (SQLite ou PostgreSQL) com pelo menos 3 rotas CRUD completas (Create, Read, Update, Delete). Documente as rotas usando comentários ou um arquivo README. Inclua validação de entrada e tratamento de erros.',
        semana_alvo: 9,
      },
      {
        apos_modulo: 12, // após REST
        titulo: 'API Containerizada com Docker e Deploy',
        descricao:
          'Containerize sua API REST com Docker (Dockerfile + docker-compose.yml) e faça deploy em uma plataforma cloud gratuita (Railway, Fly.io ou Render). A API deve estar acessível publicamente. Entregue o link da API em produção, o link do repositório e o Dockerfile.',
        semana_alvo: 12,
      },
    ],
  },
  {
    slug: 'dados',
    nome: 'Ciência de Dados',
    vagas_totais: 210,
    carga_horaria_horas: 300,
    modulos: [
      'Algoritmo e Lógica de Programação',
      'Looker Studio',
      'Tableau',
      'Python para Ciência de Dados',
      'Introdução e Tratamento de Dados',
      'Gráficos e Visualização de Dados',
      'Estatística',
      'Power BI',
    ],
    desafios: [
      {
        apos_modulo: 3, // após Tableau
        titulo: 'Dashboard no Looker Studio',
        descricao:
          'Conecte um dataset público (ex.: INEP, IBGE, Kaggle) ao Looker Studio e crie um dashboard interativo com ao menos 3 tipos diferentes de visualização (gráfico de barras, linha e tabela). O dashboard deve ter um filtro de data ou categoria. Entregue o link público do dashboard.',
        semana_alvo: 3,
      },
      {
        apos_modulo: 6, // após Visualização
        titulo: 'Análise Exploratória com Python',
        descricao:
          'Com Python (Pandas + Matplotlib ou Seaborn), realize a limpeza e análise exploratória de um dataset real do portal dados.gov.br ou IBGE. Entregue um Jupyter Notebook com: (1) descrição dos dados, (2) tratamento de valores nulos, (3) ao menos 4 visualizações comentadas e (4) 3 insights principais.',
        semana_alvo: 7,
      },
      {
        apos_modulo: 8, // após Power BI
        titulo: 'Relatório no Power BI com DAX',
        descricao:
          'Crie um relatório no Power BI com dados reais, incluindo ao menos 2 medidas DAX calculadas (ex.: média, variação percentual), segmentadores interativos e ao menos 4 páginas de visualização. Exporte o relatório como .pbix e documente as métricas criadas em um README.',
        semana_alvo: 11,
      },
    ],
  },
  {
    slug: 'ux',
    nome: 'Design e Experiência (UX/UI)',
    vagas_totais: 180,
    carga_horaria_horas: 300,
    modulos: [
      'Estratégia de UX/UI',
      'Metodologia e Imersão em Pesquisa',
      'Mapeamento da Experiência do Usuário',
      'Prototipação de baixa fidelidade (Figma)',
      'Prototipação de alta fidelidade (Figma)',
      'Testes de Usabilidade',
      'Relacionamento com a equipe',
    ],
    desafios: [
      {
        apos_modulo: 3, // após Mapeamento
        titulo: 'Pesquisa de Usuários e Mapa de Jornada',
        descricao:
          'Realize ao menos 3 entrevistas com usuários reais sobre um problema cotidiano (ex.: uso de transporte público, acesso a serviços de saúde). Com base nas entrevistas, entregue: (1) roteiro de pesquisa, (2) síntese de insights, (3) mapa de jornada do usuário documentado no Figma.',
        semana_alvo: 4,
      },
      {
        apos_modulo: 6, // após Testes de Usabilidade
        titulo: 'Protótipo de Alta Fidelidade no Figma',
        descricao:
          'Entregue um protótipo de alta fidelidade de um aplicativo mobile no Figma com fluxo completo de pelo menos 5 telas conectadas, um design system básico (cores, tipografia, componentes reutilizáveis) e um relatório de ao menos 2 testes de usabilidade realizados com usuários reais.',
        semana_alvo: 9,
      },
    ],
  },
  {
    slug: 'mobile',
    nome: 'Desenvolvimento Mobile',
    vagas_totais: 120,
    carga_horaria_horas: 300,
    modulos: [
      'HTML e CSS',
      'JavaScript',
      'Git e GitHub',
      'Dart',
      'Flutter',
      'JSON',
      'HTTP (POST e GET)',
      'ChatBot',
    ],
    desafios: [
      {
        apos_modulo: 3, // após Git e GitHub
        titulo: 'Página Web Responsiva Versionada',
        descricao:
          'Crie uma página web responsiva com HTML, CSS e JavaScript que funcione bem em mobile e desktop. A página pode ser um portfólio simples ou uma landing page. Versione no GitHub com ao menos 5 commits descritivos e publique no GitHub Pages. Entregue os links do repositório e da página.',
        semana_alvo: 3,
      },
      {
        apos_modulo: 5, // após Flutter
        titulo: 'Aplicativo Flutter com Navegação',
        descricao:
          'Desenvolva um aplicativo Flutter com ao menos 3 telas navegáveis usando Navigator ou GoRouter. O app deve ter gerenciamento de estado (setState ou Provider) e ao menos um formulário com validação. Entregue o código no GitHub com instruções de como rodar e capturas de tela das telas.',
        semana_alvo: 7,
      },
      {
        apos_modulo: 8, // após ChatBot
        titulo: 'App Flutter com ChatBot Integrado',
        descricao:
          'Integre uma API de ChatBot (Dialogflow, OpenAI API ou similar) em um aplicativo Flutter com uma tela de conversa funcional. O bot deve responder a ao menos 5 intenções diferentes. Entregue o código no GitHub, um vídeo curto demonstrando o funcionamento e instruções de configuração.',
        semana_alvo: 11,
      },
    ],
  },
  {
    slug: 'social-media',
    nome: 'Social Media Marketing',
    vagas_totais: 120,
    carga_horaria_horas: 300,
    modulos: [
      'Social Media',
      'Copywriting',
      'Mídias Sociais',
      'Canva',
      'IA aplicada a marketing',
      'Marketing Viral',
      'Social Listening',
      'Neuromarketing',
      'Marketing de Comunidades',
      'Branding',
      'Agente GPT',
    ],
    desafios: [
      {
        apos_modulo: 4, // após Canva
        titulo: 'Calendário Editorial com Design no Canva',
        descricao:
          'Crie um calendário editorial de 2 semanas para uma marca fictícia de sua escolha com 10 posts roteirizados (copy + objetivo + formato). Produza ao menos 5 artes no Canva alinhadas à identidade visual da marca. Entregue o calendário em PDF e os arquivos do Canva (link compartilhável).',
        semana_alvo: 4,
      },
      {
        apos_modulo: 7, // após Social Listening
        titulo: 'Campanha de Marketing Viral',
        descricao:
          'Produza uma campanha de marketing viral para uma causa social local ou projeto comunitário. Entregue: (1) briefing da campanha com objetivo e público-alvo, (2) 3 copies para formatos diferentes (feed, stories, reels), (3) artes no Canva e (4) análise de ao menos 2 concorrentes usando Social Listening.',
        semana_alvo: 8,
      },
      {
        apos_modulo: 11, // após Agente GPT
        titulo: 'Estratégia de Marketing de Comunidade com IA',
        descricao:
          'Elabore uma estratégia completa de marketing de comunidade para uma marca real ou fictícia, incluindo: (1) plano de engajamento de 30 dias, (2) uso de pelo menos 1 ferramenta de IA para criação de conteúdo (documentado), (3) análise de métricas projetadas e (4) um Agente GPT customizado que responda dúvidas sobre a marca.',
        semana_alvo: 11,
      },
    ],
  },
  {
    slug: 'jogos',
    nome: 'Programação de Jogos',
    vagas_totais: 90,
    carga_horaria_horas: 300,
    modulos: [
      'C#',
      'Design de Jogos',
      'Unity',
    ],
    desafios: [
      {
        apos_modulo: 3, // após Unity
        titulo: 'Jogo 2D Funcional em Unity',
        descricao:
          'Desenvolva um jogo 2D funcional em Unity com pelo menos: um personagem controlável pelo jogador, sistema de coleta de itens ou inimigos, tela de menu principal, sistema de pontuação e tela de game over. Exporte o jogo para WebGL e publique no itch.io. Entregue o link do jogo e do repositório.',
        semana_alvo: 10,
      },
    ],
  },
  {
    slug: 'automacoes-ia',
    nome: 'Automações com IA',
    vagas_totais: 60,
    carga_horaria_horas: 300,
    modulos: [
      'VSM',
      'RPA',
      'Zapier',
      'Make',
      'Power Automate',
      'Power Apps',
      'IA Generativa',
      'Engenharia de Prompt',
      'ChatGPT',
      'Copilot',
      'LangChain',
    ],
    desafios: [
      {
        apos_modulo: 3, // após Zapier
        titulo: 'Fluxo Automatizado no Zapier',
        descricao:
          'Crie um fluxo automatizado no Zapier que conecte ao menos 3 aplicativos diferentes (ex.: Google Forms → Google Sheets → Slack/Email) e execute uma ação automática a cada novo evento. Documente o fluxo com capturas de tela de cada etapa e descreva o problema que a automação resolve.',
        semana_alvo: 3,
      },
      {
        apos_modulo: 6, // após Power Apps
        titulo: 'App no Power Apps com Power Automate',
        descricao:
          'Construa um aplicativo no Power Apps com um formulário de entrada de dados (ao menos 5 campos) integrado ao Power Automate para: (1) salvar os dados em uma lista do SharePoint ou Excel Online e (2) enviar um e-mail de confirmação automático. Entregue um vídeo demonstrativo e o link do app.',
        semana_alvo: 7,
      },
      {
        apos_modulo: 9, // após ChatGPT
        titulo: 'Documentação de Casos de Uso com Engenharia de Prompt',
        descricao:
          'Documente e entregue 5 casos de uso reais de Engenharia de Prompt aplicados à sua área de trabalho ou estudo. Para cada caso, inclua: (1) problema original, (2) prompt antes da otimização, (3) prompt otimizado com técnicas estudadas (Chain of Thought, Few-Shot, Role Prompting, etc.) e (4) comparação dos resultados.',
        semana_alvo: 9,
      },
      {
        apos_modulo: 11, // após LangChain
        titulo: 'Agente LangChain com RAG',
        descricao:
          'Implemente um agente LangChain em Python que responda perguntas sobre um documento PDF usando RAG (Retrieval-Augmented Generation). O agente deve: carregar o PDF, indexar o conteúdo em um vector store (ex.: ChromaDB ou FAISS), e responder perguntas com base no conteúdo. Entregue o código no GitHub com README de configuração.',
        semana_alvo: 12,
      },
    ],
  },
  {
    slug: 'empreendedorismo',
    nome: 'Empreendedorismo e Inovação',
    vagas_totais: 1200,
    carga_horaria_horas: 100,
    modulos: [
      'Inteligência Emocional',
      'Relacionamento Interpessoal',
      'Comunicação',
      'Mentalidade de Crescimento',
      'Trabalho em Equipe',
      'Networking',
      'Criatividade',
      'Empreendedorismo',
    ],
    desafios: [
      {
        apos_modulo: 3, // após Comunicação
        titulo: 'Pitch de Inovação Social',
        descricao:
          'Grave um pitch de 2 minutos (vídeo ou áudio) apresentando um problema real da sua comunidade e uma solução inovadora. O pitch deve ter: identificação do problema com dados ou exemplos concretos, descrição da solução, a quem beneficia e como você pretende colocar em prática. Entregue o vídeo/áudio e o roteiro escrito.',
        semana_alvo: 3,
      },
      {
        apos_modulo: 6, // após Networking
        titulo: 'Plano de Networking Pessoal',
        descricao:
          'Elabore um plano de networking pessoal identificando 5 conexões estratégicas no LinkedIn relacionadas à sua trilha (perfis reais de profissionais da área). Para cada conexão, escreva: (1) por que ela é relevante, (2) um roteiro de mensagem de abordagem personalizada e (3) como pretende manter o relacionamento ao longo do tempo.',
        semana_alvo: 7,
      },
    ],
  },
];

const DOCUMENTOS_REQUERIDOS = [
  {
    codigo: 'comprovante-ensino-medio',
    titulo: 'Comprovante de Ensino Médio',
    descricao:
      'Comprovante de conclusão ou vínculo ativo com ensino médio em escola pública, ou comprovante de bolsa integral em escola particular.',
    condicional: false,
    ordem: 1,
  },
  {
    codigo: 'rg-cpf',
    titulo: 'RG e CPF',
    descricao:
      'Documento de identidade (RG) e Cadastro de Pessoa Física (CPF). Podem estar no mesmo documento (ex.: CNH ou RG com CPF impresso).',
    condicional: false,
    ordem: 2,
  },
  {
    codigo: 'comprovante-residencia',
    titulo: 'Comprovante de Residência no Maranhão',
    descricao:
      'Comprovante de residência no estado do Maranhão datado no mês da inscrição (conta de água, luz, internet ou declaração de residência).',
    condicional: false,
    ordem: 3,
  },
  {
    codigo: 'perfil-patronage',
    titulo: 'Comprovante de Perfil Ativo no Patronage',
    descricao:
      'Comprovante de cadastro e perfil ativo no sistema Patronage (plataforma de gestão do programa). Faça login em patronage.ma.gov.br e tire um print ou exporte o comprovante.',
    condicional: false,
    ordem: 4,
  },
  {
    codigo: 'declaracao-inscricao',
    titulo: 'Declaração de Inscrição',
    descricao:
      'Declaração confirmando: disponibilidade de tempo (ao menos 8h semanais), posse de equipamento adequado (computador ou smartphone com acesso à internet), e ausência de vínculo empregatício formal durante o programa.',
    condicional: false,
    ordem: 5,
  },
  {
    codigo: 'diploma-curso-superior',
    titulo: 'Declaração / Diploma de Curso Superior',
    descricao:
      'Apenas para candidatos em transição de carreira que possuem curso superior concluído ou em andamento em área diferente das trilhas do programa. Apresente diploma, declaração de matrícula ou histórico escolar.',
    condicional: true,
    ordem: 6,
  },
  {
    codigo: 'comprovante-conta-corrente',
    titulo: 'Comprovante de Conta Corrente Ativa',
    descricao:
      'Comprovante de conta corrente ativa em banco tradicional ou banco digital (exceto Mercado Pago). Pode ser extrato, print do app ou declaração do banco. A conta deve estar no nome do candidato.',
    condicional: false,
    ordem: 7,
  },
];

module.exports = { TRILHAS, DOCUMENTOS_REQUERIDOS };
