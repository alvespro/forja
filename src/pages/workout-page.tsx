import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Icon } from '@/components/Icon'
import { CardioTab } from '@/components/workout/cardio-tab'
import { EvolutionTab } from '@/components/workout/evolution-tab'
import { ExerciseLibrary } from '@/components/workout/exercise-library'
import { MobilityRoutines } from '@/components/mobility/mobility-routines'
import { FrequencyPanel } from '@/components/workout/frequency-panel'
import { SessionRunner } from '@/components/workout/session-runner'
import { TodayWorkoutHero } from '@/components/workout/today-workout-hero'
import { WorkoutBuilder } from '@/components/workout/workout-builder'
import { useActiveSession } from '@/hooks/use-active-session'
import { useCardioSessions } from '@/hooks/use-cardio-sessions'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import type { IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import {
  CORRIDA_WEEKLY_GOAL,
  countCardioThisWeek,
  countSessionsThisWeek,
  FORCA_WEEKLY_GOAL,
} from '@/lib/workout-frequency'

type WorkoutTab = 'visao_geral' | 'exercicios' | 'treinos' | 'sessao' | 'evolucao' | 'cardio' | 'mobilidade'

// Treinos primeiro: a ação principal da tela é começar um treino. Mobilidade e
// cardio logo ao lado — são as outras duas formas de "treinar" do dia.
const TABS: { id: WorkoutTab; label: string; icon: IconName }[] = [
  { id: 'treinos', label: 'Meus Treinos', icon: 'fitness_center' },
  { id: 'mobilidade', label: 'Mobilidade', icon: 'self_improvement' },
  { id: 'cardio', label: 'Cardio', icon: 'directions_run' },
  { id: 'exercicios', label: 'Exercícios', icon: 'accessibility_new' },
  { id: 'visao_geral', label: 'Corpo', icon: 'monitor_heart' },
  { id: 'sessao', label: 'Sessão', icon: 'timer' },
  { id: 'evolucao', label: 'Evolução', icon: 'trending_up' },
]

export function WorkoutPage() {
  const { sessionId } = useActiveSession()
  const location = useLocation()
  const initialTab = (location.state as { initialTab?: WorkoutTab } | null)?.initialTab
  const [tab, setTab] = useState<WorkoutTab>(initialTab ?? (sessionId ? 'sessao' : 'treinos'))

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="ds-h1 text-foreground">Treino</h1>
        <WeeklyFrequencyPills />
      </header>

      {tab !== 'sessao' && <TodayWorkoutHero onStart={() => setTab('sessao')} />}

      <div
        className="ds-scroll -mx-4 flex gap-1 overflow-x-auto border-b border-linha px-4 md:mx-0 md:px-0"
        role="tablist"
        aria-label="Seções de treino"
      >
        {TABS.map((item) => {
          const ativo = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setTab(item.id)}
              className={cn(
                'relative flex min-h-11 shrink-0 items-center gap-1.5 px-3 ds-body-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                ativo ? 'text-nevoa' : 'text-cinza hover:text-nevoa',
              )}
            >
              <Icon name={item.icon} size={18} filled={ativo} className={ativo ? 'text-brasa' : undefined} />
              {item.label}
              {sessionId && item.id === 'sessao' && (
                <span className="ml-1.5 size-1.5 rounded-full bg-brasa ds-pulse" aria-label="sessão em andamento" />
              )}
              <span
                className={cn('absolute inset-x-3 -bottom-px h-0.5 rounded-full', ativo ? 'bg-brasa' : 'bg-transparent')}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>

      {tab === 'visao_geral' && <FrequencyPanel />}
      {tab === 'exercicios' && <ExerciseLibrary />}
      {tab === 'treinos' && <WorkoutBuilder onStartSession={() => setTab('sessao')} />}
      {tab === 'sessao' && <SessionRunner />}
      {tab === 'evolucao' && <EvolutionTab />}
      {tab === 'cardio' && <CardioTab />}
      {tab === 'mobilidade' && <MobilityRoutines />}
    </div>
  )
}

/** Frequência da semana em duas pílulas compactas: força e cardio vs. meta. */
function WeeklyFrequencyPills() {
  const sessions = useWorkoutSessions()
  const cardio = useCardioSessions()

  const forca = countSessionsThisWeek(sessions.data ?? [])
  const corrida = countCardioThisWeek(cardio.data ?? [])

  const pills = [
    { icon: 'fitness_center' as IconName, valor: forca, meta: FORCA_WEEKLY_GOAL, label: 'força' },
    { icon: 'directions_run' as IconName, valor: corrida, meta: CORRIDA_WEEKLY_GOAL, label: 'cardio' },
  ]

  return (
    <div className="flex flex-wrap gap-2" aria-label="Frequência desta semana">
      {pills.map((p) => {
        const batida = p.valor >= p.meta
        return (
          <span
            key={p.label}
            className={cn(
              'flex min-h-9 items-center gap-1.5 rounded-full border px-3 ds-body-sm',
              batida ? 'border-ok/40 bg-ok/10 text-ok' : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-cinza',
            )}
          >
            <Icon name={p.icon} size={16} />
            <span className="ds-data-md text-foreground">
              {p.valor}/{p.meta}
            </span>
            {p.label}
          </span>
        )
      })}
    </div>
  )
}
