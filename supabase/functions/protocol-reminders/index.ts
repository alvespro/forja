// protocol-reminders — Edge Function agendada (diária, ~08h BRT)
// Verifica protocolos ativos e gera lembretes em `notifications`:
//   1. Dia de aplicação (mesmo dia da semana do início) — "Ciclo semana X de N"
//   2. Última aplicação do ciclo (semana N)
//   3. Aplicação anterior sem registro
//   4. Exames previstos nos próximos 3 dias, agrupados por data (por data_prevista ou semana_alvo)
//   5. Exame atrasado (atualiza status para 'atrasado' e reincide 1×/semana)
// Dedupe via unique index (user_id, dedupe_key). Chamável via POST para testes.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

/** Data (fuso de São Paulo) de um data_aplicacao — timestamp ou data pura (registros antigos). */
function dataSaoPaulo(valor: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor
  return new Date(valor).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

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

  // Usa service role; falhar fechado evita notificações clínicas indevidas se
  // CRON_SECRET não tiver sido configurado no ambiente remoto.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret) {
    return jsonResponse({ ok: false, error: 'cron_not_configured' }, 503)
  }
  if (req.headers.get('x-cron-secret') !== cronSecret) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const today = todaySaoPaulo()
  const em3dias = addDays(today, 3)

  try {
    const { data: protocols, error: pErr } = await sb
      .from('protocols')
      .select('id, user_id, nome, status, data_inicio, duracao_semanas')
      .in('status', ['planejado', 'ativo', 'tpc'])
    if (pErr) throw pErr

    const notifications: NotificationRow[] = []
    let examesAtrasados = 0

    for (const p of protocols ?? []) {
      // ── 1–3. Aplicações do ciclo ativo ────────────────────────────────
      if (p.status === 'ativo' && p.data_inicio) {
        const total = (p.duracao_semanas as number | null) ?? 12
        const dias = daysBetween(p.data_inicio, today)
        const ultimaAplicacao = addDays(p.data_inicio, (total - 1) * 7)

        if (dias >= 0 && dias % 7 === 0 && today <= ultimaAplicacao) {
          const semana = Math.floor(dias / 7) + 1
          notifications.push({
            user_id: p.user_id,
            tipo: 'protocolo',
            titulo: `💉 Dia de aplicação — Ciclo semana ${semana} de ${total}`,
            corpo: `Registre a aplicação de hoje no protocolo "${p.nome}".`,
            link: '/protocolo',
            dedupe_key: `aplicacao_${p.id}_${today}`,
          })
          if (semana === total) {
            notifications.push({
              user_id: p.user_id,
              tipo: 'protocolo',
              titulo: '⚠️ Última aplicação do ciclo esta semana',
              corpo: 'TPC inicia em ~2 semanas.',
              link: '/protocolo',
              dedupe_key: `ultima_aplicacao_${p.id}`,
            })
          }
        }

        // Aplicação mais recente antes de hoje, dentro do ciclo, sem nenhum registro no dia.
        if (dias > 0) {
          const semanasPassadas = Math.min(total - 1, Math.floor((dias - 1) / 7))
          const anterior = addDays(p.data_inicio, semanasPassadas * 7)
          const { data: logs } = await sb
            .from('protocol_logs')
            .select('data_aplicacao')
            .eq('protocol_id', p.id)
            .gte('data_aplicacao', addDays(anterior, -1))
          const registrada = (logs ?? []).some((l) => dataSaoPaulo(l.data_aplicacao as string) === anterior)
          if (!registrada) {
            notifications.push({
              user_id: p.user_id,
              tipo: 'protocolo',
              titulo: `⚠️ Aplicação de ${dataBr(anterior)} não registrada`,
              corpo: 'Você aplicou? Registre agora para manter o histórico do ciclo.',
              link: '/protocolo',
              dedupe_key: `aplicacao_perdida_${p.id}_${anterior}`,
            })
          }
        }
      }

      // ── 4. Exames próximos (≤3 dias, agrupados por data) e 5. atrasados ─
      const { data: exams, error: eErr } = await sb
        .from('protocol_exams')
        .select('id, nome, status, data_prevista, semana_alvo')
        .eq('protocol_id', p.id)
        .neq('status', 'realizado')
      if (eErr) throw eErr

      const proximosPorData = new Map<string, string[]>()
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
          proximosPorData.set(alvo, [...(proximosPorData.get(alvo) ?? []), exam.nome as string])
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

      // Um aviso por data com a lista dos exames (antes: um aviso por exame).
      for (const [alvo, nomes] of proximosPorData) {
        const dias = daysBetween(today, alvo)
        notifications.push({
          user_id: p.user_id,
          tipo: 'exame',
          titulo: dias === 0 ? `🧪 ${nomes.length} exame(s) hoje` : `🧪 Exames em ${dias} dia(s) — agendar agora`,
          corpo: `${dataBr(alvo)}: ${nomes.join(', ')}.`,
          link: '/protocolo',
          dedupe_key: `exames_prox_${p.id}_${alvo}_${today}`,
        })
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
