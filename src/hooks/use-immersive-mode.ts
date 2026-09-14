import { useEffect } from 'react'

/**
 * Marca o documento como "modo imersivo" (execução de treino em tela cheia).
 * Elementos globais flutuantes — chat e upload — se escondem via CSS com o
 * variant `[html[data-immersive]_&]:hidden`, sem precisar compartilhar estado.
 */
export function useImmersiveMode(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    const root = document.documentElement
    root.dataset.immersive = 'true'
    return () => {
      delete root.dataset.immersive
    }
  }, [ativo])
}
