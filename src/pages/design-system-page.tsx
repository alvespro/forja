import { toast } from 'sonner'
import { Activity, Droplets, Flame, HeartPulse, Scale } from 'lucide-react'

import { BodyMap } from '@/components/BodyMap'
import { EmptyState } from '@/components/feedback/empty-state'
import { ExerciseTile } from '@/components/ds/exercise-tile'
import { HealthMetricCard } from '@/components/ds/health-metric-card'
import { MacroBar } from '@/components/ds/macro-bar'
import { MetricHero } from '@/components/ds/metric-hero'
import { NutritionCard } from '@/components/ds/nutrition-card'
import { ProgressRing } from '@/components/ds/progress-ring'
import { WorkoutCard } from '@/components/ds/workout-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Galeria do design system — só existe em desenvolvimento (rota fora do login),
 * para inspecionar os componentes visualmente sem dados reais.
 */
export function DesignSystemPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-10 bg-background px-5 py-8">
      <Section title="BodyMap">
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-around">
            <BodyMap vista="frente" estados={{ peito: 'ativo', ombros: 'recente', core: 'descansado', biceps: 'recente', pernas: 'ativo' }} />
            <BodyMap vista="costas" estados={{ costas: 'ativo', triceps: 'recente', gluteo: 'descansado', panturrilha: 'ativo', pernas: 'recente', ombros: 'recente' }} />
          </div>
          <div className="flex items-end justify-between">
            {['Peito', 'Costas', 'Pernas', 'Bíceps', 'Tríceps', 'Ombros', 'Glúteo', 'Core', 'Panturrilha'].map((g) => (
              <BodyMap key={g} size="icon" musculosAtivos={[g]} />
            ))}
          </div>
          <BodyMap size="lg" interativo estados={{ peito: 'ativo', costas: 'descansado', gluteo: 'descansado' }} />
        </div>
      </Section>

      <Section title="Tipografia">
        <div className="flex flex-col gap-2">
          <span className="ds-display-lg text-brasa">83</span>
          <span className="ds-h1 text-foreground">Heading 32 — Bom dia, Welber</span>
          <span className="ds-h3 text-foreground">Heading 20 — Treino de hoje</span>
          <span className="ds-body-lg text-foreground">Body 16 — texto corrido da interface.</span>
          <span className="ds-body-sm text-aco-texto">Body 12 — legenda e apoio</span>
          <span className="ds-data-md text-aco-texto">DATA 12 — 1.240 / 2.200 KCAL</span>
        </div>
      </Section>

      <Section title="MetricHero">
        <div className="flex flex-wrap items-end gap-8">
          <MetricHero label="FORJA Score" value={83} size="lg" delta={{ value: '+6 vs ontem', direction: 'up', good: true }} />
          <MetricHero
            label="Peso"
            value="84,4"
            unit="kg"
            size="sm"
            tone="foreground"
            delta={{ value: '-0,6 kg', direction: 'down', good: true }}
          />
        </div>
      </Section>

      <Section title="ProgressRing">
        <div className="flex items-end gap-6">
          <ProgressRing value={40} size="sm" />
          <ProgressRing value={72} size="md" label="Proteína" color="var(--ok)" />
          <ProgressRing value={83} size="lg" label="Score" />
        </div>
      </Section>

      <Section title="MacroBar">
        <MacroBar proteina={{ atual: 120, meta: 180 }} carbo={{ atual: 140, meta: 200 }} gordura={{ atual: 45, meta: 70 }} />
      </Section>

      <Section title="WorkoutCard">
        <div className="flex flex-col gap-3">
          <WorkoutCard nome="Push — Peito & Tríceps" grupo="Peito" ultimaVez="há 2 dias" duracaoMin={55} onStart={() => {}} />
          <WorkoutCard nome="Pull — Costas & Bíceps" grupo="Costas" ultimaVez="há 9 dias" atrasado duracaoMin={50} onStart={() => {}} />
          <WorkoutCard nome="Pernas — Quadríceps" grupo="Pernas" emAndamento onStart={() => {}} />
        </div>
      </Section>

      <Section title="ExerciseTile">
        <div className="flex flex-col gap-2">
          <ExerciseTile nome="Supino reto" grupo="Peito" ultimaCarga={80} recorde={80} />
          <ExerciseTile nome="Rosca direta" grupo="Bíceps" ultimaCarga={16} recorde={18} />
          <ExerciseTile nome="Prancha" grupo="Core" />
        </div>
      </Section>

      <Section title="NutritionCard">
        <div className="flex flex-col gap-3">
          <NutritionCard
            nome="Almoço"
            horario="12:30"
            agora
            kcal={{ atual: 520, meta: 700 }}
            proteina={{ atual: 45, meta: 55 }}
            carbo={{ atual: 50, meta: 70 }}
            gordura={{ atual: 14, meta: 20 }}
            onRegistrar={() => {}}
          />
          <NutritionCard
            nome="Pré-treino"
            horario="16:30"
            kcal={{ atual: 0, meta: 350 }}
            proteina={{ atual: 0, meta: 30 }}
            carbo={{ atual: 0, meta: 40 }}
            gordura={{ atual: 0, meta: 8 }}
            onRegistrar={() => {}}
          />
        </div>
      </Section>

      <Section title="HealthMetricCard">
        <div className="grid grid-cols-2 gap-3">
          <HealthMetricCard icon={Scale} label="Peso" value="84,4" unit="kg" status="atencao" tendencia={[86, 85.4, 85.1, 84.8, 84.4]} progressoMeta={40} />
          <HealthMetricCard icon={Flame} label="Gordura" value="18,2" unit="%" status="ok" tendencia={[20, 19.5, 19, 18.6, 18.2]} progressoMeta={70} />
          <HealthMetricCard icon={HeartPulse} label="Visceral" value={9} status="alerta" tendencia={[8, 8, 9, 9, 9]} />
          <HealthMetricCard icon={Droplets} label="Água" value="58" unit="%" status="neutro" />
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-2">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={Activity}
          message="Nenhum treino ainda"
          description="Registre a primeira sessão para acompanhar sua evolução de carga."
          action={<Button size="sm">Criar treino</Button>}
        />
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.success('✅ Frango adicionado ao Almoço — 248 kcal')}>
            Success
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.warning('⚠️ Produto ultraprocessado — NOVA 4')}>
            Warning
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.error('Não foi possível salvar')}>
            Error
          </Button>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <span className="ds-label">{title}</span>
      {children}
    </section>
  )
}
