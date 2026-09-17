import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateProtocolExam } from '@/hooks/use-protocol-exams'
import { todayInSaoPaulo } from '@/lib/date'
import { mensagemDeErro } from '@/lib/feedback'
import type { ProtocolExam } from '@/types/database'

/** "✓ Marcar realizado": data em que o exame foi feito + observações. */
export function ExameRealizadoModal({ exame, onClose }: { exame: ProtocolExam | null; onClose: () => void }) {
  return (
    <Modal open={exame !== null} onClose={onClose} title="Marcar exame como realizado" description={exame?.nome}>
      {exame && <Formulario key={exame.id} exame={exame} onClose={onClose} />}
    </Modal>
  )
}

function Formulario({ exame, onClose }: { exame: ProtocolExam; onClose: () => void }) {
  const atualizar = useUpdateProtocolExam()
  const [data, setData] = useState(todayInSaoPaulo())
  const [observacoes, setObservacoes] = useState(exame.observacoes ?? '')
  const [erro, setErro] = useState<string | null>(null)

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const problema = !data ? 'Informe a data.' : data > todayInSaoPaulo() ? 'A data não pode ser no futuro.' : null
    setErro(problema)
    if (problema) return
    atualizar.mutate(
      { id: exame.id, values: { status: 'realizado', data_realizada: data, observacoes: observacoes.trim() || null } },
      {
        onSuccess: () => {
          toast.success(`${exame.nome} marcado como realizado.`)
          onClose()
        },
        onError: (err) => toast.error(mensagemDeErro(err, 'marcar o exame')),
      },
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <FormField label="Data realizada" htmlFor="exame-realizado-data" erro={erro}>
        <Input type="date" max={todayInSaoPaulo()} value={data} onChange={(e) => (setData(e.target.value), setErro(null))} {...propsDeErro('exame-realizado-data', erro)} />
      </FormField>
      <FormField label="Observações (opcional)" htmlFor="exame-realizado-obs">
        <Textarea id="exame-realizado-obs" rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={atualizar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={atualizar.isPending}>
          {atualizar.isPending ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="check" size={18} />}
          {atualizar.isPending ? 'Salvando…' : 'Marcar realizado'}
        </Button>
      </div>
    </form>
  )
}
