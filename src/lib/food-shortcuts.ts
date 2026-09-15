import { addDaysToDateString } from '@/lib/date'

/**
 * Atalhos do FoodSearch a partir do histórico de meal_logs: o que se come
 * todo dia fica a um toque.
 */

export type RegistroComAlimento = { food_id: string; created_at: string; data: string }

export const JANELA_FREQUENTES_DIAS = 30

export function atalhosDeAlimentos(
  registros: RegistroComAlimento[],
  hoje: string,
  limite = 5,
): { recentes: string[]; frequentes: string[] } {
  const ordenados = [...registros].sort((a, b) => b.created_at.localeCompare(a.created_at))

  const recentes: string[] = []
  for (const r of ordenados) {
    if (!recentes.includes(r.food_id)) recentes.push(r.food_id)
    if (recentes.length === limite) break
  }

  // Frequentes no mês; empate fica com o mais recente (ordem de `ordenados`).
  const inicio = addDaysToDateString(hoje, -JANELA_FREQUENTES_DIAS)
  const contagem = new Map<string, number>()
  for (const r of ordenados) {
    if (r.data < inicio) continue
    contagem.set(r.food_id, (contagem.get(r.food_id) ?? 0) + 1)
  }
  const frequentes = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([id]) => id)

  return { recentes, frequentes }
}
