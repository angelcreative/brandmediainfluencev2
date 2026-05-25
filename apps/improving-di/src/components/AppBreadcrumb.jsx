import { TitanBreadcrumb } from 'titan-compositions'

/* Page-level breadcrumb strip — same contract as the topics app.
   Renders a full-bleed band right under the navbar (background +
   bottom border edge-to-edge) and centers the breadcrumb itself
   inside the page max content width. The unified `improving-di`
   shell uses it to thread the report drilldown context
   (Home > Project > Audience context > Audience > Section). */
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
