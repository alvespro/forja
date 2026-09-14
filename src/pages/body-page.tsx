import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BicepsFlexed,
  Bone,
  Droplets,
  Egg,
  Flame,
  Gauge,
  HeartPulse,
  Hourglass,
  Layers,
  Plus,
  Scale,
  Trash2,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { HealthMetricCard } from '@/components/ds/health-metric-card'
import { MetricHero } from '@/components/ds/metric-hero'
import { Skeleton } from '@/components/ui/skeleton'
import { BodyMetricForm } from '@/components/body/body-metric-form'
import { BodyMetricsChart } from '@/components/body/body-metrics-chart'
import { ObjectiveBadge } from '@/components/body/objective-badge'
import { ObjectiveCard } from '@/components/body/objective-card'
import { ProgressPhotosCard } from '@/components/body/progress-photos-card'
import { WeightProjectionCard } from '@/components/body/weight-projection-card'
import { RecompForecastCard } from '@/components/health/clinical-analysis'
import { useActiveBodyGoal } from '@/hooks/use-body-goals'
import { type BodyMetricInput, useBodyMetrics, useCreateBodyMetric, useDeleteBodyMetric } from '@/hooks/use-body-metrics'
import { useConfirm } from '@/hooks/use-confirm'
import { useActiveDietPlan } from '@/hooks/use-diet-plan'
import { useHealthCalc } from '@/hooks/useHealthCalc'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/hooks/use-auth'
import { buildCompositionCards, type CompositionKey } from '@/lib/body-composition'
import { metricsForCycle, projectWeeksToGoal, type MetricKey } from '@/lib/body-goals'
import { parseDateOnly } from '@/lib/date'

const ICONES: Record<CompositionKey, LucideIcon> = {
  peso_kg: Scale,
  gordura_pct: Flame,
  musculo_pct: BicepsFlexed,
  agua_pct: Droplets,
  gordura_visceral: HeartPulse,
  imc: Gauge,
  proteina_pct: Egg,
  peso_muscular_kg: BicepsFlexed,
  gordura_subcutanea_pct: Layers,
  tmb_kcal: Zap,
  massa_ossea_kg: Bone,
  idade_corporal: Hourglass,
}

/** Métricas que têm projeção "no ritmo atual" (as mesmas que aceitam meta de ciclo). */
const PROJETAVEIS = new Set<string>(['peso_kg', 'gordura_pct', 'musculo_pct', 'agua_pct', 'gordura_visceral', 'imc'])

const br = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

export function BodyPage() {
  const metrics = useBodyMetrics()
  const goal = useActiveBodyGoal()
  const profile = useProfile()
  const { user } = useAuth()
  const createMetric = useCreateBodyMetric()
  const deleteMetric = useDeleteBodyMetric()
  const { confirm, dialog } = useConfirm()
  const [isAdding, setIsAdding] = useState(false)
  const dietPlan = useActiveDietPlan()
  const { calcRecompForecast } = useHealthCalc()

  /** Pesagem confirmada com % de gordura + plano ativo → atualiza a previsão de recomposição. */
  function atualizarPrevisao(values: BodyMetricInput) {
    const plano = dietPlan.data
    if (values.peso_kg == null || values.gordura_pct == null || !plano?.calorias_alvo || !plano.proteina_g) return
    calcRecompForecast({
      weight: values.peso_kg,
      bodyFatPct: values.gordura_pct,
      calories: Number(plano.calorias_alvo),
      proteinG: Number(plano.proteina_g),
    })
      .then((r) => toast.success(`Previsão atualizada: ${r.probabilidade}% de chance de recomposição em ${r.semanas} semanas`))
      .catch(() => toast.error('Não foi possível atualizar a previsão de recomposição.'))
  }

  const lista = useMemo(() => metrics.data ?? [], [metrics.data])
  const ordered = useMemo(() => [...lista].reverse(), [lista])
  const latest = lista.length > 0 ? lista[lista.length - 1] : null

  // Pesagem anterior com peso registrado, para a variação do herói.
  const anteriorComPeso = useMemo(() => {
    for (let i = lista.length - 2; i >= 0; i--) if (lista[i].peso_kg != null) return lista[i]
    return null
  }, [lista])

  const cards = useMemo(() => buildCompositionCards(lista, goal.data), [lista, goal.data])
  const janelaCiclo = useMemo(
    () => (goal.data ? metricsForCycle(lista, goal.data.cycle.data_inicio) : lista),
    [lista, goal.data],
  )

  // `||`, não `??`: o nome no perfil pode ser string vazia, não só null.
  const nomePerfil = profile.data?.nome?.trim() || null
  // Iniciais do nome; sem nome, só a parte do e-mail antes do @ (senão "gmail" vira inicial).
  const iniciais = (nomePerfil || user?.email?.split('@')[0] || '?')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  const pesoAtual = latest?.peso_kg != null ? Number(latest.peso_kg) : null
  const pesoAnterior = anteriorComPeso?.peso_kg != null ? Number(anteriorComPeso.peso_kg) : null
  const metaPeso = goal.data?.peso_meta_kg != null ? Number(goal.data.peso_meta_kg) : null
  const delta = pesoAtual != null && pesoAnterior != null ? pesoAtual - pesoAnterior : null

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Excluir esta medição?', description: 'Essa ação não pode ser desfeita.' })
    if (!ok) return
    deleteMetric.mutate(id)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {dialog}

      <header className="flex items-start justify-between gap-3">
        <h1 className="ds-h1 text-foreground">Corpo</h1>
        <ObjectiveBadge />
      </header>

      {metrics.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-44 w-full rounded-[var(--radius-xl)]" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-[var(--radius-lg)]" />
            ))}
          </div>
        </div>
      ) : metrics.isError ? (
        <ErrorState message="Não foi possível carregar as medições." onRetry={() => metrics.refetch()} />
      ) : (
        <>
          {/* HERO: última pesagem como número dominante */}
          <section
            className="flex flex-col gap-5 rounded-[var(--radius-xl)] p-5"
            style={{ background: 'radial-gradient(120% 90% at 100% 0%, rgba(95,168,140,0.14) 0%, transparent 55%), var(--aco)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-aco-claro ds-h4 text-brasa"
                aria-hidden="true"
              >
                {iniciais}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="ds-body-md truncate font-semibold text-foreground">{nomePerfil ?? 'Você'}</span>
                <span className="ds-data-md text-aco-texto">
                  {latest
                    ? `Última pesagem: ${format(parseDateOnly(latest.medido_em), 'EEEEEE, dd/MM', { locale: ptBR })}`
                    : 'Nenhuma pesagem ainda'}
                </span>
              </div>
            </div>

            {pesoAtual != null ? (
              <MetricHero
                label="Peso"
                value={br(pesoAtual)}
                unit="kg"
                size="lg"
                tone="foreground"
                delta={
                  delta != null && anteriorComPeso
                    ? {
                        value: `${delta > 0 ? '+' : delta < 0 ? '−' : '='}${br(Math.abs(delta))} kg vs ${format(parseDateOnly(anteriorComPeso.medido_em), 'dd/MM')}`,
                        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
                        // "Bom" depende da meta: acima da meta, subir é ruim.
                        good: metaPeso == null || delta === 0 ? undefined : pesoAtual > metaPeso ? delta < 0 : delta > 0,
                      }
                    : { value: 'primeira pesagem', direction: 'flat' }
                }
              />
            ) : (
              <p className="ds-body-md text-aco-texto">Registre a primeira medição para acompanhar sua composição.</p>
            )}

            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="ds-pressable flex min-h-12 items-center justify-center gap-2 rounded-full bg-brasa px-5 ds-body-md font-semibold text-meia-noite outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nova medição
              </button>
            )}
          </section>

          {isAdding && (
            <BodyMetricForm
              isSubmitting={createMetric.isPending}
              onCancel={() => setIsAdding(false)}
              onSubmit={(values) =>
                createMetric.mutate(values, {
                  onSuccess: () => {
                    setIsAdding(false)
                    atualizarPrevisao(values)
                  },
                })
              }
            />
          )}

          {/* GRADE DE MÉTRICAS */}
          {cards.length > 0 && (
            <section className="flex flex-col gap-3">
              <span className="ds-label">Composição</span>
              <div className="grid grid-cols-2 gap-3">
                {cards.map((c) => {
                  const semanas =
                    c.meta != null && PROJETAVEIS.has(c.key)
                      ? projectWeeksToGoal(janelaCiclo, c.key as MetricKey, c.meta)
                      : null
                  const rodape =
                    c.meta != null
                      ? `meta ${br(c.meta)}${c.unit === '%' ? '%' : c.unit ? ` ${c.unit}` : ''}${semanas != null ? ` · ~${semanas} sem` : ''}`
                      : null
                  return (
                    <HealthMetricCard
                      key={c.key}
                      icon={ICONES[c.key]}
                      label={c.label}
                      value={br(c.valor)}
                      unit={c.unit}
                      status={c.status}
                      tendencia={c.tendencia.length > 1 ? c.tendencia : undefined}
                      progressoMeta={c.progressoMeta}
                      rodape={rodape}
                    />
                  )
                })}
              </div>
            </section>
          )}

          <WeightProjectionCard pesoAtual={latest?.peso_kg ?? null} metrics={lista} />
          <RecompForecastCard />

          <ObjectiveCard />
          <ProgressPhotosCard pesoAtual={latest?.peso_kg} />

          {ordered.length > 0 && (
            <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
              <span className="ds-label">Evolução</span>
              <BodyMetricsChart metrics={ordered} />
            </section>
          )}

          {/* HISTÓRICO */}
          {ordered.length === 0 ? (
            !isAdding && <EmptyState message="Nenhuma medição ainda" description="A primeira pesagem é a base de todas as projeções." />
          ) : (
            <section className="flex flex-col gap-2">
              <span className="ds-label">Histórico</span>
              <ul className="flex flex-col divide-y divide-linha rounded-[var(--radius-lg)] bg-card">
                {ordered.map((metric) => (
                  <li key={metric.id} className="flex min-h-14 items-center justify-between gap-2 pl-4 pr-1">
                    <span className="ds-data-md text-aco-texto">
                      {format(parseDateOnly(metric.medido_em), "d 'de' MMM", { locale: ptBR })}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="ds-data-lg text-foreground">
                        {metric.peso_kg != null ? `${br(Number(metric.peso_kg))} kg` : '—'}
                      </span>
                      <span className="ds-data-md w-12 text-right text-aco-texto">
                        {metric.gordura_pct != null ? `${br(Number(metric.gordura_pct))}%` : '—'}
                      </span>
                      <button
                        type="button"
                        aria-label={`Excluir medição de ${format(parseDateOnly(metric.medido_em), 'dd/MM')}`}
                        onClick={() => handleDelete(metric.id)}
                        className="flex size-11 items-center justify-center rounded-full text-aco-texto outline-none hover:text-alerta focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
