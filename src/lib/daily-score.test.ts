import { describe, expect, it } from 'vitest'

import { computeDayScore, type DayScoreInputs } from './daily-score'

const zerado: DayScoreInputs = {
  frogDone: false,
  habitosAtivos: 5,
  habitosFeitos: 0,
  treinou: false,
  restDay: false,
  nRefeicoes: 0,
  suplementosDoDia: 5,
  suplementosTomados: 0,
  diarioFeito: false,
  protocoloAtivo: true,
  protocoloLogado: false,
  tarefasFeitas: 0,
}

describe('computeDayScore', () => {
  it('setup completo do usuário: total 115 (sapo20+treino25+hábitos25+refeições15+supl10+diário10+protocolo10)', () => {
    expect(computeDayScore(zerado)).toEqual({ pontos: 0, total: 115, bonus: 0 })
  })

  it('dia perfeito fecha 100%', () => {
    const dia = computeDayScore({
      ...zerado,
      frogDone: true,
      habitosFeitos: 5,
      treinou: true,
      nRefeicoes: 3,
      suplementosTomados: 5,
      diarioFeito: true,
      protocoloLogado: true,
    })
    expect(dia.pontos).toBe(115)
    expect(dia.total).toBe(115)
  })

  it('rest day: treino sai do denominador — recovery perfeito é 100%', () => {
    const dia = computeDayScore({
      ...zerado,
      restDay: true,
      frogDone: true,
      habitosFeitos: 5,
      nRefeicoes: 3,
      suplementosTomados: 5,
      diarioFeito: true,
      protocoloLogado: true,
    })
    expect(dia.total).toBe(90)
    expect(dia.pontos).toBe(90)
  })

  it('bônus de tarefas soma em pontos mas não no total', () => {
    const dia = computeDayScore({ ...zerado, tarefasFeitas: 3 })
    expect(dia.bonus).toBe(15)
    expect(dia.pontos).toBe(15)
    expect(dia.total).toBe(115)
  })

  it('sem protocolo ativo e sem suplementos no dia, saem do total', () => {
    const dia = computeDayScore({ ...zerado, protocoloAtivo: false, suplementosDoDia: 0 })
    expect(dia.total).toBe(95) // 115 - protocolo(10) - suplementos(10)
  })

  it('suplementos parciais pontuam proporcional arredondado', () => {
    const dia = computeDayScore({ ...zerado, suplementosDoDia: 3, suplementosTomados: 2 })
    expect(dia.pontos).toBe(7) // round(2/3*10)
  })

  it('refeições têm teto de 15 pts', () => {
    expect(computeDayScore({ ...zerado, nRefeicoes: 6 }).pontos).toBe(15)
  })
})
