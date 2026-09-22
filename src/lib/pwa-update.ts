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
    onRegisterError: () => definir({ suportado: false }),
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

export type ResultadoVerificacao = 'atualizado' | 'disponivel' | 'indisponivel' | 'sem_conexao'

/** Alguns navegadores só expõem o registro depois que a primeira tela terminou de pintar. */
async function obterRegistro(): Promise<ServiceWorkerRegistration | undefined> {
  if (registration) return registration
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined

  registration = await navigator.serviceWorker.getRegistration()
  if (registration) return registration

  // Não bloqueia a tela de Configurações indefinidamente enquanto o SW instala.
  return await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<undefined>((resolve) => window.setTimeout(() => resolve(undefined), 4_000)),
  ])
}

/** "Verificar atualização": força o navegador a buscar o service worker novo. */
export async function verificarAtualizacao(): Promise<ResultadoVerificacao> {
  const activeRegistration = await obterRegistro()
  if (!activeRegistration) return 'indisponivel'
  try {
    await activeRegistration.update()
    if (activeRegistration.installing) await aguardarInstalacao(activeRegistration.installing)
    if (activeRegistration.waiting) definir({ needRefresh: true })
    return estado.needRefresh ? 'disponivel' : 'atualizado'
  } catch {
    // O navegador pode rejeitar a consulta quando está offline; não apresentamos isso como erro do app.
    return navigator.onLine ? 'indisponivel' : 'sem_conexao'
  }
}
