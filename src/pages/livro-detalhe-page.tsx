import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save, Sparkles, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { StarRating } from '@/components/desenvolvimento/star-rating'
import { useReading, useUpdateReading } from '@/hooks/use-readings'
import { useDevAreas } from '@/hooks/use-dev-areas'
import { useForjaAI } from '@/hooks/useForjaAI'
import { useCreateTask } from '@/hooks/use-tasks'
import { todayInSaoPaulo } from '@/lib/date'
import type { LibraryStatus } from '@/types/database'

export function LivroDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const reading = useReading(id)
  const devAreas = useDevAreas()
  const updateReading = useUpdateReading()
  const gerarInsights = useForjaAI()
  const createTask = useCreateTask()

  // Form state espelha o que está salvo
  const r = reading.data

  const [progresso, setProgresso] = useState(0)
  const [status, setStatus] = useState<LibraryStatus>('quero_ler')
  const [devAreaId, setDevAreaId] = useState<string>('')
  const [nota, setNota] = useState<number | null>(null)
  const [aprendizado1, setAprendizado1] = useState('')
  const [aprendizado2, setAprendizado2] = useState('')
  const [aprendizado3, setAprendizado3] = useState('')
  const [aplicacao1, setAplicacao1] = useState('')
  const [aplicacao2, setAplicacao2] = useState('')
  const [acao1, setAcao1] = useState('')
  const [citacao, setCitacao] = useState('')
  const [insights, setInsights] = useState('')
  const [showInsights, setShowInsights] = useState(false)

  useEffect(() => {
    if (!r) return
    setProgresso(r.progresso ?? 0)
    setStatus(r.status ?? 'quero_ler')
    setDevAreaId(r.dev_area_id ?? '')
    setNota(r.nota_geral)
    setAprendizado1(r.aprendizado_1 ?? '')
    setAprendizado2(r.aprendizado_2 ?? '')
    setAprendizado3(r.aprendizado_3 ?? '')
    setAplicacao1(r.aplicacao_1 ?? '')
    setAplicacao2(r.aplicacao_2 ?? '')
    setAcao1(r.acao_1 ?? '')
    setCitacao(r.citacao_favorita ?? '')
  }, [r])

  if (reading.isLoading) return <div className="flex flex-col gap-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>
  if (reading.isError || !r) return <ErrorState message="Livro não encontrado." onRetry={() => reading.refetch()} />

  function handleSalvar() {
    updateReading.mutate({
      id: r!.id,
      values: {
        progresso,
        status,
        dev_area_id: devAreaId || null,
        nota_geral: nota,
        aprendizado_1: aprendizado1 || null,
        aprendizado_2: aprendizado2 || null,
        aprendizado_3: aprendizado3 || null,
        aplicacao_1: aplicacao1 || null,
        aplicacao_2: aplicacao2 || null,
        acao_1: acao1 || null,
        citacao_favorita: citacao || null,
        data_conclusao: status === 'lido' && !r!.data_conclusao ? todayInSaoPaulo() : r!.data_conclusao,
        data_inicio: status !== 'quero_ler' && !r!.data_inicio ? todayInSaoPaulo() : r!.data_inicio,
      },
    })
  }

  function handleGerarInsights() {
    const pergunta = `Analisando o livro "${r!.titulo}"${r!.autor ? ` de ${r!.autor}` : ''}.\n\n3 Aprendizados:\n1. ${aprendizado1}\n2. ${aprendizado2}\n3. ${aprendizado3}\n\n2 Aplicações:\n1. ${aplicacao1}\n2. ${aplicacao2}\n\n1 Ação: ${acao1}\n\nGere insights e próximos passos.`

    gerarInsights.mutate(
      { agente: 'desenvolvimento', pergunta },
      { onSuccess: (resposta) => { setInsights(resposta); setShowInsights(true) } },
    )
  }

  function handleCriarTarefa() {
    if (!acao1.trim()) return
    createTask.mutate({ titulo: acao1, area: 'mental' })
  }

  const isMarcandoLido = status !== 'lido'

  return (
    <div className="flex flex-col gap-4">
      {/* Volta */}
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-aco-texto hover:text-foreground w-fit">
        <ArrowLeft className="size-4" />
        Voltar
      </button>

      {/* ── SEÇÃO 1: Info ── */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{r.titulo}</h1>
            {r.autor && <p className="text-sm text-aco-texto">{r.autor}</p>}
            {r.trilha && <p className="text-xs text-aco-texto/70">{r.trilha}</p>}
          </div>

          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {(['quero_ler', 'lendo', 'lido'] as LibraryStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === s ? 'bg-brasa text-white' : 'bg-border/50 text-aco-texto hover:bg-border'
                }`}
              >
                {s === 'quero_ler' ? 'Quero ler' : s === 'lendo' ? 'Lendo' : 'Lido'}
              </button>
            ))}
          </div>

          {/* Progresso */}
          {status !== 'quero_ler' && (
            <div>
              <div className="flex justify-between text-xs text-aco-texto mb-1">
                <Label>Progresso</Label>
                <span>{progresso}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progresso}
                onChange={(e) => setProgresso(Number(e.target.value))}
                className="w-full h-1.5 accent-brasa"
              />
              <Progress value={progresso} className="h-1.5 mt-1" />
            </div>
          )}

          {/* Área */}
          <div>
            <Label htmlFor="dev-area">Área de desenvolvimento</Label>
            <select
              id="dev-area"
              value={devAreaId}
              onChange={(e) => setDevAreaId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring mt-1"
            >
              <option value="">Nenhuma área</option>
              {(devAreas.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── SEÇÃO 2: Review 3-2-1 ── */}
      {status === 'lido' && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-semibold text-foreground">Review 3-2-1</h2>

          {/* 3 Aprendizados */}
          <Card style={{ backgroundColor: 'rgba(59, 130, 246, 0.06)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-cinza">3 Aprendizados</p>
              {[
                { label: '1.', value: aprendizado1, set: setAprendizado1 },
                { label: '2.', value: aprendizado2, set: setAprendizado2 },
                { label: '3.', value: aprendizado3, set: setAprendizado3 },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex gap-2 items-start">
                  <span className="text-xs text-aco-texto mt-2.5 shrink-0">{label}</span>
                  <textarea
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder="O que aprendi que não sabia antes?"
                    rows={2}
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 2 Aplicações */}
          <Card style={{ backgroundColor: 'rgba(34, 197, 94, 0.06)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-ok">2 Aplicações</p>
              {[
                { label: '1.', value: aplicacao1, set: setAplicacao1 },
                { label: '2.', value: aplicacao2, set: setAplicacao2 },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex gap-2 items-start">
                  <span className="text-xs text-aco-texto mt-2.5 shrink-0">{label}</span>
                  <textarea
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder="Como vou aplicar isso na Prime / na vida?"
                    rows={2}
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 1 Ação */}
          <Card style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-bold text-brasa">1 Ação</p>
              <textarea
                value={acao1}
                onChange={(e) => setAcao1(e.target.value)}
                placeholder="Qual a UMA coisa que farei diferente esta semana?"
                rows={3}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              {acao1.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit gap-1.5"
                  disabled={createTask.isPending}
                  onClick={handleCriarTarefa}
                >
                  <Zap className="size-3.5 text-brasa" />
                  {createTask.isPending ? 'Criando…' : 'Criar tarefa a partir desta ação'}
                  {createTask.isSuccess && ' ✓'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Citação + Nota */}
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div>
                <Label htmlFor="citacao">Citação favorita</Label>
                <textarea
                  id="citacao"
                  value={citacao}
                  onChange={(e) => setCitacao(e.target.value)}
                  placeholder='"A frase que mais marcou no livro…"'
                  rows={2}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none italic"
                />
              </div>
              <div>
                <Label>Nota geral</Label>
                <div className="mt-1">
                  <StarRating value={nota} onChange={setNota} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleSalvar}
          disabled={updateReading.isPending}
          className="gap-1.5"
        >
          <Save className="size-4" />
          {updateReading.isPending ? 'Salvando…' : 'Salvar'}
          {updateReading.isSuccess && ' ✓'}
        </Button>

        {status === 'lido' && (aprendizado1 || aprendizado2 || aprendizado3) && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGerarInsights}
            disabled={gerarInsights.isPending}
            className="gap-1.5"
          >
            {gerarInsights.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-brasa" />}
            {gerarInsights.isPending ? 'Gerando…' : 'Gerar insights com IA'}
          </Button>
        )}

        {isMarcandoLido && status !== 'lendo' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => { setStatus('lendo'); setProgresso(0) }}
          >
            ▶ Iniciar leitura
          </Button>
        )}

        {status === 'lendo' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => { setStatus('lido'); setProgresso(100) }}
          >
            ✓ Marcar como lido
          </Button>
        )}
      </div>

      {/* ── SEÇÃO 3: Insights da IA ── */}
      {showInsights && insights && (
        <Card className="border-brasa/30 bg-brasa/5">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brasa" />
              <span className="text-sm font-semibold text-foreground">Insights do Mentor</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{insights}</p>
          </CardContent>
        </Card>
      )}

      {gerarInsights.isError && (
        <p className="text-xs text-alerta-texto">
          {gerarInsights.error instanceof Error ? gerarInsights.error.message : 'Falha ao gerar insights.'}
        </p>
      )}
    </div>
  )
}
