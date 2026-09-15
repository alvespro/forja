import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { FONTES, type FonteAlimento, type ProdutoAlimento } from '@/lib/food-sources'
import { supabase } from '@/lib/supabase'

import { useAuth } from './use-auth'

const DEBOUNCE_MS = 400
const MIN_CHARS = 2
const RECENTES_KEY = 'forja:off:recentes'
const MAX_RECENTES = 20

/** Filtro da busca: `null` = cascata TACO → OFF → USDA → IA. */
export type FiltroFonte = Extract<FonteAlimento, 'taco' | 'off' | 'usda'> | null

/* ---------------------------------- recentes --------------------------------- */

/**
 * Recentes gravados antes do multi-banco só tinham `barcode` (eram todos do OFF):
 * completa id/fonte/badge para seguirem funcionando.
 */
function normalizarProduto(p: Partial<ProdutoAlimento> & Pick<ProdutoAlimento, 'nome' | 'por_100g'>): ProdutoAlimento {
  const fonte: FonteAlimento = p.fonte && p.fonte in FONTES ? p.fonte : 'off'
  return {
    id: p.id ?? p.barcode ?? p.nome,
    barcode: p.barcode ?? null,
    nome: p.nome,
    marca: p.marca ?? null,
    nutriscore: p.nutriscore ?? null,
    nova_group: p.nova_group ?? null,
    imagem_url: p.imagem_url ?? null,
    categoria: p.categoria ?? null,
    fonte,
    badge: p.badge ?? FONTES[fonte].badge,
    confianca: p.confianca ?? FONTES[fonte].confianca,
    por_100g: p.por_100g,
  }
}

export function lerRecentes(): ProdutoAlimento[] {
  try {
    const raw = localStorage.getItem(RECENTES_KEY)
    return raw ? (JSON.parse(raw) as ProdutoAlimento[]).map(normalizarProduto) : []
  } catch {
    return []
  }
}

function gravarRecente(produto: ProdutoAlimento) {
  try {
    const atuais = lerRecentes().filter((p) => p.id !== produto.id)
    localStorage.setItem(RECENTES_KEY, JSON.stringify([produto, ...atuais].slice(0, MAX_RECENTES)))
  } catch {
    // localStorage indisponível (aba privada): recentes viram um extra opcional.
  }
}

/* --------------------------------- favoritos --------------------------------- */

export type FoodFavorito = {
  id: string
  nome: string
  marca: string | null
  fonte: string
  ref_externa: string | null
  off_barcode: string | null
  nutriscore: string | null
  nova_group: number | null
  imagem_url: string | null
  calorias_100g: number | null
  proteina_100g: number | null
  carbo_100g: number | null
  gordura_100g: number | null
  fibra_100g: number | null
  acucar_100g: number | null
}

export function useFavoriteFoods() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foods', 'favoritos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foods')
        .select(
          'id, nome, marca, fonte, ref_externa, off_barcode, nutriscore, nova_group, imagem_url, calorias_100g, proteina_100g, carbo_100g, gordura_100g, fibra_100g, acucar_100g',
        )
        .eq('favorito', true)
        .order('nome')
      if (error) throw error
      return data as FoodFavorito[]
    },
    enabled: !!user,
  })
}

/** Chave que liga uma linha de `foods` ao produto da busca (favoritos antigos só têm off_barcode). */
export function chaveDoFood(food: Pick<FoodFavorito, 'id' | 'ref_externa' | 'off_barcode'>): string {
  return food.ref_externa ?? food.off_barcode ?? food.id
}

/** Converte uma linha de `foods` de volta ao formato de produto usado na UI. */
export function foodParaProduto(food: FoodFavorito): ProdutoAlimento {
  return normalizarProduto({
    id: chaveDoFood(food),
    barcode: food.off_barcode,
    nome: food.nome,
    marca: food.marca,
    nutriscore: food.nutriscore,
    nova_group: food.nova_group,
    imagem_url: food.imagem_url,
    fonte: food.fonte as FonteAlimento,
    por_100g: {
      calorias: food.calorias_100g,
      proteina: food.proteina_100g,
      carbo: food.carbo_100g,
      gordura: food.gordura_100g,
      fibra: food.fibra_100g,
      sodio: null,
      acucar: food.acucar_100g,
      gordura_saturada: null,
    },
  })
}

/* ------------------------------ upsert em foods ------------------------------ */

/** Garante uma linha em `foods` para o produto da busca (qualquer fonte) e devolve o id. */
export function useUpsertFoodFromSearch() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useCallback(
    async (produto: ProdutoAlimento): Promise<string> => {
      if (!user) throw new Error('Usuário não autenticado')

      const { data: porRef } = await supabase
        .from('foods')
        .select('id')
        .eq('ref_externa', produto.id)
        .limit(1)
        .maybeSingle()
      // Linhas do OFF criadas antes do multi-banco só têm off_barcode.
      const existing =
        porRef ??
        (produto.fonte === 'off' && produto.barcode
          ? (await supabase.from('foods').select('id').eq('off_barcode', produto.barcode).limit(1).maybeSingle()).data
          : null)

      const values = {
        nome: produto.nome,
        marca: produto.marca,
        fonte: produto.fonte,
        ref_externa: produto.id,
        off_barcode: produto.fonte === 'off' ? produto.barcode : null,
        barcode: produto.barcode,
        categoria: produto.categoria,
        nutriscore: produto.nutriscore,
        nova_group: produto.nova_group,
        imagem_url: produto.imagem_url,
        calorias_100g: produto.por_100g.calorias,
        proteina_100g: produto.por_100g.proteina,
        carbo_100g: produto.por_100g.carbo,
        gordura_100g: produto.por_100g.gordura,
        fibra_100g: produto.por_100g.fibra,
        sodio_100g: produto.por_100g.sodio,
        acucar_100g: produto.por_100g.acucar,
        gordura_saturada_100g: produto.por_100g.gordura_saturada,
      }

      if (existing?.id) {
        const { error } = await supabase.from('foods').update(values).eq('id', existing.id)
        if (error) throw error
        gravarRecente(produto)
        return existing.id as string
      }

      const { data: created, error } = await supabase
        .from('foods')
        .insert({ ...values, user_id: user.id })
        .select('id')
        .single()
      if (error) throw error

      gravarRecente(produto)
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      return created.id as string
    },
    [user, queryClient],
  )
}

/**
 * Quantos produtos NOVA 4 (ultraprocessados) já foram registrados na data.
 * Depende do vínculo meal_logs.food_id → foods.
 */
export async function contarUltraprocessadosHoje(data: string): Promise<number> {
  const { data: rows, error } = await supabase.from('meal_logs').select('foods(nova_group)').eq('data', data)
  if (error) return 0
  return (rows ?? []).filter((row) => {
    const f = (row as { foods?: { nova_group: number | null } | { nova_group: number | null }[] }).foods
    const nova = Array.isArray(f) ? f[0]?.nova_group : f?.nova_group
    return nova === 4
  }).length
}

export function useToggleFavorito() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ foodId, favorito }: { foodId: string; favorito: boolean }) => {
      const { error } = await supabase.from('foods').update({ favorito }).eq('id', foodId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foods'] }),
  })
}

/* --------------------------------- a busca ---------------------------------- */

export function useFoodSearch() {
  const [resultados, setResultados] = useState<ProdutoAlimento[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [filtro, setFiltroState] = useState<FiltroFonte>(null)
  const [origem, setOrigem] = useState<FonteAlimento | null>(null)
  const [recentes, setRecentes] = useState<ProdutoAlimento[]>(() => lerRecentes())

  const queryAtual = useRef('')
  const modoAtual = useRef<'nome' | 'barcode'>('nome')
  const filtroAtual = useRef<FiltroFonte>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const executar = useCallback(
    async (modo: 'nome' | 'barcode', query: string, page: number, acrescentar: boolean) => {
      setCarregando(true)
      setErro(null)
      try {
        const { data, error } = await supabase.functions.invoke('search-food', {
          body: { modo, query, pagina: page, fonte: filtroAtual.current ?? undefined },
        })
        if (error) throw error
        // Resposta atrasada de um termo que o usuário já trocou: descarta.
        if (query !== queryAtual.current.trim()) return
        const produtos = ((data?.produtos ?? []) as ProdutoAlimento[]).map(normalizarProduto)
        setOrigem((data?.origem as FonteAlimento | null) ?? null)
        setResultados((anteriores) => (acrescentar ? [...anteriores, ...produtos] : produtos))
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível buscar alimentos.')
        if (!acrescentar) setResultados([])
      } finally {
        if (query === queryAtual.current.trim()) setCarregando(false)
      }
    },
    [],
  )

  const buscarPorNome = useCallback(
    (query: string) => {
      queryAtual.current = query
      modoAtual.current = 'nome'
      if (timer.current) clearTimeout(timer.current)

      if (query.trim().length < MIN_CHARS) {
        setResultados([])
        setOrigem(null)
        setCarregando(false)
        return
      }

      timer.current = setTimeout(() => {
        setPagina(1)
        void executar('nome', query.trim(), 1, false)
      }, DEBOUNCE_MS)
    },
    [executar],
  )

  const buscarPorBarcode = useCallback(
    (barcode: string) => {
      if (timer.current) clearTimeout(timer.current)
      queryAtual.current = barcode
      modoAtual.current = 'barcode'
      setPagina(1)
      void executar('barcode', barcode.trim(), 1, false)
    },
    [executar],
  )

  /** Troca o filtro de fonte e refaz a busca do termo atual (código de barras ignora o filtro). */
  const setFiltro = useCallback(
    (novo: FiltroFonte) => {
      filtroAtual.current = novo
      setFiltroState(novo)
      const termo = queryAtual.current.trim()
      if (modoAtual.current === 'nome' && termo.length >= MIN_CHARS) {
        if (timer.current) clearTimeout(timer.current)
        setPagina(1)
        void executar('nome', termo, 1, false)
      }
    },
    [executar],
  )

  const proximaPagina = useCallback(() => {
    const page = pagina + 1
    setPagina(page)
    void executar('nome', queryAtual.current.trim(), page, true)
  }, [executar, pagina])

  const limpar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    queryAtual.current = ''
    setResultados([])
    setErro(null)
    setOrigem(null)
    setPagina(1)
    setCarregando(false)
  }, [])

  const atualizarRecentes = useCallback(() => setRecentes(lerRecentes()), [])

  return {
    resultados,
    carregando,
    erro,
    pagina,
    filtro,
    origem,
    recentes,
    buscarPorNome,
    buscarPorBarcode,
    setFiltro,
    proximaPagina,
    limpar,
    atualizarRecentes,
  }
}
