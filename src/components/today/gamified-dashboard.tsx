import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { useAchievements, usePersistAchievements } from '@/hooks/use-achievements'
import { useActiveProtocol } from '@/hooks/use-protocols'
import { useDailyScores, useUpsertDailyScore } from '@/hooks/use-daily-scores'
import { useHabits, useHabitLogs, groupLogsByHabit } from '@/hooks/use-habits'
import { useJournalHistory } from '@/hooks/use-journal-history'
import { useMealLogsRange } from '@/hooks/use-meal-logs'
import { useProtocolLogs } from '@/hooks/use-protocol-logs'
import { useSupplementLogs } from '@/hooks/use-supplement-logs'
import { useSupplements } from '@/hooks/use-supplements'
import { useTasks } from '@/hooks/use-tasks'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useDailyQuote } from '@/hooks/use-daily-quote'
import { computeDayScore, PTS, type DayScoreInputs } from '@/lib/daily-score'
import { addDaysToDateString, parseDateOnly, todayInSaoPaulo } from '@/lib/date'
import { computeAchievements, computeStreak, last7Days, levelInfo } from '@/lib/gamification'
import { weekdayAbbrevOf } from '@/lib/nutrition'
import { cn } from '@/lib/utils'

// ─── Ranking do dia ──────────────────────────────────────────────────────────

type Rank = { nome: string; emoji: string; cor: string; min: number }

const RANKS: Rank[] = [
  { nome: 'FORJADO', emoji: '🔥', cor: '#F0A93B', min: 80 },
  { nome: 'Ouro', emoji: '🥇', cor: '#FFD60A', min: 60 },
  { nome: 'Prata', emoji: '🥈', cor: '#C7C7CC', min: 40 },
  { nome: 'Bronze', emoji: '🥉', cor: '#CB6A4E', min: 20 },
  { nome: 'Ferro', emoji: '⚒️', cor: '#8E8E93', min: 0 },
]

function rankOf(pct: number): Rank {
  return RANKS.find((r) => pct >= r.min) ?? RANKS[RANKS.length - 1]
}

type Activity = {
  key: string
  emoji: string
  label: string
  pts: number
  earned: number
  done: boolean
  bonus?: boolean
  to: string
}

export function GamifiedDashboard() {
  const navigate = useNavigate()
  const today = todayInSaoPaulo()
  const dataFormatada = format(parseDateOnly(today), "EEEE, d 'de' MMMM", { locale: ptBR })
  const frase = useDailyQuote(today)
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  // ── Dados ──
  const habits = useHabits()
  const habitLogs = useHabitLogs()
  const workoutSessions = useWorkoutSessions()
  const mealRange = useMealLogsRange(8)
  const supplements = useSupplements()
  const supplementLogs = useSupplementLogs()
  const journalHistory = useJournalHistory()
  const tasks = useTasks()
  const protocol = useActiveProtocol()
  const protocolLogs = useProtocolLogs(protocol.data?.id, 30)
  const dailyScores = useDailyScores()
  const upsertScore = useUpsertDailyScore()

  // Dia de descanso planejado (flag persistida no score de hoje)
  const restDay = (dailyScores.data ?? []).find((s) => s.data === today)?.rest_day ?? false

  // Janela do recálculo retroativo: 7 dias atrás → hoje. Dia executado sem
  // abrir o app deixa de quebrar o streak; edição retroativa entra no placar.
  const janela = useMemo(
    () => Array.from({ length: 8 }, (_, i) => addDaysToDateString(today, -(7 - i))),
    [today],
  )

  // Insumos de pontuação por dia — fonte única (lib/daily-score) para hoje e retro
  const inputsPorDia = useMemo(() => {
    const ativos = (habits.data ?? []).filter((h) => h.ativo)
    const porHabito = groupLogsByHabit(habitLogs.data)
    const treinoDates = new Set((workoutSessions.data ?? []).map((s) => s.performed_at?.slice(0, 10)))
    const mealCount = new Map<string, number>()
    for (const m of mealRange.data ?? []) mealCount.set(m.data, (mealCount.get(m.data) ?? 0) + 1)
    const diarioDates = new Set((journalHistory.data ?? []).map((j) => j.data))
    const protocolLogDates = new Set((protocolLogs.data ?? []).map((l) => l.data_aplicacao))
    const restDayByDate = new Map((dailyScores.data ?? []).map((s) => [s.data, s.rest_day]))

    const map = new Map<string, DayScoreInputs>()
    for (const d of janela) {
      const doDia = (supplements.data ?? []).filter(
        (s) => s.ativo && (s.dias_semana ?? []).includes(weekdayAbbrevOf(d)),
      )
      const tomados = doDia.filter((s) =>
        (supplementLogs.data ?? []).some((l) => l.supplement_id === s.id && l.data === d && l.tomado),
      ).length
      const tarefasDoDia = (tasks.data ?? []).filter((t) => t.data === d)

      map.set(d, {
        frogDone: tarefasDoDia.some((t) => t.e_frog && t.status === 'feito'),
        habitosAtivos: ativos.length,
        habitosFeitos: ativos.filter((h) => porHabito.get(h.id)?.has(d)).length,
        treinou: treinoDates.has(d),
        restDay: restDayByDate.get(d) ?? false,
        nRefeicoes: mealCount.get(d) ?? 0,
        suplementosDoDia: doDia.length,
        suplementosTomados: tomados,
        diarioFeito: diarioDates.has(d),
        protocoloAtivo: protocol.data?.status === 'ativo',
        protocoloLogado: protocolLogDates.has(d),
        tarefasFeitas: tarefasDoDia.filter((t) => t.status === 'feito' && !t.e_frog).length,
      })
    }
    return map
  }, [
    janela,
    habits.data,
    habitLogs.data,
    workoutSessions.data,
    mealRange.data,
    supplements.data,
    supplementLogs.data,
    journalHistory.data,
    tasks.data,
    protocol.data,
    protocolLogs.data,
    dailyScores.data,
  ])

  const hoje = inputsPorDia.get(today)

  // Chips do dia — visual; os NÚMEROS vêm todos de computeDayScore (fonte única)
  const activities = useMemo(() => {
    const i = hoje
    if (!i) return [] as Activity[]
    const list: Activity[] = []

    list.push({ key: 'sapo', emoji: '🐸', label: 'Sapo', pts: PTS.sapo, earned: i.frogDone ? PTS.sapo : 0, done: i.frogDone, to: '/tarefas' })

    if (!i.restDay) {
      list.push({ key: 'treino', emoji: '💪', label: 'Treino', pts: PTS.treino, earned: i.treinou ? PTS.treino : 0, done: i.treinou, to: '/workout' })
    }

    if (i.habitosAtivos > 0) {
      list.push({
        key: 'habitos',
        emoji: '✅',
        label: `Hábitos ${i.habitosFeitos}/${i.habitosAtivos}`,
        pts: i.habitosAtivos * PTS.habito,
        earned: i.habitosFeitos * PTS.habito,
        done: i.habitosFeitos === i.habitosAtivos,
        to: '/habits',
      })
    }

    list.push({
      key: 'refeicoes',
      emoji: '🍽️',
      label: `Refeições ${i.nRefeicoes}`,
      pts: PTS.refeicoes,
      earned: Math.min(PTS.refeicoes, i.nRefeicoes * 5),
      done: i.nRefeicoes >= 3,
      to: '/nutricao',
    })

    if (i.suplementosDoDia > 0) {
      const doneSup = i.suplementosTomados === i.suplementosDoDia
      list.push({
        key: 'suplementos',
        emoji: '💊',
        label: `Suplementos ${i.suplementosTomados}/${i.suplementosDoDia}`,
        pts: PTS.suplementos,
        earned: doneSup ? PTS.suplementos : Math.round((i.suplementosTomados / i.suplementosDoDia) * PTS.suplementos),
        done: doneSup,
        to: '/suplementos',
      })
    }

    list.push({ key: 'diario', emoji: '📓', label: 'Diário', pts: PTS.diario, earned: i.diarioFeito ? PTS.diario : 0, done: i.diarioFeito, to: '/journal' })

    if (i.protocoloAtivo) {
      list.push({ key: 'protocolo', emoji: '💉', label: 'Protocolo', pts: PTS.protocolo, earned: i.protocoloLogado ? PTS.protocolo : 0, done: i.protocoloLogado, to: '/protocolo' })
    }

    if (i.tarefasFeitas > 0) {
      list.push({
        key: 'tarefas',
        emoji: '✔️',
        label: `Tarefas +${i.tarefasFeitas}`,
        pts: 0,
        earned: i.tarefasFeitas * PTS.tarefaBonus,
        done: true,
        bonus: true,
        to: '/tarefas',
      })
    }

    return list
  }, [hoje])

  const { pontos, total, bonus } = hoje ? computeDayScore(hoje) : { pontos: 0, total: 0, bonus: 0 }

  const pct = total > 0 ? Math.min(100, Math.round((pontos / total) * 100)) : 0
  const rank = rankOf(pct)

  // ── Persistência: recálculo retroativo da janela de 8 dias ──
  // Grava só o que divergiu do armazenado; rest_day não é enviado nos dias
  // passados, então a flag existente é preservada pelo upsert.
  const carregando =
    habits.isLoading ||
    habitLogs.isLoading ||
    workoutSessions.isLoading ||
    mealRange.isLoading ||
    supplementLogs.isLoading ||
    journalHistory.isLoading ||
    tasks.isLoading ||
    dailyScores.isLoading
  const salvos = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (carregando) return
    const armazenados = new Map((dailyScores.data ?? []).map((s) => [s.data, s]))
    for (const d of janela) {
      const inp = inputsPorDia.get(d)
      if (!inp) continue
      const calc = computeDayScore(inp)
      if (calc.total === 0) continue
      const chave = `${d}:${calc.pontos}:${calc.total}:${calc.bonus}`
      if (salvos.current.has(chave)) continue
      salvos.current.add(chave)
      const atual = armazenados.get(d)
      if (atual && atual.pontos === calc.pontos && atual.total === calc.total && atual.bonus === calc.bonus) continue
      upsertScore.mutate({ data: d, pontos: calc.pontos, total: calc.total, bonus: calc.bonus })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, inputsPorDia, janela])

  // ── Streak, nível, histórico e conquistas ──
  const scores = dailyScores.data ?? []
  const streak = computeStreak(scores, today)
  // `pontos` persistido já inclui o bônus do dia — somar `bonus` de novo contaria 2×.
  const totalXP = scores.reduce((s, d) => s + d.pontos, 0)
  const nivel = levelInfo(totalXP)
  const semana = last7Days(scores, today)

  // Conquista desbloqueada é definitiva: o cálculo da janela é sobreposto
  // pelo que está persistido em `achievements` (não "desconquista" mais).
  const persisted = useAchievements()
  const persistAchievements = usePersistAchievements()
  const persistedKeys = useMemo(
    () => new Set((persisted.data ?? []).map((a) => a.key)),
    [persisted.data],
  )
  const conquistas = useMemo(
    () =>
      computeAchievements(dailyScores.data ?? [], today).map((c) => ({
        ...c,
        earned: c.earned || persistedKeys.has(c.key),
      })),
    [dailyScores.data, today, persistedKeys],
  )
  const conquistadas = conquistas.filter((c) => c.earned)

  // Celebração no momento do desbloqueio (antes só aparecia no card, mudo)
  const celebrados = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (persisted.isLoading || dailyScores.isLoading) return
    const novos = conquistas.filter(
      (c) => c.earned && !persistedKeys.has(c.key) && !celebrados.current.has(c.key),
    )
    if (novos.length === 0) return
    for (const c of novos) celebrados.current.add(c.key)
    persistAchievements.mutate(novos.map((c) => c.key))
    for (const c of novos) {
      toast.success(`🏅 Conquista desbloqueada: ${c.emoji} ${c.titulo}`, { description: c.descricao })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conquistas, persistedKeys, persisted.isLoading, dailyScores.isLoading])

  // Anel de progresso (SVG)
  const R = 34
  const CIRC = 2 * Math.PI * R

  return (
    <div className="flex flex-col gap-4">
      {/* ── Saudação + frase do dia ── */}
      <div>
        <p className="text-sm capitalize text-aco-texto">{dataFormatada}</p>
        <h1 className="font-heading text-2xl font-bold text-foreground">{saudacao}, Welber ⚒️</h1>
      </div>

      <Card className="border-brasa/25 bg-gradient-to-br from-brasa/10 to-transparent">
        <CardContent className="py-3.5">
          <p className="font-heading text-base font-semibold leading-snug text-foreground">
            "{frase.texto}"
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-brasa/80">
            {frase.emoji} {frase.fonte ?? 'Frase do dia'}
          </p>
        </CardContent>
      </Card>

      {/* ── Score do dia ── */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            {/* Anel */}
            <div className="relative size-[84px] shrink-0">
              <svg viewBox="0 0 84 84" className="size-full -rotate-90">
                <circle cx="42" cy="42" r={R} fill="none" stroke="var(--border)" strokeWidth="7" opacity="0.35" />
                <circle
                  cx="42"
                  cy="42"
                  r={R}
                  fill="none"
                  stroke={rank.cor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - pct / 100)}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-foreground leading-none">{pct}%</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{rank.emoji}</span>
                <span className="font-heading text-lg font-bold" style={{ color: rank.cor }}>
                  {rank.nome}
                </span>
              </div>
              <p className="text-sm text-aco-texto">
                <span className="font-semibold text-foreground">{pontos - bonus}</span> de {total} pts
                {bonus > 0 && <span className="text-green-400"> (+{bonus} bônus)</span>}
              </p>
              <p className="mt-0.5 text-xs text-aco-texto/70">
                {pct >= 80
                  ? 'Dia forjado. É esse o padrão.'
                  : pct >= 50
                    ? 'Na briga. Fecha o dia por cima.'
                    : 'O dia ainda está aberto. Marca ponto.'}
              </p>
            </div>
          </div>

          {/* Chips de atividades */}
          <div className="flex flex-wrap gap-1.5">
            {activities.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => navigate(a.to)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  a.bonus
                    ? 'border-green-700/50 bg-green-950/30 text-green-400'
                    : a.done
                      ? 'border-brasa/50 bg-brasa/15 text-brasa'
                      : 'border-border/50 bg-card/40 text-aco-texto hover:border-border',
                )}
              >
                <span>{a.emoji}</span>
                <span>{a.label}</span>
                <span className={cn('font-semibold', a.done || a.bonus ? '' : 'opacity-50')}>
                  {a.bonus ? `+${a.earned}` : a.done ? `+${a.earned}` : `${a.earned}/${a.pts}`}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                upsertScore.mutate({ data: today, pontos, total, bonus, rest_day: !restDay })
              }
              className={cn(
                'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                restDay
                  ? 'border-sky-700/60 bg-sky-950/40 text-sky-300'
                  : 'border-border/40 bg-card/30 text-aco-texto/60 hover:border-border',
              )}
              title={
                restDay
                  ? 'Dia de descanso planejado: treino fora do placar de hoje'
                  : 'Marcar hoje como dia de descanso planejado (treino sai do total)'
              }
            >
              🛌 {restDay ? 'Descanso planejado' : 'Dia de descanso?'}
            </button>
          </div>

          {/* ── Streak + Nível ── */}
          <div className="flex items-center gap-3 border-t border-border/30 pt-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn('text-lg', streak === 0 && 'grayscale opacity-50')}>🔥</span>
              <div>
                <p className="text-sm font-bold text-foreground leading-none">{streak}</p>
                <p className="text-[10px] text-aco-texto">
                  dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">
                  {nivel.emoji} Nv. {nivel.nivel} — {nivel.titulo}
                </span>
                <span className="text-aco-texto">{totalXP} XP</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                <div
                  className="h-full rounded-full bg-brasa transition-all duration-500"
                  style={{ width: `${Math.round(nivel.progresso * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-aco-texto/70">
                {nivel.xpParaProximo} XP para o nível {nivel.nivel + 1}
              </p>
            </div>
          </div>

          {/* ── Últimos 7 dias ── */}
          <div className="flex items-end justify-between gap-1.5">
            {semana.map((d) => (
              <div key={d.data} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-10 w-full items-end overflow-hidden rounded-sm bg-border/25">
                  <div
                    className={cn('w-full rounded-sm transition-all duration-500')}
                    style={{
                      height: `${Math.max(d.pct, d.pct > 0 ? 8 : 0)}%`,
                      backgroundColor: d.pct >= 80 ? '#F0A93B' : d.pct >= 50 ? '#5FA88C' : '#8E8E93',
                    }}
                  />
                </div>
                <span className={cn('text-[9px]', d.isToday ? 'font-bold text-brasa' : 'text-aco-texto/70')}>
                  {format(parseDateOnly(d.data), 'EEEEEE', { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Conquistas ── */}
      {conquistadas.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2.5 py-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">🏅 Conquistas</p>
              <span className="text-xs text-aco-texto">
                {conquistadas.length}/{conquistas.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {conquistas.map((c) => (
                <div
                  key={c.key}
                  title={c.descricao}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs',
                    c.earned
                      ? 'border-brasa/50 bg-brasa/10 text-foreground'
                      : 'border-border/40 bg-card/30 text-aco-texto/50 grayscale',
                  )}
                >
                  <span>{c.emoji}</span>
                  <span className="font-medium">{c.titulo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
