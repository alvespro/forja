import { Icon } from '@/components/Icon'

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
      <Icon name="warning" size={24} className="text-alerta-texto" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <Icon name="sync" size={16} />
          Tentar de novo
        </Button>
      )}
    </div>
  )
}
