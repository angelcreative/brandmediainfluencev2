import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  TitanButton,
  TitanCheckboxField,
  TitanDrawer,
  TitanIconButton,
  TitanSelect,
} from 'titan-compositions'
import {
  FILTER_ACCESS,
  FILTER_REPORT_TYPES,
  FILTER_STATUSES,
  sortSourcesForFilter,
  summarizeMultiFilter,
} from '../data/filters.js'
import { SOURCES, getSourceLabel } from '../data/workflows.js'
import { DATE_PRESET_OPTIONS, getPresetIdForDateRange, getPresetRange } from '../utils/dateRangePresets.js'
import DateRangePanel from './DateRangePanel.jsx'
import FilterMultiSelectField from './FilterMultiSelectField.jsx'
import OwnerFilterSelect from './OwnerFilterSelect.jsx'
import SourceIcon from './SourceIcon.jsx'

function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

const CREATED_DATE_OPTIONS = [
  { id: 'any', label: 'Any date' },
  ...DATE_PRESET_OPTIONS.map((p) => ({ id: p.id, label: p.label })),
  { id: 'custom', label: 'Custom' },
]

export default function FiltersPanel({
  applicableSources,
  ownerSelectOptions,
  initialTypeFilter,
  initialSourceFilter,
  initialStatusFilter,
  initialSelectedOwner,
  initialAccessFilter,
  initialDateFrom,
  initialDateTo,
  onApplyFilters,
  onClose,
  onNestedOverlayChange,
}) {
  const [typeFilter, setTypeFilter] = useState(() => [...initialTypeFilter])
  const [sourceFilter, setSourceFilter] = useState(() => [...initialSourceFilter])
  const [statusFilter, setStatusFilter] = useState(() => [...initialStatusFilter])
  const [selectedOwner, setSelectedOwner] = useState(initialSelectedOwner)
  const [accessFilter, setAccessFilter] = useState(() => [...initialAccessFilter])
  const [dateFrom, setDateFrom] = useState(initialDateFrom)
  const [dateTo, setDateTo] = useState(initialDateTo)
  const [datePresetKey, setDatePresetKey] = useState(() =>
    getPresetIdForDateRange(initialDateFrom, initialDateTo),
  )
  const [customDrawerOpen, setCustomDrawerOpen] = useState(false)

  const sourceIdsOrdered = sortSourcesForFilter(
    SOURCES.filter((s) => applicableSources.includes(s.id)).map((s) => s.id),
  )

  const ownerOptionsForSelect = [{ id: 'all', label: 'All owners' }, ...ownerSelectOptions]

  const typeSummary = useMemo(
    () =>
      summarizeMultiFilter(typeFilter, (id) => FILTER_REPORT_TYPES.find((t) => t.id === id)?.label ?? id),
    [typeFilter],
  )

  const sourceSummary = useMemo(
    () => summarizeMultiFilter(sourceFilter, (id) => getSourceLabel(id)),
    [sourceFilter],
  )

  const statusSummary = useMemo(
    () => summarizeMultiFilter(statusFilter, (id) => FILTER_STATUSES.find((s) => s.id === id)?.label ?? id),
    [statusFilter],
  )

  const accessSummary = useMemo(
    () => summarizeMultiFilter(accessFilter, (id) => FILTER_ACCESS.find((a) => a.id === id)?.label ?? id),
    [accessFilter],
  )

  const clearDraft = () => {
    setTypeFilter([])
    setSourceFilter([])
    setStatusFilter([])
    setSelectedOwner(null)
    setAccessFilter([])
    setDateFrom(null)
    setDateTo(null)
    setDatePresetKey('any')
  }

  const applyToParent = () => {
    onApplyFilters?.({
      typeFilter,
      sourceFilter,
      statusFilter,
      selectedOwner,
      accessFilter,
      dateFrom,
      dateTo,
    })
  }

  const handleCreatedDateChange = (key) => {
    const k = String(key)
    if (k === 'any') {
      setDateFrom(null)
      setDateTo(null)
      setDatePresetKey('any')
      return
    }
    if (k === 'custom') {
      setDatePresetKey('custom')
      setCustomDrawerOpen(true)
      onNestedOverlayChange?.(true)
      return
    }
    const range = getPresetRange(k)
    if (range) {
      setDateFrom(range.start.toString())
      setDateTo(range.end.toString())
      setDatePresetKey(k)
    }
  }

  return (
    <section className="filters-panel filters-panel--popover" aria-label="Filters">
      <header className="filters-panel__header">
        <h2 className="filters-panel__title">Filters</h2>
        <TitanIconButton variant="ghost" aria-label="Close filters" onPress={onClose}>
          <X size={18} aria-hidden />
        </TitanIconButton>
      </header>

      <div className="filters-panel__grid filters-panel__grid--multiselect">
        <FilterMultiSelectField label="Type" summary={typeSummary} aria-label="Filter by report type">
          <div className="filters-panel__options">
            {FILTER_REPORT_TYPES.map((t) => (
              <TitanCheckboxField
                key={t.id}
                label={t.label}
                isSelected={typeFilter.includes(t.id)}
                onChange={() => setTypeFilter((prev) => toggle(prev, t.id))}
              />
            ))}
          </div>
        </FilterMultiSelectField>

        <FilterMultiSelectField label="Data source" summary={sourceSummary} aria-label="Filter by data source">
          <div className="filters-panel__options">
            {sourceIdsOrdered.map((id) => (
              <div key={id} className="filters-panel__source-row">
                <TitanCheckboxField
                  label={
                    <span className="filters-panel__source-label">
                      <SourceIcon sourceId={id} size={16} />
                      <span>{getSourceLabel(id)}</span>
                    </span>
                  }
                  isSelected={sourceFilter.includes(id)}
                  onChange={() => setSourceFilter((prev) => toggle(prev, id))}
                />
              </div>
            ))}
          </div>
        </FilterMultiSelectField>

        <FilterMultiSelectField label="Status" summary={statusSummary} aria-label="Filter by status">
          <div className="filters-panel__options">
            {FILTER_STATUSES.map((s) => (
              <TitanCheckboxField
                key={s.id}
                label={s.label}
                isSelected={statusFilter.includes(s.id)}
                onChange={() => setStatusFilter((prev) => toggle(prev, s.id))}
              />
            ))}
          </div>
        </FilterMultiSelectField>

        <FilterMultiSelectField label="Access" summary={accessSummary} aria-label="Filter by access">
          <div className="filters-panel__options">
            {FILTER_ACCESS.map((a) => (
              <TitanCheckboxField
                key={a.id}
                label={a.label}
                isSelected={accessFilter.includes(a.id)}
                onChange={() => setAccessFilter((prev) => toggle(prev, a.id))}
              />
            ))}
          </div>
        </FilterMultiSelectField>

        <OwnerFilterSelect
          options={ownerOptionsForSelect}
          selectedKey={selectedOwner}
          onSelectionChange={setSelectedOwner}
        />

        <TitanSelect
          label="Created date"
          aria-label="Filter by created date"
          placeholder="Any date"
          options={CREATED_DATE_OPTIONS}
          selectedKey={datePresetKey}
          onSelectionChange={handleCreatedDateChange}
        />
      </div>

      <div className="filters-panel__footer">
        <TitanButton variant="secondary" onPress={clearDraft}>
          Clear all
        </TitanButton>
        <TitanButton variant="primary" onPress={applyToParent}>
          Apply filters
        </TitanButton>
      </div>

      <TitanDrawer
        title="Custom date range"
        isOpen={customDrawerOpen}
        onOpenChange={(open) => {
          setCustomDrawerOpen(open)
          onNestedOverlayChange?.(open)
          if (!open) {
            setDatePresetKey(getPresetIdForDateRange(dateFrom, dateTo))
          }
        }}
      >
        <DateRangePanel
          hidePresets
          valueFrom={dateFrom}
          valueTo={dateTo}
          onApply={(range) => {
            setDateFrom(range.from)
            setDateTo(range.to)
            setDatePresetKey(getPresetIdForDateRange(range.from, range.to))
            setCustomDrawerOpen(false)
            onNestedOverlayChange?.(false)
          }}
          onClear={() => {
            setDateFrom(null)
            setDateTo(null)
            setDatePresetKey('any')
            setCustomDrawerOpen(false)
            onNestedOverlayChange?.(false)
          }}
        />
      </TitanDrawer>
    </section>
  )
}
