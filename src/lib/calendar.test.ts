import { describe, expect, it } from 'vitest'
import { categorize, google_body, validate_event } from '../../supabase/functions/_shared/calendar'
import { events_on_day, timestamp, safe_google_link, type CalendarEvent } from './calendar'
import { prime_stage } from './crm-prime'
const input = { titulo: 'Consulta', inicio: '2026-09-18T09:00:00-03:00', fim: '2026-09-18T10:00:00-03:00', categoria: 'saude', dia_inteiro: false }
describe('Agenda e sincronização Google', () => {
  it('normaliza offsets antes de ordenar e comparar eventos', () => {
    expect(validate_event(input).inicio).toBe('2026-09-18T12:00:00.000Z')
    expect(timestamp('2026-09-18', '09:00')).toBe('2026-09-18T12:00:00.000Z')
  })
  it('rejeita intervalos inválidos e categorias não permitidas', () => {
    expect(() => validate_event({ ...input, fim: input.inicio })).toThrow()
    expect(() => validate_event({ ...input, inicio: 'inválido' })).toThrow()
    expect(() => validate_event({ ...input, categoria: 'inexistente' })).toThrow()
  })
  it('envia dias inteiros com data final exclusiva', () => {
    const e = validate_event({ ...input, inicio: timestamp('2026-09-18'), fim: timestamp('2026-09-19'), dia_inteiro: true })
    expect(google_body(e).start).toEqual({ date: '2026-09-18' })
    expect(google_body(e).end).toEqual({ date: '2026-09-19' })
    expect(() => validate_event({ ...input, dia_inteiro: true })).toThrow()
  })
  it('mostra eventos que atravessam meia-noite e exclui a borda final', () => {
    const e = { ...input, inicio: '2026-09-18T23:00:00-03:00', fim: '2026-09-19T01:00:00-03:00' } as CalendarEvent
    expect(events_on_day([e], '2026-09-18')).toHaveLength(1)
    expect(events_on_day([e], '2026-09-19')).toHaveLength(1)
    const allDay = { ...e, inicio: timestamp('2026-09-18'), fim: timestamp('2026-09-19'), dia_inteiro: true }
    expect(events_on_day([allDay], '2026-09-19')).toHaveLength(0)
  })
  it.each([['Exame de rotina', 'exame'], ['Médico', 'saude'], ['Aplicação protocolo', 'protocolo'], ['Reunião Prime', 'reuniao'], ['Visita cliente', 'prime'], ['Academia', 'treino'], ['Aniversário', 'pessoal']])('categoriza %s', (title, category) => expect(categorize(title)).toBe(category))
  it('não abre links arbitrários recebidos do backend', () => {
    expect(safe_google_link('javascript:alert(1)')).toBeNull()
    expect(safe_google_link('https://google.com.evil.test/event')).toBeNull()
    expect(safe_google_link('https://calendar.google.com/calendar/event?id=1')).toContain('calendar.google.com')
  })
  it('preserva clientes antigos já fechados no novo funil', () => {
    expect(prime_stage({ status: 'lead', fase: 'fechado' })).toBe('concluido')
    expect(prime_stage({ status: 'aprovado', fase: null })).toBe('aprovado')
  })
})
