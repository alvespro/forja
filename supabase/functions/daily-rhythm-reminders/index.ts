import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TZ = 'America/Sao_Paulo'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function parts(now = new Date()) {
  const items = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) => items.find((item) => item.type === type)?.value ?? ''
  const weekday: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    clock: `${get('hour')}:${get('minute')}`,
    weekday: weekday[get('weekday')] ?? 0,
  }
}

const mins = (time: string) => {
  const [hour, minute] = time.slice(0, 5).split(':').map(Number)
  return hour * 60 + minute
}
const weekdayName = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  const secret = Deno.env.get('CRON_SECRET')
  if (!secret || req.headers.get('x-cron-secret') !== secret) return response({ ok: false, error: 'unauthorized' }, 401)

  const now = new Date()
  const current = parts(now)
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { data: preferences, error } = await sb.from('daily_rhythm_preferences').select('*').eq('enabled', true)
    if (error) throw error
    let generated = 0

    for (const pref of preferences ?? []) {
      const start = mins(pref.start_time)
      const end = mins(pref.end_time)
      if (!pref.active_days.includes(current.weekday) || current.minutes < start || current.minutes > end || (current.minutes - start) % pref.interval_minutes !== 0) continue

      const signals: string[] = []
      if (pref.notify_priority) {
        const { data: frog } = await sb.from('tasks').select('titulo').eq('user_id', pref.user_id).eq('data', current.date).eq('e_frog', true).eq('status', 'aberto').limit(1).maybeSingle()
        if (frog?.titulo) signals.push(`Prioridade: ${frog.titulo}`)
      }
      if (pref.notify_calendar) {
        const { data: events } = await sb.from('calendar_events').select('titulo, inicio').eq('user_id', pref.user_id).is('deleted_at', null).gte('inicio', now.toISOString()).lt('inicio', new Date(now.getTime() + 90 * 60_000).toISOString()).order('inicio').limit(1)
        const event = events?.[0]
        if (event) signals.push(`Próximo compromisso: ${event.titulo} às ${parts(new Date(event.inicio)).clock}`)
      }
      if (pref.notify_meals) {
        const { data: plans } = await sb.from('diet_plans').select('id').eq('user_id', pref.user_id).eq('ativo', true).limit(1)
        const plan = plans?.[0]
        if (plan) {
          const { data: slots } = await sb.from('meal_slots').select('nome, horario_alvo').eq('diet_plan_id', plan.id).not('horario_alvo', 'is', null)
          const next = (slots ?? [])
            .filter((slot) => mins(slot.horario_alvo) >= current.minutes && mins(slot.horario_alvo) <= current.minutes + pref.interval_minutes)
            .sort((a, b) => mins(a.horario_alvo) - mins(b.horario_alvo))[0]
          if (next) signals.push(`Próxima refeição: ${next.nome} às ${next.horario_alvo.slice(0, 5)}`)
        }
      }
      if (pref.notify_workout) {
        const { data: workout } = await sb.from('workouts').select('nome').eq('user_id', pref.user_id).eq('ativo', true).eq('arquivado', false).eq('dia_semana', weekdayName[current.weekday]).order('ordem').limit(1).maybeSingle()
        if (workout?.nome) signals.push(`Treino de hoje: ${workout.nome}`)
      }
      if (signals.length === 0) continue

      const { error: notificationError } = await sb.from('notifications').upsert({
        user_id: pref.user_id,
        tipo: 'ritmo_do_dia',
        titulo: `${current.clock} · Check-in FORJA`,
        corpo: signals.join(' · '),
        link: '/',
        dedupe_key: `ritmo_${pref.user_id}_${current.date}_${current.clock.replace(':', '')}`,
      }, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
      if (!notificationError) generated++
    }
    return response({ ok: true, notifications_generated: generated })
  } catch (error) {
    console.error('daily-rhythm-reminders', error)
    return response({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
