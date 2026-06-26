import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { useFrogTask } from '@/hooks/use-frog-task'
import { cn } from '@/lib/utils'

export function FrogTaskCard() {
  const { data: frog, isLoading, isError, refetch, create, toggleDone } = useFrogTask()
  const [titulo, setTitulo] = useState('')

  function handleCreate() {
    const value = titulo.trim()
    if (!value) return
    create.mutate(value, { onSuccess: () => setTitulo('') })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🐸 Sapo do dia</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : isError ? (
          <ErrorState message="Não foi possível carregar o sapo do dia." onRetry={() => refetch()} />
        ) : frog ? (
          <button
            type="button"
            onClick={() => toggleDone.mutate()}
            className="flex w-full items-center gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                frog.status === 'feito' ? 'border-ok bg-ok text-meia-noite' : 'border-border',
              )}
              aria-hidden="true"
            >
              {frog.status === 'feito' && '✓'}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate',
                frog.status === 'feito' && 'text-muted-foreground line-through',
              )}
            >
              {frog.titulo}
            </span>
          </button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Qual é a tarefa mais importante de hoje?"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreate()
              }}
            />
            <Button type="button" onClick={handleCreate} disabled={create.isPending}>
              Definir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
