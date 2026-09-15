import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, Keyboard, Plus, Search, Star } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { FoodSourceBadge } from '@/components/nutrition/food-source-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/use-confirm'
import { useCreateMealLog } from '@/hooks/use-meal-logs'
import {
  chaveDoFood,
  contarUltraprocessadosHoje,
  foodParaProduto,
  useFavoriteFoods,
  useFoodSearch,
  useFoodShortcuts,
  useToggleFavorito,
  useUpsertFoodFromSearch,
  type FiltroFonte,
} from '@/hooks/useFoodSearch'
import { todayInSaoPaulo } from '@/lib/date'
import {
  alertaAcucarNoJantar,
  calcularMacros,
  gramasDaPorcao,
  isUltraprocessado,
  NOVA_CLASS,
  NOVA_LABEL,
  nutriscoreClass,
  nutriscoreRuim,
  UNIDADES,
  type ProdutoAlimento,
  type UnidadeValue,
} from '@/lib/off'
import { cn } from '@/lib/utils'
import type { MealSlot } from '@/types/database'

const FILTROS: { label: string; valor: FiltroFonte }[] = [
  { label: 'Todos', valor: null },
  { label: '🇧🇷 In natura', valor: 'taco' },
  { label: '📦 Embalados', valor: 'off' },
  { label: '🔬 Científico', valor: 'usda' },
]

const EMOJI_FONTE = { taco: '🥗', off: '📦', usda: '🔬', ia_estimado: '🤖' } as const

type FoodSearchProps = {
  open: boolean
  onClose: () => void
  slots: MealSlot[]
  defaultSlotId: string | null
}

export function FoodSearch({ open, onClose, slots, defaultSlotId }: FoodSearchProps) {
  const search = useFoodSearch()
  const favoritos = useFavoriteFoods()
  const atalhos = useFoodShortcuts()
  const [aba, setAba] = useState<'buscar' | 'favoritos'>('buscar')
  const [termo, setTermo] = useState('')
  const [scannerAberto, setScannerAberto] = useState(false)
  const [selecionado, setSelecionado] = useState<ProdutoAlimento | null>(null)

  function fechar() {
    setTermo('')
    setSelecionado(null)
    setScannerAberto(false)
    search.limpar()
    onClose()
  }

  function handleTermo(valor: string) {
    setTermo(valor)
    // Só dígitos e tamanho de EAN: trata como código de barras.
    if (/^\d{8,14}$/.test(valor.trim())) search.buscarPorBarcode(valor.trim())
    else search.buscarPorNome(valor)
  }

  const lista = aba === 'favoritos' ? (favoritos.data ?? []).map(foodParaProduto) : search.resultados
  const temAtalhos = (atalhos.data?.recentes.length ?? 0) + (atalhos.data?.frequentes.length ?? 0) > 0
  const mostrandoAtalhos = aba === 'buscar' && termo.trim().length < 2 && temAtalhos

  if (selecionado) {
    return (
      <PortionModal
        open={open}
        produto={selecionado}
        slots={slots}
        defaultSlotId={defaultSlotId}
        onVoltar={() => setSelecionado(null)}
        onClose={fechar}
        onRegistrado={fechar}
      />
    )
  }

  return (
    <Modal open={open} onClose={fechar} title="Buscar alimento" maxWidth="lg">
      {scannerAberto ? (
        <BarcodeScanner
          onDetect={(code) => {
            setScannerAberto(false)
            setTermo(code)
            search.buscarPorBarcode(code)
          }}
          onCancel={() => setScannerAberto(false)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Busca + câmera */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-aco-texto" aria-hidden="true" />
              <Input
                autoFocus
                value={termo}
                onChange={(e) => handleTermo(e.target.value)}
                placeholder="Buscar alimento ou código de barras..."
                className="pl-8"
                aria-label="Buscar alimento"
              />
            </div>
            <Button type="button" variant="outline" size="icon" aria-label="Escanear código de barras" onClick={() => setScannerAberto(true)}>
              <Camera className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Abas */}
          <div className="flex gap-1 border-b border-border pb-2">
            {(['buscar', 'favoritos'] as const).map((id) => (
              <Button
                key={id}
                type="button"
                role="tab"
                aria-selected={aba === id}
                variant={aba === id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setAba(id)}
              >
                {id === 'buscar' ? 'Buscar' : '⭐ Favoritos'}
              </Button>
            ))}
          </div>

          {aba === 'buscar' && (
            <div role="group" aria-label="Filtrar por fonte" className="ds-scroll -mx-1 flex gap-2 overflow-x-auto px-1">
              {FILTROS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  aria-pressed={search.filtro === f.valor}
                  onClick={() => search.setFiltro(f.valor)}
                  className={cn(
                    'flex min-h-11 shrink-0 items-center rounded-full border px-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    search.filtro === f.valor ? 'border-brasa bg-brasa/15 text-foreground' : 'border-linha text-aco-texto',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {search.erro && <p className="text-xs text-alerta">{search.erro}</p>}

          {search.carregando ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : mostrandoAtalhos ? (
            <div className="flex flex-col gap-4">
              <AtalhosSecao titulo="Recentes" itens={atalhos.data?.recentes ?? []} onSelecionar={setSelecionado} />
              <AtalhosSecao titulo="Frequentes no mês" itens={atalhos.data?.frequentes ?? []} onSelecionar={setSelecionado} />
            </div>
          ) : lista.length === 0 ? (
            <EmptyState
              message={
                aba === 'favoritos'
                  ? 'Nenhum favorito ainda. Toque na estrela em um resultado.'
                  : termo.trim().length < 2
                    ? 'Digite ao menos 2 letras ou escaneie um código de barras.'
                    : search.filtro
                      ? `Nada encontrado em ${FILTROS.find((f) => f.valor === search.filtro)?.label}. Tente "Todos".`
                      : 'Nenhum alimento encontrado em nenhuma base. Tente o código de barras ou verifique a grafia.'
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {lista.map((p) => (
                <ProdutoCard key={p.id} produto={p} onSelecionar={() => setSelecionado(p)} />
              ))}
              {aba === 'buscar' && search.resultados.length >= 10 && (
                <Button type="button" variant="outline" size="sm" onClick={search.proximaPagina}>
                  Carregar mais
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

/* ---------------------------------- atalhos ---------------------------------- */

/** Linha de 1 toque: o alimento que você come todo dia, direto para a porção. */
function AtalhosSecao({
  titulo,
  itens,
  onSelecionar,
}: {
  titulo: string
  itens: { foodId: string; produto: ProdutoAlimento }[]
  onSelecionar: (produto: ProdutoAlimento) => void
}) {
  if (itens.length === 0) return null
  return (
    <section className="flex flex-col gap-1.5">
      <span className="ds-label">{titulo}</span>
      <ul className="flex flex-col divide-y divide-linha overflow-hidden rounded-lg border border-border bg-card/60">
        {itens.map(({ foodId, produto }) => (
          <li key={foodId}>
            <button
              type="button"
              onClick={() => onSelecionar(produto)}
              className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left outline-none hover:bg-aco focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="text-lg" aria-hidden="true">
                {EMOJI_FONTE[produto.fonte]}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{produto.nome}</span>
                <span className="font-mono text-[11px] text-aco-texto">
                  {produto.por_100g.calorias ?? '—'} kcal · P{produto.por_100g.proteina ?? '—'} /100g
                </span>
              </span>
              <Plus className="size-4 shrink-0 text-brasa" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------- card de produto ------------------------------ */

function ProdutoCard({ produto, onSelecionar }: { produto: ProdutoAlimento; onSelecionar: () => void }) {
  const favoritos = useFavoriteFoods()
  const upsertFood = useUpsertFoodFromSearch()
  const toggleFav = useToggleFavorito()

  const favorito = (favoritos.data ?? []).find((f) => chaveDoFood(f) === produto.id)
  const p = produto.por_100g

  async function handleFavoritar(event: React.MouseEvent) {
    event.stopPropagation()
    try {
      const foodId = favorito?.id ?? (await upsertFood(produto))
      await toggleFav.mutateAsync({ foodId, favorito: !favorito })
    } catch {
      toast.error('Não foi possível favoritar.')
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3">
      {produto.imagem_url ? (
        <img src={produto.imagem_url} alt="" loading="lazy" className="size-14 shrink-0 rounded-md border border-border object-cover" />
      ) : (
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-aco text-xl"
          aria-hidden="true"
        >
          {EMOJI_FONTE[produto.fonte]}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-sm font-medium text-foreground">{produto.nome}</span>
        {produto.marca && <span className="truncate text-xs text-aco-texto">🏷️ {produto.marca}</span>}
        <FoodSourceBadge fonte={produto.fonte} />

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Nutri-Score só existe para embalados (OFF). */}
          {produto.fonte === 'off' && (
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', nutriscoreClass(produto.nutriscore))}>
              {produto.nutriscore ? produto.nutriscore.toUpperCase() : 'N/D'}
            </span>
          )}
          {produto.nova_group != null && NOVA_LABEL[produto.nova_group] && (
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', NOVA_CLASS[produto.nova_group])}>
              {NOVA_LABEL[produto.nova_group]}
            </span>
          )}
        </div>

        <span className="font-mono text-[11px] text-aco-texto">
          {p.calorias ?? '—'} kcal · P{p.proteina ?? '—'} C{p.carbo ?? '—'} G{p.gordura ?? '—'} /100g
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleFavoritar}
          aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className="rounded p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star className={cn('size-4', favorito ? 'fill-brasa text-brasa' : 'text-aco-texto')} aria-hidden="true" />
        </button>
        <Button type="button" size="sm" onClick={onSelecionar}>
          Adicionar
        </Button>
      </div>
    </div>
  )
}

/* --------------------------------- porção ----------------------------------- */

function PortionModal({
  open,
  produto,
  slots,
  defaultSlotId,
  onVoltar,
  onClose,
  onRegistrado,
}: {
  open: boolean
  produto: ProdutoAlimento
  slots: MealSlot[]
  defaultSlotId: string | null
  onVoltar: () => void
  onClose: () => void
  onRegistrado: () => void
}) {
  const [quantidade, setQuantidade] = useState(100)
  const [unidade, setUnidade] = useState<UnidadeValue>('g')
  const [slotId, setSlotId] = useState<string>(defaultSlotId ?? slots[0]?.id ?? '')
  const [salvando, setSalvando] = useState(false)

  const upsertFood = useUpsertFoodFromSearch()
  const createLog = useCreateMealLog()
  const { confirm, dialog } = useConfirm()

  const porUnidade = unidade === 'g' || unidade === 'ml'
  const max = porUnidade ? 500 : 10
  const min = porUnidade ? 10 : 1
  const step = porUnidade ? 10 : 1

  const gramas = gramasDaPorcao(quantidade, unidade)
  const macros = useMemo(() => calcularMacros(produto.por_100g, gramas), [produto.por_100g, gramas])
  const slot = slots.find((s) => s.id === slotId) ?? null

  // Ao trocar a unidade, recoloca a quantidade dentro da faixa válida.
  useEffect(() => {
    setQuantidade((q) => Math.min(Math.max(q, min), max))
  }, [min, max])

  async function adicionar() {
    if (alertaAcucarNoJantar(produto, slot?.numero ?? null)) {
      const ok = await confirm({
        title: '🚨 Alto teor de açúcar no jantar',
        description: 'Sua glicemia de jejum é 103 mg/dL. Confirmar mesmo assim?',
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
      })
      if (!ok) return
    }

    setSalvando(true)
    try {
      const foodId = await upsertFood(produto)
      await createLog.mutateAsync({
        meal_slot_id: slotId || null,
        data: todayInSaoPaulo(),
        descricao: `${produto.nome} (${gramas}${porUnidade ? unidade : 'g'})`,
        calorias: macros.calorias,
        proteina_g: macros.proteina,
        carbo_g: macros.carbo,
        gordura_g: macros.gordura,
        food_id: foodId,
        fonte: produto.fonte === 'ia_estimado' ? 'ia_estimado' : 'foods_cache',
      })

      toast.success(`✅ ${produto.nome} adicionado${slot ? ` ao ${slot.nome}` : ''} — ${macros.calorias} kcal`)

      if (isUltraprocessado(produto)) {
        toast.warning('⚠️ Produto ultraprocessado — NOVA grupo 4')
        const total = await contarUltraprocessadosHoje(todayInSaoPaulo())
        if (total > 1) {
          toast.warning(`⚠️ ${total} ultraprocessados hoje — objetivo de recomposição requer alimentação mais limpa`)
        }
      }
      if (nutriscoreRuim(produto)) {
        toast.warning(`⚠️ Nutri-Score ${produto.nutriscore?.toUpperCase()} — considere uma alternativa`)
      }

      onRegistrado()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível registrar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={produto.nome} description={produto.marca ?? undefined} maxWidth="md">
      {dialog}
      <div className="flex flex-col gap-4">
        {produto.imagem_url && (
          <img src={produto.imagem_url} alt="" className="mx-auto h-28 rounded-lg border border-border object-contain" />
        )}

        <FoodSourceBadge fonte={produto.fonte} />
        {produto.fonte === 'ia_estimado' && (
          <p className="rounded-lg border border-atencao/40 bg-atencao/10 p-2 text-xs text-foreground">
            Valores estimados por IA — se tiver a embalagem ou uma tabela, prefira o registro manual.
          </p>
        )}

        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="fs-qtd">Quantidade</Label>
            <Input
              id="fs-qtd"
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value) || min)}
            />
          </div>
          <div className="flex w-36 flex-col gap-1.5">
            <Label htmlFor="fs-unidade">Unidade</Label>
            <Select id="fs-unidade" value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeValue)}>
              {UNIDADES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="w-full accent-brasa"
          aria-label="Ajustar quantidade"
        />

        <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
          <p className="font-mono text-sm text-foreground">
            Para {gramas}
            {porUnidade ? unidade : 'g'}: <span className="text-brasa">{macros.calorias} kcal</span> | {macros.proteina}g prot |{' '}
            {macros.carbo}g carbo | {macros.gordura}g gord
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fs-slot">Refeição</Label>
          <Select id="fs-slot" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
                {s.horario_alvo ? ` — ${s.horario_alvo.slice(0, 5)}` : ''}
              </option>
            ))}
          </Select>
        </div>

        <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-between gap-2 border-t border-border bg-card px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onVoltar} disabled={salvando}>
            Voltar
          </Button>
          <Button type="button" size="sm" onClick={adicionar} disabled={salvando}>
            {salvando ? 'Adicionando…' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* --------------------------------- scanner ---------------------------------- */

function BarcodeScanner({ onDetect, onCancel }: { onDetect: (code: string) => void; onCancel: () => void }) {
  const elementId = useRef(`fs-scanner-${Math.random().toString(36).slice(2)}`)
  const [erro, setErro] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null
    let encerrado = false

    void (async () => {
      try {
        // Import dinâmico: mantém a lib de scanner fora do bundle inicial do PWA.
        const { Html5Qrcode } = await import('html5-qrcode')
        const instancia = new Html5Qrcode(elementId.current)
        scanner = instancia
        await instancia.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (texto) => {
            if (encerrado) return
            encerrado = true
            onDetect(texto)
          },
          () => {},
        )
      } catch {
        setErro('Não foi possível abrir a câmera. Use "Digitar manualmente".')
      }
    })()

    return () => {
      encerrado = true
      scanner?.stop().then(() => scanner?.clear()).catch(() => {})
    }
  }, [onDetect])

  return (
    <div className="flex flex-col gap-3">
      {!erro && (
        <div className="relative overflow-hidden rounded-lg border border-border bg-black">
          <div id={elementId.current} className="w-full" />
          {/* Linha de scan animada */}
          <div className="pointer-events-none absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-brasa" aria-hidden="true" />
        </div>
      )}

      {erro && <p className="text-sm text-alerta">{erro}</p>}

      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="fs-manual">Digitar manualmente</Label>
          <Input
            id="fs-manual"
            inputMode="numeric"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="789…"
          />
        </div>
        <Button type="button" size="sm" disabled={manual.trim().length < 8} onClick={() => onDetect(manual.trim())}>
          <Keyboard className="size-3.5" aria-hidden="true" />
          Buscar
        </Button>
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  )
}
