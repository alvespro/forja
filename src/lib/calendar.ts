import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { addDays, format } from 'date-fns'
export const CALENDAR_TZ = 'America/Sao_Paulo'
export const CATEGORIES = {
  saude: { label: 'Saúde', color: '#4CAF7D' }, protocolo: { label: 'Protocolo', color: '#C10801' },
  prime: { label: 'Prime', color: '#FC4C13' }, treino: { label: 'Treino', color: '#E8A23D' },
  pessoal: { label: 'Pessoal', color: '#646464' }, exame: { label: 'Exame', color: '#8B5CF6' }, reuniao: { label: 'Reunião', color: '#3B82F6' },
} as const
export type Category = keyof typeof CATEGORIES
export type CalendarEvent = {
  id: string; user_id: string; titulo: string; descricao: string; inicio: string; fim: string;
  dia_inteiro: boolean; local: string; categoria: Category; google_event_id: string | null;
  google_html_link: string | null; sincronizado: boolean; criado_no_forja: boolean; updated_at: string;
  protocol_exam_id?: string | null;
}
export type EventInput = Pick<CalendarEvent, 'titulo' | 'descricao' | 'inicio' | 'fim' | 'dia_inteiro' | 'local' | 'categoria'> & { id?: string; crm_client_id?: string; protocol_exam_id?: string | null }
export const calendar_date = (value: string) => formatInTimeZone(value, CALENDAR_TZ, 'yyyy-MM-dd')
export const calendar_time = (value: string) => formatInTimeZone(value, CALENDAR_TZ, 'HH:mm')
export const day_shift = (day: string, n: number) => format(addDays(new Date(day + 'T12:00:00'), n), 'yyyy-MM-dd')
export const timestamp = (day: string, time = '00:00') => fromZonedTime(day + 'T' + time + ':00', CALENDAR_TZ).toISOString()
export function events_on_day(events: CalendarEvent[], day: string) {
  const start = Date.parse(timestamp(day)), end = Date.parse(timestamp(day_shift(day, 1)))
  return events.filter(e => Date.parse(e.inicio) < end && Date.parse(e.fim || e.inicio) > start).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
}
export function safe_google_link(link: string | null) {
  if (!link) return null
  try { const u = new URL(link); return u.protocol === 'https:' && ['www.google.com', 'calendar.google.com'].includes(u.hostname) ? u.href : null } catch { return null }
}
