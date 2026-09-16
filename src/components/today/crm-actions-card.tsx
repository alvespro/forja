import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'

import { Card, CardContent } from '@/components/ui/card'
import { useCrmClients } from '@/hooks/use-crm-clients'
import { isAcaoAtrasada, sortByProximaAcao } from '@/lib/crm'
import { todayInSaoPaulo } from '@/lib/date'

/**
 * Ações do CRM vencendo hoje (ou vencidas) no dashboard — o negócio entra no
 * ritual da manhã antes do WhatsApp, junto de treino/dieta/protocolo.
 */
export function CrmActionsCard() {
  const clients = useCrmClients()
  const navigate = useNavigate()
  const today = todayInSaoPaulo()

  const pendentes = sortByProximaAcao(
    (clients.data ?? []).filter(
      (c) =>
        c.data_proxima_acao &&
        c.data_proxima_acao <= today &&
        c.fase !== 'fechado' &&
        c.fase !== 'perdido',
    ),
  )

  if (pendentes.length === 0) return null

  return (
    <Card className="border-cyan-700/30 bg-cyan-950/10">
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="work" size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold text-foreground">Ações do CRM hoje</span>
            <span className="rounded-full bg-cyan-900/50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
              {pendentes.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/crm')}
            className="-my-3 flex min-h-11 min-w-11 items-center justify-end px-1 text-xs text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver →
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {pendentes.slice(0, 4).map((c) => {
            const atrasada = isAcaoAtrasada(c, today)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate('/crm')}
                className="flex items-center justify-between gap-2 rounded-md border border-border/30 bg-card/40 px-3 py-2 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="truncate text-xs text-aco-texto">
                    {c.proxima_acao ?? 'próxima ação'}
                    {c.fase && <span className="capitalize"> · {c.fase}</span>}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-medium ${atrasada ? 'text-alerta-texto' : 'text-cyan-300'}`}
                >
                  {atrasada ? 'vencida' : 'hoje'}
                </span>
              </button>
            )
          })}
          {pendentes.length > 4 && (
            <p className="text-center text-xs text-cinza2-texto">+{pendentes.length - 4} na fila</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
