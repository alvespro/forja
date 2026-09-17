import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { createCrudHooks } from '@/lib/crud-factory'
import { supabase } from '@/lib/supabase'
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

export const CATEGORIAS_EXERCICIO = [
  { value: 'forca', label: 'Força' },
  { value: 'mobilidade', label: 'Mobilidade' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'alongamento', label: 'Alongamento' },
  { value: 'equilibrio', label: 'Equilíbrio' },
  { value: 'pliometria', label: 'Pliometria' },
  { value: 'reabilitacao', label: 'Reabilitação' },
] as const

export type NovoExercicioInput = { nome: string; grupo_muscular: string | null; equipamento: string | null; categoria: string | null }

/** "＋ Criar exercício" (não achou na busca): cadastro manual v2, devolve o registro. */
export function useCriarExercicio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: NovoExercicioInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { data, error } = await supabase
        .from('exercises')
        .insert({ ...values, user_id: user.id, fonte: 'manual', versao: 2 })
        .select('*')
        .single()
      if (error) throw error
      return data as Exercise
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  })
}
