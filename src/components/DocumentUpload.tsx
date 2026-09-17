import { useEffect, useRef, useState } from 'react'
import { toast as notificar } from 'sonner'
import { Icon } from '@/components/Icon'
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DadosPreview } from '@/components/document-vision/dados-preview'
import { useAuth } from '@/hooks/use-auth'
import { useUpdateProtocolExam } from '@/hooks/use-protocol-exams'
import { useDocumentUploadRequest } from '@/lib/document-upload-store'
import { mensagemDeErro } from '@/lib/feedback'
import { todayInSaoPaulo } from '@/lib/date'
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
  const escondido = useHideOnScroll()
  const [tipoSelecionado, setTipoSelecionado] = useState<DocumentImportTipo | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const { processando, dadosExtraidos, erro, enviarDocumento, confirmar, rejeitar, limpar } = useDocumentVision()
  const updateExam = useUpdateProtocolExam()
  // Exame do protocolo que este laudo conclui ("Registrar resultado" na aba Exames).
  const protocolExamIdRef = useRef<string | null>(null)
  const pedido = useDocumentUploadRequest()

  // Outra tela pediu o upload (ex.: "Fotografar laudo"): abre já no tipo escolhido.
  useEffect(() => {
    if (!pedido) return
    protocolExamIdRef.current = pedido.protocolExamId ?? null
    setTipoSelecionado(pedido.tipo)
    setIsMenuOpen(true)
  }, [pedido])

  if (!user) return null

  function showToast(message: string, tipo: 'erro' | 'ok' = 'erro') {
    if (tipo === 'ok') notificar.success(message)
    else notificar.error(message)
  }

  function closeMenu() {
    setIsMenuOpen(false)
    setTipoSelecionado(null)
  }

  function fecharMenuManual() {
    protocolExamIdRef.current = null
    closeMenu()
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
      const examId = protocolExamIdRef.current
      if (examId && dadosExtraidos.tipo === 'exame') {
        protocolExamIdRef.current = null
        await updateExam.mutateAsync({
          id: examId,
          values: {
            status: 'realizado',
            data_realizada: dadosExtraidos.data_coleta ?? todayInSaoPaulo(),
            health_metric_snapshot: Object.fromEntries(dadosExtraidos.marcadores.map((m) => [m.chave, m.valor])),
          },
        })
        showToast('Resultado salvo e exame do protocolo marcado como realizado.', 'ok')
      } else {
        showToast('Dados salvos com sucesso.', 'ok')
      }
    } catch (err) {
      showToast(mensagemDeErro(err, 'salvar os dados'))
    }
  }

  async function handleRejeitar() {
    protocolExamIdRef.current = null
    await rejeitar()
  }

  const isPreviewOpen = !processando && (!!dadosExtraidos || !!erro)

  return (
    <>
      {isMenuOpen && (
        <div className="fixed bottom-[calc(var(--float-bottom)+60px)] right-4 z-50 flex w-64 md:bottom-20 flex-col gap-2 rounded-xl border border-border bg-popover p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {tipoSelecionado ? 'Escolha o arquivo' : 'O que você vai importar?'}
            </span>
            <button type="button" onClick={fecharMenuManual} aria-label="Fechar" className="text-aco-texto hover:text-foreground">
              <Icon name="close" size={14} />
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
                <Icon name="photo_camera" size={18} className="mr-1.5 inline-block align-middle" />Foto
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => pdfInputRef.current?.click()}>
                <Icon name="description" size={14} />
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
        onClick={() => (isMenuOpen ? fecharMenuManual() : setIsMenuOpen(true))}
        aria-label={isMenuOpen ? 'Fechar importação de documento' : 'Importar documento'}
        className={cn(
          'fixed bottom-[calc(var(--float-bottom)+4px)] right-[84px] z-50 flex size-12 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[rgba(16,16,16,0.7)] text-cinza shadow-[var(--glass-shadow)] backdrop-blur-[20px] outline-none transition-[transform,opacity,color] duration-[var(--dur-normal)] ease-[var(--spring-bounce)] hover:text-brasa active:scale-95 focus-visible:ring-2 focus-visible:ring-ring md:bottom-7 [html[data-immersive]_&]:hidden',
          escondido && !isMenuOpen && 'pointer-events-none translate-y-24 opacity-0',
        )}
      >
        {isMenuOpen ? <Icon name="close" size={20} /> : <Icon name="attach_file" size={20} />}
      </button>

      {processando && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/70 text-center">
          <Icon name="progress_activity" size={32} className="animate-spin text-brasa" />
          <p className="text-base font-medium text-foreground">Analisando documento...</p>
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
              <Icon name="close" size={18} className="mr-1.5 inline-block align-middle" />Descartar
            </Button>
            {!erro && (
              <Button type="button" size="sm" onClick={handleConfirmar}>
                <Icon name="check_circle" size={18} className="mr-1.5 inline-block align-middle" />Confirmar e salvar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
