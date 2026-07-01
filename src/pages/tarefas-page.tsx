import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { todayInSaoPaulo } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'

const AREAS = [
  { value: null as string | null, label: 'Todas' },
  { value: 'fisico', label: '💪 Físico' },
  { value: 'mental', label: '🧠 Mental' },
  { value: 'financeiro', label: '💰 Financeiro' },
  { value: 'vinculos', label: '🤝 Vínculos' },
  { value: 'negocio', label: '🏢 Negócio' },
]

const AREA_COLORS: Record<string, string> = {
  fisico: 'text-blue-400 bg-blue-900/30',
  mental: 'text-purple-400 bg-purple-900/30',
  financeiro: 'text-yellow-400 bg-yellow-900/30',
  vinculos: 'text-pink-400 bg-pink-900/30',
  negocio: 'text-cyan-400 bg-cyan-900/30',
}

export function TarefasPage() {
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaArea, setNovaArea] = useState('')
  const [novaFrog, setNovaFrog] = useState(false)

  const today = todayInSaoPaulo()

  const tasks = useTasks({
    area: areaFilter ?? undefined,
    data: showAll ? undefined : today,
  })

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  function handleToggle(id: string, current: 'aberto' | 'feito') {
    updateTask.mutate({ id, values: { status: current === 'aberto' ? 'feito' : 'aberto' } })
  }

  function handleAdd() {
    if (!novoTitulo.trim()) return
    createTask.mutate(
      { titulo: novoTitulo, area: novaArea || null, e_frog: novaFrog },
      {
        onSuccess: () => {
          setNovoTitulo('')
          setNovaArea('')
          setNovaFrog(false)
          setIsAdding(false)
        },
      },
    )
  }

  const abertas = (tasks.data ?? []).filter((t) => t.status === 'aberto')
  const feitas = (tasks.data ?? []).filter((t) => t.status === 'feito')

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tarefas</h1>
          <p className="text-sm text-aco-texto">{showAll ? 'Todas as tarefas' : 'Tarefas de hoje'}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-aco-texto"
          >
            {showAll ? 'Só hoje' : 'Ver todas'}
          </Button>
          {!isAdding && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="size-3.5" />
              Nova tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Area filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {AREAS.map((a) => (
          <button
            key={String(a.value)}
            type="button"
            onClick={() => setAreaFilter(a.value)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              areaFilter === a.value
                ? 'bg-brasa text-white'
                : 'bg-border/30 text-aco-texto hover:bg-border/60',
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <input
            type="text"
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            placeholder="Título da tarefa..."
            autoFocus
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2 items-center">
            <select
              value={novaArea}
              onChange={(e) => setNovaArea(e.target.value)}
              className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Área (opcional)</option>
              <option value="fisico">💪 Físico</option>
              <option value="mental">🧠 Mental</option>
              <option value="financeiro">💰 Financeiro</option>
              <option value="vinculos">🤝 Vínculos</option>
              <option value="negocio">🏢 Negócio</option>
            </select>
            <button
              type="button"
              onClick={() => setNovaFrog((v) => !v)}
              title="Marcar como sapo (tarefa prioritária do dia)"
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md border text-base transition-colors',
                novaFrog
                  ? 'border-green-600 bg-green-900/30 text-green-400'
                  : 'border-input text-aco-texto hover:border-green-600/60',
              )}
            >
              🐸
            </button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleAdd}
              disabled={!novoTitulo.trim() || createTask.isPending}
            >
              {createTask.isPending ? 'Salvando…' : 'Adicionar'}
            </Button>
          </div>
        </div>
      )}

      {/* Task list */}
      {tasks.isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-border/20 animate-pulse" />
          ))}
        </div>
      ) : (tasks.data ?? []).length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-aco-texto">
            {isAdding ? null : `Nenhuma tarefa${!showAll ? ' para hoje' : ''}.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {abertas.map((task) => (
            <TaskItem key={task.id} task={task} areaColors={AREA_COLORS} onToggle={handleToggle} />
          ))}
          {feitas.length > 0 && abertas.length > 0 && (
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-border/30" />
              <span className="text-xs text-aco-texto">
                {feitas.length} concluída{feitas.length > 1 ? 's' : ''}
              </span>
              <div className="flex-1 border-t border-border/30" />
            </div>
          )}
          {feitas.map((task) => (
            <TaskItem key={task.id} task={task} areaColors={AREA_COLORS} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

type TaskItemProps = {
  task: Task
  areaColors: Record<string, string>
  onToggle: (id: string, status: 'aberto' | 'feito') => void
}

function TaskItem({ task, areaColors, onToggle }: TaskItemProps) {
  const done = task.status === 'feito'
  return (
    <button
      type="button"
      onClick={() => onToggle(task.id, task.status)}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 text-left transition-all w-full',
        done
          ? 'border-border/20 bg-card/20 opacity-60'
          : 'border-border/40 bg-card/60 hover:border-brasa/40',
      )}
    >
      <div
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          done
            ? 'border-green-500 bg-green-500/20 text-green-400'
            : 'border-border/60',
        )}
      >
        {done && <span className="text-[10px] leading-none">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm',
            done ? 'line-through text-aco-texto' : 'text-foreground',
          )}
        >
          {task.titulo}
        </span>
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {task.area && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                areaColors[task.area] ?? 'text-aco-texto bg-border/30',
              )}
            >
              {task.area}
            </span>
          )}
          {task.e_frog && (
            <span className="text-[10px] text-green-400">🐸 sapo</span>
          )}
        </div>
      </div>
    </button>
  )
}
