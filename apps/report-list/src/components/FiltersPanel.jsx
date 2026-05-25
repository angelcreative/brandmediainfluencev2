import { useState } from 'react'
import { X } from 'lucide-react'
import {
  TitanButton,
  TitanCheckboxField,
  TitanDrawer,
  TitanIconButton,
  TitanRadioGroupField,
  TitanSelect,
} from 'titan-compositions'
import { FILTER_PANEL_STATUS_RADIOS, sortSourcesForFilter } from '../data/filters.js'
import { SOURCES, WORKFLOWS, getSourceLabel } from '../data/workflows.js'
import { DATE_PRESET_OPTIONS, getPresetIdForDateRange, getPresetRange } from '../utils/dateRangePresets.js'
import DateRangePanel from './DateRangePanel.jsx'

function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

const DATE_SELECT_OPTIONS = DATE_PRESET_OPTIONS.map((p) => ({ id: p.id, label: p.label }))

export default function FiltersPanel({
  applicableSources,
  showWorkflowFilters,
  initialWorkflowFilter,
  initialSourceFilter,
  initialStatusSingle,
  initialDateFrom,
  initialDateTo,
  onApplyFilters,
  onClose,
  onNestedOverlayChange,
}) {
  const [workflowFilter, setWorkflowFilter] = useState(() => [...initialWorkflowFilter])
  const [sourceFilter, setSourceFilter] = useState(() => [...initialSourceFilter])
  const [statusSingle, setStatusSingle] = useState(initialStatusSingle ?? null)
  const [dateFrom, setDateFrom] = useState(initialDateFrom)
  const [dateTo, setDateTo] = useState(initialDateTo)
  const [datePresetKey, setDatePresetKey] = useState(() => {
    const presetId = getPresetIdForDateRange(initialDateFrom, initialDateTo)
    return presetId === 'any' ? null : presetId
  })
  const [customDrawerOpen, setCustomDrawerOpen] = useState(false)

  const sourceIdsOrdered = sortSourcesForFilter(
    SOURCES.filter((s) => applicableSources.includes(s.id) && s.id !== 'multi-network').map((s) => s.id),
  )

  const clearDraft = () => {
    setWorkflowFilter([])
    setSourceFilter([])
    setStatusSingle(null)
    setDateFrom(null)
    setDateTo(null)
    setDatePresetKey(null)
  }

  const applyToParent = () => {
    onApplyFilters?.({
      workflowFilter,
      sourceFilter,
      statusSingle,
      dateFrom,
      dateTo,
    })
  }

  const handleDateSelectChange = (key) => {
    const k = String(key)
    const range = getPresetRange(k)
    if (range) {
      setDateFrom(range.start.toString())
      setDateTo(range.end.toString())
      setDatePresetKey(k)
    }
  }

  const openCustomRange = () => {
    setCustomDrawerOpen(true)
    onNestedOverlayChange?.(true)
  }

  return (
    <section className="filters-panel filters-panel--popover" aria-label="Filters">
      <header className="filters-panel__header">
        <h2 className="filters-panel__title">Filters</h2>
        <TitanIconButton variant="ghost" aria-label="Close filters" onPress={onClose}>
          <X size={18} aria-hidden />
        </TitanIconButton>
      </header>

      <div
        className={`filters-panel__row ${showWorkflowFilters ? 'filters-panel__row--four' : 'filters-panel__row--three'}`}
      >
        {showWorkflowFilters ? (
          <div className="filters-panel__column">
            <p className="filters-panel__column-title">Workflows</p>
            <div className="filters-panel__options filters-panel__options--stack filters-panel__options--compact">
              {WORKFLOWS.map((w) => (
                <TitanCheckboxField
                  key={w.id}
                  label={w.label}
                  isSelected={workflowFilter.includes(w.id)}
                  onChange={() => setWorkflowFilter((prev) => toggle(prev, w.id))}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="filters-panel__column">
          <p className="filters-panel__column-title">Source</p>
          <div className="filters-panel__options filters-panel__options--stack filters-panel__options--compact">
            {sourceIdsOrdered.map((id) => (
              <TitanCheckboxField
                key={id}
                label={getSourceLabel(id)}
                isSelected={sourceFilter.includes(id)}
                onChange={() => setSourceFilter((prev) => toggle(prev, id))}
              />
            ))}
          </div>
        </div>

        <div className="filters-panel__column filters-panel__column--status">
          <TitanRadioGroupField
            label="Status"
            name="filters-status"
            options={FILTER_PANEL_STATUS_RADIOS}
            value={statusSingle ?? undefined}
            onChange={(v) => setStatusSingle(v || null)}
          />
          {statusSingle ? (
            <TitanButton variant="tertiary" className="filters-panel__status-clear" onPress={() => setStatusSingle(null)}>
              Clear status
            </TitanButton>
          ) : null}
        </div>

        <div className="filters-panel__column filters-panel__column--date">
          <TitanSelect
            label="Date range"
            aria-label="Filter by date range"
            placeholder="Select a range"
            options={DATE_SELECT_OPTIONS}
            selectedKey={datePresetKey ?? undefined}
            onSelectionChange={handleDateSelectChange}
          />
          <TitanButton variant="tertiary" className="filters-panel__custom-range" onPress={openCustomRange}>
            Custom range
          </TitanButton>
        </div>
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
            const presetId = getPresetIdForDateRange(dateFrom, dateTo)
            setDatePresetKey(presetId === 'any' ? null : presetId)
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
            setDatePresetKey(null)
            setCustomDrawerOpen(false)
            onNestedOverlayChange?.(false)
          }}
        />
      </TitanDrawer>
    </section>
  )
}
