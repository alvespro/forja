import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'

import { EcgLine } from '@/components/ds/ecg-line'
import { MetricCard } from '@/components/ds/metric-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ClinicalAnalysisSection } from '@/components/health/clinical-analysis'
import { ErrorState } from '@/components/feedback/error-state'
import { HealthMetricDetail, HealthMetricTile } from '@/components/health/health-metric-card'
import { PlacarSaude } from '@/components/health/placar-saude'
import { Skeleton } from '@/components/ui/skeleton'
import { useHealthMetricDefs } from '@/hooks/use-health-metric-defs'
import { groupHealthMetricsByKey, useHealthMetrics } from '@/hooks/use-health-metrics'
import { useHeartZones } from '@/hooks/use-heart-zones'
import { MARCADORES } from '@/lib/health-markers'

export function HealthPage() {
  const defs = useHealthMetricDefs()
  const metrics = useHealthMetrics()
  const { zones } = useHeartZones()
  const [selecionado, setSelecionado] = useState<string | null>(null)

  const isLoading = defs.isLoading || metrics.isLoading
  const isError = defs.isError || metrics.isError
  const metricsByKey = useMemo(() => groupHealthMetricsByKey(metrics.data), [metrics.data])

  // Marcadores de exame vão para o placar agrupado; o resto (peso, corrida…) segue no grid simples.
  const lista = (defs.data ?? []).filter((d) => !MARCADORES[d.chave])
  const temExames = (metrics.data ?? []).some((m) => MARCADORES[m.chave])
  const indiceSelecionado = lista.findIndex((d) => d.id === selecionado)
  // O painel entra no fim da linha do card escolhido (grade de 2 colunas).
  const fimDaLinha = indiceSelecionado >= 0 ? indiceSelecionado | 1 : -1

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="ds-label whitespace-pre">
          <span className="text-cinza2-texto">04</span>  Saúde interna
        </span>
        <h1 className="ds-h1 text-nevoa">Saúde</h1>
        <p className="ds-body-sm text-cinza">Placar dos marcadores, medições e histórico.</p>
      </header>

      {/* FC de repouso: só com zonas Karvonen calculadas (valor informado, não leitura ao vivo). */}
      {zones.metodo === 'karvonen' && zones.fcRepouso != null && (
        <MetricCard
          label="HR · FC de repouso"
          numero={zones.fcRepouso}
          unidade="bpm"
          size="md"
          footer={<EcgLine />}
          statusLabel="Base das zonas Karvonen"
          statusColor="ok"
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} shape="card" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os marcadores de saúde."
          onRetry={() => {
            defs.refetch()
            metrics.refetch()
          }}
        />
      ) : lista.length === 0 && !temExames ? (
        <EmptyState message="Nenhum marcador de saúde cadastrado ainda." />
      ) : (
        <>
          <PlacarSaude metrics={metrics.data ?? []} defs={defs.data ?? []} metricsByKey={metricsByKey} />
          {lista.length > 0 && (
            <section className="flex flex-col gap-2" aria-labelledby="grupo-outros">
              <h2 id="grupo-outros" className="ds-label !text-nevoa">
                Outros marcadores
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {lista.map((def, i) => {
                  const aberto = selecionado != null && i === Math.min(fimDaLinha, lista.length - 1)
                  const escolhido = lista[indiceSelecionado]
                  return (
                    <Fragment key={def.id}>
                      <HealthMetricTile
                        def={def}
                        metrics={metricsByKey.get(def.chave) ?? []}
                        numOrdem={i + 1}
                        selecionado={def.id === selecionado}
                        onSelect={() => setSelecionado((atual) => (atual === def.id ? null : def.id))}
                      />
                      {aberto && escolhido && (
                        <HealthMetricDetail
                          key={escolhido.id}
                          def={escolhido}
                          metrics={metricsByKey.get(escolhido.chave) ?? []}
                          onClose={() => setSelecionado(null)}
                        />
                      )}
                    </Fragment>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      <Link
        to="/sono"
        className="ds-pressable-card flex min-h-16 items-center gap-3 rounded-[var(--r-md)] border border-linha bg-aco px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-linha bg-fundo text-brasa" aria-hidden="true">
          <Icon name="bedtime" size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="ds-body-md font-semibold text-nevoa">Sono</span>
          <span className="ds-body-sm text-cinza">Histórico, dívida da semana e recuperação</span>
        </span>
        <Icon name="chevron_right" size={20} className="text-cinza" />
      </Link>

      <ClinicalAnalysisSection />
    </div>
  )
}
