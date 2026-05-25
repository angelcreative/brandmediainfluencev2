import { useEffect, useMemo, useRef, useState } from 'react'
import { parseDate } from '@internationalized/date'
import { Filter, Lock, Unlock } from 'lucide-react'
import {
  TitanButton,
  TitanCell,
  TitanColumn,
  TitanPagination,
  TitanPill,
  TitanRow,
  TitanTable,
  TitanTableBody,
  TitanTableCellDate,
  TitanTableCellInitials,
  TitanTableCellStatus,
  TitanTableHeader,
  TitanTooltip,
} from 'titan-compositions'
import {
  SOURCES,
  getApplicableSources,
  getReportTypeLabel,
  getReportTypeShortLabel,
  getReportTypeTone,
  getReportsListBreadcrumbLabel,
  getSourceLabel,
  getWorkflowLabel,
} from '../data/workflows.js'
import { REPORTS } from '../data/reports.js'
import FiltersPanel from './FiltersPanel.jsx'
import NewReportMenu from './NewReportMenu.jsx'
import ReportRowActions from './ReportRowActions.jsx'
import SourceIcon from './SourceIcon.jsx'

const columns = [
  { key: 'name', header: 'Report name', sortable: true },
  { key: 'type', header: 'Type', sortable: true },
  { key: 'source', header: 'Data source', sortable: true, alignment: 'center' },
  { key: 'workflow', header: 'Workflow', sortable: true },
  { key: 'createdAt', header: 'Created', sortable: true },
  { key: 'status', header: 'Status', sortable: false },
  { key: 'owner', header: 'Owner', sortable: false, alignment: 'center' },
  { key: 'access', header: 'Access', sortable: false, alignment: 'center' },
  { key: 'actions', header: '', sortable: false },
]

const PAGE_SIZE = 8

export default function ReportsView({
  workflowId,
  searchQuery = '',
  dateFrom = null,
  dateTo = null,
  onDateRangeChange,
  onSearchClear,
  onBeginNewReport,
}) {
  const [sortDescriptor, setSortDescriptor] = useState({ column: 'createdAt', direction: 'descending' })
  const [currentPage, setCurrentPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState([])
  const [sourceFilter, setSourceFilter] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [selectedOwner, setSelectedOwner] = useState(null)
  const [accessFilter, setAccessFilter] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [filtersDateDrawerOpen, setFiltersDateDrawerOpen] = useState(false)
  const [filtersSession, setFiltersSession] = useState(0)
  const prevWorkflowIdRef = useRef(workflowId)

  const searchActive = Boolean(searchQuery.trim())
  const currentLabel = searchActive ? 'Search results' : getReportsListBreadcrumbLabel(workflowId)
  const listTitle = workflowId === 'all' ? 'All reports' : `${getWorkflowLabel(workflowId)} reports`

  useEffect(() => {
    if (prevWorkflowIdRef.current === workflowId) return
    prevWorkflowIdRef.current = workflowId
    setTypeFilter([])
    setSourceFilter([])
    setStatusFilter([])
    setSelectedOwner(null)
    setAccessFilter([])
    onDateRangeChange?.({ from: null, to: null })
  }, [workflowId, onDateRangeChange])

  useEffect(() => {
    setCurrentPage(1)
  }, [workflowId, searchQuery, typeFilter, sourceFilter, statusFilter, selectedOwner, accessFilter, dateFrom, dateTo])

  useEffect(() => {
    if (!showFilters) setFiltersDateDrawerOpen(false)
  }, [showFilters])

  const applicableSources = useMemo(() => {
    if (searchActive) return SOURCES.map((s) => s.id)
    if (workflowId === 'all') return SOURCES.map((s) => s.id)
    return getApplicableSources(workflowId)
  }, [workflowId, searchActive])

  const ownerFilterOptions = useMemo(() => {
    const names = [...new Set(REPORTS.map((r) => r.owner.name))].sort((a, b) => a.localeCompare(b))
    return names.map((name) => ({ id: name, label: name }))
  }, [])

  const filteredRows = useMemo(() => {
    // Universal search: with any query, scan all reports regardless of sidebar workflow.
    const base = searchActive
      ? REPORTS
      : workflowId === 'all'
        ? REPORTS
        : REPORTS.filter((r) => r.workflow === workflowId)
    return base.filter((r) => {
      if (typeFilter.length && !typeFilter.includes(r.type)) return false
      if (sourceFilter.length && !sourceFilter.includes(r.source)) return false
      if (statusFilter.length && !statusFilter.includes(r.status)) return false
      if (selectedOwner && r.owner.name !== selectedOwner) return false
      if (accessFilter.length && !accessFilter.includes(r.access)) return false
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
    typeFilter,
    sourceFilter,
    statusFilter,
    selectedOwner,
    accessFilter,
    searchQuery,
    searchActive,
    dateFrom,
    dateTo,
  ])

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

  const rangeStart = totalRows === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRows)

  // While searching globally, always show which workflow each row belongs to.
  const showWorkflowColumn = workflowId === 'all' || searchActive
  const visibleColumns = columns.filter((c) => (c.key === 'workflow' ? showWorkflowColumn : true))

  useEffect(() => {
    setSortDescriptor((prev) => {
      const keys = new Set(visibleColumns.map((c) => c.key))
      return keys.has(prev.column) ? prev : { column: 'createdAt', direction: 'descending' }
    })
  }, [showWorkflowColumn])

  const dateRangeActive = Boolean(dateFrom && dateTo)
  const activeFilterCount =
    typeFilter.length +
    sourceFilter.length +
    statusFilter.length +
    (selectedOwner ? 1 : 0) +
    accessFilter.length +
    (searchActive ? 1 : 0) +
    (dateRangeActive ? 1 : 0)
  const isEmpty = sortedRows.length === 0
  const canUseBySource = workflowId === 'all'
  const forcedWorkflowId = canUseBySource ? null : workflowId

  const clearAllFilters = () => {
    setTypeFilter([])
    setSourceFilter([])
    setStatusFilter([])
    setSelectedOwner(null)
    setAccessFilter([])
    onDateRangeChange?.({ from: null, to: null })
    onSearchClear?.()
  }

  return (
    <div className={`reports-view ${searchActive ? 'reports-view--search-results' : ''}`}>
      <div className="reports-view__header">
        <div className="reports-view__title-row">
          <div>
            {searchActive ? (
              <>
                <p className="reports-view__eyebrow">Global search</p>
                <h1 className="reports-view__title">Search results</h1>
                <p className="reports-view__subtitle">
                  {sortedRows.length} {sortedRows.length === 1 ? 'match' : 'matches'} for &ldquo;
                  {searchQuery.trim()}&rdquo;
                  <span className="reports-view__subtitle-hint">
                    {' '}
                    · Every workflow, not just the sidebar selection
                  </span>
                </p>
              </>
            ) : (
              <>
                <h1 className="reports-view__title">{listTitle}</h1>
                <p className="reports-view__subtitle">
                  {sortedRows.length} {sortedRows.length === 1 ? 'report' : 'reports'}
                  {workflowId !== 'all' ? ` in ${currentLabel}` : ''}
                </p>
              </>
            )}
          </div>
          <NewReportMenu
            onBeginNewReport={onBeginNewReport}
            forceWorkflowId={forcedWorkflowId}
            allowBySource={canUseBySource}
          />
        </div>
      </div>

      <div className="reports-view__toolbar-wrap">
        <div className="reports-view__toolbar">
          <TitanButton
            variant="secondary"
            icon={<Filter size={16} aria-hidden />}
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
            Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </TitanButton>
          {activeFilterCount > 0 && (
            <TitanButton variant="secondary" onPress={clearAllFilters}>
              Clear all
            </TitanButton>
          )}
        </div>
        {showFilters && (
          <div
            className={`reports-view__filters-popover${filtersDateDrawerOpen ? ' reports-view__filters-popover--above-modal' : ''}`}
          >
            <FiltersPanel
              key={filtersSession}
              applicableSources={applicableSources}
              ownerSelectOptions={ownerFilterOptions}
              initialTypeFilter={typeFilter}
              initialSourceFilter={sourceFilter}
              initialStatusFilter={statusFilter}
              initialSelectedOwner={selectedOwner}
              initialAccessFilter={accessFilter}
              initialDateFrom={dateFrom}
              initialDateTo={dateTo}
              onApplyFilters={({
                typeFilter: nextTypes,
                sourceFilter: nextSources,
                statusFilter: nextStatuses,
                selectedOwner: nextOwner,
                accessFilter: nextAccess,
                dateFrom: nextFrom,
                dateTo: nextTo,
              }) => {
                setTypeFilter(nextTypes)
                setSourceFilter(nextSources)
                setStatusFilter(nextStatuses)
                setSelectedOwner(nextOwner)
                setAccessFilter(nextAccess)
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
            key={visibleColumns.map((c) => c.key).join('-')}
            aria-label={
              searchActive
                ? `Global search results for ${searchQuery.trim()} across all workflows and reports`
                : `Reports in ${currentLabel}`
            }
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          >
            <TitanTableHeader columns={visibleColumns}>
              {(col) => (
                <TitanColumn
                  id={col.key}
                  allowsSorting={col.sortable}
                  isRowHeader={col.key === 'name'}
                  alignment={col.alignment || 'left'}
                >
                  {col.header}
                </TitanColumn>
              )}
            </TitanTableHeader>
            <TitanTableBody items={paginatedRows} dependencies={[showWorkflowColumn, currentPage]}>
              {(row) => (
                <TitanRow id={row.id} columns={visibleColumns}>
                  {(col) => (
                    <TitanCell alignment={col.alignment || 'left'}>
                      {renderCell(row, col.key)}
                    </TitanCell>
                  )}
                </TitanRow>
              )}
            </TitanTableBody>
          </TitanTable>
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
        </div>
      )}
    </div>
  )
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
    row.owner.name,
    row.owner.initials,
    row.status,
    row.access,
    row.createdAt,
  ]
  return parts.some((p) => String(p).toLowerCase().includes(q))
}

function readField(row, column) {
  switch (column) {
    case 'name':
      return row.name.toLowerCase()
    case 'type':
      return getReportTypeShortLabel(row.type).toLowerCase()
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

function renderCell(row, key) {
  switch (key) {
    case 'name':
      return <span className="cell-name">{row.name}</span>
    case 'type':
      return (
        <TitanPill
          className="reports-table-cell-pill"
          state="base"
          tone={getReportTypeTone(row.type)}
          removable={false}
        >
          {getReportTypeShortLabel(row.type)}
        </TitanPill>
      )
    case 'source':
      return (
        <TitanTooltip content={getSourceLabel(row.source)} placement="top">
          <span className="cell-source cell-source--icon-only" aria-label={getSourceLabel(row.source)}>
            <SourceIcon sourceId={row.source} size={18} />
          </span>
        </TitanTooltip>
      )
    case 'workflow':
      return <span className="cell-workflow">{getWorkflowLabel(row.workflow)}</span>
    case 'createdAt':
      return <TitanTableCellDate value={row.createdAt} />
    case 'status':
      return <TitanTableCellStatus status={row.status} />
    case 'owner':
      return (
        <TitanTooltip content={row.owner.name} placement="top">
          <span>
            <TitanTableCellInitials
              initials={row.owner.initials}
              className="table-avatar-initials--neutral"
            />
          </span>
        </TitanTooltip>
      )
    case 'access':
      return row.access === 'public' ? (
        <Unlock size={16} aria-label="Public" />
      ) : (
        <Lock size={16} aria-label="Private" />
      )
    case 'actions':
      return <ReportRowActions rowId={row.id} />
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
      <p>Start from a workflow or pick a data source.</p>
      <NewReportMenu
        onBeginNewReport={onBeginNewReport}
        forceWorkflowId={forcedWorkflowId}
        allowBySource={canUseBySource}
      />
    </div>
  )
}
