import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

import { useAuth } from './use-auth'

export type Profile = {
  id: string
  nome: string | null
  onboarding_completo: boolean
  onboarding_step: number
}

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, onboarding_completo, onboarding_step')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
    enabled: !!user,
  })
}

export function useUpdateOnboarding() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: { onboarding_completo?: boolean; onboarding_step?: number }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('profiles').update(values).eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })
}
