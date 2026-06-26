import { useState } from 'react'

import { DiaryEntryCard } from '@/components/journal/diary-entry-card'
import { DiaryHistoryList } from '@/components/journal/diary-history-list'
import { WeeklyReviewForm } from '@/components/journal/weekly-review-form'
import { WeeklyScoreCard } from '@/components/journal/weekly-score-card'
import { cn } from '@/lib/utils'

type JournalTab = 'diario' | 'revisao'

export function JournalPage() {
  const [tab, setTab] = useState<JournalTab>('diario')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Diário & Revisão</h1>
        <p className="text-sm text-aco-texto">Diário diário/semanal e revisão semanal com o placar da semana.</p>
      </div>

      <div className="flex gap-1 border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'diario'}
          onClick={() => setTab('diario')}
          className={cn(
            'rounded-t px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            tab === 'diario' ? 'border-b-2 border-brasa text-foreground' : 'text-aco-texto hover:text-foreground',
          )}
        >
          Diário
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'revisao'}
          onClick={() => setTab('revisao')}
          className={cn(
            'rounded-t px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            tab === 'revisao' ? 'border-b-2 border-brasa text-foreground' : 'text-aco-texto hover:text-foreground',
          )}
        >
          Revisão semanal
        </button>
      </div>

      {tab === 'diario' ? (
        <div className="flex flex-col gap-4">
          <DiaryEntryCard />
          <DiaryHistoryList />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <WeeklyScoreCard />
          <WeeklyReviewForm />
        </div>
      )}
    </div>
  )
}
