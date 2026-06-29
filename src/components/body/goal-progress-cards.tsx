import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useActiveBodyGoal } from '@/hooks/use-body-goals'
import { goalProgressPct, METRIC_LABELS, METRIC_UNITS, projectWeeksToGoal, type MetricKey } from '@/lib/body-goals'
import type { BodyMetric } from '@/types/database'

const METRIC_KEYS: MetricKey[] = ['peso_kg', 'gordura_pct', 'musculo_pct', 'agua_pct', 'gordura_visceral', 'imc']
const GOAL_FIELD: Record<MetricKey, keyof NonNullable<ReturnType<typeof useActiveBodyGoal>['data']>> = {
  peso_kg: 'peso_meta_kg',
  gordura_pct: 'gordura_meta_pct',
  musculo_pct: 'musculo_pct_meta',
  agua_pct: 'agua_meta_pct',
  gordura_visceral: 'gordura_visceral_meta',
  imc: 'imc_meta',
}

type GoalProgressCardsProps = {
  metrics: BodyMetric[]
}

export function GoalProgressCards({ metrics }: GoalProgressCardsProps) {
  const activeGoal = useActiveBodyGoal()
  const goal = activeGoal.data
  if (!goal) return null

  const ordered = [...metrics].sort((a, b) => (a.medido_em < b.medido_em ? -1 : 1))
  const primeira = ordered[0]
  const ultima = ordered[ordered.length - 1]
  if (!primeira || !ultima) return null

  const cards = METRIC_KEYS.map((key) => {
    const meta = goal[GOAL_FIELD[key]] as number | null
    const valorInicial = primeira[key]
    const valorAtual = ultima[key]
    if (meta === null || valorInicial === null || valorAtual === null) return null

    const pct = goalProgressPct(valorInicial, valorAtual, meta)
    const falta = Math.abs(meta - valorAtual)
    const semanas = projectWeeksToGoal(metrics, key, meta)

    return { key, meta, valorAtual, pct, falta, semanas }
  }).filter((c): c is NonNullable<typeof c> => c !== null)

  if (cards.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.key} size="sm">
          <CardContent className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-aco-texto">{METRIC_LABELS[card.key]}</span>
              <span className="font-mono text-sm text-foreground">
                {card.valorAtual}
                {METRIC_UNITS[card.key]} → {card.meta}
                {METRIC_UNITS[card.key]}
              </span>
            </div>
            <Progress value={card.pct} />
            <div className="flex items-baseline justify-between font-mono text-xs text-aco-texto">
              <span>
                {card.pct.toFixed(0)}% atingido · faltam {card.falta.toFixed(1)}
                {METRIC_UNITS[card.key]}
              </span>
              <span>
                {card.semanas !== null
                  ? `no ritmo atual: ~${card.semanas} semana${card.semanas === 1 ? '' : 's'}`
                  : 'sem dados suficientes'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
