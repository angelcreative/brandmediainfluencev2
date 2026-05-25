import {
  IconChartLine,
  IconHierarchy3,
  IconUserSearch,
  IconUsersGroup,
  IconWorldShare,
} from '@tabler/icons-react'
import { TitanButton, TitanMenuDropdown } from 'titan-compositions'
import { SOURCES, WORKFLOWS } from '../data/workflows.js'
import SourceIcon from './SourceIcon.jsx'

const ic = (Icon, props = {}) => <Icon size={16} stroke={1.5} aria-hidden {...props} />

const WORKFLOW_ICONS = {
  segment: IconUsersGroup,
  profile: IconUserSearch,
  track: IconChartLine,
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
    const WfIcon = WORKFLOW_ICONS[w.id] ?? IconHierarchy3
    return {
      id: `wf:${w.id}`,
      label: w.label,
      icon: ic(WfIcon),
    }
  })
}

function buildSourceChildren() {
  const withData = sourceIdsWithReports()
  const sourcesWithData = SOURCES.filter((s) => withData.has(s.id))
  // Multisource (under google id): special tile showing all channel brand marks
  // arranged on 2 rows (5 + 4). Icons rendered at 12px to fit inside the tile.
  const MULTISOURCE_ROWS = [
    ['google', 'meta', 'x', 'tiktok', 'facebook'],
    ['youtube', 'linkedin', 'threads', 'instagram'],
  ]
  const multisourceIcon = (
    <span className="new-report-menu__multi-icons" aria-hidden>
      {MULTISOURCE_ROWS.map((row, rowIdx) => (
        <span key={rowIdx} className="new-report-menu__multi-icons-row">
          {row.map((id) => (
            <SourceIcon key={id} sourceId={id} size={11} />
          ))}
        </span>
      ))}
    </span>
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
      icon: ic(IconHierarchy3),
      children: buildWorkflowChildren(),
    },
    ...(allowBySource
      ? [
          {
            id: 'by-source',
            label: 'By Source',
            icon: ic(IconWorldShare),
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
