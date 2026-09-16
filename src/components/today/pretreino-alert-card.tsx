import { useNavigate } from 'react-router-dom'

import { AlertItem } from '@/components/ds/alert-item'
import { useSupplementLogs } from '@/hooks/use-supplement-logs'
import { useSupplements } from '@/hooks/use-supplements'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { todayInSaoPaulo, toSaoPauloDateString } from '@/lib/date'

/** Card de alerta: treinou hoje mas ainda não marcou o pré-treino como tomado. */
export function PretreinoAlertCard() {
  const navigate = useNavigate()
  const sessions = useWorkoutSessions()
  const supplements = useSupplements()
  const logs = useSupplementLogs()

  if (sessions.isLoading || supplements.isLoading || logs.isLoading) return null
  if (sessions.isError || supplements.isError || logs.isError) return null

  const today = todayInSaoPaulo()
  const treinouHoje = (sessions.data ?? []).some((s) => toSaoPauloDateString(s.performed_at) === today)
  if (!treinouHoje) return null

  const preTreinos = (supplements.data ?? []).filter((s) => s.ativo && s.momento === 'pre_treino')
  if (preTreinos.length === 0) return null

  const algumTomado = preTreinos.some((sup) =>
    (logs.data ?? []).some((l) => l.supplement_id === sup.id && l.data === today && l.tomado),
  )
  if (algumTomado) return null

  return (
    <AlertItem
      tone="atencao"
      icon="medication"
      title="Treinou hoje — tomou o pré-treino?"
      body="Marque o suplemento para manter o registro do protocolo completo."
      action={{ label: 'Marcar', onClick: () => navigate('/suplementos') }}
    />
  )
}
