import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { CAMPOS_MEDICAO, useSalvarMedicao, type CampoMedicao, type MedicaoManual } from '@/hooks/use-body-metrics'
import { todayInSaoPaulo } from '@/lib/date'
import { mensagemDeErro } from '@/lib/feedback'
import type { BodyMetric } from '@/types/database'

type Campo = { chave: CampoMedicao; rotulo: string; max?: number; inteiro?: boolean }

const GRUPOS: { titulo: string; campos: Campo[] }[] = [
  {
    titulo: 'Principal',
    campos: [
      { chave: 'peso_kg', rotulo: 'Peso (kg)' },
      { chave: 'gordura_pct', rotulo: 'Gordura % (TGC)', max: 100 },
      { chave: 'musculo_pct', rotulo: 'Músculo %', max: 100 },
      { chave: 'agua_pct', rotulo: 'Água %', max: 100 },
    ],
  },
  {
    titulo: 'Composição',
    campos: [
      { chave: 'imc', rotulo: 'IMC' },
      { chave: 'massa_ossea_kg', rotulo: 'Massa óssea (kg)' },
      { chave: 'tmb_kcal', rotulo: 'TMB (kcal)', inteiro: true },
      { chave: 'proteina_pct', rotulo: 'Proteína %', max: 100 },
      { chave: 'idade_corporal', rotulo: 'Idade corporal', inteiro: true },
      { chave: 'gordura_visceral', rotulo: 'Gordura visceral' },
      { chave: 'gordura_subcutanea_pct', rotulo: 'Gordura subcutânea %', max: 100 },
    ],
  },
  {
    titulo: 'Massas (kg)',
    campos: [
      { chave: 'gordura_corporal_kg', rotulo: 'Gordura corporal (kg)' },
      { chave: 'peso_sem_gordura_kg', rotulo: 'Peso sem gordura (kg)' },
      { chave: 'peso_muscular_kg', rotulo: 'Peso muscular (kg)' },
      { chave: 'proteina_kg', rotulo: 'Proteína (kg)' },
      { chave: 'peso_ideal_kg', rotulo: 'Peso ideal (kg)' },
    ],
  },
]

const TODOS = GRUPOS.flatMap((g) => g.campos)

type Props = {
  open: boolean
  onClose: () => void
  /** Medições existentes: avisa quando a data escolhida já tem registro (vai completar/atualizar). */
  existentes: BodyMetric[]
  onSalvo?: (medicao: MedicaoManual) => void
}

/** "Inserir manualmente": todos os campos de body_metrics, upsert por data. */
export function BodyMetricModal({ open, onClose, existentes, onSalvo }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Inserir medição manualmente" description="Preencha só o que a balança ou o laudo mostrou." maxWidth="lg">
      {open && <Formulario onClose={onClose} existentes={existentes} onSalvo={onSalvo} />}
    </Modal>
  )
}

function Formulario({ onClose, existentes, onSalvo }: Omit<Props, 'open'>) {
  const salvar = useSalvarMedicao()
  const [data, setData] = useState(todayInSaoPaulo())
  const [valores, setValores] = useState<Partial<Record<CampoMedicao, string>>>({})
  const [erros, setErros] = useState<Partial<Record<CampoMedicao | 'data' | 'geral', string>>>({})
  const jaExiste = existentes.find((m) => m.medido_em === data)

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    const medicao: MedicaoManual = { medido_em: data }
    if (!data) novos.data = 'Informe a data.'
    else if (data > todayInSaoPaulo()) novos.data = 'A data não pode ser no futuro.'

    for (const campo of TODOS) {
      const bruto = valores[campo.chave]?.trim()
      if (!bruto) continue
      const n = Number(bruto.replace(',', '.'))
      if (!Number.isFinite(n) || n < 0) novos[campo.chave] = 'Número a partir de 0.'
      else if (campo.max != null && n > campo.max) novos[campo.chave] = `Máximo ${campo.max}.`
      else if (campo.inteiro && !Number.isInteger(n)) novos[campo.chave] = 'Use um número inteiro.'
      else medicao[campo.chave] = n
    }
    if (!Object.keys(novos).length && CAMPOS_MEDICAO.every((c) => medicao[c] == null)) novos.geral = 'Preencha ao menos um valor.'
    setErros(novos)
    if (Object.keys(novos).length) return

    salvar.mutate(medicao, {
      onSuccess: () => {
        toast.success(jaExiste ? `Medição de ${data.split('-').reverse().join('/')} atualizada.` : 'Medição registrada.')
        onSalvo?.(medicao)
        onClose()
      },
      onError: (err) => toast.error(mensagemDeErro(err, 'salvar a medição')),
    })
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <FormField
        label="Data da medição"
        htmlFor="med-data"
        erro={erros.data}
        dica={jaExiste ? 'Já existe medição nesta data: os valores preenchidos atualizam os de lá; os vazios continuam como estão.' : undefined}
      >
        <Input type="date" max={todayInSaoPaulo()} value={data} onChange={(e) => setData(e.target.value)} {...propsDeErro('med-data', erros.data)} />
      </FormField>

      {GRUPOS.map((grupo) => (
        <fieldset key={grupo.titulo} className="flex flex-col gap-3">
          <legend className="ds-label mb-2">{grupo.titulo}</legend>
          <div className="grid grid-cols-2 gap-3">
            {grupo.campos.map((c) => (
              <FormField key={c.chave} label={c.rotulo} htmlFor={`med-${c.chave}`} erro={erros[c.chave]}>
                <Input
                  inputMode="decimal"
                  value={valores[c.chave] ?? ''}
                  placeholder={jaExiste?.[c.chave] != null ? String(jaExiste[c.chave]).replace('.', ',') : undefined}
                  onChange={(e) => {
                    setValores((v) => ({ ...v, [c.chave]: e.target.value }))
                    setErros((er) => ({ ...er, [c.chave]: undefined, geral: undefined }))
                  }}
                  {...propsDeErro(`med-${c.chave}`, erros[c.chave])}
                />
              </FormField>
            ))}
          </div>
        </fieldset>
      ))}

      {erros.geral && (
        <p role="alert" className="text-[13px] font-medium text-alerta-texto">
          {erros.geral}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={salvar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={salvar.isPending}>
          {salvar.isPending && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {salvar.isPending ? 'Salvando…' : 'Salvar medição'}
        </Button>
      </div>
    </form>
  )
}
