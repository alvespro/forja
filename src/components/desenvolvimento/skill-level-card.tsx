import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSkills, useUpdateSkill } from '@/hooks/use-skills'
import { areaTextColor } from '@/lib/desenvolvimento'
import type { DevArea } from '@/types/database'

type SkillLevelCardProps = {
  area: DevArea
}

export function SkillLevelCard({ area }: SkillLevelCardProps) {
  const skills = useSkills(area.id)
  const updateSkill = useUpdateSkill()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(5)

  const nivelMedio =
    (skills.data ?? []).reduce((acc, s) => acc + (s.nivel_atual ?? 0), 0) /
    Math.max(skills.data?.length ?? 1, 1)

  const metaMedia = area.nivel_meta ?? 8

  return (
    <Card style={{ borderColor: areaTextColor(area.categoria) + '33' }}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: areaTextColor(area.categoria) }}
            />
            <span className="font-heading text-sm font-semibold text-foreground">{area.nome}</span>
          </div>
          <span className="text-xs font-medium" style={{ color: areaTextColor(area.categoria) }}>
            {nivelMedio.toFixed(1)}/10
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs text-aco-texto mb-1">
            <span>Nível médio</span>
            <span>Meta: {metaMedia}</span>
          </div>
          <Progress value={(nivelMedio / 10) * 100} className="h-1.5" />
        </div>

        {skills.isLoading ? (
          <p className="text-xs text-aco-texto">Carregando…</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {(skills.data ?? []).map((skill) => (
              <div key={skill.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-foreground truncate max-w-[140px]">{skill.nome}</span>
                    <span className="text-aco-texto shrink-0">
                      {editingId === skill.id ? (
                        <span className="font-medium" style={{ color: areaTextColor(area.categoria) }}>
                          {editValue}/10
                        </span>
                      ) : (
                        `${skill.nivel_atual ?? 0}/10`
                      )}
                    </span>
                  </div>
                  {editingId === skill.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        className="flex-1 h-1.5 accent-brasa"
                      />
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="size-11 p-0"
                        aria-label="Salvar nível"
                        onClick={() => {
                          updateSkill.mutate({ id: skill.id, values: { nivel_atual: editValue } })
                          setEditingId(null)
                        }}
                      >
                        <Icon name="check" size={18} />
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="size-11 p-0"
                        aria-label="Cancelar edição"
                        onClick={() => setEditingId(null)}
                      >
                        <Icon name="close" size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Progress value={((skill.nivel_atual ?? 0) / 10) * 100} className="flex-1 h-1" />
                      <button
                        type="button"
                        onClick={() => { setEditingId(skill.id); setEditValue(skill.nivel_atual ?? 5) }}
                        aria-label={`Editar nível de ${skill.nome}`}
                        className="-my-3 flex size-11 shrink-0 items-center justify-center rounded-full text-aco-texto hover:text-foreground"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
