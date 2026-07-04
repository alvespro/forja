// protocol-reminders — Edge Function agendada (diária, ~08h BRT)
// Verifica protocolos ativos e gera lembretes em `notifications`:
//   1. 3+ dias sem registrar aplicação (protocolo ativo)
//   2. Exame previsto nos próximos 3 dias (por data_prevista ou por semana_alvo)
//   3. Exame atrasado (idem; atualiza status para 'atrasado' e reincide 1×/semana)
// Dedupe via unique index (user_id, dedupe_key). Chamável via POST para testes.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

function todaySaoPaulo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T12:00:00Z').getTime() - new Date(a + 'T12:00:00Z').getTime()) / 86_400_000,
  )
}

/** Bucket semanal (âncora numa segunda-feira fixa) para lembretes que devem reincidir. */
function weekBucket(dateStr: string): number {
  return Math.floor(daysBetween('2026-01-05', dateStr) / 7)
}

type NotificationRow = {
  user_id: string
  tipo: string
  titulo: string
  corpo: string | null
  link: string | null
  dedupe_key: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  // Guard anti-abuso: com CRON_SECRET definido, só o cron consegue invocar
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const today = todaySaoPaulo()
  const em3dias = addDays(today, 3)

  try {
    const { data: protocols, error: pErr } = await sb
      .from('protocols')
      .select('id, user_id, nome, status, data_inicio')
      .in('status', ['planejado', 'ativo', 'tpc'])
    if (pErr) throw pErr

    const notifications: NotificationRow[] = []
    let examesAtrasados = 0

    for (const p of protocols ?? []) {
      // ── 1. Dias sem registrar aplicação (só ciclo ativo) ──────────────
      if (p.status === 'ativo') {
        const { data: lastLog } = await sb
          .from('protocol_logs')
          .select('data_aplicacao')
          .eq('protocol_id', p.id)
          .order('data_aplicacao', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastLog?.data_aplicacao) {
          const dias = daysBetween(lastLog.data_aplicacao, today)
          if (dias >= 3) {
            notifications.push({
              user_id: p.user_id,
              tipo: 'protocolo',
              titulo: `💉 ${dias} dias sem registrar aplicação`,
              corpo: `Último registro em ${lastLog.data_aplicacao}. Mantenha o log do protocolo "${p.nome}" atualizado.`,
              link: '/protocolo',
              dedupe_key: `sem_log_${p.id}_${today}`,
            })
          }
        }
      }

      // ── 2. Exames próximos (≤3 dias) e 3. atrasados ───────────────────
      const { data: exams, error: eErr } = await sb
        .from('protocol_exams')
        .select('id, nome, status, data_prevista, semana_alvo')
        .eq('protocol_id', p.id)
        .neq('status', 'realizado')
      if (eErr) throw eErr

      for (const exam of exams ?? []) {
        // Prazo: data_prevista quando existe; senão o último dia da semana-alvo
        // (data_inicio + semana_alvo*7 − 1) — mesmo critério do isExamOverdue do frontend.
        const prevista = exam.data_prevista as string | null
        const alvo =
          prevista ??
          (p.data_inicio && exam.semana_alvo != null
            ? addDays(p.data_inicio, exam.semana_alvo * 7 - 1)
            : null)
        if (!alvo) continue

        if (alvo >= today && alvo <= em3dias) {
          const dias = daysBetween(today, alvo)
          notifications.push({
            user_id: p.user_id,
            tipo: 'exame',
            titulo: `🧪 Exame "${exam.nome}" ${dias === 0 ? 'é hoje' : `em ${dias} dia(s)`}`,
            corpo: prevista
              ? `Previsto para ${alvo}. Protocolo "${p.nome}".`
              : `Alvo: semana ${exam.semana_alvo} do protocolo "${p.nome}" (até ${alvo}).`,
            link: '/protocolo',
            dedupe_key: `exame_prox_${exam.id}_${alvo}`,
          })
        }

        if (alvo < today) {
          notifications.push({
            user_id: p.user_id,
            tipo: 'exame',
            titulo: `🚨 Exame "${exam.nome}" atrasado`,
            corpo: prevista
              ? `Estava previsto para ${alvo}. Reagende ou registre o resultado.`
              : `Alvo era a semana ${exam.semana_alvo} do protocolo "${p.nome}". Reagende ou registre o resultado.`,
            link: '/protocolo',
            // Bucket semanal: reincide 1×/semana enquanto atrasado (antes era 1× para sempre).
            dedupe_key: `exame_atrasado_${exam.id}_s${weekBucket(today)}`,
          })
          if (exam.status !== 'atrasado') {
            await sb.from('protocol_exams').update({ status: 'atrasado' }).eq('id', exam.id)
            examesAtrasados++
          }
        }
      }
    }

    let inseridas = 0
    if (notifications.length > 0) {
      const { data: upserted, error: nErr } = await sb
        .from('notifications')
        .upsert(notifications, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
        .select('id')
      if (nErr) throw nErr
      inseridas = upserted?.length ?? 0
    }

    return jsonResponse({
      ok: true,
      protocolos_verificados: protocols?.length ?? 0,
      lembretes_gerados: inseridas,
      exames_marcados_atrasados: examesAtrasados,
    })
  } catch (e) {
    console.error('protocol-reminders error:', e)
    return jsonResponse({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
