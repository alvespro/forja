import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { KeyResult } from '@/types/database'

type KeyResultRowProps = {
  keyResult: KeyResult
  onUpdate: (valorAtual: number) => void
  onDelete: () => void
}

export function KeyResultRow({ keyResult, onUpdate, onDelete }: KeyResultRowProps) {
  const [valor, setValor] = useState(String(keyResult.valor_atual))

  function handleBlur() {
    const parsed = Number(valor)
    if (Number.isFinite(parsed) && parsed !== keyResult.valor_atual) {
      onUpdate(parsed)
    } else {
      setValor(String(keyResult.valor_atual))
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-1 text-foreground">{keyResult.descricao}</span>
      <Input
        type="number"
        value={valor}
        onChange={(event) => setValor(event.target.value)}
        onBlur={handleBlur}
        className="w-20"
        aria-label={`Valor atual de ${keyResult.descricao}`}
      />
      <span className="w-24 shrink-0 font-mono text-xs text-aco-texto">
        / {keyResult.valor_meta} {keyResult.unidade ?? ''}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Excluir resultado-chave ${keyResult.descricao}`}
        onClick={onDelete}
      >
        <Icon name="delete" size={14} />
      </Button>
    </div>
  )
}
