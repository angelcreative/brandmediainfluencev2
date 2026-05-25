import { IconChevronRight } from '@tabler/icons-react'

/**
 * Plain HTML breadcrumb using Titan breadcrumb classes (same look as TitanBreadcrumb).
 * Avoids React Aria Collection edge cases where intermediate crumbs could fail to paint.
 */
export default function AppBreadcrumb({ items, currentLabel, ariaLabel = 'Breadcrumb' }) {
  return (
    <div className="app-layout__breadcrumb-strip">
      <ol className="breadcrumb-nav app-layout__breadcrumb" aria-label={ariaLabel}>
        {items.map((item) => (
          <li key={item.id} className="breadcrumb-item">
            <button type="button" className="breadcrumb-link" onClick={item.onPress}>
              {item.label}
            </button>
            <span className="breadcrumb-separator" aria-hidden>
              <IconChevronRight size={16} stroke={1.5} />
            </span>
          </li>
        ))}
        <li className="breadcrumb-item">
          <span className="breadcrumb-current" aria-current="page">
            {currentLabel}
          </span>
        </li>
      </ol>
    </div>
  )
}
