import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateBodyMetric } from '@/hooks/use-body-metrics'
import { useUpsertBodyGoal } from '@/hooks/use-body-goals'
import { useHabits, useUpdateHabitAtivo } from '@/hooks/use-habits'
import { useProfile, useUpdateOnboarding } from '@/hooks/use-profile'
import { OBJETIVO_OPTIONS } from '@/lib/body-goals'
import { todayInSaoPaulo } from '@/lib/date'
import { projectWeight } from '@/lib/weight-projection'
import { cn } from '@/lib/utils'
import type { ObjetivoCorporal } from '@/types/database'

const TOTAL_STEPS = 5

export function OnboardingPage() {
  const navigate = useNavigate()
  const profile = useProfile()
  const habits = useHabits()
  const createMetric = useCreateBodyMetric()
  const upsertGoal = useUpsertBodyGoal()
  const updateAtivo = useUpdateHabitAtivo()
  const completeOnboarding = useUpdateOnboarding()

  const [step, setStep] = useState(0)
  const [objetivo, setObjetivo] = useState<ObjetivoCorporal>('recomposicao')
  const [peso, setPeso] = useState('')
  const [gordura, setGordura] = useState('')
  const [altura, setAltura] = useState('')
  const [pesoMeta, setPesoMeta] = useState('')
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nome = profile.data?.nome?.split(' ')[0] ?? ''
  const pesoNum = Number(peso.replace(',', '.')) || null
  const alturaNum = Number(altura.replace(',', '.')) || null
  const pesoMetaNum = Number(pesoMeta.replace(',', '.')) || null

  const imc = useMemo(() => {
    if (!pesoNum || !alturaNum) return null
    const m = alturaNum / 100
    return Math.round((pesoNum / (m * m)) * 10) / 10
  }, [pesoNum, alturaNum])

  // Passo 5: começa com todos os hábitos semeados selecionados.
  const habitList = habits.data ?? []
  const selectedSet = selected ?? new Set(habitList.map((h) => h.id))

  const projection = projectWeight(pesoNum, pesoMetaNum, -0.5, todayInSaoPaulo())

  function toggleHabit(id: string) {
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function finish() {
    setSubmitting(true)
    setError(null)
    try {
      const today = todayInSaoPaulo()
      if (pesoNum || gordura || imc) {
        await createMetric.mutateAsync({
          peso_kg: pesoNum,
          gordura_pct: Number(gordura.replace(',', '.')) || null,
          musculo_pct: null,
          agua_pct: null,
          gordura_visceral: null,
          imc,
          medido_em: today,
        })
      }
      await upsertGoal.mutateAsync({
        nome: 'Meta 90 dias',
        objetivo,
        data_inicio: today,
        prazo_dias: 90,
        peso_meta_kg: pesoMetaNum,
        gordura_meta_pct: null,
        musculo_pct_meta: null,
        agua_meta_pct: null,
        gordura_visceral_meta: null,
        imc_meta: null,
      })
      for (const h of habitList) {
        if (!selectedSet.has(h.id)) await updateAtivo.mutateAsync({ id: h.id, ativo: false })
      }
      await completeOnboarding.mutateAsync({ onboarding_completo: true, onboarding_step: TOTAL_STEPS })
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.')
      setSubmitting(false)
    }
  }

  const canAdvance = step === 2 ? !!pesoNum : true

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 py-8">
      {/* Barra de progresso */}
      <div className="mx-auto flex w-full max-w-md items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-brasa' : 'bg-aco-claro')}
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-8">
        {step === 0 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="font-heading text-4xl font-extrabold tracking-tight text-brasa">FORJA</span>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Bem-vindo{nome ? `, ${nome}` : ''}. Vamos forjar sua melhor versão.
              </h1>
              <p className="text-sm text-aco-texto">Menos de 3 minutos para configurar tudo.</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Qual é o seu objetivo principal agora?</h2>
            <div className="grid grid-cols-2 gap-3">
              {OBJETIVO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setObjetivo(opt.value)}
                  className={cn(
                    'flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    objetivo === opt.value ? 'border-brasa bg-brasa/10' : 'border-border bg-card hover:border-brasa/40',
                  )}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {opt.icon}
                  </span>
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Onde você está hoje?</h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ob-peso">Peso atual (kg)</Label>
                <Input id="ob-peso" type="number" inputMode="decimal" autoFocus value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="84,4" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ob-gordura">% Gordura (opcional)</Label>
                  <Input id="ob-gordura" type="number" inputMode="decimal" value={gordura} onChange={(e) => setGordura(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ob-altura">Altura (cm)</Label>
                  <Input id="ob-altura" type="number" inputMode="numeric" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="178" />
                </div>
              </div>
              {imc != null && (
                <p className="text-sm text-aco-texto">
                  IMC calculado: <span className="font-mono font-medium text-foreground">{imc}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Onde quer chegar em 90 dias?</h2>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ob-meta">Peso meta (kg)</Label>
              <Input id="ob-meta" type="number" inputMode="decimal" autoFocus value={pesoMeta} onChange={(e) => setPesoMeta(e.target.value)} placeholder="80" />
            </div>
            {projection.status === 'ok' && (
              <p className="text-sm text-foreground">
                Com −0,5kg/semana: meta em <span className="font-medium text-brasa">{projection.weeks} semanas</span>.
              </p>
            )}
            {projection.status === 'recomposicao' && (
              <p className="text-sm text-aco-texto">Recomposição — manter o peso enquanto muda a composição.</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Escolha seus hábitos não-negociáveis</h2>
            {habitList.length === 0 ? (
              <p className="text-sm text-aco-texto">Nenhum hábito pré-definido encontrado — você pode criar depois em Hábitos.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {habitList.map((h) => {
                  const on = selectedSet.has(h.id)
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHabit(h.id)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                        on ? 'border-brasa bg-brasa/10' : 'border-border bg-card',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-md border',
                          on ? 'border-brasa bg-brasa text-meia-noite' : 'border-border',
                        )}
                      >
                        {on && <Check className="size-3.5" aria-hidden="true" />}
                      </span>
                      <span className="text-sm font-medium text-foreground">{h.nome}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-alerta">{error}</p>}
      </div>

      {/* Ações */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
            Voltar
          </Button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            {step === 0 ? 'Começar →' : 'Continuar →'}
          </Button>
        ) : (
          <Button type="button" onClick={finish} disabled={submitting}>
            {submitting ? 'Salvando…' : 'Começar a Forjar 🔥'}
          </Button>
        )}
      </div>
    </div>
  )
}
