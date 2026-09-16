import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useActiveProtocol } from '@/hooks/use-protocols'
import { useProtocolCompounds } from '@/hooks/use-protocol-compounds'
import { useProtocolExams } from '@/hooks/use-protocol-exams'
import { useProtocolSupport } from '@/hooks/use-protocol-support'
import { useCreateProtocolLog, useProtocolLogs } from '@/hooks/use-protocol-logs'
import { todayInSaoPaulo } from '@/lib/date'
import { computeWeekNumber } from '@/lib/protocol'

export function ProtocolSummaryCard() {
  const protocol = useActiveProtocol()
  const p = protocol.data
  const navigate = useNavigate()
  const createLog = useCreateProtocolLog()

  const compounds = useProtocolCompounds(p?.id)
  const exams = useProtocolExams(p?.id)
  const support = useProtocolSupport(p?.id)
  const logs = useProtocolLogs(p?.id, 10)

  const today = todayInSaoPaulo()
  const weekNum = p ? computeWeekNumber(p.data_inicio, today) : 0

  if (!p || p.status === 'concluido') return null

  // Próximo exame pendente
  const proximoExame = (exams.data ?? [])
    .filter((e) => e.status !== 'realizado' && e.data_prevista)
    .sort((a, b) => (a.data_prevista ?? '').localeCompare(b.data_prevista ?? ''))[0]

  const diasParaExame = proximoExame?.data_prevista
    ? Math.ceil((new Date(proximoExame.data_prevista + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Suportes ativos
  const suportesAtivos = (support.data ?? []).filter((s) => s.ativo)

  // Principal composto (primeiro da lista)
  const mainCompound = compounds.data?.[0]

  const jaRegistradoHoje = (logs.data ?? []).some(
    (l) => l.data_aplicacao === today && l.compound_id === mainCompound?.id,
  )

  function handleRegistrarAplicacao() {
    if (!p || !mainCompound || jaRegistradoHoje) return
    createLog.mutate({
      protocol_id: p.id,
      compound_id: mainCompound.id,
      dose_aplicada_mg: mainCompound.dose_mg,
    })
  }

  return (
    <Card className="border-linha bg-aco">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="science" size={16} className="text-cinza" />
            <span className="text-sm font-semibold text-foreground">
              🔬 Protocolo — Semana {weekNum}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/protocolo')}
            className="-my-3 flex min-h-11 min-w-11 items-center justify-end px-1 text-xs text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver →
          </button>
        </div>

        {/* Composto principal */}
        {mainCompound && p.status === 'ativo' && (
          <div className="flex items-center justify-between rounded-md border border-linha bg-aco px-3 py-2">
            <div>
              <p className="text-xs text-aco-texto">Composto principal</p>
              <p className="text-sm font-medium text-foreground">
                💉 {mainCompound.nome} {mainCompound.dose_mg && `${mainCompound.dose_mg}mg`}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0"
              disabled={createLog.isPending || jaRegistradoHoje}
              onClick={handleRegistrarAplicacao}
            >
              {createLog.isPending ? '…' : (<><Icon name="check" size={16} className="mr-1.5 inline-block align-middle" />{jaRegistradoHoje ? 'Registrado' : 'Registrar'}</>)}
            </Button>
          </div>
        )}

        {/* Suportes */}
        {suportesAtivos.length > 0 && (
          <div>
            <p className="text-xs text-aco-texto mb-1.5">Suportes do ciclo hoje</p>
            <div className="flex flex-wrap gap-1.5">
              {suportesAtivos.slice(0, 4).map((s) => (
                <span
                  key={s.id}
                  className="rounded-full border border-border/40 bg-card/60 px-2 py-0.5 text-xs text-aco-texto"
                >
                  {s.nome} {s.dose && `· ${s.dose}`}
                </span>
              ))}
              {suportesAtivos.length > 4 && (
                <span className="text-xs text-aco-texto">+{suportesAtivos.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Próximo exame */}
        {proximoExame && (
          <div className={`rounded-md border px-3 py-2 ${
            diasParaExame !== null && diasParaExame <= 3
              ? 'border-brasa/40 bg-brasa/10'
              : 'border-border/30 bg-card/20'
          }`}>
            <p className="text-xs text-aco-texto">Próximo exame</p>
            <p className={`text-sm font-medium ${diasParaExame !== null && diasParaExame <= 3 ? 'text-brasa' : 'text-foreground'}`}>
              {proximoExame.nome}
              {diasParaExame !== null && (
                <span className="ml-1.5 text-xs font-normal text-aco-texto">
                  em {diasParaExame > 0 ? `${diasParaExame}d` : 'hoje'}
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
