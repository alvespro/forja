import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { DocumentImport } from '@/types/database'

export function useDocumentImports() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['document-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as DocumentImport[]
    },
    enabled: !!user,
  })
}
