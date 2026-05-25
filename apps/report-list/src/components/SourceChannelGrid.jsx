import SourceBrandMark from './SourceBrandMark.jsx'
import { getSourceLabel, isReportSourceComingSoon } from '../data/workflows.js'

/**
 * Returns a short hint ONLY when it adds non-redundant info.
 * - For `by-overlap`: metric varies per source (followers vs subscribers), so we keep it.
 * - For any other report type: the subtitle previously repeated the name + report type
 *   (e.g. "Creator discovery · X"), which is already conveyed by the wizard breadcrumb
 *   and the card's own label. We drop it to reduce visual noise.
 */
function getChannelCardHint(reportTypeId, sourceId) {
  if (reportTypeId === 'by-overlap') {
    const metric = sourceId === 'youtube' ? 'Subscribers overlap' : 'Followers overlap'
    return metric
  }
  return null
}

export default function SourceChannelGrid({ reportTypeId, sourceIds, selectedId, onSelect }) {
  return (
    <div className="new-report-page__channel-grid" role="group" aria-label="Sources">
      {sourceIds.map((sourceId) => {
        const comingSoon = isReportSourceComingSoon(reportTypeId, sourceId)
        const selected = !comingSoon && selectedId === sourceId
        const label = getSourceLabel(sourceId)
        const hint = getChannelCardHint(reportTypeId, sourceId)
        const cardClass = [
          'new-report-page__channel-card',
          selected ? 'is-selected' : '',
          comingSoon ? 'new-report-page__channel-card--soon' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <button
            key={sourceId}
            type="button"
            className={cardClass}
            disabled={comingSoon}
            onClick={() => {
              if (comingSoon) return
              onSelect(sourceId)
            }}
            aria-pressed={comingSoon ? undefined : selected}
            aria-label={comingSoon ? `${label}, coming soon` : undefined}
          >
            <span className="new-report-page__channel-card-logo" aria-hidden>
              <span
                className={`new-report-page__channel-card-logo-frame source-brand-mark source-brand-mark--${sourceId}`}
              >
                <SourceBrandMark sourceId={sourceId} size={40} />
              </span>
            </span>
            <span className="new-report-page__channel-card-title">
              {label}
              {comingSoon ? (
                <span className="new-report-page__channel-card-soon">Soon</span>
              ) : null}
            </span>
            {hint ? (
              <span className="new-report-page__channel-card-desc">{hint}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
