import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateProtocolCompound, useUpdateProtocolCompound } from '@/hooks/use-protocol-compounds'
import { mensagemDeErro } from '@/lib/feedback'
import type { ProtocolCompound } from '@/types/database'

// Valores aceitos pelo banco (protocol_compounds_categoria_check / _via_check).
const CATEGORIAS = [
  { value: 'base', label: 'Base' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'ai', label: 'AI' },
  { value: 'tpc', label: 'TPC' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'vitamina', label: 'Vitamina' },
  { value: 'outro', label: 'Outro' },
]
const VIAS = [
  { value: 'injetavel', label: 'Injetável' },
  { value: 'oral', label: 'Oral' },
  { value: 'topico', label: 'Tópico' },
]

type Props = { open: boolean; protocolId: string; totalSemanas: number; composto?: ProtocolCompound; onClose: () => void }

/** Registrar/editar um composto prescrito. Só grava o que o usuário informa — o app não sugere nada. */
export function CompostoModal({ open, protocolId, totalSemanas, composto, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={composto ? `Editar ${composto.nome}` : 'Adicionar composto'}>
      {open && <Formulario protocolId={protocolId} totalSemanas={totalSemanas} composto={composto} onClose={onClose} />}
    </Modal>
  )
}

type Erros = Partial<Record<'nome' | 'dose' | 'semanaInicio' | 'semanaFim', string>>

function Formulario({ protocolId, totalSemanas, composto, onClose }: Omit<Props, 'open'>) {
  const criar = useCreateProtocolCompound()
  const atualizar = useUpdateProtocolCompound()
  const [nome, setNome] = useState(composto?.nome ?? '')
  const [categoria, setCategoria] = useState(composto?.categoria ?? 'base')
  const [dose, setDose] = useState(composto?.dose_mg != null ? String(composto.dose_mg).replace('.', ',') : '')
  const [frequencia, setFrequencia] = useState(composto?.frequencia ?? '')
  const [via, setVia] = useState(composto?.via ?? 'injetavel')
  const [semanaInicio, setSemanaInicio] = useState(String(composto?.semana_inicio ?? 1))
  const [semanaFim, setSemanaFim] = useState(composto?.semana_fim != null ? String(composto.semana_fim) : String(totalSemanas))
  const [notas, setNotas] = useState(composto?.notas ?? '')
  const [erros, setErros] = useState<Erros>({})
  const salvando = criar.isPending || atualizar.isPending

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const doseN = dose.trim() ? Number(dose.replace(',', '.')) : null
    const ini = semanaInicio.trim() ? Number(semanaInicio) : null
    const fim = semanaFim.trim() ? Number(semanaFim) : null
    const novos: Erros = {
      nome: nome.trim() ? undefined : 'Informe o nome do composto.',
      dose: doseN != null && (!Number.isFinite(doseN) || doseN <= 0) ? 'Dose maior que zero, em mg.' : undefined,
      semanaInicio: ini != null && (!Number.isInteger(ini) || ini < 1) ? 'Semana a partir de 1.' : undefined,
      semanaFim: fim != null && (!Number.isInteger(fim) || fim < 1) ? 'Semana a partir de 1.' : ini != null && fim != null && fim < ini ? 'Fim antes do início.' : undefined,
    }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return

    const values = {
      protocol_id: protocolId,
      nome: nome.trim(),
      categoria,
      dose_mg: doseN,
      frequencia: frequencia.trim() || null,
      via,
      semana_inicio: ini,
      semana_fim: fim,
      notas: notas.trim() || null,
    }
    const opcoes = {
      onSuccess: () => {
        toast.success(composto ? `${values.nome} atualizado.` : `${values.nome} registrado.`)
        onClose()
      },
      onError: (err: unknown) => toast.error(mensagemDeErro(err, 'salvar o composto')),
    }
    if (composto) atualizar.mutate({ id: composto.id, values }, opcoes)
    else criar.mutate(values, opcoes)
  }

  const limpar = (campo: keyof Erros) => setErros((er) => ({ ...er, [campo]: undefined }))

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <p role="note" className="flex items-start gap-2 rounded-[var(--r-md)] border border-brasa/40 bg-brasa/10 px-3 py-2 text-[13px] text-nevoa">
        <Icon name="warning" size={18} filled className="mt-0.5 shrink-0 text-brasa" />
        Registre apenas o que foi prescrito pelo médico. O FORJA não recomenda compostos nem doses.
      </p>

      <FormField label="Nome" htmlFor="comp-nome" erro={erros.nome}>
        <Input value={nome} onChange={(e) => (setNome(e.target.value), limpar('nome'))} {...propsDeErro('comp-nome', erros.nome)} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Categoria" htmlFor="comp-categoria">
          <Select id="comp-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Via" htmlFor="comp-via">
          <Select id="comp-via" value={via} onChange={(e) => setVia(e.target.value)}>
            {VIAS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Dose (mg)" htmlFor="comp-dose" erro={erros.dose}>
          <Input inputMode="decimal" value={dose} onChange={(e) => (setDose(e.target.value), limpar('dose'))} {...propsDeErro('comp-dose', erros.dose)} />
        </FormField>
        <FormField label="Frequência" htmlFor="comp-frequencia">
          <Input id="comp-frequencia" value={frequencia} onChange={(e) => setFrequencia(e.target.value)} placeholder="conforme prescrição" />
        </FormField>
        <FormField label="Semana início" htmlFor="comp-sem-ini" erro={erros.semanaInicio}>
          <Input type="number" inputMode="numeric" min={1} value={semanaInicio} onChange={(e) => (setSemanaInicio(e.target.value), limpar('semanaInicio'))} {...propsDeErro('comp-sem-ini', erros.semanaInicio)} />
        </FormField>
        <FormField label="Semana fim" htmlFor="comp-sem-fim" erro={erros.semanaFim}>
          <Input type="number" inputMode="numeric" min={1} value={semanaFim} onChange={(e) => (setSemanaFim(e.target.value), limpar('semanaFim'))} {...propsDeErro('comp-sem-fim', erros.semanaFim)} />
        </FormField>
      </div>

      <FormField label="Notas" htmlFor="comp-notas">
        <Textarea id="comp-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={salvando}>
          {salvando && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {salvando ? 'Salvando…' : composto ? 'Salvar' : 'Registrar composto'}
        </Button>
      </div>
    </form>
  )
}
