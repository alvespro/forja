// Ciclo do protocolo: semana atual, dia de aplicação, aplicações perdidas e alertas.
// Só lê o que o usuário cadastrou (datas, compostos e doses prescritos) — nunca sugere nada.

import { addDaysToDateString, diffInDays, toSaoPauloDateString } from '@/lib/date'

type CicloDatas = { data_inicio: string | null; data_fim_prevista: string | null; duracao_semanas: number | null }

export type EstadoCiclo =
  | { fase: 'sem_data' }
  | { fase: 'antes'; inicio: string; diasParaInicio: number; totalSemanas: number }
  | { fase: 'ativo'; semana: number; totalSemanas: number; ehDiaDeAplicacao: boolean; proximaAplicacao: string | null; ultimaSemana: boolean }
  | { fase: 'concluido'; fim: string }

const SEMANAS_PADRAO = 12

/**
 * Semana 1 começa no dia de início; aplicações no mesmo dia da semana do início
 * (início numa quinta = aplicações às quintas), uma por semana do ciclo.
 */
export function estadoDoCiclo(protocolo: CicloDatas, hoje: string): EstadoCiclo {
  const inicio = protocolo.data_inicio
  if (!inicio) return { fase: 'sem_data' }
  const totalSemanas = protocolo.duracao_semanas ?? SEMANAS_PADRAO
  const fim = protocolo.data_fim_prevista ?? addDaysToDateString(inicio, totalSemanas * 7)
  const dias = diffInDays(hoje, inicio)

  if (dias < 0) return { fase: 'antes', inicio, diasParaInicio: -dias, totalSemanas }
  if (hoje > fim) return { fase: 'concluido', fim }

  const semana = Math.min(totalSemanas, Math.floor(dias / 7) + 1)
  const ultimaAplicacao = addDaysToDateString(inicio, (totalSemanas - 1) * 7)
  const ehDiaDeAplicacao = dias % 7 === 0 && hoje <= ultimaAplicacao
  const proxima = ehDiaDeAplicacao ? hoje : addDaysToDateString(inicio, (Math.floor(dias / 7) + 1) * 7)
  return {
    fase: 'ativo',
    semana,
    totalSemanas,
    ehDiaDeAplicacao,
    proximaAplicacao: proxima <= ultimaAplicacao ? proxima : null,
    ultimaSemana: semana === totalSemanas,
  }
}

/** Todas as datas de aplicação do ciclo (uma por semana). */
export function datasDeAplicacao(protocolo: CicloDatas): string[] {
  if (!protocolo.data_inicio) return []
  const total = protocolo.duracao_semanas ?? SEMANAS_PADRAO
  return Array.from({ length: total }, (_, i) => addDaysToDateString(protocolo.data_inicio!, i * 7))
}

/** Data (fuso de São Paulo) de uma aplicação; aceita timestamp ou data pura (registros antigos). */
export function dataDoLog(dataAplicacao: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(dataAplicacao) ? dataAplicacao : toSaoPauloDateString(dataAplicacao)
}

/** Aplicação mais recente, anterior a hoje, sem nenhum registro — o "você aplicou?" do banner. */
export function aplicacaoNaoRegistrada(protocolo: CicloDatas, datasComRegistro: Set<string>, hoje: string): string | null {
  const passadas = datasDeAplicacao(protocolo).filter((d) => d < hoje)
  const ultima = passadas.at(-1)
  return ultima && !datasComRegistro.has(ultima) ? ultima : null
}

export type CompostoDaSemana = { semana_inicio: number | null; semana_fim: number | null }

/** Compostos cadastrados para a semana (sem janela definida = o ciclo todo). */
export function compostosDaSemana<T extends CompostoDaSemana>(compostos: T[], semana: number): T[] {
  return compostos.filter((c) => (c.semana_inicio ?? 1) <= semana && (c.semana_fim == null || semana <= c.semana_fim))
}

type ExameAlerta = { nome: string; tipo: string | null; status: string | null; data_prevista: string | null }

export type AlertaCiclo =
  | { tipo: 'exames_mid_ciclo'; dias: number; data: string; exames: string[] }
  | { tipo: 'ultima_semana' }

const DIAS_AVISO_EXAMES = 3

export function alertasDoCiclo(estado: EstadoCiclo, exames: ExameAlerta[], hoje: string): AlertaCiclo[] {
  if (estado.fase !== 'ativo') return []
  const alertas: AlertaCiclo[] = []

  const mid = exames.filter((e) => e.tipo === 'mid_ciclo' && e.status !== 'realizado' && e.data_prevista)
  const proximaData = mid.map((e) => e.data_prevista!).sort()[0]
  if (proximaData) {
    const dias = diffInDays(proximaData, hoje)
    if (dias >= 0 && dias <= DIAS_AVISO_EXAMES) {
      alertas.push({ tipo: 'exames_mid_ciclo', dias, data: proximaData, exames: mid.filter((e) => e.data_prevista === proximaData).map((e) => e.nome) })
    }
  }
  if (estado.ultimaSemana) alertas.push({ tipo: 'ultima_semana' })
  return alertas
}
