import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useRegistrarExame } from '@/hooks/use-health-metrics'
import { todayInSaoPaulo } from '@/lib/date'
import { abrirDocumentUpload } from '@/lib/document-upload-store'
import { mensagemDeErro } from '@/lib/feedback'
import { chaveDoNome, GRUPOS, MARCADORES, marcadoresDoGrupo, type GrupoMarcador } from '@/lib/health-markers'
import { cn } from '@/lib/utils'

type GrupoForm = GrupoMarcador | 'outro'

type Linha = {
  uid: number
  grupo: GrupoForm | null
  chave: string
  /** Só em "Outro": nome e unidade digitados. */
  nomeLivre: string
  unidadeLivre: string
  valor: string
}

let uidSeq = 0
const novaLinha = (grupo: GrupoForm | null = null): Linha => ({ uid: ++uidSeq, grupo, chave: '', nomeLivre: '', unidadeLivre: '', valor: '' })

const ROTULO_GRUPO: Record<GrupoForm, string> = {
  ...Object.fromEntries(GRUPOS.map((g) => [g.id, g.label.replace('Função ', '').replace('Hepática', 'Hepático')])),
  outro: 'Outro',
} as Record<GrupoForm, string>

type Erros = Record<number, { marcador?: string; valor?: string; nome?: string }>

/** Valida as linhas; devolve erros por linha (vazio = ok). */
function validar(linhas: Linha[]): Erros {
  const erros: Erros = {}
  const vistos = new Set<string>()
  for (const l of linhas) {
    const e: Erros[number] = {}
    if (l.grupo === 'outro') {
      if (!l.nomeLivre.trim()) e.nome = 'Informe o nome do marcador.'
    } else if (!l.chave) {
      e.marcador = 'Escolha o marcador.'
    }
    const chave = l.grupo === 'outro' ? chaveDoNome(l.nomeLivre) : l.chave
    if (chave && vistos.has(chave)) e.marcador = 'Marcador repetido neste exame.'
    if (chave) vistos.add(chave)
    const n = Number(l.valor.replace(',', '.'))
    if (l.valor.trim() === '') e.valor = 'Informe o valor.'
    else if (!Number.isFinite(n) || n < 0) e.valor = 'Valor inválido.'
    if (Object.keys(e).length > 0) erros[l.uid] = e
  }
  return erros
}

type Props = { open: boolean; onClose: () => void }

/** "＋ Registrar exame": escolher entre fotografar o laudo ou digitar os marcadores. */
export function RegistrarExameModal({ open, onClose }: Props) {
  const [modo, setModo] = useState<'escolha' | 'manual'>('escolha')

  function fechar() {
    setModo('escolha')
    onClose()
  }

  return (
    <Modal open={open} onClose={fechar} title="Registrar exame" maxWidth="lg" description={modo === 'escolha' ? 'Como você quer lançar os resultados?' : undefined}>
      {modo === 'escolha' ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              fechar()
              abrirDocumentUpload('exame')
            }}
            className="glass-card interactive flex min-h-24 flex-col items-start gap-2 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="photo_camera" size={28} className="text-brasa" />
            <span className="text-[15px] font-bold text-nevoa">Fotografar laudo</span>
            <span className="text-[13px] text-cinza">A IA lê os valores; você confere antes de salvar.</span>
          </button>
          <button
            type="button"
            onClick={() => setModo('manual')}
            className="glass-card interactive flex min-h-24 flex-col items-start gap-2 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="edit_note" size={28} className="text-brasa" />
            <span className="text-[15px] font-bold text-nevoa">Digitar manualmente</span>
            <span className="text-[13px] text-cinza">Escolha o grupo, o marcador e o valor.</span>
          </button>
        </div>
      ) : (
        <ExameManualForm onDone={fechar} onVoltar={() => setModo('escolha')} />
      )}
    </Modal>
  )
}

function ExameManualForm({ onDone, onVoltar }: { onDone: () => void; onVoltar: () => void }) {
  const registrar = useRegistrarExame()
  const [data, setData] = useState(todayInSaoPaulo())
  const [linhas, setLinhas] = useState<Linha[]>([novaLinha()])
  const [erros, setErros] = useState<Erros>({})
  const [erroData, setErroData] = useState<string | null>(null)

  function atualizar(uid: number, campos: Partial<Linha>) {
    setLinhas((ls) => ls.map((l) => (l.uid === uid ? { ...l, ...campos } : l)))
    setErros((e) => {
      if (!e[uid]) return e
      const { [uid]: _removido, ...resto } = e
      return resto
    })
  }

  function salvar(ev: React.FormEvent) {
    ev.preventDefault()
    const novosErros = validar(linhas)
    const dataInvalida = !data ? 'Informe a data da coleta.' : data > todayInSaoPaulo() ? 'A data não pode ser no futuro.' : null
    setErros(novosErros)
    setErroData(dataInvalida)
    if (Object.keys(novosErros).length > 0 || dataInvalida) return

    const leituras = linhas.map((l) => ({
      chave: l.grupo === 'outro' ? chaveDoNome(l.nomeLivre) : l.chave,
      valor: Number(l.valor.replace(',', '.')),
    }))
    const novasDefinicoes = linhas
      .filter((l) => l.grupo === 'outro')
      .map((l) => ({ chave: chaveDoNome(l.nomeLivre), label: l.nomeLivre.trim(), unidade: l.unidadeLivre.trim() || null }))

    registrar.mutate(
      { measuredAt: data, leituras, novasDefinicoes },
      {
        onSuccess: ({ inseridas, atualizadas }) => {
          const partes = [inseridas && `${inseridas} ${inseridas === 1 ? 'marcador salvo' : 'marcadores salvos'}`, atualizadas && `${atualizadas} atualizado${atualizadas === 1 ? '' : 's'}`]
          toast.success(`Exame registrado: ${partes.filter(Boolean).join(', ')}.`)
          onDone()
        },
        onError: (e) => toast.error(mensagemDeErro(e, 'registrar o exame')),
      },
    )
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <FormField label="Data da coleta" htmlFor="exame-data" erro={erroData}>
        <Input type="date" max={todayInSaoPaulo()} value={data} onChange={(e) => setData(e.target.value)} {...propsDeErro('exame-data', erroData)} />
      </FormField>

      <ol className="flex flex-col gap-3">
        {linhas.map((linha, i) => (
          <LinhaMarcador
            key={linha.uid}
            linha={linha}
            numero={i + 1}
            erros={erros[linha.uid]}
            podeRemover={linhas.length > 1}
            onChange={(campos) => atualizar(linha.uid, campos)}
            onRemover={() => setLinhas((ls) => ls.filter((l) => l.uid !== linha.uid))}
          />
        ))}
      </ol>

      <Button type="button" variant="outline" className="min-h-11 self-start" onClick={() => setLinhas((ls) => [...ls, novaLinha(ls.at(-1)?.grupo ?? null)])}>
        <Icon name="add" size={18} />
        Adicionar outro marcador
      </Button>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onVoltar} disabled={registrar.isPending}>
          <Icon name="arrow_back" size={18} />
          Voltar
        </Button>
        <Button type="submit" className="min-h-12" disabled={registrar.isPending}>
          {registrar.isPending ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="check" size={18} />}
          {registrar.isPending ? 'Salvando…' : `Salvar tudo (${linhas.length})`}
        </Button>
      </div>
    </form>
  )
}

type LinhaProps = {
  linha: Linha
  numero: number
  erros?: Erros[number]
  podeRemover: boolean
  onChange: (campos: Partial<Linha>) => void
  onRemover: () => void
}

function LinhaMarcador({ linha, numero, erros, podeRemover, onChange, onRemover }: LinhaProps) {
  const id = `exame-${linha.uid}`
  const def = linha.chave ? MARCADORES[linha.chave] : null
  const unidade = linha.grupo === 'outro' ? null : def?.unidade

  return (
    <li className="glass-card flex flex-col gap-3 !rounded-[var(--r-md)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="ds-label">Marcador {numero}</span>
        {podeRemover && (
          <Button type="button" variant="ghost" size="icon" aria-label={`Remover marcador ${numero}`} onClick={onRemover}>
            <Icon name="close" size={18} />
          </Button>
        )}
      </div>

      <div role="radiogroup" aria-label={`Grupo do marcador ${numero}`} className="flex flex-wrap gap-1.5">
        {([...GRUPOS.map((g) => g.id), 'outro'] as GrupoForm[]).map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={linha.grupo === g}
            onClick={() => onChange({ grupo: g, chave: '' })}
            className={cn(
              'min-h-9 rounded-full border px-3 text-[12px] font-semibold transition-colors',
              linha.grupo === g ? 'border-brasa bg-brasa/15 text-nevoa' : 'border-linha text-cinza hover:text-nevoa',
            )}
          >
            {ROTULO_GRUPO[g]}
          </button>
        ))}
      </div>

      {linha.grupo === 'outro' ? (
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <FormField label="Nome" htmlFor={`${id}-nome`} erro={erros?.nome ?? erros?.marcador}>
            <Input value={linha.nomeLivre} onChange={(e) => onChange({ nomeLivre: e.target.value })} placeholder="Ômega-3 índice" {...propsDeErro(`${id}-nome`, erros?.nome ?? erros?.marcador)} />
          </FormField>
          <FormField label="Unidade" htmlFor={`${id}-unidade`}>
            <Input id={`${id}-unidade`} value={linha.unidadeLivre} onChange={(e) => onChange({ unidadeLivre: e.target.value })} placeholder="%" />
          </FormField>
        </div>
      ) : (
        linha.grupo && (
          <FormField label="Marcador" htmlFor={`${id}-marcador`} erro={erros?.marcador}>
            <Select value={linha.chave} onChange={(e) => onChange({ chave: e.target.value })} {...propsDeErro(`${id}-marcador`, erros?.marcador)}>
              <option value="">Escolha…</option>
              {marcadoresDoGrupo(linha.grupo).map((m) => (
                <option key={m.chave} value={m.chave}>
                  {m.def.label}
                </option>
              ))}
            </Select>
          </FormField>
        )
      )}

      {linha.grupo && (
        <FormField label={unidade ? `Valor (${unidade})` : 'Valor'} htmlFor={`${id}-valor`} erro={erros?.valor} dica={def?.referencia ? `Referência ${def.referencia}` : undefined}>
          <Input inputMode="decimal" value={linha.valor} onChange={(e) => onChange({ valor: e.target.value })} placeholder="0" {...propsDeErro(`${id}-valor`, erros?.valor)} />
        </FormField>
      )}
      {!linha.grupo && <p className="text-[12px] text-cinza2-texto">Escolha o grupo para ver os marcadores.</p>}
    </li>
  )
}
