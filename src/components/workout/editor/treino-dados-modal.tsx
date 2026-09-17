import { useState } from 'react'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { DIAS_SEMANA, type TreinoDadosInput } from '@/hooks/use-workouts'

type Props = {
  open: boolean
  titulo: string
  inicial?: TreinoDadosInput
  salvando: boolean
  rotuloSalvar: string
  onClose: () => void
  onSalvar: (valores: TreinoDadosInput) => void
}

/** Nome + dia da semana do treino (criar "＋ Novo treino" ou "Editar nome/dia"). */
export function TreinoDadosModal({ open, titulo, inicial, salvando, rotuloSalvar, onClose, onSalvar }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={titulo}>
      {open && <Formulario inicial={inicial} salvando={salvando} rotuloSalvar={rotuloSalvar} onClose={onClose} onSalvar={onSalvar} />}
    </Modal>
  )
}

function Formulario({ inicial, salvando, rotuloSalvar, onClose, onSalvar }: Omit<Props, 'open' | 'titulo'>) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [dia, setDia] = useState(inicial?.dia_semana ?? '')
  const [erro, setErro] = useState<string | null>(null)

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Dê um nome ao treino.')
      return
    }
    onSalvar({ nome: nome.trim(), dia_semana: dia || null })
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <FormField label="Nome do treino" htmlFor="treino-nome" erro={erro}>
        <Input
          autoFocus
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setErro(null)
          }}
          placeholder="Treino A — Peito"
          {...propsDeErro('treino-nome', erro)}
        />
      </FormField>
      <FormField label="Dia da semana" htmlFor="treino-dia" dica="Opcional — sem dia, o treino segue a rotação.">
        <Select id="treino-dia" value={dia} onChange={(e) => setDia(e.target.value)}>
          <option value="">Sem dia fixo</option>
          {DIAS_SEMANA.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={salvando}>
          {salvando && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {salvando ? 'Salvando…' : rotuloSalvar}
        </Button>
      </div>
    </form>
  )
}
