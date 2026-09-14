import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Moon } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ClinicalAnalysisSection } from '@/components/health/clinical-analysis'
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

      <Link
        to="/sono"
        className="ds-pressable-card flex min-h-16 items-center gap-3 rounded-[var(--radius-lg)] bg-card px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-aco-claro text-brasa" aria-hidden="true">
          <Moon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="ds-body-md font-semibold text-foreground">Sono</span>
          <span className="ds-body-sm text-aco-texto">Histórico, dívida da semana e recuperação</span>
        </span>
        <ChevronRight className="size-5 text-aco-texto" aria-hidden="true" />
      </Link>

      <ClinicalAnalysisSection />
    </div>
  )
}
