import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { useJournalHistory } from '@/hooks/use-journal-history'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'

const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

export function DiaryHistoryList() {
  const { data, isLoading, isError, refetch } = useJournalHistory()
  const today = todayInSaoPaulo()
  const entradasAnteriores = data?.filter((entry) => entry.data !== today) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico recente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Não foi possível carregar o histórico do diário." onRetry={() => refetch()} />
        ) : entradasAnteriores.length === 0 ? (
          <EmptyState message="Ainda não há entradas anteriores de diário." />
        ) : (
          <ul className="flex flex-col gap-2">
            {entradasAnteriores.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 rounded-md border border-border px-2.5 py-2">
                <span className="text-lg" aria-hidden="true">
                  {entry.humor ? MOOD_EMOJI[entry.humor] : '—'}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs text-aco-texto">
                    {format(parseDateOnly(entry.data), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </span>
                  {entry.o_que_senti && (
                    <p className="text-sm text-foreground line-clamp-2">{entry.o_que_senti}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
