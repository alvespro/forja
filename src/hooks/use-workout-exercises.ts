import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { WorkoutExercise } from '@/types/database'

import { useAuth } from './use-auth'

export function useWorkoutExercises(workoutId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workout-exercises', workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('ordem')
      if (error) throw error
      return data as WorkoutExercise[]
    },
    enabled: !!user && !!workoutId,
  })
}

/** Prescrições que incluem este exercício, em qualquer treino — usado na Evolução (Seção 6.5). */
export function useWorkoutExercisesByExercise(exerciseId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workout-exercises', 'by-exercise', exerciseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('exercise_id', exerciseId)
      if (error) throw error
      return data as WorkoutExercise[]
    },
    enabled: !!user && !!exerciseId,
  })
}

export type WorkoutExerciseInput = {
  workout_id: string
  exercise_id: string
  ordem: number
  series_alvo: number | null
  reps_alvo: string | null
  pausa_alvo_seg: number | null
  cadencia_alvo: string | null
  notas: string | null
}

export function useCreateWorkoutExercise() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: WorkoutExerciseInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('workout_exercises').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: (_data, values) =>
      queryClient.invalidateQueries({ queryKey: ['workout-exercises', values.workout_id] }),
  })
}

export function useUpdateWorkoutExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: WorkoutExerciseInput }) => {
      const { error } = await supabase.from('workout_exercises').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { values }) =>
      queryClient.invalidateQueries({ queryKey: ['workout-exercises', values.workout_id] }),
  })
}

export function useDeleteWorkoutExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; workoutId: string }) => {
      const { error } = await supabase.from('workout_exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workoutId }) =>
      queryClient.invalidateQueries({ queryKey: ['workout-exercises', workoutId] }),
  })
}
