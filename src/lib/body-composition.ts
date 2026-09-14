// Grade de composição corporal: as métricas da balança (AFit) com status e tendência.

import type { BodyMetric } from '@/types/database'

export type CompositionStatus = 'ok' | 'atencao' | 'alerta' | 'neutro'

export type CompositionKey =
  | 'peso_kg'
  | 'gordura_pct'
  | 'musculo_pct'
  | 'agua_pct'
  | 'gordura_visceral'
  | 'imc'
  | 'tmb_kcal'
  | 'massa_ossea_kg'
  | 'proteina_pct'
  | 'idade_corporal'
  | 'gordura_subcutanea_pct'
  | 'peso_muscular_kg'

export type CompositionGoals = {
  peso_meta_kg?: number | null
  gordura_meta_pct?: number | null
  musculo_pct_meta?: number | null
  agua_meta_pct?: number | null
  gordura_visceral_meta?: number | null
  imc_meta?: number | null
}

type Regra =
  | { tipo: 'meta'; campo: keyof CompositionGoals; melhor: 'menor' | 'maior' }
  | { tipo: 'faixa'; min: number; max: number }
  | { tipo: 'neutro' }

type Definicao = { key: CompositionKey; label: string; unit: string; regra: Regra; faixaFallback?: { min: number; max: number } }

/**
 * Ordem de exibição e regra de status de cada métrica.
 * Faixas de referência só onde são amplamente aceitas (IMC, água, visceral na
 * escala das balanças de bioimpedância, proteína); o resto fica neutro — o app
 * não inventa limite clínico.
 */
export const COMPOSITION_METRICS: Definicao[] = [
  { key: 'peso_kg', label: 'Peso', unit: 'kg', regra: { tipo: 'meta', campo: 'peso_meta_kg', melhor: 'menor' } },
  { key: 'gordura_pct', label: 'Gordura', unit: '%', regra: { tipo: 'meta', campo: 'gordura_meta_pct', melhor: 'menor' } },
  { key: 'musculo_pct', label: 'Músculo', unit: '%', regra: { tipo: 'meta', campo: 'musculo_pct_meta', melhor: 'maior' } },
  { key: 'agua_pct', label: 'Água', unit: '%', regra: { tipo: 'meta', campo: 'agua_meta_pct', melhor: 'maior' }, faixaFallback: { min: 50, max: 65 } },
  { key: 'gordura_visceral', label: 'Visceral', unit: '', regra: { tipo: 'meta', campo: 'gordura_visceral_meta', melhor: 'menor' }, faixaFallback: { min: 1, max: 9 } },
  { key: 'imc', label: 'IMC', unit: '', regra: { tipo: 'meta', campo: 'imc_meta', melhor: 'menor' }, faixaFallback: { min: 18.5, max: 24.9 } },
  { key: 'proteina_pct', label: 'Proteína', unit: '%', regra: { tipo: 'faixa', min: 16, max: 20 } },
  { key: 'peso_muscular_kg', label: 'Massa muscular', unit: 'kg', regra: { tipo: 'neutro' } },
  { key: 'gordura_subcutanea_pct', label: 'Subcutânea', unit: '%', regra: { tipo: 'neutro' } },
  { key: 'tmb_kcal', label: 'TMB', unit: 'kcal', regra: { tipo: 'neutro' } },
  { key: 'massa_ossea_kg', label: 'Massa óssea', unit: 'kg', regra: { tipo: 'neutro' } },
  { key: 'idade_corporal', label: 'Idade corporal', unit: 'anos', regra: { tipo: 'neutro' } },
]

export type CompositionCard = {
  key: CompositionKey
  label: string
  unit: string
  valor: number
  status: CompositionStatus
  /** Série histórica (mais antiga → mais recente), para a sparkline. */
  tendencia: number[]
  meta: number | null
  /** 0–100 em direção à meta, a partir da primeira medição com valor. null sem meta. */
  progressoMeta: number | null
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function statusPorFaixa(valor: number, faixa: { min: number; max: number }): CompositionStatus {
  return valor >= faixa.min && valor <= faixa.max ? 'ok' : 'atencao'
}

/** Status em relação à meta, respeitando a direção (gordura: menor é melhor). */
export function statusPorMeta(valor: number, meta: number, melhor: 'menor' | 'maior'): CompositionStatus {
  const atingiu = melhor === 'menor' ? valor <= meta : valor >= meta
  if (atingiu) return 'ok'
  // Longe da meta (mais de 25% da própria meta de distância) vira alerta.
  const distancia = Math.abs(valor - meta) / Math.abs(meta || 1)
  return distancia > 0.25 ? 'alerta' : 'atencao'
}

/** Progresso da primeira medição até a meta; afastar-se da meta conta como 0. */
export function progressoAteMeta(inicial: number, atual: number, meta: number): number {
  const total = meta - inicial
  if (total === 0) return 100
  const pct = ((atual - inicial) / total) * 100
  return Math.max(0, Math.min(100, pct))
}

/**
 * Monta os cards da grade a partir do histórico (ordem cronológica) e das metas.
 * Métricas sem valor na medição mais recente são omitidas.
 */
export function buildCompositionCards(metrics: BodyMetric[], goals: CompositionGoals | null): CompositionCard[] {
  if (metrics.length === 0) return []
  const ordenadas = [...metrics].sort((a, b) => (a.medido_em < b.medido_em ? -1 : 1))
  const ultima = ordenadas[ordenadas.length - 1]

  const cards: CompositionCard[] = []
  for (const def of COMPOSITION_METRICS) {
    const valor = num((ultima as Record<string, unknown>)[def.key])
    if (valor === null) continue

    const serie = ordenadas.map((m) => num((m as Record<string, unknown>)[def.key])).filter((v): v is number => v !== null)

    let status: CompositionStatus = 'neutro'
    let meta: number | null = null
    let progressoMeta: number | null = null

    if (def.regra.tipo === 'meta') {
      meta = num(goals?.[def.regra.campo])
      if (meta !== null) {
        status = statusPorMeta(valor, meta, def.regra.melhor)
        // Distância relativa exagera em números pequenos (visceral 7 vs meta 5 = 40%).
        // Se o valor ainda está na faixa saudável de referência, não é "fora".
        if (status === 'alerta' && def.faixaFallback && statusPorFaixa(valor, def.faixaFallback) === 'ok') {
          status = 'atencao'
        }
        progressoMeta = progressoAteMeta(serie[0], valor, meta)
      } else if (def.faixaFallback) {
        status = statusPorFaixa(valor, def.faixaFallback)
      }
    } else if (def.regra.tipo === 'faixa') {
      status = statusPorFaixa(valor, def.regra)
    }

    cards.push({ key: def.key, label: def.label, unit: def.unit, valor, status, tendencia: serie, meta, progressoMeta })
  }
  return cards
}
