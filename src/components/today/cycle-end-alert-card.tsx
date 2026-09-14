import { useNavigate } from 'react-router-dom'
import { AlarmClock } from 'lucide-react'

import { AlertItem } from '@/components/ds/alert-item'
import { useActiveCycle } from '@/hooks/use-active-cycle'
import { cycleDaysRemaining, DIAS_ALERTA_FIM_CICLO } from '@/lib/body-goals'

/** Avisa quando faltam ≤14 dias para o fim do ciclo ativo, sugerindo pesagem final + próximo ciclo. */
export function CycleEndAlertCard() {
  const activeCycle = useActiveCycle()
  const navigate = useNavigate()

  if (!activeCycle.data) return null

  const diasRestantes = cycleDaysRemaining(activeCycle.data.data_fim)
  if (diasRestantes > DIAS_ALERTA_FIM_CICLO) return null

  return (
    <AlertItem
      tone={diasRestantes <= 3 ? 'critico' : 'atencao'}
      icon={AlarmClock}
      title={`Ciclo termina em ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'}`}
      body="Registre a pesagem final e planeje o próximo ciclo."
      action={{ label: 'Ir para Corpo', onClick: () => navigate('/body') }}
    />
  )
}
