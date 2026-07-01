import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Skill } from '@/types/database'

import { useAuth } from './use-auth'

export type SkillInput = {
  dev_area_id: string | null
  nome: string
  nivel_atual?: number | null
  nivel_meta?: number | null
  tipo?: string | null
  evidencias?: string | null
  proximos_passos?: string | null
  ordem?: number | null
}

export function useSkills(devAreaId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['skills', devAreaId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('skills')
        .select('*')
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('nome', { ascending: true })

      if (devAreaId) q = q.eq('dev_area_id', devAreaId)

      const { data, error } = await q
      if (error) throw error
      return data as Skill[]
    },
    enabled: !!user,
  })
}

export function useUpdateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<SkillInput> }) => {
      const { error } = await supabase.from('skills').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] })
    },
  })
}
