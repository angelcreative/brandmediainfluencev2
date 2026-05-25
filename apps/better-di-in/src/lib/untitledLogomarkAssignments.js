/**
 * Placeholder logomarks from Untitled UI (logomark only, no wordmark).
 * @see https://www.untitledui.com/resources/logos
 */
import slugs from '../data/untitledLogomarkSlugs.json'

const BASE = 'https://www.untitledui.com/images/logos'
const PRESETS = ['default', 'badge']

function buildPool() {
  const out = []
  for (const slug of slugs) {
    for (const preset of PRESETS) {
      out.push({
        key: `${preset}:${slug}`,
        src: `${BASE}/${preset}/light-logomark/${slug}.svg`,
      })
    }
  }
  return out
}

const POOL = buildPool()

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** In-place Fisher–Yates with deterministic PRNG (LCG). */
function seededShuffle(items, seed) {
  const a = items.slice()
  let s = seed >>> 0
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Unique logomark assets for one table page (no repeated preset+slug).
 * @param {{ page: number, rowCount: number, domainId: string }} opts
 * @returns {{ key: string, src: string }[]}
 */
export function getPageLogomarkAssignments({ page, rowCount, domainId }) {
  const n = Math.min(Math.max(0, rowCount), POOL.length)
  if (n === 0) return []
  const seed = hashString(`${domainId}|page:${page}`)
  const shuffled = seededShuffle(POOL, seed)
  return shuffled.slice(0, n)
}
