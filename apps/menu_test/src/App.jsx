import { Handshake, LogOut, Moon, SunMedium } from 'lucide-react'
import { TitanMenuDropdown, TitanNavbar } from 'titan-compositions'

const MENU_ITEMS = [
  { id: 'hola', label: 'Hola', icon: <Handshake size={18} strokeWidth={2} aria-hidden /> },
  { id: 'adios', label: 'Adiós', icon: <LogOut size={18} strokeWidth={2} aria-hidden />, destructive: true },
  { id: 'tardes', label: 'Buenas tardes', icon: <SunMedium size={18} strokeWidth={2} aria-hidden /> },
  { id: 'noches', label: 'Buenas noches', icon: <Moon size={18} strokeWidth={2} aria-hidden /> },
]

function App() {
  return (
    <div
      style={{
        fontFamily: 'var(--font-audiense), sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <TitanNavbar theme="audiense" userInitial="A" />
      <main className="page" style={{ flex: 1, minHeight: 0, width: '100%', boxSizing: 'border-box' }}>
        <section className="card" aria-label="Menú de prueba">
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Menú</h1>
          <p style={{ marginTop: 'var(--spacing-s)', color: 'var(--text-secondary)' }}>
            Cuatro opciones con iconos Lucide.
          </p>
          <div style={{ marginTop: 'var(--spacing-m)' }}>
            <TitanMenuDropdown
              triggerLabel="Abrir menú"
              placement="bottom start"
              items={MENU_ITEMS}
              onAction={(id) => {
                console.info('menu', id)
              }}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
