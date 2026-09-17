import { useEffect, useState } from 'react'

import type { DocumentImportTipo } from '@/types/database'

export type DocumentUploadRequest = {
  tipo: DocumentImportTipo
  /** Exame do protocolo que este laudo conclui (marca como realizado ao confirmar). */
  protocolExamId?: string
  /** Muda a cada pedido para reabrir mesmo com o mesmo tipo. */
  id: number
}

// Mesmo padrão do forja-chat-store: o botão de upload vive no App.tsx, fora das páginas,
// e qualquer tela pode abri-lo já no tipo certo ("Fotografar laudo" no Placar de Saúde).
let listeners: Array<(request: DocumentUploadRequest) => void> = []
let seq = 0

export function abrirDocumentUpload(tipo: DocumentImportTipo, opcoes: { protocolExamId?: string } = {}) {
  seq += 1
  const request = { tipo, id: seq, ...opcoes }
  listeners.forEach((listener) => listener(request))
}

export function useDocumentUploadRequest(): DocumentUploadRequest | null {
  const [request, setRequest] = useState<DocumentUploadRequest | null>(null)

  useEffect(() => {
    listeners.push(setRequest)
    return () => {
      listeners = listeners.filter((listener) => listener !== setRequest)
    }
  }, [])

  return request
}
