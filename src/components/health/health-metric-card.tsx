import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { MetricCard } from '@/components/ds/metric-card'
import { Sparkline } from '@/components/ds/sparkline'
import type { StatusDotColor } from '@/components/ds/status-dot'
import { Button } from '@/components/ui/button'
import { HealthHistoryChart } from '@/components/health/health-history-chart'
import { MeasurementForm } from '@/components/health/measurement-form'
import { useCreateHealthMetric } from '@/hooks/use-health-metrics'
import { calculateHealthStatus, type HealthStatus } from '@/lib/health-status'
import { cn } from '@/lib/utils'
import type { HealthMetric, HealthMetricDef } from '@/types/database'

const STATUS: Record<HealthStatus, { cor: StatusDotColor; label: string; tom: 'ok' | 'brasa' | 'nevoa' }> = {
  ok: { cor: 'ok', label: 'No alvo', tom: 'ok' },
  atencao: { cor: 'brasa', label: 'Atenção', tom: 'brasa' },
  sem_meta: { cor: 'cinza', label: 'Sem meta', tom: 'nevoa' },
}

const br = (n: number) => String(n).replace('.', ',')

type TileProps = {
  def: HealthMetricDef
  metrics: HealthMetric[]
  numOrdem: number
  selecionado: boolean
  onSelect: () => void
}

/** Marcador de saúde como MetricCard: número em Space Mono, sparkline da evolução e ponto de status. */
export function HealthMetricTile({ def, metrics, numOrdem, selecionado, onSelect }: TileProps) {
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null
  const status = STATUS[calculateHealthStatus(def, latest?.valor ?? null)]
  const serie = metrics.slice(-8).map((m) => m.valor)
  const meta = def.valor_meta !== null && def.direcao ? `${def.direcao === 'menor_melhor' ? '≤' : '≥'} ${br(def.valor_meta)}` : null

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded={selecionado}
      aria-label={`${def.label}: ${latest ? `${br(latest.valor)} ${def.unidade ?? ''}` : 'sem medição'} — ${status.label}`}
      className="ds-pressable-card block rounded-[var(--r-md)] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <MetricCard
        className={cn('h-full', selecionado && 'border-brasa')}
        numOrdem={numOrdem}
        label={def.label}
        numero={latest ? br(latest.valor) : null}
        unidade={def.unidade ?? undefined}
        size="sm"
        tone={status.tom}
        aside={serie.length >= 2 ? <Sparkline data={serie} width={64} color={status.cor === 'ok' ? 'var(--ok)' : 'var(--brasa)'} label={`Evolução de ${def.label}`} /> : undefined}
        footer={meta ? <span className="text-[11px] tabular-nums text-cinza [font-family:var(--font-display)]">meta {meta}</span> : undefined}
        statusLabel={status.label}
        statusColor={status.cor}
      />
    </button>
  )
}

type DetailProps = {
  def: HealthMetricDef
  metrics: HealthMetric[]
  onClose: () => void
}

/** Painel do marcador escolhido (largura total, logo abaixo da linha do card): histórico e nova medição. */
export function HealthMetricDetail({ def, metrics, onClose }: DetailProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const createMetric = useCreateHealthMetric()

  return (
    <section className="col-span-2 flex flex-col gap-3 rounded-[var(--r-md)] border border-brasa/50 bg-aco p-4" aria-label={`Histórico de ${def.label}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="ds-label text-nevoa">{def.label}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar histórico"
          className="-m-2 flex size-11 items-center justify-center rounded-full text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <HealthHistoryChart metrics={metrics} unidade={def.unidade} />

      {isRegistering ? (
        <MeasurementForm
          unidade={def.unidade}
          isSubmitting={createMetric.isPending}
          onCancel={() => setIsRegistering(false)}
          onSubmit={(values) =>
            createMetric.mutate({ chave: def.chave, ...values }, { onSuccess: () => setIsRegistering(false) })
          }
        />
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setIsRegistering(true)}>
          <Icon name="add" size={14} />
          Registrar medição
        </Button>
      )}
    </section>
  )
}
