// Importa a TACO (597 alimentos in natura brasileiros) para `foods_cache`.
//
// Uso (Node 24 roda TypeScript direto):
//   node scripts/import-taco.ts --sql supabase/migrations/<versao>_taco_import.sql
//     → gera o SQL de upsert (aplicado como migration versionada)
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-taco.ts
//     → grava direto via REST (service role: o cache é só leitura para usuários)
//
// Idempotente: upsert por taco_id.

import { writeFileSync } from 'node:fs'

import { TACO_CSV_URL, tacoRows, tacoUpsertSql, type TacoRow } from './lib/taco.ts'

async function baixarCsv(): Promise<string> {
  const res = await fetch(TACO_CSV_URL)
  if (!res.ok) throw new Error(`Falha ao baixar a TACO: HTTP ${res.status}`)
  return res.text()
}

async function gravarViaRest(rows: TacoRow[]) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, ou use --sql <arquivo>.')

  for (let i = 0; i < rows.length; i += 200) {
    const lote = rows.slice(i, i + 200)
    const res = await fetch(`${url}/rest/v1/foods_cache?on_conflict=taco_id`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(lote),
    })
    if (!res.ok) throw new Error(`Lote ${i / 200 + 1}: HTTP ${res.status} ${await res.text()}`)
  }
}

const rows = tacoRows(await baixarCsv())
console.log(`TACO: ${rows.length} alimentos lidos.`)

const iSql = process.argv.indexOf('--sql')
if (iSql >= 0) {
  const destino = process.argv[iSql + 1]
  if (!destino) throw new Error('Informe o arquivo: --sql <caminho>')
  const cabecalho =
    `-- TACO 4ª edição (NEPA/UNICAMP) → foods_cache, ${rows.length} alimentos.\n` +
    `-- Gerado por scripts/import-taco.ts a partir de ${TACO_CSV_URL} (MIT).\n\n`
  writeFileSync(destino, cabecalho + tacoUpsertSql(rows))
  console.log(`SQL gravado em ${destino}.`)
} else {
  await gravarViaRest(rows)
  console.log(`${rows.length} alimentos gravados em foods_cache (fonte='taco').`)
}
