/** Notificações locais de descanso. Funcionam quando o navegador/PWA permite. */
export function prepareRestNotifications(): void {
  if (!('Notification' in window) || Notification.permission !== 'default') return
  void Notification.requestPermission().catch(() => {})
}

export async function notifyRestComplete(): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const options: NotificationOptions = {
    body: 'O descanso terminou. A próxima série está liberada.',
    tag: 'forja-rest-complete',
    requireInteraction: false,
    icon: '/icons/icon-192.png',
  }
  try {
    const registration = await navigator.serviceWorker?.ready
    if (registration) await registration.showNotification('FORJA · Próxima série', options)
    else new Notification('FORJA · Próxima série', options)
  } catch {
    // Som, vibração e o cronômetro visual continuam sendo o fallback.
  }
}
