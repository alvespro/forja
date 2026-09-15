import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Minus, Play } from 'lucide-react'

import { EcgLine } from '@/components/ds/ecg-line'
import { MacroBar } from '@/components/ds/macro-bar'
import { MetricCard } from '@/components/ds/metric-card'
import { Sparkline } from '@/components/ds/sparkline'
import { StatusDot } from '@/components/ds/status-dot'
import { useActiveSession } from '@/hooks/use-active-session'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useActiveDietPlan } from '@/hooks/use-diet-plan'
import { useMealLogsToday } from '@/hooks/use-meal-logs'
import { useRecoveryScores } from '@/hooks/use-sleep-logs'
import { useCreateWorkoutSession, useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import { diasDesde, statusRecuperacao } from '@/lib/today-grid'
import { todayInSaoPaulo, toSaoPauloDateString } from '@/lib/date'
import { cn } from '@/lib/utils'
import { pickTodaysWorkout } from '@/lib/workout-rotation'

const br = (n: number, casas = 1) => (Math.round(n * 10 ** casas) / 10 ** casas).toString().replace('.', ',')

const tile = 'ds-pressable-card block rounded-[var(--r-md)] outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** SECTION 5 do cockpit: grade 2×2 estilo DeerFlow — recuperação, nutrição, próximo treino e pesagem. */
export function TodayGrid() {
  return (
    <section className="grid grid-cols-2 gap-2" aria-label="Painel do dia">
      <RecoveryTile />
      <NutritionTile />
      <NextWorkoutTile />
      <WeighInTile />
    </section>
  )
}

function RecoveryTile() {
  const hoje = todayInSaoPaulo()
  const scores = useRecoveryScores(14)
  const [, setParams] = useSearchParams()

  const lista = scores.data ?? []
  const deHoje = lista.find((s) => s.data === hoje) ?? null
  const status = deHoje?.score != null ? statusRecuperacao(deHoje.score) : null
  const serie = [...lista]
    .sort((a, b) => a.data.localeCompare(b.data))
    .flatMap((s) => (s.score != null ? [s.score] : []))

  return (
    <button
      type="button"
      onClick={() =>
        setParams(
          (p) => {
            p.set('recuperacao', 'editar')
            return p
          },
          { replace: true },
        )
      }
      aria-label={deHoje ? `Recuperação ${deHoje.score}% — ajustar sono e disposição` : 'Informar sono e disposição'}
      className={cn(tile, 'text-left')}
    >
      <MetricCard
        className="h-full"
        numOrdem={4}
        label="Recovery"
        numero={deHoje?.score ?? null}
        unidade="%"
        tone={status?.tom ?? 'nevoa'}
        aside={serie.length >= 2 ? <Sparkline data={serie.slice(-7)} width={56} label="Recuperação nos últimos dias" /> : undefined}
        footer={<EcgLine />}
        statusLabel={status?.label ?? 'Informe o sono'}
        statusColor={status?.cor ?? 'cinza'}
        statusPulse={status?.cor === 'alerta'}
      />
    </button>
  )
}

function NutritionTile() {
  const plan = useActiveDietPlan()
  const logs = useMealLogsToday()

  const consumido = useMemo(
    () =>
      (logs.data ?? []).reduce(
        (acc, l) => ({
          kcal: acc.kcal + (l.calorias ?? 0),
          p: acc.p + (l.proteina_g ?? 0),
          c: acc.c + (l.carbo_g ?? 0),
          g: acc.g + (l.gordura_g ?? 0),
        }),
        { kcal: 0, p: 0, c: 0, g: 0 },
      ),
    [logs.data],
  )
  const p = plan.data
  const registrou = (logs.data ?? []).length > 0

  return (
    <Link to="/nutricao" className={tile} aria-label="Nutrição do dia">
      <MetricCard
        className="h-full"
        numOrdem={5}
        label="Nutrição"
        numero={registrou || p ? Math.round(consumido.kcal) : null}
        unidade={p?.calorias_alvo ? `/${p.calorias_alvo}` : 'kcal'}
        footer={
          p ? (
            <MacroBar
              compact
              proteina={{ atual: consumido.p, meta: p.proteina_g ?? 0 }}
              carbo={{ atual: consumido.c, meta: p.carbo_g ?? 0 }}
              gordura={{ atual: consumido.g, meta: p.gordura_g ?? 0 }}
            />
          ) : undefined
        }
        statusLabel={p ? `${Math.round(consumido.p)}/${p.proteina_g ?? '—'}g prot` : registrou ? 'Sem plano ativo' : 'Nada registrado'}
        statusColor={p && p.proteina_g && consumido.p >= p.proteina_g ? 'ok' : 'cinza'}
      />
    </Link>
  )
}

function NextWorkoutTile() {
  const navigate = useNavigate()
  const workouts = useWorkouts()
  const sessions = useWorkoutSessions()
  const { sessionId, setSessionId } = useActiveSession()
  const criar = useCreateWorkoutSession()

  const ativos = (workouts.data ?? []).filter((w) => w.ativo)
  const proximo = pickTodaysWorkout(ativos, sessions.data?.[0]?.workout_id ?? null)
  const ultima = proximo ? (sessions.data ?? []).find((s) => s.workout_id === proximo.id && s.performed_at) : null
  const dias = ultima ? diasDesde(toSaoPauloDateString(ultima.performed_at), todayInSaoPaulo()) : null
  const atrasado = dias != null && dias > 7

  function iniciar() {
    if (sessionId) {
      navigate('/workout')
      return
    }
    if (!proximo) return
    criar.mutate(proximo.id, {
      onSuccess: (session) => {
        setSessionId(session.id)
        navigate('/workout')
      },
    })
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-3 rounded-[var(--r-md)] border border-linha bg-aco p-3', !proximo && 'ds-dots')}>
      <span className="ds-terminal-xs flex gap-2 text-cinza">
        <span className="text-cinza2-texto" aria-hidden="true">06</span>
        Próximo treino
      </span>

      {proximo ? (
        <>
          <Link to="/workout" className="line-clamp-2 min-h-11 text-[17px] font-bold leading-tight text-nevoa outline-none focus-visible:underline">
            {proximo.nome}
          </Link>
          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[12px] text-cinza [font-family:var(--font-display)]">
                {sessionId ? 'em andamento' : dias == null ? 'nunca feito' : dias === 0 ? 'hoje' : `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
              </span>
              {atrasado && <StatusDot color="alerta" pulse label="Atrasado" colorLabel />}
            </div>
            <button
              type="button"
              onClick={iniciar}
              disabled={criar.isPending}
              aria-label={sessionId ? 'Continuar treino' : `Iniciar ${proximo.nome}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brasa text-fundo shadow-[var(--shadow-brasa)] outline-none transition-transform active:scale-95 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-aco"
            >
              <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="text-[26px] font-bold leading-none text-cinza2-texto [font-family:var(--font-display)]">—</span>
          <Link to="/workout" className="ds-terminal-sm mt-auto text-brasa outline-none focus-visible:underline">
            Criar treino →
          </Link>
        </>
      )}
    </div>
  )
}

function WeighInTile() {
  const metrics = useBodyMetrics()
  const pesagens = (metrics.data ?? []).filter((m) => m.peso_kg != null)
  const ultima = pesagens.at(-1) ?? null
  const anterior = pesagens.at(-2) ?? null
  const delta = ultima && anterior ? (ultima.peso_kg ?? 0) - (anterior.peso_kg ?? 0) : null
  const dias = ultima ? diasDesde(ultima.medido_em, todayInSaoPaulo()) : null
  const Seta = delta == null || Math.abs(delta) < 0.05 ? Minus : delta < 0 ? ArrowDown : ArrowUp

  return (
    <Link to="/body" className={tile} aria-label="Pesagem">
      <MetricCard
        className="h-full"
        numOrdem={7}
        label="Pesagem"
        numero={ultima?.peso_kg != null ? br(ultima.peso_kg) : null}
        unidade="kg"
        aside={pesagens.length >= 2 ? <Sparkline data={pesagens.slice(-8).map((m) => m.peso_kg ?? 0)} width={56} label="Últimas pesagens" /> : undefined}
        footer={
          delta != null ? (
            <span className="flex items-center gap-1 whitespace-nowrap text-[13px] tabular-nums text-nevoa [font-family:var(--font-display)]" title="vs pesagem anterior">
              <Seta className="size-3.5 text-brasa" aria-hidden="true" />
              {delta > 0 ? '+' : delta < 0 ? '−' : ''}
              {br(Math.abs(delta))} kg
            </span>
          ) : undefined
        }
        statusLabel={dias == null ? 'Sem pesagem' : dias === 0 ? 'Pesou hoje' : `Há ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
        statusColor={dias == null || dias > 7 ? 'brasa' : 'ok'}
        statusPulse={dias != null && dias > 7}
      />
    </Link>
  )
}
