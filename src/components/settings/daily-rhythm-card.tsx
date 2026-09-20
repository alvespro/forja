import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/feedback/error-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DEFAULT_DAILY_RHYTHM, type DailyRhythmPreferences, useDailyRhythmPreferences, useSaveDailyRhythmPreferences } from '@/hooks/use-daily-rhythm'
import { mensagemDeErro } from '@/lib/feedback'

const DAYS = [
  { value: 1, label: 'S' }, { value: 2, label: 'T' }, { value: 3, label: 'Q' }, { value: 4, label: 'Q' }, { value: 5, label: 'S' }, { value: 6, label: 'S' }, { value: 7, label: 'D' },
]
const TYPES: { key: keyof Pick<DailyRhythmPreferences, 'notify_workout' | 'notify_meals' | 'notify_calendar' | 'notify_priority'>; label: string; icon: string }[] = [
  { key: 'notify_workout', label: 'Treino', icon: 'fitness_center' },
  { key: 'notify_meals', label: 'Alimentação', icon: 'restaurant' },
  { key: 'notify_calendar', label: 'Agenda', icon: 'calendar_month' },
  { key: 'notify_priority', label: 'Prioridade', icon: 'flag' },
]

export function DailyRhythmCard() {
  const preferences = useDailyRhythmPreferences()
  const save = useSaveDailyRhythmPreferences()
  const [values, setValues] = useState<Omit<DailyRhythmPreferences, 'user_id'>>(DEFAULT_DAILY_RHYTHM)

  useEffect(() => {
    if (preferences.data) {
      const { user_id: _userId, ...data } = preferences.data
      setValues(data)
    }
  }, [preferences.data])

  function toggleDay(day: number) {
    setValues((current) => ({
      ...current,
      active_days: current.active_days.includes(day) ? current.active_days.filter((item) => item !== day) : [...current.active_days, day].sort(),
    }))
  }

  function salvar() {
    if (!values.active_days.length) return toast.error('Escolha ao menos um dia.')
    if (values.start_time >= values.end_time) return toast.error('A janela precisa terminar depois de começar.')
    save.mutate(values, {
      onSuccess: () => toast.success(values.enabled ? 'Ritmo do Dia ativado.' : 'Ritmo do Dia pausado.'),
      onError: (error) => toast.error(mensagemDeErro(error, 'salvar o Ritmo do Dia')),
    })
  }

  if (preferences.isError) {
    return (
      <Card>
        <CardContent className="p-4">
          <ErrorState message="O Ritmo do Dia ainda não está disponível. Tente atualizar a página em instantes." onRetry={() => preferences.refetch()} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Ritmo do Dia</h2>
            <p className="mt-0.5 text-sm text-aco-texto">Check-ins úteis de treino, alimentação, agenda e prioridade.</p>
          </div>
          <button type="button" role="switch" aria-checked={values.enabled} onClick={() => setValues((current) => ({ ...current, enabled: !current.enabled }))} className={`mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${values.enabled ? 'bg-brasa justify-end' : 'bg-cinza/40 justify-start'}`}>
            <span className="size-5 rounded-full bg-white" />
          </button>
        </div>

        <fieldset disabled={!values.enabled} className="flex flex-col gap-4 disabled:opacity-50">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-nevoa">Intervalo
              <Select value={String(values.interval_minutes)} onChange={(event) => setValues((current) => ({ ...current, interval_minutes: Number(event.target.value) }))}>
                <option value="120">A cada 2h</option><option value="180">A cada 3h</option><option value="240">A cada 4h</option><option value="360">A cada 6h</option>
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-nevoa">Início<Input type="time" value={values.start_time.slice(0, 5)} onChange={(event) => setValues((current) => ({ ...current, start_time: event.target.value }))} /></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-nevoa">Fim<Input type="time" value={values.end_time.slice(0, 5)} onChange={(event) => setValues((current) => ({ ...current, end_time: event.target.value }))} /></label>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-nevoa">Dias ativos</p>
            <div className="flex gap-1.5" aria-label="Dias ativos">
              {DAYS.map((day) => <button key={day.value} type="button" aria-pressed={values.active_days.includes(day.value)} onClick={() => toggleDay(day.value)} className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${values.active_days.includes(day.value) ? 'bg-brasa text-white' : 'border border-linha text-cinza'}`}>{day.label}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPES.map((type) => <label key={type.key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-linha px-2.5 text-sm text-nevoa"><input type="checkbox" checked={values[type.key]} onChange={(event) => setValues((current) => ({ ...current, [type.key]: event.target.checked }))} /><Icon name={type.icon as never} size={16} className="text-brasa" />{type.label}</label>)}
          </div>
        </fieldset>
        <Button type="button" className="self-end" onClick={salvar} disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar Ritmo do Dia'}</Button>
      </CardContent>
    </Card>
  )
}
