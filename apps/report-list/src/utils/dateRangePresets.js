import { endOfMonth, getLocalTimeZone, startOfMonth, startOfYear, today } from '@internationalized/date'

/** @typedef {{ id: string, label: string }} DatePresetOption */

/** @type {DatePresetOption[]} */
export const DATE_PRESET_OPTIONS = [
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'last90', label: 'Last 90 days' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'thisYear', label: 'This year' },
]

export function getPresetRange(presetId) {
  const tz = getLocalTimeZone()
  const now = today(tz)
  switch (presetId) {
    case 'last7':
      return { start: now.subtract({ days: 6 }), end: now }
    case 'last30':
      return { start: now.subtract({ days: 29 }), end: now }
    case 'thisMonth':
      return { start: startOfMonth(now), end: now }
    case 'lastMonth': {
      const firstThisMonth = startOfMonth(now)
      const lastDayPrev = firstThisMonth.subtract({ days: 1 })
      return { start: startOfMonth(lastDayPrev), end: endOfMonth(lastDayPrev) }
    }
    case 'last90':
      return { start: now.subtract({ days: 89 }), end: now }
    case 'thisYear':
      return { start: startOfYear(now), end: now }
    default:
      return null
  }
}

/**
 * Maps stored from/to strings to a preset id when they match the **current**
 * computed range for that preset; otherwise `custom`. Use `any` when dates are missing.
 */
export function getPresetIdForDateRange(fromStr, toStr) {
  if (!fromStr || !toStr) return 'any'
  for (const { id } of DATE_PRESET_OPTIONS) {
    const r = getPresetRange(id)
    if (r && r.start.toString() === fromStr && r.end.toString() === toStr) {
      return id
    }
  }
  return 'custom'
}
