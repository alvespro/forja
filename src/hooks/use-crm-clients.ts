import { createCrudHooks } from '@/lib/crud-factory'
import type { CrmClient } from '@/types/database'

export type CrmClientInput = {
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

export const useCrmClients = crmClientsCrud.useList
export const useCreateCrmClient = crmClientsCrud.useCreate
export const useUpdateCrmClient = crmClientsCrud.useUpdate
export const useDeleteCrmClient = crmClientsCrud.useDelete
