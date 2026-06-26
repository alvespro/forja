import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState } from '@/components/feedback/error-state'
import { useJournalEntry } from '@/hooks/use-journal-entry'
import { currentIsoWeekDates } from '@/lib/date'
import { cn } from '@/lib/utils'

const MOOD_OPTIONS = [
  { valor: 1, emoji: '😞' },
  { valor: 2, emoji: '😕' },
  { valor: 3, emoji: '😐' },
  { valor: 4, emoji: '🙂' },
  { valor: 5, emoji: '😄' },
]

/** Revisão semanal: humor geral da semana + reflexão livre ("o que eu senti"). */
export function WeeklyReviewForm() {
  const weekStart = currentIsoWeekDates()[0]
  const { data: entry, isLoading, isError, refetch, save } = useJournalEntry(weekStart, 'semanal')
  const [humor, setHumor] = useState<number | null>(null)
  const [texto, setTexto] = useState('')

  useEffect(() => {
    setHumor(entry?.humor ?? null)
    setTexto(entry?.o_que_senti ?? '')
  }, [entry])

  function handleSave(novoHumor: number | null) {
    setHumor(novoHumor)
    save.mutate({ humor: novoHumor, o_que_senti: texto })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reflexão da semana</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : isError ? (
          <ErrorState message="Não foi possível carregar a revisão semanal." onRetry={() => refetch()} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.valor}
                  type="button"
                  aria-label={`Humor da semana ${option.valor} de 5`}
                  aria-pressed={humor === option.valor}
                  onClick={() => handleSave(option.valor)}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full text-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    humor === option.valor ? 'bg-primary' : 'bg-muted hover:bg-accent',
                  )}
                >
                  {option.emoji}
                </button>
              ))}
            </div>

            <Textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onBlur={() => save.mutate({ humor, o_que_senti: texto })}
              placeholder="Como foi a semana? O que funcionou, o que travou, o que muda na próxima…"
              rows={5}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-end"
              disabled={save.isPending}
              onClick={() => save.mutate({ humor, o_que_senti: texto })}
            >
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
