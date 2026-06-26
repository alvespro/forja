import { createCrudHooks } from '@/lib/crud-factory'
import type { LibraryStatus, Reading } from '@/types/database'

const SEM_TRILHA = 'Sem trilha'

export type ReadingInput = {
  trilha: string | null
  titulo: string
  autor: string | null
  status: LibraryStatus
  progresso: number
  nota_321: string | null
}

const readingsCrud = createCrudHooks<Reading, ReadingInput>({
  table: 'readings',
  queryKey: 'readings',
  orderBy: [
    { column: 'trilha', ascending: true, nullsFirst: false },
    { column: 'titulo', ascending: true },
  ],
})

export const useReadings = readingsCrud.useList
export const useCreateReading = readingsCrud.useCreate
export const useUpdateReading = readingsCrud.useUpdate
export const useDeleteReading = readingsCrud.useDelete

/** Agrupa as leituras por trilha, em ordem alfabética (sem trilha vai por último). */
export function groupReadingsByTrilha(readings: Reading[] | undefined): Map<string, Reading[]> {
  const map = new Map<string, Reading[]>()
  if (!readings) return map

  for (const reading of readings) {
    const key = reading.trilha?.trim() || SEM_TRILHA
    const list = map.get(key) ?? []
    list.push(reading)
    map.set(key, list)
  }

  return map
}
