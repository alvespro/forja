import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

/** Entrega um lembrete já persistido para todos os dispositivos do respectivo usuário. */
Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (req.headers.get('authorization') !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) return json({ error: 'unauthorized' }, 401)
  if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ error: 'web_push_not_configured' }, 503)

  const { notification_id: notificationId } = await req.json().catch(() => ({}))
  if (typeof notificationId !== 'string') return json({ error: 'notification_id_required' }, 400)

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: notification, error: notificationError } = await sb
    .from('notifications')
    .select('id, user_id, titulo, corpo, link, dedupe_key')
    .eq('id', notificationId)
    .maybeSingle()
  if (notificationError) return json({ error: notificationError.message }, 500)
  if (!notification) return json({ error: 'notification_not_found' }, 404)

  const { data: subscriptions, error: subscriptionsError } = await sb
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', notification.user_id)
  if (subscriptionsError) return json({ error: subscriptionsError.message }, 500)

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  const payload = JSON.stringify({
    title: notification.titulo,
    body: notification.corpo ?? undefined,
    url: notification.link ?? '/',
    tag: notification.dedupe_key,
  })

  const deliveries = await Promise.all((subscriptions ?? []).map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, payload, { TTL: 60 * 60 })
      return 'sent'
    } catch (error) {
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
        ? Number(error.statusCode)
        : 0
      // Assinaturas expiram quando o navegador é reinstalado ou revoga a permissão.
      if (statusCode === 404 || statusCode === 410) {
        await sb.from('push_subscriptions').delete().eq('id', subscription.id)
      }
      console.error('send-web-push delivery failed', { subscriptionId: subscription.id, statusCode })
      return 'failed'
    }
  }))

  return json({ ok: true, sent: deliveries.filter((item) => item === 'sent').length })
})
