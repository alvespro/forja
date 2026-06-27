// Tipos manuais espelhando o schema de supabase/migrations/20260625120000_init.sql
// (identificadores em snake_case, iguais às colunas do Postgres).

export type Cycle = {
  id: string
  user_id: string
  nome: string
  data_inicio: string
  data_fim: string
  ativo: boolean
  created_at: string
}

export type Habit = {
  id: string
  user_id: string
  nome: string
  area: string | null
  ativo: boolean
  ordem: number
}

export type HabitLog = {
  id: string
  user_id: string
  habit_id: string
  data: string
  concluido: boolean
}

export type Task = {
  id: string
  user_id: string
  titulo: string
  area: string | null
  e_frog: boolean
  status: 'aberto' | 'feito'
  data: string
}

export type FocusTechnique = 'pomodoro' | 'frog'

export type FocusSession = {
  id: string
  user_id: string
  tarefa: string | null
  tecnica: FocusTechnique | null
  duracao_min: number | null
  data: string
}

export type JournalEntry = {
  id: string
  user_id: string
  data: string
  tipo: 'diario' | 'semanal'
  humor: number | null
  conteudo: string | null
  o_que_senti: string | null
}

export type GoalArea = 'fisico' | 'mental' | 'financeiro' | 'vinculos' | 'negocio'

export type GoalStatus = 'ativo' | 'concluido' | 'pausado'

export type Goal = {
  id: string
  user_id: string
  cycle_id: string | null
  area: GoalArea
  titulo: string
  resultado_rpm: string | null
  proposito_rpm: string | null
  plano_rpm: string | null
  progresso: number
  status: GoalStatus
  created_at: string
}

export type KeyResult = {
  id: string
  user_id: string
  goal_id: string
  descricao: string
  valor_atual: number
  valor_meta: number
  unidade: string | null
}

export type MetricDirection = 'menor_melhor' | 'maior_melhor'

export type HealthMetricDef = {
  id: string
  user_id: string
  chave: string
  label: string
  unidade: string | null
  direcao: MetricDirection | null
  valor_meta: number | null
}

export type HealthMetric = {
  id: string
  user_id: string
  chave: string
  valor: number
  measured_at: string
}

export type LibraryStatus = 'quero_ler' | 'lendo' | 'lido'

export type Reading = {
  id: string
  user_id: string
  trilha: string | null
  titulo: string
  autor: string | null
  status: LibraryStatus
  progresso: number
  nota_321: string | null
}

export type Course = {
  id: string
  user_id: string
  provedor: string | null
  titulo: string
  status: LibraryStatus
  progresso: number
}

export type Exercise = {
  id: string
  user_id: string
  nome: string
  grupo_muscular: string | null
  youtube_video_id: string | null
  cues: string | null
  cadencia_padrao: string | null
  created_at: string
}

export type Workout = {
  id: string
  user_id: string
  nome: string
  foco: string | null
  ordem: number
  ativo: boolean
}

export type WorkoutExercise = {
  id: string
  user_id: string
  workout_id: string
  exercise_id: string
  ordem: number
  series_alvo: number | null
  reps_alvo: string | null
  pausa_alvo_seg: number | null
  cadencia_alvo: string | null
  notas: string | null
}

export type WorkoutSession = {
  id: string
  user_id: string
  workout_id: string | null
  performed_at: string
  duracao_seg: number | null
  esforco_percebido: number | null
  notas: string | null
}

export type SetLog = {
  id: string
  user_id: string
  session_id: string
  exercise_id: string
  serie_num: number
  carga_kg: number | null
  reps: number | null
  pausa_seg: number | null
  cadencia: string | null
  rpe: number | null
  concluida: boolean
  created_at: string
}

export type CardioTipo = 'intervalado' | 'longo' | 'recuperacao'

export type CardioSession = {
  id: string
  user_id: string
  tipo: CardioTipo | null
  performed_at: string
  distancia_km: number | null
  duracao_seg: number | null
  fc_media: number | null
  zona: string | null
  tiros: string | null
  notas: string | null
}

export type FinanceTipo = 'receita' | 'gasto'

export type Finance = {
  id: string
  user_id: string
  tipo: FinanceTipo
  categoria: string | null
  valor: number
  descricao: string | null
  data: string
}

export type FinanceGoal = {
  id: string
  user_id: string
  ciclo_id: string | null
  meta_mensal: number | null
  numero_liberdade: number | null
}

export type BodyMetric = {
  id: string
  user_id: string
  peso_kg: number | null
  gordura_pct: number | null
  medido_em: string
}

export type Meal = {
  id: string
  user_id: string
  refeicao: number
  descricao: string | null
  proteina_g: number | null
  calorias: number | null
  tipo: string | null
  data: string
}

export type CrmClient = {
  id: string
  user_id: string
  nome: string
  fase: string | null
  valor_estimado: number | null
  proxima_acao: string | null
  data_proxima_acao: string | null
  created_at: string
}
