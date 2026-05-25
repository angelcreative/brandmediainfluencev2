import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button as RacButton,
  Dialog,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Switch,
} from 'react-aria-components'
import {
  TitanBadgeAnchor,
  TitanButton,
  TitanCell,
  TitanCheckboxField,
  TitanColumn,
  TitanIconButton,
  TitanInputField,
  TitanNavbar,
  TitanPagination,
  TitanPill,
  TitanRangeSlider,
  TitanRow,
  TitanTable,
  TitanTableBody,
  TitanTableHeader,
  TitanTabs,
  TitanTooltip,
} from 'titan-compositions'
import { ScatterChart } from '@mui/x-charts/ScatterChart'
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine'
import {
  ChartsTooltipContainer,
  useItemTooltip,
} from '@mui/x-charts/ChartsTooltip'
import { useSeries } from '@mui/x-charts/hooks'
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Info,
  Search,
  SlidersHorizontal,
  User,
  X,
  ZoomIn,
} from 'lucide-react'

import { DOMAINS, REPORT_META } from '../data/audienceData.js'
import { prepareBrandRelationshipDomain } from '../lib/brandRelationshipDomain.js'
import {
  appendInsufficientSignalCategory,
  isInsufficientSignalCategory,
} from '../lib/insufficientSignalCategory.js'
import { prepareMediaDomain } from '../lib/mediaDomain.js'
import { getPageLogomarkAssignments } from '../lib/untitledLogomarkAssignments.js'

function prepareDomainView(domain) {
  let view = domain
  if (domain.id === 'brands-relationship') {
    view = prepareBrandRelationshipDomain(domain)
  } else if (domain.id === 'media') {
    view = prepareMediaDomain(domain)
  }
  return appendInsufficientSignalCategory(view)
}

/* -------------------------------------------------------------
   Constants & helpers
------------------------------------------------------------- */
const COLOR = {
  over: 'var(--color-aquamarine-600)',
  neutral: 'var(--color-steel-400)',
  under: 'var(--color-tomato-600)',
}

function direction(sel) {
  if (sel >= 1.05) return 'over'
  if (sel <= 0.95) return 'under'
  return 'neutral'
}

function pillState(sel) {
  if (sel >= 1.2) return 'success'
  if (sel < 0.8) return 'error'
  return 'base'
}

/* Column header info — must use RacButton (or Focusable) inside TitanTooltip:
   TooltipTrigger puts hover/focus on FocusableContext; native <button> does
   not read that context, so tooltips never open.

   Important: do NOT chain stopPropagation handlers on pointer/mouse/focus
   events of this RacButton. react-aria's useButton + useHover register
   those same events via useContextProps; mixing our handlers with theirs
   in some React 19 + react-aria 1.17 combos prevents the trigger props
   from wiring up and the tooltip never opens.
   The only event we need to block from the sortable <th> is the click
   itself — and we wrap the button in a <span> that captures click/keydown
   so the parent <th> press handler doesn't steal the interaction. The
   span doesn't intercept pointer/focus events, so the tooltip works. */
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

function flattenItems(domain) {
  return domain.categories.flatMap((cat) =>
    cat.items.map((item) => ({
      ...item,
      category: item.mediaGroupLabel ?? cat.title,
      categoryId: cat.id,
    })),
  )
}

/* Audience size used to estimate absolute reach from penetration.
   Sourced from REPORT_META.target ("599.8K"). Hardcoded here to
   avoid having to parse the formatted string at runtime. */
const AUDIENCE_SIZE = 599_800

/* Baseline universe size — the comparison group affinity is scored
   against. Hardcoded for the demo because the sample dataset only
   ships the audience side; the legend in the page header needs an
   exact figure so we surface it as a real number, not compact. */
const BENCHMARK_SIZE = 25_400_000

const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
function formatAbbr(n) {
  if (!Number.isFinite(n) || n <= 0) return '—'
  return compactNumber.format(n)
}

function formatAudienceCount(n) {
  if (!Number.isFinite(n) || n < 0) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function AvatarNameCell({ name, logoSrc }) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [logoSrc])

  const showImg = Boolean(logoSrc) && !broken

  return (
    <span className="bdi-row-name-cell">
      <span className="bdi-row-avatar" aria-hidden>
        {showImg ? (
          <img
            src={logoSrc}
            alt=""
            className="bdi-row-avatar__img bdi-row-avatar__img--logomark"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="bdi-row-avatar__initials">{initialsFromName(name)}</span>
        )}
      </span>
      <span className="bdi-row-name">{name}</span>
    </span>
  )
}

/* Enrich every item in a domain with the columns the flat table
   needs: benchmark penetration (derived from sel = pen / benchPen),
   and an absolute reach value (audience size × pen). */
function buildDomainRows(filteredDomain) {
  return filteredDomain.categories.flatMap((cat) =>
    cat.items.map((item) => {
      const benchmarkPen = item.sel > 0 ? item.pen / item.sel : 0
      return {
        ...item,
        categoryId: cat.id,
        category: item.mediaGroupLabel ?? cat.title,
        benchmarkPen,
        reach: Math.round((item.pen / 100) * AUDIENCE_SIZE),
        benchReach: Math.round((benchmarkPen / 100) * AUDIENCE_SIZE),
      }
    }),
  )
}

/** One row per taxonomy category (weighted penetration / Affinity / reach sum). */
function buildCategorySummaryRows(filteredDomain) {
  const out = []
  for (const cat of filteredDomain.categories) {
    if (cat.insufficientSignal && !cat.items.length) {
      out.push({
        rowKind: 'categorySummary',
        insufficientSignal: true,
        name: cat.title,
        categoryId: cat.id,
        pen: 0,
        sel: 0,
        benchmarkPen: 0,
        reach: 0,
        benchReach: 0,
        entities: 0,
      })
      continue
    }
    if (!cat.items.length) continue
    const items = cat.items.map((item) => ({
      ...item,
      categoryId: cat.id,
      category: item.mediaGroupLabel ?? cat.title,
      benchmarkPen: item.sel > 0 ? item.pen / item.sel : 0,
      reach: Math.round((item.pen / 100) * AUDIENCE_SIZE),
    }))
    const totalReach = items.reduce((s, i) => s + i.reach, 0) || 1
    const aggPen =
      items.reduce((s, i) => s + i.pen * i.reach, 0) / totalReach
    const aggBench =
      items.reduce((s, i) => s + i.benchmarkPen * i.reach, 0) / totalReach
    const aggSel = aggBench > 0 ? aggPen / aggBench : 0
    out.push({
      rowKind: 'categorySummary',
      name: cat.title,
      categoryId: cat.id,
      pen: aggPen,
      sel: aggSel,
      benchmarkPen: aggBench,
      reach: Math.round(totalReach),
      benchReach: Math.round((aggBench / 100) * AUDIENCE_SIZE),
      entities: items.length,
    })
  }
  return out
}

function buildDrillRows(filteredDomain, categoryId) {
  const cat = filteredDomain.categories.find((c) => c.id === categoryId)
  if (!cat?.items?.length) return []
  return buildDomainRows({ ...filteredDomain, categories: [cat] })
}

/** When the table is in group-by-category summary, list filters use aggregated row metrics. */
function categorySummaryRowPassesListFilters(row, filters) {
  if (row.insufficientSignal) return true
  if (row.pen < filters.penRange[0] || row.pen > filters.penRange[1]) return false
  if (row.sel < filters.selRange[0] || row.sel > filters.selRange[1]) return false
  if (filters.tone === 'over' && row.sel < 1.2) return false
  if (filters.tone === 'under' && row.sel >= 0.8) return false
  if (filters.tone === 'benchmark' && (row.sel < 0.8 || row.sel >= 1.2)) return false
  return true
}

/* -------------------------------------------------------------
   Page header + report section nav (Sociodemo … Interests … AI chat)
------------------------------------------------------------- */
const REPORT_SECTION_TABS_ORANGE = [
  { id: 'sociodemo', label: 'Sociodemo' },
  { id: 'topics', label: 'Topics' },
  { id: 'maps', label: 'Maps' },
  { id: 'persona', label: 'Persona overview' },
  { id: 'segmentation', label: 'Segmentation' },
]

const REPORT_SECTION_TABS_BLUE = [
  { id: 'lifestyle', label: 'Lifestyle profile' },
  { id: 'interests', label: 'Interests' },
  { id: 'ai-chat', label: 'AI chat' },
]

const REPORT_SECTION_TABS = [
  ...REPORT_SECTION_TABS_ORANGE,
  ...REPORT_SECTION_TABS_BLUE,
]

function ReportSectionTab({ tab, selected, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      id={`report-section-tab-${tab.id}`}
      aria-selected={selected}
      aria-controls={tab.id === 'interests' ? 'report-section-interests' : undefined}
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
  const label =
    REPORT_SECTION_TABS.find((t) => t.id === sectionId)?.label ?? sectionId
  return (
    <section
      className="bdi-report-section-placeholder"
      aria-labelledby="bdi-report-section-placeholder-title"
    >
      <h2 id="bdi-report-section-placeholder-title">{label}</h2>
      <p>This section is not included in this preview.</p>
    </section>
  )
}

/* -------------------------------------------------------------
   AudienceLegend — the chip pair below the page subhead.
   Each chip is a TitanButton (variant="text") that opens an
   anchored popover (NOT a modal dialog) with the audience or
   baseline definition. The popover has only an X close affordance
   in its corner — no footer button, no dividers — so it reads as a
   lightweight definition card. Both popovers can stay open at the
   same time: when the user opens the second one, we tell the first
   popover's shouldCloseOnInteractOutside to ignore the click as
   long as it lands on the other trigger or other popover.
------------------------------------------------------------- */
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
  const popoverId = `bdi-audience-legend-${variant}-popover`
  /* TitanButton doesn't forward refs to the underlying DOM button,
     so we anchor the Popover to a wrapping <span> — same pattern the
     filter toolbar uses for its TitanIconButton + Popover pair. */
  return (
    <>
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

  /* Default behaviour of react-aria's Popover is to close on any
     outside click. That would mean opening the second chip closes
     the first one — but the user wants both open at the same time
     so they can compare definitions side by side. We override
     shouldCloseOnInteractOutside so a click on the OTHER trigger or
     anywhere inside the OTHER popover never dismisses this one.
     Everything else (true outside, Esc) closes normally. */
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
  'Brand, media and influencers — what this audience over- and under-indexes against benchmark.'

function PageHeader() {
  return (
    <header className="bdi-header">
      <div className="bdi-header__title">
        <div className="bdi-header__title-row">
          <TitanIconButton
            variant="ghost"
            className="bdi-header__back"
            aria-label="Back to reports"
            onPress={() => window.history.back()}
          >
            <ArrowLeft size={18} aria-hidden />
          </TitanIconButton>
          <h1>{REPORT_META.audience}</h1>
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
   Labeled Quadrant Scatter — color by category, dot/bubble modes,
   persistent labels with leader lines, brush zoom, search, filter.
   Series strategy:
   · Dot mode  → 1 series per category (uniform marker size)
   · Bubble mode → up to 4 size buckets per category (markerSize
     scales with penetration so bubble area carries magnitude)
   · Each series gets the category's brand-tone color so categories
     become identifiable at a glance — no more clicking each dot.
------------------------------------------------------------- */
const SCATTER_MARGIN = { top: 16, right: 24, bottom: 60, left: 60 }
const SCATTER_HEIGHT = 460

/* Reds (tomato, pomegranate) are intentionally excluded from the
   category palette: red is already a semantic signal in this app
   (under-indexed pills, tomato benchmark gradient) and reusing it
   for a neutral category — e.g. "Football Players" — creates a
   false negative association. Categories carry no value judgement,
   so they pull from the cool/warm-but-not-red end of the Titan
   palette only. */
const CATEGORY_TONES = [
  'indigo',
  'aquamarine',
  'blueberry',
  'violet',
  'mango',
  'ocean',
  'magenta',
  'teal',
]

function getCategoryTone(idx) {
  return CATEGORY_TONES[idx % CATEGORY_TONES.length]
}

function bubbleRadiusFor(pen, penMax) {
  const t = penMax > 0 ? pen / penMax : 0
  return 6 + Math.sqrt(Math.max(0, t)) * 22
}

function scatterPointPayload(i, catTitle, idx, id) {
  const benchPen = i.sel > 0 ? i.pen / i.sel : 0
  const reach = Math.round((i.pen / 100) * AUDIENCE_SIZE)
  const benchReach = Math.round((benchPen / 100) * AUDIENCE_SIZE)
  return {
    x: i.pen,
    y: i.sel,
    id,
    name: i.name,
    category: catTitle,
    benchmarkPen: benchPen,
    reach,
    benchReach,
  }
}

function buildScatterSeries(items, categories, mode, penMax) {
  const out = []
  if (mode === 'dot') {
    for (const cat of categories) {
      const points = items
        .filter((i) => i.categoryId === cat.id)
        .map((i, idx) =>
          scatterPointPayload(i, cat.title, idx, `${i.categoryId}-${idx}`),
        )
      if (!points.length) continue
      out.push({
        type: 'scatter',
        id: cat.id,
        data: points,
        color: cat.color,
        markerSize: 6,
        label: cat.title,
        valueFormatter: () => '',
      })
    }
    return out
  }

  const buckets = [
    { id: 's', size: 7, test: (p) => p < 5 },
    { id: 'm', size: 11, test: (p) => p >= 5 && p < 15 },
    { id: 'l', size: 16, test: (p) => p >= 15 && p < 30 },
    { id: 'xl', size: 22, test: (p) => p >= 30 },
  ]
  for (const cat of categories) {
    for (const b of buckets) {
      const points = items
        .filter((i) => i.categoryId === cat.id && b.test(i.pen))
        .map((i, idx) =>
          scatterPointPayload(
            i,
            cat.title,
            idx,
            `${i.categoryId}-${b.id}-${idx}`,
          ),
        )
      if (!points.length) continue
      out.push({
        type: 'scatter',
        id: `${cat.id}-${b.id}`,
        data: points,
        color: cat.color,
        markerSize: b.size,
        label: cat.title,
        valueFormatter: () => '',
      })
    }
  }
  return out
}

function pickMustShowKeys(items) {
  const keys = new Set()
  const overTop = [...items]
    .filter((i) => i.sel > 1.05)
    .sort((a, b) => b.sel - a.sel || b.pen - a.pen)
    .slice(0, 3)
  const underTop = [...items]
    .filter((i) => i.sel < 0.95)
    .sort((a, b) => a.sel - b.sel || b.pen - a.pen)
    .slice(0, 3)
  const benchTop = [...items]
    .filter((i) => i.sel >= 0.95 && i.sel <= 1.05)
    .sort((a, b) => b.pen - a.pen)
    .slice(0, 2)
  for (const it of [...overTop, ...underTop, ...benchTop]) {
    keys.add(`${it.categoryId}-${it.name}`)
  }
  return keys
}

function rankItemsForLabels(items, mustShow, penMax) {
  return [...items].sort((a, b) => {
    const aMust = mustShow.has(`${a.categoryId}-${a.name}`)
    const bMust = mustShow.has(`${b.categoryId}-${b.name}`)
    if (aMust !== bMust) return aMust ? -1 : 1
    const aScore = Math.abs(a.sel - 1) * 30 + (a.pen / penMax) * 22
    const bScore = Math.abs(b.sel - 1) * 30 + (b.pen / penMax) * 22
    return bScore - aScore
  })
}

const TOP_CHART_POINT_CAP = 40

/** Subset for chart "Top" mode: highest-signal items (same ranking as labels). */
function topChartSlice(items, penMax) {
  if (items.length <= TOP_CHART_POINT_CAP) return items
  const ranked = rankItemsForLabels(items, new Set(), penMax)
  const keep = new Set(
    ranked
      .slice(0, TOP_CHART_POINT_CAP)
      .map((i) => `${i.categoryId}-${i.name}`),
  )
  return items.filter((i) => keep.has(`${i.categoryId}-${i.name}`))
}

/** Up to `cap` strongest rows per interest category (for "Top" comparisons). */
function topChartSlicePerCategory(items, penMax, cap = TOP_CHART_POINT_CAP) {
  const byCat = new Map()
  for (const i of items) {
    if (!byCat.has(i.categoryId)) byCat.set(i.categoryId, [])
    byCat.get(i.categoryId).push(i)
  }
  const keep = new Set()
  for (const arr of byCat.values()) {
    if (!arr.length) continue
    const ranked = rankItemsForLabels(arr, new Set(), penMax)
    for (const i of ranked.slice(0, Math.min(cap, ranked.length))) {
      keep.add(`${i.categoryId}-${i.name}`)
    }
  }
  return items.filter((i) => keep.has(`${i.categoryId}-${i.name}`))
}

const LANDSCAPE_CHART_TITLE = {
  'brands-relationship': 'Brand · Target size × Affinity',
  media: 'Media · Target size × Affinity',
  influence: 'Influence · Target size × Affinity',
}

const LANDSCAPE_CHART_SUB = (() => {
  const cap = TOP_CHART_POINT_CAP
  return {
    'brands-relationship':
      `Each bubble is one row from the Brand tab — the same entity as the Name column in the item table. Horizontal position is target size (% of audience); vertical position is Affinity (dashed line at 1.00×). Color groups rows by their interest category. Top shows up to ${cap} of the strongest signals (single list) or up to ${cap} per interest category; All plots every row that passes your filters. Table "Group by category" only changes the table; this chart always stays at row level.`,
    media:
      `Each bubble is one row from the Media tab — the same entity as the Name column when the table is not grouped. Horizontal position is target size (%); vertical position is Affinity (dashed line at 1.00×). Color reflects format or category. Top shows up to ${cap} (single list) or up to ${cap} per category; All plots every filtered row. Table "Group by category" only changes the table; this chart always stays at row level.`,
    influence:
      `Each bubble is one row from the Influence tab — the same entity as the Name column when the table is not grouped. Horizontal position is target size (%); vertical position is Affinity (dashed line at 1.00×). Color reflects audience size or category. Top shows up to ${cap} (single list) or up to ${cap} per category; All plots every filtered row. Table "Group by category" only changes the table; this chart always stays at row level.`,
  }
})()

/* -------------------------------------------------------------
   Scatter chart — custom tooltip (bubble hover)
   Same item as table: name + category + target size % · Affinity.
------------------------------------------------------------- */

function LandscapeTooltipContent() {
  const itemTooltip = useItemTooltip()
  const series = useSeries()
  if (!itemTooltip) return null

  const { identifier } = itemTooltip
  const seriesEntry = series.scatter?.series?.[identifier.seriesId]
  const point = seriesEntry?.data?.[identifier.dataIndex]
  if (!point) return null

  const penT = point.x.toFixed(1)
  const benchPen =
    typeof point.benchmarkPen === 'number' && Number.isFinite(point.benchmarkPen)
      ? point.benchmarkPen.toFixed(1)
      : '—'
  const reach = formatAudienceCount(point.reach)
  const benchReach = formatAudienceCount(point.benchReach)
  const tmlFinite = typeof point.y === 'number' && Number.isFinite(point.y)
  const tmlDisplay = tmlFinite ? `${point.y.toFixed(2)}×` : '—'

  return (
    <div className="bdi-tooltip bdi-tooltip--bubble bdi-tooltip--bubble-rich" role="tooltip">
      <p className="bdi-tooltip__title">{point.name}</p>
      {point.category ? (
        <p className="bdi-tooltip__cat bdi-tooltip__cat--bubble">{point.category}</p>
      ) : null}
      <ul className="bdi-tooltip__stats">
        <li className="bdi-tooltip__stat">
          <span
            className="bdi-tooltip__stat-pill bdi-tooltip__stat-pill--target"
            aria-hidden
          />
          <div className="bdi-tooltip__stat-main">
            <span className="bdi-tooltip__stat-label">Target size:</span>{' '}
            <strong className="bdi-tooltip__stat-value">
              {penT}% – {reach}
            </strong>
          </div>
          <User className="bdi-tooltip__stat-icon" size={14} strokeWidth={1.75} aria-hidden />
        </li>
        <li className="bdi-tooltip__stat">
          <span
            className="bdi-tooltip__stat-pill bdi-tooltip__stat-pill--benchmark"
            aria-hidden
          />
          <div className="bdi-tooltip__stat-main">
            <span className="bdi-tooltip__stat-label">Benchmark size:</span>{' '}
            <strong className="bdi-tooltip__stat-value">
              {benchPen}% – {benchReach}
            </strong>
          </div>
          <User className="bdi-tooltip__stat-icon" size={14} strokeWidth={1.75} aria-hidden />
        </li>
        <li className="bdi-tooltip__stat bdi-tooltip__stat--tml">
          <span
            className="bdi-tooltip__stat-pill bdi-tooltip__stat-pill--empty"
            aria-hidden
          />
          <div className="bdi-tooltip__stat-main">
            <span className="bdi-tooltip__stat-label">Affinity</span>
            {tmlFinite ? (
              <TitanPill state={pillState(point.y)} tone="emphasis">
                {point.y.toFixed(2)}×
              </TitanPill>
            ) : (
              <strong className="bdi-tooltip__stat-value">—</strong>
            )}
          </div>
          <span className="bdi-tooltip__stat-icon-slot" aria-hidden />
        </li>
      </ul>
      <span className="bdi-tooltip__sr">
        {point.name}. Target size {penT} percent, audience {reach}. Benchmark size{' '}
        {benchPen} percent, audience {benchReach}. Affinity {tmlDisplay}.
      </span>
    </div>
  )
}

function LandscapeTooltip(props) {
  return (
    <ChartsTooltipContainer
      {...props}
      trigger="item"
      sx={{ zIndex: 20050 }}
    >
      <LandscapeTooltipContent />
    </ChartsTooltipContainer>
  )
}

/* -------------------------------------------------------------
   LabelOverlay — persistent labels with collision-aware placement
   and leader lines. Renders inside the chart wrap as a single SVG
   sized to the wrap's bounding box, so coordinates stay aligned
   with the underlying ScatterChart even on resize.
   Placement strategy:
   1. Sort items by priority (must-show first, then score).
   2. For each item, try 12 anchor candidates around the point —
      4 close (top/right/bottom/left), 4 diagonal, 4 far (with leader
      line). Boundary-check + collision-check vs already-placed
      labels; first non-colliding wins.
   3. If even the far candidates collide and the item is forced
      (search match or top-must-show), keep the first far candidate
      and draw a leader line so it is not silently dropped.
------------------------------------------------------------- */
function LabelOverlay({
  entries,
  xMin,
  xMax,
  yMin,
  yMax,
  mode,
  penMax,
}) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!ref.current) return
    const node = ref.current
    const ro = new ResizeObserver((rs) => {
      for (const r of rs) setWidth(r.contentRect.width)
    })
    ro.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  if (!width) {
    return (
      <svg
        ref={ref}
        className="bdi-chart-overlay"
        aria-hidden
      />
    )
  }

  const plotW = Math.max(0, width - SCATTER_MARGIN.left - SCATTER_MARGIN.right)
  const plotH = Math.max(
    0,
    SCATTER_HEIGHT - SCATTER_MARGIN.top - SCATTER_MARGIN.bottom,
  )

  const charW = 6.4
  const labelH = 18
  const placed = []
  const out = []

  for (const { item, force, match } of entries) {
    const px =
      SCATTER_MARGIN.left + ((item.pen - xMin) / (xMax - xMin)) * plotW
    const py =
      SCATTER_MARGIN.top +
      (1 - (item.sel - yMin) / (yMax - yMin)) * plotH
    if (px < SCATTER_MARGIN.left - 4 || px > SCATTER_MARGIN.left + plotW + 4) continue
    if (py < SCATTER_MARGIN.top - 4 || py > SCATTER_MARGIN.top + plotH + 4) continue

    const r = mode === 'bubble' ? bubbleRadiusFor(item.pen, penMax) : 5
    const text =
      item.name.length > 22 ? `${item.name.slice(0, 21)}\u2026` : item.name
    const labelW = Math.min(180, Math.max(28, text.length * charW + 12))

    const candidates = [
      { dx: 0, dy: -(r + 6 + labelH / 2), anchor: 'middle', leader: false },
      { dx: r + 6, dy: 0, anchor: 'start', leader: false },
      { dx: -(r + 6), dy: 0, anchor: 'end', leader: false },
      { dx: 0, dy: r + 6 + labelH / 2, anchor: 'middle', leader: false },
      { dx: r + 6, dy: -(r + 4), anchor: 'start', leader: false },
      { dx: -(r + 6), dy: -(r + 4), anchor: 'end', leader: false },
      { dx: r + 6, dy: r + 4, anchor: 'start', leader: false },
      { dx: -(r + 6), dy: r + 4, anchor: 'end', leader: false },
      { dx: 0, dy: -(r + 22 + labelH / 2), anchor: 'middle', leader: true },
      { dx: 0, dy: r + 22 + labelH / 2, anchor: 'middle', leader: true },
      { dx: r + 22, dy: 0, anchor: 'start', leader: true },
      { dx: -(r + 22), dy: 0, anchor: 'end', leader: true },
    ]

    let chosen = null
    for (const c of candidates) {
      const cx = px + c.dx
      const cy = py + c.dy
      const left =
        c.anchor === 'middle'
          ? cx - labelW / 2
          : c.anchor === 'start'
            ? cx
            : cx - labelW
      const right = left + labelW
      const top = cy - labelH / 2
      const bottom = cy + labelH / 2
      if (left < 4 || right > width - 4) continue
      if (top < 4 || bottom > SCATTER_HEIGHT - 4) continue
      if (left < SCATTER_MARGIN.left - 6) continue
      if (right > width - SCATTER_MARGIN.right + 6) continue
      const overlaps = placed.some(
        (p) =>
          left < p.right - 1 &&
          right > p.left + 1 &&
          top < p.bottom - 1 &&
          bottom > p.top + 1,
      )
      if (!overlaps) {
        chosen = { ...c, cx, cy, left, right, top, bottom }
        break
      }
    }

    if (!chosen && force) {
      const c = candidates[8]
      const cx = px + c.dx
      const cy = py + c.dy
      chosen = {
        ...c,
        cx,
        cy,
        left: cx - labelW / 2,
        right: cx + labelW / 2,
        top: cy - labelH / 2,
        bottom: cy + labelH / 2,
      }
    }
    if (!chosen) continue
    placed.push(chosen)
    out.push({ item, px, py, r, text, labelW, force, match, ...chosen })
  }

  return (
    <svg
      ref={ref}
      className="bdi-chart-overlay"
      viewBox={`0 0 ${width} ${SCATTER_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {out
        .filter((l) => l.leader)
        .map((l) => (
          <line
            key={`ll-${l.item.categoryId}-${l.item.name}`}
            x1={l.px}
            y1={l.py}
            x2={l.cx}
            y2={l.cy}
            className="bdi-chart-leader"
          />
        ))}
      {out.map((l) => (
        <g
          key={`lb-${l.item.categoryId}-${l.item.name}`}
          className={`bdi-chart-label-g${l.match ? ' is-match' : ''}${
            l.force ? ' is-force' : ''
          }`}
        >
          <rect
            x={l.left}
            y={l.top}
            width={l.labelW}
            height={labelH}
            rx="9"
            ry="9"
            className="bdi-chart-label-bg"
          />
          <text
            x={
              l.anchor === 'middle'
                ? l.cx
                : l.anchor === 'start'
                  ? l.left + 6
                  : l.right - 6
            }
            y={l.cy + 3.5}
            textAnchor={l.anchor}
            className="bdi-chart-label-text"
          >
            {l.text}
          </text>
        </g>
      ))}
      {out
        .filter((l) => l.match)
        .map((l) => (
          <circle
            key={`hi-${l.item.categoryId}-${l.item.name}`}
            cx={l.px}
            cy={l.py}
            r={l.r + 5}
            className="bdi-chart-match-ring"
          />
        ))}
    </svg>
  )
}

/* -------------------------------------------------------------
   ZoomBrush — click-and-drag a rectangle on the chart to zoom into
   that area. Lives as a sibling overlay so it doesn't intercept
   pointer events while inactive (zoomEnabled=false). Coordinates
   are converted from pixels to data domain on mouse-up so the
   parent can update axis min/max.
------------------------------------------------------------- */
function ZoomBrush({ enabled, xMin, xMax, yMin, yMax, onZoom }) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  const [drag, setDrag] = useState(null)

  useEffect(() => {
    if (!ref.current) return
    const node = ref.current
    const ro = new ResizeObserver((rs) => {
      for (const r of rs) setWidth(r.contentRect.width)
    })
    ro.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  if (!enabled) {
    return <div ref={ref} className="bdi-zoom-brush" aria-hidden />
  }
  const plotW = Math.max(0, width - SCATTER_MARGIN.left - SCATTER_MARGIN.right)
  const plotH = Math.max(0, SCATTER_HEIGHT - SCATTER_MARGIN.top - SCATTER_MARGIN.bottom)

  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v))

  function localPoint(e) {
    const rect = ref.current.getBoundingClientRect()
    return {
      x: clamp(e.clientX - rect.left, SCATTER_MARGIN.left, SCATTER_MARGIN.left + plotW),
      y: clamp(e.clientY - rect.top, SCATTER_MARGIN.top, SCATTER_MARGIN.top + plotH),
    }
  }
  function onDown(e) {
    if (e.button !== 0) return
    e.preventDefault()
    const p = localPoint(e)
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
  }
  function onMove(e) {
    if (!drag) return
    const p = localPoint(e)
    setDrag({ ...drag, x1: p.x, y1: p.y })
  }
  function onUp() {
    if (!drag) return
    const dx = Math.abs(drag.x1 - drag.x0)
    const dy = Math.abs(drag.y1 - drag.y0)
    if (dx >= 8 && dy >= 8) {
      const minX = Math.min(drag.x0, drag.x1)
      const maxX = Math.max(drag.x0, drag.x1)
      const minY = Math.min(drag.y0, drag.y1)
      const maxY = Math.max(drag.y0, drag.y1)
      const xLo = ((minX - SCATTER_MARGIN.left) / plotW) * (xMax - xMin) + xMin
      const xHi = ((maxX - SCATTER_MARGIN.left) / plotW) * (xMax - xMin) + xMin
      const yHi = (1 - (minY - SCATTER_MARGIN.top) / plotH) * (yMax - yMin) + yMin
      const yLo = (1 - (maxY - SCATTER_MARGIN.top) / plotH) * (yMax - yMin) + yMin
      onZoom({ xMin: xLo, xMax: xHi, yMin: yLo, yMax: yHi })
    }
    setDrag(null)
  }

  const rect = drag
    ? {
        x: Math.min(drag.x0, drag.x1),
        y: Math.min(drag.y0, drag.y1),
        w: Math.abs(drag.x1 - drag.x0),
        h: Math.abs(drag.y1 - drag.y0),
      }
    : null

  return (
    <div
      ref={ref}
      className="bdi-zoom-brush is-active"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={() => setDrag(null)}
    >
      {rect && (
        <div
          className="bdi-zoom-brush__rect"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
        />
      )}
    </div>
  )
}

function itemInScatterViewport(i, xMin, xMax, yMin, yMax) {
  const eps = 1e-6
  return (
    i.pen >= xMin - eps &&
    i.pen <= xMax + eps &&
    i.sel >= yMin - eps &&
    i.sel <= yMax + eps
  )
}

function LandscapeChart({ domain, domainId }) {
  const allItems = useMemo(() => flattenItems(domain), [domain])

  const categories = useMemo(() => {
    const idsWithItems = new Set(allItems.map((i) => i.categoryId))
    const list = domain.categories.filter((c) => idsWithItems.has(c.id))
    return list.map((cat, i) => {
      const tone = getCategoryTone(i)
      return {
        id: cat.id,
        title: cat.title,
        tone,
        color: `var(--color-${tone}-600)`,
        soft: `var(--color-${tone}-300)`,
      }
    })
  }, [domain, allItems])

  /* Bubble mode is the only mode now: marker size carries penetration
     so the chart conveys two facts visually (position + magnitude)
     without an extra control. The "Dots / Bubbles" toggle was
     removed because Bubbles already encodes everything Dots did
     and one less control reduces decision overhead for the user. */
  const mode = 'bubble'
  const [maxLabels, setMaxLabels] = useState(6)
  const [query, setQuery] = useState('')
  const [showAllPoints, setShowAllPoints] = useState(false)
  const [topPerCategory, setTopPerCategory] = useState(false)
  const [zoomEnabled, setZoomEnabled] = useState(false)
  const [zoomBox, setZoomBox] = useState(null)

  /* Reset zoom + local chart controls when the tab (domain) changes —
     not when filters change, or zoom would reset on every keystroke. */
  useEffect(() => {
    setZoomBox(null)
    setQuery('')
    setShowAllPoints(false)
    setTopPerCategory(false)
    setMaxLabels(6)
  }, [domainId])

  const penMax = useMemo(
    () => Math.max(1, ...allItems.map((i) => i.pen)),
    [allItems],
  )

  const chartItems = useMemo(() => {
    if (showAllPoints) return allItems
    if (topPerCategory) return topChartSlicePerCategory(allItems, penMax)
    return topChartSlice(allItems, penMax)
  }, [allItems, showAllPoints, topPerCategory, penMax])

  const dataXMax = useMemo(() => {
    if (!chartItems.length) return 5 * 1.05
    return Math.max(...chartItems.map((i) => i.pen), 5) * 1.05
  }, [chartItems])
  const dataYMax = useMemo(() => {
    if (!chartItems.length) return 2.45
    return Math.max(2.4, ...chartItems.map((i) => i.sel)) + 0.05
  }, [chartItems])
  const dataYMin = useMemo(() => {
    if (!chartItems.length) return 0.35
    return Math.min(0.4, ...chartItems.map((i) => i.sel)) - 0.05
  }, [chartItems])

  const xMin = zoomBox ? zoomBox.xMin : 0
  const xMax = zoomBox ? zoomBox.xMax : dataXMax
  const yMin = zoomBox ? zoomBox.yMin : dataYMin
  const yMax = zoomBox ? zoomBox.yMax : dataYMax

  const chartItemsInView = useMemo(
    () => chartItems.filter((i) => itemInScatterViewport(i, xMin, xMax, yMin, yMax)),
    [chartItems, xMin, xMax, yMin, yMax],
  )

  /** Label slider max = bubbles in current axis view (Top/All + zoom). */
  const sliderMax = chartItemsInView.length

  useEffect(() => {
    setMaxLabels((prev) => Math.min(prev, Math.max(0, sliderMax)))
  }, [sliderMax])

  const series = useMemo(
    () => buildScatterSeries(chartItems, categories, mode, penMax),
    [chartItems, categories, mode, penMax],
  )

  const mustShow = useMemo(
    () => pickMustShowKeys(chartItemsInView),
    [chartItemsInView],
  )
  const ranked = useMemo(
    () => rankItemsForLabels(chartItemsInView, mustShow, penMax),
    [chartItemsInView, mustShow, penMax],
  )

  const q = query.trim().toLowerCase()
  const matchedKeys = useMemo(() => {
    if (!q) return null
    const set = new Set()
    chartItemsInView.forEach((i) => {
      if (i.name.toLowerCase().includes(q))
        set.add(`${i.categoryId}-${i.name}`)
    })
    return set
  }, [chartItemsInView, q])

  /* Label list: matches first (in rank order), then other ranked items in the
     current viewport, capped by the slider (0 … bubbles in view). */
  const labelEntries = useMemo(() => {
    const budget = Math.min(sliderMax, Math.max(0, maxLabels))
    const entries = []
    const seen = new Set()

    if (matchedKeys) {
      for (const it of ranked) {
        if (entries.length >= budget) break
        const k = `${it.categoryId}-${it.name}`
        if (matchedKeys.has(k) && !seen.has(k)) {
          seen.add(k)
          entries.push({ item: it, force: true, match: true })
        }
      }
    }

    for (const it of ranked) {
      if (entries.length >= budget) break
      const k = `${it.categoryId}-${it.name}`
      if (seen.has(k)) continue
      seen.add(k)
      entries.push({ item: it, force: false, match: false })
    }
    return entries
  }, [ranked, matchedKeys, maxLabels, sliderMax])

  if (!allItems.length) return null

  const chartTitle =
    LANDSCAPE_CHART_TITLE[domainId] ?? LANDSCAPE_CHART_TITLE['brands-relationship']
  const chartSub =
    LANDSCAPE_CHART_SUB[domainId] ?? LANDSCAPE_CHART_SUB['brands-relationship']

  return (
    <section className="bdi-chart-card">
      <header className="bdi-chart-card__head">
        <p className="bdi-eyebrow">Landscape</p>
        <div className="bdi-chart-card__title-row">
          <h2 className="bdi-chart-card__title">{chartTitle}</h2>
          <TitanTooltip
            content={
              <span className="bdi-chart-card__tooltip-content">{chartSub}</span>
            }
            placement="bottom start"
            delay={120}
            closeDelay={80}
          >
            <RacButton
              type="button"
              className="bdi-th-info-btn"
              aria-label="How to read this chart"
              onPress={() => {}}
            >
              <Info size={14} aria-hidden />
            </RacButton>
          </TitanTooltip>
        </div>
      </header>

      <div className="bdi-chart-toolbar">
        <div className="bdi-chart-toolbar__controls">
          <div className="bdi-chart-toolbar__search">
            <TitanInputField
              className="field-root bdi-field bdi-chart-toolbar__field"
              aria-label="Search points by name"
              placeholder="Search points…"
              value={query}
              onChange={setQuery}
              startIcon={<Search size={14} aria-hidden />}
              endIcon={query ? <X size={14} aria-hidden /> : null}
              onClear={() => setQuery('')}
            />
          </div>
          <div className="bdi-chart-toolbar__zoom">
            <TitanButton
              variant={zoomEnabled ? 'primary' : 'secondary'}
              onPress={() => setZoomEnabled((z) => !z)}
              aria-pressed={zoomEnabled}
            >
              <ZoomIn size={14} aria-hidden /> Zoom
            </TitanButton>
            {zoomBox ? (
              <TitanButton variant="secondary" onPress={() => setZoomBox(null)}>
                Reset
              </TitanButton>
            ) : null}
          </div>
        </div>

        <div className="bdi-chart-toolbar__right">
          <div
            className="bdi-chart-toolbar__labels bdi-chart-toolbar__labels--inline"
            title={`Number of labels (0–${sliderMax}): same as bubbles on screen in this view. Matches fill first within your budget.`}
          >
            <label
              htmlFor="bdi-max-labels"
              className="bdi-chart-toolbar__labels-text"
            >
              Labels:{' '}
              <strong>{Math.min(maxLabels, Math.max(0, sliderMax))}</strong>
            </label>
            <input
              id="bdi-max-labels"
              type="range"
              min={0}
              max={sliderMax}
              step={1}
              value={Math.min(maxLabels, sliderMax)}
              onChange={(e) => setMaxLabels(Number(e.target.value))}
              className="bdi-chart-slider__input"
              aria-valuetext={`${Math.min(maxLabels, sliderMax)} labels`}
            />
          </div>
          <div
            className="bdi-chart-toolbar__scope"
            title="Top limits how many bubbles you see (strongest signals first). All plots every point that still passes your filters."
          >
            <span
              className={`bdi-chart-scope-label${!showAllPoints ? ' is-selected' : ''}`}
              id="bdi-chart-scope-top"
            >
              Top
            </span>
            <Switch
              className="switch-root bdi-chart-scope-switch"
              isSelected={showAllPoints}
              onChange={setShowAllPoints}
              aria-label={
                showAllPoints
                  ? 'Showing all points. Switch to Top.'
                  : 'Showing top points. Switch to All.'
              }
            >
              <span className="switch-track" aria-hidden>
                <span className="switch-thumb" />
              </span>
            </Switch>
            <span
              className={`bdi-chart-scope-label${showAllPoints ? ' is-selected' : ''}`}
              id="bdi-chart-scope-all"
            >
              All
            </span>
          </div>
          {!showAllPoints ? (
            <div
              className="bdi-chart-toolbar__top-split"
              title="Single list ranks everyone together. Per category keeps up to 40 rows inside each interest group."
            >
              <span
                className={`bdi-chart-scope-label${!topPerCategory ? ' is-selected' : ''}`}
              >
                Single list
              </span>
              <Switch
                className="switch-root bdi-chart-scope-switch"
                isSelected={topPerCategory}
                onChange={setTopPerCategory}
                aria-label={
                  topPerCategory
                    ? 'Top 40 per category. Switch to single top 40 list.'
                    : 'Single top 40 list. Switch to top 40 per category.'
                }
              >
                <span className="switch-track" aria-hidden>
                  <span className="switch-thumb" />
                </span>
              </Switch>
              <span
                className={`bdi-chart-scope-label${topPerCategory ? ' is-selected' : ''}`}
              >
                Per category
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <p className="bdi-chart-toolbar__labels-tip bdi-chart-toolbar__labels-tip--after-toolbar">
        Slider runs from 0 up to every bubble in the current view (Top vs All sets how many
        points load; zoom narrows to what is inside the axes). If your label count is higher than
        visible bubbles, every visible bubble gets a label. For more detail, use zoom or hover
        bubbles.
      </p>

      <div className={`bdi-chart-wrap${zoomEnabled ? ' is-zoom-mode' : ''}`}>
        <ScatterChart
          series={series}
          xAxis={[
            {
              label: 'Target size',
              min: xMin,
              max: xMax,
              valueFormatter: (v) => `${v}%`,
            },
          ]}
          yAxis={[
            {
              label: 'Affinity',
              min: yMin,
              max: yMax,
              valueFormatter: (v) => `${v.toFixed(2)}×`,
            },
          ]}
          height={SCATTER_HEIGHT}
          margin={SCATTER_MARGIN}
          hideLegend
          grid={{ horizontal: true, vertical: true }}
          slots={{ tooltip: LandscapeTooltip }}
        >
          <ChartsReferenceLine
            y={1}
            label="Benchmark · 1.00×"
            labelAlign="end"
            lineStyle={{
              stroke: 'var(--color-steel-500)',
              strokeDasharray: '4 4',
              strokeWidth: 1.5,
            }}
            labelStyle={{
              fill: 'var(--text-muted, var(--color-steel-600))',
              fontSize: 11,
              fontWeight: 500,
            }}
          />
        </ScatterChart>
        <LabelOverlay
          entries={labelEntries}
          xMin={xMin}
          xMax={xMax}
          yMin={yMin}
          yMax={yMax}
          mode={mode}
          penMax={penMax}
        />
        <ZoomBrush
          enabled={zoomEnabled}
          xMin={xMin}
          xMax={xMax}
          yMin={yMin}
          yMax={yMax}
          onZoom={(box) => {
            setZoomBox(box)
            setZoomEnabled(false)
          }}
        />
        {zoomEnabled ? (
          <p className="bdi-chart-zoom-hint" role="status">
            Drag a rectangle to zoom into that area
          </p>
        ) : null}
      </div>

    </section>
  )
}


/* -------------------------------------------------------------
   Domain table — one flat, borderless table per tab. Replaces the
   per-category cards + drill drawer with a single sortable table.
   Columns (granular and category drill-down): Name, Penetration & reach, Affinity, Category.
   Group-by-category summary: Category, Penetration & reach, Affinity, Entities.
   Paginated (TitanPagination).
------------------------------------------------------------- */
const DOMAIN_TABLE_PAGE_SIZE = 20

const AFFINITY_COLUMN_TOOLTIP =
  'Affinity score. How much more (or less) likely your target audience is to engage with this profile compared to the baseline audience, expressed as a multiplier (e.g. 1.37×).'

function DomainTable({
  filteredDomain,
  sortDescriptor,
  onSortChange,
  groupByCategory,
  tableDrillCategoryId,
  onDrillCategoryId,
  linkedRowKey,
  onRowLink,
  rankLayout = false,
}) {
  const tableDomainId = filteredDomain.id
  const [page, setPage] = useState(1)

  const tableMode = useMemo(() => {
    if (!groupByCategory) return 'granular'
    if (tableDrillCategoryId) return 'drill'
    return 'categories'
  }, [groupByCategory, tableDrillCategoryId])

  const rows = useMemo(() => {
    if (tableMode === 'granular') return buildDomainRows(filteredDomain)
    if (tableMode === 'drill')
      return buildDrillRows(filteredDomain, tableDrillCategoryId)
    return buildCategorySummaryRows(filteredDomain)
  }, [filteredDomain, tableMode, tableDrillCategoryId])

  const sorted = useMemo(() => {
    const dir = sortDescriptor.direction === 'ascending' ? 1 : -1
    const col = sortDescriptor.column
    const out = [...rows]
    out.sort((a, b) => {
      switch (col) {
        case 'name':
          return String(a.name).localeCompare(String(b.name)) * dir
        case 'category':
          return String(a.category ?? '').localeCompare(String(b.category ?? '')) * dir
        case 'entities':
          return ((a.entities ?? 0) - (b.entities ?? 0)) * dir
        case 'penetration':
          return (a.pen - b.pen) * dir
        case 'reach':
          return (a.reach - b.reach) * dir
        case 'tml':
        default:
          return (a.sel - b.sel) * dir
      }
    })
    return out
  }, [rows, sortDescriptor])

  const totalRows = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalRows / DOMAIN_TABLE_PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [
    sortDescriptor.column,
    sortDescriptor.direction,
    rows.length,
    tableMode,
    tableDrillCategoryId,
  ])

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pageRows = useMemo(() => {
    const start = (page - 1) * DOMAIN_TABLE_PAGE_SIZE
    return sorted.slice(start, start + DOMAIN_TABLE_PAGE_SIZE)
  }, [sorted, page])

  const nameColumnShowsAvatars =
    filteredDomain.id === 'brands-relationship' &&
    (tableMode === 'granular' || tableMode === 'drill')

  const pageLogomarks = useMemo(() => {
    if (!nameColumnShowsAvatars) return []
    return getPageLogomarkAssignments({
      page,
      rowCount: pageRows.length,
      domainId: filteredDomain.id,
    })
  }, [nameColumnShowsAvatars, page, pageRows.length, filteredDomain.id])

  const penScale = useMemo(() => {
    const all = rows.flatMap((r) => [r.pen, r.benchmarkPen])
    return Math.max(1, ...all)
  }, [rows])

  const firstColLabel = tableMode === 'categories' ? 'Category' : 'Name'
  const lastColLabel = tableMode === 'categories' ? 'Entities' : 'Category'

  if (!rows.length) return null

  const rangeStart = totalRows === 0 ? 0 : (page - 1) * DOMAIN_TABLE_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * DOMAIN_TABLE_PAGE_SIZE, totalRows)

  function rowKey(item, idx) {
    if (item.rowKind === 'categorySummary') return `cat-${item.categoryId}`
    return `${item.categoryId}-${item.name}`
  }

  function renderFirstCell(item, rowIdx) {
    if (item.rowKind === 'categorySummary') {
      return (
        <button
          type="button"
          className="bdi-link-btn bdi-table-cat-drill"
          onClick={() => onDrillCategoryId(item.categoryId)}
        >
          <span className="bdi-table-cat-drill__label">{item.name}</span>
          {item.insufficientSignal ? (
            <span className="bdi-table-cat-drill__tag">Insufficient signal</span>
          ) : null}
        </button>
      )
    }
    if (nameColumnShowsAvatars) {
      const logo = pageLogomarks[rowIdx]
      return <AvatarNameCell name={item.name} logoSrc={logo?.src} />
    }
    return (
      <span className="bdi-row-name-cell bdi-row-name-cell--plain">
        <span className="bdi-row-name">{item.name}</span>
      </span>
    )
  }

  function renderLastCell(item) {
    if (item.rowKind === 'categorySummary') {
      return <span className="bdi-num">{item.entities}</span>
    }
    return <span className="bdi-row-category">{item.category}</span>
  }

  return (
    <section
      className={`bdi-domain-table${rankLayout ? ' bdi-domain-table--rank' : ''}`}
    >
      <TitanTable
        key={tableMode}
        aria-label="Items in this domain"
        sortDescriptor={sortDescriptor}
        onSortChange={onSortChange}
        onRowAction={onRowLink ? (key) => onRowLink(String(key)) : undefined}
      >
        <TitanTableHeader>
          <TitanColumn id="name" isRowHeader allowsSorting>
            {firstColLabel}
          </TitanColumn>
          <TitanColumn id="penetration" allowsSorting numericSort className="bdi-col-penetration">
            <span className="bdi-th-with-info">
              <span>Penetration & reach</span>
              <HeaderInfo
                label="Penetration & reach"
                tooltip="First line is your audience: penetration (share) and estimated reach (people). Second line is the benchmark on the same scale."
              />
            </span>
          </TitanColumn>
          <TitanColumn id="tml" allowsSorting numericSort>
            <span className="bdi-th-with-info">
              <span>Affinity</span>
              <HeaderInfo label="What is Affinity?" tooltip={AFFINITY_COLUMN_TOOLTIP} />
            </span>
          </TitanColumn>
          <TitanColumn
            id={tableMode === 'categories' ? 'entities' : 'category'}
            allowsSorting
            numericSort={tableMode === 'categories'}
          >
            {lastColLabel}
          </TitanColumn>
        </TitanTableHeader>
        <TitanTableBody>
          {pageRows.map((item, rowIdx) => {
            const rk = rowKey(item, rowIdx)
            const fullKey = `${tableDomainId}::${rk}`
            const isLinked = linkedRowKey != null && fullKey === linkedRowKey

            if (item.insufficientSignal) {
              return (
                <TitanRow
                  key={rk}
                  id={rk}
                  textValue={String(item.name ?? '')}
                  className="bdi-table-row--insufficient"
                >
                  <TitanCell>{renderFirstCell(item, rowIdx)}</TitanCell>
                  <TitanCell className="bdi-cell-penetration">
                    <span className="bdi-table-empty-metric">—</span>
                  </TitanCell>
                  <TitanCell className="bdi-cell-affinity">
                    <span className="bdi-table-empty-metric">—</span>
                  </TitanCell>
                  <TitanCell className="bdi-num">
                    <span className="bdi-table-empty-metric">—</span>
                  </TitanCell>
                </TitanRow>
              )
            }

            const targetW = (item.pen / penScale) * 100
            const benchW = (item.benchmarkPen / penScale) * 100
            return (
              <TitanRow
                key={rk}
                id={rk}
                textValue={String(item.name ?? '')}
                className={isLinked ? 'bdi-table-row--linked' : undefined}
              >
                <TitanCell>{renderFirstCell(item, rowIdx)}</TitanCell>
                <TitanCell className="bdi-cell-penetration">
                  <div className="bdi-penreach">
                    <span className="bdi-penreach__pct bdi-num">
                      {item.pen.toFixed(2)}%
                    </span>
                    <span className="bdi-penreach__track" aria-hidden>
                      <span
                        className="bdi-penreach__fill bdi-penreach__fill--target"
                        style={{ width: `${targetW}%` }}
                      />
                    </span>
                    <span className="bdi-penreach__abs bdi-num">
                      {formatAbbr(item.reach)}
                    </span>
                    <span className="bdi-penreach__pct bdi-penreach__pct--baseline bdi-num">
                      {item.benchmarkPen.toFixed(2)}%
                    </span>
                    <span className="bdi-penreach__track" aria-hidden>
                      <span
                        className="bdi-penreach__fill bdi-penreach__fill--bench"
                        style={{ width: `${benchW}%` }}
                      />
                    </span>
                    <span className="bdi-penreach__abs bdi-penreach__abs--baseline bdi-num">
                      {formatAbbr(item.benchReach)}
                    </span>
                  </div>
                </TitanCell>
                <TitanCell className="bdi-cell-affinity">
                  <TitanPill state={pillState(item.sel)} tone="emphasis">
                    {item.sel.toFixed(2)}×
                  </TitanPill>
                </TitanCell>
                <TitanCell
                  className={
                    tableMode === 'categories' ? 'bdi-num' : undefined
                  }
                >
                  {renderLastCell(item)}
                </TitanCell>
              </TitanRow>
            )
          })}
        </TitanTableBody>
      </TitanTable>
      <footer
        className={`bdi-domain-table__footer${totalPages <= 1 ? ' bdi-domain-table__footer--single' : ''}`}
      >
        <p className="bdi-domain-table__range" aria-live="polite">
          Showing {rangeStart}–{rangeEnd} of {totalRows}
        </p>
        <div className="bdi-domain-table__pagination">
          {totalPages > 1 ? (
            <TitanPagination
              aria-label="Table pages"
              currentPage={page}
              totalPages={totalPages}
              setPage={setPage}
            />
          ) : null}
        </div>
      </footer>
    </section>
  )
}

/* -------------------------------------------------------------
   Per-tab filter taxonomies — derived deterministically from
   item.pen and the category title. Kept here (not in the data
   file) because they're a presentation-layer concern: the data
   stays a flat list of `pathsFilter` queries, the filter buckets
   are how WE choose to group them.
------------------------------------------------------------- */
const FORMAT_BY_CATEGORY = {
  'TV Series': 'video',
  'TV Channels': 'video',
  Magazines: 'article',
  Newspapers: 'article',
}
function getFormat(categoryTitle) {
  return FORMAT_BY_CATEGORY[categoryTitle] || 'other'
}
const FORMAT_OPTIONS = [
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'article', label: 'Article' },
  { id: 'other', label: 'Other' },
]

function getAudienceBucket(item) {
  if (item.pen >= 25) return 'macro'
  if (item.pen >= 5) return 'mid'
  return 'micro'
}
const AUDIENCE_BUCKET_OPTIONS = [
  { id: 'macro', label: 'Macro (\u226525% reach)' },
  { id: 'mid', label: 'Mid (5\u201325% reach)' },
  { id: 'micro', label: 'Micro (<5% reach)' },
]

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'over', label: 'Over-indexed' },
  { id: 'benchmark', label: 'On baseline' },
  { id: 'under', label: 'Under-indexed' },
]

/* Per-domain config for the popover: which extra section(s) to
   show, what label, what option list, and which item-tag fn to
   evaluate when filtering. Add new domains by adding an entry. */
const DOMAIN_FILTERS = {
  media: [
    {
      key: 'format',
      label: 'Format',
      options: FORMAT_OPTIONS,
      getter: (item, cat) => getFormat(item.mediaGroupLabel ?? cat.title),
    },
  ],
  influence: [
    {
      key: 'audienceBucket',
      label: 'Audience size',
      options: AUDIENCE_BUCKET_OPTIONS,
      getter: (item) => getAudienceBucket(item),
    },
  ],
}

/** Item-level filters: used for the chart always, and for the table when not in category-summary mode. */
function buildGranularFilteredDomain(domainView, domainId, q, filters) {
  const norm = q.trim().toLowerCase()
  const tabFilters = DOMAIN_FILTERS[domainId] || []
  return {
    ...domainView,
    categories: domainView.categories.map((cat) => {
      const catSelected =
        filters.categories.size === 0 || filters.categories.has(cat.id)
      if (!catSelected) {
        return { ...cat, items: [] }
      }
      return {
        ...cat,
        items: cat.items.filter((item) => {
          if (norm && !item.name.toLowerCase().includes(norm)) return false
          if (item.pen < filters.penRange[0] || item.pen > filters.penRange[1])
            return false
          if (item.sel < filters.selRange[0] || item.sel > filters.selRange[1])
            return false
          if (filters.tone === 'over' && item.sel < 1.2) return false
          if (filters.tone === 'under' && item.sel >= 0.8) return false
          if (
            filters.tone === 'benchmark' &&
            (item.sel < 0.8 || item.sel >= 1.2)
          )
            return false
          for (const f of tabFilters) {
            const set = filters[f.key]
            if (!set || set.size === 0) continue
            if (!set.has(f.getter(item, cat))) return false
          }
          return true
        }),
      }
    }),
  }
}

function granularSearchPlaceholder(domainId) {
  switch (domainId) {
    case 'brands-relationship':
      return 'Search for a brand…'
    case 'media':
      return 'Search for a media item…'
    case 'influence':
      return 'Search for an influencer…'
    default:
      return 'Search by name…'
  }
}

function granularSearchAriaLabel(domainId) {
  switch (domainId) {
    case 'brands-relationship':
      return 'Search for a brand by name'
    case 'media':
      return 'Search for a media item by name'
    case 'influence':
      return 'Search for an influencer by name'
    default:
      return 'Search items by name'
  }
}

/* -------------------------------------------------------------
   Toolbar — search + filter trigger above the domain table. Sorting
   is only via sortable column headers on the table. Filters open in
   an anchored popover built on react-aria-components for a11y.
------------------------------------------------------------- */
function DomainToolbar({
  domainId,
  q,
  setQ,
  filters,
  setFilters,
  bounds,
  resetKey,
  activeFilterCount,
  totalAll,
  totalFiltered,
  categoryOptions,
  bumpResetToken,
  groupByCategory,
  setGroupByCategory,
  tableMode,
  /* When the search input is hosted somewhere else (e.g. the
     improving-di workspace lifts it to a single unified field
     above the tabs), the panel toolbar drops its own search so
     the user never sees two synced inputs. The query value is
     still threaded via `q` so the count + filter chip stay
     accurate against the universal query. */
  hideSearch = false,
}) {
  const isFiltering = activeFilterCount > 0 || q.trim() !== ''
  const triggerWrapRef = useRef(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const groupSwitchLabelId = `bdi-grp-cat-lbl-${domainId}`
  const searchTargetsCategories = tableMode === 'categories'
  const countNoun = searchTargetsCategories ? 'categories' : 'items'

  return (
    <section className="bdi-toolbar" aria-label="Search and filter">
      <div className="bdi-toolbar__left">
        {hideSearch ? null : (
          <div className="bdi-toolbar__search">
            <TitanInputField
              className="field-root bdi-field bdi-toolbar__field"
              aria-label={
                searchTargetsCategories
                  ? 'Search categories by title'
                  : granularSearchAriaLabel(domainId)
              }
              placeholder={
                searchTargetsCategories
                  ? 'Search categories…'
                  : granularSearchPlaceholder(domainId)
              }
              value={q}
              onChange={setQ}
              startIcon={<Search size={14} aria-hidden />}
              /* TitanInputField only renders the trailing affordance when
                 BOTH endIcon and onClear are supplied. We hide the X
                 while the input is empty so it doesn't add visual noise
                 at rest. */
              endIcon={q ? <X size={14} aria-hidden /> : null}
              onClear={() => setQ('')}
            />
          </div>
        )}
        <span ref={triggerWrapRef} className="bdi-toolbar__filter-anchor">
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
              aria-expanded={popoverOpen}
              onPress={() => setPopoverOpen((open) => !open)}
            >
              <SlidersHorizontal size={16} aria-hidden />
            </TitanIconButton>
          </TitanBadgeAnchor>
        </span>
        <p className="bdi-toolbar__count" aria-live="polite">
          {isFiltering ? (
            <>
              <strong>{totalFiltered}</strong>
              <span>
                &nbsp;of {totalAll}
                {searchTargetsCategories ? ` ${countNoun}` : ''}
              </span>
            </>
          ) : (
            <>
              <strong>{totalAll}</strong>
              <span>&nbsp;{countNoun}</span>
            </>
          )}
        </p>
      </div>

      <div className="bdi-toolbar__right">
        <span className="bdi-toolbar__group-label" id={groupSwitchLabelId}>
          Group by category
        </span>
        <Switch
          className="switch-root bdi-table-group-switch"
          isSelected={groupByCategory}
          onChange={setGroupByCategory}
          aria-labelledby={groupSwitchLabelId}
        >
          <span className="switch-track" aria-hidden>
            <span className="switch-thumb" />
          </span>
        </Switch>
        <ExportDownloadMenu />
      </div>

      <Popover
        triggerRef={triggerWrapRef}
        isOpen={popoverOpen}
        onOpenChange={setPopoverOpen}
        placement="bottom start"
        offset={8}
        className="bdi-filter-popover"
      >
        <Dialog aria-label="Filter items in this domain" className="bdi-filter-dialog">
          <FiltersPanel
            domainId={domainId}
            filters={filters}
            setFilters={setFilters}
            bounds={bounds}
            resetKey={resetKey}
            categoryOptions={categoryOptions}
            bumpResetToken={bumpResetToken}
            onClose={() => setPopoverOpen(false)}
            metricsTarget={searchTargetsCategories ? 'categorySummary' : 'items'}
          />
        </Dialog>
      </Popover>
    </section>
  )
}

/* -------------------------------------------------------------
   MultiSelectField — select-like trigger that opens a small
   popover with checkbox options + an "All" shortcut. An empty
   Set means every option is on (same as ticking every row); we
   normalise back to an empty Set when the user ticks the last
   missing row so the trigger stays "All".

   When All is on, every row shows checked; unchecking one row
   means "all except this" (explicit Set of included ids).

   We use react-aria-components Popover (same pattern as the
   filters popover itself) so a11y + outside-click + Esc are
   handled for free.
------------------------------------------------------------- */
function MultiSelectField({ label, ariaLabel, options, selected, onChange }) {
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)

  const allActive = selected.size === 0

  function onAllChange(checked) {
    if (checked) onChange(new Set())
  }

  function toggle(id) {
    if (allActive) {
      const next = new Set(options.map((o) => o.id).filter((oid) => oid !== id))
      onChange(next)
      return
    }
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    if (next.size === options.length) {
      onChange(new Set())
    } else {
      onChange(next)
    }
  }

  let triggerText = 'All'
  if (!allActive) {
    if (selected.size === 1) {
      const id = [...selected][0]
      triggerText = options.find((o) => o.id === id)?.label ?? '1 selected'
    } else {
      triggerText = `${selected.size} selected`
    }
  }

  return (
    <div className="bdi-ms">
      <button
        ref={triggerRef}
        type="button"
        className="bdi-ms__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel || label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bdi-ms__value" data-empty={allActive ? 'true' : 'false'}>
          {triggerText}
        </span>
        <ChevronDown size={14} aria-hidden />
      </button>
      <Popover
        triggerRef={triggerRef}
        isOpen={open}
        onOpenChange={setOpen}
        placement="bottom start"
        offset={6}
        className="bdi-filter-popover bdi-ms-popover"
      >
        <Dialog
          className="bdi-filter-dialog bdi-ms-dialog"
          aria-label={ariaLabel || label}
        >
          <div className="bdi-ms__list">
            <TitanCheckboxField
              label="All"
              isSelected={allActive}
              onChange={onAllChange}
            />
            <hr className="bdi-ms__divider" aria-hidden />
            {options.map((opt) => (
              <TitanCheckboxField
                key={opt.id}
                label={opt.label}
                isSelected={allActive || selected.has(opt.id)}
                onChange={() => toggle(opt.id)}
              />
            ))}
          </div>
        </Dialog>
      </Popover>
    </div>
  )
}

/* -------------------------------------------------------------
   Filters panel — content of the popover. All filters are applied
   live (no Apply button) so the table/chart behind the popover
   updates as the user drags sliders or toggles checkboxes.
   `Clear all` resets to defaults without closing the popover.
   `Done` closes — handy on touch.
------------------------------------------------------------- */
function FiltersPanel({
  domainId,
  filters,
  setFilters,
  bounds,
  resetKey,
  categoryOptions,
  bumpResetToken,
  onClose,
  metricsTarget = 'items',
  /* Label used for the multi-select that filters by parent group.
     Defaults to "Categories" (the Brand · Media · Influencer
     vocabulary). Interests reuses this same panel for its filter
     popover and passes "Interests" so the multi-select label
     reads in the user's own taxonomy. */
  categoryLabel = 'Categories',
}) {
  const tabFilters = DOMAIN_FILTERS[domainId] || []

  function patch(partial) {
    setFilters((prev) => ({ ...prev, ...partial }))
  }
  function clearAll() {
    setFilters(buildDefaultFilters(bounds, domainId))
    bumpResetToken()
  }

  const isAtDefaults =
    filters.tone === 'all' &&
    filters.penRange[0] === bounds.pen[0] &&
    filters.penRange[1] === bounds.pen[1] &&
    filters.selRange[0] === bounds.sel[0] &&
    filters.selRange[1] === bounds.sel[1] &&
    filters.categories.size === 0 &&
    tabFilters.every((f) => filters[f.key].size === 0)

  return (
    <div className="bdi-fp">
      <div className="bdi-fp__body">
        {metricsTarget === 'categorySummary' ? (
          <p className="bdi-fp__hint">
            Status, penetration and Affinity filter each category row (aggregated metrics). Dimension
            filters below still use items inside the category.
          </p>
        ) : null}
        <section className="bdi-fp__section bdi-fp__section--full">
          <span className="bdi-fp__label">Status</span>
          <div className="bdi-fp__pills" role="radiogroup" aria-label="Status">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={filters.tone === opt.id}
                className={`bdi-fp__pill bdi-fp__pill--${opt.id}${
                  filters.tone === opt.id ? ' is-active' : ''
                }`}
                onClick={() => patch({ tone: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <div className="bdi-fp__sliders">
          <section className="bdi-fp__section">
            <div className="bdi-fp__slider-head">
              <span className="bdi-fp__label">Penetration</span>
              <span className="bdi-fp__slider-value bdi-num">
                {filters.penRange[0]}% – {filters.penRange[1]}%
              </span>
            </div>
            <TitanRangeSlider
              key={`fp-pen-${domainId}-${resetKey}`}
              aria-label="Penetration"
              minValue={bounds.pen[0]}
              maxValue={bounds.pen[1]}
              step={1}
              defaultValue={filters.penRange}
              showOutput={false}
              onChange={(value) => patch({ penRange: value })}
            />
          </section>

          <section className="bdi-fp__section">
            <div className="bdi-fp__slider-head">
              <span className="bdi-fp__label">Affinity range</span>
              <span className="bdi-fp__slider-value bdi-num">
                {filters.selRange[0].toFixed(2)}× – {filters.selRange[1].toFixed(2)}×
              </span>
            </div>
            <TitanRangeSlider
              key={`fp-sel-${domainId}-${resetKey}`}
              aria-label="Affinity range"
              minValue={bounds.sel[0]}
              maxValue={bounds.sel[1]}
              step={0.05}
              defaultValue={filters.selRange}
              showOutput={false}
              onChange={(value) => patch({ selRange: value })}
            />
          </section>
        </div>

        <div className="bdi-fp__cols">
          {categoryOptions.length > 1 && (
            <section className="bdi-fp__section">
              <span className="bdi-fp__label">{categoryLabel}</span>
              <MultiSelectField
                label={categoryLabel}
                options={categoryOptions}
                selected={filters.categories}
                onChange={(next) => patch({ categories: next })}
              />
            </section>
          )}
          {tabFilters.map((f) => (
            <section key={f.key} className="bdi-fp__section">
              <span className="bdi-fp__label">{f.label}</span>
              <MultiSelectField
                label={f.label}
                options={f.options}
                selected={filters[f.key]}
                onChange={(next) => patch({ [f.key]: next })}
              />
            </section>
          ))}
        </div>
      </div>

      <footer className="bdi-fp__foot">
        <TitanButton
          variant="secondary"
          onPress={clearAll}
          isDisabled={isAtDefaults}
        >
          Clear all
        </TitanButton>
        <TitanButton variant="primary" onPress={onClose}>
          Done
        </TitanButton>
      </footer>
    </div>
  )
}

/* -------------------------------------------------------------
   Active filter chips — render below the toolbar so the user
   always knows what's narrowing the data without having to
   re-open the popover. Click X to remove a single filter.
------------------------------------------------------------- */
function FilterChips({
  domainId,
  filters,
  setFilters,
  bounds,
  categoryOptions,
  bumpResetToken,
}) {
  const chips = []

  if (filters.tone !== 'all') {
    chips.push({
      key: 'tone',
      label: STATUS_OPTIONS.find((s) => s.id === filters.tone)?.label,
      onRemove: () => setFilters((prev) => ({ ...prev, tone: 'all' })),
    })
  }
  if (
    filters.penRange[0] !== bounds.pen[0] ||
    filters.penRange[1] !== bounds.pen[1]
  ) {
    chips.push({
      key: 'pen',
      label: `Penetration ${filters.penRange[0]}–${filters.penRange[1]}%`,
      onRemove: () => {
        setFilters((prev) => ({ ...prev, penRange: bounds.pen }))
        bumpResetToken()
      },
    })
  }
  if (
    filters.selRange[0] !== bounds.sel[0] ||
    filters.selRange[1] !== bounds.sel[1]
  ) {
    chips.push({
      key: 'sel',
      label: `Affinity ${filters.selRange[0].toFixed(2)}–${filters.selRange[1].toFixed(2)}×`,
      onRemove: () => {
        setFilters((prev) => ({ ...prev, selRange: bounds.sel }))
        bumpResetToken()
      },
    })
  }
  const totalCatOpts = categoryOptions.length
  const catSel = filters.categories
  if (totalCatOpts > 0 && catSel.size > 0 && catSel.size < totalCatOpts) {
    const showIncludedChips = catSel.size <= totalCatOpts - catSel.size
    if (showIncludedChips) {
      catSel.forEach((catId) => {
        const opt = categoryOptions.find((c) => c.id === catId)
        if (!opt) return
        chips.push({
          key: `cat-${catId}`,
          label: opt.label,
          onRemove: () =>
            setFilters((prev) => {
              const next = new Set(prev.categories)
              next.delete(catId)
              return { ...prev, categories: next }
            }),
        })
      })
    } else {
      categoryOptions
        .filter((c) => !catSel.has(c.id))
        .forEach((opt) => {
          chips.push({
            key: `cat-excl-${opt.id}`,
            label: `Hidden: ${opt.label}`,
            onRemove: () =>
              setFilters((prev) => {
                const next = new Set(prev.categories)
                next.add(opt.id)
                if (next.size === totalCatOpts) {
                  return { ...prev, categories: new Set() }
                }
                return { ...prev, categories: next }
              }),
          })
        })
    }
  }
  ;(DOMAIN_FILTERS[domainId] || []).forEach((f) => {
    filters[f.key].forEach((id) => {
      const opt = f.options.find((o) => o.id === id)
      if (!opt) return
      chips.push({
        key: `${f.key}-${id}`,
        label: opt.label,
        onRemove: () =>
          setFilters((prev) => {
            const next = new Set(prev[f.key])
            next.delete(id)
            return { ...prev, [f.key]: next }
          }),
      })
    })
  })

  if (!chips.length) return null

  return (
    <ul className="bdi-chips" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            className="bdi-chips__chip"
            onClick={chip.onRemove}
            aria-label={`Remove filter: ${chip.label}`}
          >
            <span>{chip.label}</span>
            <X size={11} strokeWidth={2.5} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------
   Default filters builder — depends on the data bounds (the
   sliders' min/max), so we (re)build whenever the domain changes.
------------------------------------------------------------- */
function buildDefaultFilters(bounds, domainId) {
  const base = {
    tone: 'all',
    penRange: bounds.pen,
    selRange: bounds.sel,
    categories: new Set(),
  }
  ;(DOMAIN_FILTERS[domainId] || []).forEach((f) => {
    base[f.key] = new Set()
  })
  return base
}

/* Bounds depend on the domain's items only (data is static). We
   precompute them once at module load so AppShell can build the
   initial per-tab state synchronously without a useEffect. */
function computeBounds(domain) {
  const allItems = flattenItems(domain)
  const pens = allItems.map((i) => i.pen)
  const sels = allItems.map((i) => i.sel)
  return {
    pen: [0, Math.max(100, Math.ceil(Math.max(0, ...pens)))],
    sel: [0, Math.max(3, Math.ceil(Math.max(0, ...sels) * 10) / 10)],
  }
}

const TAB_BOUNDS = Object.fromEntries(
  DOMAINS.map((d) => [d.id, computeBounds(d)]),
)
const TAB_INITIAL = Object.fromEntries(
  DOMAINS.map((d) => [
    d.id,
    {
      q: '',
      filters: buildDefaultFilters(TAB_BOUNDS[d.id], d.id),
      sortDescriptor: { column: 'tml', direction: 'descending' },
      groupByCategory: false,
      tableDrillCategoryId: null,
      resetToken: 0,
    },
  ]),
)

/** Merge persisted / partial tab state with defaults so keys like groupByCategory are never missing. */
function normalizeTabSlot(domainId, slot) {
  const base = TAB_INITIAL[domainId]
  if (!base) return slot && typeof slot === 'object' ? { ...slot } : {}
  return { ...base, ...(slot && typeof slot === 'object' ? slot : {}) }
}

/* Domain tabs: Brand → Media → Influence (vertical TitanTabs rail + panel).
   Exported so the unified `improving-di` shell can reuse the same
   workspace (vertical rail + tables + filters + scatter) without
   re-declaring the table machinery. */
export const DOMAIN_TABS = [
  { id: 'brands-relationship', label: 'Brand' },
  { id: 'media', label: 'Media' },
  { id: 'influence', label: 'Influencers' },
]

/* Re-exports for the unified mockup. Keeping these as a single named
   block makes the cross-app contract explicit: improving-di pulls
   the heavy table workspace from here as-is, and only owns the
   chrome (navbar, breadcrumb, page header, section nav).
   `flattenDomainItems` + `prepareDomainView` feed the per-domain
   match counts on the universal search badges. `FiltersPanel` +
   `DOMAIN_FILTERS` + `TAB_BOUNDS` + `buildDefaultFilters` +
   `ExportDownloadMenu` let the improving-di workspace lift the
   filter trigger + download into its universal search bar (the
   panel toolbar is hidden via `hideToolbar`). */
const flattenDomainItems = flattenItems
export {
  DOMAIN_FILTERS,
  ExportDownloadMenu,
  FilterChips,
  FiltersPanel,
  TAB_BOUNDS,
  TAB_INITIAL,
  buildDefaultFilters,
  flattenDomainItems,
  normalizeTabSlot,
  prepareDomainView,
}

/* -------------------------------------------------------------
   Insufficient signal — empty category drill / demo taxonomy node
------------------------------------------------------------- */
function InsufficientSignalEmpty({ categoryTitle, onBack }) {
  return (
    <section
      className="bdi-insufficient-signal"
      aria-labelledby="bdi-insufficient-signal-title"
    >
      <h3 id="bdi-insufficient-signal-title" className="bdi-insufficient-signal__title">
        Not enough data to rank items
      </h3>
      <div className="bdi-insufficient-signal__copy">
        <p className="bdi-insufficient-signal__body">
          For <strong>{categoryTitle}</strong>, there is not enough reliable signal in this
          audience to show a ranked list. Sample size may be too small, or affinity scores may
          not meet our confidence threshold for reporting.
        </p>
        <p className="bdi-insufficient-signal__hint">
          Try another category, widen your filters, or check back when more audience data is
          available.
        </p>
      </div>
      {onBack ? (
        <button type="button" className="bdi-link-btn bdi-insufficient-signal__back" onClick={onBack}>
          Back to all categories
        </button>
      ) : null}
    </section>
  )
}

/* -------------------------------------------------------------
   Domain · zero-result empty state
   Renders when search + filters collapse the visible table to
   zero rows. Mirrors the Interests `topics-empty` block 1:1 —
   centred icon, "No matches" heading, context-aware copy, and
   the same pair of escape hatches ("Clear search" / "Clear
   filter") with one-or-two showing depending on what's actually
   active. Noun adapts to the active scope so the copy reads
   naturally ("No brands match…", "No influencers match…",
   "No categories match…" in group-by-category mode).
------------------------------------------------------------- */
function domainEmptyNoun(domainId, tableMode) {
  if (tableMode === 'categories') return 'categories'
  switch (domainId) {
    case 'brands-relationship':
      return 'brands'
    case 'media':
      return 'media items'
    case 'influence':
      return 'influencers'
    default:
      return 'items'
  }
}

function DomainEmptyState({
  domainId,
  tableMode,
  query,
  hasFilter,
  onClearSearch,
  onClearFilter,
}) {
  const hasQuery = (query ?? '').trim() !== ''
  const noun = domainEmptyNoun(domainId, tableMode)

  let title = 'No matches'
  let body = null
  if (hasQuery && hasFilter) {
    body = (
      <>
        No {noun} match <strong>“{query}”</strong> with the current filters.
      </>
    )
  } else if (hasQuery) {
    body = (
      <>
        No {noun} match <strong>“{query}”</strong>.
      </>
    )
  } else if (hasFilter) {
    title = 'No matches for these filters'
    body = <>No {noun} match the current filters.</>
  } else {
    body = <>There are no {noun} to show.</>
  }

  return (
    <div className="bdi-empty" role="status">
      <Search size={28} aria-hidden className="bdi-empty__icon" />
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="bdi-empty__actions">
        {hasQuery ? (
          <button
            type="button"
            className="bdi-empty__link"
            onClick={onClearSearch}
          >
            Clear search
          </button>
        ) : null}
        {hasFilter ? (
          <button
            type="button"
            className="bdi-empty__link"
            onClick={onClearFilter}
          >
            Clear filter
          </button>
        ) : null}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------
   Domain panel
   Exported (named) so the unified `improving-di` mockup can render
   the same Brand/Media/Influencers workspace under its new
   "Brands & influence" report section without copy-pasting the
   table machinery.
------------------------------------------------------------- */
export function DomainPanel({
  domain,
  q,
  setQ,
  filters,
  setFilters,
  sortDescriptor,
  setSortDescriptor,
  resetToken,
  bumpResetToken,
  groupByCategory,
  setGroupByCategory,
  tableDrillCategoryId,
  setTableDrillCategoryId,
  linkedRowKey,
  onRowLink,
  onClearRowLink,
  /* Opt-out for the panel's own search input — used by the
     unified `improving-di` workspace where the search is hosted
     above the tabs. The standalone better-di-in app leaves it
     unset (default false) so its toolbar keeps the search. */
  hideSearch = false,
  /* Stronger opt-out that removes the entire DomainToolbar (and
     therefore the per-tab filter trigger, count, group-by switch
     and download menu). The improving-di workspace turns this on
     and rebuilds those controls inside its workspace-level
     UniversalSearchBar so a single toolbar serves all three
     domains. FilterChips below the toolbar still render so the
     active filter pills stay visible. */
  hideToolbar = false,
}) {
  const domainView = useMemo(() => prepareDomainView(domain), [domain])

  const allItems = useMemo(() => flattenItems(domainView), [domainView])
  const bounds = TAB_BOUNDS[domain.id]

  const categoryOptions = useMemo(
    () =>
      domainView.categories
        .filter((cat) => cat.items.length > 0 || cat.insufficientSignal)
        .map((cat) => ({ id: cat.id, label: cat.title })),
    [domainView],
  )

  const tableMode = useMemo(() => {
    if (!groupByCategory) return 'granular'
    if (tableDrillCategoryId) return 'drill'
    return 'categories'
  }, [groupByCategory, tableDrillCategoryId])

  const filtered = useMemo(() => {
    const categorySummaryMode = tableMode === 'categories'
    if (!categorySummaryMode) {
      return buildGranularFilteredDomain(domainView, domain.id, q, filters)
    }
    const norm = q.trim().toLowerCase()
    const tabFilters = DOMAIN_FILTERS[domain.id] || []
    return {
      ...domainView,
      categories: domainView.categories.map((cat) => {
        const catSelected =
          filters.categories.size === 0 || filters.categories.has(cat.id)
        if (!catSelected) {
          return { ...cat, items: [] }
        }
        if (norm && !cat.title.toLowerCase().includes(norm)) {
          return { ...cat, items: [] }
        }
        const items = cat.items.filter((item) => {
          for (const f of tabFilters) {
            const set = filters[f.key]
            if (!set || set.size === 0) continue
            if (!set.has(f.getter(item, cat))) return false
          }
          return true
        })
        return { ...cat, items }
      }),
    }
  }, [domainView, q, filters, domain.id, tableMode])

  const tableDomain = useMemo(() => {
    if (tableMode !== 'categories') return filtered
    const summaries = buildCategorySummaryRows(filtered)
    const allowed = new Set(
      summaries
        .filter((row) => categorySummaryRowPassesListFilters(row, filters))
        .map((r) => r.categoryId),
    )
    return {
      ...filtered,
      categories: filtered.categories.map((c) =>
        allowed.has(c.id) ? c : { ...c, items: [] },
      ),
    }
  }, [filtered, tableMode, filters])

  const totalAll = useMemo(() => {
    if (tableMode === 'categories') {
      return domainView.categories.filter(
        (c) => c.items.length > 0 || c.insufficientSignal,
      ).length
    }
    return allItems.length
  }, [tableMode, domainView, allItems.length])

  const totalFiltered = useMemo(() => {
    if (tableMode === 'categories') {
      return buildCategorySummaryRows(tableDomain).length
    }
    return filtered.categories.reduce((n, c) => n + c.items.length, 0)
  }, [tableMode, tableDomain, filtered])

  const drillCategory = useMemo(() => {
    if (!tableDrillCategoryId) return null
    return domainView.categories.find((c) => c.id === tableDrillCategoryId) ?? null
  }, [domainView.categories, tableDrillCategoryId])

  const drillInsufficientSignal = isInsufficientSignalCategory(drillCategory)

  const drillSummary = useMemo(() => {
    if (!tableDrillCategoryId || drillInsufficientSignal) return null
    const cat = filtered.categories.find((c) => c.id === tableDrillCategoryId)
    if (!cat?.items?.length) return null
    const one = buildCategorySummaryRows({ ...filtered, categories: [cat] })
    return one[0] ?? null
  }, [filtered, tableDrillCategoryId, drillInsufficientSignal])

  useEffect(() => {
    const col = sortDescriptor.column
    if (col === 'reach') {
      setSortDescriptor((prev) => ({
        column: 'penetration',
        direction: prev.direction,
      }))
      return
    }
    if (tableMode === 'categories' && col === 'category') {
      setSortDescriptor({ column: 'tml', direction: 'descending' })
    }
    if (tableMode !== 'categories' && col === 'entities') {
      setSortDescriptor({ column: 'tml', direction: 'descending' })
    }
  }, [tableMode, sortDescriptor.column, setSortDescriptor])

  /* One filter = one count, regardless of how many checkboxes are
     ticked inside it. Matches Figma / Linear semantics: the badge
     answers "how many dimensions are narrowing this view?". */
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.tone !== 'all') count += 1
    if (
      filters.penRange[0] !== bounds.pen[0] ||
      filters.penRange[1] !== bounds.pen[1]
    )
      count += 1
    if (
      filters.selRange[0] !== bounds.sel[0] ||
      filters.selRange[1] !== bounds.sel[1]
    )
      count += 1
    if (filters.categories.size > 0) count += 1
    ;(DOMAIN_FILTERS[domain.id] || []).forEach((f) => {
      if (filters[f.key].size > 0) count += 1
    })
    return count
  }, [filters, bounds, domain.id])

  function handleClearAll() {
    setQ('')
    setFilters(buildDefaultFilters(bounds, domain.id))
    onClearRowLink?.()
    bumpResetToken()
  }

  /* Granular reset used by the zero-result empty state — wipes
     only the filter state (status, sliders, multi-selects) and
     leaves the search query alone. Mirrors the contract that
     Interests' EmptyState already follows: the user gets two
     separate, labelled escape hatches ("Clear search" and
     "Clear filter") so they always know which lever they're
     pulling. */
  function handleClearFiltersOnly() {
    setFilters(buildDefaultFilters(bounds, domain.id))
    bumpResetToken()
  }

  return (
    <div className="bdi-panel">
      {hideToolbar ? null : (
        <DomainToolbar
          domainId={domain.id}
          q={q}
          setQ={setQ}
          filters={filters}
          setFilters={setFilters}
          bounds={bounds}
          resetKey={resetToken}
          activeFilterCount={activeFilterCount}
          totalAll={totalAll}
          totalFiltered={totalFiltered}
          categoryOptions={categoryOptions}
          bumpResetToken={bumpResetToken}
          groupByCategory={groupByCategory}
          setGroupByCategory={setGroupByCategory}
          tableMode={tableMode}
          hideSearch={hideSearch}
        />
      )}

      <FilterChips
        domainId={domain.id}
        filters={filters}
        setFilters={setFilters}
        bounds={bounds}
        categoryOptions={categoryOptions}
        bumpResetToken={bumpResetToken}
      />

      {drillInsufficientSignal ? (
        <>
          {groupByCategory ? (
            <nav
              className="bdi-table-breadcrumb bdi-table-breadcrumb--above-table"
              aria-label="Category path"
            >
              <button
                type="button"
                className="bdi-link-btn"
                onClick={() => setTableDrillCategoryId(null)}
              >
                All categories
              </button>
              {drillCategory ? (
                <>
                  <span className="bdi-table-breadcrumb__sep" aria-hidden>
                    {' '}
                    ›{' '}
                  </span>
                  <span className="bdi-table-breadcrumb__current">
                    {drillCategory.title}
                  </span>
                </>
              ) : null}
            </nav>
          ) : null}
          <div className="bdi-insufficient-signal-wrap">
            <InsufficientSignalEmpty
              categoryTitle={drillCategory?.title ?? 'This category'}
              onBack={
                groupByCategory ? () => setTableDrillCategoryId(null) : undefined
              }
            />
          </div>
        </>
      ) : totalFiltered === 0 ? (
        <DomainEmptyState
          domainId={domain.id}
          tableMode={tableMode}
          query={q}
          hasFilter={activeFilterCount > 0}
          onClearSearch={() => setQ('')}
          onClearFilter={handleClearFiltersOnly}
        />
      ) : (
        <>
          {groupByCategory ? (
            <nav
              className="bdi-table-breadcrumb bdi-table-breadcrumb--above-table"
              aria-label="Category path"
            >
              <button
                type="button"
                className="bdi-link-btn"
                onClick={() => setTableDrillCategoryId(null)}
              >
                All categories
              </button>
              {tableDrillCategoryId && drillSummary ? (
                <>
                  <span className="bdi-table-breadcrumb__sep" aria-hidden>
                    {' '}
                    ›{' '}
                  </span>
                  <span className="bdi-table-breadcrumb__current">
                    {drillSummary.name} ({drillSummary.pen.toFixed(1)}%)
                  </span>
                </>
              ) : null}
            </nav>
          ) : null}
          <DomainTable
            filteredDomain={tableDomain}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            groupByCategory={groupByCategory}
            tableDrillCategoryId={tableDrillCategoryId}
            onDrillCategoryId={setTableDrillCategoryId}
            linkedRowKey={linkedRowKey}
            onRowLink={onRowLink}
            rankLayout
          />
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------
   Root
------------------------------------------------------------- */
const EXPORT_MENU_ITEMS = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
  { id: 'csv', label: 'CSV (.csv)' },
]

function ExportDownloadMenu() {
  return (
    <MenuTrigger>
      <RacButton className="btn btn-primary with-icon menu-trigger-button bdi-export-menu-trigger">
        <Download size={16} aria-hidden />
        Download
        <span className="menu-trigger-chevron" aria-hidden>
          <ChevronDown size={16} />
        </span>
      </RacButton>
      <Popover className="menu-popover" placement="bottom end" offset={8}>
        <Menu
          className="menu-list"
          onAction={(id) => {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.info(`Export requested: ${id}`)
            }
          }}
        >
          {EXPORT_MENU_ITEMS.map((item) => (
            <MenuItem key={item.id} id={item.id} className="menu-item">
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}

export default function AppShell() {
  const [reportSection, setReportSection] = useState('interests')
  const [active, setActive] = useState(DOMAIN_TABS[0].id)
  /* Per-tab state lives here so it survives TabPanel un/remount.
     react-aria-components Tabs unmount inactive panels by default,
     which would otherwise wipe the user's filters/search/sort
     every time they peek at another tab. Each domain has its own
     slot keyed by id; helpers below patch a single slot. */
  const [tabStates, setTabStates] = useState(TAB_INITIAL)

  function patchTab(domainId, partial) {
    setTabStates((s) => ({
      ...s,
      [domainId]: { ...normalizeTabSlot(domainId, s[domainId]), ...partial },
    }))
  }
  function setTabQ(domainId, value) {
    setTabStates((s) => {
      const slot = normalizeTabSlot(domainId, s[domainId])
      const q = typeof value === 'function' ? value(slot.q) : value
      return { ...s, [domainId]: { ...slot, q } }
    })
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

  const [linkedRowKey, setLinkedRowKey] = useState(null)

  function handleTableRowLink(domainId, rowKey) {
    setLinkedRowKey(`${domainId}::${rowKey}`)
  }

  const tabs = DOMAIN_TABS.map(({ id, label }) => {
    const d = DOMAINS.find((dom) => dom.id === id)
    if (!d) return null
    const slot = normalizeTabSlot(d.id, tabStates[d.id])
    const domainId = d.id
    return {
      id: d.id,
      label,
      content: (
        <DomainPanel
          key={domainId}
          domain={d}
          q={slot.q}
          setQ={(v) => setTabQ(domainId, v)}
          filters={slot.filters}
          setFilters={(updater) => setTabFilters(domainId, updater)}
          sortDescriptor={slot.sortDescriptor}
          setSortDescriptor={(v) => setTabSort(domainId, v)}
          resetToken={slot.resetToken}
          bumpResetToken={() => bumpTabResetToken(domainId)}
          groupByCategory={!!slot.groupByCategory}
          setGroupByCategory={(v) =>
            patchTab(domainId, { groupByCategory: v, tableDrillCategoryId: null })
          }
          tableDrillCategoryId={slot.tableDrillCategoryId ?? null}
          setTableDrillCategoryId={(id) => patchTab(domainId, { tableDrillCategoryId: id })}
          linkedRowKey={linkedRowKey}
          onRowLink={(key) => handleTableRowLink(domainId, key)}
          onClearRowLink={() => setLinkedRowKey(null)}
        />
      ),
    }
  }).filter(Boolean)

  return (
    <div className="bdi-app titan-app-root">
      <TitanNavbar logoAlt="Digital Intelligence for Meta" />

      <main className="bdi-main">
        <PageHeader />
        <ReportSectionNav value={reportSection} onChange={setReportSection} />

        {reportSection === 'interests' ? (
          <div
            id="report-section-interests"
            className="bdi-workspace"
            role="tabpanel"
            aria-labelledby="report-section-tab-interests"
          >
          <div className="bdi-workspace__body">
            <div className="bdi-tabs-split">
              <div className="bdi-tabs">
                <TitanTabs
                  orientation="vertical"
                  ariaLabel="Brand · Media · Influencers"
                  items={tabs}
                  selectedKey={active}
                  onSelectionChange={(key) => {
                    setLinkedRowKey(null)
                    setActive(String(key))
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        ) : (
          <ReportSectionPlaceholder sectionId={reportSection} />
        )}
      </main>
    </div>
  )
}
