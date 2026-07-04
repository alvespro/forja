import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFrogTask } from '@/hooks/use-frog-task'
import { useTasks } from '@/hooks/use-tasks'
import { todayInSaoPaulo } from '@/lib/date'

type FocusTaskPickerProps = {
  value: string
  taskId: string | null
  onChange: (titulo: string, taskId: string | null) => void
}

/**
 * Seleção da tarefa em foco: as tarefas abertas de hoje viram opções reais
 * (com task_id — habilita concluir pós-pomodoro); texto livre continua valendo
 * para foco fora da lista.
 */
export function FocusTaskPicker({ value, taskId, onChange }: FocusTaskPickerProps) {
  const { data: frog } = useFrogTask()
  const today = todayInSaoPaulo()
  const tasks = useTasks({ data: today })

  const abertas = (tasks.data ?? []).filter((t) => t.status === 'aberto')

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="tarefa-foco">Tarefa em foco</Label>

      {abertas.length > 0 && (
        <select
          value={taskId ?? ''}
          onChange={(e) => {
            const t = abertas.find((x) => x.id === e.target.value)
            onChange(t?.titulo ?? value, t?.id ?? null)
          }}
          aria-label="Escolher tarefa da lista de hoje"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Escolher da lista de hoje ({abertas.length})</option>
          {abertas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.e_frog ? '🐸 ' : ''}
              {t.titulo}
            </option>
          ))}
        </select>
      )}

      <Input
        id="tarefa-foco"
        value={value}
        onChange={(event) => onChange(event.target.value, null)}
        placeholder="Ou descreva no que você vai focar"
      />

      {frog && frog.status === 'aberto' && frog.id !== taskId && (
        <button
          type="button"
          onClick={() => onChange(frog.titulo, frog.id)}
          className="self-start rounded text-xs text-aco-texto outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          🐸 Usar sapo do dia: {frog.titulo}
        </button>
      )}
    </div>
  )
}
