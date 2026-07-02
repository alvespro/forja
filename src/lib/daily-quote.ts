// Frase do dia — banco de frases originais no tom do FORJA:
// franco, motivacional, pancada e pra cima, com realidade.
// Rotação determinística por data (mesma frase o dia inteiro).

const QUOTES: string[] = [
  'Ninguém vem te salvar. E é exatamente por isso que você vai conseguir.',
  'O sapo não vai ficar mais bonito às 18h. Engole ele agora.',
  'Disciplina é escolher entre o que você quer agora e o que você quer MAIS.',
  'Seu corpo executa o que sua mente negocia. Pare de negociar.',
  'O dia perfeito não existe. O dia executado, sim.',
  'Você não está cansado. Você está destreinado em aguentar desconforto.',
  'Motivação te trouxe até aqui. Só disciplina te leva adiante.',
  'A versão de você de daqui a 1 ano está assistindo o que você faz hoje.',
  'Reclamar queima zero calorias e paga zero boletos.',
  'Todo mundo quer o resultado. Quase ninguém quer a rotina.',
  'Você já sabe o que precisa fazer. O resto é desculpa organizada.',
  'Treino ruim executado vale mais que treino perfeito planejado.',
  'A dor da disciplina pesa gramas. A dor do arrependimento pesa toneladas.',
  'Não confunda estar ocupado com estar avançando.',
  'Seu concorrente também acordou sem vontade. A diferença é o que ele fez depois.',
  'Consistência é chata. Resultado extraordinário nasce de rotina entediante.',
  'O espelho não aceita justificativa. A planilha também não.',
  'Se fosse fácil, qualquer um teria. Não é. Por isso é seu.',
  'Você não precisa de mais um plano. Precisa executar o que já tem.',
  'Amanhã é o esconderijo favorito de quem desiste hoje.',
  'Faça com medo, com sono, sem vontade. Feito é feito.',
  'Sua palavra vale alguma coisa? Então cumpra o que prometeu pra você mesmo.',
  'Pequeno progresso diário vira transformação anual. Zero diário vira zero anual.',
  'O corpo que você quer cobra um preço diário. Pagou hoje?',
  'Força não é não sentir. É sentir e fazer mesmo assim.',
  'Ou você controla sua agenda, ou a preguiça controla por você.',
  'Ninguém lembra dos seus dias confortáveis. Nem você.',
  'A meta não liga pros seus sentimentos. Ela só responde a movimento.',
  'Cada escolha é um voto na pessoa que você está virando.',
  'Descansar faz parte do plano. Desistir disfarçado de descanso, não.',
  'Vitória silenciosa: fazer o certo quando ninguém está olhando.',
  'Você aguenta muito mais do que seu conforto te contou.',
  'O problema não é cair. É transformar a queda em endereço.',
  'Excelência é um hábito operacional, não um talento místico.',
  'Enquanto você pensa em começar segunda, alguém está na terceira série.',
  'Não existe semana perdida pra quem resgata o dia de hoje.',
  'Seu futuro é construído em horário comercial: agora.',
  'Quem mede, gerencia. Quem adivinha, estagnou.',
  'Padrão alto não é pressão. É respeito por quem você pode ser.',
  'A preguiça é criativa: ela sempre tem um bom motivo. Não compre.',
  'Foco não é fazer mais. É recusar melhor.',
  'O jogo é longo. Mas os pontos são marcados todo dia.',
  'Se o dia começou errado, conserte no próximo bloco. Dia não se joga fora.',
  'Corpo forte, mente clara, palavra firme. O resto é consequência.',
  'Você não compete com ninguém. Compete com o seu potencial desperdiçado.',
  'Cansaço passa. Orgulho de ter feito, fica.',
  'Rotina não é prisão. É a fundação de tudo que você quer construir.',
  'O primeiro passo mais difícil do dia destrava todos os outros.',
  'Aja como o profissional que você cobra dos outros.',
  'Metade da vitória é aparecer. A outra metade é não se poupar.',
]

export type DailyQuote = {
  texto: string
  /** Origem da frase: null = frase original FORJA. */
  fonte: string | null
  emoji: string
}

function hashDate(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Escolhe a frase do dia de um pool combinado (frases FORJA + trechos salvos
 * pelo usuário em livros, cursos e filmes). Determinística pela data.
 */
export function pickQuoteOfDay(userQuotes: DailyQuote[], dateStr: string): DailyQuote {
  const forja: DailyQuote[] = QUOTES.map((texto) => ({ texto, fonte: null, emoji: '⚒️' }))
  // Intercala: com acervo pessoal, ~metade dos dias sai do que você salvou.
  const pool = userQuotes.length > 0 ? [...userQuotes, ...forja.slice(0, userQuotes.length + 10)] : forja
  return pool[hashDate(dateStr) % pool.length]
}

/** Retorna a frase do dia — determinística pela data (YYYY-MM-DD). */
export function quoteOfTheDay(dateStr: string): string {
  return QUOTES[hashDate(dateStr) % QUOTES.length]
}
