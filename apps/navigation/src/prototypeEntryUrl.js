/** Sidebar workflow ids (must match AppLayout NAV_ITEMS). */
const SIDEBAR_WORKFLOW_IDS = new Set(['all', 'segment', 'profile', 'track'])

/**
 * Default entry: My Reports + All workflows. Preserves deep links (?nr, ?workflow=segment, ?q, dates).
 */
export function normalizePrototypeEntryUrl() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (url.searchParams.has('nr')) return

  const wf = url.searchParams.get('workflow')
  const isConcreteWorkflow =
    Boolean(wf) && wf !== 'all' && SIDEBAR_WORKFLOW_IDS.has(wf)

  if (isConcreteWorkflow) {
    if (url.searchParams.get('view') === 'apps') {
      url.searchParams.delete('view')
      const qs = url.searchParams.toString()
      window.history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`)
    }
    return
  }

  let dirty = false
  if (url.searchParams.get('view') === 'apps') {
    url.searchParams.delete('view')
    dirty = true
  }
  if (url.searchParams.has('workflow')) {
    url.searchParams.delete('workflow')
    dirty = true
  }
  if (dirty) {
    const qs = url.searchParams.toString()
    window.history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`)
  }
}
