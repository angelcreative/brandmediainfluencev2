import { useEffect, useMemo, useState } from 'react'
import {
  TitanButton,
  TitanCell,
  TitanColumn,
  TitanDrawer,
  TitanIconButton,
  TitanInputField,
  TitanNavbar,
  TitanPill,
  TitanRangeSlider,
  TitanRow,
  TitanSelect,
  TitanTable,
  TitanTableBody,
  TitanTableHeader,
  TitanTabs,
} from 'titan-compositions'
import { ScatterChart } from '@mui/x-charts/ScatterChart'
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine'
import {
  ChartsTooltipContainer,
  useItemTooltip,
} from '@mui/x-charts/ChartsTooltip'
import { useSeries } from '@mui/x-charts/hooks'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Download,
  Info,
  Minus,
  RotateCcw,
  Search,
} from 'lucide-react'

import { DOMAINS, REPORT_META } from '../data/audienceData.js'

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

function trendIcon(sel, size = 14) {
  if (sel >= 1.05) {
    return (
      <ArrowUpRight size={size} strokeWidth={2.5} className="bdi-trend--up" aria-hidden />
    )
  }
  if (sel <= 0.95) {
    return (
      <ArrowDownRight size={size} strokeWidth={2.5} className="bdi-trend--down" aria-hidden />
    )
  }
  return <Minus size={size} strokeWidth={2.5} className="bdi-trend--flat" aria-hidden />
}

/* Column header info — shows a hover tooltip without interfering
   with the parent sort button. The span is non-focusable (avoids
   nested-focusable inside the sort button) and stops pointer
   propagation so a click on the icon doesn't trigger sorting. */
function HeaderInfo({ tooltip, label }) {
  return (
    <span
      className="bdi-th-info"
      data-tooltip={tooltip}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      aria-label={label}
    >
      <Info size={12} aria-hidden />
      <span className="bdi-th-info__sr">{tooltip}</span>
    </span>
  )
}

function flattenItems(domain) {
  return domain.categories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, category: cat.title, categoryId: cat.id })),
  )
}

/* -------------------------------------------------------------
   Page header
------------------------------------------------------------- */
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
        </div>
        <p className="bdi-header__sub">
          Brand, media and influence landscape — what this audience over- and under-indexes
          against benchmark.
        </p>
      </div>
      <dl className="bdi-meta-strip">
        <div>
          <dt>Target</dt>
          <dd>{REPORT_META.target}</dd>
        </div>
        <div>
          <dt>Benchmark</dt>
          <dd>{REPORT_META.benchmark}</dd>
        </div>
        <div>
          <dt>Share</dt>
          <dd>{REPORT_META.share}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{REPORT_META.updated}</dd>
        </div>
      </dl>
    </header>
  )
}

/* -------------------------------------------------------------
   Scatter chart — penetration × selectivity
   Up to 9 mini series (3 size buckets × 3 directions).
------------------------------------------------------------- */
function buildChartSeries(items) {
  const groups = {
    'over-l': [],
    'over-m': [],
    'over-s': [],
    'neutral-l': [],
    'neutral-m': [],
    'neutral-s': [],
    'under-l': [],
    'under-m': [],
    'under-s': [],
  }

  items.forEach((item, idx) => {
    const dir = direction(item.sel)
    const sizeBucket = item.pen >= 20 ? 'l' : item.pen >= 5 ? 'm' : 's'
    groups[`${dir}-${sizeBucket}`].push({
      x: item.pen,
      y: item.sel,
      id: `${item.categoryId}-${idx}`,
      name: item.name,
      category: item.category,
    })
  })

  const sizeMap = { s: 7, m: 11, l: 16 }
  const colorMap = {
    over: {
      s: 'var(--color-aquamarine-400)',
      m: 'var(--color-aquamarine-600)',
      l: 'var(--color-aquamarine-800)',
    },
    neutral: {
      s: 'var(--color-steel-300)',
      m: 'var(--color-steel-500)',
      l: 'var(--color-steel-700)',
    },
    under: {
      s: 'var(--color-tomato-400)',
      m: 'var(--color-tomato-600)',
      l: 'var(--color-tomato-800)',
    },
  }
  const labelMap = {
    over: 'Over-indexed',
    neutral: 'On benchmark',
    under: 'Under-indexed',
  }

  const out = []
  Object.entries(groups).forEach(([key, points]) => {
    if (!points.length) return
    const [dir, size] = key.split('-')
    out.push({
      type: 'scatter',
      id: key,
      data: points,
      color: colorMap[dir][size],
      markerSize: sizeMap[size],
      label: labelMap[dir],
      valueFormatter: (v) => {
        const point = points.find((p) => p.x === v.x && p.y === v.y)
        return point
          ? `${point.name} · ${v.x.toFixed(1)}% · ${v.y.toFixed(2)}×`
          : `${v.x.toFixed(1)}% · ${v.y.toFixed(2)}×`
      },
    })
  })
  return out
}

/* -------------------------------------------------------------
   Scatter chart — custom tooltip
   3-line layout: [icon + direction], [item name], [reach · index]
------------------------------------------------------------- */
const TOOLTIP_DIR_LABEL = {
  over: 'Over-indexed',
  neutral: 'On benchmark',
  under: 'Under-indexed',
}

function LandscapeTooltipContent() {
  const itemTooltip = useItemTooltip()
  const series = useSeries()
  if (!itemTooltip) return null

  const { identifier } = itemTooltip
  const seriesEntry = series.scatter?.series?.[identifier.seriesId]
  const point = seriesEntry?.data?.[identifier.dataIndex]
  if (!point) return null

  const dir = String(identifier.seriesId).split('-')[0]
  const Icon = dir === 'over' ? ArrowUpRight : dir === 'under' ? ArrowDownRight : Minus

  return (
    <div className={`bdi-tooltip bdi-tooltip--${dir}`}>
      <p className="bdi-tooltip__head">
        <Icon size={11} strokeWidth={2.5} aria-hidden />
        <span>{TOOLTIP_DIR_LABEL[dir] ?? 'Item'}</span>
      </p>
      <p className="bdi-tooltip__name">{point.name}</p>
      <p className="bdi-tooltip__meta">
        <span>{point.x.toFixed(1)}%</span>
        <span aria-hidden>·</span>
        <span>{point.y.toFixed(2)}×</span>
      </p>
    </div>
  )
}

function LandscapeTooltip(props) {
  return (
    <ChartsTooltipContainer {...props} trigger="item">
      <LandscapeTooltipContent />
    </ChartsTooltipContainer>
  )
}

function LandscapeChart({ domain }) {
  const items = useMemo(() => flattenItems(domain), [domain])
  const series = useMemo(() => buildChartSeries(items), [items])
  const [hiddenDirs, setHiddenDirs] = useState(() => new Set())

  if (!items.length) return null

  const yMax = Math.max(2.4, ...items.map((i) => i.sel)) + 0.05
  const yMin = Math.min(0.4, ...items.map((i) => i.sel)) - 0.05
  const xMax = Math.max(...items.map((i) => i.pen), 5) * 1.05

  const visibleSeries = series.filter(
    (s) => !hiddenDirs.has(String(s.id).split('-')[0]),
  )

  function toggleDir(dir) {
    setHiddenDirs((prev) => {
      const next = new Set(prev)
      if (next.has(dir)) next.delete(dir)
      else next.add(dir)
      return next
    })
  }

  const legendDirs = [
    { id: 'over', label: 'Over-indexed' },
    { id: 'neutral', label: 'On benchmark' },
    { id: 'under', label: 'Under-indexed' },
  ]

  return (
    <section className="bdi-card bdi-chart-card">
      <header className="bdi-card__head">
        <div>
          <p className="bdi-eyebrow">Landscape</p>
          <h2>Reach × Index</h2>
          <p className="bdi-card__sub">
            Each dot is one item. Horizontal axis is reach (penetration), vertical axis is index
            (selectivity). The dashed line at 1.00× is benchmark — above is over-indexed, below
            is under-indexed. Dot size encodes reach.
          </p>
        </div>
      </header>

      <div className="bdi-chart-wrap">
        <ScatterChart
          series={visibleSeries}
          xAxis={[
            {
              label: 'Reach — % of audience',
              min: 0,
              max: xMax,
              valueFormatter: (v) => `${v}%`,
            },
          ]}
          yAxis={[
            {
              label: 'Index — × benchmark',
              min: yMin,
              max: yMax,
              valueFormatter: (v) => `${v.toFixed(2)}×`,
            },
          ]}
          height={380}
          margin={{ top: 16, right: 24, bottom: 60, left: 60 }}
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
      </div>

      <ul className="bdi-chart-legend" aria-label="Legend — click to filter">
        {legendDirs.map((d) => {
          const off = hiddenDirs.has(d.id)
          return (
            <li key={d.id}>
              <button
                type="button"
                className={`bdi-chart-legend__btn bdi-chart-legend__btn--${d.id}${
                  off ? ' is-off' : ''
                }`}
                aria-pressed={!off}
                onClick={() => toggleDir(d.id)}
              >
                <span className={`bdi-dot bdi-dot--${d.id}`} aria-hidden />
                {d.label}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* -------------------------------------------------------------
   Detail card — one per category, with Titan table
------------------------------------------------------------- */
function CategoryCard({ category, onOpen }) {
  const [sortDescriptor, setSortDescriptor] = useState({
    column: 'sel',
    direction: 'descending',
  })

  if (!category.items.length) {
    return (
      <article className="bdi-card bdi-cat bdi-cat--empty">
        <header className="bdi-cat__head">
          <h3>{category.title}</h3>
          <p className="bdi-cat__path">{category.breadcrumb}</p>
        </header>
        <div className="bdi-cat__empty">{category.empty || 'No items above threshold.'}</div>
      </article>
    )
  }

  const sorted = [...category.items].sort((a, b) => {
    const dir = sortDescriptor.direction === 'ascending' ? 1 : -1
    if (sortDescriptor.column === 'name') {
      return a.name.localeCompare(b.name) * dir
    }
    if (sortDescriptor.column === 'pen') {
      return (a.pen - b.pen) * dir
    }
    return (a.sel - b.sel) * dir
  })
  const top = sorted.slice(0, 5)
  const over = category.items.filter((i) => i.sel >= 1.2).length
  const under = category.items.filter((i) => i.sel < 0.8).length
  const maxPen = Math.max(1, ...category.items.map((i) => i.pen))

  return (
    <article className="bdi-card bdi-cat">
      <header className="bdi-cat__head">
        <h3>{category.title}</h3>
        <p className="bdi-cat__path">{category.breadcrumb}</p>
        <ul className="bdi-cat__stats" aria-label="Category stats">
          <li className="bdi-chip">
            <span className="bdi-chip__value">{category.items.length}</span>
            <span className="bdi-chip__label">items</span>
          </li>
          <li className="bdi-chip bdi-chip--up">
            <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
            <span className="bdi-chip__value">{over}</span>
            <span className="bdi-chip__label">over</span>
          </li>
          <li className="bdi-chip bdi-chip--down">
            <ArrowDownRight size={12} strokeWidth={2.5} aria-hidden />
            <span className="bdi-chip__value">{under}</span>
            <span className="bdi-chip__label">under</span>
          </li>
        </ul>
      </header>

      <div className="bdi-cat__table">
        <TitanTable
          aria-label={`${category.title} top items`}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <TitanTableHeader>
            <TitanColumn id="name" isRowHeader allowsSorting>
              Item
            </TitanColumn>
            <TitanColumn id="pen" alignment="right" allowsSorting numericSort>
              <span className="bdi-th-with-info">
                <span>Reach</span>
                <HeaderInfo
                  label="What is reach?"
                  tooltip="Reach is the share of this audience that engages with the item. Higher reach means broader penetration."
                />
              </span>
            </TitanColumn>
            <TitanColumn id="reachBar" alignment="left" aria-label="Reach visualization">
              {''}
            </TitanColumn>
            <TitanColumn id="sel" alignment="right" allowsSorting numericSort>
              <span className="bdi-th-with-info">
                <span>Index</span>
                <HeaderInfo
                  label="What is index?"
                  tooltip="Index measures how strongly this audience over- or under-engages versus benchmark. 1.00× = on par; above is over-indexed, below is under-indexed."
                />
              </span>
            </TitanColumn>
          </TitanTableHeader>
          <TitanTableBody>
            {top.map((item) => (
              <TitanRow key={item.name}>
                <TitanCell>{item.name}</TitanCell>
                <TitanCell alignment="right" className="bdi-num">
                  {item.pen.toFixed(1)}%
                </TitanCell>
                <TitanCell className="bdi-cat__bar-cell">
                  <span
                    className={`bdi-cat__bar bdi-cat__bar--${direction(item.sel)}`}
                    aria-hidden
                  >
                    <span
                      className="bdi-cat__bar-fill"
                      style={{ width: `${(item.pen / maxPen) * 100}%` }}
                    />
                  </span>
                </TitanCell>
                <TitanCell alignment="right">
                  <TitanPill state={pillState(item.sel)} tone="emphasis">
                    {trendIcon(item.sel, 11)} {item.sel.toFixed(2)}×
                  </TitanPill>
                </TitanCell>
              </TitanRow>
            ))}
          </TitanTableBody>
        </TitanTable>
      </div>

      <footer className="bdi-cat__footer">
        <TitanButton variant="tertiary" onPress={() => onOpen(category)}>
          View all {category.items.length}
        </TitanButton>
      </footer>
    </article>
  )
}

/* -------------------------------------------------------------
   Drill drawer — search · sort · range filters
------------------------------------------------------------- */
const SORT_OPTIONS = [
  { id: 'sel-desc', label: 'Index (high → low)' },
  { id: 'sel-asc', label: 'Index (low → high)' },
  { id: 'pen-desc', label: 'Reach (high → low)' },
  { id: 'pen-asc', label: 'Reach (low → high)' },
  { id: 'name-asc', label: 'Name (A → Z)' },
]

function applyFilters(items, q, sortKey, penRange, selRange) {
  const norm = q.trim().toLowerCase()
  const list = items.filter((i) => {
    if (norm && !i.name.toLowerCase().includes(norm)) return false
    if (i.pen < penRange[0] || i.pen > penRange[1]) return false
    if (i.sel < selRange[0] || i.sel > selRange[1]) return false
    return true
  })
  switch (sortKey) {
    case 'sel-asc':
      list.sort((a, b) => a.sel - b.sel)
      break
    case 'pen-desc':
      list.sort((a, b) => b.pen - a.pen)
      break
    case 'pen-asc':
      list.sort((a, b) => a.pen - b.pen)
      break
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'sel-desc':
    default:
      list.sort((a, b) => b.sel - a.sel)
  }
  return list
}

function DrillDrawer({ category, isOpen, onClose }) {
  const items = category?.items ?? []

  const bounds = useMemo(() => {
    const pens = items.map((i) => i.pen)
    const sels = items.map((i) => i.sel)
    const penMax = Math.max(100, Math.ceil(Math.max(0, ...pens)))
    const selMax = Math.max(3, Math.ceil(Math.max(0, ...sels) * 10) / 10)
    return { pen: [0, penMax], sel: [0, selMax] }
  }, [items])

  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState('sel-desc')
  const [penRange, setPenRange] = useState(bounds.pen)
  const [selRange, setSelRange] = useState(bounds.sel)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    setPenRange(bounds.pen)
    setSelRange(bounds.sel)
    setResetKey((k) => k + 1)
  }, [category?.id, bounds.pen, bounds.sel])

  const filtered = useMemo(
    () => applyFilters(items, q, sortKey, penRange, selRange),
    [items, q, sortKey, penRange, selRange],
  )

  const overItems = filtered.filter((i) => i.sel >= 1.2)
  const neutralItems = filtered.filter((i) => i.sel >= 0.8 && i.sel < 1.2)
  const underItems = filtered.filter((i) => i.sel < 0.8)

  const total = items.length
  const overTotal = items.filter((i) => i.sel >= 1.2).length
  const underTotal = items.filter((i) => i.sel < 0.8).length
  const avgSel = items.length
    ? (items.reduce((sum, i) => sum + i.sel, 0) / items.length).toFixed(2)
    : '—'
  const maxPen = Math.max(1, ...items.map((i) => i.pen))

  const isPenFiltered = penRange[0] !== bounds.pen[0] || penRange[1] !== bounds.pen[1]
  const isSelFiltered = selRange[0] !== bounds.sel[0] || selRange[1] !== bounds.sel[1]
  const canReset = q !== '' || sortKey !== 'sel-desc' || isPenFiltered || isSelFiltered

  function reset() {
    setQ('')
    setSortKey('sel-desc')
    setPenRange(bounds.pen)
    setSelRange(bounds.sel)
    setResetKey((k) => k + 1)
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <TitanDrawer
      title={category?.title || ''}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      onClose={handleClose}
    >
      <div className="bdi-drawer">
        <p className="bdi-drawer__path">{category?.breadcrumb}</p>

        <dl className="bdi-drawer__stats">
          <div className="bdi-drawer__stat bdi-drawer__stat--avg">
            <dt>Avg index</dt>
            <dd>{avgSel}×</dd>
          </div>
          <div className="bdi-drawer__stat bdi-drawer__stat--over">
            <dt>Over-indexed</dt>
            <dd>{overTotal}</dd>
          </div>
          <div className="bdi-drawer__stat bdi-drawer__stat--under">
            <dt>Under-indexed</dt>
            <dd>{underTotal}</dd>
          </div>
          <div className="bdi-drawer__stat bdi-drawer__stat--total">
            <dt>Total</dt>
            <dd>{total}</dd>
          </div>
        </dl>

        <div className="bdi-drawer__controls">
          <TitanInputField
            aria-label="Search within category"
            placeholder="Search…"
            value={q}
            onChange={setQ}
            startIcon={<Search size={14} aria-hidden />}
            onClear={() => setQ('')}
          />
          <TitanSelect
            aria-label="Sort"
            options={SORT_OPTIONS}
            selectedKey={sortKey}
            onSelectionChange={(key) => setSortKey(String(key))}
          />
        </div>

        <div className="bdi-drawer__range">
          <div className="bdi-drawer__slider">
            <div className="bdi-drawer__slider-head">
              <span className="bdi-drawer__slider-label">Reach</span>
              <span className="bdi-drawer__slider-value">
                {penRange[0]}% – {penRange[1]}%
              </span>
            </div>
            <TitanRangeSlider
              key={`pen-${category?.id}-${resetKey}`}
              aria-label="Reach range"
              minValue={bounds.pen[0]}
              maxValue={bounds.pen[1]}
              step={1}
              defaultValue={penRange}
              showOutput={false}
              onChange={(value) => setPenRange(value)}
            />
          </div>
          <div className="bdi-drawer__slider">
            <div className="bdi-drawer__slider-head">
              <span className="bdi-drawer__slider-label">Index</span>
              <span className="bdi-drawer__slider-value">
                {selRange[0].toFixed(2)}× – {selRange[1].toFixed(2)}×
              </span>
            </div>
            <TitanRangeSlider
              key={`sel-${category?.id}-${resetKey}`}
              aria-label="Index range"
              minValue={bounds.sel[0]}
              maxValue={bounds.sel[1]}
              step={0.05}
              defaultValue={selRange}
              showOutput={false}
              onChange={(value) => setSelRange(value)}
            />
          </div>
          {canReset && (
            <button type="button" className="bdi-drawer__reset" onClick={reset}>
              <RotateCcw size={12} strokeWidth={2} aria-hidden /> Reset
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="bdi-drawer__empty">No items match the current filters.</p>
        ) : (
          <div className="bdi-drawer__list">
            <p className="bdi-drawer__count">
              {filtered.length === total
                ? `Showing all ${total} items`
                : `Showing ${filtered.length} of ${total}`}
            </p>
            <DrawerSection title="Over-indexed" items={overItems} maxPen={maxPen} tone="over" />
            <DrawerSection
              title="On benchmark"
              items={neutralItems}
              maxPen={maxPen}
              tone="neutral"
            />
            <DrawerSection
              title="Under-indexed"
              items={underItems}
              maxPen={maxPen}
              tone="under"
            />
          </div>
        )}
      </div>
    </TitanDrawer>
  )
}

function DrawerSection({ title, items, maxPen, tone }) {
  if (!items.length) return null
  return (
    <section className={`bdi-drawer__section bdi-drawer__section--${tone}`}>
      <h4>
        {tone === 'over' && (
          <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
        )}
        {tone === 'under' && (
          <ArrowDownRight size={12} strokeWidth={2.5} aria-hidden />
        )}
        {tone === 'neutral' && <Minus size={12} strokeWidth={2.5} aria-hidden />}
        <span>{title}</span>
        <span className="bdi-drawer__count-pill">{items.length}</span>
      </h4>
      <ul>
        {items.map((item) => (
          <li key={item.name}>
            <div className="bdi-drawer__item-name">
              <span>{item.name}</span>
              <div className="bdi-drawer__bar">
                <span
                  className={`bdi-drawer__bar-fill bdi-drawer__bar-fill--${tone}`}
                  style={{ width: `${(item.pen / maxPen) * 100}%` }}
                />
              </div>
            </div>
            <div className="bdi-drawer__item-meta">
              <span className="bdi-num">{item.pen.toFixed(1)}%</span>
              <TitanPill state={pillState(item.sel)} tone="emphasis">
                {trendIcon(item.sel, 11)} {item.sel.toFixed(2)}×
              </TitanPill>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* -------------------------------------------------------------
   Global filters bar — search + tone toggle + reach + index sliders.
   Drives Summary, Chart and Category cards in one shot. Drawer keeps
   its own local refinement state so users can drill deeper without
   losing the global context.
------------------------------------------------------------- */
const TONE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'over', label: 'Over-indexed' },
  { id: 'benchmark', label: 'On benchmark' },
  { id: 'under', label: 'Under-indexed' },
]

function GlobalFilters({
  q,
  setQ,
  tone,
  setTone,
  penRange,
  setPenRange,
  selRange,
  setSelRange,
  bounds,
  resetKey,
  isFiltering,
  clearAll,
  totalAll,
  totalFiltered,
  domainId,
}) {
  return (
    <section className="bdi-filters" aria-label="Filter this domain">
      <div className="bdi-filters__row bdi-filters__row--top">
        <div className="bdi-filters__search">
          <TitanInputField
            aria-label="Search items in this domain"
            placeholder="Search across all categories…"
            value={q}
            onChange={setQ}
            startIcon={<Search size={14} aria-hidden />}
            onClear={() => setQ('')}
          />
        </div>
        <div className="bdi-filters__tone" role="group" aria-label="Filter by index direction">
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`bdi-filters__tone-btn bdi-filters__tone-btn--${t.id}${
                tone === t.id ? ' is-active' : ''
              }`}
              aria-pressed={tone === t.id}
              onClick={() => setTone(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="bdi-filters__count" aria-live="polite">
          {isFiltering ? (
            <>
              <strong>{totalFiltered}</strong>
              <span> of {totalAll}</span>
            </>
          ) : (
            <>
              <strong>{totalAll}</strong>
              <span> items</span>
            </>
          )}
        </p>
        {isFiltering && (
          <button type="button" className="bdi-filters__clear" onClick={clearAll}>
            <RotateCcw size={12} strokeWidth={2} aria-hidden /> Clear all
          </button>
        )}
      </div>
      <div className="bdi-filters__row bdi-filters__row--ranges">
        <div className="bdi-filters__slider">
          <div className="bdi-filters__slider-head">
            <span className="bdi-filters__slider-label">Min reach</span>
            <span className="bdi-filters__slider-value bdi-num">
              {penRange[0]}% – {penRange[1]}%
            </span>
          </div>
          <TitanRangeSlider
            key={`g-pen-${domainId}-${resetKey}`}
            aria-label="Reach range"
            minValue={bounds.pen[0]}
            maxValue={bounds.pen[1]}
            step={1}
            defaultValue={penRange}
            showOutput={false}
            onChange={(value) => setPenRange(value)}
          />
        </div>
        <div className="bdi-filters__slider">
          <div className="bdi-filters__slider-head">
            <span className="bdi-filters__slider-label">Index</span>
            <span className="bdi-filters__slider-value bdi-num">
              {selRange[0].toFixed(2)}× – {selRange[1].toFixed(2)}×
            </span>
          </div>
          <TitanRangeSlider
            key={`g-sel-${domainId}-${resetKey}`}
            aria-label="Index range"
            minValue={bounds.sel[0]}
            maxValue={bounds.sel[1]}
            step={0.05}
            defaultValue={selRange}
            showOutput={false}
            onChange={(value) => setSelRange(value)}
          />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------
   Domain panel
------------------------------------------------------------- */
function DomainPanel({ domain, onOpen }) {
  const allItems = useMemo(() => flattenItems(domain), [domain])

  const bounds = useMemo(() => {
    const pens = allItems.map((i) => i.pen)
    const sels = allItems.map((i) => i.sel)
    return {
      pen: [0, Math.max(100, Math.ceil(Math.max(0, ...pens)))],
      sel: [0, Math.max(3, Math.ceil(Math.max(0, ...sels) * 10) / 10)],
    }
  }, [allItems])

  const [q, setQ] = useState('')
  const [tone, setTone] = useState('all')
  const [penRange, setPenRange] = useState(bounds.pen)
  const [selRange, setSelRange] = useState(bounds.sel)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    setQ('')
    setTone('all')
    setPenRange(bounds.pen)
    setSelRange(bounds.sel)
    setResetKey((k) => k + 1)
  }, [domain.id, bounds.pen, bounds.sel])

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase()
    return {
      ...domain,
      categories: domain.categories.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          if (norm && !item.name.toLowerCase().includes(norm)) return false
          if (item.pen < penRange[0] || item.pen > penRange[1]) return false
          if (item.sel < selRange[0] || item.sel > selRange[1]) return false
          if (tone === 'over' && item.sel < 1.2) return false
          if (tone === 'under' && item.sel >= 0.8) return false
          if (tone === 'benchmark' && (item.sel < 0.8 || item.sel >= 1.2)) return false
          return true
        }),
      })),
    }
  }, [domain, q, tone, penRange, selRange])

  const totalAll = allItems.length
  const totalFiltered = useMemo(
    () => filtered.categories.reduce((n, c) => n + c.items.length, 0),
    [filtered],
  )

  const isFiltering =
    q !== '' ||
    tone !== 'all' ||
    penRange[0] !== bounds.pen[0] ||
    penRange[1] !== bounds.pen[1] ||
    selRange[0] !== bounds.sel[0] ||
    selRange[1] !== bounds.sel[1]

  function clearAll() {
    setQ('')
    setTone('all')
    setPenRange(bounds.pen)
    setSelRange(bounds.sel)
    setResetKey((k) => k + 1)
  }

  const visibleCategories = filtered.categories.filter(
    (c) => !isFiltering || c.items.length > 0,
  )

  return (
    <div className="bdi-panel">
      <GlobalFilters
        q={q}
        setQ={setQ}
        tone={tone}
        setTone={setTone}
        penRange={penRange}
        setPenRange={setPenRange}
        selRange={selRange}
        setSelRange={setSelRange}
        bounds={bounds}
        resetKey={resetKey}
        isFiltering={isFiltering}
        clearAll={clearAll}
        totalAll={totalAll}
        totalFiltered={totalFiltered}
        domainId={domain.id}
      />

      <LandscapeChart domain={filtered} />

      <section className="bdi-cat-grid">
        <header className="bdi-section-head">
          <h2>Categories</h2>
          <p>
            One card per taxonomy leaf — the full ranked list lives in the drill-down.
            {isFiltering &&
              ` ${visibleCategories.length} of ${filtered.categories.length} categories match.`}
          </p>
        </header>
        {visibleCategories.length === 0 ? (
          <div className="bdi-cat-grid__empty">
            No items match your filters.{' '}
            <button type="button" className="bdi-link-btn" onClick={clearAll}>
              Clear all
            </button>
          </div>
        ) : (
          <div className="bdi-cat-grid__items">
            {visibleCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* -------------------------------------------------------------
   Root
------------------------------------------------------------- */
export default function AppShell() {
  const [active, setActive] = useState(DOMAINS[0].id)
  const [drillCat, setDrillCat] = useState(null)

  const tabs = DOMAINS.map((d) => ({
    id: d.id,
    label: d.label,
    content: <DomainPanel domain={d} onOpen={(cat) => setDrillCat(cat)} />,
  }))

  return (
    <div className="bdi-app">
      <TitanNavbar logoAlt="Digital Intelligence for Meta" />

      <main className="bdi-main">
        <PageHeader />

        <div className="bdi-workspace">
          <div className="bdi-workspace__actions">
            <TitanButton variant="tertiary" icon={<Download size={14} aria-hidden />}>
              Export all
            </TitanButton>
          </div>
          <div className="bdi-tabs">
            <TitanTabs
              ariaLabel="Brand · Media · Influence"
              items={tabs}
              selectedKey={active}
              onSelectionChange={(key) => setActive(String(key))}
              orientation="vertical"
            />
          </div>
        </div>
      </main>

      <DrillDrawer
        category={drillCat}
        isOpen={Boolean(drillCat)}
        onClose={() => setDrillCat(null)}
      />
    </div>
  )
}
