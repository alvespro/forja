import { useRef, useState } from 'react'
import { FileText, Loader2, Paperclip, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DadosPreview } from '@/components/document-vision/dados-preview'
import { useAuth } from '@/hooks/use-auth'
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, useDocumentVision } from '@/hooks/useDocumentVision'
import type { DocumentImportTipo } from '@/types/database'

const TIPOS: { value: DocumentImportTipo; label: string; emoji: string }[] = [
  { value: 'exame', label: 'Exame laboratorial', emoji: '🧪' },
  { value: 'treino', label: 'Planilha de treino', emoji: '🏋️' },
  { value: 'dieta', label: 'Plano alimentar', emoji: '🥗' },
  { value: 'suplemento', label: 'Suplementação', emoji: '💊' },
]

export function DocumentUpload() {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<DocumentImportTipo | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const { processando, dadosExtraidos, erro, enviarDocumento, confirmar, rejeitar, limpar } = useDocumentVision()

  if (!user) return null

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  function closeMenu() {
    setIsMenuOpen(false)
    setTipoSelecionado(null)
  }

  async function handleFileSelected(file: File | undefined) {
    if (!file || !tipoSelecionado) return

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      showToast('Formato não suportado. Use JPEG, PNG, WebP ou PDF.')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('Arquivo muito grande. O limite é 10MB.')
      return
    }

    closeMenu()
    try {
      await enviarDocumento(file, tipoSelecionado)
    } catch {
      // erro já fica em `erro` do hook e é exibido no preview
    }
  }

  async function handleConfirmar() {
    if (!dadosExtraidos) return
    try {
      await confirmar(dadosExtraidos)
      showToast('Dados salvos com sucesso.')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Falha ao salvar os dados.')
    }
  }

  async function handleRejeitar() {
    await rejeitar()
  }

  const isPreviewOpen = !processando && (!!dadosExtraidos || !!erro)

  return (
    <>
      {toast && (
        <div className="fixed bottom-[calc(var(--float-bottom)+64px)] right-4 z-50 max-w-xs md:bottom-24 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-foreground shadow-lg">
          {toast}
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed bottom-[calc(var(--float-bottom)+60px)] right-4 z-50 flex w-64 md:bottom-20 flex-col gap-2 rounded-xl border border-border bg-popover p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {tipoSelecionado ? 'Escolha o arquivo' : 'O que você vai importar?'}
            </span>
            <button type="button" onClick={closeMenu} aria-label="Fechar" className="text-aco-texto hover:text-foreground">
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          {!tipoSelecionado ? (
            <div className="flex flex-col gap-1.5">
              {TIPOS.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => setTipoSelecionado(tipo.value)}
                  className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-sm text-foreground outline-none hover:bg-aco-claro focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span aria-hidden="true">{tipo.emoji}</span>
                  {tipo.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => fotoInputRef.current?.click()}>
                📷 Foto
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => pdfInputRef.current?.click()}>
                <FileText className="size-3.5" aria-hidden="true" />
                PDF
              </Button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => handleFileSelected(event.target.files?.[0])}
              />
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => handleFileSelected(event.target.files?.[0])}
              />
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsMenuOpen((v) => !v)}
        aria-label={isMenuOpen ? 'Fechar importação de documento' : 'Importar documento'}
        className="fixed bottom-[var(--float-bottom)] right-[76px] z-50 flex size-12 md:bottom-6 [html[data-immersive]_&]:hidden items-center justify-center rounded-full border border-brasa bg-aco-claro text-foreground shadow-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Paperclip className="size-5" aria-hidden="true" />}
      </button>

      {processando && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/70 text-center">
          <Loader2 className="size-8 animate-spin text-brasa" aria-hidden="true" />
          <p className="text-base font-medium text-foreground">🔍 Analisando documento...</p>
          <p className="text-sm text-aco-texto">A IA está lendo e extraindo os dados</p>
        </div>
      )}

      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          if (!open) limpar()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{erro ? 'Não foi possível ler o documento' : 'Confirme os dados extraídos'}</DialogTitle>
          </DialogHeader>

          {erro ? (
            <p className="text-sm text-alerta-texto">{erro}</p>
          ) : dadosExtraidos ? (
            <DadosPreview dados={dadosExtraidos} />
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={handleRejeitar}>
              ❌ Descartar
            </Button>
            {!erro && (
              <Button type="button" size="sm" onClick={handleConfirmar}>
                ✅ Confirmar e salvar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
