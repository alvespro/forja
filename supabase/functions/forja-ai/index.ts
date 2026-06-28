// FORJA AI — Edge Function com 4 agentes especializados (treino, biblioteca, coach, nutricao).
// Cada agente busca os dados do próprio usuário no Postgres (via RLS, com o JWT da request)
// antes de montar o contexto e chamar a API da Anthropic. A ANTHROPIC_API_KEY só existe aqui,
// nos Secrets da Edge Function — nunca é exposta ao frontend.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Agente = 'treino' | 'biblioteca' | 'coach' | 'nutricao'

const AGENTE_VALIDOS: Agente[] = ['treino', 'biblioteca', 'coach', 'nutricao']

const SYSTEM_PROMPTS: Record<Agente, string> = {
  treino:
    'Você é o agente de TREINO do app FORJA. Você ajuda o usuário a entender sua prescrição de ' +
    'treino, histórico de sessões, progressão de carga/reps e cardio. Use os DADOS DO USUÁRIO ' +
    'fornecidos abaixo como única fonte de verdade — não invente exercícios, cargas ou sessões que ' +
    'não estejam lá. Seja direto, prático e use linguagem de coach de academia. Responda em português.',
  biblioteca:
    'Você é o agente de BIBLIOTECA do app FORJA. Você ajuda o usuário com leituras e cursos em ' +
    'andamento, recomenda o que priorizar e ajuda a extrair aplicações práticas dos materiais. ' +
    'Use os DADOS DO USUÁRIO fornecidos abaixo como única fonte de verdade. Responda em português, ' +
    'de forma objetiva.',
  coach:
    'Você é o COACH do app FORJA, focado em metas (RPM), hábitos, diário e ciclos de 90 dias. ' +
    'Ajude o usuário a refletir sobre progresso, consistência de hábitos e alinhamento entre ações ' +
    'diárias e metas. Use os DADOS DO USUÁRIO fornecidos abaixo como única fonte de verdade. Seja ' +
    'direto e questione com empatia quando notar inconsistência entre meta e execução. Responda em ' +
    'português.',
  nutricao:
    'Você é o agente de NUTRIÇÃO/CORPO do app FORJA. Você ajuda o usuário a entender evolução de ' +
    'peso, % de gordura e refeições registradas (proteína, calorias). Use os DADOS DO USUÁRIO ' +
    'fornecidos abaixo como única fonte de verdade — não invente valores. Responda em português, com ' +
    'foco prático.',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

async function buscarContextoTreino(sb: SupabaseClient, userId: string): Promise<string> {
  const [workouts, exercises, sessions] = await Promise.all([
    sb.from('workouts').select('id, nome, foco, ativo, ordem').eq('user_id', userId).order('ordem'),
    sb.from('exercises').select('id, nome, grupo_muscular').eq('user_id', userId),
    sb
      .from('workout_sessions')
      .select('id, workout_id, performed_at, duracao_seg, esforco_percebido, notas')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
      .limit(10),
  ])

  const workoutIds = (workouts.data ?? []).map((w) => w.id)
  const workoutExercises = workoutIds.length
    ? await sb
        .from('workout_exercises')
        .select('workout_id, exercise_id, ordem, series_alvo, reps_alvo, pausa_alvo_seg, cadencia_alvo')
        .in('workout_id', workoutIds)
        .order('ordem')
    : { data: [] }

  const sessionIds = (sessions.data ?? []).map((s) => s.id)
  const setLogs = sessionIds.length
    ? await sb
        .from('set_logs')
        .select('session_id, exercise_id, serie_num, carga_kg, reps, rpe, concluida')
        .in('session_id', sessionIds)
        .order('serie_num')
    : { data: [] }

  const cardio = await sb
    .from('cardio_sessions')
    .select('tipo, performed_at, distancia_km, duracao_seg, fc_media, zona')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(5)

  const exerciseNameById = new Map((exercises.data ?? []).map((e) => [e.id, e.nome]))

  return JSON.stringify(
    {
      treinos_montados: (workouts.data ?? []).map((w) => ({
        nome: w.nome,
        foco: w.foco,
        ativo: w.ativo,
        exercicios: (workoutExercises.data ?? [])
          .filter((we) => we.workout_id === w.id)
          .map((we) => ({
            exercicio: exerciseNameById.get(we.exercise_id) ?? 'desconhecido',
            series_alvo: we.series_alvo,
            reps_alvo: we.reps_alvo,
            pausa_alvo_seg: we.pausa_alvo_seg,
            cadencia_alvo: we.cadencia_alvo,
          })),
      })),
      ultimas_sessoes: (sessions.data ?? []).map((s) => ({
        performed_at: s.performed_at,
        duracao_seg: s.duracao_seg,
        esforco_percebido: s.esforco_percebido,
        notas: s.notas,
        series: (setLogs.data ?? [])
          .filter((sl) => sl.session_id === s.id)
          .map((sl) => ({
            exercicio: exerciseNameById.get(sl.exercise_id) ?? 'desconhecido',
            serie_num: sl.serie_num,
            carga_kg: sl.carga_kg,
            reps: sl.reps,
            rpe: sl.rpe,
            concluida: sl.concluida,
          })),
      })),
      ultimas_corridas_cardio: cardio.data ?? [],
    },
    null,
    2,
  )
}

async function buscarContextoBiblioteca(sb: SupabaseClient, userId: string): Promise<string> {
  const [readings, courses] = await Promise.all([
    sb
      .from('readings')
      .select('trilha, titulo, autor, status, progresso, nota_321')
      .eq('user_id', userId),
    sb.from('courses').select('provedor, titulo, status, progresso').eq('user_id', userId),
  ])

  return JSON.stringify({ leituras: readings.data ?? [], cursos: courses.data ?? [] }, null, 2)
}

async function buscarContextoCoach(sb: SupabaseClient, userId: string): Promise<string> {
  const [cycles, goals, habits, journal] = await Promise.all([
    sb
      .from('cycles')
      .select('nome, data_inicio, data_fim, ativo')
      .eq('user_id', userId)
      .eq('ativo', true),
    sb
      .from('goals')
      .select('id, area, titulo, resultado_rpm, proposito_rpm, plano_rpm, progresso, status')
      .eq('user_id', userId),
    sb.from('habits').select('id, nome, area, ativo, ordem').eq('user_id', userId).order('ordem'),
    sb
      .from('journal_entries')
      .select('data, tipo, humor, conteudo, o_que_senti')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(10),
  ])

  const goalIds = (goals.data ?? []).map((g) => g.id)
  const keyResults = goalIds.length
    ? await sb
        .from('key_results')
        .select('goal_id, descricao, valor_atual, valor_meta, unidade')
        .in('goal_id', goalIds)
    : { data: [] }

  const habitIds = (habits.data ?? []).map((h) => h.id)
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const habitLogs = habitIds.length
    ? await sb
        .from('habit_logs')
        .select('habit_id, data, concluido')
        .in('habit_id', habitIds)
        .gte('data', last30)
    : { data: [] }

  const habitNameById = new Map((habits.data ?? []).map((h) => [h.id, h.nome]))

  return JSON.stringify(
    {
      ciclo_ativo: cycles.data ?? [],
      metas: (goals.data ?? []).map((g) => ({
        area: g.area,
        titulo: g.titulo,
        resultado_rpm: g.resultado_rpm,
        proposito_rpm: g.proposito_rpm,
        plano_rpm: g.plano_rpm,
        progresso: g.progresso,
        status: g.status,
        resultados_chave: (keyResults.data ?? [])
          .filter((kr) => kr.goal_id === g.id)
          .map((kr) => ({
            descricao: kr.descricao,
            valor_atual: kr.valor_atual,
            valor_meta: kr.valor_meta,
            unidade: kr.unidade,
          })),
      })),
      habitos_ultimos_30_dias: (habits.data ?? []).map((h) => ({
        nome: h.nome,
        ativo: h.ativo,
        logs: (habitLogs.data ?? [])
          .filter((log) => log.habit_id === h.id)
          .map((log) => ({ data: log.data, concluido: log.concluido })),
      })),
      diario_recente: journal.data ?? [],
    },
    null,
    2,
  )
}

async function buscarContextoNutricao(sb: SupabaseClient, userId: string): Promise<string> {
  const [meals, bodyMetrics] = await Promise.all([
    sb
      .from('meals')
      .select('data, refeicao, descricao, proteina_g, calorias, tipo')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(30),
    sb
      .from('body_metrics')
      .select('medido_em, peso_kg, gordura_pct')
      .eq('user_id', userId)
      .order('medido_em', { ascending: false })
      .limit(30),
  ])

  return JSON.stringify(
    { refeicoes_recentes: meals.data ?? [], medicoes_corporais_recentes: bodyMetrics.data ?? [] },
    null,
    2,
  )
}

const BUSCAR_CONTEXTO: Record<Agente, (sb: SupabaseClient, userId: string) => Promise<string>> = {
  treino: buscarContextoTreino,
  biblioteca: buscarContextoBiblioteca,
  coach: buscarContextoCoach,
  nutricao: buscarContextoNutricao,
}

async function perguntarAnthropic(systemPrompt: string, contexto: string, pergunta: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: `${systemPrompt}\n\nDADOS DO USUÁRIO (JSON):\n${contexto}`,
      messages: [{ role: 'user', content: pergunta }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Anthropic API ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  const resposta = data.content?.find((block: { type: string }) => block.type === 'text')?.text
  if (!resposta) throw new Error('Resposta da Anthropic sem conteúdo de texto')
  return resposta
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado' }, 401)
  }

  let body: { agente?: string; pergunta?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const { agente, pergunta } = body
  if (!agente || !AGENTE_VALIDOS.includes(agente as Agente)) {
    return jsonResponse({ error: `agente deve ser um de: ${AGENTE_VALIDOS.join(', ')}` }, 400)
  }
  if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
    return jsonResponse({ error: 'pergunta é obrigatória' }, 400)
  }

  // Cliente Supabase com o JWT do usuário: RLS garante que só os dados dele são lidos.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await sb.auth.getUser()
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Sessão inválida' }, 401)
  }

  try {
    const contexto = await BUSCAR_CONTEXTO[agente as Agente](sb, userData.user.id)
    const resposta = await perguntarAnthropic(SYSTEM_PROMPTS[agente as Agente], contexto, pergunta)
    return jsonResponse({ resposta })
  } catch (error) {
    console.error('forja-ai error', error)
    return jsonResponse({ error: 'Falha ao gerar resposta do agente' }, 500)
  }
})
