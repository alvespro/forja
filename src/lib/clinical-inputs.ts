/**
 * Monta as entradas dos cálculos clínicos a partir de marcadores de exame —
 * tanto do exame recém-confirmado no Document Vision quanto do histórico de
 * health_metrics (botão "Calcular com últimos exames" do Placar de Saúde).
 */

type Marcador = { chave: string; valor: number }

export type HomaInputs = { glicemia: number; insulina: number }
export type LipidInputs = { colesterol_total: number; hdl: number; ldl: number; triglicerides: number | null }

function valorDe(marcadores: Marcador[], chave: string): number | null {
  const m = marcadores.find((x) => x.chave === chave && Number.isFinite(x.valor) && x.valor > 0)
  return m ? m.valor : null
}

/** Glicemia E insulina presentes → entradas do HOMA-IR. */
export function homaInputsFrom(marcadores: Marcador[]): HomaInputs | null {
  const glicemia = valorDe(marcadores, 'glicemia')
  const insulina = valorDe(marcadores, 'insulina')
  return glicemia != null && insulina != null ? { glicemia, insulina } : null
}

/** Colesterol total, HDL e LDL presentes → entradas dos ratios (triglicerídeos opcional). */
export function lipidInputsFrom(marcadores: Marcador[]): LipidInputs | null {
  const colesterol_total = valorDe(marcadores, 'colesterol_total')
  const hdl = valorDe(marcadores, 'hdl')
  const ldl = valorDe(marcadores, 'ldl')
  if (colesterol_total == null || hdl == null || ldl == null) return null
  return { colesterol_total, hdl, ldl, triglicerides: valorDe(marcadores, 'triglicerides') }
}

/**
 * Último valor de cada chave no histórico. Histórico chega em ordem cronológica
 * (measured_at ascendente), então o último da lista vence.
 */
export function latestMarkers(metrics: { chave: string; valor: number; measured_at: string }[]): Marcador[] {
  const ultimo = new Map<string, { chave: string; valor: number; measured_at: string }>()
  for (const m of metrics) {
    const atual = ultimo.get(m.chave)
    if (!atual || m.measured_at >= atual.measured_at) ultimo.set(m.chave, m)
  }
  return [...ultimo.values()]
}
