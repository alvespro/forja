import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { CardioSession } from '@/types/database'

export const META_CORRIDA_KM = 3

type CardioGoalCardProps = {
  sessions: CardioSession[]
}

/** Meta "corrida contínua de 3km" — maior distância já registrada num cardio tipo 'longo'. */
export function CardioGoalCard({ sessions }: CardioGoalCardProps) {
  const corridas = sessions.filter((session) => session.tipo === 'longo' && session.distancia_km !== null)
  const melhorDistancia = corridas.reduce((max, session) => Math.max(max, session.distancia_km ?? 0), 0)
  const pct = Math.min(100, (melhorDistancia / META_CORRIDA_KM) * 100)
  const atingiuMeta = melhorDistancia >= META_CORRIDA_KM
  const ultimas5 = corridas.slice(0, 5)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-aco-texto">Meta: 3km contínuos</p>
          <span className={`font-mono text-sm ${atingiuMeta ? 'text-ok' : 'text-aco-texto'}`}>
            {melhorDistancia.toFixed(1)} / {META_CORRIDA_KM}km
          </span>
        </div>
        <Progress
          value={pct}
          className={atingiuMeta ? '[&_[data-slot=progress-indicator]]:bg-ok' : undefined}
        />

        {ultimas5.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-border pt-2">
            {ultimas5.map((session) => (
              <div key={session.id} className="flex items-center justify-between text-xs">
                <span className="text-aco-texto">
                  {format(new Date(session.performed_at), "d 'de' MMMM", { locale: ptBR })}
                </span>
                <span className="font-mono text-foreground">{session.distancia_km}km</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
