// analyze-progress-photo — analisa foto de progresso com Claude vision.
// Recebe { photo_id }, valida que a foto é do usuário autenticado, monta o
// contexto (histórico de peso, fotos anteriores, treinos) e salva o relatório
// em progress_photos.relatorio_ia.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function mimeFromPath(path: string): string {
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

const SYSTEM_PROMPT = `Você é o Monitor Visual do FORJA, analisando fotos de progresso físico de Welber (32 anos, treino de força + recomposição corporal).

Sua análise tem exatamente duas partes, em português, tom franco e motivador (pancada e pra cima, com realidade):

**Evolução visível**: o que a foto mostra em comparação com o histórico fornecido (composição, postura, volume muscular aparente, definição). Se for a primeira foto, descreva o ponto de partida com honestidade e respeito — é a linha de base da transformação.

**Próximo avanço**: UM foco concreto e acionável para as próximas 4 semanas, coerente com os dados de treino e peso fornecidos.

Regras:
- 4 a 6 frases no total, direto ao ponto.
- Baseie-se apenas no que é visível + dados fornecidos. Sem diagnósticos médicos.
- NUNCA sugerir compostos, doses ou protocolos hormonais — decisões do médico responsável.
- Sem elogios vazios: aponte o real, celebre o que evoluiu de verdade.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    // Autentica o usuário real (não basta a publishable key)
    const authHeader = req.headers.get('Authorization') ?? ''
    const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await sbUser.auth.getUser()
    if (!user) return jsonResponse({ error: 'Não autenticado' }, 401)

    const { photo_id } = await req.json().catch(() => ({}))
    if (!photo_id) return jsonResponse({ error: 'photo_id é obrigatório' }, 400)

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Foto deve pertencer ao usuário autenticado
    const { data: photo, error: photoError } = await sb
      .from('progress_photos')
      .select('*')
      .eq('id', photo_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (photoError) throw photoError
    if (!photo) return jsonResponse({ error: 'Foto não encontrada' }, 404)

    // Baixa a imagem do bucket privado
    const { data: file, error: dlError } = await sb.storage
      .from('progress-photos')
      .download(photo.storage_path)
    if (dlError) throw dlError
    const base64 = arrayBufferToBase64(await file.arrayBuffer())

    // ── Contexto: histórico de peso, fotos anteriores, treinos ──
    const [metricsRes, prevPhotosRes, workoutsRes] = await Promise.all([
      sb
        .from('body_metrics')
        .select('medido_em, peso_kg, gordura_pct, musculo_pct')
        .eq('user_id', user.id)
        .order('medido_em', { ascending: false })
        .limit(8),
      sb
        .from('progress_photos')
        .select('data, peso_kg, relatorio_ia')
        .eq('user_id', user.id)
        .neq('id', photo_id)
        .order('data', { ascending: false })
        .limit(3),
      sb
        .from('workout_sessions')
        .select('performed_at')
        .eq('user_id', user.id)
        .gte('performed_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
        .limit(50),
    ])

    const metrics = metricsRes.data ?? []
    const prevPhotos = prevPhotosRes.data ?? []
    const treinos30d = workoutsRes.data?.length ?? 0

    const contexto = [
      `FOTO ATUAL: ${photo.data}, tipo ${photo.tipo ?? 'frente'}${photo.peso_kg ? `, peso ${photo.peso_kg}kg` : ''}${photo.notas ? `, notas: ${photo.notas}` : ''}`,
      metrics.length > 0
        ? `HISTÓRICO DE PESO (recente→antigo): ${metrics.map((m) => `${m.medido_em}: ${m.peso_kg ?? '?'}kg${m.gordura_pct ? ` / ${m.gordura_pct}% gordura` : ''}`).join(' | ')}`
        : 'Sem medições corporais registradas.',
      prevPhotos.length > 0
        ? `FOTOS ANTERIORES: ${prevPhotos.map((p) => `${p.data}${p.peso_kg ? ` (${p.peso_kg}kg)` : ''}${p.relatorio_ia ? ` — análise anterior: "${p.relatorio_ia.slice(0, 200)}"` : ''}`).join(' || ')}`
        : 'Primeira foto de progresso — linha de base.',
      `TREINOS NOS ÚLTIMOS 30 DIAS: ${treinos30d}`,
    ].join('\n')

    // ── Claude vision ──
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeFromPath(photo.storage_path),
                  data: base64,
                },
              },
              { type: 'text', text: `CONTEXTO:\n${contexto}\n\nAnalise a evolução e aponte o próximo avanço.` },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API ${response.status}: ${err}`)
    }

    const data = await response.json()
    const relatorio: string =
      data.content?.find((b: { type: string }) => b.type === 'text')?.text?.trim() ?? ''
    if (!relatorio) throw new Error('Análise vazia do modelo')

    const { error: updateError } = await sb
      .from('progress_photos')
      .update({ relatorio_ia: relatorio })
      .eq('id', photo_id)
    if (updateError) throw updateError

    return jsonResponse({ ok: true, relatorio })
  } catch (e) {
    console.error('analyze-progress-photo error:', e)
    return jsonResponse({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
