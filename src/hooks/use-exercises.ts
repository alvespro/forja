import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/types/database'

import { useAuth } from './use-auth'

export function useExercises() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('nome')
      if (error) throw error
      return data as Exercise[]
    },
    enabled: !!user,
  })
}

export type ExerciseInput = {
  nome: string
  grupo_muscular: string | null
  youtube_video_id: string | null
  cues: string | null
  cadencia_padrao: string | null
}

export function useCreateExercise() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ExerciseInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('exercises').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useUpdateExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ExerciseInput }) => {
      const { error } = await supabase.from('exercises').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useDeleteExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  })
}
