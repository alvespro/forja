import { useMemo } from 'react'

import { todayInSaoPaulo } from '@/lib/date'
import type { BodyMetric, Protocol, ProtocolExam } from '@/types/database'

export type AlertLevel = 'critico' | 'atencao'

export type ProtocolAlert = {
  id: string
  level: AlertLevel
  message: string
  detail?: string
  action?: string
}

const DISMISS_KEY = 'protocol_alerts_dismissed'

function getDismissed(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function dismissAlert(id: string) {
  try {
    const dismissed = getDismissed()
    dismissed[id] = Date.now()
    localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissed))
  } catch {
    // localStorage indisponível (modo privado/quota): o alerta volta a aparecer,
    // que é o comportamento seguro para um módulo de saúde.
  }
}

function isRecentlyDismissed(id: string): boolean {
  const dismissed = getDismissed()
  const ts = dismissed[id]
  if (!ts) return false
  return Date.now() - ts < 24 * 60 * 60 * 1000
}

type UseProtocolAlertsInput = {
  protocol: Protocol | null | undefined
  latestMetric: BodyMetric | null | undefined
  exams: ProtocolExam[] | undefined
  lastLogDate: string | null | undefined
  /** Último valor de cada marcador em health_metrics (chave → valor). */
  latestMarkers?: Record<string, number>
}

export function useProtocolAlerts({ protocol, latestMetric, exams, lastLogDate, latestMarkers }: UseProtocolAlertsInput) {
  const alerts = useMemo<ProtocolAlert[]>(() => {
    if (!protocol || protocol.status === 'concluido') return []

    const today = todayInSaoPaulo()
    const result: ProtocolAlert[] = []

    // ── Marcadores de exame (health_metrics) ───────────────────────────
    // Críticos nunca são dispensáveis; os de atenção respeitam o dismiss de 24h.
    if (latestMarkers) {
      for (const alert of checkCriticalMarkers(latestMarkers)) {
        if (alert.level === 'critico' || !isRecentlyDismissed(alert.id)) {
          result.push(alert)
        }
      }
    }

    // ── Exames atrasados ───────────────────────────────────────────────
    for (const exam of exams ?? []) {
      if (exam.status === 'realizado') continue
      if (!exam.data_prevista) continue
      if (exam.data_prevista >= today) continue

      const alertId = `exam_atrasado_${exam.id}`
      if (!isRecentlyDismissed(alertId)) {
        result.push({
          id: alertId,
          level: 'atencao',
          message: `⚠️ Exame atrasado: ${exam.nome}`,
          detail: `Data prevista: ${new Date(exam.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}`,
          action: 'exames',
        })
      }
    }

    // ── 3+ dias sem registrar aplicação (só se protocolo ativo) ────────
    if (protocol.status === 'ativo' && lastLogDate) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastLogDate).getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysDiff >= 3) {
        const alertId = `sem_log_${lastLogDate}`
        if (!isRecentlyDismissed(alertId)) {
          result.push({
            id: alertId,
            level: 'atencao',
            message: `⚠️ ${daysDiff} dias sem registrar aplicação`,
            detail: 'Mantenha o log atualizado para acompanhamento preciso.',
          })
        }
      }
    }

    // ── Alertas corporais (métricas de exames salvos em health_metrics) ─
    // Aqui verificamos via BodyMetric para alertas de composição
    if (latestMetric?.gordura_pct && latestMetric.gordura_pct > 25) {
      const alertId = 'gordura_alta'
      if (!isRecentlyDismissed(alertId)) {
        result.push({
          id: alertId,
          level: 'atencao',
          message: '⚠️ Gordura corporal acima de 25%',
          detail: `Atual: ${latestMetric.gordura_pct.toFixed(1)}%`,
          action: 'monitoramento',
        })
      }
    }

    return result
  }, [protocol, latestMetric, exams, lastLogDate, latestMarkers])

  return alerts
}

// Alertas críticos de marcadores de exame (para uso com health_metrics)
export function checkCriticalMarkers(markers: Record<string, number>): ProtocolAlert[] {
  const alerts: ProtocolAlert[] = []

  if (markers.hematocrito && markers.hematocrito > 52) {
    alerts.push({
      id: 'hematocrito_critico',
      level: 'critico',
      message: '🚨 Hematócrito elevado — consulte seu médico IMEDIATAMENTE',
      detail: `Valor: ${markers.hematocrito}% (limite: 52%)`,
      action: 'exames',
    })
  }
  if (markers.hematocrito && markers.hematocrito >= 48 && markers.hematocrito <= 52) {
    alerts.push({
      id: 'hematocrito_atencao',
      level: 'atencao',
      message: '⚠️ Hematócrito subindo',
      detail: `Valor: ${markers.hematocrito}% — monitore de perto`,
      action: 'exames',
    })
  }
  if (markers.ldl && markers.ldl > 160) {
    alerts.push({
      id: 'ldl_critico',
      level: 'critico',
      message: '🚨 LDL crítico — risco cardiovascular aumentado',
      detail: `LDL: ${markers.ldl} mg/dL (limite: 160)`,
      action: 'exames',
    })
  }
  if (markers.ldl && markers.ldl >= 130 && markers.ldl <= 160) {
    alerts.push({
      id: 'ldl_atencao',
      level: 'atencao',
      message: '⚠️ LDL elevado — monitore',
      detail: `LDL: ${markers.ldl} mg/dL`,
      action: 'exames',
    })
  }
  if (markers.tgo && markers.tgo > 120) {
    alerts.push({
      id: 'tgo_critico',
      level: 'critico',
      message: '🚨 TGO crítico — enzimas hepáticas elevadas',
      detail: `TGO: ${markers.tgo} U/L (>3x limite)`,
      action: 'exames',
    })
  }
  if (markers.tgp && markers.tgp > 135) {
    alerts.push({
      id: 'tgp_critico',
      level: 'critico',
      message: '🚨 TGP crítico — enzimas hepáticas elevadas',
      detail: `TGP: ${markers.tgp} U/L (>3x limite)`,
      action: 'exames',
    })
  }
  if (markers.estradiol && markers.estradiol > 60) {
    alerts.push({
      id: 'estradiol_critico',
      level: 'critico',
      message: '🚨 Estradiol elevado — possível aromatização',
      detail: `Estradiol: ${markers.estradiol} pg/mL (limite: 60)`,
      action: 'exames',
    })
  }

  return alerts
}
