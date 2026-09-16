import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useUpsertBodyGoal, type BodyGoalWithCycle } from '@/hooks/use-body-goals'
import { useForjaAI } from '@/hooks/useForjaAI'
import { OBJETIVO_OPTIONS } from '@/lib/body-goals'
import { todayInSaoPaulo } from '@/lib/date'
import type { ObjetivoCorporal } from '@/types/database'

const DURACOES = [30, 60, 90, 120]

type MetasSugeridas = {
  peso_meta_kg?: number
  gordura_meta_pct?: number
  musculo_pct_meta?: number
  agua_meta_pct?: number
  gordura_visceral_meta?: number
  imc_meta?: number
  justificativa?: string
}

function parseSugestao(resposta: string): MetasSugeridas {
  const match = resposta.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('A resposta do agente não veio em JSON.')
  const parsed = JSON.parse(match[0])
  return parsed.metas_sugeridas ?? parsed
}

type GoalEditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentGoal: BodyGoalWithCycle | null
}

export function GoalEditModal({ open, onOpenChange, currentGoal }: GoalEditModalProps) {
  const upsertGoal = useUpsertBodyGoal()
  const sugerirMetas = useForjaAI()
  const [sugestaoError, setSugestaoError] = useState<string | null>(null)
  const [justificativa, setJustificativa] = useState<string | null>(null)

  const [objetivo, setObjetivo] = useState<ObjetivoCorporal>(currentGoal?.objetivo ?? 'recomposicao')
  const [nome, setNome] = useState(currentGoal?.cycle.nome ?? 'Ciclo 01')
  const [dataInicio, setDataInicio] = useState(currentGoal?.cycle.data_inicio ?? todayInSaoPaulo())
  const [prazoDias, setPrazoDias] = useState(90)
  const [pesoMeta, setPesoMeta] = useState(currentGoal?.peso_meta_kg?.toString() ?? '')
  const [gorduraMeta, setGorduraMeta] = useState(currentGoal?.gordura_meta_pct?.toString() ?? '')
  const [musculoMeta, setMusculoMeta] = useState(currentGoal?.musculo_pct_meta?.toString() ?? '')
  const [aguaMeta, setAguaMeta] = useState(currentGoal?.agua_meta_pct?.toString() ?? '')
  const [viceralMeta, setViceralMeta] = useState(currentGoal?.gordura_visceral_meta?.toString() ?? '')
  const [imcMeta, setImcMeta] = useState(currentGoal?.imc_meta?.toString() ?? '')

  const objetivoOption = OBJETIVO_OPTIONS.find((o) => o.value === objetivo)

  async function handleSugerirMetas() {
    setSugestaoError(null)
    setJustificativa(null)
    try {
      const pergunta = `sugerir metas para ${objetivo} em ${prazoDias} dias`
      const resposta = await sugerirMetas.mutateAsync({ agente: 'metas', pergunta })
      const sugestao = parseSugestao(resposta)
      if (sugestao.peso_meta_kg !== undefined) setPesoMeta(String(sugestao.peso_meta_kg))
      if (sugestao.gordura_meta_pct !== undefined) setGorduraMeta(String(sugestao.gordura_meta_pct))
      if (sugestao.musculo_pct_meta !== undefined) setMusculoMeta(String(sugestao.musculo_pct_meta))
      if (sugestao.agua_meta_pct !== undefined) setAguaMeta(String(sugestao.agua_meta_pct))
      if (sugestao.gordura_visceral_meta !== undefined) setViceralMeta(String(sugestao.gordura_visceral_meta))
      if (sugestao.imc_meta !== undefined) setImcMeta(String(sugestao.imc_meta))
      if (sugestao.justificativa) setJustificativa(sugestao.justificativa)
    } catch (error) {
      setSugestaoError(error instanceof Error ? error.message : 'Falha ao calcular metas sugeridas.')
    }
  }

  function handleSave() {
    upsertGoal.mutate(
      {
        nome,
        objetivo,
        data_inicio: dataInicio,
        prazo_dias: prazoDias,
        peso_meta_kg: pesoMeta ? Number(pesoMeta) : null,
        gordura_meta_pct: gorduraMeta ? Number(gorduraMeta) : null,
        musculo_pct_meta: musculoMeta ? Number(musculoMeta) : null,
        agua_meta_pct: aguaMeta ? Number(aguaMeta) : null,
        gordura_visceral_meta: viceralMeta ? Number(viceralMeta) : null,
        imc_meta: imcMeta ? Number(imcMeta) : null,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar objetivo do ciclo</DialogTitle>
          <DialogDescription>Define um novo ciclo e desativa o anterior.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-objetivo">Objetivo</Label>
            <Select id="goal-objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value as ObjetivoCorporal)}>
              {OBJETIVO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </Select>
            {objetivoOption && <p className="text-xs text-aco-texto">{objetivoOption.label}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-nome">Nome do ciclo</Label>
              <Input id="goal-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-duracao">Duração</Label>
              <Select id="goal-duracao" value={prazoDias} onChange={(e) => setPrazoDias(Number(e.target.value))}>
                {DURACOES.map((d) => (
                  <option key={d} value={d}>
                    {d} dias
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-inicio">Data de início</Label>
            <Input id="goal-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sugerirMetas.isPending}
            onClick={handleSugerirMetas}
          >
            {sugerirMetas.isPending ? (
              <Icon name="progress_activity" size={14} className="animate-spin" />
            ) : (
              <Icon name="auto_awesome" size={14} />
            )}
            Calcular metas sugeridas pela IA
          </Button>
          {sugestaoError && <p className="text-xs text-alerta-texto">{sugestaoError}</p>}
          {justificativa && <p className="text-xs text-aco-texto">{justificativa}</p>}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-peso">Peso meta (kg)</Label>
              <Input id="goal-peso" type="number" step="0.1" value={pesoMeta} onChange={(e) => setPesoMeta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-gordura">% Gordura meta</Label>
              <Input id="goal-gordura" type="number" step="0.1" value={gorduraMeta} onChange={(e) => setGorduraMeta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-musculo">% Músculo meta</Label>
              <Input id="goal-musculo" type="number" step="0.1" value={musculoMeta} onChange={(e) => setMusculoMeta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-agua">% Água meta</Label>
              <Input id="goal-agua" type="number" step="0.1" value={aguaMeta} onChange={(e) => setAguaMeta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-visceral">Gordura visceral meta</Label>
              <Input id="goal-visceral" type="number" step="1" value={viceralMeta} onChange={(e) => setViceralMeta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-imc">IMC meta</Label>
              <Input id="goal-imc" type="number" step="0.1" value={imcMeta} onChange={(e) => setImcMeta(e.target.value)} />
            </div>
          </div>

          {upsertGoal.isError && (
            <p className="text-xs text-alerta-texto">
              {upsertGoal.error instanceof Error ? upsertGoal.error.message : 'Falha ao salvar o objetivo.'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={upsertGoal.isPending} onClick={handleSave}>
            {upsertGoal.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
