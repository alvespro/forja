import { useState } from 'react'
import { Loader2, Repeat, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateFoodSubstitution } from '@/hooks/use-food-substitutions'
import { useFindOrCreateFood } from '@/hooks/use-foods'
import { useForjaAI } from '@/hooks/useForjaAI'
import {
  useCreateMealSuggestion,
  useMealSuggestions,
  useUpdateMealSuggestionIngredientes,
} from '@/hooks/use-meal-suggestions'
import type { MealSlot, MealSuggestion, MealSuggestionIngrediente } from '@/types/database'

const LABELS = ['A', 'B', 'C']

/** Extrai o primeiro bloco JSON `{...}` da resposta — o modelo às vezes adiciona texto em volta. */
function parseJsonResponse<T>(resposta: string): T {
  const match = resposta.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('A resposta do agente não veio em JSON.')
  return JSON.parse(match[0]) as T
}

type NewSuggestionShape = {
  nome: string
  descricao: string
  calorias: number
  proteina_g: number
  carbo_g: number
  gordura_g: number
  ingredientes: MealSuggestionIngrediente[]
}

type AlternativesShape = {
  alternativas: { nome: string; quantidade: string; calorias: number; proteina_g: number; carbo_g: number; gordura_g: number }[]
}

type MealSuggestionsModalProps = {
  slot: MealSlot
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MealSuggestionsModal({ slot, open, onOpenChange }: MealSuggestionsModalProps) {
  const suggestions = useMealSuggestions(slot.id)
  const generateAI = useForjaAI()
  const createSuggestion = useCreateMealSuggestion()
  const [generateError, setGenerateError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerateError(null)
    const pergunta = `Gere UMA sugestão de refeição para o slot "${slot.nome}" (${slot.tipo}), considerando meu histórico dos últimos 7 dias e disponibilidade de alimentos em Rio Verde/GO. Preparo máximo 15 min. Meta deste slot: ${slot.calorias_alvo ?? '—'} kcal, ${slot.proteina_g_alvo ?? '—'}g proteína, ${slot.carbo_g_alvo ?? '—'}g carboidrato, ${slot.gordura_g_alvo ?? '—'}g gordura. Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, exatamente neste formato: {"nome": "...", "descricao": "...", "calorias": 000, "proteina_g": 00, "carbo_g": 00, "gordura_g": 00, "ingredientes": [{"nome": "...", "quantidade": "..."}]}`

    try {
      const resposta = await generateAI.mutateAsync({ agente: 'nutricao', pergunta })
      const parsed = parseJsonResponse<NewSuggestionShape>(resposta)
      await createSuggestion.mutateAsync({
        meal_slot_id: slot.id,
        nome: parsed.nome,
        descricao: parsed.descricao ?? null,
        calorias: parsed.calorias ?? null,
        proteina_g: parsed.proteina_g ?? null,
        carbo_g: parsed.carbo_g ?? null,
        gordura_g: parsed.gordura_g ?? null,
        ingredientes: parsed.ingredientes ?? null,
      })
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Falha ao gerar sugestão.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sugestões — {slot.nome}</DialogTitle>
          <DialogDescription>Até 3 opções para este slot. Gere novas a qualquer momento.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {suggestions.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : suggestions.isError ? (
            <ErrorState message="Não foi possível carregar as sugestões." onRetry={() => suggestions.refetch()} />
          ) : !suggestions.data || suggestions.data.length === 0 ? (
            <EmptyState message="Nenhuma sugestão ainda para este slot." />
          ) : (
            suggestions.data.map((suggestion, index) => (
              <SuggestionCard key={suggestion.id} label={LABELS[index] ?? '?'} suggestion={suggestion} />
            ))
          )}

          {generateError && <p className="text-xs text-alerta">{generateError}</p>}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={generateAI.isPending || createSuggestion.isPending}
            onClick={handleGenerate}
          >
            {generateAI.isPending || createSuggestion.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-3.5" aria-hidden="true" />
            )}
            Gerar nova sugestão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SuggestionCard({ label, suggestion }: { label: string; suggestion: MealSuggestion }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-brasa">Opção {label}</span>
          <span className="font-medium text-foreground">{suggestion.nome}</span>
          {suggestion.descricao && <span className="text-xs text-aco-texto">{suggestion.descricao}</span>}
        </div>
        <span className="shrink-0 font-mono text-xs text-aco-texto">{suggestion.calorias ?? '—'} kcal</span>
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-xs text-aco-texto">
        <span>P {suggestion.proteina_g ?? '—'}g</span>
        <span>C {suggestion.carbo_g ?? '—'}g</span>
        <span>G {suggestion.gordura_g ?? '—'}g</span>
      </div>

      {suggestion.ingredientes && suggestion.ingredientes.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2">
          {suggestion.ingredientes.map((ingrediente, index) => (
            <IngredientRow key={index} suggestion={suggestion} ingrediente={ingrediente} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

function IngredientRow({
  suggestion,
  ingrediente,
  index,
}: {
  suggestion: MealSuggestion
  ingrediente: MealSuggestionIngrediente
  index: number
}) {
  const [isSubstituting, setIsSubstituting] = useState(false)
  const [alternatives, setAlternatives] = useState<AlternativesShape['alternativas'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const generateAI = useForjaAI()
  const findOrCreateFood = useFindOrCreateFood()
  const createSubstitution = useCreateFoodSubstitution()
  const updateIngredientes = useUpdateMealSuggestionIngredientes()

  async function handleSubstituirClick() {
    setIsSubstituting(true)
    setError(null)
    setAlternatives(null)
    const pergunta = `Preciso substituir o ingrediente "${ingrediente.nome}" (${ingrediente.quantidade}) de uma refeição, mantendo o macro equivalente (mesma proteína/carbo/gordura aproximada), com alternativas disponíveis em Rio Verde/GO. Responda APENAS com um JSON válido, sem texto antes ou depois, exatamente neste formato: {"alternativas": [{"nome": "...", "quantidade": "...", "calorias": 000, "proteina_g": 00, "carbo_g": 00, "gordura_g": 00}]}`

    try {
      const resposta = await generateAI.mutateAsync({ agente: 'nutricao', pergunta })
      const parsed = parseJsonResponse<AlternativesShape>(resposta)
      setAlternatives(parsed.alternativas.slice(0, 3))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar alternativas.')
    }
  }

  async function handleApprove(alt: AlternativesShape['alternativas'][number]) {
    try {
      const [originalId, substitutoId] = await Promise.all([
        findOrCreateFood(ingrediente.nome),
        findOrCreateFood(alt.nome),
      ])
      await createSubstitution.mutateAsync({
        food_id_original: originalId,
        food_id_substituto: substitutoId,
        motivo: 'Substituição sugerida pelo agente de nutrição',
        equivalencia_g: null,
      })
      const novosIngredientes = (suggestion.ingredientes ?? []).map((item, i) =>
        i === index ? { nome: alt.nome, quantidade: alt.quantidade } : item,
      )
      await updateIngredientes.mutateAsync({
        id: suggestion.id,
        mealSlotId: suggestion.meal_slot_id ?? '',
        ingredientes: novosIngredientes,
      })
      setIsSubstituting(false)
      setAlternatives(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar substituição.')
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-foreground">
          {ingrediente.nome} <span className="text-aco-texto">— {ingrediente.quantidade}</span>
        </span>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Substituir ingrediente" onClick={handleSubstituirClick}>
          <Repeat className="size-3" aria-hidden="true" />
        </Button>
      </div>

      {isSubstituting && (
        <div className="flex flex-col gap-1.5 rounded-md border border-border bg-aco-claro/40 p-2">
          {generateAI.isPending ? (
            <span className="flex items-center gap-1.5 text-xs text-aco-texto">
              <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Buscando alternativas…
            </span>
          ) : error ? (
            <span className="text-xs text-alerta">{error}</span>
          ) : (
            alternatives?.map((alt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApprove(alt)}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-left text-xs outline-none hover:bg-aco-claro focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-foreground">
                  {alt.nome} — {alt.quantidade}
                </span>
                <span className="shrink-0 font-mono text-aco-texto">
                  {alt.calorias}kcal · P{alt.proteina_g} C{alt.carbo_g} G{alt.gordura_g}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
