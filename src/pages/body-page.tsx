import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2 } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BodyMetricForm } from '@/components/body/body-metric-form'
import { useBodyMetrics, useCreateBodyMetric, useDeleteBodyMetric } from '@/hooks/use-body-metrics'
import { useConfirm } from '@/hooks/use-confirm'
import { parseDateOnly } from '@/lib/date'

export function BodyPage() {
  const metrics = useBodyMetrics()
  const createMetric = useCreateBodyMetric()
  const deleteMetric = useDeleteBodyMetric()
  const { confirm, dialog } = useConfirm()
  const [isAdding, setIsAdding] = useState(false)

  const latest = metrics.data && metrics.data.length > 0 ? metrics.data[metrics.data.length - 1] : null
  const ordered = metrics.data ? [...metrics.data].reverse() : []

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Excluir esta medição?', description: 'Essa ação não pode ser desfeita.' })
    if (!ok) return
    deleteMetric.mutate(id)
  }

  return (
    <div className="flex flex-col gap-4">
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Corpo</h1>
          <p className="text-sm text-aco-texto">Peso e composição corporal ao longo do tempo.</p>
        </div>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Nova medição
          </Button>
        )}
      </div>

      {latest && !metrics.isLoading && !metrics.isError && (
        <div className="grid grid-cols-2 gap-3">
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Peso atual</span>
              <span className="font-mono text-lg text-foreground">
                {latest.peso_kg !== null ? `${latest.peso_kg} kg` : '—'}
              </span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">% de gordura atual</span>
              <span className="font-mono text-lg text-foreground">
                {latest.gordura_pct !== null ? `${latest.gordura_pct}%` : '—'}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdding && (
        <BodyMetricForm
          isSubmitting={createMetric.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) => createMetric.mutate(values, { onSuccess: () => setIsAdding(false) })}
        />
      )}

      {metrics.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : metrics.isError ? (
        <ErrorState message="Não foi possível carregar as medições." onRetry={() => metrics.refetch()} />
      ) : ordered.length === 0 ? (
        !isAdding && <EmptyState message="Nenhuma medição registrada ainda." />
      ) : (
        <div className="flex flex-col gap-2">
          {ordered.map((metric) => (
            <Card key={metric.id} size="sm">
              <CardContent className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-aco-texto">
                  {format(parseDateOnly(metric.medido_em), "d 'de' MMMM", { locale: ptBR })}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm text-foreground">
                    {metric.peso_kg !== null ? `${metric.peso_kg}kg` : '—'}
                  </span>
                  <span className="font-mono text-sm text-aco-texto">
                    {metric.gordura_pct !== null ? `${metric.gordura_pct}%` : '—'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir medição"
                    onClick={() => handleDelete(metric.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
