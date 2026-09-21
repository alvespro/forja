import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addMonths, format, startOfMonth, startOfWeek, endOfWeek, endOfMonth, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/error-state'
import { EventModal } from '@/components/calendar/event-modal'
import { useCalendarEvents, useCalendarSync } from '@/hooks/use-calendar'
import { CATEGORIES, calendar_time, day_shift, events_on_day, timestamp } from '@/lib/calendar'
import type { CalendarEvent } from '@/lib/calendar'
import { todayInSaoPaulo } from '@/lib/date'
type View = 'Dia' | 'Semana' | 'Mês'
export function AgendaPage() {
  const events = useCalendarEvents(), sync = useCalendarSync()
  const [view, setView] = useState<View>('Mês')
  const [day, setDay] = useState(todayInSaoPaulo())
  const [selected, setSelected] = useState<CalendarEvent | 'new' | null>(null)
  const date = new Date(day + 'T12:00:00')
  const today = todayInSaoPaulo()
  const eventosDoDiaEmFoco = events_on_day(events.data ?? [], day)
  const next = events_on_day(events.data ?? [], day).find(e => !e.dia_inteiro && Date.parse(e.fim) > Date.now())
  const days = view === 'Dia' ? [date] : eachDayOfInterval({ start: startOfWeek(view === 'Mês' ? startOfMonth(date) : date), end: endOfWeek(view === 'Mês' ? endOfMonth(date) : date) })
  const pill = (e: CalendarEvent) => <button key={e.id} onClick={() => setSelected(e)} className="block w-full truncate rounded-md border-l-4 px-2 py-1 text-left text-xs text-white" style={{ borderColor: CATEGORIES[e.categoria]?.color, background: (CATEGORIES[e.categoria]?.color ?? '#646464') + '40' }}>{!e.dia_inteiro && calendar_time(e.inicio) + ' '}{e.titulo}</button>
  function move(n: number) { setDay(view === 'Mês' ? format(addMonths(date, n), 'yyyy-MM-dd') : day_shift(day, view === 'Semana' ? n * 7 : n)) }
  return <div className="flex flex-col gap-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Agenda</h1><p className="text-sm text-aco-texto">Seu tempo, em um só lugar.</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/agenda/assistente">✨ Agendar com IA</Link></Button><Button onClick={() => setSelected('new')}>Novo evento</Button></div></header>
    <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl bg-[#1D1D1D] p-1" role="group" aria-label="Visualização da agenda">{(['Dia', 'Semana', 'Mês'] as View[]).map(v => <Button key={v} variant={view === v ? 'default' : 'ghost'} aria-pressed={view === v} onClick={() => setView(v)}>{v}</Button>)}</div><Button className="ml-auto min-h-11" variant="outline" disabled={sync.isPending} onClick={() => sync.mutate()}>{sync.isPending ? 'Sincronizando…' : 'Sync Google'}</Button></div>
    <div className="flex items-center justify-between gap-2"><Button variant="ghost" aria-label="Período anterior" onClick={() => move(-1)}>‹</Button><h2 className="text-lg capitalize">{format(date, view === 'Dia' ? "d 'de' MMMM yyyy" : 'MMMM yyyy', { locale: ptBR })}</h2><div className="flex"><Button variant="ghost" onClick={() => setDay(today)}>Hoje</Button><Button variant="ghost" aria-label="Próximo período" onClick={() => move(1)}>›</Button></div></div>
    {events.isLoading && <p role="status">Carregando agenda…</p>}
    {events.isError && <ErrorState message="Não foi possível carregar a agenda." onRetry={() => events.refetch()} />}
    {view === 'Dia' && next && <button onClick={() => setSelected(next)} className="rounded-xl border border-brasa bg-brasa/10 p-4 text-left"><span className="text-xs text-aco-texto">Próximo evento</span><p className="font-semibold">{calendar_time(next.inicio)} · {next.titulo}</p>{next.local && <p className="text-sm text-aco-texto">{next.local}</p>}</button>}
    {!events.isLoading && !events.isError && (view === 'Mês' ? <><button type="button" onClick={() => setView('Dia')} className="flex min-h-11 w-full items-center justify-between rounded-[var(--r-md)] border border-border bg-aco px-3 text-left outline-none hover:border-cinza focus-visible:ring-2 focus-visible:ring-ring"><span className="text-sm text-foreground">Em foco: <strong className="capitalize">{format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</strong></span><span className="text-xs text-aco-texto">{eventosDoDiaEmFoco.length === 1 ? '1 evento' : `${eventosDoDiaEmFoco.length} eventos`}</span></button><div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl bg-border">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="bg-black px-1 py-2 text-center text-[11px] text-aco-texto sm:p-3 sm:text-xs">{d}</div>)}
      {days.map(d => { const key = format(d, 'yyyy-MM-dd'); const items = events_on_day(events.data ?? [], key); const emFoco = key === day; return <div key={key} className={`min-h-28 space-y-1 bg-[#1D1D1D] p-1 sm:p-2 ${emFoco ? 'ring-2 ring-inset ring-brasa' : key === today ? 'ring-1 ring-inset ring-brasa/60' : ''}`}><button aria-label={`Abrir ${format(d, 'dd/MM/yyyy')}`} onClick={() => { setDay(key); setView('Dia') }} className={`flex size-11 items-center justify-center rounded-full text-sm ${emFoco ? 'bg-brasa font-bold text-black' : d.getMonth() !== date.getMonth() ? 'text-aco-texto' : 'text-foreground'}`}>{d.getDate()}{items.length > 0 && <span className="ml-1 size-1 rounded-full bg-black" />}</button>{items.slice(0, 3).map(pill)}{items.length > 3 && <button className="min-h-8 text-xs text-aco-texto" onClick={() => { setDay(key); setView('Dia') }}>+{items.length - 3} eventos</button>}</div> })}
    </div></> : <div className="overflow-x-auto rounded-2xl border border-border"><div style={{ minWidth: view === 'Semana' ? 840 : undefined }}>
      <div className="grid pl-12" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>{days.map(d => { const key = format(d, 'yyyy-MM-dd'); return <div key={key} className="border-l border-border bg-[#1D1D1D] p-2"><button className="min-h-11 text-sm" onClick={() => { setDay(key); setView('Dia') }}>{format(d, 'EEE dd', { locale: ptBR })}</button><p className="mb-1 text-xs text-aco-texto">Dia inteiro</p>{events_on_day(events.data ?? [], key).filter(e => e.dia_inteiro).map(pill)}</div> })}</div>
      <div className="relative flex"><div className="w-12 shrink-0">{Array.from({ length: 24 }, (_, h) => <div key={h} className="h-14 pr-2 text-right text-xs text-aco-texto">{String(h).padStart(2, '0')}:00</div>)}</div><div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>{days.map(d => { const key = format(d, 'yyyy-MM-dd'); const timed = events_on_day(events.data ?? [], key).filter(e => !e.dia_inteiro); return <div key={key} className="relative border-l border-border" style={{ height: 24 * 56 }}>{Array.from({ length: 24 }, (_, h) => <div key={h} className="h-14 border-t border-border/50" />)}{timed.map((e, i) => {
        const start = Math.max(0, (Date.parse(e.inicio) - Date.parse(timestamp(key))) / 60000)
        const end = Math.min(1440, (Date.parse(e.fim) - Date.parse(timestamp(key))) / 60000)
        const overlaps = timed.filter(o => o.inicio < e.fim && o.fim > e.inicio)
        const lane = overlaps.findIndex(o => o.id === e.id)
        return <button key={e.id} onClick={() => setSelected(e)} className="absolute overflow-hidden rounded-md border-l-4 p-1 text-left text-xs text-white shadow-md" style={{ top: start / 60 * 56, height: Math.max(24, (end - start) / 60 * 56), width: `${100 / overlaps.length}%`, left: `${lane * 100 / overlaps.length}%`, zIndex: i + 1, borderColor: CATEGORIES[e.categoria].color, background: CATEGORIES[e.categoria].color + 'BB' }}><strong>{e.titulo}</strong><div>{calendar_time(e.inicio)} – {calendar_time(e.fim)}</div>{e.local}</button>
      })}</div> })}</div></div>
    </div></div>)}
    {view === 'Dia' && !events.isLoading && events_on_day(events.data ?? [], day).length === 0 && <p className="text-sm text-aco-texto">Nenhum evento neste dia. Crie seu primeiro compromisso.</p>}
    {selected && <EventModal event={selected === 'new' ? undefined : selected} draft={{ date: day }} onClose={() => setSelected(null)} />}
  </div>
}
