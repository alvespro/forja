import { useState } from 'react'
import { Plus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CrmClientCard } from '@/components/crm/crm-client-card'
import { CrmClientForm } from '@/components/crm/crm-client-form'
import { useCreateCrmClient, useCrmClients } from '@/hooks/use-crm-clients'

export function CrmPage() {
  const clients = useCrmClients()
  const createClient = useCreateCrmClient()
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-sm text-aco-texto">Clientes e leads do negócio.</p>
        </div>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Novo cliente
          </Button>
        )}
      </div>

      {isAdding && (
        <CrmClientForm
          isSubmitting={createClient.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) => createClient.mutate(values, { onSuccess: () => setIsAdding(false) })}
        />
      )}

      {clients.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : clients.isError ? (
        <ErrorState message="Não foi possível carregar os clientes." onRetry={() => clients.refetch()} />
      ) : !clients.data || clients.data.length === 0 ? (
        !isAdding && <EmptyState message="Nenhum cliente cadastrado ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {clients.data.map((client) => (
            <CrmClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
