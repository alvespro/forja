import { useNavigate } from 'react-router-dom'

import { useActiveBodyGoal } from '@/hooks/use-body-goals'
import { cycleDaysRemaining, DIAS_ALERTA_FIM_CICLO, OBJETIVO_BADGE_CLASS, OBJETIVO_ICONS, OBJETIVO_LABELS } from '@/lib/body-goals'
import { cn } from '@/lib/utils'

/** Badge discreto com o objetivo do ciclo ativo — usado no header de Hoje, Nutrição, Corpo e Treino. */
export function ObjectiveBadge() {
  const activeGoal = useActiveBodyGoal()
  const navigate = useNavigate()

  if (!activeGoal.data || !activeGoal.data.cycle) return null

  const { objetivo, cycle } = activeGoal.data
  const diasRestantes = cycleDaysRemaining(cycle.data_fim)
  const fimProximo = diasRestantes <= DIAS_ALERTA_FIM_CICLO

  return (
    <button
      type="button"
      onClick={() => navigate('/body')}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        fimProximo ? 'border-atencao/40 bg-atencao/15 text-atencao' : OBJETIVO_BADGE_CLASS[objetivo],
      )}
    >
      {fimProximo ? (
        <>⏰ {diasRestantes} dia{diasRestantes === 1 ? '' : 's'} para o fim do ciclo</>
      ) : (
        <>
          {OBJETIVO_ICONS[objetivo]} {OBJETIVO_LABELS[objetivo]}
        </>
      )}
    </button>
  )
}
