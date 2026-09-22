import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/lib/icons'

import { useActiveCycle } from '@/hooks/use-active-cycle'
import { useGoals } from '@/hooks/use-goals'
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { todayInSaoPaulo } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'

// ─── Listas por área (estilo "Minhas Listas" do iOS) ────────────────────────

type AreaDef = {
  key: string
  label: string
  icon: IconName
  /** Cor do círculo do ícone e da lista */
  color: string
  bg: string
}

const AREAS: AreaDef[] = [
  { key: 'fisico', label: 'Físico', icon: 'fitness_center', color: '#0A84FF', bg: 'rgba(10,132,255,0.16)' },
  { key: 'mental', label: 'Mental', icon: 'psychology', color: '#BF5AF2', bg: 'rgba(191,90,242,0.16)' },
  { key: 'financeiro', label: 'Financeiro', icon: 'account_balance_wallet', color: '#FFD60A', bg: 'rgba(255,214,10,0.16)' },
  { key: 'vinculos', label: 'Vínculos', icon: 'volunteer_activism', color: '#FF375F', bg: 'rgba(255,55,95,0.16)' },
  { key: 'negocio', label: 'Negócio', icon: 'work', color: '#64D2FF', bg: 'rgba(100,210,255,0.16)' },
]

function areaDef(key: string | null): AreaDef | undefined {
  return AREAS.find((a) => a.key === key)
}

// ─── Listas inteligentes (grid do topo, estilo iOS) ─────────────────────────

type SmartKey = 'hoje' | 'sapo' | 'todas' | 'concluidas'

type SmartDef = {
  key: SmartKey
  label: string
  icon: IconName
  color: string
  emoji?: string
}

const SMART: SmartDef[] = [
  { key: 'hoje', label: 'Hoje', icon: 'calendar_today', color: '#0A84FF' },
  { key: 'sapo', label: 'Sapo', icon: 'calendar_today', color: '#30D158', emoji: '🐸' },
  { key: 'todas', label: 'Todas', icon: 'inbox', color: '#8E8E93' },
  { key: 'concluidas', label: 'Concluídas', icon: 'check_circle', color: '#98989D' },
]

type View = { kind: 'home' } | { kind: 'smart'; smart: SmartKey } | { kind: 'area'; area: string }

export function TarefasPage() {
  const [view, setView] = useState<View>({ kind: 'home' })

  const tasks = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const today = todayInSaoPaulo()
  const all = tasks.data ?? []

  const counts = useMemo(() => {
    const lista = tasks.data ?? []
    return {
      hoje: lista.filter((t) => t.data === today && t.status === 'aberto').length,
      sapo: lista.filter((t) => t.e_frog && t.status === 'aberto').length,
      todas: lista.filter((t) => t.status === 'aberto').length,
      concluidas: lista.filter((t) => t.status === 'feito').length,
      porArea: Object.fromEntries(
        AREAS.map((a) => [a.key, lista.filter((t) => t.area === a.key && t.status === 'aberto').length]),
      ) as Record<string, number>,
    }
  }, [tasks.data, today])

  function toggle(task: Task) {
    updateTask.mutate({ id: task.id, values: { status: task.status === 'aberto' ? 'feito' : 'aberto' } })
  }

  // ── Visão HOME (grid + minhas listas) ──────────────────────────────────────
  if (view.kind === 'home') {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-3xl font-bold text-foreground">Tarefas</h1>

        {/* Grid de listas inteligentes */}
        <div className="grid grid-cols-2 gap-3">
          {SMART.map((s) => {
            const icone = s.icon
            const count =
              s.key === 'hoje' ? counts.hoje : s.key === 'sapo' ? counts.sapo : s.key === 'todas' ? counts.todas : counts.concluidas
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setView({ kind: 'smart', smart: s.key })}
                className="flex flex-col gap-2 rounded-2xl bg-card border border-border/40 p-3.5 text-left active:scale-[0.97] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex size-8 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.emoji ? <span className="text-base leading-none">{s.emoji}</span> : <Icon name={icone} size={18} />}
                  </div>
                  <span className="text-2xl font-bold text-foreground">{count}</span>
                </div>
                <span className="text-sm font-semibold text-aco-texto">{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Minhas listas */}
        <div>
          <p className="mb-2 px-1 text-sm font-semibold text-aco-texto">Minhas Listas</p>
          <div className="overflow-hidden rounded-2xl bg-card border border-border/40">
            {AREAS.map((a, i) => {
              const icone = a.icon
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setView({ kind: 'area', area: a.key })}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left active:bg-border/20 transition-colors',
                    i > 0 && 'border-t border-border/30',
                  )}
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: a.color }}
                  >
                    <Icon name={icone} size={18} className="text-white" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{a.label}</span>
                  <span className="text-sm text-aco-texto">{counts.porArea[a.key] ?? 0}</span>
                  <Icon name="chevron_right" size={16} className="text-cinza2-texto" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Visão LISTA (smart ou área) ────────────────────────────────────────────
  const smart = view.kind === 'smart' ? SMART.find((s) => s.key === view.smart)! : null
  const areaKey = view.kind === 'area' ? view.area : null
  const area = areaKey ? areaDef(areaKey) : undefined

  const titulo = smart?.label ?? area?.label ?? 'Tarefas'
  const cor = smart?.color ?? area?.color ?? '#0A84FF'

  const filtered = all.filter((t) => {
    if (smart) {
      if (smart.key === 'hoje') return t.data === today
      if (smart.key === 'sapo') return t.e_frog
      if (smart.key === 'concluidas') return t.status === 'feito'
      return true // todas
    }
    return t.area === areaKey
  })

  const abertas = filtered.filter((t) => t.status === 'aberto')
  const feitas = filtered.filter((t) => t.status === 'feito')
  const mostrarFeitas = smart?.key === 'concluidas'
  const listaPrincipal = mostrarFeitas ? feitas : abertas

  return (
    <ListView
      titulo={titulo}
      cor={cor}
      tarefas={listaPrincipal}
      feitasCount={mostrarFeitas ? 0 : feitas.length}
      isLoading={tasks.isLoading}
      onBack={() => setView({ kind: 'home' })}
      onToggle={toggle}
      onAdd={
        mostrarFeitas
          ? undefined
          : (titulo, goalId) =>
              createTask.mutate({
                titulo,
                area: area?.key ?? null,
                e_frog: smart?.key === 'sapo',
                goal_id: goalId,
              })
      }
      isAdding={createTask.isPending}
    />
  )
}

// ─── Visão de lista estilo iOS ───────────────────────────────────────────────

type ListViewProps = {
  titulo: string
  cor: string
  tarefas: Task[]
  feitasCount: number
  isLoading: boolean
  onBack: () => void
  onToggle: (task: Task) => void
  onAdd?: (titulo: string, goalId: string | null) => void
  isAdding: boolean
}

function ListView({ titulo, cor, tarefas, feitasCount, isLoading, onBack, onToggle, onAdd, isAdding }: ListViewProps) {
  const [novoTitulo, setNovoTitulo] = useState('')
  const [inputAberto, setInputAberto] = useState(false)
  const [goalId, setGoalId] = useState<string | null>(null)

  const activeCycle = useActiveCycle()
  const goals = useGoals(activeCycle.data?.id ?? '')
  const metasAtivas = (goals.data ?? []).filter((g) => g.status === 'ativo')

  function submeter() {
    const t = novoTitulo.trim()
    if (!t || !onAdd) return
    onAdd(t, goalId)
    setNovoTitulo('')
    setGoalId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header com voltar */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-0.5 text-sm font-medium mb-1"
          style={{ color: cor }}
        >
          <Icon name="chevron_left" size={18} />
          Listas
        </button>
        <h1 className="font-heading text-3xl font-bold" style={{ color: cor }}>
          {titulo}
        </h1>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-border/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card border border-border/40">
          {tarefas.length === 0 && !inputAberto && (
            <p className="px-4 py-6 text-center text-sm text-aco-texto">Nenhuma tarefa.</p>
          )}
          {tarefas.map((task, i) => (
            <TaskRow key={task.id} task={task} cor={cor} divider={i > 0} onToggle={onToggle} />
          ))}

          {/* Nova tarefa inline */}
          {onAdd && inputAberto && (
            <div className={cn('flex items-center gap-3 px-4 py-2.5', tarefas.length > 0 && 'border-t border-border/30')}>
              <div className="size-[22px] shrink-0 rounded-full border-2 border-border/60" />
              <input
                type="text"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submeter()
                  if (e.key === 'Escape') {
                    setInputAberto(false)
                    setNovoTitulo('')
                  }
                }}
                onBlur={() => {
                  if (!novoTitulo.trim()) setInputAberto(false)
                }}
                placeholder="Nova tarefa"
                autoFocus
                disabled={isAdding}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-cinza2-texto"
              />
            </div>
          )}

          {/* Vínculo com meta: qual meta este item move? (regra do sapo com propósito) */}
          {onAdd && inputAberto && metasAtivas.length > 0 && (
            <div className="border-t border-border/20 px-4 py-2">
              <select
                value={goalId ?? ''}
                onChange={(e) => setGoalId(e.target.value || null)}
                aria-label="Vincular a uma meta"
                className="w-full bg-transparent text-xs text-aco-texto"
              >
                <option value="">🎯 Vincular a uma meta (opcional)</option>
                {metasAtivas.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Botão + Nova Tarefa (estilo iOS, canto inferior) */}
      {onAdd && !inputAberto && (
        <button
          type="button"
          onClick={() => setInputAberto(true)}
          className="flex items-center gap-2 px-1 text-sm font-semibold active:opacity-60"
          style={{ color: cor }}
        >
          <span
            className="flex size-6 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: cor }}
          >
            <Icon name="add" size={16} />
          </span>
          Nova Tarefa
        </button>
      )}

      {feitasCount > 0 && (
        <p className="px-1 text-xs text-aco-texto">
          {feitasCount} concluída{feitasCount > 1 ? 's' : ''} — veja em "Concluídas"
        </p>
      )}
    </div>
  )
}

// ─── Linha de tarefa com checkbox redondo iOS ────────────────────────────────

type TaskRowProps = {
  task: Task
  cor: string
  divider: boolean
  onToggle: (task: Task) => void
}

function TaskRow({ task, cor, divider, onToggle }: TaskRowProps) {
  const done = task.status === 'feito'
  const aDef = areaDef(task.area)

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2.5', divider && 'border-t border-border/30')}>
      <button
        type="button"
        onClick={() => onToggle(task)}
        aria-label={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
        className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className="flex size-[22px] items-center justify-center rounded-full border-2 transition-all duration-200"
          style={{
            borderColor: done ? cor : 'var(--border)',
            backgroundColor: done ? cor : 'transparent',
          }}
          aria-hidden="true"
        >
          {done && <span className="text-[11px] leading-none text-white">✓</span>}
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm transition-all duration-200',
            done ? 'text-cinza2-texto line-through' : 'text-foreground',
          )}
        >
          {task.e_frog && <span className="mr-1">🐸</span>}
          {task.titulo}
        </p>
        {aDef && (
          <p className="text-[11px]" style={{ color: aDef.color }}>
            {aDef.label}
          </p>
        )}
      </div>
    </div>
  )
}
