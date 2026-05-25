import {
  ArrowRight,
  Plus,
  Settings,
  Star,
  Trash2,
} from 'lucide-react'
import {
  TitanButton,
  TitanDestructiveIconButton,
  TitanErrorButton,
  TitanIconButton,
} from 'titan-compositions'

function ButtonsBattery({ sectionClassName }) {
  return (
    <div className={`battery ${sectionClassName}`}>
      <div className="battery-line">
        <span className="line-label" />
        <div className="battery-row">
          <TitanButton variant="primary">Primary</TitanButton>
          <TitanButton variant="secondary">Secondary</TitanButton>
          <TitanButton variant="tertiary">Tertiary</TitanButton>
          <TitanButton variant="link" icon={<ArrowRight size={16} aria-hidden />}>Link button</TitanButton>
          <TitanButton variant="delete" icon={<Trash2 size={16} aria-hidden />}>Delete</TitanButton>
          <TitanButton variant="delete-secondary" icon={<Trash2 size={16} aria-hidden />}>Delete secondary</TitanButton>
          <TitanIconButton variant="secondary" aria-label="Add">
            <Plus size={16} aria-hidden />
          </TitanIconButton>
          <TitanIconButton variant="ghost" aria-label="Favorite">
            <Star size={16} aria-hidden />
          </TitanIconButton>
          <TitanIconButton variant="base" aria-label="Settings">
            <Settings size={16} aria-hidden />
          </TitanIconButton>
          <TitanIconButton variant="delete" aria-label="Delete icon">
            <Trash2 size={16} aria-hidden />
          </TitanIconButton>
        </div>
      </div>

      <div className="battery-line">
        <span className="line-label">Disabled:</span>
        <div className="battery-row">
          <TitanButton variant="primary" isDisabled>Primary</TitanButton>
          <TitanButton variant="secondary" isDisabled>Secondary</TitanButton>
          <TitanButton variant="tertiary" isDisabled>Tertiary</TitanButton>
          <TitanIconButton variant="secondary" aria-label="Add disabled" isDisabled>
            <Plus size={16} aria-hidden />
          </TitanIconButton>
        </div>
      </div>

      <div className="battery-line">
        <span className="line-label">Error / Destructive:</span>
        <div className="battery-row">
          <TitanErrorButton variant="primary">Error Primary</TitanErrorButton>
          <TitanErrorButton variant="secondary">Error Secondary</TitanErrorButton>
          <TitanErrorButton variant="text">Error Text</TitanErrorButton>
          <TitanDestructiveIconButton variant="primary" aria-label="Destructive primary">
            <Trash2 size={16} aria-hidden />
          </TitanDestructiveIconButton>
          <TitanDestructiveIconButton variant="secondary" aria-label="Destructive secondary">
            <Trash2 size={16} aria-hidden />
          </TitanDestructiveIconButton>
          <TitanDestructiveIconButton variant="base" aria-label="Destructive base">
            <Trash2 size={16} aria-hidden />
          </TitanDestructiveIconButton>
        </div>
      </div>

      <div className="battery-line">
        <span className="line-label">With trailing icon:</span>
        <div className="battery-row">
          <TitanButton variant="primary" iconEnd={<ArrowRight size={16} aria-hidden />}>
            Continue
          </TitanButton>
          <TitanButton variant="secondary" iconEnd={<ArrowRight size={16} aria-hidden />}>
            Next step
          </TitanButton>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <main className="ui-test-page">
      <header className="ui-test-header">
        <h1>UI Test - Titan Buttons</h1>
        <p>Audiense theme comparison for button behavior and hierarchy.</p>
      </header>

      <section className="ui-section">
        <div className="ui-section-title">
          <h2>A. Default "Brand" theme</h2>
        </div>
        <ButtonsBattery sectionClassName="" />
      </section>

      <section className="ui-section ui-section--secondary-white">
        <div className="ui-section-title">
          <h2>B. Outlined version</h2>
        </div>
        <ButtonsBattery sectionClassName="secondary-white" />
      </section>

      <section className="ui-section ui-section--secondary-steel">
        <div className="ui-section-title">
          <h2>C. Steel version</h2>
        </div>
        <ButtonsBattery sectionClassName="secondary-steel" />
      </section>
    </main>
  )
}
