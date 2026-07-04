import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CrmClientForm } from '@/components/crm/crm-client-form'
import { useConfirm } from '@/hooks/use-confirm'
import { useCreateFinance } from '@/hooks/use-finances'
import { useDeleteCrmClient, useUpdateCrmClient, type CrmClientInput } from '@/hooks/use-crm-clients'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'
import type { CrmClient } from '@/types/database'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type CrmClientCardProps = {
  client: CrmClient
}

export function CrmClientCard({ client }: CrmClientCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateClient = useUpdateCrmClient()
  const deleteClient = useDeleteCrmClient()
  const createFinance = useCreateFinance()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({
      title: `Excluir "${client.nome}"?`,
      description: 'Essa ação não pode ser desfeita.',
    })
    if (!ok) return
    deleteClient.mutate(client.id)
  }

  function handleUpdate(values: CrmClientInput) {
    const fechouAgora = values.fase === 'fechado' && client.fase !== 'fechado'
    updateClient.mutate(
      { id: client.id, values },
      {
        onSuccess: async () => {
          setIsEditing(false)
          // Fechou negócio → oferece registrar a receita em 1 clique
          if (fechouAgora && values.valor_estimado) {
            const ok = await confirm({
              title: `Registrar receita de ${currency.format(values.valor_estimado)}?`,
              description: `Fechamento de "${client.nome}" vira lançamento em Finanças (categoria: comissão).`,
            })
            if (ok) {
              createFinance.mutate({
                tipo: 'receita',
                categoria: 'comissão',
                valor: values.valor_estimado,
                descricao: `Fechamento — ${client.nome}`,
                data: todayInSaoPaulo(),
              })
            }
          }
        },
      },
    )
  }

  if (isEditing) {
    return (
      <CrmClientForm
        client={client}
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
        isSubmitting={updateClient.isPending}
      />
    )
  }

  return (
    <>
      {dialog}
      <Card>
        <CardContent className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-foreground">{client.nome}</span>
            <span className="truncate text-xs text-aco-texto">{client.fase || 'sem fase definida'}</span>
            {client.proxima_acao && (
              <span className="truncate text-xs text-aco-texto">
                Próxima ação: {client.proxima_acao}
                {client.data_proxima_acao &&
                  ` (${format(parseDateOnly(client.data_proxima_acao), "d 'de' MMMM", { locale: ptBR })})`}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {client.valor_estimado !== null && (
              <span className="font-mono text-sm text-foreground">{currency.format(client.valor_estimado)}</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar cliente ${client.nome}`}
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir cliente ${client.nome}`}
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
