// FORJA — sincronização diária com o Yazio (API não-oficial e reversa, sem suporte da Yazio).
// Busca as refeições do dia anterior no diário do Yazio, identifica o `meal_slot` mais próximo
// pelo horário e grava em `meal_logs` (upsert por `yazio_sync_id`, sem duplicar). Registra cada
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

type ConsumedItem = {
  id: string
  product_id: string | null
  date: string // 'YYYY-MM-DD HH:MM:SS'
  daytime: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  amount: number
}

type ProductDetail = {
  name: string
  nutrients?: Record<string, number>
}

type MealSlotRow = {
  id: string
  horario_alvo: string | null // 'HH:MM:SS'
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Escolhe o meal_slot cujo horario_alvo está mais próximo do horário do item consumido. */
function nearestSlot(itemDate: string, slots: MealSlotRow[]): string | null {
  const withHorario = slots.filter((s) => s.horario_alvo)
  if (withHorario.length === 0) return null

  const timePart = itemDate.split(' ')[1] ?? '12:00:00'
  const itemMinutes = timeToMinutes(timePart)

  let closest = withHorario[0]
  let smallestDiff = Infinity
  for (const slot of withHorario) {
    const diff = Math.abs(timeToMinutes(slot.horario_alvo as string) - itemMinutes)
    if (diff < smallestDiff) {
      smallestDiff = diff
      closest = slot
    }
  }
  return closest.id
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

type MealLogRow = {
  user_id: string
  meal_slot_id: string | null
  data: string
  descricao: string
  calorias: number
  proteina_g: number
  carbo_g: number
  gordura_g: number
  fonte: 'yazio'
  yazio_sync_id: string
}

async function buildMealLogsFromDiary(
  token: string,
  date: string,
  items: ConsumedItem[],
  slots: MealSlotRow[],
): Promise<MealLogRow[]> {
  const uniqueProductIds = [...new Set(items.map((item) => item.product_id).filter((id): id is string => !!id))]
  const products = new Map<string, ProductDetail>()
  await Promise.all(
    uniqueProductIds.map(async (id) => {
      const detail = await getProductDetail(token, id)
      if (detail) products.set(id, detail)
    }),
  )

  return items.map((item) => {
    const product = item.product_id ? products.get(item.product_id) : undefined
    const kcalPerG = product?.nutrients?.['energy.energy'] ?? 0
    const proteinPerG = product?.nutrients?.['nutrient.protein'] ?? 0
    const carbPerG = product?.nutrients?.['nutrient.carb'] ?? 0
    const fatPerG = product?.nutrients?.['nutrient.fat'] ?? 0

    return {
      user_id: FORJA_USER_ID,
      meal_slot_id: nearestSlot(item.date, slots),
      data: date,
      descricao: product?.name ?? 'item personalizado',
      calorias: Math.round(item.amount * kcalPerG),
      proteina_g: Math.round(item.amount * proteinPerG * 10) / 10,
      carbo_g: Math.round(item.amount * carbPerG * 10) / 10,
      gordura_g: Math.round(item.amount * fatPerG * 10) / 10,
      fonte: 'yazio' as const,
      yazio_sync_id: item.id,
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
    const { data: dietPlan, error: dietPlanError } = await admin
      .from('diet_plans')
      .select('id')
      .eq('user_id', FORJA_USER_ID)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (dietPlanError) throw new Error(`Falha ao buscar plano ativo: ${dietPlanError.message}`)

    const { data: slots, error: slotsError } = dietPlan
      ? await admin.from('meal_slots').select('id, horario_alvo').eq('diet_plan_id', dietPlan.id)
      : { data: [] as MealSlotRow[], error: null }
    if (slotsError) throw new Error(`Falha ao buscar meal_slots: ${slotsError.message}`)

    const token = await yazioLogin()
    const items = await getConsumedItems(token, date)

    if (items.length === 0) {
      await logSync(admin, date, 'sucesso', 0, null)
      return jsonResponse({ sincronizados: 0, status: 'ok' })
    }

    const mealLogs = await buildMealLogsFromDiary(token, date, items, slots ?? [])

    const { error: upsertError } = await admin
      .from('meal_logs')
      .upsert(mealLogs, { onConflict: 'yazio_sync_id', ignoreDuplicates: false })
    if (upsertError) throw new Error(`Falha ao salvar refeições: ${upsertError.message}`)

    await logSync(admin, date, 'sucesso', mealLogs.length, null)
    return jsonResponse({ sincronizados: mealLogs.length, status: 'ok' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('sync-yazio error', error)
    await logSync(admin, date, 'erro', 0, message)
    return jsonResponse({ sincronizados: 0, status: 'erro', error: message }, 500)
  }
})
