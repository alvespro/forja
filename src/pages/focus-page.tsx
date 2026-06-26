import { useState } from 'react'

import { FocusSessionHistory } from '@/components/focus/focus-session-history'
import { FocusTaskPicker } from '@/components/focus/focus-task-picker'
import { FrictionChecklistCard } from '@/components/focus/friction-checklist-card'
import { PomodoroTimer } from '@/components/focus/pomodoro-timer'
import { useFrogTask } from '@/hooks/use-frog-task'

export function FocusPage() {
  const { data: frog } = useFrogTask()
  const [tarefa, setTarefa] = useState('')
  const [sessaoIniciada, setSessaoIniciada] = useState(false)

  function handleReady() {
    setTarefa((current) => current || frog?.titulo || '')
    setSessaoIniciada(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Foco</h1>
        <p className="text-sm text-aco-texto">
          Pomodoro com cronômetro por timestamp e checklist anti-procrastinação.
        </p>
      </div>

      {sessaoIniciada ? (
        <>
          <FocusTaskPicker value={tarefa} onChange={setTarefa} />
          <PomodoroTimer tarefa={tarefa} onExit={() => setSessaoIniciada(false)} />
        </>
      ) : (
        <FrictionChecklistCard onReady={handleReady} />
      )}

      <FocusSessionHistory />
    </div>
  )
}
