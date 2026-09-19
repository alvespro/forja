// daily-briefing — o Mentor 5AM fala primeiro.
// Cron diário (5h BRT = 8h UTC): monta o contexto do dia de cada usuário,
// gera um briefing curto via Claude e salva em notifications (tipo 'briefing',
// 1 por dia via dedupe). Aparece no card de lembretes do Hoje.

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

function todaySaoPaulo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function addDias(dateStr: string, dias: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

const SYSTEM_PROMPT = `Você é o Mentor 5AM do FORJA, o briefing matinal de Welber (32, empresário imobiliário, 3w2, treino de força + recomposição com protocolo médico supervisionado).

Com o contexto do dia, escreva o briefing das 5h em NO MÁXIMO 4 frases:
1. O placar de ontem em uma frase honesta (sem massagear).
2. A prioridade inegociável de hoje (sapo se definido; senão, aponte a falta dele).
3. Um lembrete tático (exame próximo, ação de CRM vencendo, streak em jogo — o que for mais urgente).
4. Feche com UMA pergunta curta de reflexão calibrada para um 3w2 (ser vs. parecer, o que está evitando).

Tom: direto, pancada e pra cima. Sem saudação, sem emoji no início, sem markdown.
NUNCA sugerir compostos, doses ou mudanças no protocolo médico.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret) {
    return jsonResponse({ ok: false, error: 'cron_not_configured' }, 503)
  }
  if (req.headers.get('x-cron-secret') !== cronSecret) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const today = todaySaoPaulo()
  const yest = addDias(today, -1)
  const em3dias = addDias(today, 3)

  try {
    const { data: users, error: usersError } = await sb.auth.admin.listUsers()
    if (usersError) throw usersError

    const resultados: unknown[] = []

    for (const user of users.users) {
      const userId = user.id

      // 1 briefing por dia
      const dedupe = `briefing_${today}`
      const { data: existente } = await sb
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('dedupe_key', dedupe)
        .maybeSingle()
      if (existente) {
        resultados.push({ user_id: userId, status: 'ja_tem' })
        continue
      }

      const [scoreOntem, sapoHoje, examesProximos, crmHoje, humorRecente] = await Promise.all([
        sb.from('daily_scores').select('pontos, total, rest_day').eq('user_id', userId).eq('data', yest).maybeSingle(),
        sb.from('tasks').select('titulo, status').eq('user_id', userId).eq('data', today).eq('e_frog', true).limit(1).maybeSingle(),
        sb.from('protocol_exams').select('nome, data_prevista').eq('user_id', userId).neq('status', 'realizado').not('data_prevista', 'is', null).lte('data_prevista', em3dias).limit(3),
        sb.from('crm_clients').select('nome, proxima_acao').eq('user_id', userId).lte('data_proxima_acao', today).limit(3),
        sb.from('journal_entries').select('humor, data').eq('user_id', userId).eq('tipo', 'diario').order('data', { ascending: false }).limit(5),
      ])

      const pctOntem = scoreOntem.data?.total
        ? Math.round((scoreOntem.data.pontos / scoreOntem.data.total) * 100)
        : null

      const contexto = JSON.stringify({
        data_de_hoje: today,
        placar_de_ontem: scoreOntem.data
          ? { pct: pctOntem, rest_day: scoreOntem.data.rest_day }
          : 'sem registro',
        sapo_de_hoje: sapoHoje.data?.titulo ?? 'NÃO DEFINIDO',
        exames_vencendo: examesProximos.data ?? [],
        crm_acoes_hoje: crmHoje.data ?? [],
        humor_ultimos_5_dias: (humorRecente.data ?? []).map((j) => j.humor),
      })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `CONTEXTO:\n${contexto}\n\nEscreva o briefing das 5h.` }],
        }),
      })
      if (!response.ok) throw new Error(`Anthropic API ${response.status}: ${await response.text()}`)

      const data = await response.json()
      const briefing: string =
        data.content?.find((b: { type: string }) => b.type === 'text')?.text?.trim() ?? ''
      if (!briefing) {
        resultados.push({ user_id: userId, status: 'vazio' })
        continue
      }

      const { error: insertError } = await sb.from('notifications').insert({
        user_id: userId,
        tipo: 'briefing',
        titulo: '🌅 Briefing 5AM',
        corpo: briefing,
        link: '/journal',
        dedupe_key: dedupe,
      })
      if (insertError) throw insertError
      resultados.push({ user_id: userId, status: 'gerado' })
    }

    return jsonResponse({ ok: true, data: today, resultados })
  } catch (e) {
    console.error('daily-briefing error:', e)
    return jsonResponse({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
