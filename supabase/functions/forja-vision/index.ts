// FORJA — Document Vision: lê foto/PDF de exame, treino, dieta ou suplementação via Claude Vision
// e extrai dados estruturados em JSON. Não grava nas tabelas finais (isso é feito pelo frontend
// depois que o usuário confirma o preview) — só salva o JSON bruto em `document_imports`.

import { createClient } from 'jsr:@supabase/supabase-js@2'

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Secret ausente: ${name}`)
  return value
}

const SUPABASE_URL = requiredEnv('SUPABASE_URL')
const SUPABASE_ANON_KEY = requiredEnv('SUPABASE_ANON_KEY')
const ANTHROPIC_API_KEY = requiredEnv('ANTHROPIC_API_KEY')
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type DocumentoTipo = 'exame' | 'treino' | 'dieta' | 'suplemento'

const SYSTEM_PROMPTS: Record<DocumentoTipo, string> = {
  exame: `Você lê exames laboratoriais (foto ou PDF) e extrai os marcadores em JSON puro — sem markdown, sem texto antes ou depois, só o JSON. Estrutura exata:
{
  "tipo": "exame",
  "data_coleta": "YYYY-MM-DD ou null",
  "laboratorio": "string ou null",
  "marcadores": [{
    "chave": "glicemia|ldl|hdl|colesterol_total|triglicerides|lpa|tsh|vitamina_d|vitamina_b12|testosterona_total|testosterona_livre|hemoglobina_glicada|insulina|acido_urico|pcr|outro",
    "label": "string",
    "valor": number,
    "unidade": "string",
    "referencia_min": number|null,
    "referencia_max": number|null,
    "status": "normal|atencao|alerta"
  }]
}
Se não conseguir identificar nenhum marcador com confiança, retorne "marcadores": [].`,
  treino: `Você lê planilhas/fotos de prescrição de treino e extrai os exercícios em JSON puro — sem markdown, sem texto antes ou depois, só o JSON. Estrutura exata:
{
  "tipo": "treino",
  "nome_treino": "string",
  "foco": "string",
  "exercicios": [{
    "nome": "string",
    "grupo_muscular": "peito|costas|pernas|ombro|biceps|triceps|core|gluteo|outro",
    "series_alvo": number,
    "reps_alvo": "string",
    "pausa_seg": number|null,
    "cadencia": "string|null",
    "carga_sugerida_kg": number|null,
    "notas": "string|null"
  }]
}
Se não conseguir identificar nenhum exercício com confiança, retorne "exercicios": [].`,
  dieta: `Você lê planos alimentares (foto ou PDF) e extrai a estrutura em JSON puro — sem markdown, sem texto antes ou depois, só o JSON. Estrutura exata:
{
  "tipo": "dieta",
  "nome_plano": "string",
  "calorias_alvo": number|null,
  "proteina_g": number|null,
  "carbo_g": number|null,
  "gordura_g": number|null,
  "refeicoes": [{
    "numero": number,
    "nome": "string",
    "horario": "HH:MM|null",
    "tipo": "cafe_manha|pre_treino|pos_treino|almoco|lanche|jantar",
    "calorias_alvo": number|null,
    "proteina_g_alvo": number|null,
    "carbo_g_alvo": number|null,
    "gordura_g_alvo": number|null,
    "alimentos": ["string"],
    "notas": "string|null"
  }]
}
Se não conseguir identificar nenhuma refeição com confiança, retorne "refeicoes": [].`,
  suplemento: `Você lê protocolos/rótulos de suplementação (foto ou PDF) e extrai em JSON puro — sem markdown, sem texto antes ou depois, só o JSON. Estrutura exata:
{
  "tipo": "suplemento",
  "suplementos": [{
    "nome": "string",
    "tipo": "whey|creatina|vitamina|pre_treino|omega3|minerais|outro",
    "dose": "string",
    "unidade": "g|ml|caps|comprimidos",
    "momento": "jejum|cafe_manha|pre_treino|pos_treino|almoco|jantar|dormir|qualquer",
    "dias_semana": ["seg","ter","qua","qui","sex","sab","dom"]|null,
    "notas": "string|null"
  }]
}
Se não conseguir identificar nenhum suplemento com confiança, retorne "suplementos": [].`,
}

const ARRAY_FIELD_BY_TIPO: Record<DocumentoTipo, string> = {
  exame: 'marcadores',
  treino: 'exercicios',
  dieta: 'refeicoes',
  suplemento: 'suplementos',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function mimeFromPath(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    default:
      return null
  }
}

/** Converte ArrayBuffer em base64 em pedaços — evitar stack overflow do String.fromCharCode(...bytes) com arquivos grandes. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let result = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    result += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(result)
}

/** Remove blocos de markdown (```json ... ```) que o modelo às vezes adiciona mesmo quando instruído a não fazer isso. */
function stripMarkdownFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1].trim() : trimmed
}

async function callClaudeVision(
  systemPrompt: string,
  mimeType: string,
  base64Data: string,
): Promise<string> {
  const isPdf = mimeType === 'application/pdf'
  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: mimeType, data: base64Data } }
    : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [contentBlock, { type: 'text', text: 'Extraia os dados deste documento conforme as instruções.' }],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  const text = data.content?.find((block: { type: string }) => block.type === 'text')?.text
  if (!text) throw new Error('Resposta da Anthropic sem conteúdo de texto')
  return text
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

  // Cliente com o JWT do usuário (anon key): RLS garante que só os dados dele são lidos/gravados.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await sb.auth.getUser()
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Sessão inválida' }, 401)
  }
  const userId = userData.user.id

  let body: { document_import_id?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }
  const documentImportId = body.document_import_id
  if (!documentImportId) {
    return jsonResponse({ error: 'document_import_id é obrigatório' }, 400)
  }

  try {
    const { data: docImport, error: fetchError } = await sb
      .from('document_imports')
      .select('id, user_id, tipo, storage_path')
      .eq('id', documentImportId)
      .eq('user_id', userId)
      .single()
    if (fetchError || !docImport) throw new Error('Importação não encontrada')

    const tipo = docImport.tipo as DocumentoTipo
    if (!(tipo in SYSTEM_PROMPTS)) {
      throw new Error(`Tipo de documento "${tipo}" não é suportado pela leitura por IA`)
    }

    const { data: signed, error: signedError } = await sb.storage
      .from('documents')
      .createSignedUrl(docImport.storage_path, 60)
    if (signedError || !signed) throw new Error(`Falha ao gerar URL assinada: ${signedError?.message}`)

    const fileResponse = await fetch(signed.signedUrl)
    if (!fileResponse.ok) throw new Error(`Falha ao baixar o arquivo (${fileResponse.status})`)

    const contentType = fileResponse.headers.get('content-type')
    const mimeType =
      (contentType && /^(application\/pdf|image\/(jpeg|png|webp))$/.test(contentType) ? contentType : null) ??
      mimeFromPath(docImport.storage_path)
    if (!mimeType) throw new Error('Tipo de arquivo não suportado (use JPEG, PNG, WebP ou PDF)')

    const buffer = await fileResponse.arrayBuffer()
    const base64Data = arrayBufferToBase64(buffer)

    const rawText = await callClaudeVision(SYSTEM_PROMPTS[tipo], mimeType, base64Data)
    const cleaned = stripMarkdownFences(rawText)

    let dados: Record<string, unknown>
    try {
      dados = JSON.parse(cleaned)
    } catch {
      throw new Error('A IA não retornou um JSON válido para este documento')
    }

    const arrayField = ARRAY_FIELD_BY_TIPO[tipo]
    const extracted = dados[arrayField]
    if (!Array.isArray(extracted) || extracted.length === 0) {
      throw new Error(
        'Não consegui ler este documento. Tente uma foto com mais luz ou um PDF de melhor qualidade.',
      )
    }

    await sb.from('document_imports').update({ dados_extraidos: dados }).eq('id', documentImportId)

    return jsonResponse({ dados })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('forja-vision error', error)
    try {
      await sb.from('document_imports').update({ status: 'erro', erro: message }).eq('id', documentImportId)
    } catch (updateError) {
      console.error('forja-vision: falha ao registrar erro', updateError)
    }
    return jsonResponse({ error: message }, 500)
  }
})
