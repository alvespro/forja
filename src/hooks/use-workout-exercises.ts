import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { faseDe } from '@/lib/workout-phases'
import type { WorkoutExercise, WorkoutFase } from '@/types/database'

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
  reps_min: number | null
  reps_max: number | null
  pausa_alvo_seg: number | null
  cadencia_alvo: string | null
  notas: string | null
  fase: WorkoutFase
  observacao: string | null
  tempo_seg: number | null
}

/** Campos editáveis de uma prescrição existente (ex: para trocar só a ordem). */
export function inputDaPrescricao(p: WorkoutExercise): WorkoutExerciseInput {
  return {
    workout_id: p.workout_id,
    exercise_id: p.exercise_id,
    ordem: p.ordem,
    series_alvo: p.series_alvo,
    reps_alvo: p.reps_alvo,
    reps_min: p.reps_min,
    reps_max: p.reps_max,
    pausa_alvo_seg: p.pausa_alvo_seg,
    cadencia_alvo: p.cadencia_alvo,
    notas: p.notas,
    fase: faseDe(p.fase),
    observacao: p.observacao,
    tempo_seg: p.tempo_seg,
  }
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

/** Grava a nova ordem (1..n) só das prescrições que mudaram de posição. */
export function useReordenarPrescricoes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ mudancas }: { workoutId: string; mudancas: { id: string; ordem: number }[] }) => {
      for (const { id, ordem } of mudancas) {
        const { error } = await supabase.from('workout_exercises').update({ ordem }).eq('id', id)
        if (error) throw error
      }
    },
    onSettled: (_data, _error, { workoutId }) => queryClient.invalidateQueries({ queryKey: ['workout-exercises', workoutId] }),
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
