/**
 * Escribe un .txt con un nombre de marca por línea (campo `name` tras el mismo
 * pipeline que la pestaña Brand en la app). Regenerar: npm run export:brand-names
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DOMAINS } from '../src/data/audienceData.js'
import { prepareBrandRelationshipDomain } from '../src/lib/brandRelationshipDomain.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const domain = DOMAINS.find((d) => d.id === 'brands-relationship')
if (!domain) {
  console.error('No brands-relationship domain in DOMAINS')
  process.exit(1)
}

const prepared = prepareBrandRelationshipDomain(structuredClone(domain))
const names = new Set()
for (const cat of prepared.categories) {
  for (const it of cat.items) {
    const n = it.name?.trim()
    if (n) names.add(n)
  }
}

const sorted = [...names].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
const outPath = join(root, 'listado-marcas-name.txt')
writeFileSync(outPath, `${sorted.join('\n')}\n`, 'utf8')
console.log(`Wrote ${sorted.length} names → ${outPath}`)
