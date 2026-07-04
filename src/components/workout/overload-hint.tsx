import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'

import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { parseRepsTarget, suggestOverload } from '@/lib/workout-metrics'
import type { WorkoutExercise } from '@/types/database'

type OverloadHintProps = {
  /** Sessão em andamento — excluída do histórico para olhar só a anterior. */
  sessionId: string
  prescription: WorkoutExercise
}

/**
 * Sugestão de progressão exibida DENTRO da sessão, no momento da decisão de
 * carga (a aba Evolução já sugere, mas ninguém a consulta com o peso na mão).
 * Caso positivo: bateu tudo na última → sobe a carga. Caso negativo explícito:
 * fez as séries mas faltou rep → repete a carga (antes era null silencioso).
 */
export function OverloadHint({ sessionId, prescription }: OverloadHintProps) {
  const history = useExerciseHistory(prescription.exercise_id)

  const hint = useMemo(() => {
    const logs = (history.data ?? []).filter((l) => l.session_id !== sessionId)
    if (logs.length === 0) return null

    // Logs da sessão anterior mais recente
    const ultimaSessao = logs.reduce((max, l) => (l.performed_at > max ? l.performed_at : max), '')
    const daUltima = logs.filter((l) => l.performed_at === ultimaSessao)
    if (daUltima.length === 0) return null

    const positivo = suggestOverload(daUltima, prescription)
    if (positivo) return { tipo: 'sobe' as const, texto: positivo }

    const targetReps = parseRepsTarget(prescription.reps_alvo)
    const targetSeries = prescription.series_alvo ?? daUltima.length
    if (targetReps !== null && daUltima.length >= targetSeries) {
      const faltantes = daUltima.filter((l) => (l.reps ?? 0) < targetReps).length
      const melhor = daUltima.reduce((a, b) => ((b.carga_kg ?? 0) > (a.carga_kg ?? 0) ? b : a))
      return {
        tipo: 'mantem' as const,
        texto: `Na última faltou rep em ${faltantes} série${faltantes > 1 ? 's' : ''} — repete ${melhor.carga_kg ?? '—'}kg e busca o topo (${prescription.reps_alvo}).`,
      }
    }
    return null
  }, [history.data, sessionId, prescription])

  if (!hint) return null

  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
        hint.tipo === 'sobe'
          ? 'border-brasa/50 bg-brasa/10 text-brasa'
          : 'border-border/50 bg-card/40 text-aco-texto'
      }`}
    >
      <TrendingUp className="mt-0.5 size-3.5 shrink-0" />
      <span>{hint.texto}</span>
    </div>
  )
}
