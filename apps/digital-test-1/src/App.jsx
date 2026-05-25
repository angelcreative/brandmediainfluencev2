import { useEffect, useMemo, useState } from 'react'
import { Button } from 'react-aria-components'
import { ChevronDown, MoreVertical, Search, X } from 'lucide-react'
import { TitanNavbar, TitanTabs } from 'titan-compositions'

const audienceTags = [
  'Instagram-native',
  'iPhone-loyal',
  'Young & single',
  'Music-eclectic',
  'Motorsport fans',
  'Anime readers',
  'Investors',
  'Premium home aesthetes',
]

const rejectionTags = [
  'On Facebook',
  'Android users',
  'Family-oriented',
  'Wellness seekers',
  'Traditional luxury shoppers',
  'Amazon shoppers',
  'Over 35',
]

const topics = [
  { key: 'home', name: 'Interior design & premium home', penetration: 71.3, selectivity: 2.22 },
  { key: 'music', name: 'Rock & Roll music', penetration: 77.3, selectivity: 2.07 },
  { key: 'motorcycles', name: 'Motorcycles & MotoGP', penetration: 84.1, selectivity: 1.97 },
  { key: 'electronic', name: 'DJs & electronic music', penetration: 56.1, selectivity: 1.95 },
  { key: 'rap', name: 'Rap music', penetration: 65.3, selectivity: 1.86 },
  { key: 'finance', name: 'Stock market & investing', penetration: 77.3, selectivity: 1.64 },
  { key: 'anime', name: 'Anime, manga & Marvel / DC', penetration: 57.4, selectivity: 1.38 },
  { key: 'fashion', name: 'Mainstream fashion', penetration: 71.6, selectivity: 0.75 },
  { key: 'family', name: 'Family, parenting & relationships', penetration: 57.3, selectivity: 0.73 },
  { key: 'wellness', name: 'Well-being & wellness lifestyle', penetration: 64.2, selectivity: 0.72 },
  { key: 'luxury', name: 'Luxury goods, jewelry & watches', penetration: 55.2, selectivity: 0.71 },
]

const brandGroups = [
  {
    id: 'premium-home',
    title: 'Premium home & design',
    meta: 'Furniture · ceramics · lifestyle goods · 4 brands',
    avg: 2.19,
    type: 'over',
    items: [
      { name: 'Poltrona Frau', penetration: 31.2, selectivity: 2.22 },
      { name: 'Kartell', penetration: 31.0, selectivity: 2.20 },
      { name: 'Maisons du Monde', penetration: 36.8, selectivity: 2.18 },
      { name: 'Villeroy & Boch', penetration: 36.8, selectivity: 2.17 },
    ],
  },
  {
    id: 'finance',
    title: 'Finance & investing',
    meta: 'Banks · brokerages · 1 brand',
    avg: 2.09,
    type: 'over',
    items: [{ name: 'JPMorgan Chase', penetration: 27.9, selectivity: 2.09 }],
  },
  {
    id: 'streaming',
    title: 'Streaming & music',
    meta: 'Music platforms · 1 brand',
    avg: 2.02,
    type: 'over',
    items: [{ name: 'Spotify', penetration: 74.7, selectivity: 2.02 }],
  },
  {
    id: 'motorcycle-gear',
    title: 'Motorcycle gear',
    meta: 'Riding gear · helmets · motorcycle brands · 3 brands',
    avg: 1.88,
    type: 'over',
    items: [
      { name: 'Dainese', penetration: 25.3, selectivity: 1.92 },
      { name: 'LS2', penetration: 25.3, selectivity: 1.99 },
      { name: 'Yamaha Motor', penetration: 60.0, selectivity: 1.74 },
    ],
  },
  {
    id: 'pop-culture',
    title: 'Pop culture & franchise',
    meta: 'K-pop · comics · fandom · 2 brands',
    avg: 1.9,
    type: 'over',
    items: [
      { name: 'BTS', penetration: 31.7, selectivity: 1.89 },
      { name: 'Marvel Comics', penetration: 36.2, selectivity: 1.89 },
    ],
  },
  {
    id: 'skipped-brands',
    title: 'Mass retail & Android ecosystem',
    meta: 'Retail · financial services · devices · 3 brands',
    avg: 0.58,
    type: 'under',
    items: [
      { name: 'American Express', penetration: 2.6, selectivity: 0.46 },
      { name: 'Huawei', penetration: 2.5, selectivity: 0.56 },
      { name: 'Amazon.com', penetration: 10.0, selectivity: 0.72 },
    ],
  },
]

const behaviorPanels = [
  {
    title: 'Demographics',
    question: 'Who are they?',
    hint: 'Young, single, university-educated.',
    items: [
      { name: '18-34 years old', penetration: 75.6, selectivity: 1.2 },
      { name: 'Single', penetration: 45.2, selectivity: 1.51 },
      { name: 'University-educated', penetration: 36.7, selectivity: 1.58 },
    ],
  },
  {
    title: 'Devices',
    question: 'What do they hold?',
    hint: 'iOS-loyal, Android-averse.',
    items: [
      { name: 'iPhone / iOS', penetration: 39.1, selectivity: 2.22 },
      { name: 'Android (any)', penetration: 49.9, selectivity: 0.74 },
      { name: 'Huawei', penetration: 2.5, selectivity: 0.56 },
    ],
  },
  {
    title: 'Life moments',
    question: "What's happening in their lives?",
    hint: 'Recently relocated, recently engaged.',
    items: [
      { name: 'Away from hometown', penetration: 6.7, selectivity: 1.79 },
      { name: 'Newly engaged (1 year)', penetration: 0.8, selectivity: 1.88 },
      { name: 'Newlywed (1 year)', penetration: 1.1, selectivity: 1.49 },
    ],
  },
]

const psychographicGroups = [
  {
    title: 'Personality',
    detail: '2 archetypes · Identity & worldview',
    items: [
      { name: 'The Dark Culture Seeker', category: 'Tradition & Rebellion', penetration: 5.6, selectivity: 1.43 },
      { name: 'The Scientist', category: 'Rational & Creative Identity', penetration: 18.3, selectivity: 1.42 },
    ],
  },
  {
    title: 'Fan engagement',
    detail: '3 archetypes · How they relate to fandoms',
    items: [
      { name: 'The Casual Engaged', category: 'Fan Segmentation', penetration: 99.5, selectivity: 2.25 },
      { name: 'The Superfan Engaged', category: 'Fan Segmentation', penetration: 28.0, selectivity: 1.56 },
      { name: 'The Fandom Devotee', category: 'Film, TV & Streaming', penetration: 27.9, selectivity: 1.41 },
    ],
  },
  {
    title: 'Lifestyle - music & subculture',
    detail: '4 archetypes · Cultural identity',
    items: [
      { name: 'The Digital Music Curator', category: 'Lifestyle - Music', penetration: 25.0, selectivity: 1.5 },
      { name: 'The Metal Music Listener', category: 'Lifestyle - Music', penetration: 7.3, selectivity: 1.43 },
      { name: 'The Streetwear Culture Enthusiast', category: 'Streetwear & Sneakers', penetration: 8.3, selectivity: 1.43 },
      { name: 'The Manga Aesthetic Curator', category: 'Lifestyle - Manga', penetration: 18.2, selectivity: 1.33 },
    ],
  },
  {
    title: 'Wealth & finance',
    detail: '3 archetypes · Status & money behavior',
    items: [
      { name: 'The Luxury Asset Collector', category: 'Investment & Asset Mgmt', penetration: 6.4, selectivity: 1.45 },
      { name: 'The Prestige Asset Collector', category: 'Wealth Management', penetration: 5.9, selectivity: 1.43 },
      { name: 'The Trader', category: 'Business - Fintech', penetration: 62.5, selectivity: 1.16 },
    ],
  },
]

const drillTopics = {
  music: {
    title: 'Rock & Roll music',
    breadcrumb: 'Topics & passions > Rock & Roll music',
    summary: "The musical universe underneath this topic. Specific subgenres, artists, and services - and what's being rejected.",
    penetration: '77.3%',
    selectivity: '2.07x',
    related: ['Rap music', 'DJs & electronic music', 'Anime & manga', 'Spotify'],
    items: [
      { name: 'Punk rock (seed interest)', penetration: 100.2, selectivity: 10.0 },
      { name: 'Alternative rock', penetration: 75.9, selectivity: 2.25 },
      { name: 'Rapping (music)', penetration: 73.1, selectivity: 2.22 },
      { name: 'Popular music', penetration: 75.2, selectivity: 2.19 },
      { name: 'House music', penetration: 70.5, selectivity: 2.18 },
      { name: 'Spotify', penetration: 74.7, selectivity: 2.02 },
      { name: 'Jazz music', penetration: 75.5, selectivity: 1.97 },
      { name: 'Rock music (general tag)', penetration: 35.7, selectivity: 0.72 },
    ],
  },
  motorcycles: {
    title: 'Motorcycles & MotoGP',
    breadcrumb: 'Topics & passions > Motorcycles & MotoGP',
    summary: 'Motorsport fandom and motorcycle culture. Brands, disciplines, and gear.',
    penetration: '84.1%',
    selectivity: '1.97x',
    related: ['Rock & Roll music', 'Racing Sports'],
    items: [
      { name: 'Motorcycle racing', penetration: 71.2, selectivity: 2.18 },
      { name: 'Sport bike', penetration: 69.6, selectivity: 2.13 },
      { name: 'Motorcycle club', penetration: 70.2, selectivity: 2.12 },
      { name: 'Dainese (gear)', penetration: 25.3, selectivity: 1.92 },
      { name: 'LS2 (helmets)', penetration: 25.3, selectivity: 1.99 },
      { name: 'Yamaha Motor Company', penetration: 60.0, selectivity: 1.74 },
    ],
  },
}

const tabConfig = [
  { id: 'topics', label: 'Topics & passions', count: 11 },
  { id: 'brands', label: 'Brand landscape', count: 8 },
  { id: 'behavior', label: 'Behavior & demographics', count: 9 },
  { id: 'psychographics', label: 'Psychographics', count: 17 },
]

const tabSummaries = {
  topics: {
    eyebrow: 'Topics & passions · what they care about',
    title: 'Their cultural world is built around music, motorsport and aesthetics - not family or wellness.',
    body: 'Seven topic clusters over-index 1.4x or higher. The four they actively avoid are exactly the topics that dominate the average Jordanian feed.',
    metrics: [
      { value: '7', label: 'Lean-into' },
      { value: '4', label: 'Reject' },
      { value: '2.22x', label: 'Top index' },
    ],
  },
  brands: {
    eyebrow: 'Brand landscape · the brands that define them',
    title: 'Premium-design, finance and motorcycle gear - not mass retail or financial services.',
    body: 'Five brand categories index above 1.85x on average. The strongest signal is in premium home and design, pointing at an aspirational, taste-driven audience.',
    metrics: [
      { value: '5', label: 'Strong categories' },
      { value: '3', label: 'Skipped' },
      { value: '2.22x', label: 'Top brand' },
    ],
  },
  behavior: {
    eyebrow: 'Behavior & demographics · how they show up online',
    title: 'Almost everyone is on Instagram and on iOS - and 75% are under 35.',
    body: 'Two of the strongest distinguishing signals are platform-level: 99% Instagram penetration and a near-zero presence on Facebook. Combined with iPhone preference and youth, the targeting calculus is unusually clean.',
    metrics: [
      { value: '99%', label: 'On Instagram' },
      { value: '75%', label: 'Under 35' },
      { value: '39%', label: 'On iOS' },
    ],
  },
  psychographics: {
    eyebrow: 'Psychographics · the personas they map to',
    title: 'A fan-driven, rebellion-flavored, status-and-self-optimization audience.',
    body: '17 SoPrism archetypes index above average across six dimensions. The most distinctive combination blends fandom, dark culture, streetwear, luxury assets and biohacking.',
    metrics: [
      { value: '6', label: 'Dimensions' },
      { value: '17', label: 'Archetypes' },
      { value: '2.25x', label: 'Top match' },
    ],
  },
}

function formatSelectivity(value) {
  return `${value.toFixed(value >= 10 ? 0 : 2).replace(/\.00$/, '')}x`
}

function signalType(value) {
  if (value >= 1.2) return 'over'
  if (value < 0.8) return 'under'
  return 'neutral'
}

function barWidth(value) {
  return `${Math.min(Math.max(value, 1), 100)}%`
}

function IndexBadge({ value }) {
  return <span className={`index-badge is-${signalType(value)}`}>{formatSelectivity(value)}</span>
}

function TagCloud({ title, type, tags }) {
  return (
    <div className="tag-cloud">
      <strong className={`tag-cloud__title is-${type}`}>{title}</strong>
      <div>
        {tags.map((tag) => (
          <span className={`report-pill is-${type}`} key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ summary }) {
  return (
    <section className="summary-card" aria-labelledby={`${summary.eyebrow}-summary`}>
      <div>
        <p>{summary.eyebrow}</p>
        <h2 id={`${summary.eyebrow}-summary`}>{summary.title}</h2>
        <span>{summary.body}</span>
      </div>
      <div className="summary-card__metrics">
        {summary.metrics.map((metric) => (
          <strong key={metric.label}>
            {metric.value}
            <span>{metric.label}</span>
          </strong>
        ))}
      </div>
    </section>
  )
}

function ReportTabContent({ tabId, onOpen }) {
  const summary = tabSummaries[tabId]
  return (
    <div className="report-tab-content">
      <HowToRead />
      <SummaryCard summary={summary} />

      {tabId === 'topics' ? <TopicDotPlot onOpen={onOpen} /> : null}

      {tabId === 'brands' ? (
        <section className="brand-view" aria-label="Brand landscape">
          <div className="brand-filters">
            <span className="report-chip is-over">↑ Lean-into · 5</span>
            <span className="report-chip is-under">↓ Skipped · 3</span>
          </div>
          <div className="brand-stack">
            {brandGroups.map((group) => <BrandRow group={group} key={group.id} />)}
          </div>
        </section>
      ) : null}

      {tabId === 'behavior' ? <BehaviorView /> : null}
      {tabId === 'psychographics' ? <PsychographicsView /> : null}
    </div>
  )
}

function HowToRead() {
  return (
    <section className="report-guide" aria-label="How to read this report">
      <strong>How to read</strong>
      <span><i className="legend-dot is-over" /> Over-indexed (≥1.2x)</span>
      <span><i className="legend-dot is-neutral" /> Neutral (0.8-1.2x)</span>
      <span><i className="legend-dot is-under" /> Under-indexed (&lt;0.8x)</span>
      <span>% share of audience × vs. average Jordanian</span>
      <span>Click any row to drill in →</span>
    </section>
  )
}

function MiniMetric({ label, value, detail }) {
  return (
    <article className="hero-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function TopicDotPlot({ onOpen }) {
  return (
    <article className="report-card topic-chart">
      <div className="section-copy">
        <p>Topic indexation · vs. average Jordanian</p>
        <h3>Which cultural worlds do they belong to?</h3>
        <span>Each dot’s distance from the center line shows how distinctive that topic is. Click any row to drill into specific interests inside it.</span>
      </div>
      <div className="dot-axis" aria-hidden>
        <span>0×</span>
        <span>1× avg</span>
        <span>2×</span>
        <span>3×</span>
      </div>
      <div className="topic-rows">
        {topics.map((item) => (
          <Button
            type="button"
            className="topic-row"
            key={item.name}
            onPress={() => onOpen(item.key)}
          >
            <strong>{item.name}</strong>
            <span className="topic-row__track">
              <i aria-hidden style={{ left: `${Math.min(item.selectivity / 3, 1) * 100}%` }} className={`is-${signalType(item.selectivity)}`} />
            </span>
            <span>{item.penetration}%</span>
            <IndexBadge value={item.selectivity} />
          </Button>
        ))}
      </div>
    </article>
  )
}

function BrandRow({ group }) {
  const [expanded, setExpanded] = useState(false)
  const visibleItems = expanded ? group.items : group.items.slice(0, 2)
  const hiddenCount = group.items.length - visibleItems.length
  return (
    <article className="brand-row">
      <div className={`brand-row__icon is-${group.type}`}>↑</div>
      <div className="brand-row__content">
        <div className="brand-row__header">
          <div>
            <h3>{group.title}</h3>
            <p>{group.meta}</p>
          </div>
          <strong>AVG <span>{formatSelectivity(group.avg)}</span></strong>
        </div>
        <div className="brand-row__chips">
          {visibleItems.map((item) => (
            <span className="report-chip" key={item.name}>{item.name} <IndexBadge value={item.selectivity} /></span>
          ))}
          {hiddenCount > 0 ? (
            <Button type="button" onPress={() => setExpanded((value) => !value)}>
              {expanded ? 'Show less' : `+ ${hiddenCount} more`}
            </Button>
          ) : null}
        </div>
      </div>
      <Button className="brand-row__toggle" type="button" onPress={() => setExpanded((value) => !value)} aria-label={`Toggle ${group.title}`}>
        <ChevronDown size={16} aria-hidden />
      </Button>
    </article>
  )
}

function LinearMetric({ item }) {
  return (
    <div className="linear-metric">
      <div>
        <strong>{item.name}</strong>
        <span>{item.penetration}%</span>
        <IndexBadge value={item.selectivity} />
      </div>
      <span className="linear-track"><i className={`is-${signalType(item.selectivity)}`} style={{ width: barWidth(item.penetration) }} /></span>
    </div>
  )
}

function PlatformRing({ label, value, selectivity, detail }) {
  return (
    <div className={`platform-ring is-${signalType(selectivity)}`}>
      <div>
        <strong>{value}%</strong>
        <span>{formatSelectivity(selectivity)}</span>
      </div>
      <h4>{label}</h4>
      <p>{detail}</p>
    </div>
  )
}

function BehaviorView() {
  return (
    <div className="behavior-grid">
      <article className="report-card platform-card">
        <div className="section-copy">
          <p>Platforms</p>
          <h3>Where do they live?</h3>
          <span>Instagram-native · actively Facebook-averse.</span>
        </div>
        <div className="platform-rings">
          <PlatformRing label="Instagram" value={99} selectivity={1.64} detail="Home base" />
          <PlatformRing label="Facebook" value={4} selectivity={0.05} detail="Actively avoided" />
        </div>
      </article>
      {behaviorPanels.slice(0, 2).map((panel) => (
        <article className="report-card" key={panel.title}>
          <div className="section-copy">
            <p>{panel.title}</p>
            <h3>{panel.question}</h3>
            <span>{panel.hint}</span>
          </div>
          <div className="linear-list">
            {panel.items.map((item) => <LinearMetric item={item} key={item.name} />)}
          </div>
        </article>
      ))}
      <article className="report-card life-moments">
        <div className="section-copy">
          <p>{behaviorPanels[2].title}</p>
          <h3>{behaviorPanels[2].question}</h3>
          <span>{behaviorPanels[2].hint}</span>
        </div>
        <div className="life-moment-grid">
          {behaviorPanels[2].items.map((item) => <LinearMetric item={item} key={item.name} />)}
        </div>
      </article>
    </div>
  )
}

function PsychographicsView() {
  return (
    <div className="psycho-stack">
      {psychographicGroups.map((group) => (
        <section className="psycho-group" key={group.title}>
          <div className="psycho-group__header">
            <h3>{group.title}</h3>
            <span>{group.detail}</span>
          </div>
          <div className="psycho-grid">
            {group.items.map((item) => (
              <article className="psycho-item" key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
                </div>
                <div>
                  <span>{item.penetration}%</span>
                  <IndexBadge value={item.selectivity} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function DrillDrawer({ topicKey, onClose }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const topic = drillTopics[topicKey]
  const items = useMemo(() => {
    if (!topic?.items) return []
    const normalized = query.trim().toLowerCase()
    return topic.items.filter((item) => {
      if (normalized && !item.name.toLowerCase().includes(normalized)) return false
      if (filter === 'over' && item.selectivity < 1.2) return false
      if (filter === 'under' && item.selectivity >= 0.8) return false
      return true
    })
  }, [filter, query, topic])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!topicKey) return null

  return (
    <>
      <Button className="drawer-backdrop" type="button" aria-label="Close drawer" onPress={onClose} />
      <aside className="insight-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="insight-drawer__header">
          <p>{topic?.breadcrumb || `Topics & passions > ${topicKey}`}</p>
          <div>
            <h2 id="drawer-title">{topic?.title || topicKey}</h2>
            <Button type="button" aria-label="Close" onPress={onClose}>
              <X size={18} aria-hidden />
            </Button>
          </div>
          <span>{topic?.summary || 'Drill-down data for this topic would be populated from the SoPrism interests API.'}</span>
          <div className="drawer-metrics">
            <strong>{topic?.penetration || '-'}<span>Topic penetration</span></strong>
            <strong>{topic?.selectivity || '-'}<span>Topic selectivity</span></strong>
            <strong>{topic?.items?.length ?? '-'}<span>Interests inside</span></strong>
          </div>
        </header>
        <div className="drawer-controls">
          <label>
            <Search size={15} aria-hidden />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter interests..." />
          </label>
          <div>
            {['all', 'over', 'under'].map((item) => (
              <Button
                key={item}
                type="button"
                className={filter === item ? 'is-active' : ''}
                onPress={() => setFilter(item)}
              >
                {item === 'all' ? 'All' : item === 'over' ? 'Over' : 'Under'}
              </Button>
            ))}
          </div>
        </div>
        <div className="insight-drawer__body">
          {items.length ? (
            items.map((item) => (
              <div className="drawer-row" key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.penetration}%</span>
                <IndexBadge value={item.selectivity} />
              </div>
            ))
          ) : (
            <div className="drawer-empty">
              <strong>No interest data loaded for this topic in the prototype.</strong>
              <span>Try Rock & Roll music or Motorcycles & MotoGP for fully populated examples.</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('topics')
  const [drawerTopic, setDrawerTopic] = useState(null)
  const tabItems = tabConfig.map((tab) => ({
    id: tab.id,
    label: `${tab.label} ${tab.count}`,
    content: <ReportTabContent tabId={tab.id} onOpen={setDrawerTopic} />,
  }))

  return (
    <div className="digital-test-shell">
      <TitanNavbar theme="linkedin" logoAlt="Digital Intelligence for LinkedIn" logoBasePath="/assets/logos" userInitial="D" />

      <main className="digital-test-page">
        <header className="report-topbar">
          <div>
            <h1>Punk rock fans · Jordan</h1>
            <p>Facebook / Instagram · ages 18-65 · benchmarked against the general Jordanian population · last refreshed 12 minutes ago</p>
          </div>
          <Button type="button" aria-label="More report actions">
            <MoreVertical size={18} aria-hidden />
          </Button>
        </header>

        <section className="audience-hero" aria-label="Audience portrait">
          <div className="audience-hero__copy">
            <p>Audience portrait</p>
            <h2>Young, mobile, iOS-native cultural outsiders</h2>
            <span>
              A 599K-strong, Instagram-native audience that has quietly defected from Facebook and Android.
              They gravitate toward eclectic music, motorsport, anime, premium home design, and investing -
              and reject the mainstream Jordanian defaults of family content, traditional luxury, and mass retail.
            </span>
            <div className="portrait-tags">
              <TagCloud title="↑ They are" type="over" tags={audienceTags} />
              <TagCloud title="↓ They are not" type="under" tags={rejectionTags} />
            </div>
          </div>
          <aside className="audience-hero__metrics">
            <div className="metric-grid">
              <MiniMetric label="Target audience" value="599,800" detail="Punk rock fans" />
              <MiniMetric label="Benchmark" value="6.8M" detail="Jordan, 18-65" />
              <MiniMetric label="Share of benchmark" value="8.8%" detail="Of all Jordanians 18-65" />
              <MiniMetric label="Top selectivity" value="2.26×" detail="Premium home brands" />
            </div>
            <div className="signal-strip">
              <p>Strongest signals · top 4</p>
              <div>
                {topics.slice(1, 5).map((item) => (
                  <span className="report-chip" key={item.key}>{item.name.replace(' & Roll music', '')} <IndexBadge value={item.selectivity} /></span>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <div className="report-tabs">
          <TitanTabs
            ariaLabel="Report sections"
            items={tabItems}
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            overflow
          />
        </div>
      </main>

      <DrillDrawer topicKey={drawerTopic} onClose={() => setDrawerTopic(null)} />
    </div>
  )
}
