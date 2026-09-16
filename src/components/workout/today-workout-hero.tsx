import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { StatusDot } from '@/components/ds/status-dot'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveSession } from '@/hooks/use-active-session'
import { useCreateWorkoutSession, useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import { todayInSaoPaulo, toSaoPauloDateString } from '@/lib/date'
import { diasDesde } from '@/lib/today-grid'
import { pickTodaysWorkout } from '@/lib/workout-rotation'

const DIAS_ALERTA = 7

/** Hero da tela de Treino (Aaru): o treino da rotação de hoje, há quantos dias foi feito e o botão de iniciar. */
export function TodayWorkoutHero({ onStart }: { onStart: () => void }) {
  const workouts = useWorkouts()
  const sessions = useWorkoutSessions()
  const { sessionId, setSessionId } = useActiveSession()
  const criar = useCreateWorkoutSession()

  if (workouts.isLoading || sessions.isLoading) return <Skeleton className="h-44 w-full rounded-[var(--r-lg)]" />

  const ativos = (workouts.data ?? []).filter((w) => w.ativo)
  const proximo = pickTodaysWorkout(ativos, sessions.data?.[0]?.workout_id ?? null)
  if (!proximo) return null

  const ultima = (sessions.data ?? []).find((s) => s.workout_id === proximo.id && s.performed_at)
  const dias = ultima ? diasDesde(toSaoPauloDateString(ultima.performed_at), todayInSaoPaulo()) : null
  const atrasado = dias != null && dias > DIAS_ALERTA

  function iniciar() {
    if (sessionId) {
      onStart()
      return
    }
    criar.mutate(proximo!.id, {
      onSuccess: (session) => {
        setSessionId(session.id)
        onStart()
      },
    })
  }

  return (
    <GlassCard gradient className="flex flex-col gap-4" padding="var(--s5)" aria-label="Treino de hoje">
      <div className="flex items-center gap-3">
        <Icon name="fitness_center" size={32} className="text-brasa" />
        <span className="ds-label">Treino de hoje</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[24px] font-bold leading-tight tracking-[-0.01em] text-nevoa">{proximo.nome}</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {proximo.foco && <span className="text-[13px] text-cinza">{proximo.foco}</span>}
          <span className="text-[12px] tabular-nums text-cinza2-texto [font-family:var(--font-display)]">
            {sessionId ? 'em andamento' : dias == null ? 'nunca feito' : dias === 0 ? 'feito hoje' : `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
          </span>
          {atrasado && !sessionId && <StatusDot color="alerta" pulse label="Atrasado" colorLabel />}
        </div>
      </div>
      <button type="button" onClick={iniciar} disabled={criar.isPending} className="ds-btn-primary min-h-12 w-full text-[15px]">
        <Icon name="play_arrow" size={22} filled />
        {sessionId ? 'Continuar treino' : criar.isPending ? 'Iniciando…' : 'Iniciar'}
      </button>
    </GlassCard>
  )
}
