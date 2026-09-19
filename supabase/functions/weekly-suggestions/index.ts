// weekly-suggestions — Edge Function agendada (toda segunda-feira 08h BRT)
// Gera 5 sugestões de desenvolvimento pessoal usando Claude e salva em dev_suggestions.
// Chamável manualmente via POST com Authorization header (para testes).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function semanaAtual(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().slice(0, 10)
}

async function gerarSugestoes(contexto: string): Promise<unknown[]> {
  const systemPrompt =
    'Você é o Mentor de Desenvolvimento Pessoal do FORJA para Welber Alves (32 anos, Eneagrama 3w2, ' +
    'empresário imobiliário). Gere 5 sugestões de conteúdo para esta semana. ' +
    'PRIORIZE sempre: 1) Mentalidade/Interpessoal (mais carente no 3w2) 2) Soft Skills 3) Hard Skills. ' +
    'Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois:\n' +
    '{"sugestoes": [{"tipo": "livro|curso|filme|documentario|podcast|video", ' +
    '"titulo": "string", "autor_ou_diretor": "string ou null", "plataforma": "string ou null", ' +
    '"motivo": "por que agora, para este perfil", ' +
    '"habilidades_alvo": ["skill1", "skill2"], ' +
    '"area": "mentalidade|interpessoal|soft_skill|hard_skill"}]}\n' +
    'Regra: 2 livros, 1 curso, 1 filme/documentário, 1 podcast/vídeo. ' +
    'Priorize Mentalidade e Interpessoal (são as mais evitadas pelo 3w2). ' +
    'Não repita sugestões já feitas. Seja específico e justifique com o perfil real.'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: `CONTEXTO DO USUÁRIO:\n${contexto}\n\nGere as 5 sugestões da semana.` }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''

  // Parse JSON — tolerante a markdown code block
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned)
  return Array.isArray(parsed.sugestoes) ? parsed.sugestoes : []
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  // Esta função gera custo e usa service role: a ausência do segredo desativa a
  // execução, em vez de deixar o endpoint aberto por erro de configuração.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret) {
    return jsonResponse({ ok: false, error: 'cron_not_configured' }, 503)
  }
  if (req.headers.get('x-cron-secret') !== cronSecret) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  // Usar service role para ter acesso a todos os usuários (função agendada)
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const semana = semanaAtual()

    // Buscar todos os usuários ativos
    const { data: users, error: usersError } = await sb.auth.admin.listUsers()
    if (usersError) throw usersError

    const resultados: unknown[] = []

    for (const user of users.users) {
      const userId = user.id

      // Verificar se já há sugestões nesta semana
      const { data: existing } = await sb
        .from('dev_suggestions')
        .select('id')
        .eq('user_id', userId)
        .eq('semana_sugestao', semana)
        .limit(1)

      if (existing && existing.length > 0) {
        resultados.push({ user_id: userId, status: 'já_tem_sugestoes' })
        continue
      }

      // Buscar contexto do usuário
      const [areas, skills, leituras, sugestoesRecentes] = await Promise.all([
        sb.from('dev_areas').select('nome, nivel_atual').eq('user_id', userId).order('ordem'),
        sb.from('skills').select('nome, nivel_atual, dev_area_id').eq('user_id', userId),
        sb.from('readings').select('titulo, autor').eq('user_id', userId).eq('status', 'lido').order('data_conclusao', { ascending: false }).limit(10),
        sb
          .from('dev_suggestions')
          .select('titulo, tipo')
          .eq('user_id', userId)
          .gte('semana_sugestao', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
          .limit(20),
      ])

      const contexto = JSON.stringify({
        areas: areas.data ?? [],
        habilidades: skills.data ?? [],
        leituras_recentes: leituras.data ?? [],
        sugestoes_ultimas_4_semanas: sugestoesRecentes.data ?? [],
      }, null, 2)

      const sugestoes = await gerarSugestoes(contexto)

      // Salvar sugestões
      const rows = sugestoes.map((s: unknown) => {
        const sug = s as Record<string, unknown>
        return {
          user_id: userId,
          semana_sugestao: semana,
          tipo: sug.tipo,
          titulo: sug.titulo,
          autor_ou_diretor: sug.autor_ou_diretor ?? null,
          plataforma: sug.plataforma ?? null,
          motivo: sug.motivo ?? null,
          habilidades_alvo: sug.habilidades_alvo ?? null,
          area: sug.area ?? null,
          status: 'pendente',
        }
      })

      if (rows.length > 0) {
        const { error: insertError } = await sb.from('dev_suggestions').insert(rows)
        if (insertError) throw insertError
      }

      resultados.push({ user_id: userId, sugestoes_geradas: rows.length })
    }

    return jsonResponse({ ok: true, semana, resultados })
  } catch (error) {
    console.error('weekly-suggestions error', error)
    const detail = error instanceof Error ? error.message : String(error)
    return jsonResponse({ error: detail }, 500)
  }
})
