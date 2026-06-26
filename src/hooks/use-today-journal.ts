import { todayInSaoPaulo } from '@/lib/date'

import { useJournalEntry } from './use-journal-entry'

export function useTodayJournal() {
  return useJournalEntry(todayInSaoPaulo(), 'diario')
}
