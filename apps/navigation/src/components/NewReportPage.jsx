import { IconChevronDown, IconPencil } from '@tabler/icons-react'
import { ArrowLeft, Check } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  TitanButton,
  TitanButtonGroup,
  TitanDrawer,
  TitanIconButton,
  TitanIndividualButton,
  TitanInputField,
} from 'titan-compositions'
import {
  getReportTypeDescription,
  getReportTypeGroupsForWorkflow,
  getReportTypeIdsForSource,
  getReportTypeIdsForWorkflow,
  getReportTypeLabel,
  getSourceIdsForReportTypeInWorkflow,
  getSourceIdsForReportTypeInWorkflowUseCase,
  getSourceIdsForReportTypeWithEntrySource,
  getSourceLabel,
  getWorkflowLabel,
  isReportSourceComingSoon,
} from '../data/workflows.js'
import helpAvatarUrl from '../assets/help-avatar.png'
import SourceIcon from './SourceIcon.jsx'
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

export default function NewReportPage({ context, onClose, onGoToAllReports: _onGoToAllReports }) {
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [reportName, setReportName] = useState('')
  const [knowMoreTypeId, setKnowMoreTypeId] = useState(null)
  const [step, setStep] = useState('name')
  const [selectedChannelId, setSelectedChannelId] = useState(null)
  const [selectedUseCaseId, setSelectedUseCaseId] = useState(null)
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const nameStepRef = useRef(null)

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

  useEffect(() => {
    const next = {}
    for (const section of groupedTypeSections) next[section.id] = false
    setCollapsedGroups(next)
  }, [groupedTypeSections])

  useEffect(() => {
    setSelectedTypeId(null)
    setReportName('')
    setStep('name')
    setSelectedChannelId(null)
    setSelectedUseCaseId(null)
  }, [context?.kind, context?.id])

  useEffect(() => {
    if (context?.kind === 'source' && step === 'channel') {
      setStep('reportType')
      setSelectedChannelId(null)
    }
  }, [context?.kind, step])

  // Autofocus the name input whenever the user lands on the name step.
  useEffect(() => {
    if (step !== 'name') return
    const root = nameStepRef.current
    if (!root) return
    const input = root.querySelector('input')
    if (input) {
      // Defer so the layout is ready and caret position ends up at the end.
      const id = window.requestAnimationFrame(() => input.focus())
      return () => window.cancelAnimationFrame(id)
    }
  }, [step])

  useEffect(() => {
    if (knowMoreTypeId == null) return
    document.body.classList.add('new-report-know-more-drawer')
    return () => {
      document.body.classList.remove('new-report-know-more-drawer')
    }
  }, [knowMoreTypeId])

  /**
   * Short title only (no in-title “breadcrumb”): workflow name or sourced report + network logo.
   * Report type and data source stay in the stepper / body, not in the H1.
   */
  const headlineEl = useMemo(() => {
    if (!context) return 'New report'
    const sourceHeadlineIconSize = 22
    const trimmedReportName = reportName.trim()
    const nameSuffix = trimmedReportName ? `: ${trimmedReportName}` : ''

    if (context.kind === 'workflow') {
      const wf = getWorkflowLabel(context.id).toLowerCase()
      return <span className="new-report-page__headline-row">{`New ${wf} report${nameSuffix}`}</span>
    }

    const src = getSourceLabel(context.id)
    if (context.id === 'google') {
      return <span className="new-report-page__headline-row">{`New ${src} report${nameSuffix}`}</span>
    }

    const sourceIconEl = (
      <SourceIcon sourceId={context.id} size={sourceHeadlineIconSize} />
    )
    return (
      <span className="new-report-page__headline-row">
        {sourceIconEl}
        <span>{` New report${nameSuffix}`}</span>
      </span>
    )
  }, [context, reportName])

  const hasChannelStep = Boolean(
    context?.kind === 'workflow' && channelSourceIds.length > 0,
  )

  const namePlaceholder = useMemo(() => {
    if (!context) return 'Name your report'
    if (context.kind === 'workflow') {
      return `e.g. ${getWorkflowLabel(context.id)} report`
    }
    return `e.g. ${getSourceLabel(context.id)} audience`
  }, [context])

  const handleStepperNavigate = (index) => {
    if (!context) return
    if (index === 0) {
      setStep('name')
      return
    }
    if (index === 1) {
      setStep('reportType')
      return
    }
    if (context.kind === 'workflow') {
      if (index === 2) {
        if (!hasChannelStep || !selectedTypeId) return
        setStep('channel')
        return
      }
      if (index === 3) {
        if (hasChannelStep && !selectedChannelId) return
        if (!hasChannelStep && !selectedTypeId) return
        setStep('define')
      }
      return
    }

    if (context.kind === 'source' && index === 2) {
      if (!selectedTypeId) return
      setStep('define')
    }
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
    if (step === 'reportType') {
      setStep('name')
      return
    }
    onClose()
  }

  const handleNameNext = () => {
    if (!reportName.trim()) return
    setStep('reportType')
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
        <button
          type="button"
          className={`new-report-page__card new-report-page__card--color-${typeColor} ${
            selected ? 'is-selected' : ''
          } ${isStatic ? 'is-static' : ''} ${isReadOnly ? 'is-readonly' : ''} ${
            showViableSources ? '' : 'is-compact'
          }`}
          onClick={onSelect}
          aria-pressed={selected}
          aria-describedby={useCaseId ? `report-type-group-${useCaseId}` : undefined}
          disabled={isStatic || isReadOnly}
        >
          <span
            className={`new-report-page__card-check ${selected ? 'is-selected' : ''}`}
            aria-hidden
          >
            <Check size={14} strokeWidth={3} />
          </span>
          <span className={`new-report-page__card-title-text new-report-page__card-title-text--${typeColor}`}>
            {typeLabel}
          </span>
          <span className="new-report-page__card-desc">{getReportTypeDescription(typeId)}</span>
          {showViableSources ? (
            <div className="new-report-page__card-sources" aria-label="Viable data sources">
              <span className="new-report-page__card-sources-label">Available sources</span>
              <span className="new-report-page__card-sources-list">
                {viableSourceIds.map((sourceId) => (
                  <span
                    key={`${typeId}-${sourceId}`}
                    className="new-report-page__card-source-icon"
                    title={getSourceLabel(sourceId)}
                    aria-label={getSourceLabel(sourceId)}
                  >
                    <SourceIcon sourceId={sourceId} size={14} />
                  </span>
                ))}
              </span>
            </div>
          ) : null}
        </button>
        {showKnowMore ? (
          <div className="new-report-page__card-know-more-wrap">
            <TitanButton
              variant="tertiary"
              onPress={() => setKnowMoreTypeId(typeId)}
              aria-label={`Know more about ${typeLabel}`}
            >
              Know more
            </TitanButton>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="new-report-page" style={{ fontFamily: 'var(--font-audiense), sans-serif' }}>
      <div className="new-report-page__shell">
        <header className="new-report-page__topbar">
          <div className="new-report-page__topbar-left">
            <TitanIconButton variant="secondary" aria-label="Back" onPress={handleBack}>
              <ArrowLeft size={18} aria-hidden />
            </TitanIconButton>
            <div className="new-report-page__topbar-titles">
              <h1 className="new-report-page__headline">{headlineEl}</h1>
            </div>
          </div>
        </header>

        <NewReportWizardStepper
          variant={context.kind === 'workflow' ? 'workflow' : 'source'}
          wizardStep={step}
          selectedTypeId={selectedTypeId}
          selectedChannelId={selectedChannelId}
          hasChannelStep={hasChannelStep}
          onNavigate={handleStepperNavigate}
        />

        {step === 'name' && (
          <section
            ref={nameStepRef}
            className="new-report-page__name-step"
            aria-labelledby="new-report-name-step-title"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && reportName.trim()) {
                e.preventDefault()
                handleNameNext()
              }
            }}
          >
            <div className="new-report-page__name-step-inner">
              <h2
                id="new-report-name-step-title"
                className="new-report-page__name-step-title"
              >
                Let&apos;s start — name your report
              </h2>
              <p className="new-report-page__name-step-hint">
                You&apos;ll find it by this name in My reports. You can rename it later.
              </p>
              <div className="nr-name-row">
                <div className="nr-name-row__input">
                  <TitanInputField
                    placeholder={namePlaceholder}
                    leadingIcon={<IconPencil size={18} stroke={1.5} aria-hidden />}
                    maxLength={70}
                    value={reportName}
                    onChange={setReportName}
                  />
                </div>
              </div>
              <p className="new-report-page__name-step-enter-hint">Press Enter to continue</p>
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
            ) : (
              <div className="new-report-page__type-sections" role="group" aria-label="Report type groups">
                {(() => {
                  const singleGroup = groupedTypeSections.length === 1
                  return groupedTypeSections.map((section) => (
                    <section key={section.id} className="new-report-page__type-section">
                      {singleGroup ? (
                        <div className="new-report-page__type-section-title-wrap">
                          <span id={`report-type-group-${section.id}`} className="new-report-page__type-section-title">
                            {section.label}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="new-report-page__type-section-toggle"
                          aria-expanded={!collapsedGroups[section.id]}
                          onClick={() =>
                            setCollapsedGroups((prev) => ({
                              ...prev,
                              [section.id]: !prev[section.id],
                            }))
                          }
                        >
                          <span className="new-report-page__type-section-title">{section.label}</span>
                          <IconChevronDown
                            size={16}
                            stroke={1.8}
                            aria-hidden
                            className={`new-report-page__type-section-chevron ${
                              collapsedGroups[section.id] ? 'is-collapsed' : ''
                            }`}
                          />
                        </button>
                      )}
                      {(singleGroup || !collapsedGroups[section.id]) && (
                        <div
                          className="new-report-page__grid"
                          role="group"
                          aria-label={`${section.label} report types`}
                        >
                          {section.typeIds.map((typeId) =>
                            renderReportTypeCard({
                              typeId,
                              selected: selectedTypeId === typeId && selectedUseCaseId === section.id,
                              onSelect: () => handleTypeCardSelect(typeId, { useCaseId: section.id }),
                              cardIdPrefix: `${section.id}-`,
                              sourceIdsOverride: getSourceIdsForReportTypeInWorkflowUseCase(
                                context.id,
                                section.id,
                                typeId,
                              ),
                              useCaseId: section.id,
                            }),
                          )}
                        </div>
                      )}
                    </section>
                  ))
                })()}
              </div>
            )
          ))}

        {step === 'channel' &&
          context.kind === 'workflow' &&
          selectedTypeId &&
          (channelSourceIds.length === 0 ? (
            <p className="new-report-page__empty" role="status">
              No data sources are available for this report type in the demo data.
            </p>
          ) : (
            <section className="new-report-page__channel-step" aria-label="Select data source">
              <TitanButtonGroup
                selectedKeys={selectedChannelId ? [selectedChannelId] : []}
                onSelectionChange={(keys) => {
                  const first = Array.from(keys)[0]
                  if (!first) return
                  if (isReportSourceComingSoon(selectedTypeId, first)) return
                  handleChannelCardSelect(String(first))
                }}
                className="new-report-page__source-titan-group"
                aria-label="Data sources"
              >
                {channelSourceIds.map((sourceId) => {
                  const label = getSourceLabel(sourceId)
                  const comingSoon = isReportSourceComingSoon(selectedTypeId, sourceId)
                  return (
                    <TitanIndividualButton
                      key={sourceId}
                      id={sourceId}
                      isDisabled={comingSoon}
                      aria-label={comingSoon ? `${label}, coming soon` : label}
                    >
                      <span className="new-report-page__source-button-logo" aria-hidden>
                        <SourceIcon sourceId={sourceId} size={16} />
                      </span>
                      <span>{label}</span>
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
