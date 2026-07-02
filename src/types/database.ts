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
  created_at: string
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
  progresso: number | null
  nota_321: string | null
  dev_area_id: string | null
  habilidades_desenvolvidas: string[] | null
  aprendizado_1: string | null
  aprendizado_2: string | null
  aprendizado_3: string | null
  aplicacao_1: string | null
  aplicacao_2: string | null
  acao_1: string | null
  citacao_favorita: string | null
  nota_geral: number | null
  data_inicio: string | null
  data_conclusao: string | null
  relido: boolean | null
  resumo: string | null
}

export type Course = {
  id: string
  user_id: string
  dev_area_id: string | null
  provedor: string | null
  titulo: string
  status: LibraryStatus
  progresso: number | null
  nota_geral: number | null
  plataforma: string | null
  carga_horaria: number | null
  certificado_url: string | null
  citacao_favorita: string | null
  data_inicio: string | null
  data_conclusao: string | null
  habilidades_desenvolvidas: string[] | null
  aprendizado_1: string | null
  aprendizado_2: string | null
  aprendizado_3: string | null
  aplicacao_1: string | null
  aplicacao_2: string | null
  acao_1: string | null
  resumo: string | null
}

export type DevAreaCategoria = 'mentalidade' | 'interpessoal' | 'soft_skill' | 'hard_skill'

export type DevArea = {
  id: string
  user_id: string
  nome: string
  categoria: DevAreaCategoria
  descricao: string | null
  cor: string | null
  nivel_atual: number | null
  nivel_meta: number | null
  ativo: boolean | null
  ordem: number | null
  created_at: string | null
}

export type Skill = {
  id: string
  user_id: string
  dev_area_id: string | null
  nome: string
  nivel_atual: number | null
  nivel_meta: number | null
  tipo: string | null
  evidencias: string | null
  proximos_passos: string | null
  ordem: number | null
  updated_at: string | null
}

export type DevMediaStatus = 'quero_ver' | 'assistindo' | 'assistido'
export type DevMediaTipo = 'filme' | 'documentario' | 'serie' | 'podcast' | 'video'

export type DevMedia = {
  id: string
  user_id: string
  dev_area_id: string | null
  tipo: DevMediaTipo | null
  titulo: string
  diretor_ou_host: string | null
  plataforma: string | null
  status: DevMediaStatus | null
  nota_geral: number | null
  origem: string | null
  habilidades_desenvolvidas: string[] | null
  aprendizado_1: string | null
  aprendizado_2: string | null
  aprendizado_3: string | null
  aplicacao_1: string | null
  aplicacao_2: string | null
  acao_1: string | null
  notas: string | null
  data_conclusao: string | null
  created_at: string | null
}

export type DevSuggestionStatus = 'pendente' | 'adicionado' | 'ignorado'
export type DevSuggestionTipo = 'livro' | 'curso' | 'filme' | 'documentario' | 'podcast' | 'video'

export type DevSuggestion = {
  id: string
  user_id: string
  dev_area_id: string | null
  semana_sugestao: string | null
  tipo: DevSuggestionTipo | null
  titulo: string
  autor_ou_diretor: string | null
  plataforma: string | null
  motivo: string | null
  habilidades_alvo: string[] | null
  area: string | null
  status: DevSuggestionStatus | null
  created_at: string | null
}

export type DevProgress = {
  id: string
  user_id: string
  skill_id: string | null
  nivel: number
  evidencia: string | null
  registrado_em: string | null
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
  musculo_pct: number | null
  agua_pct: number | null
  gordura_visceral: number | null
  imc: number | null
  medido_em: string
}

export type ObjetivoCorporal = 'ganho_massa' | 'recomposicao' | 'perda_peso' | 'definicao' | 'performance'

export type BodyGoal = {
  id: string
  user_id: string
  cycle_id: string | null
  objetivo: ObjetivoCorporal
  peso_meta_kg: number | null
  gordura_meta_pct: number | null
  musculo_pct_meta: number | null
  agua_meta_pct: number | null
  gordura_visceral_meta: number | null
  imc_meta: number | null
  created_at: string
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

export type DietPlan = {
  id: string
  user_id: string
  cycle_id: string | null
  nome: string
  ativo: boolean
  calorias_alvo: number | null
  proteina_g: number | null
  carbo_g: number | null
  gordura_g: number | null
  observacoes: string | null
  created_at: string
}

export type MealSlotTipo = 'cafe_manha' | 'pre_treino' | 'pos_treino' | 'almoco' | 'lanche' | 'jantar'

export type MealSlot = {
  id: string
  user_id: string
  diet_plan_id: string
  numero: number
  nome: string
  horario_alvo: string | null
  tipo: MealSlotTipo
  calorias_alvo: number | null
  proteina_g_alvo: number | null
  carbo_g_alvo: number | null
  gordura_g_alvo: number | null
  notas: string | null
}

export type MealLogFonte = 'yazio' | 'manual'

export type MealLog = {
  id: string
  user_id: string
  meal_slot_id: string | null
  data: string
  descricao: string | null
  calorias: number | null
  proteina_g: number | null
  carbo_g: number | null
  gordura_g: number | null
  fonte: MealLogFonte
  yazio_sync_id: string | null
  created_at: string
}

export type MealSuggestionIngrediente = {
  nome: string
  quantidade: string
  food_id?: string
}

export type MealSuggestion = {
  id: string
  user_id: string
  meal_slot_id: string | null
  nome: string
  descricao: string | null
  calorias: number | null
  proteina_g: number | null
  carbo_g: number | null
  gordura_g: number | null
  ingredientes: MealSuggestionIngrediente[] | null
  origem: 'ia' | 'manual'
  ativa: boolean
  created_at: string
}

export type Food = {
  id: string
  user_id: string
  nome: string
  fonte: MealLogFonte
  yazio_id: string | null
  calorias_100g: number | null
  proteina_100g: number | null
  carbo_100g: number | null
  gordura_100g: number | null
  fibra_100g: number | null
  categoria: string | null
  disponivel_rio_verde: boolean
  created_at: string
}

export type FoodSubstitution = {
  id: string
  user_id: string
  food_id_original: string | null
  food_id_substituto: string | null
  motivo: string | null
  equivalencia_g: number | null
  aprovado_ia: boolean
  created_at: string
}

export type SupplementTipo = 'whey' | 'creatina' | 'vitamina' | 'pre_treino' | 'omega3' | 'minerais' | 'outro'
export type SupplementMomento =
  | 'jejum'
  | 'cafe_manha'
  | 'pre_treino'
  | 'pos_treino'
  | 'almoco'
  | 'jantar'
  | 'dormir'
  | 'qualquer'

export type Supplement = {
  id: string
  user_id: string
  nome: string
  tipo: SupplementTipo | null
  dose: string | null
  unidade: string | null
  momento: SupplementMomento | null
  dias_semana: string[] | null
  ativo: boolean
  notas: string | null
  created_at: string
}

export type SupplementLog = {
  id: string
  user_id: string
  supplement_id: string
  data: string
  tomado: boolean
  horario: string | null
}

export type DocumentImportTipo = 'exame' | 'treino' | 'dieta' | 'suplemento' | 'outro'
export type DocumentImportStatus = 'pendente' | 'confirmado' | 'rejeitado' | 'erro'

export type DocumentImport = {
  id: string
  user_id: string
  tipo: DocumentImportTipo
  storage_path: string
  status: DocumentImportStatus
  dados_extraidos: Record<string, unknown> | null
  dados_confirmados: Record<string, unknown> | null
  erro: string | null
  created_at: string
}

// ─── PROTOCOLO ────────────────────────────────────────────────────────────────

export type ProtocolStatus = 'planejado' | 'ativo' | 'tpc' | 'concluido'
export type ProtocolVia = 'injetavel' | 'oral' | 'topico'

export type Protocol = {
  id: string
  user_id: string
  nome: string
  objetivo: string
  status: ProtocolStatus | null
  via: ProtocolVia | null
  medico_responsavel: string | null
  data_inicio: string | null
  data_fim_prevista: string | null
  duracao_semanas: number | null
  notas: string | null
  created_at: string | null
}

export type ProtocolCompound = {
  id: string
  user_id: string
  protocol_id: string
  nome: string
  categoria: string | null
  dose_mg: number | null
  frequencia: string | null
  via: string | null
  semana_inicio: number | null
  semana_fim: number | null
  notas: string | null
  ordem: number | null
}

export type ProtocolExamStatus = 'pendente' | 'agendado' | 'realizado' | 'atrasado'

export type ProtocolExam = {
  id: string
  user_id: string
  protocol_id: string
  nome: string
  tipo: string | null
  semana_alvo: number | null
  status: ProtocolExamStatus | null
  data_prevista: string | null
  data_realizada: string | null
  observacoes: string | null
  health_metric_snapshot: Record<string, unknown> | null
}

export type ProtocolLog = {
  id: string
  user_id: string
  protocol_id: string
  compound_id: string | null
  data_aplicacao: string
  dose_aplicada_mg: number | null
  local_aplicacao: string | null
  humor: number | null
  energia: number | null
  libido: number | null
  efeitos_percebidos: string | null
  observacoes: string | null
}

export type ProtocolSupport = {
  id: string
  user_id: string
  protocol_id: string
  nome: string
  categoria: string | null
  dose: string | null
  momento: string | null
  motivo: string | null
  semana_inicio: number | null
  semana_fim: number | null
  ativo: boolean | null
}

export type DailyScore = {
  id: string
  user_id: string
  data: string
  pontos: number
  total: number
  bonus: number
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  tipo: string
  titulo: string
  corpo: string | null
  link: string | null
  dedupe_key: string
  lida: boolean
  created_at: string
}

export type ProtocolGoal = {
  id: string
  user_id: string
  protocol_id: string
  peso_inicial_kg: number | null
  peso_meta_kg: number | null
  gordura_inicial_pct: number | null
  gordura_meta_pct: number | null
  musculo_inicial_kg: number | null
  musculo_meta_kg: number | null
  forca_meta: string | null
  notas: string | null
}
