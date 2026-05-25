/** Static rows matching the “My reports” reference screen (overlap / influencer / demand). */
export const MY_REPORTS_ENTITIES_AVAILABLE = 33

/** Digital Intelligence copy uses “reports”, not “entities”. */
export const MY_REPORTS_REPORTS_AVAILABLE = 33

export const MY_REPORTS_SNAPSHOT_ROWS = [
  {
    id: 'snap-1',
    source: 'tiktok',
    name: 'Messi',
    category: 'overlap',
    createdAt: '2026-03-26',
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'snap-2',
    source: 'instagram',
    name: '@cristiano',
    category: 'influencer',
    createdAt: '2026-03-24',
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'snap-3',
    source: 'instagram',
    name: 'Clásico',
    category: 'overlap',
    createdAt: '2026-03-03',
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'snap-4',
    source: 'tiktok',
    name: '@daniela.jode',
    category: 'influencer',
    createdAt: '2026-02-19',
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'snap-5',
    source: 'instagram',
    name: '@leomessi',
    category: 'influencer',
    createdAt: '2025-11-18',
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
]

const CATEGORY_LABEL = {
  overlap: 'Overlap',
  influencer: 'Influencer',
  demand: 'Demand',
}

/** Titan pill tones (semantic palette — see titan-compositions pill-tone-*). */
const CATEGORY_TONE = {
  overlap: 'mango',
  influencer: 'magenta',
  demand: 'aquamarine',
}

export function getSnapshotCategoryLabel(category) {
  return CATEGORY_LABEL[category] ?? category
}

export function getSnapshotCategoryTone(category) {
  return CATEGORY_TONE[category] ?? 'steel'
}

/** Digital Intelligence list: audience / baseline use compact suffixes (K, M). */
export function formatReportMetricSize(value) {
  if (value == null) return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const s = m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')
    return `${s}M`
  }
  if (n >= 1_000) {
    const k = n / 1_000
    const s = k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')
    return `${s}K`
  }
  return String(n)
}

/**
 * My reports table for Digital Intelligence (Report name, Created w/ time, sizes, status, etc.).
 */
export const MY_REPORTS_DIGITAL_SNAPSHOT_ROWS = [
  {
    id: 'di-1',
    name: 'PHD in Madrid',
    createdAt: '2025-11-18T12:24:00',
    audienceSize: 51_000,
    baselineSize: 25_000_000,
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'di-2',
    name: 'Tech CEOs Thailand',
    createdAt: '2025-10-20T09:00:00',
    audienceSize: 510_000,
    baselineSize: 3_200_000,
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'di-3',
    name: 'Hello',
    createdAt: '2025-09-15T14:30:00',
    audienceSize: 390,
    baselineSize: 1_500_000,
    status: 'failed',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'di-4',
    name: '[DEMO] Tesla Followers in US',
    createdAt: '2025-08-01T10:00:00',
    audienceSize: 3_300_000,
    baselineSize: 260_000_000,
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
  {
    id: 'di-5',
    name: 'EU Sustainability Trends',
    createdAt: '2025-07-12T16:45:00',
    audienceSize: 120_000,
    baselineSize: null,
    status: 'finished',
    owner: { initials: 'A', name: 'Owner A' },
  },
]
