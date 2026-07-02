import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { FieldInput, FieldSelect, FieldTextarea } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { useCreateProtocol } from '@/hooks/use-protocols'
import { useCreateProtocolExams, type ProtocolExamInput } from '@/hooks/use-protocol-exams'
import { useCreateProtocolGoal } from '@/hooks/use-protocol-goals'
import type { BodyMetric } from '@/types/database'

type Step = 1 | 2 | 3

type ExamTemplateItem = {
  nome: string
  semana: number
  fase: string
}

function buildExamTemplate(duracao: number): ExamTemplateItem[] {
  const meio = Math.max(1, Math.round(duracao / 2))
  const tpc = duracao + 4
  return [
    { nome: 'Hemograma completo', semana: 0, fase: 'Pré-ciclo' },
    { nome: 'Perfil lipídico completo', semana: 0, fase: 'Pré-ciclo' },
    { nome: 'TGO/TGP (função hepática)', semana: 0, fase: 'Pré-ciclo' },
    { nome: 'Testosterona total', semana: 0, fase: 'Pré-ciclo' },
    { nome: 'Estradiol', semana: 0, fase: 'Pré-ciclo' },
    { nome: 'PSA', semana: 0, fase: 'Pré-ciclo' },
    { nome: 'Creatinina + função renal', semana: 0, fase: 'Pré-ciclo' },
    { nome: 'Hemograma completo', semana: meio, fase: `Mid-ciclo (Sem. ${meio})` },
    { nome: 'Perfil lipídico completo', semana: meio, fase: `Mid-ciclo (Sem. ${meio})` },
    { nome: 'TGO/TGP (função hepática)', semana: meio, fase: `Mid-ciclo (Sem. ${meio})` },
    { nome: 'Estradiol', semana: meio, fase: `Mid-ciclo (Sem. ${meio})` },
    { nome: 'Hemograma completo', semana: duracao, fase: `Fim do ciclo (Sem. ${duracao})` },
    { nome: 'Perfil lipídico completo', semana: duracao, fase: `Fim do ciclo (Sem. ${duracao})` },
    { nome: 'TGO/TGP (função hepática)', semana: duracao, fase: `Fim do ciclo (Sem. ${duracao})` },
    { nome: 'Testosterona total', semana: duracao, fase: `Fim do ciclo (Sem. ${duracao})` },
    { nome: 'Estradiol', semana: duracao, fase: `Fim do ciclo (Sem. ${duracao})` },
    { nome: 'Testosterona total', semana: tpc, fase: `Pós-TPC (Sem. ${tpc})` },
    { nome: 'LH + FSH', semana: tpc, fase: `Pós-TPC (Sem. ${tpc})` },
    { nome: 'Estradiol', semana: tpc, fase: `Pós-TPC (Sem. ${tpc})` },
    { nome: 'Hemograma completo', semana: tpc, fase: `Pós-TPC (Sem. ${tpc})` },
  ]
}

type ProtocolCreateWizardProps = {
  onClose: () => void
  latestMetric?: BodyMetric | null
}

export function ProtocolCreateWizard({ onClose, latestMetric }: ProtocolCreateWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState<string | null>(null)

  const createProtocol = useCreateProtocol()
  const createExams = useCreateProtocolExams()
  const createGoal = useCreateProtocolGoal()

  // Passo 1 — dados do protocolo
  const [nome, setNome] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [medico, setMedico] = useState('')
  const [via, setVia] = useState('injetavel')
  const [duracao, setDuracao] = useState('12')
  const [dataInicio, setDataInicio] = useState('')
  const [notas, setNotas] = useState('')

  // Passo 2 — checklist de exames
  const duracaoNum = Math.max(1, Number(duracao) || 12)
  const examTemplate = useMemo(() => buildExamTemplate(duracaoNum), [duracaoNum])
  const [uncheckedExams, setUncheckedExams] = useState<Set<number>>(new Set())

  // Passo 3 — metas (opcional)
  const [pesoIni, setPesoIni] = useState(latestMetric?.peso_kg ? String(latestMetric.peso_kg) : '')
  const [pesoMeta, setPesoMeta] = useState('')
  const [gorduraIni, setGorduraIni] = useState(latestMetric?.gordura_pct ? String(latestMetric.gordura_pct) : '')
  const [gorduraMeta, setGorduraMeta] = useState('')
  const [musculoIni, setMusculoIni] = useState('')
  const [musculoMeta, setMusculoMeta] = useState('')
  const [forcaMeta, setForcaMeta] = useState('')

  const examsByFase = useMemo(() => {
    const map = new Map<string, { item: ExamTemplateItem; index: number }[]>()
    examTemplate.forEach((item, index) => {
      const list = map.get(item.fase) ?? []
      list.push({ item, index })
      map.set(item.fase, list)
    })
    return map
  }, [examTemplate])

  function toggleExam(index: number) {
    setUncheckedExams((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function num(value: string): number | null {
    const n = parseFloat(value.replace(',', '.'))
    return isNaN(n) ? null : n
  }

  async function handleSubmit() {
    setError(null)
    try {
      const protocol = await createProtocol.mutateAsync({
        nome: nome.trim(),
        objetivo: objetivo.trim(),
        status: 'planejado',
        via,
        medico_responsavel: medico.trim() || null,
        data_inicio: dataInicio || null,
        duracao_semanas: duracaoNum,
        notas: notas.trim() || null,
      })

      const selectedExams: ProtocolExamInput[] = examTemplate
        .filter((_, i) => !uncheckedExams.has(i))
        .map((e) => ({
          protocol_id: protocol.id,
          nome: e.nome,
          tipo: 'sangue',
          semana_alvo: e.semana,
          status: 'pendente' as const,
        }))
      if (selectedExams.length > 0) await createExams.mutateAsync(selectedExams)

      const goalFields = {
        peso_inicial_kg: num(pesoIni),
        peso_meta_kg: num(pesoMeta),
        gordura_inicial_pct: num(gorduraIni),
        gordura_meta_pct: num(gorduraMeta),
        musculo_inicial_kg: num(musculoIni),
        musculo_meta_kg: num(musculoMeta),
        forca_meta: forcaMeta.trim() || null,
      }
      if (Object.values(goalFields).some((v) => v !== null)) {
        await createGoal.mutateAsync({ protocol_id: protocol.id, ...goalFields })
      }

      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar o protocolo.')
    }
  }

  const isSaving = createProtocol.isPending || createExams.isPending || createGoal.isPending
  const step1Valid = nome.trim().length > 0 && objetivo.trim().length > 0

  return (
    <Modal open onClose={onClose} title={`🔬 Cadastrar protocolo — passo ${step} de 3`}>
        {/* Indicador de progresso */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-brasa' : 'bg-border/40'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3">
              <p className="text-xs text-amber-300">
                Registre apenas o protocolo prescrito pelo seu médico. O FORJA não recomenda
                compostos, doses ou protocolos.
              </p>
            </div>
            <FieldInput
              label="Nome do protocolo *"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Protocolo 2026.2"
            />
            <FieldInput
              label="Objetivo *"
              type="text"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ex: Recomposição corporal"
            />
            <FieldInput
              label="Médico responsável"
              type="text"
              value={medico}
              onChange={(e) => setMedico(e.target.value)}
              placeholder="Nome do médico"
            />
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect label="Via principal" value={via} onChange={(e) => setVia(e.target.value)}>
                <option value="injetavel">Injetável</option>
                <option value="oral">Oral</option>
                <option value="topico">Tópico</option>
              </FieldSelect>
              <FieldInput
                label="Duração (semanas)"
                type="number"
                min={1}
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
              />
            </div>
            <div>
              <FieldInput
                label="Data de início (opcional)"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <p className="mt-1 text-xs text-aco-texto/60">
                Se vazio, será definida quando você iniciar o ciclo.
              </p>
            </div>
            <FieldTextarea
              label="Notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Observações da prescrição..."
            />
            <Button type="button" onClick={() => setStep(2)} disabled={!step1Valid} className="w-full">
              Próximo: exames →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-aco-texto">
              Checklist sugerido de monitoramento para {duracaoNum} semanas. Desmarque o que não se
              aplica e confirme as janelas com seu médico.
            </p>
            {[...examsByFase.entries()].map(([fase, items]) => (
              <div key={fase}>
                <p className="text-xs font-medium text-aco-texto uppercase tracking-wide mb-1.5">
                  {fase}
                </p>
                <div className="flex flex-col gap-1">
                  {items.map(({ item, index }) => {
                    const checked = !uncheckedExams.has(index)
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleExam(index)}
                        className={`flex items-center gap-2.5 rounded-md border p-2 text-left transition-colors ${
                          checked
                            ? 'border-brasa/40 bg-brasa/5'
                            : 'border-border/30 bg-card/20 opacity-50'
                        }`}
                      >
                        <div
                          className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                            checked ? 'border-brasa bg-brasa/20 text-brasa' : 'border-border/60'
                          }`}
                        >
                          {checked && <span className="text-[9px] leading-none">✓</span>}
                        </div>
                        <span className="text-sm text-foreground">{item.nome}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                ← Voltar
              </Button>
              <Button type="button" className="flex-1" onClick={() => setStep(3)}>
                Próximo: metas →
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-xs text-aco-texto">
              Metas do ciclo (opcional). Os valores iniciais foram preenchidos com sua última
              medição, quando disponível.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Peso inicial (kg)', value: pesoIni, set: setPesoIni },
                { label: 'Peso meta (kg)', value: pesoMeta, set: setPesoMeta },
                { label: 'Gordura inicial (%)', value: gorduraIni, set: setGorduraIni },
                { label: 'Gordura meta (%)', value: gorduraMeta, set: setGorduraMeta },
                { label: 'Músculo inicial (kg)', value: musculoIni, set: setMusculoIni },
                { label: 'Músculo meta (kg)', value: musculoMeta, set: setMusculoMeta },
              ].map(({ label, value, set }) => (
                <FieldInput
                  key={label}
                  label={label}
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="—"
                />
              ))}
            </div>
            <FieldInput
              label="Meta de força (opcional)"
              type="text"
              value={forcaMeta}
              onChange={(e) => setForcaMeta(e.target.value)}
              placeholder="Ex: Supino 120kg, Agachamento 160kg"
            />
            {error && (
              <div className="rounded-lg border border-red-700/60 bg-red-950/40 p-3">
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={isSaving}>
                ← Voltar
              </Button>
              <Button type="button" className="flex-1" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Salvando…' : '✓ Criar protocolo'}
              </Button>
            </div>
          </>
        )}
    </Modal>
  )
}
