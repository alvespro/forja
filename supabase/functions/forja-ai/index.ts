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
// 300 palavras em PT-BR ≈ 500-650 tokens: com 500 os agentes de prompt longo truncavam
// no meio da frase e o JSON do modo metas podia cortar (quebrando o parse no frontend).
const MAX_TOKENS = 1500

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Agente = 'treino' | 'biblioteca' | 'coach' | 'nutricao' | 'metas' | 'desenvolvimento' | 'protocolo'

const AGENTE_VALIDOS: Agente[] = ['treino', 'biblioteca', 'coach', 'nutricao', 'metas', 'desenvolvimento', 'protocolo']

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
  desenvolvimento:
    'Você é o Mentor de Desenvolvimento Pessoal do FORJA, sistema de Welber Alves (32 anos, empresário, Rio Verde/GO).\n\n' +
    'PERFIL PSICOLÓGICO: Eneagrama 3w2 (Realizador com asa Ajudador)\n' +
    '- Pontos fortes: disciplina, execução, carisma, orientação a resultado\n' +
    '- Áreas de crescimento: vulnerabilidade, profundidade emocional, identidade desacoplada de performance, conexão genuína\n\n' +
    'ÁREAS PRIORITÁRIAS (em ordem):\n' +
    '1. Mentalidade e Comportamento (área mais crítica para o crescimento do 3w2)\n' +
    '2. Habilidades Interpessoais (mais evitada, mais impacto)\n' +
    '3. Soft Skills\n' +
    '4. Hard Skills — Crédito/Financeiro/Tech (desenvolve naturalmente)\n\n' +
    'CONTEXTO DE NEGÓCIO:\n' +
    '- Dono da Prime Inteligência Imobiliária (CCA Caixa)\n' +
    '- Produtos: MCMV, SBPE, Consignado, Consórcio, Seguros\n' +
    '- Objetivo: transformar de operador em dono/gestor\n\n' +
    'SUAS FUNÇÕES:\n' +
    '1. Analisar reviews 3-2-1 e extrair padrões de aprendizado\n' +
    '2. Sugerir próximos livros/cursos/filmes com justificativa específica (perfil 3w2 + habilidades mais fracas)\n' +
    '3. Identificar gaps entre habilidades atuais e objetivo profissional\n' +
    '4. Propor próximos passos concretos e mensuráveis\n' +
    '5. Conectar o aprendido com situações reais da Prime\n\n' +
    'REGRA CRÍTICA: Para o perfil 3w2, sempre priorizar Profundidade Humana e Interpessoal.\n' +
    'Hard Skills ele já desenvolve naturalmente — não priorizar.\n\n' +
    'Responda em português do Brasil. Seja direto e específico. Máximo 300 palavras.',
  protocolo:
    'Você é o Monitor de Protocolo do FORJA, sistema de Welber Alves.\n\n' +
    'CONTEXTO:\n' +
    '- Protocolo sob supervisão médica (médico responsável registrado)\n' +
    '- Via: injetável\n' +
    '- Objetivo: recomposição corporal\n' +
    '- Ponto de partida: 84,4kg / 22,1% gordura / 47,2kg músculo\n\n' +
    'SUAS FUNÇÕES:\n' +
    '1. Analisar a evolução de composição corporal desde o início do ciclo\n' +
    '2. Identificar padrões nos logs de bem-estar (humor/energia/libido)\n' +
    '3. Verificar se os exames estão em dia e alertar sobre pendências\n' +
    '4. Avaliar se treino e nutrição estão adequados para o objetivo do ciclo\n' +
    '5. Alertar quando marcadores de saúde saírem de faixas seguras:\n' +
    '   ALERTAS CRÍTICOS (avisar imediatamente):\n' +
    '   - Hematócrito > 52%\n' +
    '   - Pressão arterial > 140/90\n' +
    '   - LDL > 160 mg/dL\n' +
    '   - TGO ou TGP > 3x o limite superior\n' +
    '   - Estradiol > 60 pg/mL (sintomas de aromatização)\n' +
    '6. Celebrar conquistas reais de composição com dados precisos\n\n' +
    'REGRA ABSOLUTA:\n' +
    'NUNCA sugerir compostos, doses, protocolos ou alterações no protocolo médico.\n' +
    'Se o usuário perguntar sobre isso, responder:\n' +
    '"Esta decisão é do seu médico responsável."\n' +
    'Você monitora e informa — não prescreve.\n\n' +
    'Português do Brasil. Direto e específico. Máximo 300 palavras.',
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
    // meal_logs é onde o Yazio e a página Nutrição gravam (a tabela `meals` só recebe a página /meals).
    sb
      .from('meal_logs')
      .select('descricao, calorias, proteina_g, carbo_g, gordura_g, data, fonte')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(30),
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

async function buscarContextoDesenvolvimento(sb: SupabaseClient, userId: string): Promise<string> {
  const [areas, skills, leituras, cursos, sugestoes, metas] = await Promise.all([
    sb.from('dev_areas').select('nome, categoria, cor, nivel_atual, nivel_meta').eq('user_id', userId).order('ordem'),
    sb.from('skills').select('nome, nivel_atual, nivel_meta, dev_areas(nome)').eq('user_id', userId),
    sb
      .from('readings')
      .select('titulo, autor, trilha, status, nota_geral, aprendizado_1, aprendizado_2, aprendizado_3, aplicacao_1, aplicacao_2, acao_1, data_conclusao')
      .eq('user_id', userId)
      .eq('status', 'lido')
      .order('data_conclusao', { ascending: false })
      .limit(5),
    sb
      .from('courses')
      .select('titulo, provedor, plataforma, status, nota_geral, aprendizado_1, aprendizado_2, aprendizado_3, acao_1, data_conclusao')
      .eq('user_id', userId)
      .eq('status', 'lido')
      .order('data_conclusao', { ascending: false })
      .limit(3),
    sb
      .from('dev_suggestions')
      .select('tipo, titulo, motivo, area, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    sb
      .from('goals')
      .select('area, titulo, progresso, status')
      .eq('user_id', userId)
      .eq('status', 'ativo'),
  ])

  return JSON.stringify(
    {
      areas_desenvolvimento: areas.data ?? [],
      habilidades: skills.data ?? [],
      ultimas_5_leituras_concluidas: leituras.data ?? [],
      ultimos_3_cursos_concluidos: cursos.data ?? [],
      sugestoes_recentes: sugestoes.data ?? [],
      metas_ativas: metas.data ?? [],
    },
    null,
    2,
  )
}

async function buscarContextoProtocolo(sb: SupabaseClient, userId: string): Promise<string> {
  const [protocol, metricas, logs, exames, sessoes, refeicoes] = await Promise.all([
    sb
      .from('protocols')
      .select('nome, objetivo, status, via, medico_responsavel, data_inicio, duracao_semanas, protocol_compounds(*), protocol_goals(*), protocol_support(*)')
      .eq('user_id', userId)
      .in('status', ['planejado', 'ativo', 'tpc'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from('body_metrics')
      .select('peso_kg, gordura_pct, musculo_pct, agua_pct, medido_em')
      .eq('user_id', userId)
      .order('medido_em', { ascending: false })
      .limit(8),
    sb
      .from('protocol_logs')
      .select('data_aplicacao, humor, energia, libido, efeitos_percebidos, dose_aplicada_mg')
      .eq('user_id', userId)
      .order('data_aplicacao', { ascending: false })
      .limit(30),
    sb
      .from('protocol_exams')
      .select('nome, semana_alvo, status, data_prevista, data_realizada')
      .eq('user_id', userId)
      .order('semana_alvo', { ascending: true }),
    sb
      .from('workout_sessions')
      .select('performed_at')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
      .limit(20),
    sb
      .from('meal_logs')
      .select('calorias, proteina_g, data')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(21),
  ])

  const refData = refeicoes.data ?? []
  const diasComLog = new Set(refData.map((r) => r.data)).size || 1
  const mediaProteinaDiaria = Math.round(refData.reduce((a, r) => a + (r.proteina_g ?? 0), 0) / diasComLog)

  return JSON.stringify(
    {
      protocolo_ativo: protocol.data ?? null,
      ultimas_8_pesagens: metricas.data ?? [],
      ultimos_30_logs_bem_estar: logs.data ?? [],
      checklist_exames: exames.data ?? [],
      sessoes_treino_recentes: (sessoes.data ?? []).map((s) => s.performed_at),
      media_proteina_diaria_7d: mediaProteinaDiaria,
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
  desenvolvimento: buscarContextoDesenvolvimento,
  protocolo: buscarContextoProtocolo,
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
  if (data.stop_reason === 'max_tokens') {
    console.warn('forja-ai: resposta truncada por max_tokens — avaliar aumentar o teto')
  }
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
