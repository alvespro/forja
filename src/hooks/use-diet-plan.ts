import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { DietPlan, MealSlot } from '@/types/database'

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
