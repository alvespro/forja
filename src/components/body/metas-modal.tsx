import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useAtualizarMetas, type MetasInput } from '@/hooks/use-body-goals'
import { mensagemDeErro } from '@/lib/feedback'
import type { BodyGoal } from '@/types/database'

const CAMPOS: { chave: keyof MetasInput; rotulo: string; max?: number }[] = [
  { chave: 'peso_meta_kg', rotulo: 'Peso meta (kg)' },
  { chave: 'gordura_meta_pct', rotulo: 'Gordura % meta', max: 100 },
  { chave: 'musculo_pct_meta', rotulo: 'Músculo % meta', max: 100 },
  { chave: 'agua_meta_pct', rotulo: 'Água % meta', max: 100 },
  { chave: 'gordura_visceral_meta', rotulo: 'Gordura visceral meta' },
  { chave: 'imc_meta', rotulo: 'IMC meta' },
]

/** "Editar metas": ajusta as metas do ciclo atual (UPDATE em body_goals), sem trocar de ciclo. */
export function MetasModal({ open, meta, onClose }: { open: boolean; meta: BodyGoal; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Editar metas" description="Metas do ciclo atual — para mudar de objetivo, use Editar objetivo.">
      {open && <Formulario meta={meta} onClose={onClose} />}
    </Modal>
  )
}

function Formulario({ meta, onClose }: { meta: BodyGoal; onClose: () => void }) {
  const atualizar = useAtualizarMetas()
  const [valores, setValores] = useState<Record<keyof MetasInput, string>>(
    () => Object.fromEntries(CAMPOS.map((c) => [c.chave, meta[c.chave] == null ? '' : String(meta[c.chave]).replace('.', ',')])) as Record<keyof MetasInput, string>,
  )
  const [erros, setErros] = useState<Partial<Record<keyof MetasInput, string>>>({})

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    const values = {} as MetasInput
    for (const c of CAMPOS) {
      const bruto = valores[c.chave].trim()
      if (!bruto) {
        values[c.chave] = null
        continue
      }
      const n = Number(bruto.replace(',', '.'))
      if (!Number.isFinite(n) || n < 0) novos[c.chave] = 'Número a partir de 0.'
      else if (c.max != null && n > c.max) novos[c.chave] = `Máximo ${c.max}.`
      else values[c.chave] = n
    }
    setErros(novos)
    if (Object.keys(novos).length) return
    atualizar.mutate(
      { id: meta.id, values },
      {
        onSuccess: () => {
          toast.success('Metas atualizadas.')
          onClose()
        },
        onError: (err) => toast.error(mensagemDeErro(err, 'salvar as metas')),
      },
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {CAMPOS.map((c) => (
          <FormField key={c.chave} label={c.rotulo} htmlFor={`meta-${c.chave}`} erro={erros[c.chave]}>
            <Input
              inputMode="decimal"
              value={valores[c.chave]}
              onChange={(e) => {
                setValores((v) => ({ ...v, [c.chave]: e.target.value }))
                setErros((er) => ({ ...er, [c.chave]: undefined }))
              }}
              {...propsDeErro(`meta-${c.chave}`, erros[c.chave])}
            />
          </FormField>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={atualizar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={atualizar.isPending}>
          {atualizar.isPending && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {atualizar.isPending ? 'Salvando…' : 'Salvar metas'}
        </Button>
      </div>
    </form>
  )
}
