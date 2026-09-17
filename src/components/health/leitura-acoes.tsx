import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useConfirm } from '@/hooks/use-confirm'
import { useDeleteHealthMetric, useUpdateHealthMetric } from '@/hooks/use-health-metrics'
import { todayInSaoPaulo } from '@/lib/date'
import { mensagemDeErro } from '@/lib/feedback'

export type LeituraAlvo = { id: string; chave: string; label: string; unidade: string | null; valor: number; measured_at: string }

const br = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`

/** Editar valor/data de uma leitura (UPDATE em health_metrics). */
export function EditarLeituraModal({ leitura, onClose }: { leitura: LeituraAlvo | null; onClose: () => void }) {
  return (
    <Modal open={leitura !== null} onClose={onClose} title={leitura ? `Editar ${leitura.label}` : ''} description={leitura ? `Medição de ${dataBr(leitura.measured_at)}` : undefined}>
      {leitura && <EditarLeituraForm key={leitura.id} leitura={leitura} onDone={onClose} />}
    </Modal>
  )
}

function EditarLeituraForm({ leitura, onDone }: { leitura: LeituraAlvo; onDone: () => void }) {
  const update = useUpdateHealthMetric()
  const [valor, setValor] = useState(String(leitura.valor).replace('.', ','))
  const [data, setData] = useState(leitura.measured_at)
  const [erros, setErros] = useState<{ valor?: string; data?: string }>({})

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(valor.replace(',', '.'))
    const novos = {
      valor: valor.trim() === '' ? 'Informe o valor.' : !Number.isFinite(n) || n < 0 ? 'Valor inválido.' : undefined,
      data: !data ? 'Informe a data.' : data > todayInSaoPaulo() ? 'A data não pode ser no futuro.' : undefined,
    }
    setErros(novos)
    if (novos.valor || novos.data) return
    update.mutate(
      { id: leitura.id, valor: n, measured_at: data },
      {
        onSuccess: () => {
          toast.success(`${leitura.label} atualizado para ${br(n)}${leitura.unidade ? ` ${leitura.unidade}` : ''}.`)
          onDone()
        },
        onError: (err) => toast.error(mensagemDeErro(err, 'atualizar a medição')),
      },
    )
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <FormField label={leitura.unidade ? `Valor (${leitura.unidade})` : 'Valor'} htmlFor="leitura-valor" erro={erros.valor}>
        <Input inputMode="decimal" autoFocus value={valor} onChange={(e) => setValor(e.target.value)} {...propsDeErro('leitura-valor', erros.valor)} />
      </FormField>
      <FormField label="Data da coleta" htmlFor="leitura-data" erro={erros.data}>
        <Input type="date" max={todayInSaoPaulo()} value={data} onChange={(e) => setData(e.target.value)} {...propsDeErro('leitura-data', erros.data)} />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onDone} disabled={update.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={update.isPending}>
          {update.isPending && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

/** Exclusão com confirmação de dado crítico (digitar CONFIRMAR ou tocar 2x). */
export function useExcluirLeitura() {
  const remove = useDeleteHealthMetric()
  const { confirm, dialog } = useConfirm()

  async function excluir(leitura: LeituraAlvo) {
    const ok = await confirm({
      title: `Excluir ${leitura.label} de ${dataBr(leitura.measured_at)}?`,
      description: `O valor ${br(leitura.valor)}${leitura.unidade ? ` ${leitura.unidade}` : ''} sai do placar e do histórico. Não dá para desfazer.`,
      critico: true,
    })
    if (!ok) return
    remove.mutate(leitura.id, {
      onSuccess: () => toast.success(`${leitura.label} de ${dataBr(leitura.measured_at)} excluído.`),
      onError: (err) => toast.error(mensagemDeErro(err, 'excluir a medição')),
    })
  }

  return { excluir, dialog, excluindo: remove.isPending }
}

const PRESSAO_LONGA_MS = 500

/**
 * Toque longo num card: abre o menu de ações. Devolve os handlers de ponteiro e um
 * `clickBloqueado()` para ignorar o clique que o navegador dispara ao soltar o dedo.
 */
export function useToqueLongo(onToqueLongo: () => void) {
  const timer = useRef<number | null>(null)
  const disparou = useRef(false)

  function cancelar() {
    if (timer.current != null) window.clearTimeout(timer.current)
    timer.current = null
  }

  return {
    handlers: {
      onPointerDown: () => {
        disparou.current = false
        cancelar()
        timer.current = window.setTimeout(() => {
          disparou.current = true
          if (typeof navigator.vibrate === 'function') navigator.vibrate(10)
          onToqueLongo()
        }, PRESSAO_LONGA_MS)
      },
      onPointerUp: cancelar,
      onPointerLeave: cancelar,
      onPointerCancel: cancelar,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
    clickBloqueado: () => {
      const bloquear = disparou.current
      disparou.current = false
      return bloquear
    },
  }
}

type MenuProps = {
  leitura: LeituraAlvo | null
  onClose: () => void
  onEditar: (l: LeituraAlvo) => void
  onExcluir: (l: LeituraAlvo) => void
}

/** Folha de ações do card (⋮ ou toque longo): Editar valor / Excluir. */
export function LeituraMenu({ leitura, onClose, onEditar, onExcluir }: MenuProps) {
  return (
    <Modal open={leitura !== null} onClose={onClose} title={leitura?.label ?? ''} description={leitura ? `Última medição: ${br(leitura.valor)}${leitura.unidade ? ` ${leitura.unidade}` : ''} em ${dataBr(leitura.measured_at)}` : undefined} maxWidth="sm">
      {leitura && (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 justify-start"
            onClick={() => {
              onClose()
              onEditar(leitura)
            }}
          >
            <Icon name="edit" size={20} />
            Editar valor
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 justify-start text-alerta-texto hover:text-alerta-texto"
            onClick={() => {
              onClose()
              onExcluir(leitura)
            }}
          >
            <Icon name="delete" size={20} />
            Excluir
          </Button>
        </div>
      )}
    </Modal>
  )
}
