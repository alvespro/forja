import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

export type FoodSubstitutionInput = {
  food_id_original: string | null
  food_id_substituto: string | null
  motivo: string | null
  equivalencia_g: number | null
}

export function useCreateFoodSubstitution() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: FoodSubstitutionInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase
        .from('food_substitutions')
        .insert({ ...values, user_id: user.id, aprovado_ia: true })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['food-substitutions'] }),
  })
}
