import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * errorElement das rotas: captura erros de render/loader dentro do router
 * e mostra uma tela amigável em vez do stack trace padrão.
 */
export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()

  const is404 = isRouteErrorResponse(error) && error.status === 404
  const detail =
    isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : error instanceof Error
        ? error.message
        : null

  console.error('[route-error]', error)

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="size-10 text-atencao" />
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          {is404 ? 'Página não encontrada' : 'Algo quebrou por aqui'}
        </h1>
        <p className="mt-1 text-sm text-aco-texto max-w-sm">
          {is404
            ? 'O endereço não existe ou foi movido.'
            : 'O erro foi registrado. Recarregar geralmente resolve.'}
        </p>
        {detail && !is404 && (
          <p className="mt-2 rounded-md bg-card/60 px-3 py-1.5 font-mono text-xs text-aco-texto/70 max-w-md overflow-hidden text-ellipsis">
            {detail}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => navigate('/')}>
          Ir para Hoje
        </Button>
        <Button type="button" onClick={() => window.location.reload()} className="gap-1.5">
          <RotateCcw className="size-3.5" />
          Recarregar
        </Button>
      </div>
    </div>
  )
}
