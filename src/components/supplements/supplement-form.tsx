import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SupplementInput } from '@/hooks/use-supplements'
import type { Supplement, SupplementMomento, SupplementTipo } from '@/types/database'

const TIPOS: SupplementTipo[] = ['whey', 'creatina', 'vitamina', 'pre_treino', 'omega3', 'minerais', 'outro']
const MOMENTOS: SupplementMomento[] = [
  'jejum',
  'cafe_manha',
  'pre_treino',
  'pos_treino',
  'almoco',
  'jantar',
  'dormir',
  'qualquer',
]
const DIAS: { value: string; label: string }[] = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
]

type SupplementFormProps = {
  supplement?: Supplement
  onSubmit: (values: SupplementInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function SupplementForm({ supplement, onSubmit, onCancel, isSubmitting }: SupplementFormProps) {
  const [nome, setNome] = useState(supplement?.nome ?? '')
  const [tipo, setTipo] = useState<SupplementTipo>(supplement?.tipo ?? 'outro')
  const [dose, setDose] = useState(supplement?.dose ?? '')
  const [unidade, setUnidade] = useState(supplement?.unidade ?? '')
  const [momento, setMomento] = useState<SupplementMomento>(supplement?.momento ?? 'qualquer')
  const [diasSemana, setDiasSemana] = useState<string[]>(supplement?.dias_semana ?? [])
  const [notas, setNotas] = useState(supplement?.notas ?? '')

  function toggleDia(dia: string) {
    setDiasSemana((current) => (current.includes(dia) ? current.filter((d) => d !== dia) : [...current, dia]))
  }

  const [erroNome, setErroNome] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!nome.trim()) {
      setErroNome('Informe o nome do suplemento.')
      return
    }
    onSubmit({
      nome: nome.trim(),
      tipo,
      dose: dose.trim() || null,
      unidade: unidade.trim() || null,
      momento,
      dias_semana: diasSemana.length > 0 ? diasSemana : null,
      ativo: supplement?.ativo ?? true,
      notas: notas.trim() || null,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nome" htmlFor="sup-nome" erro={erroNome}>
          <Input
            autoFocus
            value={nome}
            onChange={(event) => {
              setNome(event.target.value)
              setErroNome(null)
            }}
            {...propsDeErro('sup-nome', erroNome)}
          />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sup-tipo">Tipo</Label>
          <Select id="sup-tipo" value={tipo} onChange={(event) => setTipo(event.target.value as SupplementTipo)}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sup-dose">Dose</Label>
          <Input id="sup-dose" value={dose} onChange={(event) => setDose(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sup-unidade">Unidade</Label>
          <Input id="sup-unidade" placeholder="g, caps, dose" value={unidade} onChange={(event) => setUnidade(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sup-momento">Momento</Label>
          <Select id="sup-momento" value={momento} onChange={(event) => setMomento(event.target.value as SupplementMomento)}>
            {MOMENTOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Dias da semana</Label>
        <div className="flex flex-wrap gap-1.5">
          {DIAS.map((dia) => (
            <button
              key={dia.value}
              type="button"
              onClick={() => toggleDia(dia.value)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                diasSemana.includes(dia.value)
                  ? 'border-brasa bg-brasa/15 text-brasa'
                  : 'border-border text-aco-texto hover:bg-aco-claro'
              }`}
            >
              {dia.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sup-notas">Notas</Label>
        <Textarea id="sup-notas" rows={2} value={notas} onChange={(event) => setNotas(event.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !nome.trim()}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
