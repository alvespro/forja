// Fase 4 — Gamificação: níveis, streak e conquistas derivados de daily_scores.

import { addDaysToDateString } from '@/lib/date'
import type { DailyScore } from '@/types/database'

// ─── Níveis (XP total acumulado) ─────────────────────────────────────────────

export const XP_POR_NIVEL = 500

export type LevelInfo = {
  nivel: number
  titulo: string
  emoji: string
  xpNoNivel: number
  xpParaProximo: number
  progresso: number // 0..1
}

const TITULOS: { min: number; titulo: string; emoji: string }[] = [
  { min: 12, titulo: 'Lenda do Aço', emoji: '⚡' },
  { min: 8, titulo: 'Mestre da Forja', emoji: '👑' },
  { min: 5, titulo: 'Forjador de Aço', emoji: '🗡️' },
  { min: 3, titulo: 'Ferreiro', emoji: '🔨' },
  { min: 1, titulo: 'Aprendiz da Forja', emoji: '⚒️' },
]

export function levelInfo(totalXP: number): LevelInfo {
  const nivel = Math.floor(totalXP / XP_POR_NIVEL) + 1
  const xpNoNivel = totalXP % XP_POR_NIVEL
  const t = TITULOS.find((t) => nivel >= t.min) ?? TITULOS[TITULOS.length - 1]
  return {
    nivel,
    titulo: t.titulo,
    emoji: t.emoji,
    xpNoNivel,
    xpParaProximo: XP_POR_NIVEL - xpNoNivel,
    progresso: xpNoNivel / XP_POR_NIVEL,
  }
}

// ─── Streak ──────────────────────────────────────────────────────────────────

/** Percentual mínimo do dia para contar no streak. */
export const STREAK_MIN_PCT = 50

function pctOf(s: DailyScore): number {
  return s.total > 0 ? Math.round((s.pontos / s.total) * 100) : 0
}

/**
 * Streak de dias consecutivos com pct >= STREAK_MIN_PCT, terminando hoje ou ontem
 * (o dia de hoje em andamento não quebra o streak enquanto não fechar).
 */
export function computeStreak(scores: DailyScore[], today: string): number {
  const byDate = new Map(scores.map((s) => [s.data, s]))

  const hojeConta = (() => {
    const s = byDate.get(today)
    return s ? pctOf(s) >= STREAK_MIN_PCT : false
  })()

  let streak = hojeConta ? 1 : 0
  let cursor = addDaysToDateString(today, -1)

  while (true) {
    const s = byDate.get(cursor)
    if (!s || pctOf(s) < STREAK_MIN_PCT) break
    streak += 1
    cursor = addDaysToDateString(cursor, -1)
  }

  return streak
}

// ─── Últimos 7 dias (para as mini-barras) ────────────────────────────────────

export type DayBar = { data: string; pct: number; isToday: boolean }

export function last7Days(scores: DailyScore[], today: string): DayBar[] {
  const byDate = new Map(scores.map((s) => [s.data, s]))
  const days: DayBar[] = []
  for (let i = 6; i >= 0; i--) {
    const d = addDaysToDateString(today, -i)
    const s = byDate.get(d)
    days.push({ data: d, pct: s ? pctOf(s) : 0, isToday: d === today })
  }
  return days
}

// ─── Conquistas ──────────────────────────────────────────────────────────────

export type Achievement = {
  key: string
  emoji: string
  titulo: string
  descricao: string
  earned: boolean
}

export function computeAchievements(scores: DailyScore[], today: string): Achievement[] {
  const totalXP = scores.reduce((s, d) => s + d.pontos + d.bonus, 0)
  const streak = computeStreak(scores, today)
  const diasForjados = scores.filter((s) => pctOf(s) >= 80).length

  // Semana perfeita: 7 dias consecutivos com pct >= 80 em qualquer ponto do histórico
  const datas = new Set(scores.filter((s) => pctOf(s) >= 80).map((s) => s.data))
  let semanaPerfeita = false
  for (const s of scores) {
    if (pctOf(s) < 80) continue
    let ok = true
    for (let i = 1; i < 7; i++) {
      if (!datas.has(addDaysToDateString(s.data, i))) {
        ok = false
        break
      }
    }
    if (ok) {
      semanaPerfeita = true
      break
    }
  }

  return [
    { key: 'primeiro_forjado', emoji: '🔥', titulo: 'Primeiro FORJADO', descricao: 'Feche um dia com 80%+', earned: diasForjados >= 1 },
    { key: 'streak_7', emoji: '📅', titulo: '7 dias na brasa', descricao: 'Streak de 7 dias (50%+)', earned: streak >= 7 },
    { key: 'streak_30', emoji: '🗓️', titulo: 'Mês de aço', descricao: 'Streak de 30 dias', earned: streak >= 30 },
    { key: 'forjado_10', emoji: '💪', titulo: '10x FORJADO', descricao: '10 dias com 80%+', earned: diasForjados >= 10 },
    { key: 'semana_perfeita', emoji: '🏆', titulo: 'Semana perfeita', descricao: '7 dias seguidos com 80%+', earned: semanaPerfeita },
    { key: 'xp_1000', emoji: '⚒️', titulo: '1.000 XP', descricao: 'Acumule 1.000 XP', earned: totalXP >= 1000 },
    { key: 'xp_5000', emoji: '💎', titulo: '5.000 XP', descricao: 'Acumule 5.000 XP', earned: totalXP >= 5000 },
    { key: 'forjado_50', emoji: '👑', titulo: 'Meio século', descricao: '50 dias com 80%+', earned: diasForjados >= 50 },
  ]
}
