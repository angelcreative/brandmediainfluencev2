import { IconArrowRight, IconBrandX, IconChevronDown, IconSparkles } from '@tabler/icons-react'
import { useState } from 'react'

import actionWordmark from '../assets/apps-home/svgexport-4.svg?url'
import insightsWordmark from '../assets/apps-home/svgexport-6.svg?url'
import infoIconSrc from '../assets/apps-home/svgexport-7.svg?url'
import webIcon from '../assets/apps-home/svgexport-9.svg?url'
import metaIcon from '../assets/apps-home/svgexport-10.svg?url'
import sparkRowIcon from '../assets/apps-home/svgexport-12.svg?url'
import diliWordmark from '../assets/apps-home/svgexport-14.svg?url'
import linkedinIcon from '../assets/apps-home/svgexport-15.svg?url'
import demandWordmark from '../assets/apps-home/svgexport-17.svg?url'
import googleIcon from '../assets/apps-home/svgexport-18.svg?url'
import youtubeIcon from '../assets/apps-home/svgexport-19.svg?url'
import tiktokIcon from '../assets/apps-home/svgexport-20.svg?url'
import instagramIcon from '../assets/apps-home/svgexport-21.svg?url'
import demandEndIcon from '../assets/apps-home/svgexport-22.svg?url'
import connectWordmark from '../assets/apps-home/svgexport-24.svg?url'
import tweetBinderWordmark from '../assets/apps-home/svgexport-26.svg?url'

const APPS = [
  {
    id: 'action',
    title: 'Action',
    headerWordmark: actionWordmark,
    showInfo: false,
    innerBg: '#fff7ed',
    body: 'Generate audience insights and turn them into ready-to-use campaign ideas.',
    openColor: '#e11d48',
    connections: [],
    integration: null,
  },
  {
    id: 'insights',
    title: 'Insights',
    headerWordmark: insightsWordmark,
    showInfo: true,
    innerBg: '#f3f0ff',
    openColor: '#635bff',
    connections: ['MCP', 'Meltwater', 'Pulsar', 'Talkwalker', 'GWI', 'Kantar'],
    integration: (
      <div className="apps-home__integration-row apps-home__integration-row--combo">
        <IconBrandX className="apps-home__integration-icon" size={20} stroke={1.5} aria-hidden />
        <div className="apps-home__pill apps-home__combo-pill">
          <span className="apps-home__combo-pill-label">
            <span className="apps-home__combo-line">combined</span>
            <span className="apps-home__combo-line">with</span>
          </span>
          <span className="apps-home__combo-pill-icons">
            <img src={webIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
            <img src={metaIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
            <img src={sparkRowIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'dili',
    title: 'Digital Intelligence for LinkedIn',
    headerWordmark: diliWordmark,
    wordmarkClass: 'apps-home__card-wordmark--dili',
    showInfo: true,
    innerBg: '#eff6ff',
    openColor: '#2563eb',
    connections: ['MCP', 'LinkedIn Saved Audiences'],
    integration: (
      <div className="apps-home__integration-row">
        <img src={linkedinIcon} alt="" className="apps-home__integration-img" width={22} height={22} />
      </div>
    ),
  },
  {
    id: 'demand',
    title: 'Demand',
    headerWordmark: demandWordmark,
    showInfo: true,
    innerBg: '#f0fdf4',
    openColor: '#15803d',
    connections: ['MCP'],
    integration: (
      <div className="apps-home__integration-row apps-home__integration-row--wrap">
        <img src={googleIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
        <img src={youtubeIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
        <img src={tiktokIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
        <img src={instagramIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
        <IconBrandX className="apps-home__integration-icon" size={20} stroke={1.5} aria-hidden />
        <img src={webIcon} alt="" className="apps-home__integration-img" width={20} height={20} />
        <img src={demandEndIcon} alt="" className="apps-home__integration-img" width={22} height={20} />
      </div>
    ),
  },
  {
    id: 'connect',
    title: 'Connect',
    headerWordmark: connectWordmark,
    showInfo: true,
    innerBg: '#f0f9ff',
    openColor: '#0369a1',
    connections: ['X Ads'],
    integration: (
      <div className="apps-home__integration-row">
        <IconBrandX className="apps-home__integration-icon" size={20} stroke={1.5} aria-hidden />
      </div>
    ),
  },
  {
    id: 'tweet-binder',
    title: 'Tweet Binder',
    headerWordmark: tweetBinderWordmark,
    showInfo: true,
    innerBg: '#f0f9ff',
    openColor: '#0369a1',
    connections: ['MCP'],
    integration: (
      <div className="apps-home__integration-row">
        <IconBrandX className="apps-home__integration-icon" size={20} stroke={1.5} aria-hidden />
      </div>
    ),
  },
]

function AppCard({ app }) {
  return (
    <article className="apps-home__card-shell" aria-label={app.title}>
      <div className="apps-home__card-inner" style={{ background: app.innerBg }}>
        <header className="apps-home__card-head">
          <img
            src={app.headerWordmark}
            alt=""
            className={['apps-home__card-wordmark', app.wordmarkClass].filter(Boolean).join(' ')}
            loading="lazy"
            decoding="async"
          />
          {app.showInfo ? (
            <button type="button" className="apps-home__info-btn" aria-label={`About ${app.title}`}>
              <img src={infoIconSrc} alt="" className="apps-home__info-icon" width={18} height={18} />
            </button>
          ) : (
            <span className="apps-home__info-placeholder" aria-hidden />
          )}
        </header>

        <div className="apps-home__card-body">
          {app.body ? <p className="apps-home__card-text">{app.body}</p> : null}
          {app.integration}
          {app.connections.length > 0 ? (
            <div className="apps-home__connections">
              <span className="apps-home__connections-label">Connections:</span>
              <div className="apps-home__pills">
                {app.connections.map((c) => (
                  <span key={c} className="apps-home__pill">
                    {c === 'MCP' ? (
                      <IconSparkles size={12} stroke={2} className="apps-home__pill-icon" aria-hidden />
                    ) : null}
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <footer className="apps-home__card-footer">
          <button type="button" className="apps-home__open-link" style={{ color: app.openColor }}>
            <span>Open</span>
            <IconArrowRight size={18} stroke={2} aria-hidden />
          </button>
        </footer>
      </div>
    </article>
  )
}

export default function AppsHomePage() {
  const [otherOpen, setOtherOpen] = useState(false)

  return (
    <div className="apps-home">
      <h1 className="apps-home__page-title">Know your audience</h1>

      <section className="apps-home__section" aria-labelledby="apps-home-my-apps">
        <h2 id="apps-home-my-apps" className="apps-home__section-title">
          My apps
        </h2>
        <div className="apps-home__grid">
          {APPS.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      <section className="apps-home__section apps-home__section--other" aria-labelledby="apps-home-other">
        <button
          type="button"
          id="apps-home-other"
          className="apps-home__other-toggle"
          onClick={() => setOtherOpen((v) => !v)}
          aria-expanded={otherOpen}
        >
          Other available apps
          <span className="apps-home__other-chevron-wrap" aria-hidden>
            <IconChevronDown
              size={18}
              stroke={1.5}
              className={`apps-home__other-chevron ${otherOpen ? 'is-open' : ''}`}
            />
          </span>
        </button>
        {otherOpen ? (
          <p className="apps-home__other-placeholder" role="status">
            More applications will appear here in the full product.
          </p>
        ) : null}
      </section>
    </div>
  )
}
