import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkoutCard } from '@/components/workout/workout-card'
import { TreinoDadosModal } from '@/components/workout/editor/treino-dados-modal'
import { useExercises } from '@/hooks/use-exercises'
import { useCriarTreino, useWorkouts } from '@/hooks/use-workouts'
import { mensagemDeErro } from '@/lib/feedback'

type WorkoutBuilderProps = {
  onStartSession?: () => void
}

export function WorkoutBuilder({ onStartSession }: WorkoutBuilderProps) {
  const workouts = useWorkouts()
  const exercises = useExercises()
  const criarTreino = useCriarTreino()
  const navigate = useNavigate()
  const [isAdding, setIsAdding] = useState(false)

  const isLoading = workouts.isLoading || exercises.isLoading
  const isError = workouts.isError || exercises.isError

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-aco-texto">Monte seus treinos e prescreva os exercícios de cada um.</p>
        <Button type="button" className="min-h-11 shrink-0" onClick={() => setIsAdding(true)}>
          <Icon name="add" size={18} />
          Novo treino
        </Button>
      </div>

      <TreinoDadosModal
        open={isAdding}
        titulo="Novo treino"
        salvando={criarTreino.isPending}
        rotuloSalvar="Criar e montar"
        onClose={() => setIsAdding(false)}
        onSalvar={(valores) =>
          criarTreino.mutate(valores, {
            onSuccess: (treino) => {
              toast.success(`${treino.nome} criado. Adicione os exercícios.`)
              setIsAdding(false)
              navigate(`/workout/editar/${treino.id}`)
            },
            onError: (e) => toast.error(mensagemDeErro(e, 'criar o treino')),
          })
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os treinos."
          onRetry={() => {
            workouts.refetch()
            exercises.refetch()
          }}
        />
      ) : !workouts.data || workouts.data.length === 0 ? (
        <EmptyState message="Nenhum treino cadastrado ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.data.map((workout, i) => (
            <WorkoutCard
              key={workout.id}
              numero={i + 1}
              workout={workout}
              exercises={exercises.data ?? []}
              onStartSession={onStartSession}
            />
          ))}
        </div>
      )}
    </div>
  )
}
