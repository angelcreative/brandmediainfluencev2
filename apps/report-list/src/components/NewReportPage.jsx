import { IconPencil } from '@tabler/icons-react'
import { ArrowLeft, Check } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Focusable } from 'react-aria-components'
import {
  TitanButton,
  TitanButtonGroup,
  TitanDrawer,
  TitanIconButton,
  TitanIndividualButton,
  TitanInputField,
  TitanTooltip,
} from 'titan-compositions'
import {
  getReportTypeDescription,
  getReportTypeGroupsForWorkflow,
  getReportTypeIdsForSource,
  getReportTypeIdsForWorkflow,
  getMultisourceNetworksTooltipText,
  getReportTypeLabel,
  getSourceIdsForReportTypeInWorkflow,
  getSourceIdsForReportTypeInWorkflowUseCase,
  getSourceIdsForReportTypeWithEntrySource,
  getSourceLabel,
  getWizardDefineStepLabel,
  getWorkflowLabel,
  isReportSourceComingSoon,
} from '../data/workflows.js'
import helpAvatarUrl from '../assets/help-avatar.png'
import conversationsArt from '../assets/report-type-art/conversations.svg?url'
import profileAttributesArt from '../assets/report-type-art/profile-attributes.svg?url'
import ReportTypeCardIcon from './ReportTypeCardIcon.jsx'
import SourceIcon from './SourceIcon.jsx'
import SourceTablerIcon from './SourceTablerIcon.jsx'
import NewReportWizardStepper from './NewReportWizardStepper.jsx'

const REPORT_TYPE_CARD_COLORS = {
  'by-audience-attributes': 'teal',
  'by-conversation': 'mango',
  'by-upload': 'ocean',
  'by-account-profile': 'tomato',
  'by-creator-discovery': 'violet',
  'by-popularity': 'magenta',
  'by-overlap': 'indigo',
  'by-custom-audience': 'blueberry',
  'by-engagement': 'pomegranate',
  'by-follower-growth': 'aquamarine',
  'by-fan-page': 'orange',
  'by-freeform-input': 'pink',
}

const GOAL_ILLUSTRATION_BY_USE_CASE = {
  'uncover-dynamic-communities': conversationsArt,
  'overlay-syndicated-mindsets': profileAttributesArt,
}

const GOAL_DESCRIPTION_BY_USE_CASE = {
  'uncover-dynamic-communities': 'Discover emerging audience clusters from conversations and behavior.',
  'overlay-syndicated-mindsets': 'Start from syndicated audiences and enrich them with your context.',
}

export default function NewReportPage({ context, onClose, onGoToAllReports: _onGoToAllReports }) {
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [reportName, setReportName] = useState('')
  const [knowMoreTypeId, setKnowMoreTypeId] = useState(null)
  const [step, setStep] = useState('reportType')
  const [selectedChannelId, setSelectedChannelId] = useState(null)
  const [selectedUseCaseId, setSelectedUseCaseId] = useState(null)

  const typeIds =
    context?.kind === 'source'
      ? getReportTypeIdsForSource(context.id)
      : context?.kind === 'workflow'
        ? getReportTypeIdsForWorkflow(context.id)
        : []

  const channelSourceIds = useMemo(() => {
    if (!context || !selectedTypeId) return []
    if (context.kind === 'workflow') {
      if (selectedUseCaseId) {
        return getSourceIdsForReportTypeInWorkflowUseCase(context.id, selectedUseCaseId, selectedTypeId)
      }
      return getSourceIdsForReportTypeInWorkflow(context.id, selectedTypeId)
    }
    return getSourceIdsForReportTypeWithEntrySource(selectedTypeId, context.id)
  }, [context, selectedTypeId, selectedUseCaseId])

  const groupedTypeSections = useMemo(() => {
    if (!context) return []
    if (context.kind === 'workflow') return getReportTypeGroupsForWorkflow(context.id)
    return []
  }, [context])

  const hasGoalStep = Boolean(context?.kind === 'workflow' && groupedTypeSections.length > 0)
  const selectedGoalSection =
    groupedTypeSections.find((section) => section.id === selectedUseCaseId) ?? groupedTypeSections[0] ?? null

  const multisourceNetworksTooltip = useMemo(() => getMultisourceNetworksTooltipText(), [])

  useEffect(() => {
    setSelectedTypeId(null)
    setReportName('')
    setStep(hasGoalStep ? 'goal' : 'reportType')
    setSelectedChannelId(null)
    setSelectedUseCaseId(hasGoalStep ? null : groupedTypeSections[0]?.id ?? null)
  }, [context?.kind, context?.id, hasGoalStep, groupedTypeSections])

  useEffect(() => {
    if (context?.kind === 'source' && step === 'channel') {
      setStep('reportType')
      setSelectedChannelId(null)
    }
  }, [context?.kind, step])

  useEffect(() => {
    if (knowMoreTypeId == null) return
    document.body.classList.add('new-report-know-more-drawer')
    return () => {
      document.body.classList.remove('new-report-know-more-drawer')
    }
  }, [knowMoreTypeId])

  /**
   * Short title only (no in-title “breadcrumb”): workflow name or sourced report + network logo.
   * Report type and source stay in the stepper / body, not in the H1.
   */
  const headlineEl = useMemo(() => {
    if (!context) return 'New report'
    const sourceHeadlineIconSize = 22

    if (context.kind === 'workflow') {
      const wf = getWorkflowLabel(context.id).toLowerCase()
      return <span className="new-report-page__headline-row">{`New ${wf} report`}</span>
    }

    const src = getSourceLabel(context.id)
    if (context.id === 'google') {
      return <span className="new-report-page__headline-row">{`New ${src} report`}</span>
    }

    const sourceIconEl = (
      <SourceIcon sourceId={context.id} size={sourceHeadlineIconSize} />
    )
    return (
      <span className="new-report-page__headline-row">
        {sourceIconEl}
        <span> New report</span>
      </span>
    )
  }, [context])

  const hasChannelStep = Boolean(
    context?.kind === 'workflow' && channelSourceIds.length > 0,
  )

  const wizardSteps = useMemo(() => {
    const defineLabel = selectedTypeId
      ? getWizardDefineStepLabel(selectedTypeId)
      : 'Define report'
    if (context?.kind === 'workflow') {
      if (hasGoalStep) {
        return [
          { id: 'goal', label: 'Report goal' },
          { id: 'reportType', label: 'Report type' },
          { id: 'channel', label: 'Source' },
          { id: 'define', label: defineLabel },
        ]
      }
      if (hasChannelStep) {
        return [
          { id: 'reportType', label: 'Report type' },
          { id: 'channel', label: 'Source' },
          { id: 'define', label: defineLabel },
        ]
      }
      return [
        { id: 'reportType', label: 'Report type' },
        { id: 'define', label: defineLabel },
      ]
    }
    return [
      { id: 'reportType', label: 'Report type' },
      { id: 'define', label: defineLabel },
    ]
  }, [context?.kind, hasChannelStep, hasGoalStep, selectedTypeId])

  const canNavigateTo = useCallback(
    (stepId) => {
      if (stepId === 'goal') return hasGoalStep
      if (stepId === 'reportType') {
        if (hasGoalStep && !selectedUseCaseId) return false
        return true
      }
      if (stepId === 'channel') {
        if (hasGoalStep && !selectedUseCaseId) return false
        return Boolean(selectedTypeId && hasChannelStep)
      }
      if (stepId === 'define') {
        if (hasGoalStep && !selectedUseCaseId) return false
        if (!selectedTypeId) return false
        if (hasChannelStep && !selectedChannelId) return false
        return true
      }
      return false
    },
    [selectedTypeId, selectedChannelId, hasChannelStep, hasGoalStep, selectedUseCaseId],
  )

  const handleStepperNavigate = (stepId) => {
    if (!canNavigateTo(stepId)) return
    setStep(stepId)
  }

  const handleBack = () => {
    if (step === 'define') {
      if (context?.kind === 'workflow' && hasChannelStep) {
        setStep('channel')
      } else {
        setStep('reportType')
      }
      return
    }
    if (step === 'channel') {
      setStep('reportType')
      setSelectedChannelId(null)
      return
    }
    if (step === 'reportType' && hasGoalStep) {
      setStep('goal')
      setSelectedTypeId(null)
      setSelectedChannelId(null)
      return
    }
    onClose()
  }

  // Clicking a report-type card is the action itself — no separate "Next" button.
  const handleTypeCardSelect = (typeId, options = {}) => {
    if (!context) return
    const useCaseId = options.useCaseId ?? null
    setSelectedTypeId(typeId)
    setSelectedUseCaseId(useCaseId)

    // Resolve downstream sources for this specific typeId (don't rely on memoized state).
    const nextChannelIds =
      context.kind === 'workflow'
        ? useCaseId
          ? getSourceIdsForReportTypeInWorkflowUseCase(context.id, useCaseId, typeId)
          : getSourceIdsForReportTypeInWorkflow(context.id, typeId)
        : getSourceIdsForReportTypeWithEntrySource(typeId, context.id)

    if (context.kind === 'source') {
      setStep('define')
      return
    }
    if (nextChannelIds.length === 0) {
      setStep('define')
      return
    }
    setStep('channel')
    setSelectedChannelId(null)
  }

  const handleGoalCardSelect = (goalId) => {
    setSelectedUseCaseId(goalId)
    setSelectedTypeId(null)
    setSelectedChannelId(null)
    setStep('reportType')
  }

  // Clicking a channel in workflow advances to Define step.
  const handleChannelCardSelect = (channelId) => {
    if (!context || !selectedTypeId) return
    setSelectedChannelId(channelId)
    setStep('define')
  }

  if (!context) return null

  const renderReportTypeCard = ({
    typeId,
    selected,
    onSelect,
    cardIdPrefix = '',
    isStatic = false,
    isReadOnly = false,
    showKnowMore = true,
    showViableSources = true,
    sourceIdsOverride = null,
    useCaseId = null,
  }) => {
    const typeLabel = getReportTypeLabel(typeId)
    const typeColor = REPORT_TYPE_CARD_COLORS[typeId] ?? 'steel'
    const viableSourceIds = Array.isArray(sourceIdsOverride)
      ? sourceIdsOverride
      : context.kind === 'workflow'
        ? getSourceIdsForReportTypeInWorkflow(context.id, typeId)
        : getSourceIdsForReportTypeWithEntrySource(typeId, context.id)

    return (
      <div key={`${cardIdPrefix}${typeId}`} className="new-report-page__card-wrap">
        <div
          className={`new-report-page__card new-report-page__card--color-${typeColor} ${
            selected ? 'is-selected' : ''
          } ${isStatic ? 'is-static' : ''} ${isReadOnly ? 'is-readonly' : ''} ${
            showViableSources ? '' : 'is-compact'
          }`}
        >
          <button
            type="button"
            className="new-report-page__card-select"
            onClick={onSelect}
            aria-pressed={selected}
            aria-describedby={useCaseId ? `report-type-group-${useCaseId}` : undefined}
            disabled={isStatic || isReadOnly}
          >
            <div className="new-report-page__card-header">
              <div className="new-report-page__card-title-block">
                <span className="new-report-page__card-title-icon" aria-hidden>
                  <ReportTypeCardIcon typeId={typeId} />
                </span>
                <span className="new-report-page__card-title-text new-report-page__card-title-text--neutral">
                  {typeLabel}
                </span>
              </div>
              <span
                className={`new-report-page__card-check ${selected ? 'is-selected' : ''}`}
                aria-hidden
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </div>
            <span className="new-report-page__card-desc">{getReportTypeDescription(typeId)}</span>
            {showViableSources ? (
              <div className="new-report-page__card-sources" aria-label="Viable sources">
                <span className="new-report-page__card-sources-label">Available sources</span>
                <span className="new-report-page__card-sources-list">
                  {viableSourceIds.filter((id) => id !== 'google').map((sourceId) => (
                    <span
                      key={`${typeId}-${sourceId}`}
                      className="new-report-page__card-source-icon new-report-page__card-source-icon--tabler"
                      title={getSourceLabel(sourceId)}
                      aria-label={getSourceLabel(sourceId)}
                    >
                      <SourceTablerIcon sourceId={sourceId} size={16} />
                    </span>
                  ))}
                </span>
              </div>
            ) : null}
          </button>
          {showKnowMore && !isStatic && !isReadOnly ? (
            <div className="new-report-page__card-footer">
              <TitanButton
                variant="tertiary"
                className="new-report-page__card-know-more-btn"
                onPress={() => setKnowMoreTypeId(typeId)}
                aria-label={`Know more about ${typeLabel}`}
              >
                Know more
              </TitanButton>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="new-report-page" style={{ fontFamily: 'var(--font-audiense), sans-serif' }}>
      <div className="new-report-page__shell">
        <div className="new-report-page__shell-back">
          <TitanIconButton variant="secondary" aria-label="Back" onPress={handleBack}>
            <ArrowLeft size={18} aria-hidden />
          </TitanIconButton>
        </div>
        <h1 className="new-report-page__shell-headline new-report-page__headline">{headlineEl}</h1>
        <div className="new-report-page__shell-stepper">
          <NewReportWizardStepper
            steps={wizardSteps}
            currentStep={step}
            onNavigate={handleStepperNavigate}
            canNavigateTo={canNavigateTo}
          />
        </div>
        <div className="new-report-page__shell-name new-report-page__headline-name-field nr-name-row__input">
          <TitanInputField
            aria-label="Name your report"
            placeholder="Name your report"
            leadingIcon={<IconPencil size={18} stroke={1.5} aria-hidden />}
            maxLength={70}
            value={reportName}
            onChange={setReportName}
          />
        </div>
        <div className="new-report-page__shell-flow">

          {step === 'goal' && hasGoalStep && context.kind === 'workflow' && (
            <section className="new-report-page__goal-step" aria-label="Select report goal">
              <p className="new-report-page__goal-step-intro">Which goal do you want to achieve?</p>
              <div className="new-report-page__goal-grid" role="group" aria-label="Report goals">
                {groupedTypeSections.map((section) => {
                  const selected = selectedUseCaseId === section.id
                  const goalArt = GOAL_ILLUSTRATION_BY_USE_CASE[section.id] ?? profileAttributesArt
                  const goalDescription =
                    GOAL_DESCRIPTION_BY_USE_CASE[section.id] ?? 'Choose this goal to narrow report types.'
                  return (
                    <div key={`goal-${section.id}`} className="new-report-page__card-wrap">
                      <button
                        type="button"
                        className={`new-report-page__card new-report-page__goal-card ${selected ? 'is-selected' : ''}`}
                        aria-pressed={selected}
                        onClick={() => handleGoalCardSelect(section.id)}
                      >
                        <div className="new-report-page__card-header">
                          <span className="new-report-page__card-title-text new-report-page__card-title-text--neutral">
                            {section.label}
                          </span>
                          <span className={`new-report-page__card-check ${selected ? 'is-selected' : ''}`} aria-hidden>
                            <Check size={12} strokeWidth={3} />
                          </span>
                        </div>
                        <div className="new-report-page__card-art">
                          <img
                            className="new-report-page__card-art-img"
                            src={goalArt}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <span className="new-report-page__card-desc">{goalDescription}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {step === 'reportType' &&
          (typeIds.length === 0 ? (
            <p className="new-report-page__empty" role="status">
              No report types are available for this choice in the demo data.
            </p>
          ) : (
            context.kind === 'source' ? (
              <div className="new-report-page__grid" role="group" aria-label="Report types">
                {typeIds.map((typeId) =>
                  renderReportTypeCard({
                    typeId,
                    selected: selectedTypeId === typeId,
                    onSelect: () => handleTypeCardSelect(typeId),
                    cardIdPrefix: `source-${typeId}-`,
                    showViableSources: false,
                  }),
                )}
              </div>
            ) : selectedGoalSection ? (
              <div className="new-report-page__type-sections" role="group" aria-label="Report types">
                <section key={selectedGoalSection.id} className="new-report-page__type-section">
                  <div className="new-report-page__type-section-title-wrap">
                    <span
                      id={`report-type-group-${selectedGoalSection.id}`}
                      className="new-report-page__type-section-title"
                    >
                      {selectedGoalSection.label}
                    </span>
                  </div>
                  <div
                    className="new-report-page__grid"
                    role="group"
                    aria-label={`${selectedGoalSection.label} report types`}
                  >
                    {selectedGoalSection.typeIds.map((typeId) =>
                      renderReportTypeCard({
                        typeId,
                        selected: selectedTypeId === typeId && selectedUseCaseId === selectedGoalSection.id,
                        onSelect: () => handleTypeCardSelect(typeId, { useCaseId: selectedGoalSection.id }),
                        cardIdPrefix: `${selectedGoalSection.id}-`,
                        sourceIdsOverride: getSourceIdsForReportTypeInWorkflowUseCase(
                          context.id,
                          selectedGoalSection.id,
                          typeId,
                        ),
                        useCaseId: selectedGoalSection.id,
                      }),
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <p className="new-report-page__empty" role="status">
                Choose a report goal first to continue.
              </p>
            )
          ))}

        {step === 'channel' &&
          context.kind === 'workflow' &&
          selectedTypeId &&
          (channelSourceIds.length === 0 ? (
            <p className="new-report-page__empty" role="status">
              No sources are available for this report type in the demo data.
            </p>
          ) : (
            <section className="new-report-page__channel-step" aria-label="Select source">
              <TitanButtonGroup
                selectedKeys={selectedChannelId ? [selectedChannelId] : []}
                onSelectionChange={(keys) => {
                  const first = Array.from(keys)[0]
                  if (!first) return
                  if (isReportSourceComingSoon(selectedTypeId, first)) return
                  handleChannelCardSelect(String(first))
                }}
                className="new-report-page__source-titan-group"
                aria-label="Sources"
              >
                {channelSourceIds.map((sourceId) => {
                  const label = getSourceLabel(sourceId)
                  const comingSoon = isReportSourceComingSoon(selectedTypeId, sourceId)
                  const ariaLabel = comingSoon ? `${label}, coming soon` : label
                  if (sourceId === 'google') {
                    return (
                      <TitanTooltip
                        key={sourceId}
                        content={multisourceNetworksTooltip}
                        placement="top"
                        delay={500}
                        closeDelay={80}
                      >
                        <Focusable>
                          <TitanIndividualButton
                            id={sourceId}
                            isDisabled={comingSoon}
                            aria-label={ariaLabel}
                          >
                            {label}
                          </TitanIndividualButton>
                        </Focusable>
                      </TitanTooltip>
                    )
                  }
                  return (
                    <TitanIndividualButton
                      key={sourceId}
                      id={sourceId}
                      isDisabled={comingSoon}
                      aria-label={ariaLabel}
                    >
                      {label}
                    </TitanIndividualButton>
                  )
                })}
              </TitanButtonGroup>
              <div className="new-report-page__channel-selected-type">
                <div className="new-report-page__grid">
                  {renderReportTypeCard({
                    typeId: selectedTypeId,
                    selected: true,
                    onSelect: () => {},
                    cardIdPrefix: 'selected-',
                    isReadOnly: true,
                    showKnowMore: false,
                    showViableSources: false,
                  })}
                </div>
              </div>
            </section>
          ))}

        {step === 'define' && (
          <section className="new-report-page__define-step" aria-label="Define audience">
            <p className="new-report-page__define-placeholder">Here will continue the user flow...</p>
            <div className="new-report-page__define-launch">
              {!reportName.trim() ? (
                <p className="new-report-page__define-launch-hint">
                  Add a report name in the header before you launch.
                </p>
              ) : null}
              <TitanButton
                variant="primary"
                isDisabled={!reportName.trim()}
                onPress={() => {
                  if (!reportName.trim()) return
                  onClose()
                }}
              >
                Launch report
              </TitanButton>
            </div>
          </section>
        )}

          <div className="new-report-page__help-row">
            <img
              src={helpAvatarUrl}
              alt=""
              className="new-report-page__help-avatar"
              width={48}
              height={48}
              decoding="async"
            />
            <p className="new-report-page__help">
              Not sure where to start?{' '}
              <a href="#" className="new-report-page__help-link" onClick={(e) => e.preventDefault()}>
                Visit the guide
              </a>
            </p>
          </div>
        </div>
      </div>

      <TitanDrawer
        title={knowMoreTypeId ? `About ${getReportTypeLabel(knowMoreTypeId)}` : ''}
        isOpen={knowMoreTypeId != null}
        onOpenChange={(open) => {
          if (!open) setKnowMoreTypeId(null)
        }}
      >
        {knowMoreTypeId && (
          <div className="new-report-page__know-more">
            <p className="new-report-page__know-more-placeholder">
              Placeholder here the detailed information for {getReportTypeLabel(knowMoreTypeId)}.
            </p>
            <TitanButton variant="secondary" onPress={() => setKnowMoreTypeId(null)}>
              Close
            </TitanButton>
          </div>
        )}
      </TitanDrawer>
    </div>
  )
}
