import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { DietPlan, MealSlot, MealSlotTipo } from '@/types/database'

/** Plano de dieta ativo do usuário (Fase 4.5 — Nutrição). Projeto assume um único plano ativo por vez. */
export function useActiveDietPlan() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['diet-plans', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as DietPlan | null
    },
    enabled: !!user,
  })
}

/** Os 6 slots de refeição do plano informado, em ordem (1 a 6). */
export function useMealSlots(dietPlanId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['meal-slots', dietPlanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_slots')
        .select('*')
        .eq('diet_plan_id', dietPlanId as string)
        .order('numero', { ascending: true })
      if (error) throw error
      return data as MealSlot[]
    },
    enabled: !!user && !!dietPlanId,
  })
}

/** O banco aceita no máximo 6 refeições por plano (meal_slots.numero entre 1 e 6). */
export const MAX_REFEICOES = 6

export type PlanoInput = { nome: string; calorias_alvo: number | null; proteina_g: number | null; carbo_g: number | null; gordura_g: number | null }

/** Edita as metas do plano ativo; sem plano, cria um já ativo. */
export function useSalvarPlano() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: PlanoInput }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = id
        ? await supabase.from('diet_plans').update(values).eq('id', id)
        : await supabase.from('diet_plans').insert({ ...values, user_id: user.id, ativo: true })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diet-plans'] }),
  })
}

export type RefeicaoInput = {
  nome: string
  horario_alvo: string | null
  tipo: MealSlotTipo | null
  calorias_alvo: number | null
  proteina_g_alvo: number | null
  carbo_g_alvo: number | null
  gordura_g_alvo: number | null
}

/** Nova refeição no fim do plano (número = maior + 1). */
export function useCriarRefeicao() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ dietPlanId, values }: { dietPlanId: string; values: RefeicaoInput }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { data: ultima } = await supabase
        .from('meal_slots')
        .select('numero')
        .eq('diet_plan_id', dietPlanId)
        .order('numero', { ascending: false })
        .limit(1)
        .maybeSingle()
      const numero = (ultima?.numero ?? 0) + 1
      if (numero > MAX_REFEICOES) throw new Error(`O plano já tem ${MAX_REFEICOES} refeições, o máximo permitido.`)
      const { error } = await supabase.from('meal_slots').insert({ ...values, numero, diet_plan_id: dietPlanId, user_id: user.id })
      if (error) throw error
    },
    onSuccess: (_d, { dietPlanId }) => queryClient.invalidateQueries({ queryKey: ['meal-slots', dietPlanId] }),
  })
}

export function useAtualizarRefeicao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; dietPlanId: string; values: RefeicaoInput }) => {
      const { error } = await supabase.from('meal_slots').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { dietPlanId }) => queryClient.invalidateQueries({ queryKey: ['meal-slots', dietPlanId] }),
  })
}

/**
 * Exclui a refeição (e as sugestões dela, em cascata). Com alimentos já registrados
 * o banco recusa — o histórico não pode perder a refeição; a mensagem explica.
 */
export function useExcluirRefeicao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; dietPlanId: string }) => {
      const { count, error: erroContagem } = await supabase.from('meal_logs').select('id', { count: 'exact', head: true }).eq('meal_slot_id', id)
      if (erroContagem) throw erroContagem
      if (count && count > 0) {
        throw new Error(`Esta refeição tem ${count} ${count === 1 ? 'alimento registrado' : 'alimentos registrados'} no histórico e não pode ser excluída. Edite o nome ou as metas.`)
      }
      const { error } = await supabase.from('meal_slots').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { dietPlanId }) => queryClient.invalidateQueries({ queryKey: ['meal-slots', dietPlanId] }),
  })
}
