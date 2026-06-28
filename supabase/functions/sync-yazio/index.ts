// FORJA — sincronização diária com o Yazio (API não-oficial e reversa, sem suporte da Yazio).
// Busca as refeições do dia anterior no diário do Yazio e grava em `meals`, registrando cada
// tentativa (sucesso ou erro) em `yazio_sync_logs`.
//
// Autorização: aceita (a) o usuário logado dono dos dados (botão "Sincronizar agora" no app) ou
// (b) um JWT com role "service_role" (chamada feita pelo Cron Job nativo do Supabase). Nenhum
// segredo novo precisa ser criado — o Supabase já assina e valida o JWT antes de chegar aqui.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Secret ausente: ${name}`)
  return value
}

const SUPABASE_URL = requiredEnv('SUPABASE_URL')
const SUPABASE_ANON_KEY = requiredEnv('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

// client_id/client_secret do app Yazio usado pela API reversa (ver README.md para os valores
// públicos a configurar) — fica nos Secrets, não no código, para não persistir nada git-tracked.
// YAZIO_USERNAME/PASSWORD têm .trim() porque o painel de Secrets aceita múltiplas linhas e um
// "\n" colado no final já é o suficiente para a Yazio rejeitar a credencial com 400 vazio.
function yazioCredentials() {
  return {
    clientId: requiredEnv('YAZIO_CLIENT_ID'),
    clientSecret: requiredEnv('YAZIO_CLIENT_SECRET'),
    username: requiredEnv('YAZIO_USERNAME'),
    password: requiredEnv('YAZIO_PASSWORD'),
  }
}

// Dono dos dados no FORJA (projeto de usuário único). Não é um segredo — é só o identificador
// da linha em auth.users, equivalente a um ID de registro qualquer.
const FORJA_USER_ID = '778d59c3-0313-409e-a7ed-a6fcd2bcaadf'

const YAZIO_BASE = 'https://yzapi.yazio.com/v15'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Daytime = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const DAYTIME_INFO: Record<Daytime, { refeicao: number; tipo: string; label: string }> = {
  breakfast: { refeicao: 1, tipo: 'yazio:breakfast', label: 'Café da manhã (Yazio)' },
  lunch: { refeicao: 2, tipo: 'yazio:lunch', label: 'Almoço (Yazio)' },
  dinner: { refeicao: 3, tipo: 'yazio:dinner', label: 'Jantar (Yazio)' },
  snack: { refeicao: 4, tipo: 'yazio:snack', label: 'Lanche (Yazio)' },
}

type ConsumedItem = {
  id: string
  product_id: string | null
  date: string
  daytime: Daytime
  amount: number
}

type ProductDetail = {
  name: string
  nutrients?: Record<string, number>
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Lê o `role` do payload do JWT sem verificar assinatura — o Supabase já validou antes de invocar a function. */
function jwtRole(authHeader: string): string | null {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = JSON.parse(atob(padded))
    return decoded.role ?? null
  } catch {
    return null
  }
}

/** Data de "ontem" no fuso America/Sao_Paulo (UTC-3, sem horário de verão desde 2019). */
function yesterdayInSaoPaulo(): string {
  const spNow = new Date(Date.now() - 3 * 60 * 60 * 1000)
  spNow.setUTCDate(spNow.getUTCDate() - 1)
  return spNow.toISOString().slice(0, 10)
}

async function yazioLogin(): Promise<string> {
  const { clientId, clientSecret, username, password } = yazioCredentials()
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
    grant_type: 'password',
  })

  const response = await fetch(`${YAZIO_BASE}/oauth/token`, { method: 'POST', body: params })
  if (!response.ok) {
    throw new Error(`Login Yazio falhou (${response.status}): ${await response.text()}`)
  }
  const data = await response.json()
  if (!data.access_token) throw new Error('Login Yazio sem access_token na resposta')
  return data.access_token as string
}

async function getConsumedItems(token: string, date: string): Promise<ConsumedItem[]> {
  const response = await fetch(`${YAZIO_BASE}/user/consumed-items?date=${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Buscar diário Yazio falhou (${response.status}): ${await response.text()}`)
  }
  return (await response.json()) as ConsumedItem[]
}

async function getProductDetail(token: string, productId: string): Promise<ProductDetail | null> {
  const response = await fetch(`${YAZIO_BASE}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return null
  return (await response.json()) as ProductDetail
}

type MealRow = {
  user_id: string
  refeicao: number
  descricao: string
  proteina_g: number
  calorias: number
  tipo: string
  data: string
}

async function buildMealsFromDiary(token: string, date: string, items: ConsumedItem[]): Promise<MealRow[]> {
  const uniqueProductIds = [...new Set(items.map((item) => item.product_id).filter((id): id is string => !!id))]
  const products = new Map<string, ProductDetail>()
  await Promise.all(
    uniqueProductIds.map(async (id) => {
      const detail = await getProductDetail(token, id)
      if (detail) products.set(id, detail)
    }),
  )

  const groups = new Map<Daytime, { calorias: number; proteina: number; nomes: string[] }>()
  for (const item of items) {
    const group = groups.get(item.daytime) ?? { calorias: 0, proteina: 0, nomes: [] }
    const product = item.product_id ? products.get(item.product_id) : undefined
    if (product) {
      const kcalPerG = product.nutrients?.['energy.energy'] ?? 0
      const proteinPerG = product.nutrients?.['nutrient.protein'] ?? 0
      group.calorias += item.amount * kcalPerG
      group.proteina += item.amount * proteinPerG
      if (!group.nomes.includes(product.name)) group.nomes.push(product.name)
    } else if (!group.nomes.includes('item personalizado')) {
      group.nomes.push('item personalizado')
    }
    groups.set(item.daytime, group)
  }

  return Array.from(groups.entries()).map(([daytime, group]) => {
    const info = DAYTIME_INFO[daytime]
    return {
      user_id: FORJA_USER_ID,
      refeicao: info.refeicao,
      descricao: group.nomes.join(', ').slice(0, 500) || info.label,
      proteina_g: Math.round(group.proteina * 10) / 10,
      calorias: Math.round(group.calorias),
      tipo: info.tipo,
      data: date,
    }
  })
}

async function logSync(
  admin: SupabaseClient,
  date: string,
  status: 'sucesso' | 'erro',
  registrosImportados: number,
  erro: string | null,
) {
  try {
    await admin
      .from('yazio_sync_logs')
      .insert({ user_id: FORJA_USER_ID, data: date, status, registros_importados: registrosImportados, erro })
  } catch (logError) {
    console.error('sync-yazio: falha ao registrar log', logError)
  }
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

  const role = jwtRole(authHeader)
  let authorized = role === 'service_role'

  if (!authorized) {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userData } = await sb.auth.getUser()
    authorized = userData.user?.id === FORJA_USER_ID
  }

  if (!authorized) {
    return jsonResponse({ error: 'Não autorizado' }, 401)
  }

  let body: { date?: string } = {}
  try {
    body = await req.json()
  } catch {
    // corpo vazio é esperado na chamada do cron — segue com o padrão (ontem)
  }
  const date = body.date ?? yesterdayInSaoPaulo()

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const token = await yazioLogin()
    const items = await getConsumedItems(token, date)
    const meals = items.length > 0 ? await buildMealsFromDiary(token, date, items) : []

    // Idempotente: remove o que já foi importado do Yazio para essa data antes de regravar — mesmo
    // quando o diário está vazio agora (ex: usuário apagou os itens no Yazio desde o último sync).
    await admin.from('meals').delete().eq('user_id', FORJA_USER_ID).eq('data', date).like('tipo', 'yazio:%')

    if (meals.length === 0) {
      await logSync(admin, date, 'sucesso', 0, null)
      return jsonResponse({ status: 'sucesso', data: date, registros_importados: 0 })
    }

    const { error: insertError } = await admin.from('meals').insert(meals)
    if (insertError) throw new Error(`Falha ao salvar refeições: ${insertError.message}`)

    await logSync(admin, date, 'sucesso', items.length, null)
    return jsonResponse({ status: 'sucesso', data: date, registros_importados: items.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('sync-yazio error', error)
    await logSync(admin, date, 'erro', 0, message)
    return jsonResponse({ status: 'erro', data: date, error: message }, 500)
  }
})
