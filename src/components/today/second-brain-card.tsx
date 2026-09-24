import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { NotaModal } from '@/components/estudos/nota-modal'
import { useStudyNotes } from '@/hooks/use-study-notes'

/** Ponte de captura rápida entre o Hoje e a futura sincronização bidirecional com Obsidian. */
export function SecondBrainCard() {
  const notes = useStudyNotes()
  const [creating, setCreating] = useState(false)
  const latest = useMemo(
    () => [...(notes.data ?? [])].sort((a, b) => Date.parse(b.updated_at ?? b.created_at ?? '') - Date.parse(a.updated_at ?? a.created_at ?? ''))[0],
    [notes.data],
  )

  return (
    <>
      <GlassCard className="flex flex-col gap-3" padding="var(--s4)" aria-labelledby="second-brain-title">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-400/10 text-violet-300">
              <Icon name="psychology" size={20} />
            </span>
            <div>
              <h2 id="second-brain-title" className="text-[16px] font-bold text-nevoa">Segundo cérebro</h2>
              <p className="text-[12px] text-aco-texto">Ideias, aprendizados e referências em um só lugar.</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-violet-400/25 bg-violet-400/10 px-2 py-1 text-[10px] font-semibold text-violet-200">Obsidian em breve</span>
        </div>

        {notes.isLoading ? (
          <div className="h-12 animate-pulse rounded-[var(--r-sm)] bg-branco/[0.06]" />
        ) : latest ? (
          <Link to={`/estudos/nota/${latest.id}`} className="rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 outline-none transition-colors hover:border-violet-400/40 focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex items-center gap-1.5 text-[11px] text-violet-200"><Icon name="edit_note" size={14} /> Última captura</span>
            <p className="mt-1 truncate text-sm font-semibold text-nevoa">{latest.titulo}</p>
            {latest.conteudo && <p className="mt-0.5 line-clamp-1 text-xs text-aco-texto">{latest.conteudo}</p>}
          </Link>
        ) : (
          <p className="rounded-[var(--r-sm)] border border-dashed border-linha px-3 py-2.5 text-sm text-aco-texto">Capture uma ideia para começar seu acervo.</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setCreating(true)} className="ds-btn-primary min-h-11 justify-center px-3 text-sm">
            <Icon name="add" size={18} /> Capturar ideia
          </button>
          <Link to="/estudos?tab=anotacoes" className="ds-btn-ghost min-h-11 justify-center px-3 text-sm">
            Ver anotações <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
      </GlassCard>
      <NotaModal open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
