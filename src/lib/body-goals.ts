import type { BodyMetric, ObjetivoCorporal } from '@/types/database'
import { diffInDays, todayInSaoPaulo } from '@/lib/date'

export const OBJETIVO_OPTIONS: { value: ObjetivoCorporal; label: string; icon: string }[] = [
  { value: 'recomposicao', label: 'Recomposição', icon: '🔄' },
  { value: 'ganho_massa', label: 'Ganho de Massa', icon: '💪' },
  { value: 'perda_peso', label: 'Perda de Peso', icon: '📉' },
  { value: 'definicao', label: 'Definição', icon: '⚡' },
  { value: 'performance', label: 'Performance', icon: '🏃' },
]

export const OBJETIVO_LABELS: Record<ObjetivoCorporal, string> = OBJETIVO_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<ObjetivoCorporal, string>,
)

export const OBJETIVO_ICONS: Record<ObjetivoCorporal, string> = OBJETIVO_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.icon }),
  {} as Record<ObjetivoCorporal, string>,
)

export const OBJETIVO_DESCRICAO: Record<ObjetivoCorporal, string> = {
  recomposicao:
    'Ganhar músculo e perder gordura simultaneamente. Requer déficit calórico leve + proteína alta + treino de força.',
  ganho_massa: 'Maximizar ganho muscular com superávit calórico controlado e treino progressivo de força.',
  perda_peso: 'Reduzir peso corporal preservando massa muscular. Déficit calórico moderado + proteína elevada.',
  definicao: 'Reduzir gordura mantendo massa muscular conquistada. Déficit calórico + volume de treino alto.',
  performance: 'Maximizar capacidade atlética. Foco em força, resistência e recuperação.',
}

/** Classes de cor de fundo sutil por objetivo, usadas no ObjectiveBadge e no card do ciclo. */
export const OBJETIVO_BADGE_CLASS: Record<ObjetivoCorporal, string> = {
  recomposicao: 'bg-brasa/10 text-brasa border-brasa/30',
  ganho_massa: 'bg-ok/10 text-ok border-ok/30',
  perda_peso: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
  definicao: 'bg-atencao/10 text-atencao border-atencao/30',
  performance: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
}

export const DIAS_ALERTA_FIM_CICLO = 14

export type MetricKey = 'peso_kg' | 'gordura_pct' | 'musculo_pct' | 'agua_pct' | 'gordura_visceral' | 'imc'

export const METRIC_LABELS: Record<MetricKey, string> = {
  peso_kg: 'Peso',
  gordura_pct: '% Gordura',
  musculo_pct: '% Músculo',
  agua_pct: '% Água',
  gordura_visceral: 'Gordura visceral',
  imc: 'IMC',
}

export const METRIC_UNITS: Record<MetricKey, string> = {
  peso_kg: 'kg',
  gordura_pct: '%',
  musculo_pct: '%',
  agua_pct: '%',
  gordura_visceral: '',
  imc: '',
}

/** Dias decorridos desde o início do ciclo, limitado a [0, prazo_dias]. */
export function cycleDaysElapsed(dataInicio: string, prazoDias: number): number {
  const elapsed = diffInDays(dataInicio, todayInSaoPaulo())
  return Math.min(Math.max(elapsed, 0), prazoDias)
}

export function cycleDaysRemaining(dataFim: string): number {
  return Math.max(diffInDays(todayInSaoPaulo(), dataFim), 0)
}

/**
 * % de progresso de uma métrica em direção à meta, dado o valor de partida e o atual.
 * Funciona tanto para métricas que devem subir (músculo) quanto descer (gordura) — o sinal
 * do progresso é normalizado pela direção real entre partida e meta.
 */
export function goalProgressPct(valorInicial: number, valorAtual: number, valorMeta: number): number {
  const distanciaTotal = valorMeta - valorInicial
  if (distanciaTotal === 0) return 100
  const percorrido = valorAtual - valorInicial
  const pct = (percorrido / distanciaTotal) * 100
  return Math.min(Math.max(pct, 0), 100)
}

/**
 * Janela de medições relevante para um ciclo: a última medição anterior ao início
 * (o estado do corpo quando a meta nasceu — o baseline real) seguida das medições
 * feitas dentro do ciclo. Sem data de início, devolve todas ordenadas.
 */
export function metricsForCycle<T extends { medido_em: string }>(metrics: T[], dataInicio: string | null): T[] {
  const ordered = [...metrics].sort((a, b) => (a.medido_em < b.medido_em ? -1 : 1))
  if (!dataInicio) return ordered
  const doCiclo = ordered.filter((m) => m.medido_em >= dataInicio)
  const baseline = ordered.filter((m) => m.medido_em < dataInicio).pop()
  return baseline ? [baseline, ...doCiclo] : doCiclo
}

/**
 * Projeção em semanas até atingir a meta, com base na variação média semanal observada
 * nas últimas medições. Retorna null se não há variação na direção certa (não converge).
 */
export function projectWeeksToGoal(metrics: BodyMetric[], metricKey: MetricKey, meta: number): number | null {
  const valores = metrics
    .map((m) => ({ data: m.medido_em, valor: m[metricKey] }))
    .filter((v): v is { data: string; valor: number } => v.valor !== null)
    .sort((a, b) => (a.data < b.data ? -1 : 1))

  if (valores.length < 2) return null

  const primeiro = valores[0]
  const ultimo = valores[valores.length - 1]
  const semanasDecorridas = diffInDays(primeiro.data, ultimo.data) / 7
  if (semanasDecorridas <= 0) return null

  const variacaoSemanal = (ultimo.valor - primeiro.valor) / semanasDecorridas
  const distanciaRestante = meta - ultimo.valor

  if (variacaoSemanal === 0) return null
  // Direção da variação precisa coincidir com a direção necessária para chegar à meta.
  if (Math.sign(variacaoSemanal) !== Math.sign(distanciaRestante)) return null

  return Math.ceil(distanciaRestante / variacaoSemanal)
}
