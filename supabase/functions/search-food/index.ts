// search-food — busca de alimentos em cascata, com cache compartilhado (foods_cache):
//   1. TACO/UNICAMP (in natura brasileiros, importada no banco)
//   2. Open Food Facts (embalados; código de barras sempre começa aqui)
//   3. USDA FoodData Central
//   4. Estimativa por IA (último recurso, cacheada pelo termo)
// Filtro `fonte` ('taco' | 'off' | 'usda') pula a cascata e consulta só aquela base.
// Toda fonte externa degrada para o cache quando cai ou estoura o timeout.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

import {
  estimativaPlausivel,
  FONTES,
  fromCache,
  fromOff,
  fromUsda,
  macrosPlausiveis,
  nomeCasaComConsulta,
  normalizarConsulta,
  type EstimativaIa,
  type FonteAlimento,
  type ProdutoAlimento,
} from '../_shared/foods.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
// DEMO_KEY é limitada por IP (poucas dezenas de chamadas/hora); USDA_API_KEY gratuita libera 1.000/h.
const USDA_API_KEY = Deno.env.get('USDA_API_KEY') ?? 'DEMO_KEY'

// O Open Food Facts exige identificação da aplicação em toda chamada.
const USER_AGENT = 'FORJA-App/1.0 (welber@prime.com.br)'
const EXTERNAL_TIMEOUT_MS = 8000
const IA_TIMEOUT_MS = 20000
const CACHE_TTL_DAYS = 7
const PAGE_SIZE = 10
const IA_MODEL = 'claude-sonnet-4-6'

const OFF_FIELDS =
  'code,product_name,product_name_pt,generic_name,brands,nutriscore_grade,nova_group,image_front_small_url,nutriments,countries'

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

// deno-lint-ignore no-explicit-any
type Json = any

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = EXTERNAL_TIMEOUT_MS): Promise<Json | null> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) {
      // Sem a chave/URL no log: só host e status (ex.: USDA 429 com DEMO_KEY).
      console.error('fonte externa', new URL(url).host, res.status)
      await res.body?.cancel()
      return null
    }
    const tipo = res.headers.get('content-type') ?? ''
    // O OFF responde página HTML ("temporarily unavailable") com status 200/503.
    if (!tipo.includes('json')) {
      await res.body?.cancel()
      return null
    }
    return await res.json()
  } catch {
    return null
  }
}

function porCacheRow(p: ProdutoAlimento) {
  return {
    nome: p.nome,
    marca: p.marca,
    calorias_100g: p.por_100g.calorias,
    proteina_100g: p.por_100g.proteina,
    carbo_100g: p.por_100g.carbo,
    gordura_100g: p.por_100g.gordura,
    fibra_100g: p.por_100g.fibra,
    sodio_100g: p.por_100g.sodio,
    acucar_100g: p.por_100g.acucar,
    gordura_saturada_100g: p.por_100g.gordura_saturada,
    nutriscore: p.nutriscore,
    nova_group: p.nova_group,
    imagem_url: p.imagem_url,
    categoria: p.categoria,
    fonte: p.fonte,
    confianca: p.confianca,
    cached_at: new Date().toISOString(),
  }
}

async function buscarNoCache(sb: SupabaseClient, termo: string, fonte: FonteAlimento, limite: number) {
  const { data, error } = await sb.rpc('search_foods_cache', { q: termo, p_fonte: fonte, p_limit: limite })
  if (error) {
    console.error('search_foods_cache', error.message)
    return []
  }
  return (data ?? []).map(fromCache)
}

/** Deduplica por id preservando a ordem (cache conhecido antes da API). */
function unicos(produtos: ProdutoAlimento[]): ProdutoAlimento[] {
  const vistos = new Set<string>()
  return produtos.filter((p) => (vistos.has(p.id) ? false : (vistos.add(p.id), true)))
}

// ───────────────────────────── fontes ─────────────────────────────

async function buscarTaco(sb: SupabaseClient, termo: string, limite: number) {
  return buscarNoCache(sb, termo, 'taco', limite)
}

async function buscarOff(sb: SupabaseClient, termo: string, pagina: number) {
  const query = encodeURIComponent(termo)
  const [doCache, novo] = await Promise.all([
    pagina === 1 ? buscarNoCache(sb, termo, 'off', 5) : Promise.resolve([]),
    fetchJson(
      `https://search.openfoodfacts.org/search?q=${query}&langs=pt&page=${pagina}&page_size=${PAGE_SIZE}&fields=${OFF_FIELDS}`,
      { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } },
    ).then(
      // search.pl (legado) segue como reserva: em 14/09/2026 respondia 503.
      async (json) =>
        json ??
        fetchJson(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&lc=pt&cc=br&page_size=${PAGE_SIZE}&page=${pagina}`,
          { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } },
        ),
    ),
  ])

  const brutos: Json[] = Array.isArray(novo?.hits) ? novo.hits : Array.isArray(novo?.products) ? novo.products : []
  const daApi: ProdutoAlimento[] = []
  const linhas: Json[] = []
  for (const raw of brutos) {
    const produto = fromOff(raw)
    if (!produto) continue
    daApi.push(produto)
    linhas.push({ ...porCacheRow(produto), barcode: produto.barcode, pais: raw?.countries ?? null, off_data: raw })
  }
  if (linhas.length > 0) {
    const { error } = await sb.from('foods_cache').upsert(linhas, { onConflict: 'barcode' })
    if (error) console.error('upsert off', error.message)
  }
  // Na lista só entra o que é relevante e registrável (o cache guarda tudo).
  const utilizaveis = unicos([...doCache, ...daApi]).filter(
    (p) => macrosPlausiveis(p.por_100g) && nomeCasaComConsulta(p.nome, p.marca, termo),
  )
  return { produtos: utilizaveis, apiRespondeu: novo != null }
}

async function buscarUsda(sb: SupabaseClient, termo: string) {
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(termo)}` +
    `&dataType=Foundation,SR%20Legacy&pageSize=5&api_key=${encodeURIComponent(USDA_API_KEY)}`
  const [doCache, json] = await Promise.all([buscarNoCache(sb, termo, 'usda', 5), fetchJson(url)])

  const daApi: ProdutoAlimento[] = []
  for (const food of Array.isArray(json?.foods) ? json.foods : []) {
    const produto = fromUsda(food)
    if (produto) daApi.push(produto)
  }
  if (daApi.length > 0) {
    const linhas = daApi.map((p) => ({ ...porCacheRow(p), usda_fdc_id: p.id.slice('usda:'.length), pais: 'us' }))
    const { error } = await sb.from('foods_cache').upsert(linhas, { onConflict: 'usda_fdc_id' })
    if (error) console.error('upsert usda', error.message)
  }
  return unicos([...doCache, ...daApi]).filter((p) => macrosPlausiveis(p.por_100g))
}

const IA_SCHEMA = {
  type: 'object',
  properties: {
    reconhecido: { type: 'boolean', description: 'false se o termo não for um alimento ou bebida identificável' },
    nome: { type: 'string', description: 'Nome do alimento em português, com o preparo quando fizer diferença' },
    calorias_100g: { type: 'number' },
    proteina_100g: { type: 'number' },
    carbo_100g: { type: 'number' },
    gordura_100g: { type: 'number' },
    fibra_100g: { type: 'number' },
  },
  required: ['reconhecido', 'nome', 'calorias_100g', 'proteina_100g', 'carbo_100g', 'gordura_100g', 'fibra_100g'],
  additionalProperties: false,
}

async function estimarComIa(sb: SupabaseClient, termo: string): Promise<ProdutoAlimento[]> {
  const consulta = normalizarConsulta(termo)
  if (!consulta) return []

  const { data: cacheado } = await sb
    .from('foods_cache')
    .select('*')
    .eq('fonte', 'ia_estimado')
    .eq('consulta', consulta)
    .maybeSingle()
  if (cacheado) return [fromCache(cacheado)]
  if (!ANTHROPIC_API_KEY) return []

  const json = await fetchJson(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: IA_MODEL,
        max_tokens: 1024,
        system:
          'Você estima composição nutricional de alimentos para um app brasileiro de nutrição. ' +
          'Use como base tabelas nutricionais padrão brasileiras (TACO/TBCA) e, na falta delas, referências internacionais. ' +
          'Valores por 100 g do alimento como normalmente consumido. Se o termo não for um alimento ou bebida, marque reconhecido=false.',
        messages: [{ role: 'user', content: `Estime os valores nutricionais por 100g de: ${termo}` }],
        output_config: { format: { type: 'json_schema', schema: IA_SCHEMA } },
      }),
    },
    IA_TIMEOUT_MS,
  )
  if (!json || json.stop_reason === 'refusal') return []

  let estimativa: EstimativaIa
  try {
    const texto = json.content?.find((b: Json) => b.type === 'text')?.text
    estimativa = JSON.parse(texto)
  } catch {
    return []
  }
  if (!estimativaPlausivel(estimativa)) return []

  const round1 = (n: number) => Math.round(n * 10) / 10
  const linha = {
    nome: estimativa.nome.trim(),
    consulta,
    fonte: 'ia_estimado',
    confianca: 'estimada',
    pais: 'br',
    calorias_100g: Math.round(estimativa.calorias_100g),
    proteina_100g: round1(estimativa.proteina_100g),
    carbo_100g: round1(estimativa.carbo_100g),
    gordura_100g: round1(estimativa.gordura_100g),
    fibra_100g: round1(estimativa.fibra_100g),
    off_data: { modelo: IA_MODEL, termo },
    cached_at: new Date().toISOString(),
  }
  const { data: salvo, error } = await sb.from('foods_cache').upsert(linha, { onConflict: 'consulta' }).select('*').single()
  if (error) console.error('upsert ia', error.message)
  return [fromCache(salvo ?? linha)]
}

// ───────────────────────────── handler ─────────────────────────────

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

    const { modo, query, pagina, fonte } = await req.json().catch(() => ({}))
    const termo = String(query ?? '').trim()
    if (!termo) return jsonResponse({ produtos: [], total: 0 })

    // O cache é compartilhado entre usuários: escrita só com service role.
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (modo === 'barcode') {
      const { data: cached } = await sb.from('foods_cache').select('*').eq('barcode', termo).maybeSingle()
      const fresh =
        cached && Date.now() - new Date(cached.cached_at).getTime() < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
      if (fresh) return jsonResponse({ produtos: [fromCache(cached)], total: 1, origem: 'off', cache: true })

      const json = await fetchJson(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(termo)}.json?fields=${OFF_FIELDS}`,
        { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } },
      )
      const product = json?.status === 1 ? json.product : null
      const produto = product ? fromOff(product) : null

      if (!produto) {
        // API falhou ou não achou: devolve o cache vencido, se houver.
        if (cached) return jsonResponse({ produtos: [fromCache(cached)], total: 1, origem: 'off', cache: true })
        return jsonResponse({ produtos: [], total: 0, origem: 'off' })
      }

      const { error } = await sb
        .from('foods_cache')
        .upsert(
          { ...porCacheRow(produto), barcode: produto.barcode, pais: product?.countries ?? null, off_data: product },
          { onConflict: 'barcode' },
        )
      if (error) console.error('upsert barcode', error.message)
      return jsonResponse({ produtos: [produto], total: 1, origem: 'off' })
    }

    // ── modo "nome" ──
    const page = Math.max(1, Number(pagina) || 1)
    const filtro = fonte === 'taco' || fonte === 'off' || fonte === 'usda' ? (fonte as FonteAlimento) : null
    const responder = (produtos: ProdutoAlimento[], origem: FonteAlimento | null, cascata: FonteAlimento[]) =>
      jsonResponse({
        produtos,
        total: produtos.length,
        pagina: page,
        origem,
        badge: origem ? FONTES[origem].badge : null,
        cascata,
      })

    if (filtro === 'taco') return responder(await buscarTaco(sb, termo, 20), 'taco', ['taco'])
    if (filtro === 'off') return responder((await buscarOff(sb, termo, page)).produtos, 'off', ['off'])
    if (filtro === 'usda') return responder(await buscarUsda(sb, termo), 'usda', ['usda'])

    // Cascata. "Carregar mais" (página 2+) só existe no OFF, que pagina.
    if (page > 1) return responder((await buscarOff(sb, termo, page)).produtos, 'off', ['off'])

    const taco = await buscarTaco(sb, termo, 5)
    if (taco.length > 0) return responder(taco, 'taco', ['taco'])

    const off = await buscarOff(sb, termo, 1)
    if (off.produtos.length > 0) return responder(off.produtos, 'off', ['taco', 'off'])

    const usda = await buscarUsda(sb, termo)
    if (usda.length > 0) return responder(usda, 'usda', ['taco', 'off', 'usda'])

    const ia = await estimarComIa(sb, termo)
    return responder(ia, ia.length > 0 ? 'ia_estimado' : null, ['taco', 'off', 'usda', 'ia_estimado'])
  } catch (error) {
    console.error('search-food', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro inesperado' }, 500)
  }
})
