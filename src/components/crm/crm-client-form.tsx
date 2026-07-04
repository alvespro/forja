import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CrmClientInput } from '@/hooks/use-crm-clients'
import { FASES_FUNIL } from '@/lib/crm'
import type { CrmClient } from '@/types/database'

type CrmClientFormProps = {
  client?: CrmClient
  onSubmit: (values: CrmClientInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function CrmClientForm({ client, onSubmit, onCancel, isSubmitting }: CrmClientFormProps) {
  const [nome, setNome] = useState(client?.nome ?? '')
  const [fase, setFase] = useState(client?.fase ?? '')
  const [valorEstimado, setValorEstimado] = useState(client?.valor_estimado?.toString() ?? '')
  const [proximaAcao, setProximaAcao] = useState(client?.proxima_acao ?? '')
  const [dataProximaAcao, setDataProximaAcao] = useState(client?.data_proxima_acao ?? '')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!nome.trim()) return
    onSubmit({
      nome: nome.trim(),
      fase: fase.trim() || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      proxima_acao: proximaAcao.trim() || null,
      data_proxima_acao: dataProximaAcao || null,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-nome">Nome</Label>
          <Input id="crm-nome" value={nome} onChange={(event) => setNome(event.target.value)} autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-fase">Fase</Label>
          <select
            id="crm-fase"
            value={fase}
            onChange={(event) => setFase(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm capitalize outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Selecionar fase</option>
            {FASES_FUNIL.map((f) => (
              <option key={f} value={f} className="capitalize">
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-valor">Valor estimado (R$)</Label>
          <Input
            id="crm-valor"
            type="number"
            step="0.01"
            value={valorEstimado}
            onChange={(event) => setValorEstimado(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-proxima">Próxima ação</Label>
          <Input
            id="crm-proxima"
            value={proximaAcao}
            onChange={(event) => setProximaAcao(event.target.value)}
            placeholder="ex: ligar amanhã"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-data-proxima">Data da próxima ação</Label>
          <Input
            id="crm-data-proxima"
            type="date"
            value={dataProximaAcao}
            onChange={(event) => setDataProximaAcao(event.target.value)}
          />
        </div>
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
