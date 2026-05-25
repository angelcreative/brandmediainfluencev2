import { TitanBreadcrumb } from 'titan-compositions'

/**
 * Page-level breadcrumb strip.
 *
 * Thin wrapper around the Titan DS `TitanBreadcrumb` so the trail
 * inherits all DS specs: states (selected/disabled), `resolutionState`
 * (loading/unavailable/deleted/restricted), tooltips, icons, and the
 * overflow ellipsis menu when `maxVisible` is exceeded.
 *
 * The outer strip provides the page-wide background/border and centers
 * the breadcrumb under the layout's max content width.
 */
export default function AppBreadcrumb({
  items,
  currentLabel,
  ariaLabel = 'Breadcrumb',
  maxVisible = 4,
}) {
  return (
    <div className="app-layout__breadcrumb-strip">
      <TitanBreadcrumb
        items={items}
        currentLabel={currentLabel}
        ariaLabel={ariaLabel}
        maxVisible={maxVisible}
      />
    </div>
  )
}
