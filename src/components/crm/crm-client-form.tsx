import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CrmClientInput } from '@/hooks/use-crm-clients'
import { LEGACY_PHASE, PRIME_STAGES, PRODUCTS, prime_stage, type PrimeStage } from '@/lib/crm-prime'
import type { CrmClient } from '@/types/database'

type CrmClientFormProps = {
  client?: CrmClient
  onSubmit: (values: CrmClientInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function CrmClientForm({ client, onSubmit, onCancel, isSubmitting }: CrmClientFormProps) {
  const [nome, setNome] = useState(client?.nome ?? '')
  const [fase, setFase] = useState<PrimeStage>(client ? prime_stage(client) : 'lead')
  const [valorEstimado, setValorEstimado] = useState((client?.valor_financiamento ?? client?.valor_estimado)?.toString() ?? '')
  const [telefone, setTelefone] = useState(client?.telefone ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [cpf, setCpf] = useState(client?.cpf ?? '')
  const [produto, setProduto] = useState(client?.produto ?? '')
  const [notas, setNotas] = useState(client?.notas ?? '')
  const [proximaAcao, setProximaAcao] = useState(client?.proxima_acao ?? '')
  const [dataProximaAcao, setDataProximaAcao] = useState(client?.proximo_contato ?? client?.data_proxima_acao ?? '')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!nome.trim()) return
    onSubmit({
      nome: nome.trim(),
      fase: LEGACY_PHASE[fase], status: fase,
      telefone: telefone.trim() || null, email: email.trim() || null, cpf: cpf.replace(/\D/g, '') || null,
      produto: produto || null, notas: notas.trim() || null,
      valor_financiamento: valorEstimado ? Number(valorEstimado) : null,
      proximo_contato: dataProximaAcao || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      proxima_acao: proximaAcao.trim() || null,
      data_proxima_acao: dataProximaAcao || null,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-nome">Nome</Label>
          <Input id="crm-nome" required maxLength={200} value={nome} onChange={(event) => setNome(event.target.value)} autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-fase">Fase</Label>
          <select
            id="crm-fase"
            value={fase}
            onChange={(event) => setFase(event.target.value as PrimeStage)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm capitalize outline-none focus:ring-1 focus:ring-ring"
          >
            {Object.keys(PRIME_STAGES).map((f) => (
              <option key={f} value={f} className="capitalize">
                {PRIME_STAGES[f as PrimeStage]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="text-sm">Telefone<Input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} /></label>
        <label className="text-sm">E-mail<Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="text-sm">CPF<Input inputMode="numeric" maxLength={14} value={cpf} onChange={e => setCpf(e.target.value)} pattern="[0-9.\-]{11,14}" /></label>
        <label className="text-sm">Produto<select value={produto} onChange={e => setProduto(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-2"><option value="">Selecionar</option>{Object.keys(PRODUCTS).map(p => <option key={p}>{p}</option>)}</select></label>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crm-valor">Valor estimado (R$)</Label>
          <Input
            id="crm-valor"
            type="number"
            min={0}
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

      <label className="text-sm">Notas<textarea className="mt-1 min-h-24 w-full rounded-md border border-input bg-transparent p-2" value={notas} onChange={e => setNotas(e.target.value)} /></label>
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
