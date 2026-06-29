import { useNavigate } from 'react-router-dom'
import { AlarmClock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <Card className="border-atencao/40 bg-atencao/10">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlarmClock className="mt-0.5 size-4 shrink-0 text-atencao" aria-hidden="true" />
          <p className="text-sm text-foreground">
            Seu ciclo termina em {diasRestantes} dia{diasRestantes === 1 ? '' : 's'}. Registre sua pesagem final e
            planeje o próximo ciclo.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/body')}>
          Ir para Corpo
        </Button>
      </CardContent>
    </Card>
  )
}
