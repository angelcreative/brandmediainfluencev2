import { useState } from 'react'
import {
  TitanNavbar,
  TitanSidebar,
  TitanSidebarItem,
  TitanSidebarSection,
  TitanTooltip,
} from 'titan-compositions'
import { Activity, BarChart3, Compass, Layers, LineChart, Users } from 'lucide-react'

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const externalHint = 'Opens in a new browser tab'

  return (
    <div className={`sidebar-tests-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <header className="navbar-column">
        <TitanNavbar theme="audiense" userInitial="A" />
      </header>

      <div className="content-shell">
        <aside className="sidebar-column">
          <div className="sidebar-floating-card">
            <TitanSidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
              defaultActiveId="segment-audiences"
            >
              <TitanSidebarSection>
                <TitanSidebarItem id="segment-audiences" icon={<Users size={16} aria-hidden />}>
                  Segment Audiences
                </TitanSidebarItem>
                <TitanSidebarItem id="compare-popularity" icon={<BarChart3 size={16} aria-hidden />}>
                  Compare Popularity
                </TitanSidebarItem>
                <TitanSidebarItem id="discover-creators" icon={<Compass size={16} aria-hidden />}>
                  Discover Creators
                </TitanSidebarItem>
                <TitanSidebarItem id="measure-overlaps" icon={<Layers size={16} aria-hidden />}>
                  Measure Overlaps
                </TitanSidebarItem>
                <TitanTooltip content={externalHint} placement="right">
                  <TitanSidebarItem id="track-growth" icon={<LineChart size={16} aria-hidden />}>
                    Track Growth
                  </TitanSidebarItem>
                </TitanTooltip>
                <TitanTooltip content={externalHint} placement="right">
                  <TitanSidebarItem id="assess-engagement" icon={<Activity size={16} aria-hidden />}>
                    Assess Engagement
                  </TitanSidebarItem>
                </TitanTooltip>
              </TitanSidebarSection>
            </TitanSidebar>
          </div>
        </aside>

        <main className="main-column">
          <section className="sidebar-tests-content" />
        </main>
      </div>
    </div>
  )
}
