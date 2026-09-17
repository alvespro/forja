import { toast } from 'sonner'

type ErroSupabase = { code?: string; message?: string; details?: string }

/**
 * Mensagem clara em pt-BR para falhas de gravação. Os códigos do Postgres mais comuns
 * viram frases que dizem o que fazer; o resto cai na mensagem original.
 */
export function mensagemDeErro(erro: unknown, acao = 'salvar'): string {
  const e = (erro ?? {}) as ErroSupabase
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return `Sem conexão — não foi possível ${acao}. Tente de novo quando voltar a internet.`
  switch (e.code) {
    case '23503':
      return `Não foi possível ${acao}: existem registros ligados a este item.`
    case '23505':
      return `Não foi possível ${acao}: já existe um registro igual.`
    case '23514':
      return `Não foi possível ${acao}: algum valor está fora do permitido.`
    case '42501':
      return `Sem permissão para ${acao} este item. Entre de novo e tente outra vez.`
    case 'PGRST116':
      return 'Item não encontrado — ele pode ter sido removido.'
  }
  const texto = erro instanceof Error ? erro.message : e.message
  return texto ? `Não foi possível ${acao}. ${texto}` : `Não foi possível ${acao}. Tente de novo.`
}

/** Opções padrão de mutation: toast de sucesso e de erro com mensagem clara. */
export function comToast<TData = unknown, TVars = unknown>(sucesso: string, acao = 'salvar', depois?: (data: TData, vars: TVars) => void) {
  return {
    onSuccess: (data: TData, vars: TVars) => {
      toast.success(sucesso)
      depois?.(data, vars)
    },
    onError: (erro: unknown) => {
      toast.error(mensagemDeErro(erro, acao))
    },
  }
}
