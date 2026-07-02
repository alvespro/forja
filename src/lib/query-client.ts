import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Tradução de erros técnicos para mensagens acionáveis.
 * Mantém o detalhe técnico no console para debug.
 */
export function humanizeError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)

  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
  }
  if (/jwt|token|não autenticado|not authenticated|401/i.test(msg)) {
    return 'Sessão expirada. Faça login novamente.'
  }
  if (/row-level security|rls|permission denied|403/i.test(msg)) {
    return 'Sem permissão para essa operação.'
  }
  if (/duplicate key|unique constraint|23505/i.test(msg)) {
    return 'Esse registro já existe.'
  }
  if (/foreign key|23503/i.test(msg)) {
    return 'Registro vinculado a outros dados — não foi possível completar.'
  }
  if (/timeout|timed out|57014/i.test(msg)) {
    return 'O servidor demorou para responder. Tente novamente.'
  }
  return msg || 'Algo deu errado. Tente novamente.'
}

/**
 * Meta reconhecida nas queries/mutações:
 * - silent: true       → falha sem toast (ex.: telemetria, upsert de score)
 * - errorMessage: str  → prefixo amigável no toast em vez do padrão
 */
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { silent?: boolean; errorMessage?: string }
    mutationMeta: { silent?: boolean; errorMessage?: string }
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        // Erros de autenticação/permissão não se resolvem com retry
        const msg = error instanceof Error ? error.message : ''
        if (/jwt|401|403|row-level security/i.test(msg)) return false
        return failureCount < 2
      },
    },
    mutations: {
      // Uma retentativa automática para falhas transitórias de rede
      retry: (failureCount, error) => {
        const msg = error instanceof Error ? error.message : ''
        return failureCount < 1 && /failed to fetch|networkerror/i.test(msg)
      },
    },
  },

  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('[query]', query.queryKey, error)
      // Leituras já têm ErrorState/isError nas páginas; toast apenas quando pedido
      if (query.meta?.errorMessage) {
        toast.error(query.meta.errorMessage, { description: humanizeError(error) })
      }
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      console.error('[mutation]', mutation.options.mutationKey ?? '', error)
      if (mutation.meta?.silent) return
      toast.error(mutation.meta?.errorMessage ?? 'Não foi possível salvar', {
        description: humanizeError(error),
      })
    },
  }),
})
