import { useRef, useState } from 'react'
import {
  Button as RacButton,
  Dialog,
  Popover,
} from 'react-aria-components'
import {
  TitanButton,
  TitanIconButton,
  TitanNavbar,
  TitanTooltip,
} from 'titan-compositions'
import { ArrowLeft, ChevronDown, Info, X } from 'lucide-react'
import {
  INTERESTS,
  REPORT_META,
  TOTALS,
} from '../data/topicsData.js'
import AppBreadcrumb from './AppBreadcrumb.jsx'
import TopicsView from './TopicsView.jsx'

function formatAudienceCount(n) {
  if (!Number.isFinite(n) || n < 0) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

/* HeaderInfo + HeaderInfoBlocker — pattern lifted from better-di-in:
   TitanTooltip needs a Focusable trigger (RacButton). A wrapping
   span captures click/keydown only so the focus context still
   reaches react-aria's hover/focus listeners. */
function HeaderInfoBlocker({ children }) {
  return (
    <span
      className="bdi-th-info-blocker"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
      }}
    >
      {children}
    </span>
  )
}

function HeaderInfo({ tooltip, label }) {
  return (
    <HeaderInfoBlocker>
      <TitanTooltip content={tooltip} placement="bottom end" delay={120} closeDelay={80}>
        <RacButton
          type="button"
          className="bdi-th-info-btn"
          aria-label={label}
          onPress={() => {}}
        >
          <Info size={12} aria-hidden />
        </RacButton>
      </TitanTooltip>
    </HeaderInfoBlocker>
  )
}

/* Audience legend — two chips ("Your audience" + "Baseline") under
   the page title. Both popovers can be open at the same time so
   the user compares definitions side by side. */
const AUDIENCE_DEFINITION = {
  triggerLabel: 'Your audience',
  dialogTitle: 'Audience definition',
  size: REPORT_META.audienceSize,
  body: (
    <div className="bdi-audience-def">
      <section className="bdi-audience-def__block">
        <p className="bdi-audience-def__label">Located in:</p>
        <p className="bdi-audience-def__values">
          Flanders <span className="bdi-audience-def__op">OR</span>{' '}
          Wallonia <span className="bdi-audience-def__op">OR</span>{' '}
          Brussels-Capital Region, Belgium
        </p>
      </section>
      <p className="bdi-audience-def__between">AND</p>
      <section className="bdi-audience-def__block">
        <p className="bdi-audience-def__label">Interests:</p>
        <p className="bdi-audience-def__values">
          Electric vehicles <span className="bdi-audience-def__op">OR</span>{' '}
          Plug-in hybrid vehicles <span className="bdi-audience-def__op">OR</span>{' '}
          EV charging
        </p>
      </section>
    </div>
  ),
}

const BASELINE_DEFINITION = {
  triggerLabel: 'Baseline',
  dialogTitle: 'Baseline definition',
  size: REPORT_META.baselineSize,
  body: (
    <div className="bdi-audience-def">
      <section className="bdi-audience-def__block">
        <p className="bdi-audience-def__label">Located in:</p>
        <p className="bdi-audience-def__values">Belgium</p>
      </section>
      <p className="bdi-audience-def__between">AND</p>
      <section className="bdi-audience-def__block">
        <p className="bdi-audience-def__label">Vehicle ownership:</p>
        <p className="bdi-audience-def__values">
          Car owner <span className="bdi-audience-def__op">OR</span> Driver
        </p>
      </section>
    </div>
  ),
}

function AudienceLegendChip({
  variant,
  definition,
  triggerRef,
  popoverRef,
  isOpen,
  setOpen,
  shouldCloseOnInteractOutside,
}) {
  const popoverId = `bdi-audience-legend-${variant}-popover`
  return (
    <>
      <span ref={triggerRef} className="bdi-audience-legend__anchor">
        <TitanButton
          variant="secondary"
          className={`bdi-audience-legend__chip bdi-audience-legend__chip--${variant}`}
          iconEnd={
            <ChevronDown
              size={14}
              aria-hidden
              className="bdi-audience-legend__chev"
            />
          }
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={popoverId}
          data-open={isOpen ? 'true' : 'false'}
          onPress={() => setOpen((open) => !open)}
        >
          <span className="bdi-audience-legend__dot" aria-hidden />
          <span className="bdi-audience-legend__text">
            <span className="bdi-audience-legend__label">
              {definition.triggerLabel}
            </span>
            <span className="bdi-audience-legend__sep" aria-hidden>·</span>
            <span className="bdi-audience-legend__count bdi-num">
              {formatAudienceCount(definition.size)} people
            </span>
          </span>
        </TitanButton>
      </span>
      <Popover
        ref={popoverRef}
        id={popoverId}
        triggerRef={triggerRef}
        isOpen={isOpen}
        onOpenChange={setOpen}
        placement="bottom start"
        offset={8}
        shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
        className="bdi-filter-popover bdi-audience-legend__popover"
      >
        <Dialog
          className="bdi-filter-dialog bdi-audience-legend__dialog"
          aria-label={definition.dialogTitle}
        >
          <header className="bdi-audience-legend__head">
            <h3 className="bdi-audience-legend__title">{definition.dialogTitle}</h3>
            <TitanIconButton
              variant="ghost"
              className="bdi-audience-legend__close"
              aria-label="Close definition"
              onPress={() => setOpen(false)}
            >
              <X size={14} aria-hidden />
            </TitanIconButton>
          </header>
          <div className="bdi-audience-legend__body">{definition.body}</div>
        </Dialog>
      </Popover>
    </>
  )
}

function AudienceLegend() {
  const audTriggerRef = useRef(null)
  const baseTriggerRef = useRef(null)
  const audPopoverRef = useRef(null)
  const basePopoverRef = useRef(null)
  const [audOpen, setAudOpen] = useState(false)
  const [baseOpen, setBaseOpen] = useState(false)

  function makeShouldClose(otherTrigger, otherPopover) {
    return (target) => {
      if (otherTrigger.current?.contains(target)) return false
      if (otherPopover.current?.contains(target)) return false
      return true
    }
  }

  return (
    <div className="bdi-audience-legend" role="group" aria-label="Audience and baseline">
      <AudienceLegendChip
        variant="audience"
        definition={AUDIENCE_DEFINITION}
        triggerRef={audTriggerRef}
        popoverRef={audPopoverRef}
        isOpen={audOpen}
        setOpen={setAudOpen}
        shouldCloseOnInteractOutside={makeShouldClose(baseTriggerRef, basePopoverRef)}
      />
      <span className="bdi-audience-legend__divider" aria-hidden>vs</span>
      <AudienceLegendChip
        variant="baseline"
        definition={BASELINE_DEFINITION}
        triggerRef={baseTriggerRef}
        popoverRef={basePopoverRef}
        isOpen={baseOpen}
        setOpen={setBaseOpen}
        shouldCloseOnInteractOutside={makeShouldClose(audTriggerRef, audPopoverRef)}
      />
    </div>
  )
}

const PAGE_HEADER_TOOLTIP =
  'Interests and categories this audience over- and under-indexes against the baseline.'

function PageHeader() {
  return (
    <header className="topics-page-header">
      <div className="topics-page-header__title-area">
        {/* Eyebrow removed: the project · audience trail now lives
            in the top-level TitanBreadcrumb strip above the navbar
            area. Repeating it here would duplicate the navigation. */}
        <div className="bdi-header__title-row">
          <TitanIconButton
            variant="ghost"
            className="bdi-header__back"
            aria-label="Back to reports"
            onPress={() => window.history.back()}
          >
            <ArrowLeft size={18} aria-hidden />
          </TitanIconButton>
          <h1>Interests</h1>
          <HeaderInfo
            label="About this report"
            tooltip={PAGE_HEADER_TOOLTIP}
          />
        </div>
        <p className="topics-page-header__submeta">
          <span className="bdi-num">{TOTALS.interestCount}</span> Interests
          <span className="topics-page-header__submeta-sep" aria-hidden>·</span>
          <span className="bdi-num">{TOTALS.categoryCount}</span> Categories
          <span className="topics-page-header__submeta-sep" aria-hidden>·</span>
          <span>{REPORT_META.updatedLabel}</span>
        </p>
        <AudienceLegend />
      </div>
    </header>
  )
}

export default function AppShell() {
  /* === Top-level state ===
     · query = search inside the active interest
     · sortBy / direction = column sort applied to the active panel
     · activeInterestId = the interest currently selected in the
       vertical rail (defaults to the first interest, which after
       sorting INTERESTS is the strongest signal — gives the most
       useful default view on landing)
     Rows are intentionally non-interactive: every category-level
     value (name, penetration, baseline, affinity, profiles) is
     already on the row, and the per-interest table is the unit of
     analysis. A drawer here would only duplicate visible data, so
     we removed it. */
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('selectivity')
  const [direction, setDirection] = useState('desc')
  const [activeInterestId, setActiveInterestId] = useState(
    () => INTERESTS[0]?.id ?? null,
  )

  function onSortChange(patch) {
    if (patch.sortBy) setSortBy(patch.sortBy)
    if (patch.direction) setDirection(patch.direction)
  }

  /* Breadcrumb trail above the page header. Static for this
     prototype — clicking any item just calls window.history.back()
     as a placeholder until the SPA shell is wired in. */
  const breadcrumbItems = [
    { id: 'home', label: 'Home', onPress: () => window.history.back() },
    { id: 'project', label: REPORT_META.project, onPress: () => window.history.back() },
    { id: 'audience-context', label: REPORT_META.audienceContext, onPress: () => window.history.back() },
    { id: 'audience', label: REPORT_META.audienceName, onPress: () => window.history.back() },
  ]

  return (
    <div className="bdi-app topics-app titan-app-root">
      <TitanNavbar logoAlt="Digital Intelligence for Meta" />
      <AppBreadcrumb items={breadcrumbItems} currentLabel="Interests" />
      <main className="bdi-main">
        <PageHeader />

        <TopicsView
          query={query}
          setQuery={setQuery}
          sortBy={sortBy}
          direction={direction}
          onSortChange={onSortChange}
          activeInterestId={activeInterestId}
          setActiveInterestId={setActiveInterestId}
        />
      </main>
    </div>
  )
}
