/**
 * PODIUM — DATA.JS
 * Dados mock partilhados entre index.html e noticia.html.
 * Quando o Supabase está configurado, estes dados ficam ignorados
 * (o adapter Supabase fornece os dados reais).
 */

window.PODIUM_CATEGORIES = {
  futebol:     { name: 'Futebol',    emoji: '⚽', tagClass: 'tag--football'   },
  basketball:  { name: 'Basketball', emoji: '🏀', tagClass: 'tag--basketball' },
  tennis:      { name: 'Ténis',      emoji: '🎾', tagClass: 'tag--tennis'     },
  atletismo:   { name: 'Atletismo',  emoji: '🏃', tagClass: 'tag--football'   },
  motorsport:  { name: 'Motorsport', emoji: '🏎️', tagClass: 'tag--tennis'     },
  volei:       { name: 'Voleibol',   emoji: '🏐', tagClass: 'tag--basketball' }
};

window.PODIUM_NEWS_DATA = [
  {
    id: 1, slug: 'classico-decisivo-vitoria-emocionante', imagens_galeria: ['images/jovens-promessas.svg', 'images/lenda-basquetebol.svg'], imagem: 'images/classico-decisivo.svg', categoria: 'basketball', destaque: true,
    titulo: 'Clássico decisivo termina em vitória emocionante',
    resumo: 'O confronto entre rivais foi marcado por grande intensidade do início ao fim, com uma das equipas a destacar-se e garantir uma vitória merecida.',
    conteudo: [
      'O pavilhão de Maxaquene recebeu na noite de ontem um dos clássicos mais aguardados da temporada. A intensidade esteve presente desde o apito inicial, com ambas as equipas a mostrarem um nível técnico elevado.',
      'A primeira parte terminou com uma diferença mínima no marcador, sinal do equilíbrio que se verificou em campo. No segundo tempo, uma série de triplos consecutivos quebrou o empate e inclinou definitivamente a balança.',
      'Com esta vitória, a equipa consolida a liderança do campeonato e mantém vivas as aspirações de conquistar o título nacional pela terceira temporada consecutiva.'
    ],
    data: '2026-03-25', autor: 'Ana Cossa',
  },
  {
    id: 2, slug: 'jovem-talentosa-liga-nacional', imagens_galeria: ['images/treinador-renova.svg', 'images/novo-formato-liga.svg'], imagem: 'images/jovem-talentosa.svg', categoria: 'futebol', destaque: true,
    titulo: 'Jovem talentosa destaca-se na liga nacional',
    resumo: 'Um novo nome começa a ganhar destaque após uma atuação impressionante. A atleta tem sido peça-chave e promete ser uma das revelações da temporada.',
    conteudo: [
      'Aos apenas 19 anos, a jogadora tem impressionado críticos e adeptos com exibições consistentes. O seu estilo técnico, combinado com uma maturidade rara, coloca-a no radar dos principais clubes do país.',
      'Na última jornada, foi decisiva ao assistir para dois golos e marcar o terceiro, liderando a equipa a uma vitória fora de casa.'
    ],
    data: '2026-03-24', autor: 'Pedro Antunes',
  },
  {
    id: 3, slug: 'preparacao-torneio-internacional', imagens_galeria: [], imagem: 'images/preparacao-torneio.svg', categoria: 'tennis', destaque: true,
    titulo: 'Preparação intensa para o próximo torneio internacional',
    resumo: 'As equipas já estão focadas nos treinos e estratégias para representar o país no cenário internacional, com grandes expectativas dos adeptos.',
    conteudo: [
      'O Open de Moçambique aproxima-se e os nossos representantes intensificam a preparação. Treinos duplos, análise de adversários e trabalho mental são a rotina diária nas últimas semanas.',
      'A comissão técnica mostra-se confiante nas escolhas feitas e acredita numa participação de destaque, depois dos bons resultados da época passada.'
    ],
    data: '2026-03-20', autor: 'Xavier Macuacua',
  },
  {
    id: 4, slug: 'recorde-nacional-800-metros', imagens_galeria: [], imagem: 'images/recorde-800-metros.svg', categoria: 'atletismo', destaque: false,
    titulo: 'Novo recorde nacional nos 800 metros',
    resumo: 'O atleta moçambicano superou a marca que resistia há mais de uma década, num desempenho que surpreendeu o próprio corpo técnico.',
    conteudo: [
      'Num encontro internacional em Pretória, o jovem atleta bateu o recorde nacional dos 800 metros com uma prova tacticamente perfeita. O tempo final coloca-o entre os 20 melhores do ranking africano da distância.',
      'O feito é ainda mais relevante por representar uma melhoria significativa face à sua melhor marca pessoal desta temporada.'
    ],
    data: '2026-03-18', autor: 'Carlos Matsinhe',
  },
  {
    id: 5, slug: 'federacao-novo-formato-liga', imagens_galeria: [], imagem: 'images/novo-formato-liga.svg', categoria: 'futebol', destaque: false,
    titulo: 'Federação anuncia novo formato da liga',
    resumo: 'As alterações visam tornar o campeonato mais competitivo e atractivo, com a introdução de play-offs finais para definir o campeão.',
    conteudo: [
      'A Federação Moçambicana de Futebol anunciou esta semana um conjunto de mudanças estruturais no formato da liga. A partir da próxima temporada, os quatro primeiros classificados disputarão play-offs eliminatórios.',
      'A medida foi bem recebida pela maioria dos clubes, que vêem nela uma oportunidade de aumentar o interesse dos adeptos e o valor comercial da competição.'
    ],
    data: '2026-03-15', autor: 'Ana Cossa',
  },
  {
    id: 6, slug: 'equipa-gt3-prova-continental', imagens_galeria: [], imagem: 'images/equipa-gt3.svg', categoria: 'motorsport', destaque: false,
    titulo: 'Equipa nacional estreia-se em prova continental',
    resumo: 'Uma equipa de GT3 moçambicana participa pela primeira vez num campeonato pan-africano, abrindo caminho para o automobilismo nacional.',
    conteudo: [
      'A primeira participação de uma equipa moçambicana numa prova de GT3 a nível continental representa um marco histórico. Os pilotos, apesar de estreantes, mostraram ritmo competitivo.',
      'O objectivo principal desta temporada é acumular experiência e preparar uma participação mais sólida no próximo ano.'
    ],
    data: '2026-03-12', autor: 'Pedro Antunes',
  },
  {
    id: 7, slug: 'jovens-promessas-torneio-juvenil', imagens_galeria: [], imagem: 'images/jovens-promessas.svg', categoria: 'basketball', destaque: false,
    titulo: 'Jovens promessas brilham no torneio juvenil',
    resumo: 'O campeonato juvenil revelou talentos impressionantes, com vários jogadores a chamarem a atenção dos olheiros nacionais.',
    conteudo: [
      'O torneio juvenil terminou com grande entusiasmo nas bancadas. Vários jovens de diferentes províncias mostraram que o futuro do basketball nacional está em boas mãos.',
      'Os três melhores marcadores da competição receberam convites para estágios com a selecção sub-18.'
    ],
    data: '2026-03-10', autor: 'Xavier Macuacua',
  },
  {
    id: 8, slug: 'seleccao-feminina-qualificacao-africana', imagens_galeria: [], imagem: 'images/seleccao-feminina.svg', categoria: 'volei', destaque: false,
    titulo: 'Selecção feminina prepara qualificação africana',
    resumo: 'As jogadoras iniciaram uma concentração de três semanas com vista à próxima fase de qualificação para o campeonato continental.',
    conteudo: [
      'A preparação inclui trabalho físico específico, treinos técnico-tácticos e jogos de preparação contra equipas regionais. O corpo técnico destaca a dedicação e o espírito do grupo.',
      'A qualificação realiza-se em Maio e reunirá seis selecções que disputam duas vagas para o Afrobasket.'
    ],
    data: '2026-03-08', autor: 'Carlos Matsinhe',
  },
  {
    id: 9, slug: 'academia-tenis-matola', imagens_galeria: [], imagem: 'images/academia-tenis.svg', categoria: 'tennis', destaque: false,
    titulo: 'Academia de ténis abre em Matola',
    resumo: 'Um novo espaço dedicado à formação de jovens tenistas abriu portas na Matola, com cursos para todas as idades e níveis.',
    conteudo: [
      'A nova academia conta com quatro campos, ginásio e áreas pedagógicas. Os fundadores pretendem descobrir e formar talentos desde a base.',
      'Já estão abertas as inscrições para o primeiro ciclo de formação, com turmas para crianças a partir dos 6 anos.'
    ],
    data: '2026-03-05', autor: 'Ana Cossa',
  },
  {
    id: 10, slug: 'treinador-renova-contrato', imagens_galeria: [], imagem: 'images/treinador-renova.svg', categoria: 'futebol', destaque: false,
    titulo: 'Treinador nacional renova contrato',
    resumo: 'Após resultados positivos, o seleccionador continuará à frente da equipa principal por mais dois anos.',
    conteudo: [
      'A renovação surge depois de uma campanha consistente nas últimas qualificações, com a selecção a subir no ranking continental.',
      'O treinador destacou, em conferência de imprensa, a importância da estabilidade e do plano a longo prazo para o desenvolvimento do futebol moçambicano.'
    ],
    data: '2026-03-03', autor: 'Pedro Antunes',
  },
  {
    id: 11, slug: 'maratona-maputo-recorde-inscricoes', imagens_galeria: ['images/recorde-800-metros.svg'], imagem: 'images/maratona-maputo.svg', categoria: 'atletismo', destaque: false,
    titulo: 'Maratona de Maputo regista recorde de inscrições',
    resumo: 'A edição deste ano bateu todos os recordes, com participantes de mais de 15 países inscritos na prova.',
    conteudo: [
      'A organização confirmou mais de 5 000 inscrições para as diferentes distâncias (meia-maratona e maratona completa), um crescimento de 40% face ao ano anterior.',
      'O percurso passa pelos principais pontos turísticos da cidade e termina na marginal.'
    ],
    data: '2026-02-28', autor: 'Carlos Matsinhe',
  },
  {
    id: 12, slug: 'lenda-basquetebol-regresso', imagens_galeria: [], imagem: 'images/lenda-basquetebol.svg', categoria: 'basketball', destaque: false,
    titulo: 'Clube negoceia regresso de lenda do basquetebol',
    resumo: 'Um dos jogadores mais emblemáticos da última década pode regressar ao clube que o formou.',
    conteudo: [
      'As negociações encontram-se em fase avançada e as duas partes mostram-se optimistas em fechar o acordo nos próximos dias.',
      'A adeptos reagiram com grande entusiasmo à notícia nas redes sociais.'
    ],
    data: '2026-02-25', autor: 'Xavier Macuacua',
  }
];
