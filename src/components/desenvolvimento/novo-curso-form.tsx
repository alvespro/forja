import { useState } from 'react'

import { FormatoPicker } from '@/components/desenvolvimento/formato-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCreateCourse } from '@/hooks/use-courses'
import { formatoInfo, normalizarUrl, pedeUrl } from '@/lib/course-formato'
import type { CourseFormato, DevArea } from '@/types/database'

type NovoCursoFormProps = {
  areas: DevArea[]
  onDone: () => void
}

/** Cadastro rápido de curso: nome, formato e o dado que o formato pede (link, nº de módulos ou área). */
export function NovoCursoForm({ areas, onDone }: NovoCursoFormProps) {
  const createCourse = useCreateCourse()
  const [titulo, setTitulo] = useState('')
  const [formato, setFormato] = useState<CourseFormato | null>(null)
  const [url, setUrl] = useState('')
  const [modulosTotal, setModulosTotal] = useState('')
  const [areaId, setAreaId] = useState('')

  const faltaArea = formato === 'analise_area' && !areaId
  const podeSalvar = titulo.trim() && formato && !faltaArea

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!podeSalvar) return
    createCourse.mutate(
      {
        titulo: titulo.trim(),
        status: 'quero_ler',
        formato,
        url: pedeUrl(formato) ? normalizarUrl(url) : null,
        modulos_total: formato === 'modulos' && modulosTotal ? Number(modulosTotal) : null,
        modulos_feitos: formato === 'modulos' ? 0 : null,
        dev_area_id: areaId || null,
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={salvar} className="glass-card flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="novo-curso-titulo">Nome do curso</Label>
        <Input id="novo-curso-titulo" autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Negociação avançada" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Formato</Label>
        <FormatoPicker value={formato} onChange={setFormato} />
        {formato && <p className="text-xs text-cinza2-texto">{formatoInfo(formato)?.dica}</p>}
      </div>

      {pedeUrl(formato) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="novo-curso-url">{formato === 'link' ? 'Link' : 'Link das aulas (opcional)'}</Label>
          <Input id="novo-curso-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
      )}

      {formato === 'modulos' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="novo-curso-modulos">Quantos capítulos/módulos?</Label>
          <Input id="novo-curso-modulos" type="number" inputMode="numeric" min={1} value={modulosTotal} onChange={(e) => setModulosTotal(e.target.value)} placeholder="12" />
        </div>
      )}

      {formato === 'analise_area' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="novo-curso-area">Área analisada</Label>
          <Select id="novo-curso-area" value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-invalid={faltaArea}>
            <option value="">Escolha a área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </Select>
          {areas.length === 0 && <p className="text-xs text-alerta-texto">Crie uma área na aba Habilidades primeiro.</p>}
        </div>
      )}

      {createCourse.isError && <p className="text-xs text-alerta-texto">Não foi possível salvar o curso. Tente de novo.</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={!podeSalvar || createCourse.isPending}>
          {createCourse.isPending ? 'Salvando…' : 'Adicionar curso'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  )
}
