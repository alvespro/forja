import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'
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
  INADEQUADA: 'border-alerta/40 bg-alerta/10 text-alerta-texto',
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

/** Remove apenas a marcação visual do agente; o texto permanece íntegro e seguro. */
function InlineMarkdown({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-aco2 px-1 py-0.5 font-mono text-[0.85em] text-nevoa">{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })
}

function AnalysisDetails({ resposta }: { resposta: string }) {
  const lines = resposta.replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean)
  const blocks: ReactNode[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^VEREDITO:/i.test(line)) continue

    const heading = line.match(/^#{1,3}\s+(.+)$/)
    if (heading) {
      blocks.push(<h3 key={index} className="font-heading text-sm font-semibold text-foreground"><InlineMarkdown text={heading[1]} /></h3>)
      continue
    }

    const item = line.match(/^[-*]\s+(.+)$/)
    if (item) {
      blocks.push(
        <div key={index} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brasa" aria-hidden="true" />
          <span><InlineMarkdown text={item[1]} /></span>
        </div>,
      )
      continue
    }

    blocks.push(<p key={index}><InlineMarkdown text={line} /></p>)
  }

  return <div className="space-y-2.5 rounded-[var(--r-md)] border border-linha bg-fundo/45 p-3 text-sm leading-6 text-foreground">{blocks}</div>
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
          className="flex min-h-11 items-center justify-between gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-heading text-sm font-bold text-foreground">Dieta × Objetivo</span>
          {collapsible && (
            <Icon name="expand_more" size={16} className={cn('size-4 text-aco-texto transition-transform', expanded && 'rotate-180')} />
          )}
        </button>

        {expanded && (
          <>
            {analisar.isPending && !cache ? (
              <span className="flex items-center gap-1.5 text-xs text-aco-texto">
                <Icon name="progress_activity" size={14} className="animate-spin" /> Analisando…
              </span>
            ) : veredito ? (
              <div className={cn('rounded-lg border px-3 py-2 text-sm font-medium', VEREDITO_CLASS[veredito])}>
                {VEREDITO_TEXTO[veredito]}
              </div>
            ) : cache ? (
              <p className="text-sm text-foreground">A análise está pronta. Abra os detalhes para ver as recomendações.</p>
            ) : (
              <p className="text-xs text-aco-texto">Nenhuma análise ainda.</p>
            )}

            {ajustes.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-foreground">
                {ajustes.map((ajuste, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-aco-texto">•</span>
                    <InlineMarkdown text={ajuste} />
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
                  <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setShowDetails((v) => !v)}>
                    {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={analisar.isPending} onClick={handleReanalisar}>
                  {analisar.isPending ? (
                    <Icon name="progress_activity" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="sync" size={14} />
                  )}
                  Reanalisar
                </Button>
              </div>
            </div>

            {showDetails && cache && (
              <AnalysisDetails resposta={cache.resposta} />
            )}

            {analisar.isError && (
              <p className="text-xs text-alerta-texto">
                {analisar.error instanceof Error ? analisar.error.message : 'Falha ao analisar a dieta.'}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
