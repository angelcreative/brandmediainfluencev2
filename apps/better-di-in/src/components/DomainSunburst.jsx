import { useEffect, useRef, useMemo, useCallback } from 'react'
import SunburstChart from 'sunburst-chart'

function indexRowKeys(root) {
  const map = new Map()
  function walk(node) {
    if (!node) return
    if (node.__rowKey) map.set(node.__rowKey, node)
    const ch = node.children
    if (Array.isArray(ch)) for (const c of ch) walk(c)
  }
  walk(root)
  return map
}

/**
 * Renders vasturiano/sunburst-chart inside a React host.
 * @param {object} props
 * @param {import('sunburst-chart').Node | null} props.data - hierarchy root (name, value, children, __rowKey, __kind, __color)
 * @param {number} props.size - width & height in px
 * @param {string | null} props.linkedRowKey - table row id to focus (same as TitanRow id)
 * @param {(node: import('sunburst-chart').Node | null) => void} props.onSliceClick
 */
export default function DomainSunburst({ data, size, linkedRowKey, onSliceClick }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)
  const keyMapRef = useRef(new Map())
  const onSliceClickRef = useRef(onSliceClick)
  onSliceClickRef.current = onSliceClick

  const keyMap = useMemo(() => (data ? indexRowKeys(data) : new Map()), [data])

  useEffect(() => {
    keyMapRef.current = keyMap
  }, [keyMap])

  const rebuild = useCallback(() => {
    const el = elRef.current
    if (!el || !data) return
    el.innerHTML = ''
    const chart = new SunburstChart(el, {})
    chart
      .width(size)
      .height(size)
      .data(data)
      .excludeRoot(true)
      .children('children')
      .label('name')
      .size('value')
      .color((d) => d.__color || 'var(--color-steel-400)')
      .strokeColor(() => 'var(--color-white-1000, #ffffff)')
      .minSliceAngle(0.08)
      .centerRadius(0.12)
      .transitionDuration(400)
      .tooltipTitle((node) => {
        const k = node?.__kind
        if (k === 'item') return node.name
        if (k === 'category') return node.name
        if (k === 'dimension') return node.name
        return node?.name ?? ''
      })
      .tooltipContent((node) => {
        if (!node || node.__kind === 'root') return ''
        if (node.__kind === 'dimension') {
          return 'Click to open this dimension in the table'
        }
        if (node.__kind === 'category') {
          const n = node.children?.length ?? 0
          return `${n} item${n === 1 ? '' : 's'} · click to filter table`
        }
        return 'Click to isolate in table'
      })
      .onClick((node) => {
        onSliceClickRef.current?.(node ?? null)
      })
    chartRef.current = chart
  }, [data, size])

  useEffect(() => {
    rebuild()
    return () => {
      chartRef.current = null
      if (elRef.current) elRef.current.innerHTML = ''
    }
  }, [rebuild])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const node = linkedRowKey ? keyMapRef.current.get(linkedRowKey) : null
    try {
      chart.focusOnNode(node ?? null)
    } catch {
      /* ignore focus if chart not ready */
    }
  }, [linkedRowKey, data])

  if (!data || !data.children?.length) {
    return (
      <div className="bdi-sunburst bdi-sunburst--empty" style={{ minHeight: size }}>
        <p className="bdi-sunburst__empty">No data to chart</p>
      </div>
    )
  }

  return (
    <div
      ref={elRef}
      className="bdi-sunburst"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Brand, media and influence landscape"
    />
  )
}
