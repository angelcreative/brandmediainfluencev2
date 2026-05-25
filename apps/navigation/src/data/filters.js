import { REPORT_TYPES } from './workflows.js'

/** Report types (checkbox list) — labels from REPORT_TYPES, sorted A–Z. */
export const FILTER_REPORT_TYPES = Object.entries(REPORT_TYPES)
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

/** Display order for Data source column (design order). */
export const FILTER_SOURCE_ORDER = [
  'x',
  'instagram',
  'threads',
  'youtube',
  'meta',
  'facebook',
  'tiktok',
  'linkedin',
  'google',
  'multi-network',
]

export const FILTER_STATUSES = [
  { id: 'finished', label: 'Finished' },
  { id: 'processing', label: 'Processing' },
  { id: 'demo', label: 'Demo' },
  { id: 'failed', label: 'Failed' },
]

export const FILTER_ACCESS = [
  { id: 'public', label: 'Public' },
  { id: 'private', label: 'Private' },
]

export function sortSourcesForFilter(sourceIds) {
  const order = new Map(FILTER_SOURCE_ORDER.map((id, i) => [id, i]))
  return [...sourceIds].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
}

/** Summary text for multi-select filter triggers (empty = no filter). */
export function summarizeMultiFilter(selectedIds, getLabel, emptyLabel = 'All') {
  if (!selectedIds.length) return emptyLabel
  if (selectedIds.length === 1) return getLabel(selectedIds[0])
  return `${selectedIds.length} selected`
}
