import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, FlaskConical, Loader2, Sparkles, X } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldInput, FieldSelect, FieldTextarea } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { ProtocolReport } from '@/components/protocolo/protocol-report'
import { ProtocolCreateWizard } from '@/components/protocolo/protocol-create-wizard'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveProtocol, useUpdateProtocol } from '@/hooks/use-protocols'
import { useProtocolCompounds, useCreateProtocolCompound, useDeleteProtocolCompound } from '@/hooks/use-protocol-compounds'
import { useProtocolLogs, useCreateProtocolLog } from '@/hooks/use-protocol-logs'
import { useProtocolExams, useUpdateProtocolExam } from '@/hooks/use-protocol-exams'
import { useProtocolSupport, useCreateProtocolSupport } from '@/hooks/use-protocol-support'
import { useProtocolGoals } from '@/hooks/use-protocol-goals'
import { useProtocolAlerts, checkCriticalMarkers, dismissAlert } from '@/hooks/use-protocol-alerts'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import {
  getLatestValue,
  groupHealthMetricsByKey,
  useCreateHealthMetric,
  useHealthMetrics,
} from '@/hooks/use-health-metrics'
import { useConfirm } from '@/hooks/use-confirm'
import { useForjaAI } from '@/hooks/useForjaAI'
import { todayInSaoPaulo } from '@/lib/date'
import { computeWeekNumber } from '@/lib/protocol'
import type { ProtocolExamStatus, ProtocolStatus } from '@/types/database'

type Tab = 'protocolo' | 'compostos' | 'agenda' | 'monitoramento' | 'exames'

const TABS: { id: Tab; label: string }[] = [
  { id: 'protocolo', label: '📋 Protocolo' },
  { id: 'compostos', label: '💊 Compostos' },
  { id: 'agenda', label: '📅 Agenda' },
  { id: 'monitoramento', label: '📊 Monitoramento' },
  { id: 'exames', label: '🧪 Exames' },
]

const LOCAL_OPTIONS = [
  'Glúteo direito', 'Glúteo esquerdo',
  'Deltoide direito', 'Deltoide esquerdo',
  'Vasto direito', 'Vasto esquerdo',
]

const EXAM_MARKERS = [
  { key: 'hematocrito', label: 'Hematócrito', unit: '%' },
  { key: 'hemoglobina', label: 'Hemoglobina', unit: 'g/dL' },
  { key: 'ldl', label: 'LDL', unit: 'mg/dL' },
  { key: 'hdl', label: 'HDL', unit: 'mg/dL' },
  { key: 'colesterol_total', label: 'Colesterol Total', unit: 'mg/dL' },
  { key: 'tgo', label: 'TGO/AST', unit: 'U/L' },
  { key: 'tgp', label: 'TGP/ALT', unit: 'U/L' },
  { key: 'estradiol', label: 'Estradiol', unit: 'pg/mL' },
  { key: 'testosterona_total', label: 'Testosterona Total', unit: 'ng/dL' },
  { key: 'psa', label: 'PSA', unit: 'ng/mL' },
  { key: 'creatinina', label: 'Creatinina', unit: 'mg/dL' },
  { key: 'lh', label: 'LH', unit: 'mUI/mL' },
  { key: 'fsh', label: 'FSH', unit: 'mUI/mL' },
]

function statusBadge(status: string | null) {
  switch (status) {
    case 'planejado':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-900/40 px-3 py-1.5 text-sm font-semibold text-blue-300 border border-blue-700/50">
          📋 PLANEJADO — aguardando exames pré-ciclo
        </span>
      )
    case 'ativo':
      return (
        <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-green-900/40 px-3 py-1.5 text-sm font-semibold text-green-300 border border-green-700/50">
          🟢 CICLO ATIVO
        </span>
      )
    case 'tpc':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-900/40 px-3 py-1.5 text-sm font-semibold text-amber-300 border border-amber-700/50">
          🔄 TPC
        </span>
      )
    case 'concluido':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/40 px-3 py-1.5 text-sm font-semibold text-emerald-400 border border-emerald-700/50">
          ✅ CONCLUÍDO
        </span>
      )
    default:
      return null
  }
}

function examStatusBadge(status: ProtocolExamStatus | string | null) {
  switch (status) {
    case 'realizado':
      return <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-xs text-green-400 border border-green-700/40">✓ Realizado</span>
    case 'agendado':
      return <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400 border border-amber-700/40">📅 Agendado</span>
    case 'atrasado':
      return <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs text-red-400 border border-red-700/40">🚨 Atrasado</span>
    default:
      return <span className="rounded-full bg-border/40 px-2 py-0.5 text-xs text-aco-texto">Pendente</span>
  }
}

export function ProtocoloPage() {
  const [tab, setTab] = useState<Tab>('protocolo')
  const [showAddCompound, setShowAddCompound] = useState(false)
  const [showAddSupport, setShowAddSupport] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState('')
  const [showExamResultModal, setShowExamResultModal] = useState<string | null>(null)
  const [examResultValues, setExamResultValues] = useState<Record<string, string>>({})
  const [examResultCritical, setExamResultCritical] = useState<string[]>([])
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Formulário de edição do protocolo
  const [eNome, setENome] = useState('')
  const [eObjetivo, setEObjetivo] = useState('')
  const [eMedico, setEMedico] = useState('')
  const [eVia, setEVia] = useState('injetavel')
  const [eDuracao, setEDuracao] = useState('')
  const [eDataInicio, setEDataInicio] = useState('')
  const [eNotas, setENotas] = useState('')

  const protocol = useActiveProtocol()
  const p = protocol.data

  const compounds = useProtocolCompounds(p?.id)
  const logs = useProtocolLogs(p?.id, 30)
  const exams = useProtocolExams(p?.id)
  const support = useProtocolSupport(p?.id)
  const goals = useProtocolGoals(p?.id)
  const bodyMetrics = useBodyMetrics()
  const healthMetrics = useHealthMetrics()

  const updateProtocol = useUpdateProtocol()
  const createCompound = useCreateProtocolCompound()
  const createHealthMetric = useCreateHealthMetric()
  const deleteCompound = useDeleteProtocolCompound()
  const createLog = useCreateProtocolLog()
  const updateExam = useUpdateProtocolExam()
  const createSupport = useCreateProtocolSupport()
  const gerarInsights = useForjaAI()
  const { confirm, dialog } = useConfirm()

  const today = todayInSaoPaulo()
  const weekNum = computeWeekNumber(p?.data_inicio, today)
  const totalWeeks = p?.duracao_semanas ?? 16

  const latestMetric = bodyMetrics.data?.[bodyMetrics.data.length - 1]
  const firstMetric = bodyMetrics.data?.[0]

  const lastLogDate = logs.data?.[0]?.data_aplicacao ?? null

  // Último valor de cada marcador registrado em health_metrics
  const latestMarkers = useMemo(() => {
    const grouped = groupHealthMetricsByKey(healthMetrics.data)
    const markers: Record<string, number> = {}
    for (const [chave, readings] of grouped) {
      const valor = getLatestValue(readings)
      if (valor !== null) markers[chave] = valor
    }
    return markers
  }, [healthMetrics.data])

  const alerts = useProtocolAlerts({
    protocol: p,
    latestMetric,
    exams: exams.data,
    lastLogDate,
    latestMarkers,
  })

  // Janelas de exames derivadas das semanas-alvo reais do checklist
  const examFases = useMemo(() => {
    const weeks = [...new Set((exams.data ?? []).map((e) => e.semana_alvo ?? 0))].sort((a, b) => a - b)
    const dur = p?.duracao_semanas ?? 16
    return weeks.map((w) => ({
      label:
        w <= 0
          ? 'Pré-ciclo'
          : w > dur
            ? `Pós-TPC — Sem. ${w}`
            : w === dur
              ? `Fim do ciclo — Sem. ${w}`
              : `Mid-ciclo — Sem. ${w}`,
      semanas: [w],
    }))
  }, [exams.data, p?.duracao_semanas])

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))

  // ── Estado de formulários ──
  const [cNome, setCNome] = useState('')
  const [cCategoria, setCCategoria] = useState('')
  const [cDose, setCDose] = useState('')
  const [cFreq, setCFreq] = useState('')
  const [cVia, setCVia] = useState('injetavel')
  const [cSemIni, setCSemIni] = useState('1')
  const [cSemFim, setCSemFim] = useState(String(totalWeeks))
  const [cNotas, setCNotas] = useState('')

  const [sNome, setSNome] = useState('')
  const [sCategoria, setSCategoria] = useState('hepatoprotetor')
  const [sDose, setSDose] = useState('')
  const [sMomento, setSMomento] = useState('')
  const [sMotivo, setSMotivo] = useState('')

  const [logCompound, setLogCompound] = useState('')
  const [logDose, setLogDose] = useState('')
  const [logLocal, setLogLocal] = useState('Glúteo direito')
  const [logHumor, setLogHumor] = useState(3)
  const [logEnergia, setLogEnergia] = useState(3)
  const [logLibido, setLogLibido] = useState(3)
  const [logEfeitos, setLogEfeitos] = useState('')
  const [logObs, setLogObs] = useState('')

  const [scheduleDate, setScheduleDate] = useState(today)

  function handleDismissAlert(id: string) {
    dismissAlert(id)
    setDismissedAlerts((prev) => new Set([...prev, id]))
  }

  function handleAddCompound() {
    if (!p || !cNome.trim()) return
    createCompound.mutate({
      protocol_id: p.id,
      nome: cNome,
      categoria: cCategoria || null,
      dose_mg: cDose ? Number(cDose) : null,
      frequencia: cFreq || null,
      via: cVia || null,
      semana_inicio: cSemIni ? Number(cSemIni) : null,
      semana_fim: cSemFim ? Number(cSemFim) : null,
      notas: cNotas || null,
    }, {
      onSuccess: () => {
        setShowAddCompound(false)
        setCNome(''); setCCategoria(''); setCDose(''); setCFreq(''); setCNotas('')
      },
    })
  }

  function handleAddSupport() {
    if (!p || !sNome.trim()) return
    createSupport.mutate({
      protocol_id: p.id,
      nome: sNome,
      categoria: sCategoria || null,
      dose: sDose || null,
      momento: sMomento || null,
      motivo: sMotivo || null,
      ativo: true,
    }, {
      onSuccess: () => {
        setShowAddSupport(false)
        setSNome(''); setSDose(''); setSMomento(''); setSMotivo('')
      },
    })
  }

  function handleRegistrarLog() {
    if (!p) return
    createLog.mutate({
      protocol_id: p.id,
      compound_id: logCompound || null,
      dose_aplicada_mg: logDose ? Number(logDose) : null,
      local_aplicacao: logLocal || null,
      humor: logHumor,
      energia: logEnergia,
      libido: logLibido,
      efeitos_percebidos: logEfeitos || null,
      observacoes: logObs || null,
    }, {
      onSuccess: () => {
        setShowLogModal(false)
        setLogDose(''); setLogEfeitos(''); setLogObs(''); setLogHumor(3); setLogEnergia(3); setLogLibido(3)
      },
    })
  }

  function handleScheduleExam(examId: string) {
    updateExam.mutate({
      id: examId,
      values: { data_prevista: scheduleDate, status: 'agendado' },
    }, { onSuccess: () => setShowScheduleModal(null) })
  }

  function handleRealizadoExam(examId: string) {
    updateExam.mutate({
      id: examId,
      values: { status: 'realizado', data_realizada: today },
    })
  }

  function handleOpenEdit() {
    if (!p) return
    setENome(p.nome)
    setEObjetivo(p.objetivo)
    setEMedico(p.medico_responsavel ?? '')
    setEVia(p.via ?? 'injetavel')
    setEDuracao(p.duracao_semanas != null ? String(p.duracao_semanas) : '')
    setEDataInicio(p.data_inicio ?? '')
    setENotas(p.notas ?? '')
    setShowEditModal(true)
  }

  function handleSaveEdit() {
    if (!p || !eNome.trim() || !eObjetivo.trim()) return
    updateProtocol.mutate(
      {
        id: p.id,
        values: {
          nome: eNome.trim(),
          objetivo: eObjetivo.trim(),
          medico_responsavel: eMedico.trim() || null,
          via: eVia,
          duracao_semanas: eDuracao ? Number(eDuracao) : null,
          data_inicio: eDataInicio || null,
          notas: eNotas.trim() || null,
        },
      },
      { onSuccess: () => setShowEditModal(false) },
    )
  }

  async function handleTransitionStatus() {
    if (!p) return
    const next: ProtocolStatus =
      p.status === 'planejado' ? 'ativo' :
      p.status === 'ativo' ? 'tpc' : 'concluido'

    const preFaltando = (exams.data ?? []).filter(
      (e) => (e.semana_alvo ?? 0) <= 0 && e.status !== 'realizado',
    ).length

    const confirmCfg =
      next === 'ativo'
        ? {
            title: 'Iniciar o ciclo?',
            description:
              preFaltando > 0
                ? `⚠️ Ainda faltam ${preFaltando} exame(s) pré-ciclo. Recomenda-se completá-los antes de iniciar. Confirmar mesmo assim?`
                : `O ciclo começa hoje (${new Date(today + 'T12:00:00').toLocaleDateString('pt-BR')}) e a contagem de semanas será iniciada.`,
          }
        : next === 'tpc'
          ? {
              title: 'Iniciar TPC?',
              description: 'O protocolo entra em fase de terapia pós-ciclo. Confirme apenas se orientado pelo seu médico.',
            }
          : {
              title: 'Concluir o ciclo?',
              description: 'O protocolo será marcado como concluído e sairá desta tela. Essa ação encerra o acompanhamento.',
            }

    const ok = await confirm(confirmCfg)
    if (!ok) return

    updateProtocol.mutate({
      id: p.id,
      values: {
        status: next,
        ...(next === 'ativo' && !p.data_inicio ? { data_inicio: today } : {}),
      },
    })
  }

  function handleExamResultSubmit(examId: string) {
    const filledMarkers: Record<string, number> = {}
    for (const [key, val] of Object.entries(examResultValues)) {
      const n = parseFloat(val.replace(',', '.'))
      if (!isNaN(n) && val.trim() !== '') filledMarkers[key] = n
    }

    for (const [chave, valor] of Object.entries(filledMarkers)) {
      createHealthMetric.mutate({ chave, valor })
    }

    const alerts = checkCriticalMarkers(filledMarkers)
    if (alerts.length > 0) {
      setExamResultCritical(alerts.map((a) => a.message))
    }

    updateExam.mutate(
      {
        id: examId,
        values: {
          status: 'realizado',
          data_realizada: today,
          health_metric_snapshot: Object.keys(filledMarkers).length > 0
            ? (filledMarkers as Record<string, unknown>)
            : null,
        },
      },
      {
        onSuccess: () => {
          const alerts = checkCriticalMarkers(filledMarkers)
          if (alerts.length === 0) {
            setShowExamResultModal(null)
            setExamResultValues({})
            setExamResultCritical([])
          }
        },
      },
    )
  }

  function handleGerarInsights() {
    gerarInsights.mutate(
      { agente: 'protocolo', pergunta: 'Análise completa do ciclo atual: evolução corporal, bem-estar e exames.' },
      { onSuccess: (r) => { setInsights(r); setShowInsights(true) } },
    )
  }

  if (protocol.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!p) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <FlaskConical className="size-12 text-aco-texto/40" />
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">Nenhum protocolo ativo</p>
          <p className="mt-1 text-sm text-aco-texto">Nenhum protocolo planejado, ativo ou em TPC foi encontrado.</p>
        </div>
        <Button type="button" onClick={() => setShowCreateWizard(true)} className="gap-1.5">
          ➕ Cadastrar protocolo prescrito
        </Button>
        <p className="text-xs text-aco-texto/70 max-w-xs">
          Este módulo registra protocolos prescritos por médico. O FORJA não recomenda compostos ou doses.
        </p>
        {showCreateWizard && (
          <ProtocolCreateWizard onClose={() => setShowCreateWizard(false)} latestMetric={latestMetric} />
        )}
      </div>
    )
  }

  const preExams = exams.data?.filter((e) => (e.semana_alvo ?? 0) <= 0) ?? []
  const preRealizados = preExams.filter((e) => e.status === 'realizado').length
  const showPreAlert = p.status === 'planejado' && preExams.length > 0 && preRealizados < preExams.length

  // Dados para gráfico de monitoramento
  const chartData = (bodyMetrics.data ?? []).map((m) => ({
    data: m.medido_em,
    peso: m.peso_kg,
    gordura: m.gordura_pct,
    musculo: m.musculo_pct ? (m.peso_kg ?? 0) * (m.musculo_pct / 100) : null,
  })).filter((d) => !p.data_inicio || d.data >= p.data_inicio!)

  // Dados de bem-estar
  const wellnessData = (logs.data ?? [])
    .slice()
    .reverse()
    .map((l) => ({
      data: l.data_aplicacao,
      humor: l.humor,
      energia: l.energia,
      libido: l.libido,
    }))

  // Agrupar suporte por categoria
  const supportByCategoria: Record<string, typeof support.data> = {}
  for (const s of support.data ?? []) {
    const cat = s.categoria ?? 'outros'
    if (!supportByCategoria[cat]) supportByCategoria[cat] = []
    supportByCategoria[cat]!.push(s)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {statusBadge(p.status)}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-foreground">{p.nome}</h1>
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  title="Editar protocolo"
                  className="text-aco-texto/60 hover:text-foreground text-sm"
                >
                  ✏️
                </button>
              </div>
              {p.medico_responsavel && (
                <p className="text-sm text-aco-texto">Dr. {p.medico_responsavel}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {p.status !== 'concluido' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTransitionStatus}
                disabled={updateProtocol.isPending}
                className="gap-1.5"
              >
                {p.status === 'planejado' && '▶ Iniciar ciclo'}
                {p.status === 'ativo' && '🔄 Iniciar TPC'}
                {p.status === 'tpc' && '✅ Concluir ciclo'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGerarInsights}
              disabled={gerarInsights.isPending}
              className="gap-1.5"
            >
              {gerarInsights.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-brasa" />}
              Análise do ciclo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReport(true)}
              className="gap-1.5 text-xs text-aco-texto"
            >
              🖨️ Pré-consulta
            </Button>
          </div>
        </div>

        {/* Progresso */}
        {p.data_inicio && (
          <div>
            <div className="flex justify-between text-xs text-aco-texto mb-1.5">
              <span>Semana {weekNum} de {totalWeeks}</span>
              <span>{Math.round((weekNum / totalWeeks) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-brasa transition-all"
                style={{ width: `${Math.min(100, (weekNum / totalWeeks) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── ALERTAS ── */}
      {visibleAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                alert.level === 'critico'
                  ? 'border-red-700/60 bg-red-950/40'
                  : 'border-amber-700/60 bg-amber-950/30'
              }`}
            >
              <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${alert.level === 'critico' ? 'text-red-400' : 'text-amber-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${alert.level === 'critico' ? 'text-red-300' : 'text-amber-300'}`}>
                  {alert.message}
                </p>
                {alert.detail && <p className="text-xs text-aco-texto mt-0.5">{alert.detail}</p>}
              </div>
              {alert.level !== 'critico' && (
                <button
                  type="button"
                  onClick={() => handleDismissAlert(alert.id)}
                  className="text-aco-texto hover:text-foreground shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ALERTA PRÉ-CICLO ── */}
      {showPreAlert && (
        <Card style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.4)' }}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-300">
                  ⚠️ Exames pré-ciclo pendentes ({preRealizados} de {preExams.length} realizados)
                </p>
                <p className="mt-0.5 text-xs text-amber-200/70">
                  Não inicie o ciclo sem completar todos os exames.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pl-7">
              {preExams.filter((e) => e.status !== 'realizado').map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <div className="size-3.5 rounded border border-amber-600/60 shrink-0" />
                  <span className="text-xs text-aco-texto">{e.nome}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── AI INSIGHTS ── */}
      {showInsights && insights && (
        <Card className="border-brasa/30 bg-brasa/5">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-brasa" />
                <span className="text-sm font-semibold">Análise do Monitor</span>
              </div>
              <button type="button" onClick={() => setShowInsights(false)} aria-label="Fechar" className="text-aco-texto hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{insights}</p>
          </CardContent>
        </Card>
      )}

      {/* ── TABS ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-brasa text-white' : 'bg-border/30 text-aco-texto hover:bg-border/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════ TAB: PROTOCOLO ════════════ */}
      {tab === 'protocolo' && (
        <div className="flex flex-col gap-4">
          {/* Metas */}
          {goals.data && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">🎯 Metas do ciclo</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Peso', ini: goals.data.peso_inicial_kg, meta: goals.data.peso_meta_kg, unit: 'kg' },
                    { label: 'Gordura', ini: goals.data.gordura_inicial_pct, meta: goals.data.gordura_meta_pct, unit: '%' },
                    { label: 'Músculo', ini: goals.data.musculo_inicial_kg, meta: goals.data.musculo_meta_kg, unit: 'kg' },
                  ].map(({ label, ini, meta, unit }) => (
                    <div key={label} className="rounded-lg border border-border/40 bg-card/60 p-3">
                      <p className="text-xs text-aco-texto">{label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {ini !== null && ini !== undefined ? `${ini}${unit}` : '—'}
                        {meta !== null && meta !== undefined && (
                          <span className="ml-1.5 text-xs font-normal text-brasa">→ {meta}{unit}</span>
                        )}
                      </p>
                    </div>
                  ))}
                  {goals.data.forca_meta && (
                    <div className="rounded-lg border border-border/40 bg-card/60 p-3">
                      <p className="text-xs text-aco-texto">Força</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{goals.data.forca_meta}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compostos */}
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">💉 Compostos prescritos</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCompound(true)} className="h-7 text-xs gap-1">
                  ➕ Adicionar
                </Button>
              </div>
              {compounds.data?.length === 0 ? (
                <p className="text-sm text-aco-texto">Nenhum composto registrado.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(compounds.data ?? []).map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/40 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">{c.nome}</span>
                          {c.categoria && (
                            <span className="rounded-full bg-brasa/20 px-2 py-0.5 text-xs text-brasa">{c.categoria}</span>
                          )}
                          {c.via && (
                            <span className="rounded-full bg-border/40 px-2 py-0.5 text-xs text-aco-texto">{c.via}</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-aco-texto">
                          {c.dose_mg && `${c.dose_mg}mg`}
                          {c.frequencia && ` · ${c.frequencia}`}
                          {c.semana_inicio != null && c.semana_fim != null && ` · Sem. ${c.semana_inicio}–${c.semana_fim}`}
                        </p>
                        {c.notas && <p className="mt-1 text-xs text-aco-texto/70 italic">{c.notas}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCompound.mutate(c.id)}
                        className="text-aco-texto/40 hover:text-red-400"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suporte */}
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">🛡️ Suplementos de suporte</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddSupport(true)} className="h-7 text-xs gap-1">
                  ➕ Adicionar
                </Button>
              </div>
              {Object.entries(supportByCategoria).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-medium text-aco-texto uppercase tracking-wide mb-1.5 capitalize">{cat}</p>
                  <div className="flex flex-col gap-1.5">
                    {(items ?? []).map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-md border border-border/30 bg-card/30 p-2.5">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-foreground">{s.nome}</span>
                          {s.dose && <span className="ml-1.5 text-xs text-aco-texto">{s.dose}</span>}
                          {s.momento && <span className="ml-1.5 text-xs text-aco-texto/70">{s.momento}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(supportByCategoria).length === 0 && (
                <p className="text-sm text-aco-texto">Nenhum suplemento de suporte registrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════ TAB: COMPOSTOS ════════════ */}
      {tab === 'compostos' && (
        <div className="flex flex-col gap-4">
          <Card className="border-amber-700/30 bg-amber-950/20">
            <CardContent>
              <p className="text-xs text-amber-300">
                ℹ️ Registre apenas o que foi prescrito pelo seu médico. O FORJA não recomenda compostos ou doses.
              </p>
            </CardContent>
          </Card>
          <Button type="button" variant="outline" onClick={() => setShowAddCompound(true)} className="gap-1.5 w-full">
            ➕ Adicionar composto prescrito
          </Button>
          <div className="flex flex-col gap-2">
            {(compounds.data ?? []).map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="font-heading text-base font-semibold text-foreground">{c.nome}</span>
                        {c.categoria && <span className="rounded-full bg-brasa/20 px-2 py-0.5 text-xs text-brasa">{c.categoria}</span>}
                        {c.via && <span className="rounded-full bg-border/40 px-2 py-0.5 text-xs text-aco-texto">{c.via}</span>}
                      </div>
                    </div>
                    <button type="button" onClick={() => deleteCompound.mutate(c.id)} className="text-aco-texto/40 hover:text-red-400">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {c.dose_mg != null && <div><span className="text-aco-texto">Dose:</span> <span className="text-foreground font-medium">{c.dose_mg}mg</span></div>}
                    {c.frequencia && <div><span className="text-aco-texto">Freq:</span> <span className="text-foreground">{c.frequencia}</span></div>}
                    {c.semana_inicio != null && <div><span className="text-aco-texto">Semanas:</span> <span className="text-foreground">{c.semana_inicio}–{c.semana_fim}</span></div>}
                  </div>
                  {c.notas && <p className="text-xs text-aco-texto/70 italic">{c.notas}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ════════════ TAB: AGENDA ════════════ */}
      {tab === 'agenda' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">📅 Semana {weekNum}</p>
            <Button type="button" onClick={() => setShowLogModal(true)} className="gap-1.5">
              💉 Registrar aplicação
            </Button>
          </div>

          {/* Janelas de exames */}
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">Janelas de exames</p>
              <div className="flex flex-col gap-2">
                {examFases.map((fase) => {
                  const done = exams.data?.filter((e) => fase.semanas.includes(e.semana_alvo ?? -1) && e.status === 'realizado').length ?? 0
                  const total = exams.data?.filter((e) => fase.semanas.includes(e.semana_alvo ?? -1)).length ?? 0
                  const isCurrent = fase.semanas.some((s) => s <= weekNum && weekNum < s + 2)
                  return (
                    <div
                      key={fase.label}
                      className={`flex items-center justify-between rounded-md px-3 py-2 border ${
                        isCurrent ? 'border-brasa/60 bg-brasa/10' : 'border-border/30 bg-card/30'
                      }`}
                    >
                      <div>
                        <p className={`text-sm ${isCurrent ? 'font-semibold text-foreground' : 'text-aco-texto'}`}>{fase.label}</p>
                        <p className="text-xs text-aco-texto">{done}/{total} exames realizados</p>
                      </div>
                      {done === total && total > 0 && <CheckCircle2 className="size-4 text-green-400" />}
                      {isCurrent && done < total && <span className="text-xs text-brasa font-medium">Agora</span>}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Logs recentes */}
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">Últimas aplicações</p>
              {logs.data?.length === 0 ? (
                <p className="text-sm text-aco-texto">Nenhuma aplicação registrada ainda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(logs.data ?? []).slice(0, 10).map((l) => {
                    const compound = compounds.data?.find((c) => c.id === l.compound_id)
                    return (
                      <div key={l.id} className="flex items-start gap-3 rounded-md border border-border/30 bg-card/30 p-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {compound?.nome ?? 'Composto'}
                            </span>
                            {l.dose_aplicada_mg && (
                              <span className="text-xs text-aco-texto">{l.dose_aplicada_mg}mg</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            <span className="text-xs text-aco-texto">
                              {new Date(l.data_aplicacao + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                            {l.local_aplicacao && (
                              <span className="text-xs text-aco-texto">{l.local_aplicacao}</span>
                            )}
                          </div>
                          {(l.humor || l.energia || l.libido) && (
                            <div className="flex gap-3 mt-1 text-xs text-aco-texto">
                              {l.humor && <span>Humor: {l.humor}/5</span>}
                              {l.energia && <span>Energia: {l.energia}/5</span>}
                              {l.libido && <span>Libido: {l.libido}/5</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════ TAB: MONITORAMENTO ════════════ */}
      {tab === 'monitoramento' && (
        <div className="flex flex-col gap-4">
          {/* Métricas comparativas */}
          {latestMetric && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">📊 Composição corporal</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Peso',
                      start: goals.data?.peso_inicial_kg ?? firstMetric?.peso_kg,
                      current: latestMetric.peso_kg,
                      unit: 'kg',
                      lowerBetter: false,
                    },
                    {
                      label: 'Gordura',
                      start: goals.data?.gordura_inicial_pct ?? firstMetric?.gordura_pct,
                      current: latestMetric.gordura_pct,
                      unit: '%',
                      lowerBetter: true,
                    },
                    {
                      label: 'Músculo',
                      start: goals.data?.musculo_inicial_kg ?? (firstMetric?.peso_kg && firstMetric?.musculo_pct ? firstMetric.peso_kg * firstMetric.musculo_pct / 100 : null),
                      current: latestMetric.peso_kg && latestMetric.musculo_pct ? latestMetric.peso_kg * latestMetric.musculo_pct / 100 : null,
                      unit: 'kg',
                      lowerBetter: false,
                    },
                    {
                      label: 'Água',
                      start: firstMetric?.agua_pct,
                      current: latestMetric.agua_pct,
                      unit: '%',
                      lowerBetter: false,
                    },
                  ].map(({ label, start, current, unit, lowerBetter }) => {
                    const delta = start != null && current != null ? current - start : null
                    const improved = delta !== null ? (lowerBetter ? delta < 0 : delta > 0) : null
                    return (
                      <div key={label} className="rounded-lg border border-border/40 bg-card/60 p-3">
                        <p className="text-xs text-aco-texto">{label}</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {current != null ? `${typeof current === 'number' ? current.toFixed(1) : current}${unit}` : '—'}
                        </p>
                        {delta !== null && (
                          <p className={`text-xs font-medium mt-0.5 ${improved ? 'text-green-400' : 'text-red-400'}`}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}{unit}
                          </p>
                        )}
                        {start != null && (
                          <p className="text-xs text-aco-texto/60 mt-0.5">início: {typeof start === 'number' ? start.toFixed(1) : start}{unit}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de evolução */}
          {chartData.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">Evolução durante o ciclo</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="peso" stroke="#F0A93B" dot={false} name="Peso (kg)" strokeWidth={2} />
                      <Line type="monotone" dataKey="gordura" stroke="#CB6A4E" dot={false} name="Gordura %" strokeWidth={2} />
                      <Line type="monotone" dataKey="musculo" stroke="#5FA88C" dot={false} name="Músculo (kg)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de bem-estar */}
          {wellnessData.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">Bem-estar ao longo do ciclo</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wellnessData} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="humor" stroke="#8294B0" dot={false} name="Humor" strokeWidth={2} />
                      <Line type="monotone" dataKey="energia" stroke="#F0A93B" dot={false} name="Energia" strokeWidth={2} />
                      <Line type="monotone" dataKey="libido" stroke="#5FA88C" dot={false} name="Libido" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-aco-texto/70">Escala 1–5 baseada nos registros de aplicação</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ════════════ TAB: EXAMES ════════════ */}
      {tab === 'exames' && (
        <div className="flex flex-col gap-4">
          {examFases.map((fase) => {
            const faseExams = (exams.data ?? []).filter((e) => fase.semanas.includes(e.semana_alvo ?? -1))
            if (faseExams.length === 0) return null
            const realized = faseExams.filter((e) => e.status === 'realizado').length
            return (
              <Card key={fase.label}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{fase.label}</p>
                    <span className="text-xs text-aco-texto">{realized}/{faseExams.length} realizados</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {faseExams.map((exam) => (
                      <div key={exam.id} className="flex items-start gap-3 rounded-md border border-border/30 bg-card/30 p-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-foreground">{exam.nome}</span>
                            {examStatusBadge(exam.status)}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-aco-texto">
                            {exam.data_prevista && (
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                Previsto: {new Date(exam.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {exam.data_realizada && (
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="size-3" />
                                {new Date(exam.data_realizada + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {exam.status !== 'realizado' && (
                            <>
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => { setShowExamResultModal(exam.id); setExamResultValues({}); setExamResultCritical([]) }}
                              >
                                ✓ Realizado
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                className="h-6 text-xs px-2"
                                onClick={() => setShowScheduleModal(exam.id)}
                              >
                                📅 Agendar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ════ MODAL: Resultado de exame ════ */}
      <Modal
        open={!!showExamResultModal}
        onClose={() => { setShowExamResultModal(null); setExamResultValues({}); setExamResultCritical([]) }}
        title="🧪 Registrar resultados"
      >
        {showExamResultModal && (
          <>
            <p className="text-xs text-aco-texto">
              Preencha os marcadores disponíveis no resultado. Deixe em branco os que não constam no exame.
            </p>

            {examResultCritical.length > 0 && (
              <div className="rounded-lg border border-red-700/60 bg-red-950/40 p-3 flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-red-300">⚠️ Marcadores críticos detectados</p>
                {examResultCritical.map((msg) => (
                  <p key={msg} className="text-xs text-red-200/80">{msg}</p>
                ))}
                <p className="text-xs text-red-200/60 mt-1">Contate seu médico responsável imediatamente.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {EXAM_MARKERS.map(({ key, label, unit }) => (
                <FieldInput
                  key={key}
                  label={<>{label} <span className="text-aco-texto/50">({unit})</span></>}
                  type="number"
                  step="0.1"
                  value={examResultValues[key] ?? ''}
                  onChange={(e) => setExamResultValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="—"
                />
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 text-xs"
                onClick={() => {
                  handleRealizadoExam(showExamResultModal)
                  setShowExamResultModal(null)
                  setExamResultValues({})
                  setExamResultCritical([])
                }}
              >
                Pular valores
              </Button>
              {examResultCritical.length === 0 ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => handleExamResultSubmit(showExamResultModal)}
                  disabled={updateExam.isPending}
                >
                  {updateExam.isPending ? 'Salvando…' : 'Confirmar'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-red-700/60 text-red-300"
                  onClick={() => {
                    setShowExamResultModal(null)
                    setExamResultValues({})
                    setExamResultCritical([])
                  }}
                >
                  Fechar
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* ── AVISO LEGAL ── */}
      <div className="rounded-lg border border-border/30 bg-card/20 p-3 mt-2">
        <p className="text-xs text-aco-texto/60 text-center">
          Este módulo registra protocolos prescritos por médico. O FORJA não recomenda compostos, doses ou protocolos.
          Sempre siga as orientações do seu médico responsável.
        </p>
      </div>

      {/* ════ MODAL: Adicionar Composto ════ */}
      <Modal open={showAddCompound} onClose={() => setShowAddCompound(false)} title="Registrar composto">
        <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3">
          <p className="text-xs text-amber-300">
            Registre apenas o que foi prescrito pelo seu médico. O FORJA não recomenda compostos ou doses.
          </p>
        </div>
        {[
          { label: 'Nome do composto *', value: cNome, set: setCNome, placeholder: 'Ex: Testosterona Cipionato' },
          { label: 'Categoria', value: cCategoria, set: setCCategoria, placeholder: 'Ex: androgenico, esteroide...' },
          { label: 'Dose (mg)', value: cDose, set: setCDose, placeholder: '200', type: 'number' },
          { label: 'Frequência', value: cFreq, set: setCFreq, placeholder: '1x por semana, E3D...' },
          { label: 'Semana início', value: cSemIni, set: setCSemIni, placeholder: '1', type: 'number' },
          { label: 'Semana fim', value: cSemFim, set: setCSemFim, placeholder: '12', type: 'number' },
        ].map(({ label, value, set, placeholder, type }) => (
          <FieldInput
            key={label}
            label={label}
            type={type ?? 'text'}
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={placeholder}
          />
        ))}
        <FieldSelect label="Via" value={cVia} onChange={(e) => setCVia(e.target.value)}>
          <option value="injetavel">Injetável</option>
          <option value="oral">Oral</option>
          <option value="topico">Tópico</option>
        </FieldSelect>
        <FieldTextarea
          label="Notas"
          value={cNotas}
          onChange={(e) => setCNotas(e.target.value)}
          placeholder="Observações..."
          rows={2}
        />
        <Button
          type="button"
          onClick={handleAddCompound}
          disabled={!cNome.trim() || createCompound.isPending}
          className="w-full"
        >
          {createCompound.isPending ? 'Salvando…' : 'Salvar composto'}
        </Button>
      </Modal>

      {/* ════ MODAL: Adicionar Suporte ════ */}
      <Modal open={showAddSupport} onClose={() => setShowAddSupport(false)} title="Adicionar suporte">
        <FieldInput
          label="Nome *"
          type="text"
          value={sNome}
          onChange={(e) => setSNome(e.target.value)}
          placeholder="Ex: TUDCA, Omega-3..."
        />
        <FieldSelect label="Categoria" value={sCategoria} onChange={(e) => setSCategoria(e.target.value)}>
          {['hepatoprotetor', 'cardiovascular', 'antioxidante', 'hormonal', 'mineral', 'outros'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </FieldSelect>
        <FieldInput
          label="Dose"
          type="text"
          value={sDose}
          onChange={(e) => setSDose(e.target.value)}
          placeholder="Ex: 500mg 2x/dia"
        />
        <FieldInput
          label="Momento"
          type="text"
          value={sMomento}
          onChange={(e) => setSMomento(e.target.value)}
          placeholder="Ex: com as refeições"
        />
        <FieldInput
          label="Motivo (opcional)"
          type="text"
          value={sMotivo}
          onChange={(e) => setSMotivo(e.target.value)}
          placeholder="Por que este suporte?"
        />
        <Button type="button" onClick={handleAddSupport} disabled={!sNome.trim() || createSupport.isPending} className="w-full">
          {createSupport.isPending ? 'Salvando…' : 'Salvar suporte'}
        </Button>
      </Modal>

      {/* ════ MODAL: Registrar Aplicação ════ */}
      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title="💉 Registrar aplicação">
        <FieldSelect
          label="Composto"
          value={logCompound}
          onChange={(e) => {
            setLogCompound(e.target.value)
            const c = compounds.data?.find((x) => x.id === e.target.value)
            if (c?.dose_mg) setLogDose(String(c.dose_mg))
          }}
        >
          <option value="">Selecionar composto</option>
          {(compounds.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </FieldSelect>

        <FieldInput
          label="Dose aplicada (mg)"
          type="number"
          value={logDose}
          onChange={(e) => setLogDose(e.target.value)}
        />

        <FieldSelect label="Local de aplicação" value={logLocal} onChange={(e) => setLogLocal(e.target.value)}>
          {LOCAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </FieldSelect>

        {[
              { label: 'Humor', value: logHumor, set: setLogHumor },
              { label: 'Energia', value: logEnergia, set: setLogEnergia },
              { label: 'Libido', value: logLibido, set: setLogLibido },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-aco-texto mb-1">
                  <Label className="text-xs">{label}</Label>
                  <span>{value}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full h-1.5 accent-brasa"
                />
              </div>
            ))}

        <FieldTextarea
          label="Efeitos percebidos"
          value={logEfeitos}
          onChange={(e) => setLogEfeitos(e.target.value)}
          placeholder="Como você está se sentindo..."
          rows={2}
        />

        <FieldTextarea
          label="Observações"
          value={logObs}
          onChange={(e) => setLogObs(e.target.value)}
          placeholder="Observações gerais..."
          rows={2}
        />

        <Button type="button" onClick={handleRegistrarLog} disabled={createLog.isPending} className="w-full">
          {createLog.isPending ? 'Registrando…' : 'Registrar aplicação'}
        </Button>
      </Modal>

      {/* ════ MODAL: Agendar exame ════ */}
      <Modal
        open={!!showScheduleModal}
        onClose={() => setShowScheduleModal(null)}
        title="📅 Agendar exame"
        maxWidth="sm"
      >
        <FieldInput
          label="Data prevista"
          type="date"
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setShowScheduleModal(null)}>Cancelar</Button>
          <Button type="button" className="flex-1" onClick={() => showScheduleModal && handleScheduleExam(showScheduleModal)}>Agendar</Button>
        </div>
      </Modal>

      {/* ════ MODAL: Editar protocolo ════ */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="✏️ Editar protocolo">
        <>
            {[
              { label: 'Nome *', value: eNome, set: setENome },
              { label: 'Objetivo *', value: eObjetivo, set: setEObjetivo },
              { label: 'Médico responsável', value: eMedico, set: setEMedico },
            ].map(({ label, value, set }) => (
              <FieldInput key={label} label={label} type="text" value={value} onChange={(e) => set(e.target.value)} />
            ))}
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect label="Via principal" value={eVia} onChange={(e) => setEVia(e.target.value)}>
                <option value="injetavel">Injetável</option>
                <option value="oral">Oral</option>
                <option value="topico">Tópico</option>
              </FieldSelect>
              <FieldInput
                label="Duração (semanas)"
                type="number"
                min={1}
                value={eDuracao}
                onChange={(e) => setEDuracao(e.target.value)}
              />
            </div>
            <FieldInput
              label="Data de início"
              type="date"
              value={eDataInicio}
              onChange={(e) => setEDataInicio(e.target.value)}
            />
            <FieldTextarea label="Notas" value={eNotas} onChange={(e) => setENotas(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleSaveEdit}
                disabled={!eNome.trim() || !eObjetivo.trim() || updateProtocol.isPending}
              >
                {updateProtocol.isPending ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
        </>
      </Modal>

      {/* ════ MODAL: Relatório pré-consulta ════ */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title="🖨️ Relatório pré-consulta" maxWidth="lg">
        <ProtocolReport
          protocol={p}
          compounds={compounds.data ?? []}
          logs={logs.data ?? []}
          exams={exams.data ?? []}
          healthMetrics={healthMetrics.data ?? []}
          today={today}
        />
      </Modal>

      {dialog}
    </div>
  )
}
