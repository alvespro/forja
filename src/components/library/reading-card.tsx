import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { ReadingForm } from '@/components/library/reading-form'
import { useDeleteReading, useUpdateReading } from '@/hooks/use-readings'
import { useConfirm } from '@/hooks/use-confirm'
import { LIBRARY_STATUS_DOT_CLASS, LIBRARY_STATUS_OPTIONS } from '@/lib/library-status'
import { cn } from '@/lib/utils'
import type { LibraryStatus, Reading } from '@/types/database'

type ReadingCardProps = {
  reading: Reading
}

export function ReadingCard({ reading }: ReadingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const updateReading = useUpdateReading()
  const deleteReading = useDeleteReading()
  const { confirm, dialog } = useConfirm()

  function handleStatusChange(status: LibraryStatus) {
    updateReading.mutate({ id: reading.id, values: { status } })
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Excluir a leitura "${reading.titulo}"?`,
      description: 'Essa ação não pode ser desfeita.',
    })
    if (!ok) return
    deleteReading.mutate(reading.id)
  }

  if (isEditing) {
    return (
      <ReadingForm
        reading={reading}
        onSubmit={(values) =>
          updateReading.mutate({ id: reading.id, values }, { onSuccess: () => setIsEditing(false) })
        }
        onCancel={() => setIsEditing(false)}
        isSubmitting={updateReading.isPending}
      />
    )
  }

  return (
    <>
      {dialog}
      <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('mt-0.5 size-4 shrink-0 text-aco-texto transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">{reading.titulo}</span>
              {reading.autor && <span className="truncate text-xs text-aco-texto">{reading.autor}</span>}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1">
            <Select
              aria-label={`Status de ${reading.titulo}`}
              value={reading.status}
              onChange={(event) => handleStatusChange(event.target.value as LibraryStatus)}
              className="w-32"
            >
              {LIBRARY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <span className={cn('size-2 rounded-full', LIBRARY_STATUS_DOT_CLASS[reading.status])} aria-hidden="true" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar leitura ${reading.titulo}`}
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir leitura ${reading.titulo}`}
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Progress value={reading.progresso} className="flex-1" />
          <span className="w-10 shrink-0 text-right font-mono text-xs text-aco-texto">{reading.progresso}%</span>
        </div>

        {expanded && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-aco-texto">Notas 3-2-1 (3 ideias, 2 aplicações, 1 ação)</p>
            {reading.nota_321 ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">{reading.nota_321}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma nota registrada ainda.</p>
            )}
          </div>
        )}
      </CardContent>
      </Card>
    </>
  )
}
