import { createCrudHooks } from '@/lib/crud-factory'
import type { CrmClient } from '@/types/database'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

export type CrmClientInput = {
  telefone?: string | null
  email?: string | null
  cpf?: string | null
  produto?: string | null
  status?: string | null
  valor_financiamento?: number | null
  proximo_contato?: string | null
  notas?: string | null
  nome: string
  fase: string | null
  valor_estimado: number | null
  proxima_acao: string | null
  data_proxima_acao: string | null
}

const crmClientsCrud = createCrudHooks<CrmClient, CrmClientInput>({
  table: 'crm_clients',
  queryKey: 'crm-clients',
  orderBy: { column: 'created_at', ascending: false },
})

export function useCrmClients() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['crm-clients', user?.id], enabled: !!user, queryFn: async () => {
    const all: CrmClient[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('crm_clients').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).order('id').range(offset, offset + 999)
      if (error) throw error
      all.push(...data as CrmClient[])
      if (data.length < 1000) return all
    }
  } })
}
export const useCreateCrmClient = crmClientsCrud.useCreate
export const useUpdateCrmClient = crmClientsCrud.useUpdate
export const useDeleteCrmClient = crmClientsCrud.useDelete
