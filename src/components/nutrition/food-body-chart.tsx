import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent } from '@/components/ui/card'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useMealLogsRange } from '@/hooks/use-meal-logs'
import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import type { DietPlan } from '@/types/database'

const DIAS = 30

type FoodBodyChartProps = {
  plan: DietPlan | null | undefined
}

/**
 * O elo comida→resultado: kcal diárias consumidas (vs. meta do plano) e o
 * peso na mesma linha do tempo. É a base factual para ajustar a dieta —
 * antes, aderência e balança viviam em telas separadas sem cruzamento.
 */
export function FoodBodyChart({ plan }: FoodBodyChartProps) {
  const meals = useMealLogsRange(DIAS)
  const bodyMetrics = useBodyMetrics()
  const today = todayInSaoPaulo()

  const { data, diasComRegistro, mediaKcal, mediaProteina } = useMemo(() => {
    const kcalPorDia = new Map<string, number>()
    const proteinaPorDia = new Map<string, number>()
    for (const m of meals.data ?? []) {
      kcalPorDia.set(m.data, (kcalPorDia.get(m.data) ?? 0) + (m.calorias ?? 0))
      proteinaPorDia.set(m.data, (proteinaPorDia.get(m.data) ?? 0) + (m.proteina_g ?? 0))
    }
    const pesoPorDia = new Map((bodyMetrics.data ?? []).map((b) => [b.medido_em, b.peso_kg]))

    const rows = Array.from({ length: DIAS }, (_, i) => {
      const d = addDaysToDateString(today, -(DIAS - 1 - i))
      return {
        data: d.slice(5), // MM-DD
        kcal: kcalPorDia.get(d) || null,
        peso: pesoPorDia.get(d) ?? null,
      }
    })

    const comRegistro = [...kcalPorDia.values()].filter((v) => v > 0)
    const media = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0)

    return {
      data: rows,
      diasComRegistro: comRegistro.length,
      mediaKcal: media(comRegistro),
      mediaProteina: media([...proteinaPorDia.values()].filter((v) => v > 0)),
    }
  }, [meals.data, bodyMetrics.data, today])

  if (diasComRegistro < 3) return null

  const metaKcal = plan?.calorias_alvo ?? null
  const metaProteina = plan?.proteina_g ?? null

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">🍽️×⚖️ Comida × Corpo (30 dias)</p>
          <div className="flex gap-3 text-xs text-aco-texto">
            <span>
              kcal/dia: <span className="font-mono font-semibold text-foreground">{mediaKcal}</span>
              {metaKcal && <span className="text-cinza2-texto"> / {metaKcal}</span>}
            </span>
            <span>
              prot: <span className="font-mono font-semibold text-foreground">{mediaProteina}g</span>
              {metaProteina && <span className="text-cinza2-texto"> / {metaProteina}g</span>}
            </span>
            <span>
              registro: <span className="font-mono font-semibold text-foreground">{diasComRegistro}/{DIAS}d</span>
            </span>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -14, right: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="data" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} interval={6} />
              <YAxis
                yAxisId="kcal"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                domain={[0, 'auto']}
              />
              <YAxis
                yAxisId="peso"
                orientation="right"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              {metaKcal && (
                <ReferenceLine
                  yAxisId="kcal"
                  y={metaKcal}
                  stroke="#FC4C13"
                  strokeDasharray="4 3"
                  label={{ value: 'meta', fontSize: 9, fill: '#FC4C13' }}
                />
              )}
              <Line
                yAxisId="kcal"
                type="monotone"
                dataKey="kcal"
                stroke="#4CAF7D"
                dot={false}
                connectNulls
                name="kcal"
                strokeWidth={2}
              />
              <Line
                yAxisId="peso"
                type="monotone"
                dataKey="peso"
                stroke="#A7A7A7"
                dot={{ r: 2 }}
                connectNulls
                name="peso (kg)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-cinza2-texto">
          Verde: kcal consumidas (esq.) · Azul: peso (dir.) · Tracejado: meta do plano
        </p>
      </CardContent>
    </Card>
  )
}
