import { Button } from 'react-aria-components'
import { renderIconNode, TitanButton } from 'titan-compositions'
import './rich-toast.css'

export const EXIT_MS = 280

export default function RichToastStack({ toasts, onDismiss, onAction }) {
  return (
    <div className="rich-toast-stack" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => {
        const hasTitle = Boolean(toast.title?.trim())
        const hasAction = Boolean(toast.actionLabel?.trim())
        const showBadge = toast.showBadge !== false

        return (
          <article
            key={toast.id}
            className={[
              'rich-toast',
              `rich-toast--${toast.variant}`,
              toast.exiting ? 'rich-toast--exiting' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="status"
          >
            <div className="rich-toast__top">
              {showBadge ? (
                <span className="rich-toast__badge" aria-hidden="true">
                  {toast.badge}
                </span>
              ) : null}
              <div className="rich-toast__main">
                {hasTitle ? <strong className="rich-toast__title">{toast.title}</strong> : null}
                <p className="rich-toast__body">{toast.body}</p>
              </div>
              <Button
                className="icon-ghost rich-toast__close"
                aria-label="Dismiss notification"
                onPress={() => onDismiss(toast.id)}
              >
                {renderIconNode('x')}
              </Button>
            </div>
            {hasAction ? (
              <div className="rich-toast__footer">
                <TitanButton
                  variant="primary"
                  onPress={() => {
                    onAction?.(toast.id)
                    onDismiss(toast.id)
                  }}
                >
                  {toast.actionLabel}
                </TitanButton>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
