// search-food — busca de alimentos no Open Food Facts com cache local.
// Modo "barcode": cache (válido por 7 dias) → API OFF → upsert no cache.
// Modo "nome": cache (full-text pt) + API OFF em paralelo, deduplicado por barcode.
// Degrada para o cache quando a API do OFF está fora ou estoura o timeout.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// O Open Food Facts exige identificação da aplicação em toda chamada.
const USER_AGENT = 'FORJA-App/1.0 (welber@prime.com.br)'
const OFF_TIMEOUT_MS = 8000
const CACHE_TTL_DAYS = 7

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

type Produto = {
  barcode: string
  nome: string
  marca: string | null
  nutriscore: string | null
  nova_group: number | null
  imagem_url: string | null
  por_100g: {
    calorias: number | null
    proteina: number | null
    carbo: number | null
    gordura: number | null
    fibra: number | null
    sodio: number | null
    acucar: number | null
    gordura_saturada: number | null
  }
}

// deno-lint-ignore no-explicit-any
type Json = any

function num(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Converte um produto cru da API do OFF no formato normalizado do FORJA. */
function fromOff(product: Json): Produto | null {
  const barcode = String(product?.code ?? product?._id ?? '').trim()
  const nome = String(product?.product_name_pt || product?.product_name || product?.generic_name || '').trim()
  if (!barcode || !nome) return null

  const n = product?.nutriments ?? {}
  return {
    barcode,
    nome,
    marca: product?.brands ? String(product.brands) : null,
    nutriscore: product?.nutriscore_grade ? String(product.nutriscore_grade).toLowerCase() : null,
    nova_group: num(product?.nova_group),
    imagem_url: product?.image_front_small_url ? String(product.image_front_small_url) : null,
    por_100g: {
      calorias: num(n['energy-kcal_100g']),
      proteina: num(n['proteins_100g']),
      carbo: num(n['carbohydrates_100g']),
      gordura: num(n['fat_100g']),
      fibra: num(n['fiber_100g']),
      sodio: num(n['sodium_100g']),
      acucar: num(n['sugars_100g']),
      gordura_saturada: num(n['saturated-fat_100g']),
    },
  }
}

/** Converte uma linha do cache no formato normalizado. */
function fromCache(row: Json): Produto {
  return {
    barcode: row.barcode,
    nome: row.nome,
    marca: row.marca ?? null,
    nutriscore: row.nutriscore ?? null,
    nova_group: row.nova_group ?? null,
    imagem_url: row.imagem_url ?? null,
    por_100g: {
      calorias: num(row.calorias_100g),
      proteina: num(row.proteina_100g),
      carbo: num(row.carbo_100g),
      gordura: num(row.gordura_100g),
      fibra: num(row.fibra_100g),
      sodio: num(row.sodio_100g),
      acucar: num(row.acucar_100g),
      gordura_saturada: num(row.gordura_saturada_100g),
    },
  }
}

function cacheRow(produto: Produto, pais: string | null, raw: Json) {
  return {
    barcode: produto.barcode,
    nome: produto.nome,
    marca: produto.marca,
    pais,
    calorias_100g: produto.por_100g.calorias,
    proteina_100g: produto.por_100g.proteina,
    carbo_100g: produto.por_100g.carbo,
    gordura_100g: produto.por_100g.gordura,
    fibra_100g: produto.por_100g.fibra,
    sodio_100g: produto.por_100g.sodio,
    acucar_100g: produto.por_100g.acucar,
    gordura_saturada_100g: produto.por_100g.gordura_saturada,
    nutriscore: produto.nutriscore,
    nova_group: produto.nova_group,
    imagem_url: produto.imagem_url,
    off_data: raw,
    cached_at: new Date().toISOString(),
  }
}

async function fetchOff(url: string): Promise<Json | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(OFF_TIMEOUT_MS),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    // OFF fora do ar ou timeout: quem chama cai para o cache.
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await sbUser.auth.getUser()
    if (!user) return jsonResponse({ error: 'Não autenticado' }, 401)

    const { modo, query, pagina } = await req.json().catch(() => ({}))
    const termo = String(query ?? '').trim()
    if (!termo) return jsonResponse({ produtos: [], total: 0 })

    // O cache é compartilhado entre usuários: escrita com service role.
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (modo === 'barcode') {
      const { data: cached } = await sb
        .from('off_foods_cache')
        .select('*')
        .eq('barcode', termo)
        .maybeSingle()

      const fresh =
        cached &&
        Date.now() - new Date(cached.cached_at).getTime() < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
      if (fresh) return jsonResponse({ produtos: [fromCache(cached)], total: 1, origem: 'cache' })

      const json = await fetchOff(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(termo)}.json`)
      const product = json?.status === 1 ? json.product : null
      const produto = product ? fromOff(product) : null

      if (!produto) {
        // API falhou ou não achou: devolve o cache vencido, se houver.
        if (cached) return jsonResponse({ produtos: [fromCache(cached)], total: 1, origem: 'cache_stale' })
        return jsonResponse({ produtos: [], total: 0 })
      }

      await sb
        .from('off_foods_cache')
        .upsert(cacheRow(produto, product?.countries ?? null, product), { onConflict: 'barcode' })

      return jsonResponse({ produtos: [produto], total: 1, origem: 'off' })
    }

    // modo "nome"
    const page = Math.max(1, Number(pagina) || 1)
    const searchUrl =
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}` +
      `&search_simple=1&action=process&json=1&lc=pt&cc=br&page_size=10&page=${page}`

    const [cacheRes, offJson] = await Promise.all([
      sb
        .from('off_foods_cache')
        .select('*')
        .textSearch('nome', termo, { type: 'plain', config: 'portuguese' })
        .limit(5),
      fetchOff(searchUrl),
    ])

    const doCache: Produto[] = (cacheRes.data ?? []).map(fromCache)

    const offProducts: Json[] = Array.isArray(offJson?.products) ? offJson.products : []
    const doOff: Produto[] = []
    for (const raw of offProducts) {
      const produto = fromOff(raw)
      if (produto) doOff.push(produto)
    }

    if (doOff.length > 0) {
      const rows = doOff.map((p, i) => cacheRow(p, offProducts[i]?.countries ?? null, offProducts[i]))
      await sb.from('off_foods_cache').upsert(rows, { onConflict: 'barcode' })
    }

    // Cache primeiro (já conhecido), depois a API, sem repetir barcode.
    const vistos = new Set<string>()
    const produtos: Produto[] = []
    for (const p of [...doCache, ...doOff]) {
      if (vistos.has(p.barcode)) continue
      vistos.add(p.barcode)
      produtos.push(p)
    }

    return jsonResponse({
      produtos,
      total: produtos.length,
      pagina: page,
      origem: offJson ? 'off+cache' : 'cache',
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro inesperado' }, 500)
  }
})
