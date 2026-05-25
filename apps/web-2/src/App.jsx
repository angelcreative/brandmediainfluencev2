import { useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  TitanAppShell,
  TitanBadge,
  TitanBreadcrumb,
  TitanNavBar,
  TitanButton,
  TitanButtonGroup,
  TitanIndividualButton,
  TitanCard,
  TitanIconButton,
  TitanInputField,
  TitanLink,
  TitanLoader,
  TitanNavbar,
  TitanPagination,
  TitanPill,
  TitanSelect,
  TitanTable,
  TitanTableBody,
  TitanCell,
  TitanColumn,
  TitanRow,
  TitanTableHeader,
  TitanTooltip,
} from 'titan-compositions'
import { AnimatedFilterCollapsible } from './AnimatedFilterCollapsible.jsx'
import {
  ComboBox,
  ComboBoxStateContext,
  Input,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  Popover,
} from 'react-aria-components'
import {
  ArrowLeft,
  BookOpen,
  ChartSpline,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  CornerDownLeft,
  Download,
  LogOut,
  Mail,
  Megaphone,
  Search,
  Sparkles,
} from 'lucide-react'
import { SocialIcon } from 'react-social-icons/component'
import 'react-social-icons/instagram'
import 'react-social-icons/facebook'
import 'react-social-icons/tiktok'

/** --- Mock data --- */
const LOCATIONS = [
  { id: 'spain', label: 'Spain', subtitle: 'Country' },
  { id: 'us', label: 'United States', subtitle: 'Country' },
  { id: 'trinidad', label: 'Port of Spain, Trinidad and Tobago', subtitle: 'City' },
]

/** Same options for demo; audience vs creator filters are separate in the UI */
const AUDIENCE_LOCATIONS = LOCATIONS

const SPARKS_MENU_ITEMS = [
  { id: 'mcp-docs', label: 'How to use the MCP Connector' },
  { id: 'mcp-support', label: 'Support for the MCP Connector' },
]

const HELP_MENU_ITEMS = [
  { id: 'contact', label: 'Contact Us' },
  { id: 'knowledge', label: 'Knowledge base' },
  { id: 'feedback', label: 'Product Feedback' },
]

const ACCOUNT_MENU_ITEMS = [
  { id: 'email', label: 'angelsanchez@audiense.com' },
  { id: 'logout', label: 'Log out' },
]

const LOOKALIKE_OPTIONS = [
  { id: 'lk1', name: 'Alex Rivera', handle: '@arivera', followersLabel: '1.2M', initials: 'AR' },
  { id: 'lk2', name: 'Sam Chen', handle: '@schenio', followersLabel: '890K', initials: 'SC' },
  { id: 'lk3', name: 'Jordan Lee', handle: '@jleecreates', followersLabel: '2.1M', initials: 'JL' },
  { id: 'lk4', name: 'Riley Park', handle: '@rripley', followersLabel: '450K', initials: 'RP' },
]

const CREATOR_FIRST = [
  'Nora',
  'Eli',
  'Sam',
  'Ivy',
  'Theo',
  'Mira',
  'Leo',
  'Zoe',
  'Kai',
  'Juno',
  'Max',
  'Ada',
  'Ben',
  'Cleo',
  'Dex',
  'Eva',
  'Finn',
  'Gia',
  'Hugo',
  'Iris',
  'Jake',
  'Kira',
  'Luna',
  'Milo',
  'Nina',
  'Omar',
  'Pia',
  'Quinn',
  'Ravi',
  'Sasha',
  'Tara',
  'Uma',
  'Vera',
  'Will',
  'Xara',
  'Yara',
  'Zane',
  'Aria',
  'Blake',
  'Cara',
  'Dane',
  'Emi',
  'Frank',
  'Gina',
  'Hana',
]

const CREATOR_LAST = [
  'Vega',
  'Moran',
  'Ortiz',
  'Reed',
  'Stone',
  'Park',
  'Khan',
  'Lopez',
  'Chen',
  'Wright',
  'Adams',
  'Brooks',
  'Cruz',
  'Diaz',
  'Edwards',
  'Fox',
  'Gray',
  'Hill',
  'Irvin',
  'Jones',
  'King',
  'Lee',
  'Moss',
  'Nova',
  'Page',
  'Quest',
  'Rose',
  'Snow',
  'Tate',
  'Ulloa',
  'Voss',
  'West',
  'Xu',
  'Yang',
  'Zhou',
  'Abbott',
  'Brynn',
  'Crane',
  'Drake',
  'Ember',
  'Frost',
  'Grant',
  'Hale',
  'Inez',
  'Jade',
]

const KW_POOL = [
  ['demo', 'creator'],
  ['lifestyle', 'travel'],
  ['tech', 'startup'],
  ['music', 'artist'],
  ['fitness', 'coach'],
]

/** 45 filas demo; avatares CC0 vía https://pravatar.cc/ */
function buildCreators() {
  const lookalikeIds = ['lk1', 'lk2', 'lk3', 'lk4']
  const locs = ['spain', 'us', 'trinidad']
  const creators = []
  for (let i = 0; i < 45; i++) {
    const n = i + 1
    const fn = CREATOR_FIRST[i]
    const ln = CREATOR_LAST[i]
    const handle = `@${fn.toLowerCase()}.${ln.toLowerCase()}`
    const initials = `${fn[0]}${ln[0]}`
    creators.push({
      id: String(n),
      name: `${fn} ${ln}`,
      handle,
      initials,
      locationId: locs[i % 3],
      audienceLocationId: locs[(i + 1) % 3],
      keywords: KW_POOL[i % KW_POOL.length],
      lookalikeIds: i % 2 === 0 ? [lookalikeIds[i % 4]] : [],
      followers: 50_000 + ((n * 1_234_567) % 900_000_000),
      avgLikes: 2_000 + ((n * 88_888) % 5_000_000),
      engagementRate: 0.0005 + ((n * 17) % 800) / 100_000,
      avatarUrl: `https://i.pravatar.cc/64?img=${(i % 70) + 1}`,
    })
  }
  return creators
}

const CREATORS = buildCreators()

const PAGE_SIZE = 10

const RANGE_OPTIONS = [
  { id: '', label: 'From' },
  { id: '1000', label: '1k' },
  { id: '5000', label: '5k' },
  { id: '10000', label: '10k' },
  { id: '25000', label: '25k' },
  { id: '50000', label: '50k' },
  { id: '100000', label: '100k' },
  { id: '500000', label: '500k' },
  { id: '1000000', label: '1M' },
]

const RANGE_TO_OPTIONS = [
  { id: '', label: 'To' },
  ...RANGE_OPTIONS.filter((o) => o.id !== ''),
]

const OPERATOR_OPTIONS = [
  { id: '', label: 'Select operator' },
  { id: 'gte', label: '≥ (greater than or equal)' },
  { id: 'gt', label: '> (greater than)' },
  { id: 'lte', label: '≤ (less than or equal)' },
  { id: 'lt', label: '< (less than)' },
]

const SORT_OPTIONS = [
  { id: 'followers', label: 'Followers' },
  { id: 'avgLikes', label: 'Average Likes' },
  { id: 'engagementRate', label: 'Engagement Rate' },
]

const DIRECTION_OPTIONS = [
  { id: 'desc', label: 'Descending' },
  { id: 'asc', label: 'Ascending' },
]

/** Breadcrumb: ancestors (links); current page is `currentLabel`. Rendered inside `TitanAppShell` → `.titan-app-breadcrumb-strip` (DS: full-width `--breadcrumb-slot-bg`). */
const CREATOR_DISCOVERY_BREADCRUMB_ITEMS = [
  { id: 'home', label: 'Home', onPress: () => {} },
  { id: 'demand', label: 'Demand', onPress: () => {} },
]

function creatorProfileUrl(handle, platform) {
  const u = handle.replace(/^@/, '')
  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/${u}`
    case 'tiktok':
      return `https://www.tiktok.com/@${u}`
    case 'instagram':
    default:
      return `https://www.instagram.com/${u}/`
  }
}

function formatCompact(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(n)
}

function parseNum(id) {
  if (!id) return null
  const v = Number(id)
  return Number.isFinite(v) ? v : null
}

function highlightMatch(text, query) {
  const q = query.trim().toLowerCase()
  if (!q) return text
  const lower = text.toLowerCase()
  const i = lower.indexOf(q)
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <strong>{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  )
}

function LocationListBoxItem({ item }) {
  const state = useContext(ComboBoxStateContext)
  const inputValue = state?.inputValue ?? ''
  return (
    <ListBoxItem
      id={item.id}
      textValue={item.label}
      className="select-item menu-item menu-item-search location-menu-item"
    >
      <span className="select-item-start menu-item-start location-menu-item__start">
        <span className="menu-item-label location-menu-item__primary">
          {highlightMatch(item.label, inputValue)}
        </span>
        {item.subtitle ? (
          <span className="location-menu-item__sub">{item.subtitle}</span>
        ) : null}
      </span>
    </ListBoxItem>
  )
}

function TypeaheadLocation({
  valueId,
  onChange,
  options = LOCATIONS,
  hintText = 'Select the location where the creator is based. (Max. 20)',
  inputAriaLabel = 'Search country or city',
  listboxLabel = 'Location suggestions',
}) {
  const hintId = useId()
  const [fieldValue, setFieldValue] = useState('')

  const filtered = useMemo(() => {
    const q = fieldValue.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q))
    )
  }, [fieldValue, options])

  return (
    <div className="typeahead typeahead--location-combobox">
      <p className="filter-hint" id={hintId}>
        {hintText}
      </p>
      <ComboBox
        items={filtered}
        inputValue={fieldValue}
        onInputChange={setFieldValue}
        selectedKey={valueId ?? null}
        onSelectionChange={(key) => {
          onChange(key == null ? null : String(key))
          if (key != null) {
            const match = options.find((o) => o.id === String(key))
            setFieldValue(match ? match.label : '')
          }
        }}
        aria-label={inputAriaLabel}
        aria-describedby={hintId}
        placeholder="Search country or city"
        menuTrigger="focus"
        allowsEmptyCollection
        className="location-combobox"
      >
        <div className="input-with-icons input-with-icons-left location-combobox__field">
          <span className="input-leading-icon" aria-hidden>
            <Search size={18} />
          </span>
          <Input className="input-field" maxLength={20} />
        </div>
        <Popover className="select-popover location-combobox__popover">
          <ListBox
            aria-label={listboxLabel}
            className="select-list location-combobox__listbox"
            renderEmptyState={() => <div className="typeahead__empty">No results</div>}
          >
            {(item) => <LocationListBoxItem item={item} />}
          </ListBox>
        </Popover>
      </ComboBox>
    </div>
  )
}

function TypeaheadLookalike({ selectedIds, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = LOOKALIKE_OPTIONS.filter((o) => !selectedIds.includes(o.id))
    if (!q) return pool.slice(0, 6)
    return pool
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.handle.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [query, selectedIds])

  return (
    <div ref={wrapRef} className="typeahead">
      <p className="filter-hint">Search accounts to compare audience overlap.</p>
      <TitanInputField
        aria-label="Search lookalike accounts"
        placeholder="Search by name or handle"
        value={query}
        onChange={(v) => {
          setQuery(v)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        startIcon={<Search size={18} aria-hidden />}
      />
      {selectedIds.length > 0 && (
        <div className="keyword-chips" role="list">
          {selectedIds.map((id) => {
            const acc = LOOKALIKE_OPTIONS.find((o) => o.id === id)
            if (!acc) return null
            return (
              <TitanPill
                key={id}
                label={acc.handle}
                tone="ocean"
                state="base"
                removable
                onDismiss={() => onRemove(id)}
                aria-label={`Remove ${acc.handle}`}
              />
            )
          })}
        </div>
      )}
      {open && (
        <div className="typeahead__popover typeahead__popover--rich" role="listbox" aria-label="Lookalike suggestions">
          {filtered.length === 0 ? (
            <div className="typeahead__empty">No results</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="typeahead__item typeahead__item--row"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAdd(opt.id)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <div className="table-avatar-initials" aria-hidden>
                  {opt.initials}
                </div>
                <div className="typeahead__item-main">
                  <div className="typeahead__item-name">{highlightMatch(opt.name, query)}</div>
                  <div className="typeahead__item-handle">{opt.handle}</div>
                </div>
                <span className="typeahead__item-metric">{opt.followersLabel}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const initialDraft = {
  keywords: [],
  keywordInput: '',
  locationId: null,
  audienceLocationId: null,
  lookalikeIds: [],
  followersFrom: '',
  followersTo: '',
  likesFrom: '',
  likesTo: '',
  engOperator: '',
  engValue: '',
  sortBy: 'followers',
  direction: 'desc',
}

function filterAndSort(rows, f) {
  let out = [...rows]

  if (f.keywords?.length) {
    out = out.filter((c) =>
      f.keywords.some((kw) => {
        const k = kw.toLowerCase()
        return (
          c.name.toLowerCase().includes(k) ||
          c.handle.toLowerCase().includes(k) ||
          c.keywords.some((t) => t.toLowerCase().includes(k))
        )
      })
    )
  }

  if (f.locationId) {
    out = out.filter((c) => c.locationId === f.locationId)
  }

  if (f.audienceLocationId) {
    out = out.filter((c) => c.audienceLocationId === f.audienceLocationId)
  }

  if (f.lookalikeIds?.length) {
    out = out.filter((c) => c.lookalikeIds.some((id) => f.lookalikeIds.includes(id)))
  }

  const ff = parseNum(f.followersFrom)
  const ft = parseNum(f.followersTo)
  if (ff != null) out = out.filter((c) => c.followers >= ff)
  if (ft != null) out = out.filter((c) => c.followers <= ft)

  const lf = parseNum(f.likesFrom)
  const lt = parseNum(f.likesTo)
  if (lf != null) out = out.filter((c) => c.avgLikes >= lf)
  if (lt != null) out = out.filter((c) => c.avgLikes <= lt)

  if (f.engOperator && f.engValue !== '') {
    const pct = Number(f.engValue)
    if (!Number.isNaN(pct)) {
      const target = pct / 100
      out = out.filter((c) => {
        switch (f.engOperator) {
          case 'gte':
            return c.engagementRate >= target
          case 'gt':
            return c.engagementRate > target
          case 'lte':
            return c.engagementRate <= target
          case 'lt':
            return c.engagementRate < target
          default:
            return true
        }
      })
    }
  }

  const dir = f.direction === 'asc' ? 1 : -1
  const key = f.sortBy || 'followers'
  out.sort((a, b) => {
    const av = key === 'followers' ? a.followers : key === 'avgLikes' ? a.avgLikes : a.engagementRate
    const bv = key === 'followers' ? b.followers : key === 'avgLikes' ? b.avgLikes : b.engagementRate
    return (av - bv) * dir
  })

  return out
}

const initialSectionOpen = {
  keywords: true,
  location: false,
  audience: false,
  lookalike: false,
  followers: false,
  likes: false,
  engagement: false,
}

export default function App() {
  const [draft, setDraft] = useState(initialDraft)
  const [applied, setApplied] = useState(initialDraft)
  const [loading, setLoading] = useState(false)
  const [platform, setPlatform] = useState('instagram')
  const [sectionOpen, setSectionOpen] = useState(initialSectionOpen)
  const [currentPage, setCurrentPage] = useState(1)
  const [sparksMenuOpen, setSparksMenuOpen] = useState(false)
  const [helpMenuOpen, setHelpMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [anchorsReady, setAnchorsReady] = useState(false)
  const sparksTriggerRef = useRef(null)
  const helpTriggerRef = useRef(null)
  const accountTriggerRef = useRef(null)

  function closeAllMenus() {
    setSparksMenuOpen(false)
    setHelpMenuOpen(false)
    setAccountMenuOpen(false)
  }

  useLayoutEffect(() => {
    const sparksEl = document.querySelector(
      '.app-shell .navbar .navbar-right-group > .navbar-icon-button:nth-child(5)'
    )
    const helpEl = document.querySelector(
      '.app-shell .navbar .navbar-right-group > .navbar-icon-button:nth-child(3)'
    )
    const accountEl = document.querySelector('.app-shell .navbar .navbar-user')
    sparksTriggerRef.current = sparksEl
    helpTriggerRef.current = helpEl
    accountTriggerRef.current = accountEl
    setAnchorsReady(!!(sparksEl && helpEl && accountEl))
  }, [])

  useEffect(() => {
    const el = document.querySelector('.app-shell .navbar .navbar-user')
    if (!el) return
    function onUserAreaClick(e) {
      if (e.target.closest('.navbar-chevron-button')) return
      closeAllMenus()
      setAccountMenuOpen((open) => !open)
    }
    el.addEventListener('click', onUserAreaClick)
    return () => el.removeEventListener('click', onUserAreaClick)
  }, [])

  const filtered = useMemo(() => {
    const f = { ...applied, sortBy: draft.sortBy, direction: draft.direction }
    return filterAndSort(CREATORS, f)
  }, [applied, draft.sortBy, draft.direction])

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const rangeLabel = useMemo(() => {
    if (totalFiltered === 0) return '0 creators'
    if (totalFiltered === 1) return '1 creator'
    return `${totalFiltered} creators`
  }, [totalFiltered])

  const followersActive =
    (applied.followersFrom && applied.followersFrom !== '') ||
    (applied.followersTo && applied.followersTo !== '')
  const likesActive =
    (applied.likesFrom && applied.likesFrom !== '') || (applied.likesTo && applied.likesTo !== '')
  const engActive = applied.engOperator && applied.engValue !== ''

  function applyFilters() {
    setLoading(true)
    window.setTimeout(() => {
      setApplied({
        ...draft,
        sortBy: draft.sortBy,
        direction: draft.direction,
      })
      setCurrentPage(1)
      setLoading(false)
    }, 450)
  }

  function clearAll() {
    const empty = {
      keywords: [],
      keywordInput: '',
      locationId: null,
      audienceLocationId: null,
      lookalikeIds: [],
      followersFrom: '',
      followersTo: '',
      likesFrom: '',
      likesTo: '',
      engOperator: '',
      engValue: '',
      sortBy: 'followers',
      direction: 'desc',
    }
    setDraft(empty)
    setApplied(empty)
    setSectionOpen(initialSectionOpen)
    setCurrentPage(1)
  }

  function addKeywordFromInput() {
    setDraft((d) => {
      const t = d.keywordInput.trim()
      if (!t) return d
      if (d.keywords.includes(t)) return { ...d, keywordInput: '' }
      return { ...d, keywords: [...d.keywords, t], keywordInput: '' }
    })
  }

  return (
    <>
      <TitanAppShell
        className="app-shell"
        navbar={
          <div className="app-shell-navbar">
            <svg width={0} height={0} aria-hidden="true" className="navbar-spark-gradient-defs">
              <defs>
                <linearGradient id="navbar-spark-gradient" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="var(--color-mango-500)" />
                  <stop offset="100%" stopColor="var(--color-pomegranate-500)" />
                </linearGradient>
              </defs>
            </svg>
            <TitanNavBar>
              <TitanNavbar
                theme="audiense"
                userInitial="A"
                userChevronIcon={
                  accountMenuOpen ? (
                    <ChevronUp size={18} aria-hidden />
                  ) : (
                    <ChevronDown size={18} aria-hidden />
                  )
                }
                featuredActionIcon={
                  <Sparkles className="navbar-sparks-icon" size={18} strokeWidth={2} aria-hidden />
                }
                onHelp={() => {
                  closeAllMenus()
                  setHelpMenuOpen((open) => !open)
                }}
                onFeaturedAction={() => {
                  closeAllMenus()
                  setSparksMenuOpen((open) => !open)
                }}
                onUserMenu={() => {
                  closeAllMenus()
                  setAccountMenuOpen((open) => !open)
                }}
              />
            </TitanNavBar>
          </div>
        }
        breadcrumb={
          <TitanBreadcrumb
            ariaLabel="Breadcrumb"
            maxVisible={5}
            items={CREATOR_DISCOVERY_BREADCRUMB_ITEMS}
            currentLabel="Creator Discovery"
          />
        }
      >
        <div className="page--discovery">
        <div className="discovery-top">
          <TitanIconButton variant="secondary" className="discovery-back" aria-label="Back" onPress={() => {}}>
            <ArrowLeft size={18} aria-hidden />
          </TitanIconButton>
          <div className="discovery-top__text">
            <div className="discovery-title-row">
              <h1 className="discovery-title">Creator Discovery</h1>
              <TitanPill label="Beta" state="info" removable={false} />
            </div>
            <p className="discovery-kicker">New Creator Discovery</p>
            <p className="discovery-desc">
              Find creators on Instagram, Facebook, or TikTok based on keywords, filters, and audience criteria.
              Export your results or analyze individual profiles.
            </p>
          </div>
        </div>

        <div className="platform-toolbar">
          <TitanButtonGroup
            aria-label="Platform"
            selectedKeys={new Set([platform])}
            onSelectionChange={(keys) => {
              const next = [...keys][0]
              if (next != null) setPlatform(String(next))
            }}
            disallowEmptySelection
          >
            <TitanIndividualButton id="instagram">
              <span className="platform-social-icon-wrap" aria-hidden>
                <SocialIcon
                  network="instagram"
                  as="span"
                  className="platform-social-icon"
                  style={{ width: 18, height: 18 }}
                />
              </span>
              Instagram
            </TitanIndividualButton>
            <TitanTooltip content="Coming soon" placement="top">
              <span className="platform-facebook-tooltip-wrap">
                <TitanIndividualButton id="facebook" isDisabled>
                  <span className="platform-social-icon-wrap" aria-hidden>
                    <SocialIcon
                      network="facebook"
                      as="span"
                      className="platform-social-icon"
                      style={{ width: 18, height: 18 }}
                    />
                  </span>
                  Facebook
                </TitanIndividualButton>
              </span>
            </TitanTooltip>
            <TitanIndividualButton id="tiktok">
              <span className="platform-social-icon-wrap" aria-hidden>
                <SocialIcon
                  network="tiktok"
                  as="span"
                  className="platform-social-icon"
                  style={{ width: 18, height: 18 }}
                />
              </span>
              TikTok
            </TitanIndividualButton>
          </TitanButtonGroup>
        </div>

        <div className="discovery-two-column">
          <TitanCard span={4} className="filters-card">
            <h2 className="filters-card__title">Add some filters</h2>
            <p className="filters-card__desc">These filters will be applied to your search results.</p>

            <div className="filters-sections">
              <AnimatedFilterCollapsible
                isCollapsed={!sectionOpen.keywords}
                onChange={(collapsed) =>
                  setSectionOpen((s) => ({ ...s, keywords: !collapsed }))
                }
                title={
                  <span className="collapsible-title">
                    <span className="keyword-section__title">Keywords Search</span>
                    <TitanBadge count={draft.keywords.length} max={99} />
                  </span>
                }
              >
                <p className="filter-hint">
                  Press Enter to add keywords. This will look in the bio, fullname and hashtags used in the posts.
                </p>
                <div
                  onKeyDownCapture={(e) => {
                    if (e.key !== 'Enter') return
                    e.preventDefault()
                    addKeywordFromInput()
                  }}
                >
                  <TitanInputField
                    className="field-root keyword-input-field"
                    aria-label="Add keywords"
                    placeholder="Type a keyword"
                    value={draft.keywordInput}
                    onChange={(v) => setDraft((d) => ({ ...d, keywordInput: v }))}
                    endIcon={<CornerDownLeft size={18} strokeWidth={1.75} aria-hidden />}
                  />
                </div>
                {draft.keywords.length > 0 && (
                  <div className="keyword-chips">
                    {draft.keywords.map((kw) => (
                      <TitanPill
                        key={kw}
                        label={kw}
                        tone="ocean"
                        state="base"
                        removable
                        onDismiss={() =>
                          setDraft((d) => ({
                            ...d,
                            keywords: d.keywords.filter((x) => x !== kw),
                          }))
                        }
                        aria-label={`Remove keyword ${kw}`}
                      />
                    ))}
                  </div>
                )}
              </AnimatedFilterCollapsible>

              <AnimatedFilterCollapsible
                title="Creator Location"
                isCollapsed={!sectionOpen.location}
                onChange={(collapsed) =>
                  setSectionOpen((s) => ({ ...s, location: !collapsed }))
                }
              >
                <TypeaheadLocation
                  valueId={draft.locationId}
                  onChange={(id) => setDraft((d) => ({ ...d, locationId: id }))}
                />
              </AnimatedFilterCollapsible>

              <AnimatedFilterCollapsible
                title="Audience Location"
                isCollapsed={!sectionOpen.audience}
                onChange={(collapsed) =>
                  setSectionOpen((s) => ({ ...s, audience: !collapsed }))
                }
              >
                <TypeaheadLocation
                  valueId={draft.audienceLocationId}
                  onChange={(id) => setDraft((d) => ({ ...d, audienceLocationId: id }))}
                  options={AUDIENCE_LOCATIONS}
                  hintText="Select where the audience is located. (Max. 20)"
                  inputAriaLabel="Search audience country or city"
                  listboxLabel="Audience location suggestions"
                />
              </AnimatedFilterCollapsible>

              <AnimatedFilterCollapsible
                title="Lookalike Accounts"
                isCollapsed={!sectionOpen.lookalike}
                onChange={(collapsed) =>
                  setSectionOpen((s) => ({ ...s, lookalike: !collapsed }))
                }
              >
                <TypeaheadLookalike
                  selectedIds={draft.lookalikeIds}
                  onAdd={(id) =>
                    setDraft((d) => ({
                      ...d,
                      lookalikeIds: d.lookalikeIds.includes(id) ? d.lookalikeIds : [...d.lookalikeIds, id],
                    }))
                  }
                  onRemove={(id) =>
                    setDraft((d) => ({
                      ...d,
                      lookalikeIds: d.lookalikeIds.filter((x) => x !== id),
                    }))
                  }
                />
              </AnimatedFilterCollapsible>

              <AnimatedFilterCollapsible
                title={
                  <span className="collapsible-title">
                    Followers
                    {followersActive ? <TitanBadge count={1} max={9} /> : null}
                  </span>
                }
                isCollapsed={!sectionOpen.followers}
                onChange={(collapsed) =>
                  setSectionOpen((s) => ({ ...s, followers: !collapsed }))
                }
              >
                <p className="filter-hint">Filter by follower count range.</p>
                <div className="filter-row-2">
                  <TitanSelect
                    label="From"
                    aria-label="Followers from"
                    options={RANGE_OPTIONS}
                    selectedKey={draft.followersFrom}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, followersFrom: key != null ? String(key) : '' }))
                    }
                  />
                  <TitanSelect
                    label="To"
                    aria-label="Followers to"
                    options={RANGE_TO_OPTIONS}
                    selectedKey={draft.followersTo}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, followersTo: key != null ? String(key) : '' }))
                    }
                  />
                </div>
              </AnimatedFilterCollapsible>

              <AnimatedFilterCollapsible
                title={
                  <span className="collapsible-title">
                    Average Likes
                    {likesActive ? <TitanBadge count={1} max={9} /> : null}
                  </span>
                }
                isCollapsed={!sectionOpen.likes}
                onChange={(collapsed) =>
                  setSectionOpen((s) => ({ ...s, likes: !collapsed }))
                }
              >
                <p className="filter-hint">Filter by average likes count range.</p>
                <div className="filter-row-2">
                  <TitanSelect
                    label="From"
                    aria-label="Average likes from"
                    options={RANGE_OPTIONS}
                    selectedKey={draft.likesFrom}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, likesFrom: key != null ? String(key) : '' }))
                    }
                  />
                  <TitanSelect
                    label="To"
                    aria-label="Average likes to"
                    options={RANGE_TO_OPTIONS}
                    selectedKey={draft.likesTo}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, likesTo: key != null ? String(key) : '' }))
                    }
                  />
                </div>
              </AnimatedFilterCollapsible>

              <AnimatedFilterCollapsible
                title={
                  <span className="collapsible-title">
                    Engagement Rate
                    {engActive ? <TitanBadge count={1} max={9} /> : null}
                  </span>
                }
                isCollapsed={!sectionOpen.engagement}
                onChange={(collapsed) =>
                  setSectionOpen((s) => ({ ...s, engagement: !collapsed }))
                }
              >
                <p className="filter-hint">
                  Filter by engagement rate percentage (average likes divided by followers).
                </p>
                <div className="filter-row-2">
                  <TitanSelect
                    label="Operator"
                    aria-label="Engagement operator"
                    options={OPERATOR_OPTIONS}
                    selectedKey={draft.engOperator}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, engOperator: key != null ? String(key) : '' }))
                    }
                  />
                  <TitanInputField
                    label="Value (%)"
                    placeholder="e.g. 2.0"
                    value={draft.engValue}
                    onChange={(v) => setDraft((d) => ({ ...d, engValue: v }))}
                  />
                </div>
              </AnimatedFilterCollapsible>
            </div>

            <div className="filters-card__actions">
              <TitanButton variant="secondary" onPress={clearAll}>
                Clear All
              </TitanButton>
              <TitanButton variant="primary" onPress={applyFilters}>
                Apply
              </TitanButton>
            </div>
          </TitanCard>

          <div className="results-main-column">
            <div className="results-toolbar">
              <div className="results-toolbar__controls">
                <TitanSelect
                  label="Sort by"
                  aria-label="Sort by"
                  options={SORT_OPTIONS}
                  selectedKey={draft.sortBy}
                  onSelectionChange={(key) =>
                    setDraft((d) => ({ ...d, sortBy: key != null ? String(key) : 'followers' }))
                  }
                />
                <TitanSelect
                  label="Direction"
                  aria-label="Sort direction"
                  options={DIRECTION_OPTIONS}
                  selectedKey={draft.direction}
                  onSelectionChange={(key) =>
                    setDraft((d) => ({ ...d, direction: key != null ? String(key) : 'desc' }))
                  }
                />
              </div>
              <div className="results-toolbar__export">
                <TitanButton variant="secondary" onPress={() => {}} icon={<Download size={18} aria-hidden />}>
                  Export Results
                </TitanButton>
              </div>
            </div>

            <p className="results-demo-note" role="status">
              Demo — use <strong>Apply</strong> for filters. Sort updates the table immediately.
            </p>

            <div className="results-table-panel">
              {loading ? (
                <div className="results-loading">
                  <TitanLoader size={96} label="Loading results" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="results-empty">
                  <p>No creators match your filters.</p>
                  <TitanButton variant="secondary" onPress={clearAll}>
                    Clear filters
                  </TitanButton>
                </div>
              ) : (
                <>
                  <div className="layout-table-wrap">
                    <TitanTable aria-label="Creator results" className="table-borderless">
                      <TitanTableHeader>
                        <TitanColumn isRowHeader>Creator</TitanColumn>
                        <TitanColumn>Followers</TitanColumn>
                        <TitanColumn>Average Likes</TitanColumn>
                        <TitanColumn>Engagement Rate</TitanColumn>
                        <TitanColumn className="table-col-actions" alignment="right">
                          Actions
                        </TitanColumn>
                      </TitanTableHeader>
                      <TitanTableBody
                        items={pageRows}
                        dependencies={[draft.sortBy, draft.direction]}
                      >
                        {(row) => (
                          <TitanRow id={row.id}>
                            <TitanCell>
                              <div className="table-cell-avatar-group">
                                <img
                                  className="creator-avatar-img"
                                  src={row.avatarUrl}
                                  alt=""
                                  width={40}
                                  height={40}
                                  loading="lazy"
                                  decoding="async"
                                />
                                <div className="table-cell-name-wrap">
                                  <TitanLink
                                    size="m"
                                    href={creatorProfileUrl(row.handle, platform)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="creator-handle-link"
                                  >
                                    {row.handle}
                                  </TitanLink>
                                  <span className="creator-display-name">{row.name}</span>
                                </div>
                              </div>
                            </TitanCell>
                            <TitanCell>{formatCompact(row.followers)}</TitanCell>
                            <TitanCell>{formatCompact(row.avgLikes)}</TitanCell>
                            <TitanCell>{(row.engagementRate * 100).toFixed(2)}%</TitanCell>
                            <TitanCell className="table-cell-actions" alignment="right">
                              <div className="table-cell-actions__inner">
                                <TitanIconButton
                                  variant="base"
                                  aria-label={`Analyze ${row.name}`}
                                  onPress={() => {}}
                                >
                                  <ChartSpline size={18} aria-hidden />
                                </TitanIconButton>
                              </div>
                            </TitanCell>
                          </TitanRow>
                        )}
                      </TitanTableBody>
                    </TitanTable>
                  </div>
                  <div className="results-table-footer">
                    <div className="results-range" aria-live="polite">
                      <span className="results-range__text">{rangeLabel}</span>
                    </div>
                    <div className="results-pagination-wrap">
                      <TitanPagination
                        aria-label="Creator results pagination"
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setPage={setCurrentPage}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </TitanAppShell>
      {anchorsReady ? (
        <>
          <Popover
            triggerRef={helpTriggerRef}
            isOpen={helpMenuOpen}
            onOpenChange={setHelpMenuOpen}
            placement="bottom end"
            offset={8}
            shouldFlip
            isNonModal
            trigger="HelpMenu"
            className="menu-popover"
            aria-label="Help"
          >
            <Menu
              items={HELP_MENU_ITEMS}
              aria-label="Help"
              className="menu-list"
              onClose={() => setHelpMenuOpen(false)}
              onAction={(key) => {
                setHelpMenuOpen(false)
              }}
            >
              {(item) => (
                <MenuItem id={item.id} textValue={item.label} className="menu-item">
                  <span className="menu-item-start">
                    <span className="menu-item-icon" aria-hidden>
                      {item.id === 'contact' && <Mail size={18} strokeWidth={2} />}
                      {item.id === 'knowledge' && <BookOpen size={18} strokeWidth={2} />}
                      {item.id === 'feedback' && <Megaphone size={18} strokeWidth={2} />}
                    </span>
                    <span className="menu-item-label">{item.label}</span>
                  </span>
                </MenuItem>
              )}
            </Menu>
          </Popover>

          <Popover
            triggerRef={sparksTriggerRef}
            isOpen={sparksMenuOpen}
            onOpenChange={setSparksMenuOpen}
            placement="bottom end"
            offset={8}
            shouldFlip
            isNonModal
            trigger="SparksMenu"
            className="menu-popover"
            aria-label="MCP Connector"
          >
            <Menu
              items={SPARKS_MENU_ITEMS}
              aria-label="MCP Connector"
              className="menu-list"
              onClose={() => setSparksMenuOpen(false)}
              onAction={(key) => {
                setSparksMenuOpen(false)
                if (key === 'mcp-docs') {
                  window.open('https://www.audiense.com', '_blank', 'noopener,noreferrer')
                } else if (key === 'mcp-support') {
                  window.location.href = 'mailto:support@audiense.com?subject=MCP%20Connector%20support'
                }
              }}
            >
              {(item) => (
                <MenuItem id={item.id} textValue={item.label} className="menu-item">
                  <span className="menu-item-start">
                    <span className="menu-item-icon" aria-hidden>
                      {item.id === 'mcp-docs' ? (
                        <BookOpen size={18} strokeWidth={2} />
                      ) : (
                        <Mail size={18} strokeWidth={2} />
                      )}
                    </span>
                    <span className="menu-item-label">{item.label}</span>
                  </span>
                </MenuItem>
              )}
            </Menu>
          </Popover>

          <Popover
            triggerRef={accountTriggerRef}
            isOpen={accountMenuOpen}
            onOpenChange={setAccountMenuOpen}
            placement="bottom end"
            offset={8}
            shouldFlip
            isNonModal
            trigger="AccountMenu"
            className="menu-popover account-menu-popover"
            aria-label="Account"
          >
            <Menu
              items={ACCOUNT_MENU_ITEMS}
              aria-label="Account"
              className="menu-list account-menu__list"
              onClose={() => setAccountMenuOpen(false)}
              onAction={(key) => {
                if (key === 'logout') {
                  setAccountMenuOpen(false)
                  window.location.assign('/')
                }
              }}
            >
              {(item) =>
                item.id === 'email' ? (
                  <MenuItem
                    id={item.id}
                    textValue={item.label}
                    className="menu-item account-menu__email-item"
                  >
                    <span className="menu-item-label">{item.label}</span>
                  </MenuItem>
                ) : (
                  <MenuItem
                    id={item.id}
                    textValue={item.label}
                    className="menu-item menu-item-destructive"
                  >
                    <span className="menu-item-start">
                      <span className="menu-item-icon" aria-hidden>
                        <LogOut size={18} strokeWidth={2} />
                      </span>
                      <span className="menu-item-label">{item.label}</span>
                    </span>
                  </MenuItem>
                )
              }
            </Menu>
          </Popover>
        </>
      ) : null}
    </>
  )
}
