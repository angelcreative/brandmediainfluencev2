import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button as RacButton,
  Dialog,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from 'react-aria-components'
import {
  TitanBadgeAnchor,
  TitanButton,
  TitanCell,
  TitanColumn,
  TitanIconButton,
  TitanInputField,
  TitanPagination,
  TitanPill,
  TitanRow,
  TitanTable,
  TitanTableBody,
  TitanTableHeader,
  TitanTooltip,
} from 'titan-compositions'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  INTERESTS,
  ALL_CATEGORIES,
  REPORT_META,
  selectivityTone,
  sortRows,
} from '../data/topicsData.js'

/* Affinity tone filter options exposed by the compact toolbar.
   We deliberately keep this short (4 options, single-select) so
   the popover stays a "one-pick" decision; anything richer
   (range sliders, multi-bucket) belongs in the better-di-in
   filters panel where the data model is more complex. The
   buckets mirror `selectivityTone()` thresholds in topicsData.
   `pillModifier` aligns each option with the brands FiltersPanel
   pill semantic colors (`.bdi-fp__pill--over` etc.) so the two
   filter UIs read identically — green for over-index, steel for
   on-baseline, red for under-index, neutral for "All". */
const TONE_FILTER_OPTIONS = [
  { id: 'all', label: 'All', pillModifier: null },
  { id: 'over', label: 'Over-indexed', pillModifier: 'over' },
  { id: 'baseline', label: 'On baseline', pillModifier: 'benchmark' },
  { id: 'under', label: 'Under-indexed', pillModifier: 'under' },
]

function matchesTone(category, toneFilter) {
  if (!toneFilter || toneFilter === 'all') return true
  return selectivityTone(category.selectivity) === toneFilter
}

/* Full filter predicate — runs the same four checks the brands
   FiltersPanel ships (Status / Penetration range / Affinity range
   / parent group multi-select), reading category fields native to
   the interests dataset (`audiencePen`, `selectivity`,
   `interestId`). The tone vocabulary aligns with Brands ids
   (`over` / `benchmark` / `under`) so the same FiltersPanel JSX
   can drive both products; we accept `baseline` too so the legacy
   standalone topics filter (which used that id) keeps working.

   `applyParent` is a small UX nuance: when the user is on a
   single interest (no search), the parent-interest filter is
   intentionally bypassed because the rail click already declared
   the user's parent intent. Inside a universal search across all
   interests the filter behaves as expected and narrows results to
   the picked parents. */
function categoryPassesFullFilters(c, filters, { applyParent = true } = {}) {
  if (filters.tone === 'over' && c.selectivity < 1.2) return false
  if (filters.tone === 'under' && c.selectivity >= 0.8) return false
  if (
    (filters.tone === 'benchmark' || filters.tone === 'baseline') &&
    (c.selectivity < 0.8 || c.selectivity >= 1.2)
  )
    return false
  if (
    c.audiencePen < filters.penRange[0] ||
    c.audiencePen > filters.penRange[1]
  )
    return false
  if (
    c.selectivity < filters.selRange[0] ||
    c.selectivity > filters.selRange[1]
  )
    return false
  if (
    applyParent &&
    filters.categories?.size > 0 &&
    !filters.categories.has(c.interestId)
  )
    return false
  return true
}

/* Table page size. Matches DOMAIN_TABLE_PAGE_SIZE in
   better-di-in verbatim so the Brand · Media · Influencer table
   and the Interests category table flip pages at the same
   cadence; a user moving between the two surfaces never has to
   relearn how much fits on screen. Most single-interest views
   sit well below 20 rows (8-12 typical), so pagination only
   really kicks in during the universal search across the
   ~150-category pool — exactly when scannability starts to
   suffer without it. */
const INTERESTS_TABLE_PAGE_SIZE = 20

/* Same two-format export menu the better-di-in toolbar ships
   (Excel + CSV). Lives on the right side of CompactToolbar so the
   Interests workspace reads identically to Brands & influence
   inside the unified `improving-di` shell — same trigger button,
   same chevron, same menu items, same DEV log on action. The
   class names mirror the brands menu verbatim so it picks up the
   shared `.bdi-export-menu-trigger` / `.menu-popover` styles
   that the unified shell already imports. */
const EXPORT_MENU_ITEMS = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
  { id: 'csv', label: 'CSV (.csv)' },
]

function ExportDownloadMenu() {
  return (
    <MenuTrigger>
      <RacButton className="btn btn-secondary with-icon menu-trigger-button bdi-export-menu-trigger">
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

function formatCompact(n) {
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n < 1000) return String(n)
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function tonePillState(tone) {
  if (tone === 'over') return 'success'
  if (tone === 'under') return 'error'
  return 'base'
}

/* Penetration & reach mega-cell — verbatim port of better-di-in's
   `.bdi-penreach` 2×3 grid: % (left) · track (middle) · abs (right)
   for the audience row, then the baseline row underneath on the
   same axes. Same classes, same DOM order, same percent precision
   (toFixed(2)). The CSS lives in topics/src/index.css (cloned from
   better-di-in) so both products render bit-perfect even when
   imported standalone. */
function PenReachCell({ audiencePen, baselinePen, audReach, benchReach }) {
  /* Shared % scale across both rows so the bars sit on the same
     axis (baseline never has its own zoomed-in track). Matches the
     brands recipe: `penScale = max(target, bench)` clamped to 1+
     so empty rows still render a track. */
  const penScale = Math.max(audiencePen, baselinePen, 1)
  const targetW = (audiencePen / penScale) * 100
  const benchW = (baselinePen / penScale) * 100
  return (
    <div className="bdi-penreach">
      <span className="bdi-penreach__pct bdi-num">
        {audiencePen.toFixed(2)}%
      </span>
      <span className="bdi-penreach__track" aria-hidden>
        <span
          className="bdi-penreach__fill bdi-penreach__fill--target"
          style={{ width: `${targetW}%` }}
        />
      </span>
      <span className="bdi-penreach__abs bdi-num">
        {formatCompact(audReach)}
      </span>
      <span className="bdi-penreach__pct bdi-penreach__pct--baseline bdi-num">
        {baselinePen.toFixed(2)}%
      </span>
      <span className="bdi-penreach__track" aria-hidden>
        <span
          className="bdi-penreach__fill bdi-penreach__fill--bench"
          style={{ width: `${benchW}%` }}
        />
      </span>
      <span className="bdi-penreach__abs bdi-penreach__abs--baseline bdi-num">
        {formatCompact(benchReach)}
      </span>
    </div>
  )
}

function TitleCell({ title, subMeta }) {
  return (
    <span className="topics-cell-title">
      <span className="topics-cell-title__name">{title}</span>
      {subMeta ? (
        <span className="topics-cell-title__sub">{subMeta}</span>
      ) : null}
    </span>
  )
}

/* Affinity column header — info icon + Titan tooltip explaining
   the multiplier. Verbatim copy of the better-di-in pattern
   (`.bdi-th-with-info` wrapper + `.bdi-th-info-btn` circle button
   inside `HeaderInfoBlocker` that swallows click/keydown so the
   sort header doesn't trigger when the user reaches for the (i)).
   Tooltip copy is identical to Brands so the two reports describe
   Affinity in the same words. */
const AFFINITY_COLUMN_TOOLTIP =
  'Affinity score. How much more (or less) likely your target audience is to engage with this profile compared to the baseline audience, expressed as a multiplier (e.g. 1.37×).'

/* Identical wording to better-di-in's HeaderInfo on the Pen &
   reach column so the two products explain the metric in the same
   sentence. */
const PENREACH_COLUMN_TOOLTIP =
  'First line is your audience: penetration (share) and estimated reach (people). Second line is the benchmark on the same scale.'

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

/* Affinity cell — single semantic pill that carries the value AND
   the over/under signal (success/error/base). Identical contract
   to better-di-in: state from the qualitative bucket, tone
   "emphasis", value formatted with toFixed(2) so the column lines
   up vertically ("3.85×" / "1.20×" / "0.90×" — same width). */
function AffinityCell({ selectivity }) {
  const tone = selectivityTone(selectivity)
  const qualifier =
    tone === 'over' ? 'over-indexed' : tone === 'under' ? 'under-indexed' : 'on baseline'
  const formatted = `${selectivity.toFixed(2)}×`
  return (
    <TitanPill
      state={tonePillState(tone)}
      tone="emphasis"
      aria-label={`Affinity ${formatted}, ${qualifier}`}
    >
      {formatted}
    </TitanPill>
  )
}

/* Empty state inside the panel — fires when ANY combination of
   the universal search and the affinity filter narrows the pool
   down to zero rows. The copy and CTA(s) flex to match what the
   user actually has active so the fix is always one click away
   (no more "Clear search" button that does nothing because the
   query is empty — that bug shipped briefly and broke trust). */
function EmptyState({ query, onClearSearch, hasFilter, onClearFilter }) {
  const hasQuery = query.trim() !== ''

  let title = 'No matches'
  let body = null
  if (hasQuery && hasFilter) {
    body = (
      <>
        No categories match <strong>“{query}”</strong> with the current filter.
      </>
    )
  } else if (hasQuery) {
    body = (
      <>
        No categories match <strong>“{query}”</strong>.
      </>
    )
  } else if (hasFilter) {
    title = 'No matches for this filter'
    body = <>No categories match the current affinity filter.</>
  } else {
    body = <>There are no categories to show.</>
  }

  return (
    <div className="topics-empty" role="status">
      <Search size={28} aria-hidden className="topics-empty__icon" />
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="topics-empty__actions">
        {hasQuery ? (
          <button type="button" className="topics-link" onClick={onClearSearch}>
            Clear search
          </button>
        ) : null}
        {hasFilter ? (
          <button type="button" className="topics-link" onClick={onClearFilter}>
            Clear filter
          </button>
        ) : null}
      </div>
    </div>
  )
}

/* Mapping between our internal short sort form and react-aria's
   `sortDescriptor` shape. Kept at the table boundary so the rest
   of the app keeps the friendlier {sortBy, direction} pair. */
function toSortDescriptor(sortBy, direction) {
  return {
    column: sortBy,
    direction: direction === 'asc' ? 'ascending' : 'descending',
  }
}
function fromSortDescriptor(desc) {
  return {
    sortBy: desc.column,
    direction: desc.direction === 'ascending' ? 'asc' : 'desc',
  }
}

/* CompactToolbar — Interests workspace toolbar that mirrors the
   Brand/Media/Influencers toolbar from better-di-in: search input
   on the left, a circular filter trigger (with active-count
   badge), then a live count of items. We reuse the better-di-in
   `.bdi-toolbar*` classes verbatim so the two products read the
   same. The filter popover hosts a short single-select for the
   affinity tone (Over / On baseline / Under / All) because that
   is the most "pertinent" cut for an audience-vs-baseline view —
   anything else would belong upstream in the report shell.
   Lives inside this file so the standalone topics app doesn't
   need extra primitives just to host it. */
function CompactToolbar({
  query,
  setQuery,
  toneFilter,
  setToneFilter,
  totalAll,
  totalFiltered,
  isSearching,
  searchAriaLabel,
  /* When the search input is hosted somewhere else (e.g. the
     improving-di workspace lifts it to a single unified field
     above the rail), the panel toolbar drops its own search.
     `query` keeps flowing in so the count + tone chip stay in
     lockstep with the universal query. */
  hideSearch = false,
}) {
  const triggerWrapRef = useRef(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const activeFilterCount = toneFilter && toneFilter !== 'all' ? 1 : 0
  const isFilteringText = isSearching || activeFilterCount > 0
  const noun = totalFiltered === 1 ? 'category' : 'categories'

  return (
    <section className="bdi-toolbar" aria-label="Search and filter">
      <div className="bdi-toolbar__left">
        {hideSearch ? null : (
          <div className="bdi-toolbar__search">
            <TitanInputField
              className="field-root bdi-field bdi-toolbar__field"
              aria-label={searchAriaLabel}
              placeholder="Search categories…"
              value={query}
              onChange={(e) => setQuery(e?.target?.value ?? e ?? '')}
              onClear={() => setQuery('')}
              leadingIcon={<Search size={14} aria-hidden />}
              /* TitanInputField only renders the trailing X when BOTH
                 endIcon and onClear are supplied; keep it hidden while
                 the input is empty so the rest state has no noise. */
              endIcon={query ? <X size={14} aria-hidden /> : null}
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
          {isFilteringText ? (
            <>
              <strong>{totalFiltered}</strong>
              <span>&nbsp;of {totalAll} {noun}</span>
            </>
          ) : (
            <>
              <strong>{totalAll}</strong>
              <span>&nbsp;{noun}</span>
            </>
          )}
        </p>
      </div>

      <div className="bdi-toolbar__right">
        <ExportDownloadMenu />
      </div>

      <Popover
        triggerRef={triggerWrapRef}
        isOpen={popoverOpen}
        onOpenChange={setPopoverOpen}
        placement="bottom start"
        offset={8}
        /* `--tone` is a width modifier — single-section filter, so
           we shrink from brands' 560px down to ~320px in CSS. */
        className="bdi-filter-popover bdi-filter-popover--tone"
      >
        <Dialog
          aria-label="Filter categories by affinity"
          className="bdi-filter-dialog"
        >
          {/* Mirrors better-di-in's FiltersPanel: .bdi-fp shell with
              labelled .bdi-fp__section, pill-style radios row, and
              the same Clear all / Done footer so the Interests
              filter reads identically to the Brands one. */}
          <div className="bdi-fp">
            <div className="bdi-fp__body">
              <section className="bdi-fp__section bdi-fp__section--full">
                <span className="bdi-fp__label">Affinity</span>
                <div
                  className="bdi-fp__pills"
                  role="radiogroup"
                  aria-label="Affinity"
                >
                  {TONE_FILTER_OPTIONS.map((opt) => {
                    const checked = (toneFilter ?? 'all') === opt.id
                    const modifier = opt.pillModifier
                      ? ` bdi-fp__pill--${opt.pillModifier}`
                      : ''
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        className={`bdi-fp__pill${modifier}${
                          checked ? ' is-active' : ''
                        }`}
                        onClick={() => setToneFilter(opt.id)}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>

            <footer className="bdi-fp__foot">
              <TitanButton
                variant="secondary"
                onPress={() => setToneFilter('all')}
                isDisabled={!toneFilter || toneFilter === 'all'}
              >
                Clear all
              </TitanButton>
              <TitanButton
                variant="primary"
                onPress={() => setPopoverOpen(false)}
              >
                Done
              </TitanButton>
            </footer>
          </div>
        </Dialog>
      </Popover>
    </section>
  )
}

/* InterestPanel — the right side of the workspace. Two modes:

   · Idle (no query): header shows the active interest's name and
     category count; table lists the categories that belong to it.
   · Searching: the category search is *universal*. Header shifts to
     "Search results · N matches across M interests" and the table
     pulls from ALL_CATEGORIES so a query surfaces matches even when
     the user hasn't selected the right interest yet. Each row keeps
     the parent interest as sub-meta so the context isn't lost.

   When `compactToolbar` is enabled (used by the unified
   `improving-di` shell), the title block is dropped — the active
   interest is already shown in the vertical rail tab on the left —
   and the header is replaced with the Brands-style toolbar
   (search + filter + count). The affinity tone filter applies on
   top of the search.

   Rows are intentionally non-interactive. Every category value
   (name, penetration vs. baseline, affinity, profiles) is on the
   row, and the table is already the unit of analysis — a drawer
   here would only duplicate visible data. */
function InterestPanel({
  interest,
  query,
  setQuery,
  sortBy,
  direction,
  onSortChange,
  compactToolbar = false,
  toneFilter = 'all',
  setToneFilter,
  /* Full filter object lifted from the workspace (improving-di).
     When provided, the table runs the same 4-axis predicate the
     brands FiltersPanel produces (tone + pen + sel + parent).
     When null, we fall back to the legacy single-tone filter so
     the standalone topics app keeps working unchanged. */
  filters = null,
  /* Callback the EmptyState's "Clear filter" button calls when
     full filters are in use. Workspace supplies it because only
     it knows the bounds + reset token contract. */
  onClearFullFilters,
  hasActiveFullFilter = false,
  /* Forwarded to CompactToolbar — see prop doc there. The unified
     `improving-di` workspace sets this to drop the panel-local
     search in favour of a single workspace-level search above
     the rail. */
  hideSearch = false,
  /* Stronger opt-out: skip the CompactToolbar entirely so the
     unified shell can host search + filter + download as a
     single bar above the rail. */
  hideToolbar = false,
}) {
  const q = query.trim().toLowerCase()
  const isSearching = q.length > 0

  /* Source pool depends on search mode: a query is universal across
     interests, an idle panel only shows the active interest. */
  const sourcePool = isSearching ? ALL_CATEGORIES : interest.categories

  /* Filtered (search + filter) pool for the table. Two code paths
     so the standalone topics app stays bit-for-bit identical: the
     unified shell sends a full `filters` object → full predicate;
     the standalone sends only `toneFilter` → legacy predicate. */
  const usingFullFilters = filters !== null
  const categories = useMemo(() => {
    /* Same expanded match as `matchesByInterest` above: a row is
       a hit when the query lives in either its own name OR the
       parent interest's name. Without the second clause, searching
       "tv" would land on the Film & TV interest in the rail but
       show an empty table — the user sees the scope name surface
       but the rows that should belong to it disappear. */
    const searched = isSearching
      ? sourcePool.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.interestName.toLowerCase().includes(q),
        )
      : sourcePool
    let narrowed = searched
    if (usingFullFilters) {
      narrowed = searched.filter((c) =>
        /* Parent filter is bypassed in idle mode because the rail
           click already declared the user's parent intent. */
        categoryPassesFullFilters(c, filters, { applyParent: isSearching }),
      )
    } else if (compactToolbar) {
      narrowed = searched.filter((c) => matchesTone(c, toneFilter))
    }
    return sortRows(narrowed, sortBy, direction)
  }, [
    sourcePool,
    q,
    isSearching,
    compactToolbar,
    toneFilter,
    usingFullFilters,
    filters,
    sortBy,
    direction,
  ])

  /* For the "N matches across M interests" copy in search mode. */
  const matchingInterestCount = useMemo(() => {
    if (!isSearching) return 0
    const seen = new Set()
    for (const c of categories) seen.add(c.interestId)
    return seen.size
  }, [categories, isSearching])

  /* Pagination — mirrors the better-di-in DomainTable pattern
     verbatim (same 20-row page, same reset triggers, same
     in-bounds clamp, same Showing X–Y of N footer + TitanPagination
     markup so the shared `.bdi-domain-table__footer` CSS picks it
     up). Page resets to 1 whenever the source pool changes (active
     interest, sort, search/filter pipeline) so the user always
     lands on the top result after a meaningful change; we clamp
     in a second effect so deletions never strand the user on a
     now-empty page. */
  const [page, setPage] = useState(1)
  const totalRows = categories.length
  const totalPages = Math.max(
    1,
    Math.ceil(totalRows / INTERESTS_TABLE_PAGE_SIZE),
  )

  useEffect(() => {
    setPage(1)
  }, [interest.id, sortBy, direction, isSearching, totalRows])

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pageRows = useMemo(() => {
    const start = (page - 1) * INTERESTS_TABLE_PAGE_SIZE
    return categories.slice(start, start + INTERESTS_TABLE_PAGE_SIZE)
  }, [categories, page])

  const rangeStart =
    totalRows === 0 ? 0 : (page - 1) * INTERESTS_TABLE_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * INTERESTS_TABLE_PAGE_SIZE, totalRows)

  const sortDescriptor = toSortDescriptor(sortBy, direction)

  function handleSortChange(desc) {
    onSortChange(fromSortDescriptor(desc))
  }

  const sectionLabel = isSearching
    ? 'Category search results'
    : `${interest.name} categories`

  /* Counts displayed in the compact toolbar:
     · totalAll = size of the pool before search/tone (so the user
       reads "12 of 25 categories" not "12 of 12").
     · totalFiltered = size after search + tone. */
  const totalAll = sourcePool.length
  const totalFiltered = categories.length

  return (
    <section className="topics-panel" aria-label={sectionLabel}>
      {hideToolbar ? null : compactToolbar ? (
        <CompactToolbar
          query={query}
          setQuery={setQuery}
          toneFilter={toneFilter}
          setToneFilter={setToneFilter}
          totalAll={totalAll}
          totalFiltered={totalFiltered}
          isSearching={isSearching}
          searchAriaLabel={
            isSearching
              ? 'Search categories across all interests'
              : `Search categories in ${interest.name}`
          }
          hideSearch={hideSearch}
        />
      ) : (
        <header className="topics-panel__head">
          <div className="topics-panel__title-block">
            <h2 className="topics-panel__title">
              {isSearching ? 'Search results' : interest.name}
            </h2>
            <p className="topics-panel__sub">
              {isSearching ? (
                <>
                  <span className="bdi-num">{categories.length}</span>{' '}
                  {categories.length === 1 ? 'match' : 'matches'}
                  {matchingInterestCount > 0 ? (
                    <>
                      {' across '}
                      <span className="bdi-num">{matchingInterestCount}</span>{' '}
                      {matchingInterestCount === 1 ? 'interest' : 'interests'}
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="bdi-num">{interest.count}</span>{' '}
                  {interest.count === 1 ? 'category' : 'categories'}
                </>
              )}
            </p>
          </div>
          <div className="topics-panel__search">
            <TitanInputField
              aria-label="Search categories across all interests"
              placeholder="Search categories…"
              leadingIcon={<Search size={14} aria-hidden />}
              value={query}
              onChange={(e) => setQuery(e?.target?.value ?? e ?? '')}
              onClear={() => setQuery('')}
              endIcon={query ? <X size={14} aria-hidden /> : null}
            />
          </div>
        </header>
      )}

      {categories.length === 0 ? (
        <EmptyState
          query={query}
          onClearSearch={() => setQuery('')}
          hasFilter={
            usingFullFilters
              ? hasActiveFullFilter
              : Boolean(toneFilter) && toneFilter !== 'all'
          }
          onClearFilter={
            usingFullFilters
              ? () => onClearFullFilters?.()
              : () => setToneFilter?.('all')
          }
        />
      ) : (
        <>
          <TitanTable
            aria-label={
              isSearching
                ? 'Category search results'
                : `Categories in ${interest.name}`
            }
            className="topics-table"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
          >
            <TitanTableHeader>
              <TitanColumn id="name" isRowHeader allowsSorting>
                Category
              </TitanColumn>
              <TitanColumn
                id="audiencePen"
                allowsSorting
                numericSort
                className="bdi-col-penetration"
              >
                <span className="bdi-th-with-info">
                  <span>Penetration &amp; reach</span>
                  <HeaderInfo
                    label="What is penetration & reach?"
                    tooltip={PENREACH_COLUMN_TOOLTIP}
                  />
                </span>
              </TitanColumn>
              <TitanColumn id="selectivity" allowsSorting numericSort>
                <span className="bdi-th-with-info">
                  <span>Affinity</span>
                  <HeaderInfo
                    label="What is Affinity?"
                    tooltip={AFFINITY_COLUMN_TOOLTIP}
                  />
                </span>
              </TitanColumn>
            </TitanTableHeader>
            <TitanTableBody>
              {pageRows.map((c) => (
                <TitanRow key={c.id} id={c.id} textValue={c.name}>
                  <TitanCell>
                    <TitleCell
                      title={c.name}
                      subMeta={isSearching ? c.interestName : null}
                    />
                  </TitanCell>
                  <TitanCell className="bdi-cell-penetration">
                    <PenReachCell
                      audiencePen={c.audiencePen}
                      baselinePen={c.baselinePen}
                      audReach={c.profiles}
                      benchReach={
                        (c.baselinePen / 100) * REPORT_META.baselineSize
                      }
                    />
                  </TitanCell>
                  <TitanCell className="bdi-cell-affinity">
                    <AffinityCell selectivity={c.selectivity} />
                  </TitanCell>
                </TitanRow>
              ))}
            </TitanTableBody>
          </TitanTable>
          {/* Pagination footer — same class hierarchy as the
              better-di-in DomainTable so the shared CSS handles
              alignment (range left, page nav centered, single-page
              variant pulls in the top padding). The pagination
              container always renders so the footer height stays
              constant whether the table fits in one page or not;
              `TitanPagination` itself only appears when > 1 page. */}
          <footer
            className={`bdi-domain-table__footer${
              totalPages <= 1 ? ' bdi-domain-table__footer--single' : ''
            }`}
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
        </>
      )}
    </section>
  )
}

/* Default cap on how many interests show in the rail before
   collapsing the tail. 8 sits inside Miller's 7±2 chunks and is
   the historic default for the standalone topics app. Callers
   can override via the `railTopN` prop on TopicsView — the
   unified `improving-di` shell lowers it to 5 and pairs it with
   `compactExpanded` so the full 25-tab "show all" view shrinks
   row height to fit the column. */
const DEFAULT_RAIL_TOP_N = 8

/* TopicsView — workspace shell. The 25 interests are the primary
   navigation: a custom vertical rail on the left (we reach for
   react-aria primitives instead of TitanTabs because we need a
   footer "show top/all" toggle that wraps the tablist).
   Visual contract stays on Titan via the `tabs-root
   tabs-root-vertical` / `tabs-list tabs-list-vertical` /
   `tab-trigger tab-trigger-vertical` classes from
   titan-compositions.css.

   First-glance noise control:
   · Collapsed by default to the top 8 most differentiating
     interests (INTERESTS is already sorted by avg affinity desc).
     The active interest is always included even if it falls
     outside the top 8 so the rail never "loses" the panel it's
     currently rendering.
   · "Show all 25" / "Show top 8" toggle at the bottom of the
     rail. The choice persists until the user reloads.

   Unified search: the panel's category search is *universal* —
   it spans every interest's categories, so a query survives
   interest changes. While the query is non-empty the rail also
   reacts: every interest stays visible, but its count column
   flips to "matches in this interest", and interests with zero
   matches dim down. One search field, two surfaces in sync. */
export default function TopicsView({
  query,
  setQuery,
  sortBy,
  direction,
  onSortChange,
  activeInterestId,
  setActiveInterestId,
  /* Compact-toolbar mode (opt-in). When true, the panel header
     swaps for the Brands-style toolbar (search + filter + count)
     and the title block is dropped because the active interest
     is already visible in the vertical rail tab. The unified
     `improving-di` shell turns this on; the standalone topics
     app keeps the original header (default false). */
  compactToolbar = false,
  toneFilter = 'all',
  setToneFilter,
  /* Full filter set (improving-di only). When supplied, the
     panel runs the same 4-axis predicate as the brands
     FiltersPanel. Standalone topics keeps passing only
     `toneFilter`, so these stay null and the legacy code path
     runs. */
  filters = null,
  setFilters,
  hasActiveFullFilter = false,
  onClearFullFilters,
  /* Rail tuning (opt-in). Defaults keep the standalone topics app
     identical to before:
     · railTopN = 8 (Miller's law cap)
     · compactExpanded = false (constant row height)
     improving-di passes railTopN=5 + compactExpanded=true so the
     idle view is shorter (5 strongest signals) and "Show all 25"
     squeezes row height + font so the full 25-tab list fits the
     column without a vertical scroll mile. */
  railTopN = DEFAULT_RAIL_TOP_N,
  compactExpanded = false,
  /* Forwarded to InterestPanel → CompactToolbar. The unified
     `improving-di` shell sets this to true and hosts a single
     workspace-level search bar above the rail, so the panel
     stops painting its own. */
  hideSearch = false,
  /* Stronger opt-out: when true, the panel skips its own toolbar
     entirely (search, filter trigger, count, download). The
     improving-di shell sets this and rebuilds those controls in
     the UniversalSearchBar above the rail so a single bar serves
     the whole workspace. */
  hideToolbar = false,
}) {
  const [railExpanded, setRailExpanded] = useState(false)

  /* Single source of search truth: the panel's `query` (Search
     categories) drives the rail too. When active we count, per
     interest, how many of its categories match — the count is
     then surfaced in the rail next to the name. The data model
     is small (25 interests × ~10 cats each) so a single linear
     pass per keystroke is cheap and avoids any indexing.
     A category counts as a match when EITHER its own name OR its
     parent interest's name contains the query — typing "tv" must
     surface "Film & TV" even though none of that interest's
     individual category names contain the substring. Treating the
     interest name as searchable mirrors the user's mental model:
     they're navigating to a scope, not just listing a row. */
  const matchesByInterest = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const acc = new Map()
    for (const c of ALL_CATEGORIES) {
      const hit =
        c.name.toLowerCase().includes(q) ||
        c.interestName.toLowerCase().includes(q)
      if (hit) {
        acc.set(c.interestId, (acc.get(c.interestId) ?? 0) + 1)
      }
    }
    return acc
  }, [query])

  const isSearching = matchesByInterest !== null

  /* Cap pipeline. While searching, the rail collapses to only the
     interests that actually carry matches — dimming 22 of 25 rows
     to "0" turned out to be visual noise (Miller's law: the eye
     should land on signal, not skip past zeros). When idle we show
     top N plus the active interest so the rail never "loses" the
     panel it's currently rendering. */
  const visibleInterests = useMemo(() => {
    if (isSearching) {
      return INTERESTS.filter((i) => (matchesByInterest.get(i.id) ?? 0) > 0)
    }
    if (railExpanded) return INTERESTS
    const top = INTERESTS.slice(0, railTopN)
    if (activeInterestId && !top.some((i) => i.id === activeInterestId)) {
      const active = INTERESTS.find((i) => i.id === activeInterestId)
      if (active) return [...top, active]
    }
    return top
  }, [isSearching, matchesByInterest, railExpanded, activeInterestId, railTopN])

  const hiddenCount = INTERESTS.length - visibleInterests.length
  const showToggle = !isSearching && INTERESTS.length > railTopN
  const railEmpty = isSearching && visibleInterests.length === 0
  /* Compact rail mode kicks in only when (a) the caller opted into
     `compactExpanded` AND (b) the user explicitly expanded the
     rail. Search mode keeps the comfortable size because the rail
     is already narrowed to just the matching interests — density
     would be over-optimising for a list that's usually 0-5 rows. */
  const railIsCompact = compactExpanded && railExpanded && !isSearching

  const activeInterest =
    INTERESTS.find((i) => i.id === activeInterestId) ?? INTERESTS[0]

  return (
    <section className="topics-workspace" aria-label="Interests">
      <Tabs
        orientation="vertical"
        className="tabs-root tabs-root-vertical topics-tabs"
        selectedKey={activeInterest.id}
        onSelectionChange={(key) => {
          /* Category search is universal, so it survives interest
             changes — no reset here. */
          setActiveInterestId(String(key))
        }}
      >
        <div className="topics-rail">
          <TabList
            className={`tabs-list tabs-list-vertical topics-rail__list${
              railIsCompact ? ' topics-rail__list--compact' : ''
            }`}
            aria-label="Interests"
          >
            {visibleInterests.map((i) => {
              /* While searching, the count column flips meaning: it
                 reads "this many of my categories matched" (the
                 only reason this interest survived the rail filter
                 in the first place), not "this many categories I
                 host in total". */
              const matchCount = isSearching
                ? matchesByInterest.get(i.id) ?? 0
                : i.count
              return (
                <Tab
                  key={i.id}
                  id={i.id}
                  className={`tab-trigger tab-trigger-vertical topics-rail__tab${
                    railIsCompact ? ' topics-rail__tab--compact' : ''
                  }`}
                >
                  <span className="topics-rail__tab-name">{i.name}</span>
                  <span className="topics-rail__tab-count bdi-num">
                    {matchCount}
                  </span>
                </Tab>
              )
            })}
          </TabList>

          {railEmpty ? (
            <p className="topics-rail__empty" role="status">
              No interests match this search.
            </p>
          ) : null}

          {showToggle ? (
            <button
              type="button"
              className="topics-rail__toggle"
              onClick={() => setRailExpanded((v) => !v)}
              aria-expanded={railExpanded}
            >
              {railExpanded ? (
                <>
                  <ChevronUp size={14} aria-hidden />
                  Show top {railTopN}
                </>
              ) : (
                <>
                  <ChevronDown size={14} aria-hidden />
                  Show all {INTERESTS.length}
                  {hiddenCount > 0 ? (
                    <span className="topics-rail__toggle-count">
                      +{hiddenCount}
                    </span>
                  ) : null}
                </>
              )}
            </button>
          ) : null}
        </div>

        {/* One TabPanel per interest, but we only render real
            content for the active one — keeps the DOM light when
            25 interests could otherwise each carry their own
            table. */}
        {INTERESTS.map((i) => (
          <TabPanel key={i.id} id={i.id} className="tab-panel topics-tab-panel">
            {i.id === activeInterest.id ? (
              <InterestPanel
                interest={i}
                query={query}
                setQuery={setQuery}
                sortBy={sortBy}
                direction={direction}
                onSortChange={onSortChange}
                compactToolbar={compactToolbar}
                toneFilter={toneFilter}
                setToneFilter={setToneFilter}
                filters={filters}
                hasActiveFullFilter={hasActiveFullFilter}
                onClearFullFilters={onClearFullFilters}
                hideSearch={hideSearch}
                hideToolbar={hideToolbar}
              />
            ) : null}
          </TabPanel>
        ))}
      </Tabs>
    </section>
  )
}
