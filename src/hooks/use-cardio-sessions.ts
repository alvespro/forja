import { createCrudHooks } from '@/lib/crud-factory'
import type { CardioSession, CardioTipo } from '@/types/database'

export type CardioSessionInput = {
  tipo: CardioTipo | null
  performed_at: string
  distancia_km: number | null
  duracao_seg: number | null
  fc_media: number | null
  zona: string | null
  tiros: string | null
  notas: string | null
}

const cardioSessionsCrud = createCrudHooks<CardioSession, CardioSessionInput>({
  table: 'cardio_sessions',
  queryKey: 'cardio-sessions',
  orderBy: { column: 'performed_at', ascending: false },
})

export const useCardioSessions = cardioSessionsCrud.useList
export const useCreateCardioSession = cardioSessionsCrud.useCreate
export const useDeleteCardioSession = cardioSessionsCrud.useDelete
