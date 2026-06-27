import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CrmClientCard } from '@/components/crm/crm-client-card'
import { CrmClientForm } from '@/components/crm/crm-client-form'
import { useCreateCrmClient, useCrmClients } from '@/hooks/use-crm-clients'

const TODAS_AS_FASES = '__todas__'

export function CrmPage() {
  const clients = useCrmClients()
  const createClient = useCreateCrmClient()
  const [isAdding, setIsAdding] = useState(false)
  const [faseFiltro, setFaseFiltro] = useState(TODAS_AS_FASES)

  const fases = useMemo(() => {
    const unique = new Set<string>()
    for (const client of clients.data ?? []) {
      if (client.fase) unique.add(client.fase)
    }
    return Array.from(unique).sort()
  }, [clients.data])

  const filteredClients = useMemo(() => {
    if (faseFiltro === TODAS_AS_FASES) return clients.data ?? []
    return (clients.data ?? []).filter((client) => client.fase === faseFiltro)
  }, [clients.data, faseFiltro])

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

      {!clients.isLoading && !clients.isError && fases.length > 0 && (
        <div className="flex max-w-48 flex-col gap-1.5">
          <Select value={faseFiltro} onChange={(event) => setFaseFiltro(event.target.value)}>
            <option value={TODAS_AS_FASES}>Todas as fases</option>
            {fases.map((fase) => (
              <option key={fase} value={fase}>
                {fase}
              </option>
            ))}
          </Select>
        </div>
      )}

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
      ) : filteredClients.length === 0 ? (
        <EmptyState message="Nenhum cliente nessa fase." />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredClients.map((client) => (
            <CrmClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
