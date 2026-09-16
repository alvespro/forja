import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
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
    <GlassCard
      active
      className={cn('flex h-full flex-col gap-3', critico && '!border-alerta')}
      padding="var(--s4)"
      aria-labelledby="gate-titulo"
    >
      <div className="flex items-center gap-2 text-cinza2-texto">
        <Icon name="self_improvement" size={28} className={critico ? 'text-alerta-texto' : 'text-brasa'} />
        <span className="text-[12px] font-medium">{critico ? 'Recuperação crítica' : 'Recuperação baixa'}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="gate-titulo" className="text-[16px] font-bold leading-snug text-nevoa">
          {critico ? `Descanso ativo (${score}%)` : `Treino adaptado (${score}%)`}
        </h2>
        <p className="line-clamp-3 text-[12px] leading-snug text-cinza">
          {critico ? 'Só mobilidade suave hoje; força fica para amanhã.' : 'Mobilidade em vez de força pesada protege a recuperação.'}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={fazerMobilidade} className="ds-btn-primary w-full gap-1 px-2 text-[13px] outline-none">
          <Icon name="self_improvement" size={16} />
          {critico ? 'Mobilidade suave' : 'Mobilidade'}
        </button>
        {!critico && (
          <button
            type="button"
            onClick={treinarMesmo}
            disabled={decidir.isPending}
            className="ds-btn-ghost w-full gap-1 px-2 text-[13px] outline-none"
          >
            <Icon name="fitness_center" size={16} />
            Treinar mesmo
          </button>
        )}
      </div>
    </GlassCard>
  )
}
