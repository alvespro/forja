import { type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type KeyResultAddFormProps = {
  onAdd: (values: { descricao: string; valor_meta: number; unidade: string | null }) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function KeyResultAddForm({ onAdd, onCancel, isSubmitting }: KeyResultAddFormProps) {
  const [descricao, setDescricao] = useState('')
  const [valorMeta, setValorMeta] = useState('')
  const [unidade, setUnidade] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const meta = Number(valorMeta)
    if (!descricao.trim() || !Number.isFinite(meta)) return
    onAdd({ descricao: descricao.trim(), valor_meta: meta, unidade: unidade.trim() || null })
  }

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={handleSubmit}>
      <Input
        value={descricao}
        onChange={(event) => setDescricao(event.target.value)}
        placeholder="Descrição do resultado-chave"
        className="min-w-40 flex-1"
        aria-label="Descrição do resultado-chave"
      />
      <Input
        type="number"
        value={valorMeta}
        onChange={(event) => setValorMeta(event.target.value)}
        placeholder="Meta"
        className="w-20"
        aria-label="Valor meta"
      />
      <Input
        value={unidade}
        onChange={(event) => setUnidade(event.target.value)}
        placeholder="Unidade"
        className="w-24"
        aria-label="Unidade"
      />
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        Adicionar
      </Button>
    </form>
  )
}
