import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ErrorState } from '@/components/feedback/error-state'
import { CrmClientForm } from '@/components/crm/crm-client-form'
import { EventModal } from '@/components/calendar/event-modal'
import { useCreateCrmClient, useCrmClients, useUpdateCrmClient, useDeleteCrmClient } from '@/hooks/use-crm-clients'
import { useConfirm } from '@/hooks/use-confirm'
import { LEGACY_PHASE, PRIME_STAGES, PRODUCTS, prime_stage, type PrimeStage } from '@/lib/crm-prime'
import type { CrmClient } from '@/types/database'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export function CrmPage() {
  const clients = useCrmClients(), create = useCreateCrmClient(), update = useUpdateCrmClient(), remove = useDeleteCrmClient()
  const { confirm, dialog } = useConfirm()
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CrmClient | 'new' | null>(null)
  const [meeting, setMeeting] = useState<CrmClient | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const date = (c: CrmClient) => c.proximo_contato ?? c.data_proxima_acao ?? ''
  const all = (clients.data ?? []).filter(c => {
    const stage = prime_stage(c)
    const match = filter === 'todos' || (filter === 'andamento' ? stage === 'proposta' : stage === filter)
    const term = search.toLocaleLowerCase().trim()
    const digits = term.replace(/\D/g, '')
    return match && (!term || c.nome.toLocaleLowerCase().includes(term) || (!!digits && (c.cpf ?? '').replace(/\D/g, '').includes(digits)))
  }).sort((a,b) => (date(a) || '9999').localeCompare(date(b) || '9999'))
  function move(id: string, status: PrimeStage) { update.mutate({ id, values: { status, fase: LEGACY_PHASE[status] } }); setDragging(null) }
  async function delete_client(c: CrmClient) {
    if (await confirm({ title: `Excluir ${c.nome}?`, description: 'O evento da agenda será mantido. Esta exclusão não pode ser desfeita.' })) remove.mutate(c.id, { onSuccess: () => setSelected(null) })
  }
  function card(c: CrmClient) {
    return <article key={c.id} draggable={!update.isPending} onDragStart={e => { e.dataTransfer.setData('text/plain', c.id); setDragging(c.id) }} onDragEnd={() => setDragging(null)} className={`rounded-xl border border-white/10 border-l-4 bg-white/5 p-3 shadow-md transition-shadow ${dragging === c.id ? 'opacity-60 shadow-xl' : ''}`} style={{ borderLeftColor: PRODUCTS[c.produto as keyof typeof PRODUCTS] ?? '#646464' }}>
      <button className="min-h-11 w-full text-left font-semibold" onClick={() => setSelected(c)}>{c.nome}</button>
      <p className="text-xs text-aco-texto">{c.produto || 'Produto não informado'}{c.fase === 'perdido' ? ' · Legado: perdido' : ''}</p>
      <p className="my-2 font-mono text-sm">{money.format(c.valor_financiamento ?? c.valor_estimado ?? 0)}</p>
      <p className="text-xs text-aco-texto">Próximo contato: {date(c) ? date(c).split('-').reverse().join('/') : 'A definir'}</p>
      <label className="mt-3 block text-xs text-aco-texto">Mover para<select aria-label={`Status de ${c.nome}`} disabled={update.isPending} className="mt-1 min-h-11 w-full rounded-md bg-[#1D1D1D] px-2 text-foreground" value={prime_stage(c)} onChange={e => move(c.id, e.target.value as PrimeStage)}>{Object.entries(PRIME_STAGES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
    </article>
  }
  return <div className="flex flex-col gap-5">
    {dialog}
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">CRM Prime</h1><p className="text-sm text-aco-texto">Relacionamentos que avançam.</p></div><Button onClick={() => setSelected('new')}>Novo cliente</Button></header>
    <div className="flex flex-wrap gap-2">{Object.entries({ todos: 'Todos', lead: 'Leads', andamento: 'Em andamento', aprovado: 'Aprovados', concluido: 'Concluídos' }).map(([k,v]) => <Button key={k} variant={filter === k ? 'default' : 'outline'} aria-pressed={filter === k} onClick={() => setFilter(k)}>{v}</Button>)}</div>
    <div className="flex flex-wrap gap-2"><Input aria-label="Buscar nome ou CPF" placeholder="Buscar por nome ou CPF" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" /><Button variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')}>Kanban</Button><Button variant={view === 'lista' ? 'default' : 'outline'} onClick={() => setView('lista')}>Lista</Button></div>
    {clients.isLoading ? <p role="status">Carregando clientes…</p> : clients.isError ? <ErrorState message="Não foi possível carregar os clientes." onRetry={() => clients.refetch()} /> : <>
      {!all.length && <p className="text-sm text-aco-texto">Nenhum cliente encontrado.</p>}
      {view === 'kanban' ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(PRIME_STAGES).map(([stage,label]) => <section key={stage} aria-label={label} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (clients.data?.some(c => c.id === id) && !update.isPending) move(id, stage as PrimeStage) }} className="min-h-48 space-y-3 rounded-2xl bg-[#1D1D1D] p-3"><h2 className="flex justify-between text-sm font-semibold">{label}<span className="text-aco-texto">{all.filter(c => prime_stage(c) === stage).length}</span></h2>{all.filter(c => prime_stage(c) === stage).map(card)}</section>)}</div> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#1D1D1D]"><tr>{['Nome','Produto','Status','Valor','Próximo contato'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{all.map(c => <tr key={c.id} className="border-t border-border"><td className="p-3"><button className="min-h-11 underline" onClick={() => setSelected(c)}>{c.nome}</button></td><td className="p-3">{c.produto || '—'}</td><td className="p-3">{PRIME_STAGES[prime_stage(c)]}</td><td className="p-3">{money.format(c.valor_financiamento ?? c.valor_estimado ?? 0)}</td><td className="p-3">{date(c) ? date(c).split('-').reverse().join('/') : '—'}</td></tr>)}</tbody></table></div>}
    </>}
    {selected && <Modal open title={selected === 'new' ? 'Novo cliente' : selected.nome} onClose={() => setSelected(null)}>
      <CrmClientForm client={selected === 'new' ? undefined : selected} isSubmitting={create.isPending || update.isPending} onCancel={() => setSelected(null)} onSubmit={values => selected === 'new' ? create.mutate(values, { onSuccess: () => setSelected(null) }) : update.mutate({ id: selected.id, values }, { onSuccess: () => setSelected(null) })} />
      {selected !== 'new' && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setMeeting(selected); setSelected(null) }}>Agendar reunião</Button><Button variant="outline" disabled={remove.isPending} onClick={() => delete_client(selected)}>Excluir cliente</Button></div>}
      {selected === 'new' && <p className="text-xs text-aco-texto">Salve o cliente para agendar uma reunião vinculada.</p>}
    </Modal>}
    {meeting && <EventModal draft={{ titulo: `Reunião Prime — ${meeting.nome}`, categoria: 'reuniao', date: date(meeting) || undefined, crm_client_id: meeting.id }} onClose={() => setMeeting(null)} />}
  </div>
}
