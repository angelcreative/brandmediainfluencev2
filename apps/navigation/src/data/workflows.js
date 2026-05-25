// Canonical catalogs for the Audiense Discovery navigation model.
// Source labels are always written in full (Threads, not Thd; Google, not G).

export const SOURCES = [
  { id: 'x', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'threads', label: 'Threads' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'meta', label: 'Meta' },
  { id: 'google', label: 'Multisource' },
  // Multi-network: next iteration (By Source entry + applicable subTypes in WORKFLOWS).
  { id: 'multi-network', label: 'Multi-network' },
]

export const REPORT_TYPES = {
  'by-audience-attributes': 'Audience attributes',
  'by-conversation': 'Conversation',
  'by-upload': 'Upload',
  'by-account-profile': 'Account profile',
  'by-creator-discovery': 'Creator discovery',
  'by-popularity': 'Popularity',
  'by-overlap': 'Overlap',
  'by-custom-audience': 'Custom audience',
  'by-engagement': 'Engagement',
  'by-follower-growth': 'Follower growth',
  'by-fan-page': 'Fan page',
  'by-freeform-input': 'Freeform input',
}

// Workflow structure exactly as defined in the PDF / original spec.
export const WORKFLOWS = [
  {
    id: 'segment',
    label: 'Segment',
    description: 'Group audiences into communities or overlay syndicated mindsets.',
    useCases: [
      {
        id: 'uncover-dynamic-communities',
        label: 'Uncover Dynamic Communities',
        subTypes: [
          { id: 'by-audience-attributes', sources: ['x', 'tiktok'] },
          { id: 'by-conversation', sources: ['x'] },
          { id: 'by-upload', sources: ['x', 'tiktok'] },
        ],
      },
      {
        id: 'overlay-syndicated-mindsets',
        label: 'Overlay Syndicated Mindsets',
        subTypes: [
          { id: 'by-audience-attributes', sources: ['facebook', 'instagram', 'threads', 'meta'] },
          { id: 'by-custom-audience', sources: ['facebook', 'instagram', 'threads', 'meta'] },
          { id: 'by-fan-page', sources: ['facebook'] },
          { id: 'by-freeform-input', sources: ['facebook', 'instagram', 'threads', 'meta'] },
        ],
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Conduct social audits for accounts and creators.',
    useCases: [
      {
        id: 'conduct-social-audits',
        label: 'Conduct Social Audits',
        subTypes: [
          { id: 'by-account-profile', sources: ['linkedin', 'tiktok', 'instagram', 'youtube'] },
          { id: 'by-audience-attributes', sources: ['linkedin'] },
          { id: 'by-custom-audience', sources: ['linkedin'] },
          { id: 'by-creator-discovery', sources: ['facebook', 'tiktok', 'instagram', 'x'] },
        ],
      },
    ],
  },
  {
    id: 'track',
    label: 'Track',
    description: 'Measure trends across popularity, overlap and growth.',
    useCases: [
      {
        id: 'measure-trends',
        label: 'Measure Trends',
        subTypes: [
          { id: 'by-popularity', sources: ['instagram', 'x', 'tiktok', 'youtube', 'google'] },
          { id: 'by-overlap', sources: ['google', 'x', 'tiktok', 'youtube', 'instagram'] },
          { id: 'by-follower-growth', sources: ['x'] },
          { id: 'by-engagement', sources: ['x'] },
        ],
      },
    ],
  },
]

export const WORKFLOW_BY_ID = Object.fromEntries(WORKFLOWS.map((w) => [w.id, w]))

// Returns the sources applicable to a given workflow (union of sub-types).
export function getApplicableSources(workflowId) {
  const workflow = WORKFLOW_BY_ID[workflowId]
  if (!workflow) return SOURCES.map((s) => s.id)
  const set = new Set()
  for (const uc of workflow.useCases) {
    for (const st of uc.subTypes) {
      for (const src of st.sources) set.add(src)
    }
  }
  return SOURCES.map((s) => s.id).filter((id) => set.has(id))
}

export function getSourceLabel(sourceId) {
  return SOURCES.find((s) => s.id === sourceId)?.label ?? sourceId
}

export function getReportTypeLabel(typeId) {
  return REPORT_TYPES[typeId] ?? typeId
}

export function getWorkflowLabel(workflowId) {
  return WORKFLOW_BY_ID[workflowId]?.label ?? 'All workflows'
}

/** Breadcrumb: reports list context (e.g. Home › Profile report list). */
export function getReportsListBreadcrumbLabel(workflowId) {
  if (workflowId === 'all' || workflowId == null) return 'All reports list'
  return `${getWorkflowLabel(workflowId)} report list`
}

/** Titan pill-tone-* classes (titan-compositions): one distinct tone per report type. */
export const REPORT_TYPE_TONES = {
  'by-audience-attributes': 'teal',
  'by-conversation': 'mango',
  'by-upload': 'ocean',
  'by-account-profile': 'tomato',
  'by-creator-discovery': 'violet',
  'by-popularity': 'magenta',
  'by-overlap': 'indigo',
  'by-custom-audience': 'blueberry',
  'by-engagement': 'pomegranate',
  'by-follower-growth': 'aquamarine',
  'by-fan-page': 'steel',
  'by-freeform-input': 'info',
}

export function getReportTypeTone(typeId) {
  return REPORT_TYPE_TONES[typeId] ?? 'steel'
}

/** One-line helper for card subtitles in the New report wizard. */
export const REPORT_TYPE_DESCRIPTIONS = {
  'by-audience-attributes': 'Segment or profile audiences using traits, interests, or uploaded lists.',
  'by-conversation': 'Build from posts, topics, hashtags, or conversation signals.',
  'by-upload': 'Start from a file or list you bring into the product.',
  'by-account-profile': 'Audit a social account: content, audience, and performance.',
  'by-creator-discovery': 'Find and evaluate creators that match your criteria.',
  'by-popularity': 'Compare reach or attention signals across entities.',
  'by-overlap': 'See shared audiences or interest overlap between sets.',
  'by-custom-audience': 'Use a saved or syndicated audience as the starting point.',
  'by-engagement': 'Measure how people interact with content over time.',
  'by-follower-growth': 'Track how audience size changes across periods.',
  'by-fan-page': 'Focus reporting on a Facebook Page and its community.',
  'by-freeform-input': 'Describe an audience or topic in natural language.',
}

export function getReportTypeDescription(typeId) {
  return REPORT_TYPE_DESCRIPTIONS[typeId] ?? ''
}

/**
 * Wizard step label (By source flow, step 2) — action after report type, before Launch.
 * Copy kept short for the horizontal stepper.
 */
export function getWizardDefineStepLabel(reportTypeId) {
  if (!reportTypeId) return 'Define audience'
  const map = {
    'by-audience-attributes': 'Define audience attributes',
    'by-conversation': 'Define conversation',
    'by-upload': 'Set up upload',
    'by-account-profile': 'Define account profile',
    'by-creator-discovery': 'Discover creators',
    'by-popularity': 'Define popularity scope',
    'by-overlap': 'Define overlap',
    'by-custom-audience': 'Choose custom audience',
    'by-engagement': 'Define engagement',
    'by-follower-growth': 'Define growth scope',
    'by-fan-page': 'Choose Facebook Page',
    'by-freeform-input': 'Describe audience',
  }
  return map[reportTypeId] ?? 'Define audience'
}

/** Matrix-listed sources not yet available (channel step shows “Soon”, not selectable). */
export function isReportSourceComingSoon(reportTypeId, sourceId) {
  return reportTypeId === 'by-upload' && sourceId === 'tiktok'
}

/** Short label for table pills (same as full display name). */
export function getReportTypeShortLabel(typeId) {
  return getReportTypeLabel(typeId)
}

const REPORT_TYPE_ORDER = Object.keys(REPORT_TYPES)

function sortReportTypeIds(ids) {
  return [...ids].sort((a, b) => {
    const ia = REPORT_TYPE_ORDER.indexOf(a)
    const ib = REPORT_TYPE_ORDER.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
}

/** All report type ids that appear for a source across workflows (union). */
export function getReportTypeIdsForSource(sourceId) {
  const set = new Set()
  for (const w of WORKFLOWS) {
    for (const uc of w.useCases) {
      for (const st of uc.subTypes) {
        if (st.sources.includes(sourceId)) set.add(st.id)
      }
    }
  }
  return sortReportTypeIds(Array.from(set))
}

/** All report type ids defined under a workflow (union of use cases). */
export function getReportTypeIdsForWorkflow(workflowId) {
  const workflow = WORKFLOW_BY_ID[workflowId]
  if (!workflow) return []
  const set = new Set()
  for (const uc of workflow.useCases) {
    for (const st of uc.subTypes) {
      set.add(st.id)
    }
  }
  return sortReportTypeIds(Array.from(set))
}

/**
 * Grouped report types for one workflow, preserving use-case grouping/order.
 * Example: "Uncover Dynamic Communities" -> ["by-audience-attributes", ...]
 */
export function getReportTypeGroupsForWorkflow(workflowId) {
  const workflow = WORKFLOW_BY_ID[workflowId]
  if (!workflow) return []
  return workflow.useCases
    .map((uc) => ({
      id: uc.id,
      label: uc.label,
      typeIds: sortReportTypeIds(Array.from(new Set(uc.subTypes.map((st) => st.id)))),
    }))
    .filter((group) => group.typeIds.length > 0)
}

/**
 * Grouped report types for a source entry, grouped by workflow + use-case
 * to keep the same mental model as workflow matrices.
 */
export function getReportTypeGroupsForSource(sourceId) {
  const groups = []
  for (const workflow of WORKFLOWS) {
    for (const uc of workflow.useCases) {
      const typeIds = sortReportTypeIds(
        Array.from(
          new Set(
            uc.subTypes
              .filter((st) => st.sources.includes(sourceId))
              .map((st) => st.id),
          ),
        ),
      )
      if (!typeIds.length) continue
      groups.push({
        id: `${workflow.id}-${uc.id}`,
        label: `${workflow.label} · ${uc.label}`,
        typeIds,
      })
    }
  }
  return groups
}

/** Titan pill-tone-* per workflow (table column + menus). */
export const WORKFLOW_TONES = {
  segment: 'teal',
  profile: 'blueberry',
  track: 'aquamarine',
}

export function getWorkflowTone(workflowId) {
  return WORKFLOW_TONES[workflowId] ?? 'steel'
}

/** Source ids available for a report type within one workflow (union across use cases). */
export function getSourceIdsForReportTypeInWorkflow(workflowId, reportTypeId) {
  const workflow = WORKFLOW_BY_ID[workflowId]
  if (!workflow) return []
  const set = new Set()
  for (const uc of workflow.useCases) {
    for (const st of uc.subTypes) {
      if (st.id === reportTypeId) {
        for (const src of st.sources) set.add(src)
      }
    }
  }
  return sortSourceIdsForDisplay(Array.from(set))
}

/**
 * Source ids available for a report type within one specific workflow use-case.
 * This avoids mixing sources when the same report type appears in multiple groups.
 */
export function getSourceIdsForReportTypeInWorkflowUseCase(workflowId, useCaseId, reportTypeId) {
  const workflow = WORKFLOW_BY_ID[workflowId]
  if (!workflow) return []
  const useCase = workflow.useCases.find((uc) => uc.id === useCaseId)
  if (!useCase) return []
  const set = new Set()
  for (const st of useCase.subTypes) {
    if (st.id === reportTypeId) {
      for (const src of st.sources) set.add(src)
    }
  }
  return sortSourceIdsForDisplay(Array.from(set))
}

/**
 * When entering via By source: channels that share a subtype definition with the chosen entry source
 * for this report type (same cohort as in the product matrix).
 */
export function getSourceIdsForReportTypeWithEntrySource(reportTypeId, entrySourceId) {
  const set = new Set()
  for (const w of WORKFLOWS) {
    for (const uc of w.useCases) {
      for (const st of uc.subTypes) {
        if (st.id === reportTypeId && st.sources.includes(entrySourceId)) {
          for (const src of st.sources) set.add(src)
        }
      }
    }
  }
  return sortSourceIdsForDisplay(Array.from(set))
}

function sortSourceIdsForDisplay(ids) {
  const order = SOURCES.map((s) => s.id)
  return [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

/** One-line subtitle under each channel card in the new-report wizard. */
export function getDataSourceChannelSubtitle(reportTypeId, sourceId) {
  const name = getSourceLabel(sourceId)
  if (reportTypeId === 'by-overlap') {
    const metric = sourceId === 'youtube' ? 'subscribers' : 'followers'
    return `Overlap between ${name} ${metric}`
  }
  return `${getReportTypeLabel(reportTypeId)} · ${name}`
}
