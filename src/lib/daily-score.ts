// Regras de pontuação do dia — fonte única usada pelo dashboard (hoje) e
// pelo recálculo retroativo. Antes, o score só era gravado quando a aba Hoje
// abria: dia executado sem abrir o app = streak quebrado injustamente.

export type DayScoreInputs = {
  frogDone: boolean
  habitosAtivos: number
  habitosFeitos: number
  treinou: boolean
  /** Dia de descanso planejado: treino sai do denominador. */
  restDay: boolean
  nRefeicoes: number
  suplementosDoDia: number
  suplementosTomados: number
  diarioFeito: boolean
  protocoloAtivo: boolean
  protocoloLogado: boolean
  tarefasFeitas: number
}

export type DayScore = { pontos: number; total: number; bonus: number }

export const PTS = {
  sapo: 20,
  treino: 25,
  habito: 5,
  refeicoes: 15,
  suplementos: 10,
  diario: 10,
  protocolo: 10,
  tarefaBonus: 5,
} as const

export function computeDayScore(i: DayScoreInputs): DayScore {
  let total = 0
  let pontos = 0

  total += PTS.sapo
  if (i.frogDone) pontos += PTS.sapo

  if (!i.restDay) {
    total += PTS.treino
    if (i.treinou) pontos += PTS.treino
  }

  if (i.habitosAtivos > 0) {
    total += i.habitosAtivos * PTS.habito
    pontos += i.habitosFeitos * PTS.habito
  }

  total += PTS.refeicoes
  pontos += Math.min(PTS.refeicoes, i.nRefeicoes * 5)

  if (i.suplementosDoDia > 0) {
    total += PTS.suplementos
    pontos +=
      i.suplementosTomados === i.suplementosDoDia
        ? PTS.suplementos
        : Math.round((i.suplementosTomados / i.suplementosDoDia) * PTS.suplementos)
  }

  total += PTS.diario
  if (i.diarioFeito) pontos += PTS.diario

  if (i.protocoloAtivo) {
    total += PTS.protocolo
    if (i.protocoloLogado) pontos += PTS.protocolo
  }

  const bonus = i.tarefasFeitas * PTS.tarefaBonus
  pontos += bonus

  return { pontos, total, bonus }
}
