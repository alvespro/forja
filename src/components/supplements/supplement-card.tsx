import { useState } from 'react'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SupplementForm } from '@/components/supplements/supplement-form'
import { useConfirm } from '@/hooks/use-confirm'
import { useDeleteSupplement, useUpdateSupplement, type SupplementInput } from '@/hooks/use-supplements'
import { mensagemDeErro } from '@/lib/feedback'
import { cn } from '@/lib/utils'
import type { Supplement } from '@/types/database'

type SupplementCardProps = {
  supplement: Supplement
  adesaoPct: number | null
}

export function SupplementCard({ supplement, adesaoPct }: SupplementCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateSupplement = useUpdateSupplement()
  const deleteSupplement = useDeleteSupplement()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({
      title: `Excluir "${supplement.nome}"?`,
      description: 'O histórico de doses tomadas também é apagado. Para só parar de tomar, use pausar. Não dá para desfazer.',
      critico: true,
    })
    if (!ok) return
    deleteSupplement.mutate(supplement.id, {
      onSuccess: () => toast.success(`${supplement.nome} excluído.`),
      onError: (e) => toast.error(mensagemDeErro(e, 'excluir o suplemento')),
    })
  }

  function handleUpdate(values: SupplementInput) {
    updateSupplement.mutate(
      { id: supplement.id, values },
      {
        onSuccess: () => {
          toast.success(`${values.nome} atualizado.`)
          setIsEditing(false)
        },
        onError: (e) => toast.error(mensagemDeErro(e, 'salvar o suplemento')),
      },
    )
  }

  function handleToggleAtivo() {
    const values: SupplementInput = {
      nome: supplement.nome,
      tipo: supplement.tipo,
      dose: supplement.dose,
      unidade: supplement.unidade,
      momento: supplement.momento,
      dias_semana: supplement.dias_semana,
      ativo: !supplement.ativo,
      notas: supplement.notas,
    }
    updateSupplement.mutate(
      { id: supplement.id, values },
      {
        onSuccess: () => toast.success(values.ativo ? `${supplement.nome} reativado.` : `${supplement.nome} pausado — o histórico continua salvo.`),
        onError: (e) => toast.error(mensagemDeErro(e, 'alterar o suplemento')),
      },
    )
  }

  if (isEditing) {
    return (
      <SupplementForm
        supplement={supplement}
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
        isSubmitting={updateSupplement.isPending}
      />
    )
  }

  return (
    <>
      {dialog}
      <Card size="sm" className={cn(!supplement.ativo && 'opacity-60')}>
        <CardContent className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {supplement.nome}
              {!supplement.ativo && <span className="ml-1.5 text-xs text-aco-texto">(inativo)</span>}
            </span>
            <span className="truncate font-mono text-xs text-aco-texto">
              {supplement.dose}
              {supplement.unidade} · {supplement.momento} ·{' '}
              {(supplement.dias_semana ?? []).join(', ') || 'sem dias definidos'}
            </span>
            {adesaoPct !== null && (
              <span className="font-mono text-xs text-brasa">{adesaoPct}% de adesão no ciclo atual</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={supplement.ativo ? 'Desativar' : 'Ativar'}
              onClick={handleToggleAtivo}
            >
              <Icon name={supplement.ativo ? 'pause' : 'play_arrow'} size={18} />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setIsEditing(true)}>
              <Icon name="edit" size={14} />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Excluir" onClick={handleDelete}>
              <Icon name="delete" size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
