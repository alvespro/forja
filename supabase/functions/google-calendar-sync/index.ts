import { createClient } from 'jsr:@supabase/supabase-js@2'
import { CATEGORIES, categorize, google_body, validate_event } from '../_shared/calendar.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
const endpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
class HttpError extends Error { constructor(message: string, public status = 400) { super(message) } }
function checked<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new HttpError('Falha ao salvar ou consultar a agenda.', 500)
  return result.data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)
  try {
    const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: { user }, error } = await auth.auth.getUser()
    if (error || !user) return json({ error: 'Sessão inválida.' }, 401)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const b = await req.json()
    const uid = user.id
    const tokens = () => db.from('google_oauth_tokens').select('*').eq('user_id', uid).maybeSingle()
    const now = () => new Date().toISOString()
    async function exchange(params: Record<string, string>) {
      const client_id = Deno.env.get('GOOGLE_CLIENT_ID')
      const client_secret = Deno.env.get('GOOGLE_CLIENT_SECRET')
      if (!client_id || !client_secret) throw new HttpError('Integração Google não configurada.', 503)
      const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ ...params, client_id, client_secret }), signal: AbortSignal.timeout(15000) })
      if (!r.ok) throw new HttpError('Autorização Google expirada ou inválida. Conecte novamente.', 409)
      return await r.json()
    }
    async function access(force = false) {
      const row = checked(await tokens())
      if (!row) throw new HttpError('Conecte o Google Calendar em Configurações.', 409)
      if (!force && row.expires_at && Date.parse(row.expires_at) > Date.now() + 60000) return row.access_token as string
      if (!row.refresh_token) throw new HttpError('Conecte novamente para permitir sincronização.', 409)
      const t = await exchange({ grant_type: 'refresh_token', refresh_token: row.refresh_token })
      checked(await db.from('google_oauth_tokens').update({ access_token: t.access_token, expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(), updated_at: now() }).eq('user_id', uid))
      return t.access_token as string
    }
    async function google(path: string, method = 'GET', data?: unknown) {
      let token = await access()
      const call = () => fetch(endpoint + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(15000) })
      let r = await call()
      if (r.status === 401) { token = await access(true); r = await call() }
      return r
    }
    async function sync() {
      if (!checked(await tokens())) return { sincronizados: 0, criados_google: 0, pendente: true }
      if (!checked(await db.rpc('claim_calendar_sync', { p_user_id: uid }))) return { sincronizados: 0, criados_google: 0, pendente: true }
      let sincronizados = 0, criados_google = 0
      const started = Date.now()
      const deadline = () => { if (Date.now() - started > 65000) throw new HttpError('Sincronização parcial. Toque em sincronizar novamente.', 503) }
      try {
        // Envia a fila antes de importar: alterações locais pendentes têm prioridade.
        const pending = checked(await db.from('calendar_events').select('*').eq('user_id', uid).eq('sincronizado', false).order('updated_at').limit(100)) ?? []
        for (const e of pending) {
          deadline()
          // ID determinístico permite repetir um POST após falha de rede sem duplicar.
          const id = e.google_event_id || e.id.replaceAll('-', '')
          let link = e.google_html_link
          if (e.deleted_at) {
            const r = await google('/' + encodeURIComponent(id), 'DELETE')
            if (!r.ok && ![404, 410].includes(r.status)) throw new HttpError('Google não permitiu excluir o evento.', 502)
          } else {
            const payload = google_body(e)
            let r = await google(e.google_event_id ? '/' + encodeURIComponent(id) : '', e.google_event_id ? 'PATCH' : 'POST', e.google_event_id ? payload : { id, ...payload })
            if (r.status === 409 && !e.google_event_id) r = await google('/' + encodeURIComponent(id), 'PATCH', payload)
            if (!r.ok) throw new HttpError('Google não permitiu salvar o evento. A alteração está pendente.', 502)
            link = (await r.json()).htmlLink
            if (!e.google_event_id) criados_google++
          }
          // Não confirma uma versão que tenha sido editada durante a chamada externa.
          checked(await db.from('calendar_events').update({ google_event_id: id, google_html_link: link }).eq('user_id', uid).eq('id', e.id))
          checked(await db.from('calendar_events').update({ sincronizado: true }).eq('user_id', uid).eq('id', e.id).eq('updated_at', e.updated_at))
        }
        const timeMin = new Date(Date.now() - 7 * 86400000).toISOString()
        const timeMax = new Date(Date.now() + 60 * 86400000).toISOString()
        let page = ''
        const seen = new Set<string>()
        do {
          deadline()
          const params = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '250', showDeleted: 'true', ...(page ? { pageToken: page } : {}) })
          const r = await google('?' + params)
          if (!r.ok) throw new HttpError('Não foi possível consultar o Google Calendar.', 502)
          const data = await r.json()
          for (const e of data.items ?? []) {
            seen.add(e.id)
            const existing = checked(await db.from('calendar_events').select('*').eq('user_id', uid).eq('google_event_id', e.id).maybeSingle())
            if (existing && (!existing.sincronizado || existing.deleted_at)) continue
            if (e.status === 'cancelled') {
              if (existing) checked(await db.from('calendar_events').update({ deleted_at: now() }).eq('user_id', uid).eq('id', existing.id).eq('updated_at', existing.updated_at))
              continue
            }
            const date = (v: { dateTime?: string; date?: string }) => new Date(v.dateTime ?? v.date + 'T00:00:00-03:00').toISOString()
            const cat = e.extendedProperties?.private?.forja_category
            const row = { user_id: uid, google_event_id: e.id, titulo: e.summary || 'Sem título', descricao: e.description ?? '', local: e.location ?? '', inicio: date(e.start), fim: date(e.end), dia_inteiro: !!e.start.date, categoria: CATEGORIES.includes(cat) ? cat : categorize(e.summary ?? ''), recorrente: !!e.recurringEventId, google_html_link: e.htmlLink, sincronizado: true, updated_at: now() }
            if (existing) checked(await db.from('calendar_events').update(row).eq('id', existing.id).eq('user_id', uid).eq('updated_at', existing.updated_at))
            else checked(await db.from('calendar_events').upsert({ ...row, criado_no_forja: false }, { onConflict: 'user_id,google_event_id', ignoreDuplicates: true }))
            sincronizados++
          }
          page = data.nextPageToken ?? ''
        } while (page)
        // Um evento pode ter sido excluído ou movido para fora da janela no Google.
        // Ausência na listagem nunca basta para excluí-lo: consulta individual confirma.
        const absent = checked(await db.from('calendar_events').select('*').eq('user_id', uid).eq('sincronizado', true).is('deleted_at', null).not('google_event_id', 'is', null).gte('inicio', timeMin).lte('inicio', timeMax)) ?? []
        for (const e of absent.filter(e => !seen.has(e.google_event_id))) {
          deadline()
          const r = await google('/' + encodeURIComponent(e.google_event_id))
          if ([404, 410].includes(r.status)) {
            checked(await db.from('calendar_events').update({ deleted_at: now() }).eq('id', e.id).eq('user_id', uid).eq('updated_at', e.updated_at))
          } else if (r.ok) {
            const remote = await r.json()
            const changes = remote.status === 'cancelled' ? { deleted_at: now() } : {
              inicio: new Date(remote.start.dateTime ?? remote.start.date + 'T00:00:00-03:00').toISOString(),
              fim: new Date(remote.end.dateTime ?? remote.end.date + 'T00:00:00-03:00').toISOString(),
              titulo: remote.summary || 'Sem título', descricao: remote.description ?? '', local: remote.location ?? '', dia_inteiro: !!remote.start.date,
            }
            checked(await db.from('calendar_events').update({ ...changes, updated_at: now() }).eq('id', e.id).eq('user_id', uid).eq('updated_at', e.updated_at))
          } else throw new HttpError('Não foi possível confirmar alterações do Google.', 502)
        }
        checked(await db.from('google_oauth_tokens').update({ last_synced_at: now() }).eq('user_id', uid))
        return { sincronizados, criados_google }
      } finally {
        checked(await db.from('google_oauth_tokens').update({ sync_lock_until: null }).eq('user_id', uid))
      }
    }

    if (b.acao === 'status') {
      const t = checked(await tokens())
      return json({ conectado: !!t, last_synced_at: t?.last_synced_at ?? null, client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? null })
    }
    if (b.acao === 'auth_start') {
      const uri = new URL(String(b.redirect_uri))
      const allowed = (Deno.env.get('GOOGLE_REDIRECT_ORIGINS') ?? 'https://forja-chi.vercel.app,http://localhost:5173').split(',')
      if (!allowed.includes(uri.origin) || uri.pathname !== '/auth/google/callback' || uri.search || uri.hash) throw new HttpError('Endereço de retorno não autorizado.')
      const state = crypto.randomUUID()
      checked(await db.from('google_oauth_states').upsert({ user_id: uid, state, redirect_uri: uri.href, expires_at: new Date(Date.now() + 600000).toISOString() }, { onConflict: 'user_id' }))
      return json({ state, client_id: Deno.env.get('GOOGLE_CLIENT_ID') })
    }
    if (b.acao === 'auth_callback') {
      const state = checked(await db.from('google_oauth_states').delete().eq('user_id', uid).eq('state', String(b.state)).gt('expires_at', now()).select().maybeSingle())
      if (!state) throw new HttpError('Conexão expirada. Inicie novamente nas configurações.')
      const t = await exchange({ code: String(b.code), redirect_uri: state.redirect_uri, grant_type: 'authorization_code' })
      if (!t.refresh_token) throw new HttpError('Autorize o acesso offline ao conectar novamente.')
      // Reconexão mantém eventos importados, mas não publica eventos de outra conta automaticamente.
      checked(await db.from('google_oauth_tokens').upsert({ user_id: uid, access_token: t.access_token, refresh_token: t.refresh_token, expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(), scope: t.scope, updated_at: now() }, { onConflict: 'user_id' }))
      return json({ ok: true })
    }
    if (b.acao === 'refresh_token') { await access(true); return json({ ok: true }) }
    if (b.acao === 'desconectar') {
      const t = checked(await tokens())
      if (t) {
        const r = await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', body: new URLSearchParams({ token: t.refresh_token || t.access_token }), signal: AbortSignal.timeout(15000) })
        if (!r.ok && r.status !== 400) throw new HttpError('Falha ao revogar acesso Google. Tente novamente.', 502)
      }
      checked(await db.from('google_oauth_tokens').delete().eq('user_id', uid))
      checked(await db.from('google_oauth_states').delete().eq('user_id', uid))
      return json({ ok: true })
    }
    if (b.acao === 'sync') return json(await sync())
    if (['criar_evento', 'atualizar_evento', 'deletar_evento'].includes(b.acao)) {
      const id = String(b.id ?? crypto.randomUUID())
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError('Identificador inválido.')
      let event
      if (b.acao === 'criar_evento') {
        let fields
        try { fields = validate_event(b) } catch (e) { throw new HttpError((e as Error).message) }
        if (b.protocol_exam_id) {
          const exam = checked(await db.from('protocol_exams').select('id').eq('user_id', uid).eq('id', b.protocol_exam_id).maybeSingle())
          if (!exam) throw new HttpError('Exame não encontrado.', 404)
        }
        event = checked(await db.from('calendar_events').upsert({ ...fields, id, user_id: uid, criado_no_forja: true, sincronizado: false, updated_at: now(), protocol_exam_id: b.protocol_exam_id ?? null }, { onConflict: b.protocol_exam_id ? 'user_id,protocol_exam_id' : 'id', ignoreDuplicates: true }).select().maybeSingle())
        if (!event) event = checked(await db.from('calendar_events').select('*').eq('user_id', uid).eq(b.protocol_exam_id ? 'protocol_exam_id' : 'id', b.protocol_exam_id ?? id).single())
      } else {
        const old = checked(await db.from('calendar_events').select('id').eq('id', id).eq('user_id', uid).is('deleted_at', null).maybeSingle())
        if (!old) throw new HttpError('Evento não encontrado.', 404)
        let fields
        try { fields = b.acao === 'deletar_evento' ? { deleted_at: now() } : validate_event(b) } catch (e) { throw new HttpError((e as Error).message) }
        event = checked(await db.from('calendar_events').update({ ...fields, sincronizado: false, updated_at: now() }).eq('id', id).eq('user_id', uid).select().single())
      }
      if (b.crm_client_id && b.acao !== 'deletar_evento') {
        const linked = checked(await db.from('crm_clients').update({ calendar_event_id: event.id }).eq('id', b.crm_client_id).eq('user_id', uid).select('id').maybeSingle())
        if (!linked) throw new HttpError('Evento salvo, mas o cliente não foi encontrado.', 404)
      }
      // A gravação local é durável mesmo se o Google estiver indisponível.
      // Não repetir a criação depois de uma falha externa: a fila mantém o mesmo ID.
      let warning: string | null = null
      try { await sync() } catch (e) { warning = e instanceof HttpError ? e.message : 'Sincronização pendente.' }
      const current = checked(await db.from('calendar_events').select('*').eq('id', event.id).eq('user_id', uid).single())
      return json({ evento: current, warning })
    }
    throw new HttpError('Ação desconhecida.')
  } catch (e) {
    return json({ error: e instanceof HttpError ? e.message : 'Não foi possível concluir a operação.' }, e instanceof HttpError ? e.status : 400)
  }
})
