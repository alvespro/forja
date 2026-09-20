import { supabase } from '@/lib/supabase'
import type { StudyNote } from '@/types/database'

export type NotaSyncStatus = 'synced' | 'pending' | 'conflict' | 'deleted'

export type NotaLocal = StudyNote & {
  sync_status: NotaSyncStatus
  /** Versão remota sobre a qual a edição local foi feita. */
  base_updated_at: string | null
  server_copy?: StudyNote
}

const DB_NAME = 'forja-offline'
const STORE = 'study-notes'
const COLUNAS = 'id, user_id, titulo, conteudo, tags, fonte_tipo, fonte_id, favorito, created_at, updated_at'

function chave(userId: string, id: string) {
  return `${userId}:${id}`
}

function banco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

type Registro = NotaLocal & { key: string }

async function todosRegistros(userId: string): Promise<Registro[]> {
  const db = await banco()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    request.onsuccess = () => {
      db.close()
      resolve((request.result as Registro[]).filter((item) => item.user_id === userId))
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

async function salvarRegistro(nota: NotaLocal) {
  const db = await banco()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put({ ...nota, key: chave(nota.user_id, nota.id) })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
  db.close()
}

async function removerRegistro(userId: string, id: string) {
  const db = await banco()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(chave(userId, id))
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
  db.close()
}

function gerarId() {
  return crypto.randomUUID()
}

/** Leitura usada pela interface: notas apagadas ficam apenas como operação pendente. */
export async function listarNotasLocais(userId: string): Promise<NotaLocal[]> {
  const registros = await todosRegistros(userId)
  return registros
    .filter((nota) => nota.sync_status !== 'deleted')
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
}

export async function obterNotaLocal(userId: string, id: string): Promise<NotaLocal | null> {
  const registros = await todosRegistros(userId)
  return registros.find((nota) => nota.id === id && nota.sync_status !== 'deleted') ?? null
}

export async function salvarNotaLocal(userId: string, id: string | undefined, values: Omit<StudyNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<NotaLocal> {
  const existente = id ? await obterNotaLocal(userId, id) : null
  const agora = new Date().toISOString()
  const nota: NotaLocal = {
    id: id ?? gerarId(),
    user_id: userId,
    titulo: values.titulo,
    conteudo: values.conteudo,
    tags: values.tags,
    fonte_tipo: values.fonte_tipo,
    fonte_id: values.fonte_id,
    favorito: values.favorito,
    created_at: existente?.created_at ?? agora,
    updated_at: agora,
    // Ao editar um conflito, a cópia remota vira a nova base: a edição do usuário resolve-o explicitamente.
    base_updated_at: existente?.sync_status === 'conflict' ? existente.server_copy?.updated_at ?? null : existente?.updated_at ?? null,
    sync_status: 'pending',
  }
  await salvarRegistro(nota)
  return nota
}

export async function marcarNotaExcluida(userId: string, id: string) {
  const nota = await obterNotaLocal(userId, id)
  if (!nota) return
  // Nota criada e removida antes de qualquer conexão não precisa chegar ao servidor.
  if (!nota.base_updated_at) return removerRegistro(userId, id)
  await salvarRegistro({ ...nota, sync_status: 'deleted', updated_at: new Date().toISOString() })
}

function payload(nota: NotaLocal) {
  return {
    id: nota.id,
    user_id: nota.user_id,
    titulo: nota.titulo,
    conteudo: nota.conteudo,
    tags: nota.tags,
    fonte_tipo: nota.fonte_tipo,
    fonte_id: nota.fonte_id,
    favorito: nota.favorito,
    created_at: nota.created_at,
    updated_at: nota.updated_at,
  }
}

/**
 * Replica a fila local quando houver conexão. Conflitos não são sobrescritos:
 * ficam assinalados até o usuário editar novamente a anotação.
 */
export async function sincronizarNotas(userId: string): Promise<void> {
  if (!navigator.onLine) return
  try {
    const [locais, resposta] = await Promise.all([
      todosRegistros(userId),
      supabase.from('study_notes').select(COLUNAS).order('updated_at', { ascending: false }),
    ])
    if (resposta.error) return
    const remotas = new Map((resposta.data as StudyNote[]).map((nota) => [nota.id, nota]))

    for (const local of locais) {
      const remota = remotas.get(local.id)
      if (local.sync_status === 'synced') {
        if (remota && (remota.updated_at ?? '') > (local.updated_at ?? '')) {
          await salvarRegistro({ ...remota, sync_status: 'synced', base_updated_at: remota.updated_at })
        }
        continue
      }

      if (local.sync_status === 'deleted') {
        if (remota && local.base_updated_at && (remota.updated_at ?? '') > local.base_updated_at) {
          await salvarRegistro({ ...local, sync_status: 'conflict', server_copy: remota })
          continue
        }
        if (remota) {
          const { error } = await supabase.from('study_notes').delete().eq('id', local.id)
          if (error) continue
        }
        await removerRegistro(userId, local.id)
        continue
      }

      // A nota mudou em outro dispositivo desde a última versão conhecida localmente.
      if (remota && local.base_updated_at && (remota.updated_at ?? '') > local.base_updated_at) {
        await salvarRegistro({ ...local, sync_status: 'conflict', server_copy: remota })
        continue
      }

      const { data, error } = await supabase.from('study_notes').upsert(payload(local)).select(COLUNAS).single()
      if (error || !data) continue
      const sincronizada = data as StudyNote
      await salvarRegistro({ ...sincronizada, sync_status: 'synced', base_updated_at: sincronizada.updated_at })
    }

    // Depois da fila, traz ao cache as notas que só existem no servidor.
    const { data: atualizadas, error } = await supabase.from('study_notes').select(COLUNAS).order('updated_at', { ascending: false })
    if (error) return
    const aposFila = new Map((await todosRegistros(userId)).map((nota) => [nota.id, nota]))
    for (const remota of atualizadas as StudyNote[]) {
      const local = aposFila.get(remota.id)
      if (!local || local.sync_status === 'synced') {
        if (!local || (remota.updated_at ?? '') >= (local.updated_at ?? '')) {
          await salvarRegistro({ ...remota, sync_status: 'synced', base_updated_at: remota.updated_at })
        }
      }
    }
  } catch {
    // Falhas de rede e IndexedDB mantêm a fila intacta; nova conexão tenta de novo.
  }
}

export function buscarNotasLocais(notas: NotaLocal[], termo: string) {
  const busca = termo.trim().toLocaleLowerCase('pt-BR')
  if (!busca) return notas
  return notas.filter((nota) => [nota.titulo, nota.conteudo ?? '', ...(nota.tags ?? [])].join(' ').toLocaleLowerCase('pt-BR').includes(busca))
}
