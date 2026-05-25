import { useEffect, useMemo, useState } from 'react'
import { Calendar, Info, Lock } from 'lucide-react'
import {
  TitanBreadcrumb,
  TitanButton,
  TitanCell,
  TitanColumn,
  TitanNavbar,
  TitanPill,
  TitanRow,
  TitanTable,
  TitanTableBody,
  TitanTableCellDate,
  TitanTableCellInitials,
  TitanTableCellStatus,
  TitanTableHeader,
  TitanTabs,
  TitanTooltip,
} from 'titan-compositions'
import {
  MY_REPORTS_DIGITAL_SNAPSHOT_ROWS,
  MY_REPORTS_ENTITIES_AVAILABLE,
  MY_REPORTS_REPORTS_AVAILABLE,
  MY_REPORTS_SNAPSHOT_ROWS,
  formatReportMetricSize,
  getSnapshotCategoryLabel,
  getSnapshotCategoryTone,
} from '../data/myReportsSnapshot.js'
import ReportRowActions from './ReportRowActions.jsx'
import SourceIcon from './SourceIcon.jsx'

/**
 * Demand list — logical column order (A–E) then meta columns:
 * A Report name, B Type, C Created, D Status, E Owner, then Access & Actions.
 */
const COLUMNS_DEMAND = [
  { key: 'name', header: 'Report name' },
  { key: 'type', header: 'Type' },
  { key: 'createdAt', header: 'Created' },
  { key: 'status', header: 'Status' },
  {
    key: 'owner',
    header: 'Owner',
    headerAlignment: 'center',
    cellAlignment: 'center',
    cellClassName: 'table-cell-avatar-only',
  },
  {
    key: 'access',
    header: 'Access',
    headerAlignment: 'center',
    cellAlignment: 'center',
    cellClassName: 'table-cell-icon-only',
  },
  {
    key: 'actions',
    header: 'Actions',
    headerAlignment: 'center',
    headerClassName: 'table-col-actions',
    cellAlignment: 'center',
    cellClassName: 'table-cell-actions',
  },
]

/**
 * Digital list — same *shape* of intent as demand but no Type (C);
 * order A, B, D, E, then status + meta: A name, B Created, D Audience, E Baseline,
 * then Status, Owner, Access, Actions (demand’s A–B align; D–E are size metrics before status).
 */
const COLUMNS_DIGITAL = [
  { key: 'name', header: 'Report name' },
  { key: 'createdAt', header: 'Created' },
  {
    key: 'audienceSize',
    header: 'Audience Size',
    headerAlignment: 'right',
    cellAlignment: 'right',
  },
  {
    key: 'baselineSize',
    header: 'Baseline Size',
    headerAlignment: 'right',
    cellAlignment: 'right',
  },
  { key: 'status', header: 'Status' },
  {
    key: 'owner',
    header: 'Owner',
    headerAlignment: 'center',
    cellAlignment: 'center',
    cellClassName: 'table-cell-avatar-only',
  },
  {
    key: 'access',
    header: 'Access',
    headerAlignment: 'center',
    cellAlignment: 'center',
    cellClassName: 'table-cell-icon-only',
  },
  {
    key: 'actions',
    header: 'Actions',
    headerAlignment: 'center',
    headerClassName: 'table-col-actions',
    cellAlignment: 'center',
    cellClassName: 'table-cell-actions',
  },
]

/** Product context (no product logos — text + color only). */
const PRODUCTS = {
  demand: {
    id: 'demand',
    shortLabel: 'Demand',
    workspaceLine: 'Demand workspace',
    pathSegment: 'demand',
    themingTitle: 'My Demand reports',
  },
  'digital-intelligence': {
    id: 'digital-intelligence',
    shortLabel: 'Digital Intelligence',
    workspaceLine: 'Digital Intelligence workspace',
    pathSegment: 'digital-intelligence',
    themingTitle: 'My Digital Intelligence reports',
  },
}

/**
 * A — Theming by route (accent tokens, Audiense logo unchanged)
 * B — Text chip next to title
 * F — Like B, primary “New report” tinted by product (Demand / Digital)
 * G — Like F + global breadcrumb (D layout in top nav)
 * H — Like G + chip, but keep Audiense default primary button (orange)
 * C — Subtitle / scope copy
 * D — Breadcrumb + document title (browser tab), Digital Intelligence
 * D.2 — Same as D, Demand
 * E — Thin environment strip (text + color band)
 */
const VERSION_CONFIG = [
  { key: 'A', solution: 'theming', product: 'demand' },
  { key: 'A2', solution: 'theming', product: 'digital-intelligence', tabLabel: 'version A.2' },
  { key: 'B', solution: 'chip', product: 'demand' },
  { key: 'B2', solution: 'chip', product: 'digital-intelligence', tabLabel: 'version B.2' },
  { key: 'C', solution: 'subtitle', product: 'demand' },
  { key: 'C2', solution: 'subtitle', product: 'digital-intelligence', tabLabel: 'version C.2' },
  { key: 'D', solution: 'breadcrumb', product: 'digital-intelligence' },
  { key: 'D2', solution: 'breadcrumb', product: 'demand', tabLabel: 'version D.2' },
  { key: 'E', solution: 'strip', product: 'digital-intelligence' },
  { key: 'E2', solution: 'strip', product: 'demand', tabLabel: 'version E.2' },
  { key: 'F', solution: 'chipPrimary', product: 'demand' },
  { key: 'F2', solution: 'chipPrimary', product: 'digital-intelligence', tabLabel: 'version F.1' },
  { key: 'G', solution: 'chipPrimaryBreadcrumb', product: 'demand' },
  { key: 'G2', solution: 'chipPrimaryBreadcrumb', product: 'digital-intelligence', tabLabel: 'version G.1' },
  { key: 'H', solution: 'chipBreadcrumb', product: 'demand' },
  { key: 'H2', solution: 'chipBreadcrumb', product: 'digital-intelligence', tabLabel: 'version H.1' },
]

const DEFAULT_DOCUMENT_TITLE = 'User know'

function DigitalCreatedCell({ value, className = '' }) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    return (
      <span className={`my-reports-playground__cell-metric ${className}`.trim()}>
        -
      </span>
    )
  }
  return (
    <span className={`my-reports-playground__cell-datetime table-cell-date ${className}`.trim()}>
      <Calendar className="table-cell-date-icon" size={16} aria-hidden />
      <span className="my-reports-playground__cell-datetime-stack">
        <span className="my-reports-playground__cell-datetime-line">
          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="my-reports-playground__cell-datetime-line">
          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </span>
    </span>
  )
}

function DigitalStatusCell({ row }) {
  return (
    <span className="my-reports-playground__di-status">
      <TitanTableCellStatus status={row.status} />
      {row.status === 'failed' && (
        <TitanTooltip content="Report failed to complete" placement="top">
          <button
            type="button"
            className="my-reports-playground__di-status-info icon-ghost"
            aria-label="Failure details"
          >
            <Info size={14} strokeWidth={2} aria-hidden />
          </button>
        </TitanTooltip>
      )}
    </span>
  )
}

function SnapshotMyReportsBody({ versionKey, solution, productKey }) {
  const product = PRODUCTS[productKey]
  const isDigital = productKey === 'digital-intelligence'
  const columns = isDigital ? COLUMNS_DIGITAL : COLUMNS_DEMAND
  const snapshotRows = isDigital ? MY_REPORTS_DIGITAL_SNAPSHOT_ROWS : MY_REPORTS_SNAPSHOT_ROWS
  const reportsPageTitle =
    solution === 'theming' ? product.themingTitle : 'My reports'

  const headerBlock = (
    <header className="my-reports-playground__page-header">
      <div className="my-reports-playground__page-header-main">
        <div className="my-reports-playground__title-row">
          <h1 className="my-reports-playground__title">{reportsPageTitle}</h1>
          {(solution === 'chip' || solution === 'chipPrimary' || solution === 'chipPrimaryBreadcrumb' || solution === 'chipBreadcrumb') && (
            <TitanPill
              className="product-context-pill"
              state="base"
              tone={product.id === 'digital-intelligence' ? 'indigo' : 'aquamarine'}
              removable={false}
            >
              {product.shortLabel}
            </TitanPill>
          )}
        </div>
        {solution === 'subtitle' && (
          <p className="my-reports-playground__subtitle-scope">{product.shortLabel}</p>
        )}
        {/** D / G.1 (digital) breadcrumb: no inventory line. H.1 should show reports availability like Demand shows entities. */}
        {!(
          (solution === 'breadcrumb' || solution === 'chipPrimaryBreadcrumb') &&
          isDigital
        ) && (
          <p className="my-reports-playground__subtitle">
            {isDigital
              ? '98 out of 100 reports available'
              : `${MY_REPORTS_ENTITIES_AVAILABLE} entities available`}
          </p>
        )}
      </div>
      <TitanButton variant="primary" onPress={() => {}}>
        New report
      </TitanButton>
    </header>
  )

  const tableBlock = (
    <>
      <div className="my-reports-playground__table-wrap">
        <TitanTable aria-label={reportsPageTitle} className="my-reports-playground__table">
          <TitanTableHeader columns={columns}>
            {(col) => (
              <TitanColumn
                id={col.key}
                allowsSorting={false}
                isRowHeader={col.key === 'name'}
                alignment={col.headerAlignment ?? 'left'}
                className={col.headerClassName}
              >
                {col.header}
              </TitanColumn>
            )}
          </TitanTableHeader>
          <TitanTableBody items={snapshotRows}>
            {(row) => (
              <TitanRow id={row.id} columns={columns}>
                {(col) => (
                  <TitanCell alignment={col.cellAlignment ?? 'left'} className={col.cellClassName}>
                    {isDigital ? renderDigitalCell(row, col.key) : renderDemandCell(row, col.key)}
                  </TitanCell>
                )}
              </TitanRow>
            )}
          </TitanTableBody>
        </TitanTable>
        <p className="my-reports-playground__table-foot">
          {snapshotRows.length} reports created
        </p>
      </div>
    </>
  )

  const strip =
    solution === 'strip' ? (
      <div
        className={`env-strip env-strip--bleed env-strip--${product.id === 'demand' ? 'demand' : 'di'}`}
        role="status"
      >
        <div className="my-reports-playground__chrome-inner env-strip__inner">
          <span className="env-strip__label">{product.workspaceLine}</span>
        </div>
      </div>
    ) : null

  const core = (
    <>
      {strip}
      {headerBlock}
      {tableBlock}
    </>
  )

  return (
    <div
      className="my-reports-playground__body my-reports-playground__chrome-inner"
      data-version={versionKey}
      data-solution={solution}
      data-product-list={isDigital ? 'digital' : 'demand'}
      style={{ fontFamily: 'var(--font-audiense), sans-serif' }}
    >
      {solution === 'theming' ||
      solution === 'strip' ||
      solution === 'chipPrimary' ||
      solution === 'chipPrimaryBreadcrumb' ? (
        <div
          className="my-reports-playground__product-scope my-reports-playground--sol-theming"
          data-product={product.id}
        >
          {core}
        </div>
      ) : (
        core
      )}
    </div>
  )
}

function renderDigitalCell(row, key) {
  const isFailed = row.status === 'failed'
  const failedClass = isFailed ? 'my-reports-playground__cell-failed' : ''

  switch (key) {
    case 'name':
      return (
        <span
          className={
            isFailed
              ? 'my-reports-playground__cell-name my-reports-playground__cell-name--failed'
              : 'my-reports-playground__cell-name'
          }
        >
          {row.name}
        </span>
      )
    case 'createdAt':
      return <DigitalCreatedCell value={row.createdAt} className={failedClass} />
    case 'audienceSize':
      return (
        <span className={`my-reports-playground__cell-metric ${failedClass}`.trim()}>
          {formatReportMetricSize(row.audienceSize)}
        </span>
      )
    case 'baselineSize':
      return (
        <span className={`my-reports-playground__cell-metric ${failedClass}`.trim()}>
          {formatReportMetricSize(row.baselineSize)}
        </span>
      )
    case 'status':
      return <DigitalStatusCell row={row} />
    case 'owner':
      return (
        <TitanTooltip content={row.owner.name} placement="top">
          <span>
            <TitanTableCellInitials
              initials={row.owner.initials}
              className="table-avatar-initials--neutral"
            />
          </span>
        </TitanTooltip>
      )
    case 'access':
      return <Lock size={16} aria-label="Private" className="my-reports-playground__lock" />
    case 'actions':
      return <ReportRowActions rowId={row.id} />
    default:
      return null
  }
}

function renderDemandCell(row, key) {
  switch (key) {
    case 'name':
      return (
        <span className="my-reports-playground__cell-name">
          {row.source ? (
            <span className="my-reports-playground__cell-name-icon" aria-hidden>
              <SourceIcon sourceId={row.source} size={18} />
            </span>
          ) : null}
          <span>{row.name}</span>
        </span>
      )
    case 'type':
      return (
        <TitanPill
          className="reports-table-cell-pill"
          state="base"
          tone={getSnapshotCategoryTone(row.category)}
          removable={false}
        >
          {getSnapshotCategoryLabel(row.category)}
        </TitanPill>
      )
    case 'createdAt':
      return <TitanTableCellDate value={row.createdAt} />
    case 'status':
      return <TitanTableCellStatus status={row.status} />
    case 'owner':
      return (
        <TitanTooltip content={row.owner.name} placement="top">
          <span>
            <TitanTableCellInitials
              initials={row.owner.initials}
              className="table-avatar-initials--neutral"
            />
          </span>
        </TitanTooltip>
      )
    case 'access':
      return <Lock size={16} aria-label="Private" className="my-reports-playground__lock" />
    case 'actions':
      return <ReportRowActions rowId={row.id} />
    default:
      return null
  }
}

export default function VersionedMyReportsPlayground() {
  const [selectedKey, setSelectedKey] = useState('version-H')

  useEffect(() => {
    if (selectedKey === 'version-D' || selectedKey === 'version-G2' || selectedKey === 'version-H2') {
      document.title = `Reports · ${PRODUCTS['digital-intelligence'].shortLabel} · Audiense`
    } else if (selectedKey === 'version-D2' || selectedKey === 'version-G' || selectedKey === 'version-H') {
      document.title = `Reports · ${PRODUCTS.demand.shortLabel} · Audiense`
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE
    }
  }, [selectedKey])

  const tabItems = useMemo(
    () =>
      VERSION_CONFIG.filter(({ key }) => key === 'H' || key === 'H2').map(({ key, solution, product }) => ({
        id: `version-${key}`,
        label: product === 'demand' ? 'Demand' : 'Digital Intelligence',
        content: <SnapshotMyReportsBody versionKey={key} solution={solution} productKey={product} />,
      })),
    [],
  )

  return (
    <div
      className="my-reports-playground"
      style={{ fontFamily: 'var(--font-audiense), sans-serif' }}
    >
      <div className="my-reports-playground__topnav">
        <TitanNavbar theme="audiense" userInitial="A" />
        {(selectedKey === 'version-D' ||
          selectedKey === 'version-D2' ||
          selectedKey === 'version-G' ||
          selectedKey === 'version-G2' ||
          selectedKey === 'version-H' ||
          selectedKey === 'version-H2') && (
          <div className="my-reports-playground__titan-breadcrumb">
            <div className="my-reports-playground__chrome-inner my-reports-playground__titan-breadcrumb__inner">
              <TitanBreadcrumb
                ariaLabel="Breadcrumb"
                items={[
                  {
                    id: 'home',
                    label: 'Home',
                    onPress: () => {
                      window.location.assign('/')
                    },
                  },
                  {
                    id: 'product',
                    label:
                      selectedKey === 'version-D2' || selectedKey === 'version-G' || selectedKey === 'version-H'
                        ? PRODUCTS.demand.shortLabel
                        : PRODUCTS['digital-intelligence'].shortLabel,
                    disabled: true,
                  },
                ]}
                currentLabel="Reports"
              />
            </div>
          </div>
        )}
      </div>

      <div className="my-reports-playground__tabs-host">
        <TitanTabs
          ariaLabel="Layout versions"
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(key != null ? String(key) : 'version-A')}
          items={tabItems}
          orientation="horizontal"
        />
      </div>
    </div>
  )
}
