import { createCrudHooks } from '@/lib/crud-factory'
import type { DevMedia, DevMediaStatus, DevMediaTipo } from '@/types/database'

export type DevMediaInput = {
  dev_area_id?: string | null
  tipo: DevMediaTipo
  titulo: string
  diretor_ou_host?: string | null
  plataforma?: string | null
  status?: DevMediaStatus | null
  nota_geral?: number | null
  origem?: string | null
  habilidades_desenvolvidas?: string[] | null
  aprendizado_1?: string | null
  aprendizado_2?: string | null
  aprendizado_3?: string | null
  aplicacao_1?: string | null
  aplicacao_2?: string | null
  acao_1?: string | null
  notas?: string | null
  data_conclusao?: string | null
}

const crud = createCrudHooks<DevMedia, DevMediaInput>({
  table: 'dev_media',
  queryKey: 'dev-media',
  orderBy: [
    { column: 'created_at', ascending: false },
  ],
})

export const useDevMedia = crud.useList
export const useCreateDevMedia = crud.useCreate
export const useUpdateDevMedia = crud.useUpdate
export const useDeleteDevMedia = crud.useDelete
