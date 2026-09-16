import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { toast } from 'sonner'

import { ObjectiveBadge } from '@/components/body/objective-badge'
import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { useClock } from '@/hooks/use-system-status'
import type { IconName } from '@/lib/icons'
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import { useAchievements, usePersistAchievements } from '@/hooks/use-achievements'
import { useProfile } from '@/hooks/use-profile'
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
import { addDaysToDateString, parseDateOnly, todayInSaoPaulo, toSaoPauloDateString } from '@/lib/date'
import { computeAchievements, last7Days, levelInfo } from '@/lib/gamification'
import { weekdayAbbrevOf } from '@/lib/nutrition'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

// ─── Classificação do dia ────────────────────────────────────────────────────

type Rank = { nome: string; emoji: string; min: number }

const RANKS: Rank[] = [
  { nome: 'Dia forjado', emoji: '🔥', min: 80 },
  { nome: 'Dia sólido', emoji: '💪', min: 60 },
  { nome: 'Dia em construção', emoji: '⚙️', min: 40 },
  { nome: 'Dia fraco', emoji: '🧱', min: 20 },
  { nome: 'Dia parado', emoji: '💤', min: 0 },
]

const ICONE_ATIVIDADE: Record<string, IconName> = {
  sapo: 'flag',
  treino: 'fitness_center',
  habitos: 'task_alt',
  refeicoes: 'restaurant',
  suplementos: 'medication_liquid',
  diario: 'edit_note',
  protocolo: 'medication',
  tarefas: 'checklist',
}

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

/**
 * `afterHero`: conteúdo renderizado logo abaixo do hero (ação principal,
 * hábitos, métricas), antes de nível/semana e conquistas.
 */
export function GamifiedDashboard({ afterHero }: { afterHero?: ReactNode }) {
  const navigate = useNavigate()
  const profile = useProfile()
  const today = todayInSaoPaulo()
  const dataFormatada = format(parseDateOnly(today), "EEEEEE, d 'de' MMM", { locale: ptBR })
  const frase = useDailyQuote(today)
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const relogio = useClock()

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
    // Data do treino no fuso de São Paulo: slice(0, 10) do timestamp é a data em UTC,
    // e um treino após as 21h contava para o dia seguinte no placar.
    const treinoDates = new Set(
      (workoutSessions.data ?? []).filter((s) => s.performed_at).map((s) => toSaoPauloDateString(s.performed_at)),
    )
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
  // `pontos` persistido já inclui o bônus do dia — somar `bonus` de novo contaria 2×.
  const totalXP = scores.reduce((s, d) => s + d.pontos, 0)
  const nivel = levelInfo(totalXP)

  // Nível subindo: celebra só na transição vista nesta sessão, não no carregamento inicial.
  const nivelAnterior = useRef<number | null>(null)
  useEffect(() => {
    if (dailyScores.isLoading) return
    if (nivelAnterior.current !== null && nivel.nivel > nivelAnterior.current) {
      haptic('double')
      toast.success(`⚡ Nível ${nivel.nivel} — ${nivel.titulo}`)
    }
    nivelAnterior.current = nivel.nivel
  }, [nivel.nivel, nivel.titulo, dailyScores.isLoading])
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

  const primeiroNome = (profile.data?.nome?.trim() || 'Welber').split(' ')[0]

  // Sparkline da semana: o ponto de hoje usa o score ao vivo (o salvo pode estar atrasado).
  const serieSemana = semana.map((d) => ({ data: d.data, pct: d.isToday ? pct : d.pct }))
  const ontem = semana.length >= 2 ? semana[semana.length - 2].pct : null
  const delta = ontem != null ? pct - ontem : null

  return (
    <div className="flex flex-col gap-6">
      {/* ── SECTION 1 — HERO (Aaru): saudação, frase, sparkline da semana e o score ── */}
      <GlassCard gradient glow className="flex flex-col gap-4" padding="var(--s5)" aria-label="Resumo do dia">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-[13px] text-cinza">{saudacao},</span>
            <h1 className="truncate text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-nevoa">{primeiroNome}.</h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5">
            <time className="text-[13px] tabular-nums text-cinza [font-family:var(--font-display)]">{relogio}</time>
            <span className="text-[11px] text-cinza2-texto first-letter:uppercase">{dataFormatada}</span>
          </div>
        </div>

        <p className="-mt-2 line-clamp-2 text-[14px] italic leading-snug text-cinza">
          “{frase.texto}”{frase.fonte ? ` — ${frase.fonte}` : ''}
        </p>

        <div className="h-14 w-full" role="img" aria-label={`FORJA Score dos últimos 7 dias: ${serieSemana.map((d) => d.pct).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serieSemana} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
              <YAxis hide domain={[0, 100]} />
              <Line
                type="monotone"
                dataKey="pct"
                stroke="var(--brasa)"
                strokeWidth={2}
                isAnimationActive={false}
                dot={(p: { cx?: number; cy?: number; index?: number }) =>
                  p.index === serieSemana.length - 1 && p.cx != null && p.cy != null ? (
                    <circle key="hoje" cx={p.cx} cy={p.cy} r={4} fill="var(--brasa)" stroke="var(--fundo)" strokeWidth={1.5} />
                  ) : (
                    <g key={`d${p.index}`} />
                  )
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="ds-label">FORJA Score</span>
            <span
              className="text-[48px] font-bold leading-none tracking-[-0.03em] text-brasa tabular-nums [font-family:var(--font-display)]"
              style={{ textShadow: 'var(--glow-brasa)' }}
            >
              {pct}
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-end gap-1 pb-1">
            {delta != null && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[14px] font-bold tabular-nums [font-family:var(--font-display)]',
                  delta > 0 ? 'text-ok' : delta < 0 ? 'text-alerta-texto' : 'text-cinza',
                )}
                aria-label={`${delta > 0 ? 'mais' : delta < 0 ? 'menos' : 'igual a'} ${Math.abs(delta)} pontos que ontem`}
              >
                {delta > 0 ? '+' : delta < 0 ? '−' : ''}
                {Math.abs(delta)}
                <Icon name={delta > 0 ? 'trending_up' : delta < 0 ? 'trending_down' : 'trending_flat'} size={18} />
              </span>
            )}
            <span className="truncate text-[12px] text-cinza2-texto">
              {rank.nome} · {pontos - bonus}/{total} pts
              {bonus > 0 && <span className="text-ok"> · +{bonus}</span>}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Pilares do dia (navegáveis) e descanso planejado */}
      <div className="-mt-3 flex flex-col gap-2">
        <div className="flex">
          <ObjectiveBadge />
        </div>
        <div className="ds-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {activities.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => navigate(a.to)}
              className={cn(
                'ds-pressable flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium',
                a.bonus
                  ? 'border-ok/40 bg-ok/10 text-ok'
                  : a.done
                    ? 'border-brasa/50 bg-brasa/10 text-brasa'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-cinza',
              )}
            >
              <Icon name={ICONE_ATIVIDADE[a.key] ?? 'check_circle'} size={16} filled={a.done} />
              {a.label}
              <span className="text-[10px] tabular-nums opacity-80 [font-family:var(--font-display)]">
                {a.bonus || a.done ? `+${a.earned}` : `${a.earned}/${a.pts}`}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => upsertScore.mutate({ data: today, pontos, total, bonus, rest_day: !restDay })}
            aria-pressed={restDay}
            className={cn(
              'ds-pressable flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium',
              restDay ? 'border-nevoa/40 bg-nevoa/10 text-nevoa' : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-cinza',
            )}
            title={
              restDay
                ? 'Dia de descanso planejado: treino fora do placar de hoje'
                : 'Marcar hoje como dia de descanso planejado (treino sai do total)'
            }
          >
            <Icon name="bedtime" size={16} filled={restDay} />
            {restDay ? 'Descanso planejado' : 'Descanso?'}
          </button>
        </div>
      </div>

      {afterHero}

      {/* ── Nível + semana (compacto) ── */}
      <GlassCard className="flex flex-col gap-4" padding="var(--s4)" aria-label="Nível e semana">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="ds-label">Nível {nivel.nivel}</span>
            <span className="ds-body-md truncate font-semibold text-foreground">
              {nivel.emoji} {nivel.titulo}
            </span>
          </div>
          <span className="shrink-0 text-[18px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">
            {totalXP}
            <span className="ml-1 text-[12px] font-normal text-cinza">XP</span>
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-brasa"
              style={{
                width: `${Math.round(nivel.progresso * 100)}%`,
                transition: 'width var(--dur-slow) var(--spring-smooth)',
              }}
            />
          </div>
          <span className="ds-data-sm text-aco-texto">
            {nivel.xpParaProximo} XP para o nível {nivel.nivel + 1}
          </span>
        </div>

        <div className="flex items-end justify-between gap-1.5" role="img" aria-label="Score dos últimos 7 dias">
          {semana.map((d) => (
            <div key={d.data} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-12 w-full items-end overflow-hidden rounded-[4px] bg-white/[0.04]">
                <div
                  className="w-full rounded-[4px]"
                  style={{
                    height: `${Math.max(d.pct, d.pct > 0 ? 8 : 0)}%`,
                    backgroundColor: d.pct >= 80 ? 'var(--brasa)' : d.pct >= 50 ? 'rgba(252,76,19,0.45)' : 'var(--cinza2)',
                    transition: 'height var(--dur-slow) var(--spring-smooth)',
                  }}
                />
              </div>
              <span className={cn('text-[11px] font-medium', d.isToday ? 'text-brasa' : 'text-cinza2-texto')}>
                {format(parseDateOnly(d.data), 'EEEEEE', { locale: ptBR })}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Conquistas ── */}
      {conquistadas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="ds-label">Conquistas</span>
            <span className="ds-data-md text-aco-texto">
              {conquistadas.length}/{conquistas.length}
            </span>
          </div>
          <div className="ds-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {conquistas.map((c) => (
              <div
                key={c.key}
                title={c.descricao}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 ds-body-sm',
                  c.earned ? 'border-brasa/50 bg-brasa/10 text-nevoa' : 'border-[var(--glass-border)] text-cinza2-texto grayscale',
                )}
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.titulo}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
