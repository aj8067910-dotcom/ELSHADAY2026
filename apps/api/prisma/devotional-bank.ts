// Gera o banco de 365 devocionais — uma jornada de leitura bíblica anual.
// Sem citações longas de versículos: cada dia aponta a leitura de um
// capítulo, com orientação e pergunta de reflexão. Assim não há risco de
// citação imprecisa da Escritura e a jornada cobre o ano inteiro.

export interface BankEntry {
  dayIndex: number;
  theme: string;
  verse: string;
  verseRef: string;
  body: string;
  question: string;
}

interface Book {
  name: string;
  chapters: number;
  intro: string;
}

// Ordem pensada para engajar: começa no Evangelho, mergulha nos Salmos
// (oração), sabedoria prática, e percorre o Novo Testamento.
const JOURNEY: Book[] = [
  {
    name: 'João',
    chapters: 21,
    intro:
      'O Evangelho de João foi escrito para que creiamos que Jesus é o Cristo. Cada capítulo revela quem Ele é de um jeito único.',
  },
  {
    name: 'Salmos',
    chapters: 150,
    intro:
      'Os Salmos nos ensinam a orar com honestidade: alegria, medo, gratidão e até frustração — tudo pode ser levado a Deus.',
  },
  {
    name: 'Provérbios',
    chapters: 31,
    intro:
      'Provérbios é sabedoria prática para as decisões de todo dia: palavras, dinheiro, amizades, trabalho e caráter.',
  },
  {
    name: 'Marcos',
    chapters: 16,
    intro:
      'Marcos é o Evangelho da ação: Jesus servindo, curando e caminhando em direção à cruz sem perder tempo.',
  },
  {
    name: 'Atos',
    chapters: 28,
    intro:
      'Atos mostra a igreja nascendo no poder do Espírito Santo — comunhão, coragem e missão que atravessam fronteiras.',
  },
  {
    name: 'Romanos',
    chapters: 16,
    intro:
      'Romanos apresenta o evangelho em profundidade: a graça que nos justifica e transforma a maneira como vivemos.',
  },
  {
    name: 'Gálatas',
    chapters: 6,
    intro:
      'Gálatas é um chamado à liberdade em Cristo: não voltamos à escravidão, vivemos pelo Espírito.',
  },
  {
    name: 'Efésios',
    chapters: 6,
    intro:
      'Efésios revela nossa identidade em Cristo e como ela se expressa na igreja, na família e na batalha espiritual.',
  },
  {
    name: 'Filipenses',
    chapters: 4,
    intro:
      'Filipenses é a carta da alegria — escrita de uma prisão, prova que contentamento não depende de circunstâncias.',
  },
  {
    name: 'Colossenses',
    chapters: 4,
    intro:
      'Colossenses exalta a supremacia de Cristo: Ele é o centro de tudo, inclusive da nossa rotina.',
  },
  {
    name: '1 Tessalonicenses',
    chapters: 5,
    intro:
      'Uma carta de encorajamento: viver de modo digno, amar a comunidade e aguardar a volta do Senhor com esperança.',
  },
  {
    name: 'Tiago',
    chapters: 5,
    intro:
      'Tiago é fé com as mãos na massa: ouvir e praticar, dominar a língua, cuidar dos necessitados.',
  },
  {
    name: '1 Pedro',
    chapters: 5,
    intro:
      '1 Pedro fortalece quem enfrenta provações: esperança viva, santidade e humildade debaixo da graça.',
  },
  {
    name: '1 João',
    chapters: 5,
    intro:
      '1 João é um teste de realidade do amor: quem permanece em Deus ama, obedece e anda na luz.',
  },
  {
    name: 'Hebreus',
    chapters: 13,
    intro:
      'Hebreus mostra que Jesus é superior a tudo — o sumo sacerdote perfeito que nos dá acesso direto a Deus.',
  },
  {
    name: 'Lucas',
    chapters: 24,
    intro:
      'Lucas conta a história de Jesus com olhar de médico e coração de historiador: compaixão pelos esquecidos em cada página.',
  },
  {
    name: 'Mateus',
    chapters: 28,
    intro:
      'Mateus conecta as promessas do Antigo Testamento a Jesus, o Rei que ensina o estilo de vida do Reino.',
  },
];

const QUESTIONS = [
  'O que este capítulo revela sobre o caráter de Deus?',
  'Qual versículo chamou mais a sua atenção? Por quê?',
  'O que você pode praticar hoje a partir desta leitura?',
  'Há alguma promessa aqui para você se apegar nesta semana?',
  'O que este texto confronta na sua maneira de viver?',
  'Como esta passagem muda o jeito de você orar hoje?',
  'Com quem você pode compartilhar o que leu hoje?',
  'Que atitude você precisa abandonar depois desta leitura?',
  'Onde você vê a graça de Deus neste capítulo?',
  'O que este texto ensina sobre amar as pessoas ao seu redor?',
  'Que passo de obediência este capítulo está pedindo?',
  'Como esta leitura fortalece a sua esperança?',
  'O que você aprende aqui sobre servir?',
  'Que motivo de gratidão esta passagem desperta em você?',
];

const PRACTICES = [
  'Leia com calma — se possível, duas vezes — e sublinhe o que tocar seu coração.',
  'Antes de ler, faça uma oração curta pedindo que Deus fale com você.',
  'Anote uma frase do capítulo para levar com você durante o dia.',
  'Leia em voz alta um trecho que você quiser guardar na memória.',
  'Termine a leitura agradecendo a Deus por algo específico do texto.',
  'Escolha um versículo do capítulo e transforme-o em oração.',
  'Compartilhe com sua dupla espiritual o que a leitura despertou em você.',
];

export function generateBank(): BankEntry[] {
  const entries: BankEntry[] = [];
  let day = 1;

  for (const book of JOURNEY) {
    for (let chapter = 1; chapter <= book.chapters && day <= 365; chapter++) {
      const ref = `${book.name} ${chapter}`;
      entries.push({
        dayIndex: day,
        theme: `Jornada em ${book.name} · Dia ${chapter} de ${book.chapters}`,
        verse: `Leitura de hoje: ${ref}`,
        verseRef: ref,
        body: `${book.intro}\n\n${PRACTICES[day % PRACTICES.length]} Depois, reserve um minuto de silêncio para ouvir o que Deus quer te dizer através de ${ref}.`,
        question: QUESTIONS[day % QUESTIONS.length],
      });
      day++;
    }
    if (day > 365) break;
  }

  return entries;
}
