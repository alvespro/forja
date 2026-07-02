import { useRef, useState } from 'react'
import { Camera, Loader2, Sparkles, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/hooks/use-confirm'
import {
  useAnalyzeProgressPhoto,
  useDeleteProgressPhoto,
  useProgressPhotos,
  useUploadProgressPhoto,
} from '@/hooks/use-progress-photos'
import { cn } from '@/lib/utils'
import type { ProgressPhoto, ProgressPhotoTipo } from '@/types/database'

type ProgressPhotosCardProps = {
  /** Peso mais recente, gravado como snapshot junto da foto. */
  pesoAtual?: number | null
}

function formatarData(data: string): string {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

export function ProgressPhotosCard({ pesoAtual }: ProgressPhotosCardProps) {
  const photos = useProgressPhotos()
  const upload = useUploadProgressPhoto()
  const analyze = useAnalyzeProgressPhoto()
  const deletePhoto = useDeleteProgressPhoto()
  const { confirm, dialog } = useConfirm()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState<ProgressPhotoTipo>('frente')
  const [notas, setNotas] = useState('')
  const [selecionada, setSelecionada] = useState<ProgressPhoto | null>(null)

  const lista = photos.data ?? []
  const primeira = lista[lista.length - 1]
  const ultima = lista[0]
  const temAntesDepois = lista.length >= 2 && primeira.id !== ultima.id

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ''
  }

  function handleUpload() {
    if (!pendingFile) return
    upload.mutate(
      { file: pendingFile, tipo, notas, peso_kg: pesoAtual ?? null },
      {
        onSuccess: (photo) => {
          setPendingFile(null)
          setNotas('')
          // Relatório de IA gerado automaticamente após o upload
          analyze.mutate(photo.id)
        },
      },
    )
  }

  async function handleDelete(photo: ProgressPhoto) {
    const ok = await confirm({
      title: 'Excluir esta foto?',
      description: 'A imagem e o relatório serão removidos permanentemente.',
    })
    if (!ok) return
    deletePhoto.mutate(photo, { onSuccess: () => setSelecionada(null) })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">📸 Fotos de progresso</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="size-3.5" />
            Adicionar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Antes / Depois */}
        {temAntesDepois && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { foto: primeira, rotulo: 'Antes' },
              { foto: ultima, rotulo: 'Depois' },
            ].map(({ foto, rotulo }) => (
              <button
                key={foto.id}
                type="button"
                onClick={() => setSelecionada(foto)}
                className="group relative overflow-hidden rounded-xl border border-border/40"
              >
                {foto.signed_url && (
                  <img
                    src={foto.signed_url}
                    alt={`Foto de progresso — ${rotulo}`}
                    className="aspect-[3/4] w-full object-cover transition-transform group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-white">{rotulo}</p>
                  <p className="text-[11px] text-white/80">
                    {formatarData(foto.data)}
                    {foto.peso_kg && ` · ${foto.peso_kg}kg`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Timeline */}
        {photos.isLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-border/20" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <p className="py-4 text-center text-sm text-aco-texto">
            Nenhuma foto ainda. Registre a linha de base — o "antes" começa hoje.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {lista.map((foto) => (
              <button
                key={foto.id}
                type="button"
                onClick={() => setSelecionada(foto)}
                className="group relative overflow-hidden rounded-lg border border-border/30"
              >
                {foto.signed_url && (
                  <img
                    src={foto.signed_url}
                    alt={`Foto de ${formatarData(foto.data)}`}
                    className="aspect-[3/4] w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5">
                  <p className="text-center text-[9px] text-white/90">{formatarData(foto.data)}</p>
                </div>
                {foto.relatorio_ia && (
                  <span className="absolute right-1 top-1 rounded-full bg-brasa/90 p-0.5">
                    <Sparkles className="size-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Modal: confirmar upload ── */}
        {pendingFile && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="font-heading text-base font-bold text-foreground">Nova foto</p>
                <button type="button" onClick={() => setPendingFile(null)} className="text-aco-texto hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>
              <img
                src={URL.createObjectURL(pendingFile)}
                alt="Pré-visualização"
                className="max-h-64 w-full rounded-xl object-contain"
              />
              <div>
                <Label className="text-xs text-aco-texto">Ângulo</Label>
                <div className="mt-1 flex gap-1.5">
                  {(['frente', 'costas', 'lado'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={cn(
                        'flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors',
                        tipo === t ? 'border-brasa bg-brasa/15 text-brasa' : 'border-border/50 text-aco-texto',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-aco-texto">Notas (opcional)</Label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ex: fim da semana 6 do ciclo"
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {pesoAtual && (
                <p className="text-xs text-aco-texto">
                  Peso registrado junto: <span className="font-semibold text-foreground">{pesoAtual}kg</span>
                </p>
              )}
              <Button type="button" onClick={handleUpload} disabled={upload.isPending} className="w-full">
                {upload.isPending ? 'Enviando…' : '📤 Salvar e analisar com IA'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Modal: detalhe da foto ── */}
        {selecionada && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
            <div className="flex max-h-[92vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-base font-bold text-foreground">
                    {formatarData(selecionada.data)}
                  </p>
                  <p className="text-xs text-aco-texto capitalize">
                    {selecionada.tipo ?? 'frente'}
                    {selecionada.peso_kg && ` · ${selecionada.peso_kg}kg`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(selecionada)}
                    className="text-aco-texto/50 hover:text-red-400"
                    title="Excluir foto"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button type="button" onClick={() => setSelecionada(null)} className="text-aco-texto hover:text-foreground">
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {selecionada.signed_url && (
                <img
                  src={selecionada.signed_url}
                  alt={`Foto de ${formatarData(selecionada.data)}`}
                  className="max-h-[50vh] w-full rounded-xl object-contain"
                />
              )}

              {selecionada.notas && (
                <p className="text-xs italic text-aco-texto">"{selecionada.notas}"</p>
              )}

              {/* Relatório de IA */}
              {selecionada.relatorio_ia ? (
                <div className="rounded-xl border border-brasa/30 bg-brasa/5 p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-brasa" />
                    <span className="text-xs font-semibold text-foreground">Análise do Monitor</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{selecionada.relatorio_ia}</p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    analyze.mutate(selecionada.id, {
                      onSuccess: (relatorio) => setSelecionada({ ...selecionada, relatorio_ia: relatorio }),
                    })
                  }
                  disabled={analyze.isPending}
                  className="gap-1.5"
                >
                  {analyze.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5 text-brasa" />
                  )}
                  {analyze.isPending ? 'Analisando evolução…' : 'Gerar análise da evolução'}
                </Button>
              )}
            </div>
          </div>
        )}

        {dialog}
      </CardContent>
    </Card>
  )
}
