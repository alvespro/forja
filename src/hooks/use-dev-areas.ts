import { createCrudHooks } from '@/lib/crud-factory'
import type { DevArea, DevAreaCategoria } from '@/types/database'

export type DevAreaInput = {
  nome: string
  categoria: DevAreaCategoria
  descricao?: string | null
  cor?: string | null
  nivel_atual?: number | null
  nivel_meta?: number | null
  ativo?: boolean | null
  ordem?: number | null
}

const crud = createCrudHooks<DevArea, DevAreaInput>({
  table: 'dev_areas',
  queryKey: 'dev-areas',
  orderBy: { column: 'ordem', ascending: true },
})

export const useDevAreas = crud.useList
export const useCreateDevArea = crud.useCreate
export const useUpdateDevArea = crud.useUpdate
export const useDeleteDevArea = crud.useDelete
