import { useNavigate } from 'react-router-dom'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFlashcardsDevidos } from '@/hooks/use-flashcards'

/** Hoje: "📚 Revisão do dia" quando há flashcards devidos (some quando não há). */
export function FlashcardsReviewCard() {
  const devidos = useFlashcardsDevidos()
  const navigate = useNavigate()
  const n = devidos.data ?? 0
  if (n === 0) return null

  return (
    <Card className="border-brasa/30">
      <CardContent className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">📚 Revisão do dia</p>
          <p className="text-xs text-aco-texto">
            {n} {n === 1 ? 'flashcard para revisar' : 'flashcards para revisar'} hoje
          </p>
        </div>
        <Button type="button" size="sm" className="min-h-11 shrink-0" onClick={() => navigate('/estudos?tab=flashcards&modo=revisao')}>
          <Icon name="play_arrow" size={18} />
          Revisar agora
        </Button>
      </CardContent>
    </Card>
  )
}
