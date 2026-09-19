// Estudos — revisão espaçada dos flashcards (SM-2 simplificado) e parsing das
// respostas JSON do agente de estudos.

import { addDaysToDateString } from '@/lib/date'

export type Avaliacao = 'errei' | 'dificil' | 'acertei'

/** XP exibido ao concluir uma sessão de revisão. */
export const XP_REVISAO = 20

export type EstadoRevisao = { nivel_revisao: number; acertos: number; erros: number }

export type ProximaRevisao = EstadoRevisao & { proxima_revisao: string; ultima_revisao: string }

/**
 * Errei → amanhã, nível −1 (mín. 0).
 * Difícil → +3 dias, nível mantido (conta como acerto: lembrou, com esforço).
 * Acertei → +2^nível dias, nível +1.
 */
export function agendarRevisao(card: EstadoRevisao, avaliacao: Avaliacao, hoje: string): ProximaRevisao {
  const nivel = Math.max(0, card.nivel_revisao ?? 0)
  const base = { ultima_revisao: hoje, acertos: card.acertos ?? 0, erros: card.erros ?? 0 }
  if (avaliacao === 'errei') {
    return { ...base, erros: base.erros + 1, nivel_revisao: Math.max(0, nivel - 1), proxima_revisao: addDaysToDateString(hoje, 1) }
  }
  if (avaliacao === 'dificil') {
    return { ...base, acertos: base.acertos + 1, nivel_revisao: nivel, proxima_revisao: addDaysToDateString(hoje, 3) }
  }
  return { ...base, acertos: base.acertos + 1, nivel_revisao: nivel + 1, proxima_revisao: addDaysToDateString(hoje, 2 ** nivel) }
}

/** O card está devido hoje (ou atrasado)? */
export function estaDevido(proximaRevisao: string | null, hoje: string): boolean {
  return !proximaRevisao || proximaRevisao <= hoje
}

/** Extrai o primeiro objeto JSON de uma resposta de IA (aceita cercas ```json e texto em volta). */
export function extrairJson<T>(texto: string): T | null {
  const semCerca = texto.replace(/```(?:json)?/gi, '')
  const inicio = semCerca.indexOf('{')
  const fim = semCerca.lastIndexOf('}')
  if (inicio < 0 || fim <= inicio) return null
  try {
    return JSON.parse(semCerca.slice(inicio, fim + 1)) as T
  } catch {
    return null
  }
}

export type FlashcardGerado = { frente: string; verso: string; fonte?: string }

/** Lista de flashcards da resposta `{ flashcards: [...] }`, descartando itens incompletos. */
export function flashcardsDaResposta(texto: string): FlashcardGerado[] {
  const json = extrairJson<{ flashcards?: unknown }>(texto)
  if (!json || !Array.isArray(json.flashcards)) return []
  return json.flashcards
    .filter((f): f is FlashcardGerado => !!f && typeof f.frente === 'string' && typeof f.verso === 'string')
    .map((f) => ({ frente: f.frente.trim(), verso: f.verso.trim(), fonte: typeof f.fonte === 'string' ? f.fonte : undefined }))
    .filter((f) => f.frente && f.verso)
}

export type SugestaoLivro = { titulo: string; autor?: string; motivo?: string; area?: string }

/** Lista de livros da resposta `{ sugestoes: [...] }`. */
export function sugestoesDaResposta(texto: string): SugestaoLivro[] {
  const json = extrairJson<{ sugestoes?: unknown }>(texto)
  if (!json || !Array.isArray(json.sugestoes)) return []
  return json.sugestoes
    .filter((s): s is SugestaoLivro => !!s && typeof s.titulo === 'string' && !!s.titulo.trim())
    .map((s) => ({
      titulo: s.titulo.trim(),
      autor: typeof s.autor === 'string' ? s.autor : undefined,
      motivo: typeof s.motivo === 'string' ? s.motivo : undefined,
      area: typeof s.area === 'string' ? s.area : undefined,
    }))
}

/** Pedido padrão de geração de flashcards a partir de um texto. */
export function promptGerarFlashcards(titulo: string, texto: string, fonte: string): string {
  return (
    `Gere de 3 a 5 flashcards de estudo a partir do conteúdo abaixo (${titulo}).\n` +
    'Perguntas objetivas na frente, respostas curtas e completas no verso.\n' +
    `Responda APENAS com JSON: {"flashcards": [{"frente": "...", "verso": "...", "fonte": "${fonte}"}]}\n\n` +
    `CONTEÚDO:\n${texto.slice(0, 6000)}`
  )
}

type Review321 = {
  resumo?: string | null
  aprendizados: (string | null | undefined)[]
  aplicacoes: (string | null | undefined)[]
  acao?: string | null
  citacao?: string | null
}

/** Texto do review 3-2-1 (livro/curso) enviado à IA; vazio quando nada foi preenchido. */
export function textoDoReview({ resumo, aprendizados, aplicacoes, acao, citacao }: Review321): string {
  const limpa = (xs: (string | null | undefined)[]) => xs.map((x) => x?.trim()).filter((x): x is string => !!x)
  const partes = [
    resumo?.trim() ? `Resumo: ${resumo.trim()}` : '',
    limpa(aprendizados).length ? `Aprendizados:\n${limpa(aprendizados).map((a, i) => `${i + 1}. ${a}`).join('\n')}` : '',
    limpa(aplicacoes).length ? `Aplicações:\n${limpa(aplicacoes).map((a, i) => `${i + 1}. ${a}`).join('\n')}` : '',
    acao?.trim() ? `Ação: ${acao.trim()}` : '',
    citacao?.trim() ? `Citação: ${citacao.trim()}` : '',
  ].filter(Boolean)
  return partes.join('\n\n')
}
