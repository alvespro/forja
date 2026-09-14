import { useNavigate } from 'react-router-dom'
import { Dumbbell, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveSession } from '@/hooks/use-active-session'
import { useCreateWorkoutSession, useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import { pickTodaysWorkout } from '@/lib/workout-rotation'

export function WorkoutTodayCard() {
  const navigate = useNavigate()
  const workouts = useWorkouts()
  const sessions = useWorkoutSessions()
  const { sessionId, setSessionId } = useActiveSession()
  const createSession = useCreateWorkoutSession()

  if (workouts.isLoading || sessions.isLoading) {
    return <Skeleton className="h-20 w-full" />
  }
  if (workouts.isError || sessions.isError || !workouts.data) return null

  const activeWorkouts = workouts.data.filter((w) => w.ativo)
  if (activeWorkouts.length === 0) return null

  const lastWorkoutId = sessions.data?.[0]?.workout_id ?? null
  const proximoTreino = pickTodaysWorkout(activeWorkouts, lastWorkoutId)
  if (!proximoTreino) return null

  function handleIniciar() {
    if (sessionId) {
      navigate('/workout')
      return
    }
    createSession.mutate(proximoTreino!.id, {
      onSuccess: (session) => {
        setSessionId(session.id)
        navigate('/workout')
      },
    })
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Dumbbell className="size-5 shrink-0 text-brasa" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs text-aco-texto">Treino de hoje</span>
            <span className="font-medium text-foreground">{proximoTreino.nome}</span>
            {proximoTreino.foco && <span className="text-xs text-aco-texto">{proximoTreino.foco}</span>}
          </div>
        </div>
        <Button type="button" size="sm" disabled={createSession.isPending} onClick={handleIniciar}>
          <Play className="size-3.5" aria-hidden="true" />
          {sessionId ? 'Continuar' : createSession.isPending ? 'Iniciando…' : 'Iniciar agora'}
        </Button>
      </CardContent>
    </Card>
  )
}
