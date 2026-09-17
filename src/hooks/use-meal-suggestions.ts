import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { MealSuggestion, MealSuggestionIngrediente } from '@/types/database'

export function useMealSuggestions(mealSlotId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['meal-suggestions', mealSlotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_suggestions')
        .select('*')
        .eq('meal_slot_id', mealSlotId as string)
        .eq('ativa', true)
        .order('created_at', { ascending: true })
        .limit(3)
      if (error) throw error
      return data as MealSuggestion[]
    },
    enabled: !!user && !!mealSlotId,
  })
}

/** Todas as sugestões ativas da refeição (a lista do card; o modal de IA mostra só as 3 primeiras). */
export function useSugestoesDaRefeicao(mealSlotId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['meal-suggestions', mealSlotId, 'todas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_suggestions')
        .select('*')
        .eq('meal_slot_id', mealSlotId as string)
        .eq('ativa', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as MealSuggestion[]
    },
    enabled: !!user && !!mealSlotId,
  })
}

export type SugestaoManualInput = {
  nome: string
  descricao: string | null
  calorias: number | null
  proteina_g: number | null
  carbo_g: number | null
  gordura_g: number | null
}

export function useCriarSugestaoManual() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ mealSlotId, values }: { mealSlotId: string; values: SugestaoManualInput }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase
        .from('meal_suggestions')
        .insert({ ...values, meal_slot_id: mealSlotId, user_id: user.id, origem: 'manual', ativa: true })
      if (error) throw error
    },
    onSuccess: (_d, { mealSlotId }) => queryClient.invalidateQueries({ queryKey: ['meal-suggestions', mealSlotId] }),
  })
}

export function useAtualizarSugestao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; mealSlotId: string; values: SugestaoManualInput }) => {
      const { error } = await supabase.from('meal_suggestions').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { mealSlotId }) => queryClient.invalidateQueries({ queryKey: ['meal-suggestions', mealSlotId] }),
  })
}

/** Soft delete: ativa = false (some das listas, fica no banco). */
export function useRemoverSugestao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; mealSlotId: string }) => {
      const { error } = await supabase.from('meal_suggestions').update({ ativa: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { mealSlotId }) => queryClient.invalidateQueries({ queryKey: ['meal-suggestions', mealSlotId] }),
  })
}

export type MealSuggestionInput = {
  meal_slot_id: string
  nome: string
  descricao: string | null
  calorias: number | null
  proteina_g: number | null
  carbo_g: number | null
  gordura_g: number | null
  ingredientes: MealSuggestionIngrediente[] | null
}

export function useUpdateMealSuggestionIngredientes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      mealSlotId,
      ingredientes,
    }: {
      id: string
      mealSlotId: string
      ingredientes: MealSuggestionIngrediente[]
    }) => {
      const { error } = await supabase.from('meal_suggestions').update({ ingredientes }).eq('id', id)
      if (error) throw error
      return mealSlotId
    },
    onSuccess: (mealSlotId) => queryClient.invalidateQueries({ queryKey: ['meal-suggestions', mealSlotId] }),
  })
}

export function useCreateMealSuggestion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: MealSuggestionInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase
        .from('meal_suggestions')
        .insert({ ...values, user_id: user.id, origem: 'ia' })
      if (error) throw error
    },
    onSuccess: (_data, values) =>
      queryClient.invalidateQueries({ queryKey: ['meal-suggestions', values.meal_slot_id] }),
  })
}
