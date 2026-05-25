import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Misma API que TitanCollapsible, pero el panel permanece en el DOM para poder
 * animar apertura/cierre con CSS grid (0fr → 1fr).
 */
export function AnimatedFilterCollapsible({
  children,
  title,
  isCollapsed: controlledCollapsed,
  onChange,
  'aria-label': ariaLabel,
}) {
  const collapsed = controlledCollapsed ?? false

  function handleToggle() {
    onChange?.(!collapsed)
  }

  return (
    <div className={`titan-collapsible titan-collapsible--animated ${!collapsed ? 'is-expanded' : ''}`}>
      <button
        type="button"
        className="titan-collapsible-header"
        aria-label={ariaLabel}
        aria-expanded={!collapsed}
        onClick={handleToggle}
      >
        {title != null && <span className="titan-collapsible-title">{title}</span>}
        <span className="titan-collapsible-chevron" aria-hidden="true">
          {collapsed ? <ChevronDown size={18} strokeWidth={2} /> : <ChevronUp size={18} strokeWidth={2} />}
        </span>
      </button>
      <div className="titan-collapsible-motion" aria-hidden={collapsed}>
        <div className="titan-collapsible-motion-inner">
          <div className="titan-collapsible-content" {...(collapsed ? { inert: true } : {})}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
