
import { SkillField } from './types';

export const getBnccGroup = (stage: string): string => {
  const lower = stage?.toLowerCase() || '';
  // EI01: Bebês (zero a 1 ano e 6 meses)
  if (lower.includes('berçário') || lower.includes('bercario') || lower.includes('bebe') || lower.includes('bebê')) return 'EI01';
  
  // EI03: Crianças pequenas (4 anos a 5 anos e 11 meses)
  if (lower.includes('pré') || lower.includes('pre') || lower.includes('4 anos') || lower.includes('5 anos')) return 'EI03';
  
  // EI02: Crianças bem pequenas (1 ano e 7 meses a 3 anos e 11 meses)
  // Default fallback for Creche I, Creche II, Maternal, etc.
  return 'EI02';
};

export const SKILL_FIELDS: SkillField[] = [
  {
    id: 'EO',
    name: 'O EU, O OUTRO E O NÓS',
    color: '#3b82f6', // blue
    skills: [
      // BEBÊS (EI01)
      { code: 'EI01EO01', description: 'Perceber que suas ações têm efeitos nas outras crianças e nos adultos.' },
      { code: 'EI01EO02', description: 'Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interações das quais participa.' },
      { code: 'EI01EO03', description: 'Interagir com crianças da mesma faixa etária e adultos ao explorar espaços, materiais, objetos, brinquedos.' },
      { code: 'EI01EO04', description: 'Comunicar necessidades, desejos e emoções, utilizando gestos, balbucios, palavras.' },
      { code: 'EI01EO05', description: 'Reconhecer seu corpo e expressar suas sensações em momentos de alimentação, higiene, brincadeira e descanso.' },
      { code: 'EI01EO06', description: 'Interagir com outras crianças da mesma faixa etária e adultos, adaptando-se ao convívio social.' },

      // CRIANÇAS BEM PEQUENAS (EI02)
      { code: 'EI02EO01', description: 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.' },
      { code: 'EI02EO02', description: 'Demonstrar imagem positiva de si e confiança em sua capacidade para enfrentar dificuldades e desafios.' },
      { code: 'EI02EO03', description: 'Compartilhar os objetos e os espaços com crianças da mesma faixa etária e adultos.' },
      { code: 'EI02EO04', description: 'Comunicar-se com os colegas e os adultos, buscando compreendê-los e fazendo-se compreender.' },
      { code: 'EI02EO05', description: 'Perceber que as pessoas têm características físicas diferentes, respeitando essas diferenças.' },
      { code: 'EI02EO06', description: 'Respeitar regras básicas de convívio social nas interações e brincadeiras.' },
      { code: 'EI02EO07', description: 'Resolver conflitos nas interações e brincadeiras, com a orientação de um adulto.' },

      // CRIANÇAS PEQUENAS (EI03)
      { code: 'EI03EO01', description: 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos, necessidades e maneiras de pensar e agir.' },
      { code: 'EI03EO02', description: 'Agir de maneira independente, com confiança em suas capacidades, reconhecendo suas conquistas e limitações.' },
      { code: 'EI03EO03', description: 'Ampliar as relações interpessoais, desenvolvendo atitudes de participação e cooperação.' },
      { code: 'EI03EO04', description: 'Comunicar suas ideias e sentimentos a pessoas e grupos diversos.' },
      { code: 'EI03EO05', description: 'Demonstrar valorização das características de seu corpo e respeitar as características dos outros (crianças e adultos) com os quais convive.' },
      { code: 'EI03EO06', description: 'Manifestar interesse e respeito por diferentes culturas e modos de vida.' },
      { code: 'EI03EO07', description: 'Usar estratégias pautadas no respeito mútuo para lidar com conflitos nas interações com crianças e adultos.' },
    ]
  },
  {
    id: 'CG',
    name: 'CORPO, GESTOS E MOVIMENTOS',
    color: '#10b981', // green
    skills: [
      // BEBÊS (EI01)
      { code: 'EI01CG01', description: 'Movimentar as partes do corpo para exprimir corporalmente emoções, necessidades e desejos.' },
      { code: 'EI01CG02', description: 'Experimentar as possibilidades corporais nas brincadeiras e interações em ambientes acolhedores e desafiantes.' },
      { code: 'EI01CG03', description: 'Imitar gestos e movimentos de outras crianças, adultos e animais.' },
      { code: 'EI01CG04', description: 'Participar do cuidado do seu corpo e da promoção do seu bem-estar.' },
      { code: 'EI01CG05', description: 'Utilizar os movimentos de preensão, encaixe e lançamento, ampliando suas possibilidades de manuseio de diferentes materiais e objetos.' },

      // CRIANÇAS BEM PEQUENAS (EI02)
      { code: 'EI02CG01', description: 'Apropriar-se de gestos e movimentos de sua cultura no cuidado de si e nos jogos e brincadeiras.' },
      { code: 'EI02CG02', description: 'Deslocar seu corpo no espaço, orientando-se por noções como em frente, atrás, no alto, embaixo, dentro, fora etc., ao se envolver em brincadeiras e atividades de diferentes naturezas.' },
      { code: 'EI02CG03', description: 'Explorar formas de deslocamento no espaço (pular, saltar, dançar), combinando movimentos e seguindo orientações.' },
      { code: 'EI02CG04', description: 'Demonstrar progressiva independência no cuidado do seu corpo.' },
      { code: 'EI02CG05', description: 'Desenvolver progressivamente as habilidades manuais, adquirindo controle para desenhar, pintar, rasgar, folhear, entre outros.' },

      // CRIANÇAS PEQUENAS (EI03)
      { code: 'EI03CG01', description: 'Criar com o corpo formas diversificadas de expressão de sentimentos, sensações e emoções, tanto nas situações do cotidiano quanto em brincadeiras, dança, teatro, música.' },
      { code: 'EI03CG02', description: 'Demonstrar controle e adequação do uso de seu corpo em brincadeiras e jogos, escuta e reconto de histórias, atividades artísticas, entre outras possibilidades.' },
      { code: 'EI03CG03', description: 'Criar movimentos, gestos, olhares e mímicas em brincadeiras, jogos e atividades artísticas como dança, teatro e música.' },
      { code: 'EI03CG04', description: 'Adotar hábitos de autocuidado relacionados a higiene, alimentação, conforto e aparência.' },
      { code: 'EI03CG05', description: 'Coordenar suas habilidades manuais no atendimento adequado a seus interesses e necessidades em situações diversas.' },
    ]
  },
  {
    id: 'TS',
    name: 'TRAÇOS, SONS, CORES E FORMAS',
    color: '#f59e0b', // amber
    skills: [
      // BEBÊS (EI01)
      { code: 'EI01TS01', description: 'Explorar sons produzidos com o próprio corpo e com objetos do ambiente.' },
      { code: 'EI01TS02', description: 'Traçar marcas gráficas, em diferentes suportes, usando instrumentos riscantes e tintas.' },
      { code: 'EI01TS03', description: 'Explorar diferentes fontes sonoras e materiais para acompanhar brincadeiras cantadas, canções, músicas e melodias.' },

      // CRIANÇAS BEM PEQUENAS (EI02)
      { code: 'EI02TS01', description: 'Criar sons com materiais, objetos e instrumentos musicais, para acompanhar diversos ritmos de música.' },
      { code: 'EI02TS02', description: 'Utilizar materiais variados com possibilidades de manipulação (argila, massa de modelar), explorando cores, texturas, superfícies, planos, formas e volumes ao criar objetos tridimensionais.' },
      { code: 'EI02TS03', description: 'Utilizar diferentes fontes sonoras disponíveis no ambiente em brincadeiras cantadas, canções, músicas e melodias.' },

      // CRIANÇAS PEQUENAS (EI03)
      { code: 'EI03TS01', description: 'Utilizar sons produzidos por materiais, objetos e instrumentos musicais durante brincadeiras de faz de conta, encenações, criações musicais, festas.' },
      { code: 'EI03TS02', description: 'Expressar-se livremente por meio de desenho, pintura, colagem, dobradura e escultura, criando produções bidimensionais e tridimensionais.' },
      { code: 'EI03TS03', description: 'Reconhecer as qualidades do som (intensidade, duração, altura e timbre), utilizando-as em suas produções sonoras e ao ouvir músicas e sons.' },
    ]
  },
  {
    id: 'EF',
    name: 'ESCUTA, FALA, PENSAMENTO E IMAGINAÇÃO',
    color: '#ef4444', // red
    skills: [
      // BEBÊS (EI01)
      { code: 'EI01EF01', description: 'Reconhecer quando é chamado por seu nome e reconhecer os nomes de pessoas com quem convive.' },
      { code: 'EI01EF02', description: 'Demonstrar interesse ao ouvir a leitura de poemas e a apresentação de músicas.' },
      { code: 'EI01EF03', description: 'Demonstrar interesse ao ouvir histórias lidas ou contadas, observando ilustrações e os movimentos de leitura do adulto-leitor (modo de segurar o portador e de virar as páginas).' },
      { code: 'EI01EF04', description: 'Reconhecer elementos das ilustrações de histórias, apontando-os, a pedido do adulto-leitor.' },
      { code: 'EI01EF05', description: 'Imitar as variações de entonação e gestos realizados pelos adultos, ao ler histórias e ao cantar.' },
      { code: 'EI01EF06', description: 'Comunicar-se com outras pessoas usando movimentos, gestos, balbucios, fala e outras formas de expressão.' },
      { code: 'EI01EF07', description: 'Conhecer e manipular materiais impressos e audiovisuais em diferentes portadores (livro, revista, gibi, jornal, cartaz, CD, tablet etc.).' },
      { code: 'EI01EF08', description: 'Participar de situações de escuta de textos em diferentes gêneros textuais (poemas, fábulas, contos, receitas, quadrinhos, anúncios etc.).' },
      { code: 'EI01EF09', description: 'Conhecer e manipular diferentes instrumentos e suportes de escrita.' },

      // CRIANÇAS BEM PEQUENAS (EI02)
      { code: 'EI02EF01', description: 'Dialogar com crianças e adultos, expressando seus desejos, necessidades, sentimentos e opiniões.' },
      { code: 'EI02EF02', description: 'Identificar e criar diferentes sons e reconhecer rimas e aliterações em cantigas de roda e textos poéticos.' },
      { code: 'EI02EF03', description: 'Demonstrar interesse e atenção ao ouvir a leitura de histórias e outros textos, diferenciando escrita de ilustrações, e acompanhando, com orientação do adulto-leitor, a direção da leitura (de cima para baixo, da esquerda para a direita).' },
      { code: 'EI02EF04', description: 'Formular e responder perguntas sobre fatos da história narrada, identificando cenários, personagens e principais acontecimentos.' },
      { code: 'EI02EF05', description: 'Relatar experiências e fatos acontecidos, histórias ouvidas, filmes ou peças teatrais assistidos etc.' },
      { code: 'EI02EF06', description: 'Criar e contar histórias oralmente, com base em imagens ou temas sugeridos.' },
      { code: 'EI02EF07', description: 'Manusear diferentes portadores textuais, demonstrando reconhecer seus usos sociais.' },
      { code: 'EI02EF08', description: 'Manipular textos e participar de situações de escuta para ampliar seu contato com diferentes gêneros textuais (parlendas, histórias de aventura, tirinhas, cartazes de sala, cardápios, notícias etc.).' },
      { code: 'EI02EF09', description: 'Manusear diferentes instrumentos e suportes de escrita para desenhar, traçar letras e outros sinais gráficos.' },

      // CRIANÇAS PEQUENAS (EI03)
      { code: 'EI03EF01', description: 'Expressar ideias, desejos e sentimentos sobre suas vivências, por meio da linguagem oral e escrita (escrita espontânea), de fotos, desenhos e outras formas de expressão.' },
      { code: 'EI03EF02', description: 'Inventar brincadeiras cantadas, poemas e canções, criando rimas, aliterações e ritmos.' },
      { code: 'EI03EF03', description: 'Escolher e folhear livros, procurando orientar-se por temas e ilustrações e tentando identificar palavras conhecidas.' },
      { code: 'EI03EF04', description: 'Recontar histórias ouvidas e planejar coletivamente roteiros de vídeos e de encenações, definindo os contextos, os personagens, a estrutura da história.' },
      { code: 'EI03EF05', description: 'Recontar histórias ouvidas para produção de reconto escrito, tendo o professor como escriba.' },
      { code: 'EI03EF06', description: 'Produzir suas próprias histórias orais e escritas (escrita espontânea), em situações com função social significativa.' },
      { code: 'EI03EF07', description: 'Levantar hipóteses sobre gêneros textuais veiculados em portadores conhecidos, recorrendo a estratégias de observação gráfica e/ou de leitura.' },
      { code: 'EI03EF08', description: 'Selecionar livros e textos de gêneros conhecidos para a leitura de um adulto e/ou para sua própria leitura (partindo de seu repertório sobre esses textos, como a recuperação pela memória, pela leitura das ilustrações etc.).' },
      { code: 'EI03EF09', description: 'Levantar hipóteses em relação à linguagem escrita, realizando registros de palavras e textos, por meio de escrita espontânea.' },
    ]
  },
  {
    id: 'ET',
    name: 'ESPAÇOS, TEMPOS, QUANTIDADES, RELAÇÕES E TRANSFORMAÇÕES',
    color: '#8b5cf6', // violet
    skills: [
      // BEBÊS (EI01)
      { code: 'EI01ET01', description: 'Explorar e descobrir as propriedades de objetos e materiais (odor, cor, sabor, temperatura).' },
      { code: 'EI01ET02', description: 'Explorar relações de causa e efeito (transbordar, tingir, misturar, mover e remover etc.) na interação com o mundo físico.' },
      { code: 'EI01ET03', description: 'Explorar o ambiente pela ação e observação, manipulando, experimentando e fazendo descobertas.' },
      { code: 'EI01ET04', description: 'Manipular, experimentar, arrumar e explorar o espaço por meio de experiências de deslocamentos de si e dos objetos.' },
      { code: 'EI01ET05', description: 'Manipular materiais diversos e variados para comparar as diferenças e semelhanças entre eles.' },
      { code: 'EI01ET06', description: 'Vivenciar diferentes ritmos, velocidades e fluxos nas interações e brincadeiras (em danças, balanços, escorregadores etc.).' },

      // CRIANÇAS BEM PEQUENAS (EI02)
      { code: 'EI02ET01', description: 'Explorar e descrever semelhanças e diferenças entre as características e propriedades dos objetos (textura, massa, tamanho).' },
      { code: 'EI02ET02', description: 'Observar, relatar e descrever incidentes do cotidiano e fenômenos naturais (luz solar, vento, chuva etc.).' },
      { code: 'EI02ET03', description: 'Compartilhar, com outras crianças, situações de cuidado de plantas e animais nos espaços da instituição e fora dela.' },
      { code: 'EI02ET04', description: 'Identificar relações espaciais (dentro e fora, em cima, embaixo, acima, abaixo, entre e do lado) e temporais (antes, durante e depois).' },
      { code: 'EI02ET05', description: 'Classificar objetos, considerando determinado atributo (tamanho, peso, cor, forma etc.).' },
      { code: 'EI02ET06', description: 'Utilizar conceitos básicos de tempo (agora, antes, durante, depois, ontem, hoje, amanhã, lento, rápido, depressa, devagar).' },
      { code: 'EI02ET07', description: 'Contar oralmente objetos, pessoas, livros etc., em contextos diversos.' },
      { code: 'EI02ET08', description: 'Registrar com números a quantidade de crianças (meninas e meninos, presentes e ausentes) e a quantidade de objetos da mesma natureza (bonecas, bolas, livros etc.).' },

      // CRIANÇAS PEQUENAS (EI03)
      { code: 'EI03ET01', description: 'Estabelecer relações de comparação entre objetos, observando suas propriedades.' },
      { code: 'EI03ET02', description: 'Observar e descrever mudanças em diferentes materiais, resultantes de ações sobre eles, em experimentos envolvendo fenômenos naturais e artificiais.' },
      { code: 'EI03ET03', description: 'Identificar e selecionar fontes de informações, para responder a questões sobre a natureza, seus fenômenos, sua conservação.' },
      { code: 'EI03ET04', description: 'Registrar observações, manipulações e medidas, usando múltiplas linguagens (desenho, registro por números ou escrita espontânea), em diferentes suportes.' },
      { code: 'EI03ET05', description: 'Classificar objetos e figuras de acordo com suas semelhanças e diferenças.' },
      { code: 'EI03ET06', description: 'Relatar fatos importantes sobre seu nascimento e desenvolvimento, a história dos seus familiares e da sua comunidade.' },
      { code: 'EI03ET07', description: 'Relacionar números às suas respectivas quantidades e identificar o antes, o depois e o entre em uma sequência.' },
      { code: 'EI03ET08', description: 'Expressar medidas (peso, altura etc.), construindo gráficos básicos.' },
    ]
  }
];

export const LEVEL_COLORS = {
  D: '#22c55e', // green-500
  ED: '#eab308', // yellow-500
  AD: '#ef4444', // red-500
};

export const LEVEL_LABELS = {
  D: 'Desenvolvido',
  ED: 'Em Desenvolvimento',
  AD: 'A Desenvolver',
};
