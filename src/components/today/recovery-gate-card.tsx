import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { StatusDot } from '@/components/ds/status-dot'
import { useRecoveryDecision } from '@/hooks/use-mobility-routines'
import type { RecoveryGate } from '@/hooks/use-recovery-gate'
import { cn } from '@/lib/utils'

/**
 * Substitui a ação principal quando a recuperação está baixa:
 * crítico (< 40) só oferece mobilidade suave; adaptado (< 60) deixa escolher.
 */
export function RecoveryGateCard({ gate, score }: Pick<RecoveryGate, 'gate' | 'score'>) {
  const navigate = useNavigate()
  const decidir = useRecoveryDecision()
  if (!gate || score == null) return null

  const critico = gate === 'critico'

  function fazerMobilidade() {
    decidir.mutate('mobilidade')
    navigate('/mobilidade?rotina=recuperacao&iniciar=1')
  }

  function treinarMesmo() {
    decidir.mutate('treino', {
      onSuccess: () => toast('Escolha registrada — bom treino, respeite os sinais do corpo.'),
    })
  }

  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-[var(--r-lg)] border bg-aco p-5',
        critico ? 'border-alerta' : 'border-brasa shadow-[var(--shadow-brasa)]',
      )}
      aria-labelledby="gate-titulo"
    >
      <div className="flex flex-col gap-1">
        <StatusDot color={critico ? 'alerta' : 'brasa'} pulse label={critico ? 'Recuperação crítica' : 'Agora'} colorLabel />
        <h2 id="gate-titulo" className="ds-h3 text-foreground">
          {critico ? `🔴 Recuperação crítica (${score}%) — Descanso ativo recomendado` : `🟡 Recuperação: ${score}% — Treino adaptado`}
        </h2>
        <p className="ds-body-md text-aco-texto">
          {critico
            ? 'Hoje o corpo pede descanso. Faça só mobilidade suave e deixe a força para amanhã.'
            : 'Hoje recomendamos mobilidade em vez de força pesada para proteger a recuperação.'}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={fazerMobilidade}
          className="ds-pressable flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brasa px-5 ds-body-md font-semibold text-meia-noite outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          🧘 {critico ? 'Mobilidade suave' : 'Fazer mobilidade'}
        </button>
        {!critico && (
          <button
            type="button"
            onClick={treinarMesmo}
            disabled={decidir.isPending}
            className="ds-pressable flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-linha px-5 ds-body-md font-semibold text-foreground outline-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
          >
            💪 Treinar mesmo
          </button>
        )}
      </div>
    </section>
  )
}
