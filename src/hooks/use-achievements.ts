import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

import { useAuth } from './use-auth'

export type PersistedAchievement = {
  id: string
  user_id: string
  key: string
  earned_at: string
}

/** Conquistas já desbloqueadas (definitivas — não regridem com a janela de scores). */
export function useAchievements() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('achievements').select('*')
      if (error) throw error
      return data as PersistedAchievement[]
    },
    enabled: !!user,
  })
}

/** Grava desbloqueios novos; duplicatas são ignoradas (unique user_id+key). */
export function usePersistAchievements() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    meta: { silent: true },
    mutationFn: async (keys: string[]) => {
      if (!user || keys.length === 0) return
      const { error } = await supabase
        .from('achievements')
        .upsert(
          keys.map((key) => ({ user_id: user.id, key })),
          { onConflict: 'user_id,key', ignoreDuplicates: true },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  })
}
