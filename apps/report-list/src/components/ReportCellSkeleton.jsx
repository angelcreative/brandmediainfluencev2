/**
 * Pill skeleton bar for report table cells (Titan steel + shimmer in CSS `::after`).
 * `long` = report name; `small` = source, owner; `medium` = other text columns.
 */
export function skeletonVariantForColumnKey(key) {
  if (key === 'name') return 'long'
  if (key === 'source' || key === 'owner' || key === 'access' || key === 'actions') return 'small'
  return 'medium'
}

export default function ReportCellSkeleton({ variant = 'medium' }) {
  const v = variant === 'long' || variant === 'small' || variant === 'medium' ? variant : 'medium'
  return <span className={`report-cell-skeleton report-cell-skeleton--${v}`} aria-hidden />
}
