import SourceBrandMark from './SourceBrandMark.jsx'

/**
 * Compact multisource summary used in menus and on the "Available sources" row
 * of report-type cards. Shows Meta, X, LinkedIn marks plus a "+N" remainder.
 */
const PREVIEW_SOURCES = ['meta', 'x', 'linkedin']

export default function MultisourceGlyph({
  markSize = 14,
  className = '',
}) {
  return (
    <span className={['multisource-glyph', className].filter(Boolean).join(' ')} aria-hidden>
      {PREVIEW_SOURCES.map((sourceId) => (
        <SourceBrandMark
          key={sourceId}
          sourceId={sourceId}
          size={markSize}
          className="multisource-glyph__icon"
        />
      ))}
      <span className="multisource-glyph__more">+3</span>
    </span>
  )
}
