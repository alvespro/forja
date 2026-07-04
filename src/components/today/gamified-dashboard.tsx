import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent } from '@/components/ui/card'
import { useActiveProtocol } from '@/hooks/use-protocols'
import { useDailyScores, useUpsertDailyScore } from '@/hooks/use-daily-scores'
import { useFrogTask } from '@/hooks/use-frog-task'
import { useHabits, useHabitLogs, groupLogsByHabit } from '@/hooks/use-habits'
import { useJournalEntry } from '@/hooks/use-journal-entry'
import { useMealLogsToday } from '@/hooks/use-meal-logs'
import { useProtocolLogs } from '@/hooks/use-protocol-logs'
import { useSupplementLogs } from '@/hooks/use-supplement-logs'
import { useSupplements } from '@/hooks/use-supplements'
import { useTasks } from '@/hooks/use-tasks'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useDailyQuote } from '@/hooks/use-daily-quote'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'
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
  const frog = useFrogTask()
  const habits = useHabits()
  const habitLogs = useHabitLogs()
  const workoutSessions = useWorkoutSessions()
  const mealLogs = useMealLogsToday()
  const supplements = useSupplements()
  const supplementLogs = useSupplementLogs()
  const journal = useJournalEntry(today, 'diario')
  const tasks = useTasks({ data: today })
  const protocol = useActiveProtocol()
  const protocolLogs = useProtocolLogs(protocol.data?.id, 10)
  const dailyScores = useDailyScores()
  const upsertScore = useUpsertDailyScore()

  // Dia de descanso planejado (flag persistida no score de hoje)
  const restDay = (dailyScores.data ?? []).find((s) => s.data === today)?.rest_day ?? false

  const { activities, pontos, total, bonus } = useMemo(() => {
    const list: Activity[] = []

    // 🐸 Sapo do dia — 20 pts
    const sapoFeito = frog.data?.status === 'feito'
    list.push({ key: 'sapo', emoji: '🐸', label: 'Sapo', pts: 20, earned: sapoFeito ? 20 : 0, done: !!sapoFeito, to: '/tarefas' })

    // 💪 Treino — 25 pts; em dia de descanso planejado sai do denominador
    // (recuperação é parte do programa — dia de recovery perfeito pode ser FORJADO)
    if (!restDay) {
      const treinoHoje = (workoutSessions.data ?? []).some((s) => s.performed_at?.slice(0, 10) === today)
      list.push({ key: 'treino', emoji: '💪', label: 'Treino', pts: 25, earned: treinoHoje ? 25 : 0, done: treinoHoje, to: '/workout' })
    }

    // ✅ Hábitos — 5 pts cada
    const ativos = (habits.data ?? []).filter((h) => h.ativo)
    const porHabito = groupLogsByHabit(habitLogs.data)
    const habitosFeitos = ativos.filter((h) => porHabito.get(h.id)?.has(today)).length
    if (ativos.length > 0) {
      list.push({
        key: 'habitos',
        emoji: '✅',
        label: `Hábitos ${habitosFeitos}/${ativos.length}`,
        pts: ativos.length * 5,
        earned: habitosFeitos * 5,
        done: habitosFeitos === ativos.length,
        to: '/habits',
      })
    }

    // 🍽️ Refeições — 15 pts (3+ registros)
    const nRefeicoes = (mealLogs.data ?? []).length
    const ptsRefeicoes = Math.min(15, nRefeicoes * 5)
    list.push({
      key: 'refeicoes',
      emoji: '🍽️',
      label: `Refeições ${nRefeicoes}`,
      pts: 15,
      earned: ptsRefeicoes,
      done: nRefeicoes >= 3,
      to: '/meals',
    })

    // 💊 Suplementos — 10 pts (todos do dia tomados)
    const doDia = (supplements.data ?? []).filter(
      (s) => s.ativo && (s.dias_semana ?? []).includes(weekdayAbbrevOf(today)),
    )
    if (doDia.length > 0) {
      const tomados = doDia.filter((s) =>
        (supplementLogs.data ?? []).some((l) => l.supplement_id === s.id && l.data === today && l.tomado),
      ).length
      const doneSup = tomados === doDia.length
      list.push({
        key: 'suplementos',
        emoji: '💊',
        label: `Suplementos ${tomados}/${doDia.length}`,
        pts: 10,
        earned: doneSup ? 10 : Math.round((tomados / doDia.length) * 10),
        done: doneSup,
        to: '/suplementos',
      })
    }

    // 📓 Diário — 10 pts
    const diarioFeito = !!journal.data
    list.push({ key: 'diario', emoji: '📓', label: 'Diário', pts: 10, earned: diarioFeito ? 10 : 0, done: diarioFeito, to: '/journal' })

    // 💉 Protocolo — 10 pts (só se ciclo ativo)
    if (protocol.data?.status === 'ativo') {
      const logHoje = (protocolLogs.data ?? []).some((l) => l.data_aplicacao === today)
      list.push({ key: 'protocolo', emoji: '💉', label: 'Protocolo', pts: 10, earned: logHoje ? 10 : 0, done: logHoje, to: '/protocolo' })
    }

    // ✔️ Tarefas concluídas — bônus +5 cada (não entra no total)
    const tarefasFeitas = (tasks.data ?? []).filter((t) => t.status === 'feito' && !t.e_frog).length
    const bonusPts = tarefasFeitas * 5
    if (tarefasFeitas > 0) {
      list.push({
        key: 'tarefas',
        emoji: '✔️',
        label: `Tarefas +${tarefasFeitas}`,
        pts: 0,
        earned: bonusPts,
        done: true,
        bonus: true,
        to: '/tarefas',
      })
    }

    const totalBase = list.filter((a) => !a.bonus).reduce((s, a) => s + a.pts, 0)
    const ganhos = list.reduce((s, a) => s + a.earned, 0)

    return { activities: list, pontos: ganhos, total: totalBase, bonus: bonusPts }
  }, [
    frog.data,
    habits.data,
    habitLogs.data,
    workoutSessions.data,
    mealLogs.data,
    supplements.data,
    supplementLogs.data,
    journal.data,
    tasks.data,
    protocol.data,
    protocolLogs.data,
    restDay,
    today,
  ])

  const pct = total > 0 ? Math.min(100, Math.round((pontos / total) * 100)) : 0
  const rank = rankOf(pct)

  // ── Persistência do score do dia (upsert idempotente) ──
  const carregando =
    frog.isLoading || habits.isLoading || workoutSessions.isLoading || mealLogs.isLoading || journal.isLoading
  const ultimoSalvo = useRef<string | null>(null)

  useEffect(() => {
    if (carregando || total === 0) return
    const chave = `${today}:${pontos}:${total}:${bonus}`
    if (ultimoSalvo.current === chave) return
    ultimoSalvo.current = chave
    upsertScore.mutate({ data: today, pontos, total, bonus })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, pontos, total, bonus, today])

  // ── Streak, nível, histórico e conquistas ──
  const scores = dailyScores.data ?? []
  const streak = computeStreak(scores, today)
  // `pontos` persistido já inclui o bônus do dia — somar `bonus` de novo contaria 2×.
  const totalXP = scores.reduce((s, d) => s + d.pontos, 0)
  const nivel = levelInfo(totalXP)
  const semana = last7Days(scores, today)
  const conquistas = computeAchievements(scores, today)
  const conquistadas = conquistas.filter((c) => c.earned)

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
