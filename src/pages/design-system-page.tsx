import { toast } from 'sonner'

import { BodyMap } from '@/components/BodyMap'
import { NovoCursoForm } from '@/components/desenvolvimento/novo-curso-form'
import { PlacarSaude } from '@/components/health/placar-saude'
import { AgendaAplicacoes } from '@/components/protocolo/agenda-aplicacoes'
import { MonitoramentoCiclo } from '@/components/protocolo/monitoramento-ciclo'
import { AppVersionCard } from '@/components/settings/app-version-card'
import { UpdateBanner } from '@/components/UpdateBanner'
import { groupHealthMetricsByKey } from '@/hooks/use-health-metrics'
import type { BodyMetric, HealthMetric, Protocol, ProtocolCompound } from '@/types/database'
import { CardioTimerView, MobilidadeBadge, ObservacaoDestaque, PhaseTimerView } from '@/components/workout/session/phase-views'
import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { HabitChecklistCard } from '@/components/today/habit-checklist-card'
import { NextActionCard } from '@/components/today/next-action-card'
import { NutritionTodayCard } from '@/components/today/nutrition-today-card'
import { QuickStatsCard } from '@/components/today/quick-stats-card'
import { RecoveryRingCard } from '@/components/today/recovery-ring-card'
import { Sidebar } from '@/components/layout/sidebar'
import { TabBar } from '@/components/layout/tab-bar'
import { EmptyState } from '@/components/feedback/empty-state'
import { ExerciseTile } from '@/components/ds/exercise-tile'
import { MacroBar } from '@/components/ds/macro-bar'
import { MetricHero } from '@/components/ds/metric-hero'
import { NutritionCard } from '@/components/ds/nutrition-card'
import { EcgLine } from '@/components/ds/ecg-line'
import { MetricCard } from '@/components/ds/metric-card'
import { ProgressRing } from '@/components/ds/progress-ring'
import { Sparkline } from '@/components/ds/sparkline'
import { StatusDot } from '@/components/ds/status-dot'
import { WorkoutCard } from '@/components/ds/workout-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'


/** Exames de exemplo (mesmos valores de 25/06 e 15/07/2026) para ver o Placar de Saúde sem login. */
const EXAMES_EXEMPLO: HealthMetric[] = [
  ...Object.entries({ colesterol_total: 197, glicemia: 103, ldl: 119.4, lpa: 44 }).map(([chave, valor]) => ({ chave, valor, measured_at: '2026-06-25' })),
  ...Object.entries({
    acido_urico: 4.9, apo_a1: 137, apo_b: 84, colesterol_total: 181, creatinina: 1.25, egfr: 78, eritrocitos: 4.86, estradiol: 5, fsh: 2.8,
    glicemia: 91, hdl: 50, hematocrito: 45.5, hemoglobina: 15.7, homocisteina: 9.6, ldl: 107, leucocitos: 6610, lh: 3.8, linfocitos_pct: 42.1,
    nao_hdl: 132, neutrofilos_pct: 46, pcr_ultrassensivel: 0.06, plaquetas: 287000, prolactina: 8.4, psa_livre: 0.39, psa_total: 0.59,
    shbg: 26.91, t4_livre: 1.51, testosterona_biodisponivel: 232.13, testosterona_livre: 9.91, testosterona_total: 431, tgo: 25, tgp: 28,
    triglicerides: 136, tsh: 2.38, vitamina_b12: 600, vitamina_c: 0.5, vitamina_d: 42, vldl: 25,
  }).map(([chave, valor]) => ({ chave, valor, measured_at: '2026-07-15' })),
].map((m, i) => ({ ...m, id: String(i), user_id: '' }))

/** Ciclo de exemplo (mesmas datas e compostos cadastrados) para a Agenda e o Monitoramento sem login. */
const CICLO_EXEMPLO = { id: 'p', user_id: '', nome: 'Ciclo 01 — Recomposição', objetivo: 'recomposicao', status: 'ativo', via: 'injetavel', medico_responsavel: null, data_inicio: '2026-09-17', data_fim_prevista: '2026-12-10', duracao_semanas: 12, notas: null, created_at: null } as Protocol
const COMPOSTOS_EXEMPLO = [
  ['Testosterona Enantato', 300],
  ['Masteron Propionato', 100],
  ['Tirzepatide (Tirzec)', 2.5],
].map(([nome, dose], i) => ({ id: String(i), user_id: '', protocol_id: 'p', nome, categoria: null, dose_mg: dose, frequencia: null, via: 'injetavel', semana_inicio: 1, semana_fim: 12, notas: null, ordem: i })) as ProtocolCompound[]
const MEDICAO_EXEMPLO = { id: 'm', user_id: '', medido_em: '2026-06-29', peso_kg: 84.4, gordura_pct: 22.1, musculo_pct: 57.3, peso_muscular_kg: 47.2 } as BodyMetric

/**
 * Galeria do design system — só existe em desenvolvimento (rota fora do login),
 * para inspecionar os componentes visualmente sem dados reais.
 */
export function DesignSystemPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-10 bg-background px-5 pb-32 pt-8">
      <TabBar />
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">
        <Sidebar />
      </div>
      <Section title="GlassCard">
        <div className="flex flex-col gap-3">
          <GlassCard gradient glow>
            <p className="text-[13px] text-cinza">Boa noite,</p>
            <p className="text-[32px] font-bold leading-tight text-nevoa">Welber.</p>
          </GlassCard>
          <div className="grid grid-cols-2 gap-2">
            <GlassCard onClick={() => toast.info('Card clicável (ripple)')} padding="var(--s4)">
              <Icon name="favorite" size={24} className="text-brasa" />
              <p className="mt-2 text-[14px] text-nevoa">Clicável</p>
            </GlassCard>
            <GlassCard active padding="var(--s4)">
              <Icon name="bolt" size={24} filled className="text-brasa" />
              <p className="mt-2 text-[14px] text-nevoa">Ativo</p>
            </GlassCard>
          </div>
        </div>
      </Section>

      <Section title="Material Symbols">
        <div className="flex flex-wrap gap-3 text-cinza">
          {(['home', 'fitness_center', 'restaurant', 'monitor_heart', 'grid_view', 'timer', 'check_circle', 'local_fire_department', 'scale', 'psychology'] as const).map((n) => (
            <span key={n} className="flex flex-col items-center gap-1">
              <Icon name={n} size={28} />
              <Icon name={n} size={28} filled className="text-brasa" />
            </span>
          ))}
        </div>
      </Section>

      <Section title="Protocolo — agenda e monitoramento">
        <div className="flex flex-col gap-3">
          <AgendaAplicacoes protocolo={CICLO_EXEMPLO} compostos={COMPOSTOS_EXEMPLO} logs={[]} hoje="2026-09-17" onRegistrarHoje={() => toast.info('Abriria o registro da aplicação')} />
          <MonitoramentoCiclo protocolo={CICLO_EXEMPLO} medicoes={[MEDICAO_EXEMPLO]} />
        </div>
      </Section>

      <Section title="Atualização do app">
        <div className="flex flex-col gap-3">
          <UpdateBanner previa />
          <AppVersionCard />
        </div>
      </Section>

      <Section title="Placar de Saúde">
        <PlacarSaude metrics={EXAMES_EXEMPLO} defs={[]} metricsByKey={groupHealthMetricsByKey(EXAMES_EXEMPLO)} />
      </Section>

      <Section title="Treino v2 (fases)">
        <div className="flex flex-col gap-4">
          <MobilidadeBadge minutos={4} />
          <PhaseTimerView
            fase="mobilidade"
            nome="Abertura torácica book opener"
            cues="Deitado de lado, braço superior abre para o teto. Acompanhe com o olhar."
            restanteSeg={37}
            totalSeg={60}
            rodando
            posicao={2}
            totalFase={4}
            proximoNome="Mobilidade de punho círculos"
            onToggle={() => {}}
            onNext={() => toast.info('Próximo')}
          />
          <ObservacaoDestaque texto="TRIO ATIVADOR — 80 reps. Alterne entre os 3 exercícios" />
          <CardioTimerView
            nome="Esteira ritmo intenso"
            observacao="Escolher: esteira ou bike. 18 minutos."
            cues="Trote contínuo ou intervalos curtos forte/leve"
            restanteSeg={1080}
            totalSeg={1080}
            rodando={false}
            iniciado={false}
            onToggle={() => {}}
            onReset={() => {}}
          />
        </div>
      </Section>

      <Section title="Novo curso (formato)">
        <NovoCursoForm areas={[]} onDone={() => toast.info('Cancelado')} />
      </Section>

      <Section title="Hoje (sem login: estados vazios)">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <RecoveryRingCard />
            <NextActionCard />
          </div>
          <HabitChecklistCard />
          <QuickStatsCard />
          <NutritionTodayCard />
        </div>
      </Section>

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

      <Section title="Botões">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ds-btn-primary">Primário</button>
          <button type="button" className="ds-btn-secondary">Secundário</button>
          <button type="button" className="ds-btn-ghost">Ghost</button>
          <Button>shadcn default</Button>
          <Button variant="outline">outline</Button>
        </div>
      </Section>

      <Section title="StatusDot">
        <div className="flex flex-wrap gap-4">
          <StatusDot color="brasa" pulse label="Ativo" />
          <StatusDot color="ok" label="Sync OK" colorLabel />
          <StatusDot color="alerta" pulse label="Sessão" colorLabel />
          <StatusDot color="cinza" label="Offline" />
        </div>
      </Section>

      <Section title="MetricCard">
        <div className="flex flex-col gap-3">
          <MetricCard
            numOrdem={1}
            label="Recovery score"
            numero={78}
            unidade="%"
            size="lg"
            statusLabel="Treino pesado"
            statusColor="ok"
            footer={<EcgLine />}
          />
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Peso" numero="84,4" unidade="kg" size="sm" />
            <MetricCard label="Gordura" numero={null} unidade="%" size="sm" />
            <MetricCard label="Streak" numero={12} unidade="d" size="sm" tone="brasa" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Glicemia"
              numero={103}
              unidade="mg/dL"
              statusLabel="Atenção"
              statusColor="brasa"
              aside={<Sparkline data={[96, 99, 101, 98, 103]} />}
            />
            <MetricCard label="HDL" numero={52} unidade="mg/dL" statusLabel="Ok" statusColor="ok" aside={<Sparkline data={[44, 47, 49, 52]} color="var(--ok)" />} />
          </div>
        </div>
      </Section>

      <Section title="Tipografia">
        <div className="flex flex-col gap-2">
          <span className="ds-terminal-sm text-cinza">01&nbsp;&nbsp;FORJA Score</span>
          <span className="text-[80px] font-bold leading-none text-brasa [font-family:var(--font-display)] [text-shadow:var(--shadow-glow)]">83</span>
          <span className="ds-brand-line" />
          <span className="ds-terminal-lg ds-cursor text-nevoa">Bom dia, Welber</span>
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
          icon="monitor_heart"
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
          <Button size="sm" variant="outline" onClick={() => toast.info('Sincronizando…')}>
            Info
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
