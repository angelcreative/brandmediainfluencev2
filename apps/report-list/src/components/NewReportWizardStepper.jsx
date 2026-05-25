import { IconChevronRight } from '@tabler/icons-react'

/**
 * Horizontal progress for report setup. Steps are provided by the parent (no name step —
 * report name lives in the top bar).
 */
export default function NewReportWizardStepper({ steps, currentStep, onNavigate, canNavigateTo }) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStep),
  )

  const canGoToIndex = (i) => {
    if (i <= activeIndex) return true
    for (let j = activeIndex + 1; j <= i; j++) {
      const id = steps[j]?.id
      if (!id || !canNavigateTo?.(id)) return false
    }
    return true
  }

  const handleStepClick = (i) => {
    if (!canGoToIndex(i)) return
    const id = steps[i]?.id
    if (id) onNavigate?.(id)
  }

  if (!steps?.length) return null

  return (
    <nav className="nr-wizard-stepper" aria-label="Report setup progress">
      <ol className="nr-wizard-stepper__list" role="list">
        {steps.map((s, i) => {
          const isComplete = i < activeIndex
          const isActive = i === activeIndex
          const isUpcoming = i > activeIndex
          const reachable = canGoToIndex(i)
          return (
            <li key={s.id} className="nr-wizard-stepper__item">
              <button
                type="button"
                className={[
                  'nr-wizard-stepper__step',
                  isComplete ? 'nr-wizard-stepper__step--complete' : '',
                  isActive ? 'nr-wizard-stepper__step--active' : '',
                  isUpcoming ? 'nr-wizard-stepper__step--upcoming' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${s.label}${isActive ? ', current step' : ''}`}
                disabled={!reachable}
                onClick={() => handleStepClick(i)}
              >
                <span className="nr-wizard-stepper__label">{s.label}</span>
              </button>
              {i < steps.length - 1 ? (
                <span className="nr-wizard-stepper__chev" aria-hidden>
                  <IconChevronRight size={14} stroke={1.5} />
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
