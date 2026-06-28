// FORJA AI — Edge Function com 4 agentes especializados (treino, biblioteca, coach, nutricao).
// Cada agente busca os dados do próprio usuário no Postgres (via RLS, com o JWT da request)
// antes de montar o contexto e chamar a API da Anthropic. A ANTHROPIC_API_KEY só existe aqui,
// nos Secrets da Edge Function — nunca é exposta ao frontend.
//
// O user_id NUNCA vem do corpo da requisição: é sempre derivado do JWT autenticado via
// `sb.auth.getUser()`, e a busca usa a anon key (não a service role), então o RLS do Postgres
// garante que cada usuário só pode ler os próprios dados.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 500

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Agente = 'treino' | 'biblioteca' | 'coach' | 'nutricao'

const AGENTE_VALIDOS: Agente[] = ['treino', 'biblioteca', 'coach', 'nutricao']

const SYSTEM_PROMPTS: Record<Agente, string> = {
  treino:
    'Você é o Coach de Performance do FORJA, sistema pessoal de Welber Alves (32 anos, perfil ' +
    'falso magro em recomposição corporal). Analise o histórico de treino fornecido e responda ' +
    'com precisão técnica e linguagem direta. Use os dados reais de carga e frequência. Identifique ' +
    'estagnações, sugira progressão de carga ou volume, indique quando fazer deload. Seja ' +
    'específico: nomes de exercícios, números de carga, séries e repetições. Não invente dados que ' +
    'não estejam no contexto fornecido. Responda em português do Brasil. Máximo 200 palavras.',
  biblioteca:
    'Você é o Curador de Leituras do FORJA, sistema pessoal de Welber Alves. Perfil: Eneagrama 3w2 ' +
    '(motivado por resultado e conexão, evita profundidade emocional). Área mais carente: Finanças ' +
    '(20% na Roda da Vida). Trilha prioritária: Profundidade Humana (a mais evitada pelo tipo). ' +
    'Analise as leituras já feitas com suas notas e as metas ativas. Sugira o próximo livro com ' +
    'justificativa precisa e personalizada — considere o que falta na jornada do usuário, não só o ' +
    'que ele quer ouvir. Se ele está evitando a trilha de Profundidade Humana, aponte isso com ' +
    'honestidade. Responda em português do Brasil. Máximo 150 palavras.',
  coach:
    'Você é o Mentor 5AM do FORJA, sistema pessoal de Welber Alves (32 anos, Eneagrama 3w2, ' +
    'protocolo 5AM). Risco principal: evitação emocional disfarçada de disciplina. Seu tom: direto, ' +
    'honesto, motivador sem ser superficial. Analise os hábitos recentes, o diário e os marcadores ' +
    'de saúde. Gere um briefing: o que está bem, o que está falhando, uma ação prioritária para hoje ' +
    'e uma pergunta de reflexão baseada no medo de ser visto como fracasso e na tendência de ' +
    'confundir performance com identidade. Nunca seja condescendente. Responda em português do ' +
    'Brasil. Máximo 180 palavras.',
  nutricao:
    'Você é o Analista Metabólico do FORJA, sistema pessoal de Welber Alves. Perfil crítico: ' +
    'glicemia em jejum historicamente em torno de 103 mg/dL (limiar pré-diabético leve), em ' +
    'recomposição corporal (meta: mais músculo, menos gordura visceral). Analise as refeições ' +
    'registradas e a composição corporal fornecidas no contexto. Identifique padrões problemáticos ' +
    '(carbo noturno, proteína insuficiente pós-treino, janelas de jejum inadequadas) só quando os ' +
    'dados sustentarem isso. Dê sugestões práticas e específicas, não genéricas. Cite os dados ' +
    'reais. Responda em português do Brasil. Máximo 180 palavras.',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

async function buscarContextoTreino(sb: SupabaseClient, userId: string): Promise<string> {
  const [logs, sessions] = await Promise.all([
    sb
      .from('set_logs')
      .select('exercise_id, carga_kg, reps, created_at, exercises(nome)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    sb
      .from('workout_sessions')
      .select('performed_at, duracao_seg, esforco_percebido, workouts(nome)')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
      .limit(10),
  ])

  return JSON.stringify(
    {
      historico_series_recentes: logs.data ?? [],
      sessoes_recentes: sessions.data ?? [],
    },
    null,
    2,
  )
}

async function buscarContextoBiblioteca(sb: SupabaseClient, userId: string): Promise<string> {
  const [readings, goals] = await Promise.all([
    sb
      .from('readings')
      .select('titulo, autor, trilha, status, progresso, nota_321')
      .eq('user_id', userId),
    sb
      .from('goals')
      .select('area, titulo, progresso, status')
      .eq('user_id', userId)
      .eq('status', 'ativo'),
  ])

  return JSON.stringify(
    { leituras: readings.data ?? [], metas_ativas: goals.data ?? [] },
    null,
    2,
  )
}

async function buscarContextoCoach(sb: SupabaseClient, userId: string): Promise<string> {
  const [habitos, diario, saude] = await Promise.all([
    sb
      .from('habit_logs')
      .select('habit_id, data, concluido, habits(nome)')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(35),
    sb
      .from('journal_entries')
      .select('data, humor, o_que_senti')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(7),
    sb
      .from('health_metrics')
      .select('chave, valor, measured_at')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(20),
  ])

  return JSON.stringify(
    {
      habitos_ultimos_35_dias: habitos.data ?? [],
      diario_ultimos_7_dias: diario.data ?? [],
      marcadores_saude: saude.data ?? [],
    },
    null,
    2,
  )
}

async function buscarContextoNutricao(sb: SupabaseClient, userId: string): Promise<string> {
  const [refeicoes, composicao] = await Promise.all([
    sb
      .from('meals')
      .select('refeicao, descricao, proteina_g, calorias, tipo, data')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(18),
    sb
      .from('body_metrics')
      .select('peso_kg, gordura_pct, medido_em')
      .eq('user_id', userId)
      .order('medido_em', { ascending: false })
      .limit(5),
  ])

  return JSON.stringify(
    { refeicoes_recentes: refeicoes.data ?? [], composicao_corporal: composicao.data ?? [] },
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
      max_tokens: MAX_TOKENS,
      system: `${systemPrompt}\n\nCONTEXTO DOS DADOS (JSON):\n${contexto}`,
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

  // Cliente Supabase com o JWT do usuário (anon key): RLS garante que só os dados dele são lidos.
  // O user_id é sempre derivado do JWT abaixo — nunca aceito do corpo da requisição.
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
