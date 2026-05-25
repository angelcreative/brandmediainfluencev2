import { DOMAINS } from '../data/audienceData.js'

export const BRAND_RELATIONSHIP_DOMAIN_ID = 'brands-relationship'

/* Criterion "Brands relationship" mixes real brand rows with taxonomy
 * buckets (same `name` repeated with different subNames), automotive
 * segments, BUs, and vehicle rows. Keep only rows that read as brand
 * entities: drop structural non-brands + names that repeat globally
 * as bucket labels (freq ≥ 4 in this export). */
const CRITERION_BRAND_NAME_DENYLIST = new Set(
  [
    'sauces, dressings & condiments',
    'fruits & vegetables',
    'car sharing players',
    'wealth management',
    'food delivery services',
    'fuel provider',
    'ice-cream',
    'trading plateform',
    'rental companies',
    'credit card',
    'segment',
  ].map((s) => s.toLowerCase()),
)

let brandRelationNameCountsCache
function getBrandRelationNameCounts() {
  if (brandRelationNameCountsCache) return brandRelationNameCountsCache
  const dom = DOMAINS.find((d) => d.id === BRAND_RELATIONSHIP_DOMAIN_ID)
  const m = new Map()
  if (dom) {
    for (const c of dom.categories) {
      for (const it of c.items) {
        const n = it.name?.trim()
        if (!n) continue
        m.set(n, (m.get(n) || 0) + 1)
      }
    }
  }
  brandRelationNameCountsCache = m
  return m
}

/** Trailing "(vehicle)" / "(vehicles)" marks Criterion vehicle-proxy rows.
 * Drop "Make Model (vehicle)" lines inside Automotive; keep one-token OEM
 * duplicates like "Volkswagen (vehicle)" so dedupe can merge with "Volkswagen".
 * Keep multi-word corporate proxies (last token is a legal-style suffix). */
const TRAILING_VEHICLE_MARK = /\s*\((?:vehicle|vehicles)\)\s*$/i

const VEHICLE_PROXY_CORPORATE_LAST = new Set([
  'motors',
  'motor',
  'company',
  'companies',
  'automotive',
  'automobiles',
  'corporation',
  'corp',
  'limited',
  'llc',
  'inc',
  'group',
  'mobility',
  'industries',
  'enterprises',
  'parts',
  'bank',
  'cars',
  'ag',
  'sa',
  'nv',
  'plc',
  'gmbh',
  'se',
])

function isTrailingVehicleModelProxyName(name) {
  const raw = String(name || '').trim()
  if (!raw || !TRAILING_VEHICLE_MARK.test(raw)) return false
  const base = raw.replace(TRAILING_VEHICLE_MARK, '').trim()
  const tokens = base.split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return false
  const last = tokens[tokens.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '')
  if (VEHICLE_PROXY_CORPORATE_LAST.has(last)) return false
  return true
}

function isCriterionBrandEntityItem(item) {
  const name = item.name?.trim()
  if (!name) return false
  if (CRITERION_BRAND_NAME_DENYLIST.has(name.toLowerCase())) return false
  if (/\(BU\)/i.test(name)) return false
  if (/^\s*segment\b/i.test(name)) return false
  if (isTrailingVehicleModelProxyName(name)) return false
  if ((getBrandRelationNameCounts().get(name) || 0) >= 4) return false
  return true
}

function filterToBrandRelationshipEntities(domain) {
  if (domain.id !== BRAND_RELATIONSHIP_DOMAIN_ID) return domain
  return {
    ...domain,
    categories: domain.categories.map((c) => ({
      ...c,
      items: c.items.filter(isCriterionBrandEntityItem),
    })),
  }
}

/** Criterion file buckets vehicle/segment/model lines under automotive-*-s-segments*.
 * Those are not primitive marques — drop the whole categories so dedupe only
 * sees rows like the main "Automotive" group (Audi, Hyundai, …). */
function isPrimitiveBrandRelationshipCategory(cat) {
  if (!cat?.id) return true
  if (cat.id.includes('automotive-s-segments')) return false
  return true
}

function excludeBrandSegmentTaxonomyCategories(domain) {
  if (domain.id !== BRAND_RELATIONSHIP_DOMAIN_ID) return domain
  return {
    ...domain,
    categories: domain.categories.filter(isPrimitiveBrandRelationshipCategory),
  }
}

const LEADING_ARTICLE = new Set(['the', 'a', 'an'])

function normBrandKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Strip Criterion disambiguators: (automobile), (marque), (retailer), etc. */
function stripTrailingCriterionParentheticals(name) {
  let s = String(name || '').trim()
  let prev = null
  while (prev !== s) {
    prev = s
    s = s.replace(/\s*\([^()]{0,200}\)\s*$/u, '').trim()
  }
  return s
}

/** Map variant display names (ID lines, R-line, etc.) to one preference key. */
function canonicalBrandKey(rawName) {
  let s = stripTrailingCriterionParentheticals(String(rawName || '').trim())
  if (!s) return ''

  const idm = s.match(/^(.+?)\s+ID(?:\.|\s|$)/i)
  if (idm) return normBrandKey(idm[1])

  const rm = s.match(/^(.+?)\s+R(?:\s|\(|$)/i)
  if (rm) return normBrandKey(rm[1])

  const tokens = s.split(/\s+/).filter(Boolean)
  if (!tokens.length) return normBrandKey(s)

  if (LEADING_ARTICLE.has(tokens[0].toLowerCase()) && tokens.length >= 2) {
    return normBrandKey(s)
  }

  if (tokens[0].includes('-') && tokens.length >= 2) {
    const t1 = tokens[1]
    if (/\d/.test(t1) || /^[A-Za-z]{1,4}\d?$/.test(t1)) {
      return normBrandKey(tokens[0])
    }
  }

  const pieces = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (/\d/.test(t)) break
    if (/^(M|X|RS|Q|A|I|GT|AMG)([-+/\d]|$)/i.test(t)) break
    if (/^(Class|Series|Coupe|Sedan|Hatchback|SUV)\b/i.test(t)) break
    pieces.push(t)
    if (pieces.length >= 2 && !tokens[0].includes('-')) break
    if (pieces.length >= 3) break
  }
  if (!pieces.length) return normBrandKey(tokens[0])
  return normBrandKey(pieces.join(' '))
}

function prettifyBrandKey(key) {
  const k = normBrandKey(key)
  if (!k) return ''
  return k
    .split(/([-\s]+)/)
    .map((seg) => {
      if (!seg || /^[-\s]+$/.test(seg)) return seg
      return seg.charAt(0).toUpperCase() + seg.slice(1)
    })
    .join('')
}

function brandRowSignature(catId, item) {
  return `${catId}\t${item.name}\t${String(item.subName ?? '')}\t${item.pen}\t${item.sel}`
}

/** One row per canonical brand: strongest penetration wins; name shows the brand, not a trim line. */
function dedupeBrandPreferenceRows(domain) {
  if (domain.id !== BRAND_RELATIONSHIP_DOMAIN_ID) return domain

  const flat = []
  for (const cat of domain.categories) {
    for (const item of cat.items) {
      flat.push({ item, cat })
    }
  }

  const byKey = new Map()
  for (const row of flat) {
    const key = canonicalBrandKey(row.item.name)
    if (!key) continue
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, row)
      continue
    }
    if (row.item.pen > prev.item.pen) {
      byKey.set(key, row)
    } else if (row.item.pen === prev.item.pen) {
      const a = stripTrailingCriterionParentheticals(String(row.item.name || ''))
      const b = stripTrailingCriterionParentheticals(String(prev.item.name || ''))
      if (a.length < b.length) {
        byKey.set(key, row)
      }
    }
  }

  const winners = [...byKey.values()].map(({ item, cat }) => {
    const key = canonicalBrandKey(item.name)
    const stripped = stripTrailingCriterionParentheticals(String(item.name).trim())
    const display =
      normBrandKey(stripped) === key ? stripped : prettifyBrandKey(key)
    return {
      cat,
      item: { ...item, name: display },
      sig: brandRowSignature(cat.id, item),
    }
  })

  const sigToWinnerItem = new Map(winners.map((w) => [w.sig, w.item]))

  return {
    ...domain,
    categories: domain.categories.map((c) => ({
      ...c,
      items: c.items
        .map((item) => sigToWinnerItem.get(brandRowSignature(c.id, item)) ?? null)
        .filter(Boolean),
    })),
  }
}

export function prepareBrandRelationshipDomain(domain) {
  if (domain.id !== BRAND_RELATIONSHIP_DOMAIN_ID) return domain
  return dedupeBrandPreferenceRows(
    filterToBrandRelationshipEntities(
      excludeBrandSegmentTaxonomyCategories(domain),
    ),
  )
}
