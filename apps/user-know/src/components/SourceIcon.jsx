import SourceBrandMark from './SourceBrandMark.jsx'

/** Inline brand mark (Nucleo + SiMeta); multicolor via `source-brand-mark--*`. */
export default function SourceIcon({ sourceId, size = 16 }) {
  const px = `${size}px`
  return (
    <span
      className={`source-brand-logo source-brand-mark source-brand-mark--${sourceId}`}
      style={{ width: px, height: px }}
      aria-hidden
    >
      <SourceBrandMark sourceId={sourceId} size={size} />
    </span>
  )
}
