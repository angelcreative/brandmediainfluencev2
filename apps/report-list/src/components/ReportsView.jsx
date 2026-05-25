import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { parseDate } from '@internationalized/date'
import { FileText, Info, Lock, LockOpen, RefreshCw, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { Button as AriaButton, Focusable } from 'react-aria-components'
import {
  TitanButton,
  TitanCell,
  TitanColumn,
  TitanIconButton,
  TitanInputField,
  TitanPagination,
  TitanRow,
  TitanTable,
  TitanTableBody,
  TitanTableCellDate,
  TitanTableHeader,
  TitanTooltip,
  renderIconNode,
} from 'titan-compositions'
import {
  SOURCES,
  getApplicableSources,
  getReportTypeLabel,
  getReportTypeShortLabel,
  getReportsListBreadcrumbLabel,
  getSourceLabel,
  getWorkflowLabel,
} from '../data/workflows.js'
import { REPORTS } from '../data/reports.js'
import FiltersPanel from './FiltersPanel.jsx'
import NewReportMenu from './NewReportMenu.jsx'
import ReportCellSkeleton, { skeletonVariantForColumnKey } from './ReportCellSkeleton.jsx'
import ReportRowActions from './ReportRowActions.jsx'
import SourceIcon from './SourceIcon.jsx'

const HEADER_HINT_DATA_SOURCE = 'Networks the audience was sourced from'
const HEADER_HINT_ACTIONS = 'Manage this report'

const REPORT_FAILED_HELP_EMAIL = 'help@audiense.com'

/** Failed report mark (X): tooltip explains failure + mailto support (table + mobile cards). */
function ReportFailedMark() {
  return (
    <TitanTooltip
      title="Report failed"
      body={
        <span className="reports-view__failed-tooltip-body">
          Somehow this report was not built, try again or contact us at{' '}
          <a href={`mailto:${REPORT_FAILED_HELP_EMAIL}`} className="reports-view__tooltip-mailto">
            {REPORT_FAILED_HELP_EMAIL}
          </a>
          .
        </span>
      }
      placement="top"
      delay={0}
      closeDelay={400}
    >
      <Focusable>
        <span
          className="cell-name__failed-x cell-name__failed-x--tooltip-trigger"
          role="img"
          aria-label="Report failed. Show details and support email."
        >
          <X size={16} strokeWidth={2} aria-hidden />
        </span>
      </Focusable>
    </TitanTooltip>
  )
}

/** Spinning refresh while status is processing: explains build state (table + mobile cards). */
function ReportBuildingMark() {
  return (
    <TitanTooltip
      title="We're building this report"
      body="It's generating in the background right now. Step away if you need to—refresh the list in a few minutes, or come back later, to see when it's ready."
      placement="top"
      delay={0}
      closeDelay={250}
    >
      <Focusable>
        <span
          className="cell-name__refresh-wrap"
          aria-label="This report is building now. Refresh the list in a few minutes or come back later to see when it is ready."
        >
          <RefreshCw size={16} strokeWidth={2} className="cell-name__refresh-icon" aria-hidden />
        </span>
      </Focusable>
    </TitanTooltip>
  )
}

/**
 * RAC `TooltipTrigger` (inside TitanTooltip) must attach its ref to a `Focusable` or RAC `Button`
 * child — a raw `<button>` never receives trigger props, so the overlay does not show. Sortable
 * column headers use `usePress` on the `th`; stopping propagation avoids stealing pointer/keyboard
 * from the hint control.
 */
function ReportTableHeaderInfoHint({ description }) {
  return (
    <TitanTooltip content={description} placement="top" delay={0}>
      <Focusable>
        <button
          type="button"
          className="reports-view__th-hint-btn"
          aria-label={description}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
          }}
        >
          <Info size={12} strokeWidth={1.75} aria-hidden />
        </button>
      </Focusable>
    </TitanTooltip>
  )
}

/**
 * Shared report table columns: All workflows, Segment, Profile, and Track use the same set
 * (Type = colored Titan pills). Workflow column is inserted only when search spans workflows.
 */
const REPORT_TABLE_CORE_COLUMNS = [
  { key: 'name', header: 'Report name', sortable: true, alignment: 'left' },
  {
    key: 'source',
    header: 'Source',
    sortable: true,
    alignment: 'center',
    renderHeader: () => (
      <span className="reports-view__th-with-hint">
        <span>Source</span>
        <ReportTableHeaderInfoHint description={HEADER_HINT_DATA_SOURCE} />
      </span>
    ),
  },
  { key: 'type', header: 'Type', sortable: true, alignment: 'left' },
  {
    key: 'audienceSize',
    header: 'Audience size',
    sortable: true,
    alignment: 'left',
  },
  { key: 'createdAt', header: 'Created', sortable: true, alignment: 'left' },
  { key: 'owner', header: 'Creator', sortable: false, alignment: 'center' },
  {
    key: 'actions',
    header: 'Actions',
    sortable: false,
    alignment: 'left',
    renderHeader: () => (
      <span className="reports-view__th-with-hint">
        <span>Actions</span>
        <ReportTableHeaderInfoHint description={HEADER_HINT_ACTIONS} />
      </span>
    ),
  },
]

const WORKFLOW_CONTEXT_COLUMN = { key: 'workflow', header: 'Workflow', sortable: true, alignment: 'left' }

/** Titan table column anatomy (Zero): icon-only / avatar-only / actions slots. */
function tableColumnClassName(key) {
  if (key === 'source') return 'table-col-icon-only'
  if (key === 'owner') return 'table-col-avatar-only'
  if (key === 'actions') return 'table-col-actions'
  return undefined
}

function tableCellClassName(key) {
  if (key === 'source') return 'table-cell-icon-only'
  if (key === 'owner') return 'table-cell-avatar-only'
  if (key === 'actions') return 'table-cell-actions reports-view__td-actions'
  return undefined
}

const PAGE_SIZE = 8
/** Initial table skeleton duration; shimmer timing lives in CSS on `.report-cell-skeleton::after`. */
const LIST_SKELETON_MS = 500

export default function ReportsView({
  workflowId,
  searchQuery = '',
  onSearchChange = () => {},
  dateFrom = null,
  dateTo = null,
  onDateRangeChange,
  onSearchClear,
  onBeginNewReport,
}) {
  const isAllWorkflowsTable = workflowId === 'all'
  const [sortDescriptor, setSortDescriptor] = useState(() =>
    workflowId === 'all'
      ? { column: 'audienceSize', direction: 'ascending' }
      : { column: 'createdAt', direction: 'descending' },
  )
  /** Row selection for report tables (All + Segment/Profile/Track). */
  const [selectedKeys, setSelectedKeys] = useState(() => new Set())
  const [currentPage, setCurrentPage] = useState(1)
  /** When sidebar is All workflows, narrows rows to selected workflows (Segment / Profile / Track). */
  const [workflowFilter, setWorkflowFilter] = useState([])
  const [sourceFilter, setSourceFilter] = useState([])
  /** `null` = any status; otherwise only Finished or Failed. */
  const [statusSingle, setStatusSingle] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filtersDateDrawerOpen, setFiltersDateDrawerOpen] = useState(false)
  const [filtersSession, setFiltersSession] = useState(0)
  const prevWorkflowIdRef = useRef(workflowId)
  /** Initial table paint: pill skeletons in every data cell for `LIST_SKELETON_MS`; footer hidden meanwhile. */
  const [isListSkeleton, setIsListSkeleton] = useState(true)

  const searchActive = Boolean(searchQuery.trim())
  const currentLabel = searchActive ? 'Search results' : getReportsListBreadcrumbLabel(workflowId)
  const listTitle = workflowId === 'all' ? 'All reports' : `${getWorkflowLabel(workflowId)} reports`

  useEffect(() => {
    if (prevWorkflowIdRef.current === workflowId) return
    prevWorkflowIdRef.current = workflowId
    setWorkflowFilter([])
    setSourceFilter([])
    setStatusSingle(null)
    onDateRangeChange?.({ from: null, to: null })
  }, [workflowId, onDateRangeChange])

  useEffect(() => {
    setCurrentPage(1)
  }, [workflowId, searchQuery, workflowFilter, sourceFilter, statusSingle, dateFrom, dateTo])

  useEffect(() => {
    if (workflowId === 'all') {
      setSortDescriptor({ column: 'audienceSize', direction: 'ascending' })
    } else {
      setSortDescriptor({ column: 'createdAt', direction: 'descending' })
    }
  }, [workflowId])

  useLayoutEffect(() => {
    setIsListSkeleton(true)
    const id = window.setTimeout(() => {
      setIsListSkeleton(false)
    }, LIST_SKELETON_MS)
    return () => window.clearTimeout(id)
  }, [workflowId])

  useEffect(() => {
    if (!showFilters) setFiltersDateDrawerOpen(false)
  }, [showFilters])

  const applicableSources = useMemo(() => {
    if (searchActive) return SOURCES.map((s) => s.id)
    if (workflowId === 'all') return SOURCES.map((s) => s.id)
    return getApplicableSources(workflowId)
  }, [workflowId, searchActive])

  const filteredRows = useMemo(() => {
    // Universal search: with any query, scan all reports regardless of sidebar workflow.
    const base = searchActive
      ? REPORTS
      : workflowId === 'all'
        ? REPORTS
        : REPORTS.filter((r) => r.workflow === workflowId)
    return base.filter((r) => {
      if (workflowId === 'all' && workflowFilter.length && !workflowFilter.includes(r.workflow)) return false
      if (sourceFilter.length && !sourceFilter.includes(r.source)) return false
      if (statusSingle) {
        if (statusSingle === 'processing') {
          if (!isRowProcessing(r)) return false
        } else if (r.status !== statusSingle) {
          return false
        }
      }
      if (dateFrom && dateTo) {
        const rowDate = parseDate(r.createdAt)
        if (rowDate.compare(parseDate(dateFrom)) < 0) return false
        if (rowDate.compare(parseDate(dateTo)) > 0) return false
      }
      if (searchActive && !rowMatchesSearch(r, searchQuery)) return false
      return true
    })
  }, [
    workflowId,
    workflowFilter,
    sourceFilter,
    statusSingle,
    searchQuery,
    searchActive,
    dateFrom,
    dateTo,
  ])

  useEffect(() => {
    const allowed = new Set(filteredRows.map((r) => r.id))
    setSelectedKeys((prev) => {
      const next = new Set(
        [...prev].filter((id) => {
          if (!allowed.has(String(id))) return false
          const row = filteredRows.find((r) => String(r.id) === String(id))
          return row && !isRowProcessing(row) && !isRowFailed(row)
        }),
      )
      if (next.size === prev.size && [...prev].every((k) => next.has(k))) return prev
      return next
    })
  }, [filteredRows])

  const sortedRows = useMemo(() => {
    const { column, direction } = sortDescriptor
    const dir = direction === 'ascending' ? 1 : -1
    return [...filteredRows].sort((a, b) => {
      const va = readField(a, column)
      const vb = readField(b, column)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
  }, [filteredRows, sortDescriptor])

  const totalRows = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedRows.slice(start, start + PAGE_SIZE)
  }, [sortedRows, currentPage])

  const blockedRowKeys = useMemo(
    () => new Set(paginatedRows.filter((r) => isRowProcessing(r) || isRowFailed(r)).map((r) => r.id)),
    [paginatedRows],
  )

  const rangeStart = totalRows === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRows)

  // While searching globally (non–all-workflow table), show which workflow each row belongs to.
  const showWorkflowColumn = workflowId === 'all' || searchActive

  const visibleColumns = useMemo(() => {
    if (isAllWorkflowsTable) return REPORT_TABLE_CORE_COLUMNS
    if (showWorkflowColumn) {
      return [
        REPORT_TABLE_CORE_COLUMNS[0],
        WORKFLOW_CONTEXT_COLUMN,
        ...REPORT_TABLE_CORE_COLUMNS.slice(1),
      ]
    }
    return REPORT_TABLE_CORE_COLUMNS
  }, [isAllWorkflowsTable, showWorkflowColumn])

  useEffect(() => {
    setSortDescriptor((prev) => {
      const keys = new Set(visibleColumns.map((c) => c.key))
      if (keys.has(prev.column)) return prev
      return workflowId === 'all'
        ? { column: 'audienceSize', direction: 'ascending' }
        : { column: 'createdAt', direction: 'descending' }
    })
  }, [visibleColumns, workflowId])

  const dateRangeActive = Boolean(dateFrom && dateTo)
  const activeFilterCount =
    workflowFilter.length +
    sourceFilter.length +
    (statusSingle ? 1 : 0) +
    (searchActive ? 1 : 0) +
    (dateRangeActive ? 1 : 0)
  const isEmpty = sortedRows.length === 0
  const canUseBySource = workflowId === 'all'
  const forcedWorkflowId = canUseBySource ? null : workflowId

  const clearAllFilters = () => {
    setWorkflowFilter([])
    setSourceFilter([])
    setStatusSingle(null)
    onDateRangeChange?.({ from: null, to: null })
    onSearchClear?.()
  }

  const selectedKeysSerialized = useMemo(() => [...selectedKeys].sort().join(','), [selectedKeys])

  const onTableSelectionChange = useCallback(
    (keys) => {
      if (keys === 'all') {
        setSelectedKeys(new Set(sortedRows.filter((r) => !isRowProcessing(r) && !isRowFailed(r)).map((r) => r.id)))
        return
      }
      setSelectedKeys(keys instanceof Set ? new Set(keys) : new Set())
    },
    [sortedRows],
  )

  const selectedCount = selectedKeys.size
  const allFilteredReportsSelected =
    sortedRows.length > 0 && sortedRows.every((r) => selectedKeys.has(r.id))

  const handleBulkDeletePress = useCallback(() => {
    // Wire to real delete API when available
    console.info('Bulk delete reports', [...selectedKeys])
    setSelectedKeys(new Set())
  }, [selectedKeys])

  return (
    <div
      className={[
        'reports-view',
        searchActive ? 'reports-view--search-results' : '',
        isAllWorkflowsTable ? 'reports-view--all-workflows-table' : '',
        isListSkeleton ? 'reports-view--list-skeleton-initial' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="reports-view__header">
        <div className="reports-view__title-row">
          <div>
            {searchActive ? (
              <>
                <p className="reports-view__eyebrow">Global search</p>
                <h1 className="reports-view__title">Search results</h1>
                <p className="reports-view__subtitle">
                  Results for &ldquo;{searchQuery.trim()}&rdquo;
                  <span className="reports-view__subtitle-hint">
                    {' '}
                    · Every workflow, not just the sidebar selection
                  </span>
                </p>
              </>
            ) : (
              <h1
                className={
                  workflowId === 'all' && !searchActive
                    ? 'reports-view__title reports-view__title--all-reports'
                    : 'reports-view__title'
                }
              >
                {listTitle}
              </h1>
            )}
          </div>
          {selectedCount > 0 ? (
            <TitanButton variant="delete" onPress={handleBulkDeletePress}>
              {allFilteredReportsSelected
                ? `Delete all reports (${selectedCount})`
                : `Delete (${selectedCount})`}
            </TitanButton>
          ) : (
            <NewReportMenu
              onBeginNewReport={onBeginNewReport}
              forceWorkflowId={forcedWorkflowId}
              allowBySource={canUseBySource}
            />
          )}
        </div>

        <div className="reports-view__toolbar-wrap">
          <div className="reports-view__search-row">
            <TitanInputField
              className="field-root reports-view__search-field"
              aria-label="Search reports"
              placeholder="Search reports"
              value={searchQuery}
              onChange={onSearchChange}
              leadingIcon={renderIconNode('search')}
              endIcon={searchActive ? renderIconNode('x') : undefined}
              onClear={searchActive ? () => onSearchClear?.() : undefined}
            />
            <div className="reports-view__search-actions">
              <TitanIconButton
                variant="secondary"
                className="reports-view__filter-icon"
                aria-label={
                  activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Open filters'
                }
                onPress={() => {
                  setShowFilters((v) => {
                    const next = !v
                    if (next) {
                      setFiltersSession((s) => s + 1)
                    }
                    return next
                  })
                }}
              >
                <SlidersHorizontal size={16} aria-hidden />
              </TitanIconButton>
              {activeFilterCount > 0 && (
                <TitanButton variant="secondary" onPress={clearAllFilters}>
                  Clear all
                </TitanButton>
              )}
            </div>
          </div>
          {showFilters && (
            <div
              className="reports-view__filters-backdrop"
              aria-hidden="true"
              onClick={() => setShowFilters(false)}
            />
          )}
          {showFilters && (
            <div
              className={`reports-view__filters-popover${filtersDateDrawerOpen ? ' reports-view__filters-popover--hidden-while-drawer' : ''}`}
              role="dialog"
              aria-label="Filters"
            >
              <FiltersPanel
                key={filtersSession}
                applicableSources={applicableSources}
                showWorkflowFilters={workflowId === 'all'}
                initialWorkflowFilter={workflowFilter}
                initialSourceFilter={sourceFilter}
                initialStatusSingle={statusSingle}
                initialDateFrom={dateFrom}
                initialDateTo={dateTo}
                onApplyFilters={({
                  workflowFilter: nextWf,
                  sourceFilter: nextSources,
                  statusSingle: nextStatus,
                  dateFrom: nextFrom,
                  dateTo: nextTo,
                }) => {
                  setWorkflowFilter(nextWf)
                  setSourceFilter(nextSources)
                  setStatusSingle(nextStatus ?? null)
                  onDateRangeChange?.({ from: nextFrom, to: nextTo })
                  setShowFilters(false)
                }}
                onClose={() => {
                  setShowFilters(false)
                }}
                onNestedOverlayChange={setFiltersDateDrawerOpen}
              />
            </div>
          )}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          workflowId={workflowId}
          hasFilters={activeFilterCount > 0}
          searchActive={searchActive}
          searchQuery={searchQuery}
          onClearFilters={clearAllFilters}
          onBeginNewReport={onBeginNewReport}
          canUseBySource={canUseBySource}
          forcedWorkflowId={forcedWorkflowId}
        />
      ) : (
        <div className="reports-view__table-wrap">
          <TitanTable
            key={[
              workflowId,
              isListSkeleton ? 'sk' : 'data',
              visibleColumns.map((c) => c.key).join('-'),
            ].join('-')}
            aria-busy={isListSkeleton}
            aria-label={
              searchActive
                ? `Global search results for ${searchQuery.trim()} across all workflows and reports`
                : `Reports in ${currentLabel}`
            }
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={onTableSelectionChange}
            disabledKeys={blockedRowKeys}
          >
            <TitanTableHeader columns={visibleColumns}>
              {(col) => (
                <TitanColumn
                  id={col.key}
                  allowsSorting={col.sortable}
                  isRowHeader={col.key === 'name'}
                  alignment={col.alignment || 'left'}
                  className={tableColumnClassName(col.key)}
                >
                  {col.renderHeader ? col.renderHeader() : col.header}
                </TitanColumn>
              )}
            </TitanTableHeader>
            <TitanTableBody
              items={paginatedRows}
              dependencies={[
                showWorkflowColumn,
                currentPage,
                isAllWorkflowsTable,
                selectedKeysSerialized,
                isListSkeleton,
              ]}
            >
              {(row) => {
                const rowProcessing = isRowProcessing(row)
                const rowFailed = isRowFailed(row)
                return (
                  <TitanRow
                    id={row.id}
                    columns={visibleColumns}
                    className={
                      [rowProcessing && 'reports-table-row--processing', rowFailed && 'reports-table-row--failed']
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                  >
                    {(col) => {
                      const showCellSkeleton = isListSkeleton
                      return (
                        <TitanCell
                          alignment={col.alignment || 'left'}
                          className={tableCellClassName(col.key)}
                        >
                          {showCellSkeleton ? (
                            <span className="report-cell-skeleton-wrap">
                              <ReportCellSkeleton variant={skeletonVariantForColumnKey(col.key)} />
                            </span>
                          ) : (
                            renderCell(row, col.key)
                          )}
                        </TitanCell>
                      )
                    }}
                  </TitanRow>
                )
              }}
            </TitanTableBody>
          </TitanTable>
          <section
            className="reports-view__cards-wrap"
            aria-label={
              searchActive
                ? `Global search results for ${searchQuery.trim()}`
                : `Reports in ${currentLabel}`
            }
          >
            {isListSkeleton
              ? Array.from({ length: 3 }).map((_, i) => (
                  <article
                    key={`mobile-card-skeleton-${i}`}
                    className="reports-view__card reports-view__card--skeleton"
                    aria-hidden="true"
                  >
                    <header className="reports-view__card-header">
                      <span className="reports-view__card-source-icon">
                        <span className="report-cell-skeleton report-cell-skeleton--small" />
                      </span>
                      <span className="report-cell-skeleton report-cell-skeleton--long" />
                    </header>
                    <div className="reports-view__card-tags">
                      <span className="report-cell-skeleton report-cell-skeleton--medium" />
                      <span className="report-cell-skeleton report-cell-skeleton--small" />
                    </div>
                    <dl className="reports-view__card-meta">
                      <div>
                        <dt>Audience</dt>
                        <dd>
                          <span className="report-cell-skeleton report-cell-skeleton--small" />
                        </dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>
                          <span className="report-cell-skeleton report-cell-skeleton--medium" />
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))
              : paginatedRows.map((row) => {
                  const blocked = isRowProcessing(row)
                  const failed = isRowFailed(row)
                  return (
                    <article
                      key={`mobile-card-${row.id}`}
                      className={[
                        'reports-view__card',
                        blocked ? 'reports-view__card--processing' : '',
                        failed ? 'reports-view__card--failed' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <header className="reports-view__card-header">
                        <span
                          className="reports-view__card-source-icon"
                          role="img"
                          aria-label={getSourceLabel(row.source)}
                        >
                          <SourceIcon sourceId={row.source} size={18} />
                        </span>
                        <h3 className="reports-view__card-name reports-view__card-name-row">
                          <span className="reports-view__card-name-text">{row.name}</span>
                          <span className="reports-view__card-name-marks">
                            {blocked ? <ReportBuildingMark /> : null}
                            {failed ? <ReportFailedMark /> : null}
                          </span>
                        </h3>
                      </header>
                      <div className="reports-view__card-tags">
                        <span className="reports-view__card-type">{getReportTypeShortLabel(row.type)}</span>
                      </div>
                      <dl className="reports-view__card-meta">
                        <div>
                          <dt>Audience</dt>
                          <dd>{formatAudienceSize(row.audienceSize)}</dd>
                        </div>
                        <div>
                          <dt>Created</dt>
                          <dd>
                            <CreatedCellWithTooltip value={row.createdAt} />
                          </dd>
                        </div>
                        {showWorkflowColumn ? (
                          <div>
                            <dt>Workflow</dt>
                            <dd>{getWorkflowLabel(row.workflow)}</dd>
                          </div>
                        ) : null}
                        <div className="reports-view__card-meta-field reports-view__card-meta-field--creator">
                          <dt>Creator</dt>
                          <dd>
                            {row.owner?.email ? (
                              <TitanTooltip content={row.owner.email} placement="top" delay={0}>
                                <AriaButton
                                  className="reports-view__card-creator-btn reports-view__owner-tooltip-trigger"
                                  aria-label={`${row.owner.name}, ${row.owner.email}`}
                                >
                                  {row.owner.name}
                                </AriaButton>
                              </TitanTooltip>
                            ) : (
                              row.owner?.name ?? '—'
                            )}
                          </dd>
                        </div>
                      </dl>
                      <div className="reports-view__card-actions">
                        <ReportRowInlineActions row={row} />
                      </div>
                    </article>
                  )
                })}
          </section>
          {!isListSkeleton && (
            <footer
              className={`reports-view__table-footer ${totalPages <= 1 ? 'reports-view__table-footer--single-page' : ''}`}
            >
              <p className="reports-view__table-range" aria-live="polite">
                Showing {rangeStart}–{rangeEnd} of {totalRows}
              </p>
              <div className="reports-view__table-pagination">
                {totalPages > 1 && (
                  <TitanPagination
                    aria-label="Reports table pagination"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setPage={setCurrentPage}
                  />
                )}
              </div>
            </footer>
          )}
        </div>
      )}
    </div>
  )
}

function createdAtTooltipString(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value ?? '—')
  return d.toUTCString()
}

/** Full UTC string on hover/focus (e.g. Wed, 13 Aug 2025 22:12:20 GMT). */
function CreatedCellWithTooltip({ value }) {
  return (
    <TitanTooltip content={createdAtTooltipString(value)} placement="top" delay={0}>
      <Focusable>
        <span className="cell-created-date-trigger">
          <TitanTableCellDate value={value} />
        </span>
      </Focusable>
    </TitanTooltip>
  )
}

/** API may use `processing`, `building`, or other in-flight values — all share the same UI. */
function isRowProcessing(row) {
  const s = String(row?.status ?? '').toLowerCase()
  return s === 'processing' || s === 'building' || s === 'queued' || s === 'pending' || s === 'running'
}

function isRowFailed(row) {
  return String(row?.status ?? '').toLowerCase() === 'failed'
}

function isRowBlocked(row) {
  return isRowProcessing(row) || isRowFailed(row)
}

function rowMatchesSearch(row, rawQuery) {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  const parts = [
    row.id,
    row.name,
    getReportTypeShortLabel(row.type),
    getReportTypeLabel(row.type),
    getSourceLabel(row.source),
    getWorkflowLabel(row.workflow),
    row.owner?.name,
    row.owner?.initials,
    row.owner?.email ?? '',
    row.status,
    row.access,
    row.createdAt,
    row.audienceSize != null ? String(row.audienceSize) : '',
    row.audienceSize != null ? formatAudienceSize(row.audienceSize) : '',
  ]
  return parts.some((p) => String(p).toLowerCase().includes(q))
}

function readField(row, column) {
  switch (column) {
    case 'name':
      return row.name.toLowerCase()
    case 'type':
      return getReportTypeShortLabel(row.type).toLowerCase()
    case 'audienceSize':
      return row.audienceSize ?? 0
    case 'source':
      return getSourceLabel(row.source).toLowerCase()
    case 'workflow':
      return getWorkflowLabel(row.workflow).toLowerCase()
    case 'createdAt':
      return new Date(row.createdAt).getTime()
    default:
      return ''
  }
}

function formatAudienceSize(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(n)
}

function ownerFirstInitial(owner) {
  const initials = owner?.initials?.trim()
  if (initials) return initials[0].toUpperCase()
  const name = owner?.name?.trim()
  if (name) return name[0].toUpperCase()
  return '?'
}

/** Processing / building: details icon only (spinner lives by report name). Failed: details + delete. Else: details + lock + kebab. */
function ReportRowInlineActions({ row }) {
  if (isRowProcessing(row)) {
    return (
      <div className="reports-row-actions reports-row-actions--processing-only">
        <TitanTooltip
          title="Report building"
          body="You can open report details while we finish generating it. Lock, menu, and other actions will be available when it is ready."
          placement="top"
          delay={0}
        >
          <Focusable>
            <button
              type="button"
              className="icon-base reports-row-actions__btn"
              aria-label="See report details"
              onClick={() => console.info('details', row.id)}
            >
              <FileText size={16} strokeWidth={2} aria-hidden />
            </button>
          </Focusable>
        </TitanTooltip>
      </div>
    )
  }

  if (isRowFailed(row)) {
    return (
      <div className="reports-row-actions reports-row-actions--failed-only">
        <TitanTooltip content="See report details" placement="top" delay={0}>
          <Focusable>
            <button
              type="button"
              className="icon-base reports-row-actions__btn"
              aria-label="See report details"
              onClick={() => console.info('details', row.id)}
            >
              <FileText size={16} strokeWidth={2} aria-hidden />
            </button>
          </Focusable>
        </TitanTooltip>
        <TitanTooltip content="Delete report" placement="top" delay={0}>
          <Focusable>
            <button
              type="button"
              className="icon-base reports-row-actions__btn reports-row-actions__btn--delete"
              aria-label="Delete report"
              onClick={() => console.info('delete', row.id)}
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden />
            </button>
          </Focusable>
        </TitanTooltip>
      </div>
    )
  }

  const isPublic = String(row?.access ?? '').toLowerCase() === 'public'
  return (
    <div className="reports-row-actions">
      <TitanTooltip content="See report details" placement="top" delay={0}>
        <Focusable>
          <button
            type="button"
            className="icon-base reports-row-actions__btn"
            aria-label="See report details"
            onClick={() => console.info('details', row.id)}
          >
            <FileText size={16} strokeWidth={2} aria-hidden />
          </button>
        </Focusable>
      </TitanTooltip>
      <TitanTooltip content={isPublic ? 'Make this report private' : 'Make this report public'} placement="top" delay={0}>
        <Focusable>
          <button
            type="button"
            className={`icon-base reports-row-actions__btn ${isPublic ? 'reports-row-actions__btn--public' : ''}`}
            aria-label={isPublic ? 'Make this report private' : 'Make this report public'}
            onClick={() => console.info(isPublic ? 'make-private' : 'make-public', row.id)}
          >
            {isPublic ? <LockOpen size={16} strokeWidth={2} aria-hidden /> : <Lock size={16} strokeWidth={2} aria-hidden />}
          </button>
        </Focusable>
      </TitanTooltip>
      <ReportRowActions rowId={row.id} access={row.access} status={row.status} ariaLabel="More actions" />
    </div>
  )
}

function renderCell(row, key) {
  const locked = isRowBlocked(row)
  switch (key) {
    case 'name': {
      const processing = isRowProcessing(row)
      const failed = isRowFailed(row)
      return (
        <span className="cell-name-wrap cell-name-wrap--table">
          <span className="cell-name">{row.name}</span>
          <span className="cell-name__marks">
            {processing ? <ReportBuildingMark /> : null}
            {failed ? <ReportFailedMark /> : null}
          </span>
        </span>
      )
    }
    case 'type':
      return <span className="cell-type">{getReportTypeShortLabel(row.type)}</span>
    case 'audienceSize':
      return <span className="reports-view__cell-audience-size">{formatAudienceSize(row.audienceSize)}</span>
    case 'source': {
      const sourceLabel = getSourceLabel(row.source)
      const sourceIcon = (
        <span
          className="cell-source cell-source--icon-only cell-source--logo"
          role="img"
          aria-label={sourceLabel}
        >
          <SourceIcon sourceId={row.source} size={18} />
        </span>
      )
      if (locked) return sourceIcon
      return (
        <TitanTooltip content={sourceLabel} placement="top" delay={0}>
          <Focusable>{sourceIcon}</Focusable>
        </TitanTooltip>
      )
    }
    case 'workflow':
      return <span className="cell-workflow">{getWorkflowLabel(row.workflow)}</span>
    case 'createdAt':
      return <CreatedCellWithTooltip value={row.createdAt} />
    case 'owner': {
      const email = row.owner?.email?.trim()
      const initial = ownerFirstInitial(row.owner)
      if (email) {
        return (
          <TitanTooltip content={email} placement="top" delay={0}>
            <AriaButton
              className="reports-view__owner-tooltip-trigger reports-view__owner-avatar-trigger"
              aria-label={`${row.owner.name}, ${email}`}
            >
              <span className="reports-view__owner-initial">{initial}</span>
            </AriaButton>
          </TitanTooltip>
        )
      }
      const ownerMark = (
        <span className="reports-view__owner-wrap">
          <span className="reports-view__owner-initial">{initial}</span>
        </span>
      )
      if (locked) return ownerMark
      return (
        <TitanTooltip content={row.owner.name} placement="top" delay={0}>
          <AriaButton
            className="reports-view__owner-tooltip-trigger reports-view__owner-avatar-trigger"
            aria-label={row.owner.name}
          >
            <span className="reports-view__owner-initial">{initial}</span>
          </AriaButton>
        </TitanTooltip>
      )
    }
    case 'actions':
      return <ReportRowInlineActions row={row} />
    default:
      return null
  }
}

function EmptyState({
  workflowId,
  hasFilters,
  searchActive,
  searchQuery,
  onClearFilters,
  onBeginNewReport,
  canUseBySource,
  forcedWorkflowId,
}) {
  if (hasFilters) {
    return (
      <div className="reports-view__empty" role="status">
        <h2>No reports match your search or filters</h2>
        <p>
          Try another term, adjust filters, or clear them to see{' '}
          {searchActive ? 'matches across all reports.' : 'all reports in this workflow.'}
        </p>
        <TitanButton variant="secondary" onPress={onClearFilters}>
          Clear search and filters
        </TitanButton>
      </div>
    )
  }
  if (searchActive) {
    return (
      <div className="reports-view__empty reports-view__empty--search" role="status">
        <h2>No matches for &ldquo;{searchQuery.trim()}&rdquo;</h2>
        <p>We searched every report in every workflow. Try a different keyword or clear the search.</p>
        <TitanButton variant="secondary" onPress={onClearFilters}>
          Clear search
        </TitanButton>
      </div>
    )
  }
  if (workflowId !== 'all') {
    return (
      <div className="reports-view__empty" role="status">
        <h2>No reports yet in {getWorkflowLabel(workflowId)}</h2>
        <p>Create your first report to get started.</p>
        <NewReportMenu
          onBeginNewReport={onBeginNewReport}
          forceWorkflowId={forcedWorkflowId}
          allowBySource={canUseBySource}
        />
      </div>
    )
  }
  return (
    <div className="reports-view__empty" role="status">
      <h2>You haven&apos;t created any reports yet</h2>
      <p>Start from a workflow or pick a source.</p>
      <NewReportMenu
        onBeginNewReport={onBeginNewReport}
        forceWorkflowId={forcedWorkflowId}
        allowBySource={canUseBySource}
      />
    </div>
  )
}
