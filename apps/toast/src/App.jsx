import { useCallback, useId, useRef, useState } from 'react'
import { AlertTriangle, Check, Info, X as XIcon } from 'lucide-react'
import { TitanButton } from 'titan-compositions'
import RichToastStack, { EXIT_MS } from './components/RichToastStack.jsx'

const BADGES = {
  success: <Check size={15} strokeWidth={2.5} aria-hidden />,
  warning: <AlertTriangle size={15} strokeWidth={2.5} aria-hidden />,
  error: <XIcon size={15} strokeWidth={2.5} aria-hidden />,
  info: <Info size={15} strokeWidth={2.5} aria-hidden />,
}

/** success, warning, error, info — order used in the demo rows */
const VARIANT_KEYS = ['success', 'warning', 'error', 'info']

const NO_TITLE_BODY = {
  success: 'Your segment was saved and is ready to use.',
  warning: 'You’re offline. We’ll sync this list when you reconnect.',
  error: 'We couldn’t apply this filter. Try again in a moment.',
  info: 'Three new reports are ready to open.',
}

const WITH_TITLE = {
  success: {
    title: 'Saved',
    body: 'Your segment changes were applied successfully.',
  },
  warning: {
    title: 'Connection paused',
    body: 'Reconnect to resume live updates for this view.',
  },
  error: {
    title: 'Something went wrong',
    body: 'The request failed. Please try again.',
  },
  info: {
    title: 'New activity',
    body: 'You have unread updates in your workspace.',
  },
}

let toastKey = 0

function nextId() {
  toastKey += 1
  return `toast-${toastKey}`
}

function labelForVariant(key) {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export default function App() {
  const regionId = useId()
  const [toasts, setToasts] = useState([])
  const exitScheduledRef = useRef(new Set())

  const dismiss = useCallback((id) => {
    if (exitScheduledRef.current.has(id)) return
    exitScheduledRef.current.add(id)
    setToasts((t) => {
      const row = t.find((x) => x.id === id)
      if (!row) {
        exitScheduledRef.current.delete(id)
        return t
      }
      if (row.exiting) {
        exitScheduledRef.current.delete(id)
        return t
      }
      return t.map((x) => (x.id === id ? { ...x, exiting: true } : x))
    })
    window.setTimeout(() => {
      exitScheduledRef.current.delete(id)
      setToasts((t) => t.filter((x) => x.id !== id))
    }, EXIT_MS)
  }, [])

  const push = useCallback((config) => {
    const id = nextId()
    setToasts((prev) => [
      ...prev,
      {
        id,
        variant: config.variant,
        title: config.title,
        body: config.body,
        actionLabel: config.actionLabel,
        badge: config.badge,
        showBadge: config.showBadge,
      },
    ])
  }, [])

  const clearAll = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((t, i) => {
        window.setTimeout(() => dismiss(t.id), i * 44)
      })
      return prev
    })
  }, [dismiss])

  return (
    <main className="toast-app">
      <header className="toast-app__header">
        <h1 id={`${regionId}-title`}>Toast</h1>
        <p id={`${regionId}-desc`}>
          Titan tooltip surface and shadow, 600 status badges, icon-only dismiss, and enter/exit motion. Toasts have
          no primary action — only body, or title plus body.
        </p>
      </header>

      <section
        className="toast-app__panel"
        aria-labelledby={`${regionId}-title`}
        aria-describedby={`${regionId}-desc`}
      >
        <h2>Without title</h2>
        <div className="toast-app__actions" role="group" aria-label="Toast variants, body only">
          {VARIANT_KEYS.map((key) => (
            <TitanButton
              key={`no-title-${key}`}
              variant="secondary"
              onPress={() =>
                push({
                  variant: key,
                  title: '',
                  body: NO_TITLE_BODY[key],
                  badge: BADGES[key],
                })
              }
            >
              {labelForVariant(key)}
            </TitanButton>
          ))}
        </div>

        <h2 className="toast-app__sub">With title</h2>
        <div className="toast-app__actions" role="group" aria-label="Toast variants, title and body">
          {VARIANT_KEYS.map((key) => {
            const { title, body } = WITH_TITLE[key]
            return (
              <TitanButton
                key={`with-title-${key}`}
                variant="secondary"
                onPress={() =>
                  push({
                    variant: key,
                    title,
                    body,
                    badge: BADGES[key],
                  })
                }
              >
                {labelForVariant(key)}
              </TitanButton>
            )
          })}
        </div>

        <div className="toast-app__actions">
          <TitanButton variant="tertiary" onPress={clearAll} isDisabled={toasts.length === 0}>
            Clear all
          </TitanButton>
        </div>
      </section>

      <div className="toast-app__anchor">
        <RichToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    </main>
  )
}
