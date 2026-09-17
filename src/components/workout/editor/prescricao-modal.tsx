import { useState } from 'react'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { FASE_LABEL, FASES_EM_ORDEM, faseCronometrada, faseDe } from '@/lib/workout-phases'
import { cn } from '@/lib/utils'
import type { WorkoutExercise, WorkoutFase } from '@/types/database'

export type PrescricaoValores = {
  fase: WorkoutFase
  series_alvo: number | null
  reps_min: number | null
  reps_max: number | null
  tempo_seg: number | null
  pausa_alvo_seg: number | null
  observacao: string | null
}

type Props = {
  open: boolean
  exercicioNome: string
  /** Presente = editando; ausente = adicionando. */
  prescricao?: WorkoutExercise
  faseInicial?: WorkoutFase
  salvando: boolean
  onClose: () => void
  onSalvar: (valores: PrescricaoValores) => void
}

/** Configuração do exercício no treino: fase, séries, reps mín/máx, tempo, pausa e observação. */
export function PrescricaoModal({ open, exercicioNome, prescricao, faseInicial, salvando, onClose, onSalvar }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={exercicioNome} description={prescricao ? 'Editar prescrição' : 'Configurar no treino'}>
      {open && <Formulario key={prescricao?.id ?? 'novo'} prescricao={prescricao} faseInicial={faseInicial} salvando={salvando} onClose={onClose} onSalvar={onSalvar} />}
    </Modal>
  )
}

const inteiro = (v: string) => (v.trim() === '' ? null : Number(v))
const texto = (n: number | null | undefined) => (n == null ? '' : String(n))

type Erros = Partial<Record<'series' | 'repsMin' | 'repsMax' | 'tempo' | 'pausa', string>>

function Formulario({ prescricao, faseInicial, salvando, onClose, onSalvar }: Omit<Props, 'open' | 'exercicioNome'>) {
  const [fase, setFase] = useState<WorkoutFase>(prescricao ? faseDe(prescricao.fase) : (faseInicial ?? 'treino'))
  const [series, setSeries] = useState(texto(prescricao?.series_alvo ?? (prescricao ? null : 3)))
  const [repsMin, setRepsMin] = useState(texto(prescricao?.reps_min))
  const [repsMax, setRepsMax] = useState(texto(prescricao?.reps_max))
  const [tempo, setTempo] = useState(texto(prescricao?.tempo_seg))
  const [pausa, setPausa] = useState(texto(prescricao?.pausa_alvo_seg))
  const [observacao, setObservacao] = useState(prescricao?.observacao ?? '')
  const [erros, setErros] = useState<Erros>({})

  const porTempo = faseCronometrada(fase) || fase === 'cardio'

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const v = { series: inteiro(series), repsMin: inteiro(repsMin), repsMax: inteiro(repsMax), tempo: inteiro(tempo), pausa: inteiro(pausa) }
    const invalido = (n: number | null, min = 1) => n != null && (!Number.isInteger(n) || n < min)
    const novos: Erros = {
      series: invalido(v.series) ? 'Use um número inteiro a partir de 1.' : undefined,
      repsMin: invalido(v.repsMin) ? 'Número inteiro a partir de 1.' : undefined,
      repsMax: invalido(v.repsMax)
        ? 'Número inteiro a partir de 1.'
        : v.repsMin != null && v.repsMax != null && v.repsMax < v.repsMin
          ? 'Máximo menor que o mínimo.'
          : undefined,
      tempo: porTempo && v.tempo == null ? 'Informe o tempo em segundos.' : invalido(v.tempo) ? 'Segundos inteiros a partir de 1.' : undefined,
      pausa: invalido(v.pausa, 0) ? 'Segundos inteiros.' : undefined,
    }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return
    onSalvar({
      fase,
      series_alvo: v.series,
      reps_min: v.repsMin,
      reps_max: v.repsMax ?? v.repsMin,
      tempo_seg: v.tempo,
      pausa_alvo_seg: v.pausa,
      observacao: observacao.trim() || null,
    })
  }

  const limpar = (campo: keyof Erros) => setErros((e) => ({ ...e, [campo]: undefined }))

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-nevoa">Fase</span>
        <div role="radiogroup" aria-label="Fase" className="flex flex-wrap gap-1.5">
          {FASES_EM_ORDEM.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={fase === f}
              onClick={() => setFase(f)}
              className={cn(
                'min-h-11 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                fase === f ? 'border-brasa bg-brasa/15 text-nevoa' : 'border-linha text-cinza hover:text-nevoa',
              )}
            >
              {FASE_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <FormField label="Séries" htmlFor="pr-series" erro={erros.series}>
          <Input type="number" inputMode="numeric" min={1} value={series} onChange={(e) => (setSeries(e.target.value), limpar('series'))} {...propsDeErro('pr-series', erros.series)} />
        </FormField>
        <FormField label="Reps mín." htmlFor="pr-reps-min" erro={erros.repsMin}>
          <Input type="number" inputMode="numeric" min={1} value={repsMin} placeholder="8" onChange={(e) => (setRepsMin(e.target.value), limpar('repsMin'))} {...propsDeErro('pr-reps-min', erros.repsMin)} />
        </FormField>
        <FormField label="Reps máx." htmlFor="pr-reps-max" erro={erros.repsMax}>
          <Input type="number" inputMode="numeric" min={1} value={repsMax} placeholder="12" onChange={(e) => (setRepsMax(e.target.value), limpar('repsMax'))} {...propsDeErro('pr-reps-max', erros.repsMax)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FormField label={porTempo ? 'Tempo (seg)' : 'Tempo (seg, opcional)'} htmlFor="pr-tempo" erro={erros.tempo} dica={fase === 'cardio' ? '1080 = 18 min' : undefined}>
          <Input type="number" inputMode="numeric" min={1} value={tempo} placeholder={fase === 'cardio' ? '1080' : '60'} onChange={(e) => (setTempo(e.target.value), limpar('tempo'))} {...propsDeErro('pr-tempo', erros.tempo)} />
        </FormField>
        <FormField label="Pausa (seg)" htmlFor="pr-pausa" erro={erros.pausa}>
          <Input type="number" inputMode="numeric" min={0} value={pausa} placeholder="60" onChange={(e) => (setPausa(e.target.value), limpar('pausa'))} {...propsDeErro('pr-pausa', erros.pausa)} />
        </FormField>
      </div>

      <FormField label="Observação" htmlFor="pr-observacao" dica="Ex.: SUPERSET — sem descanso entre os 2">
        <Input id="pr-observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={salvando}>
          {salvando && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {salvando ? 'Salvando…' : prescricao ? 'Salvar' : 'Adicionar ao treino'}
        </Button>
      </div>
    </form>
  )
}
