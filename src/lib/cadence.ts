// Cadência (tempo) de execução: notação de 4 fases tipo "3-0-1-0"
// = excêntrica (descida) - pausa embaixo - concêntrica (subida) - pausa em cima, em segundos.

export type CadencePhases = {
  excentrica: number
  pausaBaixo: number
  concentrica: number
  pausaCima: number
}

/** Interpreta "3-0-1-0" (aceita separador -, : ou espaço). Retorna null se não tiver 4 fases numéricas. */
export function parseCadence(raw: string | null): CadencePhases | null {
  if (!raw) return null
  const parts = raw.trim().split(/[-:\s]+/).map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null
  const [excentrica, pausaBaixo, concentrica, pausaCima] = parts
  return { excentrica, pausaBaixo, concentrica, pausaCima }
}

/** Explica a cadência em linguagem natural (ex: "3s descendo, sem pausa, 1s subindo, sem pausa"). */
export function explainCadence(raw: string | null): string | null {
  const p = parseCadence(raw)
  if (!p) return null
  return [
    `${p.excentrica}s descendo`,
    p.pausaBaixo === 0 ? 'sem pausa embaixo' : `${p.pausaBaixo}s pausa embaixo`,
    `${p.concentrica}s subindo`,
    p.pausaCima === 0 ? 'sem pausa em cima' : `${p.pausaCima}s pausa em cima`,
  ].join(', ')
}

/** Quebra o campo livre de cues em passos numeráveis (por linha; se linha única, por ; ou frase). */
export function splitCues(cues: string | null): string[] {
  if (!cues) return []
  const byLine = cues
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (byLine.length > 1) return byLine
  return cues
    .split(/(?:;|•|\.\s+)/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
}
