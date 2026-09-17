import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import {
  MAX_REFEICOES,
  useAtualizarRefeicao,
  useCriarRefeicao,
  useExcluirRefeicao,
  useSalvarPlano,
  type PlanoInput,
  type RefeicaoInput,
} from '@/hooks/use-diet-plan'
import {
  useAtualizarSugestao,
  useCriarSugestaoManual,
  useRemoverSugestao,
  useSugestoesDaRefeicao,
  type SugestaoManualInput,
} from '@/hooks/use-meal-suggestions'
import { mensagemDeErro } from '@/lib/feedback'
import type { DietPlan, MealSlot, MealSlotTipo, MealSuggestion } from '@/types/database'

/* ─────────────────────────────── utilidades ─────────────────────────────── */

const TIPOS_REFEICAO: { value: MealSlotTipo; label: string }[] = [
  { value: 'cafe_manha', label: 'Café da manhã' },
  { value: 'lanche', label: 'Lanche' },
  { value: 'almoco', label: 'Almoço' },
  { value: 'pre_treino', label: 'Pré-treino' },
  { value: 'pos_treino', label: 'Pós-treino' },
  { value: 'jantar', label: 'Jantar' },
]

const texto = (n: number | null | undefined) => (n == null ? '' : String(n))

type Macros = { kcal: string; p: string; c: string; g: string }
type ErrosMacros = Partial<Record<keyof Macros, string>>

/** Inteiro ≥ 0 ou vazio (null). Devolve [valor, erro]. */
function inteiroOpcional(v: string): [number | null, string | undefined] {
  if (v.trim() === '') return [null, undefined]
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? [Math.round(n), undefined] : [null, 'Número a partir de 0.']
}

function validarMacros(m: Macros) {
  const [kcal, eK] = inteiroOpcional(m.kcal)
  const [p, eP] = inteiroOpcional(m.p)
  const [c, eC] = inteiroOpcional(m.c)
  const [g, eG] = inteiroOpcional(m.g)
  return { valores: { kcal, p, c, g }, erros: { kcal: eK, p: eP, c: eC, g: eG } as ErrosMacros }
}

function CamposMacros({ prefixo, valores, erros, onChange }: { prefixo: string; valores: Macros; erros: ErrosMacros; onChange: (m: Macros) => void }) {
  const campo = (chave: keyof Macros, rotulo: string) => (
    <FormField label={rotulo} htmlFor={`${prefixo}-${chave}`} erro={erros[chave]}>
      <Input type="number" inputMode="numeric" min={0} value={valores[chave]} onChange={(e) => onChange({ ...valores, [chave]: e.target.value })} {...propsDeErro(`${prefixo}-${chave}`, erros[chave])} />
    </FormField>
  )
  return (
    <div className="grid grid-cols-2 gap-3">
      {campo('kcal', 'Calorias (kcal)')}
      {campo('p', 'Proteína (g)')}
      {campo('c', 'Carboidrato (g)')}
      {campo('g', 'Gordura (g)')}
    </div>
  )
}

function Rodape({ salvando, rotulo, onCancelar }: { salvando: boolean; rotulo: string; onCancelar: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="ghost" className="min-h-11" onClick={onCancelar} disabled={salvando}>
        Cancelar
      </Button>
      <Button type="submit" className="min-h-11" disabled={salvando}>
        {salvando && <Icon name="progress_activity" size={18} className="animate-spin" />}
        {salvando ? 'Salvando…' : rotulo}
      </Button>
    </div>
  )
}

/* ───────────────────────────── plano alimentar ───────────────────────────── */

export function PlanoAlimentarModal({ open, plano, onClose }: { open: boolean; plano: DietPlan | null; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={plano ? 'Plano alimentar' : 'Criar plano alimentar'} description="Metas diárias de calorias e macros">
      {open && <PlanoForm plano={plano} onClose={onClose} />}
    </Modal>
  )
}

function PlanoForm({ plano, onClose }: { plano: DietPlan | null; onClose: () => void }) {
  const salvar = useSalvarPlano()
  const [nome, setNome] = useState(plano?.nome ?? '')
  const [macros, setMacros] = useState<Macros>({ kcal: texto(plano?.calorias_alvo), p: texto(plano?.proteina_g), c: texto(plano?.carbo_g), g: texto(plano?.gordura_g) })
  const [erros, setErros] = useState<ErrosMacros & { nome?: string }>({})

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const { valores, erros: errosMacros } = validarMacros(macros)
    const novos = { ...errosMacros, nome: nome.trim() ? undefined : 'Dê um nome ao plano.' }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return
    const values: PlanoInput = { nome: nome.trim(), calorias_alvo: valores.kcal, proteina_g: valores.p, carbo_g: valores.c, gordura_g: valores.g }
    salvar.mutate(
      { id: plano?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(plano ? 'Metas do plano atualizadas.' : 'Plano alimentar criado.')
          onClose()
        },
        onError: (err) => toast.error(mensagemDeErro(err, 'salvar o plano')),
      },
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <FormField label="Nome do plano" htmlFor="plano-nome" erro={erros.nome}>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Recomposição — fase 1" {...propsDeErro('plano-nome', erros.nome)} />
      </FormField>
      <CamposMacros prefixo="plano" valores={macros} erros={erros} onChange={setMacros} />
      <Rodape salvando={salvar.isPending} rotulo="Salvar metas" onCancelar={onClose} />
    </form>
  )
}

/* ──────────────────────────────── refeições ──────────────────────────────── */

type RefeicaoModalProps = { open: boolean; dietPlanId: string; refeicao?: MealSlot; onClose: () => void }

export function RefeicaoModal({ open, dietPlanId, refeicao, onClose }: RefeicaoModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={refeicao ? `Editar ${refeicao.nome}` : 'Nova refeição'}>
      {open && <RefeicaoForm dietPlanId={dietPlanId} refeicao={refeicao} onClose={onClose} />}
    </Modal>
  )
}

function RefeicaoForm({ dietPlanId, refeicao, onClose }: Omit<RefeicaoModalProps, 'open'>) {
  const criar = useCriarRefeicao()
  const atualizar = useAtualizarRefeicao()
  const [nome, setNome] = useState(refeicao?.nome ?? '')
  const [horario, setHorario] = useState(refeicao?.horario_alvo?.slice(0, 5) ?? '')
  const [tipo, setTipo] = useState<MealSlotTipo | ''>(refeicao?.tipo ?? '')
  const [macros, setMacros] = useState<Macros>({ kcal: texto(refeicao?.calorias_alvo), p: texto(refeicao?.proteina_g_alvo), c: texto(refeicao?.carbo_g_alvo), g: texto(refeicao?.gordura_g_alvo) })
  const [erros, setErros] = useState<ErrosMacros & { nome?: string }>({})
  const salvando = criar.isPending || atualizar.isPending

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const { valores, erros: errosMacros } = validarMacros(macros)
    const novos = { ...errosMacros, nome: nome.trim() ? undefined : 'Dê um nome à refeição.' }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return
    const values: RefeicaoInput = {
      nome: nome.trim(),
      horario_alvo: horario || null,
      tipo: tipo || null,
      calorias_alvo: valores.kcal,
      proteina_g_alvo: valores.p,
      carbo_g_alvo: valores.c,
      gordura_g_alvo: valores.g,
    }
    const opcoes = {
      onSuccess: () => {
        toast.success(refeicao ? `${values.nome} atualizada.` : `${values.nome} adicionada ao plano.`)
        onClose()
      },
      onError: (err: unknown) => toast.error(mensagemDeErro(err, 'salvar a refeição')),
    }
    if (refeicao) atualizar.mutate({ id: refeicao.id, dietPlanId, values }, opcoes)
    else criar.mutate({ dietPlanId, values }, opcoes)
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" htmlFor="ref-nome" erro={erros.nome}>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Lanche da tarde" {...propsDeErro('ref-nome', erros.nome)} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Horário" htmlFor="ref-horario">
          <Input id="ref-horario" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
        </FormField>
        <FormField label="Tipo" htmlFor="ref-tipo">
          <Select id="ref-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as MealSlotTipo | '')}>
            <option value="">Sem tipo</option>
            {TIPOS_REFEICAO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <CamposMacros prefixo="ref" valores={macros} erros={erros} onChange={setMacros} />
      <Rodape salvando={salvando} rotulo={refeicao ? 'Salvar' : 'Adicionar refeição'} onCancelar={onClose} />
    </form>
  )
}

/** Botão "＋ Nova refeição" no fim da lista (respeita o limite de 6 do banco). */
export function NovaRefeicaoButton({ dietPlanId, total }: { dietPlanId: string; total: number }) {
  const [aberto, setAberto] = useState(false)
  const cheio = total >= MAX_REFEICOES
  return (
    <>
      <Button type="button" variant="outline" className="min-h-11 self-start" disabled={cheio} onClick={() => setAberto(true)}>
        <Icon name="add" size={18} />
        Nova refeição
      </Button>
      {cheio && <p className="text-[12px] text-cinza2-texto">O plano já tem {MAX_REFEICOES} refeições, o máximo permitido. Edite ou exclua uma para criar outra.</p>}
      <RefeicaoModal open={aberto} dietPlanId={dietPlanId} onClose={() => setAberto(false)} />
    </>
  )
}

/** Menu ⋮ da refeição: editar / excluir (excluir pede confirmação de dado crítico). */
export function RefeicaoMenu({ refeicao }: { refeicao: MealSlot }) {
  const [menu, setMenu] = useState(false)
  const [editando, setEditando] = useState(false)
  const excluir = useExcluirRefeicao()
  const { confirm, dialog } = useConfirm()

  async function confirmarExclusao() {
    setMenu(false)
    const ok = await confirm({
      title: `Excluir ${refeicao.nome}?`,
      description: 'A refeição e as sugestões salvas dela saem do plano. Não dá para desfazer.',
      critico: true,
    })
    if (!ok) return
    excluir.mutate(
      { id: refeicao.id, dietPlanId: refeicao.diet_plan_id },
      {
        onSuccess: () => toast.success(`${refeicao.nome} excluída.`),
        onError: (err) => toast.error(err instanceof Error && err.message.includes('histórico') ? err.message : mensagemDeErro(err, 'excluir a refeição')),
      },
    )
  }

  return (
    <>
      {dialog}
      <Button type="button" variant="ghost" size="icon" className="-my-2 text-cinza" aria-label={`Ações de ${refeicao.nome}`} onClick={() => setMenu(true)}>
        <Icon name="more_vert" size={20} />
      </Button>
      <Modal open={menu} onClose={() => setMenu(false)} title={refeicao.nome} maxWidth="sm">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 justify-start"
            onClick={() => {
              setMenu(false)
              setEditando(true)
            }}
          >
            <Icon name="edit" size={20} />
            Editar refeição
          </Button>
          <Button type="button" variant="outline" className="min-h-12 justify-start text-alerta-texto hover:text-alerta-texto" onClick={() => void confirmarExclusao()}>
            <Icon name="delete" size={20} />
            Excluir refeição
          </Button>
        </div>
      </Modal>
      <RefeicaoModal open={editando} dietPlanId={refeicao.diet_plan_id} refeicao={refeicao} onClose={() => setEditando(false)} />
    </>
  )
}

/* ──────────────────────────────── sugestões ──────────────────────────────── */

/** Sugestões salvas da refeição (recolhível): adicionar, editar e remover. */
export function SugestoesDaRefeicao({ refeicao }: { refeicao: MealSlot }) {
  const sugestoes = useSugestoesDaRefeicao(refeicao.id)
  const remover = useRemoverSugestao()
  const { confirm, dialog } = useConfirm()
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState<MealSuggestion | 'nova' | null>(null)
  const total = sugestoes.data?.length ?? 0

  async function removerSugestao(s: MealSuggestion) {
    const ok = await confirm({ title: `Remover a sugestão ${s.nome}?`, confirmLabel: 'Remover' })
    if (!ok) return
    remover.mutate(
      { id: s.id, mealSlotId: refeicao.id },
      { onSuccess: () => toast.success('Sugestão removida.'), onError: (err) => toast.error(mensagemDeErro(err, 'remover a sugestão')) },
    )
  }

  return (
    <div className="w-full">
      {dialog}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--r-sm)] px-1 text-[13px] font-semibold text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-1.5">
          <Icon name="restaurant" size={16} />
          Sugestões salvas{total > 0 ? ` (${total})` : ''}
        </span>
        <Icon name="expand_more" size={18} className={aberto ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {aberto && (
        <div className="mt-1 flex flex-col gap-2">
          {sugestoes.isLoading ? (
            <p className="text-[13px] text-cinza">Carregando…</p>
          ) : total === 0 ? (
            <p className="text-[13px] text-cinza">Nenhuma sugestão salva para esta refeição.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-linha">
              {sugestoes.data!.map((s) => (
                <li key={s.id} className="flex items-center gap-2 py-2">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] font-semibold text-nevoa">{s.nome}</span>
                    <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">
                      {[s.calorias != null && `${s.calorias} kcal`, s.proteina_g != null && `P${s.proteina_g}`, s.carbo_g != null && `C${s.carbo_g}`, s.gordura_g != null && `G${s.gordura_g}`].filter(Boolean).join(' · ') || 'sem macros'}
                    </span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Editar sugestão ${s.nome}`} onClick={() => setEditando(s)}>
                    <Icon name="edit" size={18} />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="text-cinza hover:text-alerta-texto" aria-label={`Remover sugestão ${s.nome}`} onClick={() => void removerSugestao(s)}>
                    <Icon name="delete" size={18} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" variant="outline" size="sm" className="min-h-11 self-start" onClick={() => setEditando('nova')}>
            <Icon name="add" size={16} />
            Nova sugestão
          </Button>
        </div>
      )}

      <Modal open={editando !== null} onClose={() => setEditando(null)} title={editando === 'nova' ? `Nova sugestão — ${refeicao.nome}` : 'Editar sugestão'}>
        {editando !== null && <SugestaoForm refeicao={refeicao} sugestao={editando === 'nova' ? undefined : editando} onClose={() => setEditando(null)} />}
      </Modal>
    </div>
  )
}

function SugestaoForm({ refeicao, sugestao, onClose }: { refeicao: MealSlot; sugestao?: MealSuggestion; onClose: () => void }) {
  const criar = useCriarSugestaoManual()
  const atualizar = useAtualizarSugestao()
  const [nome, setNome] = useState(sugestao?.nome ?? '')
  const [descricao, setDescricao] = useState(sugestao?.descricao ?? '')
  const [macros, setMacros] = useState<Macros>({ kcal: texto(sugestao?.calorias), p: texto(sugestao?.proteina_g), c: texto(sugestao?.carbo_g), g: texto(sugestao?.gordura_g) })
  const [erros, setErros] = useState<ErrosMacros & { nome?: string }>({})
  const salvando = criar.isPending || atualizar.isPending

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const { valores, erros: errosMacros } = validarMacros(macros)
    const novos = { ...errosMacros, nome: nome.trim() ? undefined : 'Dê um nome à sugestão.' }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return
    const values: SugestaoManualInput = { nome: nome.trim(), descricao: descricao.trim() || null, calorias: valores.kcal, proteina_g: valores.p, carbo_g: valores.c, gordura_g: valores.g }
    const opcoes = {
      onSuccess: () => {
        toast.success(sugestao ? 'Sugestão atualizada.' : 'Sugestão salva.')
        onClose()
      },
      onError: (err: unknown) => toast.error(mensagemDeErro(err, 'salvar a sugestão')),
    }
    if (sugestao) atualizar.mutate({ id: sugestao.id, mealSlotId: refeicao.id, values }, opcoes)
    else criar.mutate({ mealSlotId: refeicao.id, values }, opcoes)
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" htmlFor="sug-nome" erro={erros.nome}>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Omelete com aveia" {...propsDeErro('sug-nome', erros.nome)} />
      </FormField>
      <FormField label="Descrição (opcional)" htmlFor="sug-descricao">
        <Textarea id="sug-descricao" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="3 ovos, 40 g de aveia, 1 banana" />
      </FormField>
      <CamposMacros prefixo="sug" valores={macros} erros={erros} onChange={setMacros} />
      <Rodape salvando={salvando} rotulo={sugestao ? 'Salvar' : 'Salvar sugestão'} onCancelar={onClose} />
    </form>
  )
}
