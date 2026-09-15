import { FONTES, type FonteAlimento } from '@/lib/food-sources'

const ORDEM: FonteAlimento[] = ['taco', 'off', 'usda', 'ia_estimado']

/** Configurações: de onde vêm os alimentos do registro. */
export function FoodDatabaseCard() {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="ds-h4 text-foreground">Base de Alimentos</h2>
        <p className="ds-body-sm text-foreground">🇧🇷 TACO · 🌍 Open Food Facts · 🔬 USDA · 🤖 IA</p>
        <p className="ds-body-sm text-aco-texto">597 alimentos in natura brasileiros + 3M produtos globais</p>
      </div>
      <ol className="flex flex-col gap-2 border-t border-linha pt-3">
        {ORDEM.map((fonte, i) => (
          <li key={fonte} className="flex gap-3 ds-body-sm">
            <span className="w-4 shrink-0 text-aco-texto [font-family:var(--font-data)]">{i + 1}</span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold text-foreground">{FONTES[fonte].badge}</span>
              <span className="text-aco-texto">{FONTES[fonte].resumo}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="ds-body-sm text-aco-texto">
        A busca tenta as bases nessa ordem; código de barras vai direto ao Open Food Facts.
      </p>
    </section>
  )
}
