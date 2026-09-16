import { useSearchParams } from 'react-router-dom'

import { GlassCard } from '@/components/GlassCard'
import { ProgressRing } from '@/components/ds/progress-ring'
import { StatusDot } from '@/components/ds/status-dot'
import { useRecoveryScores } from '@/hooks/use-sleep-logs'
import { todayInSaoPaulo } from '@/lib/date'
import { statusRecuperacao } from '@/lib/today-grid'

/**
 * SECTION 2 (col. 1) do cockpit, no formato do Focus Timer do Aaru: anel de 120px
 * com o score de recuperação no centro. Tocar abre a pergunta de sono/disposição.
 */
export function RecoveryRingCard() {
  const hoje = todayInSaoPaulo()
  const scores = useRecoveryScores(14)
  const [, setParams] = useSearchParams()

  const deHoje = (scores.data ?? []).find((s) => s.data === hoje) ?? null
  const score = deHoje?.score ?? null
  const status = score != null ? statusRecuperacao(score) : null

  function abrir() {
    setParams(
      (p) => {
        p.set('recuperacao', 'editar')
        return p
      },
      { replace: true },
    )
  }

  return (
    <GlassCard
      onClick={abrir}
      className="flex h-full flex-col items-center gap-3 text-center"
      padding="var(--s4)"
      aria-label={score != null ? `Recovery ${score}% — ${status?.label}. Ajustar sono e disposição` : 'Informar sono e disposição'}
    >
      <span className="ds-label">Recovery</span>
      <ProgressRing value={score ?? 0} size="lg" label={undefined}>
        <span className="flex items-baseline">
          <span className="text-[36px] font-bold leading-none tabular-nums text-brasa [font-family:var(--font-display)]">
            {score ?? '—'}
          </span>
          {score != null && <span className="text-[18px] text-cinza [font-family:var(--font-display)]">%</span>}
        </span>
      </ProgressRing>
      <StatusDot
        color={status?.cor ?? 'cinza'}
        pulse={status?.cor === 'alerta'}
        label={status?.label ?? 'Informe o sono'}
        colorLabel={status != null}
        className="justify-center"
      />
    </GlassCard>
  )
}
