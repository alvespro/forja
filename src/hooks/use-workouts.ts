import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { createCrudHooks } from '@/lib/crud-factory'
import { supabase } from '@/lib/supabase'
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

/** Dias da semana como estão gravados em workouts.dia_semana. */
export const DIAS_SEMANA = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
] as const

/** Um treino pelo id (inclusive arquivado) — tela de edição. */
export function useWorkout(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['workouts', 'detalhe', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('workouts').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Workout
    },
    enabled: !!user && !!id,
  })
}

export type TreinoDadosInput = { nome: string; dia_semana: string | null }

/** "＋ Novo treino": cria v2 no fim da rotação e devolve o registro (para abrir a edição). */
export function useCriarTreino() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nome, dia_semana }: TreinoDadosInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { data: ultimo } = await supabase
        .from('workouts')
        .select('ordem')
        .eq('versao', WORKOUT_VERSAO_ATUAL)
        .eq('arquivado', false)
        .order('ordem', { ascending: false })
        .limit(1)
        .maybeSingle()
      const { data, error } = await supabase
        .from('workouts')
        .insert({ user_id: user.id, nome, dia_semana, ordem: (ultimo?.ordem ?? 0) + 1, ativo: true, versao: WORKOUT_VERSAO_ATUAL, arquivado: false })
        .select('*')
        .single()
      if (error) throw error
      return data as Workout
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useAtualizarDadosTreino() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TreinoDadosInput }) => {
      const { error } = await supabase.from('workouts').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

/** Soft delete: o treino some da rotação, mas sessões e prescrições continuam no banco. */
export function useArquivarTreino() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workouts').update({ arquivado: true, arquivado_em: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  })
}
