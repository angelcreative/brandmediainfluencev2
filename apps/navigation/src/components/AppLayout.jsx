import { useCallback, useEffect, useRef, useState } from 'react'
import { BarChart3, Home, LayoutGrid, UserSearch, Users } from 'lucide-react'
import {
  TitanButton,
  TitanDialog,
  TitanNavbar,
  TitanSidebar,
  TitanSidebarItem,
  TitanSidebarSection,
  TitanSidebarSearch,
} from 'titan-compositions'
import AppBreadcrumb from './AppBreadcrumb.jsx'
import { getReportsListBreadcrumbLabel } from '../data/workflows.js'
import AppsHomePage from './AppsHomePage.jsx'
import NewReportPage from './NewReportPage.jsx'
import ReportsView from './ReportsView.jsx'

function parseNrParam(search) {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(search).get('nr')
  if (!raw) return null
  const idx = raw.indexOf(':')
  if (idx <= 0) return null
  const kind = raw.slice(0, idx)
  const id = raw.slice(idx + 1)
  if (kind !== 'workflow' && kind !== 'source') return null
  if (!id) return null
  return { kind, id }
}

const ALL_WORKFLOWS_NAV_ITEM = { id: 'all', label: 'All workflows', icon: LayoutGrid }

const WORKFLOW_NAV_ITEMS = [
  { id: 'segment', label: 'Segment', icon: Users },
  { id: 'profile', label: 'Profile', icon: UserSearch },
  { id: 'track', label: 'Track', icon: BarChart3 },
]

const NAV_ITEMS = [ALL_WORKFLOWS_NAV_ITEM, ...WORKFLOW_NAV_ITEMS]

function readWorkflowFromUrl() {
  if (typeof window === 'undefined') return 'all'
  const params = new URLSearchParams(window.location.search)
  const wf = params.get('workflow')
  return NAV_ITEMS.some((i) => i.id === wf) ? wf : 'all'
}

function readSearchFromUrl() {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('q')?.trim() ?? ''
}

function readDateParamFromUrl(key) {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get(key)
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  return raw
}

function readAppsViewFromUrl() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('view') === 'apps') return true
  return !(
    params.has('workflow') ||
    params.has('q') ||
    params.has('from') ||
    params.has('to') ||
    params.has('nr')
  )
}

function readInitialSidebarActiveId() {
  if (typeof window === 'undefined') return 'all'
  if (readAppsViewFromUrl()) return null
  return readWorkflowFromUrl()
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeId, setActiveId] = useState(readInitialSidebarActiveId)
  const [sidebarSearch, setSidebarSearch] = useState(readSearchFromUrl)
  const [dateFrom, setDateFrom] = useState(() => readDateParamFromUrl('from'))
  const [dateTo, setDateTo] = useState(() => readDateParamFromUrl('to'))
  const [nrContext, setNrContext] = useState(() =>
    typeof window !== 'undefined' ? parseNrParam(window.location.search) : null,
  )
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [appsView, setAppsView] = useState(readAppsViewFromUrl)
  /** Breadcrumb / logo / close wizard — function to run after Leave. */
  const pendingNavigationRef = useRef(null)
  /** LHN target when leaving wizard via sidebar (survives dialog onClose races). */
  const pendingSidebarNavIdRef = useRef(null)
  /** True while Leave executes so onOpenChange(false) does not wipe pending refs before we read them. */
  const leaveViaConfirmRef = useRef(false)
  const handleDateRangeChange = useCallback(({ from, to }) => {
    setDateFrom(from)
    setDateTo(to)
  }, [])
  const audienseLogoUrl =
    'https://cdn.jsdelivr.net/gh/angelcreative/titan-foundations@main/public/assets/logos/logo-audiense.svg'

  const runSidebarNavigate = (id) => {
    setActiveId(id)
    setAppsView(false)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('view')
      if (id === 'all') url.searchParams.delete('workflow')
      else url.searchParams.set('workflow', id)
      window.history.replaceState(null, '', url.toString())
    }
  }

  /** Leave new-report URL/state, then apply LHN selection (sidebar + workflow param). */
  const exitWizardAndGoToSidebar = (id) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('nr')
      url.searchParams.delete('view')
      if (id === 'all') url.searchParams.delete('workflow')
      else url.searchParams.set('workflow', id)
      window.history.replaceState(null, '', url.toString())
    }
    setNrContext(null)
    setAppsView(false)
    setActiveId(id)
    setSidebarSearch(readSearchFromUrl())
    setDateFrom(readDateParamFromUrl('from'))
    setDateTo(readDateParamFromUrl('to'))
  }

  const handleActive = (id) => {
    if (id === 'home') {
      if (appsView && !nrContext) return
      if (nrContext) {
        pendingSidebarNavIdRef.current = null
        pendingNavigationRef.current = runNavigateBreadcrumbHome
        setLeaveDialogOpen(true)
      } else {
        runNavigateBreadcrumbHome()
      }
      return
    }
    if (!appsView && id === activeId) return
    if (nrContext) {
      pendingSidebarNavIdRef.current = id
      pendingNavigationRef.current = () => exitWizardAndGoToSidebar(id)
      setLeaveDialogOpen(true)
    } else {
      runSidebarNavigate(id)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const q = sidebarSearch.trim()
    if (q) url.searchParams.set('q', q)
    else url.searchParams.delete('q')
    if (dateFrom) url.searchParams.set('from', dateFrom)
    else url.searchParams.delete('from')
    if (dateTo) url.searchParams.set('to', dateTo)
    else url.searchParams.delete('to')
    window.history.replaceState(null, '', url.toString())
  }, [sidebarSearch, dateFrom, dateTo])

  useEffect(() => {
    if (!appsView) return
    const q = sidebarSearch.trim()
    if (!q) return
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    window.history.replaceState(null, '', url.toString())
    setAppsView(false)
    setActiveId(readWorkflowFromUrl())
  }, [sidebarSearch, appsView])

  useEffect(() => {
    const onPopState = () => {
      const search = window.location.search
      setNrContext(parseNrParam(search))
      setSidebarSearch(readSearchFromUrl())
      setDateFrom(readDateParamFromUrl('from'))
      setDateTo(readDateParamFromUrl('to'))
      const apps = readAppsViewFromUrl()
      setAppsView(apps)
      setActiveId(apps ? null : readWorkflowFromUrl())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const openNewReport = (ctx) => {
    setCollapsed(true)
    setAppsView(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    url.searchParams.set('nr', `${ctx.kind}:${ctx.id}`)
    window.history.pushState(null, '', url.toString())
    setNrContext(ctx)
  }

  useEffect(() => {
    if (nrContext) setCollapsed(true)
  }, [nrContext])

  const closeNewReport = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('nr')
    window.history.replaceState(null, '', url.toString())
    setNrContext(null)
  }

  const runNavigateBreadcrumbHome = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('nr')
    url.searchParams.delete('q')
    url.searchParams.delete('from')
    url.searchParams.delete('to')
    url.searchParams.delete('workflow')
    url.searchParams.set('view', 'apps')
    window.history.replaceState(null, '', url.toString())
    setNrContext(null)
    setSidebarSearch('')
    setDateFrom(null)
    setDateTo(null)
    setActiveId(null)
    setAppsView(true)
  }

  const runNavigateBreadcrumbMyReports = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('nr')
    url.searchParams.delete('q')
    url.searchParams.delete('from')
    url.searchParams.delete('to')
    url.searchParams.delete('view')
    window.history.replaceState(null, '', url.toString())
    setNrContext(null)
    setSidebarSearch('')
    setDateFrom(null)
    setDateTo(null)
    setActiveId(readWorkflowFromUrl())
    setAppsView(false)
  }

  /** Leave new-report wizard only: keep workflow, search, and date filters from URL. */
  const runLeaveNewReportToReportsList = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('nr')
    window.history.replaceState(null, '', url.toString())
    setNrContext(null)
    setAppsView(false)
    setActiveId(readWorkflowFromUrl())
    setSidebarSearch(readSearchFromUrl())
    setDateFrom(readDateParamFromUrl('from'))
    setDateTo(readDateParamFromUrl('to'))
  }

  /** After new-report demo: land on My Reports (all workflows), not app home. */
  const runNavigateAfterNewReportDemo = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('nr')
    url.searchParams.delete('q')
    url.searchParams.delete('from')
    url.searchParams.delete('to')
    url.searchParams.delete('view')
    url.searchParams.delete('workflow')
    window.history.replaceState(null, '', url.toString())
    setNrContext(null)
    setSidebarSearch('')
    setDateFrom(null)
    setDateTo(null)
    setActiveId('all')
    setAppsView(false)
  }

  const handleLogoPress = () => {
    if (nrContext) {
      pendingSidebarNavIdRef.current = null
      pendingNavigationRef.current = runNavigateBreadcrumbHome
      setLeaveDialogOpen(true)
    } else {
      runNavigateBreadcrumbHome()
    }
  }

  /** Breadcrumb: Home — all workflows, no search, exit new report. */
  const navigateBreadcrumbHome = () => {
    if (nrContext) {
      pendingSidebarNavIdRef.current = null
      pendingNavigationRef.current = runNavigateBreadcrumbHome
      setLeaveDialogOpen(true)
    } else {
      runNavigateBreadcrumbHome()
    }
  }

  /** Breadcrumb: My Reports — list view; keep workflow filter; exit new report and clear search. */
  const navigateBreadcrumbMyReports = () => {
    if (nrContext) {
      pendingSidebarNavIdRef.current = null
      pendingNavigationRef.current = runNavigateBreadcrumbMyReports
      setLeaveDialogOpen(true)
    } else {
      runNavigateBreadcrumbMyReports()
    }
  }

  /** Middle crumb while in wizard: return to the same reports list (preserves filters). */
  const navigateBreadcrumbReportsListFromWizard = () => {
    if (nrContext) {
      pendingSidebarNavIdRef.current = null
      pendingNavigationRef.current = runLeaveNewReportToReportsList
      setLeaveDialogOpen(true)
    } else {
      runLeaveNewReportToReportsList()
    }
  }

  const confirmLeaveWizard = () => {
    leaveViaConfirmRef.current = true
    const fn = pendingNavigationRef.current
    const navId = pendingSidebarNavIdRef.current
    pendingNavigationRef.current = null
    pendingSidebarNavIdRef.current = null
    try {
      if (fn) fn()
      else if (navId != null) exitWizardAndGoToSidebar(navId)
    } finally {
      setLeaveDialogOpen(false)
      queueMicrotask(() => {
        leaveViaConfirmRef.current = false
      })
    }
  }

  const cancelLeaveWizard = () => {
    pendingNavigationRef.current = null
    pendingSidebarNavIdRef.current = null
    setLeaveDialogOpen(false)
  }

  const requestCloseWizard = () => {
    pendingSidebarNavIdRef.current = null
    pendingNavigationRef.current = closeNewReport
    setLeaveDialogOpen(true)
  }

  const searchActive = Boolean(sidebarSearch.trim())
  const reportsListBreadcrumbLabel = searchActive
    ? 'Search results'
    : getReportsListBreadcrumbLabel(activeId)

  /** Wizard middle crumb: always the sidebar list you left (Track/Segment/Profile/All workflows or Search results), even for By source. */
  const breadcrumbItems = nrContext
    ? [
        { id: 'home', label: 'Home', onPress: navigateBreadcrumbHome },
        {
          id: 'reports-list',
          label: reportsListBreadcrumbLabel,
          onPress: navigateBreadcrumbReportsListFromWizard,
        },
      ]
    : appsView
      ? []
      : [{ id: 'home', label: 'Home', onPress: navigateBreadcrumbHome }]

  const leaveDialogBody =
    'Nothing on this screen is saved yet. Leave and you can start again anytime.'
  const breadcrumbCurrentLabel = nrContext
    ? 'New report'
    : appsView
      ? 'Home'
      : searchActive
        ? 'Search results'
        : getReportsListBreadcrumbLabel(activeId)

  return (
    <>
    <div className={`app-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="app-layout__sidebar">
        <TitanSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          activeId={appsView ? 'home' : activeId}
          onActiveChange={handleActive}
        >
          <button
            type="button"
            className="app-layout__brand app-layout__brand-btn"
            onClick={handleLogoPress}
            aria-label="Audiense home — Know your audience"
          >
            {collapsed ? (
              <span className="app-layout__brand-icon-wrap">
                <img
                  className="app-layout__brand-logo app-layout__brand-logo--collapsed"
                  src={audienseLogoUrl}
                  alt=""
                />
              </span>
            ) : (
              <img
                className="app-layout__brand-logo app-layout__brand-logo--expanded"
                src={audienseLogoUrl}
                alt=""
              />
            )}
          </button>
          {!collapsed ? (
            <TitanSidebarSearch
              placeholder="Search anything"
              value={sidebarSearch}
              onChange={setSidebarSearch}
              aria-label="Global search across all workflows and reports"
            />
          ) : null}
          <div className="app-layout__sidebar-divider" aria-hidden />
          <TitanSidebarSection>
            <TitanSidebarItem id="home" icon={<Home size={16} aria-hidden />}>
              Home
            </TitanSidebarItem>
            <TitanSidebarItem
              id={ALL_WORKFLOWS_NAV_ITEM.id}
              icon={<LayoutGrid size={16} aria-hidden />}
            >
              {ALL_WORKFLOWS_NAV_ITEM.label}
            </TitanSidebarItem>
            <div className="app-layout__workflow-subnav" aria-label="Workflow subsets">
              {WORKFLOW_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <TitanSidebarItem
                    key={item.id}
                    id={item.id}
                    icon={<Icon size={16} aria-hidden />}
                    nested
                  >
                    {item.label}
                  </TitanSidebarItem>
                )
              })}
            </div>
          </TitanSidebarSection>
        </TitanSidebar>
      </aside>
      <div className="app-layout__main">
        <div className="app-layout__navbar">
          <div className="app-layout__navbar-tools">
            <TitanNavbar theme="audiense" userInitial="A" />
          </div>
        </div>
        <AppBreadcrumb items={breadcrumbItems} currentLabel={breadcrumbCurrentLabel} />
        <main className="app-layout__content">
          {nrContext ? (
            <NewReportPage
              context={nrContext}
              onClose={requestCloseWizard}
              onGoToAllReports={runNavigateAfterNewReportDemo}
            />
          ) : appsView ? (
            <AppsHomePage />
          ) : (
            <ReportsView
              workflowId={activeId ?? 'all'}
              searchQuery={sidebarSearch}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateRangeChange={handleDateRangeChange}
              onSearchClear={() => setSidebarSearch('')}
              onBeginNewReport={openNewReport}
            />
          )}
        </main>
      </div>
    </div>
    <TitanDialog
      triggerLabel={null}
      isOpen={leaveDialogOpen}
      onOpenChange={(open) => {
        setLeaveDialogOpen(open)
        if (!open && !leaveViaConfirmRef.current) {
          pendingNavigationRef.current = null
          pendingSidebarNavIdRef.current = null
        }
      }}
      aria-label="Confirm leaving report creation"
      title="Leave report creation?"
      body={leaveDialogBody}
      leftAction={
        <TitanButton variant="secondary" onPress={cancelLeaveWizard}>
          Stay
        </TitanButton>
      }
      rightAction={
        <TitanButton variant="primary" onPress={confirmLeaveWizard}>
          Leave
        </TitanButton>
      }
    />
    </>
  )
}
