// Domínio da integração com o Open Food Facts: tipos, badges e cálculo de porção.

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

export type ProdutoOFF = {
  barcode: string
  nome: string
  marca: string | null
  nutriscore: string | null
  nova_group: number | null
  imagem_url: string | null
  por_100g: Por100g
}

/** Nutri-Score: A (melhor) → E (pior). Sem dado = cinza. */
export const NUTRISCORE_CLASS: Record<string, string> = {
  a: 'bg-[#1e7d4f] text-white',
  b: 'bg-ok text-meia-noite',
  c: 'bg-atencao text-meia-noite',
  d: 'bg-[#e08c3e] text-meia-noite',
  e: 'bg-alerta text-white',
}

export function nutriscoreClass(grade: string | null): string {
  if (!grade) return 'bg-aco-claro text-aco-texto'
  return NUTRISCORE_CLASS[grade.toLowerCase()] ?? 'bg-aco-claro text-aco-texto'
}

export const NOVA_LABEL: Record<number, string> = {
  1: 'Mín. processado',
  2: 'Ingrediente culinário',
  3: 'Processado',
  4: 'Ultraprocessado',
}

export const NOVA_CLASS: Record<number, string> = {
  1: 'bg-ok/20 text-ok',
  2: 'bg-atencao/20 text-atencao',
  3: 'bg-brasa/20 text-brasa',
  4: 'bg-alerta/20 text-alerta',
}

/** Unidades de porção e quanto cada uma vale em gramas (aproximações de uso caseiro). */
export const UNIDADES = [
  { value: 'g', label: 'g', gramas: 1 },
  { value: 'ml', label: 'ml', gramas: 1 },
  { value: 'unidade', label: 'unidade', gramas: 100 },
  { value: 'colher', label: 'colher (sopa)', gramas: 15 },
  { value: 'xicara', label: 'xícara', gramas: 240 },
] as const

export type UnidadeValue = (typeof UNIDADES)[number]['value']

export function gramasDaPorcao(quantidade: number, unidade: UnidadeValue): number {
  const fator = UNIDADES.find((u) => u.value === unidade)?.gramas ?? 1
  return quantidade * fator
}

export type MacrosCalculados = {
  calorias: number
  proteina: number
  carbo: number
  gordura: number
  acucar: number
}

/** Regra de três sobre os valores por 100g: (valor × gramas) / 100. */
export function calcularMacros(por100g: Por100g, gramas: number): MacrosCalculados {
  const fator = gramas / 100
  const calc = (v: number | null) => Math.round(((v ?? 0) * fator + Number.EPSILON) * 10) / 10
  return {
    calorias: Math.round((por100g.calorias ?? 0) * fator),
    proteina: calc(por100g.proteina),
    carbo: calc(por100g.carbo),
    gordura: calc(por100g.gordura),
    acucar: calc(por100g.acucar),
  }
}

const ACUCAR_LIMITE_JANTAR = 10
const SLOT_JANTAR = 6

/**
 * Regra do perfil: açúcar alto no jantar conversa com a glicemia de jejum 103.
 * Baseada no teor por 100g do produto, como especificado.
 */
export function alertaAcucarNoJantar(produto: ProdutoOFF, slotNumero: number | null): boolean {
  return (produto.por_100g.acucar ?? 0) > ACUCAR_LIMITE_JANTAR && slotNumero === SLOT_JANTAR
}

export function isUltraprocessado(produto: ProdutoOFF): boolean {
  return produto.nova_group === 4
}

export function nutriscoreRuim(produto: ProdutoOFF): boolean {
  const g = produto.nutriscore?.toLowerCase()
  return g === 'd' || g === 'e'
}
