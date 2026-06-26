import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card/40 p-8 text-center">
      <TriangleAlert className="size-6 text-alerta" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Tentar de novo
        </Button>
      )}
    </div>
  )
}
