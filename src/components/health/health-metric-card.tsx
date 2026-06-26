import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HealthHistoryChart } from '@/components/health/health-history-chart'
import { MeasurementForm } from '@/components/health/measurement-form'
import { useCreateHealthMetric } from '@/hooks/use-health-metrics'
import { calculateHealthStatus } from '@/lib/health-status'
import { cn } from '@/lib/utils'
import type { HealthMetric, HealthMetricDef } from '@/types/database'

const STATUS_DOT_CLASS = {
  ok: 'bg-ok',
  atencao: 'bg-atencao',
  sem_meta: 'bg-aco-texto',
} as const

const STATUS_TEXT_CLASS = {
  ok: 'text-ok',
  atencao: 'text-atencao',
  sem_meta: 'text-aco-texto',
} as const

type HealthMetricCardProps = {
  def: HealthMetricDef
  metrics: HealthMetric[]
}

export function HealthMetricCard({ def, metrics }: HealthMetricCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const createMetric = useCreateHealthMetric()
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null
  const status = calculateHealthStatus(def, latest?.valor ?? null)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-start gap-2 text-left"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('mt-0.5 size-4 shrink-0 text-aco-texto transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{def.label}</span>
              {def.valor_meta !== null && def.direcao && (
                <span className="text-xs text-aco-texto">
                  Meta: {def.direcao === 'menor_melhor' ? '≤' : '≥'} {def.valor_meta} {def.unidade}
                </span>
              )}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={cn('size-2 rounded-full', STATUS_DOT_CLASS[status])}
              aria-hidden="true"
            />
            <span className={cn('font-mono text-lg', STATUS_TEXT_CLASS[status])}>
              {latest ? latest.valor : '—'}
            </span>
            <span className="text-xs text-aco-texto">{def.unidade}</span>
          </div>
        </div>

        {expanded && (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <HealthHistoryChart metrics={metrics} unidade={def.unidade} />

            {isRegistering ? (
              <MeasurementForm
                unidade={def.unidade}
                isSubmitting={createMetric.isPending}
                onCancel={() => setIsRegistering(false)}
                onSubmit={(values) =>
                  createMetric.mutate(
                    { chave: def.chave, ...values },
                    { onSuccess: () => setIsRegistering(false) },
                  )
                }
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setIsRegistering(true)}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Registrar medição
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
