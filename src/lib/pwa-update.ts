import { registerSW } from 'virtual:pwa-register'

// Atualização do PWA (registerType 'prompt'): o service worker novo fica esperando até
// o usuário tocar "Atualizar agora". Registro único, fora do React — o banner e o card de
// Configurações leem o mesmo estado (dois useRegisterSW registrariam o SW duas vezes).

const INTERVALO_VERIFICACAO_MS = 60 * 1000

type Estado = { needRefresh: boolean; suportado: boolean }

let estado: Estado = { needRefresh: false, suportado: false }
let listeners: Array<() => void> = []
let atualizar: ((reloadPage?: boolean) => Promise<void>) | null = null
let registration: ServiceWorkerRegistration | undefined

function definir(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial }
  listeners.forEach((l) => l())
}

export function iniciarPWAUpdate() {
  if (atualizar || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  atualizar = registerSW({
    onNeedRefresh: () => definir({ needRefresh: true }),
    onRegisteredSW: (_url, r) => {
      registration = r
      definir({ suportado: !!r })
      // Verifica atualização a cada 60 s enquanto o app está aberto.
      if (r) window.setInterval(() => void r.update(), INTERVALO_VERIFICACAO_MS)
    },
  })
}

export function assinarPWAUpdate(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export const lerPWAUpdate = () => estado

/** Ativa o service worker que está esperando e recarrega o app na versão nova. */
export async function aplicarAtualizacao() {
  await atualizar?.(true)
}

/** Espera um SW em instalação terminar (ou desistir), com limite de tempo. */
function aguardarInstalacao(sw: ServiceWorker, limiteMs = 15000): Promise<void> {
  return new Promise((resolve) => {
    const fim = window.setTimeout(resolve, limiteMs)
    sw.addEventListener('statechange', () => {
      if (sw.state === 'installed' || sw.state === 'redundant' || sw.state === 'activated') {
        window.clearTimeout(fim)
        resolve()
      }
    })
  })
}

export type ResultadoVerificacao = 'atualizado' | 'disponivel' | 'indisponivel'

/** "Verificar atualização": força o navegador a buscar o service worker novo. */
export async function verificarAtualizacao(): Promise<ResultadoVerificacao> {
  if (!registration) return 'indisponivel'
  await registration.update()
  if (registration.installing) await aguardarInstalacao(registration.installing)
  if (registration.waiting) definir({ needRefresh: true })
  return estado.needRefresh ? 'disponivel' : 'atualizado'
}
