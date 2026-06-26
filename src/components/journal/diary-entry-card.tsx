import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState } from '@/components/feedback/error-state'
import { useTodayJournal } from '@/hooks/use-today-journal'
import { cn } from '@/lib/utils'

const MOOD_OPTIONS = [
  { valor: 1, emoji: '😞' },
  { valor: 2, emoji: '😕' },
  { valor: 3, emoji: '😐' },
  { valor: 4, emoji: '🙂' },
  { valor: 5, emoji: '😄' },
]

/** Entrada diária do módulo Diário & Revisão: humor + "o que eu senti" de hoje. */
export function DiaryEntryCard() {
  const { data: entry, isLoading, isError, refetch, save } = useTodayJournal()
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
        <CardTitle>Entrada de hoje</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <ErrorState message="Não foi possível carregar o diário de hoje." onRetry={() => refetch()} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.valor}
                  type="button"
                  aria-label={`Humor ${option.valor} de 5`}
                  aria-pressed={humor === option.valor}
                  onClick={() => handleSave(option.valor)}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full text-xl transition-colors',
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
              placeholder="O que eu senti hoje..."
              rows={4}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-end"
              disabled={save.isPending}
              onClick={() => save.mutate({ humor, o_que_senti: texto })}
            >
              {save.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
