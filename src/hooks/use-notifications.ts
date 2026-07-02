import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/database'

import { useAuth } from './use-auth'

/** Notificações não lidas, mais recentes primeiro. */
export function useNotifications(limit = 10) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('lida', false)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Notification[]
    },
    enabled: !!user,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ lida: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
