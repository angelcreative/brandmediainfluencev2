import MultisourceGlyph from './MultisourceGlyph.jsx'
import SourceBrandMark from './SourceBrandMark.jsx'

/**
 * Small per-source mark used in dense contexts (e.g. the "Available sources"
 * row on report-type cards). Uses the same PNG logos as SourceBrandMark so the
 * whole product stays visually consistent.
 *
 * `google` keeps its own "multiple networks" glyph here because in that context
 * it represents an aggregate, not the Google brand.
 */
export default function SourceTablerIcon({ sourceId, size = 18, className = '' }) {
  if (sourceId === 'google') {
    const markSize = Math.max(7, Math.round(size * 0.52))
    return <MultisourceGlyph markSize={markSize} className={className} />
  }
  return <SourceBrandMark sourceId={sourceId} size={size} className={className} />
}
