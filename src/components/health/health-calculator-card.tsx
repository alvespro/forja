import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHeartZones } from '@/hooks/use-heart-zones'
import { useHealthCalc, type ApiStatusResult } from '@/hooks/useHealthCalc'
import { cn } from '@/lib/utils'

const ENDPOINT_LABEL: Record<string, string> = {
  homa_ir: 'HOMA-IR',
  cholesterol_ratio: 'Ratios lipídicos',
  recomp_forecast: 'Previsão de recomposição',
  karvonen: 'Zonas Karvonen',
  recovery_score: 'Score de recuperação',
}

/** Configurações → Saúde: status da Health Calculator API e recálculo das zonas de FC. */
export function HealthCalculatorCard() {
  const { calcKarvonen, checkApiStatus } = useHealthCalc()
  const { zones } = useHeartZones()
  const [idade, setIdade] = useState('')
  const [fcRepouso, setFcRepouso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [status, setStatus] = useState<ApiStatusResult | null>(null)
  const [verificando, setVerificando] = useState(false)

  // Pré-preenche com o último cálculo (ou o padrão) sem sobrescrever o que for digitado.
  useEffect(() => {
    setIdade((v) => v || String(zones.idade))
    setFcRepouso((v) => v || String(zones.fcRepouso ?? 62))
  }, [zones.idade, zones.fcRepouso])

  async function recalcular() {
    const age = Number(idade)
    const hr = Number(fcRepouso)
    if (!Number.isFinite(age) || !Number.isFinite(hr) || age <= 0 || hr <= 0) {
      toast.error('Informe idade e FC de repouso.')
      return
    }
    setSalvando(true)
    try {
      const r = await calcKarvonen(age, hr)
      toast.success(`Zonas atualizadas — Z2 ${r.zonas[1].min}–${r.zonas[1].max} bpm`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao recalcular.')
    } finally {
      setSalvando(false)
    }
  }

  async function verificar() {
    setVerificando(true)
    try {
      setStatus(await checkApiStatus())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao verificar a API.')
    } finally {
      setVerificando(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="ds-h4 text-foreground">📊 Health Calculator — Cálculos clínicos avançados</h2>
        <p className="ds-body-sm text-aco-texto">Powered by Health Fitness API</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-linha pt-4">
        <div>
          <span className="ds-label">Zonas de FC (Karvonen)</span>
          <p className="ds-body-sm text-aco-texto">Meça a FC de repouso ao acordar, ainda deitado.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="ds-body-sm text-aco-texto">Idade</span>
            <Input type="number" inputMode="numeric" className="h-11" value={idade} onChange={(e) => setIdade(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="ds-body-sm text-aco-texto">FC de repouso (bpm)</span>
            <Input
              type="number"
              inputMode="numeric"
              className="h-11"
              value={fcRepouso}
              onChange={(e) => setFcRepouso(e.target.value)}
            />
          </label>
        </div>
        <Button type="button" className="min-h-11" onClick={recalcular} disabled={salvando}>
          {salvando ? 'Calculando…' : 'Recalcular zonas'}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-linha pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="ds-label">Status da API</span>
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={verificar} disabled={verificando}>
            {verificando ? 'Verificando…' : 'Verificar'}
          </Button>
        </div>
        {status && (
          <ul className="flex flex-col gap-2">
            {!status.chave_configurada && <li className="ds-body-sm text-alerta-texto">Chave HEALTH_CALC_API_KEY não configurada.</li>}
            {status.endpoints.map((e) => (
              <li key={e.endpoint} className="flex flex-col ds-body-sm">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{ENDPOINT_LABEL[e.endpoint] ?? e.endpoint}</span>
                  <span className={cn('whitespace-nowrap', e.disponivel ? 'text-ok' : 'text-atencao')}>
                    {e.disponivel ? 'API' : 'Cálculo local'}
                  </span>
                </span>
                {!e.disponivel && <span className="text-aco-texto">{e.detalhe}</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="ds-body-sm text-aco-texto">
          Sem a API, o FORJA calcula localmente com as mesmas faixas — nada deixa de funcionar.
        </p>
      </div>
    </section>
  )
}
