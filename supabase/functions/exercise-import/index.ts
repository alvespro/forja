// exercise-import — biblioteca de exercícios via ExerciseDB v2 (AscendAPI/RapidAPI),
// cache-first: a API só é consultada para buscar/importar; o app sempre lê de `exercises`.
//   busca       { query? | grupo? }            → resultados (não grava)
//   importar    { exercisedb_id, exercise_id? } → atualiza o exercício do FORJA ou cria um novo
//   sync_seed   {}                              → vídeos/instruções dos exercícios-base + mobilidade + rotinas
// Nomes, instruções, dicas e variações são traduzidos para pt-BR (a API ainda não tem pt-BR).
// Gravações usam o JWT do usuário (RLS de `exercises` e `mobility_routines`).

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
const EXERCISEDB_API_KEY = Deno.env.get('EXERCISEDB_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const RAPIDAPI_HOST = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`
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

async function edb(path: string, params: Record<string, string> = {}): Promise<Json> {
  if (!EXERCISEDB_API_KEY) {
    throw new HttpError(503, 'ExerciseDB não configurado: adicione o secret EXERCISEDB_API_KEY no Supabase.')
  }
  const qs = new URLSearchParams(params).toString()
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
      headers: { 'X-RapidAPI-Key': EXERCISEDB_API_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })
  } catch {
    throw new HttpError(504, 'ExerciseDB não respondeu a tempo. Tente de novo.')
  }
  if (res.status === 404) return null
  if (!res.ok) {
    const texto = (await res.text()).slice(0, 200)
    console.error('exercisedb', path, res.status, texto)
    if (res.status === 401 || res.status === 403) {
      throw new HttpError(502, 'ExerciseDB recusou a chave (EXERCISEDB_API_KEY inválida ou sem assinatura).')
    }
    if (res.status === 429) throw new HttpError(429, 'Limite de chamadas do ExerciseDB atingido. Tente mais tarde.')
    throw new HttpError(502, `ExerciseDB respondeu ${res.status}.`)
  }
  return res.json()
}

async function listar(params: Record<string, string>): Promise<ExerciseDBExercise[]> {
  const json = await edb('/exercises', { limit: '25', ...params })
  const itens: Json[] = Array.isArray(json?.data) ? json.data : []
  return itens.map(normalizeExercise).filter((e): e is ExerciseDBExercise => e !== null)
}

async function porId(id: string): Promise<ExerciseDBExercise> {
  const json = await edb(`/exercises/${encodeURIComponent(id)}`)
  const ex = json?.data ? normalizeExercise(json.data) : null
  if (!ex) throw new HttpError(404, 'Exercício não encontrado no ExerciseDB.')
  return ex
}

// Chips de grupo da UI → filtro bodyParts da API (+ músculo-alvo para bíceps/tríceps).
const GRUPO_PARA_API: Record<string, { bodyParts: string; alvo?: RegExp }> = {
  peito: { bodyParts: 'chest' },
  costas: { bodyParts: 'back' },
  pernas: { bodyParts: 'upper legs' },
  ombros: { bodyParts: 'shoulders' },
  biceps: { bodyParts: 'upper arms', alvo: /bicep|brachialis/ },
  triceps: { bodyParts: 'upper arms', alvo: /tricep/ },
  core: { bodyParts: 'waist' },
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
        },
        required: ['id', 'nome', 'instrucoes', 'dicas', 'variacoes'],
        additionalProperties: false,
      },
    },
  },
  required: ['itens'],
  additionalProperties: false,
}

/**
 * Traduz em lote. `completo=false` traduz só o nome (listas voltam vazias e o
 * chamador mantém o original). Falha na IA nunca bloqueia o import: devolve mapa vazio.
 */
async function traduzir(exs: ExerciseDBExercise[], completo: boolean): Promise<Map<string, Traducao>> {
  const mapa = new Map<string, Traducao>()
  if (!ANTHROPIC_API_KEY || exs.length === 0) return mapa

  const entrada = exs.map((e) =>
    completo
      ? { id: e.exercisedb_id, name: e.nome_original, instructions: e.instructions, tips: e.tips, variations: e.variations }
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
          'Nomes: use o termo consagrado nas academias brasileiras (ex.: "Bench Press" → "Supino Reto", "Lat Pulldown" → ' +
          '"Puxada Alta", "Romanian Deadlift" → "Levantamento Terra Romeno", "Cat Cow Stretch" → "Alongamento Gato-Vaca"). ' +
          'Instruções, dicas e variações: tradução fiel, frases curtas e imperativas, mantenha a ordem e a quantidade de itens. ' +
          (completo ? '' : 'Nesta tarefa traduza só o nome e devolva as listas vazias.'),
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

  let resultados: ExerciseDBExercise[]
  if (query) {
    resultados = await listar({ name: query })
  } else {
    const filtro = GRUPO_PARA_API[grupo]
    resultados = (await listar({ bodyParts: filtro.bodyParts })).filter(
      (e) => !filtro.alvo || filtro.alvo.test(e.targetMuscles.join(' ')),
    )
  }

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
        imagem_url: r.imageUrl,
        gif_url: r.gifUrl,
        video_url: r.videoUrl,
        exercise_id: localPorId.get(r.exercisedb_id) ?? null,
      }
    }),
  }
}

async function importarUm(sb: SupabaseClient, userId: string, exercisedbId: string, exerciseId: string | null) {
  const ex = await porId(exercisedbId)
  const traducao = (await traduzir([ex], true)).get(ex.exercisedb_id) ?? null
  const row = buildExerciseRow(ex, traducao)
  // `overview` vira o resumo do campo existente só se o usuário não escreveu cues.
  const resumo = ex.overview ? ex.overview.slice(0, 500) : null

  if (exerciseId) {
    const { data: atual, error: errAtual } = await sb.from('exercises').select('id, cues').eq('id', exerciseId).maybeSingle()
    if (errAtual) throw errAtual
    if (!atual) throw new HttpError(404, 'Exercício do FORJA não encontrado.')
    // O nome do FORJA (já em pt-BR, escolhido pelo usuário) é mantido.
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
    .upsert(
      { ...row, user_id: userId, nome: traducao?.nome ?? ex.nome_original, cues: resumo },
      { onConflict: 'user_id,exercisedb_id' },
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** Exercícios-base do seed → termo de busca no ExerciseDB (termos mais precisos que o nome solto). */
const SEED_FORCA: { termo: string; local: string }[] = [
  { termo: 'barbell bench press', local: 'Supino Reto com Barra' },
  { termo: 'barbell full squat', local: 'Agachamento Livre' },
  { termo: 'lat pulldown', local: 'Pulldown / Puxada Frontal' },
  { termo: 'barbell romanian deadlift', local: 'Stiff (Levantamento Terra Romeno)' },
  { termo: 'dumbbell seated shoulder press', local: 'Desenvolvimento com Halteres' },
  { termo: 'barbell curl', local: 'Rosca Direta com Barra' },
]

/** Primeiro resultado que contém todas as palavras do termo; senão, o primeiro da lista. */
function melhorResultado(termo: string, resultados: ExerciseDBExercise[]) {
  const palavras = termo.toLowerCase().split(/\s+/)
  return resultados.find((r) => palavras.every((p) => r.nome_original.toLowerCase().includes(p))) ?? resultados[0] ?? null
}

async function modoSyncSeed(sb: SupabaseClient, userId: string) {
  const erros: string[] = []

  // 1. Força: vídeos e instruções nos exercícios-base que o usuário já tem.
  let importados = 0
  for (const item of SEED_FORCA) {
    try {
      const { data: local } = await sb.from('exercises').select('id').ilike('nome', item.local).limit(1).maybeSingle()
      if (!local) {
        erros.push(`${item.local}: não existe na sua biblioteca`)
        continue
      }
      const achado = melhorResultado(item.termo, await listar({ name: item.termo, limit: '10' }))
      if (!achado) {
        erros.push(`${item.local}: nada encontrado para "${item.termo}"`)
        continue
      }
      await importarUm(sb, userId, achado.exercisedb_id, local.id)
      importados++
    } catch (err) {
      erros.push(`${item.local}: ${err instanceof Error ? err.message : String(err)}`)
      if (err instanceof HttpError && (err.status === 503 || err.status === 502 || err.status === 429)) break
    }
  }

  // 2. Mobilidade/alongamento/reabilitação sem equipamento.
  const porTipo = await Promise.all(
    ['mobility', 'stretching', 'rehabilitation'].map((tipo) =>
      listar({ exerciseType: tipo, equipments: 'body weight' }).catch((err) => {
        erros.push(`${tipo}: ${err instanceof Error ? err.message : String(err)}`)
        return [] as ExerciseDBExercise[]
      }),
    ),
  )
  const candidatosApi = [...new Map(porTipo.flat().map((e) => [e.exercisedb_id, e])).values()]

  // Nomes em lote (rápido); a tradução completa fica para os que entram nas rotinas.
  const nomes = await traduzirEmLotes(candidatosApi, false, 40)
  const linhas = candidatosApi.map((e) => ({
    ...buildExerciseRow(e),
    user_id: userId,
    nome: nomes.get(e.exercisedb_id)?.nome ?? e.nome_original,
  }))
  let mobilidade = 0
  if (linhas.length > 0) {
    const { data, error } = await sb.from('exercises').upsert(linhas, { onConflict: 'user_id,exercisedb_id' }).select('id')
    if (error) erros.push(`mobilidade: ${error.message}`)
    else mobilidade = data?.length ?? 0
  }

  // 3. Rotinas padrão (não sobrescreve rotina que o usuário já tenha).
  const { data: candidatos } = await sb
    .from('exercises')
    .select('id, nome, categoria, equipamento, grupo_muscular, exercisedb_data')
    .in('categoria', ['mobilidade', 'alongamento', 'reabilitacao'])
  const { data: existentes } = await sb.from('mobility_routines').select('nome, ordem_exercicios')
  const jaTem = new Map((existentes ?? []).map((r: Json) => [r.nome, (r.ordem_exercicios ?? []).length]))

  const rotinas: { nome: string; exercicios: number }[] = []
  const usados = new Set<string>()
  for (const def of ROTINAS_PADRAO) {
    if ((jaTem.get(def.nome) ?? 0) > 0) continue
    const ids = montarRotina(def, (candidatos ?? []) as Candidato[])
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

  // 4. Tradução completa (instruções/dicas) só dos exercícios das rotinas.
  const exsDasRotinas = (candidatos ?? []).filter((c: Json) => usados.has(c.id))
  const paraTraduzir = candidatosApi.filter((e) => exsDasRotinas.some((c: Json) => c.exercisedb_data?.original_name === e.nome_original))
  const completas = await traduzirEmLotes(paraTraduzir, true, 6)
  for (const e of paraTraduzir) {
    const t = completas.get(e.exercisedb_id)
    if (!t) continue
    const { error } = await sb
      .from('exercises')
      .update({ instrucoes: t.instrucoes, dicas_execucao: t.dicas, variacoes: t.variacoes })
      .eq('exercisedb_id', e.exercisedb_id)
    if (error) erros.push(`tradução ${e.nome_original}: ${error.message}`)
  }

  return { importados, mobilidade, rotinas, erros }
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
