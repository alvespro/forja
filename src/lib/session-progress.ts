// Execução de treino — progresso por exercício (séries confirmadas), numeração
// das séries e retomada da sessão via localStorage.

type Prescricao = { id: string; exercise_id: string; series_alvo: number | null }
type LogMin = { exercise_id: string; serie_num: number; concluida: boolean | null }

/** Séries prescritas (mínimo 1). */
export function totalSeriesDe(p: Pick<Prescricao, 'series_alvo'>): number {
  return Math.max(1, p.series_alvo ?? 1)
}

/** Faixa de `serie_num` reservada a cada ocorrência de um mesmo exercício no treino. */
export const FAIXA_POR_OCORRENCIA = 100

/**
 * Deslocamento do `serie_num` de cada prescrição. O mesmo exercício pode
 * aparecer duas vezes no treino: a 2ª ocorrência grava a partir de 101, a 3ª de
 * 201… — séries extras de uma ocorrência nunca colidem com as da outra.
 */
export function baseDasSeries(lista: Prescricao[]): Map<string, number> {
  const ocorrencias = new Map<string, number>()
  const base = new Map<string, number>()
  for (const p of lista) {
    const n = ocorrencias.get(p.exercise_id) ?? 0
    base.set(p.id, n * FAIXA_POR_OCORRENCIA)
    ocorrencias.set(p.exercise_id, n + 1)
  }
  return base
}

/**
 * Séries já confirmadas no banco para a prescrição (sequência contínua a partir
 * da 1ª). Sem `limite`, conta também as extras além do prescrito.
 */
export function confirmadasNosLogs(logs: LogMin[], exerciseId: string, base: number, limite = FAIXA_POR_OCORRENCIA - 1): number {
  const feitas = new Set(
    logs.filter((l) => l.exercise_id === exerciseId && l.concluida).map((l) => l.serie_num - base),
  )
  let n = 0
  while (n < limite && feitas.has(n + 1)) n += 1
  return n
}

export type PassoAposConfirmar = 'cronometro' | 'proximo_exercicio' | 'finalizar'

/**
 * O que acontece ao confirmar uma série:
 * ainda há séries → cronômetro de pausa; última série → próximo exercício;
 * última série do último exercício → fechamento do treino.
 */
export function passoAposConfirmar(confirmadasAgora: number, total: number, ehUltimoExercicio: boolean): PassoAposConfirmar {
  if (confirmadasAgora < total) return 'cronometro'
  return ehUltimoExercicio ? 'finalizar' : 'proximo_exercicio'
}

export type ProgressoSalvo = {
  indice: number
  confirmadas: Record<string, number>
  /** Séries extras adicionadas por prescrição (além de series_alvo). */
  extras?: Record<string, number>
}

const chave = (sessionId: string) => `forja:sessao-progresso:${sessionId}`

export function lerProgresso(sessionId: string): ProgressoSalvo | null {
  try {
    const bruto = window.localStorage.getItem(chave(sessionId))
    if (!bruto) return null
    const p = JSON.parse(bruto) as Partial<ProgressoSalvo>
    return {
      indice: Number.isInteger(p.indice) && (p.indice as number) >= 0 ? (p.indice as number) : 0,
      confirmadas: p.confirmadas && typeof p.confirmadas === 'object' ? p.confirmadas : {},
      extras: p.extras && typeof p.extras === 'object' ? p.extras : {},
    }
  } catch {
    return null
  }
}

export function salvarProgresso(sessionId: string, progresso: ProgressoSalvo): void {
  try {
    window.localStorage.setItem(chave(sessionId), JSON.stringify(progresso))
  } catch {
    // armazenamento bloqueado: o progresso ainda é reconstruído a partir dos logs
  }
}

export function limparProgresso(sessionId: string): void {
  try {
    window.localStorage.removeItem(chave(sessionId))
  } catch {
    // idem
  }
}
