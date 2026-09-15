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
import { MetricCard } from '@/components/ds/metric-card'
import { MetricHero } from '@/components/ds/metric-hero'
import { Sparkline } from '@/components/ds/sparkline'
import type { StatusDotColor } from '@/components/ds/status-dot'
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

const STATUS_COMPOSICAO: Record<'ok' | 'atencao' | 'alerta' | 'neutro', { cor: StatusDotColor; label: string; tom: 'ok' | 'brasa' | 'alerta' | 'nevoa'; linha: string }> = {
  ok: { cor: 'ok', label: 'No alvo', tom: 'ok', linha: 'var(--ok)' },
  atencao: { cor: 'brasa', label: 'Atenção', tom: 'brasa', linha: 'var(--brasa)' },
  alerta: { cor: 'alerta', label: 'Fora', tom: 'alerta', linha: 'var(--alerta-texto)' },
  neutro: { cor: 'cinza', label: 'Sem meta', tom: 'nevoa', linha: 'var(--cinza)' },
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

      <header className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div className="flex flex-col gap-1">
          <span className="ds-label whitespace-pre">
            <span className="text-cinza2-texto">03</span>  Composição corporal
          </span>
          <h1 className="ds-h1 text-nevoa">Corpo</h1>
        </div>
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
            className="flex flex-col gap-5 rounded-[var(--r-xl)] border border-linha p-5"
            style={{ background: 'radial-gradient(90% 70% at 50% 0%, rgba(252,76,19,0.14) 0%, transparent 70%), var(--fundo)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-linha bg-aco ds-h4 text-brasa"
                aria-hidden="true"
              >
                {iniciais}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="ds-body-md truncate font-semibold text-foreground">{nomePerfil ?? 'Você'}</span>
                <span className="ds-terminal-xs text-cinza">
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
                size="xl"
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
                className="ds-btn-primary w-full outline-none"
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
              <span className="ds-label">Composição · {cards.length} métricas</span>
              <div className="grid grid-cols-2 gap-2">
                {cards.map((c, i) => {
                  const semanas =
                    c.meta != null && PROJETAVEIS.has(c.key)
                      ? projectWeeksToGoal(janelaCiclo, c.key as MetricKey, c.meta)
                      : null
                  const rodape =
                    c.meta != null
                      ? `meta ${br(c.meta)}${c.unit === '%' ? '%' : c.unit ? ` ${c.unit}` : ''}${semanas != null ? ` · ~${semanas} sem` : ''}`
                      : null
                  const status = STATUS_COMPOSICAO[c.status]
                  const Icone = ICONES[c.key]
                  return (
                    <MetricCard
                      key={c.key}
                      numOrdem={i + 1}
                      label={c.label}
                      numero={br(c.valor)}
                      unidade={c.unit}
                      size="sm"
                      tone={status.tom}
                      aside={
                        c.tendencia.length > 1 ? (
                          <Sparkline data={c.tendencia} width={60} color={status.linha} label={`Evolução de ${c.label}`} />
                        ) : (
                          <Icone className="size-5 text-cinza2" aria-hidden="true" />
                        )
                      }
                      footer={
                        c.progressoMeta != null || rodape ? (
                          <div className="flex flex-col gap-1.5">
                            {c.progressoMeta != null && (
                              <div className="h-1 w-full overflow-hidden rounded-full bg-aco2">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, c.progressoMeta))}%`,
                                    backgroundColor: status.linha,
                                    transition: 'width var(--dur-slow) var(--spring-smooth)',
                                  }}
                                />
                              </div>
                            )}
                            {rodape && <span className="truncate text-[11px] text-cinza [font-family:var(--font-display)]">{rodape}</span>}
                          </div>
                        ) : undefined
                      }
                      statusLabel={status.label}
                      statusColor={status.cor}
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
            <section className="flex flex-col gap-3 rounded-[var(--r-md)] border border-linha bg-aco p-4">
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
              <ul className="flex flex-col divide-y divide-linha rounded-[var(--r-md)] border border-linha bg-aco">
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
                        className="flex size-11 items-center justify-center rounded-full text-aco-texto outline-none hover:text-alerta-texto focus-visible:ring-2 focus-visible:ring-ring"
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
