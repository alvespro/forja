import { useMemo, useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { DecimalValue } from '@/components/ds/metric-hero'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useActiveDietPlan } from '@/hooks/use-diet-plan'
import { useLatestDerived } from '@/hooks/use-health-derived'
import { useHealthMetrics } from '@/hooks/use-health-metrics'
import { useHealthCalc } from '@/hooks/useHealthCalc'
import { homaInputsFrom, latestMarkers, lipidInputsFrom } from '@/lib/clinical-inputs'
import type { Ratio, RecompForecast, StatusRatio } from '@/lib/health-calc'
import { cn } from '@/lib/utils'
import type { RiscoClinico } from '@/types/database'

const br = (n: number, casas = 1) => String(Math.round(n * 10 ** casas) / 10 ** casas).replace('.', ',')
const fixo = (n: number, casas = 1) => n.toFixed(casas).replace('.', ',')
const comSinal = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${br(Math.abs(n))}`

const RISCO_STYLE: Record<RiscoClinico, { classe: string; label: string }> = {
  baixo: { classe: 'bg-ok/15 text-ok', label: 'Risco baixo' },
  intermediario: { classe: 'bg-atencao/15 text-atencao', label: 'Intermediário' },
  alto: { classe: 'bg-alerta/15 text-alerta-texto', label: 'Risco alto' },
  critico: { classe: 'bg-alerta text-meia-noite', label: 'Crítico' },
}

const STATUS_STYLE: Record<StatusRatio, { classe: string; label: string }> = {
  ok: { classe: 'bg-ok/15 text-ok', label: 'Ideal' },
  atencao: { classe: 'bg-atencao/15 text-atencao', label: 'Atenção' },
  alerta: { classe: 'bg-alerta/15 text-alerta-texto', label: 'Alto' },
}

function Pill({ classe, children }: { classe: string; children: ReactNode }) {
  return <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', classe)}>{children}</span>
}

function CardShell({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
      <span className="ds-label">{titulo}</span>
      {children}
    </section>
  )
}

function Rodape({ calculadoEm, fonte }: { calculadoEm: string; fonte: unknown }) {
  return (
    <p className="ds-body-sm text-aco-texto">
      Calculado em {format(new Date(calculadoEm), 'dd/MM/yyyy')}
      {fonte === 'local' ? ' · cálculo local' : fonte === 'api' ? ' · Health Fitness API' : ''}
    </p>
  )
}

/** Hook de "calcular agora": estado de carregamento + toast de erro, igual para os três cards. */
function useAcao() {
  const [rodando, setRodando] = useState(false)
  async function executar(fn: () => Promise<unknown>, sucesso: string) {
    setRodando(true)
    try {
      await fn()
      toast.success(sucesso)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao calcular.')
    } finally {
      setRodando(false)
    }
  }
  return { rodando, executar }
}

function useUltimosMarcadores() {
  const metrics = useHealthMetrics()
  return useMemo(() => latestMarkers(metrics.data ?? []), [metrics.data])
}

// ───────────────────────────── HOMA-IR ─────────────────────────────

export function HomaIrCard() {
  const derived = useLatestDerived('homa_ir')
  const marcadores = useUltimosMarcadores()
  const { calcHOMAIR } = useHealthCalc()
  const { rodando, executar } = useAcao()
  const [verRecomendacoes, setVerRecomendacoes] = useState(false)

  const entradas = homaInputsFrom(marcadores)
  const d = derived.data
  const input = d?.dados_input as { glucose?: number; insulin?: number } | null

  const calcular = entradas && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 self-start"
      disabled={rodando}
      onClick={() => executar(() => calcHOMAIR(entradas.glicemia, entradas.insulina), '📊 HOMA-IR calculado')}
    >
      {rodando ? 'Calculando…' : d ? 'Recalcular com últimos exames' : 'Calcular com últimos exames'}
    </Button>
  )

  return (
    <CardShell titulo="HOMA-IR · resistência à insulina">
      {derived.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : d && d.valor != null ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="ds-display-sm text-[32px] text-foreground">
              <DecimalValue value={fixo(d.valor, 2)} />
            </span>
            {d.risco && <Pill classe={RISCO_STYLE[d.risco].classe}>{RISCO_STYLE[d.risco].label}</Pill>}
          </div>
          <p className="ds-body-md text-foreground">{d.interpretacao}</p>
          {input?.glucose != null && input.insulin != null && (
            <p className="ds-body-sm text-aco-texto">
              Calculado a partir de: Glicemia {br(input.glucose, 0)} mg/dL + Insulina {br(input.insulin)} µUI/mL
            </p>
          )}
          <Rodape calculadoEm={d.calculado_em} fonte={d.dados_output?.fonte} />

          {d.valor > 1.5 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setVerRecomendacoes((v) => !v)}
                aria-expanded={verRecomendacoes}
                className="flex min-h-11 items-center self-start ds-body-sm font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {verRecomendacoes ? 'Ocultar recomendações' : 'Ver recomendações'}
              </button>
              {verRecomendacoes && (
                <ul className="flex list-disc flex-col gap-1 pl-5 ds-body-sm text-foreground">
                  <li>Treino de força 3–4x por semana — músculo é o maior consumidor de glicose.</li>
                  <li>Cardio em Z2 (150 min/semana) e caminhada de 10 min após as refeições.</li>
                  <li>Fibras e proteína em toda refeição; menos açúcar e ultraprocessados.</li>
                  <li>Sono de 7–8h: uma noite ruim já piora a sensibilidade à insulina.</li>
                  <li>Leve este resultado ao seu médico no próximo retorno.</li>
                </ul>
              )}
            </div>
          )}
          {calcular}
        </>
      ) : (
        <>
          <p className="ds-body-sm text-aco-texto">
            {entradas
              ? `Últimos exames: glicemia ${br(entradas.glicemia, 0)} mg/dL e insulina ${br(entradas.insulina)} µUI/mL.`
              : 'Precisa de glicemia e insulina em jejum. Envie o exame pelo botão 📎 — o cálculo é automático.'}
          </p>
          {calcular}
        </>
      )}
    </CardShell>
  )
}

// ───────────────────────── Ratios lipídicos ─────────────────────────

function RatioCell({ label, ratio }: { label: string; ratio: Ratio | null | undefined }) {
  return (
    <div className="flex flex-col items-start gap-1 rounded-[var(--radius-md)] border border-linha p-3">
      <span className="ds-body-sm text-aco-texto">{label}</span>
      <span className="ds-data-lg text-foreground tabular-nums">{ratio ? <DecimalValue value={fixo(ratio.valor)} /> : '—'}</span>
      {ratio ? (
        <Pill classe={STATUS_STYLE[ratio.status].classe}>{STATUS_STYLE[ratio.status].label}</Pill>
      ) : (
        <span className="text-xs text-aco-texto">sem TG</span>
      )}
    </div>
  )
}

export function LipidRatiosCard() {
  const derived = useLatestDerived('cholesterol_ratio')
  const marcadores = useUltimosMarcadores()
  const { calcCholesterolRatio } = useHealthCalc()
  const { rodando, executar } = useAcao()

  const entradas = lipidInputsFrom(marcadores)
  const d = derived.data
  const out = d?.dados_output as { tc_hdl?: Ratio; ldl_hdl?: Ratio; tg_hdl?: Ratio | null; fonte?: string } | null
  const todosIdeais = out ? [out.tc_hdl, out.ldl_hdl, out.tg_hdl].every((r) => !r || r.status === 'ok') : false

  const calcular = entradas && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 self-start"
      disabled={rodando}
      onClick={() =>
        executar(
          () => calcCholesterolRatio(entradas.colesterol_total, entradas.hdl, entradas.ldl, entradas.triglicerides),
          '📊 Ratios lipídicos calculados',
        )
      }
    >
      {rodando ? 'Calculando…' : d ? 'Recalcular com últimos exames' : 'Calcular com últimos exames'}
    </Button>
  )

  return (
    <CardShell titulo="Ratios lipídicos">
      {derived.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : d && out ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <RatioCell label="TC/HDL" ratio={out.tc_hdl} />
            <RatioCell label="LDL/HDL" ratio={out.ldl_hdl} />
            <RatioCell label="TG/HDL" ratio={out.tg_hdl} />
          </div>
          <p className="ds-body-md text-foreground">{d.interpretacao}</p>
          {!todosIdeais && (
            <p className="ds-body-sm text-foreground">
              <span className="font-semibold">Para melhorar:</span> Ômega-3 3g/dia + cardio 3x{' '}
              <span className="text-aco-texto">(suplementação sempre alinhada com seu médico)</span>
            </p>
          )}
          <Rodape calculadoEm={d.calculado_em} fonte={out.fonte} />
          {calcular}
        </>
      ) : (
        <>
          <p className="ds-body-sm text-aco-texto">
            {entradas
              ? 'Colesterol total, HDL e LDL disponíveis nos últimos exames.'
              : 'Precisa de colesterol total, HDL e LDL (triglicerídeos opcional). Envie o exame pelo botão 📎.'}
          </p>
          {calcular}
        </>
      )}
    </CardShell>
  )
}

// ─────────────────────── Previsão de recomposição ───────────────────────

/** Entradas da previsão: última pesagem com % de gordura + plano alimentar ativo. */
function useRecompInputs() {
  const metrics = useBodyMetrics()
  const plan = useActiveDietPlan()

  return useMemo(() => {
    const ultima = [...(metrics.data ?? [])].reverse().find((m) => m.peso_kg != null && m.gordura_pct != null)
    const p = plan.data
    if (!ultima) return { entradas: null, faltando: 'uma pesagem com % de gordura' }
    if (!p?.calorias_alvo || !p.proteina_g) return { entradas: null, faltando: 'um plano alimentar ativo com calorias e proteína' }
    return {
      entradas: {
        weight: Number(ultima.peso_kg),
        bodyFatPct: Number(ultima.gordura_pct),
        calories: Number(p.calorias_alvo),
        proteinG: Number(p.proteina_g),
      },
      faltando: null,
    }
  }, [metrics.data, plan.data])
}

export function RecompForecastCard() {
  const derived = useLatestDerived('recomp_forecast')
  const { entradas, faltando } = useRecompInputs()
  const { calcRecompForecast } = useHealthCalc()
  const { rodando, executar } = useAcao()

  const d = derived.data
  const out = d?.dados_output as (RecompForecast & { fonte?: string }) | null

  const calcular = entradas && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 self-start"
      disabled={rodando}
      onClick={() => executar(() => calcRecompForecast(entradas), 'Previsão atualizada')}
    >
      {rodando ? 'Calculando…' : d ? 'Atualizar previsão' : 'Calcular previsão'}
    </Button>
  )

  return (
    <CardShell titulo="Previsão de recomposição">
      {derived.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : d && out ? (
        <>
          <p className="ds-body-md text-foreground">Em {out.semanas} semanas (no ritmo atual):</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col">
              <span className="ds-body-sm text-aco-texto">Gordura</span>
              <span className={cn('ds-data-lg tabular-nums', out.gordura_kg <= 0 ? 'text-ok' : 'text-atencao')}>
                {comSinal(out.gordura_kg)} kg
              </span>
            </div>
            <div className="flex flex-col">
              <span className="ds-body-sm text-aco-texto">Músculo</span>
              <span className={cn('ds-data-lg tabular-nums', out.musculo_kg > 0 ? 'text-ok' : 'text-aco-texto')}>
                {comSinal(out.musculo_kg)} kg
              </span>
            </div>
            <div className="flex flex-col">
              <span className="ds-body-sm text-aco-texto">Probabilidade</span>
              <span className="ds-data-lg text-brasa tabular-nums">{out.probabilidade}%</span>
            </div>
          </div>
          <p className="ds-body-sm text-foreground">
            <span className="font-semibold">Para aumentar:</span> {out.recomendacao}
          </p>
          <Rodape calculadoEm={d.calculado_em} fonte={out.fonte} />
          {calcular}
        </>
      ) : (
        <>
          <p className="ds-body-sm text-aco-texto">
            {entradas ? 'Pronto para estimar com a última pesagem e o plano ativo.' : `Precisa de ${faltando}.`}
          </p>
          {calcular}
        </>
      )}
    </CardShell>
  )
}

/** Placar de Saúde → Análise Clínica: cálculos derivados dos marcadores e da composição. */
export function ClinicalAnalysisSection() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="ds-h3 text-foreground">Análise Clínica</h2>
      <HomaIrCard />
      <LipidRatiosCard />
      <RecompForecastCard />
    </section>
  )
}
