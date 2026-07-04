import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { useActiveCycle } from '@/hooks/use-active-cycle'
import { useCardioSessions } from '@/hooks/use-cardio-sessions'
import { useGoals } from '@/hooks/use-goals'
import { groupLogsByHabit, useHabitLogs, useHabits } from '@/hooks/use-habits'
import { groupKeyResultsByGoal, useKeyResults } from '@/hooks/use-key-results'
import { useRecentFocusSessions } from '@/hooks/use-focus-sessions'
import { useJournalHistory } from '@/hooks/use-journal-history'
import { useTasks } from '@/hooks/use-tasks'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { currentIsoWeekDates } from '@/lib/date'
import { filterFocusSessionsByDates, sumFocusMinutes } from '@/lib/focus-sessions'
import { calculateGoalProgress } from '@/lib/goal-progress'
import { computeAverageMood, computeHabitsWeeklyScore } from '@/lib/weekly-score'
import { CORRIDA_WEEKLY_GOAL, countCardioThisWeek, countSessionsThisWeek, FORCA_WEEKLY_GOAL } from '@/lib/workout-frequency'

const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

/** Placar da semana: hábitos, treino, cardio, foco, humor — e o PLANO (tarefas, sapos, metas). */
export function WeeklyScoreCard() {
  const habits = useHabits()
  const logs = useHabitLogs()
  const workoutSessions = useWorkoutSessions()
  const cardioSessions = useCardioSessions()
  const focusSessions = useRecentFocusSessions()
  const journalHistory = useJournalHistory()
  const tasks = useTasks()
  const activeCycle = useActiveCycle()
  const goals = useGoals(activeCycle.data?.id ?? '')
  const keyResults = useKeyResults()

  const isLoading =
    habits.isLoading ||
    logs.isLoading ||
    workoutSessions.isLoading ||
    cardioSessions.isLoading ||
    focusSessions.isLoading ||
    journalHistory.isLoading

  const isError =
    habits.isError ||
    logs.isError ||
    workoutSessions.isError ||
    cardioSessions.isError ||
    focusSessions.isError ||
    journalHistory.isError

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Placar da semana</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Placar da semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            message="Não foi possível carregar o placar da semana."
            onRetry={() => {
              habits.refetch()
              logs.refetch()
              workoutSessions.refetch()
              cardioSessions.refetch()
              focusSessions.refetch()
              journalHistory.refetch()
            }}
          />
        </CardContent>
      </Card>
    )
  }

  const logsByHabit = groupLogsByHabit(logs.data)
  const habitsScore = computeHabitsWeeklyScore(habits.data ?? [], logsByHabit)
  const humorMedio = computeAverageMood(journalHistory.data ?? [])

  const sessionsThisWeek = countSessionsThisWeek(workoutSessions.data ?? [])
  const cardioThisWeek = countCardioThisWeek(cardioSessions.data ?? [])

  const weekDates = currentIsoWeekDates()
  const focusSessionsThisWeek = filterFocusSessionsByDates(focusSessions.data ?? [], weekDates)
  const focusMinutesThisWeek = sumFocusMinutes(focusSessionsThisWeek)

  // ── O plano da semana: tarefas, sapos e metas do ciclo ──
  const weekSet = new Set(weekDates)
  const tarefasSemana = (tasks.data ?? []).filter((t) => weekSet.has(t.data))
  const tarefasFeitas = tarefasSemana.filter((t) => t.status === 'feito').length
  const saposEngolidos = tarefasSemana.filter((t) => t.e_frog && t.status === 'feito').length
  const saposDefinidos = tarefasSemana.filter((t) => t.e_frog).length

  const krsPorMeta = groupKeyResultsByGoal(keyResults.data)
  const metasAtivas = (goals.data ?? []).filter((g) => g.status === 'ativo')
  const progressoMedioMetas =
    metasAtivas.length > 0
      ? Math.round(
          metasAtivas.reduce((s, g) => s + calculateGoalProgress(g, krsPorMeta.get(g.id) ?? []), 0) /
            metasAtivas.length,
        )
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Placar da semana</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Hábitos</span>
            <span className="font-mono text-aco-texto">
              {habitsScore.percent}% ({habitsScore.concluidos}/{habitsScore.possiveis})
            </span>
          </div>
          <Progress value={habitsScore.percent} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Treino (força)</span>
            <span className="font-mono text-aco-texto">
              {sessionsThisWeek}/{FORCA_WEEKLY_GOAL}
            </span>
          </div>
          <Progress value={Math.min(100, (sessionsThisWeek / FORCA_WEEKLY_GOAL) * 100)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Corrida / cardio</span>
            <span className="font-mono text-aco-texto">
              {cardioThisWeek}/{CORRIDA_WEEKLY_GOAL}
            </span>
          </div>
          <Progress value={Math.min(100, (cardioThisWeek / CORRIDA_WEEKLY_GOAL) * 100)} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Foco (pomodoros)</span>
          <span className="font-mono text-aco-texto">
            {focusSessionsThisWeek.length} sessão(ões) · {focusMinutesThisWeek} min
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Humor médio</span>
          <span className="font-mono text-aco-texto">
            {humorMedio !== null ? `${MOOD_EMOJI[Math.round(humorMedio)] ?? ''} ${humorMedio}` : '—'}
          </span>
        </div>

        {/* O plano da semana — a revisão agora revisa o que foi planejado, não só o executado */}
        <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Tarefas concluídas</span>
            <span className="font-mono text-aco-texto">
              {tarefasFeitas}/{tarefasSemana.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Sapos engolidos 🐸</span>
            <span className="font-mono text-aco-texto">
              {saposEngolidos}/{saposDefinidos > 0 ? saposDefinidos : 7}
            </span>
          </div>
          {progressoMedioMetas !== null && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Metas do ciclo ({metasAtivas.length})</span>
                <span className="font-mono text-aco-texto">{progressoMedioMetas}%</span>
              </div>
              <Progress value={progressoMedioMetas} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
