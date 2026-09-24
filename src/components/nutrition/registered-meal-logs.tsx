import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { MealLogForm } from '@/components/nutrition/meal-log-form'
import { Modal } from '@/components/ui/modal'
import { useConfirm } from '@/hooks/use-confirm'
import { useDeleteMealLog, useUpdateMealLog } from '@/hooks/use-meal-logs'
import type { MealLog, MealSlot } from '@/types/database'

type Props = {
  logs: MealLog[]
  slots: MealSlot[]
  heading?: string
}

/** Mantém cada lançamento visível e corrigível, inclusive alimentos sem refeição do plano. */
export function RegisteredMealLogs({ logs, slots, heading = 'Alimentos registrados' }: Props) {
  const [editing, setEditing] = useState<MealLog | null>(null)
  const updateLog = useUpdateMealLog()
  const deleteLog = useDeleteMealLog()
  const { confirm, dialog } = useConfirm()

  if (logs.length === 0) return null

  async function handleDelete(log: MealLog) {
    const ok = await confirm({
      title: `Excluir ${log.descricao || 'este alimento'}?`,
      description: 'O registro será removido dos totais de hoje. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir alimento',
    })
    if (!ok) return

    try {
      await deleteLog.mutateAsync(log.id)
      if (editing?.id === log.id) setEditing(null)
      toast.success('Alimento excluído dos registros de hoje.')
    } catch {
      toast.error('Não foi possível excluir o alimento. Tente novamente.')
    }
  }

  return (
    <>
      <section className="w-full overflow-hidden rounded-[var(--r-md)] border border-linha bg-fundo/45" aria-label={heading}>
        <div className="flex items-center justify-between border-b border-linha px-3 py-2">
          <span className="text-[12px] font-semibold text-cinza">{heading}</span>
          <span className="text-[11px] tabular-nums text-cinza2-texto">{logs.length}</span>
        </div>
        <ul className="divide-y divide-linha">
          {logs.map((log) => (
            <li key={log.id} className="flex min-w-0 items-center gap-1 px-1.5">
              <button
                type="button"
                onClick={() => setEditing(log)}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--r-sm)] px-2 text-left outline-none hover:bg-aco focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Editar ${log.descricao || 'alimento registrado'}`}
              >
                <span className="min-w-0 flex-1 truncate text-[13px] text-nevoa">{log.descricao || 'Alimento sem descrição'}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-cinza">{Math.round(log.calorias ?? 0)} kcal</span>
                <Icon name="edit" size={16} className="shrink-0 text-brasa" />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(log)}
                disabled={deleteLog.isPending}
                className="grid size-11 shrink-0 place-items-center rounded-[var(--r-sm)] text-cinza outline-none hover:bg-alerta/10 hover:text-alerta-texto focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                aria-label={`Excluir ${log.descricao || 'alimento registrado'}`}
                title="Excluir alimento"
              >
                <Icon name="delete" size={18} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar alimento registrado">
        {editing && (
          <MealLogForm
            key={editing.id}
            mealSlotId={editing.meal_slot_id}
            slots={slots}
            log={editing}
            isSubmitting={updateLog.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => updateLog.mutate(
              { id: editing.id, values },
              {
                onSuccess: () => {
                  setEditing(null)
                  toast.success('Alimento atualizado.')
                },
                onError: () => toast.error('Não foi possível atualizar o alimento. Tente novamente.'),
              },
            )}
          />
        )}
      </Modal>
      {dialog}
    </>
  )
}
