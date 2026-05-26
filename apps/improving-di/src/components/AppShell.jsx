import { useMemo, useRef, useState } from 'react'
import {
  Button as RacButton,
  Dialog,
  Popover,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from 'react-aria-components'
import {
  TitanBadgeAnchor,
  TitanButton,
  TitanIconButton,
  TitanInputField,
  TitanNavbar,
  TitanTooltip,
} from 'titan-compositions'
import {
  ArrowLeft,
  ChevronDown,
  Info,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

/* ------------------------------------------------------------------
   Cross-app re-use
   The unified `improving-di` shell is intentionally thin: it ships
   the navbar + breadcrumb + page header + report-section nav, and
   delegates the heavy workspaces to the source apps.

   · DOMAIN_TABS / DomainPanel / TAB_INITIAL / normalizeTabSlot →
     better-di-in. The Brand · Media · Influencers vertical rail
     and tables render unchanged under the "Brands & influence"
     report section.
   · TopicsView → topics. The Interests vertical rail + category
     table renders unchanged under the "Interests" report section.
   · INTERESTS / REPORT_META (topics) → used to seed the breadcrumb
     trail and the default active interest.
   · DOMAINS / REPORT_META (better-di-in) → used for the page title
     and to feed DomainPanel its dataset.

   The relative imports cross app boundaries inside the monorepo;
   vite is configured to allow `apps/better-di-in` and `apps/topics`
   under `server.fs.allow`. ------------------------------------------------------------------ */
import {
  DOMAIN_FILTERS,
  DOMAIN_TABS,
  DomainPanel,
  ExportDownloadMenu,
  FilterChips,
  FiltersPanel,
  TAB_BOUNDS,
  TAB_INITIAL,
  buildDefaultFilters,
  flattenDomainItems,
  normalizeTabSlot,
  prepareDomainView,
} from '../../../better-di-in/src/components/AppShell.jsx'
import { DOMAINS, REPORT_META as BDI_REPORT_META } from '../../../better-di-in/src/data/audienceData.js'
import TopicsView from '../../../topics/src/components/TopicsView.jsx'
import {
  ALL_CATEGORIES,
  INTERESTS,
  REPORT_META as TOPICS_REPORT_META,
} from '../../../topics/src/data/topicsData.js'

import AppBreadcrumb from './AppBreadcrumb.jsx'

/* -------------------------------------------------------------
   Audience legend — two chips ("Your audience" + "Baseline") sit
   under the page title. Both popovers can be open at the same
   time so the user can compare definitions side by side. The
   chip uses TitanButton (Titan-compliant) and the popover uses
   react-aria-components for the dialog dance. Lifted from
   better-di-in / topics so the page header chrome stays
   self-contained in the unified shell.
------------------------------------------------------------- */
const AUDIENCE_SIZE = 599_800
const BENCHMARK_SIZE = 25_400_000

function formatAudienceCount(n) {
  if (!Number.isFinite(n) || n < 0) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

const AUDIENCE_DEFINITION = {
  triggerLabel: 'Your audience',
  dialogTitle: 'Audience definition',
  size: AUDIENCE_SIZE,
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
  size: BENCHMARK_SIZE,
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
  const popoverId = `imp-audience-legend-${variant}-popover`
  return (
    <>
      {/* TitanButton does not forward refs to the underlying DOM
          node — anchor the popover to a wrapping span (same
          pattern used by both source apps). */}
      <span ref={triggerRef} className="bdi-audience-legend__anchor">
        <TitanButton
          variant="text"
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

  /* Default react-aria behaviour is to close on any outside
     click. We override so that clicking the OTHER trigger or
     inside the OTHER popover never dismisses this one — both
     chips stay open simultaneously, which is the whole point of
     the legend (compare audience vs baseline side by side). */
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

/* -------------------------------------------------------------
   Page header tooltip — describes the report at a glance. The
   copy is intentionally section-agnostic because the unified
   shell can land on any of the report sections; the tab strip
   below tells the user what they're looking at right now.
------------------------------------------------------------- */
const PAGE_HEADER_TOOLTIP =
  'This audience profile combines brand affinity, media use and influencer signal with interests and topics, against the baseline.'

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

/* -------------------------------------------------------------
   Navigation targets
   This mockup is a single audience report, but the chrome
   (back button + breadcrumb) needs real destinations so users
   can validate the navigation model. In a real Audiense
   deployment all paths below would be SPA routes; here we
   point at the sibling mockup apps in the monorepo when one
   exists, and fall back to a /placeholder URL otherwise.
   `report-list` runs on port 5181 in dev and represents the
   audience list view that's the canonical parent of any
   audience report — so both the back button and the
   "audience context" breadcrumb item land there.
------------------------------------------------------------- */
const NAV_TARGETS = {
  home: 'http://localhost:5181/',
  project: 'http://localhost:5181/',
  audienceContext: 'http://localhost:5181/',
  audience: '/',
}

/* navigateUp — turn the back arrow into a real navigation.
   We deliberately do NOT call `window.history.back()`: the back
   stack inside a mockup is unreliable (a fresh tab has no
   previous entry, and same-URL reloads make `back()` cycle on
   itself). Instead we always assign the explicit href so the
   click reads as a predictable, visible navigation in the
   address bar. Same handler is reused by the breadcrumb crumbs
   so the navigation model is consistent across the chrome. */
function navigateUp(href) {
  window.location.assign(href)
}

function PageHeader() {
  return (
    <header className="bdi-header">
      <div className="bdi-header__title">
        <div className="bdi-header__title-row">
          <TitanIconButton
            variant="ghost"
            className="bdi-header__back"
            aria-label={`Back to ${TOPICS_REPORT_META.audienceContext}`}
            onPress={() => navigateUp(NAV_TARGETS.audienceContext)}
          >
            <ArrowLeft size={18} aria-hidden />
          </TitanIconButton>
          <h1>{BDI_REPORT_META.audience}</h1>
          <HeaderInfo
            label="About this report"
            tooltip={PAGE_HEADER_TOOLTIP}
          />
        </div>
        <AudienceLegend />
      </div>
    </header>
  )
}

/* -------------------------------------------------------------
   Report section nav — the orange-ring / blue-ring tab strip.
   Unified order (per spec):
     orange ring  Sociodemo · Categories · Maps · Persona overview · Segmentation
     blue ring    Lifestyle profile · AI chat · Brands & influence · Interests
   Notes:
   · "Categories" is the rename of the old "Topics" tab — kept as
     a placeholder for parity with the source apps.
   · The two REAL panels are "Brands & influence" (mounts the
     better-di-in workspace) and "Interests" (mounts the topics
     workspace). Everything else shows the lightweight preview
     placeholder used by both source apps so the demo still feels
     complete without ballooning the scope.
------------------------------------------------------------- */
const REPORT_SECTION_TABS_ORANGE = [
  { id: 'sociodemo', label: 'Sociodemo' },
  { id: 'categories', label: 'Categories' },
  { id: 'maps', label: 'Maps' },
  { id: 'persona', label: 'Persona overview' },
  { id: 'segmentation', label: 'Segmentation' },
]

const REPORT_SECTION_TABS_BLUE = [
  { id: 'lifestyle', label: 'Lifestyle profile' },
  { id: 'ai-chat', label: 'AI chat' },
  { id: 'brands-influence', label: 'Influencers & brands' },
  { id: 'interests', label: 'Interests categories' },
]

const REPORT_SECTION_TABS = [
  ...REPORT_SECTION_TABS_ORANGE,
  ...REPORT_SECTION_TABS_BLUE,
]

function sectionLabel(id) {
  return REPORT_SECTION_TABS.find((t) => t.id === id)?.label ?? id
}

function ReportSectionTab({ tab, selected, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      id={`report-section-tab-${tab.id}`}
      aria-selected={selected}
      aria-controls={`report-section-panel-${tab.id}`}
      className="tab-trigger bdi-report-section-nav__tab"
      {...(selected ? { 'data-selected': true } : {})}
      onClick={() => onSelect(tab.id)}
    >
      {tab.label}
    </button>
  )
}

function ReportSectionNav({ value, onChange }) {
  return (
    <nav className="bdi-report-section-nav" aria-label="Report sections">
      <div className="bdi-report-section-nav__row tabs-list-scroll" role="tablist">
        <span className="bdi-report-section-nav__ring" aria-hidden>
          <img src="/report-section/ring-orange.png" alt="" width={14} height={14} />
        </span>
        <div className="bdi-report-section-nav__group">
          {REPORT_SECTION_TABS_ORANGE.map((tab) => (
            <ReportSectionTab
              key={tab.id}
              tab={tab}
              selected={value === tab.id}
              onSelect={onChange}
            />
          ))}
        </div>
        <span className="bdi-report-section-nav__ring" aria-hidden>
          <img src="/report-section/ring-blue.png" alt="" width={14} height={14} />
        </span>
        <div className="bdi-report-section-nav__group">
          {REPORT_SECTION_TABS_BLUE.map((tab) => (
            <ReportSectionTab
              key={tab.id}
              tab={tab}
              selected={value === tab.id}
              onSelect={onChange}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}

function ReportSectionPlaceholder({ sectionId }) {
  return (
    <section
      className="bdi-report-section-placeholder"
      aria-labelledby="imp-report-section-placeholder-title"
    >
      <h2 id="imp-report-section-placeholder-title">{sectionLabel(sectionId)}</h2>
      <p>This section is not included in this preview.</p>
    </section>
  )
}

/* -------------------------------------------------------------
   Brands & influence workspace
   Mounts the better-di-in Brand · Media · Influencers vertical
   rail and the per-domain DomainPanel (tables, filters, scatter).

   Unified-search contract (shared with the Interests workspace):
   · ONE workspace-level search input sits above the scope nav.
     The query is "lifted" out of the per-tab DomainToolbar and
     fanned out to every DomainPanel as a single `globalQuery`.
   · Per-tab filters / sort / group-by / drill stay scoped per
     domain (they reference domain-specific dimensions, so a
     unified slot wouldn't make sense).
   · While the query is non-empty, each tab label gains a
     "(N matches)" suffix so the scope nav doubles as a result
     map across the three domains. Tabs with zero matches dim
     down (CSS `data-no-matches`) so the user's eye lands on the
     scope that actually has signal.
------------------------------------------------------------- */

/* Compact number formatter for the scope-nav counts (e.g. "448"
   stays full, "1234" becomes "1.2K"). Follows the project-wide
   compact-number rule so a Brands tab reading 12,500 brands lands
   as "12.5K" rather than the full number. */
const COMPACT_FORMATTER = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
function formatScopeCount(n) {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1000) return String(n)
  return COMPACT_FORMATTER.format(n)
}

/* Per-domain prepared/flattened item lists, keyed by domain id.
   These are *static* over the lifetime of the app (the source
   data never mutates here), so we memoize once at module load.
   A keystroke in the search field then becomes a simple
   String.includes scan over three small arrays — cheap and
   keeps the badge counts in sync with the panel's own filter
   pipeline (both sides match on `item.name`). */
const DOMAIN_ITEMS_BY_ID = (() => {
  const out = {}
  for (const { id } of DOMAIN_TABS) {
    const d = DOMAINS.find((dom) => dom.id === id)
    if (!d) continue
    out[id] = flattenDomainItems(prepareDomainView(d))
  }
  return out
})()

function BrandsInfluenceWorkspace() {
  const [active, setActive] = useState(DOMAIN_TABS[0].id)
  const [tabStates, setTabStates] = useState(TAB_INITIAL)
  const [linkedRowKey, setLinkedRowKey] = useState(null)
  /* Universal search — shared across all three domain tabs. The
     per-tab `slot.q` slots from TAB_INITIAL are intentionally
     ignored in this shell (they exist for the standalone
     better-di-in app, which keeps the per-tab search model). */
  const [globalQuery, setGlobalQuery] = useState('')

  function patchTab(domainId, partial) {
    setTabStates((s) => ({
      ...s,
      [domainId]: { ...normalizeTabSlot(domainId, s[domainId]), ...partial },
    }))
  }
  function setTabFilters(domainId, updater) {
    setTabStates((s) => {
      const slot = normalizeTabSlot(domainId, s[domainId])
      const nextFilters =
        typeof updater === 'function' ? updater(slot.filters) : updater
      return { ...s, [domainId]: { ...slot, filters: nextFilters } }
    })
  }
  function setTabSort(domainId, value) {
    patchTab(domainId, { sortDescriptor: value })
  }
  function bumpTabResetToken(domainId) {
    setTabStates((s) => {
      const slot = normalizeTabSlot(domainId, s[domainId])
      return {
        ...s,
        [domainId]: { ...slot, resetToken: slot.resetToken + 1 },
      }
    })
  }

  function handleTableRowLink(domainId, rowKey) {
    setLinkedRowKey(`${domainId}::${rowKey}`)
  }

  /* Match counts per domain for the unified query. We deliberately
     ignore per-domain filters here — the badge is meant to answer
     "where in the workspace does my search term live?", not "how
     many rows would I see with my current filters?". The latter
     would make the badges flicker depending on which tab was
     touched last, breaking the user's mental map. */
  const matchCountByDomain = useMemo(() => {
    const q = globalQuery.trim().toLowerCase()
    if (!q) return null
    const counts = {}
    for (const { id } of DOMAIN_TABS) {
      const items = DOMAIN_ITEMS_BY_ID[id] ?? []
      let n = 0
      for (const it of items) {
        if (it.name?.toLowerCase().includes(q)) n += 1
      }
      counts[id] = n
    }
    return counts
  }, [globalQuery])

  const isSearching = matchCountByDomain !== null
  const totalMatches = useMemo(() => {
    if (!isSearching) return 0
    return Object.values(matchCountByDomain).reduce((a, b) => a + b, 0)
  }, [isSearching, matchCountByDomain])

  /* Pre-resolve each tab into the data we need to render — keeps
     the JSX below readable and the per-tab DomainPanel props in
     one place. `totalCount` is the size of the underlying domain
     (e.g. 448 brands) so the idle scope nav reads like the
     Interests rail: "<scope name>  <total>". When searching, the
     same slot flips to "<scope name>  <matches>" so the user can
     see at a glance where the matches live. */
  const tabModels = DOMAIN_TABS.map(({ id, label }) => {
    const d = DOMAINS.find((dom) => dom.id === id)
    if (!d) return null
    const slot = normalizeTabSlot(d.id, tabStates[d.id])
    const domainId = d.id
    const totalCount = (DOMAIN_ITEMS_BY_ID[domainId] ?? []).length
    const matchCount = isSearching ? matchCountByDomain[domainId] ?? 0 : null
    return { domain: d, slot, domainId, label, matchCount, totalCount }
  }).filter(Boolean)

  /* Active-tab context for the workspace-level filter trigger.
     The filter popover always reflects the tab the user is
     currently looking at — switching tabs swaps the popover's
     state too, mirroring the per-tab toolbar behaviour we
     replaced. */
  const activeModel =
    tabModels.find((m) => m.domainId === active) ?? tabModels[0]
  const activeDomainView = useMemo(
    () => (activeModel ? prepareDomainView(activeModel.domain) : null),
    [activeModel],
  )
  const activeCategoryOptions = useMemo(() => {
    if (!activeDomainView) return []
    return activeDomainView.categories
      .filter((cat) => cat.items.length > 0 || cat.insufficientSignal)
      .map((cat) => ({ id: cat.id, label: cat.title }))
  }, [activeDomainView])
  const activeBounds = activeModel ? TAB_BOUNDS[activeModel.domainId] : null
  const activeFilterCount = useMemo(() => {
    if (!activeModel || !activeBounds) return 0
    const f = activeModel.slot.filters
    let count = 0
    if (f.tone !== 'all') count += 1
    if (
      f.penRange[0] !== activeBounds.pen[0] ||
      f.penRange[1] !== activeBounds.pen[1]
    )
      count += 1
    if (
      f.selRange[0] !== activeBounds.sel[0] ||
      f.selRange[1] !== activeBounds.sel[1]
    )
      count += 1
    if (f.categories.size > 0) count += 1
    ;(DOMAIN_FILTERS[activeModel.domainId] || []).forEach((tabFilter) => {
      if (f[tabFilter.key].size > 0) count += 1
    })
    return count
  }, [activeModel, activeBounds])
  const activeTableMode = activeModel
    ? activeModel.slot.groupByCategory
      ? activeModel.slot.tableDrillCategoryId
        ? 'drill'
        : 'categories'
      : 'granular'
    : 'granular'

  return (
    <div
      id="report-section-panel-brands-influence"
      className="bdi-workspace imp-bdi-workspace"
      role="tabpanel"
      aria-labelledby="report-section-tab-brands-influence"
    >
      <UniversalSearchBar
        value={globalQuery}
        onChange={setGlobalQuery}
        placeholder="Search brands, media or influencers…"
        ariaLabel="Search across brands, media and influencers"
        isSearching={isSearching}
        totalMatches={totalMatches}
        filterSlot={
          activeModel ? (
            <BrandsFilterControl
              domainId={active}
              filters={activeModel.slot.filters}
              setFilters={(updater) => setTabFilters(active, updater)}
              bounds={activeBounds}
              categoryOptions={activeCategoryOptions}
              resetKey={activeModel.slot.resetToken}
              bumpResetToken={() => bumpTabResetToken(active)}
              activeFilterCount={activeFilterCount}
              tableMode={activeTableMode}
            />
          ) : null
        }
        actions={
          activeModel ? (
            <>
              <GroupByCategorySwitch
                value={!!activeModel.slot.groupByCategory}
                onChange={(v) =>
                  patchTab(active, {
                    groupByCategory: v,
                    tableDrillCategoryId: null,
                  })
                }
                idSuffix={active}
              />
              <ExportDownloadMenu />
            </>
          ) : null
        }
      />
      <div className="bdi-workspace__body">
        <div className="bdi-tabs-split">
          <div
            className="bdi-tabs"
            data-search-mode={isSearching ? 'true' : 'false'}
          >
            {/* react-aria primitives in place of TitanTabs so each
                Tab can carry custom children (label + match badge)
                and a `data-no-matches` attribute for the dim CSS
                rule. We keep Titan's class contract verbatim
                (`tabs-root tabs-root-vertical` / `tabs-list
                tabs-list-vertical` / `tab-trigger
                tab-trigger-vertical`) so the visual still reads
                as a Titan tab list. */}
            <Tabs
              orientation="vertical"
              className="tabs-root tabs-root-vertical"
              selectedKey={active}
              onSelectionChange={(key) => {
                setLinkedRowKey(null)
                setActive(String(key))
              }}
            >
              <TabList
                className="tabs-list tabs-list-vertical"
                aria-label="Brand · Media · Influencers"
              >
                {tabModels.map(({ domainId, label, matchCount, totalCount }) => {
                  const noMatches = isSearching && matchCount === 0
                  const displayCount = isSearching ? matchCount : totalCount
                  const countLabel = isSearching
                    ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`
                    : `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`
                  return (
                    <Tab
                      key={domainId}
                      id={domainId}
                      className="tab-trigger tab-trigger-vertical imp-bdi-scope-tab"
                      data-no-matches={noMatches ? 'true' : undefined}
                    >
                      <span className="imp-bdi-scope-tab__name">{label}</span>
                      <span
                        className="imp-bdi-scope-tab__count bdi-num"
                        aria-label={countLabel}
                      >
                        {formatScopeCount(displayCount)}
                      </span>
                    </Tab>
                  )
                })}
              </TabList>
              {tabModels.map(({ domain, slot, domainId }) => (
                <TabPanel
                  key={domainId}
                  id={domainId}
                  className="tab-panel"
                >
                  <DomainPanel
                    key={domainId}
                    domain={domain}
                    q={globalQuery}
                    setQ={setGlobalQuery}
                    filters={slot.filters}
                    setFilters={(updater) => setTabFilters(domainId, updater)}
                    sortDescriptor={slot.sortDescriptor}
                    setSortDescriptor={(v) => setTabSort(domainId, v)}
                    resetToken={slot.resetToken}
                    bumpResetToken={() => bumpTabResetToken(domainId)}
                    groupByCategory={!!slot.groupByCategory}
                    setGroupByCategory={(v) =>
                      patchTab(domainId, {
                        groupByCategory: v,
                        tableDrillCategoryId: null,
                      })
                    }
                    tableDrillCategoryId={slot.tableDrillCategoryId ?? null}
                    setTableDrillCategoryId={(id) =>
                      patchTab(domainId, { tableDrillCategoryId: id })
                    }
                    linkedRowKey={linkedRowKey}
                    onRowLink={(key) => handleTableRowLink(domainId, key)}
                    onClearRowLink={() => setLinkedRowKey(null)}
                    hideToolbar
                  />
                </TabPanel>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------
   UniversalSearchBar — workspace-level toolbar reused by both
   real workspaces (Brands and Interests). One row, one visual
   home, identical affordances across the two surfaces:
   · Search field on the left (leading icon + trailing clear)
   · Live "N matches" copy when there's an active query
   · `actions` slot on the right that hosts the filter trigger,
     the download menu, and (Brands only) the group-by switch
   The placeholder + aria-label are workspace-specific so the
   user reads exactly which surface the search covers.
------------------------------------------------------------- */
function UniversalSearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
  isSearching,
  totalMatches,
  /* Filter trigger sits *immediately* next to the search field
     because the two read as one cluster ("narrow what I see"):
     keep them within Fitts-distance so a user filtering after a
     search doesn't have to chase a target across the bar. */
  filterSlot = null,
  /* Right-hand cluster for view controls (group-by switch,
     download menu, etc). Pushed to the far end so the bar is
     visually split into "narrowing" tools (left) and "viewing"
     tools (right). */
  actions = null,
}) {
  return (
    <section className="imp-universal-search" aria-label={ariaLabel}>
      <div className="imp-universal-search__lead">
        <div className="imp-universal-search__field">
          <TitanInputField
            className="field-root bdi-field"
            aria-label={ariaLabel}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e?.target?.value ?? e ?? '')}
            onClear={() => onChange('')}
            leadingIcon={<Search size={14} aria-hidden />}
            endIcon={value ? <X size={14} aria-hidden /> : null}
          />
        </div>
        {filterSlot}
      </div>
      {isSearching ? (
        <p className="imp-universal-search__count" aria-live="polite">
          <strong className="bdi-num">{totalMatches}</strong>
          <span>&nbsp;{totalMatches === 1 ? 'match' : 'matches'}</span>
        </p>
      ) : null}
      {actions ? (
        <div className="imp-universal-search__actions">{actions}</div>
      ) : null}
    </section>
  )
}

/* -------------------------------------------------------------
   Filter + group + download controls
   Three small components that host the action triggers in the
   universal search bar. Each owns just its popover open state;
   the underlying filter / group / download data flows through
   the same props the panel toolbar used to receive, so behaviour
   is preserved bit-for-bit.
------------------------------------------------------------- */

function BrandsFilterControl({
  domainId,
  filters,
  setFilters,
  bounds,
  categoryOptions,
  resetKey,
  bumpResetToken,
  activeFilterCount,
  tableMode,
}) {
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <span ref={triggerRef} className="bdi-toolbar__filter-anchor">
        <TitanBadgeAnchor count={activeFilterCount}>
          <TitanIconButton
            variant="secondary"
            className="bdi-toolbar__filter-btn"
            aria-label={
              activeFilterCount > 0
                ? `Filters (${activeFilterCount} active)`
                : 'Filters'
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            onPress={() => setOpen((v) => !v)}
          >
            <SlidersHorizontal size={16} aria-hidden />
          </TitanIconButton>
        </TitanBadgeAnchor>
      </span>
      <Popover
        triggerRef={triggerRef}
        isOpen={open}
        onOpenChange={setOpen}
        placement="bottom end"
        offset={8}
        className="bdi-filter-popover"
      >
        <Dialog
          aria-label="Filter items in this domain"
          className="bdi-filter-dialog"
        >
          <FiltersPanel
            domainId={domainId}
            filters={filters}
            setFilters={setFilters}
            bounds={bounds}
            resetKey={resetKey}
            categoryOptions={categoryOptions}
            bumpResetToken={bumpResetToken}
            onClose={() => setOpen(false)}
            metricsTarget={
              tableMode === 'categories' ? 'categorySummary' : 'items'
            }
          />
        </Dialog>
      </Popover>
    </>
  )
}

function GroupByCategorySwitch({ value, onChange, idSuffix }) {
  const labelId = `imp-bdi-group-lbl-${idSuffix}`
  return (
    <span className="imp-bdi-group-switch">
      <span className="imp-bdi-group-switch__label" id={labelId}>
        Group by category
      </span>
      <Switch
        className="switch-root bdi-table-group-switch"
        isSelected={value}
        onChange={onChange}
        aria-labelledby={labelId}
      >
        <span className="switch-track" aria-hidden>
          <span className="switch-thumb" />
        </span>
      </Switch>
    </span>
  )
}

/* -------------------------------------------------------------
   Interests filter control
   We deliberately mount the same `FiltersPanel` that powers
   Brand · Media · Influencers so the two surfaces share one
   visual model AND one mental model: Status pills + Penetration
   slider + Affinity slider + parent multi-select + the Clear all
   / Done footer. The only string we swap is the multi-select
   label, which reads "Interests" here because in this dataset
   the parent group is the interest (not a category).

   State (a full `filters` object that matches the brands
   `buildDefaultFilters` shape) lives in InterestsWorkspace so
   the table, the chip strip, and the badge count all stay in
   lockstep with the popover.
------------------------------------------------------------- */
function InterestsFilterControl({
  filters,
  setFilters,
  bounds,
  categoryOptions,
  resetKey,
  bumpResetToken,
  activeFilterCount,
}) {
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <span ref={triggerRef} className="bdi-toolbar__filter-anchor">
        <TitanBadgeAnchor count={activeFilterCount}>
          <TitanIconButton
            variant="secondary"
            className="bdi-toolbar__filter-btn"
            aria-label={
              activeFilterCount > 0
                ? `Filters (${activeFilterCount} active)`
                : 'Filters'
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            onPress={() => setOpen((v) => !v)}
          >
            <SlidersHorizontal size={16} aria-hidden />
          </TitanIconButton>
        </TitanBadgeAnchor>
      </span>
      <Popover
        triggerRef={triggerRef}
        isOpen={open}
        onOpenChange={setOpen}
        placement="bottom end"
        offset={8}
        className="bdi-filter-popover"
      >
        <Dialog
          aria-label="Filter interests and categories"
          className="bdi-filter-dialog"
        >
          <FiltersPanel
            domainId="interests"
            filters={filters}
            setFilters={setFilters}
            bounds={bounds}
            resetKey={resetKey}
            categoryOptions={categoryOptions}
            bumpResetToken={bumpResetToken}
            onClose={() => setOpen(false)}
            categoryLabel="Interests"
          />
        </Dialog>
      </Popover>
    </>
  )
}

/* -------------------------------------------------------------
   Interests workspace
   Mounts the topics TopicsView vertical rail + category table.
   The shell hosts the workspace-level UniversalSearchBar (above
   the rail) so the chrome is identical to Brands; TopicsView
   gets `hideToolbar` so the panel paints no chrome of its own.

   Filter parity with Brands:
   · The popover reuses the same `FiltersPanel` (Status pills +
     Penetration slider + Affinity slider + parent multi-select)
     — see `InterestsFilterControl`.
   · Active filters render below the search bar as `FilterChips`,
     identical to the brands chip strip, with one-click X removal.
   · Bounds are computed once from `ALL_CATEGORIES` so the sliders
     hug the real data range (not a hardcoded 0-100 / 0-5 axis).
   · The parent multi-select is seeded with the 25 interests
     (`{ id, label }`); the panel filters out the section
     automatically if only one option exists, so this stays robust
     to the rare case of a one-interest dataset.

   For the cross-interest match total we recompute on every
   keystroke. 25 interests × ~10 cats = 250 entries max, so a
   single linear pass is cheap and keeps badge / header counts in
   lockstep with the table's own filter pipeline.
------------------------------------------------------------- */

/* Compute slider bounds from the full category pool. We pad the
   selectivity bottom to 0 so an "Under-indexed" target is always
   reachable, and round to 2-decimal granularity so the slider
   step (0.05) lands on clean numbers. */
const INTEREST_BOUNDS = (() => {
  let penMin = Infinity
  let penMax = -Infinity
  let selMin = Infinity
  let selMax = -Infinity
  for (const c of ALL_CATEGORIES) {
    if (c.audiencePen < penMin) penMin = c.audiencePen
    if (c.audiencePen > penMax) penMax = c.audiencePen
    if (c.selectivity < selMin) selMin = c.selectivity
    if (c.selectivity > selMax) selMax = c.selectivity
  }
  return {
    pen: [Math.max(0, Math.floor(penMin)), Math.ceil(penMax)],
    sel: [
      Math.max(0, Math.floor(selMin * 20) / 20),
      Math.ceil(selMax * 20) / 20,
    ],
  }
})()

const INTEREST_PARENT_OPTIONS = INTERESTS.map((i) => ({
  id: i.id,
  label: i.name,
}))

function buildInterestDefaults() {
  return {
    tone: 'all',
    penRange: INTEREST_BOUNDS.pen,
    selRange: INTEREST_BOUNDS.sel,
    categories: new Set(),
  }
}

function InterestsWorkspace() {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('selectivity')
  const [direction, setDirection] = useState('desc')
  const [activeInterestId, setActiveInterestId] = useState(
    () => INTERESTS[0]?.id ?? null,
  )
  /* Full filter set — same shape the brands FiltersPanel produces
     so the same JSX can drive it. Lives at the workspace level so
     it survives rail switches (same contract as the query). */
  const [filters, setFilters] = useState(buildInterestDefaults)
  /* Reset token bumps the slider keys when the user clicks "Clear
     all" or removes a slider chip. Without it the uncontrolled
     react-aria range slider would keep its thumb position even
     though `filters.penRange` reset to the bounds. */
  const [resetToken, setResetToken] = useState(0)
  const bumpResetToken = () => setResetToken((n) => n + 1)

  function onSortChange(patch) {
    if (patch.sortBy) setSortBy(patch.sortBy)
    if (patch.direction) setDirection(patch.direction)
  }

  const isSearching = query.trim() !== ''
  const totalMatches = useMemo(() => {
    if (!isSearching) return 0
    const q = query.trim().toLowerCase()
    let n = 0
    for (const c of ALL_CATEGORIES) {
      if (c.name.toLowerCase().includes(q)) n += 1
    }
    return n
  }, [isSearching, query])

  /* Badge count + EmptyState gate. We count every dimension that
     is off its default so the badge maps 1:1 to "what's narrowing
     my view". The parent multi-select counts as a single chip in
     the badge total (mirrors the brands convention). */
  const hasActiveFilter =
    filters.tone !== 'all' ||
    filters.penRange[0] !== INTEREST_BOUNDS.pen[0] ||
    filters.penRange[1] !== INTEREST_BOUNDS.pen[1] ||
    filters.selRange[0] !== INTEREST_BOUNDS.sel[0] ||
    filters.selRange[1] !== INTEREST_BOUNDS.sel[1] ||
    filters.categories.size > 0
  const activeFilterCount =
    (filters.tone !== 'all' ? 1 : 0) +
    (filters.penRange[0] !== INTEREST_BOUNDS.pen[0] ||
    filters.penRange[1] !== INTEREST_BOUNDS.pen[1]
      ? 1
      : 0) +
    (filters.selRange[0] !== INTEREST_BOUNDS.sel[0] ||
    filters.selRange[1] !== INTEREST_BOUNDS.sel[1]
      ? 1
      : 0) +
    (filters.categories.size > 0 ? 1 : 0)

  const clearAllFilters = () => {
    setFilters(buildInterestDefaults())
    bumpResetToken()
  }

  return (
    <div
      id="report-section-panel-interests"
      role="tabpanel"
      aria-labelledby="report-section-tab-interests"
    >
      <UniversalSearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search categories across all interests…"
        ariaLabel="Search categories across all interests"
        isSearching={isSearching}
        totalMatches={totalMatches}
        filterSlot={
          <InterestsFilterControl
            filters={filters}
            setFilters={setFilters}
            bounds={INTEREST_BOUNDS}
            categoryOptions={INTEREST_PARENT_OPTIONS}
            resetKey={resetToken}
            bumpResetToken={bumpResetToken}
            activeFilterCount={activeFilterCount}
          />
        }
        actions={<ExportDownloadMenu />}
      />
      {/* Active filter chips — same component the brands workspace
          uses, just pointed at the interests filter state. The
          chip strip sits flush under the search bar so the user
          always sees what's narrowing the table without having
          to re-open the popover. */}
      <FilterChips
        domainId="interests"
        filters={filters}
        setFilters={setFilters}
        bounds={INTEREST_BOUNDS}
        categoryOptions={INTEREST_PARENT_OPTIONS}
        bumpResetToken={bumpResetToken}
      />
      <TopicsView
        query={query}
        setQuery={setQuery}
        sortBy={sortBy}
        direction={direction}
        onSortChange={onSortChange}
        activeInterestId={activeInterestId}
        setActiveInterestId={setActiveInterestId}
        compactToolbar
        filters={filters}
        setFilters={setFilters}
        hasActiveFullFilter={hasActiveFilter}
        onClearFullFilters={clearAllFilters}
        /* Rail tuning: idle view shows the top 5 most differentiating
           interests (tightens Miller's 7±2 to 5±0 for first glance),
           and "Show all 25" compacts row height so the full list fits
           the column without a vertical scroll mile. */
        railTopN={5}
        compactExpanded
        hideToolbar
      />
    </div>
  )
}

/* -------------------------------------------------------------
   Section router — picks the workspace for the active section.
   Real workspaces: brands-influence + interests. Everything else
   is a placeholder so the chrome still feels complete.
------------------------------------------------------------- */
function SectionPanel({ sectionId }) {
  if (sectionId === 'brands-influence') return <BrandsInfluenceWorkspace />
  if (sectionId === 'interests') return <InterestsWorkspace />
  return <ReportSectionPlaceholder sectionId={sectionId} />
}

/* -------------------------------------------------------------
   AppShell — top-level layout
   Spec recap:
   · Single TitanNavbar (Audiense logo only).
   · Mandatory breadcrumb strip below the navbar.
   · Page header lifted from better-di-in (title + audience legend).
   · Report-section nav with the new unified tab order.
   · Default landing section: "Brands & influence" (per spec).
------------------------------------------------------------- */
export default function AppShell() {
  const [reportSection, setReportSection] = useState('brands-influence')

  /* Breadcrumb trail above the page header. The last segment is
     the report section the user is currently on, so the trail
     stays meaningful as they pivot between Brands & influence and
     Interests inside the same audience. Each crumb resolves to a
     real target in the monorepo via NAV_TARGETS — so the trail
     stops being decorative chrome and becomes a working
     navigation model for review. */
  const breadcrumbItems = [
    {
      id: 'home',
      label: 'Home',
      onPress: () => navigateUp(NAV_TARGETS.home),
    },
    {
      id: 'project',
      label: TOPICS_REPORT_META.project,
      onPress: () => navigateUp(NAV_TARGETS.project),
    },
    {
      id: 'audience-context',
      label: TOPICS_REPORT_META.audienceContext,
      onPress: () => navigateUp(NAV_TARGETS.audienceContext),
    },
    {
      id: 'audience',
      label: BDI_REPORT_META.audience,
      onPress: () => navigateUp(NAV_TARGETS.audience),
    },
  ]

  return (
    <div className="bdi-app topics-app improving-di titan-app-root">
      <TitanNavbar logoAlt="Digital Intelligence for Meta" />
      <AppBreadcrumb
        items={breadcrumbItems}
        currentLabel={sectionLabel(reportSection)}
      />
      <main className="bdi-main">
        <PageHeader />
        <ReportSectionNav value={reportSection} onChange={setReportSection} />
        <SectionPanel sectionId={reportSection} />
      </main>
    </div>
  )
}
