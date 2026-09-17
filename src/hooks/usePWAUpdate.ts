import { useEffect, useSyncExternalStore } from 'react'

import { aplicarAtualizacao, assinarPWAUpdate, iniciarPWAUpdate, lerPWAUpdate, verificarAtualizacao } from '@/lib/pwa-update'

/** Estado da atualização do PWA: há versão nova esperando? */
export function usePWAUpdate() {
  useEffect(() => iniciarPWAUpdate(), [])
  const { needRefresh, suportado } = useSyncExternalStore(assinarPWAUpdate, lerPWAUpdate, lerPWAUpdate)

  return {
    needRefresh,
    /** false em dev/navegador sem service worker: não há o que verificar. */
    suportado,
    /** `updateServiceWorker(true)` ativa a versão nova e recarrega o app. */
    updateServiceWorker: (_reload = true) => aplicarAtualizacao(),
    verificarAtualizacao,
  }
}
