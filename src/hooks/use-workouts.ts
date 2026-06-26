import { createCrudHooks } from '@/lib/crud-factory'
import type { Workout } from '@/types/database'

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
})

export const useWorkouts = workoutsCrud.useList
export const useCreateWorkout = workoutsCrud.useCreate
export const useUpdateWorkout = workoutsCrud.useUpdate
export const useDeleteWorkout = workoutsCrud.useDelete
