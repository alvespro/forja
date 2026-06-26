import { createCrudHooks } from '@/lib/crud-factory'
import type { Exercise } from '@/types/database'

export type ExerciseInput = {
  nome: string
  grupo_muscular: string | null
  youtube_video_id: string | null
  cues: string | null
  cadencia_padrao: string | null
}

const exercisesCrud = createCrudHooks<Exercise, ExerciseInput>({
  table: 'exercises',
  queryKey: 'exercises',
  orderBy: { column: 'nome' },
})

export const useExercises = exercisesCrud.useList
export const useCreateExercise = exercisesCrud.useCreate
export const useUpdateExercise = exercisesCrud.useUpdate
export const useDeleteExercise = exercisesCrud.useDelete
