import { useEffect, useState } from 'react'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { TitanButton, TitanCalendar } from 'titan-compositions'
import { DATE_PRESET_OPTIONS, getPresetRange } from '../utils/dateRangePresets.js'

/**
 * Date range UI (presets + From/To calendars + Clear / Apply). No overlay trigger.
 */
export default function DateRangePanel({ valueFrom, valueTo, onApply, onClear, hidePresets = false }) {
  const tz = getLocalTimeZone()

  const [draftFrom, setDraftFrom] = useState(() =>
    valueFrom ? parseDate(valueFrom) : today(tz),
  )
  const [draftTo, setDraftTo] = useState(() => (valueTo ? parseDate(valueTo) : today(tz)))

  useEffect(() => {
    if (valueFrom && valueTo) {
      setDraftFrom(parseDate(valueFrom))
      setDraftTo(parseDate(valueTo))
    } else {
      const t = today(tz)
      setDraftFrom(t)
      setDraftTo(t)
    }
  }, [valueFrom, valueTo, tz])

  const handleFromChange = (d) => {
    setDraftFrom(d)
    setDraftTo((prev) => (d.compare(prev) > 0 ? d : prev))
  }

  const handleToChange = (d) => {
    setDraftTo(d)
    setDraftFrom((prev) => (d.compare(prev) < 0 ? d : prev))
  }

  const applyPreset = (presetId) => {
    const range = getPresetRange(presetId)
    if (!range) return
    setDraftFrom(range.start)
    setDraftTo(range.end)
  }

  const handleApply = () => {
    let a = draftFrom
    let b = draftTo
    if (a.compare(b) > 0) {
      const t = a
      a = b
      b = t
    }
    onApply?.({ from: a.toString(), to: b.toString() })
  }

  const handleClear = () => {
    onClear?.()
    const t = today(tz)
    setDraftFrom(t)
    setDraftTo(t)
  }

  return (
    <div className={`date-range-panel ${hidePresets ? 'date-range-panel--calendars-only' : ''}`}>
      <div className="date-range-popover__body">
        {!hidePresets && (
          <nav className="date-range-popover__presets" aria-label="Quick ranges">
            {DATE_PRESET_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="date-range-popover__preset"
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </nav>
        )}
        <div className="date-range-popover__calendars">
          <div className="date-range-popover__cal-block">
            <span className="date-range-popover__cal-label">From</span>
            <p className="date-range-popover__cal-value">{draftFrom.toString()}</p>
            <TitanCalendar value={draftFrom} onChange={handleFromChange} />
          </div>
          <div className="date-range-popover__cal-block">
            <span className="date-range-popover__cal-label">To</span>
            <p className="date-range-popover__cal-value">{draftTo.toString()}</p>
            <TitanCalendar value={draftTo} onChange={handleToChange} />
          </div>
        </div>
      </div>
      <footer className="date-range-popover__footer">
        <TitanButton variant="secondary" onPress={handleClear}>
          Clear
        </TitanButton>
        <TitanButton variant="primary" onPress={handleApply}>
          Apply range
        </TitanButton>
      </footer>
    </div>
  )
}
