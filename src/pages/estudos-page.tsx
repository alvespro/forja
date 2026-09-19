import { useSearchParams } from 'react-router-dom'

import { AnotacoesTab } from '@/components/estudos/anotacoes-tab'
import { EpubTab } from '@/components/estudos/epub-tab'
import { FlashcardsTab } from '@/components/estudos/flashcards-tab'
import { SugestoesTab } from '@/components/estudos/sugestoes-tab'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'flashcards', label: 'Flashcards', icon: 'style' },
  { key: 'anotacoes', label: 'Anotações', icon: 'edit_note' },
  { key: 'epub', label: 'EPUB', icon: 'auto_stories' },
  { key: 'sugestoes', label: 'Sugestões', icon: 'lightbulb' },
]
type Tab = 'flashcards' | 'anotacoes' | 'epub' | 'sugestoes'

/** /estudos — flashcards (revisão espaçada), anotações, leitor EPUB e sugestões de livros. */
export function EstudosPage() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'flashcards') as Tab
  const modoRevisao = tab === 'flashcards' && params.get('modo') === 'revisao'

  function trocar(novo: Tab) {
    setParams({ tab: novo }, { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold text-foreground">📚 Estudos</h1>

      <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Seções de estudos">
        {TABS.map((t) => (
          <button
            key={t.key}
            id={`estudos-tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`estudos-painel-${t.key}`}
            onClick={() => trocar(t.key)}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t px-3 text-sm font-medium transition-colors',
              tab === t.key ? 'border-b-2 border-brasa text-foreground' : 'text-aco-texto hover:text-foreground',
            )}
          >
            <Icon name={t.icon} size={18} />
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`estudos-painel-${tab}`} aria-labelledby={`estudos-tab-${tab}`}>
        {tab === 'flashcards' && <FlashcardsTab revisaoInicial={modoRevisao} onRevisaoFechada={() => modoRevisao && trocar('flashcards')} />}
        {tab === 'anotacoes' && <AnotacoesTab />}
        {tab === 'epub' && <EpubTab />}
        {tab === 'sugestoes' && <SugestoesTab />}
      </div>
    </div>
  )
}
