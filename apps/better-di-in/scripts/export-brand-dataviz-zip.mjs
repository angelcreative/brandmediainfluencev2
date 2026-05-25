/**
 * Builds a zip of Brand (brands-relationship) data for external dataviz:
 * - brand_domain.json: full domain object + report meta
 * - brand_rows.json: flat rows (one per item)
 * - brand_rows.csv: same as CSV
 * - README.txt: column glossary
 *
 * Run from apps/better-di-in: node scripts/export-brand-dataviz-zip.mjs
 */
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { REPORT_META, BRAND } from '../src/data/audienceData.js'
import { CATEGORY_GROUP_BY_ID } from '../src/data/categoryGroupLabels.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(__dirname, '..')
const bundleName = 'brand-dataviz-export'
const staging = join(pkgRoot, `${bundleName}-staging`)
const zipPath = join(pkgRoot, `${bundleName}.zip`)

function csvEscape(v) {
  const s = v == null ? '' : String(v)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(rows, columns) {
  const header = columns.join(',')
  const lines = rows.map((row) =>
    columns.map((c) => csvEscape(row[c])).join(','),
  )
  return [header, ...lines].join('\n')
}

const rows = []
for (const cat of BRAND.categories) {
  const mediaGroup = CATEGORY_GROUP_BY_ID[cat.id] ?? ''
  for (const it of cat.items) {
    const sel = it.sel
    const benchmarkPen = sel > 0 ? it.pen / sel : null
    rows.push({
      domainId: BRAND.id,
      categoryId: cat.id,
      categoryTitle: cat.title,
      breadcrumb: cat.breadcrumb ?? '',
      mediaGroup,
      name: it.name,
      subName: it.subName ?? '',
      pen: it.pen,
      sel,
      reach: it.reach,
      benchmarkPen,
    })
  }
}

if (existsSync(staging)) rmSync(staging, { recursive: true })
mkdirSync(staging, { recursive: true })

writeFileSync(
  join(staging, 'brand_domain.json'),
  JSON.stringify({ reportMeta: REPORT_META, domain: BRAND }, null, 2),
  'utf8',
)
writeFileSync(join(staging, 'brand_rows.json'), JSON.stringify(rows, null, 2), 'utf8')

const cols = [
  'domainId',
  'categoryId',
  'categoryTitle',
  'breadcrumb',
  'mediaGroup',
  'name',
  'subName',
  'pen',
  'sel',
  'reach',
  'benchmarkPen',
]
writeFileSync(join(staging, 'brand_rows.csv'), toCsv(rows, cols), 'utf8')

writeFileSync(
  join(staging, 'README.txt'),
  `Brand data export (Criterion-style sample used in better-di-in)
Generated for external data visualization tools.

Files
-----
brand_domain.json  Full "Brands relationship" tree + REPORT_META (audience label, dates).
brand_rows.json    Flat array: one object per brand/item row.
brand_rows.csv     Same rows as CSV (UTF-8).

Columns (brand_rows.*)
------------------------
domainId        Always "brands-relationship".
categoryId      Stable id for the interest category node.
categoryTitle   Human title of that category.
breadcrumb      Path string from the source export.
mediaGroup      High-level group label (Retail & commerce, Automotive & mobility, …).
name            Entity / brand name.
subName         Extra label when present (often empty).
pen             Target penetration (% of audience), x-axis in the app chart.
sel             Times more likely (TML) vs benchmark, y-axis in the app chart.
reach           Absolute reach count from the source dataset (not recomputed).
benchmarkPen    Derived: pen / sel when sel > 0 (benchmark penetration %); same as app logic.

Notes
-----
- pen / sel / reach come from the bundled sample; treat as demo/sample data.
- For a second absolute scale you can multiply benchmarkPen by a fixed audience size in your viz.
`,
  'utf8',
)

if (existsSync(zipPath)) rmSync(zipPath)

execSync(`zip -r -q "${zipPath}" .`, { cwd: staging, stdio: 'inherit' })
rmSync(staging, { recursive: true })

// eslint-disable-next-line no-console
console.info(`Wrote ${zipPath} (${rows.length} rows)`)
