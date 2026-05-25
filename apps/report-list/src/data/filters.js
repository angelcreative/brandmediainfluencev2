import { REPORT_TYPES } from './workflows.js'

/** Report types (checkbox list) — labels from REPORT_TYPES, sorted A–Z. */
export const FILTER_REPORT_TYPES = Object.entries(REPORT_TYPES)
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

/** Display order for Source filter (design order). Multisource = `google` only; no `multi-network` in panel. */
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
]

export const FILTER_STATUSES = [
  { id: 'finished', label: 'Finished' },
  { id: 'processing', label: 'Processing' },
  { id: 'demo', label: 'Demo' },
  { id: 'failed', label: 'Not generated' },
]

/** Filters panel status column: radio options (Finished / Not generated) plus implicit “any” when unset. */
export const FILTER_PANEL_STATUS_RADIOS = [
  { value: 'finished', label: 'Finished' },
  { value: 'failed', label: 'Not generated' },
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
