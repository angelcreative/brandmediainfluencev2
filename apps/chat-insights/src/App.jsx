import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Pencil,
  UserRound,
} from 'lucide-react'
import { Button as RACButton } from 'react-aria-components'
import { TitanButton, TitanCard, TitanCardGrid, TitanInputField } from 'titan-compositions'

const SUGGESTIONS = [
  'Young professionals interested in technology',
  'Young male France interested in luxury cars',
  'Fitness enthusiasts in urban areas',
]

const STEPS = [
  { id: 1, label: 'Choose one audience type' },
  { id: 2, label: 'Define your audience' },
  { id: 3, label: 'Choose segmentation type' },
]

export default function App() {
  const [mode, setMode] = useState('natural')
  const [prompt, setPrompt] = useState('')

  return (
    <div className="chat-insights">
      <div className="chat-insights__chrome-inner">
        <header className="chat-insights__header">
          <h1 className="chat-insights__report-title">
            Untitled report
            <RACButton
              className="icon-ghost chat-insights__icon-btn"
              type="button"
              aria-label="Edit report name"
            >
              <Pencil size={16} strokeWidth={2} />
            </RACButton>
          </h1>
          <ol className="chat-insights__stepper" aria-label="Report steps">
            {STEPS.map((s, i) => {
              const liClass =
                s.id === 3
                  ? 'chat-insights__step chat-insights__step--future'
                  : s.id === 2
                    ? 'chat-insights__step chat-insights__step--active chat-insights__step--current'
                    : 'chat-insights__step chat-insights__step--done'
              return (
                <li key={s.id} className={liClass}>
                  {i > 0 && (
                    <span className="chat-insights__step-chevron" aria-hidden>
                      <ChevronRight size={14} strokeWidth={2} />
                    </span>
                  )}
                  <span className="chat-insights__step-num" aria-hidden>
                    {s.id}
                  </span>
                  <span className="chat-insights__step-label">{s.label}</span>
                </li>
              )
            })}
          </ol>
        </header>

        <div className="chat-insights__action-bar" role="presentation">
          <TitanButton
            variant="secondary"
            onPress={() => {}}
            className="chat-insights__btn-back chat-insights__btn-back-tinted"
            aria-label="Back"
          >
            <span className="chat-insights__btn-inn">
              <ArrowLeft size={16} strokeWidth={2} aria-hidden />
              Back
            </span>
          </TitanButton>
          <h2 className="chat-insights__action-bar-title">Define your audience</h2>
          <TitanButton
            variant="secondary"
            isDisabled
            onPress={() => {}}
            className="chat-insights__btn-next"
            aria-label="Next"
          >
            <span className="chat-insights__btn-inn">
              Next
              <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </span>
          </TitanButton>
        </div>

        <main className="chat-insights__main">
          <TitanCardGrid>
            <TitanCard span={8} className="chat-insights__card-left">
              <div className="chat-insights__card-top">
                <h3 className="chat-insights__card-heading">People who talk about</h3>
                <div
                  className="chat-insights__segment"
                  role="group"
                  aria-label="Query mode"
                >
                  <RACButton
                    type="button"
                    className={mode === 'natural' ? 'is-selected' : ''}
                    onPress={() => setMode('natural')}
                  >
                    Natural
                  </RACButton>
                  <RACButton
                    type="button"
                    className={mode === 'boolean' ? 'is-selected' : ''}
                    onPress={() => setMode('boolean')}
                  >
                    Boolean
                  </RACButton>
                </div>
              </div>
              <p className="chat-insights__card-hint">
                Describe your audience in plain language. Audiense will translate your prompt into a query.
              </p>
              <div className="chat-insights__suggestions">
                {SUGGESTIONS.map((t) => (
                  <RACButton key={t} type="button" className="chat-insights__suggestion">
                    <span>{t}</span>
                    <span className="chev" aria-hidden>
                      <ChevronRight size={16} strokeWidth={2} />
                    </span>
                  </RACButton>
                ))}
              </div>
              <div className="chat-insights__prompt">
                <div className="chat-insights__prompt-field">
                  <TitanInputField
                    className="field-root chat-insights__prompt-titan"
                    label=""
                    placeholder="Start describing your TikTok audience…"
                    value={prompt}
                    onChange={setPrompt}
                    aria-label="Audience description"
                  />
                </div>
                <RACButton
                  type="button"
                  className="chat-insights__send"
                  isDisabled={!prompt.trim()}
                  aria-label="Send"
                >
                  <ArrowRight size={18} strokeWidth={2} />
                </RACButton>
              </div>
            </TitanCard>

            <TitanCard span={8} className="chat-insights__card-right">
              <div className="chat-insights__card-top">
                <h3 className="chat-insights__card-heading">Audience summary</h3>
                <div className="chat-insights__summary-state">
                  <span className="chat-insights__summary-dot" aria-hidden />
                  <span>not defined</span>
                </div>
              </div>
              <div className="chat-insights__summary-body">To be defined</div>
              <div className="chat-insights__date-grid">
                <div className="chat-insights__date-field">
                  <span className="chat-insights__date-label">From</span>
                  <TitanInputField
                    label=""
                    placeholder="Select a start date"
                    aria-label="From date"
                    className="field-root chat-insights__date-input"
                    onChange={() => {}}
                  />
                </div>
                <div className="chat-insights__date-field">
                  <span className="chat-insights__date-label">To</span>
                  <TitanInputField
                    label=""
                    placeholder="Select a end date"
                    aria-label="To date"
                    className="field-root chat-insights__date-input"
                    onChange={() => {}}
                  />
                </div>
              </div>
            </TitanCard>
          </TitanCardGrid>
        </main>
      </div>

      <footer className="chat-insights__helper">
        <div className="chat-insights__chrome-inner chat-insights__helper-row">
          <div className="chat-insights__helper-icon" aria-hidden>
            <UserRound size={18} strokeWidth={1.8} />
          </div>
          <p className="chat-insights__helper-text">
            Not sure where to start?{' '}
            <a href="https://www.audiense.com" target="_blank" rel="noreferrer">
              Visit the guide
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
