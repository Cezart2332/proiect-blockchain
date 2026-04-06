import { Outlet } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import SideNavigation from './SideNavigation'
import TopNavbar from './TopNavbar'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <TopNavbar />

      <div className="workspace-shell">
        <SideNavigation />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <BottomTabBar />
    </div>
  )
}
