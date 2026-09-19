import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript'
import { describe, expect, it, vi } from 'vitest'
import { CATEGORIES, categorize, google_body, validate_event } from '../supabase/functions/_shared/calendar'

// Executa o handler real com Auth/Postgres substituídos. Nenhuma chamada externa.
const source = readFileSync(resolve('supabase/functions/google-calendar-sync/index.ts'), 'utf8').replace(/^import .*\n/gm, '')
const code = transpileModule(source, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.None } }).outputText
function setup(authenticated = true, rows: unknown[] = []) {
  let handler: (request: Request) => Promise<Response>
  const eq = vi.fn()
  const from = vi.fn(() => {
    const chain: Record<string, unknown> = {}
    for (const method of ['select', 'delete', 'update', 'insert', 'upsert', 'gt', 'order', 'limit', 'is']) chain[method] = vi.fn(() => chain)
    chain.eq = (...args: unknown[]) => { eq(...args); return chain }
    chain.maybeSingle = async () => ({ data: rows.shift() ?? null, error: null })
    chain.single = chain.maybeSingle
    chain.then = (cb: (result: unknown) => unknown) => Promise.resolve(cb({ data: rows.shift() ?? null, error: null }))
    return chain
  })
  const createClient = vi.fn(() => ({ auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'owner' } : null }, error: null }) }, from }))
  const fetch = vi.fn(() => { throw new Error('External call forbidden in security tests') })
  const Deno = { env: { get: (k: string) => ({ GOOGLE_CLIENT_ID: 'public-client-id', SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'private-key' })[k] }, serve: (fn: typeof handler) => { handler = fn } }
  new Function('Deno', 'createClient', 'CATEGORIES', 'categorize', 'google_body', 'validate_event', 'fetch', code)(Deno, createClient, CATEGORIES, categorize, google_body, validate_event, fetch)
  const invoke = (body: unknown, method = 'POST') => handler(new Request('https://test/function', { method, ...(method === 'POST' ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) }))
  return { invoke, from, eq, createClient, fetch }
}
describe('Google Calendar: limites de autenticação do handler', () => {
  it('rejeita usuário sem sessão antes de criar cliente administrativo', async () => {
    const s = setup(false)
    expect((await s.invoke({ acao: 'sync' })).status).toBe(401)
    expect(s.createClient).toHaveBeenCalledTimes(1)
    expect(s.from).not.toHaveBeenCalled()
  })
  it('não retorna tokens no status da integração', async () => {
    const s = setup(true, [{ access_token: 'private-access', refresh_token: 'private-refresh', last_synced_at: null }])
    const r = await s.invoke({ acao: 'status', user_id: 'attacker-selected-user' })
    const text = await r.text()
    expect(text).not.toContain('private-access')
    expect(text).not.toContain('private-refresh')
    expect(s.eq).toHaveBeenCalledWith('user_id', 'owner')
  })
  it('rejeita retorno OAuth sem state válido antes da troca de código', async () => {
    const s = setup(true, [null])
    expect((await s.invoke({ acao: 'auth_callback', state: 'invented', code: 'code' })).status).toBe(400)
    expect(s.fetch).not.toHaveBeenCalled()
  })
  it('rejeita redirect OAuth para origem não autorizada', async () => {
    const s = setup()
    expect((await s.invoke({ acao: 'auth_start', redirect_uri: 'https://evil.test/auth/google/callback' })).status).toBe(400)
    expect(s.from).not.toHaveBeenCalled()
  })
  it.each(['atualizar_evento', 'deletar_evento'])('não permite %s fora da conta', async acao => {
    const s = setup(true, [null])
    expect((await s.invoke({ acao, id: '11111111-1111-4111-8111-111111111111' })).status).toBe(404)
    expect(s.eq).toHaveBeenCalledWith('user_id', 'owner')
    expect(s.fetch).not.toHaveBeenCalled()
  })
  it('rejeita criação inválida antes de gravar', async () => {
    const s = setup()
    expect((await s.invoke({ acao: 'criar_evento', titulo: '', inicio: 'invalid' })).status).toBe(400)
    expect(s.from).not.toHaveBeenCalled()
  })
  it('permite preflight e rejeita GET', async () => {
    const s = setup()
    expect((await s.invoke(null, 'OPTIONS')).status).toBe(200)
    expect((await s.invoke(null, 'GET')).status).toBe(405)
    expect(s.createClient).not.toHaveBeenCalled()
  })
})
