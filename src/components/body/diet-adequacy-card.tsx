import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useActiveDietPlan } from '@/hooks/use-diet-plan'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useForjaAI } from '@/hooks/useForjaAI'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'forja:diet-adequacy'
const PERGUNTA_ANALISE = 'Analise se a dieta atual está adequada para o objetivo do ciclo ativo.'

type Veredito = 'ADEQUADA' | 'PARCIALMENTE ADEQUADA' | 'INADEQUADA'

const VEREDITO_CLASS: Record<Veredito, string> = {
  ADEQUADA: 'border-ok/40 bg-ok/10 text-ok',
  'PARCIALMENTE ADEQUADA': 'border-atencao/40 bg-atencao/10 text-atencao',
  INADEQUADA: 'border-alerta/40 bg-alerta/10 text-alerta',
}

const VEREDITO_TEXTO: Record<Veredito, string> = {
  ADEQUADA: '✅ Dieta adequada para o objetivo',
  'PARCIALMENTE ADEQUADA': '⚠️ Ajustes necessários',
  INADEQUADA: '❌ Dieta não suporta o objetivo',
}

type CachedAnalysis = {
  resposta: string
  analisadoEm: string
  signature: string
}

function parseAnalysis(resposta: string): { veredito: Veredito | null; ajustes: string[] } {
  const linhas = resposta.split('\n').map((l) => l.trim()).filter(Boolean)
  const linhaVeredito = linhas.find((l) => l.toUpperCase().startsWith('VEREDITO:'))
  let veredito: Veredito | null = null
  if (linhaVeredito) {
    const valor = linhaVeredito.split(':')[1]?.trim().toUpperCase()
    if (valor === 'ADEQUADA' || valor === 'PARCIALMENTE ADEQUADA' || valor === 'INADEQUADA') {
      veredito = valor
    }
  }
  const ajustes = linhas.filter((l) => l.startsWith('- ')).map((l) => l.slice(2)).slice(0, 3)
  return { veredito, ajustes }
}

function readCache(): CachedAnalysis | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CachedAnalysis) : null
  } catch {
    return null
  }
}

function writeCache(cache: CachedAnalysis) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage indisponível — apenas não cacheia, sem quebrar a tela
  }
}

type DietAdequacyCardProps = {
  collapsible?: boolean
}

export function DietAdequacyCard({ collapsible }: DietAdequacyCardProps) {
  const dietPlan = useActiveDietPlan()
  const metrics = useBodyMetrics()
  const analisar = useForjaAI()
  const [cache, setCache] = useState<CachedAnalysis | null>(() => readCache())
  const [expanded, setExpanded] = useState(!collapsible)
  const [showDetails, setShowDetails] = useState(false)

  const signature = useMemo(() => {
    const lastMetric = metrics.data?.[metrics.data.length - 1]
    return [
      dietPlan.data?.id,
      dietPlan.data?.calorias_alvo,
      dietPlan.data?.proteina_g,
      dietPlan.data?.carbo_g,
      dietPlan.data?.gordura_g,
      lastMetric?.id,
    ].join(':')
  }, [dietPlan.data, metrics.data])

  useEffect(() => {
    if (!dietPlan.data || metrics.isLoading || analisar.isPending) return
    if (cache && cache.signature === signature) return
    handleReanalisar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, dietPlan.data])

  function handleReanalisar() {
    analisar.mutate(
      { agente: 'metas', pergunta: PERGUNTA_ANALISE },
      {
        onSuccess: (resposta) => {
          const novo: CachedAnalysis = { resposta, analisadoEm: new Date().toISOString(), signature }
          writeCache(novo)
          setCache(novo)
        },
      },
    )
  }

  if (!dietPlan.data) return null

  const { veredito, ajustes } = cache ? parseAnalysis(cache.resposta) : { veredito: null, ajustes: [] }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => collapsible && setExpanded((v) => !v)}
          className="flex items-center justify-between gap-2 text-left outline-none"
        >
          <span className="font-heading text-sm font-bold text-foreground">Dieta × Objetivo</span>
          {collapsible && (
            <ChevronDown className={cn('size-4 text-aco-texto transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
          )}
        </button>

        {expanded && (
          <>
            {analisar.isPending && !cache ? (
              <span className="flex items-center gap-1.5 text-xs text-aco-texto">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Analisando…
              </span>
            ) : veredito ? (
              <div className={cn('rounded-lg border px-3 py-2 text-sm font-medium', VEREDITO_CLASS[veredito])}>
                {VEREDITO_TEXTO[veredito]}
              </div>
            ) : cache ? (
              <p className="text-sm text-foreground">{cache.resposta}</p>
            ) : (
              <p className="text-xs text-aco-texto">Nenhuma análise ainda.</p>
            )}

            {ajustes.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-foreground">
                {ajustes.map((ajuste, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-aco-texto">•</span>
                    {ajuste}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-aco-texto">
                {cache
                  ? `Analisado há ${formatDistanceToNow(new Date(cache.analisadoEm), { locale: ptBR })}`
                  : 'Ainda não analisado'}
              </span>
              <div className="flex gap-2">
                {cache && veredito && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowDetails((v) => !v)}>
                    {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" disabled={analisar.isPending} onClick={handleReanalisar}>
                  {analisar.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                  )}
                  Reanalisar
                </Button>
              </div>
            </div>

            {showDetails && cache && (
              <p className="whitespace-pre-wrap rounded-md border border-border bg-card/60 p-3 text-sm text-foreground">
                {cache.resposta}
              </p>
            )}

            {analisar.isError && (
              <p className="text-xs text-alerta">
                {analisar.error instanceof Error ? analisar.error.message : 'Falha ao analisar a dieta.'}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
