import { NavLink } from 'react-router-dom'
import { navigationItems } from '../navigation'

export default function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar" aria-label="Mobile Navigation">
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `bottom-tab-link ${isActive ? 'is-active' : ''}`}
        >
          <span className="bottom-tab-short mono-value">{item.short}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
