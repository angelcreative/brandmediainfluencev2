import { useState } from 'react'
import {
  TitanAppShell,
  TitanDivider,
  TitanNavBar,
  TitanNavbar,
  TitanSidebar,
  TitanSidebarItem,
  TitanSidebarSection,
  TitanTooltip,
} from 'titan-compositions'
import { Activity, BarChart3, Compass, Home, Layers, LineChart, Users } from 'lucide-react'

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const externalHint = 'Opens in a new browser tab'

  return (
    <TitanAppShell
      navbar={
        <TitanNavBar>
          <TitanNavbar theme="audiense" userInitial="A" />
        </TitanNavBar>
      }
      sidebar={
        <TitanSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          defaultActiveId="home"
        >
          <TitanSidebarSection>
            <TitanSidebarItem id="home" icon={<Home size={16} aria-hidden />}>
              Home
            </TitanSidebarItem>
          </TitanSidebarSection>

          <TitanDivider />

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
      }
    >
      <section className="sidebar-tests-content">
        <h1>Sidebar Tests</h1>
        <p>This app is a sandbox for navbar and sidebar layouts.</p>
      </section>
    </TitanAppShell>
  )
}
