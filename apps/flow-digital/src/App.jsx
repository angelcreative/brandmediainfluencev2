import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUp, ChevronDown, CircleHelp, Download, History, Pencil, X } from 'lucide-react'
import {
  TitanAvatar,
  TitanButton,
  TitanCard,
  TitanCardGrid,
  TitanIconButton,
  TitanInputField,
  TitanLoader,
  TitanNavBar,
  TitanTabs,
} from 'titan-compositions'
import './App.css'

function GradientSparklesIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkGradient" x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F58A1F" />
          <stop offset="1" stopColor="#FF4F8B" />
        </linearGradient>
      </defs>
      <path
        d="M11.7 2.8L13.8 8.2L19.2 10.3L13.8 12.4L11.7 17.8L9.6 12.4L4.2 10.3L9.6 8.2L11.7 2.8Z"
        stroke="url(#sparkGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.1 4.5L18.9 6.4L20.8 7.2L18.9 8L18.1 9.9L17.3 8L15.4 7.2L17.3 6.4L18.1 4.5Z"
        stroke="url(#sparkGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function App() {
  const [activeView, setActiveView] = useState('socio-demo')
  const [activeSoprismTab, setActiveSoprismTab] = useState('socio-demo')
  const [showTransitionRibbon, setShowTransitionRibbon] = useState(true)
  const [isRibbonClosing, setIsRibbonClosing] = useState(false)
  const [pendingTransition, setPendingTransition] = useState(null)
  const audienseTabsRef = useRef(null)
  const ageBars = [4, 58, 72, 67, 54, 33, 22]
  const childrenBars = [2, 3, 9, 13, 20]
  const soprismTabs = useMemo(
    () => [
      { id: 'socio-demo', label: 'Socio-Demo' },
      { id: 'topics', label: 'Topics' },
      { id: 'interests', label: 'Interest' },
      { id: 'maps', label: 'Maps' },
      { id: 'persona-overview', label: 'Persona Overview' },
      { id: 'segmentation', label: 'Segmentation' },
    ],
    []
  )
  const audienseTabs = useMemo(
    () => [
      { id: 'lifestyle-profile', label: 'Lifestyle Profile' },
      { id: 'ai-chat', label: 'AI Chat' },
    ],
    []
  )
  const soprismTitanTabs = useMemo(
    () => soprismTabs.map((tab) => ({ ...tab, content: <div /> })),
    [soprismTabs]
  )
  const audienseTitanTabs = useMemo(
    () => audienseTabs.map((tab) => ({ ...tab, content: <div /> })),
    [audienseTabs]
  )

  const isAudienseTransitionView = activeView === 'ai-chat' || activeView === 'lifestyle-profile'
  const isAudienseDestination = (destination) => destination === 'ai-chat' || destination === 'lifestyle-profile'
  const isSoprismDestination = (destination) => !isAudienseDestination(destination)

  const openCrossAppTransition = (destination) => {
    if (isSoprismDestination(destination)) {
      setActiveSoprismTab(destination)
    }

    if (isAudienseTransitionView && isSoprismDestination(destination)) {
      setPendingTransition({
        destination,
        mode: 'to-soprism',
      })
      return
    }

    if (!isAudienseTransitionView && isAudienseDestination(destination)) {
      setPendingTransition({
        destination,
        mode: 'to-audiense',
      })
      return
    }

    setActiveView(destination)
  }

  const confirmTransition = () => {
    if (!pendingTransition?.destination) return
    setActiveView(pendingTransition.destination)
    setPendingTransition(null)
  }

  const closeTransitionRibbon = () => {
    setIsRibbonClosing(true)
    window.setTimeout(() => {
      setShowTransitionRibbon(false)
      setIsRibbonClosing(false)
    }, 220)
  }

  useEffect(() => {
    if (!pendingTransition) return undefined

    const timeoutId = window.setTimeout(() => {
      confirmTransition()
    }, 2500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [pendingTransition])

  useEffect(() => {
    if (!audienseTabsRef.current) return
    const tabButtons = audienseTabsRef.current.querySelectorAll('.tab-trigger')
    tabButtons.forEach((button, index) => {
      const isCrossAppTab = index < soprismTabs.length
      if (isCrossAppTab) {
        button.setAttribute('title', 'Open in Soprism')
        button.setAttribute('data-cross-app-tooltip', 'Open in Soprism')
      } else {
        button.removeAttribute('title')
        button.removeAttribute('data-cross-app-tooltip')
      }
    })
  }, [activeView, activeSoprismTab, soprismTabs])

  const renderTransitionInterstitial = () => {
    if (!pendingTransition) return null

    if (pendingTransition.mode === 'to-soprism') {
      return (
        <section className="transition-interstitial-backdrop" role="dialog" aria-modal="true" aria-label="Loading Soprism">
          <div className="transition-interstitial">
            <p className="transition-interstitial-status">Taking you back to Soprism...</p>
            <p>
              We&apos;re bringing Soprism into the Audiense App for a smoother experience.
              Your projects and data are safe.
            </p>
            <div className="transition-interstitial-loader-wrap" aria-live="polite">
              <TitanLoader size={56} label="Loading Soprism by Audiense" />
            </div>
          </div>
        </section>
      )
    }

    return (
      <section className="transition-interstitial-backdrop" role="dialog" aria-modal="true" aria-labelledby="transition-title">
        <div className="transition-interstitial">
          <p id="transition-title" className="transition-interstitial-status">Loading Audiense App...</p>
          <p>
            Some features of Soprism and Digital Intelligence are now in Audiense App.
          </p>
          <div className="transition-interstitial-loader-wrap" aria-live="polite">
            <TitanLoader size={56} label="Loading Audiense" />
          </div>
        </div>
      </section>
    )
  }

  if (isAudienseTransitionView) {
    return (
      <main className="ai-page">
        {showTransitionRibbon && (
          <section
            className={`transition-ribbon ${isRibbonClosing ? 'transition-ribbon-closing' : ''}`}
            role="status"
            aria-live="polite"
          >
            <div className="transition-ribbon-inner">
              <div className="transition-ribbon-content">
                <img
                  className="transition-ribbon-logo"
                  src="/images/ribbon-transition.png"
                  alt="Soprism and Digital Intelligence now in Audiense"
                />
                <p>Some features of Soprism and Digital Intelligence are now in Audiense App.</p>
              </div>
              <div className="transition-ribbon-actions">
                <TitanIconButton
                  variant="base"
                  aria-label="Close transition ribbon"
                  onPress={closeTransitionRibbon}
                >
                  <X size={14} />
                </TitanIconButton>
              </div>
            </div>
          </section>
        )}

        <TitanNavBar>
          <div className="custom-navbar">
            <div className="custom-navbar-left">
              <img
                className="custom-navbar-logo"
                src="https://cdn.jsdelivr.net/gh/angelcreative/titan-foundations@main/public/assets/logos/logo-audiense.svg"
                alt="Audiense"
              />
            </div>
            <div className="custom-navbar-right">
              <TitanIconButton variant="ghost" aria-label="Help">
                <CircleHelp size={18} />
              </TitanIconButton>
              <TitanIconButton variant="ghost" aria-label="Featured action">
                <GradientSparklesIcon size={18} />
              </TitanIconButton>
              <TitanAvatar account="D" aria-label="User account" />
              <TitanIconButton variant="ghost" aria-label="User menu">
                <ChevronDown size={18} />
              </TitanIconButton>
            </div>
          </div>
        </TitanNavBar>

        <section className="ai-content">
          <div className="ai-title-row">
            <TitanIconButton
              className="ai-back-btn"
              variant="secondary"
              aria-label="Back to reports"
              onPress={() => setActiveView('socio-demo')}
            >
              <ArrowLeft size={14} />
            </TitanIconButton>
            <div className="ai-title">
              <h2>Design</h2>
            </div>
          </div>

          <div className="ai-audience-row">
            <TitanButton variant="secondary">
              Audience
            </TitanButton>
            <span className="aud-count">23M people</span>
            <span className="aud-dot">•</span>
            <TitanButton variant="secondary">Baseline</TitanButton>
            <span className="aud-count">32.6M people</span>
            <div className="ai-download">
              <TitanIconButton variant="secondary" aria-label="Download">
                <Download size={14} />
              </TitanIconButton>
            </div>
          </div>

          <section className="tabs-single tabs-single-audiense" aria-label="Report tabs" ref={audienseTabsRef}>
            <TitanTabs
              ariaLabel="Report tabs"
              items={[...soprismTitanTabs, ...audienseTitanTabs]}
              selectedKey={activeView}
              overflow
              onSelectionChange={(key) => openCrossAppTransition(String(key))}
            />
          </section>

          {activeView === 'ai-chat' ? (
            <>
              <div className="assistant-head">
                <div className="assistant-title">
                  <GradientSparklesIcon size={14} />
                  <span>AI Assistant</span>
                </div>
                <p>Ask anything or try one of the suggested prompts to explore what can be achieved.</p>
                <div className="assistant-actions">
                  <TitanButton variant="tertiary" icon={<History size={14} />}>
                    Chat history
                  </TitanButton>
                  <TitanButton variant="secondary" icon={<Pencil size={14} />}>New Chat</TitanButton>
                </div>
              </div>

              <section className="prompt-zone">
                <h3>Where should we begin?</h3>
                <div className="prompt-grid-wrap">
                  <TitanCardGrid>
                    <TitanCard span={8} className="prompt-card">
                    <h4>Who is this audience?</h4>
                    <p>Get a complete portrait with demographics, interests, and what makes them unique.</p>
                    </TitanCard>
                    <TitanCard span={8} className="prompt-card">
                    <h4>Audience segments</h4>
                    <p>Identify distinct personas within this audience.</p>
                    </TitanCard>
                    <TitanCard span={8} className="prompt-card">
                    <h4>Speak as the audience</h4>
                    <p>Hear this audience describe themselves in their own voice.</p>
                    </TitanCard>
                    <TitanCard span={8} className="prompt-card">
                    <h4>Campaign brief</h4>
                    <p>Generate an actionable brief grounded in real data.</p>
                    </TitanCard>
                  </TitanCardGrid>
                </div>
              </section>

              <div className="ask-row">
                <div className="ask-input-wrap">
                  <TitanInputField
                    className="ask-input"
                    placeholder="Ask whatever you want about this report..."
                  />
                </div>
                <div className="ask-send-btn">
                  <TitanIconButton variant="primary" aria-label="Send message">
                    <ArrowUp size={14} />
                  </TitanIconButton>
                </div>
              </div>
            </>
          ) : (
            <section className="lifestyle-section" aria-label="Lifestyle profile summary">
              <div className="lifestyle-header">
                <h3>Lifestyle Summary</h3>
                <p>Understand your audience at a glance before deep diving into the details.</p>
              </div>

              <div className="lifestyle-grid">
                <TitanCard className="lifestyle-card">
                  <h4>Anti-K-Pop Enthusiasts</h4>
                  <p>
                    This audience is notably disengaged from K-pop culture, indicating a divergence from
                    mainstream youth entertainment trends.
                  </p>
                  <ul>
                    <li>
                      The significantly low audience penetration and affinity to the K-pop Culture Lover reveal this
                      audience has little interest.
                    </li>
                    <li>
                      This suggests content or marketing strategies heavily reliant on K-pop themes are unlikely to
                      resonate.
                    </li>
                  </ul>
                  <div className="lifestyle-metrics">
                    <span>Penetration: 1.3%</span>
                    <span>Affinity: x 0.66</span>
                  </div>
                </TitanCard>

                <TitanCard className="lifestyle-card">
                  <h4>Related Mindsets</h4>
                  <div className="mindset-row mindset-row-head">
                    <span>Mindset</span>
                    <span>Penetration</span>
                    <span>Affinity</span>
                  </div>
                  <div className="mindset-row">
                    <span>The K-pop Culture Lover</span>
                    <span>1.27%</span>
                    <span>x 0.66</span>
                  </div>
                </TitanCard>
              </div>
            </section>
          )}
        </section>

        {renderTransitionInterstitial()}
      </main>
    )
  }

  return (
    <main className="mockup-page">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-btn" type="button" aria-label="Open menu">
            ≡
          </button>
          <div className="logo-wrap">
            <span className="logo-dot" />
            <span className="logo-text">Soprism</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="meta-pill">Design (23,000,000)</span>
          <span className="meta-pill">Design - Benchmark (32,600,000)</span>
          <button className="avatar-btn" type="button" aria-label="User menu">
            D
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <button className="side-btn">⌂</button>
          <button className="side-btn side-btn-active">▥</button>
          <button className="side-btn">◉</button>
          <button className="side-btn">⊞</button>
        </aside>

        <section className="content">
          <div className="content-header">
            <p className="content-kicker">Design</p>
            <h1>{soprismTabs.find((tab) => tab.id === activeSoprismTab)?.label ?? 'Socio-Demo'}</h1>
          </div>

          <section className="tabs-single tabs-single-soprism" aria-label="Product sections">
            <nav className="tabs" aria-label="Soprism sections">
              {soprismTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab tab-soprism ${activeSoprismTab === tab.id ? 'tab-active' : ''}`}
                  onClick={() => setActiveSoprismTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              {audienseTabs.map((tab) => (
                <button
                  key={tab.id}
                  className="tab tab-soprism"
                  title="Open in Audiense App"
                  data-cross-app-tooltip="Open in Audiense App"
                  onClick={() => openCrossAppTransition(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </section>
          <button className="summary-btn">Generate Insights Summary</button>

          <section className="cards-grid">
            <article className="card">
              <div className="card-header">
                <h3>What is the gender of my audience?</h3>
                <button type="button">⋮</button>
              </div>
              <p className="subtext">Find out the most representative gender of your audience.</p>
              <div className="gender-row">
                <div className="donut-block">
                  <p>Men</p>
                  <div className="donut">
                    <span>48.7%</span>
                  </div>
                  <small>104.5</small>
                </div>
                <div className="donut-block">
                  <p>Women</p>
                  <div className="donut donut-alt">
                    <span>51.3%</span>
                  </div>
                  <small>96.1</small>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="card-header">
                <h3>How old is my audience?</h3>
                <button type="button">⋮</button>
              </div>
              <p className="subtext">Find out what your audience's age distribution.</p>
              <div className="bars-area">
                {ageBars.map((value, index) => (
                  <div className="bar-col" key={`age-${value}-${index}`}>
                    <div className="bar-stack">
                      <span style={{ height: `${value}%` }} className="bar bar-main" />
                      <span style={{ height: `${Math.max(6, value - 4)}%` }} className="bar bar-alt" />
                    </div>
                    <small>{['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'][index]}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <div className="card-header">
                <h3>Which language does my audience speak the most?</h3>
                <button type="button">⋮</button>
              </div>
              <p className="subtext">Find out the most spoken languages by your audience.</p>
              <div className="lang-row">
                <div className="donut-block">
                  <p>Spanish</p>
                  <div className="donut"><span>95.2%</span></div>
                  <small>102.4</small>
                </div>
                <div className="donut-block">
                  <p>English</p>
                  <div className="donut donut-light"><span>14.8%</span></div>
                  <small>114.7</small>
                </div>
                <div className="donut-block">
                  <p>Arabic</p>
                  <div className="donut donut-light"><span>1.8%</span></div>
                  <small>109.9</small>
                </div>
              </div>
            </article>

            <article className="card card-wide-left">
              <div className="card-header">
                <h3>Is my audience mainly parents?</h3>
                <button type="button">⋮</button>
              </div>
              <p className="subtext">Find out if your audience mainly consists of parents.</p>
              <div className="donut-block single">
                <p>Parents</p>
                <div className="donut"><span>18.3%</span></div>
                <small>132.3</small>
              </div>
            </article>

            <article className="card card-wide-right">
              <div className="card-header">
                <h3>How old are my audience's children?</h3>
                <button type="button">⋮</button>
              </div>
              <p className="subtext">
                18.3% of the people in your audience mentioned having children.
              </p>
              <div className="child-bars">
                {childrenBars.map((value, index) => (
                  <div className="bar-col" key={`child-${value}-${index}`}>
                    <div className="bar-stack single-bar">
                      <span style={{ height: `${value * 4}%` }} className="bar bar-main" />
                    </div>
                    <small>{['0-2', '3-5', '6-8', '9-12', '13-17'][index]} years</small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </section>
      </div>

      {renderTransitionInterstitial()}
    </main>
  )
}

export default App
