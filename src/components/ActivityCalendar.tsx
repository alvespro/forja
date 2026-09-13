import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
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

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <p className="font-heading text-sm font-bold text-foreground">Atividade — últimos 90 dias</p>

        {calendar.isLoading ? (
          <Skeleton className="h-40 w-full max-w-[220px]" />
        ) : (
          <div className="flex flex-col gap-1">
            {/* Cabeçalho de dias da semana */}
            <div className="grid grid-cols-7 gap-1" style={{ maxWidth: 154 }} aria-hidden="true">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="text-center text-[9px] leading-none text-aco-texto">
                  {label}
                </span>
              ))}
            </div>

            {/* Grade de semanas (linha = semana, coluna = dia) */}
            <div className="flex flex-col gap-1" role="img" aria-label="Calendário de atividades dos últimos 90 dias">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1" style={{ maxWidth: 154 }}>
                  {week.map((cell, ci) => (
                    <Cell key={ci} cell={cell} />
                  ))}
                </div>
              ))}
            </div>

            <Legend />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Cell({ cell }: { cell: Cell }) {
  if (!cell) return <span className="size-[14px]" />
  const level: ActivityLevel = cell.day
    ? activityLevel(cell.day)
    : 0
  const treino = cell.day?.treino ? '✅' : '—'
  const habitos = cell.day?.habitos_pct ?? 0
  const score = cell.day?.score ?? 0
  const title = `${format(parseDateOnly(cell.date), 'dd/MM')} — Treino: ${treino} | Hábitos: ${habitos}% | Score: ${score}`
  return (
    <span
      className="size-[14px] rounded-[2px]"
      style={{ backgroundColor: ACTIVITY_LEVEL_COLORS[level] }}
      title={title}
    />
  )
}

function Legend() {
  const levels: ActivityLevel[] = [0, 1, 2, 3, 4]
  return (
    <div className="flex items-center gap-1 text-[9px] text-aco-texto">
      <span>Menos</span>
      {levels.map((l) => (
        <span
          key={l}
          className="size-[10px] rounded-[2px]"
          style={{ backgroundColor: ACTIVITY_LEVEL_COLORS[l] }}
        />
      ))}
      <span>Mais</span>
    </div>
  )
}
