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

type Agente = 'treino' | 'biblioteca' | 'coach' | 'nutricao' | 'metas'

const AGENTE_VALIDOS: Agente[] = ['treino', 'biblioteca', 'coach', 'nutricao', 'metas']

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
  metas:
    'Você é o Analista de Objetivos do FORJA, sistema de Welber Alves.\n\n' +
    'REGRAS POR OBJETIVO:\n' +
    'recomposicao:\n' +
    '  - Proteína: mínimo 1,8g por kg de peso corporal\n' +
    '  - Calorias: déficit leve de 200-300kcal abaixo do TDEE\n' +
    '  - Carbo: concentrar pré e pós-treino\n' +
    '  - Gordura: mínimo 0,7g por kg\n' +
    '  - Treino: força 4x semana obrigatório para preservar músculo\n' +
    'ganho_massa:\n' +
    '  - Proteína: 2g por kg de peso\n' +
    '  - Calorias: superávit de 300-500kcal acima do TDEE\n' +
    '  - Carbo: alto, especialmente pós-treino\n' +
    'perda_peso:\n' +
    '  - Proteína: 2,2g por kg para preservar músculo\n' +
    '  - Calorias: déficit de 500kcal\n' +
    '  - Carbo: baixo, priorizar legumes e fibras\n' +
    'definicao:\n' +
    '  - Proteína: 2,4g por kg\n' +
    '  - Calorias: déficit de 300-400kcal\n' +
    '  - Treino: manter cargas, aumentar volume\n' +
    'performance:\n' +
    '  - Carbo: alto (combustível)\n' +
    '  - Proteína: 1,6g por kg\n' +
    '  - Calorias: manutenção ou leve superávit\n\n' +
    'MODO ANÁLISE (pergunta padrão sobre adequação da dieta):\n' +
    'SUAS TAREFAS:\n' +
    '1. Verificar se a dieta atual está ADEQUADA para o objetivo do ciclo ativo\n' +
    '2. Identificar o que está faltando ou em excesso (use números reais do contexto, nunca genérico)\n' +
    '3. Sugerir ajustes específicos com números (gramas, kcal)\n' +
    '4. Avaliar se a frequência de treino da última semana é compatível com o objetivo\n' +
    '5. Dar um veredito claro, na PRIMEIRA linha da resposta, em uma destas três formas exatas: ' +
    '"VEREDITO: ADEQUADA", "VEREDITO: PARCIALMENTE ADEQUADA" ou "VEREDITO: INADEQUADA"\n' +
    '6. Depois do veredito, listar no máximo 3 ajustes prioritários, um por linha, começando com "- "\n\n' +
    'MODO SUGESTÃO DE METAS (quando a pergunta for "sugerir metas para [objetivo] em [dias] dias"):\n' +
    'Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, neste formato exato:\n' +
    '{"metas_sugeridas": {"peso_meta_kg": number, "gordura_meta_pct": number, "musculo_pct_meta": number, ' +
    '"agua_meta_pct": number, "gordura_visceral_meta": number, "imc_meta": number, "justificativa": "texto"}}\n' +
    'Regras de cálculo: perda de gordura realista é 0,5-1% por semana; ganho muscular simultâneo realista é ' +
    '0,5-1kg por mês em recomposição (menos em déficit puro, mais em superávit). Use o peso e a composição ' +
    'corporal atuais (fornecidos no contexto) como ponto de partida e o prazo em dias informado na pergunta ' +
    'para calcular metas conservadoras e realistas, nunca otimistas demais. A justificativa deve explicar o ' +
    'raciocínio em até 3 frases.\n\n' +
    'Seja direto, use os dados reais do contexto, máximo 300 palavras (exceto no modo JSON). Português do Brasil.',
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

async function buscarContextoMetas(sb: SupabaseClient, userId: string): Promise<string> {
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [metricas, metaAtiva, dietaAtiva, refeicoes, sessoes, series] = await Promise.all([
    sb
      .from('body_metrics')
      .select('peso_kg, gordura_pct, musculo_pct, agua_pct, gordura_visceral, imc, medido_em')
      .eq('user_id', userId)
      .order('medido_em', { ascending: false })
      .limit(8),
    sb
      .from('body_goals')
      .select('objetivo, peso_meta_kg, gordura_meta_pct, musculo_pct_meta, agua_meta_pct, gordura_visceral_meta, imc_meta, cycles(nome, data_inicio, data_fim, ativo)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from('diet_plans')
      .select('nome, calorias_alvo, proteina_g, carbo_g, gordura_g')
      .eq('user_id', userId)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle(),
    sb
      .from('meal_logs')
      .select('calorias, proteina_g, carbo_g, gordura_g, data')
      .eq('user_id', userId)
      .gte('data', seteDiasAtras),
    sb
      .from('workout_sessions')
      .select('performed_at, workouts(nome)')
      .eq('user_id', userId)
      .gte('performed_at', seteDiasAtras),
    sb
      .from('set_logs')
      .select('carga_kg, reps, created_at')
      .eq('user_id', userId)
      .gte('created_at', seteDiasAtras),
  ])

  const refeicoesData = refeicoes.data ?? []
  const diasComLog = new Set(refeicoesData.map((r) => r.data)).size || 1
  const mediaConsumoUltimos7Dias = {
    calorias: Math.round(refeicoesData.reduce((acc, r) => acc + (r.calorias ?? 0), 0) / diasComLog),
    proteina_g: Math.round(refeicoesData.reduce((acc, r) => acc + (r.proteina_g ?? 0), 0) / diasComLog),
    carbo_g: Math.round(refeicoesData.reduce((acc, r) => acc + (r.carbo_g ?? 0), 0) / diasComLog),
    gordura_g: Math.round(refeicoesData.reduce((acc, r) => acc + (r.gordura_g ?? 0), 0) / diasComLog),
  }

  const volumeTotalUltimos7Dias = (series.data ?? []).reduce(
    (acc, s) => acc + (s.carga_kg ?? 0) * (s.reps ?? 0),
    0,
  )

  return JSON.stringify(
    {
      ultimas_8_pesagens: metricas.data ?? [],
      meta_ativa: metaAtiva.data ?? null,
      dieta_ativa: dietaAtiva.data ?? null,
      media_consumo_real_ultimos_7_dias: mediaConsumoUltimos7Dias,
      sessoes_treino_ultima_semana: sessoes.data ?? [],
      volume_total_treino_ultima_semana_kg: volumeTotalUltimos7Dias,
    },
    null,
    2,
  )
}

const BUSCAR_CONTEXTO: Record<Agente, (sb: SupabaseClient, userId: string) => Promise<string>> = {
  treino: buscarContextoTreino,
  biblioteca: buscarContextoBiblioteca,
  coach: buscarContextoCoach,
  nutricao: buscarContextoNutricao,
  metas: buscarContextoMetas,
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
    const detail = error instanceof Error ? error.message : String(error)
    return jsonResponse({ error: `Falha ao gerar resposta do agente: ${detail}` }, 500)
  }
})
