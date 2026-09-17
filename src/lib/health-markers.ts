// Placar de Saúde: catálogo dos marcadores de exame (grupo, unidade, faixa de referência),
// status Normal/Atenção/Crítico, variação vs medição anterior, alertas e evolução.
//
// Faixas: referências gerais de laboratório para homem adulto. Servem para organizar e
// sinalizar — o laudo e o médico são a referência final. Marcadores cuja unidade ou
// faixa varia muito entre laboratórios ficam sem referência (só valor e variação).

export type GrupoMarcador =
  | 'lipidios'
  | 'glicemia'
  | 'hormonios'
  | 'renal'
  | 'hepatica'
  | 'hemograma'
  | 'vitaminas'
  | 'inflamacao'
  | 'psa'

export const GRUPOS: { id: GrupoMarcador; label: string }[] = [
  { id: 'lipidios', label: 'Lipídios' },
  { id: 'glicemia', label: 'Glicemia' },
  { id: 'hormonios', label: 'Hormônios' },
  { id: 'renal', label: 'Função Renal' },
  { id: 'hepatica', label: 'Função Hepática' },
  { id: 'hemograma', label: 'Hemograma' },
  { id: 'vitaminas', label: 'Vitaminas' },
  { id: 'inflamacao', label: 'Inflamação' },
  { id: 'psa', label: 'PSA' },
]

export type StatusMarcador = 'normal' | 'atencao' | 'critico' | 'sem_referencia'

/** Para onde "melhorar" aponta: menor, maior ou para dentro/centro da faixa. */
export type DirecaoMarcador = 'menor_melhor' | 'maior_melhor' | 'faixa'

export type DefinicaoMarcador = {
  label: string
  unidade: string
  grupo: GrupoMarcador
  direcao: DirecaoMarcador
  /** Faixa normal (inclusiva). Sem faixa = sem referência. */
  normal?: { min?: number; max?: number }
  /** Abaixo de / acima de (exclusivo) já é crítico. */
  critico?: { abaixoDe?: number; acimaDe?: number }
  /** Texto curto da referência mostrado no card. */
  referencia?: string
}

export const MARCADORES: Record<string, DefinicaoMarcador> = {
  // Lipídios
  colesterol_total: { label: 'Colesterol total', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'menor_melhor', normal: { max: 189.9 }, critico: { acimaDe: 239.9 }, referencia: '< 190' },
  ldl: { label: 'LDL', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'menor_melhor', normal: { max: 129.9 }, critico: { acimaDe: 189.9 }, referencia: '< 130' },
  hdl: { label: 'HDL', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'maior_melhor', normal: { min: 40 }, critico: { abaixoDe: 30 }, referencia: '≥ 40' },
  nao_hdl: { label: 'Não-HDL', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'menor_melhor', normal: { max: 159.9 }, critico: { acimaDe: 219.9 }, referencia: '< 160' },
  triglicerides: { label: 'Triglicérides', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'menor_melhor', normal: { max: 149.9 }, critico: { acimaDe: 499.9 }, referencia: '< 150' },
  vldl: { label: 'VLDL', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'menor_melhor', normal: { max: 30 }, referencia: '≤ 30' },
  apo_b: { label: 'Apo B', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'menor_melhor', normal: { max: 99.9 }, critico: { acimaDe: 129.9 }, referencia: '< 100' },
  apo_a1: { label: 'Apo A1', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'maior_melhor', normal: { min: 104 }, referencia: '≥ 104' },
  lpa: { label: 'Lipoproteína (a)', unidade: 'mg/dL', grupo: 'lipidios', direcao: 'menor_melhor', normal: { max: 29.9 }, critico: { acimaDe: 50 }, referencia: '< 30' },

  // Glicemia
  glicemia: { label: 'Glicemia em jejum', unidade: 'mg/dL', grupo: 'glicemia', direcao: 'faixa', normal: { min: 70, max: 99 }, critico: { abaixoDe: 54, acimaDe: 125 }, referencia: '70–99' },
  insulina: { label: 'Insulina', unidade: 'µUI/mL', grupo: 'glicemia', direcao: 'faixa', normal: { min: 2.6, max: 24.9 }, referencia: '2,6–24,9' },
  hba1c: { label: 'Hemoglobina glicada (HbA1c)', unidade: '%', grupo: 'glicemia', direcao: 'menor_melhor', normal: { max: 5.6 }, critico: { acimaDe: 6.4 }, referencia: '< 5,7' },

  // Hormônios
  testosterona_total: { label: 'Testosterona total', unidade: 'ng/dL', grupo: 'hormonios', direcao: 'faixa', normal: { min: 264, max: 916 }, referencia: '264–916' },
  testosterona_livre: { label: 'Testosterona livre', unidade: 'ng/dL', grupo: 'hormonios', direcao: 'faixa' },
  testosterona_biodisponivel: { label: 'Testosterona biodisponível', unidade: 'ng/dL', grupo: 'hormonios', direcao: 'faixa' },
  shbg: { label: 'SHBG', unidade: 'nmol/L', grupo: 'hormonios', direcao: 'faixa', normal: { min: 10, max: 57 }, referencia: '10–57' },
  estradiol: { label: 'Estradiol', unidade: 'pg/mL', grupo: 'hormonios', direcao: 'faixa', normal: { min: 10, max: 40 }, referencia: '10–40' },
  prolactina: { label: 'Prolactina', unidade: 'ng/mL', grupo: 'hormonios', direcao: 'faixa', normal: { min: 2, max: 18 }, referencia: '2–18' },
  fsh: { label: 'FSH', unidade: 'mUI/mL', grupo: 'hormonios', direcao: 'faixa', normal: { min: 1.5, max: 12.4 }, referencia: '1,5–12,4' },
  lh: { label: 'LH', unidade: 'mUI/mL', grupo: 'hormonios', direcao: 'faixa', normal: { min: 1.7, max: 8.6 }, referencia: '1,7–8,6' },
  tsh: { label: 'TSH', unidade: 'mUI/L', grupo: 'hormonios', direcao: 'faixa', normal: { min: 0.4, max: 4.5 }, critico: { abaixoDe: 0.1, acimaDe: 10 }, referencia: '0,4–4,5' },
  t4_livre: { label: 'T4 livre', unidade: 'ng/dL', grupo: 'hormonios', direcao: 'faixa', normal: { min: 0.7, max: 1.8 }, referencia: '0,7–1,8' },

  // Função renal
  creatinina: { label: 'Creatinina', unidade: 'mg/dL', grupo: 'renal', direcao: 'faixa', normal: { min: 0.7, max: 1.3 }, critico: { acimaDe: 2 }, referencia: '0,7–1,3' },
  egfr: { label: 'eGFR (filtração)', unidade: 'mL/min/1,73m²', grupo: 'renal', direcao: 'maior_melhor', normal: { min: 90 }, critico: { abaixoDe: 60 }, referencia: '≥ 90' },
  ureia: { label: 'Ureia', unidade: 'mg/dL', grupo: 'renal', direcao: 'faixa', normal: { min: 15, max: 45 }, critico: { acimaDe: 100 }, referencia: '15–45' },
  acido_urico: { label: 'Ácido úrico', unidade: 'mg/dL', grupo: 'renal', direcao: 'faixa', normal: { min: 3.4, max: 7 }, critico: { acimaDe: 9 }, referencia: '3,4–7,0' },

  // Função hepática
  tgo: { label: 'TGO/AST', unidade: 'U/L', grupo: 'hepatica', direcao: 'menor_melhor', normal: { max: 40 }, critico: { acimaDe: 120 }, referencia: '≤ 40' },
  tgp: { label: 'TGP/ALT', unidade: 'U/L', grupo: 'hepatica', direcao: 'menor_melhor', normal: { max: 41 }, critico: { acimaDe: 123 }, referencia: '≤ 41' },
  ggt: { label: 'GGT', unidade: 'U/L', grupo: 'hepatica', direcao: 'menor_melhor', normal: { max: 60 }, critico: { acimaDe: 180 }, referencia: '≤ 60' },
  bilirrubina: { label: 'Bilirrubina total', unidade: 'mg/dL', grupo: 'hepatica', direcao: 'faixa', normal: { min: 0.2, max: 1.2 }, critico: { acimaDe: 3 }, referencia: '0,2–1,2' },

  // Hemograma
  hemoglobina: { label: 'Hemoglobina', unidade: 'g/dL', grupo: 'hemograma', direcao: 'faixa', normal: { min: 13.5, max: 17.5 }, critico: { abaixoDe: 10, acimaDe: 18.5 }, referencia: '13,5–17,5' },
  hematocrito: { label: 'Hematócrito', unidade: '%', grupo: 'hemograma', direcao: 'faixa', normal: { min: 40, max: 50 }, critico: { abaixoDe: 32, acimaDe: 54 }, referencia: '40–50' },
  eritrocitos: { label: 'Eritrócitos', unidade: 'milhões/µL', grupo: 'hemograma', direcao: 'faixa', normal: { min: 4.5, max: 5.9 }, referencia: '4,5–5,9' },
  leucocitos: { label: 'Leucócitos', unidade: '/µL', grupo: 'hemograma', direcao: 'faixa', normal: { min: 4000, max: 11000 }, critico: { abaixoDe: 2000, acimaDe: 20000 }, referencia: '4.000–11.000' },
  plaquetas: { label: 'Plaquetas', unidade: '/µL', grupo: 'hemograma', direcao: 'faixa', normal: { min: 150000, max: 450000 }, critico: { abaixoDe: 100000, acimaDe: 600000 }, referencia: '150–450 mil' },
  neutrofilos_pct: { label: 'Neutrófilos', unidade: '%', grupo: 'hemograma', direcao: 'faixa', normal: { min: 40, max: 70 }, referencia: '40–70' },
  linfocitos_pct: { label: 'Linfócitos', unidade: '%', grupo: 'hemograma', direcao: 'faixa', normal: { min: 20, max: 45 }, referencia: '20–45' },

  // Vitaminas
  vitamina_d: { label: 'Vitamina D', unidade: 'ng/mL', grupo: 'vitaminas', direcao: 'faixa', normal: { min: 30, max: 100 }, critico: { abaixoDe: 12 }, referencia: '30–100' },
  vitamina_b12: { label: 'Vitamina B12', unidade: 'pg/mL', grupo: 'vitaminas', direcao: 'faixa', normal: { min: 300, max: 900 }, critico: { abaixoDe: 200 }, referencia: '300–900' },
  // Referência do laboratório 0,4–2,0; até 0,6 fica em atenção por estar colado no limite inferior.
  vitamina_c: { label: 'Vitamina C', unidade: 'mg/dL', grupo: 'vitaminas', direcao: 'faixa', normal: { min: 0.61, max: 2 }, critico: { abaixoDe: 0.4 }, referencia: '0,4–2,0' },
  zinco: { label: 'Zinco', unidade: 'µg/dL', grupo: 'vitaminas', direcao: 'faixa', normal: { min: 70, max: 120 }, critico: { abaixoDe: 50 }, referencia: '70–120' },
  ferritina: { label: 'Ferritina', unidade: 'ng/mL', grupo: 'vitaminas', direcao: 'faixa', normal: { min: 30, max: 400 }, critico: { abaixoDe: 15, acimaDe: 1000 }, referencia: '30–400' },

  // Inflamação
  pcr_ultrassensivel: { label: 'PCR ultrassensível', unidade: 'mg/dL', grupo: 'inflamacao', direcao: 'menor_melhor', normal: { max: 0.3 }, critico: { acimaDe: 1 }, referencia: '< 0,3' },
  homocisteina: { label: 'Homocisteína', unidade: 'µmol/L', grupo: 'inflamacao', direcao: 'menor_melhor', normal: { max: 15 }, critico: { acimaDe: 30 }, referencia: '≤ 15' },
  vhs: { label: 'VHS', unidade: 'mm/h', grupo: 'inflamacao', direcao: 'menor_melhor', normal: { max: 15 }, critico: { acimaDe: 50 }, referencia: '≤ 15' },

  // PSA
  psa_total: { label: 'PSA total', unidade: 'ng/mL', grupo: 'psa', direcao: 'menor_melhor', normal: { max: 4 }, critico: { acimaDe: 10 }, referencia: '< 4,0' },
  psa_livre: { label: 'PSA livre', unidade: 'ng/mL', grupo: 'psa', direcao: 'faixa' },
}

type Leitura = { chave: string; valor: number; measured_at: string }

/** Marcadores de um grupo, na ordem do catálogo (seletor do formulário de exame). */
export function marcadoresDoGrupo(grupo: GrupoMarcador): { chave: string; def: DefinicaoMarcador }[] {
  return Object.entries(MARCADORES)
    .filter(([, def]) => def.grupo === grupo)
    .map(([chave, def]) => ({ chave, def }))
}

/** "Ômega 3 índice" → "omega_3_indice": chave de um marcador digitado em "Outro". */
export function chaveDoNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function statusDoMarcador(chave: string, valor: number): StatusMarcador {
  const def = MARCADORES[chave]
  if (!def?.normal) return 'sem_referencia'
  const { abaixoDe, acimaDe } = def.critico ?? {}
  if ((abaixoDe != null && valor < abaixoDe) || (acimaDe != null && valor > acimaDe)) return 'critico'
  const { min, max } = def.normal
  const dentro = (min == null || valor >= min) && (max == null || valor <= max)
  return dentro ? 'normal' : 'atencao'
}

export type SentidoVariacao = 'melhorou' | 'piorou' | 'estavel'

/** Distância até a faixa normal (0 dentro); usada para julgar "melhorou" em marcadores de faixa. */
function distanciaDaFaixa(def: DefinicaoMarcador, valor: number): number {
  const { min, max } = def.normal ?? {}
  if (min != null && valor < min) return min - valor
  if (max != null && valor > max) return valor - max
  // Dentro: quanto mais perto do centro, melhor (vale como desempate).
  if (min != null && max != null) return -(Math.min(valor - min, max - valor) / (max - min))
  return 0
}

export function sentidoDaVariacao(chave: string, anterior: number, atual: number): SentidoVariacao {
  if (anterior === atual) return 'estavel'
  const def = MARCADORES[chave]
  if (!def) return 'estavel'
  if (def.direcao === 'menor_melhor') return atual < anterior ? 'melhorou' : 'piorou'
  if (def.direcao === 'maior_melhor') return atual > anterior ? 'melhorou' : 'piorou'
  const antes = distanciaDaFaixa(def, anterior)
  const depois = distanciaDaFaixa(def, atual)
  return depois === antes ? 'estavel' : depois < antes ? 'melhorou' : 'piorou'
}

export type Variacao = { delta: number; anterior: number; dataAnterior: string; sentido: SentidoVariacao }

/** Última leitura vs a anterior (datas diferentes). Null sem medição anterior. */
export function variacaoDoMarcador(chave: string, leituras: Leitura[]): Variacao | null {
  const ordenadas = [...leituras].filter((l) => l.chave === chave).sort((a, b) => a.measured_at.localeCompare(b.measured_at))
  const atual = ordenadas.at(-1)
  const anterior = [...ordenadas].reverse().find((l) => atual && l.measured_at < atual.measured_at)
  if (!atual || !anterior) return null
  const delta = Math.round((atual.valor - anterior.valor) * 100) / 100
  return { delta, anterior: anterior.valor, dataAnterior: anterior.measured_at, sentido: sentidoDaVariacao(chave, anterior.valor, atual.valor) }
}

export type ItemPlacar = {
  chave: string
  def: DefinicaoMarcador
  valor: number
  data: string
  status: StatusMarcador
  variacao: Variacao | null
  historico: Leitura[]
}

export type PlacarPorGrupo = { grupo: GrupoMarcador; label: string; itens: ItemPlacar[] }[]

/** Agrupa as leituras por marcador do catálogo, na ordem dos grupos e do catálogo. */
export function montarPlacar(leituras: Leitura[]): PlacarPorGrupo {
  const porChave = new Map<string, Leitura[]>()
  for (const l of leituras) {
    if (!MARCADORES[l.chave]) continue
    porChave.set(l.chave, [...(porChave.get(l.chave) ?? []), l])
  }

  const itens: ItemPlacar[] = []
  for (const [chave, def] of Object.entries(MARCADORES)) {
    const historico = (porChave.get(chave) ?? []).sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    const ultima = historico.at(-1)
    if (!ultima) continue
    itens.push({
      chave,
      def,
      valor: ultima.valor,
      data: ultima.measured_at,
      status: statusDoMarcador(chave, ultima.valor),
      variacao: variacaoDoMarcador(chave, historico),
      historico,
    })
  }

  return GRUPOS.map((g) => ({ grupo: g.id, label: g.label, itens: itens.filter((i) => i.def.grupo === g.id) })).filter((g) => g.itens.length > 0)
}

export type AlertaPlacar = { chave: string; titulo: string; texto: string }

type RegraAlerta = { chave: string; quando: (valor: number) => boolean; texto: string }

/** Alertas com orientação específica, disparados pela última leitura do marcador. */
const REGRAS_ALERTA: RegraAlerta[] = [
  {
    chave: 'egfr',
    quando: (v) => v >= 60 && v < 90,
    texto: 'Filtração renal levemente reduzida — comum em pessoas com boa massa muscular. Beber 3,5L de água/dia. Repetir em 90 dias.',
  },
  {
    chave: 'estradiol',
    quando: (v) => v < 10,
    texto: 'Estradiol muito baixo — confirmar com médico antes de iniciar protocolo.',
  },
  {
    chave: 'vitamina_c',
    quando: (v) => v >= 0.4 && v <= 0.6,
    texto: 'Limite inferior da referência — aumentar frutas cítricas ou suplementar 500mg/dia.',
  },
]

export function alertasDoPlacar(placar: PlacarPorGrupo): AlertaPlacar[] {
  const itens = new Map(placar.flatMap((g) => g.itens).map((i) => [i.chave, i]))
  return REGRAS_ALERTA.flatMap((regra) => {
    const item = itens.get(regra.chave)
    if (!item || !regra.quando(item.valor)) return []
    const valor = String(item.valor).replace('.', ',')
    return [{ chave: regra.chave, titulo: `${item.def.label} ${valor}`, texto: regra.texto }]
  })
}

/** Destaques do card de evolução, nesta ordem; os demais seguem a ordem do catálogo. */
const ORDEM_EVOLUCAO = ['glicemia', 'colesterol_total', 'ldl']

export type EvolucaoItem = { chave: string; label: string; unidade: string; antes: number; depois: number; delta: number; sentido: SentidoVariacao }

/**
 * Marcadores medidos na primeira data de exame e de novo depois: primeiro valor → último.
 * Null quando só existe uma data de exame.
 */
export function evolucaoDesdeBase(placar: PlacarPorGrupo): { dataBase: string; itens: EvolucaoItem[]; todosMelhoraram: boolean } | null {
  const itens = placar.flatMap((g) => g.itens)
  const datas = [...new Set(itens.flatMap((i) => i.historico.map((h) => h.measured_at)))].sort()
  if (datas.length < 2) return null
  const dataBase = datas[0]

  const evolucao = itens.flatMap((i): EvolucaoItem[] => {
    const base = i.historico.find((h) => h.measured_at === dataBase)
    if (!base || i.data === dataBase) return []
    return [
      {
        chave: i.chave,
        label: i.def.label.replace(' em jejum', '').replace('Colesterol total', 'Colesterol'),
        unidade: i.def.unidade,
        antes: base.valor,
        depois: i.valor,
        delta: Math.round((i.valor - base.valor) * 10) / 10,
        sentido: sentidoDaVariacao(i.chave, base.valor, i.valor),
      },
    ]
  })
  if (evolucao.length === 0) return null

  const rank = (chave: string) => {
    const i = ORDEM_EVOLUCAO.indexOf(chave)
    return i === -1 ? ORDEM_EVOLUCAO.length : i
  }
  evolucao.sort((a, b) => rank(a.chave) - rank(b.chave))
  return { dataBase, itens: evolucao, todosMelhoraram: evolucao.every((e) => e.sentido === 'melhorou') }
}
