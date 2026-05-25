import { useEffect, useState } from 'react'
import { BarChart3, Layers, PieChart, UserSearch } from 'lucide-react'
import { TitanButton, TitanDrawer, TitanMenuDropdown } from 'titan-compositions'
import { SOURCES, WORKFLOWS } from '../data/workflows.js'
import MultisourceGlyph from './MultisourceGlyph.jsx'
import SourceIcon from './SourceIcon.jsx'

const WORKFLOW_ICONS = {
  segment: PieChart,
  profile: UserSearch,
  track: BarChart3,
}

const icLucide = (Icon) => <Icon size={16} strokeWidth={1.75} aria-hidden />

function useIsMobileSheet() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 900px)')
    const sync = () => setMobile(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])
  return mobile
}

function sourceIdsWithReports() {
  const set = new Set()
  for (const w of WORKFLOWS) {
    for (const uc of w.useCases) {
      for (const st of uc.subTypes) {
        for (const src of st.sources) set.add(src)
      }
    }
  }
  return set
}

function buildWorkflowChildren() {
  return WORKFLOWS.map((w) => {
    const WfIcon = WORKFLOW_ICONS[w.id] ?? Layers
    return {
      id: `wf:${w.id}`,
      label: w.label,
      icon: icLucide(WfIcon),
    }
  })
}

function buildSourceChildren() {
  const withData = sourceIdsWithReports()
  const sourcesWithData = SOURCES.filter((s) => withData.has(s.id))
  const multisourceIcon = (
    <MultisourceGlyph
      className="new-report-menu__multi-icons"
      rowClassName="new-report-menu__multi-icons-row"
      markSize={11}
    />
  )
  return sourcesWithData.map((s) => ({
    id: `src:${s.id}`,
    label: s.id === 'google' ? 'Multisource' : s.label,
    icon: s.id === 'google' ? multisourceIcon : <SourceIcon sourceId={s.id} size={24} />,
  }))
}

export default function NewReportMenu({
  onBeginNewReport,
  forceWorkflowId = null,
  allowBySource = true,
}) {
  const isMobileSheet = useIsMobileSheet()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (forceWorkflowId) {
    return (
      <div className="new-report-menu">
        <TitanButton
          variant="primary"
          onPress={() => onBeginNewReport?.({ kind: 'workflow', id: forceWorkflowId })}
        >
          New report
        </TitanButton>
      </div>
    )
  }

  const items = [
    {
      id: 'by-workflow',
      label: 'By Workflow',
      children: buildWorkflowChildren(),
    },
    ...(allowBySource
      ? [
          {
            id: 'by-source',
            label: 'By Source',
            children: buildSourceChildren(),
          },
        ]
      : []),
  ]

  const handleAction = (id) => {
    if (typeof id !== 'string') return
    if (id.startsWith('wf:')) {
      onBeginNewReport?.({ kind: 'workflow', id: id.slice(3) })
      return
    }
    if (id.startsWith('src:')) {
      onBeginNewReport?.({ kind: 'source', id: id.slice(4) })
    }
  }

  const closeAndAction = (id) => {
    setSheetOpen(false)
    handleAction(id)
  }

  if (isMobileSheet) {
    return (
      <div className="new-report-menu new-report-menu--mobile">
        <TitanButton variant="primary" onPress={() => setSheetOpen(true)}>
          New report
        </TitanButton>
        <TitanDrawer title="New report" isOpen={sheetOpen} onOpenChange={setSheetOpen}>
          <div className="new-report-sheet">
            {items.map((section) => (
              <div key={section.id} className="new-report-sheet__section">
                <p className="new-report-sheet__section-label">{section.label}</p>
                <div className="new-report-sheet__list" role="group" aria-label={section.label}>
                  {section.children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className="new-report-sheet__row"
                      onClick={() => closeAndAction(child.id)}
                    >
                      <span className="new-report-sheet__row-icon" aria-hidden>
                        {child.icon}
                      </span>
                      <span className="new-report-sheet__row-label">{child.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TitanDrawer>
      </div>
    )
  }

  return (
    <div className="new-report-menu">
      <TitanMenuDropdown
        triggerLabel="New report"
        placement="bottom end"
        items={items}
        onAction={handleAction}
      />
    </div>
  )
}
