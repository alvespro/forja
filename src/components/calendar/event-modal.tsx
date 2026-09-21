import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSaveCalendarEvent } from '@/hooks/use-calendar'
import { CATEGORIES, calendar_date, calendar_time, timestamp, day_shift, safe_google_link } from '@/lib/calendar'
import type { CalendarEvent, Category } from '@/lib/calendar'
import { todayInSaoPaulo } from '@/lib/date'

export type EventDraft = { date?: string; titulo?: string; categoria?: Category; crm_client_id?: string; protocol_exam_id?: string }
export function EventModal({ event, draft, onClose }: { event?: CalendarEvent; draft?: EventDraft; onClose: () => void }) {
  const save = useSaveCalendarEvent()
  const [editing, setEditing] = useState(!event)
  const [deleting, setDeleting] = useState(false)
  const [id] = useState(event?.id ?? crypto.randomUUID())
  const [titulo, setTitulo] = useState(event?.titulo ?? draft?.titulo ?? '')
  const [date, setDate] = useState(event ? calendar_date(event.inicio) : draft?.date ?? todayInSaoPaulo())
  const [endDate, setEndDate] = useState(event ? (event.dia_inteiro ? day_shift(calendar_date(event.fim), -1) : calendar_date(event.fim)) : draft?.date ?? todayInSaoPaulo())
  const [start, setStart] = useState(event ? calendar_time(event.inicio) : '09:00')
  const [end, setEnd] = useState(event ? calendar_time(event.fim) : '10:00')
  const [allDay, setAllDay] = useState(event?.dia_inteiro ?? false)
  const [categoria, setCategoria] = useState<Category>(event?.categoria ?? draft?.categoria ?? 'pessoal')
  const [local, setLocal] = useState(event?.local ?? '')
  const [descricao, setDescricao] = useState(event?.descricao ?? '')
  const [error, setError] = useState('')
  const field = 'flex flex-col gap-1 text-sm text-aco-texto'
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const inicio = timestamp(date, allDay ? '00:00' : start)
    const fim = timestamp(allDay ? day_shift(endDate, 1) : endDate, allDay ? '00:00' : end)
    if (fim <= inicio) { setError('O fim deve ser posterior ao início.'); return }
    save.mutate({ id, titulo, inicio, fim, dia_inteiro: allDay, categoria, local, descricao, crm_client_id: draft?.crm_client_id, protocol_exam_id: draft?.protocol_exam_id, acao: event ? 'atualizar_evento' : 'criar_evento' }, { onSuccess: onClose })
  }
  const link = safe_google_link(event?.google_html_link ?? null)
  return <Modal open onClose={onClose} title={editing ? (event ? 'Editar evento' : 'Novo evento') : event?.titulo} description="Horários de Brasília · São Paulo">
    {editing ? <form onSubmit={submit} className="flex flex-col gap-4">
      <label className={field}>Título<Input autoFocus required maxLength={300} className="text-lg" value={titulo} onChange={e => setTitulo(e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3"><label className={field}>Início<Input required type="date" value={date} onChange={e => { setDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value) }} /></label><label className={field}>Fim<Input required type="date" min={date} value={endDate} onChange={e => setEndDate(e.target.value)} /></label></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />Dia inteiro</label>
      {!allDay && <div className="grid grid-cols-2 gap-3"><label className={field}>Hora de início<Input required type="time" value={start} onChange={e => setStart(e.target.value)} /></label><label className={field}>Hora de fim<Input required type="time" value={end} onChange={e => setEnd(e.target.value)} /></label></div>}
      <fieldset><legend className="mb-2 text-sm text-aco-texto">Categoria</legend><div className="flex flex-wrap gap-2">{Object.entries(CATEGORIES).map(([key, cat]) => { const selecionada = categoria === key; return <button key={key} type="button" aria-pressed={selecionada} onClick={() => setCategoria(key as Category)} className="min-h-11 rounded-full border px-3 text-sm font-medium text-nevoa outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring" style={{ borderColor: cat.color, background: selecionada ? cat.color + '66' : 'transparent', boxShadow: selecionada ? `0 0 0 1px ${cat.color}` : undefined }}>{selecionada && <span aria-hidden="true" className="mr-1">✓</span>}{cat.label}</button> })}</div></fieldset>
      <label className={field}>Local (opcional)<Input value={local} onChange={e => setLocal(e.target.value)} maxLength={500} /></label>
      <details open={!!event?.descricao}><summary className="cursor-pointer text-sm">Descrição (opcional)</summary><textarea aria-label="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} maxLength={8000} className="mt-2 min-h-24 w-full rounded-lg border border-border bg-transparent p-3" /></details>
      {error && <p role="alert" className="text-alerta-texto">{error}</p>}
      <Button disabled={save.isPending} type="submit">{save.isPending ? 'Salvando…' : event ? 'Salvar alterações' : 'Criar evento'}</Button>
    </form> : event && <div className="flex flex-col gap-4">
      <span className="w-fit rounded-md border px-3 py-1" style={{ borderColor: CATEGORIES[categoria].color }}>{CATEGORIES[categoria].label}</span>
      <p>{calendar_date(event.inicio).split('-').reverse().join('/')} · {event.dia_inteiro ? 'Dia inteiro' : `${calendar_time(event.inicio)} – ${calendar_time(event.fim)}`}</p>
      {event.local && <p>{event.local}</p>}{event.descricao && <p className="whitespace-pre-wrap text-sm text-aco-texto">{event.descricao}</p>}
      {!event.sincronizado && <p className="text-sm text-atencao">Aguardando sincronização com Google.</p>}
      {categoria === 'exame' && <Link className="underline" to="/protocolo" state={{ tab: 'exames' }}>Registrar resultado</Link>}
      {categoria === 'protocolo' && <Link className="underline" to="/protocolo" state={{ tab: 'agenda' }}>Registrar aplicação</Link>}
      {link && <a href={link} target="_blank" rel="noopener noreferrer" className="underline">Ver no Google</a>}
      <div className="flex gap-2"><Button onClick={() => setEditing(true)}>Editar</Button><Button variant="outline" onClick={() => setDeleting(true)}>Excluir</Button></div>
      {deleting && <div role="alert" className="rounded-xl border border-alerta p-3"><p>Excluir este evento do FORJA e do Google?</p><div className="mt-2 flex gap-2"><Button variant="outline" onClick={() => setDeleting(false)}>Cancelar</Button><Button disabled={save.isPending} onClick={() => save.mutate({ ...event, acao: 'deletar_evento' }, { onSuccess: onClose })}>Confirmar exclusão</Button></div></div>}
    </div>}
  </Modal>
}
