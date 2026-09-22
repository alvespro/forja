/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<unknown> }

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new StaleWhileRevalidate({ cacheName: 'google-fonts-css' }))
registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new CacheFirst({
  cacheName: 'google-fonts-files',
  plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })],
}))

type PushPayload = { title?: string; body?: string; url?: string; tag?: string }

self.addEventListener('push', (event) => {
  const payload: PushPayload = (() => {
    try { return event.data?.json() ?? {} } catch { return { body: event.data?.text() } }
  })()
  event.waitUntil(self.registration.showNotification(payload.title ?? 'FORJA', {
    body: payload.body ?? 'Você tem um novo lembrete.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag,
    data: { url: payload.url ?? '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url ?? '/', self.location.origin).href
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = clients.find((client) => client.url.startsWith(self.location.origin))
    if (existing) {
      await existing.focus()
      if ('navigate' in existing) await existing.navigate(target)
      return
    }
    await self.clients.openWindow(target)
  })())
})
