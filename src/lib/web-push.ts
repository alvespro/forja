import { supabase } from '@/lib/supabase'

let vapidPublicKey: string | null = null

export type WebPushStatus = 'supported' | 'unsupported'

export function webPushStatus(): WebPushStatus {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  return 'supported'
}

async function obterChavePublicaVapid() {
  if (vapidPublicKey) return vapidPublicKey
  const { data, error } = await supabase.functions.invoke<{ public_key: string }>('web-push-config')
  if (error || !data?.public_key) throw new Error('web_push_not_configured')
  vapidPublicKey = data.public_key
  return vapidPublicKey
}

function base64UrlToUint8Array(value: string) {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
  const binary = window.atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null) {
  if (!buffer) return null
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

/** Solicita permissão em resposta a uma ação explícita e salva este dispositivo. */
export async function ativarWebPush() {
  if (webPushStatus() !== 'supported') throw new Error('notificacoes_indisponiveis')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permissao_negada')

  const registration = await navigator.serviceWorker.ready
  const publicKey = await obterChavePublicaVapid()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(publicKey),
  })
  const p256dh = arrayBufferToBase64Url(subscription.getKey('p256dh'))
  const auth = arrayBufferToBase64Url(subscription.getKey('auth'))
  if (!p256dh || !auth) throw new Error('assinatura_invalida')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('sessao_ausente')

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,endpoint' })
  if (error) throw error
}

export async function webPushAtivo() {
  if (webPushStatus() !== 'supported') return false
  const registration = await navigator.serviceWorker.ready
  return Boolean(await registration.pushManager.getSubscription())
}

export async function desativarWebPush() {
  if (webPushStatus() !== 'supported') return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  if (error) throw error
  await subscription.unsubscribe()
}
