import { IconChevronRight } from '@tabler/icons-react'
import { getWizardDefineStepLabel } from '../data/workflows.js'

/**
 * Horizontal progress: workflow (4 steps) vs by-source (3 steps).
 * Demo only implements early steps; later steps stay “upcoming” until the product adds screens.
 */
export default function NewReportWizardStepper({
  variant,
  wizardStep,
  selectedTypeId,
  selectedChannelId,
  hasChannelStep,
  onNavigate,
}) {
  const steps =
    variant === 'workflow'
      ? [
          { key: 'name', label: 'Name report' },
          { key: 'type', label: 'Select report type' },
          { key: 'source', label: 'Select data source' },
          { key: 'define', label: 'Define audience' },
          { key: 'launch', label: 'Launch report' },
        ]
      : [
          { key: 'name', label: 'Name report' },
          { key: 'type', label: 'Select report type' },
          { key: 'define', label: getWizardDefineStepLabel(selectedTypeId) },
          { key: 'launch', label: 'Launch report' },
        ]

  let activeIndex = 0
  if (wizardStep === 'name') activeIndex = 0
  else if (wizardStep === 'reportType') activeIndex = 1
  else if (wizardStep === 'channel') activeIndex = 2
  else if (wizardStep === 'define') activeIndex = variant === 'workflow' ? 3 : 2

  const canGoToIndex = (i) => {
    // Already-visited steps are always navigable.
    if (i <= activeIndex) return true

    // Future steps: only allow when prerequisite data exists.
    if (i === 1) return Boolean(selectedTypeId)

    if (variant === 'workflow') {
      if (i === 2) return Boolean(hasChannelStep && selectedTypeId)
      if (i === 3) return hasChannelStep ? Boolean(selectedChannelId) : Boolean(selectedTypeId)
      return false
    }

    if (i === 2) return Boolean(selectedTypeId)
    return false
  }

  const handleStepClick = (i) => {
    if (!canGoToIndex(i)) return
    onNavigate?.(i)
  }

  return (
    <nav className="nr-wizard-stepper" aria-label="Report setup progress">
      <ol className="nr-wizard-stepper__list" role="list">
        {steps.map((s, i) => {
          const isComplete = i < activeIndex
          const isActive = i === activeIndex
          const isUpcoming = i > activeIndex
          const reachable = canGoToIndex(i)
          return (
            <li key={s.key} className="nr-wizard-stepper__item">
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
                <span className="nr-wizard-stepper__num" aria-hidden>
                  {i + 1}
                </span>
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
