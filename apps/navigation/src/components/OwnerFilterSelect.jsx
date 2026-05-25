import { useEffect, useMemo, useRef, useState } from 'react'
import { IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react'
import { Button, Label, Popover } from 'react-aria-components'
import { useOverlayTriggerState } from 'react-stately'
import { TitanInputField } from 'titan-compositions'

/**
 * Owner filter: select trigger + popover with live search (magnifier) and single-choice list.
 */
export default function OwnerFilterSelect({
  label = 'Owner',
  options,
  selectedKey,
  onSelectionChange,
}) {
  const state = useOverlayTriggerState({})
  const triggerRef = useRef(null)
  const [popoverWidth, setPopoverWidth] = useState(undefined)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (state.isOpen) setQuery('')
  }, [state.isOpen])

  const summary = useMemo(() => {
    const key = selectedKey ?? 'all'
    const sel = options.find((o) => o.id === key)
    return sel?.label ?? 'All owners'
  }, [options, selectedKey])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const handleTriggerPress = () => {
    if (state.isOpen) {
      state.close()
      return
    }
    if (triggerRef.current) {
      setPopoverWidth(`${Math.max(triggerRef.current.offsetWidth, 280)}px`)
    }
    state.open()
  }

  const effectiveSelected = selectedKey ?? 'all'

  return (
    <div className="filter-multiselect select-root">
      <Label className="select-label">{label}</Label>
      <Button
        ref={triggerRef}
        type="button"
        className="select-trigger filter-multiselect__trigger"
        aria-label={`Filter by owner: ${summary}`}
        onPress={handleTriggerPress}
      >
        <span className="filter-multiselect__value">{summary}</span>
        <span className="select-trigger-chevron" aria-hidden="true">
          {state.isOpen ? (
            <IconChevronUp size={16} stroke={1.5} />
          ) : (
            <IconChevronDown size={16} stroke={1.5} />
          )}
        </span>
      </Button>
      <Popover
        triggerRef={triggerRef}
        isOpen={state.isOpen}
        onOpenChange={state.setOpen}
        placement="bottom start"
        offset={8}
        isNonModal
        className="select-popover filter-multiselect__popover"
        style={{ width: popoverWidth, minWidth: 'var(--trigger-width, 280px)' }}
      >
        <div className="filter-multiselect__inner">
          <div
            className="filter-multiselect__search"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <TitanInputField
              aria-label="Search users"
              placeholder="search users..."
              value={query}
              onChange={setQuery}
              startIcon={<IconSearch size={16} stroke={1.5} aria-hidden />}
            />
          </div>
          <div
            className="filter-multiselect__options filters-panel__owner-options"
            role="listbox"
            aria-label="Owners"
          >
            {filtered.length === 0 ? (
              <p className="filter-multiselect__empty">No owners match.</p>
            ) : (
              filtered.map((opt) => {
                const selected = effectiveSelected === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`filter-owner-option${selected ? ' filter-owner-option--selected' : ''}`}
                    onClick={() => {
                      onSelectionChange(opt.id === 'all' ? null : String(opt.id))
                      state.close()
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </Popover>
    </div>
  )
}
