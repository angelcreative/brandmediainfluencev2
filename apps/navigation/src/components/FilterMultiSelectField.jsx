import { useRef, useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { Button, Label, Popover } from 'react-aria-components'
import { useOverlayTriggerState } from 'react-stately'

/**
 * Select-like trigger opening a popover with checkbox list (no in-popover search).
 */
export default function FilterMultiSelectField({ label, summary, children, 'aria-label': ariaLabel }) {
  const state = useOverlayTriggerState({})
  const triggerRef = useRef(null)
  const [popoverWidth, setPopoverWidth] = useState(undefined)

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

  return (
    <div className="filter-multiselect select-root">
      {label ? <Label className="select-label">{label}</Label> : null}
      <Button
        ref={triggerRef}
        type="button"
        className="select-trigger filter-multiselect__trigger"
        aria-label={ariaLabel ?? `${label ?? 'Filter'}: ${summary}`}
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
        <div className="filter-multiselect__inner filter-multiselect__inner--no-search">
          <div className="filter-multiselect__options">{children}</div>
        </div>
      </Popover>
    </div>
  )
}
