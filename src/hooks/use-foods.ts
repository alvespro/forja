import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

/**
 * Busca um `foods` pelo nome (case-insensitive) ou cria um registro mínimo. Usado para linkar
 * ingredientes de sugestões (texto livre) a uma linha real antes de gravar `food_substitutions`,
 * que referencia `foods.id`.
 */
export function useFindOrCreateFood() {
  const { user } = useAuth()

  return async function findOrCreateFood(nome: string): Promise<string> {
    if (!user) throw new Error('Usuário não autenticado')

    const { data: existing, error: findError } = await supabase
      .from('foods')
      .select('id')
      .ilike('nome', nome.trim())
      .limit(1)
      .maybeSingle()
    if (findError) throw findError
    if (existing) return existing.id as string

    const { data: created, error: createError } = await supabase
      .from('foods')
      .insert({ nome: nome.trim(), user_id: user.id, fonte: 'manual' })
      .select('id')
      .single()
    if (createError) throw createError
    return created.id as string
  }
}
