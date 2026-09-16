import { createCrudHooks } from '@/lib/crud-factory'
import type { Workout } from '@/types/database'

export const WORKOUT_VERSAO_ATUAL = 2

export type WorkoutInput = {
  nome: string
  foco: string | null
  ordem: number
  ativo: boolean
}

const workoutsCrud = createCrudHooks<Workout, WorkoutInput>({
  table: 'workouts',
  queryKey: 'workouts',
  orderBy: { column: 'ordem' },
  // Só a estrutura v2 ativa; treinos antigos ficam arquivados no banco.
  filter: (query) => query.eq('versao', WORKOUT_VERSAO_ATUAL).eq('arquivado', false),
  // Treino criado pelo app já nasce v2 (o default da coluna é 1 e ele sumiria da lista).
  insertDefaults: { versao: WORKOUT_VERSAO_ATUAL, arquivado: false },
})

export const useWorkouts = workoutsCrud.useList
export const useCreateWorkout = workoutsCrud.useCreate
export const useUpdateWorkout = workoutsCrud.useUpdate
export const useDeleteWorkout = workoutsCrud.useDelete
