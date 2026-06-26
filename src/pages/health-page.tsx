import { useMemo } from 'react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { HealthMetricCard } from '@/components/health/health-metric-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHealthMetricDefs } from '@/hooks/use-health-metric-defs'
import { groupHealthMetricsByKey, useHealthMetrics } from '@/hooks/use-health-metrics'

export function HealthPage() {
  const defs = useHealthMetricDefs()
  const metrics = useHealthMetrics()

  const isLoading = defs.isLoading || metrics.isLoading
  const isError = defs.isError || metrics.isError
  const metricsByKey = useMemo(() => groupHealthMetricsByKey(metrics.data), [metrics.data])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Saúde</h1>
        <p className="text-sm text-aco-texto">Placar dos marcadores, medições e histórico.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os marcadores de saúde."
          onRetry={() => {
            defs.refetch()
            metrics.refetch()
          }}
        />
      ) : !defs.data || defs.data.length === 0 ? (
        <EmptyState message="Nenhum marcador de saúde cadastrado ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {defs.data.map((def) => (
            <HealthMetricCard key={def.id} def={def} metrics={metricsByKey.get(def.chave) ?? []} />
          ))}
        </div>
      )}
    </div>
  )
}
