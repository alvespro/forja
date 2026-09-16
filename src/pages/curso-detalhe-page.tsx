import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { StarRating } from '@/components/desenvolvimento/star-rating'
import { useCourse, useUpdateCourse } from '@/hooks/use-courses'
import { useDevAreas } from '@/hooks/use-dev-areas'
import { useForjaAI } from '@/hooks/useForjaAI'
import { useCreateTask } from '@/hooks/use-tasks'
import { supabase } from '@/lib/supabase'
import { todayInSaoPaulo } from '@/lib/date'
import { useAuth } from '@/hooks/use-auth'
import type { LibraryStatus } from '@/types/database'

export function CursoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const course = useCourse(id)
  const devAreas = useDevAreas()
  const updateCourse = useUpdateCourse()
  const gerarInsights = useForjaAI()
  const createTask = useCreateTask()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const c = course.data

  const [progresso, setProgresso] = useState(0)
  const [status, setStatus] = useState<LibraryStatus>('quero_ler')
  const [devAreaId, setDevAreaId] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState<number | null>(null)
  const [certificadoUrl, setCertificadoUrl] = useState('')
  const [modulosConcluidos, setModulosConcluidos] = useState('')
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
  const [uploadingCert, setUploadingCert] = useState(false)

  useEffect(() => {
    if (!c) return
    setProgresso(c.progresso ?? 0)
    setStatus(c.status ?? 'quero_ler')
    setDevAreaId(c.dev_area_id ?? '')
    setPlataforma(c.plataforma ?? '')
    setCargaHoraria(c.carga_horaria)
    setCertificadoUrl(c.certificado_url ?? '')
    setModulosConcluidos(c.resumo ?? '')
    setNota(c.nota_geral)
    setAprendizado1(c.aprendizado_1 ?? '')
    setAprendizado2(c.aprendizado_2 ?? '')
    setAprendizado3(c.aprendizado_3 ?? '')
    setAplicacao1(c.aplicacao_1 ?? '')
    setAplicacao2(c.aplicacao_2 ?? '')
    setAcao1(c.acao_1 ?? '')
    setCitacao(c.citacao_favorita ?? '')
  }, [c])

  if (course.isLoading) return <div className="flex flex-col gap-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>
  if (course.isError || !c) return <ErrorState message="Curso não encontrado." onRetry={() => course.refetch()} />

  async function handleUploadCertificado(file: File) {
    if (!user) return
    setUploadingCert(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/certificados/${c!.id}.${ext}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('documents').getPublicUrl(path)
      setCertificadoUrl(data.publicUrl)
    } catch (err) {
      console.error('Upload error', err)
    } finally {
      setUploadingCert(false)
    }
  }

  function handleSalvar() {
    updateCourse.mutate({
      id: c!.id,
      values: {
        progresso,
        status,
        dev_area_id: devAreaId || null,
        plataforma: plataforma || null,
        carga_horaria: cargaHoraria,
        certificado_url: certificadoUrl || null,
        resumo: modulosConcluidos || null,
        nota_geral: nota,
        aprendizado_1: aprendizado1 || null,
        aprendizado_2: aprendizado2 || null,
        aprendizado_3: aprendizado3 || null,
        aplicacao_1: aplicacao1 || null,
        aplicacao_2: aplicacao2 || null,
        acao_1: acao1 || null,
        citacao_favorita: citacao || null,
        data_conclusao: status === 'lido' && !c!.data_conclusao ? todayInSaoPaulo() : c!.data_conclusao,
        data_inicio: status !== 'quero_ler' && !c!.data_inicio ? todayInSaoPaulo() : c!.data_inicio,
      },
    })
  }

  function handleGerarInsights() {
    const pergunta = `Analisando o curso "${c!.titulo}"${c!.provedor ? ` de ${c!.provedor}` : ''}.\n\n3 Aprendizados:\n1. ${aprendizado1}\n2. ${aprendizado2}\n3. ${aprendizado3}\n\n2 Aplicações:\n1. ${aplicacao1}\n2. ${aplicacao2}\n\n1 Ação: ${acao1}\n\nGere insights e próximos passos.`

    gerarInsights.mutate(
      { agente: 'desenvolvimento', pergunta },
      { onSuccess: (resposta) => { setInsights(resposta); setShowInsights(true) } },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-aco-texto hover:text-foreground w-fit">
        <Icon name="arrow_back" size={16} />
        Voltar
      </button>

      {/* ── SEÇÃO 1: Info ── */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{c.titulo}</h1>
            {c.provedor && <p className="text-sm text-aco-texto">{c.provedor}</p>}
          </div>

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
                {s === 'quero_ler' ? 'Quero fazer' : s === 'lendo' ? 'Em andamento' : 'Concluído'}
              </button>
            ))}
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="plataforma">Plataforma</Label>
              <Input id="plataforma" value={plataforma} onChange={(e) => setPlataforma(e.target.value)} placeholder="G4, Udemy, YouTube…" />
            </div>
            <div>
              <Label htmlFor="carga">Carga horária (h)</Label>
              <Input
                id="carga"
                type="number"
                value={cargaHoraria ?? ''}
                onChange={(e) => setCargaHoraria(e.target.value ? Number(e.target.value) : null)}
                placeholder="40"
              />
            </div>
          </div>

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

          {/* Certificado */}
          <div>
            <Label>Certificado</Label>
            <div className="mt-1 flex gap-2 items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={uploadingCert}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="upload" size={14} />
                {uploadingCert ? 'Enviando…' : 'Upload certificado'}
              </Button>
              {certificadoUrl && (
                <a href={certificadoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brasa underline">
                  🎓 Ver certificado
                </a>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadCertificado(f) }}
            />
          </div>

          {/* Módulos */}
          <div>
            <Label htmlFor="modulos">Módulos concluídos</Label>
            <textarea
              id="modulos"
              value={modulosConcluidos}
              onChange={(e) => setModulosConcluidos(e.target.value)}
              placeholder="Descreva os módulos que já completou…"
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── SEÇÃO 2: Review 3-2-1 ── */}
      {status === 'lido' && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-semibold text-foreground">Review 3-2-1</h2>

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
                  onClick={() => createTask.mutate({ titulo: acao1, area: 'mental' })}
                >
                  <Icon name="bolt" size={14} className="text-brasa" />
                  {createTask.isPending ? 'Criando…' : 'Criar tarefa a partir desta ação'}
                  {createTask.isSuccess && ' ✓'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div>
                <Label htmlFor="citacao">Citação / insight favorito</Label>
                <textarea
                  id="citacao"
                  value={citacao}
                  onChange={(e) => setCitacao(e.target.value)}
                  placeholder='"O conceito que mais impactou foi…"'
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

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleSalvar} disabled={updateCourse.isPending} className="gap-1.5">
          <Icon name="save" size={16} />
          {updateCourse.isPending ? 'Salvando…' : 'Salvar'}
          {updateCourse.isSuccess && <Icon name="check" size={16} className="ml-1 inline-block align-middle" />}
        </Button>

        {status === 'lido' && (aprendizado1 || aprendizado2 || aprendizado3) && (
          <Button type="button" variant="outline" onClick={handleGerarInsights} disabled={gerarInsights.isPending} className="gap-1.5">
            {gerarInsights.isPending ? <Icon name="progress_activity" size={16} className="animate-spin" /> : <Icon name="auto_awesome" size={16} className="text-brasa" />}
            {gerarInsights.isPending ? 'Gerando…' : 'Gerar insights com IA'}
          </Button>
        )}

        {status === 'quero_ler' && (
          <Button type="button" variant="outline" onClick={() => { setStatus('lendo') }}>
            <Icon name="play_arrow" size={18} className="mr-1.5 inline-block align-middle" />Iniciar curso
          </Button>
        )}
        {status === 'lendo' && (
          <Button type="button" variant="outline" onClick={() => { setStatus('lido'); setProgresso(100) }}>
            <Icon name="school" size={18} className="mr-1.5 inline-block align-middle" />Marcar como concluído
          </Button>
        )}
      </div>

      {/* Insights da IA */}
      {showInsights && insights && (
        <Card className="border-brasa/30 bg-brasa/5">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon name="auto_awesome" size={16} className="text-brasa" />
              <span className="text-sm font-semibold text-foreground">Insights do Mentor</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{insights}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
