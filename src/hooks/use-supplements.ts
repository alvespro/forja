import { createCrudHooks } from '@/lib/crud-factory'
import type { Supplement, SupplementMomento, SupplementTipo } from '@/types/database'

export type SupplementInput = {
  nome: string
  tipo: SupplementTipo | null
  dose: string | null
  unidade: string | null
  momento: SupplementMomento | null
  dias_semana: string[] | null
  ativo: boolean
  notas: string | null
}

const supplementsCrud = createCrudHooks<Supplement, SupplementInput>({
  table: 'supplements',
  queryKey: 'supplements',
  orderBy: { column: 'created_at', ascending: true },
})

export const useSupplements = supplementsCrud.useList
export const useCreateSupplement = supplementsCrud.useCreate
export const useUpdateSupplement = supplementsCrud.useUpdate
export const useDeleteSupplement = supplementsCrud.useDelete
