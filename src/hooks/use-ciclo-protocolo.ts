import { useMemo } from 'react'

import { useProtocolCompounds } from '@/hooks/use-protocol-compounds'
import { useProtocolExams } from '@/hooks/use-protocol-exams'
import { useProtocolLogs } from '@/hooks/use-protocol-logs'
import { useActiveProtocol } from '@/hooks/use-protocols'
import { todayInSaoPaulo } from '@/lib/date'
import { aplicacaoNaoRegistrada, alertasDoCiclo, compostosDaSemana, dataDoLog, estadoDoCiclo } from '@/lib/protocol-cycle'

/**
 * Tudo que o card do Hoje e a Agenda precisam do ciclo ativo: estado (semana, dia de
 * aplicação), compostos da semana, datas com aplicação registrada, alertas e o banner
 * de aplicação não registrada.
 */
export function useCicloProtocolo() {
  const protocolo = useActiveProtocol()
  const p = protocolo.data
  const compostos = useProtocolCompounds(p?.id)
  // 12 semanas × 3 compostos cabem com folga em 120 registros.
  const logs = useProtocolLogs(p?.id, 120)
  const exames = useProtocolExams(p?.id)
  const hoje = todayInSaoPaulo()

  return useMemo(() => {
    const estado = p && (p.status === 'ativo' || p.status === 'planejado') ? estadoDoCiclo(p, hoje) : null
    const semana = estado?.fase === 'ativo' ? estado.semana : 1
    const datasComRegistro = new Set((logs.data ?? []).map((l) => dataDoLog(l.data_aplicacao)))
    return {
      carregando: protocolo.isLoading || compostos.isLoading || logs.isLoading,
      erro: protocolo.isError || compostos.isError || logs.isError,
      protocolo: p ?? null,
      estado,
      hoje,
      compostosDaSemana: compostosDaSemana(compostos.data ?? [], semana),
      compostos: compostos.data ?? [],
      logs: logs.data ?? [],
      datasComRegistro,
      registradoHoje: datasComRegistro.has(hoje),
      naoRegistrada: p && estado?.fase === 'ativo' ? aplicacaoNaoRegistrada(p, datasComRegistro, hoje) : null,
      alertas: estado ? alertasDoCiclo(estado, exames.data ?? [], hoje) : [],
    }
  }, [p, protocolo.isLoading, protocolo.isError, compostos.data, compostos.isLoading, compostos.isError, logs.data, logs.isLoading, logs.isError, exames.data, hoje])
}
