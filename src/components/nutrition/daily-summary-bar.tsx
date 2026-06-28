import { Card, CardContent } from '@/components/ui/card'
import { MACRO_STATUS_BAR_CLASS, MACRO_STATUS_TEXT_CLASS, macroStatus } from '@/lib/nutrition'

type MacroSummary = {
  label: string
  consumido: number
  meta: number
  unidade: string
}

type DailySummaryBarProps = {
  calorias: MacroSummary
  proteina: MacroSummary
  carbo: MacroSummary
  gordura: MacroSummary
}

function MacroBar({ label, consumido, meta, unidade }: MacroSummary) {
  const status = macroStatus(consumido, meta)
  const pct = meta > 0 ? Math.round((consumido / meta) * 100) : 0

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-aco-texto">{label}</span>
        <span className={`font-mono text-xs ${MACRO_STATUS_TEXT_CLASS[status]}`}>
          {Math.round(consumido)}
          {unidade} / {Math.round(meta)}
          {unidade} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-aco-claro">
        <div
          className={`h-full rounded-full transition-all ${MACRO_STATUS_BAR_CLASS[status]}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

export function DailySummaryBar({ calorias, proteina, carbo, gordura }: DailySummaryBarProps) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MacroBar {...calorias} />
        <MacroBar {...proteina} />
        <MacroBar {...carbo} />
        <MacroBar {...gordura} />
      </CardContent>
    </Card>
  )
}
