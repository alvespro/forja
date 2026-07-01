import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StarRating } from './star-rating'
import { useCreateDevMedia, useUpdateDevMedia } from '@/hooks/use-dev-media'
import { MEDIA_TIPO_EMOJI, MEDIA_TIPO_LABEL, STATUS_LABEL, areaTextColor } from '@/lib/desenvolvimento'
import type { DevArea, DevMedia, DevMediaStatus } from '@/types/database'

const STATUS_CLASS: Record<DevMediaStatus, string> = {
  quero_ver: 'bg-border/50 text-aco-texto',
  assistindo: 'bg-brasa/15 text-brasa',
  assistido: 'bg-ok/15 text-ok',
}

type MediaCardItemProps = {
  media: DevMedia
  areas?: DevArea[]
}

export function MediaCardItem({ media, areas }: MediaCardItemProps) {
  const updateMedia = useUpdateDevMedia()
  const area = areas?.find((a) => a.id === media.dev_area_id)

  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">{MEDIA_TIPO_EMOJI[media.tipo ?? ''] ?? '📄'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{media.titulo}</p>
              {media.diretor_ou_host && <p className="text-xs text-aco-texto">{media.diretor_ou_host}</p>}
              {media.plataforma && <p className="text-xs text-aco-texto/70">{media.plataforma}</p>}
              <p className="text-xs text-aco-texto/60">{MEDIA_TIPO_LABEL[media.tipo ?? ''] ?? media.tipo}</p>
            </div>
            <select
              value={media.status ?? 'quero_ver'}
              onChange={(e) => updateMedia.mutate({ id: media.id, values: { status: e.target.value as DevMediaStatus } })}
              className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer ${STATUS_CLASS[media.status ?? 'quero_ver']}`}
            >
              <option value="quero_ver">{STATUS_LABEL.quero_ver}</option>
              <option value="assistindo">{STATUS_LABEL.assistindo}</option>
              <option value="assistido">{STATUS_LABEL.assistido}</option>
            </select>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {area && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: areaTextColor(area.categoria) + '20', color: areaTextColor(area.categoria) }}
              >
                {area.nome}
              </span>
            )}
            {media.status === 'assistido' && (
              <StarRating
                value={media.nota_geral}
                size="sm"
                onChange={(v) => updateMedia.mutate({ id: media.id, values: { nota_geral: v } })}
              />
            )}
          </div>

          {media.notas && (
            <p className="mt-1 text-xs text-aco-texto line-clamp-2">{media.notas}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AddMediaButton() {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<string>('filme')
  const createMedia = useCreateDevMedia()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    createMedia.mutate(
      { titulo, tipo: tipo as DevMedia['tipo'] ?? 'filme', status: 'quero_ver' },
      { onSuccess: () => { setOpen(false); setTitulo(''); setTipo('filme') } },
    )
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Adicionar mídia
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar mídia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="media-titulo">Título</Label>
              <Input
                id="media-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Nome do filme, série, podcast…"
              />
            </div>
            <div>
              <Label htmlFor="media-tipo">Tipo</Label>
              <select
                id="media-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="filme">🎬 Filme</option>
                <option value="documentario">🎥 Documentário</option>
                <option value="serie">📺 Série</option>
                <option value="podcast">🎙️ Podcast</option>
                <option value="video">▶️ Vídeo</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMedia.isPending}>Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
