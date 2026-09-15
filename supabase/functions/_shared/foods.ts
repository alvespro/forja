// Domínio do multi-banco de alimentos (TACO → Open Food Facts → USDA → IA).
// Puro (sem Deno/DOM): usado pela Edge Function search-food e pelo app.

export type FonteAlimento = 'taco' | 'off' | 'usda' | 'ia_estimado'
export type Confianca = 'alta' | 'media' | 'baixa' | 'estimada'

export const FONTES: Record<FonteAlimento, { badge: string; confianca: Confianca; resumo: string; explicacao: string }> = {
  taco: {
    badge: '🇧🇷 TACO/UNICAMP',
    confianca: 'alta',
    resumo: 'Dados laboratoriais verificados',
    explicacao:
      'Tabela Brasileira de Composição de Alimentos (NEPA/UNICAMP): alimentos brasileiros analisados em laboratório, por 100 g de parte comestível.',
  },
  off: {
    badge: '🌍 Open Food Facts',
    confianca: 'media',
    resumo: 'Banco colaborativo mundial',
    explicacao:
      'Dados de rótulos de produtos embalados enviados por voluntários. Ótimo para código de barras; confira os valores com a embalagem.',
  },
  usda: {
    badge: '🔬 USDA',
    confianca: 'alta',
    resumo: 'Base científica americana',
    explicacao:
      'FoodData Central do Departamento de Agricultura dos EUA: análises laboratoriais, nomes em inglês.',
  },
  ia_estimado: {
    badge: '🤖 IA Estimado',
    confianca: 'estimada',
    resumo: 'Estimativa — confirme se possível',
    explicacao:
      'Nenhuma base tinha este alimento: os valores foram estimados por IA a partir de tabelas nutricionais padrão. Use como aproximação.',
  },
}

export type Por100g = {
  calorias: number | null
  proteina: number | null
  carbo: number | null
  gordura: number | null
  fibra: number | null
  sodio: number | null
  acucar: number | null
  gordura_saturada: number | null
}

export type ProdutoAlimento = {
  /** Chave estável entre fontes: barcode (OFF), 'taco:3', 'usda:168917', 'ia:<termo>'. */
  id: string
  barcode: string | null
  nome: string
  marca: string | null
  nutriscore: string | null
  nova_group: number | null
  imagem_url: string | null
  categoria: string | null
  fonte: FonteAlimento
  badge: string
  confianca: Confianca
  por_100g: Por100g
}

// deno-lint-ignore no-explicit-any
type Json = any

export function num(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10)
const round0 = (n: number | null) => (n == null ? null : Math.round(n))

/** Termo normalizado (minúsculas, sem acento, espaços colapsados) — chave do cache de IA. */
export function normalizarConsulta(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function idDoProduto(fonte: FonteAlimento, ref: { barcode?: string | null; taco_id?: string | null; usda_fdc_id?: string | null; consulta?: string | null; id?: string }): string {
  if (fonte === 'off' && ref.barcode) return ref.barcode
  if (fonte === 'taco' && ref.taco_id) return `taco:${ref.taco_id}`
  if (fonte === 'usda' && ref.usda_fdc_id) return `usda:${ref.usda_fdc_id}`
  if (fonte === 'ia_estimado' && ref.consulta) return `ia:${ref.consulta}`
  return ref.barcode ?? ref.id ?? ''
}

/** Linha de `foods_cache` → produto normalizado com badge da fonte. */
export function fromCache(row: Json): ProdutoAlimento {
  const fonte: FonteAlimento = row.fonte in FONTES ? row.fonte : 'off'
  return {
    id: idDoProduto(fonte, row),
    barcode: row.barcode ?? null,
    nome: row.nome,
    marca: row.marca ?? null,
    nutriscore: row.nutriscore ?? null,
    nova_group: row.nova_group ?? null,
    imagem_url: row.imagem_url ?? null,
    categoria: row.categoria ?? null,
    fonte,
    badge: FONTES[fonte].badge,
    confianca: (row.confianca as Confianca) ?? FONTES[fonte].confianca,
    por_100g: {
      calorias: num(row.calorias_100g),
      proteina: num(row.proteina_100g),
      carbo: num(row.carbo_100g),
      gordura: num(row.gordura_100g),
      fibra: num(row.fibra_100g),
      sodio: num(row.sodio_100g),
      acucar: num(row.acucar_100g),
      gordura_saturada: num(row.gordura_saturada_100g),
    },
  }
}

/** Produto cru do Open Food Facts (API v2 ou search-a-licious) → produto normalizado. */
export function fromOff(product: Json): ProdutoAlimento | null {
  const barcode = String(product?.code ?? product?._id ?? '').trim()
  const nome = String(product?.product_name_pt || product?.product_name || product?.generic_name || '').trim()
  if (!barcode || !nome) return null

  const n = product?.nutriments ?? {}
  const marcas = Array.isArray(product?.brands) ? product.brands.join(', ') : product?.brands
  const grade = product?.nutriscore_grade ? String(product.nutriscore_grade).toLowerCase() : null
  return {
    id: barcode,
    barcode,
    nome,
    marca: marcas ? String(marcas) : null,
    // "unknown"/"not-applicable" não são notas.
    nutriscore: grade && /^[a-e]$/.test(grade) ? grade : null,
    nova_group: num(product?.nova_group),
    imagem_url: product?.image_front_small_url ? String(product.image_front_small_url) : null,
    categoria: null,
    fonte: 'off',
    badge: FONTES.off.badge,
    confianca: FONTES.off.confianca,
    // O OFF devolve dízimas (382.97872340426): kcal inteira, macros com 1 casa.
    por_100g: {
      calorias: round0(num(n['energy-kcal_100g'])),
      proteina: round1(num(n['proteins_100g'])),
      carbo: round1(num(n['carbohydrates_100g'])),
      gordura: round1(num(n['fat_100g'])),
      fibra: round1(num(n['fiber_100g'])),
      sodio: num(n['sodium_100g']),
      acucar: round1(num(n['sugars_100g'])),
      gordura_saturada: round1(num(n['saturated-fat_100g'])),
    },
  }
}

/**
 * Alimento do USDA FoodData Central → produto normalizado.
 * Energia: 1008 (kcal); alimentos "Foundation" costumam trazer só 2047/2048
 * (Atwater) ou 1062 (kJ). Sódio vem em mg e o cache guarda em g.
 */
export function fromUsda(food: Json): ProdutoAlimento | null {
  const fdcId = food?.fdcId != null ? String(food.fdcId) : ''
  const nome = String(food?.description ?? '').trim()
  if (!fdcId || !nome) return null

  const valor = (id: number): number | null => {
    const nutriente = (food.foodNutrients ?? []).find((x: Json) => x?.nutrientId === id)
    return nutriente ? num(nutriente.value) : null
  }
  const kj = valor(1062)
  const kcal = valor(1008) ?? valor(2047) ?? valor(2048) ?? (kj != null ? kj / 4.184 : null)
  const sodioMg = valor(1093)

  return {
    id: `usda:${fdcId}`,
    barcode: null,
    nome,
    marca: null,
    nutriscore: null,
    nova_group: null,
    imagem_url: null,
    categoria: food?.foodCategory ? String(food.foodCategory) : null,
    fonte: 'usda',
    badge: FONTES.usda.badge,
    confianca: FONTES.usda.confianca,
    por_100g: {
      calorias: kcal == null ? null : Math.round(kcal),
      proteina: round1(valor(1003)),
      carbo: round1(valor(1005)),
      gordura: round1(valor(1004)),
      fibra: round1(valor(1079)),
      sodio: sodioMg == null ? null : Math.round(sodioMg) / 1000,
      acucar: round1(valor(2000)),
      gordura_saturada: round1(valor(1258)),
    },
  }
}

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'sem', 'e', 'em', 'na', 'no', 'para', 'a', 'o', 'ao'])

/**
 * A busca do OFF casa qualquer palavra ("xiriqueixo buriti assado" devolve
 * "Frango Assado"). Só aceitamos o produto se TODA palavra relevante do termo
 * começar alguma palavra do nome ou da marca — senão a cascata nunca chegaria
 * ao USDA/IA.
 */
export function nomeCasaComConsulta(nome: string, marca: string | null, termo: string): boolean {
  const palavras = normalizarConsulta(`${nome} ${marca ?? ''}`).split(' ')
  const tokens = normalizarConsulta(termo)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
  if (tokens.length === 0) return false
  return tokens.every((t) => palavras.some((p) => p.startsWith(t)))
}

/** Rótulo impossível (ex.: 104 g de proteína em 100 g) não entra na lista. */
export function macrosPlausiveis(p: Por100g): boolean {
  if (p.calorias == null || p.calorias < 0 || p.calorias > 900) return false
  const macros = [p.proteina, p.carbo, p.gordura].map((v) => v ?? 0)
  if (macros.some((v) => v < 0 || v > 100)) return false
  return macros.reduce((a, b) => a + b, 0) <= 105
}

export type EstimativaIa = {
  reconhecido: boolean
  nome: string
  calorias_100g: number
  proteina_100g: number
  carbo_100g: number
  gordura_100g: number
  fibra_100g: number
}

/**
 * Estimativa da IA só vira produto se for fisicamente possível: macros dentro de
 * 100 g e energia coerente com Atwater (4/4/9), com folga para fibra e álcool.
 */
export function estimativaPlausivel(e: EstimativaIa): boolean {
  if (!e.reconhecido || !e.nome?.trim()) return false
  const valores = [e.calorias_100g, e.proteina_100g, e.carbo_100g, e.gordura_100g, e.fibra_100g]
  if (valores.some((v) => typeof v !== 'number' || !Number.isFinite(v) || v < 0)) return false
  if (e.calorias_100g > 900) return false
  if (e.proteina_100g + e.carbo_100g + e.gordura_100g > 105) return false
  const atwater = 4 * e.proteina_100g + 4 * e.carbo_100g + 9 * e.gordura_100g
  return Math.abs(atwater - e.calorias_100g) <= Math.max(40, 0.3 * e.calorias_100g)
}
