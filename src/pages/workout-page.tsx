import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { CardioTab } from '@/components/workout/cardio-tab'
import { EvolutionTab } from '@/components/workout/evolution-tab'
import { ExerciseLibrary } from '@/components/workout/exercise-library'
import { FrequencyPanel } from '@/components/workout/frequency-panel'
import { SessionRunner } from '@/components/workout/session-runner'
import { WorkoutBuilder } from '@/components/workout/workout-builder'
import { cn } from '@/lib/utils'

type WorkoutTab = 'visao_geral' | 'exercicios' | 'treinos' | 'sessao' | 'evolucao' | 'cardio'

const TABS: { id: WorkoutTab; label: string }[] = [
  { id: 'visao_geral', label: 'Visão geral' },
  { id: 'exercicios', label: 'Exercícios' },
  { id: 'treinos', label: 'Treinos' },
  { id: 'sessao', label: 'Sessão' },
  { id: 'evolucao', label: 'Evolução' },
  { id: 'cardio', label: 'Cardio' },
]

export function WorkoutPage() {
  const [tab, setTab] = useState<WorkoutTab>('visao_geral')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Treino</h1>
        <p className="text-sm text-aco-texto">Execução, registro e evolução de carga.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-2" role="tablist" aria-label="Seções de treino">
        {TABS.map((item) => (
          <Button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            variant={tab === item.id ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(tab === item.id && 'text-foreground')}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === 'visao_geral' && <FrequencyPanel />}
      {tab === 'exercicios' && <ExerciseLibrary />}
      {tab === 'treinos' && <WorkoutBuilder />}
      {tab === 'sessao' && <SessionRunner />}
      {tab === 'evolucao' && <EvolutionTab />}
      {tab === 'cardio' && <CardioTab />}
    </div>
  )
}
