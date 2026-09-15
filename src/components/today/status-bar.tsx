import { StatusDot } from '@/components/ds/status-dot'
import { useClock, useSystemStatus } from '@/hooks/use-system-status'

/**
 * SECTION 0 do Hoje: barra de status fixa no topo (estilo DeerFlow). Logo
 * dot-matrix com ponto pulsante, estado real do app e a hora em Space Mono.
 */
export function StatusBar() {
  const status = useSystemStatus()
  const hora = useClock()

  const texto =
    status.estado === 'offline'
      ? { label: 'Offline — dados em cache', cor: 'cinza' as const }
      : status.estado === 'falhas'
        ? { label: `${status.quantas} ${status.quantas === 1 ? 'falha' : 'falhas'} de sync`, cor: 'alerta' as const }
        : { label: 'All systems operational', cor: 'ok' as const }

  return (
    <div
      className="sticky top-0 z-20 -mx-4 -mb-8 -mt-[calc(env(safe-area-inset-top,0px)+24px)] flex items-center gap-3 border-b border-linha/60 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+10px)] backdrop-blur-[20px] md:-mx-8 md:-mt-8 md:px-8 md:pt-3"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)' }}
    >
      <span className="flex items-center gap-2">
        <span className="ds-terminal-xl leading-none tracking-[0.12em] text-nevoa">FORJA</span>
        <StatusDot color="brasa" pulse />
      </span>
      <span role="status" className="min-w-0 flex-1 truncate">
        <StatusDot color={texto.cor} label={texto.label} className="max-w-full [&>span:last-child]:truncate" />
      </span>
      <time className="shrink-0 text-[13px] tabular-nums text-cinza [font-family:var(--font-display)]">{hora}</time>
    </div>
  )
}
