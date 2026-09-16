import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useActivityCalendar } from '@/hooks/use-activity-calendar'
import { activityLevel, ACTIVITY_LEVEL_COLORS, type ActivityDay, type ActivityLevel } from '@/lib/activity-day'
import { syncActivityDay } from '@/lib/activity-sync'
import { addDaysToDateString, parseDateOnly, todayInSaoPaulo } from '@/lib/date'

const DAYS = 90
const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] // Seg..Dom

/** Índice do dia da semana com segunda = 0 ... domingo = 6. */
function mondayIndex(dateStr: string): number {
  return (parseDateOnly(dateStr).getDay() + 6) % 7
}

type Cell = { date: string; day: ActivityDay | undefined } | null

export function ActivityCalendar() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const calendar = useActivityCalendar(DAYS)
  const syncedRef = useRef(false)

  // Garante que o dia de hoje esteja atualizado ao abrir (cobre cardio e recálculo).
  useEffect(() => {
    if (!user || syncedRef.current) return
    syncedRef.current = true
    syncActivityDay(user.id, todayInSaoPaulo())
      .then(() => queryClient.invalidateQueries({ queryKey: ['activity-calendar'] }))
      .catch(() => {})
  }, [user, queryClient])

  const weeks = useMemo<Cell[][]>(() => {
    const today = todayInSaoPaulo()
    const dates: string[] = []
    for (let i = DAYS - 1; i >= 0; i--) dates.push(addDaysToDateString(today, -i))

    // Preenche a primeira semana com células vazias antes do primeiro dia.
    const pad = mondayIndex(dates[0])
    const cells: Cell[] = Array.from({ length: pad }, () => null)
    for (const date of dates) cells.push({ date, day: calendar.data?.get(date) })

    const rows: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7)
      while (week.length < 7) week.push(null)
      rows.push(week)
    }
    return rows
  }, [calendar.data])

  const ativos = (calendar.data ? [...calendar.data.values()] : []).filter((d) => activityLevel(d) > 0).length

  return (
    <GlassCard className="flex flex-col gap-3" padding="var(--s4)" aria-label="Atividade dos últimos 90 dias">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <Icon name="bolt" size={18} className="text-cinza2" />
          <span className="ds-label">Últimos 90 dias</span>
        </span>
        {!calendar.isLoading && (
          <span className="text-[13px] tabular-nums text-nevoa [font-family:var(--font-display)]">
            {ativos}
            <span className="text-cinza"> dias ativos</span>
          </span>
        )}
      </div>

      {calendar.isLoading ? (
        <Skeleton className="h-[88px] w-full max-w-[200px]" />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Coluna = semana (mais antiga à esquerda), linha = dia da semana */}
          <div className="ds-scroll flex gap-[3px] overflow-x-auto rounded-sm" tabIndex={0} role="region" aria-label="Calendário dos últimos 90 dias (role para os lados)">
            <div className="flex flex-col gap-[3px] pr-1" aria-hidden="true">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="flex h-2 items-center text-[8px] leading-none text-cinza2-texto [font-family:var(--font-display)]">
                  {i % 2 === 0 ? label : ''}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]" role="img" aria-label={`Calendário de atividades: ${ativos} dias ativos nos últimos 90 dias`}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell, ci) => (
                    <Cell key={ci} cell={cell} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <Legend />
        </div>
      )}
    </GlassCard>
  )
}

function Cell({ cell }: { cell: Cell }) {
  if (!cell) return <span className="size-2" />
  const level: ActivityLevel = cell.day
    ? activityLevel(cell.day)
    : 0
  const treino = cell.day?.treino ? '✅' : '—'
  const habitos = cell.day?.habitos_pct ?? 0
  const score = cell.day?.score ?? 0
  const title = `${format(parseDateOnly(cell.date), 'dd/MM')} — Treino: ${treino} | Hábitos: ${habitos}% | Score: ${score}`
  return (
    <span
      className="size-2 rounded-[2px]"
      style={{ backgroundColor: ACTIVITY_LEVEL_COLORS[level] }}
      title={title}
    />
  )
}

function Legend() {
  const levels: ActivityLevel[] = [0, 1, 2, 3, 4]
  return (
    <div className="flex items-center gap-[3px] text-[11px] text-cinza2-texto">
      <span className="mr-1">Menos</span>
      {levels.map((l) => (
        <span
          key={l}
          className="size-2 rounded-[2px]"
          style={{ backgroundColor: ACTIVITY_LEVEL_COLORS[l] }}
        />
      ))}
      <span className="ml-1">Mais</span>
    </div>
  )
}
