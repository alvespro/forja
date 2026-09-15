// exercise-import — biblioteca de exercícios via ExerciseDB (RapidAPI, API clássica
// `exercisedb.p.rapidapi.com`), cache-first: a API só é consultada para buscar/importar;
// o app sempre lê de `exercises`.
//   busca       { query? | grupo? }            → resultados (não grava)
//   importar    { exercisedb_id, exercise_id? } → atualiza o exercício do FORJA ou cria um novo
//   sync_seed   {}                              → exercícios-base + mobilidade + rotinas
// A API clássica não tem vídeo e só entrega o GIF com a chave: o GIF é baixado uma vez e
// guardado no bucket público `exercise-media` (compartilhado entre usuários, poupa a cota).
// Nome, instruções e descrição são traduzidos para pt-BR (a API é só em inglês).
// Gravações em `exercises`/`mobility_routines` usam o JWT do usuário (RLS).

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

import {
  buildExerciseRow,
  duracaoRotinaMin,
  montarRotina,
  normalizeExercise,
  ROTINAS_PADRAO,
  type Candidato,
  type ExerciseDBExercise,
  type Traducao,
} from '../_shared/exercisedb.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EXERCISEDB_API_KEY = Deno.env.get('EXERCISEDB_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com'
const BASE_URL = `https://${RAPIDAPI_HOST}`
// O plano básico da RapidAPI só libera GIF em 180px.
const GIF_RESOLUCAO = '180'
const BUCKET = 'exercise-media'
const PASTA_GIF = 'exercisedb'
const API_TIMEOUT_MS = 10000
const IA_MODEL = 'claude-sonnet-4-6'
const IA_TIMEOUT_MS = 60000

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

// deno-lint-ignore no-explicit-any
type Json = any

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

// ─────────────────────────────── ExerciseDB ───────────────────────────────

async function edbFetch(path: string): Promise<Response> {
  if (!EXERCISEDB_API_KEY) {
    throw new HttpError(503, 'ExerciseDB não configurado: adicione o secret EXERCISEDB_API_KEY no Supabase.')
  }
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-RapidAPI-Key': EXERCISEDB_API_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })
  } catch {
    throw new HttpError(504, 'ExerciseDB não respondeu a tempo. Tente de novo.')
  }
  if (!res.ok && res.status !== 404) {
    const texto = (await res.text()).slice(0, 200)
    console.error('exercisedb', path, res.status, texto)
    if (res.status === 401 || res.status === 403) {
      throw new HttpError(502, 'ExerciseDB recusou a chave (EXERCISEDB_API_KEY inválida ou sem assinatura da ExerciseDB).')
    }
    if (res.status === 429) throw new HttpError(429, 'Limite de chamadas do ExerciseDB atingido. Tente mais tarde.')
    throw new HttpError(502, `ExerciseDB respondeu ${res.status}.`)
  }
  return res
}

async function edbLista(path: string): Promise<ExerciseDBExercise[]> {
  const res = await edbFetch(path)
  if (res.status === 404) return []
  const json = await res.json()
  const itens: Json[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
  return itens.map(normalizeExercise).filter((e): e is ExerciseDBExercise => e !== null)
}

async function porId(id: string): Promise<ExerciseDBExercise> {
  const res = await edbFetch(`/exercises/exercise/${encodeURIComponent(id)}`)
  const ex = res.status === 404 ? null : normalizeExercise(await res.json())
  if (!ex) throw new HttpError(404, 'Exercício não encontrado no ExerciseDB.')
  return ex
}

const seg = (s: string) => encodeURIComponent(s.toLowerCase().trim())

// Chips de grupo da UI → endpoint da API clássica.
const GRUPO_PARA_API: Record<string, string> = {
  peito: '/exercises/bodyPart/chest?limit=25',
  costas: '/exercises/bodyPart/back?limit=25',
  pernas: '/exercises/bodyPart/upper%20legs?limit=25',
  ombros: '/exercises/bodyPart/shoulders?limit=25',
  biceps: '/exercises/target/biceps?limit=25',
  triceps: '/exercises/target/triceps?limit=25',
  core: '/exercises/target/abs?limit=25',
  gluteo: '/exercises/target/glutes?limit=25',
  panturrilha: '/exercises/target/calves?limit=25',
}

// ─────────────────────────────── GIF em cache ───────────────────────────────

const admin = () => createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function urlPublicaGif(id: string) {
  return admin().storage.from(BUCKET).getPublicUrl(`${PASTA_GIF}/${id}.gif`).data.publicUrl
}

async function gifsEmCache(): Promise<Set<string>> {
  const { data } = await admin().storage.from(BUCKET).list(PASTA_GIF, { limit: 1000 })
  return new Set((data ?? []).map((f) => f.name.replace(/\.gif$/, '')))
}

/** Garante o GIF no Storage (1 chamada à API só na primeira vez) e devolve a URL pública. */
async function garantirGif(id: string, cache?: Set<string>): Promise<string | null> {
  if (cache?.has(id)) return urlPublicaGif(id)
  try {
    const res = await edbFetch(`/image?exerciseId=${encodeURIComponent(id)}&resolution=${GIF_RESOLUCAO}`)
    if (!res.ok) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    const { error } = await admin()
      .storage.from(BUCKET)
      .upload(`${PASTA_GIF}/${id}.gif`, bytes, { contentType: 'image/gif', upsert: true })
    if (error) {
      console.error('upload gif', id, error.message)
      return null
    }
    cache?.add(id)
    return urlPublicaGif(id)
  } catch (err) {
    // Sem GIF o exercício continua útil (instruções, músculos): não derruba o import.
    if (err instanceof HttpError && err.status === 429) throw err
    console.error('gif', id, String(err))
    return null
  }
}

// ─────────────────────────────── tradução ───────────────────────────────

const TRADUCAO_SCHEMA = {
  type: 'object',
  properties: {
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          instrucoes: { type: 'array', items: { type: 'string' } },
          dicas: { type: 'array', items: { type: 'string' } },
          variacoes: { type: 'array', items: { type: 'string' } },
          descricao: { type: 'string' },
        },
        required: ['id', 'nome', 'instrucoes', 'dicas', 'variacoes', 'descricao'],
        additionalProperties: false,
      },
    },
  },
  required: ['itens'],
  additionalProperties: false,
}

type TraducaoCompleta = Traducao & { descricao: string }

/**
 * Traduz em lote. `completo=false` traduz só o nome. Falha na IA nunca bloqueia
 * o import: devolve mapa vazio e fica o texto original.
 */
async function traduzir(exs: ExerciseDBExercise[], completo: boolean): Promise<Map<string, TraducaoCompleta>> {
  const mapa = new Map<string, TraducaoCompleta>()
  if (!ANTHROPIC_API_KEY || exs.length === 0) return mapa

  const entrada = exs.map((e) =>
    completo
      ? { id: e.exercisedb_id, name: e.nome_original, instructions: e.instructions, tips: e.tips, variations: e.variations, description: e.overview ?? '' }
      : { id: e.exercisedb_id, name: e.nome_original },
  )
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(IA_TIMEOUT_MS),
      body: JSON.stringify({
        model: IA_MODEL,
        max_tokens: completo ? 16000 : 4000,
        system:
          'Você traduz exercícios de academia do inglês para o português do Brasil, como um personal trainer brasileiro diria. ' +
          'Nomes: use o termo consagrado nas academias brasileiras (ex.: "barbell bench press" → "Supino Reto com Barra", ' +
          '"cable pulldown" → "Puxada Alta", "barbell romanian deadlift" → "Levantamento Terra Romeno", "cat stretch" → ' +
          '"Alongamento do Gato"), com a primeira letra de cada palavra principal em maiúscula. ' +
          'Instruções, dicas, variações e descrição: tradução fiel, frases curtas e imperativas, mantenha ordem e quantidade de itens. ' +
          (completo ? '' : 'Nesta tarefa traduza só o nome e devolva listas e descrição vazias.'),
        messages: [{ role: 'user', content: JSON.stringify(entrada) }],
        output_config: { format: { type: 'json_schema', schema: TRADUCAO_SCHEMA } },
      }),
    })
    if (!res.ok) {
      console.error('traducao', res.status, (await res.text()).slice(0, 200))
      return mapa
    }
    const json = await res.json()
    if (json.stop_reason === 'refusal' || json.stop_reason === 'max_tokens') return mapa
    const texto = json.content?.find((b: Json) => b.type === 'text')?.text
    for (const item of JSON.parse(texto).itens ?? []) {
      if (item?.id && item?.nome) mapa.set(item.id, item)
    }
  } catch (err) {
    console.error('traducao falhou', String(err))
  }
  return mapa
}

async function traduzirEmLotes(exs: ExerciseDBExercise[], completo: boolean, tamanho: number) {
  const lotes: ExerciseDBExercise[][] = []
  for (let i = 0; i < exs.length; i += tamanho) lotes.push(exs.slice(i, i + tamanho))
  const mapas = await Promise.all(lotes.map((l) => traduzir(l, completo)))
  return new Map(mapas.flatMap((m) => [...m.entries()]))
}

// ─────────────────────────────── modos ───────────────────────────────

async function modoBusca(sb: SupabaseClient, body: Json) {
  const query = String(body.query ?? '').trim()
  const grupo = String(body.grupo ?? '').trim().toLowerCase()
  if (!query && !GRUPO_PARA_API[grupo]) throw new HttpError(400, 'Informe um termo de busca ou um grupo muscular.')

  const [resultados, cache] = await Promise.all([
    query ? edbLista(`/exercises/name/${seg(query)}?limit=15`) : edbLista(GRUPO_PARA_API[grupo]),
    gifsEmCache(),
  ])

  // Cache-first: marca o que o usuário já tem importado.
  const ids = resultados.map((r) => r.exercisedb_id)
  const { data: locais } = ids.length
    ? await sb.from('exercises').select('id, exercisedb_id').in('exercisedb_id', ids)
    : { data: [] }
  const localPorId = new Map((locais ?? []).map((l: Json) => [l.exercisedb_id, l.id]))

  return {
    resultados: resultados.map((r) => {
      const row = buildExerciseRow(r)
      return {
        exercisedb_id: r.exercisedb_id,
        nome_original: r.nome_original,
        grupo_muscular: row.grupo_muscular,
        categoria: row.categoria,
        equipamento: row.equipamento,
        alvo: r.targetMuscles[0] ?? null,
        nivel: r.nivel,
        // Miniatura só do que já está no Storage: buscar GIF de cada resultado gastaria a cota.
        gif_url: cache.has(r.exercisedb_id) ? urlPublicaGif(r.exercisedb_id) : null,
        imagem_url: null,
        video_url: null,
        exercise_id: localPorId.get(r.exercisedb_id) ?? null,
      }
    }),
  }
}

async function importarUm(sb: SupabaseClient, userId: string, exercisedbId: string, exerciseId: string | null) {
  const ex = await porId(exercisedbId)
  const [traducoes, gif] = await Promise.all([traduzir([ex], true), garantirGif(ex.exercisedb_id)])
  const traducao = traducoes.get(ex.exercisedb_id) ?? null
  const row = { ...buildExerciseRow(ex, traducao), gif_url: gif }
  const resumo = (traducao?.descricao || ex.overview)?.slice(0, 500) ?? null

  if (exerciseId) {
    const { data: atual, error: errAtual } = await sb.from('exercises').select('id, cues').eq('id', exerciseId).maybeSingle()
    if (errAtual) throw errAtual
    if (!atual) throw new HttpError(404, 'Exercício do FORJA não encontrado.')
    // O nome em pt-BR do usuário e os cues escritos à mão são mantidos.
    const { data, error } = await sb
      .from('exercises')
      .update({ ...row, cues: atual.cues ?? resumo })
      .eq('id', exerciseId)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await sb
    .from('exercises')
    .upsert({ ...row, user_id: userId, nome: traducao?.nome ?? ex.nome_original, cues: resumo }, { onConflict: 'user_id,exercisedb_id' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** Exercícios-base do seed → termo de busca no ExerciseDB (nomes da API clássica). */
const SEED_FORCA: { termo: string; local: string }[] = [
  { termo: 'barbell bench press', local: 'Supino Reto com Barra' },
  { termo: 'barbell full squat', local: 'Agachamento Livre' },
  { termo: 'cable pulldown', local: 'Pulldown / Puxada Frontal' },
  { termo: 'barbell romanian deadlift', local: 'Stiff (Levantamento Terra Romeno)' },
  { termo: 'dumbbell seated shoulder press', local: 'Desenvolvimento com Halteres' },
  { termo: 'barbell curl', local: 'Rosca Direta com Barra' },
]

/** Nome exato do termo; senão, o que contém todas as palavras; senão, o primeiro. */
function melhorResultado(termo: string, resultados: ExerciseDBExercise[]) {
  const t = termo.toLowerCase()
  const palavras = t.split(/\s+/)
  return (
    resultados.find((r) => r.nome_original.toLowerCase() === t) ??
    resultados.find((r) => palavras.every((p) => r.nome_original.toLowerCase().includes(p))) ??
    resultados[0] ??
    null
  )
}

const CATEGORIAS_MOBILIDADE = new Set(['mobility', 'stretching', 'rehabilitation'])

// A API clássica devolve no máximo 10 por página e não filtra por categoria: os
// exercícios de mobilidade/alongamento aparecem buscando por nome, página a página.
const BUSCAS_MOBILIDADE: { termo: string; paginas: number }[] = [
  { termo: 'stretch', paginas: 6 },
  { termo: 'circles', paginas: 1 },
  { termo: 'rotation', paginas: 2 },
]
const PAGINA = 10

async function buscarMobilidade(erros: string[]): Promise<ExerciseDBExercise[]> {
  const achados = new Map<string, ExerciseDBExercise>()
  for (const { termo, paginas } of BUSCAS_MOBILIDADE) {
    for (let pagina = 0; pagina < paginas; pagina++) {
      try {
        const lista = await edbLista(`/exercises/name/${seg(termo)}?limit=${PAGINA}&offset=${pagina * PAGINA}`)
        for (const e of lista) {
          if (e.exerciseType && CATEGORIAS_MOBILIDADE.has(e.exerciseType)) achados.set(e.exercisedb_id, e)
        }
        if (lista.length < PAGINA) break
      } catch (err) {
        erros.push(`mobilidade (${termo}): ${err instanceof Error ? err.message : String(err)}`)
        if (err instanceof HttpError && [429, 502, 503].includes(err.status)) return [...achados.values()]
        break
      }
    }
  }
  return [...achados.values()]
}

async function modoSyncSeed(sb: SupabaseClient, userId: string) {
  const erros: string[] = []
  const cache = await gifsEmCache()

  // 1. Força: dados e GIF nos exercícios-base que o usuário já tem.
  let importados = 0
  for (const item of SEED_FORCA) {
    try {
      const { data: local } = await sb.from('exercises').select('id, exercisedb_id').ilike('nome', item.local).limit(1).maybeSingle()
      if (!local) {
        erros.push(`${item.local}: não existe na sua biblioteca`)
        continue
      }
      if (local.exercisedb_id) {
        importados++
        continue
      }
      const achado = melhorResultado(item.termo, await edbLista(`/exercises/name/${seg(item.termo)}?limit=10`))
      if (!achado) {
        erros.push(`${item.local}: nada encontrado para "${item.termo}"`)
        continue
      }
      await importarUm(sb, userId, achado.exercisedb_id, local.id)
      importados++
    } catch (err) {
      erros.push(`${item.local}: ${err instanceof Error ? err.message : String(err)}`)
      if (err instanceof HttpError && [429, 502, 503].includes(err.status)) break
    }
  }

  // 2. Mobilidade/alongamento/reabilitação (o filtro de equipamento é feito ao montar as rotinas).
  const candidatosApi = await buscarMobilidade(erros)

  const nomes = await traduzirEmLotes(candidatosApi, false, 60)
  let mobilidade = 0
  if (candidatosApi.length > 0) {
    const linhas = candidatosApi.map((e) => ({
      ...buildExerciseRow(e),
      gif_url: cache.has(e.exercisedb_id) ? urlPublicaGif(e.exercisedb_id) : null,
      user_id: userId,
      nome: nomes.get(e.exercisedb_id)?.nome ?? e.nome_original,
    }))
    const { data, error } = await sb.from('exercises').upsert(linhas, { onConflict: 'user_id,exercisedb_id' }).select('id')
    if (error) erros.push(`mobilidade: ${error.message}`)
    else mobilidade = data?.length ?? 0
  }

  // 3. Rotinas padrão (não sobrescreve rotina que o usuário já tenha).
  const { data: candidatos } = await sb
    .from('exercises')
    .select('id, nome, categoria, equipamento, grupo_muscular, exercisedb_id, exercisedb_data, nivel')
    .in('categoria', ['mobilidade', 'alongamento', 'reabilitacao'])
  // Iniciante primeiro: montarRotina respeita a ordem da lista.
  const ordenados = [...(candidatos ?? [])].sort((a: Json, b: Json) => Number(b.nivel === 'iniciante') - Number(a.nivel === 'iniciante'))
  const { data: existentes } = await sb.from('mobility_routines').select('nome, ordem_exercicios')
  const jaTem = new Map((existentes ?? []).map((r: Json) => [r.nome, (r.ordem_exercicios ?? []).length]))

  const rotinas: { nome: string; exercicios: number }[] = []
  const usados = new Set<string>()
  for (const def of ROTINAS_PADRAO) {
    if ((jaTem.get(def.nome) ?? 0) > 0) continue
    const ids = montarRotina(def, ordenados as Candidato[])
    if (ids.length === 0) {
      erros.push(`${def.nome}: sem exercícios de ${def.categorias.join('/')} importados`)
      continue
    }
    ids.forEach((id) => usados.add(id))
    const { error } = await sb.from('mobility_routines').upsert(
      {
        user_id: userId,
        nome: def.nome,
        descricao: def.descricao,
        contexto: def.contexto,
        ordem_exercicios: ids,
        segundos_por_exercicio: def.segundos,
        duracao_min: duracaoRotinaMin(ids.length, def.segundos),
      },
      { onConflict: 'user_id,nome' },
    )
    if (error) erros.push(`${def.nome}: ${error.message}`)
    else rotinas.push({ nome: def.nome, exercicios: ids.length })
  }

  // 4. Só os exercícios das rotinas ganham GIF (cota) e tradução completa.
  const dasRotinas = ordenados.filter((c: Json) => usados.has(c.id))
  const paraCompletar = candidatosApi.filter((e) => dasRotinas.some((c: Json) => c.exercisedb_id === e.exercisedb_id))
  const completas = await traduzirEmLotes(paraCompletar, true, 6)
  let gifs = 0
  for (const e of paraCompletar) {
    try {
      const gif = await garantirGif(e.exercisedb_id, cache)
      if (gif) gifs++
      const t = completas.get(e.exercisedb_id)
      const { error } = await sb
        .from('exercises')
        .update({
          gif_url: gif,
          ...(t ? { instrucoes: t.instrucoes, cues: t.descricao?.slice(0, 500) || null } : {}),
        })
        .eq('exercisedb_id', e.exercisedb_id)
      if (error) erros.push(`${e.nome_original}: ${error.message}`)
    } catch (err) {
      erros.push(`GIF ${e.nome_original}: ${err instanceof Error ? err.message : String(err)}`)
      if (err instanceof HttpError && err.status === 429) break
    }
  }

  return { importados, mobilidade, rotinas, gifs, erros }
}

// ─────────────────────────────── handler ───────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonResponse({ error: 'Use POST.' }, 405)

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const {
      data: { user },
    } = await sb.auth.getUser()
    if (!user) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const body = await req.json().catch(() => ({}))
    switch (body.modo) {
      case 'status':
        return jsonResponse({ configurado: !!EXERCISEDB_API_KEY })
      case 'busca':
        return jsonResponse(await modoBusca(sb, body))
      case 'importar': {
        const id = String(body.exercisedb_id ?? '').trim()
        if (!id) throw new HttpError(400, 'Informe o exercisedb_id escolhido.')
        const exercicio = await importarUm(sb, user.id, id, body.exercise_id ? String(body.exercise_id) : null)
        return jsonResponse({ exercicio })
      }
      case 'sync_seed':
        return jsonResponse(await modoSyncSeed(sb, user.id))
      default:
        return jsonResponse({ error: 'modo deve ser: busca, importar, sync_seed ou status.' }, 400)
    }
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status)
    console.error('exercise-import', err)
    return jsonResponse({ error: err instanceof Error ? err.message : 'Falha inesperada.' }, 500)
  }
})
