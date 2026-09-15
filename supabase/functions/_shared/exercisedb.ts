// Domínio da integração ExerciseDB (RapidAPI — API clássica `exercisedb.p.rapidapi.com`;
// o normalizador também aceita o formato da v2 com vídeos): normalização
// da resposta, mapeamento para o schema do FORJA (pt-BR) e montagem das
// rotinas de mobilidade. Puro (sem Deno/DOM): usado pela Edge Function
// exercise-import e pelos testes do app.

export type CategoriaExercicio =
  | 'forca'
  | 'cardio'
  | 'mobilidade'
  | 'equilibrio'
  | 'alongamento'
  | 'pliometria'
  | 'reabilitacao'

export const CATEGORIA_POR_TIPO: Record<string, CategoriaExercicio> = {
  strength: 'forca',
  cardio: 'cardio',
  mobility: 'mobilidade',
  balance: 'equilibrio',
  stretching: 'alongamento',
  plyometrics: 'pliometria',
  rehabilitation: 'reabilitacao',
}

export const CATEGORIA_LABEL: Record<CategoriaExercicio, string> = {
  forca: 'Força',
  cardio: 'Cardio',
  mobilidade: 'Mobilidade',
  equilibrio: 'Equilíbrio',
  alongamento: 'Alongamento',
  pliometria: 'Pliometria',
  reabilitacao: 'Reabilitação',
}

/** Exercício do ExerciseDB já normalizado (a API devolve caixa alta, arrays opcionais etc.). */
export type ExerciseDBExercise = {
  exercisedb_id: string
  nome_original: string
  bodyParts: string[]
  targetMuscles: string[]
  secondaryMuscles: string[]
  equipments: string[]
  exerciseType: string | null
  videoUrl: string | null
  gifUrl: string | null
  imageUrl: string | null
  overview: string | null
  instructions: string[]
  tips: string[]
  variations: string[]
  keywords: string[]
  relatedIds: string[]
  nivel: 'iniciante' | 'intermediario' | 'avancado' | null
}

// deno-lint-ignore no-explicit-any
type Json = any

const lower = (s: unknown) => String(s ?? '').trim().toLowerCase()
const NIVEL_POR_DIFICULDADE = { beginner: 'iniciante', intermediate: 'intermediario', advanced: 'avancado' } as const
const lista = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean) : []

export function normalizeExercise(raw: Json): ExerciseDBExercise | null {
  const id = String(raw?.exerciseId ?? raw?.id ?? '').trim()
  const nome = String(raw?.name ?? '').trim()
  if (!id || !nome) return null
  const imagens = raw?.imageUrls ?? {}
  return {
    exercisedb_id: id,
    nome_original: nome,
    // Clássica: bodyPart/target/equipment/category (strings); v2: arrays e exerciseType.
    bodyParts: lista(raw?.bodyParts ?? (raw?.bodyPart ? [raw.bodyPart] : [])).map(lower),
    targetMuscles: lista(raw?.targetMuscles ?? (raw?.target ? [raw.target] : [])).map(lower),
    secondaryMuscles: lista(raw?.secondaryMuscles).map(lower),
    equipments: lista(raw?.equipments ?? (raw?.equipment ? [raw.equipment] : [])).map(lower),
    exerciseType: raw?.exerciseType ?? raw?.category ? lower(raw.exerciseType ?? raw.category) : null,
    videoUrl: raw?.videoUrl ? String(raw.videoUrl) : null,
    gifUrl: raw?.gifUrl ? String(raw.gifUrl) : null,
    // 480p é o tamanho recomendado para cards; a detalhe usa o vídeo.
    imageUrl: imagens['480p'] ?? imagens['720p'] ?? raw?.imageUrl ?? null,
    overview: raw?.overview ?? raw?.description ? String(raw.overview ?? raw.description).trim() : null,
    instructions: lista(raw?.instructions),
    tips: lista(raw?.exerciseTips),
    variations: lista(raw?.variations),
    keywords: lista(raw?.keywords),
    relatedIds: lista(raw?.relatedExerciseIds),
    nivel: NIVEL_POR_DIFICULDADE[lower(raw?.difficulty ?? raw?.difficultyLevel) as keyof typeof NIVEL_POR_DIFICULDADE] ?? null,
  }
}

export function mapCategoria(exerciseType: string | null | undefined): CategoriaExercicio | null {
  if (!exerciseType) return null
  return CATEGORIA_POR_TIPO[lower(exerciseType)] ?? null
}

/**
 * Grupo muscular no vocabulário do FORJA (o mesmo que lib/muscle-groups entende).
 * "upper arms" vira bíceps ou tríceps pelo músculo-alvo.
 */
export function mapGrupoMuscular(bodyParts: string[], targetMuscles: string[] = []): string | null {
  const alvo = targetMuscles.join(' ')
  for (const parte of bodyParts.map(lower)) {
    switch (parte) {
      case 'chest':
        return 'peito'
      case 'back':
      case 'upper back':
      case 'lower back':
        return 'costas'
      case 'upper legs':
      case 'thighs':
      case 'quadriceps':
      case 'hamstrings':
        return 'pernas'
      case 'lower legs':
      case 'calves':
        return 'panturrilha'
      case 'shoulders':
        return 'ombros'
      case 'upper arms':
        return /tricep/.test(alvo) ? 'tríceps' : 'bíceps'
      case 'biceps':
        return 'bíceps'
      case 'triceps':
        return 'tríceps'
      case 'lower arms':
      case 'forearms':
        return 'antebraço'
      case 'waist':
        return 'abdômen'
      case 'glutes':
      case 'hips':
        return 'glúteos'
      case 'neck':
        return 'pescoço'
    }
  }
  return bodyParts[0] ?? null
}

const EQUIPAMENTO_PT: Record<string, string> = {
  'body weight': 'peso corporal',
  bodyweight: 'peso corporal',
  barbell: 'barra',
  'olympic barbell': 'barra olímpica',
  'ez barbell': 'barra W',
  dumbbell: 'halteres',
  cable: 'polia',
  'leverage machine': 'máquina',
  'smith machine': 'smith',
  machine: 'máquina',
  kettlebell: 'kettlebell',
  band: 'elástico',
  'resistance band': 'elástico',
  'stability ball': 'bola suíça',
  'medicine ball': 'medicine ball',
  rope: 'corda',
  weighted: 'com peso',
  roller: 'rolo',
  'foam roll': 'rolo de liberação',
}

export function mapEquipamento(equipments: string[]): string | null {
  const primeiro = equipments.map(lower)[0]
  if (!primeiro) return null
  return EQUIPAMENTO_PT[primeiro] ?? primeiro
}

export function semEquipamento(equipments: string[]): boolean {
  const e = equipments.map(lower)
  return e.length === 0 || e.every((x) => x === 'body weight' || x === 'bodyweight' || x === 'none')
}

export type Traducao = { nome: string; instrucoes: string[]; dicas: string[]; variacoes: string[] }

/** Linha de `exercises` a partir do ExerciseDB (sem user_id/nome: quem chama decide). */
export function buildExerciseRow(ex: ExerciseDBExercise, traducao?: Traducao | null) {
  return {
    exercisedb_id: ex.exercisedb_id,
    grupo_muscular: mapGrupoMuscular(ex.bodyParts, ex.targetMuscles),
    categoria: mapCategoria(ex.exerciseType),
    tipo_exercicio: ex.exerciseType,
    nivel: ex.nivel,
    equipamento: mapEquipamento(ex.equipments),
    video_url: ex.videoUrl,
    gif_url: ex.gifUrl,
    imagem_url: ex.imageUrl,
    instrucoes: traducao?.instrucoes.length ? traducao.instrucoes : ex.instructions,
    dicas_execucao: traducao?.dicas.length ? traducao.dicas : ex.tips,
    variacoes: traducao?.variacoes.length ? traducao.variacoes : ex.variations,
    musculos_secundarios: ex.secondaryMuscles,
    fonte: 'exercisedb' as const,
    exercisedb_data: {
      original_name: ex.nome_original,
      nome_traduzido: traducao?.nome ?? null,
      body_parts: ex.bodyParts,
      target_muscles: ex.targetMuscles,
      equipments: ex.equipments,
      overview: ex.overview,
      instructions_en: ex.instructions,
      tips_en: ex.tips,
      variations_en: ex.variations,
      keywords: ex.keywords,
      related_ids: ex.relatedIds,
    },
  }
}

// ─────────────────────────── rotinas de mobilidade ───────────────────────────

export type ContextoRotina = 'manha' | 'pre_forca' | 'pre_corrida' | 'pos_treino' | 'recuperacao' | 'qualquer'

/** Exercício candidato (linha de `exercises` com os dados originais do ExerciseDB). */
export type Candidato = {
  id: string
  nome: string
  categoria: string | null
  equipamento: string | null
  grupo_muscular: string | null
  exercisedb_data: { body_parts?: string[]; target_muscles?: string[]; keywords?: string[]; original_name?: string; equipments?: string[] } | null
}

export type RotinaDef = {
  nome: string
  descricao: string
  contexto: ContextoRotina
  categorias: CategoriaExercicio[]
  /** Uma região por "vaga": o 1º exercício que casa com cada lista de termos. */
  regioes: string[][]
  total: number
  segundos: number
  semEquipamento: boolean
}

export const ROTINAS_PADRAO: RotinaDef[] = [
  {
    nome: 'Ativação Matinal 5AM',
    descricao: 'Mobilidade de corpo inteiro, sem equipamento, para acordar articulações.',
    contexto: 'manha',
    categorias: ['mobilidade', 'alongamento'],
    regioes: [['neck', 'shoulder', 'delts', 'levator'], ['spine', 'back', 'thoracic', 'traps'], ['hip', 'glute', 'abductors', 'adductors'], ['hamstring', 'upper legs', 'quad'], ['ankle', 'calf', 'calves', 'lower legs']],
    total: 5,
    segundos: 45,
    semEquipamento: true,
  },
  {
    nome: 'Aquecimento Pré-Força',
    descricao: 'Mobilidade articular de ombro, quadril e coluna torácica antes do treino.',
    contexto: 'pre_forca',
    categorias: ['mobilidade'],
    regioes: [['shoulder', 'rotator', 'delt'], ['hip', 'glute', 'abductors'], ['thoracic', 'spine', 'back', 'traps'], ['shoulder', 'chest', 'pectorals', 'serratus']],
    total: 4,
    segundos: 40,
    semEquipamento: true,
  },
  {
    nome: 'Mobilidade Pós-Corrida',
    descricao: 'Alongamento estático de panturrilha, flexores do quadril, isquiotibiais e glúteos.',
    contexto: 'pos_treino',
    categorias: ['alongamento'],
    regioes: [['calf', 'calves', 'gastrocnemius', 'soleus', 'lower legs'], ['hip flexor', 'iliopsoas', 'quad'], ['hamstring'], ['glute']],
    total: 4,
    segundos: 50,
    semEquipamento: true,
  },
  {
    nome: 'Recuperação Ativa',
    descricao: 'Movimentos suaves para dias de recuperação baixa (score abaixo de 60).',
    contexto: 'recuperacao',
    categorias: ['reabilitacao', 'mobilidade'],
    regioes: [['spine', 'back'], ['hip', 'glute'], ['shoulder', 'neck', 'delts'], ['knee', 'upper legs', 'hamstring', 'quad'], ['ankle', 'calf', 'lower legs']],
    total: 5,
    segundos: 45,
    semEquipamento: true,
  },
]

function textoDoCandidato(c: Candidato): string {
  const d = c.exercisedb_data ?? {}
  return [c.nome, d.original_name, c.grupo_muscular, ...(d.body_parts ?? []), ...(d.target_muscles ?? []), ...(d.keywords ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/**
 * Escolhe os exercícios de uma rotina: um por região (ordem da definição) e,
 * se faltar, completa com os restantes das categorias — sem repetir.
 */
export function montarRotina(def: RotinaDef, candidatos: Candidato[]): string[] {
  const elegiveis = candidatos.filter((c) => {
    if (!c.categoria || !def.categorias.includes(c.categoria as CategoriaExercicio)) return false
    if (!def.semEquipamento) return true
    const eq = c.exercisedb_data?.equipments
    return eq ? semEquipamento(eq) : c.equipamento == null || c.equipamento === 'peso corporal'
  })

  const escolhidos: string[] = []
  for (const termos of def.regioes) {
    if (escolhidos.length >= def.total) break
    const achado = elegiveis.find((c) => !escolhidos.includes(c.id) && termos.some((t) => textoDoCandidato(c).includes(t)))
    if (achado) escolhidos.push(achado.id)
  }
  for (const c of elegiveis) {
    if (escolhidos.length >= def.total) break
    if (!escolhidos.includes(c.id)) escolhidos.push(c.id)
  }
  return escolhidos
}

// Regiões que preparam cada grupo de força (termos em inglês do ExerciseDB + pt do FORJA).
const PREPARA_GRUPO: Record<string, string[]> = {
  peito: ['chest', 'pector', 'shoulder', 'peito', 'ombro'],
  ombros: ['shoulder', 'delt', 'rotator', 'neck', 'ombro'],
  'tríceps': ['tricep', 'shoulder', 'upper arms', 'ombro'],
  'bíceps': ['bicep', 'forearm', 'wrist', 'upper arms'],
  costas: ['back', 'spine', 'thoracic', 'lats', 'traps', 'costas'],
  pernas: ['hip', 'hamstring', 'quad', 'upper legs', 'knee', 'glute', 'adductors', 'abductors', 'pernas'],
  'glúteos': ['glute', 'hip', 'glúteo'],
  panturrilha: ['calf', 'calves', 'ankle', 'lower legs', 'panturrilha'],
  'abdômen': ['spine', 'waist', 'abs', 'hip', 'lower back'],
}

/** Mobilidade/alongamento que prepara o grupo do exercício de força (máx. `max`, mobilidade antes de alongamento). */
export function alongamentosRelacionados(grupo: string | null, candidatos: Candidato[], max = 3): Candidato[] {
  const termos = grupo ? PREPARA_GRUPO[grupo.toLowerCase()] : undefined
  if (!termos) return []
  return candidatos
    .filter((c) => (c.categoria === 'mobilidade' || c.categoria === 'alongamento') && termos.some((t) => textoDoCandidato(c).includes(t)))
    .sort((a, b) => (a.categoria === b.categoria ? 0 : a.categoria === 'mobilidade' ? -1 : 1))
    .slice(0, max)
}

/** Duração em minutos (arredondada para cima) de uma rotina com N exercícios × segundos. */
export function duracaoRotinaMin(qtd: number, segundos: number): number {
  return Math.max(1, Math.ceil((qtd * segundos) / 60))
}
