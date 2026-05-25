import { TitanBreadcrumb } from 'titan-compositions'

/* Page-level breadcrumb strip — mirrors the report-list pattern.
   Renders a full-bleed bar below the navbar (so the background +
   bottom border stretch edge-to-edge) and centers the actual
   breadcrumb under the layout's max content width. */
export default function AppBreadcrumb({
  items,
  currentLabel,
  ariaLabel = 'Breadcrumb',
  maxVisible = 5,
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
