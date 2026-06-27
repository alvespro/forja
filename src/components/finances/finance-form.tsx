import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { FinanceInput } from '@/hooks/use-finances'
import { todayInSaoPaulo } from '@/lib/date'
import type { FinanceTipo } from '@/types/database'

type FinanceFormProps = {
  onSubmit: (values: FinanceInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function FinanceForm({ onSubmit, onCancel, isSubmitting }: FinanceFormProps) {
  const [tipo, setTipo] = useState<FinanceTipo>('gasto')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(todayInSaoPaulo())

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const valorNum = Number(valor)
    if (!Number.isFinite(valorNum) || valorNum <= 0) return
    onSubmit({
      tipo,
      categoria: categoria.trim() || null,
      valor: valorNum,
      descricao: descricao.trim() || null,
      data,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fin-tipo">Tipo</Label>
          <Select id="fin-tipo" value={tipo} onChange={(event) => setTipo(event.target.value as FinanceTipo)}>
            <option value="receita">Receita</option>
            <option value="gasto">Gasto</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fin-valor">Valor (R$)</Label>
          <Input
            id="fin-valor"
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fin-categoria">Categoria</Label>
          <Input
            id="fin-categoria"
            placeholder="ex: moradia"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fin-data">Data</Label>
          <Input id="fin-data" type="date" value={data} onChange={(event) => setData(event.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fin-descricao">Descrição</Label>
        <Input
          id="fin-descricao"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          placeholder="ex: aluguel de junho"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Registrar'}
        </Button>
      </div>
    </form>
  )
}
