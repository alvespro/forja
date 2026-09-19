import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useRegistrarAplicacao } from '@/hooks/use-protocol-logs'
import { mensagemDeErro } from '@/lib/feedback'
import { cn } from '@/lib/utils'
import type { ProtocolCompound } from '@/types/database'

export const LOCAIS_APLICACAO = ['Glúteo D', 'Glúteo E', 'Deltoide D', 'Deltoide E', 'Vasto D', 'Vasto E'] as const

const dose = (mg: number | null) => (mg == null ? '—' : `${mg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}mg`)

type Props = {
  open: boolean
  onClose: () => void
  protocolId: string
  /** Compostos cadastrados para a semana atual (doses prescritas, só leitura). */
  compostos: ProtocolCompound[]
  semana: number
  totalSemanas: number
  /** Data pendente a registrar em YYYY-MM-DD; ausência registra agora. */
  dataAplicacao?: string
  /** Já existe registro hoje: avisa antes de duplicar. */
  jaRegistradoHoje: boolean
}

/** Registro da aplicação do dia: compostos da semana, local, observações e bem-estar (1–5). */
export function RegistrarAplicacaoModal(props: Props) {
  const descricao = props.dataAplicacao
    ? `Aplicação pendente de ${props.dataAplicacao.slice(8, 10)}/${props.dataAplicacao.slice(5, 7)}`
    : `Semana ${props.semana} de ${props.totalSemanas}`
  return (
    <Modal open={props.open} onClose={props.onClose} title="Registrar aplicação" description={descricao}>
      {props.open && <Formulario {...props} />}
    </Modal>
  )
}

function Formulario({ onClose, protocolId, compostos, jaRegistradoHoje, dataAplicacao }: Props) {
  const registrar = useRegistrarAplicacao()
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set(compostos.map((c) => c.id)))
  const [local, setLocal] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [bemEstar, setBemEstar] = useState({ humor: 3, energia: 3, libido: 3 })
  const [erros, setErros] = useState<{ local?: string; compostos?: string }>({})

  function alternar(id: string) {
    setSelecionados((s) => {
      const novo = new Set(s)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
    setErros((e) => ({ ...e, compostos: undefined }))
  }

  function confirmar(e: React.FormEvent) {
    e.preventDefault()
    const novos = {
      local: local ? undefined : 'Escolha o local de aplicação.',
      compostos: selecionados.size > 0 ? undefined : 'Marque ao menos um composto.',
    }
    setErros(novos)
    if (novos.local || novos.compostos) return
    registrar.mutate(
      {
        protocol_id: protocolId,
        data_aplicacao: dataAplicacao,
        compostos: compostos.filter((c) => selecionados.has(c.id)).map((c) => ({ compound_id: c.id, dose_aplicada_mg: c.dose_mg })),
        local_aplicacao: local,
        observacoes: observacoes.trim() || null,
        ...bemEstar,
      },
      {
        onSuccess: () => {
          toast.success(`Aplicação${dataAplicacao ? ` de ${dataAplicacao.slice(8, 10)}/${dataAplicacao.slice(5, 7)}` : ''} registrada: ${selecionados.size} ${selecionados.size === 1 ? 'composto' : 'compostos'} · ${local}.`)
          onClose()
        },
        onError: (err) => toast.error(mensagemDeErro(err, 'registrar a aplicação')),
      },
    )
  }

  return (
    <form onSubmit={confirmar} noValidate className="flex flex-col gap-4">
      {jaRegistradoHoje && (
        <p role="note" className="flex items-start gap-2 rounded-[var(--r-md)] border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[13px] text-amber-200">
          <Icon name="warning" size={18} filled className="mt-0.5 shrink-0 text-amber-300" />
          Já existe aplicação registrada hoje. Confirme só se foi outra aplicação.
        </p>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-nevoa">Compostos (dose prescrita)</legend>
        {compostos.length === 0 ? (
          <p className="text-[13px] text-cinza">Nenhum composto cadastrado para esta semana.</p>
        ) : (
          compostos.map((c) => {
            const marcado = selecionados.has(c.id)
            return (
              <label
                key={c.id}
                className={cn(
                  'flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--r-md)] border px-3 transition-colors',
                  marcado ? 'border-brasa/60 bg-brasa/10' : 'border-linha',
                )}
              >
                <input type="checkbox" checked={marcado} onChange={() => alternar(c.id)} className="size-5 accent-[var(--brasa)]" />
                <span className="flex-1 text-[15px] text-nevoa">{c.nome}</span>
                <span className="text-[14px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">{dose(c.dose_mg)}</span>
              </label>
            )
          })
        )}
        {erros.compostos && (
          <p role="alert" className="text-[12px] font-medium text-alerta-texto">
            {erros.compostos}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apl-local">Local de aplicação</Label>
        <Select
          id="apl-local"
          value={local}
          onChange={(e) => {
            setLocal(e.target.value)
            setErros((er) => ({ ...er, local: undefined }))
          }}
          aria-invalid={!!erros.local || undefined}
          aria-describedby={erros.local ? 'apl-local-erro' : undefined}
        >
          <option value="">Escolha…</option>
          {LOCAIS_APLICACAO.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
        {erros.local && (
          <p id="apl-local-erro" role="alert" className="text-[12px] font-medium text-alerta-texto">
            {erros.local}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 text-sm font-medium text-nevoa">Bem-estar {dataAplicacao ? 'na aplicação' : 'hoje'}</legend>
        {(['humor', 'energia', 'libido'] as const).map((campo) => (
          <label key={campo} className="flex flex-col gap-1">
            <span className="flex justify-between text-[13px] text-cinza">
              <span className="capitalize">{campo}</span>
              <span className="font-bold tabular-nums text-nevoa">{bemEstar[campo]}/5</span>
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={bemEstar[campo]}
              onChange={(e) => setBemEstar((b) => ({ ...b, [campo]: Number(e.target.value) }))}
              className="h-11 w-full accent-[var(--brasa)]"
              aria-valuetext={`${bemEstar[campo]} de 5`}
            />
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apl-obs">Observações (opcional)</Label>
        <Textarea id="apl-obs" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={registrar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-12" disabled={registrar.isPending || compostos.length === 0}>
          {registrar.isPending ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="check" size={18} />}
          {registrar.isPending ? 'Registrando…' : 'Confirmar aplicação'}
        </Button>
      </div>
    </form>
  )
}
