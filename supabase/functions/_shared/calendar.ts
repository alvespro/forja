export const CATEGORIES = ['saude', 'protocolo', 'prime', 'treino', 'pessoal', 'exame', 'reuniao'] as const
export type Category = typeof CATEGORIES[number]
export function categorize(title: string): Category {
  const t = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/exame/.test(t)) return 'exame'
  if (/protocolo|aplicacao/.test(t)) return 'protocolo'
  if (/medico|consulta/.test(t)) return 'saude'
  if (/reuniao/.test(t)) return 'reuniao'
  if (/prime|cliente|visita/.test(t)) return 'prime'
  if (/treino|academia|corrida/.test(t)) return 'treino'
  return 'pessoal'
}
export function validate_event(body: Record<string, unknown>) {
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : ''
  const inicio = String(body.inicio ?? '')
  const fim = String(body.fim ?? '')
  if (!titulo || titulo.length > 300 || !Number.isFinite(Date.parse(inicio)) || !Number.isFinite(Date.parse(fim)) || Date.parse(fim) <= Date.parse(inicio)) {
    throw new Error('Informe título e um horário final posterior ao início.')
  }
  if (!CATEGORIES.includes(body.categoria as Category)) throw new Error('Categoria inválida.')
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
  if (body.dia_inteiro === true && [inicio, fim].some(v => clock.format(new Date(v)) !== '00:00:00')) throw new Error('Eventos de dia inteiro devem começar e terminar à meia-noite de São Paulo.')
  return { titulo, inicio: new Date(inicio).toISOString(), fim: new Date(fim).toISOString(), categoria: body.categoria as Category, dia_inteiro: body.dia_inteiro === true,
    descricao: String(body.descricao ?? '').slice(0, 8000), local: String(body.local ?? '').slice(0, 500) }
}
export function google_body(e: ReturnType<typeof validate_event>) {
  const date = (value: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(value))
  return { summary: e.titulo, description: e.descricao, location: e.local,
    start: e.dia_inteiro ? { date: date(e.inicio) } : { dateTime: e.inicio, timeZone: 'America/Sao_Paulo' },
    end: e.dia_inteiro ? { date: date(e.fim) } : { dateTime: e.fim, timeZone: 'America/Sao_Paulo' },
    extendedProperties: { private: { forja_category: e.categoria } } }
}
