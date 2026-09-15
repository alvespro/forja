// Leitura da TACO (4ª edição, NEPA/UNICAMP) no CSV normalizado do projeto
// brolesi/taco (MIT) e conversão para linhas de `foods_cache`.
// Valores por 100 g de parte comestível. No CSV, `1e-05` é "traço" (Tr) e
// vazio é "não analisado".

export const TACO_CSV_URL =
  'https://raw.githubusercontent.com/brolesi/taco/main/data/processed/taco/taco_composicao.csv'

export type TacoRow = {
  taco_id: string
  nome: string
  categoria: string | null
  calorias_100g: number | null
  proteina_100g: number | null
  carbo_100g: number | null
  gordura_100g: number | null
  fibra_100g: number | null
  /** Em gramas, como o resto do cache (a TACO publica em mg). */
  sodio_100g: number | null
  fonte: 'taco'
  confianca: 'alta'
  pais: 'br'
}

/** CSV com campos entre aspas (vírgulas e aspas duplicadas dentro do campo). */
export function parseCsv(texto: string): string[][] {
  const linhas: string[][] = []
  let campo = ''
  let linha: string[] = []
  let aspas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') {
        aspas = false
      } else {
        campo += c
      }
    } else if (c === '"') {
      aspas = true
    } else if (c === ',') {
      linha.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      linha.push(campo)
      if (linha.some((v) => v !== '')) linhas.push(linha)
      linha = []
      campo = ''
    } else {
      campo += c
    }
  }
  if (campo !== '' || linha.length > 0) {
    linha.push(campo)
    if (linha.some((v) => v !== '')) linhas.push(linha)
  }
  return linhas
}

/** Traço vira 0; vazio/inválido vira null; o resto é arredondado. */
export function valorTaco(bruto: string | undefined, casas = 2): number | null {
  if (bruto == null || bruto.trim() === '') return null
  const n = Number(bruto)
  if (!Number.isFinite(n)) return null
  if (n <= 1e-5) return 0
  const fator = 10 ** casas
  return Math.round(n * fator) / fator
}

export function tacoRows(csv: string): TacoRow[] {
  const [cabecalho, ...dados] = parseCsv(csv)
  const col = (nome: string) => {
    const i = cabecalho.indexOf(nome)
    if (i < 0) throw new Error(`Coluna ausente no CSV da TACO: ${nome}`)
    return i
  }
  const c = {
    id: col('numero_alimento'),
    descricao: col('descricao'),
    kcal: col('energia_kcal'),
    proteina: col('proteina_g'),
    lipideos: col('lipideos_g'),
    carbo: col('carboidrato_g'),
    fibra: col('fibra_g'),
    sodio: col('sodio_mg'),
    categoria: col('categoria'),
  }

  return dados
    .filter((l) => l[c.id]?.trim() && l[c.descricao]?.trim())
    .map((l) => {
      const sodioMg = valorTaco(l[c.sodio], 3)
      return {
        taco_id: l[c.id].trim(),
        nome: l[c.descricao].trim(),
        categoria: l[c.categoria]?.trim() || null,
        calorias_100g: valorTaco(l[c.kcal], 0),
        proteina_100g: valorTaco(l[c.proteina], 1),
        carbo_100g: valorTaco(l[c.carbo], 1),
        gordura_100g: valorTaco(l[c.lipideos], 1),
        fibra_100g: valorTaco(l[c.fibra], 1),
        sodio_100g: sodioMg == null ? null : Math.round(sodioMg) / 1000,
        fonte: 'taco',
        confianca: 'alta',
        pais: 'br',
      }
    })
}

const sqlTexto = (v: string | null) => (v == null ? 'null' : `'${v.replace(/'/g, "''")}'`)
const sqlNum = (v: number | null) => (v == null ? 'null' : String(v))

/** Upsert idempotente por `taco_id` (reimportar atualiza, não duplica). */
export function tacoUpsertSql(rows: TacoRow[]): string {
  const valores = rows
    .map(
      (r) =>
        `(${sqlTexto(r.taco_id)}, ${sqlTexto(r.nome)}, ${sqlTexto(r.categoria)}, ${sqlNum(r.calorias_100g)}, ` +
        `${sqlNum(r.proteina_100g)}, ${sqlNum(r.carbo_100g)}, ${sqlNum(r.gordura_100g)}, ${sqlNum(r.fibra_100g)}, ` +
        `${sqlNum(r.sodio_100g)}, 'taco', 'alta', 'br')`,
    )
    .join(',\n')

  return `insert into public.foods_cache
  (taco_id, nome, categoria, calorias_100g, proteina_100g, carbo_100g, gordura_100g, fibra_100g, sodio_100g, fonte, confianca, pais)
values
${valores}
on conflict (taco_id) where taco_id is not null do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  calorias_100g = excluded.calorias_100g,
  proteina_100g = excluded.proteina_100g,
  carbo_100g = excluded.carbo_100g,
  gordura_100g = excluded.gordura_100g,
  fibra_100g = excluded.fibra_100g,
  sodio_100g = excluded.sodio_100g,
  fonte = 'taco',
  confianca = 'alta',
  cached_at = now();
`
}
