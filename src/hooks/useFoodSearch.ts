import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { ProdutoOFF } from '@/lib/off'

import { useAuth } from './use-auth'

const DEBOUNCE_MS = 400
const MIN_CHARS = 2
const RECENTES_KEY = 'forja:off:recentes'
const MAX_RECENTES = 20

/* ---------------------------------- recentes --------------------------------- */

export function lerRecentes(): ProdutoOFF[] {
  try {
    const raw = localStorage.getItem(RECENTES_KEY)
    return raw ? (JSON.parse(raw) as ProdutoOFF[]) : []
  } catch {
    return []
  }
}

function gravarRecente(produto: ProdutoOFF) {
  try {
    const atuais = lerRecentes().filter((p) => p.barcode !== produto.barcode)
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
  off_barcode: string | null
  nutriscore: string | null
  nova_group: number | null
  imagem_url: string | null
  calorias_100g: number | null
  proteina_100g: number | null
  carbo_100g: number | null
  gordura_100g: number | null
  acucar_100g: number | null
}

export function useFavoriteFoods() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foods', 'favoritos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foods')
        .select('id, nome, marca, off_barcode, nutriscore, nova_group, imagem_url, calorias_100g, proteina_100g, carbo_100g, gordura_100g, acucar_100g')
        .eq('favorito', true)
        .order('nome')
      if (error) throw error
      return data as FoodFavorito[]
    },
    enabled: !!user,
  })
}

/** Converte uma linha de `foods` de volta ao formato de produto usado na UI. */
export function foodParaProduto(food: FoodFavorito): ProdutoOFF {
  return {
    barcode: food.off_barcode ?? food.id,
    nome: food.nome,
    marca: food.marca,
    nutriscore: food.nutriscore,
    nova_group: food.nova_group,
    imagem_url: food.imagem_url,
    por_100g: {
      calorias: food.calorias_100g,
      proteina: food.proteina_100g,
      carbo: food.carbo_100g,
      gordura: food.gordura_100g,
      fibra: null,
      sodio: null,
      acucar: food.acucar_100g,
      gordura_saturada: null,
    },
  }
}

/* ------------------------------ upsert em foods ------------------------------ */

/** Garante uma linha em `foods` para o produto do OFF e devolve o id. */
export function useUpsertFoodFromOff() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useCallback(
    async (produto: ProdutoOFF): Promise<string> => {
      if (!user) throw new Error('Usuário não autenticado')

      const { data: existing } = await supabase
        .from('foods')
        .select('id')
        .eq('off_barcode', produto.barcode)
        .limit(1)
        .maybeSingle()

      const values = {
        nome: produto.nome,
        marca: produto.marca,
        fonte: 'off',
        off_barcode: produto.barcode,
        barcode: produto.barcode,
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
  const [resultados, setResultados] = useState<ProdutoOFF[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [recentes, setRecentes] = useState<ProdutoOFF[]>(() => lerRecentes())

  const queryAtual = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const executar = useCallback(
    async (modo: 'nome' | 'barcode', query: string, page: number, acrescentar: boolean) => {
      setCarregando(true)
      setErro(null)
      try {
        const { data, error } = await supabase.functions.invoke('search-food', {
          body: { modo, query, pagina: page },
        })
        if (error) throw error
        const produtos = (data?.produtos ?? []) as ProdutoOFF[]
        setResultados((anteriores) => (acrescentar ? [...anteriores, ...produtos] : produtos))
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível buscar alimentos.')
        if (!acrescentar) setResultados([])
      } finally {
        setCarregando(false)
      }
    },
    [],
  )

  const buscarPorNome = useCallback(
    (query: string) => {
      queryAtual.current = query
      if (timer.current) clearTimeout(timer.current)

      if (query.trim().length < MIN_CHARS) {
        setResultados([])
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
      setPagina(1)
      void executar('barcode', barcode.trim(), 1, false)
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
    setPagina(1)
    setCarregando(false)
  }, [])

  const atualizarRecentes = useCallback(() => setRecentes(lerRecentes()), [])

  return {
    resultados,
    carregando,
    erro,
    pagina,
    recentes,
    buscarPorNome,
    buscarPorBarcode,
    proximaPagina,
    limpar,
    atualizarRecentes,
  }
}
