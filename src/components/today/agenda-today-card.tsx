import { Link } from 'react-router-dom'
import { useCalendarEvents } from '@/hooks/use-calendar'
import { CATEGORIES, calendar_time, events_on_day } from '@/lib/calendar'
import { todayInSaoPaulo } from '@/lib/date'
export function AgendaTodayCard() {
  const events = useCalendarEvents()
  const all = events_on_day(events.data ?? [], todayInSaoPaulo())
  const upcoming = all.filter(e => e.dia_inteiro || Date.parse(e.fim) > Date.now()).slice(0, 3)
  const workout = all.find(e => e.categoria === 'treino')
  return <section className="rounded-2xl border border-border bg-card/60 p-4"><div className="mb-3 flex justify-between"><h2 className="font-semibold">Hoje na agenda</h2><Link to="/agenda" className="text-sm text-brasa">Ver agenda</Link></div>
    {events.isLoading ? <p role="status">Carregando…</p> : events.isError ? <button onClick={() => events.refetch()}>Não foi possível carregar. Tentar novamente</button> : <>
      {workout && <Link to="/workout" className="mb-3 block text-sm text-atencao">Treino {workout.dia_inteiro ? 'hoje' : `às ${calendar_time(workout.inicio)}`} {workout.local && `— ${workout.local}`}</Link>}
      {!upcoming.length && <p className="text-sm text-aco-texto">{all.length ? 'Compromissos do dia concluídos.' : 'Nenhum evento hoje'}</p>}
      {upcoming.map((e, i) => <Link to="/agenda" key={e.id} className="mb-2 block rounded-lg border-l-4 p-3" style={{ borderColor: e.categoria === 'reuniao' ? '#FC4C13' : CATEGORIES[e.categoria].color, background: (e.categoria === 'reuniao' ? '#FC4C13' : CATEGORIES[e.categoria].color) + '20' }}><span className="text-xs text-aco-texto">{i === 0 && 'Próximo · '}{e.dia_inteiro ? 'Dia inteiro' : calendar_time(e.inicio)}</span><p className="text-sm font-medium">{e.titulo}</p>{e.local && <p className="text-xs text-aco-texto">{e.local}</p>}</Link>)}
    </>}
  </section>
}
